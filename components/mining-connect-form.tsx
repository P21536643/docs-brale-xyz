'use client'

import { useState } from 'react'
import { linkMiningAccount } from '@/app/actions/mining'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export default function MiningConnectForm() {
  const router = useRouter()
  const [minerAddress, setMinerAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await linkMiningAccount(minerAddress.trim())

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 2000)
      } else {
        setError(result.error || 'Failed to connect mining account')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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
          <p className="text-green-800 font-medium mb-2">Mining account connected successfully!</p>
          <p className="text-green-700 text-sm">Redirecting to dashboard...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Connect Mining Account</h2>

      <form onSubmit={handleConnect} className="space-y-4">
        <div>
          <Label htmlFor="minerAddress" className="block mb-2">
            Miner Address
          </Label>
          <Input
            id="minerAddress"
            type="text"
            placeholder="Enter your IsioloCoin miner address"
            value={minerAddress}
            onChange={(e) => setMinerAddress(e.target.value)}
            disabled={loading}
            className="w-full"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            This is the wallet address you use for mining on the base44 pool
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || minerAddress.trim() === ''}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Connecting...' : 'Connect Account'}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t">
        <h3 className="font-medium text-gray-900 mb-3">How to get your miner address:</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Log in to your base44 mining account</li>
          <li>Go to your account settings or dashboard</li>
          <li>Find your miner address or public key</li>
          <li>Copy and paste it above</li>
        </ol>
      </div>
    </Card>
  )
}
