"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownLeft, RefreshCw, Send, Loader2, Copy, Check, TrendingUp, AlertCircle } from "lucide-react"
import {
  sendPayment,
  swapAssets,
  createTrustline,
  hasTrustline,
  calculateSwapPreview,
  type AssetCode,
} from "@/lib/blockchain-transactions"
import { ASSETS } from "@/lib/stellar"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TransactionFormsProps {
  publicKey: string
  balances: Record<string, string>
  onSuccess: () => void
}

export function TransactionForms({ publicKey, balances, onSuccess }: TransactionFormsProps) {
  const [activeForm, setActiveForm] = useState<"receive" | "swap" | "send" | "trustline">("receive")

  return (
    <div className="space-y-6">
      {/* Form Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          onClick={() => setActiveForm("receive")}
          variant={activeForm === "receive" ? "default" : "outline"}
          className={
            activeForm === "receive"
              ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              : "border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
          }
        >
          <ArrowDownLeft className="w-4 h-4 mr-2" />
          Receive
        </Button>
        <Button
          onClick={() => setActiveForm("swap")}
          variant={activeForm === "swap" ? "default" : "outline"}
          className={
            activeForm === "swap"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              : "border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
          }
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Swap
        </Button>
        <Button
          onClick={() => setActiveForm("send")}
          variant={activeForm === "send" ? "default" : "outline"}
          className={
            activeForm === "send"
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              : "border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
          }
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
        <Button
          onClick={() => setActiveForm("trustline")}
          variant={activeForm === "trustline" ? "default" : "outline"}
          className={
            activeForm === "trustline"
              ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              : "border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
          }
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trustline
        </Button>
      </div>

      {/* Forms */}
      {activeForm === "receive" && <ReceiveForm publicKey={publicKey} />}
      {activeForm === "swap" && <SwapForm publicKey={publicKey} balances={balances} onSuccess={onSuccess} />}
      {activeForm === "send" && <SendForm publicKey={publicKey} balances={balances} onSuccess={onSuccess} />}
      {activeForm === "trustline" && <TrustlineForm publicKey={publicKey} onSuccess={onSuccess} />}
    </div>
  )
}

function ReceiveForm({ publicKey }: { publicKey: string }) {
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-purple-800/30 bg-black/30 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-green-400" />
          Receive Funds
        </CardTitle>
        <CardDescription className="text-purple-300">Share your address to receive payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-purple-200">Your Stellar Address</Label>
          <div className="flex gap-2">
            <Input value={publicKey} readOnly className="bg-black/50 border-purple-500/30 text-white font-mono" />
            <Button
              onClick={copyAddress}
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Alert className="bg-purple-950/50 border-purple-800/50">
          <AlertCircle className="w-4 h-4 text-purple-400" />
          <AlertDescription className="text-purple-200">
            Make sure the sender knows which asset you want to receive. You may need to create a trustline for
            non-native assets first.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

function SwapForm({
  publicKey,
  balances,
  onSuccess,
}: {
  publicKey: string
  balances: Record<string, string>
  onSuccess: () => void
}) {
  const availableAssets = Object.keys(balances) as AssetCode[]
  const [fromAsset, setFromAsset] = useState<AssetCode>(availableAssets[0] || ("XLM" as AssetCode))
  const [toAsset, setToAsset] = useState<AssetCode>("USDC" as AssetCode)
  const [amount, setAmount] = useState("")
  const [estimatedAmount, setEstimatedAmount] = useState("")
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (amount && Number.parseFloat(amount) > 0) {
      calculatePreview()
    } else {
      setEstimatedAmount("")
      setRate(null)
    }
  }, [amount, fromAsset, toAsset])

  const calculatePreview = async () => {
    setCalculating(true)
    try {
      const preview = await calculateSwapPreview(fromAsset, toAsset, amount)
      if (preview) {
        setEstimatedAmount(preview.estimatedAmount)
        setRate(preview.rate)
      } else {
        setEstimatedAmount("N/A")
        setRate(null)
      }
    } catch (err) {
      console.error("[v0] Preview calculation error:", err)
      setEstimatedAmount("N/A")
      setRate(null)
    } finally {
      setCalculating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const result = await swapAssets(publicKey, fromAsset, toAsset, amount)

      if (result.success) {
        setSuccess(true)
        setAmount("")
        setEstimatedAmount("")
        setTimeout(() => {
          onSuccess()
          setSuccess(false)
        }, 2000)
      } else {
        setError(result.error || "Swap failed. Please try again.")
      }
    } catch (err) {
      console.error("[v0] Swap error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getBalance = (asset: AssetCode): string => {
    return balances[asset] || "0"
  }

  return (
    <Card className="border-purple-800/30 bg-black/30 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-purple-400" />
          Swap Assets
        </CardTitle>
        <CardDescription className="text-purple-300">
          {rate ? `Rate: 1 ${fromAsset} = ${rate.toFixed(7)} ${toAsset}` : "Enter amount to see rate"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-purple-200">From</Label>
            <div className="flex gap-2">
              <Select value={fromAsset} onValueChange={(value) => setFromAsset(value as AssetCode)}>
                <SelectTrigger className="bg-black/50 border-purple-500/30 text-white w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-purple-500/30">
                  {availableAssets.map((asset) => (
                    <SelectItem key={asset} value={asset} className="text-white hover:bg-slate-800">
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.0000001"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="bg-black/50 border-purple-500/30 text-white placeholder:text-purple-400/50"
              />
            </div>
            <p className="text-xs text-purple-400">Available: {getBalance(fromAsset)}</p>
          </div>

          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center border border-purple-500/30">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-200">To</Label>
            <div className="flex gap-2">
              <Select value={toAsset} onValueChange={(value) => setToAsset(value as AssetCode)}>
                <SelectTrigger className="bg-black/50 border-purple-500/30 text-white w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-purple-500/30">
                  {Object.keys(ASSETS).map((asset) => (
                    <SelectItem key={asset} value={asset} className="text-white hover:bg-slate-800">
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                value={calculating ? "Calculating..." : estimatedAmount}
                disabled
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>
            <p className="text-xs text-purple-400">
              {estimatedAmount && estimatedAmount !== "N/A"
                ? `You will receive approximately ${estimatedAmount} ${toAsset}`
                : ""}
            </p>
          </div>

          {error && (
            <Alert className="bg-red-950/50 border-red-900/50">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-950/50 border-green-900/50">
              <Check className="w-4 h-4 text-green-400" />
              <AlertDescription className="text-green-200">Swap completed successfully!</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || calculating || !estimatedAmount || estimatedAmount === "N/A"}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              "Swap Assets"
            )}
          </Button>

          <Alert className="bg-purple-950/50 border-purple-800/50">
            <AlertCircle className="w-4 h-4 text-purple-400" />
            <AlertDescription className="text-purple-200 text-xs">
              This swap uses the Stellar DEX with 1% slippage tolerance. Transaction fees apply in XLM.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  )
}

function SendForm({
  publicKey,
  balances,
  onSuccess,
}: {
  publicKey: string
  balances: Record<string, string>
  onSuccess: () => void
}) {
  const availableAssets = Object.keys(balances) as AssetCode[]
  const [asset, setAsset] = useState<AssetCode>(availableAssets[0] || ("XLM" as AssetCode))
  const [amount, setAmount] = useState("")
  const [destination, setDestination] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const result = await sendPayment(publicKey, destination, asset, amount)

      if (result.success) {
        setSuccess(true)
        setAmount("")
        setDestination("")
        setTimeout(() => {
          onSuccess()
          setSuccess(false)
        }, 2000)
      } else {
        setError(result.error || "Payment failed. Please try again.")
      }
    } catch (err) {
      console.error("[v0] Send error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getBalance = (assetCode: AssetCode): string => {
    return balances[assetCode] || "0"
  }

  return (
    <Card className="border-purple-800/30 bg-black/30 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-400" />
          Send Payment
        </CardTitle>
        <CardDescription className="text-purple-300">Send assets to another Stellar address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-purple-200">Asset</Label>
            <Select value={asset} onValueChange={(value) => setAsset(value as AssetCode)}>
              <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-purple-500/30">
                {availableAssets.map((assetCode) => (
                  <SelectItem key={assetCode} value={assetCode} className="text-white hover:bg-slate-800">
                    {assetCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-purple-400">Available: {getBalance(asset)}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-200">Amount</Label>
            <Input
              type="number"
              step="0.0000001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="bg-black/50 border-purple-500/30 text-white placeholder:text-purple-400/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-purple-200">Destination Address</Label>
            <Input
              type="text"
              placeholder="G..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="bg-black/50 border-purple-500/30 text-white placeholder:text-purple-400/50 font-mono text-sm"
            />
          </div>

          {error && (
            <Alert className="bg-red-950/50 border-red-900/50">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-950/50 border-green-900/50">
              <Check className="w-4 h-4 text-green-400" />
              <AlertDescription className="text-green-200">Payment sent successfully!</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Payment"
            )}
          </Button>

          <Alert className="bg-purple-950/50 border-purple-800/50">
            <AlertCircle className="w-4 h-4 text-purple-400" />
            <AlertDescription className="text-purple-200 text-xs">
              Double-check the destination address. Transactions on the blockchain are irreversible.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  )
}

function TrustlineForm({ publicKey, onSuccess }: { publicKey: string; onSuccess: () => void }) {
  const [selectedAsset, setSelectedAsset] = useState<AssetCode>("PI" as AssetCode)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [hasTrust, setHasTrust] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkTrustline()
  }, [selectedAsset])

  const checkTrustline = async () => {
    setChecking(true)
    try {
      const trustlineExists = await hasTrustline(publicKey, selectedAsset)
      setHasTrust(trustlineExists)
    } catch (err) {
      console.error("[v0] Check trustline error:", err)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const asset = ASSETS[selectedAsset]
      const result = await createTrustline(publicKey, asset)

      if (result.success) {
        setSuccess(true)
        setHasTrust(true)
        setTimeout(() => {
          onSuccess()
          setSuccess(false)
        }, 2000)
      } else {
        setError(result.error || "Failed to create trustline. Please try again.")
      }
    } catch (err) {
      console.error("[v0] Trustline error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-purple-800/30 bg-black/30 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          Create Trustline
        </CardTitle>
        <CardDescription className="text-purple-300">
          Enable your wallet to hold specific assets on Stellar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-purple-200">Select Asset</Label>
            <Select value={selectedAsset} onValueChange={(value) => setSelectedAsset(value as AssetCode)}>
              <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-purple-500/30">
                {Object.keys(ASSETS).map((asset) => (
                  <SelectItem key={asset} value={asset} className="text-white hover:bg-slate-800">
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {checking ? (
              <p className="text-xs text-purple-400">Checking trustline...</p>
            ) : hasTrust ? (
              <p className="text-xs text-green-400">Trustline already exists for {selectedAsset}</p>
            ) : (
              <p className="text-xs text-purple-400">No trustline found for {selectedAsset}</p>
            )}
          </div>

          <Alert className="bg-blue-950/50 border-blue-800/50">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              <strong>What is a trustline?</strong>
              <br />A trustline allows your wallet to hold and transact with a specific asset on Stellar. You need to
              create a trustline before receiving non-native assets.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="bg-red-950/50 border-red-900/50">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-950/50 border-green-900/50">
              <Check className="w-4 h-4 text-green-400" />
              <AlertDescription className="text-green-200">Trustline created successfully!</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || hasTrust || checking}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Trustline...
              </>
            ) : hasTrust ? (
              "Trustline Already Exists"
            ) : (
              "Create Trustline"
            )}
          </Button>

          <Alert className="bg-purple-950/50 border-purple-800/50">
            <AlertCircle className="w-4 h-4 text-purple-400" />
            <AlertDescription className="text-purple-200 text-xs">
              Creating a trustline requires a small XLM reserve (0.5 XLM) that will be locked in your account.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  )
}
