import React, { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Battery, Gauge, MapPin, AlertTriangle, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getVehicle, getHistory } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import 'leaflet/dist/leaflet.css'; // Ensure CSS is imported

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("VehicleDetail Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: 'var(--danger)' }}>
                    <h2>Something went wrong.</h2>
                    <pre>{this.state.error?.toString()}</pre>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
                </div>
            );
        }
        return this.props.children;
    }
}

function VehicleDetailContent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { lastMessage } = useWebSocket();

    const [vehicle, setVehicle] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [vData, hData] = await Promise.all([
                    getVehicle(id),
                    getHistory(id)
                ]);

                if (!vData) throw new Error("Vehicle data is null");

                setVehicle(vData);
                setHistory((hData || []).map(p => ({
                    ...p,
                    time: p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : 'N/A'
                })).reverse());
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    // Handle real-time updates
    useEffect(() => {
        if (lastMessage && lastMessage.type === 'telemetry_update' && lastMessage.vehicle_id === id) {
            const data = lastMessage.data;
            setVehicle(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    last_telemetry: {
                        ...(prev.last_telemetry || {}),
                        ...data
                    }
                };
            });

            setHistory(prev => {
                const newPoint = {
                    ...data,
                    time: new Date(data.timestamp).toLocaleTimeString()
                };
                return [...prev.slice(1), newPoint];
            });
        }
    }, [lastMessage, id]);

    if (loading) return <div className="flex-center" style={{ height: '100%' }}>Loading...</div>;
    if (error) return <div className="flex-center" style={{ height: '100%', color: 'var(--danger)' }}>Error: {error}</div>;
    if (!vehicle) return <div className="flex-center" style={{ height: '100%' }}>Vehicle not found</div>;

    const tel = vehicle.last_telemetry || {};
    const lat = tel.latitude || 0;
    const lng = tel.longitude || 0;

    return (
        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
            {/* Header */}
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem' }}>{vehicle.display_name || vehicle.vehicle_id}</h1>
                        <div className="text-secondary text-sm">ID: {vehicle.vehicle_id}</div>
                    </div>
                    <div className={`badge ${tel.speed_kmh > 0 ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: '1rem' }}>
                        {tel.speed_kmh > 0 ? 'MOVING' : 'STOPPED'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Battery size={18} className={(tel.fuel_level_pct || 0) < 20 ? 'text-danger' : 'text-success'} />
                        <span style={{ fontWeight: 600 }}>{Math.round(tel.fuel_level_pct || 0)}%</span>
                        <span className="text-secondary text-xs">FUEL</span>
                    </div>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Gauge size={18} className="text-info" />
                        <span style={{ fontWeight: 600 }}>{Math.round(tel.speed_kmh || 0)}</span>
                        <span className="text-secondary text-xs">KM/H</span>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', height: 'calc(100% - 100px)' }}>

                {/* Left Column: Charts & Map */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Live Map */}
                    <div className="glass-panel" style={{ height: '300px', overflow: 'hidden', position: 'relative' }}>
                        {lat !== 0 && lng !== 0 ? (
                            <MapContainer
                                key={`${lat}-${lng}`} // Force re-render when coordinates change
                                center={[lat, lng]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />
                                <Marker position={[lat, lng]}>
                                    <Popup>{vehicle.display_name}</Popup>
                                </Marker>
                            </MapContainer>
                        ) : (
                            <div className="flex-center" style={{ height: '100%', color: 'var(--text-secondary)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <MapPin size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <div>Waiting for GPS signal...</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Charts */}
                    <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', minHeight: '300px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Telemetry History</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Line type="monotone" dataKey="speed_kmh" stroke="var(--accent)" strokeWidth={2} dot={false} name="Speed (km/h)" />
                                <Line type="monotone" dataKey="fuel_level_pct" stroke="var(--success)" strokeWidth={2} dot={false} name="Fuel (%)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Stats & Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Location Info */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={18} className="text-accent" /> Location
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div className="text-secondary text-xs">LATITUDE</div>
                                <div style={{ fontFamily: 'monospace' }}>{lat.toFixed(6)}</div>
                            </div>
                            <div>
                                <div className="text-secondary text-xs">LONGITUDE</div>
                                <div style={{ fontFamily: 'monospace' }}>{lng.toFixed(6)}</div>
                            </div>
                            <div>
                                <div className="text-secondary text-xs">HEADING</div>
                                <div>{tel.heading_deg?.toFixed(1) || 0}°</div>
                            </div>
                            <div>
                                <div className="text-secondary text-xs">ON ROUTE</div>
                                <div className={tel.on_route ? 'text-success' : 'text-danger'}>
                                    {tel.on_route ? 'Yes' : 'No'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Events */}
                    <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={18} className="text-warning" /> Recent Events
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {/* Mock events for now, or filter from history */}
                            {tel.violent_event && (
                                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
                                    <div style={{ fontWeight: 500 }}>Violent Event</div>
                                    <div className="text-sm text-secondary">{tel.violent_event}</div>
                                    <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Just now</div>
                                </div>
                            )}
                            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 500 }}>Engine Started</div>
                                <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>2 hours ago</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function VehicleDetail() {
    return (
        <ErrorBoundary>
            <VehicleDetailContent />
        </ErrorBoundary>
    );
}
