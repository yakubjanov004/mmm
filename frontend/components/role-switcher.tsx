"use client"

import React, { useEffect, useState } from "react"
import type { User } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/lib/i18n"

const ACTIVE_ROLE_KEY = "active_role"

// Map frontend role to backend role format
function mapFrontendRoleToBackend(frontendRole: string): string {
  const roleMap: Record<string, string> = {
    Admin: "ADMIN",
    "Head of Department": "HOD",
    Teacher: "TEACHER",
  }
  return roleMap[frontendRole] || frontendRole
}

// Get active role from localStorage
export function getActiveRole(user: User | null): string | null {
  if (typeof window === "undefined" || !user) {
    return null
  }

  const stored = localStorage.getItem(ACTIVE_ROLE_KEY)
  if (stored && user.available_roles?.includes(stored)) {
    return stored
  }

  // Default to user's primary role (map frontend to backend format)
  if (user.roli) {
    const backendRole = mapFrontendRoleToBackend(user.roli)
    // Verify it's in available_roles
    if (user.available_roles?.includes(backendRole)) {
      return backendRole
    }
  }
  
  // Fallback to first available role
  return user.available_roles?.[0] || null
}

// Set active role in localStorage
export function setActiveRole(role: string): void {
  if (typeof window === "undefined") {
    return
  }
  localStorage.setItem(ACTIVE_ROLE_KEY, role)
  // Trigger custom event for components to re-render
  window.dispatchEvent(new CustomEvent("roleChanged", { detail: role }))
}

// Map backend role to display name
function getRoleDisplayName(role: string, t: (key: string) => string): string {
  const roleMap: Record<string, string> = {
    ADMIN: t("roles.admin"),
    HOD: t("roles.hod"),
    TEACHER: t("roles.teacher"),
  }
  return roleMap[role] || role
}

interface RoleSwitcherProps {
  user: User | null
  onRoleChange?: (role: string) => void
}

export function RoleSwitcher({ user, onRoleChange }: RoleSwitcherProps) {
  const { t } = useTranslation()
  const [activeRole, setActiveRoleState] = useState<string | null>(
    user ? getActiveRole(user) : null
  )

  useEffect(() => {
    if (user) {
      const currentRole = getActiveRole(user)
      setActiveRoleState(currentRole)
    }

    // Listen for role changes
    const handleRoleChange = (event: CustomEvent<string>) => {
      setActiveRoleState(event.detail)
    }

    window.addEventListener("roleChanged", handleRoleChange as EventListener)

    return () => {
      window.removeEventListener("roleChanged", handleRoleChange as EventListener)
    }
  }, [user])

  if (!user || !user.available_roles || user.available_roles.length <= 1) {
    return null
  }

  const handleChange = (value: string) => {
    setActiveRole(value)
    setActiveRoleState(value)
    if (onRoleChange) {
      onRoleChange(value)
    }
  }

  return (
    <Select value={activeRole || undefined} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={t("navbar.selectRole")} />
      </SelectTrigger>
      <SelectContent>
        {user.available_roles.map((role) => (
          <SelectItem key={role} value={role}>
            {getRoleDisplayName(role, t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

