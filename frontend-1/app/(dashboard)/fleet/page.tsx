"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Plus, Search, Filter, Download, Eye, Trash2, MapPin } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

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

export default function FleetManagementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [fuelFilter, setFuelFilter] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [newVehicle, setNewVehicle] = useState({
    vehicle_id: "",
    latitude: 37.7749,
    longitude: -122.4194,
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [vehicles, searchQuery, statusFilter, fuelFilter])

  const fetchVehicles = async () => {
    try {
      const data = await api.getVehicles()
      setVehicles(data)
    } catch (error) {
      console.error("[v0] Failed to fetch vehicles:", error)
      toast({
        title: "Connection Error",
        description: "Unable to connect to backend API. Please ensure your backend is running on http://localhost:8000",
        variant: "destructive",
      })
      setVehicles([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterVehicles = () => {
    let filtered = vehicles

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((v) => v.vehicle_id.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => {
        const status = getVehicleStatus(v)
        return status === statusFilter
      })
    }

    // Fuel filter
    if (fuelFilter !== "all") {
      filtered = filtered.filter((v) => {
        if (fuelFilter === "low") return v.fuel_level_pct < 20
        if (fuelFilter === "medium") return v.fuel_level_pct >= 20 && v.fuel_level_pct < 50
        if (fuelFilter === "high") return v.fuel_level_pct >= 50
        return true
      })
    }

    setFilteredVehicles(filtered)
  }

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (vehicle.fuel_level_pct < 20) return "alert"
    if (vehicle.speed_kmh > 0) return "moving"
    return "idle"
  }

  const getStatusBadge = (vehicle: Vehicle) => {
    const status = getVehicleStatus(vehicle)
    const colors = {
      moving: "bg-success/10 text-success border-success/20",
      idle: "bg-warning/10 text-warning border-warning/20",
      alert: "bg-destructive/10 text-destructive border-destructive/20",
    }
    const labels = {
      moving: "Moving",
      idle: "Idle",
      alert: "Alert",
    }
    return (
      <Badge variant="outline" className={cn("text-xs", colors[status])}>
        {labels[status]}
      </Badge>
    )
  }

  const handleAddVehicle = async () => {
    if (!newVehicle.vehicle_id) {
      toast({
        title: "Error",
        description: "Vehicle ID is required",
        variant: "destructive",
      })
      return
    }

    try {
      await api.createVehicle({
        ...newVehicle,
        speed_kmh: 0,
        fuel_level_pct: 100,
      })
      toast({
        title: "Success",
        description: "Vehicle added successfully",
      })
      fetchVehicles()
    } catch (error) {
      console.error("[v0] Failed to create vehicle:", error)
      toast({
        title: "Error",
        description: "Failed to add vehicle. Please ensure your backend API is running.",
        variant: "destructive",
      })
    }

    setShowAddDialog(false)
    setNewVehicle({
      vehicle_id: "",
      latitude: 37.7749,
      longitude: -122.4194,
    })
  }

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return

    try {
      await api.deleteVehicle(selectedVehicle)
      setVehicles(vehicles.filter((v) => v.vehicle_id !== selectedVehicle))
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      })
    } catch (error) {
      console.error("[v0] Failed to delete vehicle:", error)
      toast({
        title: "Error",
        description: "Failed to delete vehicle. Please ensure your backend API is running.",
        variant: "destructive",
      })
    }

    setShowDeleteDialog(false)
    setSelectedVehicle(null)
  }

  const handleExportCSV = () => {
    const headers = ["Vehicle ID", "Status", "Speed (km/h)", "Fuel (%)", "Location", "Last Update"]
    const rows = filteredVehicles.map((v) => [
      v.vehicle_id,
      getVehicleStatus(v),
      v.speed_kmh.toFixed(1),
      v.fuel_level_pct.toFixed(1),
      `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}`,
      format(new Date(v.last_update), "yyyy-MM-dd HH:mm:ss"),
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fleet-export-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Fleet data exported to CSV",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading fleet data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fleet Management</h1>
          <p className="text-muted-foreground">Manage your vehicle fleet and track all operations</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-panel p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="moving">Moving</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="alert">Alert</SelectItem>
            </SelectContent>
          </Select>

          {/* Fuel Filter */}
          <Select value={fuelFilter} onValueChange={setFuelFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Fuel Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fuel Levels</SelectItem>
              <SelectItem value="low">Low (&lt; 20%)</SelectItem>
              <SelectItem value="medium">Medium (20-50%)</SelectItem>
              <SelectItem value="high">High (&gt; 50%)</SelectItem>
            </SelectContent>
          </Select>

          {/* Export */}
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="glass-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Fuel</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.vehicle_id}>
                  <TableCell className="font-medium">{vehicle.vehicle_id}</TableCell>
                  <TableCell>{getStatusBadge(vehicle)}</TableCell>
                  <TableCell>{Math.round(vehicle.speed_kmh)} km/h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 w-16 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            vehicle.fuel_level_pct < 20
                              ? "bg-destructive"
                              : vehicle.fuel_level_pct < 50
                                ? "bg-warning"
                                : "bg-success",
                          )}
                          style={{ width: `${vehicle.fuel_level_pct}%` }}
                        />
                      </div>
                      <span className="text-sm">{Math.round(vehicle.fuel_level_pct)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {vehicle.latitude && vehicle.longitude
                      ? `${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(vehicle.last_update), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/vehicles/${vehicle.vehicle_id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedVehicle(vehicle.vehicle_id)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Register a new vehicle to your fleet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-id">Vehicle ID *</Label>
              <Input
                id="vehicle-id"
                placeholder="e.g., TRUCK-006"
                value={newVehicle.vehicle_id}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_id: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={newVehicle.latitude}
                  onChange={(e) => setNewVehicle({ ...newVehicle, latitude: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={newVehicle.longitude}
                  onChange={(e) => setNewVehicle({ ...newVehicle, longitude: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Vehicle will be registered at the specified coordinates</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVehicle}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedVehicle}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteVehicle}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
