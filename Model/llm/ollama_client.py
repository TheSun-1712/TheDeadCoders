import requests

def generate_response(prompt):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "temperature": 0.1,
            "stream": False
        }
    )
    return response.json()["response"]

