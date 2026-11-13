"""Regression and focused tests for the patch-generation subsystem."""

import re
from unittest.mock import patch

import pytest

from app.code_inspector import CollectedSourceFile
from app.patch_generator import (
    PatchValidationError,
    _source_lines,
    generate_patches,
)
from app.patch_generation_router import generate_patch_report
from app.schemas import (
    CodeInspectionFinding,
    PatchGenerationReport,
    PatchProposal,
    PatchProposalReport,
    ProposedPatch,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_finding(
    file_path: str = "app.py",
    title: str = "Handle failure",
) -> CodeInspectionFinding:
    """Create a valid finding for patch-generation tests."""
    return CodeInspectionFinding(
        file_path=file_path,
        start_line=1,
        end_line=1,
        severity="medium",
        title=title,
        description="The call can fail without handling.",
        evidence=["1: result = call()"],
        recommendation="Handle the failure.",
        confidence=0.9,
    )


def make_source(
    path: str = "app.py",
    content: str = "1: result = call()",
) -> CollectedSourceFile:
    """Create a valid source file for tests."""
    return CollectedSourceFile(path, content)


def make_proposal_report(
    file_path: str = "app.py",
    original_code: str = "result = call()",
    replacement_code: str = "result = safe_call()",
    related_finding: str | None = "Handle failure",
) -> PatchProposalReport:
    """Create a valid provider response."""
    return PatchProposalReport(
        patches=[
            PatchProposal(
                file_path=file_path,
                original_code=original_code,
                replacement_code=replacement_code,
                explanation="Handle the failing operation safely.",
                related_finding=related_finding,
                confidence=0.8,
            )
        ],
        missing_information=[],
        overall_confidence=0.8,
    )


def _apply_unified_diff(original_text: str, diff_text: str) -> str:
    """Apply a unified diff in-memory without touching disk or external tools."""
    original_lines = original_text.splitlines()
    diff_lines = diff_text.splitlines()

    hunk_regex = re.compile(
        r"^@@ -(?P<old_start>\d+)(?:,(?P<old_count>\d+))? "
        r"\+(?P<new_start>\d+)(?:,(?P<new_count>\d+))? @@"
    )

    result_lines = list(original_lines)
    offset = 0

    i = 0
    while i < len(diff_lines):
        line = diff_lines[i]
        match = hunk_regex.match(line)
        if match:
            old_start = int(match.group("old_start")) - 1
            i += 1

            expected_old: list[str] = []
            replacement: list[str] = []
            while i < len(diff_lines) and not diff_lines[i].startswith("@@ "):
                hline = diff_lines[i]
                if hline.startswith(" "):
                    expected_old.append(hline[1:])
                    replacement.append(hline[1:])
                elif hline.startswith("-"):
                    expected_old.append(hline[1:])
                elif hline.startswith("+"):
                    replacement.append(hline[1:])
                i += 1

            target_idx = old_start + offset
            actual_slice = result_lines[target_idx : target_idx + len(expected_old)]
            assert (
                actual_slice == expected_old
            ), f"Hunk context mismatch: {actual_slice} != {expected_old}"

            result_lines[target_idx : target_idx + len(expected_old)] = replacement
            offset += len(replacement) - len(expected_old)
        else:
            i += 1

    return "\n".join(result_lines)


# ---------------------------------------------------------------------------
# Regression tests required by specification
# ---------------------------------------------------------------------------


def test_exact_source_match():
    """Exact original_code matching successfully produces a deterministic diff."""
    source = make_source("app.py", "1: result = call()")
    proposal = make_proposal_report(
        original_code="result = call()",
        replacement_code="result = safe_call()",
    )

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        report = generate_patches([make_finding()], [source])

    assert len(report.patches) == 1
    patch_obj = report.patches[0]
    assert patch_obj.file_path == "app.py"
    assert "--- a/app.py" in patch_obj.unified_diff
    assert "+++ b/app.py" in patch_obj.unified_diff
    assert "-result = call()" in patch_obj.unified_diff
    assert "+result = safe_call()" in patch_obj.unified_diff


def test_whitespace_only_mismatch():
    """Proposal with stripped indentation matches source via normalized matching."""
    # Source has 4 leading spaces (indentation) inside a function
    source = make_source(
        "demo/sample_checkout/checkout.py",
        "1: def handle_checkout(request):\n"
        '2:     payment_method = request.get("paymentMethod").lower()',
    )
    # Model proposal omitted leading indentation
    proposal = make_proposal_report(
        file_path="demo/sample_checkout/checkout.py",
        original_code='payment_method = request.get("paymentMethod").lower()',
        replacement_code='payment_method_raw = request.get("paymentMethod"); payment_method = payment_method_raw.lower() if payment_method_raw else None',
        related_finding="Missing None check",
    )

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        finding = make_finding(
            file_path="demo/sample_checkout/checkout.py",
            title="Missing None check",
        )
        report = generate_patches([finding], [source])

    assert len(report.patches) == 1
    patch_obj = report.patches[0]
    diff = patch_obj.unified_diff
    # Diff must use exact source text (including 4 leading spaces)
    assert '-    payment_method = request.get("paymentMethod").lower()' in diff
    # Diff must preserve indentation in replacement
    assert "+    payment_method_raw = request.get" in diff


def test_unique_normalized_match():
    """Normalizing internal whitespace and line endings matches uniquely."""
    source = make_source(
        "app.py",
        "1: def process():\n2:     if   x   ==    1:\n3:         return True",
    )
    proposal = make_proposal_report(
        original_code="if x == 1:\n    return True",
        replacement_code="if x == 2:\n    return True",
    )

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        report = generate_patches([make_finding()], [source])

    assert len(report.patches) == 1
    diff = report.patches[0].unified_diff
    # The actual extracted source line with multiple spaces is preserved in diff
    assert "-    if   x   ==    1:" in diff
    assert "+    if x == 2:" in diff


def test_ambiguous_match_rejected():
    """Proposal whose original_code matches multiple locations is rejected."""
    source = make_source(
        "app.py",
        "1: x = 1\n2: y = 2\n3: x = 1",
    )
    proposal = make_proposal_report(
        original_code="x = 1",
        replacement_code="x = 99",
    )

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        with pytest.raises(
            PatchValidationError,
            match="matches multiple locations",
        ):
            generate_patches([make_finding()], [source])


def test_no_source_match_rejected():
    """Proposal whose original_code matches nothing in the source is rejected."""
    source = make_source("app.py", "1: result = call()")
    proposal = make_proposal_report(original_code="completely_different_function()")

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        with pytest.raises(
            PatchValidationError,
            match="does not match supplied source",
        ):
            generate_patches([make_finding()], [source])


def test_source_remains_unchanged():
    """Source file content is immutable and must not be modified."""
    source = make_source("app.py", "1: result = call()")
    original_content = source.content
    proposal = make_proposal_report()

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        generate_patches([make_finding()], [source])

    assert source.content == original_content


def test_generated_unified_diff_applies_cleanly_to_in_memory_copy_only():
    """Generated unified diff applies cleanly in-memory to reconstruct expected code."""
    raw_source = (
        "def handle_checkout(request):\n"
        "    payment_method = request.get('paymentMethod').lower()\n"
        "    return payment_method\n"
    )
    numbered = "\n".join(
        f"{i+1}: {line}" for i, line in enumerate(raw_source.splitlines())
    )
    source = CollectedSourceFile("demo/checkout.py", numbered)

    proposal = make_proposal_report(
        file_path="demo/checkout.py",
        original_code="payment_method = request.get('paymentMethod').lower()",
        replacement_code="payment_method = safe_lower(request.get('paymentMethod'))",
    )

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        finding = make_finding(file_path="demo/checkout.py")
        report = generate_patches([finding], [source])

    patch_obj = report.patches[0]
    clean_source_text = "\n".join(_source_lines(source))

    # Apply diff to in-memory clean source
    updated_text = _apply_unified_diff(clean_source_text, patch_obj.unified_diff)

    expected_text = (
        "def handle_checkout(request):\n"
        "    payment_method = safe_lower(request.get('paymentMethod'))\n"
        "    return payment_method"
    )
    assert updated_text == expected_text
    # Verify the CollectedSourceFile content was never altered
    assert source.content == numbered


def test_invalid_proposal_rejected():
    """Various malformed proposals are safely rejected."""
    source = make_source()

    # Empty replacement
    proposal_empty_rep = make_proposal_report(replacement_code="   ")
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal_empty_rep,
    ):
        with pytest.raises(
            PatchValidationError,
            match="replacement_code is empty",
        ):
            generate_patches([make_finding()], [source])

    # Unchanged replacement
    proposal_unchanged = make_proposal_report(
        original_code="result = call()",
        replacement_code="result = call()",
    )
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal_unchanged,
    ):
        with pytest.raises(
            PatchValidationError,
            match="replacement is identical to original",
        ):
            generate_patches([make_finding()], [source])

    # Path traversal
    proposal_traversal = make_proposal_report(file_path="../etc/passwd")
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal_traversal,
    ):
        with pytest.raises(
            PatchValidationError,
            match="path traversal",
        ):
            generate_patches([make_finding("../etc/passwd")], [make_source("../etc/passwd")])

    # Unsupplied file
    proposal_unsupplied = make_proposal_report(file_path="unknown.py")
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal_unsupplied,
    ):
        with pytest.raises(
            PatchValidationError,
            match="unsupplied file",
        ):
            generate_patches([make_finding()], [source])


def test_provider_fallback_behavior_preserved():
    """When Gemini fails with validation or other errors, Ollama fallback is used."""
    report = make_proposal_report()
    with patch(
        "app.patch_generation_router._generate_gemini_patch_report",
        side_effect=ValueError("Gemini API failed"),
    ):
        with patch(
            "app.patch_generation_router._generate_ollama_patch_report",
            return_value=report,
        ) as ollama:
            result = generate_patch_report("patch prompt")

    assert result is report
    ollama.assert_called_once_with("patch prompt")


def test_gemini_success_does_not_call_ollama():
    """When Gemini succeeds, Ollama is not called."""
    report = make_proposal_report()
    with patch(
        "app.patch_generation_router._generate_gemini_patch_report",
        return_value=report,
    ):
        with patch(
            "app.patch_generation_router._generate_ollama_patch_report",
        ) as ollama:
            result = generate_patch_report("patch prompt")

    assert result is report
    ollama.assert_not_called()


def test_both_providers_failing_raises_runtime_error():
    """When both Gemini and Ollama fail, RuntimeError is raised."""
    with patch(
        "app.patch_generation_router._generate_gemini_patch_report",
        side_effect=ValueError("Gemini failed"),
    ):
        with patch(
            "app.patch_generation_router._generate_ollama_patch_report",
            side_effect=ConnectionError("Ollama failed"),
        ):
            with pytest.raises(
                RuntimeError,
                match="Both Gemini and Ollama patch providers failed",
            ):
                generate_patch_report("patch prompt")


def test_empty_findings_do_not_call_provider():
    """Empty findings produce an empty report without calling the model."""
    with patch("app.patch_generator.generate_patch_report") as generate:
        report = generate_patches([], [make_source()])

    assert report.patches == []
    assert report.overall_confidence == 0
    generate.assert_not_called()


def test_nullable_related_finding_accepted():
    """A proposal with null related_finding is valid."""
    source = make_source()
    proposal = make_proposal_report(related_finding=None)

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        report = generate_patches([make_finding()], [source])

    assert report.patches[0].related_finding is None


# ---------------------------------------------------------------------------
# Additional integrity and regression tests
# ---------------------------------------------------------------------------


def test_incorrect_indentation_causing_syntax_errors():
    """Proposal with invalid indentation causing syntax/indentation error is rejected."""
    source = make_source(
        "demo/sample_checkout/checkout.py",
        "1: def handle_checkout(request):\n"
        '2:     payment_method = request.get("paymentMethod").lower()\n'
        "3:     if payment_method not in SUPPORTED_PAYMENT_METHODS:\n"
        "4:         return {}\n",
    )
    # Model proposal has invalid 8-space indentation inside a 4-space block
    proposal = make_proposal_report(
        file_path="demo/sample_checkout/checkout.py",
        original_code='    payment_method = request.get("paymentMethod").lower()',
        replacement_code='        payment_method = request.get("paymentMethod").lower()',
    )

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        with pytest.raises(
            PatchValidationError,
            match="invalid Python syntax",
        ):
            generate_patches(
                [make_finding(file_path="demo/sample_checkout/checkout.py")],
                [source],
            )


def test_incorrect_indentation_missing_suite_rejected():
    """Replacement with missing indented block after 'if' statement is rejected."""
    source = make_source(
        "app.py",
        "1: def process(x):\n2:     return x + 1\n",
    )
    # Introducing 'if x > 0:' without indenting 'return x + 1'
    proposal = make_proposal_report(
        file_path="app.py",
        original_code="return x + 1",
        replacement_code="if x > 0:\nreturn x + 1",
    )
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        with pytest.raises(
            PatchValidationError,
            match="invalid Python syntax",
        ):
            generate_patches([make_finding()], [source])


def test_truncated_replacement_ellipsis_rejected():
    """Proposal containing ellipsis placeholder is rejected."""
    source = make_source(
        "demo/sample_checkout/checkout.py",
        "1: def handle_checkout(request):\n"
        '2:     payment_method = request.get("paymentMethod").lower()\n'
        "3:     return payment_method\n",
    )
    proposal = make_proposal_report(
        file_path="demo/sample_checkout/checkout.py",
        original_code='payment_method = request.get("paymentMethod").lower()',
        replacement_code='payment_method = request.get("paymentMethod")\n...',
    )
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        with pytest.raises(
            PatchValidationError,
            match="truncation placeholder",
        ):
            generate_patches(
                [make_finding(file_path="demo/sample_checkout/checkout.py")],
                [source],
            )


def test_truncated_replacement_comment_marker_rejected():
    """Proposal containing '# ... rest of code' comment is rejected."""
    source = make_source(
        "app.py",
        "1: def run():\n2:     result = call()\n3:     return result\n",
    )
    proposal = make_proposal_report(
        original_code="result = call()",
        replacement_code="result = safe_call()\n# ... rest of code unchanged ...",
    )
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        with pytest.raises(
            PatchValidationError,
            match="truncation placeholder",
        ):
            generate_patches([make_finding()], [source])


def test_truncated_replacement_incomplete_condition_rejected():
    """Proposal ending with incomplete condition header is rejected."""
    source = make_source(
        "demo/sample_checkout/checkout.py",
        "1: def handle_checkout(request):\n"
        '2:     payment_method = request.get("paymentMethod").lower()\n'
        "3:     amount = request.get('amount')\n",
    )
    proposal = make_proposal_report(
        file_path="demo/sample_checkout/checkout.py",
        original_code='payment_method = request.get("paymentMethod").lower()',
        replacement_code='payment_method = request.get("paymentMethod")\nif payment_method not in SUPPORTED_PAYMENT_METHODS:',
    )
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        with pytest.raises(
            PatchValidationError,
            match="truncated",
        ):
            generate_patches(
                [make_finding(file_path="demo/sample_checkout/checkout.py")],
                [source],
            )


def test_truncated_replacement_trailing_operator_rejected():
    """Proposal ending with hanging operator is rejected."""
    source = make_source(
        "app.py",
        "1: def run():\n2:     flag = check()\n3:     return flag\n",
    )
    proposal = make_proposal_report(
        original_code="flag = check()",
        replacement_code="flag = check() and",
    )
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        with pytest.raises(
            PatchValidationError,
            match="truncated with trailing operator",
        ):
            generate_patches([make_finding()], [source])


def test_unaffected_source_preserved():
    """Proposal verifies lines before and after change are strictly preserved."""
    source = make_source(
        "app.py",
        "1: header_line = 1\n"
        "2: target_line = 2\n"
        "3: footer_line = 3\n",
    )
    proposal = make_proposal_report(
        original_code="target_line = 2",
        replacement_code="target_line = 20",
    )
    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        report = generate_patches([make_finding()], [source])

    assert len(report.patches) == 1
    diff = report.patches[0].unified_diff
    assert " header_line = 1" in diff
    assert "-target_line = 2" in diff
    assert "+target_line = 20" in diff
    assert " footer_line = 3" in diff


def test_live_checkout_scenario_exact_indentation_and_clean_diff():
    """Simulate the live checkout case: model returns stripped original_code

    and 4-space indented replacement_code. Result must NOT double-indent to 8 spaces!
    """
    raw_checkout = (
        'SUPPORTED_PAYMENT_METHODS = {"card", "paypal"}\n\n\n'
        "def handle_checkout(request: dict) -> dict:\n"
        '    """Validate a checkout request and return a simulated checkout result."""\n'
        '    payment_method = request.get("paymentMethod").lower()\n\n'
        "    if payment_method not in SUPPORTED_PAYMENT_METHODS:\n"
        "        return {\n"
        '            "status": "error",\n'
        '            "message": "Unsupported payment method",\n'
        "        }\n\n"
        '    amount = request.get("amount")\n'
        "    return {\n"
        '        "status": "accepted",\n'
        "    }\n"
    )
    numbered = "\n".join(
        f"{i+1}: {line}" for i, line in enumerate(raw_checkout.splitlines())
    )
    source = CollectedSourceFile("demo/sample_checkout/checkout.py", numbered)

    # Model sent stripped original_code (0-indent) and 4-space replacement_code
    proposal = make_proposal_report(
        file_path="demo/sample_checkout/checkout.py",
        original_code='payment_method = request.get("paymentMethod").lower()',
        replacement_code=(
            '    payment_method_raw = request.get("paymentMethod")\n'
            '    payment_method = payment_method_raw.lower() if payment_method_raw else None'
        ),
        related_finding="Missing None check",
    )

    with patch(
        "app.patch_generator.generate_patch_report",
        return_value=proposal,
    ):
        report = generate_patches(
            [make_finding(file_path="demo/sample_checkout/checkout.py")],
            [source],
        )

    assert len(report.patches) == 1
    diff = report.patches[0].unified_diff

    # Must have exact 4 spaces, NOT 8 spaces!
    assert "    payment_method_raw = request.get" in diff
    assert "        payment_method_raw = request.get" not in diff
    assert "    payment_method = payment_method_raw.lower()" in diff
    assert "        payment_method = payment_method_raw.lower()" not in diff

    # Diff must contain standard headers and hunks
    assert "--- a/demo/sample_checkout/checkout.py" in diff
    assert "+++ b/demo/sample_checkout/checkout.py" in diff
    assert "@@ " in diff
