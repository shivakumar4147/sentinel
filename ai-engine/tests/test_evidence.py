
from app.investigator import investigate_incident

incident = {
    "description": "API started failing after a new deployment.",
    "logs": [
        "API started successfully",
        "Database connection established",
        "ERROR: Database connection refused",
        "ERROR: Request failed with status 500",
    ],
    "metrics": {
        "cpu_usage": "35%",
        "memory_usage": "60%",
    },
    "deployment": {
        "version": "v2.1",
        "previous_version": "v2.0",
    },
    "dependencies": {
        "database": "unavailable",
    },
}

try:
    diagnosis = investigate_incident(incident)

    print("\n========== INCIDENT DIAGNOSIS ==========")
    print("Summary:", diagnosis.summary)
    print("Root Cause:", diagnosis.root_cause)
    print("Supporting Evidence:", diagnosis.supporting_evidence)
    print("Contradicting Evidence:", diagnosis.contradicting_evidence)
    print("Confidence:", diagnosis.confidence)
    print("Recommended Action:", diagnosis.action)
    print("Escalation:", diagnosis.escalation)
    print("Missing Information:", diagnosis.missing_information)

except Exception as e:
    print("\nInvestigation failed:", type(e).__name__, e)
