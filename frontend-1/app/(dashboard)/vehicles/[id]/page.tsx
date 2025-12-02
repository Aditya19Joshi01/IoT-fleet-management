"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Gauge,
  Fuel,
  Thermometer,
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  TrendingUp,
  Circle,
} from "lucide-react"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { api } from "@/lib/api"
import { useWebSocket } from "@/contexts/websocket-context"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Vehicle {
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

interface TelemetryPoint {
  timestamp: string
  speed_kmh: number
  fuel_level_pct: number
  latitude: number
  longitude: number
}

interface Event {
  type: "hard_brake" | "hard_accel" | "geofence_breach" | "speeding" | "low_fuel"
  description: string
  timestamp: string
}

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicleId = params.id
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const { telemetryUpdates } = useWebSocket()
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    setIsClient(true)
    fetchVehicleData()
  }, [vehicleId])

  useEffect(() => {
    if (!vehicle || !isClient || !mapRef.current) return
    if (!vehicle.latitude || !vehicle.longitude) return // Skip if no valid coordinates

    import("leaflet").then((L) => {
      if (!mapRef.current) return

      mapRef.current.innerHTML = ""

      const map = L.map(mapRef.current).setView([vehicle.latitude, vehicle.longitude], 14)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      const statusColors = {
        moving: "#10B981",
        idle: "#F59E0B",
        alert: "#EF4444",
      }

      const status = vehicle.fuel_level_pct < 20 ? "alert" : vehicle.speed_kmh > 0 ? "moving" : "idle"

      L.circleMarker([vehicle.latitude, vehicle.longitude], {
        radius: 12,
        fillColor: statusColors[status],
        color: "#fff",
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map)

      return () => {
        map.remove()
      }
    })
  }, [vehicle, isClient])

  useEffect(() => {
    if (!vehicle) return

    const update = telemetryUpdates.get(vehicleId)
    if (update) {
      setVehicle({ ...vehicle, ...update })

      // Add to telemetry chart data
      const newPoint: TelemetryPoint = {
        timestamp: update.last_update,
        speed_kmh: update.speed_kmh,
        fuel_level_pct: update.fuel_level_pct,
        latitude: update.latitude,
        longitude: update.longitude,
      }
      setTelemetryData((prev) => [...prev.slice(-50), newPoint])
    }
  }, [telemetryUpdates, vehicleId])

  const fetchVehicleData = async () => {
    try {
      const [vehicleData, historyData] = await Promise.all([
        api.getVehicle(vehicleId),
        api.getTelemetryHistory(vehicleId, 24),
      ])
      setVehicle(vehicleData)
      setTelemetryData(historyData)
      // Events will be populated from WebSocket alerts or can be added when backend implements events endpoint
    } catch (error) {
      console.error("[v0] Failed to fetch vehicle data:", error)
      toast({
        title: "Connection Error",
        description: "Unable to load vehicle data. Please ensure your backend is running on http://localhost:8000",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !vehicle) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading vehicle data...</p>
        </div>
      </div>
    )
  }

  const status = vehicle.fuel_level_pct < 20 ? "alert" : vehicle.speed_kmh > 0 ? "moving" : "idle"
  const statusColors = {
    moving: "bg-success/10 text-success border-success/20",
    idle: "bg-warning/10 text-warning border-warning/20",
    alert: "bg-destructive/10 text-destructive border-destructive/20",
  }
  const statusLabels = {
    moving: "MOVING",
    idle: "STOPPED",
    alert: "ALERT",
  }

  const chartData = telemetryData.map((point) => ({
    time: format(new Date(point.timestamp), "HH:mm"),
    speed: Math.round(point.speed_kmh),
    fuel: Math.round(point.fuel_level_pct),
  }))

  const eventIcons = {
    hard_brake: AlertTriangle,
    hard_accel: TrendingUp,
    geofence_breach: MapPin,
    speeding: Gauge,
    low_fuel: Fuel,
  }

  const eventColors = {
    hard_brake: "text-warning",
    hard_accel: "text-primary",
    geofence_breach: "text-destructive",
    speeding: "text-destructive",
    low_fuel: "text-warning",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{vehicle.vehicle_id}</h1>
              <Badge variant="outline" className={cn("text-sm font-semibold", statusColors[status])}>
                {statusLabels[status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">Real-time vehicle monitoring and telemetry</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-panel p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Speed</p>
              <h3 className="text-2xl font-bold">{Math.round(vehicle.speed_kmh)}</h3>
              <p className="text-xs text-muted-foreground mt-1">km/h</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Fuel Level</p>
              <h3 className="text-2xl font-bold">{Math.round(vehicle.fuel_level_pct)}</h3>
              <p className="text-xs text-muted-foreground mt-1">percent</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Fuel className="w-5 h-5 text-success" />
            </div>
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Engine Temp</p>
              <h3 className="text-2xl font-bold">78</h3>
              <p className="text-xs text-muted-foreground mt-1">°C</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-warning" />
            </div>
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">ETA</p>
              <h3 className="text-2xl font-bold">{Math.round(vehicle.eta_minutes || 0)}</h3>
              <p className="text-xs text-muted-foreground mt-1">minutes</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Map */}
      <Card className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold">Current Location</h2>
        </div>
        <div ref={mapRef} className="h-[300px] w-full" />
      </Card>

      {/* Location Info & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location Information */}
        <Card className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Location Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Coordinates</p>
              <p className="font-mono text-sm">
                {vehicle.latitude && vehicle.longitude
                  ? `${vehicle.latitude.toFixed(6)}, ${vehicle.longitude.toFixed(6)}`
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Heading</p>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                <p className="font-medium">245° SW</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">On Route</p>
              <div className="flex items-center gap-2">
                <Circle
                  className={cn("w-2 h-2 fill-current", vehicle.on_route ? "text-success" : "text-muted-foreground")}
                />
                <p className="font-medium">{vehicle.on_route ? "Yes" : "No"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Distance to Destination</p>
              <p className="font-medium">{(vehicle.eta_minutes * 0.8).toFixed(1)} km</p>
            </div>
          </div>
        </Card>

        {/* Telemetry Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-4">Speed vs Time (Last 24h)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="speed" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-4">Fuel Level vs Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Area type="monotone" dataKey="fuel" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Recent Events Timeline */}
      <Card className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No recent events</p>
          ) : (
            events.map((event, index) => {
              const Icon = eventIcons[event.type]
              return (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center",
                      eventColors[event.type],
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{event.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.timestamp), "MMM d, yyyy • HH:mm:ss")}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
