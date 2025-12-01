import React, { useEffect, useState } from 'react';
import Map from './Map';
import VehicleList from './VehicleList';
import { getDashboardSnapshot, registerVehicle, deleteVehicle } from '../services/api';

export default function Dashboard() {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [alerts, setAlerts] = useState([]);

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
        const interval = setInterval(fetchData, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    const handleAddVehicle = async (vehicleData) => {
        try {
            // Default to SF center if no position provided
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
        <div style={{ display: 'flex', height: '100vh', width: '100vw', padding: '1rem', gap: '1rem', boxSizing: 'border-box' }}>
            <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Fleet Manager
                    </h1>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {vehicles.length} Active Vehicles
                    </div>
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <VehicleList
                        vehicles={vehicles}
                        onSelect={setSelectedVehicle}
                        onAdd={handleAddVehicle}
                        onDelete={handleDeleteVehicle}
                    />
                </div>

                <div className="glass-panel" style={{ height: '200px', padding: '1rem', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Recent Alerts</h3>
                    {alerts.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No active alerts</div>}
                    {alerts.map((alert, i) => (
                        <div key={i} style={{
                            padding: '0.5rem',
                            marginBottom: '0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderLeft: '3px solid var(--danger)',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ fontWeight: 600 }}>{alert.vehicle_id}</div>
                            <div>{alert.message}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                <Map vehicles={vehicles} selectedVehicle={selectedVehicle} />
            </div>
        </div>
    );
}
