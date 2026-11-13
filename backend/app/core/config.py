"""Application Configuration via Pydantic.

Supports pydantic-settings when installed, with fallback to standard Pydantic + os.environ.
"""

import json
import os
from typing import List, Union
from pydantic import BaseModel, field_validator

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    _has_pydantic_settings = True
except ImportError:
    BaseSettings = BaseModel
    SettingsConfigDict = None
    _has_pydantic_settings = False


class Settings(BaseSettings):
    # Environment & Server
    PROJECT_NAME: str = "Sentinel Incident Response Platform"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sentinel.db")

    # Ollama AI Engine
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3:latest")
    OLLAMA_MOCK_MODE: bool = os.getenv("OLLAMA_MOCK_MODE", "True").lower() in ("true", "1")
    OLLAMA_TIMEOUT_SECONDS: int = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "30"))

    # Safety Policy Engine
    SAFETY_DRY_RUN: bool = os.getenv("SAFETY_DRY_RUN", "True").lower() in ("true", "1")
    REQUIRE_HUMAN_APPROVAL_FOR_MEDIUM: bool = os.getenv("REQUIRE_HUMAN_APPROVAL_FOR_MEDIUM", "True").lower() in ("true", "1")
    REQUIRE_HUMAN_APPROVAL_FOR_HIGH: bool = os.getenv("REQUIRE_HUMAN_APPROVAL_FOR_HIGH", "True").lower() in ("true", "1")
    WHITELISTED_ACTIONS: List[str] = [
        "check_database_connectivity",
        "restart_container",
        "rollback_deployment",
        "scale_replicas",
        "clear_cache",
        "isolate_traffic",
    ]

    # Target Service Allowlist for Remediation
    ALLOWED_REMEDIATION_TARGETS: List[str] = [
        "demo-api",
        "api",
        "sentinel-demo-api",
        "demo_application",
    ]

    # Remediation Execution Safety Parameters
    REMEDIATION_TIMEOUT_SECONDS: int = int(os.getenv("REMEDIATION_TIMEOUT_SECONDS", "10"))
    REMEDIATION_MAX_RETRIES: int = int(os.getenv("REMEDIATION_MAX_RETRIES", "3"))
    REMEDIATION_COOLDOWN_SECONDS: int = int(os.getenv("REMEDIATION_COOLDOWN_SECONDS", "30"))

    # Monitoring (Prometheus)
    PROMETHEUS_URL: str = os.getenv("PROMETHEUS_URL", "http://localhost:9090")

    # Docker Connector Configuration (Read-Only)
    MOCK_SERVICES_FALLBACK: bool = os.getenv("MOCK_SERVICES_FALLBACK", "False").lower() in ("true", "1")
    DOCKER_TIMEOUT_SECONDS: int = int(os.getenv("DOCKER_TIMEOUT_SECONDS", "5"))

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",")]
        return v

    @field_validator("WHITELISTED_ACTIONS", mode="before")
    def assemble_whitelisted_actions(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("ALLOWED_REMEDIATION_TARGETS", mode="before")
    def assemble_allowed_targets(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    if _has_pydantic_settings and SettingsConfigDict:
        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            case_sensitive=True,
            extra="ignore",
        )


settings = Settings()
