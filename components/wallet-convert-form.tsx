'use client'

import { useState, useEffect } from 'react'
import { getWalletInfo } from '@/app/actions/wallet'
import { initiatePayment } from '@/app/actions/payment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

const ISIO_TO_KES = 50 // 1 ISIO = 50 KES

export function WalletConvertForm() {
  const [walletBalance, setWalletBalance] = useState(0)
  const [conversionAmount, setConversionAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchWalletBalance()
  }, [])

  const fetchWalletBalance = async () => {
    try {
      setFetching(true)
      const result = await getWalletInfo()
      if (result.success && result.data) {
        setWalletBalance(result.data.balance)
      } else {
        setError('Failed to load wallet balance')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setFetching(false)
    }
  }

  const kesAmount = conversionAmount ? (parseFloat(conversionAmount) * ISIO_TO_KES).toFixed(2) : '0.00'

  const handleMaxClick = () => {
    setConversionAmount(walletBalance.toFixed(2))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amount = parseFloat(conversionAmount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amount > walletBalance) {
      setError('Insufficient balance')
      return
    }

    if (!phoneNumber.trim()) {
      setError('Please enter a phone number')
      return
    }

    try {
      setLoading(true)

      // Initiate M-Pesa payment for wallet conversion
      const result = await initiatePayment(
        phoneNumber.trim(),
        parseFloat(kesAmount),
        `IsioloCoin Wallet Conversion - ${conversionAmount} ISIO to ${kesAmount} KES`
      )

      if (result.success) {
        // TODO: Record wallet conversion transaction
        alert('M-Pesa payment initiated. Check your phone for the STK prompt.')
        router.push('/wallet')
      } else {
        setError(result.error || 'Payment initiation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="text-center text-gray-500">Loading wallet balance...</div>
  }

  return (
    <div className="max-w-md w-full">
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Convert to M-Pesa</h2>
        <p className="text-sm text-gray-600 mb-6">
          Convert your IsioloCoin balance to Kenyan Shillings via M-Pesa
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balance Display */}
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-xs text-green-600 font-semibold">AVAILABLE BALANCE</p>
            <p className="text-2xl font-bold text-green-900">{walletBalance.toFixed(2)} ISIO</p>
            <p className="text-xs text-green-600 mt-1">≈ {(walletBalance * ISIO_TO_KES).toFixed(0)} KES</p>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="amount">IsioloCoin Amount</Label>
              <button
                type="button"
                onClick={handleMaxClick}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                Max
              </button>
            </div>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              max={walletBalance}
              value={conversionAmount}
              onChange={(e) => setConversionAmount(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-2">
              You will receive: <span className="font-semibold text-gray-900">{kesAmount} KES</span>
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <Label htmlFor="phone">M-Pesa Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+254712345678 or 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-2">Include country code (+254) or use 07xx format</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !conversionAmount || !phoneNumber}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Processing...' : `Convert to M-Pesa`}
          </Button>
        </form>
      </div>

      {/* Conversion Rate Info */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Conversion Rate</h3>
        <p className="text-sm text-blue-700">1 ISIO = {ISIO_TO_KES} KES</p>
        <p className="text-xs text-blue-600 mt-2">
          Note: You will receive funds via M-Pesa to the phone number provided
        </p>
      </div>
    </div>
  )
}
