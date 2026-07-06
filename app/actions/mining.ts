'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { miningAccounts, miningStats, miningWithdrawals } from '@/lib/db/schema'
import { miningClient } from '@/lib/mining/base44-client'
import { validatePhoneNumber } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/errors'
import { eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function linkMiningAccount(minerAddress: string) {
  try {
    const userId = await getUserId()

    // Check rate limit
    if (!checkRateLimit(`mining-link:${userId}`, 5, 60000)) {
      return {
        success: false,
        error: 'Too many link requests. Please wait before trying again.',
      }
    }

    // Validate miner address
    if (!minerAddress || minerAddress.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid miner address',
      }
    }

    // Check if already linked
    const existing = await db
      .select()
      .from(miningAccounts)
      .where(eq(miningAccounts.userId, userId))

    if (existing.length > 0) {
      return {
        success: false,
        error: 'Mining account already linked to this user',
      }
    }

    // Create account in base44
    const miningAccount = await miningClient.createMiningAccount(userId, minerAddress)

    // Store in database
    const result = await db.insert(miningAccounts).values({
      userId,
      base44AccountId: miningAccount.id,
      miningAddress: minerAddress,
      status: 'active',
    })

    // Create initial stats record
    if (result) {
      const accountId = Array.isArray(result) ? result[0] : result
      if (accountId) {
        await db.insert(miningStats).values({
          miningAccountId: accountId as unknown as number,
          hashRate: 0,
          shares: 0,
          validShares: 0,
          invalidShares: 0,
          difficulty: 0,
          pendingRewards: 0,
          totalEarned: 0,
          totalPaid: 0,
        })
      }
    }

    revalidatePath('/dashboard')
    return {
      success: true,
      data: {
        id: miningAccount.id,
        address: miningAccount.address,
      },
    }
  } catch (error) {
    logError(error, { context: 'Link mining account' })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to link mining account',
    }
  }
}

export async function getMiningStats() {
  try {
    const userId = await getUserId()

    // Get user's mining account
    const account = await db
      .select()
      .from(miningAccounts)
      .where(eq(miningAccounts.userId, userId))
      .limit(1)

    if (!account || account.length === 0) {
      return {
        success: false,
        error: 'No mining account linked',
        data: null,
      }
    }

    const miningAccount = account[0]

    // Fetch fresh stats from base44
    try {
      const remoteStats = await miningClient.getMiningStats(miningAccount.base44AccountId)

      // Update database
      const existingStats = await db
        .select()
        .from(miningStats)
        .where(eq(miningStats.miningAccountId, miningAccount.id))
        .limit(1)

      if (existingStats.length > 0) {
        await db
          .update(miningStats)
          .set({
            hashRate: remoteStats.hashRate?.toString(),
            shares: remoteStats.shares,
            validShares: remoteStats.validShares,
            invalidShares: remoteStats.invalidShares,
            difficulty: remoteStats.difficulty?.toString(),
            pendingRewards: remoteStats.pendingRewards?.toString(),
            totalEarned: remoteStats.totalEarned?.toString(),
            totalPaid: remoteStats.totalPaid?.toString(),
            lastUpdate: new Date(),
          })
          .where(eq(miningStats.miningAccountId, miningAccount.id))
      }

      return {
        success: true,
        data: {
          account: miningAccount,
          stats: remoteStats,
        },
      }
    } catch (error) {
      // If remote fetch fails, return cached stats
      const cachedStats = await db
        .select()
        .from(miningStats)
        .where(eq(miningStats.miningAccountId, miningAccount.id))
        .limit(1)

      if (cachedStats.length > 0) {
        return {
          success: true,
          data: {
            account: miningAccount,
            stats: cachedStats[0],
            cached: true,
          },
        }
      }

      throw error
    }
  } catch (error) {
    logError(error, { context: 'Get mining stats' })
    return {
      success: false,
      error: 'Failed to fetch mining stats',
      data: null,
    }
  }
}

export async function withdrawMiningRewards(
  amountIsiolocoin: number,
  phoneNumber: string
) {
  try {
    const userId = await getUserId()

    // Rate limiting
    if (!checkRateLimit(`mining-withdraw:${userId}`, 3, 3600000)) {
      return {
        success: false,
        error: 'Withdrawal limit reached. Max 3 withdrawals per hour.',
      }
    }

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number',
      }
    }

    // Validate amount
    if (amountIsiolocoin <= 0) {
      return {
        success: false,
        error: 'Invalid amount',
      }
    }

    // Get mining account
    const account = await db
      .select()
      .from(miningAccounts)
      .where(eq(miningAccounts.userId, userId))
      .limit(1)

    if (!account || account.length === 0) {
      return {
        success: false,
        error: 'No mining account linked',
      }
    }

    const miningAccount = account[0]

    // Get current stats
    const stats = await db
      .select()
      .from(miningStats)
      .where(eq(miningStats.miningAccountId, miningAccount.id))
      .orderBy(desc(miningStats.lastUpdate))
      .limit(1)

    if (!stats || stats.length === 0) {
      return {
        success: false,
        error: 'Mining stats not found',
      }
    }

    const currentStats = stats[0]
    const availableRewards = parseFloat(currentStats.pendingRewards?.toString() || '0')

    if (availableRewards < amountIsiolocoin) {
      return {
        success: false,
        error: `Insufficient rewards. Available: ${availableRewards} Isiolocoin`,
      }
    }

    // Convert to KES
    const amountKES = miningClient.convertIsiolocoinToKES(amountIsiolocoin)

    // Create withdrawal record
    const withdrawal = await db
      .insert(miningWithdrawals)
      .values({
        userId,
        miningAccountId: miningAccount.id,
        amountIsiolocoin: amountIsiolocoin.toString(),
        amountKES: amountKES.toString(),
        phoneNumber,
        status: 'pending',
      })
      .returning()

    // Trigger M-Pesa payment through separate action
    // This will be handled by the payment system
    const withdrawalId = Array.isArray(withdrawal) ? withdrawal[0]?.id : withdrawal?.id

    revalidatePath('/dashboard')
    return {
      success: true,
      data: {
        withdrawalId,
        amountIsiolocoin,
        amountKES,
        phoneNumber,
        status: 'pending',
      },
    }
  } catch (error) {
    logError(error, { context: 'Withdraw mining rewards' })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process withdrawal',
    }
  }
}

export async function getWithdrawalHistory() {
  try {
    const userId = await getUserId()

    const withdrawals = await db
      .select()
      .from(miningWithdrawals)
      .where(eq(miningWithdrawals.userId, userId))
      .orderBy(desc(miningWithdrawals.requestedAt))

    return {
      success: true,
      data: withdrawals,
    }
  } catch (error) {
    logError(error, { context: 'Get withdrawal history' })
    return {
      success: false,
      error: 'Failed to fetch withdrawal history',
      data: [],
    }
  }
}

export async function getAccountStatus() {
  try {
    const userId = await getUserId()

    const account = await db
      .select()
      .from(miningAccounts)
      .where(eq(miningAccounts.userId, userId))
      .limit(1)

    return {
      success: true,
      data: account.length > 0 ? account[0] : null,
    }
  } catch (error) {
    logError(error, { context: 'Get account status' })
    return {
      success: false,
      error: 'Failed to fetch account status',
      data: null,
    }
  }
}
