'use client'

import { useEffect, useState } from 'react'
import { getMiningStats, getWithdrawalHistory, getAccountStatus } from '@/app/actions/mining'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface MiningStatsData {
  hashRate: number
  shares: number
  validShares: number
  invalidShares: number
  difficulty: number
  pendingRewards: number
  totalEarned: number
  totalPaid: number
}

export default function MiningDashboard() {
  const [stats, setStats] = useState<MiningStatsData | null>(null)
  const [account, setAccount] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      setError(null)
      const [statsRes, accountRes, withdrawalsRes] = await Promise.all([
        getMiningStats(),
        getAccountStatus(),
        getWithdrawalHistory(),
      ])

      if (statsRes.success && statsRes.data?.stats) {
        setStats(statsRes.data.stats)
      }
      if (accountRes.success && accountRes.data) {
        setAccount(accountRes.data)
      }
      if (withdrawalsRes.success && withdrawalsRes.data) {
        setWithdrawals(withdrawalsRes.data)
      }

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mining data')
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading mining data...</p>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600 mb-4">No mining account linked yet.</p>
        <Link href="/mining/connect">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Connect Mining Account
          </Button>
        </Link>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
      </Card>
    )
  }

  const hashRateDisplay = stats?.hashRate
    ? stats.hashRate > 1000
      ? `${(stats.hashRate / 1000).toFixed(2)} MH/s`
      : `${stats.hashRate.toFixed(2)} KH/s`
    : '0 KH/s'

  const shareAccuracy =
    stats?.shares && stats.shares > 0
      ? ((stats.validShares / stats.shares) * 100).toFixed(1)
      : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mining Dashboard</h2>
          <p className="text-gray-600">Address: {account?.miningAddress}</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hash Rate */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Hash Rate</h3>
          <p className="text-2xl font-bold text-blue-600">{hashRateDisplay}</p>
          <p className="text-xs text-gray-500 mt-2">Current mining power</p>
        </Card>

        {/* Pending Rewards */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Rewards</h3>
          <p className="text-2xl font-bold text-green-600">
            {stats?.pendingRewards?.toFixed(4) || '0.0000'} ISIO
          </p>
          <Link href="/mining/withdraw">
            <Button size="sm" className="mt-2 w-full bg-green-600 hover:bg-green-700">
              Withdraw
            </Button>
          </Link>
        </Card>

        {/* Total Earned */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Earned</h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats?.totalEarned?.toFixed(4) || '0.0000'} ISIO
          </p>
          <p className="text-xs text-gray-500 mt-2">All time earnings</p>
        </Card>

        {/* Total Paid */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Paid</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats?.totalPaid?.toFixed(4) || '0.0000'} ISIO
          </p>
          <p className="text-xs text-gray-500 mt-2">Withdrawn rewards</p>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mining Statistics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mining Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Shares</span>
              <span className="font-medium">{stats?.shares || 0}</span>
            </div>
            <div className="border-t"></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valid Shares</span>
              <span className="font-medium text-green-600">{stats?.validShares || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Invalid Shares</span>
              <span className="font-medium text-red-600">{stats?.invalidShares || 0}</span>
            </div>
            <div className="border-t"></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Share Accuracy</span>
              <span className="font-medium">{shareAccuracy}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Difficulty</span>
              <span className="font-medium">{stats?.difficulty?.toFixed(6) || '0'}</span>
            </div>
          </div>
        </Card>

        {/* Recent Withdrawals */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Withdrawals</h3>
          {withdrawals.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {withdrawals.slice(0, 5).map((w) => (
                <div
                  key={w.id}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {w.amountIsiolocoin} ISIO
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(w.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {w.amountKES} KES
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        w.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : w.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No withdrawals yet</p>
          )}
        </Card>
      </div>
    </div>
  )
}
