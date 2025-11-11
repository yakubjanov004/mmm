"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LockIcon } from "lucide-react"
import { login } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error("Please enter username and password")
      return
    }

    setIsLoading(true)
    try {
      const result = await login(username, password)
      setIsLoading(false)
      if (result.success && result.user) {
        toast.success(`Welcome, ${result.user.ism} ${result.user.familiya}!`)
        router.push("/dashboard")
      } else {
        toast.error(result.error || "Invalid credentials")
      }
    } catch (error: any) {
      setIsLoading(false)
      toast.error(error.message || "Login failed. Please try again.")
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Login Form */}
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="bg-primary p-3 rounded-lg">
                <LockIcon className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl sm:text-3xl">
              Robotics & Intelligent Systems
            </CardTitle>
            <CardDescription className="text-center">
              Department Portal
            </CardDescription>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Robototexnika va intellektual tizimlar kafedrasi
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
