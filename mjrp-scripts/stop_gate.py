#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
stop_gate.py - the only point in the harness where it can PREVENT, not just warn.

PRINCIPLES II.4 says no work starts without a declared and verifiable exit criterion. loop.py
already mechanizes that for the TASK loop (it refuses to start without --until). This gate
mechanizes it for the TURN: work that changed watched files cannot end without a criterion that
was declared AND passed.

    python3 mjrp-scripts/stop_gate.py --declare "<command>"   runs it, records, returns its code
                                                              (only a command of the contract's closed list: R19)
    python3 mjrp-scripts/stop_gate.py                         the gate itself (the Stop hook)
    python3 mjrp-scripts/stop_gate.py --hook <mode>           the bookkeeping of the files a session touched (R21)

The criterion has a ceiling of time: STOP_GATE_TIMEOUT seconds (default 1800 - the full doctor of the main takes ~590-700 s, so
600 was too tight, UAT-382). Passing the ceiling is "not evaluable" (exit 2, recorded in the turn as not passed), never a
traceback and never a pass; the message says the ceiling and what to do (run the criterion directly, or raise the ceiling).
A STOP_GATE_TIMEOUT that is not a finite number in (0, 86400] is unreadable and falls back to the default (UAT-383).

Exit codes - note that 2 means something different here, because Claude Code reads it:
    0  may stop: nothing changed, or a criterion was declared and passed after the last change
    2  BLOCKED: work happened in a watched area with no criterion that passed

The gate is deliberately narrow. A conversation turn changes no file and is never blocked - a
gate that blocks the wrong thing gets the hooks switched off, which is worse than no gate.
"""
import argparse
import fcntl
import json
import math
import os
import re
import select
import shlex
import subprocess
import sys
import time
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _git

ROOT_DIR = Path(__file__).resolve().parent.parent
STATE_DIR = ROOT_DIR / ".mjrp"
TURN_FILE = STATE_DIR / "turn.json"                 # the turn of a session whose id is unknown (and the pre-F72 name)
# 2026-10-25 (F72, R21): the turn state is per SESSION. Two sessions in one checkout used to share `.mjrp/turn.json` and the whole
# `git status`: one released or blocked the other (a session was blocked by files another session had edited). Now each session has
# `.mjrp/turn-<session_id>.json` and, once the SessionStart hook has marked it (`session-<id>.json`), the gate looks only at the
# files THAT session touched (`touched-<id>.json`: the Write/Edit tools by the PostToolUse hook, a Bash command by the before/after
# snapshot of the dirty watched files). A session with no mark (hooks not installed, an id unknown) keeps the old whole-checkout
# behaviour - never a silent pass. The id comes from the hook payload (`session_id`), and from `CLAUDE_CODE_SESSION_ID` (the same
# id, in the environment of the Bash tool) for `--declare`, which the agent runs from Bash.
SESSION_ENV = "CLAUDE_CODE_SESSION_ID"
EDIT_TOOLS = ("Write", "Edit", "MultiEdit", "NotebookEdit")
# 2026-10-18 (the critique of the content-audit branch, P1-3): the gate released on ANY criterion that passed, and its own
# message suggested `doctor.py`, which keeps the conform's open items as warnings. Once the conform's criterion is declared, the
# gate remembers it (CONFORM_FILE) and accepts no other until that one passes.
CONFORM_CRITERION = "python3 mjrp-scripts/conformance_check.py . --gaps --pending --strict"
CONFORM_FILE = ROOT_DIR / ".mjrp" / "conform.json"

# The same areas W4 watches: where an edit matters. Everything else is scratch.
WATCHED = ("VISION.md", "README.md", "AGENTS.md", "CLAUDE.md", "MEMORY.md", "ROADMAP.md",
           "PRINCIPLES.md", "HOWTO.md", "docs/", "mjrp-skills/", "mjrp-scripts/",
           ".mjrp-project.yml")

# Derived paths are never "work": they are output. Counting them would block a turn for a
# __pycache__ the gate itself created by being imported - which is exactly what the selftest
# caught on the first run.
DERIVED = ("__pycache__", "/.mjrp/", "_backups/", "dist/", "mjrp-skills-packages/")


# 2026-10-25 (F72, R19 + R8): the criterion was a free string the agent wrote and `shell=True` ran, so `--declare "true"` released
# the turn - II.3 (the agent is not the judge) and II.4 (a verifiable criterion) turned into a request. Now the criterion must be
# one of a CLOSED LIST that the contract declares (`mjrp_harness.turn_criteria`, a list of commands), read from the COMMITTED
# contract (HEAD), so an edit the agent has not committed does not widen it; with no field the list is the doctor alone. The command
# is compared as an argv (shlex) and run as an argv, never through a shell. The conform's own criterion (is_conform_criterion) is
# always accepted. Honest limit: an agent can still commit a wider list into the contract - that shows in the review of the diff.
DEFAULT_CRITERIA = ("python3 mjrp-scripts/doctor.py .",)
CONTRACT_NAME = ".mjrp-project.yml"

# 2026-10-27 (F107, UAT-382): the criterion's ceiling of time was a fixed 600 s that the full doctor of the main outgrew
# (~590-700 s), and `TimeoutExpired` escaped as a traceback. The ceiling is now 1800 s, configurable by the environment.
TIMEOUT_ENV = "STOP_GATE_TIMEOUT"
DEFAULT_TIMEOUT = 1800
# 2026-10-27 (F108, UAT-383): a non-finite or absurd value (`inf`, `1e999`, >= ~4e9) made `subprocess.run` raise OverflowError - the same
# traceback class as UAT-382. Above one day the ceiling is no ceiling at all, so it is unreadable and falls back to the default.
MAX_TIMEOUT = 86400


def criterion_timeout() -> float:
    """Seconds the declared criterion may run: STOP_GATE_TIMEOUT when it is a finite number in (0, MAX_TIMEOUT] (86400 s, one day),
    else DEFAULT_TIMEOUT. Non-numeric, nan, inf, zero, negative and above-the-cap values are unreadable and fall back to the default."""
    try:
        value = float(os.environ.get(TIMEOUT_ENV, ""))
    except ValueError:
        return float(DEFAULT_TIMEOUT)
    if not math.isfinite(value) or value <= 0 or value > MAX_TIMEOUT:
        return float(DEFAULT_TIMEOUT)
    return value


def _text(raw) -> str:
    """The partial output of a killed criterion arrives as bytes (or None) even with text=True."""
    if raw is None:
        return ""
    return raw.decode("utf-8", "replace") if isinstance(raw, bytes) else str(raw)


def _contract_text(root: Path) -> str:
    """The committed contract (HEAD), else the file on disk (a project not yet committed), else ''."""
    code, out = _git.run_tuple(root, "show", f"HEAD:{CONTRACT_NAME}", timeout=20)
    if code == 0 and out.strip():
        return out
    f = root / CONTRACT_NAME
    return f.read_text(encoding="utf-8") if f.is_file() else ""


def allowed_criteria(root: Path = None) -> list:
    """The closed list of commands (strings) that may be declared as a criterion: the contract's `turn_criteria`, else the doctor."""
    root = root or ROOT_DIR
    text = _contract_text(root)
    listed = None
    if text:
        try:
            from _contract import read_yaml                         # vendored beside this file in every project
            listed = ((read_yaml(text) or {}).get("mjrp_harness") or {}).get("turn_criteria")
        except Exception:                                           # an unreadable contract falls back to the default, never to "anything"
            listed = None
    if isinstance(listed, list) and listed and all(isinstance(x, str) and x.strip() for x in listed):
        return list(listed)
    return list(DEFAULT_CRITERIA)


def resolve_criterion(cmd: str, root: Path = None):
    """(argv, '') when `cmd` is on the closed list (or is the conform criterion), else (None, the reason). Compared as argv."""
    try:
        argv = shlex.split(cmd or "")
    except ValueError:
        return None, "o comando não é lido pelo shlex"
    if not argv:
        return None, "critério vazio"
    if is_conform_criterion(cmd):
        return argv, ""
    for item in allowed_criteria(root):
        try:
            if shlex.split(item) == argv:
                return argv, ""
        except ValueError:
            continue
    return None, "não está na lista fechada do contrato (mjrp_harness.turn_criteria)"


def changed_files() -> list:
    # -uall: without it git collapses an untracked directory into one line ("?? docs/"), and the
    # gate would read the FOLDER's mtime instead of the file's - a folder's mtime does not move
    # when a file inside it is edited, so a stale criterion would release the turn. Found by
    # case 6 of hooks_selftest.
    code, status = _git.run_tuple(ROOT_DIR, "status", "--porcelain", "-uall")
    if code != 0:
        return []
    out = []
    for line in status.splitlines():
        path_str = line[3:].strip().strip('"')
        if any(d in f"/{path_str}" for d in DERIVED):
            continue
        if any(path_str.startswith(w) for w in WATCHED):
            out.append(path_str)
    return out


def read_payload() -> dict:
    """The hook JSON on stdin; {} when there is none (a terminal, no pipe, or nothing arrives in half a second)."""
    try:
        if sys.stdin is None or sys.stdin.isatty():
            return {}
        ready, _, _ = select.select([sys.stdin], [], [], 0.5)
        if not ready:
            return {}
        data = json.loads(sys.stdin.read() or "{}")
        return data if isinstance(data, dict) else {}
    except Exception:                                               # a hook never breaks the tool because its input was odd
        return {}


def clean_id(raw) -> str:
    return re.sub(r"[^A-Za-z0-9_-]", "", str(raw or ""))[:80]


def session_id(payload: dict = None) -> str:
    """The session's id: the hook payload's `session_id`, else the Bash tool's environment, else '' (the legacy single turn)."""
    return clean_id((payload or {}).get("session_id")) or clean_id(os.environ.get(SESSION_ENV))


# 2026-11-07 (F208, UAT-476): the hooks run `$CLAUDE_PROJECT_DIR/mjrp-scripts/stop_gate.py`, the MAIN checkout's script, while a session
# in a worktree runs `--declare` from its own folder: the turn lived in two `.mjrp/` folders, the gate read the one with no criterion, and a
# file the Control Center wrote in the main checkout during the turn counted as the session's. The hook payload carries the session's
# `cwd`; when it lies in another worktree of THIS repository (the same git common dir), every hook mode judges that worktree.
def session_root(payload: dict):
    """The toplevel of the checkout the session works in, when the payload's `cwd` is in another worktree of this repository; else None."""
    cwd = (payload or {}).get("cwd")
    if not isinstance(cwd, str) or not cwd or not Path(cwd).is_dir():
        return None
    code, out = _git.run_tuple(cwd, "rev-parse", "--show-toplevel", "--git-common-dir", timeout=20)
    mine_code, mine = _git.run_tuple(ROOT_DIR, "rev-parse", "--git-common-dir", timeout=20)
    lines = out.splitlines()
    if code != 0 or mine_code != 0 or len(lines) != 2:
        return None
    top = Path(lines[0]).resolve()
    common = (Path(cwd) / lines[1]).resolve()
    if top == ROOT_DIR.resolve() or common != (ROOT_DIR / mine.strip()).resolve():
        return None
    return top


def bind_root(root: Path) -> None:
    """Points every path the gate reads and writes at `root` (the session's own checkout)."""
    global ROOT_DIR, STATE_DIR, TURN_FILE, CONFORM_FILE
    ROOT_DIR = root
    STATE_DIR = root / ".mjrp"
    TURN_FILE = STATE_DIR / "turn.json"
    CONFORM_FILE = STATE_DIR / "conform.json"


def read_session_payload() -> dict:
    """The hook payload, with the gate bound to the session's own checkout when the payload says it is another worktree (UAT-476)."""
    payload = read_payload()
    root = session_root(payload)
    if root is not None:
        bind_root(root)
    return payload


def turn_file(sid: str) -> Path:
    return STATE_DIR / f"turn-{sid}.json" if sid else TURN_FILE


def write_json_atomic(path: Path, obj) -> None:
    """tmp + os.replace: a reader sees the old file or the new one, never half of it (R23)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, path)


def read_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def relative_watched(p: str):
    """The repo-relative path of an absolute or relative file path, when it lies inside this checkout; else None."""
    try:
        full = Path(p) if Path(p).is_absolute() else ROOT_DIR / p
        return str(full.resolve().relative_to(ROOT_DIR.resolve()))
    except (ValueError, OSError):
        return None


def session_marked(sid: str) -> bool:
    return bool(sid) and (STATE_DIR / f"session-{sid}.json").exists()


def touched_by(sid: str) -> set:
    return set(read_json(STATE_DIR / f"touched-{sid}.json", []))


def record_touched(sid: str, paths) -> None:
    """Adds repo-relative paths to the session's touched set. Under a lock: parallel tool calls run parallel hooks."""
    paths = [p for p in paths if p]
    if not sid or not paths:
        return
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with open(STATE_DIR / f"touched-{sid}.lock", "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        write_json_atomic(STATE_DIR / f"touched-{sid}.json", sorted(touched_by(sid) | set(paths)))


def dirty_mtimes() -> dict:
    """{path: mtime_ns} of the dirty files in the watched areas: what a Bash command may have changed."""
    out = {}
    for f in changed_files():
        try:
            out[f] = (ROOT_DIR / f).stat().st_mtime_ns
        except OSError:
            out[f] = 0
    return out


def hook_mode(mode: str) -> int:
    """The bookkeeping hooks (never block, always exit 0): session-start, record-edit, bash-pre, bash-post."""
    payload = read_session_payload()
    sid = session_id(payload)
    if mode == "session-start":                      # F240 (S-237): the orchestrator with no wait up is told the exact command (a page session: silent)
        try:
            import orchestrator_wait
            line = orchestrator_wait.session_start_line(ROOT_DIR)
            if line:
                print(line)
        except Exception:                           # noqa: BLE001 - a reminder never breaks the session start
            pass
    if not sid:
        return 0
    try:
        if mode == "session-start":
            mark = STATE_DIR / f"session-{sid}.json"
            if not mark.exists():
                write_json_atomic(mark, {"started": time.time()})
        elif mode == "record-edit" and payload.get("tool_name") in EDIT_TOOLS:
            ti = payload.get("tool_input") or {}
            record_touched(sid, [relative_watched(ti.get("file_path") or ti.get("notebook_path") or "")])
        elif mode == "bash-pre":
            write_json_atomic(STATE_DIR / f"bashsnap-{sid}.json", dirty_mtimes())
        elif mode == "bash-post":
            before = read_json(STATE_DIR / f"bashsnap-{sid}.json", None)
            if before is not None:
                now_ = dirty_mtimes()
                record_touched(sid, [f for f, m in now_.items() if before.get(f) != m])
    except Exception as e:                                          # noqa: BLE001 - bookkeeping must not fail the tool call
        print(f"  [stop_gate] {mode}: não registrou ({e})", file=sys.stderr)
    return 0


def newest_change_time(files_: list) -> float:
    times = [(ROOT_DIR / f).stat().st_mtime for f in files_ if (ROOT_DIR / f).exists()]
    return max(times) if times else 0.0


PYTHON_NAME = re.compile(r"python(3(\.\d+)?)?")


def _is_python(token: str) -> bool:
    """A bare interpreter name (`python`, `python3`, `python3.12`, found by PATH) or this very interpreter by its path. A name that
    merely STARTS with "python" in some other folder (`/tmp/python-x`) is not an interpreter the gate trusts (UAT-402)."""
    if PYTHON_NAME.fullmatch(token):
        return True
    return os.path.isabs(token) and os.path.realpath(token) == os.path.realpath(sys.executable)


def is_conform_judge_path(token: str, root: Path = None) -> bool:
    """True only when `token` names THE repository's own `mjrp-scripts/conformance_check.py` (resolved: `..` and symlinks followed;
    relative paths are read from the root, where the criterion runs). A same-named script elsewhere - /private/tmp, a copy the agent
    wrote - is a judge the agent wrote, and exiting 0 from it must not free the turn (UAT-402, audit 2026-10-25 § 0 finding 4)."""
    root = root or ROOT_DIR
    try:
        return (root / token).resolve() == (root / "mjrp-scripts" / "conformance_check.py").resolve()
    except (OSError, RuntimeError):
        return False


def is_conform_criterion(cmd: str) -> bool:
    """The conform's exit criterion, EXACTLY: `<python> <path>/conformance_check.py . --gaps --pending --strict` (flags in any
    order, nothing else), where <path> leads to THE repository's own mjrp-scripts/conformance_check.py. It is parsed, not
    substring-matched: `true # conformance_check.py . --gaps --pending --strict` is the command `true`, and a `&&` or a `;` changes
    the command. (2026-10-18, the recheck of the content-audit branch, P1-3. 2026-10-27, F121, UAT-402: the script is matched by its
    resolved path inside the repository, not by its name, and the interpreter by name, not by prefix.)"""
    try:
        argv = shlex.split(cmd or "")
    except ValueError:
        return False
    return (len(argv) == 6 and _is_python(argv[0]) and is_conform_judge_path(argv[1])
            and argv[2] == "." and sorted(argv[3:]) == ["--gaps", "--pending", "--strict"])


def _reader_path():
    reader = ROOT_DIR / "mjrp-scripts" / "conformance_check.py"
    return reader if reader.is_file() and (ROOT_DIR / ".mjrp-project.yml").is_file() else None


def catalog_state():
    """(state, reason) of the project's catalog against the harness, by the project's own reader (`catalog_compare` of its `--json`).
    state is "fresh", "none" (no reader in the project), or anything else = the conform cannot close on it; `reason` is "" only for
    "fresh" and "none". 2026-10-19: MJRP Personal's conform ran its vendored reader on its own catalog, stamped 14/10, and closed green
    while the harness was 11 items ahead - a criterion judged against the subject's own stale copy of the rule always passes.
    2026-10-20 (review P1-1, P1-2, P2-5): only "fresh" releases a conform - an unreachable harness, a reader
    that is older than the check, one that does not answer or breaks, are all «not evaluable», never the old behaviour."""
    reader = _reader_path()
    if reader is None:
        return "none", ""
    try:
        r = subprocess.run([sys.executable, str(reader), ".", "--json"], cwd=ROOT_DIR, capture_output=True, text=True, timeout=120)
        doc = json.loads(r.stdout)
    except Exception as e:
        return "error", f"o leitor do projeto não respondeu ({type(e).__name__}) — não avaliável"
    cmp_ = doc.get("catalog_compare") if isinstance(doc, dict) else None
    if not isinstance(cmp_, dict):
        return "old-reader", "o leitor do projeto é anterior à checagem de defasagem do catálogo"
    state = cmp_.get("state")
    if state == "fresh":
        return "fresh", ""
    if state == "behind":
        return "behind", f"catálogo defasado em {len(cmp_.get('behind') or [])} item(ns): {', '.join((cmp_.get('behind') or [])[:4])}"
    if state == "unreachable":
        return "unreachable", "não avaliável: harness não encontrado"
    return "error", f"o leitor devolveu um estado que não conheço ({state!r}) — não avaliável"


def catalog_stale() -> str:
    """Why the catalog cannot be trusted as the conform's criterion ("" when it is fresh, or the project has no reader)."""
    return catalog_state()[1]


def conform_pending() -> bool:
    """True when a conform is due: the project has migration notes pending, or its catalog is behind the harness (a stale catalog
    lists no notes - "0 pending" there is not "up to date"), by the project's own reader. Never raises."""
    reader = _reader_path()
    if reader is None:
        return False
    try:
        r = subprocess.run([sys.executable, str(reader), ".", "--pending"], cwd=ROOT_DIR, capture_output=True, text=True, timeout=60)
    except Exception:
        return False
    return any(l.lstrip().startswith("CM-") for l in r.stdout.splitlines()) or "catálogo defasado" in r.stdout


INHERITED_RED_ID = re.compile(r"^\s*\[ERRO (\S+)\]", re.MULTILINE)      # the doctor's «[ERRO I6] …» lines


def declare(cmd: str) -> int:
    conform = is_conform_criterion(cmd)
    if not conform and CONFORM_FILE.exists():                        # F233: in progress = started by someone (conform.json), not «a note is pending»
        print("  [stop_gate] RECUSADO — há um conform em andamento (.mjrp/conform.json) e o único critério que vale é o dele:",
              file=sys.stderr)
        print(f'    python3 mjrp-scripts/stop_gate.py --declare "{CONFORM_CRITERION}"', file=sys.stderr)
        print("  (largar o conform no meio é decisão do MJRP: ele apaga .mjrp/conform.json)", file=sys.stderr)
        return 2
    argv, why = resolve_criterion(cmd)
    if argv is None:
        print(f"  [stop_gate] RECUSADO — {why}. Um critério que o agente escreve livremente não é critério (II.3, II.4).", file=sys.stderr)
        print("  Critérios aceitos (a lista fechada do contrato):", file=sys.stderr)
        for item in allowed_criteria():
            print(f'    python3 mjrp-scripts/stop_gate.py --declare "{item}"', file=sys.stderr)
        return 2
    ceiling = criterion_timeout()
    try:
        r = subprocess.run(argv, cwd=ROOT_DIR, capture_output=True, text=True, timeout=ceiling)
    except OSError as e:                                           # the program is not there: not evaluable (2), never a pass
        r = subprocess.CompletedProcess(argv, 2, "", f"o critério não roda: {e}\n")
    except subprocess.TimeoutExpired as e:                         # F107: over the ceiling is not evaluable (2) - recorded, never a traceback or a pass
        r = subprocess.CompletedProcess(argv, 2, _text(e.stdout),
                                        _text(e.stderr) + f"\n  [stop_gate] NÃO AVALIÁVEL — o critério passou do teto de {ceiling:g} s e foi interrompido "
                                        f"(isto não é «passou»). Rode o critério direto (`{cmd}`) para ver o resultado, "
                                        f"ou suba o teto: {TIMEOUT_ENV}=<segundos> (padrão {DEFAULT_TIMEOUT}).\n")
    state, stale = catalog_state() if conform else ("", "")
    if conform and r.returncode == 0 and state != "fresh":          # the conform's criterion cannot pass on a kernel it did not judge fresh
        stale = stale or "o leitor do projeto não está mais lá — não avaliável"
        r = subprocess.CompletedProcess(cmd, 1, r.stdout, r.stderr + f"\n  [stop_gate] o critério saiu 0 mas {stale}; rode "
                                        "`new_project.py <esta pasta> --refresh-kernel` (do harness) e o conform de novo\n")
    # F233 (UAT-560): outside a conform, the doctor's errors that are ONLY the conform note's (I6: pendências herdadas, e.g. from a kernel refresh)
    # are not the turn's work. Any other error makes the criterion red as before; a criterion that names no `[ERRO <id>]` stays as it exited.
    inherited_only = False
    if not conform and r.returncode == 1 and any(Path(a).name == "doctor.py" for a in argv):   # only the doctor's own lines count (recheck P2)
        ids = INHERITED_RED_ID.findall(r.stdout)
        inherited_only = bool(ids) and set(ids) == {"I6"}
    passed = r.returncode == 0 or inherited_only
    write_json_atomic(turn_file(session_id()), {
        "criterion": cmd, "code": r.returncode, "passed": passed, "when": time.time(), "conform": conform,
        "catalog_compare": state or None, "inherited_only": inherited_only,
    })
    if conform:
        if r.returncode == 0:
            CONFORM_FILE.unlink(missing_ok=True)
        else:
            CONFORM_FILE.write_text(json.dumps({"since": time.time(), "criterion": cmd}, ensure_ascii=False), encoding="utf-8")
    print((r.stdout + r.stderr).rstrip())
    if inherited_only:
        print("\n  [stop_gate] os únicos erros são de nota de conformidade pendente (I6), herdados — não são do trabalho deste turno;"
              "\n  critério registrado como passou. A nota segue como aviso: a conformidade é outro trabalho.")
        return 0
    print(f"\n  [stop_gate] critério registrado: exit {r.returncode}"
          f" — {'o turno pode fechar' if r.returncode == 0 else 'ainda BLOQUEIA o fim do turno'}")
    return r.returncode


def gate() -> int:
    payload = read_session_payload()
    code = work_gate(session_id(payload), bool((payload or {}).get("stop_hook_active")))
    code = code if code else returned_gate(payload)
    code = code if code else pile_up_gate(payload)
    return code if code else wait_gate(payload)


# 2026-11-08 (F240, S-237): the orchestrator that ends a turn with no wait command up is not woken when the MJRP acts. The net: one warning per
# session (the SessionStart line is the first reminder). The state is orchestrator_wait.py's marker; a page session in a linked worktree is never warned.
def wait_gate(payload: dict) -> int:
    try:
        import orchestrator_wait                  # vendored beside this file in every project
    except ImportError:
        return 0
    try:
        code, text = orchestrator_wait.gate_block(ROOT_DIR, STATE_DIR, session_id(payload), bool((payload or {}).get("stop_hook_active")))
    except Exception:                             # noqa: BLE001 - a net that cannot decide lets go
        return 0
    if code:
        print(text, file=sys.stderr)
    return code


# 2026-11-07 (F220, S-226): the MJRP handed back thirteen stuck items from the iPhone and nothing made the owning agent act. The orchestrator of
# the project (the session in the MAIN checkout, never a page session in a linked worktree) cannot end its turn while a message is late past the
# contract's deadline; once per stop chain, so the gate never loops. The measure is returned_check.py's (also the doctor's W22).
def returned_gate(payload: dict) -> int:
    try:
        import returned_check                     # vendored beside this file in every project
    except ImportError:
        return 0
    code, text = returned_check.gate_block(ROOT_DIR, STATE_DIR, session_id(payload), bool((payload or {}).get("stop_hook_active")))
    if code:
        print(text, file=sys.stderr)
    return code


# 2026-11-08 (F222, S-227): the board piled up outside «Pronto para UAT» and nobody was charged. The orchestrator of the project (the MAIN
# checkout) cannot end its turn while «Esperando» or the backlog is over its limit, or the «Priorizada» holds an item with a free slot; once per
# stop chain. Harness only: the child has no pile_up_check.py (no Control Center to serve the board), so the import fails and the gate lets go.
def pile_up_gate(payload: dict) -> int:
    try:
        import pile_up_check
    except ImportError:
        return 0
    try:
        code, text = pile_up_check.gate_block(ROOT_DIR, STATE_DIR, session_id(payload), bool((payload or {}).get("stop_hook_active")))
    except Exception:                             # a gate that cannot measure lets go: the doctor's W23 says it did not read
        return 0
    if code:
        print(text, file=sys.stderr)
    return code


def work_gate(sid: str, stop_hook_active: bool = False) -> int:
    files_ = changed_files()
    if sid and session_marked(sid):               # R21: this session is judged by what IT touched, not by the whole checkout
        mine = touched_by(sid)
        files_ = [f for f in files_ if f in mine]
    if not files_:
        return 0
    declared = read_json(turn_file(sid), {})
    if not isinstance(declared, dict):
        declared = {}
    # F233 (UAT-560): a conform in progress is one somebody STARTED (conform.json): only its criterion releases the turn. A migration note a
    # kernel refresh left pending is a warning, never a hold: it was not made by this turn and a session doing other work cannot clear it.
    in_conform = CONFORM_FILE.exists()
    pending_warning = ("  (aviso: há nota(s) de conformidade pendente(s) neste projeto — não prendem este turno; a conformidade é outro trabalho: "
                       "`mjrp-pdlc-bootstrap`, modo conform)")

    def recorded_red() -> bool:
        """The same stop chain, nothing edited since a --declare that ran and recorded its result: block once, never again (F233, REQ-03)."""
        if not (stop_hook_active and "code" in declared and declared.get("when", 0) >= newest_change_time(files_)):
            return False
        print(f"  [stop_gate] o bloqueio já foi dito nesta cadeia e nada mudou depois do critério: o turno encerra com o resultado "
              f"registrado (exit {declared.get('code')}, em {turn_file(sid)}) — o vermelho fica para a próxima sessão ver.", file=sys.stderr)
        if conform_pending():
            print(pending_warning, file=sys.stderr)
        return True

    if declared.get("passed") and declared.get("when", 0) >= newest_change_time(files_) \
            and (declared.get("conform") or not in_conform):
        state, stale = catalog_state() if declared.get("conform") else ("fresh", "")
        # a conform criterion releases only when it was judged `fresh` when declared (turn.json says so) AND is `fresh` now
        if state == "fresh" and (not declared.get("conform") or declared.get("catalog_compare") == "fresh"):
            return 0
        stale = stale or ("o critério foi declarado sem o estado «fresh» do catálogo" if state == "fresh"
                          else "o leitor do projeto não está mais lá — não avaliável")
        if recorded_red():
            return 0
        print(f"  [stop_gate] BLOQUEADO — o critério do conform passou, mas {stale}: o conform não fecha num kernel velho.", file=sys.stderr)
        print("  Rode `new_project.py <esta pasta> --refresh-kernel` (do harness) e declare o critério de novo.", file=sys.stderr)
        return 2

    # 14/09: exit 1 (erro real) e exit 2 (critério não avaliou — sem contrato, caminho errado)
    # tinham a mesma mensagem, "não passou". São causas diferentes — uma pede corrigir o
    # trabalho, a outra pede corrigir o próprio critério — mesmo a trava sendo igual nos dois
    # casos: "não avaliado" não é "está são" (ADR-0002 §8). Só a explicação muda.
    if recorded_red():
        return 0
    if not declared:
        porque = "nenhum critério foi declarado neste turno"
    elif in_conform and declared.get("passed") and not declared.get("conform"):
        porque = ("há notas do conform pendentes e o critério que passou não é o do conform — um critério mais fraco "
                  "deixa o que falta como aviso")
    elif not declared.get("passed"):
        if declared.get("code") == 2:
            porque = ("o critério declarado não conseguiu avaliar, no todo ou em parte (exit 2) — não é erro no "
                      "trabalho: ou é o próprio comando/caminho/contrato, ou uma checagem que devia rodar não rodou "
                      "(o relatório do critério diz qual, em «NÃO AVALIÁVEL»); corrija isso, não o código")
        else:
            porque = "o critério declarado não passou"
    else:
        porque = "o critério passou ANTES da última edição — está velho"
    print("  [stop_gate] BLOQUEADO — " + porque + ".", file=sys.stderr)
    print(f"  {len(files_)} arquivo(s) mudaram em área vigiada: "
          f"{', '.join(files_[:5])}{' …' if len(files_) > 5 else ''}", file=sys.stderr)
    print(f"  (o turno desta sessão é lido em {turn_file(sid)}: o --declare roda nesta pasta, {ROOT_DIR})", file=sys.stderr)
    print("  Declare e rode o critério antes de encerrar:", file=sys.stderr)
    if in_conform:
        print("  (há um conform em andamento: o critério é o dele, não o doctor)", file=sys.stderr)
        print(f'    python3 mjrp-scripts/stop_gate.py --declare "{CONFORM_CRITERION}"', file=sys.stderr)
    else:
        print('    python3 mjrp-scripts/stop_gate.py --declare "python3 mjrp-scripts/doctor.py ."', file=sys.stderr)
    if not in_conform and conform_pending():
        print(pending_warning, file=sys.stderr)
    print("  PRINCIPLES II.4 — nenhum trabalho termina sem critério verificável.", file=sys.stderr)
    return 2


def main() -> int:
    ap = argparse.ArgumentParser(description="o gate do fim de turno (PRINCIPLES II.4)")
    ap.add_argument("--declare", metavar="CMD", help="roda o critério e registra o resultado")
    ap.add_argument("--hook", choices=("session-start", "record-edit", "bash-pre", "bash-post"),
                    help="bookkeeping hook of the session's touched files (R21); never blocks")
    a = ap.parse_args()
    if a.hook:
        return hook_mode(a.hook)
    return declare(a.declare) if a.declare else gate()


if __name__ == "__main__":
    sys.exit(main())
