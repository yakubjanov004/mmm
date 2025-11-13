"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  User,
  BookOpen,
  GraduationCap,
  Award,
  FileCode,
  Settings,
  BarChart3,
  Users,
  Cpu,
} from "lucide-react"
import { getCurrentUserSync, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"

// Role-specific navigation items
const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Foydalanuvchilar", icon: Users },
  { href: "/statistics", label: "Statistika", icon: BarChart3 },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
]

const hodNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/methodical-works", label: "Uslubiy ishlar", icon: BookOpen },
  { href: "/research-works", label: "Ilmiy ishlar", icon: GraduationCap },
  { href: "/certificates", label: "Sertifikatlar", icon: Award },
  { href: "/software-certificates", label: "Dasturiy guvohnomalar", icon: FileCode },
  { href: "/statistics", label: "Statistika", icon: BarChart3 },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
]

const teacherNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/methodical-works", label: "Uslubiy ishlar", icon: BookOpen },
  { href: "/research-works", label: "Ilmiy ishlar", icon: GraduationCap },
  { href: "/certificates", label: "Sertifikatlar", icon: Award },
  { href: "/software-certificates", label: "Dasturiy guvohnomalar", icon: FileCode },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const currentUser = getCurrentUserSync()

  // Get navigation items based on role
  const getNavItems = () => {
    if (!currentUser) return []
    
    switch (currentUser.roli) {
      case "Admin":
        return adminNavItems
      case "Head of Department":
        return hodNavItems
      case "Teacher":
        return teacherNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  // Get role-based styling
  const getRoleStyles = () => {
    if (!currentUser) return {}
    
    switch (currentUser.roli) {
      case "Admin":
        // Blue/purple theme
        return {
          accentBg: "bg-blue-600",
          accentHover: "hover:bg-blue-600/90",
          accentText: "text-blue-600",
          accentBorder: "border-blue-600",
          accentBgLight: "bg-blue-600/10",
          accentTextLight: "text-blue-700",
        }
      case "Head of Department":
        // Blue/green theme
        return {
          accentBg: "bg-teal-600",
          accentHover: "hover:bg-teal-600/90",
          accentText: "text-teal-600",
          accentBorder: "border-teal-600",
          accentBgLight: "bg-teal-600/10",
          accentTextLight: "text-teal-700",
        }
      case "Teacher":
        // Simple green theme
        return {
          accentBg: "bg-green-600",
          accentHover: "hover:bg-green-600/90",
          accentText: "text-green-600",
          accentBorder: "border-green-600",
          accentBgLight: "bg-green-600/10",
          accentTextLight: "text-green-700",
        }
      default:
        return {}
    }
  }

  const roleStyles = getRoleStyles()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getRoleLabel = () => {
    if (!currentUser) return ""
    switch (currentUser.roli) {
      case "Admin":
        return "Admin"
      case "Head of Department":
        return "Kafedra mudiri"
      case "Teacher":
        return "O'qituvchi"
      default:
        return currentUser.roli
    }
  }

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", roleStyles.accentBg)}>
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground text-sm">
              Robotics & Intelligent Systems
            </span>
            <span className="text-xs text-muted-foreground">
              Department Portal
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Robototexnika va intellektual tizimlar kafedrasi
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? cn(roleStyles.accentBg, "text-white")
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      {currentUser && (
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="text-sm text-sidebar-foreground">
            <p className="font-semibold">
              {currentUser.ism} {currentUser.familiya}
            </p>
            <p className={cn("text-xs font-medium", roleStyles.accentText)}>{getRoleLabel()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-sm"
          >
            <span>Chiqish</span>
          </button>
        </div>
      )}
    </aside>
  )
}
