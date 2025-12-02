"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Save, Trash2, User, Bell, MapPin, Settings2 } from "lucide-react"
import { api } from "@/lib/api"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // User Profile State
  const [profile, setProfile] = useState({
    username: user?.username || "admin",
    email: "admin@fleettrack.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    lowFuelAlerts: true,
    speedingAlerts: true,
    geofenceAlerts: true,
    maintenanceReminders: true,
    dailyReports: false,
    weeklyReports: true,
  })

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    apiEndpoint: "http://localhost:8000/api",
    wsEndpoint: "ws://localhost:8000/api/ws/",
    mapProvider: "OpenStreetMap",
    refreshInterval: "5",
  })

  // Geofences State
  const [geofences, setGeofences] = useState<any[]>([])

  useEffect(() => {
    fetchGeofences()
  }, [])

  const fetchGeofences = async () => {
    try {
      const data = await api.getGeofences()
      setGeofences(data)
    } catch (error) {
      console.error("[v0] Failed to fetch geofences:", error)
      toast({
        title: "Connection Error",
        description: "Unable to load geofences. Please ensure your backend is running.",
        variant: "destructive",
      })
    }
  }

  const handleSaveProfile = () => {
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: "Profile updated successfully",
    })
  }

  const handleSaveNotifications = () => {
    toast({
      title: "Success",
      description: "Notification settings saved",
    })
  }

  const handleSaveSystem = () => {
    toast({
      title: "Success",
      description: "System settings updated",
    })
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
      console.error("[v0] Failed to delete geofence:", error)
      toast({
        title: "Error",
        description: "Failed to delete geofence. Please ensure your backend API is running.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account, notifications, and system preferences</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="geofences" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Geofences</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>

        {/* User Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-6">User Information</h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-6">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={profile.currentPassword}
                  onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={profile.newPassword}
                  onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={profile.confirmPassword}
                  onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-6">Alert Channels</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Alerts</p>
                  <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                </div>
                <Switch
                  checked={notifications.emailAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Alerts</p>
                  <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                </div>
                <Switch
                  checked={notifications.smsAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, smsAlerts: checked })}
                />
              </div>
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-6">Alert Types</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Fuel Alerts</p>
                  <p className="text-sm text-muted-foreground">Alert when fuel level drops below 20%</p>
                </div>
                <Switch
                  checked={notifications.lowFuelAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, lowFuelAlerts: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Speeding Alerts</p>
                  <p className="text-sm text-muted-foreground">Alert when vehicle exceeds speed limit</p>
                </div>
                <Switch
                  checked={notifications.speedingAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, speedingAlerts: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Geofence Alerts</p>
                  <p className="text-sm text-muted-foreground">Alert when vehicle enters or exits geofence</p>
                </div>
                <Switch
                  checked={notifications.geofenceAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, geofenceAlerts: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Reminders</p>
                  <p className="text-sm text-muted-foreground">Periodic maintenance reminders</p>
                </div>
                <Switch
                  checked={notifications.maintenanceReminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, maintenanceReminders: checked })}
                />
              </div>
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-6">Reports</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Daily Reports</p>
                  <p className="text-sm text-muted-foreground">Receive daily fleet summary</p>
                </div>
                <Switch
                  checked={notifications.dailyReports}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, dailyReports: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">Receive weekly performance analysis</p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* Geofences Tab */}
        <TabsContent value="geofences" className="space-y-6">
          <Card className="glass-panel overflow-hidden">
            <div className="p-4 border-b border-border/30">
              <h3 className="text-lg font-semibold">Manage Geofences</h3>
              <p className="text-sm text-muted-foreground mt-1">View and manage all geofence zones</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Radius</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {geofences.map((geofence) => (
                  <TableRow key={geofence.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: geofence.color }} />
                        <span className="font-medium">{geofence.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {geofence.latitude.toFixed(4)}, {geofence.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell>{geofence.radius}m</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGeofence(geofence.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <p className="text-sm text-muted-foreground">
            To add new geofences, visit the{" "}
            <a href="/live-map" className="text-primary hover:underline">
              Live Map
            </a>{" "}
            page and use the geofence drawing tools.
          </p>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-6">API Configuration</h3>
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input
                  id="api-endpoint"
                  value={systemSettings.apiEndpoint}
                  onChange={(e) => setSystemSettings({ ...systemSettings, apiEndpoint: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Base URL for REST API calls</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-endpoint">WebSocket Endpoint</Label>
                <Input
                  id="ws-endpoint"
                  value={systemSettings.wsEndpoint}
                  onChange={(e) => setSystemSettings({ ...systemSettings, wsEndpoint: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">WebSocket URL for real-time updates</p>
              </div>
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-6">Display Settings</h3>
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="map-provider">Map Provider</Label>
                <Input
                  id="map-provider"
                  value={systemSettings.mapProvider}
                  onChange={(e) => setSystemSettings({ ...systemSettings, mapProvider: e.target.value })}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Currently using OpenStreetMap</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refresh-interval">Data Refresh Interval (seconds)</Label>
                <Input
                  id="refresh-interval"
                  type="number"
                  value={systemSettings.refreshInterval}
                  onChange={(e) => setSystemSettings({ ...systemSettings, refreshInterval: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">How often to refresh dashboard data</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSystem}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
