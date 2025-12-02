import { Alert } from '@/types/fleet';
import { AlertTriangle, Fuel, Gauge, MapPinOff, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AlertsPanelProps {
  alerts: Alert[];
}

const alertIcons = {
  low_fuel: Fuel,
  speeding: Gauge,
  geofence_breach: MapPinOff,
  hard_brake: Activity,
  hard_accel: Activity,
  maintenance: AlertTriangle,
};

const severityStyles = {
  info: 'border-l-primary bg-primary/5',
  warning: 'border-l-warning bg-warning/5',
  critical: 'border-l-destructive bg-destructive/5',
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Alerts</h3>
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active alerts</p>
          <p className="text-sm">Your fleet is running smoothly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Recent Alerts</h3>
        <span className="text-sm text-muted-foreground">{alerts.length} total</span>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {alerts.map((alert) => {
          const Icon = alertIcons[alert.type] || AlertTriangle;
          return (
            <div
              key={alert.id}
              className={cn(
                'p-3 rounded-lg border-l-4 transition-colors duration-200 hover:bg-glass-hover',
                severityStyles[alert.severity]
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    {alert.vehicle_id}
                  </p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
