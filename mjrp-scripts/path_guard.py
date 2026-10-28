#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
path_guard.py - the PreToolUse hook of the structure by nature (EP-09, fatia 5).

Before the agent CREATES a file, judges its path against structure_rules.json (the same rules as
structure_check.py and the doctor's W9). A new file outside its nature is blocked (exit 2) with
the destination it should have; everything else passes (exit 0).

Deliberately narrow - a gate that blocks the wrong thing gets the hooks switched off (the lesson
of stop_gate.py):
  - only NEW files: editing a file that already exists never blocks (old misplacements are W9's)
  - only Write/Edit/MultiEdit/NotebookEdit: shell commands are not parsed; the pre-commit and the
    doctor catch what comes that way
  - any doubt (no contract, unknown profile, unreadable input, the hook itself failing) -> exit 0

It exists only where the AI Platform runs hooks; everywhere else the pre-commit and W9 hold.
Input: the hook JSON on stdin (tool_name, tool_input.file_path | notebook_path, cwd).
"""
import json
import sys
from pathlib import Path
import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True                      # runs inside every project: leave no __pycache__

GUARDED = {"Write", "Edit", "MultiEdit", "NotebookEdit"}


def project_root(path: Path):
    for d in [path.parent, *path.parent.parents]:
        if (d / ".mjrp-project.yml").exists():
            return d
    return None


def main():
    try:
        data = json.load(sys.stdin)
        if data.get("tool_name") not in GUARDED:
            return 0
        ti = data.get("tool_input") or {}
        raw = ti.get("file_path") or ti.get("notebook_path")
        if not raw:
            return 0
        path = Path(raw)
        if not path.is_absolute():
            path = Path(data.get("cwd") or ".") / path
        path = path.resolve()
        if path.exists():
            return 0
        root = project_root(path)
        if root is None:
            return 0
        import structure_check
        finding = structure_check.judge_path(root, path.relative_to(root).as_posix())
    except Exception:
        return 0
    if not finding:
        return 0
    to = finding.get("to")
    where = f" Grave em `{to}/`." if to and " " not in to else ""
    print(f"[path_guard] bloqueado: `{finding['path']}` — {finding['msg']}.{where} "
          f"Se for estrutura nova de verdade, ela entra primeiro no structure_rules.json do harness "
          f"(regra de bolso: verdade → docs/ · olhar o projeto → reports/ · em decisão ou mostra → "
          f"design/ · não é texto para gente → data/).", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
