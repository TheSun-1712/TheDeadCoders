import re
from .db import execute_query

def extract_ip(query):
    pattern = r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b"
    match = re.search(pattern, query)
    return match.group() if match else None


def handle_ip_query(ip):
    incidents = execute_query(
        "SELECT attack_type, severity, status FROM incidents WHERE source_ip=?",
        (ip,)
    )

    blocked = execute_query(
        "SELECT status FROM blocked_ips WHERE ip=?",
        (ip,)
    )

    return incidents, blocked


def handle_sql_query():
    result = execute_query(
        "SELECT COUNT(*) FROM incidents WHERE attack_type='DDoS'"
    )
    return f"Total DDoS incidents: {result[0][0]}"
