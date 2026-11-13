from app.prompt_builder import build_incident_prompt


def test_build_incident_prompt_is_compact_and_includes_all_evidence():
    prompt = build_incident_prompt(
        "API is unavailable",
        ["Database timeout", "Database timeout", "Health check failed"],
        {"error_rate": "25%"},
        ["release=2026.11.12"],
        "database=unhealthy",
    )

    assert "Incident: API is unavailable" in prompt
    assert prompt.count("Database timeout") == 1
    assert "error_rate=25%" in prompt
    assert "release=2026.11.12" in prompt
    assert "database=unhealthy" in prompt
    assert "only the supplied evidence" in prompt
    assert "Do not invent logs, metrics, or events" in prompt
    assert "rollback_deployment" in prompt


def test_empty_evidence_is_explicit_without_repeating_placeholders():
    prompt = build_incident_prompt("Requests are slow", [], {}, "", None)

    assert "Logs: none supplied" in prompt
    assert "Metrics: none supplied" in prompt
    assert "Deployment: none supplied" in prompt
    assert "Dependencies: none supplied" in prompt


def test_deduplicates_evidence_across_sections():
    prompt = build_incident_prompt(
        "API is failing",
        ["Database timeout"],
        "Database timeout",
        "",
        None,
    )

    assert prompt.count("Database timeout") == 1
