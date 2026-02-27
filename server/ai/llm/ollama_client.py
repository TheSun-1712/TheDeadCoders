import requests
import json

def generate_response(prompt):
    with requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "temperature": 0.35,
            "stream": True
        },
        stream=True
    ) as response:
        for line in response.iter_lines():
            if line:
                json_response = json.loads(line)
                if "response" in json_response:
                    yield json_response["response"]
