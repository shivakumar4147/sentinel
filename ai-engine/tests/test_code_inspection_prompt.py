from app.code_inspection_prompt import build_code_inspection_prompt
from app.code_inspector import CollectedSourceFile


def test_prompt_includes_incident_paths_lines_and_grounding_rules():
    prompt = build_code_inspection_prompt(
        [
            CollectedSourceFile(
                relative_path="app/service.py",
                content="1: return database.fetch()\n2: pass",
            )
        ],
        incident_description="API requests fail when loading data",
    )

    assert "API requests fail when loading data" in prompt
    assert "FILE: app/service.py" in prompt
    assert "1: return database.fetch()" in prompt
    assert "Do not invent files, line numbers, code, behavior, or defects" in prompt
    assert "actual numbered source lines visible above" in prompt
    assert "Return only valid JSON matching CodeInspectionReport" in prompt
