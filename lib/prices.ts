"use client"

export interface CryptoPrices {
  PI: number
  BTC: number
  ETH: number
  USDT: number
  BNB: number
}

// Base prices for simulation
const BASE_PRICES: CryptoPrices = {
  PI: 0.5,
  BTC: 45000,
  ETH: 2500,
  USDT: 1,
  BNB: 300,
}

// Generate realistic price fluctuations
export function simulatePriceUpdate(currentPrices: CryptoPrices): CryptoPrices {
  const newPrices = { ...currentPrices }

  // Each currency has different volatility
  const volatility = {
    PI: 0.02, // 2% max change
    BTC: 0.015, // 1.5% max change
    ETH: 0.018, // 1.8% max change
    USDT: 0.001, // 0.1% max change (stablecoin)
    BNB: 0.016, // 1.6% max change
  }

  // Update each price with random fluctuation
  Object.keys(newPrices).forEach((currency) => {
    const key = currency as keyof CryptoPrices
    const currentPrice = newPrices[key]
    const maxChange = currentPrice * volatility[key]

    // Random change between -maxChange and +maxChange
    const change = (Math.random() - 0.5) * 2 * maxChange
    newPrices[key] = Math.max(0, currentPrice + change)
  })

  return newPrices
}

// Calculate 24h price change percentage
export function calculate24hChange(currency: keyof CryptoPrices): number {
  // Simulate realistic 24h changes
  const changes = {
    PI: 5.24,
    BTC: 2.15,
    ETH: -1.32,
    USDT: 0.01,
    BNB: 3.47,
  }

  return changes[currency]
}

// Get initial prices
export function getInitialPrices(): CryptoPrices {
  return { ...BASE_PRICES }
}

// Format price for display
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(price)
}

// Calculate price change indicator
export function getPriceChangeColor(change: number): string {
  return change >= 0 ? "text-green-400" : "text-red-400"
}

export function getPriceChangeIcon(change: number): "up" | "down" {
  return change >= 0 ? "up" : "down"
}
