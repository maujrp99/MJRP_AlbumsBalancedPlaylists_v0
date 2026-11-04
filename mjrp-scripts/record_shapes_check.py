#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
record_shapes_check.py - do the records the harness's skills write follow the shape of their templates? The judge of the
`record-shapes` catalog item (record-shapes@1, CM-0034).

Born 2026-10-17 from the MJRP's decision of 2026-10-16 11:27 (the queue `awaiting_item` of the canonical catalog: the
templates of plan, tasks, test-plan, ux-audit, doc-audit, staleness-audit, code-quality-report, quality-review,
coverage-report, bug-report and history-section are canonical, "artefato para o nosso PDLC / harness"). A template is a
shape; this script is the sensor that tells whether the records of a child still have it. No clause of the catalog can read
"every file of a folder has this heading", so the shape lives here, like `evidence_folder_check.py`.

What is a gap (exit 1):
  Features (docs/specs/features/Fxx-*/, every folder with a spec.md whose status says the cycle began):
  - feature_plan_missing / feature_tasks_missing: no plan.md / tasks.md (or empty) beside a spec that is past Draft/Queued;
  - feature_plan_shape / feature_tasks_shape: plan.md does not open with `# Plan`, tasks.md with `# Tasks`;
  - feature_test_plan_missing: a feature still open (`In progress`) whose plan.md has no `## Test plan` section (the
    section `mjrp-ensuring-quality` writes, `templates/test-plan.md`). A Done feature is not asked for one afterwards.
  Reports (reports/**/*.md whose name starts with a date on or after SINCE and carries the type in the name):
  - report_shape: `-ux-audit` (frontmatter `type: ux-audit` + verdict · status · p0 · p1 · p2, and `# UX audit`),
    `-doc-audit` (`# Doc audit`, `## Divergences`), `-staleness-audit` (`# Staleness audit`), `-code-quality`
    (`# Quality Assessment`, `## 1. Scorecard`), `-quality-review` (`# Quality review`), `-coverage-report`
    (`# SDD Coverage Report`), `-bug-report` (`## Bug:`).
  History (the `## History` section of docs/wiki/**/*.md and docs/specs/*.md):
  - history_line_shape: a line dated on or after SINCE that does not open with `- **AAAA-MM-DD HH:MM**`.
Records older than SINCE are not judged: a record is not rewritten to satisfy a template that did not exist when it was
written. A project with none of these records has nothing to prove: exit 0. Exit 2: not evaluable (no project, no
contract, not a code-app).

Usage:
  python3 mjrp-scripts/record_shapes_check.py <project> [--json]
Stdlib only (ADR-0015); vendored into every child with the kernel.
"""
import json
import re
import sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
from _fm import block as _frontmatter   # the raw YAML block, one reader (F73 R4)

SINCE = "2026-10-17"            # the day the standard began; records dated before it are not judged
FEATURES_DIR = "docs/specs/features"
CONTRACT_FILE = ".mjrp-project.yml"

_FOLDER = re.compile(r"^F\d{2,}-[a-z0-9-]+$")
_NOT_STARTED = {"draft", "queued", "backlog", ""}          # the spec has no plan yet: nothing to ask of plan.md and tasks.md
_OPEN = {"in progress", "in-progress"}                     # the cycle runs: the Test plan is due
_DATE_NAME = re.compile(r"^(\d{4}-\d{2}-\d{2})(?:-\d{4})?-")
_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")
_HISTORY_LINE = re.compile(r"^- \*\*\d{4}-\d{2}-\d{2} \d{2}:\d{2}\*\*")

# the type in the file name -> (owner skill, [(regex, what it is)]); the regexes read the template, nothing more
REPORT_SHAPES = {
    "ux-audit": ("mjrp-critiquing-ux", [(r"^#\s+UX audit\b", "o título `# UX audit — <tela> · <data>`")]),
    "doc-audit": ("mjrp-auditing-docs", [(r"^#\s+Doc audit\b", "o título `# Doc audit — <escopo> · <data>`"),
                                         (r"^##\s+Divergences\b", "a seção `## Divergences`")]),
    "staleness-audit": ("mjrp-auditing-docs", [(r"^#\s+Staleness audit\b", "o título `# Staleness audit — <documento> · <data>`")]),
    "code-quality": ("mjrp-assessing-code-quality", [(r"^#\s+Quality Assessment\b", "o título `# Quality Assessment: <data>`"),
                                                     (r"^##\s+1\.\s+Scorecard\b", "a seção `## 1. Scorecard`")]),
    "quality-review": ("mjrp-ensuring-quality", [(r"^#\s+Quality review\b", "o título `# Quality review — <Fxx> · <data>`")]),
    "coverage-report": ("mjrp-ensuring-sdd", [(r"^#\s+SDD Coverage Report\b", "o título `# SDD Coverage Report — <Fxx> — <data>`")]),
    "bug-report": ("mjrp-ensuring-quality", [(r"^##\s+Bug:", "o título `## Bug: <título curto>`")]),
}
UX_KEYS = ("type", "verdict", "status", "p0", "p1", "p2")
_OWNERS = {
    "plan": "mjrp-specifying-sdd-artifacts", "tasks": "mjrp-specifying-sdd-artifacts", "test_plan": "mjrp-ensuring-quality",
    "history": "mjrp-syncing-docs",
}


def _profile(root):
    text = (root / CONTRACT_FILE).read_text(encoding="utf-8") if (root / CONTRACT_FILE).is_file() else None
    if text is None:
        return None
    m = re.search(r"^  profile:\s*['\"]?([\w-]+)", text, re.M)
    return m.group(1) if m else ""


def _read(path):
    return path.read_text(encoding="utf-8", errors="replace")


def _status(spec_text):
    m = re.search(r"^status:\s*(.+?)\s*(?:#.*)?$", _frontmatter(spec_text), re.M)
    return m.group(1).strip().strip("'\"").lower() if m else ""


def _features(root, gaps, add):
    base = root / FEATURES_DIR
    folders = sorted(p for p in base.iterdir() if p.is_dir() and _FOLDER.match(p.name)) if base.is_dir() else []
    seen = 0
    for folder in folders:
        spec = folder / "spec.md"
        if not spec.is_file():
            continue
        status = _status(_read(spec))
        if status in _NOT_STARTED:
            continue
        seen += 1
        rel = f"{FEATURES_DIR}/{folder.name}"
        for name, heading, key in (("plan", r"^#\s+Plan\b", "plan"), ("tasks", r"^#\s+Tasks\b", "tasks")):
            f = folder / f"{name}.md"
            text = _read(f) if f.is_file() else ""
            if not text.strip():
                add(gaps, f"feature_{name}_missing", f"{rel}/{name}.md", f"a feature está em `{status}` e não tem `{name}.md`: o ciclo é "
                    f"spec → plan → tasks, cada um na pasta da feature (modelo `templates/{name}.md` da mjrp-specifying-sdd-artifacts)", _OWNERS[key])
            elif not re.search(heading, text, re.M):
                add(gaps, f"feature_{name}_shape", f"{rel}/{name}.md", f"o `{name}.md` não abre com `# {name.capitalize()} — Feature Fxx: <nome>` "
                    f"(o modelo da mjrp-specifying-sdd-artifacts)", _OWNERS[key])
        plan = folder / "plan.md"
        if status in _OPEN and plan.is_file() and _read(plan).strip() and not re.search(r"^##\s+Test plan\b", _read(plan), re.M):
            add(gaps, "feature_test_plan_missing", f"{rel}/plan.md", f"feature `{status}` sem a seção `## Test plan` no plan.md: "
                "cada REQ do spec tem os casos de teste que o provam (modelo `templates/test-plan.md` da mjrp-ensuring-quality)", _OWNERS["test_plan"])
    return seen


def _report_type(stem):
    for token in REPORT_SHAPES:
        if re.search(rf"(?:^|-){re.escape(token)}(?:-|$)", stem):
            return token
    return None


def _reports(root, gaps, add):
    base = root / "reports"
    seen = 0
    if not base.is_dir():
        return seen
    for f in sorted(base.rglob("*.md")):
        m = _DATE_NAME.match(f.name)
        if not m or m.group(1) < SINCE or "evidence" in f.relative_to(base).parts[:1]:
            continue
        token = _report_type(f.stem)
        if not token:
            continue
        seen += 1
        owner, shapes = REPORT_SHAPES[token]
        text = _read(f)
        rel = f.relative_to(root).as_posix()
        missing = [what for rx, what in shapes if not re.search(rx, text, re.M)]
        if token == "ux-audit":
            fm = _frontmatter(text)
            absent = [f"`{k}`" for k in UX_KEYS if not re.search(rf"^{k}:\s*\S", fm, re.M)]
            if "`type`" not in absent and not re.search(r"^type:\s*['\"]?ux-audit\b", fm, re.M):
                absent.append("`type: ux-audit`")
            if absent:
                missing.insert(0, "o frontmatter (" + ", ".join(absent) + ") que o Control Center lê")
        if missing:
            add(gaps, "report_shape", rel, f"relatório `{token}` fora do modelo: falta " + "; ".join(missing), owner)
    return seen


def _history(root, gaps, add):
    files = sorted((root / "docs" / "wiki").rglob("*.md")) if (root / "docs" / "wiki").is_dir() else []
    files += sorted((root / "docs" / "specs").glob("*.md")) if (root / "docs" / "specs").is_dir() else []
    seen = 0
    for f in files:
        text = _read(f)
        m = re.search(r"^## History\s*$", text, re.M)
        if not m:
            continue
        section = text[m.end():]
        nxt = re.search(r"^## ", section, re.M)
        section = section[: nxt.start()] if nxt else section
        bad = []
        for line in section.splitlines():
            if not line.startswith("- "):
                continue
            d = _DATE.search(line)
            if d and d.group(0) >= SINCE:
                seen += 1
                if not _HISTORY_LINE.match(line):
                    bad.append(line[:60])
        if bad:
            add(gaps, "history_line_shape", f.relative_to(root).as_posix(), f"{len(bad)} linha(s) do `## History` fora de "
                f"`- **AAAA-MM-DD HH:MM** · <o que dizia> → <o que diz> (<o que mudou>)` (a hora vem do `TZ=America/Sao_Paulo date`): {bad[0]}…",
                _OWNERS["history"])
    return seen


def check(root):
    """{"gaps": [...], "counts": {...}} of a code-app project."""
    root = Path(root)
    gaps = []

    def add(bucket, code, file, message, owner):
        bucket.append({"code": code, "file": file, "message": message, "owner": owner})

    counts = {"features": _features(root, gaps, add), "reports": _reports(root, gaps, add), "history_lines": _history(root, gaps, add)}
    return {"gaps": gaps, "warnings": [], "counts": counts}


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    as_json = "--json" in argv
    root = Path(args[0] if args else ".").resolve()
    if not root.is_dir():
        print(f"record_shapes_check: {root} não é uma pasta - não avaliável", file=sys.stderr)
        return 2
    profile = _profile(root)
    if profile is None:
        print(f"record_shapes_check: {root.name} sem {CONTRACT_FILE} - não avaliável", file=sys.stderr)
        return 2
    if profile != "code-app":
        print(f"record_shapes_check: {root.name} tem perfil `{profile or '?'}` - só um code-app entrega features; não avaliável", file=sys.stderr)
        return 2
    r = check(root)
    if as_json:
        print(json.dumps({"project": root.name, "ok": not r["gaps"], **r}, ensure_ascii=False, indent=2))
    else:
        print(f"record_shapes_check: {root.name} - " + ("VERDE: os registros têm a forma dos modelos" if not r["gaps"] else f"VERMELHO: {len(r['gaps'])} lacuna(s)"))
        for g in r["gaps"]:
            print(f"  {g['file']}: {g['message']} -> {g['owner']}")
    return 1 if r["gaps"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
