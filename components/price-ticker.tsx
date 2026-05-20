"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  type CryptoPrices,
  getInitialPrices,
  simulatePriceUpdate,
  calculate24hChange,
  formatPrice,
  getPriceChangeColor,
  getPriceChangeIcon,
} from "@/lib/prices"

interface PriceTickerProps {
  onPricesUpdate?: (prices: CryptoPrices) => void
}

export function PriceTicker({ onPricesUpdate }: PriceTickerProps) {
  const [prices, setPrices] = useState<CryptoPrices>(getInitialPrices())
  const [priceChanges, setPriceChanges] = useState<Record<string, number>>({})

  useEffect(() => {
    // Update prices every 3 seconds
    const interval = setInterval(() => {
      setPrices((currentPrices) => {
        const newPrices = simulatePriceUpdate(currentPrices)

        // Calculate price changes for animation
        const changes: Record<string, number> = {}
        Object.keys(newPrices).forEach((currency) => {
          const key = currency as keyof CryptoPrices
          changes[currency] = newPrices[key] - currentPrices[key]
        })
        setPriceChanges(changes)

        // Notify parent component of price update
        if (onPricesUpdate) {
          onPricesUpdate(newPrices)
        }

        return newPrices
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [onPricesUpdate])

  return (
    <Card className="border-slate-800 bg-slate-950/50 backdrop-blur overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <h3 className="text-sm font-medium text-white">Live Market Prices</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-800">
        {Object.entries(prices).map(([currency, price]) => {
          const change24h = calculate24hChange(currency as keyof CryptoPrices)
          const priceChange = priceChanges[currency] || 0
          const changeColor = getPriceChangeColor(change24h)
          const changeIcon = getPriceChangeIcon(change24h)

          return (
            <div key={currency} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{currency}</span>
                {changeIcon === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="space-y-1">
                <p
                  className={`text-lg font-bold text-white transition-all ${
                    priceChange !== 0
                      ? priceChange > 0
                        ? "animate-pulse text-green-400"
                        : "animate-pulse text-red-400"
                      : ""
                  }`}
                >
                  {formatPrice(price)}
                </p>
                <p className={`text-xs ${changeColor}`}>
                  {change24h >= 0 ? "+" : ""}
                  {change24h.toFixed(2)}%
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
