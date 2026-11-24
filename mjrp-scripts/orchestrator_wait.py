#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
orchestrator_wait.py - the one wait command of a project's orchestrator: it ends the moment the MJRP acts (F240, S-237).

    python3 mjrp-scripts/orchestrator_wait.py [--seconds 3500] [--root .]      run it in BACKGROUND; the session wakes when it ends
    python3 mjrp-scripts/orchestrator_wait.py --session-start [--root .]       the one line the SessionStart hook prints (silent when no need)

Incident (ADR-0002): on 2026-11-08 the MJRP said «eu percebo que qdo faço o remote approval vc reage, mas o orquestrador do personal não».
A command run in background wakes the session that launched it when it ends; `remote_approval.py wait` did that for ONE approval, and only the
harness's orchestrator knew to use it. Answers in «Agent Proposals», an item handed back, a drag in the «Priorizada» woke nobody.

It ends (exit 0) with what happened as soon as ANY of these is new since the last wait handed its snapshot over:
  - an answer of the screen no agent applied (`screen_answers.py`: the audit answers and the proposal batches),
  - an open message he handed back from the iPhone to this project (`returned_check.py`; in the harness also the projects with no active orchestrator),
  - a change in a `docs/specs/priority.md` at `main` (`priority_next.py`'s reader),
  - an approval of a distance request of this project that he signed (`remote_approval.py`'s folders, read through `_passkey`),
  - a push the iPhone ordered for this project and the service sent (`approvals/pushed/*.json` with `result: ok`; F244, CC-ADR-0045 § 7): it
    wakes with the SHA that went, to check production,
  - an alert the supervisor outside the agent opened for this project or for all (`supervisor_state.py`, written by `supervisor.py`; F294): a session that died mid-turn, the
    Control Center stuck, the orchestrator without its wait, or the supervisor itself stopped.
Nothing in `--seconds`: exit 3, saying to run it again. Another wait already up for this folder: exit 4. Not the orchestrator: exit 2.

It only READS (git and the account's approval folders) and writes two small files of its own in `<root>/.mjrp/`: the marker «a wait is up» (the
hook and the Stop gate read it; removed when the command ends) and the snapshot the last wait handed over (so a thing that happened with no wait
up is reported by the next one at once). It polls every INTERVAL seconds, a few light reads: no busy loop.

Only the orchestrator waits: the session in the MAIN checkout of the project, never a page session in a linked worktree
(`returned_check.is_orchestrator`). The net: the Stop gate (`stop_gate.py`) warns once per session when the orchestrator ends a turn with no
wait up (`gate_block`). Prose in Portuguese; stdlib only (vendored with the kernel).
"""
import argparse
import hashlib
import json
import os
import signal
import sys
import time
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401, E402

DEFAULT_SECONDS = 3500        # just under the hour of a background command's usual ceiling
INTERVAL = 20                 # seconds between two snapshots (~0.3 s of reads each, so ~1.5% of one core): a reaction within seconds, no busy loop
MARKER = "orchestrator-wait.json"
SEEN = "orchestrator-wait-seen.json"
WARNED = "orchestrator-wait-warned-{sid}.json"
EXIT_HAPPENED, EXIT_NOT_ORCHESTRATOR, EXIT_NOTHING, EXIT_ALREADY_UP = 0, 2, 3, 4
COMMAND = "python3 mjrp-scripts/orchestrator_wait.py --seconds {seconds} --root ."


class Unevaluable(Exception):
    """A reader could not be loaded or read: never a pass."""


def command(seconds=DEFAULT_SECONDS):
    """The exact line the orchestrator runs in background."""
    return COMMAND.format(seconds=seconds)


def _write_json(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(obj, sort_keys=True), encoding="utf-8")
    os.replace(tmp, path)


def _read_json(path, default=None):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default
    return data if isinstance(data, dict) else default


def _pid_alive(pid):
    try:
        os.kill(int(pid), 0)
    except (OSError, ValueError, TypeError):
        return False
    return True


def wait_up(state_dir, now=None):
    """The marker of a live wait of this folder (pid alive, not past its time), or None."""
    now = time.time() if now is None else now
    mark = _read_json(Path(state_dir) / MARKER)
    if not mark or not _pid_alive(mark.get("pid")) or float(mark.get("until", 0) or 0) <= now:
        return None
    return mark


# ---- the readers: each one is the existing home of its rule; this file only asks them -------------------------------------------------

def _answers(root):
    """The answers of the root and of each `apps/*/` with a contract: a batch lives in the project that asked it (UAT-571)."""
    import priority_next
    import screen_answers
    root = Path(root)
    ids = set()
    for folder in [root, *sorted(p.parent for p in (root / "apps").glob(f"*/{priority_next.CONTRACT}"))]:
        state = screen_answers.state_of(folder)
        where = "" if folder == root else f"{folder.relative_to(root).as_posix()}: "
        ids |= {f"{where}{a.report}:{a.id}@{a.at}" for a in state.pending if a.marked}
        ids |= {f"{where}{b.name}/{item}" for b in state.batches for item in b.answered}
    return ids


def _returned(root, now):
    import _passkey
    import returned_check
    project = _passkey.project_of(root)
    folder = _passkey.approvals_dir() / "returned"
    if not folder.is_dir():
        return set()
    orphan = None
    if project == _passkey.HARNESS_PROJECT:
        projects = _passkey.projects_dir()
        orphan = lambda name: not returned_check.has_orchestrator(name, projects)  # noqa: E731
    mine = returned_check.late_messages(returned_check.open_messages(folder, now), project, 0, now, orphan)
    return {str(body.get("id")) for body, _other in mine}


def _priority(root):
    import priority_next
    out = {}
    for folder in priority_next.projects(root):
        try:
            text = priority_next.priority_text(folder)
        except priority_next.NotEvaluable:
            continue
        out[str(Path(folder).resolve().relative_to(Path(root).resolve()) or ".")] = hashlib.sha1((text or "").encode("utf-8")).hexdigest()
    return out


def _signed(root, now):
    """The distance approvals of this project signed and not yet expired. The folders are remote_approval.py's (`pending/`, `signed/`); this file
    reads them through `_passkey` because a child does not carry remote_approval.py (the harness's command asks for the request)."""
    import _passkey
    project = _passkey.project_of(root)
    pending, signed = _passkey.approvals_dir() / "pending", _passkey.approvals_dir() / "signed"
    found = set()
    for path in sorted(pending.glob("*.json")):
        data = _read_json(path)
        if not data or data.get("project") != project or int(data.get("expires_at", 0) or 0) <= now:
            continue
        if data.get("kind") == "push":      # the service sends it: `_pushed` wakes with the SHA, and «refaça o merge» would be wrong (CC-ADR-0045 § 7)
            continue
        if (signed / f"{data.get('id')}.json").exists():
            found.add(f"{data.get('id')} {data.get('kind', '')} {data.get('scope', '')}".strip())
    return found


def _pushed(root):
    """The pushes of this project the service sent (`result: ok`): {"<id> <sha>"}. The project is compared exactly, as `_signed` does."""
    import _passkey
    project = _passkey.project_of(root)
    found = set()
    for path in sorted((_passkey.approvals_dir() / "pushed").glob("*.json")):
        data = _read_json(path)
        if data and data.get("project") == project and data.get("result") == "ok" and data.get("tip"):
            found.add(f"{path.stem} {data.get('tip')}")
    return found


def _supervisor(root, now):
    """The alerts the supervisor outside the agent has open for this project (F294, S-245, rule 46), and its own «não avaliável» when it
    stopped beating. Not installed is no news (nothing to wake for); the session-start line says it."""
    import supervisor_state
    verdict, why, alerts = supervisor_state.open_alerts(root, now)
    found = {f"{a.get('text')} [{a.get('id')}]" for a in alerts}
    if verdict != "ok" and supervisor_state.state_path().exists():
        found.add(f"supervisor: não avaliável — {why}")
    return found


def snapshot(root, now=None):
    """What depends on the MJRP in this project right now: {answers, returned, signed, pushed: sorted lists, priority: {folder: hash}}.
    A reader that is not there (an older kernel) or does not answer contributes nothing, and says so under `unread`."""
    now = int(time.time() if now is None else now)
    out, unread = {"answers": [], "returned": [], "signed": [], "pushed": [], "priority": {}, "supervisor": []}, []
    for key, reader in (("answers", lambda: _answers(root)), ("returned", lambda: _returned(root, now)),
                        ("signed", lambda: _signed(root, now)), ("pushed", lambda: _pushed(root)),
                        ("priority", lambda: _priority(root)), ("supervisor", lambda: _supervisor(root, now))):
        try:
            value = reader()
        except Exception:  # noqa: BLE001 - a reader that cannot answer leaves its part out; the others still wake the session
            unread.append(key)
            continue
        out[key] = sorted(value) if isinstance(value, set) else value
    out["unread"] = unread
    return out


def carry(before, after):
    """`after` with, for each reader that did not answer, the value of `before`: a reader that fails and comes back is not news."""
    out = dict(after)
    for key in after.get("unread", []):
        if key in before:
            out[key] = before[key]
    return out


def news(before, after):
    """[(kind, text)] of what is new in `after` against `before`. A thing that only went away (applied, acked) is not news."""
    out = []
    for item in sorted(set(after.get("answers", [])) - set(before.get("answers", []))):
        out.append(("answers", f"resposta nova da tela, sem aplicar: {item}  -> python3 mjrp-scripts/screen_answers.py"))
    for item in sorted(set(after.get("returned", [])) - set(before.get("returned", []))):
        out.append(("returned", f"item devolvido pelo iPhone [{item}]  -> python3 mjrp-scripts/remote_approval.py returned"))
    for item in sorted(set(after.get("signed", [])) - set(before.get("signed", []))):
        out.append(("signed", f"aprovação de longe assinada: {item}  -> refaça o merge (remote_approval.py status)"))
    if "pushed" in before:                       # a record from before this reader existed has no baseline: old pushes are not news
        for item in sorted(set(after.get("pushed", [])) - set(before["pushed"])):
            out.append(("pushed", f"push enviado pelo iPhone: {item.split()[-1][:7]} na main  -> confira a produção"))
    if "supervisor" in before:                   # same as `pushed`: a record from before this reader has no baseline
        for item in sorted(set(after.get("supervisor", [])) - set(before["supervisor"])):
            out.append(("supervisor", f"o supervisor avisa: {item}  -> python3 mjrp-scripts/supervisor.py status"))
    was = before.get("priority", {})
    for where, digest in sorted(after.get("priority", {}).items()):
        if where in was and was[where] != digest:
            out.append(("priority", f"a «Priorizada» mudou ({where}/docs/specs/priority.md)  -> python3 mjrp-scripts/priority_next.py"))
    return out


# ---- the roles -----------------------------------------------------------------------------------------------------------------------

def is_orchestrator(root):
    import returned_check
    return returned_check.is_orchestrator(root)


def session_start_line(root, now=None):
    """The reminder at the start of a session, for the orchestrator only: no wait up, and what the supervisor outside the agent has open or
    that it is not evaluable (F294). Empty for a page session (a linked worktree), or with the wait up and nothing from the supervisor."""
    try:
        if not is_orchestrator(root):
            return ""
        up = wait_up(Path(root) / ".mjrp", now)
    except Exception:  # noqa: BLE001 - a reminder that cannot decide stays silent
        return ""
    lines = [] if up else ["Orquestrador: deixe a espera de pé, em background, para acordar quando o MJRP aprovar, responder, devolver "
                           "ou priorizar: " + command()]
    try:
        import supervisor_state
        verdict, why, alerts = supervisor_state.open_alerts(root, now)
        if verdict != "ok":
            lines.append(f"Supervisor: não avaliável — {why}")
        lines += [f"Supervisor avisa: {a.get('text')}" for a in alerts]
    except Exception:  # noqa: BLE001 - the supervisor's reader missing (an older kernel) leaves only the wait line
        pass
    return "\n".join(lines)


def gate_block(root, state_dir, sid="", stop_hook_active=False, now=None):
    """The Stop gate's part (stop_gate.py): (2, text) ONCE per session when the orchestrator ends a turn with no wait up; else (0, '')."""
    now = time.time() if now is None else now
    try:
        if not is_orchestrator(root):
            return 0, ""
    except Exception:  # noqa: BLE001
        return 0, ""
    if wait_up(state_dir, now):
        return 0, ""
    warned = Path(state_dir) / WARNED.format(sid=sid or "nosid")
    if warned.exists():
        return 0, ""
    _write_json(warned, {"at": int(now)})
    text = ("  [stop_gate] AVISO (uma vez nesta sessão) — o orquestrador está sem a espera de pé (F240, S-237): o que o MJRP aprova, responde,\n"
            "  devolve ou prioriza não te acorda. Lance em background (run_in_background) e então encerre o turno:\n"
            f"  {command()}")
    return 2, text


# ---- the command ---------------------------------------------------------------------------------------------------------------------

def unread_note(snap):
    return [f"AVISO: não consegui ler {', '.join(snap['unread'])}; o que depende disso não foi conferido."] if snap.get("unread") else []


def describe(events):
    lines = [f"orchestrator_wait: o MJRP agiu — {len(events)} novidade(s):"]
    lines += [f"  - {text}" for _kind, text in events]
    lines.append("Aplique, marque o que aplicou e relance a espera em background: " + command())
    return lines


def run(root, seconds, interval=INTERVAL, out=print):
    """Waits up to `seconds`. Returns the exit code; prints what happened."""
    root = Path(root).resolve()
    if not is_orchestrator(root):
        out("orchestrator_wait: esta pasta não é o checkout principal do projeto (uma sessão de página em worktree não espera): "
            "só o orquestrador deixa a espera de pé")
        return EXIT_NOT_ORCHESTRATOR
    state_dir = root / ".mjrp"
    other = wait_up(state_dir)
    if other and int(other.get("pid", 0)) != os.getpid():
        out(f"orchestrator_wait: já há uma espera de pé (pid {other.get('pid')}) para esta pasta; não lance outra")
        return EXIT_ALREADY_UP
    started = time.time()
    _write_json(state_dir / MARKER, {"pid": os.getpid(), "started": int(started), "until": int(started + seconds), "root": str(root)})
    try:
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(EXIT_NOTHING))   # the finally below removes the marker
    except ValueError:                                                      # not the main thread (the selftest)
        pass
    try:
        current = snapshot(root)
        before = _read_json(state_dir / SEEN)
        if before is None:                          # the first wait of this folder: what is there now is the baseline, not news
            before = current
        while True:
            current = carry(before, current)
            events = news(before, current)
            if events:
                _write_json(state_dir / SEEN, current)
                for line in describe(events) + unread_note(current):
                    out(line)
                return EXIT_HAPPENED
            if time.time() - started >= seconds:
                _write_json(state_dir / SEEN, current)
                for line in unread_note(current):
                    out(line)
                out(f"orchestrator_wait: nada do MJRP em {seconds // 60} min; rode de novo, em background: {command(seconds)}")
                return EXIT_NOTHING
            time.sleep(max(0.05, min(interval, started + seconds - time.time())))
            current = snapshot(root)
    finally:
        mark = _read_json(state_dir / MARKER)
        if mark and int(mark.get("pid", 0)) == os.getpid():
            try:
                (state_dir / MARKER).unlink()
            except OSError:
                pass


def main(argv=None):
    parser = argparse.ArgumentParser(description="a espera única do orquestrador: termina quando o MJRP age")
    parser.add_argument("--seconds", type=int, default=DEFAULT_SECONDS)
    parser.add_argument("--root", default=".")
    parser.add_argument("--interval", type=float, default=INTERVAL)
    parser.add_argument("--session-start", action="store_true")
    args = parser.parse_args(argv)
    if args.session_start:
        line = session_start_line(Path(args.root).resolve())
        if line:
            print(line)
        return 0
    if args.seconds <= 0 or args.interval <= 0:
        print("orchestrator_wait: --seconds e --interval pedem um número positivo", file=sys.stderr)
        return 2
    return run(args.root, args.seconds, args.interval)


if __name__ == "__main__":
    sys.exit(main())
