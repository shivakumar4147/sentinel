"""Introspect FastAPI apps directly to verify OpenAPI specifications and route registrations."""

import sys
from pathlib import Path

backend_path = Path("backend").resolve()
ai_engine_path = Path("ai-engine").resolve()

# 1. Introspect Backend
sys.path.insert(0, str(backend_path))
from app.main import app as backend_app  # type: ignore

backend_schema = backend_app.openapi()
print(f"Backend Application Title: {backend_schema['info']['title']} (v{backend_schema['info']['version']})")
backend_paths = sorted(backend_schema["paths"].keys())
print(f"Backend Registered Paths ({len(backend_paths)}):")
for p in backend_paths:
    print(f"  - {p}")

# Clear sys.modules for app to avoid collision
for mod in list(sys.modules.keys()):
    if mod.startswith("app"):
        del sys.modules[mod]
sys.path.pop(0)

# 2. Introspect AI Engine
sys.path.insert(0, str(ai_engine_path))
from app.main import app as ai_app  # type: ignore

ai_schema = ai_app.openapi()
print(f"\nAI Engine Application Title: {ai_schema['info']['title']} (v{ai_schema['info']['version']})")
ai_paths = sorted(ai_schema["paths"].keys())
print(f"AI Engine Registered Paths ({len(ai_paths)}):")
for p in ai_paths:
    print(f"  - {p}")

# Verify critical requirements
required_backend_routes = [
    "/services",
    "/incidents",
    "/remediations",
    "/demo-app/status",
    "/demo-app/checkout",
    "/demo-app/scenario",
    "/remediations/{remediation_id}/approve",
    "/remediations/{remediation_id}/execute",
    "/incidents/{incident_id}/verify",
]

missing = [r for r in required_backend_routes if r not in backend_paths and f"/api{r}" not in backend_paths]
if missing:
    print(f"\n[ERROR] Missing routes in Backend: {missing}")
    sys.exit(1)
else:
    print("\n[OK] All required Backend routes verified present in OpenAPI schema!")

