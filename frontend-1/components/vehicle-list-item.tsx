"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Fuel, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"

interface VehicleListItemProps {
  vehicle: {
    vehicle_id: string
    speed_kmh: number
    fuel_level_pct: number
    status: "moving" | "idle" | "alert"
  }
  onClick?: () => void
}

export function VehicleListItem({ vehicle, onClick }: VehicleListItemProps) {
  const statusColors = {
    moving: "bg-success/10 text-success border-success/20",
    idle: "bg-warning/10 text-warning border-warning/20",
    alert: "bg-destructive/10 text-destructive border-destructive/20",
  }

  const statusLabels = {
    moving: "Moving",
    idle: "Idle",
    alert: "Alert",
  }

  return (
    <Link
      href={`/vehicles/${vehicle.vehicle_id}`}
      onClick={onClick}
      className="block p-4 glass-panel rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm">{vehicle.vehicle_id}</h4>
        </div>
        <Badge variant="outline" className={cn("text-xs", statusColors[vehicle.status])}>
          {statusLabels[vehicle.status]}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          <span>{Math.round(vehicle.speed_kmh)} km/h</span>
        </div>
        <div className="flex items-center gap-1">
          <Fuel className="w-4 h-4 text-muted-foreground" />
          <span>{Math.round(vehicle.fuel_level_pct)}%</span>
        </div>
      </div>
    </Link>
  )
}
