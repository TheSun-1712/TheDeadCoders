from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
import pandas as pd
import joblib
import json
import csv
import random
import time
import asyncio
import numpy as np
from datetime import datetime, timedelta, timezone
import os
import secrets
import base64
import hmac
import hashlib
import threading
from typing import Optional
from xgboost import DMatrix
from collections import deque

# --- CONFIGURATION ---
MODEL_FILE = 'multiclass_xgboost_ids.joblib'
EXPLAIN_MODEL_FILE = 'xgboost_explainer.joblib'
LABEL_ENCODER_FILE = 'label_encoder.joblib'
FEATURE_FILE = 'feature_columns.json'
MODEL_METADATA_FILE = 'model_metadata.json'
FEATURE_BASELINE_FILE = 'feature_baseline.json'
TRAINING_FEEDBACK_FILE = 'training_feedback.csv'
CONFIG_STATE_FILE = 'config_state.json'
SIMULATED_FILE = 'large_simulation_log.csv'

# --- COUNTRY MAPPING (For Portal A Map) ---
COUNTRY_COORDS = {
    "USA": [37.0902, -95.7129], "China": [35.8617, 104.1954],
    "Russia": [61.5240, 105.3188], "Germany": [51.1657, 10.4515],
    "Brazil": [-14.2350, -51.9253], "India": [20.5937, 78.9629],
    "North Korea": [40.3399, 127.5101], "Unknown": [0, 0]
}

from sqlalchemy.orm import Session
from fastapi import Depends
from database import get_db, TrafficLog, AutoBlocked, ManualReview, init_db

# Initialize DB on startup
init_db()

# --- GLOBAL STATE (Configuration Only) ---
class SystemState:
    def __init__(self):
        # We keep stats in memory for performance, but sync critical logs to DB
        self.stats = {
            "scanned": 0,
            "threats_detected": 0,
            "auto_blocked": 0,
            "manual_blocked": 0,
            "uptime_start": time.time()
        }
        self.config = {
            "auto_block_threshold": 0.92, # 92% confidence baseline
            "simulation_speed": 1.0,       # Seconds per packet
            "dynamic_threshold_enabled": True,
            "min_threshold": 0.85,
            "max_threshold": 0.995,
            "model_noise_rate": 0.05,
            "auto_resolve_pending_enabled": True,
            "pending_auto_resolve_queue_trigger": 18,
            "pending_auto_resolve_delta": 0.03,
            "target_automation_min": 70.0,
            "target_automation_max": 90.0
        }
        self._load_persisted_config()
        self.recent_threat_actions = deque(maxlen=400)
        self.is_running = True

    def _load_persisted_config(self):
        if not os.path.exists(CONFIG_STATE_FILE):
            return
        try:
            with open(CONFIG_STATE_FILE, "r", encoding="utf-8") as f:
                persisted = json.load(f)
            if isinstance(persisted, dict):
                self.config.update({k: v for k, v in persisted.items() if k in self.config})
        except Exception as e:
            print(f"Failed to load config state: {e}")

    def persist_config(self):
        try:
            with open(CONFIG_STATE_FILE, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            print(f"Failed to persist config state: {e}")

state = SystemState()

# --- LOAD ASSETS ---
print("Loading AI Models...")
model = joblib.load(MODEL_FILE)
explain_model = joblib.load(EXPLAIN_MODEL_FILE) if os.path.exists(EXPLAIN_MODEL_FILE) else model
label_encoder = joblib.load(LABEL_ENCODER_FILE)
scaler = joblib.load('scaler.joblib') if os.path.exists('scaler.joblib') else None
with open(FEATURE_FILE, 'r') as f:
    feature_columns = json.load(f)
model_metadata = {}
feature_baseline = {}
if os.path.exists(MODEL_METADATA_FILE):
    with open(MODEL_METADATA_FILE, 'r', encoding='utf-8') as f:
        model_metadata = json.load(f)
if os.path.exists(FEATURE_BASELINE_FILE):
    with open(FEATURE_BASELINE_FILE, 'r', encoding='utf-8') as f:
        feature_baseline = json.load(f)
model_version = model_metadata.get("version", "unknown")


def _add_engineered_features(row: pd.Series) -> dict:
    """Create raw + engineered feature values from one traffic row."""
    values = row.to_dict()
    eps = 1e-6
    values["feat_bytes_per_packet"] = float(values.get("Flow Bytes/s", 0.0)) / (float(values.get("Flow Packets/s", 0.0)) + eps)
    values["feat_fwd_bwd_rate_ratio"] = float(values.get("Fwd Packets/s", 0.0)) / (float(values.get("Bwd Packets/s", 0.0)) + eps)
    values["feat_flow_iat_range"] = float(values.get("Flow IAT Max", 0.0)) - float(values.get("Flow IAT Min", 0.0))
    values["feat_packet_len_range"] = float(values.get("Max Packet Length", 0.0)) - float(values.get("Min Packet Length", 0.0))
    values["feat_packet_length_cv"] = float(values.get("Packet Length Std", 0.0)) / (float(values.get("Packet Length Mean", 0.0)) + eps)
    return values


def _build_feature_frame(row: pd.Series) -> pd.DataFrame:
    values = _add_engineered_features(row)
    ordered = {col: values.get(col, 0.0) for col in feature_columns}
    return pd.DataFrame([ordered], columns=feature_columns)


def _generate_explanation(features_scaled: pd.DataFrame, pred_numeric: int) -> str:
    """Generate tree contribution explanation using pred_contribs when possible."""
    try:
        base = explain_model
        if hasattr(base, "base_estimator"):
            base = base.base_estimator
        if not hasattr(base, "get_booster"):
            raise ValueError("No xgboost booster found for explanation")
        booster = base.get_booster()
        contrib = booster.predict(DMatrix(features_scaled, feature_names=features_scaled.columns.tolist()), pred_contribs=True)
        contrib_arr = np.array(contrib)
        if contrib_arr.ndim == 3:
            class_idx = max(0, min(pred_numeric, contrib_arr.shape[1] - 1))
            contrib_row = contrib_arr[0, class_idx, :-1]
        else:
            contrib_row = contrib_arr[0, :-1]
        top_idx = np.argsort(np.abs(contrib_row))[::-1][:3]
        top = [f"{features_scaled.columns[i]} ({contrib_row[i]:+.3f})" for i in top_idx]
        return "Top contributors: " + ", ".join(top)
    except Exception:
        top_features = features_scaled.iloc[0].abs().sort_values(ascending=False).head(3).index.tolist()
        return f"Top contributing features: {', '.join(top_features)}"


def _compute_automation_rate() -> float:
    threats_detected = state.stats["threats_detected"]
    if threats_detected <= 0:
        return 0.0
    return 100.0 * state.stats["auto_blocked"] / threats_detected


def _compute_automation_rate_24h(db: Session) -> float:
    now = datetime.utcnow()
    # Prefer recent/current-model behavior so stale history doesn't dominate the score.
    day_ago = now - timedelta(hours=2)
    threat_count = db.query(TrafficLog).filter(
        TrafficLog.timestamp >= day_ago,
        TrafficLog.type != "Normal Traffic",
        TrafficLog.model_version == model_version
    ).count()
    if threat_count <= 0:
        return 0.0
    auto_count = db.query(TrafficLog).filter(
        TrafficLog.timestamp >= day_ago,
        TrafficLog.action == "AUTO_BLOCKED",
        TrafficLog.model_version == model_version
    ).count()
    return 100.0 * auto_count / threat_count


def _compute_system_status(pending_count: int) -> str:
    return "HEALTHY" if pending_count < 12 else "DEGRADED"


def _compute_health_score(pending_count: int, automation_rate: float) -> int:
    # Keep health responsive but not overly punitive for short queue spikes.
    raw = 92.0 - (1.2 * pending_count) + min(8.0, automation_rate * 0.08)
    return int(max(65, min(99, round(raw))))

# Load Traffic Data
if os.path.exists(SIMULATED_FILE):
    traffic_df = pd.read_csv(SIMULATED_FILE)
    traffic_df.columns = traffic_df.columns.str.strip()
    print(f"Loaded {len(traffic_df)} rows of traffic data.")
else:
    raise FileNotFoundError(f"Run 'mine_all_attacks.py' first!")

# --- BACKGROUND SIMULATOR ---
# This thread mimics live traffic coming into the router
def traffic_simulator():
    index = 0
    # Create a dedicated session for the background thread
    from database import SessionLocal
    
    # --- OPTIONAL DB RESET FOR NEW SCHEMA (Drop and Recreate) ---
    # Disabled by default to preserve runtime history across restarts.
    reset_db_on_start = os.getenv("RESET_DB_ON_START", "false").strip().lower() == "true"
    if reset_db_on_start:
        print("RESET_DB_ON_START=true -> Resetting Database Schema...")
        from database import Base, engine
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Database Reset Complete.")
    else:
        print("RESET_DB_ON_START=false -> Keeping existing database data.")
    
    while True:
        if state.is_running:
            db = SessionLocal()
            try:
                # 1. Get Next Packet
                row = traffic_df.iloc[index % len(traffic_df)]
                index += 1

                # 2. Predict
                features = _build_feature_frame(row)
                features = features.replace([np.inf, -np.inf], np.nan).fillna(0.0)
                feature_snapshot = features.iloc[0].to_dict()
                if scaler is not None:
                    features = pd.DataFrame(scaler.transform(features), columns=feature_columns)

                # Use model probabilities for reliable confidence and class decision.
                if hasattr(model, "predict_proba"):
                    probs = model.predict_proba(features)[0]
                    pred_numeric = int(np.argmax(probs))
                    confidence = float(np.max(probs))
                else:
                    pred_numeric = int(model.predict(features)[0])
                    confidence = 1.0

                # Controlled uncertainty injection for realistic simulation behavior.
                noise_rate = float(state.config.get("model_noise_rate", 0.0))
                if noise_rate > 0 and random.random() < noise_rate and hasattr(model, "predict_proba"):
                    ranked = np.argsort(probs)[::-1]
                    if len(ranked) > 1:
                        pred_numeric = int(ranked[1])
                        confidence = max(0.50, confidence - random.uniform(0.10, 0.25))

                pred_text = label_encoder.inverse_transform([pred_numeric])[0]
                
                # Dynamic Thresholding Adjustment
                current_threshold = state.config["auto_block_threshold"]
                if state.config["dynamic_threshold_enabled"]:
                    # Keep automation in a target band while considering queue pressure.
                    pending_count = db.query(ManualReview).filter(ManualReview.status == "PENDING").count()
                    recent_rate = None
                    if len(state.recent_threat_actions) >= 40:
                        auto_recent = sum(1 for a in state.recent_threat_actions if a == "AUTO")
                        recent_rate = 100.0 * auto_recent / len(state.recent_threat_actions)

                    target_min = float(state.config.get("target_automation_min", 70.0))
                    target_max = float(state.config.get("target_automation_max", 90.0))
                    if recent_rate is not None and recent_rate > target_max:
                        current_threshold = min(state.config["max_threshold"], current_threshold + 0.02)
                    elif recent_rate is not None and recent_rate < target_min:
                        # Recover quickly when automation is too low.
                        step = 0.02 if recent_rate < max(0.0, target_min - 20.0) else 0.01
                        current_threshold = max(state.config["min_threshold"], current_threshold - step)
                    elif pending_count > 20:
                        current_threshold = max(state.config["min_threshold"], current_threshold - 0.01)
                    elif pending_count < 6:
                        current_threshold = min(state.config["max_threshold"], current_threshold + 0.01)
                    state.config["auto_block_threshold"] = round(current_threshold, 2)

                # Real model contribution explanation (with safe fallback).
                explanation = _generate_explanation(features, pred_numeric)
                fake_ip = f"192.168.1.{random.randint(10, 200)}"
                fake_country = random.choice(list(COUNTRY_COORDS.keys()))
                timestamp = datetime.now() # Use datetime object for DB

                # --- NEW CONTEXT DATA GENERATION ---
                target_username = None
                burst_score = 0.0
                failed_attempts = 0
                traffic_volume = "Normal"
                login_behavior = "Normal"

                # Traffic Volume
                if "DoS" in pred_text:
                     traffic_volume = random.choices(["High", "Medium"], weights=[0.8, 0.2])[0]
                elif pred_text == "Normal Traffic":
                     traffic_volume = random.choices(["Normal", "Low"], weights=[0.7, 0.3])[0]
                else:
                     traffic_volume = random.choices(["Medium", "High"], weights=[0.6, 0.4])[0]

                # Burst Score
                if pred_text == "Normal Traffic":
                    burst_score = round(random.uniform(0.0, 1.4), 2)
                else:
                    burst_score = round(random.uniform(1.5, 5.0), 2)

                # Failed Attempts & Login Behavior
                # Logic:
                # - Brute Force / Bot / Web Attack -> "Detected" (High failed attempts, specific username)
                # - DDoS / DoS / PortScan -> "Suspicious" (Some failed attempts, no specific username usually, but we can simmer it)
                # - Normal -> "Normal"

                is_brute_force = any(x in pred_text for x in ["Brute", "Force", "Patator", "Web Attack", "Sql", "XSS"])
                is_bot = "Bot" in pred_text
                is_dos = any(x in pred_text for x in ["DoS", "DDoS", "Heartbleed"])
                is_scan = "Port" in pred_text or "Scan" in pred_text

                if is_brute_force or is_bot:
                    failed_attempts = random.randint(5, 50)
                    login_behavior = "Detected"
                    target_username = random.choice(["admin", "root", "user1", "test_user", "service_account", "postgres", "manager"])
                elif is_dos or is_scan:
                    failed_attempts = random.randint(1, 6) # DDoS doesn't necessarily fail logins, but might cause timeouts/errors
                    login_behavior = "Suspicious"
                    target_username = None # Usually targeting infrastructure, not accounts
                elif "Normal" in pred_text:
                    failed_attempts = random.randint(0, 3)
                    login_behavior = "Normal"
                    target_username = None
                else:
                    # Fallback for other attacks
                    failed_attempts = random.randint(2, 10)
                    login_behavior = "Suspicious"
                    target_username = None

                # 4. Create Traffic Log Entry
                traffic_log = TrafficLog(
                    timestamp=timestamp,
                    src_ip=fake_ip,
                    country=fake_country,
                    lat=COUNTRY_COORDS[fake_country][0],
                    lon=COUNTRY_COORDS[fake_country][1],
                    type=pred_text,
                    confidence=confidence,
                    destination_port=int(row.get("Destination Port", 0)),
                    action="MONITOR",
                    # New Fields
                    target_username=target_username,
                    burst_score=burst_score,
                    failed_attempts=failed_attempts,
                    traffic_volume=traffic_volume,
                    login_behavior=login_behavior,
                    feature_snapshot=json.dumps(feature_snapshot),
                    model_version=model_version
                )

                # 5. SOAR Logic (The Brain)
                state.stats["scanned"] += 1
                
                if pred_text != "Normal Traffic":
                    state.stats["threats_detected"] += 1
                    
                    # Check Auto-Block Policy
                    if confidence >= state.config["auto_block_threshold"]:
                        traffic_log.action = "AUTO_BLOCKED"
                        state.stats["auto_blocked"] += 1
                        state.recent_threat_actions.append("AUTO")
                        
                        # Add to AutoBlocked Table
                        auto_block_entry = AutoBlocked(
                            timestamp=timestamp,
                            src_ip=fake_ip,
                            country=fake_country,
                            limit_reached=f"Confidence > {state.config['auto_block_threshold']*100}%",
                            confidence=confidence,
                            type=pred_text,
                            model_version=model_version
                        )
                        db.add(auto_block_entry)
                        
                    else:
                        # Send to Portal B (Human Review)
                        traffic_log.action = "PENDING_REVIEW"
                        state.recent_threat_actions.append("PENDING")
                        
                        # Add to ManualReview Table (Only if not duplicate/flooding - simplified for DB)
                        pending_count = db.query(ManualReview).filter(ManualReview.status == "PENDING").count()
                        if pending_count < 20: # cap pending queue
                            manual_entry = ManualReview(
                                timestamp=timestamp,
                                src_ip=fake_ip,
                                country=fake_country,
                                type=pred_text,
                                confidence=confidence,
                                destination_port=int(row.get("Destination Port", 0)),
                                status="PENDING",
                                # New Fields
                                target_username=target_username,
                                burst_score=burst_score,
                                failed_attempts=failed_attempts,
                                traffic_volume=traffic_volume,
                                login_behavior=login_behavior,
                                explanation=explanation,
                                feature_snapshot=json.dumps(feature_snapshot),
                                model_version=model_version
                            )
                            db.add(manual_entry)
                            db.flush()

                            # Optional automatic queue relief: promote high-confidence pending events.
                            if state.config.get("auto_resolve_pending_enabled", True):
                                queue_trigger = int(state.config.get("pending_auto_resolve_queue_trigger", 10))
                                pending_after_insert = db.query(ManualReview).filter(ManualReview.status == "PENDING").count()
                                if pending_after_insert >= queue_trigger:
                                    promote_threshold = max(
                                        state.config["min_threshold"],
                                        current_threshold - float(state.config.get("pending_auto_resolve_delta", 0.10))
                                    )
                                    recent_rate = None
                                    if len(state.recent_threat_actions) >= 40:
                                        auto_recent = sum(1 for a in state.recent_threat_actions if a == "AUTO")
                                        recent_rate = 100.0 * auto_recent / len(state.recent_threat_actions)
                                    target_max = float(state.config.get("target_automation_max", 90.0))
                                    if confidence >= promote_threshold and (recent_rate is None or recent_rate <= target_max):
                                        manual_entry.status = "RESOLVED"
                                        manual_entry.action_taken = "AUTO_BLOCKED"
                                        manual_entry.analyst_id = "SYSTEM_AUTOMATION"
                                        manual_entry.resolved_at = datetime.utcnow()

                                        traffic_log.action = "AUTO_BLOCKED"
                                        state.stats["auto_blocked"] += 1
                                        state.recent_threat_actions.append("AUTO")

                                        auto_block_entry = AutoBlocked(
                                            timestamp=timestamp,
                                            src_ip=fake_ip,
                                            country=fake_country,
                                            limit_reached=f"Queue relief: Confidence >= {promote_threshold*100:.1f}%",
                                            confidence=confidence,
                                            type=pred_text,
                                            model_version=model_version
                                        )
                                        db.add(auto_block_entry)

                # Save Traffic Log
                traffic_log.explanation = explanation
                db.add(traffic_log)
                db.commit()

            except Exception as e:
                print(f"Simulation Error: {e}")
                db.rollback()
            finally:
                db.close() # Important to close session in thread loop

        # Wait based on config speed
        time.sleep(state.config["simulation_speed"])

# Start Simulation in Background Thread
sim_thread = threading.Thread(target=traffic_simulator, daemon=True)
sim_thread.start()

# --- API ENDPOINTS ---
app = FastAPI(title="Pixel Pioneers SOAR API")
from ai.router import router as ai_router

# Allow Frontend (React/Next.js) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

# --- ADMIN AUTH ---
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_TOKEN_TTL_SECONDS = int(os.getenv("ADMIN_TOKEN_TTL_SECONDS", "28800"))
ADMIN_AUTH_SECRET = os.getenv("ADMIN_AUTH_SECRET", "sentinel-admin-secret")
admin_auth_scheme = HTTPBearer(auto_error=False)


class AdminLoginRequest(BaseModel):
    username: str
    password: str


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(text: str) -> bytes:
    padding = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + padding)


def _sign_admin_payload(encoded_payload: str) -> str:
    digest = hmac.new(
        ADMIN_AUTH_SECRET.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return _b64url_encode(digest)


def _create_admin_token() -> str:
    payload = {
        "sub": ADMIN_USERNAME,
        "exp": int(time.time()) + ADMIN_TOKEN_TTL_SECONDS,
        "nonce": secrets.token_urlsafe(8),
    }
    encoded_payload = _b64url_encode(
        json.dumps(payload, separators=(",", ":")).encode("utf-8")
    )
    signature = _sign_admin_payload(encoded_payload)
    return f"{encoded_payload}.{signature}"


def _is_admin_token_valid(token: str) -> bool:
    try:
        encoded_payload, signature = token.split(".", 1)
        expected_sig = _sign_admin_payload(encoded_payload)
        if not hmac.compare_digest(signature, expected_sig):
            return False

        payload_raw = _b64url_decode(encoded_payload)
        payload = json.loads(payload_raw.decode("utf-8"))
        if payload.get("sub") != ADMIN_USERNAME:
            return False
        exp = int(payload.get("exp", 0))
        return exp > int(time.time())
    except Exception:
        return False


@app.post("/api/auth/admin/login")
def admin_login(body: AdminLoginRequest):
    if body.username != ADMIN_USERNAME or body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = _create_admin_token()
    return {
        "token": token,
        "expires_in": ADMIN_TOKEN_TTL_SECONDS,
        "username": ADMIN_USERNAME,
    }


@app.get("/api/auth/admin/me")
def admin_me(credentials: Optional[HTTPAuthorizationCredentials] = Depends(admin_auth_scheme)):
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Admin authentication required")
    if not _is_admin_token_valid(credentials.credentials):
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")
    return {"authenticated": True, "username": ADMIN_USERNAME}

# === PORTAL A ENDPOINTS (Read-Only / Monitoring) ===

@app.get("/api/system/health")
def get_system_health(db: Session = Depends(get_db)):
    """For Page A0: System Overview"""
    pending_count = db.query(ManualReview).filter(ManualReview.status == "PENDING").count()
    uptime_seconds = int(time.time() - state.stats["uptime_start"])
    automation_rate = _compute_automation_rate_24h(db)
    return {
        "status": _compute_system_status(pending_count),
        "uptime_seconds": uptime_seconds,
        "traffic_processed": f"{state.stats['scanned'] / 1000:.1f}k",
        "automation_rate": f"{automation_rate:.1f}%"
    }

def _severity_bucket(attack_type: str) -> str:
    text = (attack_type or "").lower()
    if "normal" in text:
        return "low"
    if any(token in text for token in ["ddos", "dos", "heartbleed", "infiltration", "botnet"]):
        return "critical"
    if any(token in text for token in ["brute", "patator", "sql", "xss", "web attack", "bot"]):
        return "high"
    if any(token in text for token in ["port", "scan"]):
        return "medium"
    return "medium"

def _to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Normalize DB datetimes so arithmetic/comparisons do not fail on tz-aware values."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

def _default_overview_metrics() -> dict:
    return {
        "status": "DEGRADED",
        "traffic_processed": "0.0k",
        "traffic_change_percent": 0.0,
        "traffic_bars_24h": [0] * 12,
        "system_health_score": 0,
        "automation_rate": "0.0%",
        "automation_rate_value": 0.0,
        "active_threats": 0,
        "blocked_ips_24h": 0,
        "avg_blocked_per_hour": 0.0,
        "mean_time_to_respond_seconds": 0,
        "severity_distribution": {"critical": 0, "high": 0, "medium": 0, "low": 0},
        "decision_velocity": [{"automated": 0, "human": 0}] * 6,
        "escalated_count": 0,
        "analyst_hours_saved": 0.0,
        "false_positive_rate": 0.0,
        "auto_block_threshold_percent": round(state.config["auto_block_threshold"] * 100, 1),
        "review_threshold_percent": round(state.config["min_threshold"] * 100, 1),
        "db_latency_ms": 0.0,
        "api_latency_ms": 0.0,
        "model_version": model_version,
    }

@app.get("/api/metrics/overview")
def get_overview_metrics(db: Session = Depends(get_db)):
    """Unified metrics payload for client dashboards."""
    req_start = time.perf_counter()
    try:
        now = datetime.utcnow()
        day_ago = now - timedelta(hours=24)
        half_day_ago = now - timedelta(hours=12)

        db_probe_start = time.perf_counter()
        db.query(TrafficLog.id).limit(1).all()
        db_latency_ms = round((time.perf_counter() - db_probe_start) * 1000, 1)

        logs_24h = db.query(TrafficLog).filter(TrafficLog.timestamp >= day_ago).all()
        logs_with_ts = []
        for log in logs_24h:
            ts = _to_naive_utc(log.timestamp)
            if ts is None:
                continue
            logs_with_ts.append((log, ts))
        threat_logs_24h = [log for log in logs_24h if log.type != "Normal Traffic"]

        auto_24h = db.query(AutoBlocked).filter(AutoBlocked.timestamp >= day_ago).all()
        auto_with_ts = [(_to_naive_utc(item.timestamp), item) for item in auto_24h]

        manual_resolved_24h = db.query(ManualReview).filter(
            ManualReview.status == "RESOLVED",
            ManualReview.timestamp >= day_ago
        ).all()
        pending_count = db.query(ManualReview).filter(ManualReview.status == "PENDING").count()

        traffic_last_12h = sum(1 for _, ts in logs_with_ts if ts >= half_day_ago)
        traffic_prev_12h = len(logs_with_ts) - traffic_last_12h
        if traffic_prev_12h == 0:
            traffic_change_percent = 100.0 if traffic_last_12h > 0 else 0.0
        else:
            traffic_change_percent = ((traffic_last_12h - traffic_prev_12h) / traffic_prev_12h) * 100.0

        traffic_bars_24h = [0] * 12
        for _, ts in logs_with_ts:
            delta_hours = (now - ts).total_seconds() / 3600.0
            if 0 <= delta_hours < 24:
                idx = 11 - int(delta_hours // 2)
                traffic_bars_24h[max(0, min(11, idx))] += 1

        severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for log in threat_logs_24h:
            severity[_severity_bucket(log.type)] += 1

        decision_velocity = []
        for slot in range(6):
            slot_end = now - timedelta(hours=slot * 4)
            slot_start = slot_end - timedelta(hours=4)

            automated = sum(
                1 for ts, _ in auto_with_ts
                if ts and slot_start <= ts < slot_end
            )
            human = 0
            for item in manual_resolved_24h:
                ts = _to_naive_utc(item.timestamp)
                if ts and slot_start <= ts < slot_end:
                    human += 1
            decision_velocity.append({"automated": automated, "human": human})
        decision_velocity.reverse()

        response_times = []
        false_positives = 0
        for item in manual_resolved_24h:
            ts_created = _to_naive_utc(item.timestamp)
            ts_resolved = _to_naive_utc(item.resolved_at)
            if ts_created and ts_resolved and ts_resolved >= ts_created:
                response_times.append((ts_resolved - ts_created).total_seconds())
            if item.action_taken == "FALSE_POSITIVE":
                false_positives += 1
        mean_time_to_respond_seconds = int(sum(response_times) / len(response_times)) if response_times else 0

        automation_rate_value = _compute_automation_rate_24h(db)
        health_score = _compute_health_score(pending_count, automation_rate_value)
        analyst_hours_saved = round((len(auto_24h) * 15) / 60.0, 1)
        false_positive_rate = (100.0 * false_positives / len(manual_resolved_24h)) if manual_resolved_24h else 0.0

        payload = {
            "status": _compute_system_status(pending_count),
            "traffic_processed": f"{state.stats['scanned'] / 1000:.1f}k",
            "traffic_change_percent": round(traffic_change_percent, 1),
            "traffic_bars_24h": traffic_bars_24h,
            "system_health_score": health_score,
            "automation_rate": f"{automation_rate_value:.1f}%",
            "automation_rate_value": round(automation_rate_value, 1),
            "active_threats": len(threat_logs_24h),
            "blocked_ips_24h": len(auto_24h),
            "avg_blocked_per_hour": round(len(auto_24h) / 24.0, 1),
            "mean_time_to_respond_seconds": mean_time_to_respond_seconds,
            "severity_distribution": severity,
            "decision_velocity": decision_velocity,
            "escalated_count": pending_count,
            "analyst_hours_saved": analyst_hours_saved,
            "false_positive_rate": round(false_positive_rate, 2),
            "auto_block_threshold_percent": round(state.config["auto_block_threshold"] * 100, 1),
            "review_threshold_percent": round(state.config["min_threshold"] * 100, 1),
            "db_latency_ms": db_latency_ms,
            "model_version": model_version,
        }
        payload["api_latency_ms"] = round((time.perf_counter() - req_start) * 1000, 1)
        return payload
    except Exception as e:
        print(f"Metrics endpoint error: {e}")
        payload = _default_overview_metrics()
        payload["traffic_processed"] = f"{state.stats['scanned'] / 1000:.1f}k"
        payload["automation_rate"] = f"{(100.0 * state.stats['auto_blocked'] / state.stats['threats_detected']) if state.stats['threats_detected'] > 0 else 0.0:.1f}%"
        payload["api_latency_ms"] = round((time.perf_counter() - req_start) * 1000, 1)
        return payload


@app.get("/api/model/info")
def get_model_info():
    """Expose current model metadata/version for debugging and governance."""
    return {
        "model_version": model_version,
        "metadata": model_metadata,
        "feature_count": len(feature_columns),
        "feature_file": FEATURE_FILE,
    }


@app.get("/api/model/drift")
def get_model_drift(db: Session = Depends(get_db)):
    """Simple z-score drift monitor against training baseline."""
    if not feature_baseline or "mean" not in feature_baseline or "std" not in feature_baseline:
        return {"status": "unavailable", "reason": "feature baseline artifact missing"}

    logs = db.query(TrafficLog).order_by(TrafficLog.timestamp.desc()).limit(200).all()
    snapshots = []
    for log in logs:
        if not log.feature_snapshot:
            continue
        try:
            snapshots.append(json.loads(log.feature_snapshot))
        except Exception:
            continue

    if not snapshots:
        return {"status": "unavailable", "reason": "no feature snapshots available yet"}

    live_df = pd.DataFrame(snapshots).replace([np.inf, -np.inf], np.nan).fillna(0.0)
    live_means = live_df.mean(numeric_only=True).to_dict()
    train_mean = feature_baseline.get("mean", {})
    train_std = feature_baseline.get("std", {})

    drift_scores = {}
    for feature, mean_val in train_mean.items():
        if feature not in live_means:
            continue
        std_val = float(train_std.get(feature, 1e-6))
        z = abs((float(live_means[feature]) - float(mean_val)) / max(std_val, 1e-6))
        drift_scores[feature] = round(z, 4)

    top = sorted(drift_scores.items(), key=lambda kv: kv[1], reverse=True)[:10]
    avg = float(np.mean(list(drift_scores.values()))) if drift_scores else 0.0
    return {
        "status": "ok",
        "model_version": model_version,
        "sample_size": len(snapshots),
        "average_z_drift": round(avg, 4),
        "top_drift_features": [{"feature": k, "z_score": v} for k, v in top],
    }

@app.get("/api/traffic/live")
def get_live_traffic(db: Session = Depends(get_db)):
    """For Page A1: Command Center & A4: Event Stream"""
    # Get last 20 logs from DB
    logs = db.query(TrafficLog).order_by(TrafficLog.timestamp.desc()).limit(20).all()
    return logs

@app.get("/api/threats/map")
def get_threat_map(db: Session = Depends(get_db)):
    """For Page A3: Global Map"""
    # Filter only threats from last 100 logs
    logs = db.query(TrafficLog).filter(TrafficLog.type != "Normal Traffic").order_by(TrafficLog.timestamp.desc()).limit(100).all()
    return logs


@app.get("/api/threats/map/batches")
def get_threat_map_batches(batch_size: int = 10, limit: int = 200, db: Session = Depends(get_db)):
    """Return threat-map events grouped into JSON batches (default 10 logs per batch)."""
    safe_batch = max(1, min(batch_size, 50))
    safe_limit = max(10, min(limit, 1000))

    logs = (
        db.query(TrafficLog)
        .filter(TrafficLog.type != "Normal Traffic")
        .order_by(TrafficLog.timestamp.asc())
        .limit(safe_limit)
        .all()
    )

    events = []
    for log in logs:
        events.append({
            "id": log.id,
            "timestamp": log.timestamp,
            "lat": log.lat,
            "lon": log.lon,
            "type": log.type,
            "src_ip": log.src_ip,
            "country": log.country,
            "confidence": log.confidence,
            "action": log.action,
        })

    batches = [events[i:i + safe_batch] for i in range(0, len(events), safe_batch)]
    return {
        "batch_size": safe_batch,
        "total_events": len(events),
        "total_batches": len(batches),
        "batches": batches,
    }

# === PORTAL B ENDPOINTS (Admin / Action) ===

@app.get("/api/incidents/pending")
def get_pending_incidents(db: Session = Depends(get_db)):
    """For Page B1 & B2: Analyst Queue"""
    return db.query(ManualReview).filter(ManualReview.status == "PENDING").all()

class ActionRequest(BaseModel):
    action: str # "BLOCK" or "IGNORE"
    analyst_id: str = "admin_user"
    is_correct: Optional[int] = 1 # 1 = Correct, 0 = False Positive

@app.post("/api/incidents/{packet_id}/resolve")
def resolve_incident(packet_id: int, req: ActionRequest, db: Session = Depends(get_db)):
    """For Page B2: Take Action"""
    # Find the incident in ManualReview table
    incident = db.query(ManualReview).filter(ManualReview.id == packet_id).first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found or already resolved")

    # Update Status
    incident.status = "RESOLVED"
    incident.action_taken = "MANUAL_BLOCK" if req.action == "BLOCK" else "FALSE_POSITIVE"
    incident.analyst_id = req.analyst_id
    incident.resolved_at = datetime.utcnow()
    incident.is_correct = req.is_correct
    
    # Update Stats
    if req.action == "BLOCK":
        state.stats["manual_blocked"] += 1

    # Keep traffic log status in sync so Command Center does not remain "PENDING".
    related_log = db.query(TrafficLog).filter(
        TrafficLog.src_ip == incident.src_ip,
        TrafficLog.type == incident.type,
        TrafficLog.action == "PENDING_REVIEW"
    ).order_by(TrafficLog.timestamp.desc()).first()
    if related_log:
        related_log.action = "MANUAL_BLOCK" if req.action == "BLOCK" else "FALSE_POSITIVE"
        # Capture analyst feedback for future retraining.
        try:
            snap = json.loads(related_log.feature_snapshot) if related_log.feature_snapshot else {}
            feedback_label = "Normal Traffic" if req.action != "BLOCK" else incident.type
            row = {
                "timestamp": datetime.utcnow().isoformat(),
                "src_ip": incident.src_ip,
                "predicted_type": incident.type,
                "corrected_type": feedback_label,
                "is_correct": req.is_correct,
                "action_taken": incident.action_taken,
                "model_version": related_log.model_version or model_version,
                "feature_snapshot": json.dumps(snap),
            }
            file_exists = os.path.exists(TRAINING_FEEDBACK_FILE)
            with open(TRAINING_FEEDBACK_FILE, "a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=list(row.keys()))
                if not file_exists:
                    writer.writeheader()
                writer.writerow(row)
        except Exception as e:
            print(f"Failed to append feedback row: {e}")
        
    db.commit()
    
    return {"status": "success", "action_taken": req.action}

@app.get("/api/logs/audit")
def get_audit_log(db: Session = Depends(get_db)):
    """For Page B3: Audit Logs"""
    # Fetch resolved manual reviews + auto blocked (limit 50 combined for now)
    manual_logs = db.query(ManualReview).filter(ManualReview.status == "RESOLVED").limit(25).all()
    auto_logs = db.query(AutoBlocked).limit(25).all()
    
    # We simulate a unified log structure for the frontend
    combined = []
    for m in manual_logs:
        combined.append({
            "id": m.id,
            "timestamp": m.timestamp,
            "src_ip": m.src_ip,
            "type": m.type,
            "action": m.action_taken,
            "handled_by": m.analyst_id,
            "model_version": m.model_version
        })
    for a in auto_logs:
        combined.append({
            "id": a.id,
            "timestamp": a.timestamp,
            "src_ip": a.src_ip,
            "type": a.type,
            "action": "AUTO_BLOCKED",
            "handled_by": "SYSTEM_AUTOMATION",
            "model_version": a.model_version
        })
        
    # Sort by timestamp desc
    combined.sort(key=lambda x: x["timestamp"] or datetime.min, reverse=True)
    return combined

@app.post("/api/config/update")
def update_config(threshold: Optional[float] = None):
    """For Page B5: Admin Config"""
    if threshold is None:
        raise HTTPException(status_code=400, detail="threshold is required")
    if 0.0 <= threshold <= 1.0:
        state.config["auto_block_threshold"] = float(threshold)
        state.persist_config()
        return {"status": "updated", "new_threshold": state.config["auto_block_threshold"], "config": state.config}
    raise HTTPException(status_code=400, detail="Invalid threshold")


class ConfigUpdateBody(BaseModel):
    threshold: Optional[float] = None
    dynamic_threshold_enabled: Optional[bool] = None
    model_noise_rate: Optional[float] = None
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None
    auto_resolve_pending_enabled: Optional[bool] = None
    pending_auto_resolve_queue_trigger: Optional[int] = None
    pending_auto_resolve_delta: Optional[float] = None


@app.get("/api/config/current")
def get_current_config():
    return {
        "config": state.config,
        "model_version": model_version,
    }


@app.post("/api/config/update-body")
def update_config_body(body: ConfigUpdateBody):
    if body.threshold is not None:
        if not (0.0 <= body.threshold <= 1.0):
            raise HTTPException(status_code=400, detail="Invalid threshold")
        state.config["auto_block_threshold"] = float(body.threshold)
    if body.dynamic_threshold_enabled is not None:
        state.config["dynamic_threshold_enabled"] = bool(body.dynamic_threshold_enabled)
    if body.model_noise_rate is not None:
        if not (0.0 <= body.model_noise_rate <= 0.5):
            raise HTTPException(status_code=400, detail="Invalid model_noise_rate")
        state.config["model_noise_rate"] = float(body.model_noise_rate)
    if body.min_threshold is not None:
        state.config["min_threshold"] = float(body.min_threshold)
    if body.max_threshold is not None:
        state.config["max_threshold"] = float(body.max_threshold)
    if body.auto_resolve_pending_enabled is not None:
        state.config["auto_resolve_pending_enabled"] = bool(body.auto_resolve_pending_enabled)
    if body.pending_auto_resolve_queue_trigger is not None:
        state.config["pending_auto_resolve_queue_trigger"] = int(body.pending_auto_resolve_queue_trigger)
    if body.pending_auto_resolve_delta is not None:
        state.config["pending_auto_resolve_delta"] = float(body.pending_auto_resolve_delta)

    if state.config["min_threshold"] > state.config["max_threshold"]:
        raise HTTPException(status_code=400, detail="min_threshold cannot exceed max_threshold")

    state.persist_config()
    return {"status": "updated", "config": state.config}
