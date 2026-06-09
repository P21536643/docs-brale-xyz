// Local Pi Network Authentication (No External API Required)

export interface PiUser {
  uid: string
  username: string
  email: string
}

export interface PiAuthResult {
  success: boolean
  user?: PiUser
  error?: string
}

// Simple password hashing (for demo purposes)
const hashPassword = (password: string): string => {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

// Generate unique user ID
const generateUid = (): string => {
  return "pi_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// Local user database (stored in localStorage)
interface StoredUser {
  uid: string
  username: string
  email: string
  passwordHash: string
}

const getStoredUsers = (): Record<string, StoredUser> => {
  if (typeof window === "undefined") return {}
  const users = localStorage.getItem("pi_users")
  return users ? JSON.parse(users) : {}
}

const saveStoredUsers = (users: Record<string, StoredUser>) => {
  if (typeof window === "undefined") return
  localStorage.setItem("pi_users", JSON.stringify(users))
}

// Register a new user
export const registerPiUser = async (username: string, email: string, password: string): Promise<PiAuthResult> => {
  try {
    // Validate inputs
    if (!username || username.length < 3) {
      return { success: false, error: "Username must be at least 3 characters" }
    }
    if (!email || !email.includes("@")) {
      return { success: false, error: "Invalid email address" }
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" }
    }

    const users = getStoredUsers()

    // Check if username already exists
    const usernameExists = Object.values(users).some((u) => u.username === username)
    if (usernameExists) {
      return { success: false, error: "Username already exists" }
    }

    // Check if email already exists
    const emailExists = Object.values(users).some((u) => u.email === email)
    if (emailExists) {
      return { success: false, error: "Email already registered" }
    }

    // Create new user
    const uid = generateUid()
    const newUser: StoredUser = {
      uid,
      username,
      email,
      passwordHash: hashPassword(password),
    }

    users[uid] = newUser
    saveStoredUsers(users)

    // Auto-login after registration
    const sessionData = {
      user: { uid, username, email },
      timestamp: Date.now(),
    }
    localStorage.setItem("pi_session", JSON.stringify(sessionData))

    console.log("[v0] User registered and logged in:", username)

    return {
      success: true,
      user: { uid, username, email },
    }
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    }
  }
}

// Login with username and password
export const authenticateWithPi = async (username: string, password: string): Promise<PiAuthResult> => {
  try {
    const users = getStoredUsers()

    // Find user by username
    const user = Object.values(users).find((u) => u.username === username)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Verify password
    const passwordHash = hashPassword(password)
    if (passwordHash !== user.passwordHash) {
      return { success: false, error: "Invalid password" }
    }

    // Create session
    const sessionData = {
      user: { uid: user.uid, username: user.username, email: user.email },
      timestamp: Date.now(),
    }
    localStorage.setItem("pi_session", JSON.stringify(sessionData))

    console.log("[v0] Authenticated as Pi user:", username)

    return {
      success: true,
      user: { uid: user.uid, username: user.username, email: user.email },
    }
  } catch (error) {
    console.error("[v0] Pi Network authentication error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to authenticate",
    }
  }
}

// Check if user is authenticated
export const isAuthenticatedWithPi = (): boolean => {
  if (typeof window === "undefined") return false

  const session = localStorage.getItem("pi_session")
  if (!session) return false

  try {
    const sessionData = JSON.parse(session)
    // Check if session is still valid (24 hour expiration)
    const age = Date.now() - sessionData.timestamp
    return age < 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  } catch {
    return false
  }
}

// Get stored authentication data
export const getStoredPiAuth = (): { user: PiUser } | null => {
  if (typeof window === "undefined") return null

  const session = localStorage.getItem("pi_session")
  if (!session) return null

  try {
    const sessionData = JSON.parse(session)
    return { user: sessionData.user }
  } catch {
    return null
  }
}

// Logout
export const logoutFromPi = () => {
  if (typeof window === "undefined") return

  localStorage.removeItem("pi_session")
  console.log("[v0] Logged out from Pi Network")
}

// Check if user exists
export const userExists = (username: string): boolean => {
  const users = getStoredUsers()
  return Object.values(users).some((u) => u.username === username)
}
