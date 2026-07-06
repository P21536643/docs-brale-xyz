'use client'

import { useEffect, useState } from 'react'
import { getTransactionHistory } from '@/app/actions/payment'

interface Transaction {
  id: number
  phoneNumber: string
  amount: string
  description: string
  status: string
  mpesaReceiptNumber: string | null
  errorMessage: string | null
  createdAt: Date
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const result = await getTransactionHistory()
        if (result.success) {
          setTransactions(result.transactions as Transaction[])
        } else {
          setError(result.error || 'Failed to load transactions')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTransactions, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading transactions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No transactions yet. Make your first payment above.
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'initiated':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
      case 'user_cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-4 font-medium">Date</th>
            <th className="text-left py-2 px-4 font-medium">Phone</th>
            <th className="text-left py-2 px-4 font-medium">Amount</th>
            <th className="text-left py-2 px-4 font-medium">Status</th>
            <th className="text-left py-2 px-4 font-medium">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-4 text-sm">
                {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
              </td>
              <td className="py-2 px-4 text-sm">{tx.phoneNumber}</td>
              <td className="py-2 px-4 text-sm font-medium">KES {tx.amount}</td>
              <td className="py-2 px-4">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(tx.status)}`}>
                  {tx.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </td>
              <td className="py-2 px-4 text-sm">
                {tx.mpesaReceiptNumber ? (
                  <span>{tx.mpesaReceiptNumber}</span>
                ) : tx.errorMessage ? (
                  <span className="text-red-600 text-xs">{tx.errorMessage}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
