
"""Small helpers for preparing log evidence for incident investigation."""

INCIDENT_KEYWORDS = (
    "error",
    "failed",
    "timeout",
    "exception",
    "unavailable",
    "refused",
    "crash",
    "critical",
)


def _is_incident_related(log: str) -> bool:
    """Return whether a log contains a known incident-related keyword."""
    lowered_log = log.casefold()
    return any(keyword in lowered_log for keyword in INCIDENT_KEYWORDS)


def process_evidence(logs: list[str], max_logs: int = 20) -> list[str]:
    """
    Clean log evidence while preserving its original order.

    Incident-related logs are preferred when the maximum is reached. If
    there are fewer incident-related logs than the limit, the remaining
    slots contain the most recent ordinary logs.
    """
    if max_logs < 0:
        raise ValueError("max_logs must be zero or greater")

    # Strip whitespace only to decide whether a log is empty; retain the
    # original text so callers receive the same log messages they supplied.
    unique_logs = list(
        dict.fromkeys(log for log in logs if log and log.strip())
    )
    if max_logs == 0:
        return []

    incident_logs = [log for log in unique_logs if _is_incident_related(log)]
    ordinary_logs = [log for log in unique_logs if not _is_incident_related(log)]

    # Keep as many incident logs as possible, then fill remaining space with
    # the newest ordinary logs. The final pass restores the original order.
    selected_incident_logs = incident_logs[-max_logs:]
    remaining_slots = max_logs - len(selected_incident_logs)
    selected_ordinary_logs = (
        ordinary_logs[-remaining_slots:] if remaining_slots else []
    )
    selected_logs = selected_incident_logs + selected_ordinary_logs

    return [
        log
        for log in unique_logs
        if log in selected_logs
    ]
