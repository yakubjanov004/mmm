"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, Files, Upload, BarChart3, Settings, LogOut } from "lucide-react"

const navItems = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: BookOpen },
  { href: "/teacher/files", label: "Mening Fayllarim", icon: Files },
  { href: "/teacher/upload", label: "Fayl Yuklash", icon: Upload },
  { href: "/teacher/analytics", label: "Tahlil", icon: BarChart3 },
  { href: "/teacher/settings", label: "Sozlamalar", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col sidebar-mobile-hidden">
      {/* Logo */}
      <div className="p-4 sm:p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground truncate">AcademiaCMS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-smooth",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 sm:p-4 border-t border-sidebar-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-smooth"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="hidden sm:inline">Logout</span>
        </Link>
      </div>
    </aside>
  )
}
