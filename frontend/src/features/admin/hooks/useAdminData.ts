import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import type { Packet } from '../../../types';

export const useAdminData = () => {
    const [stats, setStats] = useState({
        openTickets: 0,
        avgResponseTime: '4m 12s', // Mock for now, backend doesn't provide this yet
    });
    const [pendingIncidents, setPendingIncidents] = useState<Packet[]>([]);
    const [recentActions, setRecentActions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            // Fetch Pending Incidents
            const incidentsRes = await apiClient.get('/incidents/pending');
            setPendingIncidents(incidentsRes.data);
            setStats(prev => ({ ...prev, openTickets: incidentsRes.data.length }));

            // Fetch Audit Logs for "Recent Actions"
            const auditRes = await apiClient.get('/logs/audit');
            // Initally assume last 5 are recent
            setRecentActions(auditRes.data.slice(-5).reverse());

            setIsLoading(false);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        const handleIncidentResolved = (event: Event) => {
            const customEvent = event as CustomEvent<{ id?: number }>;
            const resolvedId = customEvent.detail?.id;

            if (typeof resolvedId === 'number') {
                setPendingIncidents(prev => {
                    const next = prev.filter(i => i.id !== resolvedId);
                    setStats(current => ({ ...current, openTickets: next.length }));
                    return next;
                });
            }

            fetchData();
        };

        window.addEventListener('admin:incident-resolved', handleIncidentResolved);

        return () => {
            clearInterval(interval);
            window.removeEventListener('admin:incident-resolved', handleIncidentResolved);
        };
    }, []);

    const resolveIncident = async (id: number, action: 'BLOCK' | 'IGNORE') => {
        try {
            await apiClient.post(`/incidents/${id}/resolve`, { action });
            // Optimistic update
            setPendingIncidents(prev => {
                const next = prev.filter(i => i.id !== id);
                setStats(current => ({ ...current, openTickets: next.length }));
                return next;
            });
            fetchData(); // Refresh to be sure
        } catch (error) {
            console.error("Failed to resolve incident:", error);
        }
    };

    return { stats, pendingIncidents, recentActions, isLoading, resolveIncident };
};
