const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface ApiError {
  message: string
  status: number
}

// Helper function to handle API requests
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem("fleet_auth_token") : null
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error: ApiError = {
      message: await response.text(),
      status: response.status,
    }
    throw error
  }

  return response.json()
}

export const api = {
  // Auth endpoints
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append("username", username)
    formData.append("password", password)

    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Invalid credentials")
    }

    return response.json()
  },

  // Dashboard endpoints
  getDashboardSnapshot: () => fetchApi("/dashboard/snapshot"),

  // Vehicle endpoints
  getVehicles: () => fetchApi("/vehicles"),

  getVehicle: (id: string) => fetchApi(`/vehicles/${id}`),

  createVehicle: (vehicle: any) =>
    fetchApi("/vehicles", {
      method: "POST",
      body: JSON.stringify(vehicle),
    }),

  deleteVehicle: (id: string) =>
    fetchApi(`/vehicles/${id}`, {
      method: "DELETE",
    }),

  // Telemetry endpoints
  getTelemetryHistory: (id: string, hours = 24) => fetchApi(`/telemetry/history/${id}?hours=${hours}`),

  // Geofence endpoints
  getGeofences: () => fetchApi("/geofences"),

  createGeofence: (geofence: any) =>
    fetchApi("/geofences", {
      method: "POST",
      body: JSON.stringify(geofence),
    }),

  deleteGeofence: (id: string) =>
    fetchApi(`/geofences/${id}`, {
      method: "DELETE",
    }),

  // Events endpoint (optional - can be implemented when backend adds this)
  getEvents: (vehicleId: string) => fetchApi(`/events/${vehicleId}`),
}
