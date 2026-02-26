import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Update with your actual credentials
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "idsdashboard"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "Aish2003"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432")
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        return None

def execute_query(query, params=None):
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query, params)
            if query.strip().upper().startswith("SELECT"):
                result = cur.fetchall()
            else:
                conn.commit()
                result = True
            cur.close()
            conn.close()
            return result
        except Exception as e:
            print(f"Query failed: {e}")
            conn.close()
            return None
    return None
