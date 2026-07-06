'use client'

import { useState } from 'react'
import { initiatePayment, checkPaymentStatus } from '@/app/actions/payment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PaymentFormProps {
  onSuccess?: () => void
}

export function PaymentForm({ onSuccess }: PaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checkoutRequestId, setCheckoutRequestId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [checking, setChecking] = useState(false)

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const result = await initiatePayment(phoneNumber, parseFloat(amount), description)

      if (result.success) {
        setSuccess(true)
        setCheckoutRequestId(result.checkoutRequestId || '')
        setStatusMessage(result.message || 'Payment initiated. Check your phone for the M-Pesa prompt.')
        setPhoneNumber('')
        setAmount('')
        setDescription('')

        // Start polling for payment status
        if (result.checkoutRequestId) {
          startStatusPolling(result.checkoutRequestId)
        }
      } else {
        setError(result.error || 'Failed to initiate payment')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const startStatusPolling = (checkoutId: string) => {
    let pollCount = 0
    const maxPolls = 10 // Poll for up to 50 seconds (10 x 5 second intervals)

    const pollStatus = async () => {
      if (pollCount >= maxPolls) return

      pollCount++
      setChecking(true)

      try {
        const response = await fetch(`/api/payments/status?checkoutRequestId=${checkoutId}`)
        const result = await response.json()

        if (result.success) {
          if (result.status === 'completed') {
            setStatusMessage('✓ Payment successful!')
            setSuccess(true)
            onSuccess?.()
            return
          } else if (result.status === 'user_cancelled') {
            setStatusMessage('Payment was cancelled by the user')
            return
          } else if (result.status === 'failed') {
            setStatusMessage('Payment failed. Please try again.')
            return
          }

          // Continue polling if still pending
          setTimeout(pollStatus, 5000)
        }
      } catch (err) {
        console.error('Status polling error:', err)
      } finally {
        setChecking(false)
      }
    }

    // Start polling after 3 seconds (give user time to enter PIN)
    setTimeout(pollStatus, 3000)
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleInitiate} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone Number
          </label>
          <Input
            id="phone"
            type="tel"
            placeholder="0712345678 or +254712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading || checking}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your M-Pesa registered phone number
          </p>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1">
            Amount (KES)
          </label>
          <Input
            id="amount"
            type="number"
            placeholder="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            disabled={loading || checking}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description (Optional)
          </label>
          <Input
            id="description"
            type="text"
            placeholder="Payment description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading || checking}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
            {statusMessage}
            {checking && ' (Checking payment status...)'}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || checking || !phoneNumber || !amount}
          className="w-full"
        >
          {loading ? 'Initiating...' : checking ? 'Checking Status...' : 'Pay with M-Pesa'}
        </Button>
      </form>
    </div>
  )
}
