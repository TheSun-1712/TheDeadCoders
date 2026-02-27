import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { Packet } from '../types';

export function useLiveTraffic() {
    const [traffic, setTraffic] = useState<Packet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTraffic = async () => {
            try {
                const response = await apiClient.get<Packet[]>('/traffic/live');
                setTraffic(response.data);
            } catch (err) {
                console.error("Failed to fetch traffic", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTraffic();
        const interval = setInterval(fetchTraffic, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    return { traffic, loading };
}
