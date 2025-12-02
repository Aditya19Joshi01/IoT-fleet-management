"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useRef } from "react"
import { getAuthToken } from "@/lib/auth"

interface TelemetryUpdate {
  vehicle_id: string
  latitude: number
  longitude: number
  speed_kmh: number
  fuel_level_pct: number
  last_update: string
  total_idle_seconds: number
  eta_minutes: number
  on_route: boolean
}

interface Alert {
  vehicle_id: string
  type: string
  message: string
  timestamp: string
}

interface WebSocketMessage {
  type: "telemetry_update" | "alert"
  data: TelemetryUpdate | Alert
}

interface WebSocketContextType {
  isConnected: boolean
  telemetryUpdates: Map<string, TelemetryUpdate>
  alerts: Alert[]
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/ws/"

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [telemetryUpdates, setTelemetryUpdates] = useState<Map<string, TelemetryUpdate>>(new Map())
  const [alerts, setAlerts] = useState<Alert[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
          console.log("[v0] WebSocket connected")
          setIsConnected(true)
        }

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)

            if (message.type === "telemetry_update") {
              const update = message.data as TelemetryUpdate
              setTelemetryUpdates((prev) => {
                const newMap = new Map(prev)
                newMap.set(update.vehicle_id, update)
                return newMap
              })
            } else if (message.type === "alert") {
              const alert = message.data as Alert
              setAlerts((prev) => [alert, ...prev].slice(0, 50)) // Keep last 50 alerts
            }
          } catch (error) {
            console.error("[v0] Failed to parse WebSocket message:", error)
          }
        }

        ws.onerror = (error) => {
          console.error("[v0] WebSocket error:", error)
        }

        ws.onclose = () => {
          console.log("[v0] WebSocket disconnected")
          setIsConnected(false)
          wsRef.current = null

          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[v0] Attempting to reconnect WebSocket...")
            connectWebSocket()
          }, 5000)
        }
      } catch (error) {
        console.error("[v0] Failed to create WebSocket connection:", error)
        setIsConnected(false)
      }
    }

    connectWebSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ isConnected, telemetryUpdates, alerts }}>{children}</WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}
