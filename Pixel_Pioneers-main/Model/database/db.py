import psycopg2

DB_CONFIG = {
    "host": "localhost",
    "database": "your_db_name",
    "user": "your_username",
    "password": "your_password",
    "port": "5432"
}

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
