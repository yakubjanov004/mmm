"use client"

import type { Role, RoleInternal, User } from "./types"
import { authAPI, getAccessToken, clearTokens } from "./api"
import { mapBackendUserToFrontend } from "./api-mappers"

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
      const backendUser = await authAPI.getCurrentUser()
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

  // Admin can view everything
  if (currentUser.roli === "Admin") return true

  // Head of Department can view department records
  if (currentUser.roli === "Head of Department") {
    // Check if record's department matches user's department
    if (record.department?.id && currentUser.kafedra_id) {
      return record.department.id === currentUser.kafedra_id
    }
    return false
  }

  // Teacher: can view if they are author/co-author
  if (currentUser.roli === "Teacher") {
    // Check if user is in authors list
    if (record.mualliflar?.includes(currentUser.id)) return true
    
    // Check if user is the creator
    if (record.created_by === currentUser.id) return true
    
    // Check if department-visible and same department
    if (record.department_visible && record.department?.id && currentUser.kafedra_id) {
      return record.department.id === currentUser.kafedra_id
    }
    
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

  // Admin can edit everything
  if (currentUser.roli === "Admin") return true

  // Head of Department can edit department records
  if (currentUser.roli === "Head of Department") {
    if (record.department?.id && currentUser.kafedra_id) {
      return record.department.id === currentUser.kafedra_id
    }
    return false
  }

  // Teacher: can edit if they are author/co-author or creator
  if (currentUser.roli === "Teacher") {
    // Check if user is in authors list (co-author)
    if (record.mualliflar?.includes(currentUser.id)) return true
    
    // Check if user is the creator
    return record.created_by === currentUser.id
  }

  return false
}

// Filter records by role (with co-authoring and department visibility)
export function filterRecordsByRole<T extends { mualliflar?: number[]; created_by: number; department_visible?: boolean; department?: { id: number } }>(
  records: T[],
  currentUser: User | null,
): T[] {
  if (!currentUser) return []

  // Admin sees all
  if (currentUser.roli === "Admin") return records

  // Head of Department sees department records
  if (currentUser.roli === "Head of Department") {
    return records.filter((record) => {
      if (record.department?.id && currentUser.kafedra_id) {
        return record.department.id === currentUser.kafedra_id
      }
      return false
    })
  }

  // Teacher sees:
  // 1. Their own items (created_by)
  // 2. Items where they are co-authors
  // 3. Department-visible items from same department (read-only unless co-author)
  if (currentUser.roli === "Teacher") {
    return records.filter((record) => {
      // Own items
      if (record.created_by === currentUser.id) return true
      
      // Co-authored items
      if (record.mualliflar?.includes(currentUser.id)) return true
      
      // Department-visible items from same department
      if (record.department_visible && record.department?.id && currentUser.kafedra_id) {
        return record.department.id === currentUser.kafedra_id
      }
      
      return false
    })
  }

  return []
}
