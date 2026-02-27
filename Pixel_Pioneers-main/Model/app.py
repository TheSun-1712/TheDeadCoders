from flask import Flask, request, jsonify

from database.query_handler import extract_ip, handle_ip_query, handle_sql_query
from rag.retriever import RAGSystem
from rag.prompt_template import build_prompt
from llm.ollama_client import generate_response

app = Flask(__name__)
rag = RAGSystem()

def classify_query(query):
    keywords = ["count", "how many", "total"]
    for word in keywords:
        if word in query.lower():
            return "sql"
    return "rag"

@app.route("/chat", methods=["POST"])
def chat():
    user_query = request.json["query"]

    ip = extract_ip(user_query)

    # 🔹 IP-Specific
    if ip:
        incidents, blocked = handle_ip_query(ip)

        context = f"""
IP: {ip}
Incidents: {incidents}
Blocked Status: {blocked if blocked else 'Not Blocked'}
"""

        prompt = build_prompt(context, user_query)
        return jsonify({"response": generate_response(prompt)})

    # 🔹 SQL Query
    if classify_query(user_query) == "sql":
        return jsonify({"response": handle_sql_query()})

    # 🔹 RAG Query
    docs = rag.retrieve(user_query)
    context = "\n".join(docs)

    prompt = build_prompt(context, user_query)
    return jsonify({"response": generate_response(prompt)})

if __name__ == "__main__":
    app.run(debug=True)
