import { ASSETS, getExchangeRate, getAccountBalances, type AssetCode } from "./stellar"

export interface TransactionResult {
  success: boolean
  hash?: string
  error?: string
  ledger?: number
}

// Validate Stellar address
const isValidStellarAddress = (address: string): boolean => {
  // Stellar addresses start with 'G' and are 56 characters long
  return /^G[A-Z2-7]{55}$/.test(address)
}

// Send payment to another address (simulated - requires Freighter signing)
export const sendPayment = async (
  sourcePublicKey: string,
  destinationAddress: string,
  assetCode: AssetCode,
  amount: string,
): Promise<TransactionResult> => {
  try {
    // Validate destination address
    if (!isValidStellarAddress(destinationAddress)) {
      throw new Error("Invalid destination address")
    }

    // Get asset details
    const asset = ASSETS[assetCode]

    // Simulate transaction (in production, would build actual Stellar transaction)
    const hash = Math.random().toString(16).slice(2, 66)

    console.log("[v0] Payment sent:", {
      from: sourcePublicKey,
      to: destinationAddress,
      asset: assetCode,
      amount,
      hash,
    })

    return {
      success: true,
      hash,
      ledger: Math.floor(Math.random() * 1000000),
    }
  } catch (error) {
    console.error("[v0] Send payment error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send payment",
    }
  }
}

// Swap assets using Stellar DEX (simulated)
export const swapAssets = async (
  sourcePublicKey: string,
  fromAsset: AssetCode,
  toAsset: AssetCode,
  amount: string,
  slippageTolerance = 0.01, // 1% slippage
): Promise<TransactionResult> => {
  try {
    const sendAsset = ASSETS[fromAsset]
    const destAsset = ASSETS[toAsset]

    // Get current exchange rate
    const rate = await getExchangeRate(
      sendAsset.code,
      sendAsset.issuer,
      destAsset.code,
      destAsset.issuer,
    )
    if (!rate) {
      throw new Error("Unable to get exchange rate")
    }

    // Calculate minimum destination amount with slippage
    const expectedAmount = Number.parseFloat(amount) * rate
    const destMin = (expectedAmount * (1 - slippageTolerance)).toFixed(7)

    // Simulate swap transaction
    const hash = Math.random().toString(16).slice(2, 66)

    console.log("[v0] Swap executed:", {
      from: sourcePublicKey,
      sendAsset: fromAsset,
      sendAmount: amount,
      destAsset: toAsset,
      expectedAmount,
      destMin,
      rate,
      hash,
    })

    return {
      success: true,
      hash,
      ledger: Math.floor(Math.random() * 1000000),
    }
  } catch (error) {
    console.error("[v0] Swap assets error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to swap assets",
    }
  }
}

// Create trustline for non-native assets (simulated)
export const createTrustline = async (sourcePublicKey: string, assetCode: AssetCode): Promise<TransactionResult> => {
  try {
    if (assetCode === "XLM") {
      throw new Error("XLM does not require a trustline")
    }

    // Simulate trustline creation
    const hash = Math.random().toString(16).slice(2, 66)

    console.log("[v0] Trustline created for", assetCode, "at", hash)

    return {
      success: true,
      hash,
      ledger: Math.floor(Math.random() * 1000000),
    }
  } catch (error) {
    console.error("[v0] Create trustline error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create trustline",
    }
  }
}

// Check if account has trustline for asset
export const hasTrustline = async (publicKey: string, assetCode: AssetCode): Promise<boolean> => {
  if (assetCode === "XLM") return true // Native asset doesn't need trustline

  try {
    const balances = await getAccountBalances(publicKey)
    return assetCode in balances
  } catch (error) {
    console.error("[v0] Check trustline error:", error)
    return false
  }
}

// Get transaction details from Horizon API
export const getTransactionDetails = async (hash: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_HORIZON_URL || "https://horizon.stellar.org"}/transactions/${hash}`)
    if (!response.ok) {
      throw new Error("Transaction not found")
    }
    return await response.json()
  } catch (error) {
    console.error("[v0] Get transaction details error:", error)
    throw new Error("Failed to get transaction details")
  }
}

// Get current market price from Stellar DEX
export const getMarketPrice = async (baseAsset: AssetCode, counterAsset: AssetCode): Promise<number | null> => {
  try {
    const base = ASSETS[baseAsset]
    const counter = ASSETS[counterAsset]

    const rate = await getExchangeRate(base.code, base.issuer, counter.code, counter.issuer)
    return rate
  } catch (error) {
    console.error("[v0] Get market price error:", error)
    return null
  }
}

// Calculate swap preview
export const calculateSwapPreview = async (
  fromAsset: AssetCode,
  toAsset: AssetCode,
  amount: string,
): Promise<{
  estimatedAmount: string
  rate: number
  fee: string
} | null> => {
  try {
    const rate = await getMarketPrice(fromAsset, toAsset)
    if (!rate) return null

    const amountNum = Number.parseFloat(amount)
    const estimatedAmount = (amountNum * rate).toFixed(7)
    const fee = "0.00001" // Base fee in XLM

    return {
      estimatedAmount,
      rate,
      fee,
    }
  } catch (error) {
    console.error("[v0] Calculate swap preview error:", error)
    return null
  }
}
