"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Files, Upload, Settings, LogOut, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/teacher/dashboard" },
  { icon: Files, label: "My Files", href: "/teacher/files" },
  { icon: Upload, label: "Upload", href: "/teacher/upload" },
  { icon: Settings, label: "Profile", href: "/teacher/profile" },
]

export function TeacherSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">AcademiaCMS</h1>
            <p className="text-xs text-muted-foreground">Teacher</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground"}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
