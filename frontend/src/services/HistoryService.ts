import { Vehicle } from '@/types/fleet';

const API_BASE = '/api';

export interface RoutePoint {
    time: string;
    latitude: number;
    longitude: number;
    speed: number;
    fuel_level?: number;
    status: string;
}

export const HistoryService = {
    getRouteHistory: async (vehicleId: string, startTime: Date, endTime: Date): Promise<RoutePoint[]> => {
        const params = new URLSearchParams({
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
        });

        const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/route-history?${params}`);
        if (!res.ok) {
            throw new Error('Failed to fetch route history');
        }
        return res.json();
    }
};
