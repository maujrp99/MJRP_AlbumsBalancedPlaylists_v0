#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
evidence_folder_check.py - does the evidence of a delivery really live in `reports/evidence/<TASK-ID>/`? The judge of
the `evidence-folder` catalog item (evidence-folder@2, CM-0026).

Born 2026-10-17 (audit of the fin-control conform, a separate agent): `evidence-folder@1` only asked that the folder
`reports/evidence/` EXISTS. The fin-control had it, with a single subfolder (`UAT-visual/`) and no evidence of any feature,
while the log of the conform said the evidence "already lives in `reports/evidence/<TASK-ID>/`". The check passed by form.
Here the folder has to hold what the rule (structure_rules.json, `screenshots`) says it holds.

What is a gap (exit 1):
  - evidence_dir_missing: the project has features and no `reports/evidence/`;
  - evidence_loose_file: a file directly in `reports/evidence/` - evidence lives in a subfolder named after what it proves;
  - evidence_not_by_feature: the project has features with a task done and NO subfolder named after a feature (`Fxx`,
    `Fxx-...`) or a task (`TASK-...`) holds a file - the case where `reports/evidence/` only keeps other subjects
    (`UAT-visual/`, a prototype's name);
  - evidence_pointer_dangling: a spec, plan or tasks of a feature cites `reports/evidence/<path>` that is not on disk AND the
    citation claims something already done: a line of a done task (`- [x]`, with its indented lines), or a spec/plan of a feature
    whose every task is done (or that has no tasks.md: nothing is pending, so nothing is future).
What is a warning (printed, never changes the exit code):
  - evidence_pointer_future (2026-10-19): the same citation on a PENDING task (`- [ ]`), or in the spec/plan of a feature that still
    has an open task - the folder is named before the task makes it, which is how a task is written. The rule: a folder cannot be
    missing before the work that produces it is done; once the task is checked the pointer must resolve.
  - evidence_feature_without_folder: a feature with every task done and no subfolder of its own with a file (its evidence
    may live under another subject - a UAT round, a visual recheck - but then the tasks should cite where).
A project with no feature has nothing to prove: exit 0. Exit 2: not evaluable (no project, no contract, not a code-app).

Usage:
  python3 mjrp-scripts/evidence_folder_check.py <project> [--json]
Stdlib only (ADR-0015); vendored into every child with the kernel.
"""
import json
import re
import sys
from pathlib import Path

FEATURES_DIR = "docs/specs/features"
EVIDENCE_DIR = "reports/evidence"
CONTRACT_FILE = ".mjrp-project.yml"
OWNER = "mjrp-implementing-tasks"

_FOLDER = re.compile(r"^(?P<id>F\d{2,})-[a-z0-9-]+$")
_BOX = re.compile(r"^- \[(?P<x>[ xX])\]")
_KEYED = re.compile(r"^(?:F\d{2,}|TASK-[\w-]+)(?:-.*)?$")
_POINTER = re.compile(r"reports/evidence/[A-Za-z0-9_./-]+")
_SUBBOX = re.compile(r"^\s*- \[(?P<x>[ xX])\]")
_NOT_EVIDENCE = {"folder-index.md", ".gitkeep", ".DS_Store", "README.md"}


def _profile(root):
    text = (root / CONTRACT_FILE).read_text(encoding="utf-8") if (root / CONTRACT_FILE).is_file() else None
    if text is None:
        return None
    m = re.search(r"^  profile:\s*['\"]?([\w-]+)", text, re.M)
    return m.group(1) if m else ""


def _tasks(path):
    """(done, total) of the `## Implementation` / `## Verification` checkboxes of a tasks.md (0, 0 when absent)."""
    if not path.is_file():
        return 0, 0
    inside, done, total = False, 0, 0
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("## "):
            inside = line.startswith(("## Implementation", "## Verification"))
            continue
        box = _BOX.match(line) if inside else None
        if box:
            total += 1
            done += box.group("x") != " "
    return done, total


def _files(folder):
    return [p for p in folder.rglob("*") if p.is_file() and p.name not in _NOT_EVIDENCE]


def check(root):
    """{"gaps": [...], "warnings": [...], "counts": {...}} of a code-app project."""
    root = Path(root)
    gaps, warnings = [], []

    def add(bucket, code, file, message):
        bucket.append({"code": code, "file": file, "message": message, "owner": OWNER})

    base = root / FEATURES_DIR
    folders = sorted(p for p in base.iterdir() if p.is_dir() and _FOLDER.match(p.name)) if base.is_dir() else []
    finished, started, pointers = [], [], []   # pointers: (file, path, claims_done)
    for folder in folders:
        done, total = _tasks(folder / "tasks.md")
        fid = _FOLDER.match(folder.name)["id"]
        if done:
            started.append(fid)
        if total and done == total:
            finished.append(fid)
        feature_done = not total or done == total      # no tasks.md (or no task) claims nothing pending: as before, a missing folder is a gap
        for name in ("spec.md", "plan.md", "tasks.md"):
            f = folder / name
            if f.is_file():
                box = None          # tasks.md: the checkbox the current line belongs to (None: no task, e.g. a heading)
                for line in f.read_text(encoding="utf-8", errors="replace").splitlines():
                    b = _SUBBOX.match(line)      # an indented subtask is judged by its own checkbox, not its parent's
                    if name == "tasks.md":
                        if b:
                            box = b["x"] in "xX"
                        elif line.strip() and not line[:1].isspace():
                            box = None
                    claims_done = box if name == "tasks.md" and box is not None else feature_done
                    for m in _POINTER.finditer(line):
                        pointers.append((f.relative_to(root).as_posix(), m.group(0).rstrip(".,;:/-"), claims_done))
    counts = {"features": len(folders), "started": len(started), "finished": len(finished), "keyed_folders": 0}
    if not folders:
        return {"gaps": gaps, "warnings": warnings, "counts": counts}
    evidence = root / EVIDENCE_DIR
    if not evidence.is_dir():
        add(gaps, "evidence_dir_missing", EVIDENCE_DIR, "o projeto tem features e não tem `reports/evidence/`: a prova de cada task vai em "
            "`reports/evidence/<TASK-ID>/` (a regra `screenshots` do structure_rules.json)")
        return {"gaps": gaps, "warnings": warnings, "counts": counts}
    for p in sorted(evidence.iterdir()):
        if p.is_file() and p.name not in _NOT_EVIDENCE:
            add(gaps, "evidence_loose_file", p.relative_to(root).as_posix(), "arquivo solto em `reports/evidence/`: a evidência mora numa pasta "
                "com o nome do que ela prova (`<TASK-ID>/`, `Fxx/`) - mova-o para lá")
    keyed = {p.name: p for p in sorted(evidence.iterdir()) if p.is_dir() and _KEYED.match(p.name) and _files(p)}
    counts["keyed_folders"] = len(keyed)
    if started and not keyed:
        others = sorted(p.name for p in evidence.iterdir() if p.is_dir())
        add(gaps, "evidence_not_by_feature", EVIDENCE_DIR, f"{len(started)} feature(s) com task feita e nenhuma pasta de `reports/evidence/` com o nome de uma "
            f"feature ou task e com arquivo dentro (há: {', '.join(others[:6]) or 'nada'}): a evidência de cada uma vai em `reports/evidence/<TASK-ID>/` ou `<Fxx>/`")
    for fid in finished:
        if keyed and not any(name == fid or name.startswith(f"{fid}-") for name in keyed):
            add(warnings, "evidence_feature_without_folder", EVIDENCE_DIR, f"{fid}: todas as tasks feitas e nenhuma pasta `reports/evidence/{fid}/` com arquivo; "
                "se a prova mora em outro assunto, as tasks dizem onde")
    seen = set()
    for src, ptr, claims_done in sorted(pointers, key=lambda x: not x[2]):      # a done citation is judged before a pending one of the same path
        if "<" in ptr or ptr in seen or ptr.rstrip("/") == EVIDENCE_DIR:
            continue
        seen.add(ptr)
        if not (root / ptr).exists():
            if claims_done:
                add(gaps, "evidence_pointer_dangling", src, f"cita `{ptr}`, que não está no disco: a evidência foi para outro lugar ou nunca foi gravada")
            else:
                add(warnings, "evidence_pointer_future", src, f"cita `{ptr}`, que ainda não está no disco: a task que a produz não está feita; "
                    "quando for marcada, o ponteiro tem que resolver")
    return {"gaps": gaps, "warnings": warnings, "counts": counts}


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    as_json = "--json" in argv
    root = Path(args[0] if args else ".").resolve()
    if not root.is_dir():
        print(f"evidence_folder_check: {root} não é uma pasta - não avaliável", file=sys.stderr)
        return 2
    profile = _profile(root)
    if profile is None:
        print(f"evidence_folder_check: {root.name} sem {CONTRACT_FILE} - não avaliável", file=sys.stderr)
        return 2
    if profile != "code-app":
        print(f"evidence_folder_check: {root.name} tem perfil `{profile or '?'}` - só um code-app entrega features; não avaliável", file=sys.stderr)
        return 2
    r = check(root)
    if as_json:
        print(json.dumps({"project": root.name, "ok": not r["gaps"], **r}, ensure_ascii=False, indent=2))
    else:
        print(f"evidence_folder_check: {root.name} - " + ("VERDE: a evidência mora em reports/evidence/<TASK-ID>/" if not r["gaps"] else f"VERMELHO: {len(r['gaps'])} lacuna(s)"))
        for g in r["gaps"]:
            print(f"  {g['file']}: {g['message']} -> {g['owner']}")
        for w in r["warnings"]:
            print(f"  [aviso] {w['file']}: {w['message']} -> {w['owner']}")
    return 1 if r["gaps"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
