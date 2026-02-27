export interface SystemHealth {
    status: "HEALTHY" | "DEGRADED";
    uptime_seconds: number;
    traffic_processed: string;
    automation_rate: string;
}

export interface OverviewMetrics {
    status: "HEALTHY" | "DEGRADED";
    traffic_processed: string;
    traffic_change_percent: number;
    traffic_bars_24h: number[];
    system_health_score: number;
    automation_rate: string;
    automation_rate_value: number;
    active_threats: number;
    blocked_ips_24h: number;
    avg_blocked_per_hour: number;
    mean_time_to_respond_seconds: number;
    severity_distribution: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    decision_velocity: Array<{
        automated: number;
        human: number;
    }>;
    escalated_count: number;
    analyst_hours_saved: number;
    false_positive_rate: number;
    auto_block_threshold_percent: number;
    review_threshold_percent: number;
    db_latency_ms: number;
    api_latency_ms: number;
}

export interface Packet {
    id: number;
    timestamp: string;
    src_ip: string;
    country: string;
    lat: number;
    lon: number;
    type: string;
    confidence: number;
    destination_port: number;
    action: "MONITOR" | "AUTO_BLOCKED" | "PENDING_REVIEW" | "MANUAL_BLOCK" | "FALSE_POSITIVE";
    handled_by?: string;
    resolved_at?: string;

    // Context Data
    target_username?: string;
    burst_score?: number;
    failed_attempts?: number;
    traffic_volume?: string;
    login_behavior?: string;
}

export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: number;
    title: string;
    created_at: string;
    messages: ChatMessage[];
}

export interface Incident extends Packet {
    // Same structure as packet for now, but semantically distinct
}

export interface ThreatMapData {
    id: number;
    lat: number;
    lon: number;
    type: string;
    src_ip: string;
    country: string;
}
