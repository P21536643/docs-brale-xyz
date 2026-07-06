import { checkPaymentStatus } from '@/app/actions/payment'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const checkoutRequestId = request.nextUrl.searchParams.get('checkoutRequestId')

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: 'Missing checkoutRequestId parameter' },
        { status: 400 },
      )
    }

    const result = await checkPaymentStatus(checkoutRequestId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 },
    )
  }
}
