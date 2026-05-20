"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { connectFreighter, getAccountBalances, isFreighterInstalled } from "./stellar"

interface WalletContextType {
  publicKey: string | null
  balances: Record<string, string>
  isConnected: boolean
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => void
  refreshBalances: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const refreshBalances = async () => {
    if (!publicKey) return

    try {
      const accountBalances = await getAccountBalances(publicKey)
      setBalances(accountBalances)
    } catch (error) {
      console.error("[v0] Error refreshing balances:", error)
    }
  }

  const connect = async () => {
    if (!isFreighterInstalled()) {
      alert("Please install Freighter wallet extension to continue. Visit https://freighter.app")
      window.open("https://freighter.app", "_blank")
      return
    }

    setIsLoading(true)
    try {
      const key = await connectFreighter()
      setPublicKey(key)
      setIsConnected(true)

      // Store in localStorage
      localStorage.setItem("stellar_public_key", key)

      // Load balances
      const accountBalances = await getAccountBalances(key)
      setBalances(accountBalances)
    } catch (error) {
      console.error("[v0] Connection error:", error)
      alert("Failed to connect to Freighter wallet. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setPublicKey(null)
    setBalances({})
    setIsConnected(false)
    localStorage.removeItem("stellar_public_key")
  }

  // Auto-reconnect on page load
  useEffect(() => {
    const storedKey = localStorage.getItem("stellar_public_key")
    if (storedKey && isFreighterInstalled()) {
      setPublicKey(storedKey)
      setIsConnected(true)
      getAccountBalances(storedKey)
        .then(setBalances)
        .catch((error) => {
          console.error("[v0] Error loading balances on startup:", error)
          // Still keep the user connected even if balance loading fails
        })
    }
  }, [])

  // Refresh balances every 10 seconds
  useEffect(() => {
    if (!publicKey) return

    const interval = setInterval(() => {
      refreshBalances().catch((error) => {
        console.error("[v0] Error in balance refresh interval:", error)
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [publicKey])

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        balances,
        isConnected,
        isLoading,
        connect,
        disconnect,
        refreshBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}
