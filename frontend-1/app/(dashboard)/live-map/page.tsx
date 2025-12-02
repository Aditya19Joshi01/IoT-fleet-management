"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Circle, MapPin, Layers, Save, Trash2, X } from "lucide-react"
import { VehicleListItem } from "@/components/vehicle-list-item"
import { useWebSocket } from "@/contexts/websocket-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Vehicle {
  vehicle_id: string
  latitude: number
  longitude: number
  speed_kmh: number
  fuel_level_pct: number
  status: "moving" | "idle" | "alert"
}

interface Geofence {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
  color: string
}

export default function LiveMapPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [isClient, setIsClient] = useState(false)
  const [showLayers, setShowLayers] = useState(false)
  const [showVehicles, setShowVehicles] = useState(true)
  const [showGeofences, setShowGeofences] = useState(true)
  const [showRoutes, setShowRoutes] = useState(false)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null)
  const [showGeofenceDialog, setShowGeofenceDialog] = useState(false)
  const [newGeofenceName, setNewGeofenceName] = useState("")
  const [newGeofenceRadius, setNewGeofenceRadius] = useState(500)
  const [tempGeofenceData, setTempGeofenceData] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const drawingCircleRef = useRef<any>(null)
  const geofenceLayersRef = useRef<Map<string, any>>(new Map())
  const { telemetryUpdates } = useWebSocket()
  const { toast } = useToast()

  // Initialize
  useEffect(() => {
    setIsClient(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [vehiclesData, geofencesData] = await Promise.all([api.getVehicles(), api.getGeofences()])
      setVehicles(
        vehiclesData.map((v: any) => ({
          ...v,
          status: v.fuel_level_pct < 20 ? "alert" : v.speed_kmh > 0 ? "moving" : "idle",
        })),
      )
      setGeofences(geofencesData)
    } catch (error) {
      console.error("[v0] Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Failed to connect to backend. Please ensure your API is running on http://localhost:8000",
        variant: "destructive",
      })
    }
  }

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstanceRef.current) return

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current).setView([37.7749, -122.4194], 13)
      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      // Add click handler for drawing geofences
      map.on("click", (e: any) => {
        if (isDrawingMode) {
          setTempGeofenceData({ lat: e.latlng.lat, lng: e.latlng.lng })
          setShowGeofenceDialog(true)
          setIsDrawingMode(false)

          // Remove preview circle
          if (drawingCircleRef.current) {
            map.removeLayer(drawingCircleRef.current)
            drawingCircleRef.current = null
          }
        }
      })

      // Add mousemove handler for preview with validation
      map.on("mousemove", (e: any) => {
        if (isDrawingMode) {
          if (drawingCircleRef.current) {
            map.removeLayer(drawingCircleRef.current)
          }
          const radius = Math.max(1, Number(newGeofenceRadius) || 500)
          drawingCircleRef.current = L.circle([e.latlng.lat, e.latlng.lng], {
            radius: radius,
            fillColor: "#3B82F6",
            fillOpacity: 0.2,
            color: "#3B82F6",
            weight: 2,
            dashArray: "5, 5",
          }).addTo(map)
        }
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isClient, newGeofenceRadius, isDrawingMode])

  // Update vehicles on map
  useEffect(() => {
    if (!mapInstanceRef.current || !isClient) return

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current
      if (!map) return

      // Clear existing vehicle markers
      map.eachLayer((layer: any) => {
        if (layer.options?.isVehicle) {
          map.removeLayer(layer)
        }
      })

      if (!showVehicles) return

      // Add vehicle markers (filter out vehicles without coordinates)
      vehicles.filter(v => v.latitude && v.longitude).forEach((vehicle) => {
        const statusColors = {
          moving: "#10B981",
          idle: "#F59E0B",
          alert: "#EF4444",
        }

        const marker = L.circleMarker([vehicle.latitude, vehicle.longitude], {
          radius: 10,
          fillColor: statusColors[vehicle.status],
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
          isVehicle: true,
        } as any).addTo(map)

        marker.bindPopup(`
          <div style="font-family: system-ui; min-width: 200px;">
            <h3 style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${vehicle.vehicle_id}</h3>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 14px; color: #64748b;">
              <div><strong style="color: #1e293b;">Speed:</strong> ${Math.round(vehicle.speed_kmh)} km/h</div>
              <div><strong style="color: #1e293b;">Fuel:</strong> ${Math.round(vehicle.fuel_level_pct)}%</div>
              <div><strong style="color: #1e293b;">Status:</strong> ${vehicle.status}</div>
            </div>
          </div>
        `)
      })
    })
  }, [vehicles, showVehicles, isClient])

  // Update geofences on map
  useEffect(() => {
    if (!mapInstanceRef.current || !isClient) return

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current
      if (!map) return

      // Remove all existing geofence layers
      geofenceLayersRef.current.forEach((layer) => {
        map.removeLayer(layer)
      })
      geofenceLayersRef.current.clear()

      if (!showGeofences) return

      // Add geofence circles
      geofences.forEach((geofence) => {
        const circle = L.circle([geofence.latitude, geofence.longitude], {
          radius: geofence.radius,
          fillColor: geofence.color,
          fillOpacity: 0.15,
          color: geofence.color,
          weight: 2,
          isGeofence: true,
        } as any).addTo(map)

        circle.bindPopup(`
          <div style="font-family: system-ui; min-width: 150px;">
            <h3 style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${geofence.name}</h3>
            <div style="font-size: 14px; color: #64748b;">
              <div><strong style="color: #1e293b;">Radius:</strong> ${geofence.radius}m</div>
            </div>
          </div>
        `)

        geofenceLayersRef.current.set(geofence.id, circle)
      })
    })
  }, [geofences, showGeofences, isClient])

  // Update with WebSocket data
  useEffect(() => {
    if (telemetryUpdates.size === 0) return

    setVehicles((prevVehicles) =>
      prevVehicles.map((vehicle) => {
        const update = telemetryUpdates.get(vehicle.vehicle_id)
        if (update) {
          return {
            ...vehicle,
            ...update,
            status:
              update.fuel_level_pct < 20
                ? ("alert" as const)
                : update.speed_kmh > 0
                  ? ("moving" as const)
                  : ("idle" as const),
          }
        }
        return vehicle
      }),
    )
  }, [telemetryUpdates])

  const handleStartDrawing = () => {
    setIsDrawingMode(true)
    toast({
      title: "Drawing Mode",
      description: "Click on the map to place a geofence",
    })
  }

  const handleCancelDrawing = () => {
    setIsDrawingMode(false)
    if (drawingCircleRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(drawingCircleRef.current)
      drawingCircleRef.current = null
    }
  }

  const handleSaveGeofence = async () => {
    if (!tempGeofenceData || !newGeofenceName) return

    const validRadius = Number(newGeofenceRadius) || 500
    if (validRadius <= 0) {
      toast({
        title: "Invalid Radius",
        description: "Radius must be greater than 0",
        variant: "destructive",
      })
      return
    }

    const newGeofence: Geofence = {
      id: `gf-${Date.now()}`,
      name: newGeofenceName,
      latitude: tempGeofenceData.lat,
      longitude: tempGeofenceData.lng,
      radius: validRadius,
      color: "#3B82F6",
    }

    try {
      await api.createGeofence(newGeofence)
      setGeofences([...geofences, newGeofence])
      toast({
        title: "Success",
        description: "Geofence created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create geofence. Please ensure your API is running.",
        variant: "destructive",
      })
    }

    setShowGeofenceDialog(false)
    setNewGeofenceName("")
    setNewGeofenceRadius(500)
    setTempGeofenceData(null)
  }

  const handleDeleteGeofence = async (id: string) => {
    try {
      await api.deleteGeofence(id)
      setGeofences(geofences.filter((g) => g.id !== id))
      toast({
        title: "Success",
        description: "Geofence deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete geofence. Please ensure your API is running.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="fixed inset-0 flex">
      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Controls Overlay - Top Right */}
        <div className="absolute top-4 right-4 space-y-3 z-[1000]">
          {/* Layer Controls */}
          <Card className="glass-panel-strong p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLayers(!showLayers)}
              className="w-full justify-start"
            >
              <Layers className="w-4 h-4 mr-2" />
              Layers
            </Button>

            {showLayers && (
              <div className="mt-3 space-y-3 pt-3 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <Label htmlFor="vehicles-layer" className="text-sm">
                    Vehicles
                  </Label>
                  <Switch id="vehicles-layer" checked={showVehicles} onCheckedChange={setShowVehicles} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="geofences-layer" className="text-sm">
                    Geofences
                  </Label>
                  <Switch id="geofences-layer" checked={showGeofences} onCheckedChange={setShowGeofences} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="routes-layer" className="text-sm">
                    Routes
                  </Label>
                  <Switch id="routes-layer" checked={showRoutes} onCheckedChange={setShowRoutes} />
                </div>
              </div>
            )}
          </Card>

          {/* Geofence Tools */}
          <Card className="glass-panel-strong p-3 space-y-2">
            <h3 className="text-sm font-semibold mb-2">Geofence Tools</h3>
            {!isDrawingMode ? (
              <Button variant="default" size="sm" onClick={handleStartDrawing} className="w-full">
                <Circle className="w-4 h-4 mr-2" />
                Draw Geofence
              </Button>
            ) : (
              <Button variant="destructive" size="sm" onClick={handleCancelDrawing} className="w-full">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </Card>
        </div>

        {/* Drawing Mode Indicator */}
        {isDrawingMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <Badge className="bg-primary text-primary-foreground px-4 py-2">
              <MapPin className="w-4 h-4 mr-2" />
              Click on map to place geofence
            </Badge>
          </div>
        )}
      </div>

      {/* Vehicle List Sidebar */}
      <aside className="w-80 glass-panel-strong border-l border-border/30 flex flex-col">
        <div className="p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold mb-1">Fleet Status</h2>
          <p className="text-sm text-muted-foreground">{vehicles.length} vehicles tracked</p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <VehicleListItem key={vehicle.vehicle_id} vehicle={vehicle} />
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/30">
          <h3 className="text-sm font-semibold mb-3">Active Geofences</h3>
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {geofences.map((geofence) => (
                <div key={geofence.id} className="flex items-center justify-between p-2 rounded-lg glass-panel">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: geofence.color }} />
                    <span className="text-sm font-medium">{geofence.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDeleteGeofence(geofence.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Geofence Creation Dialog */}
      <Dialog open={showGeofenceDialog} onOpenChange={setShowGeofenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Geofence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Geofence Name</Label>
              <Input
                id="name"
                placeholder="e.g., Downtown Zone"
                value={newGeofenceName}
                onChange={(e) => setNewGeofenceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                min="1"
                placeholder="500"
                value={newGeofenceRadius}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value) || 500
                  setNewGeofenceRadius(Math.max(1, value))
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGeofenceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGeofence} disabled={!newGeofenceName}>
              <Save className="w-4 h-4 mr-2" />
              Save Geofence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
