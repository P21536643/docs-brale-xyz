"use client"

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

const AUTH_STORAGE_KEY = "pi_exchange_auth"
const USERS_STORAGE_KEY = "pi_exchange_users"

export function getStoredAuth(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, isAuthenticated: false }
  }

  const stored = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!stored) {
    return { user: null, isAuthenticated: false }
  }

  try {
    return JSON.parse(stored)
  } catch {
    return { user: null, isAuthenticated: false }
  }
}

export function setStoredAuth(authState: AuthState): void {
  if (typeof window === "undefined") return
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

interface StoredUser {
  id: string
  email: string
  name: string
  password: string
  createdAt: string
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(USERS_STORAGE_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const users = getStoredUsers()

  // Check if user already exists
  if (users.find((u) => u.email === email)) {
    return { success: false, error: "Email already registered" }
  }

  // Create new user
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email,
    name,
    password, // In production, this would be hashed
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  saveStoredUsers(users)

  // Initialize wallet for new user
  initializeUserWallet(newUser.id)

  const user: User = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    createdAt: newUser.createdAt,
  }

  setStoredAuth({ user, isAuthenticated: true })

  return { success: true, user }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const users = getStoredUsers()
  const storedUser = users.find((u) => u.email === email && u.password === password)

  if (!storedUser) {
    return { success: false, error: "Invalid email or password" }
  }

  const user: User = {
    id: storedUser.id,
    email: storedUser.email,
    name: storedUser.name,
    createdAt: storedUser.createdAt,
  }

  setStoredAuth({ user, isAuthenticated: true })

  return { success: true, user }
}

export function signOut(): void {
  clearStoredAuth()
}

function initializeUserWallet(userId: string): void {
  const WALLET_STORAGE_KEY = "pi_exchange_wallets"

  if (typeof window === "undefined") return

  const stored = localStorage.getItem(WALLET_STORAGE_KEY)
  let wallets: Record<string, any> = {}

  if (stored) {
    try {
      wallets = JSON.parse(stored)
    } catch {
      wallets = {}
    }
  }

  // Initialize with default balances
  wallets[userId] = {
    PI: 1000,
    BTC: 0.5,
    ETH: 2,
    USDT: 5000,
    BNB: 1,
  }

  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets))
}
