#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
returned_check.py - what the MJRP handed back from the iPhone and no agent acted on past the deadline (F220, S-226).

    python3 mjrp-scripts/returned_check.py [<root>]      exit 0 nothing late · 1 a message past the deadline · 2 not evaluable

Incident (ADR-0002): on 2026-11-07 the MJRP handed back thirteen stuck items of four projects with «Devolver» (F205). The messages
showed at session start and nothing made the owning agent act: «nao adianta eu devolver e ficar sem acao, precisamos de um sensor».

A message counts until an agent marks it (`remote_approval.py returned --ack <id>`), the item unlocks (the server removes it) or it
expires (a week). It is LATE when it is older than the contract's `mjrp_harness.returned_deadline_hours` (DEFAULT_DEADLINE_HOURS when the
field is absent; decided in the contract, never at run time; the default is the agent's, revisable by the MJRP). A value that is not an
integer in (0, MAX_DEADLINE_HOURS] makes the measure not evaluable (exit 2), never a silent default.

Whose messages: the project's own (`to` is the project, the folder under `<account>/mjrp/projects/`). The harness is the integrator of
the account, so in the harness the messages of a project with no ACTIVE orchestrator session (no active lease in that project's main
checkout, `session_lease.py`) count too: someone sees them (S-226).

Where it runs: the doctor (W22, a warning: the ceiling of 12 error checks of ADR-0002 is full) and the Stop gate of the project's
orchestrator (`stop_gate.py` -> `gate_block`): the session in the main checkout cannot end its turn while a message is late, once per stop
chain (the hook's `stop_hook_active` plus a marker of ours, so the gate never loops). A page session in a linked worktree is never blocked.
Prose in Portuguese; stdlib only.
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401, E402

CONTRACT = ".mjrp-project.yml"
FIELD = "returned_deadline_hours"
DEFAULT_DEADLINE_HOURS = 24          # one day to act; the message lives a week, so the sensor charges for six days before it goes
MAX_DEADLINE_HOURS = 7 * 24          # past the message's life the sensor would never fire
BLOCK_MARKER_SECONDS = 10 * 60       # a block of ours younger than this, with `stop_hook_active`, is the same stop chain: let it end
ACK = "python3 mjrp-scripts/remote_approval.py returned --ack <id>"


class Unevaluable(Exception):
    """The measure could not be taken: never a pass."""


def deadline_hours(root):
    """The contract's deadline in hours; DEFAULT_DEADLINE_HOURS when the field (or the contract) is absent. Unevaluable when it is not an integer
    in (0, MAX_DEADLINE_HOURS]."""
    path = Path(root) / CONTRACT
    if not path.is_file():
        return DEFAULT_DEADLINE_HOURS
    from _contract import UnreadableYaml, read_yaml_strict
    try:
        doc = read_yaml_strict(path.read_text(encoding="utf-8"))
    except (OSError, UnreadableYaml) as e:
        raise Unevaluable(f"o contrato não se lê ({e})") from e
    value = (doc.get("mjrp_harness") or {}).get(FIELD) if isinstance(doc.get("mjrp_harness"), dict) else None
    if value is None:
        return DEFAULT_DEADLINE_HOURS
    if isinstance(value, bool) or not isinstance(value, int) or not 0 < value <= MAX_DEADLINE_HOURS:
        raise Unevaluable(f"`{FIELD}: {value}` não é um número inteiro de horas em (0, {MAX_DEADLINE_HOURS}]")
    return value


def open_messages(folder, now):
    """The handed-back messages no agent marked, still alive. An unreadable file is skipped: it is not a message."""
    out = []
    for path in sorted(Path(folder).glob("*.json")):
        try:
            body = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if not isinstance(body, dict) or body.get("acked_at"):
            continue
        try:
            alive = int(body.get("expires_at", 0) or 0) > now
            int(body.get("at", 0) or 0)
        except (TypeError, ValueError):
            continue
        if alive:
            out.append(body)
    return sorted(out, key=lambda b: int(b.get("at", 0) or 0))


def late_messages(messages, project, deadline_s, now, orphan=None):
    """[(message, for_another)]: the messages to `project` older than the deadline, and - when `orphan` is given - those to another project for
    which `orphan(name)` is true (no orchestrator there to see them)."""
    out = []
    for body in messages:
        if now - int(body.get("at", 0) or 0) < deadline_s:
            continue
        to = str(body.get("to") or "")
        if to == project:
            out.append((body, False))
        elif orphan is not None and to and orphan(to):
            out.append((body, True))
    return out


def has_orchestrator(project, projects_dir):
    """Whether the main checkout of `project` holds an active session lease (`session_lease.py`)."""
    import session_lease
    folder = Path(projects_dir) / project
    return folder.is_dir() and any(state == "active" for _lease, state in session_lease.leases(folder))


def charged(root, now=None):
    """(project, deadline_hours, [(message, for_another)]) for the project at `root`. Unevaluable when the project or the contract does not read."""
    now = int(time.time() if now is None else now)
    try:
        import _passkey
    except ImportError as e:
        raise Unevaluable("o _passkey.py não está ao lado deste script (rode o refresh do kernel)") from e
    try:
        project = _passkey.project_of(root)
    except _passkey.Unevaluable as e:
        raise Unevaluable(f"o projeto de {root} não se lê ({e})") from e
    hours = deadline_hours(root)
    folder = _passkey.approvals_dir() / "returned"
    if not folder.is_dir():
        return project, hours, []
    projects = _passkey.projects_dir()
    orphan = (lambda name: not has_orchestrator(name, projects)) if project == _passkey.HARNESS_PROJECT else None
    return project, hours, late_messages(open_messages(folder, now), project, int(hours * 3600), now, orphan)


def report_lines(project, hours, late, now=None):
    """The text an agent reads: each late message, whom it was for, how old, and the way out."""
    now = int(time.time() if now is None else now)
    lines = [f"{len(late)} mensagem(ns) devolvida(s) pelo MJRP, pelo iPhone, sem ação há mais de {hours:g} h (o prazo do contrato, "
             f"`{FIELD}`), para o integrador do {project}:"]
    for body, for_another in late:
        age = (now - int(body.get("at", 0) or 0)) // 3600
        whose = f" — do {body.get('to')}, que não tem sessão orquestradora ativa" if for_another else ""
        first = next((ln for ln in str(body.get("message", "")).splitlines() if ln.startswith("Item:")), "")
        lines.append(f"  [{body.get('id')}] há {age} h{whose}: {first.removeprefix('Item: ') or '(sem item)'}")
    lines.append("Faça o que ele pede (destrave e peça de novo) ou, se não dá, diga a ele por quê; então marque: " + ACK)
    lines.append("O texto inteiro de cada uma: python3 mjrp-scripts/remote_approval.py returned")
    return lines


def is_orchestrator(root):
    """Whether `root` is the main checkout of its repository (the orchestrator's), not a linked worktree (a page session's)."""
    try:
        r = subprocess.run(["git", "rev-parse", "--path-format=absolute", "--git-dir", "--git-common-dir"], cwd=str(root),
                           capture_output=True, text=True, timeout=20, check=False)
    except (OSError, subprocess.SubprocessError):
        return False
    lines = r.stdout.split()
    return r.returncode == 0 and len(lines) == 2 and Path(lines[0]).resolve() == Path(lines[1]).resolve()


def gate_block(root, state_dir, sid="", stop_hook_active=False, now=None):
    """The Stop gate's part (stop_gate.py): (2, text) when the orchestrator of this project has a late message and has not been blocked for it in
    this stop chain; else (0, ''). A page session, a measure that does not read, or nothing late never blocks."""
    now = int(time.time() if now is None else now)
    if not is_orchestrator(root):
        return 0, ""
    try:
        project, hours, late = charged(root, now)
    except Unevaluable:
        return 0, ""                          # the doctor's W22 says it is not evaluable; the gate does not block on what it cannot read
    if not late:
        return 0, ""
    marker = Path(state_dir) / f"returned-block-{sid or 'nosid'}.json"
    try:
        last = int(json.loads(marker.read_text(encoding="utf-8")).get("at", 0))
    except (OSError, ValueError, AttributeError, TypeError):
        last = 0
    if stop_hook_active and now - last < BLOCK_MARKER_SECONDS:
        return 0, ""                          # we already blocked this chain: the turn ends, and the next one is charged again
    marker.parent.mkdir(parents=True, exist_ok=True)
    tmp = marker.with_name(f".{marker.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps({"at": now, "ids": [b.get("id") for b, _ in late]}), encoding="utf-8")
    os.replace(tmp, marker)
    text = "\n".join(["  [stop_gate] BLOQUEADO — o que o MJRP devolveu está sem ação além do prazo (F220, S-226)."]
                     + [f"  {ln}" for ln in report_lines(project, hours, late, now)])
    return 2, text


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if any(a in ("-h", "--help") for a in argv) or len(argv) > 1:
        print("uso: returned_check.py [<pasta do projeto>]", file=sys.stderr)
        return 2
    root = Path(argv[0] if argv else ".").resolve()
    try:
        project, hours, late = charged(root)
    except Unevaluable as e:
        print(f"returned_check: NÃO AVALIÁVEL — {e}", file=sys.stderr)
        return 2
    if not late:
        print(f"returned_check: nenhuma mensagem devolvida ao {project} sem ação além de {hours:g} h")
        return 0
    print("\n".join(report_lines(project, hours, late)))
    return 1


if __name__ == "__main__":
    sys.exit(main())
