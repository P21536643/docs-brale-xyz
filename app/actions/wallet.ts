'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { coinLinkWallets, walletBalances, walletTransactions } from '@/lib/db/schema'
import { coinLinkClient } from '@/lib/wallet/coin-link-client'
import { validatePhoneNumber, ValidationErrors } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { AuthenticationError, logError } from '@/lib/errors'
import { eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new AuthenticationError('Session not found')
  return session.user.id
}

/**
 * Link an IsioloCoin wallet address to user account
 */
export async function linkWalletAddress(walletAddress: string) {
  try {
    const userId = await getUserId()

    // Validate wallet address format
    const isValid = await coinLinkClient.validateWalletAddress(walletAddress)
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid wallet address format',
      }
    }

    // Check if wallet already linked to another user
    const existingWallet = await db
      .select()
      .from(coinLinkWallets)
      .where(eq(coinLinkWallets.walletAddress, walletAddress))
      .limit(1)

    if (existingWallet.length > 0 && existingWallet[0].userId !== userId) {
      return {
        success: false,
        error: 'This wallet is already linked to another account',
      }
    }

    // Unlink previous wallet if exists
    const previousWallet = await db
      .select()
      .from(coinLinkWallets)
      .where(eq(coinLinkWallets.userId, userId))
      .limit(1)

    if (previousWallet.length > 0) {
      await db
        .update(coinLinkWallets)
        .set({ status: 'inactive' })
        .where(eq(coinLinkWallets.userId, userId))
    }

    // Link new wallet
    await db.insert(coinLinkWallets).values({
      userId,
      walletAddress,
      status: 'active',
      verifiedAt: new Date(),
    })

    // Fetch initial balance
    const balance = await coinLinkClient.getWalletBalance(walletAddress)

    if (balance) {
      // Store or update balance
      const existingBalance = await db
        .select()
        .from(walletBalances)
        .where(eq(walletBalances.userId, userId))
        .limit(1)

      if (existingBalance.length > 0) {
        await db
          .update(walletBalances)
          .set({
            walletAddress,
            balance: balance.balance.toString(),
            totalReceived: balance.totalReceived.toString(),
            totalSent: balance.totalSent.toString(),
            lastUpdated: new Date(),
          })
          .where(eq(walletBalances.userId, userId))
      } else {
        await db.insert(walletBalances).values({
          userId,
          walletAddress,
          balance: balance.balance.toString(),
          unconfirmedBalance: balance.unconfirmedBalance.toString(),
          totalReceived: balance.totalReceived.toString(),
          totalSent: balance.totalSent.toString(),
        })
      }
    }

    revalidatePath('/wallet')
    return {
      success: true,
      message: 'Wallet linked successfully',
    }
  } catch (error) {
    logError(error, { context: 'Link wallet address' })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to link wallet',
    }
  }
}

/**
 * Get linked wallet info and balance
 */
export async function getWalletInfo() {
  try {
    const userId = await getUserId()

    const wallet = await db
      .select()
      .from(coinLinkWallets)
      .where(eq(coinLinkWallets.userId, userId))
      .limit(1)

    if (wallet.length === 0) {
      return {
        success: true,
        data: null,
      }
    }

    const walletData = wallet[0]

    // Fetch latest balance
    const balance = await coinLinkClient.getWalletBalance(walletData.walletAddress)

    if (balance) {
      // Update balance in cache
      await db
        .update(walletBalances)
        .set({
          balance: balance.balance.toString(),
          unconfirmedBalance: balance.unconfirmedBalance.toString(),
          lastUpdated: new Date(),
        })
        .where(eq(walletBalances.userId, userId))
    }

    return {
      success: true,
      data: {
        walletAddress: walletData.walletAddress,
        status: walletData.status,
        verifiedAt: walletData.verifiedAt,
        balance: balance ? balance.balance : 0,
        unconfirmedBalance: balance ? balance.unconfirmedBalance : 0,
        totalReceived: balance ? balance.totalReceived : 0,
        totalSent: balance ? balance.totalSent : 0,
      },
    }
  } catch (error) {
    logError(error, { context: 'Get wallet info' })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch wallet info',
    }
  }
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactionHistory(limit = 50) {
  try {
    const userId = await getUserId()

    const wallet = await db
      .select()
      .from(coinLinkWallets)
      .where(eq(coinLinkWallets.userId, userId))
      .limit(1)

    if (wallet.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Get transactions from coin-link
    const transactions = await coinLinkClient.getWalletTransactions(
      wallet[0].walletAddress,
      limit
    )

    return {
      success: true,
      data: transactions,
    }
  } catch (error) {
    logError(error, { context: 'Get wallet transactions' })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    }
  }
}

/**
 * Unlink wallet from account
 */
export async function unlinkWallet() {
  try {
    const userId = await getUserId()

    // Check rate limit (max 3 unlinks per hour)
    if (!checkRateLimit(`unlink-wallet:${userId}`, 3, 3600000)) {
      return {
        success: false,
        error: 'Too many wallet unlink attempts. Please wait before trying again.',
      }
    }

    await db.update(coinLinkWallets).set({ status: 'inactive' }).where(eq(coinLinkWallets.userId, userId))

    revalidatePath('/wallet')
    return {
      success: true,
      message: 'Wallet unlinked successfully',
    }
  } catch (error) {
    logError(error, { context: 'Unlink wallet' })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unlink wallet',
    }
  }
}
