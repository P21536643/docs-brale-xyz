'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, paymentCallbacks } from '@/lib/db/schema'
import { mpesaClient } from '@/lib/mpesa/client'
import { validatePhoneNumber, validateAmount, ValidationErrors } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { AuthenticationError, ValidationError, logError } from '@/lib/errors'
import { eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new AuthenticationError('Session not found')
  return session.user.id
}

export async function initiatePayment(
  phoneNumber: string,
  amount: number,
  description: string,
) {
  try {
    const userId = await getUserId()

    // Check rate limit (max 10 payment requests per minute)
    if (!checkRateLimit(`payment:${userId}`, 10, 60000)) {
      return {
        success: false,
        error: 'Too many payment requests. Please wait before trying again.',
      }
    }

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: ValidationErrors.INVALID_PHONE,
      }
    }

    // Validate amount
    if (!validateAmount(amount)) {
      return {
        success: false,
        error: ValidationErrors.INVALID_AMOUNT,
      }
    }

    // Validate description
    if (description && description.length > 500) {
      return {
        success: false,
        error: 'Description is too long (max 500 characters)',
      }
    }

    // Generate unique request ID
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Format phone number (ensure it starts with 254 for Kenya)
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }

    // Store transaction in database
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        requestId,
        phoneNumber: formattedPhone,
        amount: amount.toString(),
        description,
        status: 'pending',
      })
      .returning()

    // Call M-Pesa API
    const callbackUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/payments/callback`

    try {
      const result = await mpesaClient.initiateStkPush(
        formattedPhone,
        amount,
        requestId,
        description || 'Payment',
        callbackUrl,
      )

      if (result.ResponseCode === '0') {
        // Update transaction with M-Pesa request details
        await db
          .update(transactions)
          .set({
            status: 'initiated',
          })
          .where(eq(transactions.requestId, requestId))

        return {
          success: true,
          checkoutRequestId: result.CheckoutRequestID,
          merchantRequestId: result.MerchantRequestID,
          message: 'Payment initiated. Please enter your M-Pesa PIN.',
        }
      } else {
        // Handle M-Pesa error
        await db
          .update(transactions)
          .set({
            status: 'failed',
            errorCode: result.ResponseCode,
            errorMessage: result.ResponseDescription,
          })
          .where(eq(transactions.requestId, requestId))

        return {
          success: false,
          error: result.ResponseDescription || 'Payment initiation failed',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await db
        .update(transactions)
        .set({
          status: 'failed',
          errorCode: 'API_ERROR',
          errorMessage,
        })
        .where(eq(transactions.requestId, requestId))

      logError(error, { context: 'M-Pesa API call', requestId })
      return {
        success: false,
        error: 'Payment initiation failed. Please try again.',
      }
    }
  } catch (error) {
    logError(error, { context: 'Payment initiation' })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate payment',
    }
  }
}

export async function checkPaymentStatus(checkoutRequestId: string) {
  try {
    const userId = await getUserId()

    // Find transaction by checkout request ID
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .limit(1)

    if (!transaction.length) {
      return {
        success: false,
        error: 'Transaction not found',
      }
    }

    // Query M-Pesa for status
    try {
      const result = await mpesaClient.queryOnlineStatus(checkoutRequestId)

      let status = 'pending'
      if (result.ResultCode === '0') {
        status = 'completed'
      } else if (result.ResultCode === '1' || result.ResultCode === '17') {
        status = 'user_cancelled'
      } else if (result.ResultCode !== undefined) {
        status = 'failed'
      }

      // Update transaction if completed
      if (status !== 'pending') {
        await db
          .update(transactions)
          .set({
            status,
            errorCode: result.ResultCode?.toString(),
            errorMessage: result.ResultDesc,
            updatedAt: new Date(),
          })
          .where(eq(transactions.id, transaction[0].id))

        revalidatePath('/dashboard')
      }

      return {
        success: true,
        status,
        message: result.ResultDesc || 'Check your M-Pesa for the transaction status.',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check payment status',
      }
    }
  } catch (error) {
    console.error('Payment status check error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check payment status',
    }
  }
}

export async function getTransactionHistory() {
  try {
    const userId = await getUserId()

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))

    return {
      success: true,
      transactions: userTransactions,
    }
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transaction history',
    }
  }
}

export async function handlePaymentCallback(body: unknown) {
  try {
    // Verify callback signature (placeholder - implement proper verification)
    const callbackBody = JSON.stringify(body)
    if (!mpesaClient.verifyCallback(callbackBody)) {
      return {
        success: false,
        error: 'Invalid callback signature',
      }
    }

    // Store callback in database
    const callbackData = body as Record<string, any>
    const result = callbackData.Result || callbackData.body?.stkCallback?.CallbackMetadata

    if (result) {
      const requestId = result.CheckoutRequestID || result.RequestId
      const resultCode = result.ResultCode

      await db.insert(paymentCallbacks).values({
        requestId,
        resultCode,
        resultDesc: result.ResultDesc,
        mpesaReceiptNumber: result.MpesaReceiptNumber,
        amount: result.Amount,
        transactionDate: new Date(result.TransactionDate * 1000),
        phoneNumber: result.PhoneNumber,
        rawResponse: callbackBody,
      })

      // Update transaction status
      if (resultCode === 0) {
        const [txn] = await db
          .select()
          .from(transactions)
          .where(eq(transactions.requestId, requestId))
          .limit(1)

        if (txn) {
          await db
            .update(transactions)
            .set({
              status: 'completed',
              mpesaReceiptNumber: result.MpesaReceiptNumber,
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(transactions.id, txn.id))
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Callback processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Callback processing failed',
    }
  }
}
