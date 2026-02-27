from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import json
import random
import time
import asyncio
from datetime import datetime
import os
import threading
from typing import Optional

# --- CONFIGURATION ---
MODEL_FILE = 'multiclass_xgboost_ids.joblib'
LABEL_ENCODER_FILE = 'label_encoder.joblib'
FEATURE_FILE = 'feature_columns.json'
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
            "auto_block_threshold": 0.95, # 95% confidence
            "simulation_speed": 1.0,       # Seconds per packet
            "dynamic_threshold_enabled": True,
            "min_threshold": 0.85,
            "max_threshold": 0.99
        }
        self.is_running = True

state = SystemState()

# --- LOAD ASSETS ---
print("Loading AI Models...")
model = joblib.load(MODEL_FILE)
label_encoder = joblib.load(LABEL_ENCODER_FILE)
scaler = joblib.load('scaler.joblib') if os.path.exists('scaler.joblib') else None
with open(FEATURE_FILE, 'r') as f:
    feature_columns = json.load(f)

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
    
    # --- DB RESET FOR NEW SCHEMA (Drop and Recreate) ---
    # WARNING: destructive, but requested by user
    print("Resetting Database Schema...")
    from database import Base, engine
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database Reset Complete.")
    
    while True:
        if state.is_running:
            db = SessionLocal()
            try:
                # 1. Get Next Packet
                row = traffic_df.iloc[index % len(traffic_df)]
                index += 1

                # 2. Predict
                features = pd.DataFrame([row[feature_columns]])
                pred_numeric = model.predict(features)[0]
                pred_text = label_encoder.inverse_transform([pred_numeric])[0]
                
                # Dynamic Thresholding Adjustment
                current_threshold = state.config["auto_block_threshold"]
                if state.config["dynamic_threshold_enabled"]:
                    # Increase threshold if system is degraded (too many pending reviews)
                    pending_count = db.query(ManualReview).filter(ManualReview.status == "PENDING").count()
                    if pending_count > 15:
                        current_threshold = min(state.config["max_threshold"], current_threshold + 0.01)
                    elif pending_count < 5:
                        current_threshold = max(state.config["min_threshold"], current_threshold - 0.01)
                    state.config["auto_block_threshold"] = round(current_threshold, 2)

                # Mock SHAP Explanation
                top_features = features.iloc[0].sort_values(ascending=False).head(3).index.tolist()
                explanation = f"Top contributing features: {', '.join(top_features)}"
                fake_ip = f"192.168.1.{random.randint(10, 200)}"
                fake_country = random.choice(list(COUNTRY_COORDS.keys()))
                timestamp = datetime.now() # Use datetime object for DB
                
                # Fake Confidence
                if pred_text == "Normal Traffic":
                    confidence = random.uniform(0.90, 0.99)
                else:
                    confidence = random.uniform(0.75, 0.99)

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
                    login_behavior=login_behavior
                )

                # 5. SOAR Logic (The Brain)
                state.stats["scanned"] += 1
                
                if pred_text != "Normal Traffic":
                    state.stats["threats_detected"] += 1
                    
                    # Check Auto-Block Policy
                    if confidence >= state.config["auto_block_threshold"]:
                        traffic_log.action = "AUTO_BLOCKED"
                        state.stats["auto_blocked"] += 1
                        
                        # Add to AutoBlocked Table
                        auto_block_entry = AutoBlocked(
                            timestamp=timestamp,
                            src_ip=fake_ip,
                            country=fake_country,
                            limit_reached=f"Confidence > {state.config['auto_block_threshold']*100}%",
                            confidence=confidence,
                            type=pred_text
                        )
                        db.add(auto_block_entry)
                        
                    else:
                        # Send to Portal B (Human Review)
                        traffic_log.action = "PENDING_REVIEW"
                        
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
                                explanation=explanation
                            )
                            db.add(manual_entry)

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

# === PORTAL A ENDPOINTS (Read-Only / Monitoring) ===

@app.get("/api/system/health")
def get_system_health(db: Session = Depends(get_db)):
    """For Page A0: System Overview"""
    pending_count = db.query(ManualReview).filter(ManualReview.status == "PENDING").count()
    uptime_seconds = int(time.time() - state.stats["uptime_start"])
    return {
        "status": "HEALTHY" if pending_count < 5 else "DEGRADED",
        "uptime_seconds": uptime_seconds,
        "traffic_processed": f"{state.stats['scanned'] / 1000:.1f}k",
        "automation_rate": f"{100 * (state.stats['auto_blocked'] / (state.stats['threats_detected'] + 1)):.1f}%"
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
            "handled_by": m.analyst_id
        })
    for a in auto_logs:
        combined.append({
            "id": a.id,
            "timestamp": a.timestamp,
            "src_ip": a.src_ip,
            "type": a.type,
            "action": "AUTO_BLOCKED",
            "handled_by": "SYSTEM_AUTOMATION"
        })
        
    # Sort by timestamp desc
    combined.sort(key=lambda x: x["timestamp"] or datetime.min, reverse=True)
    return combined

@app.post("/api/config/update")
def update_config(threshold: float):
    """For Page B5: Admin Config"""
    if 0.0 <= threshold <= 1.0:
        state.config["auto_block_threshold"] = threshold
        return {"status": "updated", "new_threshold": threshold}
    raise HTTPException(status_code=400, detail="Invalid threshold")