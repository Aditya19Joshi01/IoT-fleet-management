import { Vehicle } from '@/types/fleet';
import { Badge } from '@/components/ui/badge';
import { Fuel, Gauge, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface VehicleListItemProps {
  vehicle: Vehicle;
  isSelected?: boolean;
  onClick?: () => void;
}

export function VehicleListItem({ vehicle, isSelected, onClick }: VehicleListItemProps) {
  const statusVariant = {
    moving: 'moving',
    idle: 'idle',
    alert: 'alert',
    offline: 'offline',
  } as const;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-glass-border hover:bg-glass-hover transition-all duration-200 cursor-pointer',
        isSelected && 'bg-glass-hover border-primary/50'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-foreground">{vehicle.display_name}</h4>
          <p className="text-xs text-muted-foreground">{vehicle.vehicle_id}</p>
        </div>
        <Badge variant={statusVariant[vehicle.status]}>
          {vehicle.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Gauge className="w-4 h-4" />
          <span>{vehicle.speed_kmh} km/h</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Fuel className="w-4 h-4" />
          <div className="flex-1">
            <div className="h-1.5 bg-glass rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  vehicle.fuel_level_pct > 50 ? 'bg-success' : vehicle.fuel_level_pct > 20 ? 'bg-warning' : 'bg-destructive'
                )}
                style={{ width: `${vehicle.fuel_level_pct}%` }}
              />
            </div>
          </div>
          <span>{vehicle.fuel_level_pct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <MapPin className="w-3 h-3" />
        <span>
          Updated {formatDistanceToNow(new Date(vehicle.last_update), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
