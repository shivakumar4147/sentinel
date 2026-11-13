"""Manually test Ollama when a local server and model are available.

Run with:
    python manual_test_ollama.py
"""

from app.ollama_client import generate_response


prompt = "Say hello in one short sentence."
diagnosis = generate_response(prompt)
print(diagnosis.model_dump_json(indent=2))
