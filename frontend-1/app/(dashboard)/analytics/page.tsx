"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { CalendarIcon, Download, TrendingUp } from "lucide-react"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type TimeRange = "24h" | "7d" | "30d" | "custom"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // You can add API calls here when you implement analytics endpoints
  const [speedTrendData, setSpeedTrendData] = useState<any[]>([])
  const [distanceData, setDistanceData] = useState<any[]>([])
  const [fuelConsumptionData, setFuelConsumptionData] = useState<any[]>([])
  const [idleTimeData, setIdleTimeData] = useState<any[]>([])
  const [alertTypesData, setAlertTypesData] = useState<any[]>([])
  const [topSpeedingVehicles, setTopSpeedingVehicles] = useState<any[]>([])
  const [vehicleSummary, setVehicleSummary] = useState<any[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      // const analytics = await api.getAnalytics(timeRange)
      // setSpeedTrendData(analytics.speedTrend)
      // etc...

      // For now, generate sample data for visualization
      setSpeedTrendData(
        Array.from({ length: 7 }, (_, i) => ({
          day: format(subDays(new Date(), 6 - i), "MMM d"),
          avgSpeed: 40 + Math.random() * 20,
          maxSpeed: 65 + Math.random() * 15,
        })),
      )

      setDistanceData(
        Array.from({ length: 7 }, (_, i) => ({
          day: format(subDays(new Date(), 6 - i), "MMM d"),
          distance: 200 + Math.random() * 150,
        })),
      )

      setFuelConsumptionData(
        Array.from({ length: 7 }, (_, i) => ({
          day: format(subDays(new Date(), 6 - i), "MMM d"),
          "TRUCK-001": 85 - i * 2 + Math.random() * 5,
          "TRUCK-002": 90 - i * 2.5 + Math.random() * 5,
          "VAN-003": 78 - i * 3 + Math.random() * 5,
        })),
      )

      setIdleTimeData([
        { name: "Active", value: 65, color: "#10B981" },
        { name: "Idle", value: 25, color: "#F59E0B" },
        { name: "Offline", value: 10, color: "#EF4444" },
      ])

      setAlertTypesData([
        { name: "Low Fuel", value: 35, color: "#F59E0B" },
        { name: "Speeding", value: 25, color: "#EF4444" },
        { name: "Hard Brake", value: 20, color: "#3B82F6" },
        { name: "Geofence", value: 15, color: "#8B5CF6" },
        { name: "Other", value: 5, color: "#6B7280" },
      ])

      setTopSpeedingVehicles([
        { vehicle: "VAN-003", incidents: 12 },
        { vehicle: "TRUCK-001", incidents: 8 },
        { vehicle: "TRUCK-004", incidents: 6 },
        { vehicle: "TRUCK-002", incidents: 4 },
        { vehicle: "VAN-005", incidents: 2 },
      ])

      setVehicleSummary([
        {
          vehicle: "TRUCK-001",
          avgSpeed: 45.2,
          totalDistance: 1250,
          fuelUsed: 187,
          idleTime: 2.5,
          alerts: 8,
        },
        {
          vehicle: "TRUCK-002",
          avgSpeed: 38.7,
          totalDistance: 980,
          fuelUsed: 145,
          idleTime: 4.2,
          alerts: 4,
        },
        {
          vehicle: "VAN-003",
          avgSpeed: 52.3,
          totalDistance: 1450,
          fuelUsed: 210,
          idleTime: 1.8,
          alerts: 12,
        },
        {
          vehicle: "TRUCK-004",
          avgSpeed: 42.1,
          totalDistance: 1100,
          fuelUsed: 165,
          idleTime: 3.1,
          alerts: 6,
        },
        {
          vehicle: "VAN-005",
          avgSpeed: 35.8,
          totalDistance: 850,
          fuelUsed: 128,
          idleTime: 5.5,
          alerts: 2,
        },
      ])
    } catch (error) {
      console.error("[v0] Failed to fetch analytics:", error)
      toast({
        title: "Connection Error",
        description: "Unable to load analytics data. Please ensure your backend is running.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const headers = ["Vehicle", "Avg Speed", "Total Distance", "Fuel Used", "Idle Time", "Alerts"]
    const rows = vehicleSummary.map((v) => [
      v.vehicle,
      v.avgSpeed.toFixed(1),
      v.totalDistance,
      v.fuelUsed,
      v.idleTime.toFixed(1),
      v.alerts,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Analytics report exported to CSV",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive fleet performance analytics and insights</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Time Range Selector */}
      <Card className="glass-panel p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Time Range:</span>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {timeRange === "custom" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Average Speed Trend */}
        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Fleet Average Speed Trend</h3>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success">+5.2%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={speedTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="avgSpeed" stroke="#3B82F6" name="Avg Speed" strokeWidth={2} />
              <Line type="monotone" dataKey="maxSpeed" stroke="#F59E0B" name="Max Speed" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Total Distance Traveled */}
        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Total Distance Traveled</h3>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success">+12.4%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="distance" fill="#10B981" name="Distance (km)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Fuel Consumption Analysis */}
        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Fuel Consumption Analysis</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={fuelConsumptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="TRUCK-001" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="TRUCK-002" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="VAN-003" stroke="#F59E0B" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Idle Time Distribution */}
        <Card className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Fleet Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={idleTimeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {idleTimeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Alert Types Breakdown */}
        <Card className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Alert Types Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={alertTypesData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {alertTypesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Speeding Vehicles */}
        <Card className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Top Speeding Vehicles</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topSpeedingVehicles} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#94A3B8" fontSize={12} />
              <YAxis dataKey="vehicle" type="category" stroke="#94A3B8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="incidents" fill="#EF4444" name="Speeding Incidents" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-border/30">
          <h3 className="text-lg font-semibold">Vehicle-wise Summary Statistics</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Avg Speed (km/h)</TableHead>
              <TableHead>Total Distance (km)</TableHead>
              <TableHead>Fuel Used (L)</TableHead>
              <TableHead>Idle Time (hrs)</TableHead>
              <TableHead>Alerts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicleSummary.map((vehicle) => (
              <TableRow key={vehicle.vehicle}>
                <TableCell className="font-medium">{vehicle.vehicle}</TableCell>
                <TableCell>{vehicle.avgSpeed.toFixed(1)}</TableCell>
                <TableCell>{vehicle.totalDistance}</TableCell>
                <TableCell>{vehicle.fuelUsed}</TableCell>
                <TableCell>{vehicle.idleTime.toFixed(1)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      vehicle.alerts > 8
                        ? "bg-destructive/10 text-destructive"
                        : vehicle.alerts > 5
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success",
                    )}
                  >
                    {vehicle.alerts}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
