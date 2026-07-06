'use client'

import { useState, useEffect } from 'react'
import { withdrawMiningRewards, getMiningStats } from '@/app/actions/mining'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { miningClient } from '@/lib/mining/base44-client'
import { useRouter } from 'next/navigation'

export default function MiningWithdrawForm() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pendingRewards, setPendingRewards] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const result = await getMiningStats()
      if (result.success && result.data?.stats) {
        setPendingRewards(parseFloat(result.data.stats.pendingRewards || '0'))
      }
      setLoading(false)
    } catch (err) {
      setError('Failed to load mining stats')
      setLoading(false)
    }
  }

  const amountNumber = parseFloat(amount) || 0
  const kesAmount = miningClient.convertIsiolocoinToKES(amountNumber)
  const isValidAmount = amountNumber > 0 && amountNumber <= pendingRewards

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const result = await withdrawMiningRewards(amountNumber, phoneNumber)

      if (result.success) {
        setSuccess(true)
        setAmount('')
        setPhoneNumber('')
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 2000)
      } else {
        setError(result.error || 'Withdrawal failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="p-8 border-green-200 bg-green-50">
        <div className="text-center">
          <div className="inline-block mb-4 text-green-600">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-green-800 font-medium mb-2">
            Withdrawal request submitted successfully!
          </p>
          <p className="text-green-700 text-sm mb-4">
            M-Pesa payment will be processed shortly
          </p>
          <p className="text-green-700 text-sm">Redirecting to dashboard...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Withdraw Rewards</h2>
      <p className="text-gray-600 mb-6">
        Available: <span className="font-bold text-green-600">{pendingRewards.toFixed(4)}</span> Isiolocoin
      </p>

      <form onSubmit={handleWithdraw} className="space-y-4">
        <div>
          <Label htmlFor="amount" className="block mb-2">
            Amount (Isiolocoin)
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.0000"
            step="0.0001"
            min="0"
            max={pendingRewards}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
            className="w-full"
            required
          />
          {amountNumber > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Converts to: <span className="font-medium">{kesAmount.toFixed(2)} KES</span>
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="block mb-2">
            M-Pesa Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="254712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={submitting}
            className="w-full"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            Include country code (254 for Kenya)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-blue-800 text-sm">
            You will receive an M-Pesa prompt on your phone to complete the payment confirmation.
          </p>
        </div>

        <Button
          type="submit"
          disabled={submitting || !isValidAmount}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {submitting ? 'Processing...' : 'Withdraw to M-Pesa'}
        </Button>
      </form>
    </Card>
  )
}
