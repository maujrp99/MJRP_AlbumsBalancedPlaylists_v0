#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""state_first_guard.py - the PreToolUse(Write|Edit|MultiEdit|NotebookEdit) hook behind «o estado primeiro» (F295, S-245, orchestrator rule 39).

It refuses (exit 2, one line on stderr that goes back to the agent) a write inside a feature's linked worktree while the feature's card is not
«Em andamento» (or an «Esperando…»), and the line gives the command that moves the card. Conversation, reading, the main checkout and any file
outside a feature's worktree pass. A failure of the guard itself passes (exit 0) and says so on stderr: the pre-commit net (`state_first_check.py
check`) still holds for the agent that has no hooks.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE.parent)]
sys.dont_write_bytecode = True

GUARDED = {"Write", "Edit", "MultiEdit", "NotebookEdit"}


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
        import state_first_check
        line = state_first_check.judge(path)
    except Exception as exc:  # noqa: BLE001
        print(f"state-first-guard: nao avaliou ({exc})", file=sys.stderr)
        return 0
    if line:
        print(line, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
