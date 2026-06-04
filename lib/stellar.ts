import { Server, Asset, Networks, Operation, TransactionBuilder, BASE_FEE } from "@stellar/stellar-sdk"

// Stellar Mainnet configuration
export const server = new Server("https://horizon.stellar.org")
export const networkPassphrase = Networks.PUBLIC

// Pi Network token on Stellar (you'll need to verify the actual asset issuer)
// This is a placeholder - replace with actual Pi Network asset issuer on Stellar
export const PI_ASSET_ISSUER = "GBHUSIZH7HGO2NKIDJJHUMDPJQJKPV3PHJD52XLMSNZ6KMZ7ZQ5RG34K" // Replace with real issuer
export const PI_ASSET = new Asset("PI", PI_ASSET_ISSUER)

// Common assets on Stellar
export const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
export const USDT_ISSUER = "GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V"

export const ASSETS = {
  XLM: Asset.native(),
  PI: PI_ASSET,
  USDC: new Asset("USDC", USDC_ISSUER),
  USDT: new Asset("USDT", USDT_ISSUER),
}

export type AssetCode = keyof typeof ASSETS

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
export const signTransactionWithFreighter = async (xdr: string, networkPassphrase: string): Promise<string> => {
  if (!isFreighterInstalled()) {
    throw new Error("Freighter wallet is not installed")
  }

  try {
    const signedXdr = await window.freighter.signTransaction(xdr, {
      networkPassphrase,
    })
    return signedXdr
  } catch (error) {
    console.error("[v0] Freighter signing error:", error)
    throw new Error("Failed to sign transaction with Freighter")
  }
}

// Get account balances from Stellar
export const getAccountBalances = async (publicKey: string) => {
  try {
    const account = await server.loadAccount(publicKey)
    const balances: Record<string, string> = {}

    account.balances.forEach((balance) => {
      if (balance.asset_type === "native") {
        balances["XLM"] = balance.balance
      } else if ("asset_code" in balance && "asset_issuer" in balance) {
        balances[balance.asset_code] = balance.balance
      }
    })

    return balances
  } catch (error) {
    console.error("[v0] Error loading account:", error)
    throw new Error("Failed to load account balances")
  }
}

// Get recent transactions
export const getRecentTransactions = async (publicKey: string, limit = 20) => {
  try {
    const transactions = await server.transactions().forAccount(publicKey).order("desc").limit(limit).call()

    return transactions.records
  } catch (error) {
    console.error("[v0] Error loading transactions:", error)
    throw new Error("Failed to load transactions")
  }
}

// Create payment transaction
export const createPaymentTransaction = async (
  sourcePublicKey: string,
  destinationPublicKey: string,
  asset: Asset,
  amount: string,
) => {
  try {
    const sourceAccount = await server.loadAccount(sourcePublicKey)

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset,
          amount,
        }),
      )
      .setTimeout(180)
      .build()

    return transaction.toXDR()
  } catch (error) {
    console.error("[v0] Error creating payment transaction:", error)
    throw new Error("Failed to create payment transaction")
  }
}

// Submit signed transaction
export const submitTransaction = async (signedXdr: string) => {
  try {
    const transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
    const result = await server.submitTransaction(transaction)
    return result
  } catch (error) {
    console.error("[v0] Error submitting transaction:", error)
    throw new Error("Failed to submit transaction")
  }
}

// Get current exchange rates from Stellar DEX
export const getExchangeRate = async (baseAsset: Asset, counterAsset: Asset) => {
  try {
    const orderbook = await server.orderbook(baseAsset, counterAsset).call()

    if (orderbook.bids.length === 0) {
      throw new Error("No bids available")
    }

    const bestBid = orderbook.bids[0]
    return Number.parseFloat(bestBid.price)
  } catch (error) {
    console.error("[v0] Error getting exchange rate:", error)
    return null
  }
}

// Create swap transaction using Stellar DEX
export const createSwapTransaction = async (
  sourcePublicKey: string,
  sendAsset: Asset,
  sendAmount: string,
  destAsset: Asset,
  destMin: string,
) => {
  try {
    const sourceAccount = await server.loadAccount(sourcePublicKey)

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset,
          sendAmount,
          destination: sourcePublicKey, // Send to self for swap
          destAsset,
          destMin,
        }),
      )
      .setTimeout(180)
      .build()

    return transaction.toXDR()
  } catch (error) {
    console.error("[v0] Error creating swap transaction:", error)
    throw new Error("Failed to create swap transaction")
  }
}

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
