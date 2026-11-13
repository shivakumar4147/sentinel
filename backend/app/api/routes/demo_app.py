"""Live Demo Target Application & Chaos Scenarios Route.

Bridges Sentinel with the Veloura Parfums e-commerce target application (Docker port 5001 / Vite port 5173).
"""

from datetime import datetime, timezone
import logging
import os
from pathlib import Path
import subprocess
import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, status
import httpx
from pydantic import BaseModel, Field

from app.incidents.manager import incident_manager

logger = logging.getLogger("sentinel.api.demo_app")
router = APIRouter(tags=["Live Target Store"])

DEMO_APP_URL = os.getenv("DEMO_APP_URL", "http://localhost:5173").rstrip("/")
DEMO_API_URL = os.getenv("DEMO_API_URL", "http://localhost:5001").rstrip("/")

# In-memory demo store state
_demo_store_state = {
    "store_name": "Veloura Parfums Storefront",
    "store_url": DEMO_APP_URL,
    "api_url": DEMO_API_URL,
    "active_scenario": "normal",  # normal, bad_deployment, database_failure, high_cpu
    "total_orders": 142,
    "failed_checkouts": 0,
    "last_order_id": f"ORD-{uuid.uuid4().hex[:6].upper()}",
    "last_checkout_timestamp": datetime.now(timezone.utc).isoformat(),
    "is_patched": False,
}


def mark_demo_store_remediated() -> None:
    """Invoked when approved code patch is successfully applied to demo store."""
    _demo_store_state["active_scenario"] = "normal"
    _demo_store_state["is_patched"] = True
    logger.info("Demo store marked as remediated: active_scenario reset to normal.")


def probe_live_ecommerce_api() -> Optional[Dict[str, Any]]:
    """Probes the live Docker ecommerce API (localhost:5001).
    
    Returns structured health dict if reachable, or None if service is offline/unreachable.
    """
    try:
        with httpx.Client(timeout=2.0) as client:
            # 1. Check readiness (verifies DB connection)
            try:
                ready_resp = client.get(f"{DEMO_API_URL}/ready")
                db_healthy = (ready_resp.status_code == 200)
            except Exception:
                db_healthy = False

            # 2. Check health liveness
            health_resp = client.get(f"{DEMO_API_URL}/health")
            liveness_ok = (health_resp.status_code == 200)

            # 3. Probe checkout endpoint to verify operational status
            # When bad deployment is active, this returns 500
            test_payload = {
                "product_id": 101,
                "quantity": 1,
                "user_email": "sentinel-verifier@sentinel.internal",
            }
            chk_resp = client.post(f"{DEMO_API_URL}/checkout", json=test_payload)
            checkout_ok = (chk_resp.status_code == 200)
            checkout_detail = chk_resp.json().get("detail", "") if chk_resp.headers.get("content-type", "").startswith("application/json") else chk_resp.text[:100]

            is_overall_healthy = db_healthy and liveness_ok and checkout_ok

            return {
                "live_api_responding": True,
                "healthy": is_overall_healthy,
                "is_healthy": is_overall_healthy,
                "db_healthy": db_healthy,
                "liveness_ok": liveness_ok,
                "checkout_ok": checkout_ok,
                "checkout_detail": checkout_detail,
                "status": "healthy" if is_overall_healthy else "degraded",
            }
    except Exception as exc:
        logger.debug("Live ecommerce API probe at %s skipped/unavailable: %s", DEMO_API_URL, str(exc))
        return None


def get_demo_store_health() -> Dict[str, Any]:
    """Returns real-time health checks for recovery verification.
    
    If the Docker ecommerce API is running at localhost:5001, verifies against actual live endpoints.
    Falls back gracefully to simulated state only if Docker service is offline.
    """
    live_probe = probe_live_ecommerce_api()
    if live_probe is not None:
        # Live Docker Ecommerce API responded
        return {
            "healthy": live_probe["is_healthy"],
            "is_healthy": live_probe["is_healthy"],
            "status": live_probe["status"],
            "source": "live_docker_ecommerce_api",
            "active_scenario": _demo_store_state["active_scenario"],
            "is_patched": _demo_store_state.get("is_patched", False),
            "total_orders": _demo_store_state["total_orders"],
            "failed_checkouts": _demo_store_state["failed_checkouts"],
            "db_healthy": live_probe["db_healthy"],
            "checkout_operational": live_probe["checkout_ok"],
            "checkout_detail": live_probe.get("checkout_detail"),
        }

    # Fallback to in-memory state for standalone non-Docker testing
    is_healthy = _demo_store_state["active_scenario"] == "normal"
    return {
        "healthy": is_healthy,
        "is_healthy": is_healthy,
        "status": "healthy" if is_healthy else "degraded",
        "source": "simulated_standalone",
        "active_scenario": _demo_store_state["active_scenario"],
        "is_patched": _demo_store_state.get("is_patched", False),
        "total_orders": _demo_store_state["total_orders"],
        "failed_checkouts": _demo_store_state["failed_checkouts"],
    }


class ScenarioRequest(BaseModel):
    scenario: str = Field(..., description="normal, bad_deployment, database_failure, high_cpu")


class CheckoutSimulationRequest(BaseModel):
    product_id: int = Field(default=101)
    quantity: int = Field(default=1)
    payment_method: Optional[str] = Field(default="card")
    user_email: str = Field(default="guest@velouraparfums.com")
    amount: float = Field(default=185.0)


@router.get("/demo-app/status")
def get_demo_app_status() -> Dict[str, Any]:
    """Returns real-time health and scenario status of the target website."""
    current_health = get_demo_store_health()
    return {
        "success": True,
        "data": {
            **_demo_store_state,
            "status": current_health["status"],
            "is_failing": not current_health["is_healthy"],
            "live_health": current_health,
        },
    }


@router.post("/demo-app/scenario")
def set_demo_app_scenario(req: ScenarioRequest) -> Dict[str, Any]:
    """Trigger or reset chaos failure scenarios on the live target website."""
    sc = req.scenario.lower().strip()
    valid_scenarios = {"normal", "bad_deployment", "database_failure", "high_cpu", "reset"}
    if sc not in valid_scenarios:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid scenario '{sc}'. Must be one of: {sorted(valid_scenarios)}",
        )

    if sc == "reset":
        sc = "normal"

    _demo_store_state["active_scenario"] = sc
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    demo_dir = repo_root / "demo-application"

    if sc == "bad_deployment":
        _demo_store_state["failed_checkouts"] += 1
        # If host docker CLI is available, activate scenario in Docker
        try:
            subprocess.run(
                ["docker", "compose", "-f", "docker-compose.yml", "-f", "docker-compose.bad-deployment.yml", "up", "-d", "--force-recreate", "api"],
                cwd=str(demo_dir),
                capture_output=True,
                timeout=15,
            )
        except Exception:
            pass

        incident_manager.log_audit(
            action="CHAOS_SCENARIO_TRIGGERED",
            incident_id="INC-002",
            actor="chaos_engineering_console",
            details={
                "scenario": "bad_deployment",
                "target": "demo-application/api/main.py",
                "effect": "HTTP 500 on checkout",
            },
        )
    elif sc == "database_failure":
        try:
            subprocess.run(
                ["docker", "compose", "stop", "database"],
                cwd=str(demo_dir),
                capture_output=True,
                timeout=15,
            )
        except Exception:
            pass

        incident_manager.log_audit(
            action="CHAOS_SCENARIO_TRIGGERED",
            incident_id="INC-001",
            actor="chaos_engineering_console",
            details={
                "scenario": "database_failure",
                "target": "sentinel-ecommerce-db",
                "effect": "Connection pool timeout",
            },
        )
    else:
        # Reset normal deployment
        try:
            subprocess.run(
                ["docker", "compose", "-f", "docker-compose.yml", "up", "-d", "--force-recreate", "api"],
                cwd=str(demo_dir),
                capture_output=True,
                timeout=15,
            )
            subprocess.run(
                ["docker", "compose", "start", "database"],
                cwd=str(demo_dir),
                capture_output=True,
                timeout=15,
            )
        except Exception:
            pass

        incident_manager.log_audit(
            action="CHAOS_SCENARIO_RESET",
            incident_id=None,
            actor="chaos_engineering_console",
            details={"status": "all_systems_normal"},
        )

    return {
        "success": True,
        "message": f"Demo application scenario updated to '{sc}'.",
        "active_scenario": sc,
    }


@router.post("/checkout")
@router.post("/demo-app/checkout")
def simulate_checkout(req: CheckoutSimulationRequest) -> Dict[str, Any]:
    """Executes checkout against live Docker application or fallback simulator."""
    # 1. Attempt checkout against live Docker Ecommerce API (localhost:5001)
    live_forward_attempted = False
    try:
        with httpx.Client(timeout=4.0) as client:
            live_resp = client.post(
                f"{DEMO_API_URL}/checkout",
                json={
                    "product_id": req.product_id,
                    "quantity": req.quantity,
                    "user_email": req.user_email or "guest@velouraparfums.com",
                },
            )
            live_forward_attempted = True

            if live_resp.status_code == 200:
                data = live_resp.json()
                _demo_store_state["total_orders"] += 1
                order_id = str(data.get("order_id", f"ORD-{uuid.uuid4().hex[:6].upper()}"))
                _demo_store_state["last_order_id"] = order_id
                _demo_store_state["last_checkout_timestamp"] = datetime.now(timezone.utc).isoformat()
                return {
                    "success": True,
                    "order_id": order_id,
                    "product_id": req.product_id,
                    "amount": req.amount,
                    "status": "confirmed",
                    "message": "Order created and confirmed on live ecommerce API (Port 5001).",
                    "live_api_response": data,
                }
            else:
                # Live failure from Docker Ecommerce API!
                _demo_store_state["failed_checkouts"] += 1
                err_detail = "Simulated bad deployment: checkout service failed"
                try:
                    err_json = live_resp.json()
                    err_detail = err_json.get("detail", live_resp.text)
                except Exception:
                    err_detail = live_resp.text or f"HTTP {live_resp.status_code} error from checkout service"

                logger.error("Live Docker checkout failure intercepted: HTTP %d - %s", live_resp.status_code, err_detail)
                incident_manager.record_checkout_failure(
                    error_message=err_detail,
                    stack_trace=[
                        f"POST {DEMO_API_URL}/checkout HTTP/1.1 {live_resp.status_code}",
                        f"Error: {err_detail}",
                        "File 'demo-application/api/main.py', line 512, in checkout",
                        f"Transaction aborted for user {req.user_email}",
                    ],
                    target_service="sentinel-ecommerce-api",
                    target_file="demo-application/api/main.py",
                )
                raise HTTPException(
                    status_code=live_resp.status_code,
                    detail=err_detail,
                )

    except HTTPException:
        raise
    except Exception as net_exc:
        logger.debug("Could not connect to live Docker API at %s (%s). Using scenario controller.", DEMO_API_URL, str(net_exc))

    # 2. Standalone Scenario Simulation (used during unit tests when Docker is not running)
    if _demo_store_state["active_scenario"] == "bad_deployment":
        _demo_store_state["failed_checkouts"] += 1
        err_msg = "Simulated bad deployment: checkout service failed in demo-application/api/main.py"
        logger.error("Simulated checkout failure: %s", err_msg)
        incident_manager.record_checkout_failure(
            error_message=err_msg,
            stack_trace=[
                "POST /checkout HTTP/1.1 500 Internal Server Error",
                f"Error: {err_msg}",
                "File 'demo-application/api/main.py', line 512, in checkout",
                f"Transaction aborted for user {req.user_email}",
            ],
            target_service="sentinel-ecommerce-api",
            target_file="demo-application/api/main.py",
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=err_msg,
        )

    if _demo_store_state["active_scenario"] == "database_failure":
        logger.error("Simulated checkout failure: Database connection timeout")
        err_msg = "PostgreSQL pool connection timeout: pool slots saturated (198/200)"
        incident_manager.record_checkout_failure(
            error_message=err_msg,
            stack_trace=[
                "POST /checkout HTTP/1.1 504 Gateway Timeout",
                f"Error: {err_msg}",
                "Service: postgresql connection pool exhausted",
            ],
            target_service="sentinel-ecommerce-db",
            target_file="demo-application/api/main.py",
        )
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=err_msg,
        )

    order_id = f"ORD-{uuid.uuid4().hex[:6].upper()}"
    _demo_store_state["total_orders"] += 1
    _demo_store_state["last_order_id"] = order_id
    _demo_store_state["last_checkout_timestamp"] = datetime.now(timezone.utc).isoformat()

    return {
        "success": True,
        "order_id": order_id,
        "product_id": req.product_id,
        "amount": req.amount,
        "status": "confirmed",
        "message": "Order created and confirmed on Veloura Parfums target platform.",
    }
