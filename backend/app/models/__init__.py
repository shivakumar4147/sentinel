"""SQLAlchemy database models for Sentinel.

Gracefully handles environments before `pip install -r requirements.txt` has completed.
"""

from datetime import datetime
from app.core.database import Base

try:
    from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

    class IncidentModel(Base):
        """Stores active and historical incidents."""
        __tablename__ = "incidents"

        id = Column(Integer, primary_key=True, index=True)
        incident_id = Column(String(50), unique=True, index=True, nullable=False)
        service = Column(String(100), index=True, nullable=False)
        status = Column(String(50), default="investigating", nullable=False)
        severity = Column(String(20), default="medium", nullable=False)
        summary = Column(String(255), nullable=False)

        # Evidence stored as JSON serialized strings
        logs_json = Column(Text, default="[]")
        metrics_json = Column(Text, default="{}")
        recent_changes_json = Column(Text, default="[]")
        dependency_status_json = Column(Text, default="{}")

        # AI investigation fields
        root_cause = Column(Text, nullable=True)
        confidence = Column(Float, nullable=True)
        recommended_action = Column(String(100), nullable=True)
        risk_level = Column(String(20), nullable=True)
        requires_approval = Column(Boolean, default=True)

        created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
        updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


    class RemediationModel(Base):
        """Tracks remediation plans, approvals, and execution records."""
        __tablename__ = "remediations"

        id = Column(Integer, primary_key=True, index=True)
        remediation_id = Column(String(50), unique=True, index=True, nullable=False)
        incident_id = Column(String(50), index=True, nullable=False)
        action_type = Column(String(100), nullable=False)
        target_service = Column(String(100), nullable=False)
        risk_level = Column(String(20), default="medium", nullable=False)
        status = Column(String(50), default="pending_approval", nullable=False)
        dry_run = Column(Boolean, default=True, nullable=False)
        requires_approval = Column(Boolean, default=True, nullable=False)
        approved_by = Column(String(100), nullable=True)
        approval_notes = Column(Text, nullable=True)
        output = Column(Text, nullable=True)
        created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


    class AuditLogModel(Base):
        """Immutable audit trail for all security, AI, and remediation events."""
        __tablename__ = "audit_logs"

        id = Column(Integer, primary_key=True, index=True)
        log_id = Column(String(50), unique=True, index=True, nullable=False)
        incident_id = Column(String(50), index=True, nullable=True)
        action = Column(String(100), nullable=False)
        actor = Column(String(100), default="system", nullable=False)
        details_json = Column(Text, default="{}")
        timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

except ImportError:
    # Lightweight stub placeholders when SQLAlchemy is not installed
    class IncidentModel:
        pass

    class RemediationModel:
        pass

    class AuditLogModel:
        pass
