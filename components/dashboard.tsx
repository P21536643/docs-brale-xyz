"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/lib/wallet-context"
import { ArrowDownLeft, RefreshCw, Send, LogOut, Wallet, TrendingUp, Copy, Check } from "lucide-react"
import { TransactionForms } from "@/components/transaction-forms"
import { TransactionHistory } from "@/components/transaction-history"
import { getMarketPrice, type AssetCode } from "@/lib/blockchain-transactions"

export function Dashboard() {
  const { publicKey, balances, disconnect, refreshBalances } = useWallet()
  const [activeTab, setActiveTab] = useState("overview")
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const loadPrices = async () => {
      const priceMap: Record<string, number> = {}

      // Get XLM price (using USDC as counter)
      const xlmPrice = await getMarketPrice("XLM" as AssetCode, "USDC" as AssetCode)
      if (xlmPrice) priceMap["XLM"] = xlmPrice

      // Get PI price if available
      const piPrice = await getMarketPrice("PI" as AssetCode, "USDC" as AssetCode)
      if (piPrice) priceMap["PI"] = piPrice

      // Set USDC as 1:1 with USD
      priceMap["USDC"] = 1.0
      priceMap["USDT"] = 1.0

      setPrices(priceMap)
    }

    loadPrices()
    const interval = setInterval(loadPrices, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    setIsRefreshing(false)
  }

  const handleSignOut = () => {
    disconnect()
  }

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const calculateTotalValue = (): number => {
    return Object.entries(balances).reduce((total, [currency, amount]) => {
      const price = prices[currency] || 0
      return total + Number.parseFloat(amount) * price
    }, 0)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatCryptoAmount = (amount: string | number, decimals = 4): string => {
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return num.toFixed(decimals)
  }

  const calculateUSDValue = (currency: string, amount: string): string => {
    const price = prices[currency] || 0
    const usdValue = Number.parseFloat(amount) * price
    return formatCurrency(usdValue)
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <span className="text-white font-bold text-xl">π</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Pi Exchange</h1>
                <p className="text-sm text-purple-300">Stellar Blockchain</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                <Wallet className="w-4 h-4 text-purple-300" />
                <span className="text-sm text-white font-mono">{publicKey && shortenAddress(publicKey)}</span>
                <Button size="sm" variant="ghost" onClick={copyAddress} className="h-6 w-6 p-0 hover:bg-white/20">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-purple-300" />}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-white bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-white bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-black/30 border border-purple-800/30">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="trade"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trade
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Portfolio Summary */}
            <Card className="border-purple-800/30 bg-black/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Total Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {formatCurrency(calculateTotalValue())}
                  </p>
                  <p className="text-sm text-purple-300">Calculated from Stellar DEX prices</p>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(balances).length === 0 ? (
                <Card className="border-purple-800/30 bg-black/30 backdrop-blur-xl col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-purple-300">
                      No assets found in your wallet. Add trustlines or fund your account.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(balances).map(([currency, amount]) => (
                  <Card
                    key={currency}
                    className="border-purple-800/30 bg-black/30 backdrop-blur-xl hover:bg-black/40 transition-colors"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                            <span className="text-white font-bold">{currency.slice(0, 3)}</span>
                          </div>
                          <div>
                            <p className="text-sm text-purple-300">{currency}</p>
                            <p className="text-xl font-bold text-white">{formatCryptoAmount(amount)}</p>
                            <p className="text-xs text-purple-400">{calculateUSDValue(currency, amount)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Quick Actions */}
            <Card className="border-purple-800/30 bg-black/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setActiveTab("trade")}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex-col h-auto py-6 shadow-lg hover:shadow-green-500/50 transition-all"
                  >
                    <ArrowDownLeft className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Receive</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("trade")}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-col h-auto py-6 shadow-lg hover:shadow-purple-500/50 transition-all"
                  >
                    <RefreshCw className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Swap</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("trade")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white flex-col h-auto py-6 shadow-lg hover:shadow-blue-500/50 transition-all"
                  >
                    <Send className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Send</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("trade")}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white flex-col h-auto py-6 shadow-lg hover:shadow-amber-500/50 transition-all"
                  >
                    <TrendingUp className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Trustline</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Tab */}
          <TabsContent value="trade">
            {publicKey && <TransactionForms publicKey={publicKey} balances={balances} onSuccess={handleRefresh} />}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">{publicKey && <TransactionHistory publicKey={publicKey} />}</TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
