import psycopg2
import os
from urllib.parse import quote_plus

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "idsdashboard"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "Aish2003"),
    "port": os.getenv("DB_PORT", "5432")
}

DATABASE_URL = (
    f"postgresql://{DB_CONFIG['user']}:{quote_plus(DB_CONFIG['password'])}"
    f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
)

def execute_query(sql, params=()):
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute(sql, params)
    
    try:
        result = cursor.fetchall()
    except:
        result = None

    conn.commit()
    cursor.close()
    conn.close()
    return result
