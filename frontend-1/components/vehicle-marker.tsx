"use client"

import { Truck } from "lucide-react"
import { cn } from "@/lib/utils"

interface VehicleMarkerProps {
  status: "moving" | "idle" | "alert"
  size?: "sm" | "md" | "lg"
}

export function VehicleMarker({ status, size = "md" }: VehicleMarkerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  const statusColors = {
    moving: "bg-success text-success-foreground",
    idle: "bg-warning text-warning-foreground",
    alert: "bg-destructive text-destructive-foreground",
  }

  return (
    <div
      className={cn("rounded-full flex items-center justify-center shadow-lg", sizeClasses[size], statusColors[status])}
    >
      <Truck className="w-3/5 h-3/5" />
    </div>
  )
}
