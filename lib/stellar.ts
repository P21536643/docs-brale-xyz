// Stellar Mainnet configuration
export const HORIZON_URL = "https://horizon.stellar.org"
export const NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015"

// Pi Network token on Stellar
export const PI_ASSET_ISSUER = "GBHUSIZH7HGO2NKIDJJHUMDPJQJKPV3PHJD52XLMSNZ6KMZ7ZQ5RG34K"
export const PI_ASSET_CODE = "PI"

// Common assets on Stellar
export const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
export const USDC_CODE = "USDC"

export const USDT_ISSUER = "GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V"
export const USDT_CODE = "USDT"

export const ASSETS = {
  XLM: { code: "XLM", issuer: null },
  PI: { code: PI_ASSET_CODE, issuer: PI_ASSET_ISSUER },
  USDC: { code: USDC_CODE, issuer: USDC_ISSUER },
  USDT: { code: USDT_CODE, issuer: USDT_ISSUER },
}

export type AssetCode = keyof typeof ASSETS

// Add type declarations for Freighter
declare global {
  interface Window {
    freighter: {
      getPublicKey: () => Promise<string>
      signTransaction: (xdr: string, options: { networkPassphrase: string }) => Promise<string>
      isConnected: () => Promise<boolean>
    }
  }
}

// Check if Freighter wallet is installed
export const isFreighterInstalled = () => {
  return typeof window !== "undefined" && "freighter" in window
}

// Connect to Freighter wallet
export const connectFreighter = async (): Promise<string> => {
  if (!isFreighterInstalled()) {
    throw new Error("Freighter wallet is not installed. Please install it from https://freighter.app")
  }

  try {
    const publicKey = await window.freighter.getPublicKey()
    if (!publicKey) {
      throw new Error("Failed to get public key from Freighter")
    }
    return publicKey
  } catch (error) {
    console.error("[v0] Freighter connection error:", error)
    throw new Error("Failed to connect to Freighter wallet")
  }
}

// Sign transaction with Freighter
export const signTransaction = async (xdr: string): Promise<string> => {
  if (!isFreighterInstalled()) {
    throw new Error("Freighter wallet is not installed")
  }

  try {
    const signedXdr = await window.freighter.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    })
    return signedXdr
  } catch (error) {
    console.error("[v0] Freighter signing error:", error)
    throw new Error("Failed to sign transaction with Freighter")
  }
}

// Get account balances from Stellar via Horizon API
export const getAccountBalances = async (publicKey: string) => {
  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`)
    if (!response.ok) {
      throw new Error("Account not found")
    }
    const account = await response.json()
    const balances: Record<string, string> = {}

    account.balances.forEach((balance: { asset_type: string; balance: string; asset_code?: string }) => {
      if (balance.asset_type === "native") {
        balances["XLM"] = balance.balance
      } else if (balance.asset_code) {
        balances[balance.asset_code] = balance.balance
      }
    })

    return balances
  } catch (error) {
    console.error("[v0] Error loading account:", error)
    throw new Error("Failed to load account balances")
  }
}

// Get recent transactions from Horizon API
export const getRecentTransactions = async (publicKey: string, limit = 20) => {
  try {
    const response = await fetch(
      `${HORIZON_URL}/accounts/${publicKey}/transactions?order=desc&limit=${limit}`,
    )
    if (!response.ok) {
      throw new Error("Failed to fetch transactions")
    }
    const data = await response.json()
    return data.records || []
  } catch (error) {
    console.error("[v0] Error loading transactions:", error)
    throw new Error("Failed to load transactions")
  }
}

// Get current exchange rates from Stellar DEX via Horizon API
export const getExchangeRate = async (
  baseCode: string,
  baseIssuer: string | null,
  counterCode: string,
  counterIssuer: string | null,
) => {
  try {
    const response = await fetch(
      `${HORIZON_URL}/order_book?selling_asset_type=${baseIssuer ? "credit_alphanum12" : "native"}&selling_asset_code=${baseCode}${baseIssuer ? `&selling_asset_issuer=${baseIssuer}` : ""}&buying_asset_type=${counterIssuer ? "credit_alphanum12" : "native"}&buying_asset_code=${counterCode}${counterIssuer ? `&buying_asset_issuer=${counterIssuer}` : ""}`,
    )
    if (!response.ok) {
      throw new Error("No orderbook available")
    }
    const data = await response.json()

    if (data.bids && data.bids.length > 0) {
      return Number.parseFloat(data.bids[0].price)
    }
    return null
  } catch (error) {
    console.error("[v0] Error getting exchange rate:", error)
    return null
  }
}
