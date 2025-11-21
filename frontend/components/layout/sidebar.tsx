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
import { useTranslation } from "@/lib/i18n"

// Role-specific navigation items - will be localized in component
const adminNavItems = [
  { href: "/dashboard", labelKey: "menu.dashboard", icon: LayoutDashboard },
  { href: "/users", labelKey: "menu.users", icon: Users },
  { href: "/statistics", labelKey: "menu.statistics", icon: BarChart3 },
  { href: "/settings", labelKey: "menu.settings", icon: Settings },
]

const hodNavItems = [
  { href: "/dashboard", labelKey: "menu.dashboard", icon: LayoutDashboard },
  { href: "/profile", labelKey: "menu.profile", icon: User },
  { href: "/teachers", labelKey: "menu.teachers", icon: Users },
  { href: "/methodical-works", labelKey: "menu.methodical-works", icon: BookOpen },
  { href: "/research-works", labelKey: "menu.research-works", icon: GraduationCap },
  { href: "/certificates", labelKey: "menu.certificates", icon: Award },
  { href: "/software-certificates", labelKey: "menu.software-certificates", icon: FileCode },
  { href: "/statistics", labelKey: "menu.statistics", icon: BarChart3 },
  { href: "/settings", labelKey: "menu.settings", icon: Settings },
]

const teacherNavItems = [
  { href: "/dashboard", labelKey: "menu.dashboard", icon: LayoutDashboard },
  { href: "/profile", labelKey: "menu.profile", icon: User },
  { href: "/methodical-works", labelKey: "menu.methodical-works", icon: BookOpen },
  { href: "/research-works", labelKey: "menu.research-works", icon: GraduationCap },
  { href: "/certificates", labelKey: "menu.certificates", icon: Award },
  { href: "/software-certificates", labelKey: "menu.software-certificates", icon: FileCode },
  { href: "/settings", labelKey: "menu.settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { language, t } = useTranslation()
  const currentUser = getCurrentUserSync()

  // Get user name in current language
  const getUserDisplayName = (): string => {
    if (!currentUser) return t("navbar.user")
    
    let displayName: string | undefined
    
    switch (language) {
      case "uz":
        displayName = currentUser.full_name
        break
      case "uzc":
        displayName = currentUser.full_name_uzc
        break
      case "ru":
        displayName = currentUser.full_name_ru
        break
      case "en":
        displayName = currentUser.full_name_en
        break
      default:
        displayName = currentUser.full_name
    }
    
    if (displayName) {
      return displayName
    }
    
    // Fallback to default name construction
    return `${currentUser.ism} ${currentUser.familiya}`.trim() || currentUser.username
  }

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
        return t("roles.admin")
      case "Head of Department":
        return t("roles.hod")
      case "Teacher":
        return t("roles.teacher")
      default:
        return currentUser.roli
    }
  }

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col h-screen flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", roleStyles.accentBg)}>
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <span className="font-semibold text-sidebar-foreground text-sm truncate">
              {t("sidebar.title")}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {t("sidebar.subtitle")}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 break-words overflow-hidden">
          {t("sidebar.departmentName")}
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
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors min-w-0",
                isActive
                  ? cn(roleStyles.accentBg, "text-white")
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      {currentUser && (
        <div className="p-4 border-t border-sidebar-border space-y-2 overflow-hidden">
          <div className="text-sm text-sidebar-foreground overflow-hidden">
            <p className="font-semibold truncate">
              {getUserDisplayName()}
            </p>
            <p className={cn("text-xs font-medium truncate", roleStyles.accentText)}>{getRoleLabel()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-sm"
          >
            <span className="truncate">{t("sidebar.logout")}</span>
          </button>
        </div>
      )}
    </aside>
  )
}
