"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn, signUp } from "@/lib/auth"

interface AuthFormProps {
  onSuccess: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let result
      if (isSignUp) {
        result = await signUp(email, password, name)
      } else {
        result = await signIn(email, password)
      }

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || "An error occurred")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-950/50 backdrop-blur">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">π</span>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Pi Exchange</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            {isSignUp ? "Create your account to start trading" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            {error && (
              <div className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md p-3">{error}</div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              disabled={loading}
            >
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError("")
              }}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
