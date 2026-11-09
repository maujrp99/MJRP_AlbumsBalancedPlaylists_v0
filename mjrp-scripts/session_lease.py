#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
session_lease.py - one lease per agent session working on this repo, so a second session knows the
first one is there before it writes (feedback from fin-control, 2026-09-27: two sessions on the same
repo swept each other's index and both rewrote the ## Now).

A lease only WARNS - it never blocks (decision of the owner, 2026-09-28). The human decides.

    python3 mjrp-scripts/session_lease.py acquire --session ID --scope "what this session will do"
    python3 mjrp-scripts/session_lease.py release --session ID
    python3 mjrp-scripts/session_lease.py status [--json]

Leases live in .mjrp/sessions/<id>.json (the folder ignores itself for git). Release marks the lease
instead of deleting it: a delete through the AI Platform's file bridge may be refused, a write never
is. A lease not released whose heartbeat is older than LEASE_HOURS is stale: that session ended
without the closing handoff - the doctor (W10) reports it.

Exit code: always 0 (it informs; it does not gate).
"""
import argparse
import contextlib
import fcntl
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

LEASE_HOURS = 12
DIR = Path(".mjrp") / "sessions"


def _now():
    return datetime.now(timezone.utc)


def _iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse(s):
    try:
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def _slug(session):
    tail = session.rstrip("/").split("/")[-1]          # a session URL becomes its last segment
    return re.sub(r"[^A-Za-z0-9_.-]", "-", tail)[:80] or "session"


def _atomic_write(path, text):
    """tmp + os.replace (R23, F72): a reader sees the old lease or the new one, never half of it. (Inlined in each script that
    needs it: a shared module would have to be added to the files `new_project.py` vendors into every project.)"""
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


@contextlib.contextmanager
def _locked(root):
    """One writer at a time over the leases of a repo: acquire and release read, change and rewrite a lease."""
    with open(_dir(root) / ".lock", "w") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        yield


def _dir(root):
    d = Path(root) / DIR
    d.mkdir(parents=True, exist_ok=True)
    gi = d / ".gitignore"
    if not gi.exists():
        gi.write_text("*\n", encoding="utf-8")
    return d


def leases(root, now=None):
    """[(lease dict, state)] with state in active | stale | released."""
    now = now or _now()
    d = Path(root) / DIR
    out = []
    if not d.is_dir():
        return out
    for f in sorted(d.glob("*.json")):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            # R23: an unreadable lease is a session we cannot read, not a session that is not there. Hiding it made
            # "nenhuma outra sessão ativa" lie; it counts as present, and as active until its file is older than the lease.
            try:
                age = now - datetime.fromtimestamp(f.stat().st_mtime, timezone.utc)
            except OSError:
                continue
            out.append(({"session": f.stem, "scope": "(lease ilegível)"}, "active" if age <= timedelta(hours=LEASE_HOURS) else "stale"))
            continue
        if data.get("released"):
            state = "released"
        else:
            hb = _parse(data.get("heartbeat")) or _parse(data.get("started"))
            state = "active" if hb and now - hb <= timedelta(hours=LEASE_HOURS) else "stale"
        out.append((data, state))
    return out


def acquire(root, session, scope, now=None):
    now = now or _now()
    d = _dir(root)
    path = d / f"{_slug(session)}.json"
    with _locked(root):
        data = {}
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except ValueError:
                data = {}
        others = [(l, s) for l, s in leases(root, now) if l.get("session") != session and s != "released"]
        data.update({"session": session, "scope": scope or data.get("scope", ""), "heartbeat": _iso(now)})
        data.setdefault("started", _iso(now))
        data.pop("released", None)
        _atomic_write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return others


def release(root, session, now=None):
    path = Path(root) / DIR / f"{_slug(session)}.json"
    if not path.exists():
        return False
    with _locked(root):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except ValueError:
            data = {"session": session}                       # a damaged lease is still released, not left to crash the closing
        data["released"] = _iso(now or _now())
        _atomic_write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return True


def _line(lease, state):
    return (f"{lease.get('session', '?')} · desde {lease.get('started', '?')} · último sinal "
            f"{lease.get('heartbeat', '?')} · escopo: {lease.get('scope') or '(não declarado)'}"
            + ("" if state == "active" else f" · {state}"))


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["acquire", "release", "status"])
    ap.add_argument("--session", default="")
    ap.add_argument("--scope", default="")
    ap.add_argument("--root", default=".")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    root = Path(a.root).resolve()
    if a.cmd in ("acquire", "release") and not a.session:
        print("session_lease: --session é obrigatório (o id ou a URL da sessão da AI Platform)")
        return 0
    if a.cmd == "acquire":
        others = acquire(root, a.session, a.scope)
        active = [(l, s) for l, s in others if s == "active"]
        stale = [(l, s) for l, s in others if s == "stale"]
        if active:
            print(f"[session_lease] AVISO — {len(active)} outra(s) sessão(ões) ativa(s) neste repo:")
            for l, s in active:
                print("  - " + _line(l, s))
            print("  Mostre isto ao humano antes de escrever. Commit só por pathspec (os arquivos desta sessão).")
        if stale:
            print(f"[session_lease] {len(stale)} sessão(ões) anterior(es) sem fechamento (sem handoff):")
            for l, s in stale:
                print("  - " + _line(l, s))
        if not active and not stale:
            print("[session_lease] nenhuma outra sessão ativa neste repo")
    elif a.cmd == "release":
        ok = release(root, a.session)
        print("[session_lease] liberada" if ok else "[session_lease] nada a liberar (sessão sem lease)")
    else:
        ls = [(l, s) for l, s in leases(root) if s != "released"]
        if a.json:
            print(json.dumps([dict(l, state=s) for l, s in ls], ensure_ascii=False, indent=2))
        elif not ls:
            print("[session_lease] nenhuma sessão ativa")
        else:
            for l, s in ls:
                print("  - " + _line(l, s))
    return 0


if __name__ == "__main__":
    sys.exit(main())
