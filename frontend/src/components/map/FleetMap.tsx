import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Vehicle, Geofence } from '@/types/fleet';

interface FleetMapProps {
  vehicles: Vehicle[];
  geofences?: Geofence[];
  selectedVehicle?: Vehicle | null;
  onVehicleClick?: (vehicle: Vehicle) => void;
  height?: string;
  showGeofences?: boolean;
}

const statusColors = {
  moving: '#10B981',
  idle: '#F59E0B',
  alert: '#EF4444',
  offline: '#6B7280',
};

export function FleetMap({
  vehicles,
  geofences = [],
  selectedVehicle,
  onVehicleClick,
  height = '400px',
  showGeofences = true,
}: FleetMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const geofencesRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [37.7749, -122.4194],
      zoom: 12,
      zoomControl: false,
    });

    // Dark theme tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

    markersRef.current = L.layerGroup().addTo(mapRef.current);
    geofencesRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    vehicles.forEach((vehicle) => {
      const color = statusColors[vehicle.status];
      const isSelected = selectedVehicle?.vehicle_id === vehicle.vehicle_id;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: ${isSelected ? '24px' : '18px'};
            height: ${isSelected ? '24px' : '18px'};
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ${isSelected ? 'animation: pulse 2s infinite;' : ''}
          "></div>
        `,
        iconSize: [isSelected ? 24 : 18, isSelected ? 24 : 18],
        iconAnchor: [isSelected ? 12 : 9, isSelected ? 12 : 9],
      });

      const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon })
        .addTo(markersRef.current!);

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 180px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${vehicle.display_name}</div>
          <div style="font-size: 12px; color: #94A3B8; margin-bottom: 4px;">${vehicle.vehicle_id}</div>
          <div style="display: grid; gap: 4px; font-size: 12px;">
            <div><strong>Speed:</strong> ${vehicle.speed_kmh} km/h</div>
            <div><strong>Fuel:</strong> ${vehicle.fuel_level_pct.toFixed(0)}%</div>
            <div><strong>Status:</strong> <span style="color: ${color}; text-transform: uppercase;">${vehicle.status}</span></div>
          </div>
        </div>
      `, {
        className: 'dark-popup',
      });

      if (onVehicleClick) {
        marker.on('click', () => onVehicleClick(vehicle));
      }
    });
  }, [vehicles, selectedVehicle, onVehicleClick]);

  // Update geofences
  useEffect(() => {
    if (!geofencesRef.current || !showGeofences) return;
    geofencesRef.current.clearLayers();

    geofences.forEach((geofence) => {
      L.circle([geofence.center_lat, geofence.center_lng], {
        radius: geofence.radius_meters,
        color: geofence.color,
        fillColor: geofence.color,
        fillOpacity: 0.1,
        weight: 2,
      })
        .addTo(geofencesRef.current!)
        .bindTooltip(geofence.name, { permanent: false });
    });
  }, [geofences, showGeofences]);

  // Center on selected vehicle
  useEffect(() => {
    if (!mapRef.current || !selectedVehicle) return;
    mapRef.current.setView([selectedVehicle.latitude, selectedVehicle.longitude], 14, {
      animate: true,
    });
  }, [selectedVehicle]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-glass-border"
      style={{ height }}
    />
  );
}
