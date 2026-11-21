#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""retired_names_check.py - no live document sends the agent to a skill that no longer exists.

The skill bodies are checked by build_plugin.py --check (S-56). This script checks the rest: the documents an agent
reads to decide what to do - README, AGENTS/CLAUDE/GEMINI, MEMORY, VISION, ROADMAP, the specs, the wiki, the
contract. Born 2026-10-05: after EP-10/EP-11 renamed 46 skills, another session still answered with retired names
(mjrp-adr, mjrp-system-architect, mjrp-svpg) - the README, 16 folder-index headers and live pointers in five children
had escaped a sweep that covered only the skills.

What it does not judge - records keep the name of their time: sections ## History / ## Histórico / ## Findings /
## Lições; dated entries ("- **2026-..."); a done task ("- [x]"); a line that says the skill was retired or renamed;
the folders of records (_archive, _backups, reports, docs/originals, docs/wiki/sources, docs/decisions, design/proposals,
docs/specs/requirements, the feedback folder, evals, the published migration notes) and the logs. The vendored kernel (docs/wiki/harness/) is fixed
at its source in the harness.

The list of retired names is mjrp-scripts/retired_skills.json (single source, shared with build_plugin.py).

    python3 mjrp-scripts/retired_names_check.py [root]     prints findings; always exits 0 (a warning, not a gate)
"""
import json
import re
import sys
from pathlib import Path

import _git

LIST_FILE = Path(__file__).resolve().parent / "retired_skills.json"
EXTS = {".md", ".yml", ".yaml"}
SKIP_DIRS = ("_archive/", "_backups/", "dist/", "node_modules/", "reports/", "docs/originals/", "docs/wiki/sources/",
             "docs/decisions/", "design/proposals/", "docs/specs/requirements/", "docs/wiki/harness/",
             "docs/wiki/feedback-from-other-projects/", "mjrp-skills/", "daily-checks/", ".mjrp/")
NOTES_DIR = "mjrp-scripts/migrations/"   # only the notes already published on main are immutable records (ADR-0019 § 2): they keep the name of their day
SKIP_NAMES = ("log.md", "SESSION_HISTORY.md", "harness-kaizen.md", "folder-index.md")
RECORD_SECTION = re.compile(r"^##\s+(History|Histórico|Historico|Findings|Lições|Licoes|De onde veio)", re.I)
RECORD_LINE = re.compile(r"retired|aposentad|renomead|renamed|formerly|origin:|\bex-`|\(ex-|\bantes `", re.I)
DATED = re.compile(r"^\s*[-*]\s+\*\*\d{4}-\d\d-\d\d")
DONE_TASK = re.compile(r"^\s*[-*]\s+\[x\]", re.I)


def load_retired():
    try:
        return json.loads(LIST_FILE.read_text(encoding="utf-8"))["skills"]
    except (OSError, ValueError, KeyError):
        return {}


def published_notes(root):
    """The migration notes already on the principal branch (`main`, else HEAD): immutable records, exempt from the check.
    A draft note (not on main yet) is live text and is checked - it is still being written (P2-6, 2026-10-14: the whole
    folder was exempt, so a draft sending the child to a retired skill went unseen). None when git cannot say: then the
    whole folder stays exempt, as before (a warning never invents a finding it cannot ground). Outside the harness source
    (no `mjrp-skills/`) the notes are vendored kernel, authored elsewhere: all of them are records there."""
    if not (Path(root) / "mjrp-skills").is_dir():
        return None
    ok_main = _git.run_tuple(root, "rev-parse", "--verify", "-q", "main", timeout=30)[0] == 0
    code, out = _git.run_tuple(root, "ls-tree", "-r", "--name-only", "main" if ok_main else "HEAD", "--", NOTES_DIR, timeout=30)
    return set(out.splitlines()) if code == 0 else None


def candidate_files(root):
    published = published_notes(root)
    code, out = _git.run_tuple(root, "ls-files", timeout=30)
    files = out.splitlines() if code == 0 else []
    if not files:
        files = [str(p.relative_to(root)) for p in root.rglob("*") if p.is_file()]
    for rel in files:
        rp = rel.replace("\\", "/")
        if Path(rp).suffix.lower() not in EXTS or Path(rp).name in SKIP_NAMES:
            continue
        if any(rp.startswith(d) or f"/{d}" in rp for d in SKIP_DIRS) or "/evals/" in rp:
            continue
        if rp.startswith(NOTES_DIR) and (published is None or rp in published):
            continue
        yield rp


def retired_mentions(root, retired=None):
    """[(file, line_no, old_name, successor)] for live lines that cite a retired skill."""
    root = Path(root)
    retired = load_retired() if retired is None else retired
    if not retired:
        return []
    pat = re.compile(r"(?<![\w-])(" + "|".join(re.escape(k) for k in sorted(retired, key=len, reverse=True)) + r")(?![\w-])")
    found = []
    for rel in candidate_files(root):
        try:
            text = (root / rel).read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        in_record = in_entry = False
        for n, ln in enumerate(text.split("\n"), 1):
            if ln.startswith("## "):
                in_record = bool(RECORD_SECTION.match(ln))
            # a dated entry or a done task is a record down to its last continuation line
            if DATED.match(ln) or DONE_TASK.match(ln):
                in_entry = True
            elif not ln.strip() or re.match(r"^\s*([-*]|\d+\.)\s", ln) or ln.startswith("#"):
                in_entry = False
            if in_record or in_entry or RECORD_LINE.search(ln):
                continue
            for m in pat.finditer(ln):
                successor = retired[m.group(1)].split(" / ")[0].replace("kernel ", "")
                if successor in ln:   # annotated: the line already names what replaced it
                    continue
                found.append((rel, n, m.group(1), retired[m.group(1)]))
    return found


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    hits = retired_mentions(root)
    for rel, n, old, new in hits:
        print(f"  {rel}:{n} cita {old} → {new}")
    print(f"retired_names_check: {len(hits)} menção(ões) viva(s) a skill aposentada/renomeada")
    return 0


if __name__ == "__main__":
    sys.exit(main())
