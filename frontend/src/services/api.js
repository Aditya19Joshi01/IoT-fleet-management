import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
});

export const getVehicles = async () => {
    const response = await api.get('/vehicles');
    return response.data;
};

export const getVehicle = async (vehicleId) => {
    const response = await api.get(`/vehicles/${vehicleId}`);
    return response.data;
};

export const getDashboardSnapshot = async () => {
    const response = await api.get('/dashboard/snapshot');
    return response.data;
};

export const registerVehicle = async (vehicleData) => {
    const response = await api.post('/vehicles', vehicleData);
    return response.data;
};

export const deleteVehicle = async (vehicleId) => {
    return api.delete(`/vehicles/${vehicleId}`);
};

export const getHistory = async (vehicleId) => {
    const response = await api.get(`/telemetry/history/${vehicleId}`);
    return response.data;
};

export const getGeofences = async () => {
    const response = await api.get('/geofences');
    return response.data;
};

export const createGeofence = async (data) => {
    const response = await api.post('/geofences', data);
    return response.data;
};

export const deleteGeofence = async (id) => {
    return api.delete(`/geofences/${id}`);
};
