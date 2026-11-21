#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""state_first_check_selftest.py - proves «o estado primeiro» (F295, orchestrator rule 39) on throwaway repositories in $TMPDIR, with the REAL PreToolUse hook and
the REAL pre-commit: a write in a feature's linked worktree is refused while the card is not «Em andamento» (with the command that moves it) and passes
once it is; an «Esperando…» card passes; the main checkout, a branch that carries no feature, a file outside a repository, a project with no board record and
a card already past the work (evaluating) all pass; the pre-commit net refuses the same commit. Without the guard every refusal case would pass.
Exit 0 ok, 1 failed."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
HOOK = HERE / "hooks" / "state_first_guard.py"
JUDGE = HERE / "state_first_check.py"
ENV = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t", "GIT_CONFIG_GLOBAL": os.devnull}
fails = 0


def check(name, ok, detail=""):
    global fails
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else f"  -> {str(detail)[:300]}"))
    fails += 0 if ok else 1


def git(root, *a):
    return subprocess.run(["git", "-C", str(root), *a], capture_output=True, text=True, env=ENV)


def record(main, state):
    """One line on the board record of the throwaway repository (the real file board_move reads, `<main>/.mjrp/board.jsonl`)."""
    p = Path(main) / ".mjrp" / "board.jsonl"
    p.parent.mkdir(exist_ok=True)
    with open(p, "a", encoding="utf-8") as fh:
        fh.write(json.dumps({"v": 1, "at": "2026-11-19T09:00:00-03:00", "item": "F77", "project": ".", "from": None, "to": state, "actor": "agent", "by": "t", "why": "t"}) + "\n")


def write_hook(tool, path, cwd):
    data = {"tool_name": tool, "tool_input": {"file_path": str(path)}, "cwd": str(cwd)}
    return subprocess.run([sys.executable, str(HOOK)], input=json.dumps(data), capture_output=True, text=True, env=ENV)


def main():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp).resolve()
        main_co = tmp / "repo"
        main_co.mkdir()
        git(main_co, "init", "-q", "-b", "main")
        (main_co / "docs/specs/features/F77-demo").mkdir(parents=True)
        (main_co / "docs/specs/features/F77-demo/spec.md").write_text("---\nstatus: Draft\n---\n# F77\n")
        (main_co / ".gitignore").write_text(".mjrp/\n")
        git(main_co, "add", "-A")
        git(main_co, "commit", "-q", "-m", "base")
        wt = tmp / "wt"
        git(main_co, "worktree", "add", "-q", "-b", "claude/f77-demo", str(wt))
        side = tmp / "side"
        git(main_co, "worktree", "add", "-q", "-b", "scratch-work", str(side))

        record(main_co, "queued")
        target = wt / "notes.md"
        got = write_hook("Write", target, wt)
        check("a write in a feature's worktree is refused while the card is «Priorizada»", got.returncode == 2, got.stdout + got.stderr)
        check("the refusal gives the command that moves the card", "board_move.py move F77 in_progress" in got.stderr, got.stderr)
        check("an Edit and a MultiEdit are refused too", write_hook("Edit", target, wt).returncode == 2 and write_hook("MultiEdit", target, wt).returncode == 2)
        check("a Read passes", write_hook("Read", target, wt).returncode == 0)
        check("a write in the main checkout passes", write_hook("Write", main_co / "n.md", main_co).returncode == 0)
        check("a worktree on a branch with no feature passes", write_hook("Write", side / "n.md", side).returncode == 0)
        outside = tmp / "elsewhere"
        outside.mkdir()
        check("a file outside any repository passes", write_hook("Write", outside / "x.md", outside).returncode == 0)
        check("a file in a folder not created yet is judged by its nearest existing folder", write_hook("Write", wt / "new/deep/x.md", wt).returncode == 2)

        # the pre-commit net: the real hook, the judge copied beside it
        shutil.copytree(HERE, wt / "mjrp-scripts", ignore=shutil.ignore_patterns("__pycache__", "*_selftest.py", "hooks", "migrations"))   # the judge and what board_move imports
        net = subprocess.run([sys.executable, str(JUDGE), "check", str(wt)], capture_output=True, text=True, env=ENV)
        check("the net refuses (exit 1) with the card out of «Em andamento»", net.returncode == 1 and "board_move.py" in net.stderr, net.stdout + net.stderr)
        (wt / ".h").mkdir()
        shutil.copy(HERE / "hooks" / "pre-commit", wt / ".h" / "pre-commit")
        git(wt, "config", "core.hooksPath", ".h")
        (wt / "k.md").write_text("k\n")
        git(wt, "add", "k.md")
        c = git(wt, "commit", "-m", "x")
        check("the real pre-commit refuses the commit", c.returncode != 0 and "state-first" in (c.stdout + c.stderr), c.stdout + c.stderr)
        git(wt, "reset", "-q")

        for state, name in (("in_progress", "«Em andamento»"), ("waiting_human", "«Esperando o cliente»"), ("waiting_agent", "«Esperando o agente»"),
                            ("evaluating", "«Em avaliação» (later in the line: a fix after the judge is not a start)")):
            record(main_co, state)
            check(f"the card in {name}: the write passes", write_hook("Write", target, wt).returncode == 0)
        record(main_co, "in_progress")
        check("the net passes with the card in «Em andamento»", subprocess.run([sys.executable, str(JUDGE), "check", str(wt)], capture_output=True, text=True, env=ENV).returncode == 0)
        (wt / "k.md").write_text("k\n")
        git(wt, "add", "k.md")
        c = git(wt, "commit", "-m", "x")
        check("the real pre-commit does not stop on the state when the card is «Em andamento»", "state-first" not in (c.stdout + c.stderr) and "estado primeiro" not in (c.stdout + c.stderr), c.stdout + c.stderr)

        # a project with no board record at all: nothing to tell
        shutil.rmtree(main_co / ".mjrp")
        check("a project with no board record passes", write_hook("Write", target, wt).returncode == 0)
    # the brief of a delegation (F295, rule 40): the same text every time, with the move as the first step and the exit criterion declared
    with tempfile.TemporaryDirectory() as tmp2:
        r = Path(tmp2) / "repo"
        (r / "docs/specs/features/F77-demo").mkdir(parents=True)
        (r / "docs/specs/features/F77-demo/spec.md").write_text("---\nstatus: Draft\nlane: fast\nsolution_type: feature\n---\n# Feature F77: A demo\n")
        git(r.parent, "init", "-q", "-b", "main", str(r))
        brief = HERE / "delegation_brief.py"

        def run(*a):
            return subprocess.run([sys.executable, str(brief), "F77", "--root", str(r), *a], capture_output=True, text=True, env=ENV)

        b = run("--task", "faça a coisa", "--done", "o teste X verde")
        out = b.stdout
        check("the brief prints and names the feature and its branch", b.returncode == 0 and "F77" in out and "claude/f77-demo" in out, b.stdout + b.stderr)
        check("the move on the board is the first step, before the task", "board_move.py move F77 in_progress" in out and out.index("board_move.py move F77") < out.index("faça a coisa"), out)
        check("the task and the exit criterion are the orchestrator's words", "faça a coisa" in out and "o teste X verde" in out)
        check("without `--done` the exit is the spec's success criteria", "Success Criteria" in run().stdout)
        check("every closing rule is there", all(k in out for k in ("retro_step_check.py . --branch HEAD --base main", "requirements_graph_check.py", "recheck", "session_lease.py release", "session-check", "log.md", "uma linha")), out)
        check("the model and the effort are declared", "sonnet" in out and "medium" in out and "opus" in run("--model", "opus", "--effort", "high").stdout)
        check("the kernel's self-tests only come with `--kernel`", "_boot_selftest.py" not in out and "_boot_selftest.py" in run("--kernel").stdout)
        miss = subprocess.run([sys.executable, str(brief), "F99", "--root", str(r)], capture_output=True, text=True, env=ENV)
        check("an unknown feature is exit 2", miss.returncode == 2, miss.stdout + miss.stderr)
    print("state_first_check_selftest: " + ("todos os casos passaram" if not fails else f"{fails} caso(s) falharam"))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
