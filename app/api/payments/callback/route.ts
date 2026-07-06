import { handlePaymentCallback } from '@/app/actions/payment'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await handlePaymentCallback(body)

    if (result.success) {
      return NextResponse.json(
        { ResultCode: 0, ResultDesc: 'Accepted' },
        { status: 200 },
      )
    } else {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: 'Failed' },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: 'Server error' },
      { status: 500 },
    )
  }
}
