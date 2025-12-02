"use client"

import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend }: KpiCardProps) {
  return (
    <Card className="glass-panel p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold mb-2">{value}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <span className={cn("text-sm font-medium", trend.isPositive ? "text-success" : "text-destructive")}>
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-sm text-muted-foreground ml-2">vs last week</span>
        </div>
      )}
    </Card>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
