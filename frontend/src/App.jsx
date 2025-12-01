import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import History from './pages/History';
import VehicleDetail from './pages/VehicleDetail';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <WebSocketProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        {/* Protected Routes wrapped in Layout */}
                        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/map" element={<Dashboard />} /> {/* Reuse Dashboard for now */}
                            <Route path="/vehicles" element={<Dashboard />} /> {/* Reuse Dashboard for now */}
                            <Route path="/vehicles/:id" element={<VehicleDetail />} />
                            <Route path="/analytics" element={<History />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </WebSocketProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
