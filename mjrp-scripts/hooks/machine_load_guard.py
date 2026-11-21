#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""machine_load_guard.py - the PreToolUse(Bash) hook behind «uma suíte pesada por vez» (F293, S-245, orchestrator rule 44).

It refuses (exit 2, one line on stderr that goes back to the agent) a simple command that is a heavy suite - the full doctor, the whole
pytest battery, the whole front suite (`machine_load.heavy_label`) - when it is not already under `machine_load.py run`. The line gives the
wrapped command to run instead and says who holds the machine now. A narrow run (one test file, `-k`) and every other command pass.
A failure of the guard itself passes (exit 0) and says so on stderr: the semaphore inside the doctor still holds the line.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE.parent)]


def judge(command):
    """The refusal line for `command`, or None."""
    import catalog_marks_guard as g
    import machine_load as ml
    try:
        cmds = g.simple_commands(command.replace("\n", " ; "))
    except ValueError:
        return None
    pending = list(cmds)
    while pending:
        argv = pending.pop(0)
        argv = ml._unwrap(argv)
        flag = next((i for i, w in enumerate(argv[:-1]) if re.fullmatch(r"-[a-z]*c", w)), None)
        if argv and argv[0].rsplit("/", 1)[-1] in ("bash", "sh", "zsh") and flag is not None:   # `bash -lc "pytest"` is the same suite
            try:
                pending += g.simple_commands(argv[flag + 1].replace("\n", " ; "))
            except ValueError:
                pass
            continue
        label = ml.heavy_label(argv)
        if label:
            h = ml.holder()
            now = f" Agora roda {ml.describe(h)}." if h else " A máquina está livre agora."
            return (f"machine-load-guard: «{label}» é suíte pesada e a máquina roda uma por vez (regra 44).{now} "
                    f"Rode na fila: {ml.wrap(command, label)}")
    return None


def main():
    try:
        data = json.load(sys.stdin)
        if data.get("tool_name") != "Bash":
            return 0
        command = (data.get("tool_input") or {}).get("command")
        if not isinstance(command, str) or not command.strip():
            return 0
        refusal = judge(command)
    except Exception as exc:  # noqa: BLE001
        print(f"machine-load-guard: nao avaliou ({exc})", file=sys.stderr)
        return 0
    if refusal:
        print(refusal, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
