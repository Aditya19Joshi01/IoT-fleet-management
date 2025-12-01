import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                background: 'var(--bg-primary)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <Outlet />
            </main>
        </div>
    );
}
