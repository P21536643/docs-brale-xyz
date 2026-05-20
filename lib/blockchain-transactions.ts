import * as StellarSdk from "@stellar/stellar-sdk"
import {
  server,
  networkPassphrase,
  ASSETS,
  createPaymentTransaction,
  createSwapTransaction,
  signTransactionWithFreighter,
  submitTransaction,
  getExchangeRate,
  type AssetCode,
} from "./stellar"

export interface TransactionResult {
  success: boolean
  hash?: string
  error?: string
  ledger?: number
}

// Send payment to another address
export const sendPayment = async (
  sourcePublicKey: string,
  destinationAddress: string,
  assetCode: AssetCode,
  amount: string,
): Promise<TransactionResult> => {
  try {
    // Validate destination address
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(destinationAddress)) {
      throw new Error("Invalid destination address")
    }

    const asset = ASSETS[assetCode]
    const xdr = await createPaymentTransaction(sourcePublicKey, destinationAddress, asset, amount)

    const signedXdr = await signTransactionWithFreighter(xdr, networkPassphrase)
    const result = await submitTransaction(signedXdr)

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    }
  } catch (error) {
    console.error("[v0] Send payment error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send payment",
    }
  }
}

// Swap assets using Stellar DEX
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
    const rate = await getExchangeRate(sendAsset, destAsset)
    if (!rate) {
      throw new Error("Unable to get exchange rate")
    }

    // Calculate minimum destination amount with slippage
    const expectedAmount = Number.parseFloat(amount) * rate
    const destMin = (expectedAmount * (1 - slippageTolerance)).toFixed(7)

    const xdr = await createSwapTransaction(sourcePublicKey, sendAsset, amount, destAsset, destMin)

    const signedXdr = await signTransactionWithFreighter(xdr, networkPassphrase)
    const result = await submitTransaction(signedXdr)

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    }
  } catch (error) {
    console.error("[v0] Swap assets error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to swap assets",
    }
  }
}

// Create trustline for non-native assets
export const createTrustline = async (sourcePublicKey: string, asset: StellarSdk.Asset): Promise<TransactionResult> => {
  try {
    const sourceAccount = await server.loadAccount(sourcePublicKey)

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset,
        }),
      )
      .setTimeout(180)
      .build()

    const xdr = transaction.toXDR()
    const signedXdr = await signTransactionWithFreighter(xdr, networkPassphrase)
    const result = await submitTransaction(signedXdr)

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
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
    const account = await server.loadAccount(publicKey)
    const asset = ASSETS[assetCode]

    const hasTrust = account.balances.some((balance) => {
      if (balance.asset_type === "native") return false
      if (!("asset_code" in balance)) return false
      return (
        balance.asset_code === asset.getCode() &&
        "asset_issuer" in balance &&
        balance.asset_issuer === asset.getIssuer()
      )
    })

    return hasTrust
  } catch (error) {
    console.error("[v0] Check trustline error:", error)
    return false
  }
}

// Get transaction details
export const getTransactionDetails = async (hash: string) => {
  try {
    const transaction = await server.transactions().transaction(hash).call()
    return transaction
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

    const rate = await getExchangeRate(base, counter)
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
