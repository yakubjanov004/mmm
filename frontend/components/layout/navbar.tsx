"use client"

import React, { useState, useEffect } from "react"
import { Bell, Search, User as UserIcon, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUserSync, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { RoleSwitcher } from "@/components/role-switcher"
import { useTranslation } from "@/lib/i18n"

export function Navbar() {
  const router = useRouter()
  const { language, t } = useTranslation()
  const [currentUser, setCurrentUser] = useState(getCurrentUserSync())
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setCurrentUser(getCurrentUserSync())
    
    // Listen for user data updates
    const handleUserUpdate = () => {
      setCurrentUser(getCurrentUserSync())
    }
    window.addEventListener("storage", handleUserUpdate)
    window.addEventListener("roleChanged", handleUserUpdate)
    window.addEventListener("languageChanged", handleUserUpdate)

    return () => {
      window.removeEventListener("storage", handleUserUpdate)
      window.removeEventListener("roleChanged", handleUserUpdate)
      window.removeEventListener("languageChanged", handleUserUpdate)
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getInitials = () => {
    if (!currentUser) return "U"
    return `${currentUser.ism[0]}${currentUser.familiya[0]}`.toUpperCase()
  }

  // Get user name in current language
  const getUserDisplayName = (): string => {
    if (!currentUser) return t("navbar.user")
    
    // Try to get name in current language
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

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("navbar.search")}
            className="pl-10"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <RoleSwitcher user={currentUser} />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                {currentUser?.avatar ? (
                  <AvatarImage 
                    src={currentUser.avatar}
                    alt={getUserDisplayName()}
                  />
                ) : null}
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.roli || t("navbar.role")}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>{t("navbar.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <span>{t("navbar.settings")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("navbar.signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
