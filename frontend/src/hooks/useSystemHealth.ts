import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { SystemHealth } from '../types';

export function useSystemHealth() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const response = await apiClient.get<SystemHealth>('/system/health');
                setHealth(response.data);
                setError(null);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();
        // Poll every 5 seconds
        const interval = setInterval(fetchHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    return { health, loading, error };
}
