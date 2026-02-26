def build_prompt(context_docs, user_query):
    context_text = "\n\n".join(context_docs)

    return f"""
You are a cybersecurity assistant.

Answer ONLY using the provided network logs.
If the answer is not present, say:
"Information not found in current network records."

Context:
{context_text}

Question:
{user_query}
"""
