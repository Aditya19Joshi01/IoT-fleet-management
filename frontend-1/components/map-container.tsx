"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"

interface Vehicle {
  vehicle_id: string
  latitude: number
  longitude: number
  speed_kmh: number
  fuel_level_pct: number
  status: "moving" | "idle" | "alert"
}

interface MapContainerProps {
  vehicles: Vehicle[]
  center?: [number, number]
  zoom?: number
  height?: string
  onVehicleClick?: (vehicleId: string) => void
}

export function MapContainer({
  vehicles,
  center = [37.7749, -122.4194],
  zoom = 12,
  height = "500px",
  onVehicleClick,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapRef.current) return

    let mounted = true

    // Dynamic import of Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (!mounted || !mapRef.current) return

      // Remove existing map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // Create new map
      const map = L.map(mapRef.current).setView(center, zoom)
      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      // Add vehicle markers
      vehicles.forEach((vehicle) => {
        const statusColors = {
          moving: "#10B981",
          idle: "#F59E0B",
          alert: "#EF4444",
        }

        const marker = L.circleMarker([vehicle.latitude, vehicle.longitude], {
          radius: 8,
          fillColor: statusColors[vehicle.status],
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(map)

        marker.bindPopup(`
          <div style="font-family: system-ui; min-width: 200px;">
            <h3 style="font-weight: 600; margin-bottom: 8px;">${vehicle.vehicle_id}</h3>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 14px;">
              <div><strong>Speed:</strong> ${Math.round(vehicle.speed_kmh)} km/h</div>
              <div><strong>Fuel:</strong> ${Math.round(vehicle.fuel_level_pct)}%</div>
              <div><strong>Status:</strong> ${vehicle.status}</div>
            </div>
          </div>
        `)

        marker.on("click", () => {
          if (onVehicleClick) {
            onVehicleClick(vehicle.vehicle_id)
          }
        })
      })
    })

    // Cleanup function
    return () => {
      mounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isClient, vehicles, center, zoom, onVehicleClick])

  return (
    <Card className="glass-panel overflow-hidden">
      <div ref={mapRef} style={{ height, width: "100%" }} />
    </Card>
  )
}
