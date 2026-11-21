#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
supervisor_state.py - the one home of the supervisor's state: where it lives, its shape and the reader (F294, S-245, orchestrator rule 46).

The supervisor (`supervisor.py`, harness only, under launchd) WRITES `~/.mjrp/supervisor/state.json`; the orchestrator of the harness and of
every child READS it through `open_alerts` (`orchestrator_wait.py`: the wait wakes on a new alert, the session-start line lists them). Readers
depend on this module, never on the file's shape, and this module depends on nothing of the supervisor: no import cycle.

The shape (SCHEMA 1), one JSON object:
  schema       1
  beat         epoch seconds of the last cycle that finished
  interval     seconds between two cycles
  alerts       {id: {id, kind, project, opened, text, ...}}; project is a main checkout's resolved path, or null for an alert of every project
  pending      {key: epoch} - since when a condition that needs time has held (the supervisor's own bookkeeping)
  unevaluable  [text] - what the last cycle could not read
  history      [{id, text, opened, closed, why}] - the last closed alerts, pruned to the writer's ceiling
A state with another schema, no beat for more than STALE_CYCLES cycles, or no state at all is «não avaliável», never «no alert».

Written by tmp + os.replace under an exclusive lock (one writer at a time); vendored with the kernel (stdlib only). Prose in Portuguese.
"""
from __future__ import annotations

import contextlib
import fcntl
import json
import os
import time
from pathlib import Path

SCHEMA = 1
LABEL = "com.mjrp.supervisor"
STALE_CYCLES = 3
DEFAULT_INTERVAL = 60


def home_dir() -> Path:
    return Path(os.environ.get("MJRP_SUPERVISOR_HOME") or Path.home() / ".mjrp" / "supervisor")


def state_path(home=None) -> Path:
    return Path(home or home_dir()) / "state.json"


def hm(ts) -> str:
    return time.strftime("%H:%M", time.localtime(float(ts or 0)))


def read_state(home=None):
    """The state as written, or None when there is none or it does not parse (a reader treats both as «não avaliável»)."""
    try:
        data = json.loads(state_path(home).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def health(state, now=None, home=None):
    """('ok', '') or ('unevaluable', why)."""
    now = time.time() if now is None else now
    if state is None:
        if state_path(home).exists():
            return "unevaluable", "o estado do supervisor não se lê"
        return "unevaluable", "supervisor não instalado ou nunca rodou (o MJRP instala: python3 mjrp-scripts/supervisor.py install)"
    if state.get("schema") != SCHEMA:
        return "unevaluable", f"o estado do supervisor tem o formato {state.get('schema')!r}, este leitor conhece o {SCHEMA}"
    beat = float(state.get("beat") or 0)
    if now - beat > STALE_CYCLES * int(state.get("interval") or DEFAULT_INTERVAL):
        return "unevaluable", f"supervisor parado: sem batida desde {hm(beat)} (launchctl print gui/$(id -u)/{LABEL})"
    return "ok", ""


def open_alerts(project_root, now=None, home=None):
    """(verdict, why, [alert]) for one project: its own alerts and the global ones (the Control Center serves every project). A state of
    another schema yields no alert at all: its shape is not trusted."""
    state = read_state(home)
    verdict, why = health(state, now, home)
    if state is None or state.get("schema") != SCHEMA:
        return verdict, why, []
    root = str(Path(project_root).resolve())
    alerts = [a for a in (state.get("alerts") or {}).values() if isinstance(a, dict) and a.get("project") in (None, root)]
    return verdict, why, sorted(alerts, key=lambda a: (a.get("opened", 0), a.get("id", "")))


@contextlib.contextmanager
def locked(home=None):
    """One writer at a time (a cycle and an `ack` at once must not lose each other's write)."""
    d = Path(home or home_dir())
    d.mkdir(parents=True, exist_ok=True)
    with open(d / ".lock", "a") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(fh, fcntl.LOCK_UN)


def write_state(state, home=None):
    path = state_path(home)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(dict(state, schema=SCHEMA), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    os.replace(tmp, path)
