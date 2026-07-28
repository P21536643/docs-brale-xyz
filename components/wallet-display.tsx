'use client'

import { useState, useEffect } from 'react'
import { getWalletInfo, unlinkWallet } from '@/app/actions/wallet'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface WalletData {
  walletAddress: string
  status: string
  balance: number
  unconfirmedBalance: number
  totalReceived: number
  totalSent: number
}

export function WalletDisplay() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlinking, setUnlinking] = useState(false)

  useEffect(() => {
    fetchWalletInfo()
  }, [])

  const fetchWalletInfo = async () => {
    try {
      setLoading(true)
      const result = await getWalletInfo()
      if (result.success && result.data) {
        setWallet(result.data)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink this wallet?')) return

    try {
      setUnlinking(true)
      const result = await unlinkWallet()
      if (result.success) {
        setWallet(null)
      } else {
        alert(result.error || 'Failed to unlink wallet')
      }
    } catch (error) {
      console.error('Error unlinking wallet:', error)
      alert('An error occurred while unlinking the wallet')
    } finally {
      setUnlinking(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading wallet information...</div>
  }

  if (!wallet) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">No Wallet Connected</h3>
        <p className="text-sm text-blue-700 mb-4">
          Link your IsioloCoin wallet to view balance and manage rewards.
        </p>
        <Link href="/wallet/connect">
          <Button className="bg-blue-600 hover:bg-blue-700">Connect Wallet</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">IsioloCoin Wallet</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Wallet Address</p>
            <p className="font-mono text-sm text-gray-900 break-all">{wallet.walletAddress}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded">
              <p className="text-xs text-green-600 font-semibold">BALANCE</p>
              <p className="text-xl font-bold text-green-900">{wallet.balance.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">ISIO</p>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600 font-semibold">UNCONFIRMED</p>
              <p className="text-xl font-bold text-gray-900">
                {wallet.unconfirmedBalance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-1">ISIO</p>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs text-blue-600 font-semibold">RECEIVED</p>
              <p className="text-lg font-bold text-blue-900">{wallet.totalReceived.toFixed(2)}</p>
            </div>

            <div className="bg-orange-50 p-3 rounded">
              <p className="text-xs text-orange-600 font-semibold">SENT</p>
              <p className="text-lg font-bold text-orange-900">{wallet.totalSent.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/wallet/transactions" className="flex-1">
          <Button variant="outline" className="w-full">
            View Transactions
          </Button>
        </Link>
        <Link href="/wallet/convert" className="flex-1">
          <Button className="w-full bg-green-600 hover:bg-green-700">
            Convert to M-Pesa
          </Button>
        </Link>
        <Button
          variant="destructive"
          onClick={handleUnlink}
          disabled={unlinking}
          className="flex-1"
        >
          {unlinking ? 'Unlinking...' : 'Unlink'}
        </Button>
      </div>
    </div>
  )
}
