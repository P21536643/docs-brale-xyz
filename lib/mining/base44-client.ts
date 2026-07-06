export interface MiningMetrics {
  hashRate: number
  shares: number
  validShares: number
  invalidShares: number
  difficulty: number
  pendingRewards: number
  totalEarned: number
  totalPaid: number
  lastUpdate: string
}

export interface MiningAccount {
  id: string
  address: string
  status: 'active' | 'inactive'
  metrics: MiningMetrics
}

export interface MiningUserResponse {
  success: boolean
  data?: MiningAccount
  error?: string
}

// Conversion rate: 1 Isiolocoin = X KES (will be fetched or configured)
const CONVERSION_RATE = 50 // KES per Isiolocoin (configurable)

class Base44MiningClient {
  private baseUrl = 'https://isiolo-coin-copy-1530df29.base44.app'
  private cacheMap = new Map<string, { data: any; timestamp: number }>()
  private cacheTTL = 60000 // 60 seconds cache

  async fetchWithCache<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<T> {
    // Check cache first
    if (cacheKey) {
      const cached = this.cacheMap.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache the result
      if (cacheKey) {
        this.cacheMap.set(cacheKey, {
          data,
          timestamp: Date.now(),
        })
      }

      return data
    } catch (error) {
      console.error('[v0] Mining API fetch error:', error)
      throw error
    }
  }

  async getMiningStats(accountId: string): Promise<MiningMetrics> {
    try {
      const response = await this.fetchWithCache<any>(
        `/api/mining/stats/${accountId}`,
        { method: 'GET' },
        `mining-stats-${accountId}`
      )

      if (response.success && response.data) {
        return {
          hashRate: parseFloat(response.data.hashRate || '0'),
          shares: response.data.shares || 0,
          validShares: response.data.validShares || 0,
          invalidShares: response.data.invalidShares || 0,
          difficulty: parseFloat(response.data.difficulty || '0'),
          pendingRewards: parseFloat(response.data.pendingRewards || '0'),
          totalEarned: parseFloat(response.data.totalEarned || '0'),
          totalPaid: parseFloat(response.data.totalPaid || '0'),
          lastUpdate: response.data.lastUpdate || new Date().toISOString(),
        }
      }

      throw new Error('Failed to fetch mining stats')
    } catch (error) {
      console.error('[v0] Error fetching mining stats:', error)
      throw error
    }
  }

  async getMiningAccount(address: string): Promise<MiningAccount> {
    try {
      const response = await this.fetchWithCache<any>(
        `/api/mining/account/${address}`,
        { method: 'GET' },
        `mining-account-${address}`
      )

      if (response.success && response.data) {
        const metrics = await this.getMiningStats(response.data.id)
        return {
          id: response.data.id,
          address: response.data.address,
          status: response.data.status || 'active',
          metrics,
        }
      }

      throw new Error('Failed to fetch mining account')
    } catch (error) {
      console.error('[v0] Error fetching mining account:', error)
      throw error
    }
  }

  async getUserMiningAccounts(userId: string): Promise<MiningAccount[]> {
    try {
      const response = await this.fetchWithCache<any>(
        `/api/mining/user/${userId}/accounts`,
        { method: 'GET' },
        `user-mining-accounts-${userId}`
      )

      if (response.success && Array.isArray(response.data)) {
        return Promise.all(
          response.data.map(async (account: any) => {
            try {
              const metrics = await this.getMiningStats(account.id)
              return {
                id: account.id,
                address: account.address,
                status: account.status || 'active',
                metrics,
              }
            } catch (error) {
              console.error('[v0] Error processing account metrics:', error)
              return {
                id: account.id,
                address: account.address,
                status: account.status || 'active',
                metrics: {
                  hashRate: 0,
                  shares: 0,
                  validShares: 0,
                  invalidShares: 0,
                  difficulty: 0,
                  pendingRewards: 0,
                  totalEarned: 0,
                  totalPaid: 0,
                  lastUpdate: new Date().toISOString(),
                },
              }
            }
          })
        )
      }

      return []
    } catch (error) {
      console.error('[v0] Error fetching user mining accounts:', error)
      return []
    }
  }

  async createMiningAccount(userId: string, minerAddress: string): Promise<MiningAccount> {
    try {
      const response = await this.fetchWithCache<any>(
        '/api/mining/account/create',
        {
          method: 'POST',
          body: JSON.stringify({
            userId,
            minerAddress,
          }),
        },
        undefined // Don't cache POST requests
      )

      if (response.success && response.data) {
        return {
          id: response.data.id,
          address: response.data.address,
          status: response.data.status || 'active',
          metrics: {
            hashRate: 0,
            shares: 0,
            validShares: 0,
            invalidShares: 0,
            difficulty: 0,
            pendingRewards: 0,
            totalEarned: 0,
            totalPaid: 0,
            lastUpdate: new Date().toISOString(),
          },
        }
      }

      throw new Error('Failed to create mining account')
    } catch (error) {
      console.error('[v0] Error creating mining account:', error)
      throw error
    }
  }

  convertIsiolocoinToKES(amountIsiolocoin: number): number {
    return amountIsiolocoin * CONVERSION_RATE
  }

  convertKESToIsiolocoin(amountKES: number): number {
    return amountKES / CONVERSION_RATE
  }

  clearCache(key?: string): void {
    if (key) {
      this.cacheMap.delete(key)
    } else {
      this.cacheMap.clear()
    }
  }
}

export const miningClient = new Base44MiningClient()
