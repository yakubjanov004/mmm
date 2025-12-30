// API Client for backend communication

// Environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!
const ACCESS_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME!
const REFRESH_TOKEN_KEY = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME!

export { API_BASE_URL }

// Get stored access token
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

// Get stored refresh token
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

// Store tokens
export function setTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

// Clear tokens
export function clearTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// Parse response
async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return null as T
  const text = await response.text()
  if (!text) return null as T
  try {
    return JSON.parse(text) as T
  } catch {
    return null as T
  }
}

// API request wrapper
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers })

  // Handle 401 - try refresh token
  if (response.status === 401 && token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`
      response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers })
    }
    
    if (response.status === 401) {
      clearTokens()
      if (typeof window !== "undefined") window.location.href = "/"
      throw new Error("Authentication failed")
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || error.message || response.statusText)
  }

  return parseResponse<T>(response)
}

// Refresh access token
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      return false
    }

    const data = await response.json()
    setTokens(data.access, refreshToken)
    return true
  } catch {
    clearTokens()
    return false
  }
}

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || "Login failed")
    }

    const data = await response.json()
    setTokens(data.access, data.refresh)
    return data
  },

  getCurrentUser: async () => {
    return apiRequest("/auth/me/")
  },

  updateProfile: async (data: {
    first_name?: string
    last_name?: string
    phone?: string
    birth_date?: string | null
    scopus?: string
    scholar?: string
    research_id?: string
    user_id?: string
  }) => {
    return apiRequest("/auth/me/update/", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest("/auth/change-password/", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
  },

  logout: () => {
    clearTokens()
  },
}

// Users API
export const usersAPI = {
  list: () => apiRequest("/users/"),
  get: (id: number) => apiRequest(`/users/${id}/`),
  create: (data: any) =>
    apiRequest("/users/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: any) =>
    apiRequest(`/users/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest(`/users/${id}/`, {
      method: "DELETE",
    }),
}

// Departments API
export const departmentsAPI = {
  list: () => apiRequest("/departments/"),
}

// Positions API
export const positionsAPI = {
  list: () => apiRequest("/positions/"),
}

// Works API
export const worksAPI = {
  methodical: {
    list: () => apiRequest("/methodical/"),
    get: (id: number) => apiRequest(`/methodical/${id}/`),
    create: (data: FormData) =>
      fetch(`${API_BASE_URL}/methodical/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: data,
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create methodical work")
        return res.json()
      }),
    update: (id: number, data: FormData) =>
      fetch(`${API_BASE_URL}/methodical/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: data,
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update methodical work")
        return res.json()
      }),
    delete: (id: number) =>
      apiRequest(`/methodical/${id}/`, {
        method: "DELETE",
      }),
  },
  research: {
    list: () => apiRequest("/research/"),
    get: (id: number) => apiRequest(`/research/${id}/`),
    create: (data: FormData) =>
      fetch(`${API_BASE_URL}/research/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: data,
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create research work")
        return res.json()
      }),
    update: (id: number, data: FormData) =>
      fetch(`${API_BASE_URL}/research/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: data,
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update research work")
        return res.json()
      }),
    delete: (id: number) =>
      apiRequest(`/research/${id}/`, {
        method: "DELETE",
      }),
  },
  certificates: {
    list: () => apiRequest("/certificates/"),
    get: (id: number) => apiRequest(`/certificates/${id}/`),
    create: (data: FormData) =>
      fetch(`${API_BASE_URL}/certificates/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: data,
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create certificate")
        return res.json()
      }),
    update: (id: number, data: FormData) =>
      fetch(`${API_BASE_URL}/certificates/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: data,
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update certificate")
        return res.json()
      }),
    delete: (id: number) =>
      apiRequest(`/certificates/${id}/`, {
        method: "DELETE",
      }),
  },
  softwareCertificates: {
    list: () => apiRequest("/software-certificates/"),
    get: (id: number) => apiRequest(`/software-certificates/${id}/`),
    create: (data: FormData) =>
      fetch(`${API_BASE_URL}/software-certificates/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: data,
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create software certificate")
        return res.json()
      }),
    update: (id: number, data: FormData) =>
      fetch(`${API_BASE_URL}/software-certificates/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: data,
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update software certificate")
        return res.json()
      }),
    delete: (id: number) =>
      apiRequest(`/software-certificates/${id}/`, {
        method: "DELETE",
      }),
  },
}

// Files API
export const filesAPI = {
  list: () => apiRequest("/files/"),
  create: (data: FormData) =>
    fetch(`${API_BASE_URL}/files/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: data,
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to upload file")
      return res.json()
    }),
  delete: (id: number) =>
    apiRequest(`/files/${id}/`, {
      method: "DELETE",
    }),
}

// Stats API
export const statsAPI = {
  get: () => apiRequest("/stats/"),
}

