"use client"

import { useState } from "react"
import { Search, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWebSocket } from "@/contexts/websocket-context"

export function AppHeader() {
  const { alerts, isConnected } = useWebSocket()
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <header className="h-16 glass-panel border-b border-border/30 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vehicles, routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-panel"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-success animate-pulse" : "bg-destructive")} />
          <span className="text-muted-foreground">{isConnected ? "Live" : "Offline"}</span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {alerts.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {alerts.length}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
