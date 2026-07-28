const COIN_LINK_API = 'https://isiolo-coin-link.base44.app'
const CACHE_DURATION = 60000 // 60 seconds

interface WalletBalance {
  address: string
  balance: number
  unconfirmedBalance: number
  totalReceived: number
  totalSent: number
  txCount: number
}

interface WalletTransaction {
  hash: string
  from: string
  to: string
  amount: number
  timestamp: number
  status: string
  blockNumber?: number
}

interface TransferResponse {
  success: boolean
  transactionHash?: string
  error?: string
}

// Cache for API responses to reduce load
const balanceCache = new Map<string, { data: WalletBalance; timestamp: number }>()
const transactionCache = new Map<string, { data: WalletTransaction[]; timestamp: number }>()

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION
}

export const coinLinkClient = {
  /**
   * Get wallet balance from coin-link
   */
  async getWalletBalance(walletAddress: string): Promise<WalletBalance | null> {
    try {
      // Check cache first
      const cached = balanceCache.get(walletAddress)
      if (cached && isCacheValid(cached.timestamp)) {
        return cached.data
      }

      const response = await fetch(`${COIN_LINK_API}/api/wallet/balance/${walletAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`Failed to fetch balance: ${response.status}`)
        return null
      }

      const data = await response.json()

      // Cache the result
      balanceCache.set(walletAddress, {
        data: data as WalletBalance,
        timestamp: Date.now(),
      })

      return data as WalletBalance
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
      return null
    }
  },

  /**
   * Get wallet transaction history
   */
  async getWalletTransactions(walletAddress: string, limit = 50): Promise<WalletTransaction[]> {
    try {
      // Check cache first
      const cached = transactionCache.get(walletAddress)
      if (cached && isCacheValid(cached.timestamp)) {
        return cached.data
      }

      const response = await fetch(
        `${COIN_LINK_API}/api/wallet/transactions/${walletAddress}?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        console.error(`Failed to fetch transactions: ${response.status}`)
        return []
      }

      const data = await response.json()

      // Cache the result
      transactionCache.set(walletAddress, {
        data: data as WalletTransaction[],
        timestamp: Date.now(),
      })

      return data as WalletTransaction[]
    } catch (error) {
      console.error('Error fetching wallet transactions:', error)
      return []
    }
  },

  /**
   * Validate wallet address format
   */
  async validateWalletAddress(address: string): Promise<boolean> {
    try {
      // Basic format validation (adjust regex based on IsioloCoin address format)
      const addressRegex = /^[a-zA-Z0-9]{26,35}$/
      if (!addressRegex.test(address)) {
        return false
      }

      // Optional: Validate with API
      const response = await fetch(`${COIN_LINK_API}/api/wallet/validate/${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return response.ok
    } catch (error) {
      console.error('Error validating wallet address:', error)
      return false
    }
  },

  /**
   * Transfer coins from mining rewards to wallet
   */
  async transferToWallet(
    fromAddress: string,
    toAddress: string,
    amount: number,
    privateKey?: string
  ): Promise<TransferResponse> {
    try {
      const response = await fetch(`${COIN_LINK_API}/api/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAddress,
          toAddress,
          amount,
          privateKey,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return {
          success: false,
          error: error || 'Transfer failed',
        }
      }

      const data = await response.json()

      // Invalidate cache for both addresses
      balanceCache.delete(fromAddress)
      balanceCache.delete(toAddress)
      transactionCache.delete(fromAddress)
      transactionCache.delete(toAddress)

      return {
        success: true,
        transactionHash: data.transactionHash,
      }
    } catch (error) {
      console.error('Error transferring coins:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer error',
      }
    }
  },

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionHash: string): Promise<string> {
    try {
      const response = await fetch(`${COIN_LINK_API}/api/transaction/${transactionHash}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return 'unknown'
      }

      const data = await response.json()
      return data.status || 'unknown'
    } catch (error) {
      console.error('Error fetching transaction status:', error)
      return 'unknown'
    }
  },

  /**
   * Clear cache
   */
  clearCache(): void {
    balanceCache.clear()
    transactionCache.clear()
  },

  /**
   * Clear specific wallet cache
   */
  clearWalletCache(walletAddress: string): void {
    balanceCache.delete(walletAddress)
    transactionCache.delete(walletAddress)
  },
}
