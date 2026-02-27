import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { OverviewMetrics } from '../types';

const DEFAULT_METRICS: OverviewMetrics = {
    status: 'DEGRADED',
    traffic_processed: '0.0k',
    traffic_change_percent: 0,
    traffic_bars_24h: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    system_health_score: 0,
    automation_rate: '0.0%',
    automation_rate_value: 0,
    active_threats: 0,
    blocked_ips_24h: 0,
    avg_blocked_per_hour: 0,
    mean_time_to_respond_seconds: 0,
    severity_distribution: { critical: 0, high: 0, medium: 0, low: 0 },
    decision_velocity: [
        { automated: 0, human: 0 },
        { automated: 0, human: 0 },
        { automated: 0, human: 0 },
        { automated: 0, human: 0 },
        { automated: 0, human: 0 },
        { automated: 0, human: 0 },
    ],
    escalated_count: 0,
    analyst_hours_saved: 0,
    false_positive_rate: 0,
    auto_block_threshold_percent: 95,
    review_threshold_percent: 85,
    db_latency_ms: 0,
    api_latency_ms: 0,
};

export function useOverviewMetrics() {
    const [metrics, setMetrics] = useState<OverviewMetrics>(DEFAULT_METRICS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fallbackFromHealth = async () => {
            const healthRes = await apiClient.get('/system/health');
            const trafficRes = await apiClient.get('/traffic/live');
            const pendingRes = await apiClient.get('/incidents/pending');
            const auditRes = await apiClient.get('/logs/audit');

            const health = healthRes.data as {
                status: 'HEALTHY' | 'DEGRADED';
                traffic_processed: string;
                automation_rate: string;
            };
            const traffic = (trafficRes.data ?? []) as Array<{
                type?: string;
                timestamp?: string;
                action?: string;
            }>;
            const pending = (pendingRes.data ?? []) as Array<{ id: number }>;
            const audit = (auditRes.data ?? []) as Array<{
                action?: string;
                timestamp?: string;
            }>;

            const automationValue = Number.parseFloat((health.automation_rate || '0').replace('%', '')) || 0;
            const threatTraffic = traffic.filter((t) => (t.type || '').toLowerCase() !== 'normal traffic');
            const blocked24h = audit.filter((a) => a.action === 'AUTO_BLOCKED' || a.action === 'MANUAL_BLOCK').length;
            const falsePositives = audit.filter((a) => a.action === 'FALSE_POSITIVE').length;

            const severity = { critical: 0, high: 0, medium: 0, low: 0 };
            threatTraffic.forEach((item) => {
                const t = (item.type || '').toLowerCase();
                if (t.includes('ddos') || t.includes('dos') || t.includes('heartbleed')) severity.critical += 1;
                else if (t.includes('brute') || t.includes('sql') || t.includes('xss') || t.includes('bot')) severity.high += 1;
                else if (t.includes('port') || t.includes('scan')) severity.medium += 1;
                else severity.low += 1;
            });

            const now = Date.now();
            const decisionVelocity = [0, 1, 2, 3, 4, 5].map(() => ({ automated: 0, human: 0 }));
            audit.forEach((a) => {
                if (!a.timestamp) return;
                const ts = new Date(a.timestamp).getTime();
                if (Number.isNaN(ts)) return;
                const hoursAgo = (now - ts) / (1000 * 60 * 60);
                if (hoursAgo < 0 || hoursAgo >= 24) return;
                const idx = 5 - Math.floor(hoursAgo / 4);
                if (idx < 0 || idx > 5) return;
                if (a.action === 'AUTO_BLOCKED') decisionVelocity[idx].automated += 1;
                else decisionVelocity[idx].human += 1;
            });

            const fallback: OverviewMetrics = {
                status: health.status,
                traffic_processed: health.traffic_processed,
                traffic_change_percent: 0,
                traffic_bars_24h: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                system_health_score: health.status === 'HEALTHY' ? 98 : 75,
                automation_rate: health.automation_rate,
                automation_rate_value: automationValue,
                active_threats: threatTraffic.length,
                blocked_ips_24h: blocked24h,
                avg_blocked_per_hour: Number((blocked24h / 24).toFixed(1)),
                mean_time_to_respond_seconds: 0,
                severity_distribution: severity,
                decision_velocity: decisionVelocity,
                escalated_count: pending.length,
                analyst_hours_saved: Number(((blocked24h * 15) / 60).toFixed(1)),
                false_positive_rate: audit.length > 0 ? Number(((falsePositives / audit.length) * 100).toFixed(2)) : 0,
                auto_block_threshold_percent: 95,
                review_threshold_percent: 85,
                db_latency_ms: 0,
                api_latency_ms: 0,
            };
            setMetrics(fallback);
            setError(null);
        };

        const fetchMetrics = async () => {
            try {
                const response = await apiClient.get<OverviewMetrics>('/metrics/overview');
                setMetrics(response.data);
                setError(null);
            } catch (err) {
                try {
                    await fallbackFromHealth();
                } catch (fallbackErr) {
                    setError(fallbackErr as Error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
    }, []);

    return { metrics, loading, error };
}
