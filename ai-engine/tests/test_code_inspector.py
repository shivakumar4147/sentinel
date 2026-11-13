import os

import pytest

from app.code_inspector import collect_source_files


def test_collects_explicit_source_file_with_line_numbers(tmp_path):
    source_file = tmp_path / "app.py"
    source_file.write_text("def run():\n    return 1\n", encoding="utf-8")

    collected = collect_source_files(tmp_path, ["app.py"])

    assert len(collected) == 1
    assert collected[0].relative_path == "app.py"
    assert collected[0].content == "1: def run():\n2:     return 1"


def test_rejects_path_traversal(tmp_path):
    outside_file = tmp_path.parent / "outside.py"
    outside_file.write_text("secret = True", encoding="utf-8")

    with pytest.raises(ValueError, match="outside the repository"):
        collect_source_files(tmp_path, ["..\\outside.py"])


@pytest.mark.parametrize(
    "relative_path",
    [".env", "credentials.json", ".git/config", "node_modules/app.js"],
)
def test_rejects_excluded_files_and_directories(tmp_path, relative_path):
    with pytest.raises(ValueError, match="excluded file path"):
        collect_source_files(tmp_path, [relative_path])


def test_rejects_symlink(tmp_path):
    source_file = tmp_path / "source.py"
    source_file.write_text("value = 1", encoding="utf-8")
    link = tmp_path / "link.py"
    try:
        os.symlink(source_file, link)
    except (OSError, NotImplementedError):
        pytest.skip("symlink creation is unavailable on this platform")

    with pytest.raises(ValueError, match="symlink"):
        collect_source_files(tmp_path, ["link.py"])


def test_rejects_unsupported_extension(tmp_path):
    document = tmp_path / "README.md"
    document.write_text("# Notes", encoding="utf-8")

    with pytest.raises(ValueError, match="unsupported source file"):
        collect_source_files(tmp_path, ["README.md"])


def test_rejects_oversized_file(tmp_path):
    source_file = tmp_path / "large.py"
    source_file.write_bytes(b"x" * 11)

    with pytest.raises(ValueError, match="too large"):
        collect_source_files(tmp_path, ["large.py"], max_file_size=10)
