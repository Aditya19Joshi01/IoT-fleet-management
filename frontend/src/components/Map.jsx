import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map center when vehicles change or are selected
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
}

export default function Map({ vehicles, selectedVehicle }) {
    // Default to SF
    const defaultCenter = [37.7749, -122.4194];
    const center = selectedVehicle
        ? [selectedVehicle.latitude, selectedVehicle.longitude]
        : (vehicles.length > 0 ? [vehicles[0].latitude, vehicles[0].longitude] : defaultCenter);

    return (
        <div className="glass-panel" style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
            <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapUpdater center={center} />

                {vehicles.map(v => (
                    <Marker key={v.vehicle_id} position={[v.latitude, v.longitude]}>
                        <Popup>
                            <div style={{ color: 'black' }}>
                                <strong>{v.vehicle_id}</strong><br />
                                Speed: {v.speed_kmh.toFixed(1)} km/h<br />
                                Fuel: {v.fuel_level_pct.toFixed(1)}%
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
