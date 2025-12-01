import React, { useState } from 'react';
import { Trash2, Plus, Truck, MapPin } from 'lucide-react';

export default function VehicleList({ vehicles, onSelect, onDelete, onAdd }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newId, setNewId] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (newId) {
            onAdd({ vehicle_id: newId, display_name: newId });
            setNewId('');
            setIsAdding(false);
        }
    };

    return (
        <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Fleet</h2>
                <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    <Plus size={16} /> Add
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <input
                        className="input"
                        placeholder="Vehicle ID"
                        value={newId}
                        onChange={e => setNewId(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="btn btn-primary">Save</button>
                </form>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {vehicles.length === 0 && (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
                        No vehicles active
                    </div>
                )}
                {vehicles.map(v => (
                    <div
                        key={v.vehicle_id}
                        className="glass-panel"
                        style={{
                            padding: '0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                        onClick={() => onSelect(v)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Truck size={16} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 500 }}>{v.vehicle_id}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={10} />
                                    {v.speed_kmh.toFixed(0)} km/h • {v.fuel_level_pct.toFixed(0)}% Fuel
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn btn-danger"
                            style={{ padding: '0.25rem' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete vehicle?')) onDelete(v.vehicle_id);
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
