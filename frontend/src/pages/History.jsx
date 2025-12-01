import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowLeft, Activity, Fuel } from 'lucide-react';
import { getHistory } from '../services/api';

export default function History() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistory(id);
                // Format timestamp
                const formatted = history.map(p => ({
                    ...p,
                    time: new Date(p.timestamp).toLocaleTimeString()
                })).reverse(); // API returns newest first usually, we want chronological
                setData(formatted);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [id]);

    if (loading) return <div style={{ padding: '2rem' }}>Loading history...</div>;

    return (
        <div style={{ height: '100vh', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} /> Back
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Vehicle History: {id}</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Activity size={20} color="#3b82f6" />
                        <h3 style={{ margin: 0 }}>Speed Profile (24h)</h3>
                    </div>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                                <XAxis dataKey="time" stroke="#a1a1aa" />
                                <YAxis stroke="#a1a1aa" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                                />
                                <Area type="monotone" dataKey="speed_kmh" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpeed)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Fuel size={20} color="#eab308" />
                        <h3 style={{ margin: 0 }}>Fuel Level</h3>
                    </div>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                                <XAxis dataKey="time" stroke="#a1a1aa" />
                                <YAxis domain={[0, 100]} stroke="#a1a1aa" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                                />
                                <Line type="monotone" dataKey="fuel_level_pct" stroke="#eab308" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
