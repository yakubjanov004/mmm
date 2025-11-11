import type React from "react"
import { Sidebar } from "@/components/prorector/sidebar"
import { TopBar } from "@/components/prorector/top-bar"

export default function ProrectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
