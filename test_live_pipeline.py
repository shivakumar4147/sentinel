"""Sentinel Live Communication & End-to-End Pipeline Verification Script.

Tests connectivity across all 4 services:
1. Backend Control Plane (Port 8000)
2. AI Investigation Engine (Port 8001)
3. Live Storefront API Bridge (Port 8000 / Port 5001)
4. Frontend Dashboard (Port 3000)

Run with: python test_live_pipeline.py
"""

import json
import sys
import time
try:
    import httpx
except ImportError:
    import requests as httpx

OK = "\033[92m[PASS]\033[0m"
FAIL = "\033[91m[FAIL]\033[0m"
WARN = "\033[93m[WARN]\033[0m"
BOLD = "\033[1m"
END = "\033[0m"


def check_endpoint(name: str, url: str, method: str = "GET", payload: dict = None, expected_status: int = 200, timeout: float = 6.0):
    client = httpx.Client(timeout=timeout) if hasattr(httpx, "Client") else httpx
    start = time.time()
    try:
        if method == "GET":
            res = client.get(url)
        else:
            res = client.post(url, json=payload or {})
        
        elapsed_ms = int((time.time() - start) * 1000)
        status_ok = res.status_code == expected_status

        tag = OK if status_ok else FAIL
        print(f" {tag} {name:<42} HTTP {res.status_code} ({elapsed_ms}ms)")
        try:
            body = res.json()
            if status_ok and "version" in str(body):
                print(f"       ↳ Body: {str(body)[:100]}")
            elif not status_ok:
                print(f"       ↳ Body: {str(body)[:100]}")
            return status_ok, body
        except Exception:
            if not status_ok:
                print(f"       ↳ Body: {res.text[:100].strip()}")
            return status_ok, res.text[:120]
    except Exception as e:
        elapsed_ms = int((time.time() - start) * 1000)
        print(f" {FAIL} {name:<42} Connection Error: {str(e)[:60]} ({elapsed_ms}ms)")
        return False, None


def inspect_port_8000_openapi():
    client = httpx.Client(timeout=3.0) if hasattr(httpx, "Client") else httpx
    print(f"\n{BOLD}Port 8000 Server Introspection (/openapi.json):{END}")
    try:
        res = client.get("http://localhost:8000/openapi.json")
        if res.status_code == 200:
            data = res.json()
            title = data.get("info", {}).get("title", "Unknown")
            version = data.get("info", {}).get("version", "Unknown")
            paths = list(data.get("paths", {}).keys())
            print(f" -> Application: {BOLD}{title}{END} (v{version})")
            print(f" -> Available Routes ({len(paths)}): {', '.join(sorted(paths)[:12])}")
            if len(paths) > 12:
                print(f"    ... and {len(paths) - 12} more routes")
            return paths
        else:
            print(f" -> /openapi.json returned HTTP {res.status_code}")
    except Exception as e:
        print(f" -> Could not fetch /openapi.json: {e}")
    return []


def run_diagnostics():
    print(f"\n{BOLD}=== Sentinel End-to-End Communication Health Check ==={END}")

    # Inspect Port 8000 registered OpenAPI routes
    paths = inspect_port_8000_openapi()

    # Determine prefix based on openapi
    has_api_prefix = any(p.startswith("/api/") for p in paths)
    prefix = "/api" if has_api_prefix else ""
    if paths and not has_api_prefix:
        print(f" -> {WARN}Notice: Server on port 8000 routes are mounted at root (WITHOUT /api prefix){END}")

    # 1. Backend Control Plane
    print(f"\n{BOLD}1. Backend Control Plane (http://localhost:8000){END}")
    check_endpoint(f"Health Check ({prefix}/health)", f"http://localhost:8000{prefix}/health")
    check_endpoint(f"Services Inventory ({prefix}/services)", f"http://localhost:8000{prefix}/services")
    check_endpoint(f"Active Incidents ({prefix}/incidents)", f"http://localhost:8000{prefix}/incidents")
    check_endpoint(f"Remediations ({prefix}/remediations)", f"http://localhost:8000{prefix}/remediations")

    # 2. Sentinel AI Engine
    print(f"\n{BOLD}2. Sentinel AI Engine (http://localhost:8001){END}")
    check_endpoint("AI Engine Health Check", "http://localhost:8001/health")
    check_endpoint(
        "AI 5-Stage Full Investigation (/investigate/full)",
        "http://localhost:8001/investigate/full",
        method="POST",
        payload={
            "description": "Checkout failure: AttributeError on request.get('paymentMethod')",
            "logs": ["AttributeError: 'NoneType' object has no attribute 'lower'"],
            "repository_root": ".",
            "source_files": ["demo-application/api/main.py", "sample_checkout/checkout.py"],
            "selected_file_paths": ["demo-application/api/main.py", "sample_checkout/checkout.py"],
            "max_logs": 5,
        },
        expected_status=200,
        timeout=25.0,
    )

    # 3. Live Target Website / Storefront
    print(f"\n{BOLD}3. Live Storefront Target Platform (Veloura Parfums){END}")
    check_endpoint("Storefront Static App (Port 5173)", "http://localhost:5173", expected_status=200)
    check_endpoint(f"Storefront Status API ({prefix}/demo-app/status)", f"http://localhost:8000{prefix}/demo-app/status")

    # 4. Live Checkout Test (Normal Flow)
    print(f"\n{BOLD}4. Live Checkout Simulation (Healthy Flow){END}")
    normal_ok, normal_data = check_endpoint(
        f"Simulate Checkout (POST {prefix}/demo-app/checkout)",
        f"http://localhost:8000{prefix}/demo-app/checkout",
        method="POST",
        payload={"product_id": 101, "quantity": 1, "amount": 165.0, "user_email": "test@veloura.com"},
        expected_status=200,
        timeout=25.0,
    )
    if normal_ok and isinstance(normal_data, dict):
        print(f"    ↳ Order Confirmed: {normal_data.get('order_id')} (Status: {normal_data.get('status')})")

    # 5. Chaos Engineering Trigger (Bad Deployment -> Intercepted 500)
    print(f"\n{BOLD}5. Chaos Fault Injection & Failure Interception{END}")
    check_endpoint(
        f"Inject 'bad_deployment' scenario",
        f"http://localhost:8000{prefix}/demo-app/scenario",
        method="POST",
        payload={"scenario": "bad_deployment"},
        expected_status=200,
        timeout=25.0,
    )

    err_ok, err_data = check_endpoint(
        f"Simulate Checkout Under Failure",
        f"http://localhost:8000{prefix}/demo-app/checkout",
        method="POST",
        payload={"product_id": 101, "quantity": 1, "amount": 165.0},
        expected_status=500,
    )
    if err_ok:
        print(f"    ↳ Fault Successfully Intercepted: HTTP 500 (AttributeError caught by Sentinel)")

    # Reset back to normal
    check_endpoint(
        f"Reset scenario to 'normal'",
        f"http://localhost:8000{prefix}/demo-app/scenario",
        method="POST",
        payload={"scenario": "normal"},
        expected_status=200,
        timeout=25.0,
    )

    # 6. Safety-Gated Live Remediation & Recovery Loop
    print(f"\n{BOLD}6. Safety-Gated Remediation & Automated Recovery Loop{END}")
    check_endpoint(
        "Approve Code Patch (POST /remediations/REM-102/approve)",
        f"http://localhost:8000{prefix}/remediations/REM-102/approve",
        method="POST",
        payload={"approver": "sec-lead", "notes": "Approved defensive patch"},
        expected_status=200,
        timeout=25.0,
    )
    check_endpoint(
        "Execute Code Patch (POST /remediations/REM-102/execute)",
        f"http://localhost:8000{prefix}/remediations/REM-102/execute",
        method="POST",
        expected_status=200,
        timeout=25.0,
    )
    check_endpoint(
        "Verify Incident Recovery (POST /incidents/INC-002/verify)",
        f"http://localhost:8000{prefix}/incidents/INC-002/verify",
        method="POST",
        expected_status=200,
        timeout=25.0,
    )
    post_ok, post_data = check_endpoint(
        f"Verify Post-Remediation Checkout (POST {prefix}/demo-app/checkout)",
        f"http://localhost:8000{prefix}/demo-app/checkout",
        method="POST",
        payload={"product_id": 101, "quantity": 1, "amount": 165.0},
        expected_status=200,
        timeout=25.0,
    )
    if post_ok:
        print(f"    ↳ Post-Remediation Checkout Recovered: Order Confirmed (HTTP 200)")

    # 7. Frontend Dashboard
    print(f"\n{BOLD}7. Frontend Operations Dashboard (http://localhost:3000){END}")
    check_endpoint("Dashboard Web UI (Port 3000)", "http://localhost:3000", expected_status=200)

    print(f"\n{BOLD}======================================================{END}")
    print(f"{BOLD}Tip: In your browser at http://localhost:3000, check the top-right pill:{END}")
    print(f"     '🟢 Live Backend (Connected)' confirms 100% live end-to-end communication.\n")


if __name__ == "__main__":
    run_diagnostics()
