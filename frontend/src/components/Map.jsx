import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import GeofenceEditor from './GeofenceEditor';
import { getGeofences, createGeofence } from '../services/api';

// Fix default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ selectedVehicle }) {
    const map = useMap();
    useEffect(() => {
        if (selectedVehicle) {
            map.flyTo([selectedVehicle.latitude, selectedVehicle.longitude], 15);
        }
    }, [selectedVehicle, map]);
    return null;
}

export default function Map({ vehicles, selectedVehicle }) {
    const [geofences, setGeofences] = useState([]);

    useEffect(() => {
        loadGeofences();
    }, []);

    const loadGeofences = async () => {
        try {
            const data = await getGeofences();
            setGeofences(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateGeofence = async (data) => {
        try {
            await createGeofence(data);
            loadGeofences();
        } catch (err) {
            alert("Failed to create geofence");
        }
    };

    return (
        <div className="glass-panel" style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
            <MapContainer center={[37.7749, -122.4194]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapController selectedVehicle={selectedVehicle} />

                <GeofenceEditor
                    geofences={geofences}
                    onCreated={handleCreateGeofence}
                />

                {vehicles.map(v => (
                    <Marker key={v.vehicle_id} position={[v.latitude, v.longitude]}>
                        <Popup>
                            <div style={{ color: 'black' }}>
                                <b>{v.vehicle_id}</b><br />
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
