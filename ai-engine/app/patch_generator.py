"""Generate read-only patch recommendations from code findings.

Pipeline:
  A. Accept findings and source files.
  B. Short-circuit on empty findings.
  C. Generate structured PatchProposal via Groq/Ollama routing.
  D. Validate each proposal against supplied source (exact match, then normalized match).
  E. Extract actual source text and construct unified diff locally with difflib.unified_diff.
  F. Validate the generated diff structure, in-memory application, Python syntax, and unaffected code preservation.
  G. Return PatchGenerationReport.
"""

import ast
import difflib
import re
from collections.abc import Sequence

from app.code_inspector import CollectedSourceFile
from app.patch_generation_prompt import build_patch_generation_prompt
from app.patch_generation_router import generate_patch_report
from app.schemas import (
    CodeInspectionFinding,
    PatchGenerationReport,
    PatchProposal,
    PatchProposalReport,
    ProposedPatch,
)


_LINE_NUMBER = re.compile(r"^\d+:\s?")

_HUNK_HEADER = re.compile(
    r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@"
)

_TRUNCATION_MARKERS = [
    re.compile(r"^\s*(\.{3}|…)\s*$", re.MULTILINE),
    re.compile(r"#\s*(\.{3}|…)", re.IGNORECASE),
    re.compile(r"//\s*(\.{3}|…)", re.IGNORECASE),
    re.compile(r"/\*\s*(\.{3}|…)", re.IGNORECASE),
    re.compile(r"\b(?:rest|remaining|existing)\s+of\s+(?:the\s+)?code\b", re.IGNORECASE),
    re.compile(r"\bcode\s+(?:remains\s+)?unchanged\b", re.IGNORECASE),
    re.compile(r"<\s*truncated\s*>", re.IGNORECASE),
]

_HANGING_OPERATOR = re.compile(
    r"(?:[+\-*/=]|and|or|not)\s*$",
    re.IGNORECASE,
)


class PatchValidationError(ValueError):
    """A proposal failed deterministic validation."""


# ---------------------------------------------------------------------------
# Source helpers
# ---------------------------------------------------------------------------

def _source_lines(source_file: CollectedSourceFile) -> list[str]:
    """Return original source lines without inspection-only line prefixes."""
    return [
        _LINE_NUMBER.sub("", line)
        for line in source_file.content.splitlines()
    ]


def _normalize_line(line: str) -> str:
    """Normalize line whitespace by collapsing internal whitespace sequences."""
    return " ".join(line.split())


# ---------------------------------------------------------------------------
# D. Validate each proposal & find unique source match
# ---------------------------------------------------------------------------

def _validate_proposal(
    proposal: PatchProposal,
    source_by_path: dict[str, CollectedSourceFile],
) -> None:
    """Raise PatchValidationError if static proposal properties are invalid."""
    # Path traversal check
    if (
        ".." in proposal.file_path
        or proposal.file_path.startswith(("/", "\\"))
        or ":" in proposal.file_path
    ):
        raise PatchValidationError(
            f"patch contains path traversal: {proposal.file_path}"
        )

    # File must be in supplied sources
    if proposal.file_path not in source_by_path:
        raise PatchValidationError(
            f"patch references an unsupplied file: {proposal.file_path}"
        )

    # original_code must be nonempty
    if not proposal.original_code or not proposal.original_code.strip():
        raise PatchValidationError(
            f"patch original_code is empty: {proposal.file_path}"
        )

    # replacement_code must be nonempty
    if not proposal.replacement_code or not proposal.replacement_code.strip():
        raise PatchValidationError(
            f"patch replacement_code is empty: {proposal.file_path}"
        )

    # Reject unchanged replacements
    if proposal.original_code == proposal.replacement_code:
        raise PatchValidationError(
            f"patch replacement is identical to original: {proposal.file_path}"
        )

    # Confidence must be valid (already enforced by schema, belt-and-suspenders)
    if not (0 <= proposal.confidence <= 1):
        raise PatchValidationError(
            f"patch confidence out of range: {proposal.file_path}"
        )


def _validate_not_truncated(proposal: PatchProposal) -> None:
    """Validate that replacement_code does not contain truncated content or placeholders."""
    code = proposal.replacement_code
    for pattern in _TRUNCATION_MARKERS:
        if pattern.search(code):
            raise PatchValidationError(
                f"patch replacement contains truncation placeholder: {proposal.file_path}"
            )

    stripped = code.strip()
    orig_stripped = proposal.original_code.strip()

    # Reject incomplete block header that introduces a block without its body
    if stripped.endswith(":") and not orig_stripped.endswith(":"):
        raise PatchValidationError(
            f"patch replacement appears truncated with incomplete block header: {proposal.file_path}"
        )

    # Reject hanging binary/logical operator at the end of replacement
    if _HANGING_OPERATOR.search(stripped):
        raise PatchValidationError(
            f"patch replacement appears truncated with trailing operator: {proposal.file_path}"
        )


def _find_unique_source_match(
    proposal: PatchProposal,
    source_lines: list[str],
) -> tuple[int, int]:
    """Find unique (start, end) line slice indices in source_lines for the proposal.

    1. First attempts exact matching.
    2. If exact matching fails, attempts safe deterministic matching using
       normalized whitespace and line endings.
    3. Rejects ambiguous (multiple) matches or unmatched proposals.
    """
    orig_lines = proposal.original_code.strip("\r\n").splitlines()
    if not orig_lines:
        raise PatchValidationError(
            f"patch original_code is empty: {proposal.file_path}"
        )

    m = len(orig_lines)
    n = len(source_lines)

    # 1. Exact matching attempt
    exact_matches: list[int] = []
    for i in range(n - m + 1):
        if source_lines[i : i + m] == orig_lines:
            exact_matches.append(i)

    if len(exact_matches) > 1:
        raise PatchValidationError(
            f"patch original_code matches multiple locations in source: "
            f"{proposal.file_path}"
        )
    if len(exact_matches) == 1:
        start = exact_matches[0]
        return start, start + m

    # 2. Normalized matching attempt (when exact match fails)
    norm_orig = [_normalize_line(line) for line in orig_lines]
    norm_source = [_normalize_line(line) for line in source_lines]

    norm_matches: list[int] = []
    for i in range(n - m + 1):
        if norm_source[i : i + m] == norm_orig:
            norm_matches.append(i)

    if len(norm_matches) == 0:
        raise PatchValidationError(
            f"patch original_code does not match supplied source: "
            f"{proposal.file_path}"
        )
    if len(norm_matches) > 1:
        raise PatchValidationError(
            f"patch original_code matches multiple locations in source: "
            f"{proposal.file_path}"
        )

    start = norm_matches[0]
    return start, start + m


# ---------------------------------------------------------------------------
# E. Construct unified diff
# ---------------------------------------------------------------------------

def _build_unified_diff(
    proposal: PatchProposal,
    source_file: CollectedSourceFile,
    start: int,
    end: int,
) -> tuple[str, list[str]]:
    """Construct deterministic unified diff using exact extracted source text.

    Returns:
        tuple of (unified_diff_str, aligned_replacement_lines)
    """
    source_lines = _source_lines(source_file)
    actual_original_lines = source_lines[start:end]

    orig_lines = proposal.original_code.strip("\r\n").splitlines()
    replacement_lines = proposal.replacement_code.strip("\r\n").splitlines()

    # Align indentation if the proposal model omitted leading indentation
    # from replacement_code relative to source indentation.
    first_src = next((line for line in actual_original_lines if line.strip()), "")
    src_indent = len(first_src) - len(first_src.lstrip(" \t")) if first_src else 0

    first_repl = next((line for line in replacement_lines if line.strip()), "")
    repl_indent = len(first_repl) - len(first_repl.lstrip(" \t")) if first_repl else 0

    aligned_replacement_lines = list(replacement_lines)
    if src_indent > repl_indent:
        shift = src_indent - repl_indent
        indent_char = "\t" if (first_src and first_src[0] == "\t") else " "
        indent_prefix = indent_char * shift
        aligned_replacement_lines = [
            f"{indent_prefix}{line}" if line.strip() else line
            for line in replacement_lines
        ]

    # Reject unchanged replacements against actual source
    if actual_original_lines == aligned_replacement_lines:
        raise PatchValidationError(
            f"patch replacement is identical to original: {proposal.file_path}"
        )

    updated_lines = (
        source_lines[:start]
        + aligned_replacement_lines
        + source_lines[end:]
    )

    diff = "\n".join(
        difflib.unified_diff(
            source_lines,
            updated_lines,
            fromfile=f"a/{proposal.file_path}",
            tofile=f"b/{proposal.file_path}",
            lineterm="",
        )
    )
    return diff, aligned_replacement_lines


# ---------------------------------------------------------------------------
# F. Diff validation, in-memory application, syntax & preservation checks
# ---------------------------------------------------------------------------

def _validate_diff(file_path: str, unified_diff: str) -> None:
    """Validate that the generated diff has correct headers, hunks, and changes."""
    if not unified_diff:
        raise PatchValidationError(
            f"generated diff is empty: {file_path}"
        )

    lines = unified_diff.splitlines()

    # Must contain --- and +++ headers matching the target file
    expected_from = f"--- a/{file_path}"
    expected_to = f"+++ b/{file_path}"
    has_minus_header = any(line == expected_from for line in lines)
    has_plus_header = any(line == expected_to for line in lines)
    if not has_minus_header or not has_plus_header:
        raise PatchValidationError(
            f"generated diff missing or invalid file headers: {file_path}"
        )

    # Must contain @@ hunk matching standard hunk syntax
    has_hunk = any(_HUNK_HEADER.match(line) for line in lines)
    if not has_hunk:
        raise PatchValidationError(
            f"generated diff missing hunk header: {file_path}"
        )

    # Must contain actual change (+ or - lines beyond headers)
    has_add = any(
        line.startswith("+") and not line.startswith("+++ ") for line in lines
    )
    has_remove = any(
        line.startswith("-") and not line.startswith("--- ") for line in lines
    )
    if not (has_add or has_remove):
        raise PatchValidationError(
            f"generated diff contains no actual changes: {file_path}"
        )


def _apply_unified_diff(
    source_lines: list[str],
    unified_diff: str,
    file_path: str,
) -> list[str]:
    """Apply a unified diff in-memory to source_lines and return reconstructed lines.

    Raises PatchValidationError if:
    - Diff headers or hunk headers are malformed.
    - Hunk context or deletions do not match source_lines.
    - Hunk line counts do not match hunk contents.
    - The diff cannot be cleanly applied.
    """
    diff_lines = unified_diff.splitlines()
    if not diff_lines:
        raise PatchValidationError(f"empty unified diff for {file_path}")

    expected_from = f"--- a/{file_path}"
    expected_to = f"+++ b/{file_path}"
    if len(diff_lines) < 3 or diff_lines[0] != expected_from or diff_lines[1] != expected_to:
        raise PatchValidationError(f"invalid diff headers for {file_path}")

    result_lines: list[str] = []
    src_idx = 0
    i = 2

    found_hunk = False
    while i < len(diff_lines):
        line = diff_lines[i]
        match = _HUNK_HEADER.match(line)
        if not match:
            i += 1
            continue

        found_hunk = True
        old_start = int(match.group(1))
        old_count = int(match.group(2)) if match.group(2) is not None else 1
        new_start = int(match.group(3))
        new_count = int(match.group(4)) if match.group(4) is not None else 1

        target_src_idx = old_start - 1 if old_count > 0 else old_start
        if target_src_idx < src_idx or target_src_idx > len(source_lines):
            raise PatchValidationError(
                f"diff hunk out of bounds for {file_path}: start={old_start}, source_len={len(source_lines)}"
            )

        # Copy untouched lines prior to this hunk
        result_lines.extend(source_lines[src_idx:target_src_idx])
        src_idx = target_src_idx

        i += 1
        hunk_old_count = 0
        hunk_new_count = 0

        while i < len(diff_lines) and not diff_lines[i].startswith("@@ "):
            hline = diff_lines[i]
            if hline.startswith(" "):
                context_line = hline[1:]
                if src_idx >= len(source_lines):
                    raise PatchValidationError(
                        f"diff hunk references line past EOF in {file_path}"
                    )
                if source_lines[src_idx] != context_line:
                    raise PatchValidationError(
                        f"diff context mismatch in {file_path} at line {src_idx + 1}: "
                        f"expected {context_line!r}, found {source_lines[src_idx]!r}"
                    )
                result_lines.append(context_line)
                src_idx += 1
                hunk_old_count += 1
                hunk_new_count += 1
            elif hline.startswith("-"):
                removed_line = hline[1:]
                if src_idx >= len(source_lines):
                    raise PatchValidationError(
                        f"diff hunk tries to remove line past EOF in {file_path}"
                    )
                if source_lines[src_idx] != removed_line:
                    raise PatchValidationError(
                        f"diff removal mismatch in {file_path} at line {src_idx + 1}: "
                        f"expected {removed_line!r}, found {source_lines[src_idx]!r}"
                    )
                src_idx += 1
                hunk_old_count += 1
            elif hline.startswith("+"):
                added_line = hline[1:]
                result_lines.append(added_line)
                hunk_new_count += 1
            elif hline.startswith("\\"):
                # "\ No newline at end of file"
                pass
            else:
                raise PatchValidationError(
                    f"invalid line prefix in diff hunk for {file_path}: {hline!r}"
                )
            i += 1

        if hunk_old_count != old_count or hunk_new_count != new_count:
            raise PatchValidationError(
                f"diff hunk counts do not match hunk lines in {file_path}: "
                f"old({hunk_old_count} vs {old_count}), new({hunk_new_count} vs {new_count})"
            )

    if not found_hunk:
        raise PatchValidationError(f"diff contains no hunks: {file_path}")

    # Copy remaining untouched lines
    result_lines.extend(source_lines[src_idx:])
    return result_lines


def _validate_python_syntax(file_path: str, applied_lines: list[str]) -> None:
    """Validate that the patched file produces syntactically valid Python."""
    if not file_path.endswith(".py"):
        return

    full_source = "\n".join(applied_lines)
    try:
        ast.parse(full_source, filename=file_path)
    except (SyntaxError, IndentationError) as exc:
        raise PatchValidationError(
            f"patch produces invalid Python syntax in {file_path}: "
            f"{exc.msg} (line {exc.lineno})"
        ) from exc


def _validate_preservation(
    source_lines: list[str],
    applied_lines: list[str],
    start: int,
    end: int,
    aligned_replacement_lines: list[str],
    file_path: str,
) -> None:
    """Validate that unaffected lines before and after replacement are preserved."""
    # Prefix must match untouched source
    if applied_lines[:start] != source_lines[:start]:
        raise PatchValidationError(
            f"patch does not preserve unaffected source lines before change: {file_path}"
        )

    # Replacement region must match aligned replacement lines
    repl_len = len(aligned_replacement_lines)
    if applied_lines[start : start + repl_len] != aligned_replacement_lines:
        raise PatchValidationError(
            f"applied diff does not match replacement lines: {file_path}"
        )

    # Suffix must match untouched source
    if applied_lines[start + repl_len :] != source_lines[end:]:
        raise PatchValidationError(
            f"patch does not preserve unaffected source lines after change: {file_path}"
        )

    # Total line count sanity check
    expected_len = len(source_lines) - (end - start) + repl_len
    if len(applied_lines) != expected_len:
        raise PatchValidationError(
            f"applied diff line count mismatch in {file_path}: "
            f"expected {expected_len}, got {len(applied_lines)}"
        )


# ---------------------------------------------------------------------------
# G. Public entry point
# ---------------------------------------------------------------------------

def generate_patches(
    findings: Sequence[CodeInspectionFinding],
    source_files: Sequence[CollectedSourceFile],
) -> PatchGenerationReport:
    """Return suggested patches without writing or executing repository code.

    Pipeline:
      A. Accept findings and source files.
      B. Short-circuit on empty findings without calling any model.
      C. Generate structured PatchProposal via provider routing.
      D. Validate proposals, match source, check truncation.
      E. Build diffs using extracted source text and correct indentation alignment.
      F. Validate diff format, apply in-memory, verify Python syntax, and check preservation.
      G. Return PatchGenerationReport.

    Raises on provider failure so workflow.py can handle optional-stage errors.
    Does not silently return empty patches on provider failures.
    """
    # --- B. Empty findings → empty report, no provider call ---
    if not findings:
        return PatchGenerationReport(
            patches=[],
            missing_information=["No code findings were supplied"],
            overall_confidence=0,
        )

    source_by_path = {
        source_file.relative_path: source_file for source_file in source_files
    }

    # Filter to findings whose files are present in supplied sources
    relevant_findings = [
        finding for finding in findings if finding.file_path in source_by_path
    ]
    if not relevant_findings:
        return PatchGenerationReport(
            patches=[],
            missing_information=["No finding references supplied source files"],
            overall_confidence=0,
        )

    relevant_sources = list(
        dict.fromkeys(
            source_by_path[finding.file_path]
            for finding in relevant_findings
        )
    )

    # --- C. Generate structured PatchProposal ---
    prompt = build_patch_generation_prompt(relevant_findings, relevant_sources)
    proposal_report: PatchProposalReport = generate_patch_report(prompt)

    # --- D-F. Validate, match, build diffs, validate diffs ---
    patches: list[ProposedPatch] = []
    for proposal in proposal_report.patches:
        # Validate static proposal properties
        _validate_proposal(proposal, source_by_path)

        # Validate proposal does not contain truncated content or placeholders
        _validate_not_truncated(proposal)

        source_file = source_by_path[proposal.file_path]
        original_content = source_file.content
        source_lines = _source_lines(source_file)

        # Unique matching (exact first, normalized fallback)
        start, end = _find_unique_source_match(proposal, source_lines)

        # Build unified diff using extracted source text and aligned indentation
        unified_diff, aligned_replacement = _build_unified_diff(
            proposal, source_file, start, end
        )

        # Verify source was not modified during diff construction
        if source_file.content != original_content:
            raise PatchValidationError(
                f"source file was modified during diff construction: "
                f"{proposal.file_path}"
            )

        # Validate generated diff structure (headers, hunks, +/- changes)
        _validate_diff(proposal.file_path, unified_diff)

        # Apply unified diff in-memory to verify it applies cleanly
        applied_lines = _apply_unified_diff(
            source_lines, unified_diff, proposal.file_path
        )

        # Validate unaffected lines before and after replacement are strictly preserved
        _validate_preservation(
            source_lines,
            applied_lines,
            start,
            end,
            aligned_replacement,
            proposal.file_path,
        )

        # Validate that patched file produces syntactically valid Python
        _validate_python_syntax(proposal.file_path, applied_lines)

        patches.append(
            ProposedPatch(
                file_path=proposal.file_path,
                unified_diff=unified_diff,
                explanation=proposal.explanation,
                related_finding=proposal.related_finding,
                confidence=proposal.confidence,
            )
        )

    # --- G. Return report ---
    return PatchGenerationReport(
        patches=patches,
        missing_information=proposal_report.missing_information,
        overall_confidence=proposal_report.overall_confidence,
    )
