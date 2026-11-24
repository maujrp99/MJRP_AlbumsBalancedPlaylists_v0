#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
session_lease.py - one lease per agent session working on this repo, so a second session knows the
first one is there before it writes (feedback from fin-control, 2026-09-27: two sessions on the same
repo swept each other's index and both rewrote the ## Now).

A lease only WARNS - it never blocks (decision of the owner, 2026-09-28). The human decides.

    python3 mjrp-scripts/session_lease.py acquire --session ID --scope "what this session will do"
    python3 mjrp-scripts/session_lease.py release --session ID
    python3 mjrp-scripts/session_lease.py status [--json]
    python3 mjrp-scripts/session_lease.py claim --feature F265 [--session ID]
    python3 mjrp-scripts/session_lease.py claims [--json]
    python3 mjrp-scripts/session_lease.py hook            (SessionStart and Stop: the hook's JSON on stdin)

F265 (UAT-582, CC-ADR-0055): the lease is also the RESERVATION of a feature, and the board reads it: a prioritized feature whose session
holds an active lease is «Em andamento» from the session's start, not from its first commit (the MJRP, 2026-11-16: «em andamento nao
pode depender de um commit, pq vc nao começa comitando»). The feature of a lease is its `feature` field (`claim`) or, with none, the
features the branch of its worktree names by `branch-convention@2` (`claude/f265-<slug>`): renaming the worktree's branch to the
convention IS the claim. The `hook` command keeps the lease without anyone remembering: SessionStart acquires it with the platform's
session id, each Stop renews the heartbeat (never reviving a released lease). `claims` reads the leases of EVERY worktree of the
repository (`git worktree list`), where the Control Center and `priority_next.py` read them.

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
GIT_TIMEOUT = 5
# `branch-convention@2` (rules/delivery.py `BRANCH`, `AGENT_BRANCH`): the features a branch name carries
_BRANCH = re.compile(r"^(?:feat|fix)/f(?P<n>\d{2,})(?:-r\d+)?-")
_AGENT_BRANCH = re.compile(r"^claude/(?P<fs>f\d{2,}(?:-f\d{2,})*)-")
_FEATURE = re.compile(r"^[Ff]?(?P<n>\d{2,})$")


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


def acquire(root, session, scope, now=None, feature=None):
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
        if feature:
            data["feature"] = feature
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


def heartbeat(root, session, now=None):
    """Each Stop of the session renews its lease: only a lease that exists and is not released (a released lease is a closed session; the
    Stop that follows the closing must not reopen it). True when renewed."""
    path = Path(root) / DIR / f"{_slug(session)}.json"
    if not path.exists():
        return False
    with _locked(root):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except ValueError:
            return False
        if data.get("released"):
            return False
        data["heartbeat"] = _iso(now or _now())
        _atomic_write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return True


def feature_id(text):
    """`F265`, `f265` or `265` -> `F265`; None when it is not a feature id."""
    m = _FEATURE.match((text or "").strip())
    return f"F{int(m['n']):02d}" if m else None


def branch_features(name):
    """The feature numbers a branch name carries by `branch-convention@2` (rules/delivery.py `features_of`)."""
    if m := _BRANCH.match(name or ""):
        return {int(m["n"])}
    if m := _AGENT_BRANCH.match(name or ""):
        return {int(f[1:]) for f in m["fs"].split("-")}
    return set()


def _git(root, *args):
    import subprocess
    try:
        r = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True, timeout=GIT_TIMEOUT)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return r.stdout if r.returncode == 0 else None


def worktrees(root):
    """[(path, branch or None)] of every worktree of the repository of `root`, the main checkout first; None when git did not answer
    (the caller says «not evaluable», never «no session»). Outside a repository: the folder itself, with no branch."""
    out = _git(root, "worktree", "list", "--porcelain")
    if out is None:
        return None if _git(root, "rev-parse", "--git-dir") is not None else [(Path(root), None)]
    found, path, branch = [], None, None
    for line in out.splitlines() + [""]:
        if line.startswith("worktree "):
            path, branch = Path(line[len("worktree "):]), None
        elif line.startswith("branch "):
            branch = line[len("branch "):].removeprefix("refs/heads/")
        elif not line and path is not None:
            found.append((path, branch))
            path = None
    return found


def claims(root, now=None):
    """[dict(feature, state, session, branch, worktree, heartbeat)] - one per (lease, feature) of every worktree of the repository: the
    feature is the lease's `feature` or, without one, each feature the worktree's branch names. A lease that names no feature (the
    orchestrator's on `main`) claims none. None when git did not list the worktrees."""
    trees = worktrees(root)
    if trees is None:
        return None
    out = []
    for path, branch in trees:
        for lease, state in leases(path, now):
            named = feature_id(lease.get("feature"))
            numbers = {int(named[1:])} if named else branch_features(branch)
            for n in sorted(numbers):
                out.append({"feature": f"F{n:02d}", "state": state, "session": lease.get("session", "?"), "branch": branch,
                            "worktree": str(path), "heartbeat": lease.get("heartbeat") or lease.get("started")})
    return out


def claimed(root, now=None):
    """{Fxx: "working" | "stopped"} - a feature with an active lease is worked on; one whose leases are all stale or released stopped
    (rules/delivery.py `claim_of`). None when git did not list the worktrees."""
    found = claims(root, now)
    if found is None:
        return None
    out = {}
    for c in found:
        if c["state"] == "active":
            out[c["feature"]] = "working"
        else:
            out.setdefault(c["feature"], "stopped")
    return out


def claim(root, feature, session=None, now=None):
    """Names the feature this session works on. With `session`, that lease; without it, the one lease not released in this folder
    (a worktree has its session's, the hook's), or a new lease named after the folder when there is none. Returns the session id."""
    now = now or _now()
    if not session:
        live = [l for l, s in leases(root, now) if s != "released"]
        session = live[0].get("session") if len(live) == 1 else f"claim-{Path(root).resolve().name}"
    acquire(root, session, "", now, feature=feature)
    return session


def _session_folder(root, cwd):
    """F277 (UAT-593): the hook runs in the main checkout (`cd $CLAUDE_PROJECT_DIR`), but the session lives in the worktree the platform
    reports as `cwd`. The lease belongs in that worktree (`claims` reads each worktree's own), so: the toplevel of `cwd` when it is a
    folder of the same repository as `root`, else `root`."""
    if not isinstance(cwd, str) or not cwd or not Path(cwd).is_dir():
        return root
    top = _git(cwd, "rev-parse", "--show-toplevel")
    common = _git(cwd, "rev-parse", "--git-common-dir")
    mine = _git(root, "rev-parse", "--git-common-dir")
    if not top or not common or not mine:
        return root
    same = (Path(cwd) / common.strip()).resolve() == (Path(root) / mine.strip()).resolve()
    return Path(top.strip()) if same else root


def _branch_feature(folder):
    """The one feature the branch of `folder` names by the convention; None when none or several (several are read from the branch)."""
    name = (_git(folder, "branch", "--show-current") or "").strip()
    found = sorted(branch_features(name))
    return f"F{found[0]:02d}" if len(found) == 1 else None


def _hook(root, raw, now=None):
    """SessionStart acquires the lease of the platform's session; Stop renews it. Silent, always 0: a lease informs, it never gates."""
    try:
        data = json.loads(raw or "{}")
    except ValueError:
        return 0
    session = str(data.get("session_id") or "").strip()
    if not session:
        return 0
    event = data.get("hook_event_name") or ""
    root = _session_folder(root, data.get("cwd"))
    try:
        if event == "SessionStart" and data.get("source") != "compact":
            other = live_other(root, session, now)
            if other:   # F293 (regra 45): one live session per worktree - the second is refused and takes no lease
                msg = refusal_text(root, other)
                print(json.dumps({"continue": False, "stopReason": msg}, ensure_ascii=False))
                print(msg)
                return 0
            feature = _branch_feature(root)
            acquire(root, session, "", now, feature=feature)   # startup, resume, clear: the session works (again)
            _record_start(root, feature, session)
            _sweep_stopped(root, now)
        elif event == "SessionEnd":
            release(root, session, now)   # the session is over (also on /clear): its lease must not refuse the next one in this worktree
        elif event in ("SessionStart", "Stop"):
            # a compaction or the end of a turn renews and never reopens: the closing released the lease. A `claim` made with no
            # lease of the hook in the folder (`claim-<folder>`) is this folder's session's too, and is renewed with it.
            heartbeat(root, session, now)
            _adopt_branch_feature(root, session, now)
            _sweep_stopped(root, now)
            for lease, state in leases(root, now):
                if state != "released" and str(lease.get("session", "")).startswith("claim-"):
                    heartbeat(root, lease["session"], now)
    except OSError:
        pass
    return 0


def live_other(root, session, now=None):
    """F293 (orchestrator rule 45): the lease of ANOTHER live session in this linked worktree, or None. Live is `active` (a released lease is a
    closed session; a stale one fell with no closing, and does not count). A `claim-` lease is the same session's reservation, not another
    session; the main checkout is not a worktree of a feature (the orchestrator and the Designer share it) and is never refused."""
    if not _is_linked_worktree(root):
        return None
    for lease, state in leases(root, now):
        name = str(lease.get("session", ""))
        if state == "active" and name != session and not name.startswith("claim-"):
            return lease
    return None


def refusal_text(root, other):
    return (f"[session_lease] RECUSADA — o worktree {Path(root).name} já tem a sessão viva {other.get('session', '?')} "
            f"(desde {other.get('started', '?')}, último sinal {other.get('heartbeat', '?')}"
            + (f", feature {other['feature']}" if other.get("feature") else "")
            + "). Uma sessão viva por worktree: feche aquela primeiro, ou abra esta em outro worktree. Se aquela já acabou, libere-a: python3 mjrp-scripts/session_lease.py release --root . (neste worktree).")


def _adopt_branch_feature(root, session, now=None):
    """The branch renamed into the convention in mid-session (`git branch -m claude/fNN-…`): the next Stop sees a feature the live lease
    does not name yet, writes it into the lease and records the start. A lease that already names it is left alone, so the Stop of a
    card that waits for the MJRP never drags it back to «Em andamento»."""
    path = Path(root) / DIR / f"{_slug(session)}.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return
    feature = _branch_feature(root) or feature_id(data.get("feature"))   # a `claim` on a branch outside the convention names it in the lease
    if not feature:
        return
    if data.get("released"):
        return
    if feature_id(data.get("feature")) == feature:
        # the lease is alive again after the sweep sent the card back (a long turn, a session that came back): the card follows it
        try:
            import board_move
            if board_move.Board(root, item=feature).state(feature) == "queued":
                _record_start(root, feature, session)
        except Exception:  # noqa: BLE001
            pass
        return
    acquire(root, session, data.get("scope", ""), now, feature=feature)
    _record_start(root, feature, session)


def _record_start(root, feature, session):
    """F298 (UAT-605): every way a session starts a feature (the hook with the branch in the convention, a resume, a branch renamed in
    mid-session, the `claim`) records the passage to «Em andamento» through the same `board_move.on_claim`. The lease never fails
    because of the board: the lines it would say are returned, the error is swallowed."""
    if not feature:
        return []
    try:
        import board_move
        return board_move.on_claim(root, feature, session)
    except Exception as exc:  # noqa: BLE001
        return [f"[session_lease] o board não registrou a passagem ({type(exc).__name__}: {exc})"]


UNKNOWN = object()  # git did not answer: delivered or not is not known, and the card stays where it is


def _delivered_branch(root, claims_of_feature):
    """F303: the branch one of a feature's leases was released on with commits ahead of the main line: that session closed and delivered
    (a stale lease of another session beside it changes nothing). None when no released lease has such a branch; UNKNOWN when git did
    not answer, so «not evaluated» is never read as «not delivered» (the F182 rule)."""
    unknown = False
    # the main line is the first of `main`, `master` that exists as a branch; if it exists and git cannot count against it, that is unknown
    # (never a fall-through to the other name, which could answer «0 ahead» about something else)
    base = next((b for b in ("main", "master") if _git(root, "rev-parse", "--verify", "-q", f"refs/heads/{b}") is not None), None)
    for c in claims_of_feature:
        branch = c.get("branch")
        if c["state"] != "released" or not branch:
            continue
        ahead = _git(root, "rev-list", "--count", f"{base}..{branch}") if base else None
        if ahead is None or not ahead.strip().isdigit():
            unknown = True
        elif int(ahead) > 0:
            return branch
    return UNKNOWN if unknown else None


def _sweep_stopped(root, now=None):
    """F298, F303: a feature the board has «Em andamento» whose every lease went stale or was released stopped: a lease released with the
    branch delivered is «Esperando o merge» (`board_move.on_stopped` → `on_delivered`); one that expired without delivering sends the
    card back to where it came from."""
    try:
        import board_move
        found = claims(root, now) or []
        for feature, state in (claimed(root, now) or {}).items():
            if state == "stopped":
                delivered = _delivered_branch(root, [c for c in found if c["feature"] == feature])
                if delivered is not UNKNOWN:
                    board_move.on_stopped(root, feature, delivered_branch=delivered)
    except Exception:  # noqa: BLE001
        pass


def _is_linked_worktree(root):
    """A linked worktree has a `.git` FILE (the main checkout a folder): there, a release with no `--session` releases every lease of
    the folder (they are this session's: the hook's and the claim's)."""
    return (Path(root) / ".git").is_file()


def _line(lease, state):
    return (f"{lease.get('session', '?')} · desde {lease.get('started', '?')} · último sinal "
            f"{lease.get('heartbeat', '?')} · escopo: {lease.get('scope') or '(não declarado)'}"
            + (f" · feature: {lease['feature']}" if lease.get("feature") else "")
            + ("" if state == "active" else f" · {state}"))


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["acquire", "release", "status", "claim", "claims", "hook"])
    ap.add_argument("--session", default="")
    ap.add_argument("--scope", default="")
    ap.add_argument("--feature", default="")
    ap.add_argument("--root", default=".")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    root = Path(a.root).resolve()
    if a.cmd == "hook":
        return _hook(root, sys.stdin.read() if not sys.stdin.isatty() else "")
    if a.cmd == "release" and not a.session and _is_linked_worktree(root):
        done = [release(root, l.get("session", "")) for l, s in leases(root) if s != "released" and l.get("session")]
        print(f"[session_lease] {sum(done)} lease(s) liberado(s) neste worktree" if done else "[session_lease] nada a liberar neste worktree")
        return 0
    if a.cmd in ("acquire", "release") and not a.session:
        print("session_lease: --session é obrigatório (o id ou a URL da sessão da AI Platform)")
        return 0
    feature = feature_id(a.feature) if a.feature else None
    if a.feature and not feature:
        print(f"session_lease: --feature {a.feature!r} não é um id de feature (F265)")
        return 0
    if a.cmd == "claim":
        if not feature:
            print("session_lease: claim pede --feature (o id da feature que esta sessão pega, F265)")
            return 0
        sid = claim(root, feature, a.session or None)
        print(f"[session_lease] {sid} reserva a {feature}: o board a mostra «Em andamento» enquanto a sessão estiver ativa, "
              "se ela estiver na «Priorizada»")
        try:  # F275: the reservation is the passage to «Em andamento», recorded with no commit; the lease never fails because of it
            import board_move
            for line in board_move.on_claim(root, feature, sid):
                print(line)
        except Exception as exc:  # noqa: BLE001
            print(f"[session_lease] o board não registrou a passagem ({type(exc).__name__}: {exc})")
        return 0
    if a.cmd == "claims":
        found = claims(root)
        if found is None:
            print("[session_lease] reservas não avaliáveis: git não listou os worktrees")
            return 0
        if a.json:
            print(json.dumps(found, ensure_ascii=False, indent=2))
        elif not found:
            print("[session_lease] nenhuma feature reservada")
        else:
            for c in found:
                print(f"  - {c['feature']} · {c['state']} · {c['session']} · {c['branch'] or '(sem branch)'} · último sinal {c['heartbeat']}")
        return 0
    if a.cmd == "acquire":
        others = acquire(root, a.session, a.scope, feature=feature)
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
