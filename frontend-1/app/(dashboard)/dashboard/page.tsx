"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Truck, Gauge, Navigation, AlertTriangle } from "lucide-react"
import { KpiCard } from "@/components/kpi-card"
import { MapContainer } from "@/components/map-container"
import { VehicleListItem } from "@/components/vehicle-list-item"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useWebSocket } from "@/contexts/websocket-context"
import { api } from "@/lib/api"
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

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showVehicleList, setShowVehicleList] = useState(true)
  const { telemetryUpdates, alerts } = useWebSocket()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch initial dashboard data
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.getDashboardSnapshot()
        setVehicles(data.vehicles || [])
      } catch (error) {
        console.error("[v0] Failed to fetch dashboard data:", error)
        toast({
          title: "Connection Error",
          description:
            "Unable to connect to backend API at http://localhost:8000. Please ensure your backend is running.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update vehicles with WebSocket data
  useEffect(() => {
    if (telemetryUpdates.size === 0) return

    setVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) => {
        const update = telemetryUpdates.get(vehicle.vehicle_id)
        if (update) {
          return { ...vehicle, ...update }
        }
        return vehicle
      }),
    )
  }, [telemetryUpdates])

  // Calculate KPIs
  const activeVehicles = vehicles.filter((v) => v.speed_kmh > 0).length
  const idleVehicles = vehicles.filter((v) => v.speed_kmh === 0 && v.fuel_level_pct > 20).length
  const alertVehicles = vehicles.filter((v) => v.fuel_level_pct < 20).length
  const avgSpeed = vehicles.reduce((sum, v) => sum + v.speed_kmh, 0) / vehicles.length || 0
  const totalDistance = vehicles.reduce((sum, v) => sum + v.speed_kmh * 0.5, 0)

  // Determine vehicle status
  const vehiclesWithStatus = vehicles.map((v) => ({
    ...v,
    status: v.fuel_level_pct < 20 ? ("alert" as const) : v.speed_kmh > 0 ? ("moving" as const) : ("idle" as const),
  }))

  const handleVehicleClick = (vehicleId: string) => {
    router.push(`/vehicles/${vehicleId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Real-time fleet monitoring and management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Vehicles"
          value={vehicles.length}
          subtitle={`${activeVehicles} active • ${idleVehicles} idle • ${alertVehicles} alerts`}
          icon={Truck}
        />
        <KpiCard
          title="Average Speed"
          value={`${Math.round(avgSpeed)} km/h`}
          icon={Gauge}
          trend={{ value: 5.2, isPositive: true }}
        />
        <KpiCard
          title="Distance Today"
          value={`${Math.round(totalDistance)} km`}
          icon={Navigation}
          trend={{ value: 12.4, isPositive: true }}
        />
        <KpiCard
          title="Active Alerts"
          value={alertVehicles}
          subtitle={alerts.length > 0 ? `${alerts.length} new alerts` : "No new alerts"}
          icon={AlertTriangle}
        />
      </div>

      {/* Map and Vehicle List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <MapContainer vehicles={vehiclesWithStatus} height="600px" onVehicleClick={handleVehicleClick} />
        </div>

        {/* Vehicle List */}
        <div>
          <Card className="glass-panel p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Fleet Status</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowVehicleList(!showVehicleList)}>
                {showVehicleList ? "Hide" : "Show"}
              </Button>
            </div>

            {showVehicleList && (
              <div className="space-y-3 max-h-[540px] overflow-y-auto">
                {vehiclesWithStatus.map((vehicle) => (
                  <VehicleListItem
                    key={vehicle.vehicle_id}
                    vehicle={vehicle}
                    onClick={() => handleVehicleClick(vehicle.vehicle_id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
