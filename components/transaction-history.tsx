"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RefreshCw, Send, Search, ExternalLink, Copy, Check, Loader2 } from "lucide-react"
import { getRecentTransactions } from "@/lib/stellar"
import type { ServerApi } from "@stellar/stellar-sdk/lib/horizon"

interface TransactionHistoryProps {
  publicKey: string
}

export function TransactionHistory({ publicKey }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<ServerApi.TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<ServerApi.TransactionRecord | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [publicKey])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const txs = await getRecentTransactions(publicKey, 50)
      setTransactions(txs)
    } catch (error) {
      console.error("[v0] Error loading transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    return (
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const copyToClipboard = (text: string, hash: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const getTransactionType = (tx: ServerApi.TransactionRecord): string => {
    // Simplified type detection - in production you'd parse operations
    if (tx.memo) return "payment"
    return "transaction"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    }
  }

  const openInStellarExpert = (hash: string) => {
    window.open(`https://stellar.expert/explorer/public/tx/${hash}`, "_blank")
  }

  return (
    <Card className="border-purple-800/30 bg-black/30 backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-white">Transaction History</CardTitle>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/50 border-purple-500/30 text-white placeholder:text-purple-400/50"
              />
            </div>
            <Button
              onClick={loadTransactions}
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
            <p className="text-purple-300">Loading transactions from Stellar...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-purple-900/50 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <RefreshCw className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-purple-300 mb-2">
              {transactions.length === 0 ? "No transactions yet" : "No transactions found"}
            </p>
            <p className="text-sm text-purple-400/70">
              {transactions.length === 0 ? "Your transaction history will appear here" : "Try adjusting your search"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => {
              const { date, time } = formatDate(tx.created_at)
              const type = getTransactionType(tx)

              return (
                <Dialog key={tx.id}>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => setSelectedTransaction(tx)}
                      className="w-full flex items-center justify-between p-4 rounded-lg bg-black/50 border border-purple-800/30 hover:border-purple-600/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center border border-purple-500/30">
                          <Send className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Transaction</p>
                          <p className="text-sm text-purple-400 font-mono">{tx.hash.slice(0, 16)}...</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20">
                            Success
                          </Badge>
                          <p className="text-xs text-purple-400 mt-1">
                            {date} {time}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-purple-800/50 text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center border border-purple-500/30">
                          <Send className="w-5 h-5 text-purple-400" />
                        </div>
                        <span>Transaction Details</span>
                      </DialogTitle>
                      <DialogDescription className="text-purple-300">Confirmed on Stellar blockchain</DialogDescription>
                    </DialogHeader>
                    {selectedTransaction && (
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-purple-400 mb-1">Status</p>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20">
                              Successful
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-purple-400 mb-1">Ledger</p>
                            <p className="text-white">{selectedTransaction.ledger}</p>
                          </div>
                        </div>

                        <div className="border-t border-purple-800/30 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-purple-400 mb-1">Date</p>
                              <p className="text-white">{formatDate(selectedTransaction.created_at).date}</p>
                            </div>
                            <div>
                              <p className="text-sm text-purple-400 mb-1">Time</p>
                              <p className="text-white">{formatDate(selectedTransaction.created_at).time}</p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-purple-800/30 pt-4">
                          <p className="text-sm text-purple-400 mb-1">Transaction Hash</p>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-mono text-sm truncate flex-1">{selectedTransaction.hash}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(selectedTransaction.hash, `hash-${selectedTransaction.id}`)
                              }
                              className="h-8 w-8 p-0 hover:bg-purple-900/50"
                            >
                              {copiedHash === `hash-${selectedTransaction.id}` ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-purple-400" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="border-t border-purple-800/30 pt-4">
                          <p className="text-sm text-purple-400 mb-1">Source Account</p>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-mono text-sm truncate flex-1">
                              {selectedTransaction.source_account}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(selectedTransaction.source_account, `source-${selectedTransaction.id}`)
                              }
                              className="h-8 w-8 p-0 hover:bg-purple-900/50"
                            >
                              {copiedHash === `source-${selectedTransaction.id}` ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-purple-400" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="border-t border-purple-800/30 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-purple-400 mb-1">Fee (XLM)</p>
                              <p className="text-white">
                                {(Number.parseInt(selectedTransaction.fee_charged) / 10000000).toFixed(7)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-purple-400 mb-1">Operations</p>
                              <p className="text-white">{selectedTransaction.operation_count}</p>
                            </div>
                          </div>
                        </div>

                        {selectedTransaction.memo && (
                          <div className="border-t border-purple-800/30 pt-4">
                            <p className="text-sm text-purple-400 mb-1">Memo</p>
                            <p className="text-white">{selectedTransaction.memo}</p>
                          </div>
                        )}

                        <div className="border-t border-purple-800/30 pt-4">
                          <Button
                            onClick={() => openInStellarExpert(selectedTransaction.hash)}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Stellar Expert
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
