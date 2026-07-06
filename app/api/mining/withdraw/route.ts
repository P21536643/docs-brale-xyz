import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { miningWithdrawals, transactions } from '@/lib/db/schema'
import { mpesaClient } from '@/lib/mpesa/client'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { withdrawalId, phoneNumber, amountKES } = await request.json()

    if (!withdrawalId || !phoneNumber || !amountKES) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the withdrawal record
    const withdrawal = await db
      .select()
      .from(miningWithdrawals)
      .where(eq(miningWithdrawals.id, parseInt(withdrawalId)))
      .limit(1)

    if (!withdrawal || withdrawal.length === 0) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    if (withdrawal[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Create a transaction for this M-Pesa payment
    const requestId = `MINING-${withdrawalId}-${crypto.randomBytes(8).toString('hex')}`

    const transactionResult = await db
      .insert(transactions)
      .values({
        userId: session.user.id,
        requestId,
        phoneNumber,
        amount: amountKES.toString(),
        description: `Mining Reward Withdrawal: ${withdrawal[0].amountIsiolocoin} ISIO`,
        status: 'pending',
        initiatedAt: new Date(),
      })
      .returning()

    // Initiate STK Push with M-Pesa
    const stkResponse = await mpesaClient.initiateStkPush(
      phoneNumber,
      parseInt(amountKES),
      `Mining Withdrawal ${withdrawalId}`,
      requestId,
      'Mining'
    )

    if (stkResponse.ResponseCode !== '0') {
      // Update transaction as failed
      await db
        .update(transactions)
        .set({
          status: 'failed',
          errorCode: stkResponse.ResponseCode,
          errorMessage: stkResponse.ResponseDescription,
        })
        .where(eq(transactions.requestId, requestId))

      return NextResponse.json(
        {
          error: 'Failed to initiate M-Pesa payment',
          details: stkResponse.ResponseDescription,
        },
        { status: 400 }
      )
    }

    // Update withdrawal with M-Pesa transaction ID
    await db
      .update(miningWithdrawals)
      .set({
        mpesaTransactionId: requestId,
      })
      .where(eq(miningWithdrawals.id, withdrawalId))

    return NextResponse.json({
      success: true,
      requestId,
      message: 'M-Pesa STK Push initiated. Please complete the payment on your phone.',
    })
  } catch (error) {
    console.error('[v0] Mining withdrawal payment error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process payment',
      },
      { status: 500 }
    )
  }
}
