"use client"

import { Bell, Search, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TopBarProps {
  role: "teacher" | "prorector" | "admin"
}

export function TopBar({ role }: TopBarProps) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <header className="bg-card border-b border-border flex items-center justify-between px-6 py-4 h-16">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 w-64" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" className="gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm">{roleLabel}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
