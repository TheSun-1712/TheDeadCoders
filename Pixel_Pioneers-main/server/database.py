from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# --- CONFIGURATION ---
# Update with your actual PostgreSQL credentials if different
# Format: postgresql://username:password@localhost:5432/database_name
DATABASE_URL = "postgresql://postgres:saketh123@localhost:5432/idsdashboard"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---

class TrafficLog(Base):
    """Stores all processed traffic logs (Monitor Mode)"""
    __tablename__ = "traffic_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    src_ip = Column(String, index=True)
    country = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    type = Column(String) # "DDoS", "SQL Injection", "Normal"
    confidence = Column(Float)
    destination_port = Column(Integer)
    action = Column(String) # "MONITOR"

class AutoBlocked(Base):
    """Stores incidents automatically blocked by the system"""
    __tablename__ = "auto_blocked"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    src_ip = Column(String, index=True)
    country = Column(String)
    limit_reached = Column(String) # Reason, e.g., "Confidence > 95%"
    confidence = Column(Float)
    type = Column(String)
    action = Column(String, default="AUTO_BLOCKED")

class ManualReview(Base):
    """Stores incidents sent to Admin Portal for manual review"""
    __tablename__ = "manual_review"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    src_ip = Column(String, index=True)
    country = Column(String)
    type = Column(String)
    confidence = Column(Float)
    destination_port = Column(Integer)
    status = Column(String, default="PENDING") # PENDING, RESOLVED
    
    # Outcome
    action_taken = Column(String, nullable=True) # "MANUAL_BLOCK", "FALSE_POSITIVE"
    analyst_id = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

# --- INITIALIZATION ---
def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
