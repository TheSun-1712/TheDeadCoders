export interface SystemHealth {
    status: "HEALTHY" | "DEGRADED";
    uptime_seconds: number;
    traffic_processed: string;
    automation_rate: string;
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
