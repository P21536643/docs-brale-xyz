"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { connectFreighter, getAccountBalances, isFreighterInstalled } from "./stellar"
import { authenticateWithPi, isAuthenticatedWithPi, getStoredPiAuth, logoutFromPi, type PiUser } from "./pi-network"

interface WalletContextType {
  publicKey: string | null
  balances: Record<string, string>
  isConnected: boolean
  isLoading: boolean
  piUser: PiUser | null
  authMethod: "pi" | "freighter" | null
  connect: (method: "pi" | "freighter") => Promise<void>
  disconnect: () => void
  refreshBalances: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [piUser, setPiUser] = useState<PiUser | null>(null)
  const [authMethod, setAuthMethod] = useState<"pi" | "freighter" | null>(null)

  const refreshBalances = async () => {
    if (!publicKey) return

    try {
      const accountBalances = await getAccountBalances(publicKey)
      setBalances(accountBalances)
    } catch (error) {
      console.error("[v0] Error refreshing balances:", error)
    }
  }

  const connect = async (method: "pi" | "freighter") => {
    setIsLoading(true)
    try {
      if (method === "pi") {
        const result = await authenticateWithPi()
        if (result.success) {
          setPiUser(result.user)
          setAuthMethod("pi")
          setIsConnected(true)
          console.log("[v0] Pi Network authentication successful")
        } else {
          alert(result.error || "Failed to authenticate with Pi Network")
        }
      } else {
        // Freighter connection
        if (!isFreighterInstalled()) {
          alert("Please install Freighter wallet extension to continue. Visit https://freighter.app")
          window.open("https://freighter.app", "_blank")
          return
        }

        const key = await connectFreighter()
        setPublicKey(key)
        setAuthMethod("freighter")
        setIsConnected(true)

        // Store in localStorage
        localStorage.setItem("stellar_public_key", key)

        // Load balances
        const accountBalances = await getAccountBalances(key)
        setBalances(accountBalances)
      }
    } catch (error) {
      console.error("[v0] Connection error:", error)
      alert("Failed to connect. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setPublicKey(null)
    setBalances({})
    setIsConnected(false)
    setPiUser(null)
    setAuthMethod(null)
    localStorage.removeItem("stellar_public_key")
    logoutFromPi()
  }

  // Auto-reconnect on page load
  useEffect(() => {
    // Check Pi Network auth first
    if (isAuthenticatedWithPi()) {
      const piAuth = getStoredPiAuth()
      if (piAuth) {
        setPiUser(piAuth.user)
        setAuthMethod("pi")
        setIsConnected(true)
        console.log("[v0] Auto-reconnected with Pi Network as", piAuth.user.username)
      }
    }

    // Check Freighter auth
    const storedKey = localStorage.getItem("stellar_public_key")
    if (storedKey && isFreighterInstalled()) {
      setPublicKey(storedKey)
      setAuthMethod("freighter")
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
        piUser,
        authMethod,
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
