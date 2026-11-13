
import requests
from app.schemas import IncidentDiagnosis

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen3.5:4b"


def generate_response(prompt: str) -> IncidentDiagnosis:
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are Sentinel, an incident investigation AI. "
                    "Analyze evidence and identify the most likely cause. "
                    "Be concise. Never invent evidence. "
                    "If evidence is insufficient, lower confidence "
                    "and recommend escalation when necessary."
            )
        },
        {
            "role": "user",
            "content": prompt
        }
        ],
        "format": IncidentDiagnosis.model_json_schema(),
        "think": False,
        "stream": False,
        "options": {
            "temperature": 0,
            "num_predict": 800
        }
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=600
    )

    response.raise_for_status()

    result = response.json()
    content = result["message"]["content"]

    return IncidentDiagnosis.model_validate_json(content)
