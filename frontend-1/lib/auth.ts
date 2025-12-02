export interface AuthUser {
  username: string
  email?: string
  token: string
}

export function saveAuth(user: AuthUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("fleet_auth_token", user.token)
    localStorage.setItem("fleet_auth_user", JSON.stringify(user))
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("fleet_auth_token")
  }
  return null
}

export function getAuthUser(): AuthUser | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("fleet_auth_user")
    if (userStr) {
      return JSON.parse(userStr)
    }
  }
  return null
}

export function clearAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fleet_auth_token")
    localStorage.removeItem("fleet_auth_user")
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
