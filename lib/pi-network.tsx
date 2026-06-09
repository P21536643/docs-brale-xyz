// Pi Network Authentication Integration
// This connects to the Pi Network SDK for user authentication

export interface PiUser {
  uid: string
  username: string
  firstName: string
  lastName: string
  phoneNumber: string
  avatar: string
  walletAddress?: string
}

export interface PiAuthResult {
  user: PiUser
  accessToken: string
  success: boolean
  error?: string
}

// Check if Pi Network SDK is available
export const isPiNetworkAvailable = (): boolean => {
  if (typeof window === "undefined") return false
  return !!(window as any).Pi
}

// Initialize Pi Network SDK
export const initPiNetwork = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false

  try {
    // Check if Pi is already available
    if (isPiNetworkAvailable()) {
      console.log("[v0] Pi Network SDK already available")
      return true
    }

    // Pi Network SDK script should be loaded from Pi Network CDN
    // Add this to your HTML head: <script src="https://sdk.minepi.com/pi-sdk.js"></script>
    console.log("[v0] Waiting for Pi Network SDK to load...")

    // Wait for Pi to be available (with timeout)
    let attempts = 0
    const maxAttempts = 50 // 5 seconds with 100ms intervals
    while (!isPiNetworkAvailable() && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    if (isPiNetworkAvailable()) {
      console.log("[v0] Pi Network SDK loaded successfully")
      return true
    }

    console.error("[v0] Pi Network SDK failed to load")
    return false
  } catch (error) {
    console.error("[v0] Error initializing Pi Network:", error)
    return false
  }
}

// Authenticate with Pi Network
export const authenticateWithPi = async (): Promise<PiAuthResult> => {
  try {
    if (!isPiNetworkAvailable()) {
      const initialized = await initPiNetwork()
      if (!initialized) {
        return {
          success: false,
          user: {} as PiUser,
          accessToken: "",
          error: "Pi Network SDK not available. Please ensure the Pi Network app is running.",
        }
      }
    }

    const Pi = (window as any).Pi

    // Authenticate the user
    console.log("[v0] Starting Pi Network authentication...")

    await Pi.authenticate(
      ["username", "payments"],
      onIncompletePaymentFound,
    )

    // Get authenticated user info
    const user: PiUser = await Pi.user.getProfile()

    // Get access token for future requests
    const accessToken = await Pi.auth.token

    console.log("[v0] Pi Network authentication successful:", user.username)

    // Store authentication in localStorage
    localStorage.setItem(
      "pi_auth",
      JSON.stringify({
        user,
        accessToken,
        timestamp: Date.now(),
      }),
    )

    return {
      success: true,
      user,
      accessToken,
    }
  } catch (error) {
    console.error("[v0] Pi Network authentication error:", error)
    return {
      success: false,
      user: {} as PiUser,
      accessToken: "",
      error: error instanceof Error ? error.message : "Authentication failed",
    }
  }
}

// Handle incomplete payments from previous sessions
const onIncompletePaymentFound = async (payment: any) => {
  console.log("[v0] Incomplete payment found:", payment)
  // Handle incomplete payment recovery if needed
}

// Get user's Pi wallet address
export const getPiWalletAddress = async (): Promise<string | null> => {
  try {
    if (!isPiNetworkAvailable()) {
      return null
    }

    const Pi = (window as any).Pi
    const user: PiUser = await Pi.user.getProfile()

    return user.walletAddress || null
  } catch (error) {
    console.error("[v0] Error getting Pi wallet address:", error)
    return null
  }
}

// Create a payment on Pi Network
export const createPiPayment = async (
  amount: number,
  memo: string,
  metadata?: Record<string, string>,
) => {
  try {
    if (!isPiNetworkAvailable()) {
      throw new Error("Pi Network SDK not available")
    }

    const Pi = (window as any).Pi

    const payment = await Pi.createPayment(
      {
        amount,
        memo,
        metadata: metadata || {},
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[v0] Payment ready for approval:", paymentId)
          // Send to your backend to verify and approve
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("[v0] Payment ready for completion:", paymentId, txid)
          // Complete payment on your backend
        },
        onCancel: (paymentId: string) => {
          console.log("[v0] Payment cancelled:", paymentId)
        },
        onError: (error: Error, payment: any) => {
          console.error("[v0] Payment error:", error, payment)
        },
      },
    )

    return payment
  } catch (error) {
    console.error("[v0] Error creating Pi payment:", error)
    throw error
  }
}

// Check if user is authenticated
export const isAuthenticatedWithPi = (): boolean => {
  if (typeof window === "undefined") return false

  const storedAuth = localStorage.getItem("pi_auth")
  if (!storedAuth) return false

  try {
    const authData = JSON.parse(storedAuth)
    // Check if auth is not too old (24 hours)
    const isExpired = Date.now() - authData.timestamp > 24 * 60 * 60 * 1000
    return !isExpired && !!authData.user?.uid
  } catch {
    return false
  }
}

// Get stored Pi authentication
export const getStoredPiAuth = (): PiAuthResult | null => {
  if (typeof window === "undefined") return null

  const storedAuth = localStorage.getItem("pi_auth")
  if (!storedAuth) return null

  try {
    const authData = JSON.parse(storedAuth)
    return {
      success: true,
      user: authData.user,
      accessToken: authData.accessToken,
    }
  } catch {
    return null
  }
}

// Logout from Pi Network
export const logoutFromPi = (): void => {
  localStorage.removeItem("pi_auth")
  console.log("[v0] Pi Network logout successful")
}
