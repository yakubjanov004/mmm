"use client"

import type { Role, RoleInternal, User } from "./types"
import { authAPI, getAccessToken, clearTokens } from "./api"
import { mapBackendUserToFrontend } from "./api-mappers"
import { getActiveRole } from "@/components/role-switcher"

// Session storage keys
const USER_DATA_KEY = "user_data"

// Get current user from session or API
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === "undefined") return null

  // Try to get from localStorage first
  const cachedUser = localStorage.getItem(USER_DATA_KEY)
  if (cachedUser) {
    try {
      return JSON.parse(cachedUser)
    } catch {
      // Invalid cache, clear it
      localStorage.removeItem(USER_DATA_KEY)
    }
  }

  // If no cache and we have a token, fetch from API
  if (getAccessToken()) {
    try {
      const backendUser = await authAPI.getCurrentUser() as any
      const user = mapBackendUserToFrontend(backendUser)
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
      return user
    } catch (error) {
      // API call failed, clear tokens
      clearTokens()
      localStorage.removeItem(USER_DATA_KEY)
      return null
    }
  }

  return null
}

// Synchronous version for components that need immediate access
export function getCurrentUserSync(): User | null {
  if (typeof window === "undefined") return null

  const cachedUser = localStorage.getItem(USER_DATA_KEY)
  if (cachedUser) {
    try {
      return JSON.parse(cachedUser)
    } catch {
      localStorage.removeItem(USER_DATA_KEY)
    }
  }

  return null
}

// Login with username and password
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await authAPI.login(username, password)
    const user = mapBackendUserToFrontend(response.user)
    
    // Store user data in localStorage
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))

    return { success: true, user }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Invalid username or password",
    }
  }
}

// Logout
export function logout() {
  clearTokens()
  localStorage.removeItem(USER_DATA_KEY)
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return !!getAccessToken()
}

// Check if user can view a record (with co-authoring support)
// Note: This function assumes records have department info embedded
export function canViewRecord<T extends { mualliflar?: number[]; created_by: number; department_visible?: boolean; department?: { id: number } }>(
  record: T,
  currentUser: User | null,
): boolean {
  if (!currentUser) return false

  // Get active role from localStorage
  const activeRole = getActiveRole(currentUser)

  // Admin can view everything
  if (currentUser.roli === "Admin") return true

  // If active role is HOD, can view all department records (read-only)
  if (activeRole === "HOD" && currentUser.roli === "Head of Department") {
    // Check if record's department matches user's department
    if (record.department?.id && currentUser.kafedra_id) {
      return record.department.id === currentUser.kafedra_id
    }
    return false
  }

  // Head of Department can view department records (when not in HOD mode)
  if (currentUser.roli === "Head of Department" && activeRole !== "HOD") {
    // Check if record's department matches user's department
    if (record.department?.id && currentUser.kafedra_id) {
      return record.department.id === currentUser.kafedra_id
    }
    return false
  }

  // Teacher or active role is TEACHER: can view only if they are author/co-author or created the item
  if (currentUser.roli === "Teacher" || activeRole === "TEACHER") {
    // Check if user is in authors list (hammuallif)
    if (record.mualliflar?.includes(currentUser.id)) return true
    
    // Check if user is the creator
    if (record.created_by === currentUser.id) return true
    
    return false
  }

  return false
}

// Check if user can edit/delete a record (with co-authoring support)
export function canEditRecord<T extends { mualliflar?: number[]; created_by: number; department?: { id: number } }>(
  record: T,
  currentUser: User | null,
): boolean {
  if (!currentUser) return false

  // Get active role from localStorage
  const activeRole = getActiveRole(currentUser)
  
  // If active role is HOD, user can only view, not edit
  if (activeRole === "HOD") return false

  // Admin can edit everything
  if (currentUser.roli === "Admin") return true

  // Head of Department can edit department records (only if active role is not HOD)
  if (currentUser.roli === "Head of Department" && activeRole !== "HOD") {
    if (record.department?.id && currentUser.kafedra_id) {
      return record.department.id === currentUser.kafedra_id
    }
    return false
  }

  // Teacher: can edit if they are author/co-author or creator
  if (currentUser.roli === "Teacher" || activeRole === "TEACHER") {
    // Check if user is in authors list (co-author)
    if (record.mualliflar?.includes(currentUser.id)) return true
    
    // Check if user is the creator
    return record.created_by === currentUser.id
  }

  return false
}

// Check if user can create new records
export function canCreateRecord(currentUser: User | null): boolean {
  if (!currentUser) return false

  // Get active role from localStorage
  const activeRole = getActiveRole(currentUser)
  
  // If active role is HOD, user cannot create records
  if (activeRole === "HOD") return false

  // Admin can create everything
  if (currentUser.roli === "Admin") return true

  // Teacher or Head of Department (when not in HOD mode) can create
  if (currentUser.roli === "Teacher" || currentUser.roli === "Head of Department") {
    // Only allow if active role is TEACHER
    return activeRole === "TEACHER"
  }

  return false
}

// Filter records by role (with co-authoring and department visibility)
export function filterRecordsByRole<T extends { mualliflar?: number[]; created_by: number; department_visible?: boolean; department?: { id: number } }>(
  records: T[],
  currentUser: User | null,
): T[] {
  if (!currentUser) return []

  // Get active role from localStorage
  const activeRole = getActiveRole(currentUser)

  // Admin sees all
  if (currentUser.roli === "Admin") return records

  // If active role is HOD, see all department records (read-only)
  if (activeRole === "HOD" && currentUser.roli === "Head of Department") {
    return records.filter((record) => {
      if (record.department?.id && currentUser.kafedra_id) {
        return record.department.id === currentUser.kafedra_id
      }
      return false
    })
  }

  // If active role is TEACHER, see only own items (created by user or user is co-author)
  if (activeRole === "TEACHER") {
    return records.filter((record) => {
      // Own items (user created this record)
      if (record.created_by === currentUser.id) return true
      
      // Co-authored items (user is in the authors list - hammuallif)
      if (record.mualliflar?.includes(currentUser.id)) return true
      
      return false
    })
  }

  // Head of Department sees all department records (when not in HOD mode)
  if (currentUser.roli === "Head of Department" && activeRole !== "HOD") {
    return records.filter((record) => {
      // Show all records from the same department
      if (record.department?.id && currentUser.kafedra_id) {
        return record.department.id === currentUser.kafedra_id
      }
      return false
    })
  }

  // Teacher sees only their own items:
  // 1. Items they created (created_by)
  // 2. Items where they are co-authors (hammuallif)
  if (currentUser.roli === "Teacher") {
    return records.filter((record) => {
      // Own items (user created this record)
      if (record.created_by === currentUser.id) return true
      
      // Co-authored items (user is in the authors list - hammuallif)
      if (record.mualliflar?.includes(currentUser.id)) return true
      
      return false
    })
  }

  return []
}
