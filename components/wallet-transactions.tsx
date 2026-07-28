'use client'

import { useState, useEffect } from 'react'
import { getWalletTransactionHistory } from '@/app/actions/wallet'

interface Transaction {
  hash: string
  from: string
  to: string
  amount: number
  timestamp: number
  status: string
  blockNumber?: number
}

export function WalletTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const result = await getWalletTransactionHistory(50)
      if (result.success) {
        setTransactions(result.data)
      } else {
        setError(result.error || 'Failed to fetch transactions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading transactions...</div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">{error}</div>
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded p-8 text-center text-gray-500">
        <p>No transactions yet</p>
      </div>
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'failed':
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">From</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">To</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.hash} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(tx.timestamp)}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                    {tx.from === tx.to ? 'Internal' : 'Transfer'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {truncateAddress(tx.from)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {truncateAddress(tx.to)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  <div className={tx.from === tx.to ? 'text-orange-600' : 'text-green-600'}>
                    {tx.from === tx.to ? '+' : ''}{tx.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">ISIO</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(tx.status)}`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-600">
        Showing {transactions.length} transactions
      </div>
    </div>
  )
}
