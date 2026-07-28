'use client'

import { useState } from 'react'
import { linkWalletAddress } from '@/app/actions/wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export function WalletConnectForm() {
  const [walletAddress, setWalletAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!walletAddress.trim()) {
      setError('Please enter a wallet address')
      return
    }

    try {
      setLoading(true)
      const result = await linkWalletAddress(walletAddress.trim())

      if (result.success) {
        router.push('/wallet')
      } else {
        setError(result.error || 'Failed to link wallet')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Wallet</h2>
        <p className="text-sm text-gray-600 mb-6">
          Link your IsioloCoin wallet address to manage your balance and convert to M-Pesa
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="wallet">IsioloCoin Wallet Address</Label>
            <Input
              id="wallet"
              type="text"
              placeholder="Enter your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-2">
              Your address should start with a letter or number and be 26-35 characters long
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            You can find your wallet address in your IsioloCoin account settings
          </p>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Why connect your wallet?</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• View your IsioloCoin balance in real-time</li>
          <li>• Track wallet transactions</li>
          <li>• Convert coins directly to M-Pesa</li>
          <li>• Receive mining rewards automatically</li>
        </ul>
      </div>
    </div>
  )
}
