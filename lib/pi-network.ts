// Pi Network SDK Integration
// Make sure the Pi Network SDK is loaded from layout.tsx

export interface PiUser {
  uid: string
  username: string
  firstName: string
  lastName: string
  email?: string
  avatar?: string
}

export interface PiPaymentDto {
  amount: number
  memo?: string
  metadata?: Record<string, string>
}

export interface PiAuthResult {
  success: boolean
  user?: PiUser
  error?: string
  token?: string
}

// Declare Pi global type
declare global {
  interface Window {
    Pi?: {
      init(options: { version: string; sandbox: boolean }): void
      authenticate(): Promise<{ accessToken: string; user: PiUser }>
      requestPayment(paymentDto: PiPaymentDto, metadata?: Record<string, string>): Promise<{ identifier: string }>
      requestTransfer(paymentDto: PiPaymentDto, metadata?: Record<string, string>): Promise<{ identifier: string }>
      getUserID(): Promise<string>
      shareDialog(): Promise<{ requestId: string }>
      logout(): Promise<void>
    }
  }
}

// Check if Pi SDK is available
export const isPiSdkAvailable = (): boolean => {
  return typeof window !== "undefined" && window.Pi !== undefined
}

// Initialize Pi Network SDK
export const initializePiSdk = () => {
  if (!isPiSdkAvailable()) {
    console.warn("[v0] Pi Network SDK not loaded. Make sure the SDK script is included in your HTML.")
    return
  }

  if (window.Pi) {
    window.Pi.init({
      version: "2.0",
      sandbox: false, // Set to true for sandbox testing
    })
    console.log("[v0] Pi Network SDK initialized")
  }
}

// Authenticate with Pi Network
export const authenticateWithPi = async (): Promise<PiAuthResult> => {
  try {
    if (!isPiSdkAvailable()) {
      return {
        success: false,
        error: "Pi Network SDK is not available. Please ensure the SDK is loaded.",
      }
    }

    if (!window.Pi) {
      return {
        success: false,
        error: "Pi Network SDK is not initialized.",
      }
    }

    // Initialize SDK if not done already
    initializePiSdk()

    const result = await window.Pi.authenticate()

    if (result && result.user) {
      // Store auth data
      const authData = {
        user: result.user,
        token: result.accessToken,
        timestamp: Date.now(),
      }
      localStorage.setItem("pi_auth", JSON.stringify(authData))
      console.log("[v0] Authenticated as Pi user:", result.user.username)

      return {
        success: true,
        user: result.user,
        token: result.accessToken,
      }
    }

    return {
      success: false,
      error: "Authentication failed. User data not received.",
    }
  } catch (error) {
    console.error("[v0] Pi Network authentication error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to authenticate with Pi Network",
    }
  }
}

// Check if user is authenticated with Pi
export const isAuthenticatedWithPi = (): boolean => {
  if (typeof window === "undefined") return false

  const piAuth = localStorage.getItem("pi_auth")
  if (!piAuth) return false

  try {
    const authData = JSON.parse(piAuth)
    // Check if auth is still valid (24 hour expiration)
    const age = Date.now() - authData.timestamp
    return age < 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  } catch {
    return false
  }
}

// Get stored Pi authentication data
export const getStoredPiAuth = (): { user: PiUser; token: string } | null => {
  if (typeof window === "undefined") return null

  const piAuth = localStorage.getItem("pi_auth")
  if (!piAuth) return null

  try {
    return JSON.parse(piAuth)
  } catch {
    return null
  }
}

// Logout from Pi Network
export const logoutFromPi = () => {
  if (isPiSdkAvailable() && window.Pi) {
    window.Pi.logout().catch((error) => {
      console.error("[v0] Error logging out from Pi Network:", error)
    })
  }

  localStorage.removeItem("pi_auth")
  console.log("[v0] Logged out from Pi Network")
}

// Request a payment from Pi Network user
export const requestPiPayment = async (amount: number, memo?: string): Promise<string | null> => {
  try {
    if (!isPiSdkAvailable() || !window.Pi) {
      throw new Error("Pi Network SDK is not available")
    }

    const paymentDto: PiPaymentDto = {
      amount,
      memo,
    }

    const payment = await window.Pi.requestPayment(paymentDto)
    console.log("[v0] Payment requested with identifier:", payment.identifier)

    return payment.identifier
  } catch (error) {
    console.error("[v0] Pi payment request error:", error)
    return null
  }
}

// Request a transfer from Pi Network user
export const requestPiTransfer = async (amount: number, memo?: string): Promise<string | null> => {
  try {
    if (!isPiSdkAvailable() || !window.Pi) {
      throw new Error("Pi Network SDK is not available")
    }

    const paymentDto: PiPaymentDto = {
      amount,
      memo,
    }

    const transfer = await window.Pi.requestTransfer(paymentDto)
    console.log("[v0] Transfer requested with identifier:", transfer.identifier)

    return transfer.identifier
  } catch (error) {
    console.error("[v0] Pi transfer request error:", error)
    return null
  }
}

// Get Pi user ID
export const getPiUserId = async (): Promise<string | null> => {
  try {
    if (!isPiSdkAvailable() || !window.Pi) {
      throw new Error("Pi Network SDK is not available")
    }

    const userId = await window.Pi.getUserID()
    return userId
  } catch (error) {
    console.error("[v0] Error getting Pi user ID:", error)
    return null
  }
}
