from server.database import SessionLocal, TrafficLog, init_db
from server.ai.router import get_db_context
from datetime import datetime
import sys
import os

# Add server directory to path so imports work
sys.path.append(os.path.join(os.getcwd(), 'server'))

def test_context():
    db = SessionLocal()
    try:
        # Check if we have data, if not verify logic handles it
        print("--- Testing 'logs from China' ---")
        context = get_db_context(db, "Show me logs from China")
        print(context)
        
        print("\n--- Testing 'general status' ---")
        context_general = get_db_context(db, "system status")
        print(context_general)
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_context()
