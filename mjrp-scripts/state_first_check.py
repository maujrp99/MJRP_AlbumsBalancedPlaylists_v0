#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""state_first_check.py - «o estado primeiro» (F295, S-245, orchestrator rule 39): no write in a feature's worktree while its card is not «Em andamento».

Born from an incident (ADR-0002 asks for one): the orchestrator delegated sessions without telling them to mark the state, and the board kept
saying «Priorizada» for work that was running (2026-11-17/18). The state changes by a move on the board (`board_move.py`), and the first step of
whoever starts is that move; this is the judge that makes it a fact, not a hope.

  python3 mjrp-scripts/state_first_check.py check [<worktree>]     the net of the pre-commit (an agent with no hooks): exit 0 ok | 1 refused | 2 not evaluable
  (library) judge(path)                                      the refusal line for a write at `path`, or None - the PreToolUse hook's judge

It applies only in a LINKED worktree whose branch carries the feature (`branch-convention@2`, the same names the board reads); the main checkout,
a conversation, a reading and any file outside a worktree of a feature pass. A project with no board record at all passes too (no board, nothing to
tell). The card must be «Em andamento» or one of the «Esperando…» the owner chose; a card the delivery already left for the judge, the merge or the
OK is later in the line, not a start, so it passes (a fix after the judge must not be refused). The refusal gives the command that moves the card.
Exit codes are the sensors' (0 ok, 1 refused, 2 not evaluable). Stdlib only; comments in English, what the MJRP reads in Portuguese.
"""
import subprocess
import sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401, E402

sys.dont_write_bytecode = True

NOT_STARTED = (None, "prep", "queued", "reopened")   # the card never started, or came back: the work has not been marked as running


def _git(path, *args):
    got = subprocess.run(["git", "-C", str(path), *args], capture_output=True, text=True, timeout=10)
    return got.stdout.strip() if got.returncode == 0 else None


def feature_worktree(path):
    """(top, branch) of the linked worktree that holds `path`, or None: the main checkout and anything outside a repository pass."""
    start = Path(path)
    while not start.is_dir() and start != start.parent:      # the file about to be created: its nearest existing folder
        start = start.parent
    top = _git(start, "rev-parse", "--show-toplevel")
    git_dir = _git(start, "rev-parse", "--path-format=absolute", "--git-dir")
    common = _git(start, "rev-parse", "--path-format=absolute", "--git-common-dir")
    if not top or not git_dir or not common or git_dir == common:
        return None
    return Path(top), _git(top, "symbolic-ref", "--short", "-q", "HEAD") or ""


def refusal(top, branch):
    """The refusal line for the worktree `top` on `branch`, or None. Raises board_move.NotEvaluable when the board cannot be read."""
    import board_move as bm
    features = bm.branch_features(branch)
    for item in features:
        board = bm.Board(top, item=item)
        if not board.path.is_file():
            continue                                     # this project keeps no board record: nothing to tell
        state = board.state(item)
        if state not in NOT_STARTED:
            continue
        step = (f"python3 mjrp-scripts/board_move.py move {item} in_progress --why \"<o que esta sessão vai fazer>\""
                if bm.edge(board.graph, state or board.graph.get("initial"), "in_progress")
                else f"python3 mjrp-scripts/board_move.py next {item}")
        where = f"«{bm.label(board.graph, state)}»" if state else "sem registro no board"
        return (f"state-first: a {item} está {where}, e a regra 39 pede o card em «Em andamento» antes da primeira escrita. "
                f"Mova o card: {step} (ou `python3 mjrp-scripts/session_lease.py claim --feature {item}`).")
    return None


def judge(path):
    """The refusal line for a write at `path`, or None (also when it cannot judge: the hook says so and passes)."""
    found = feature_worktree(path)
    if not found:
        return None
    return refusal(*found)


def main(argv):
    if len(argv) < 2 or argv[1] != "check":
        print(__doc__.split("\n\n")[0], file=sys.stderr)
        return 2
    wt = Path(argv[2]) if len(argv) > 2 else Path(".")
    found = feature_worktree(wt)
    if not found:
        return 0
    try:
        line = refusal(*found)
    except Exception as exc:  # noqa: BLE001  (a board that cannot be read is not a verdict)
        if type(exc).__name__ == "NotEvaluable":
            return 0
        print(f"state-first: não avaliou ({exc})", file=sys.stderr)
        return 2
    if line:
        print(line, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
