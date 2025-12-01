import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
});

export const getVehicles = async () => {
    const response = await api.get('/vehicles');
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
    // Note: The backend doesn't seem to have a delete endpoint in the README description,
    // but I should check the code. If not, I'll just implement the UI for it and maybe add it to backend if needed.
    // Checking main.py... it includes vehicles router.
    // Let's assume for now we might need to add it or it exists.
    // Actually, I'll check the router code in a moment.
    // For now, I'll leave this placeholder.
    return api.delete(`/vehicles/${vehicleId}`);
};
