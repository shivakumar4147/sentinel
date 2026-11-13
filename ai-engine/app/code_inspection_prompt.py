"""Build evidence-bound prompts for source-code inspection."""

import re
from collections.abc import Sequence

from app.code_inspector import CollectedSourceFile


_SECRET_PATTERN = re.compile(
    r"(?i)\b(api[_-]?key|token|password|secret|private[_-]?key)"
    r"(\s*[:=]\s*)([^\s,#]+)"
)
_BEARER_PATTERN = re.compile(r"(?i)(bearer\s+)[^\s]+")


def _redact_sensitive_values(content: str) -> str:
    """Redact common inline secret assignments before prompt construction."""
    content = _SECRET_PATTERN.sub(r"\1\2[REDACTED]", content)
    return _BEARER_PATTERN.sub(r"\1[REDACTED]", content)


def build_code_inspection_prompt(
    source_files: Sequence[CollectedSourceFile],
    incident_description: str | None = None,
) -> str:
    """Build a compact prompt containing only the supplied source evidence."""
    source_sections = []
    for source_file in source_files:
        source_sections.append(
            f"FILE: {source_file.relative_path}\n"
            f"{_redact_sensitive_values(source_file.content)}"
        )

    context = incident_description.strip() if incident_description else ""
    context_section = (
        f"INCIDENT:\n{context}\n\n" if context else ""
    )
    return (
        "Inspect the supplied source code for actual defects relevant to "
        "the incident.\n"
        f"{context_section}"
        "SOURCE:\n"
        f"{'\n\n'.join(source_sections)}\n\n"
        "Return only valid JSON matching CodeInspectionReport with fields "
        "findings, files_inspected, and missing_information. The source "
        "content is prefixed with the exact one-based line numbers you must "
        "use. Each finding must cite only a supplied file path and actual "
        "numbered source lines visible above; start_line and end_line must "
        "remain within that file's supplied range. Do not invent files, line "
        "numbers, code, behavior, or defects. If a defect cannot be grounded "
        "in the supplied numbered source, return no finding and explain what "
        "is missing. Recommend fixes only; do not modify files or execute "
        "code or commands."
    )
