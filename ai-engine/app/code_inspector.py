"""Read-only collection of bounded source files for code inspection."""

from dataclasses import dataclass
from pathlib import Path
from typing import Sequence


DEFAULT_MAX_FILE_SIZE = 1_000_000
ALLOWED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".yaml",
    ".yml",
    ".sql",
    ".sh",
}
EXCLUDED_DIRECTORIES = {
    ".git",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    "dist",
    "build",
    ".env",
    "credentials",
    "secrets",
    "private_keys",
}
SENSITIVE_FILE_NAMES = {
    ".env",
    "credentials",
    "credentials.json",
    "id_rsa",
    "id_ed25519",
    "private_key",
    "private.key",
}


@dataclass(frozen=True)
class CollectedSourceFile:
    """A selected source file represented with line-numbered text."""

    relative_path: str
    content: str


def _contains_excluded_path(path: Path) -> bool:
    """Return whether a path contains an excluded directory or file name."""
    parts = [part.casefold() for part in path.parts]
    excluded_directories = {
        directory.casefold() for directory in EXCLUDED_DIRECTORIES
    }
    if any(part in excluded_directories for part in parts[:-1]):
        return True

    file_name = path.name.casefold()
    if file_name in {name.casefold() for name in SENSITIVE_FILE_NAMES}:
        return True
    if file_name.startswith(".env."):
        return True
    if "credential" in file_name or "private-key" in file_name:
        return True
    return path.suffix.casefold() in {".pem", ".key"}


def _has_symlink_component(root: Path, relative_path: Path) -> bool:
    """Return whether any requested path component is a symbolic link."""
    current = root
    for part in relative_path.parts:
        current /= part
        if current.is_symlink():
            return True
    return False


def _line_numbered(content: str) -> str:
    """Prefix each source line with its one-based line number."""
    return "\n".join(
        f"{line_number}: {line}"
        for line_number, line in enumerate(content.splitlines(), start=1)
    )


def collect_source_files(
    repository_directory: str | Path,
    relative_file_paths: Sequence[str],
    max_file_size: int = DEFAULT_MAX_FILE_SIZE,
) -> list[CollectedSourceFile]:
    """Collect explicitly selected, safe, readable source files.

    Paths must be relative to ``repository_directory``. The function only
    reads files and never scans directories, executes commands, or modifies
    repository contents.
    """
    root = Path(repository_directory)
    if not root.is_dir() or root.is_symlink():
        raise ValueError("repository_directory must be a real directory")
    if max_file_size <= 0:
        raise ValueError("max_file_size must be greater than zero")

    resolved_root = root.resolve()
    collected_files: list[CollectedSourceFile] = []

    for relative_file_path in relative_file_paths:
        relative_path = Path(relative_file_path)
        if relative_path.is_absolute():
            raise ValueError("file paths must be relative to the repository")
        if _contains_excluded_path(relative_path):
            raise ValueError(f"excluded file path: {relative_file_path}")
        if relative_path.suffix.casefold() not in ALLOWED_EXTENSIONS:
            raise ValueError(f"unsupported source file: {relative_file_path}")
        if _has_symlink_component(root, relative_path):
            raise ValueError(f"symlink paths are not allowed: {relative_file_path}")

        candidate = (root / relative_path).resolve()
        try:
            candidate.relative_to(resolved_root)
        except ValueError as error:
            raise ValueError(
                f"file path is outside the repository: {relative_file_path}"
            ) from error

        if not candidate.is_file():
            raise ValueError(f"source file does not exist: {relative_file_path}")
        if candidate.stat().st_size > max_file_size:
            raise ValueError(f"source file is too large: {relative_file_path}")

        raw_content = candidate.read_bytes()
        if len(raw_content) > max_file_size or b"\x00" in raw_content:
            raise ValueError(f"binary or oversized file: {relative_file_path}")
        try:
            content = raw_content.decode("utf-8")
        except UnicodeDecodeError as error:
            raise ValueError(
                f"binary or non-text file: {relative_file_path}"
            ) from error

        collected_files.append(
            CollectedSourceFile(
                relative_path=relative_path.as_posix(),
                content=_line_numbered(content),
            )
        )

    return collected_files


def inspect_source_files(
    repository_directory: str | Path,
    relative_file_paths: Sequence[str],
    incident_description: str | None = None,
    max_file_size: int = DEFAULT_MAX_FILE_SIZE,
):
    """Collect source files and return a validated AI inspection report."""
    from app.code_inspection_prompt import build_code_inspection_prompt
    from app.code_inspection_router import generate_code_inspection
    from app.schemas import CodeInspectionReport

    collected_files = collect_source_files(
        repository_directory,
        relative_file_paths,
        max_file_size=max_file_size,
    )
    file_names = [source_file.relative_path for source_file in collected_files]
    if not collected_files:
        return CodeInspectionReport(
            findings=[],
            files_inspected=[],
            missing_information=["No source files were supplied"],
        )

    prompt = build_code_inspection_prompt(
        collected_files,
        incident_description=incident_description,
    )
    report = generate_code_inspection(prompt)
    line_counts = {
        source_file.relative_path: len(source_file.content.splitlines())
        for source_file in collected_files
    }
    for finding in report.findings:
        if finding.file_path not in line_counts:
            raise ValueError(
                f"inspection finding references an uncollected file: "
                f"{finding.file_path}"
            )
        if finding.end_line > line_counts[finding.file_path]:
            raise ValueError(
                f"inspection finding references a missing line: "
                f"{finding.file_path}:{finding.end_line}"
            )

    return report.model_copy(update={"files_inspected": file_names})
