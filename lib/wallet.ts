"use client"

export interface WalletBalance {
  PI: number
  BTC: number
  ETH: number
  USDT: number
  BNB: number
}

export interface Transaction {
  id: string
  userId: string
  type: "deposit" | "withdraw" | "swap" | "send"
  fromCurrency?: string
  toCurrency?: string
  amount: number
  toAmount?: number
  recipient?: string
  status: "pending" | "completed" | "failed"
  timestamp: string
  hash?: string
}

const WALLET_STORAGE_KEY = "pi_exchange_wallets"
const TRANSACTIONS_STORAGE_KEY = "pi_exchange_transactions"

export function getUserWallet(userId: string): WalletBalance {
  if (typeof window === "undefined") {
    return { PI: 0, BTC: 0, ETH: 0, USDT: 0, BNB: 0 }
  }

  const stored = localStorage.getItem(WALLET_STORAGE_KEY)
  if (!stored) {
    return { PI: 0, BTC: 0, ETH: 0, USDT: 0, BNB: 0 }
  }

  try {
    const wallets = JSON.parse(stored)
    return wallets[userId] || { PI: 0, BTC: 0, ETH: 0, USDT: 0, BNB: 0 }
  } catch {
    return { PI: 0, BTC: 0, ETH: 0, USDT: 0, BNB: 0 }
  }
}

export function updateUserWallet(userId: string, balance: WalletBalance): void {
  if (typeof window === "undefined") return

  const stored = localStorage.getItem(WALLET_STORAGE_KEY)
  let wallets: Record<string, WalletBalance> = {}

  if (stored) {
    try {
      wallets = JSON.parse(stored)
    } catch {
      wallets = {}
    }
  }

  wallets[userId] = balance
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets))
}

export function getUserTransactions(userId: string): Transaction[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY)
  if (!stored) return []

  try {
    const allTransactions: Transaction[] = JSON.parse(stored)
    return allTransactions
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch {
    return []
  }
}

export function addTransaction(transaction: Transaction): void {
  if (typeof window === "undefined") return

  const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY)
  let transactions: Transaction[] = []

  if (stored) {
    try {
      transactions = JSON.parse(stored)
    } catch {
      transactions = []
    }
  }

  transactions.push(transaction)
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions))
}

export function generateTransactionHash(): string {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
}

export async function depositFunds(
  userId: string,
  currency: keyof WalletBalance,
  amount: number,
): Promise<{ success: boolean; error?: string; transaction?: Transaction }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" }
  }

  const wallet = getUserWallet(userId)
  wallet[currency] += amount

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    userId,
    type: "deposit",
    fromCurrency: currency,
    amount,
    status: "completed",
    timestamp: new Date().toISOString(),
    hash: generateTransactionHash(),
  }

  updateUserWallet(userId, wallet)
  addTransaction(transaction)

  return { success: true, transaction }
}

export async function withdrawFunds(
  userId: string,
  currency: keyof WalletBalance,
  amount: number,
  recipient: string,
): Promise<{ success: boolean; error?: string; transaction?: Transaction }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" }
  }

  const wallet = getUserWallet(userId)

  if (wallet[currency] < amount) {
    return { success: false, error: "Insufficient balance" }
  }

  wallet[currency] -= amount

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    userId,
    type: "withdraw",
    fromCurrency: currency,
    amount,
    recipient,
    status: "completed",
    timestamp: new Date().toISOString(),
    hash: generateTransactionHash(),
  }

  updateUserWallet(userId, wallet)
  addTransaction(transaction)

  return { success: true, transaction }
}

export async function swapCurrency(
  userId: string,
  fromCurrency: keyof WalletBalance,
  toCurrency: keyof WalletBalance,
  fromAmount: number,
  exchangeRate: number,
): Promise<{ success: boolean; error?: string; transaction?: Transaction }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (fromAmount <= 0) {
    return { success: false, error: "Amount must be greater than 0" }
  }

  const wallet = getUserWallet(userId)

  if (wallet[fromCurrency] < fromAmount) {
    return { success: false, error: "Insufficient balance" }
  }

  const toAmount = fromAmount * exchangeRate

  wallet[fromCurrency] -= fromAmount
  wallet[toCurrency] += toAmount

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    userId,
    type: "swap",
    fromCurrency,
    toCurrency,
    amount: fromAmount,
    toAmount,
    status: "completed",
    timestamp: new Date().toISOString(),
    hash: generateTransactionHash(),
  }

  updateUserWallet(userId, wallet)
  addTransaction(transaction)

  return { success: true, transaction }
}

export async function sendFunds(
  userId: string,
  currency: keyof WalletBalance,
  amount: number,
  recipient: string,
): Promise<{ success: boolean; error?: string; transaction?: Transaction }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" }
  }

  if (!recipient || recipient.trim().length === 0) {
    return { success: false, error: "Recipient address required" }
  }

  const wallet = getUserWallet(userId)

  if (wallet[currency] < amount) {
    return { success: false, error: "Insufficient balance" }
  }

  wallet[currency] -= amount

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    userId,
    type: "send",
    fromCurrency: currency,
    amount,
    recipient,
    status: "completed",
    timestamp: new Date().toISOString(),
    hash: generateTransactionHash(),
  }

  updateUserWallet(userId, wallet)
  addTransaction(transaction)

  return { success: true, transaction }
}
