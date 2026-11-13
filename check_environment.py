"""Sentinel Environment & Dependency Verification Script.

Checks installed Python packages, Node.js modules, system binaries, and service connectivity.
Run with: python check_environment.py
"""

import importlib
import os
import shutil
import sys

HEADER = "\033[95m"
OKGREEN = "\033[92m"
WARNING = "\033[93m"
FAIL = "\033[91m"
ENDC = "\033[0m"
BOLD = "\033[1m"


def print_status(component: str, is_ok: bool, details: str = ""):
    status_tag = f"{OKGREEN}[INSTALLED]{ENDC}" if is_ok else f"{WARNING}[NOT FOUND / FALLBACK]{ENDC}"
    print(f" {status_tag} {component:<32} {details}")


def check_python_packages():
    print(f"\n{BOLD}1. Python Dependencies (Current Environment: {sys.executable}){ENDC}")
    print("-" * 75)

    packages = [
        ("fastapi", "FastAPI Core Web Framework"),
        ("uvicorn", "ASGI Server"),
        ("pydantic", "Data Validation"),
        ("pydantic_settings", "Settings Management"),
        ("sqlalchemy", "Database ORM"),
        ("httpx", "Async HTTP Client"),
        ("dotenv", "python-dotenv Config Loader"),
        ("docker", "Docker Python SDK"),
        ("pytest", "Pytest Testing Framework"),
        ("pytest_asyncio", "Asyncio Test Fixtures"),
        ("google.genai", "Google Gemini 2.5 SDK"),
        ("groq", "Groq Llama 3 Client"),
        ("ollama", "Ollama LLM Client"),
        ("pg8000", "PostgreSQL DBAPI Driver"),
        ("prometheus_client", "Prometheus Metrics Exporter"),
    ]

    all_ok = True
    for module_name, desc in packages:
        try:
            mod = importlib.import_module(module_name)
            ver = getattr(mod, "__version__", "installed")
            print_status(module_name, True, f"v{ver} ({desc})")
        except ImportError as e:
            all_ok = False
            print_status(module_name, False, f"Missing: {e}")

    return all_ok


def check_node_modules():
    print(f"\n{BOLD}2. Node.js & Frontend Environments{ENDC}")
    print("-" * 75)

    node_paths = [
        ("frontend/node_modules", "Sentinel React Dashboard"),
        ("demo-application/frontend/node_modules", "Veloura Storefront"),
    ]

    for path, name in node_paths:
        exists = os.path.isdir(path)
        print_status(path, exists, f"Directory for {name}")


def check_system_services():
    print(f"\n{BOLD}3. System Services & External Runtimes{ENDC}")
    print("-" * 75)

    # Docker
    docker_bin = shutil.which("docker")
    print_status(
        "Docker CLI",
        bool(docker_bin),
        f"Path: {docker_bin}" if docker_bin else "Not in PATH (Sentinel uses mock container connector)",
    )

    # Ollama
    ollama_bin = shutil.which("ollama")
    print_status(
        "Ollama CLI",
        bool(ollama_bin),
        f"Path: {ollama_bin}" if ollama_bin else "Not installed (Sentinel uses Groq/Gemini/Deterministic fallbacks)",
    )

    # SQLite database
    db_file = "backend/sentinel.db"
    db_exists = os.path.isfile(db_file) or os.path.isfile("sentinel.db")
    print_status("Local SQLite Database", db_exists, "sentinel.db initialized" if db_exists else "Auto-created on launch")


if __name__ == "__main__":
    print(f"\n{BOLD}=== Sentinel System Installation Diagnostic ==={ENDC}")
    py_ok = check_python_packages()
    check_node_modules()
    check_system_services()
    print("-" * 75)
    if py_ok:
        print(f"{OKGREEN}✔ All core Python packages are installed and ready.{ENDC}\n")
    else:
        print(f"{WARNING}⚠ Run 'pip install -r requirements.txt' to install missing packages.{ENDC}\n")

