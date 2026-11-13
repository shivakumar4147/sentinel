
from app.schemas import IncidentDiagnosis

diagnosis = IncidentDiagnosis(
    summary="API service unavailable",
    root_cause="Database connection failure",
    supporting_evidence=["Database connection timeout"],
    contradicting_evidence=[],
    confidence=0.92,
    action="investigate_dependency",
    escalation=False,
    missing_information=[]
)

print(diagnosis.model_dump_json(indent=2))
