import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from './Map';
import VehicleList from './VehicleList';
import { getDashboardSnapshot, registerVehicle, deleteVehicle } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { Plus, Search } from 'lucide-react';

export default function Dashboard() {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const { lastMessage } = useWebSocket();
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const data = await getDashboardSnapshot();
            setVehicles(data.vehicles);
            setAlerts(data.alerts);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (lastMessage && lastMessage.type === 'telemetry_update') {
            const { vehicle_id, data } = lastMessage;
            setVehicles(prev => {
                const idx = prev.findIndex(v => v.vehicle_id === vehicle_id);

                if (idx === -1) {
                    // Add new vehicle if it doesn't exist
                    return [...prev, {
                        vehicle_id,
                        display_name: vehicle_id,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        speed_kmh: data.speed_kmh,
                        fuel_level_pct: data.fuel_level_pct,
                        last_update: data.timestamp,
                        on_route: data.on_route
                    }];
                }

                const newVehicles = [...prev];
                newVehicles[idx] = {
                    ...newVehicles[idx],
                    latitude: data.latitude,
                    longitude: data.longitude,
                    speed_kmh: data.speed_kmh,
                    fuel_level_pct: data.fuel_level_pct,
                    last_update: data.timestamp,
                    on_route: data.on_route
                };
                return newVehicles;
            });
        }
    }, [lastMessage]);

    const handleAddVehicle = async (vehicleData) => {
        try {
            const payload = {
                ...vehicleData,
                initial_position: { latitude: 37.7749, longitude: -122.4194 }
            };
            await registerVehicle(payload);
            fetchData();
        } catch (err) {
            alert("Failed to add vehicle");
        }
    };

    const handleDeleteVehicle = async (id) => {
        try {
            await deleteVehicle(id);
            fetchData();
        } catch (err) {
            alert("Failed to delete vehicle");
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', position: 'relative' }}>
            {/* Floating Sidebar for Vehicle List */}
            <div className="glass-panel" style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                bottom: '1rem',
                width: '320px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Fleet Overview</h2>
                    <div className="input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                        <Search size={16} className="text-secondary" />
                        <input
                            type="text"
                            placeholder="Search vehicles..."
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <VehicleList
                        vehicles={vehicles}
                        onSelect={(v) => {
                            setSelectedVehicle(v);
                            // Optional: Navigate to detail on double click or button
                        }}
                        onAdd={handleAddVehicle}
                        onDelete={handleDeleteVehicle}
                        onHistory={(id) => navigate(`/vehicles/${id}`)}
                    />
                </div>
            </div>

            {/* Map Area */}
            <div style={{ flex: 1, height: '100%' }}>
                <Map vehicles={vehicles} selectedVehicle={selectedVehicle} />
            </div>
        </div>
    );
}
