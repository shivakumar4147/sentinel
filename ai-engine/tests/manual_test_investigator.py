
from app.ollama_client import generate_response

prompt = """
Incident: API service unavailable.

Evidence:
- Database connection timeout
- API health check failed
- Database container is running

Analyze the incident and return a diagnosis.
"""

diagnosis = generate_response(prompt)

print(diagnosis.model_dump_json(indent=2))
