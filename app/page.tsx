"use client"

import { useWallet } from "@/lib/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Zap } from "lucide-react"
import { Dashboard } from "@/components/dashboard"

export default function Page() {
  const { isConnected, connect, isLoading, piUser } = useWallet()

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
              Choose your preferred authentication method to start trading Pi Network tokens and other assets.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Option 1: Pi Network</p>
                <Button
                  onClick={() => connect("pi")}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-5"
                >
                  {isLoading ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Connect with Pi
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-gray-400">or</span>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Option 2: Freighter Wallet</p>
                <Button
                  onClick={() => connect("freighter")}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-5"
                >
                  {isLoading ? (
                    <>
                      <Wallet className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Freighter
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Don&apos;t have Freighter?{" "}
                  <a
                    href="https://freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Install it here
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Dashboard />
}
