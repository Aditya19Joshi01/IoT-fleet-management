import { useState, useEffect } from 'react';
import { Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFleetStore } from '@/store/fleetStore';
import { generateMockTelemetry } from '@/services/mockData';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Analytics() {
  const { vehicles, fetchVehicles } = useFleetStore();
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Generate mock analytics data
  const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
  
  const speedTrendData = Array.from({ length: days }, (_, i) => ({
    date: timeRange === '24h' 
      ? format(new Date(Date.now() - (days - 1 - i) * 3600000), 'HH:mm')
      : format(subDays(new Date(), days - 1 - i), 'MMM dd'),
    avgSpeed: Math.floor(Math.random() * 30) + 40,
    maxSpeed: Math.floor(Math.random() * 40) + 60,
  }));

  const distanceData = Array.from({ length: Math.min(days, 7) }, (_, i) => ({
    date: format(subDays(new Date(), Math.min(days, 7) - 1 - i), 'MMM dd'),
    distance: Math.floor(Math.random() * 500) + 200,
  }));

  const fuelConsumptionData = vehicles.slice(0, 5).map((v) => ({
    name: v.display_name,
    consumption: Math.floor(Math.random() * 50) + 20,
  }));

  const idleTimeData = [
    { name: 'Productive', value: 72, color: '#10B981' },
    { name: 'Idle', value: 18, color: '#F59E0B' },
    { name: 'Offline', value: 10, color: '#6B7280' },
  ];

  const alertTypesData = [
    { name: 'Speeding', value: 35, color: '#EF4444' },
    { name: 'Hard Brake', value: 25, color: '#F59E0B' },
    { name: 'Low Fuel', value: 20, color: '#3B82F6' },
    { name: 'Geofence', value: 15, color: '#8B5CF6' },
    { name: 'Other', value: 5, color: '#6B7280' },
  ];

  const topSpeedingVehicles = vehicles
    .map((v) => ({ name: v.display_name, incidents: Math.floor(Math.random() * 20) + 1 }))
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 5);

  const handleExport = () => {
    toast.success('Analytics report exported');
  };

  const chartTooltipStyle = {
    contentStyle: {
      backgroundColor: 'hsl(222 47% 9%)',
      border: '1px solid hsl(217 33% 20%)',
      borderRadius: '8px',
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">Fleet performance insights and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 glass-card p-1">
            {['24h', '7d', '30d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '24h' ? 'Last 24h' : range === '7d' ? '7 Days' : '30 Days'}
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speed Trend */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4">Fleet Average Speed Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={speedTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="date" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
              <Tooltip {...chartTooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="avgSpeed" name="Avg Speed" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="maxSpeed" name="Max Speed" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distance Traveled */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4">Total Distance Traveled (km)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="date" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="distance" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fuel Consumption */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4">Fuel Consumption by Vehicle (L)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={fuelConsumptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="name" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
              <Tooltip {...chartTooltipStyle} />
              <Area type="monotone" dataKey="consumption" stroke="#10B981" fill="hsl(160 84% 39% / 0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Idle Time Distribution */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4">Fleet Time Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={idleTimeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {idleTimeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Types Breakdown */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4">Alert Types Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={alertTypesData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {alertTypesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Speeding Vehicles */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4">Top 5 Speeding Vehicles</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topSpeedingVehicles} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis type="number" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="hsl(215 20% 65%)" fontSize={12} width={100} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="incidents" fill="#EF4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-glass-border">
          <h3 className="font-semibold text-foreground">Vehicle Summary Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="bg-glass">
                <th>Vehicle</th>
                <th>Avg Speed</th>
                <th>Total Distance</th>
                <th>Fuel Used</th>
                <th>Idle Time</th>
                <th>Alerts</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.slice(0, 5).map((vehicle) => (
                <tr key={vehicle.vehicle_id}>
                  <td className="font-medium">{vehicle.display_name}</td>
                  <td>{Math.floor(Math.random() * 30) + 40} km/h</td>
                  <td>{Math.floor(Math.random() * 500) + 100} km</td>
                  <td>{Math.floor(Math.random() * 50) + 20} L</td>
                  <td>{Math.floor(Math.random() * 60) + 10} min</td>
                  <td>{Math.floor(Math.random() * 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
