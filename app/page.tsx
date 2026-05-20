"use client"

import { useWallet } from "@/lib/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"
import { Dashboard } from "@/components/dashboard"

export default function Page() {
  const { isConnected, connect, isLoading } = useWallet()

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 text-white">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-bold">Pi Exchange</CardTitle>
            <CardDescription className="text-gray-300">Powered by Stellar Blockchain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-gray-300">
              Connect your Freighter wallet to start trading Pi Network tokens and other assets on the Stellar network.
            </p>
            <Button
              onClick={connect}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg"
            >
              {isLoading ? "Connecting..." : "Connect Freighter Wallet"}
            </Button>
            <p className="text-center text-xs text-gray-400">
              Don't have Freighter?{" "}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Install it here
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Dashboard />
}
