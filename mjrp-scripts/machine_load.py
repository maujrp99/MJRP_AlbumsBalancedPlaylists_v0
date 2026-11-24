#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""machine_load.py - one heavy suite at a time on the machine (F293, S-245, orchestrator rules 37 and 44).

Incident (2026-11-18): more than 40 doctors ran together, the load went past 50 and the machine stopped answering; the rule «uma bateria
por vez» lived only in the orchestrator's memory. This is the semaphore the doctor and the heavy test batteries take before they run.

The lock is an `flock` on `<home>/heavy-suite.lock` held by the owner PROCESS: the kernel drops it when that process dies, so a dead owner is
retaken by construction (no stale file to judge). The owner writes who it is (pid, label, command, start) to `heavy-suite.owner.json` so the
waiting one can say «quem está rodando e há quanto tempo». `<home>` is `$MJRP_MACHINE_HOME`, else `~/.mjrp`.

    python3 mjrp-scripts/machine_load.py run [--label L] [--wait SECONDS] -- <command...>   waits its turn, runs, releases
    python3 mjrp-scripts/machine_load.py status                                              who holds it now (exit 0 free, 1 held)

A child of a holder inherits `MJRP_HEAVY_HELD=<owner pid>` and does not queue again (the doctor under `run`, a selftest under the doctor).
Waiting has a ceiling (`--wait`, default 3600 s): past it the command is NOT run and the exit is 75 - «não conferido nunca é aprovação».
The command runs at low priority (`taskpolicy -b` on macOS, else `nice -n 10`; `MJRP_HEAVY_NICE=off|<n>|background`) and with the runners capped
to `MJRP_HEAVY_WORKERS` workers (default 2; `off` to leave them): the service answering the human keeps the processor (F323, S-252).
`heavy_label(argv)` is the one reader of «this command is a heavy suite»; the PreToolUse guard (hooks/machine_load_guard.py) uses it.
Stdlib only; it travels to the children with the kernel.
"""
from __future__ import annotations

import contextlib
import fcntl
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ENV_HELD = "MJRP_HEAVY_HELD"
ENV_HOME = "MJRP_MACHINE_HOME"
DEFAULT_WAIT = 3600
POLL = 1.0
REPORT_EVERY = 30
EXIT_WAIT_EXPIRED = 75

# F323 (S-252): a heavy suite runs at low priority and with few workers, so the service answering the human is not starved.
ENV_NICE = "MJRP_HEAVY_NICE"          # `background` (macOS taskpolicy -b, the default there), an integer nice level (default 10 elsewhere), or `off`
ENV_WORKERS = "MJRP_HEAVY_WORKERS"    # worker cap for the suite's runners (default 2); `off` or 0 leaves them alone
DEFAULT_NICE = 10
DEFAULT_WORKERS = 2


def _home() -> Path:
    h = Path(os.environ.get(ENV_HOME) or Path.home() / ".mjrp")
    h.mkdir(parents=True, exist_ok=True)
    return h


def _owner_file() -> Path:
    return _home() / "heavy-suite.owner.json"


def holder() -> dict | None:
    """The owner record while the lock is really held (the file alone proves nothing: a dead owner leaves it behind); None when free."""
    fd = os.open(_home() / "heavy-suite.lock", os.O_RDWR | os.O_CREAT, 0o600)
    try:
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            try:
                return json.loads(_owner_file().read_text(encoding="utf-8"))
            except (OSError, ValueError):
                return {"pid": None, "label": "?", "started": None, "cmd": "(dono sem registro)"}
        fcntl.flock(fd, fcntl.LOCK_UN)
        return None
    finally:
        os.close(fd)


def _queue_dir() -> Path:
    d = _home() / "heavy-queue"
    d.mkdir(parents=True, exist_ok=True)
    return d


def queue() -> list[dict]:
    """The waiting tickets in arrival order (one file per request: arrival time + pid). Each waiter holds an `flock` on its own ticket, so a
    ticket nobody holds belongs to a dead process (pid reuse cannot fool it) and leaves by itself."""
    out = []
    for f in sorted(_queue_dir().glob("*.json")):
        try:
            fd = os.open(f, os.O_RDWR)
        except OSError:
            continue
        try:
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError:                              # held: its waiter is alive
                try:
                    t = json.loads(f.read_text(encoding="utf-8"))
                except (OSError, ValueError):
                    t = None
                if isinstance(t, dict):
                    t["_file"] = f
                    out.append(t)
                continue
            with contextlib.suppress(OSError):           # we got it: no live waiter holds it
                f.unlink()
        finally:
            os.close(fd)
    return out


def _since(started) -> str:
    try:
        secs = int((datetime.now(timezone.utc) - datetime.fromisoformat(started)).total_seconds())
    except (TypeError, ValueError):
        return "há um tempo que não sei medir"
    return f"há {secs // 60} min {secs % 60:02d} s" if secs >= 60 else f"há {secs} s"


def describe(h: dict) -> str:
    return f"{h.get('label', '?')} (pid {h.get('pid')}) rodando {_since(h.get('started'))}: {h.get('cmd', '')}".strip()


def acquire(label: str, cmd: str = "", wait: float = DEFAULT_WAIT, out=None):
    """Takes the lock, waiting its turn; returns the open fd, or None when `wait` seconds passed. Says who holds it every REPORT_EVERY s."""
    out = out or sys.stderr
    fd = os.open(_home() / "heavy-suite.lock", os.O_RDWR | os.O_CREAT, 0o600)
    name = f"{time.time_ns():020d}-{os.getpid()}-{os.urandom(3).hex()}"
    tmp, ticket = _queue_dir() / (name + ".tmp"), _queue_dir() / (name + ".json")
    tfd = os.open(tmp, os.O_RDWR | os.O_CREAT, 0o600)
    fcntl.flock(tfd, fcntl.LOCK_EX)                      # held while waiting: this is the «alive» mark
    os.write(tfd, (json.dumps({"pid": os.getpid(), "label": label, "cmd": cmd[:300],
                               "arrived": datetime.now(timezone.utc).isoformat(timespec="seconds")}) + "\n").encode())
    os.replace(tmp, ticket)                              # appears whole, never half written
    deadline, last = time.monotonic() + wait, 0.0
    try:
        while True:
            q = queue()
            first = bool(q) and q[0]["_file"] == ticket
            if first or not any(t["_file"] == ticket for t in q):   # only the first alive ticket tries the lock (arrival order)
                try:
                    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except OSError:
                    pass
            now = time.monotonic()
            if now >= deadline:
                os.close(fd)
                fd = None
                return None
            if now - last >= REPORT_EVERY or last == 0.0:
                h = holder()
                pos = next((i for i, t in enumerate(q) if t["_file"] == ticket), 0) + 1
                print(f"[machine_load] fila: {label} é o {pos}º a esperar a vez; agora roda {describe(h) if h else 'outra suíte (acabando)'}", file=out, flush=True)
                last = now
            time.sleep(POLL)
    finally:
        with contextlib.suppress(OSError):
            ticket.unlink()
        os.close(tfd)
    rec = {"pid": os.getpid(), "label": label, "cmd": cmd[:300], "started": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    _owner_file().write_text(json.dumps(rec, ensure_ascii=False) + "\n", encoding="utf-8")
    return fd


def release(fd) -> None:
    with contextlib.suppress(OSError):
        _owner_file().unlink()
    with contextlib.suppress(OSError):
        fcntl.flock(fd, fcntl.LOCK_UN)
    with contextlib.suppress(OSError):
        os.close(fd)


@contextlib.contextmanager
def heavy(label: str, cmd: str = "", wait: float = DEFAULT_WAIT, lower: bool = True):
    """`with heavy("doctor"):` - the turn of one heavy suite. A child of a holder passes (it is already inside the turn). Raises TimeoutError
    when the wait ran out: the caller must not run the suite."""
    if os.environ.get(ENV_HELD):
        yield
        return
    fd = acquire(label, cmd or " ".join(sys.argv), wait)
    if fd is None:
        raise TimeoutError(f"a fila não andou em {int(wait)} s")
    os.environ[ENV_HELD] = str(os.getpid())
    if lower:                                             # `run` lowers the CHILD instead (once, not twice)
        lower_own_priority()
        for k, v in worker_env().items():
            os.environ.setdefault(k, v)
    try:
        yield
    finally:
        os.environ.pop(ENV_HELD, None)
        release(fd)


# ---- low priority and few workers (F323) -----------------------------------------------------------------------------------------------

def priority_mode(env=None, platform=None, which=shutil.which) -> str | int | None:
    """`background`, a nice level, or None (off). No launchd/taskpolicy on the machine (Linux, a container) falls back to nice."""
    env = os.environ if env is None else env
    raw = str(env.get(ENV_NICE, "")).strip().lower()
    platform = sys.platform if platform is None else platform
    if raw in ("off", "none", "0", "false"):
        return None
    if raw.lstrip("-").isdigit():
        return max(0, min(19, int(raw)))                  # never negative (needs privilege) and never past 19
    if raw in ("", "background", "bg"):
        return "background" if platform == "darwin" and which("taskpolicy") else DEFAULT_NICE
    return DEFAULT_NICE


def low_priority(cmd: list[str], env=None, platform=None, which=shutil.which) -> list[str]:
    """The command prefixed to run at low priority: `taskpolicy -b` (macOS background: lowest CPU and I/O class) or `nice -n N`."""
    mode = priority_mode(env, platform, which)
    if mode is None:
        return list(cmd)
    if mode == "background":
        return ["taskpolicy", "-b", *cmd]
    nice = which("nice")
    return [nice or "nice", "-n", str(mode), *cmd] if nice else list(cmd)


def worker_env(env=None) -> dict:
    """The environment with the worker caps of the usual runners (vitest, jest, node, the math libraries). The caller's own value wins."""
    env = dict(os.environ if env is None else env)
    raw = str(env.get(ENV_WORKERS, "")).strip().lower()
    if raw in ("off", "none", "0", "false"):
        return env
    n = str(int(raw)) if raw.isdigit() else str(DEFAULT_WORKERS)
    for key in ("VITEST_MAX_WORKERS", "VITEST_MAX_THREADS", "VITEST_MAX_FORKS", "JEST_WORKERS", "UV_THREADPOOL_SIZE",
                "OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "PYTEST_XDIST_AUTO_NUM_WORKERS"):
        env.setdefault(key, n)
    # F337 (UAT-638): vitest refuses a max below its own default minimum ("minThreads and maxThreads must not conflict"),
    # so the ceiling brings the floor with it. The caller's own value still wins.
    for key in ("VITEST_MIN_THREADS", "VITEST_MIN_FORKS"):
        env.setdefault(key, "1")
    return env


def lower_own_priority(env=None) -> None:
    """The doctor takes its turn here: it lowers ITS OWN priority (children inherit it). `background` has no in-process form: it becomes nice."""
    mode = priority_mode(env)
    if mode is None:
        return
    with contextlib.suppress(OSError, AttributeError):
        os.nice(DEFAULT_NICE if mode == "background" else int(mode))


# ---- the reader: which commands are a heavy suite -------------------------------------------------------------------------------------

def _base(word: str) -> str:
    return word.rsplit("/", 1)[-1]


VALUE_FLAGS = {"--config", "-c", "--cov", "--cov-report", "-p", "--rootdir", "--project", "--reporter", "--outputFile", "--root", "-C", "--dir"}


def _selects(args: list[str], exts: tuple[str, ...]) -> bool:
    """True when the arguments name a test file or node (a narrow run is cheap): `tests/x.py`, `a.py::t`, `-k`, `src/a.test.ts`. An option
    (`--cov=src/app.py`) or the value of one (`--config vitest.config.ts`) is not a test file."""
    for i, a in enumerate(args):
        if a == "-k" or ("::" in a and not a.startswith("-")):
            return True
        if a.startswith("-") or (i and args[i - 1] in VALUE_FLAGS):
            continue
        if a.endswith(exts):
            return True
    return False


WRAPPERS = {"env", "timeout", "nice", "exec", "command", "nohup", "time", "xargs", "sudo", "caffeinate"}


def _unwrap(argv: list[str]) -> list[str]:
    """`env FOO=1 timeout 600 nice -n5 pytest` -> `pytest`: the wrapper words, their options and their value are not the command."""
    while argv and (_base(argv[0]) in WRAPPERS or ("=" in argv[0] and not argv[0].startswith("-") and argv[0].split("=")[0].isidentifier())):
        wrapper = _base(argv[0]) in WRAPPERS
        argv = argv[1:]
        while wrapper and argv and (argv[0].startswith("-") or argv[0].replace(".", "", 1).rstrip("smhd").isdigit() or
                                    ("=" in argv[0] and argv[0].split("=")[0].isidentifier())):
            argv = argv[1:]
    return argv


RUNNERS = {"python", "python3", "uv", "uvx", "pytest", "py.test", "vitest", "jest", "npx", "npm", "pnpm", "yarn", "bun", "poetry", "doctor.py"}


def heavy_label(argv: list[str]) -> str | None:
    """«doctor», «pytest» or «front» when the simple command `argv` is a heavy suite and not already under `machine_load.py`; else None."""
    if not argv or any(_base(w) == "machine_load.py" for w in argv):
        return None
    argv = _unwrap(argv)                                  # `FOO=1 env timeout 600 pytest`
    if not argv:
        return None
    words = [_base(w) for w in argv]
    if not words or words[0] not in RUNNERS:              # only a runner at the command position: `git commit -m pytest`, `grep pytest` are not suites
        return None
    if "doctor.py" in words and words[0] in ("python", "python3", "uv") or words[0] == "doctor.py":
        return "doctor"
    if "pytest" in words or ("-m" in argv and argv[argv.index("-m") + 1:argv.index("-m") + 2] == ["pytest"]):
        return None if _selects(argv, (".py",)) else "pytest"
    runners = {"vitest", "jest"}
    npm_test = words[0] in ("npm", "pnpm", "yarn", "bun") and (words[1:2] == ["test"] or words[1:3] == ["run", "test"])
    if npm_test or runners & set(words):
        return None if _selects(argv, (".ts", ".tsx", ".js", ".jsx", ".mjs")) else "front"
    return None


def wrap(command: str, label: str = "") -> str:
    """The command a refused agent runs instead."""
    lab = f" --label {label}" if label else ""
    return f"python3 mjrp-scripts/machine_load.py run{lab} -- bash -c {json.dumps(command)}"


def main(argv=None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv or argv[0] not in ("run", "status"):
        print(__doc__)
        return 0
    if argv[0] == "status":
        h = holder()
        print("[machine_load] livre" if h is None else f"[machine_load] ocupada: {describe(h)}")
        for i, t in enumerate(queue(), 1):
            print(f"[machine_load]   fila {i}º: {t.get('label')} (pid {t.get('pid')}) chegou {_since(t.get('arrived'))}")
        return 0 if h is None else 1
    rest = argv[1:]
    label, wait = "suite", float(DEFAULT_WAIT)
    while rest and rest[0] != "--":
        if rest[0] == "--label" and len(rest) > 1:
            label, rest = rest[1], rest[2:]
        elif rest[0] == "--wait" and len(rest) > 1:
            wait, rest = float(rest[1]), rest[2:]
        else:
            print(f"machine_load: argumento desconhecido {rest[0]!r}", file=sys.stderr)
            return 2
    cmd = rest[1:]
    if not cmd:
        print("machine_load: falta o comando depois de `--`", file=sys.stderr)
        return 2
    try:
        with heavy(label, " ".join(cmd), wait, lower=False):
            return subprocess.call(low_priority(cmd), env=worker_env())
    except TimeoutError as exc:
        print(f"[machine_load] {exc}: o comando NÃO rodou (não conferido não é aprovação)", file=sys.stderr)
        return EXIT_WAIT_EXPIRED


if __name__ == "__main__":
    sys.exit(main())
