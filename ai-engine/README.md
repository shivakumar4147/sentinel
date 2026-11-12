# Member 3: Ollama AI Investigation Module

## Overview
This module is developed independently by Member 3. It accepts structured incident context from the Backend, executes prompting against a local Ollama instance (e.g. Llama 3 or Mistral), and returns validated root-cause analysis and recommended remediation actions.

## Invariants & Guardrails
- **No Direct Shell / Docker Access**: This module NEVER interacts directly with the operating system, Docker, or Kubernetes.
- **Strict JSON Enforcement**: All responses must validate against `schemas/models.py`.
- **Whitelisted Actions**: Only actions permitted by the backend Safety Engine should be proposed.

## Setup & Testing
```bash
pip install -r requirements.txt
python investigator.py
pytest tests/
```
