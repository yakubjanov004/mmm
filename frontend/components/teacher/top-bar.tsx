"use client"

import { Bell, Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function TopBar() {
  return (
    <header className="border-b border-border bg-card px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-10" />
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto sm:ml-0">
        <Button variant="ghost" size="icon" className="transition-smooth">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="transition-smooth">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
