"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, isAuthenticated } from "@/lib/auth"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/")
    } else {
      setAuthChecked(true)
    }
  }, [router])

  if (!authChecked) {
    return null
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-64">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 mt-16">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </>
  )
}

