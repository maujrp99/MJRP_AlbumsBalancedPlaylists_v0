#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
session_close.py - the close of a page session, in the harness and in every child (F206, S-218).

A page session works in a linked worktree and declares it is done with its closing log entry (`Session:` naming the branch, written by
`mjrp-saving-context`). From there the machine decides, never the agent:

  stop-hook          the `Stop` hook of every session. In a linked worktree whose session declared it is done (the closing entry not older
                     than the last commit of work): the close check red -> the turn is held once with the list of what is missing; green ->
                     the stamped copies of the worktree's `_backups/` move to the main checkout, the mark «ready to archive» is written in
                     the main checkout's `.mjrp/to-archive/`, and the turn is held once with the order to archive the session itself (the app
                     removes the worktree with it). Once per commit. Anywhere else, or with no closing entry, it says nothing.
  session-start      the `SessionStart` hook. In the main checkout only: the marks whose worktree is still there are listed (the session
                     did not archive itself), the others removed; then the merged, clean worktrees are torn down (`clean-worktrees --apply`).
  check WORKTREE     the close check (F101): exit 0 may archive, 1 not yet (each item said), 2 not evaluable. `merge_train.py session-check`
                     is the same function.
  clean-worktrees [--apply]  the linked worktrees whose branch is merged into main and that are clean (class 3, ADR-0023) and, with
                     `--apply`, each one torn down through `_safe.discard`; the others stay, with the reason (F120, F123, F207).
  pending            the marks of sessions that did not archive themselves.

Nothing is deleted outside `_safe`. Comments and docstrings are English; what the human reads is Portuguese.
"""
import argparse
import json
import os
import re
import sys
import tempfile
import time
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402  (the scripts folder on sys.path, F73 R17)
import _git  # noqa: E402

MARKS = Path(".mjrp") / "to-archive"      # in the MAIN checkout: rotating, owned by this script (structure_rules.json)
REDS = Path(".mjrp") / "close-red"        # the same, for a close the hook held red: not a mark to archive, the memory of the hold


# --------------------------------------------------------------------------------------------- the close check (F101)

CLOSE_STAMP = re.compile(r"^## \[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\] ", re.M)
CLOSE_ONLY = re.compile(r"(^|/)(docs/log\.md|MEMORY\.md)$")   # what the save context writes after the work: it never counts as work


def _entry_names(body, token, field=None):
    """Does the entry's body name `token` whole (`claude/f19-x` is not named by `claude/f19-x-2`, nor `f19` by `f196`; a full stop
    after it ends a sentence, not the name)? With `field`, only as that field's value (`Branch: <branch>`, in backticks or not): a
    branch quoted in the prose of another session's entry is not its close."""
    lead = rf"{re.escape(field)}:[ \t]*`?" if field else r"(?<![\w/.-])"
    return re.search(rf"{lead}{re.escape(token)}(?![\w/-]|\.[\w/-])", body) is not None


def _closing_entries(wt, branch=None, session=None):
    """[(stamp, project-relative log, project folder)] of the log entries that carry `Session:` and name the worktree's branch (or the
    session id, when given), in the worktree's project logs (the root's and each apps/<app>/'s). F198 (UAT-516): the app's id
    (`local_<id>`) is not known to the session, so the entry is matched by what it writes, the branch of its header (`Branch: <branch>`);
    with neither a branch nor an id there is nothing that tells this session's entry from the others the branch brought from main."""
    out = []
    for log in [Path(wt) / "docs" / "log.md"] + sorted(Path(wt).glob("apps/*/docs/log.md")):
        try:
            text = log.read_text(encoding="utf-8")
        except OSError:
            continue
        heads = list(CLOSE_STAMP.finditer(text))
        for i, m in enumerate(heads):
            body = text[m.start():heads[i + 1].start() if i + 1 < len(heads) else len(text)]
            if "Session:" in body and ((branch and _entry_names(body, branch, "Branch")) or (session and _entry_names(body, session))):
                out.append((m.group(1), log.relative_to(wt).as_posix(), log.parent.parent))
    return out


def _last_work_commit(wt):
    """(time in Brasília 'YYYY-MM-DD HH:MM', short sha) of the newest commit of HEAD's history that touches more than logs and MEMORY.md."""
    r = _git.run(wt, "log", "-200", "--format=@%h %cd", "--date=format-local:%Y-%m-%d %H:%M", "--name-only", "HEAD",
                 env={"TZ": "America/Sao_Paulo"})
    if r.code != 0:
        return None
    sha = when = None
    for line in r.out.splitlines():
        if line.startswith("@"):
            sha, when = line[1:].split(" ", 1)
        elif line.strip() and sha and not CLOSE_ONLY.search(line.strip()):
            return when, sha
    return None


BRANCH_FEATURE = re.compile(r"(?:claude|feat|fix)/f(\d+)-")
TASK_OPEN = re.compile(r"^- \[ \] (TASK-\S+)(.*)$", re.M)


def open_tasks(wt, branch):
    """F184 (UAT-494): the tasks still open in the `tasks.md` of the feature the branch is named after (`claude/f75-x` -> F75), as
    [(path relative to the worktree, task id)]. A task that declares `waiting::` is waiting on purpose and is not counted. The board
    reads «ready for acceptance» from the tasks closed AND the branch merged, so a branch delivered with the marks undone shows as
    «0 / 6» (the F75 of 2026-11-04). Empty when the branch is not named after a feature or the feature has no `tasks.md`."""
    m = BRANCH_FEATURE.match(branch or "")
    if m is None:
        return []
    roots = [wt / "docs/specs/features", *sorted((wt / "apps").glob("*/docs/specs/features"))]
    found = []
    for root in roots:
        for tasks in root.glob(f"F{m.group(1)}-*/tasks.md"):
            text = tasks.read_text(encoding="utf-8", errors="replace")
            found += [(str(tasks.relative_to(wt)), t.group(1)) for t in TASK_OPEN.finditer(text) if "waiting::" not in t.group(2)]
    return found


def session_check(wt, session=None, base="main"):
    """F101 (S-186, REQ-03): may the integrator archive this page session? Five things, each said when it fails:
    the worktree clean; the branch in main or delivered; the closing entry (`Session:`, naming the branch - F198) in the owner project's log, not older than the
    last commit of work; the lease released; the app's `## Now` not behind its log. Returns (lines, code): 0 archive, 1 not yet, 2 not
    evaluable. The MJRP (2026-10-27 09:52): a page session is archived only after the retroactive step AND the save context."""
    import session_lease
    from _now_shape import now_behind_log, now_section
    wt = Path(wt).resolve()
    if not (wt / ".git").exists():
        return [f"{wt}: não é um worktree git - não avaliável"], 2
    lines, bad = [], 0

    def item(ok, text):
        nonlocal bad
        bad += 0 if ok else 1
        lines.append(("  ✓ " if ok else "  ✗ ") + text)

    st = _git.run(wt, "status", "--porcelain")
    if st.code != 0:
        return [f"git status no worktree saiu {st.code} - não avaliável"], 2
    dirty = [x for x in st.out.splitlines() if x.strip()]
    item(not dirty, "worktree limpo" if not dirty else
         f"worktree com {len(dirty)} caminho(s) sem commit ({', '.join(x[3:] for x in dirty[:4])}{' …' if len(dirty) > 4 else ''}): commite por pathspec")
    br = _git.run(wt, "symbolic-ref", "--short", "-q", "HEAD").out.strip()
    merged = _git.run(wt, "merge-base", "--is-ancestor", "HEAD", base).code == 0
    if not br:
        item(merged, f"HEAD destacado num commit que está na {base}" if merged else
             f"HEAD destacado fora da {base}: o trabalho não está num ramo que o integrador junte")
    else:
        item(True, f"o ramo {br} " + (f"está na {base}" if merged else "está entregue, à espera do integrador"))
        left = open_tasks(wt, br)
        if BRANCH_FEATURE.match(br):  # a branch named after a feature answers for the marks of its tasks (F184)
            item(not left, "as tasks da feature do ramo estão marcadas" if not left else
                 f"{len(left)} task(s) aberta(s) em {left[0][0]} ({', '.join(t for _, t in left[:4])}{' …' if len(left) > 4 else ''}): marque as feitas "
                 "(ou declare `waiting::` na que espera) - o board lê o ramo entregue sem marca como «0 / N»")
    entries = _closing_entries(wt, br, session)
    last = _last_work_commit(wt)
    if not entries:
        named = " ou ".join(f"`{k}`" for k in (br, session) if k) or "o ramo (HEAD destacado: passe `--session`)"
        item(False, f"nenhuma entrada de fechamento com `Session:` que nomeie {named}"
             + " no log do projeto dono (docs/log.md ou apps/<app>/docs/log.md): é o save context, `mjrp-saving-context`,"
             + " com `Branch: <ramo>` no cabeçalho")
        owner = None
    else:
        stamp, log, owner = max(entries)
        fresh = last is None or stamp >= last[0]
        item(fresh, f"entrada de fechamento em {log} às {stamp}" + ("" if fresh else
             f", mais velha que o último commit de trabalho ({last[1]}, {last[0]}): escreva a entrada de fechamento depois do trabalho"))
    live = [(lease, state) for lease, state in session_lease.leases(wt) if state != "released"]
    if session:
        live = [(lease, state) for lease, state in live if lease.get("session") == session]
    item(not live, "lease liberado" if not live else
         "lease não liberado: " + ", ".join(f"{lease.get('session')} ({'ativo' if state == 'active' else 'vencido'})" for lease, state in live)
         + " - `python3 mjrp-scripts/session_lease.py release --session <id>`")
    # the apps the branch touched (and the one that holds the closing entry): the page session leaves its state in each app's ## Now;
    # the root's ## Now is the integrator's
    ahead = _git.run(wt, "diff", "--name-only", f"{base}...HEAD")
    apps = {wt / "apps" / x.split("/")[1] for x in (ahead.out.splitlines() if ahead.code == 0 else []) if x.startswith("apps/") and x.count("/") >= 2}
    if owner is not None and owner != wt:
        apps.add(owner)
    for app in sorted(a for a in apps if (a / "docs" / "log.md").is_file()):
        mem = app / "MEMORY.md"
        if not mem.is_file():
            item(False, f"{mem.relative_to(wt)} não existe: o ## Now do app é onde a sessão de página deixa o estado")
            continue
        behind = now_behind_log(app, now_section(mem.read_text(encoding="utf-8")))
        item(behind is None, f"o ## Now de {mem.relative_to(wt)} em dia" if behind is None else behind)
    if not apps:
        lines.append("  · o ramo não tocou app nenhum: o ## Now da raiz é do integrador, não é conferido aqui")
    lines.insert(0, f"session-check {wt.name}: " + ("pode arquivar" if not bad else f"{bad} pendência(s) - NÃO arquive"))
    return lines, 1 if bad else 0


# --------------------------------------------------------------------------------------------- worktrees (F120, F123, F207)

def clean_worktrees(cwd=None, apply=False):
    """The end of the train (ADR-0023 section 3; F74 judge P1-5b; F120): every LINKED worktree that is class 3 - its branch merged into `main`,
    nothing uncommitted, nothing ignored outside `derived`, not locked - is the integrator's to tear down, by `_safe.discard`. One that is
    held ONLY by the `.mjrp/` of an ended session or by stamped copies in its own `_backups/` is released first (`_safe.release_worktree`: the
    copies move into the main checkout's `_backups/`, nothing is lost) and then goes. So does one held only by the trace the doctor and the
    build rewrite (F207, UAT-527: `rewritten_traces` restored by `_safe.restore`, the derived untracked discarded). The main checkout and the
    one this runs in are never touched. Without `apply` it only lists. Returns (lines, failures)."""
    import _pathclass
    import _safe
    listing = _git.run(cwd, "worktree", "list", "--porcelain")
    if listing.code != 0:
        return ["não deu para listar os worktrees: " + (listing.err.strip() or "git falhou")], 1
    paths = [Path(os.path.realpath(b.split("\n")[0][9:])) for b in listing.out.split("\n\n") if b.startswith("worktree ")]
    here = Path(os.path.realpath(cwd or os.getcwd()))
    lines, failures = [], 0
    for wt in paths[1:]:                                   # the first entry is the main checkout
        if wt == here or wt in here.parents:
            continue
        verdict, plan = _pathclass.judge_worktree(wt)        # the main's rules: an old branch carries old ones (UAT-364)
        also = f" (antes, tira {plan.describe()})" if plan.paths else ""
        if verdict.klass != _pathclass.DERIVED:
            lines.append(f"fica   {wt.name}: {verdict.reason}")
        elif not apply:
            lines.append(f"sairia {wt.name}: mesclado e limpo{also} (rode com --apply)")
        else:
            try:
                _safe.release_worktree(wt)
                _safe.discard(wt)
                lines.append(f"saiu   {wt.name}{also}")
            except (_safe.Refused, _safe.RemovalFailed) as e:
                lines.append(f"FALHOU {wt.name}: {e}")
                failures += 1
    return lines, failures


# --------------------------------------------------------------------------------------------- the hooks (F206)

def _branch(wt):
    return _git.run(wt, "symbolic-ref", "--short", "-q", "HEAD").out.strip()


def closing_state(wt, branch):
    """"claimed": the newest closing entry (`Session:` naming the branch) is not older than the last commit of work - the session declared
    it is done. "stale": an entry exists but a commit of work came after it (the session went back to work, or fixed a red close with a
    commit and must write the entry again). None: no closing entry."""
    entries = _closing_entries(wt, branch)
    if not entries:
        return None
    last = _last_work_commit(wt)
    return "claimed" if last is None or max(entries)[0] >= last[0] else "stale"


def closing_claim(wt, branch):
    return closing_state(wt, branch) == "claimed"


def _mark_path(main, wt):
    return Path(main) / MARKS / f"{Path(wt).name}.json"


def _read_mark(path):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def _write_mark(path, data):
    """tmp + os.replace: a mark is never half written (the rotating class, AGENTS.md)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tmp-", suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


def _now():
    return time.strftime("%Y-%m-%d %H:%M", time.localtime())


def _block(reason):
    return json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False)


ARCHIVE_ORDER = ("Fecho verde ({wt}, ramo {branch}): a conferência passou e a sessão declarou o fim. Arquive esta sessão agora: escreva "
                 "na mesma mensagem o relatório ao orquestrador (uma linha: o que fez, o ramo, o último commit) e chame a ferramenta do app "
                 "`archive_session` com `session_id: \"self\"` e `reason: \"fecho verde\"`; o app tira o worktree junto. Sem essa ferramenta "
                 "(fora do app), pare: a marca ficou em {mark} e o início de sessão do checkout principal a mostra.{moved}")
REWRITE_ENTRY = ("Se a correção for um commit, escreva de novo a entrada de fechamento depois dele (`mjrp-saving-context`): uma entrada mais "
                 "velha que o último commit de trabalho vale como volta ao trabalho, e o fecho não é conferido.")
HOME = Path(__file__).resolve().parent.parent          # the checkout this script runs from: the hooks run the MAIN checkout's copy (F85)


def _project_key(path):
    """The folder name the AI Platform gives a session's transcript under `~/.claude/projects/`: the path where the session started, every
    character that is not a letter or a digit turned into `-`."""
    return re.sub(r"[^A-Za-z0-9]", "-", str(path))


def _is_own_checkout(root, payload):
    """True when `root` is where THIS session works (F206 recheck P1-1): the hook's `cwd` follows a `cd`, so a session that walked into a
    sibling worktree (or another repository) must not be judged by it, nor ordered to archive itself for it. The anchor is the transcript:
    `transcript_path` lives in the folder named after the path the session started in. No transcript, no match: silence (the safe side)."""
    tp = (payload or {}).get("transcript_path")
    if not tp:
        return False
    folder = Path(tp).parent.name
    return folder in {_project_key(root), _project_key(os.path.realpath(root))}


def session_root(payload, home=None):
    """(checkout root, is a linked worktree) of the session the hook JSON speaks for, or (None, False). The hooks run the MAIN checkout's
    copy (`CLAUDE_PROJECT_DIR`, F85), so the session's own checkout comes from the hook's `cwd`, followed only when it belongs to the
    repository this script runs from (`home`; F206 recheck P1-1) and that repository lists it in `git worktree list` (a folder with a
    forged `.git` file is not followed: session_journal.resolve_root, F85 recheck P2-1)."""
    import _pathclass
    home = Path(os.path.realpath(home or HOME))
    try:
        cwd = Path((payload or {}).get("cwd") or os.getcwd())
        if not cwd.is_dir():
            return None, False
        top = _git.run(cwd, "rev-parse", "--show-toplevel")
        if top.code != 0 or not top.out.strip():
            return None, False
        root = Path(os.path.realpath(top.out.strip()))
        listing = _git.run(home, "worktree", "list", "--porcelain")
    except (_git.GitError, OSError, AttributeError):
        return None, False
    listed = [Path(os.path.realpath(b.split("\n")[0][9:])) for b in listing.out.split("\n\n") if b.startswith("worktree ")] if listing.code == 0 else []
    if not listed or root not in listed:
        return None, False
    return root, root != listed[0] and _pathclass.is_linked_worktree(root)


def stop_hook(payload, home=None):
    """The decision of the `Stop` hook (F206): (stdout, exit code). Holds the turn by printing `{"decision": "block", "reason": ...}`;
    says nothing otherwise. Never fails the session for its own error: what it cannot read is silence, and a line on stderr."""
    try:
        return _stop_hook(payload, home)
    except Exception as e:                                 # noqa: BLE001 - a hook never fails the session's turn
        print(f"session_close stop-hook: não avaliei ({type(e).__name__}: {e})", file=sys.stderr)
        return "", 0


def _stop_hook(payload, home):
    import _pathclass
    wt, linked = session_root(payload, home)
    if wt is None or not linked or not _is_own_checkout(wt, payload):
        return "", 0
    branch = _branch(wt)
    if not branch:
        return "", 0
    state = closing_state(wt, branch)
    if state is None:
        return "", 0
    main = _pathclass.main_checkout(wt)
    head = _git.run(wt, "rev-parse", "HEAD").out.strip()
    if main is None or not head:
        return "", 0
    mark = _mark_path(main, wt)
    red = Path(main) / REDS / mark.name
    held = _read_mark(red) or {}
    if state == "stale":
        # the session went back to work - unless the hook held a red close of it and the fix was a commit (F206 recheck P1-2): then it
        # is told once, for this commit, to write the closing entry again
        if held and held.get("head") != head:
            _write_mark(red, {**held, "head": head, "at": _now()})
            return _block(f"Fecho de {wt.name} (ramo {branch}): a correção virou commit e a entrada de fechamento ficou mais velha que ele. "
                          + REWRITE_ENTRY), 0
        return "", 0
    if (_read_mark(mark) or {}).get("head") == head:
        return "", 0                                   # already ordered once for this commit: the mark and the net take it from here
    lines, code = session_check(wt)
    blockers = _pathclass.archive_blockers(wt) if code != 2 else []
    if code != 0 or blockers:
        if payload.get("stop_hook_active"):
            return "", 0                               # held once already in this stop: never a loop
        _write_mark(red, {"worktree": str(wt), "branch": branch, "head": head, "at": _now()})
        missing = [x for x in lines[1:] if x.startswith("  ✗ ")] + [f"  ✗ {b}" for b in blockers]
        reason = (f"Fecho vermelho ({wt.name}, ramo {branch}): a sessão escreveu a entrada de fechamento, mas o fecho não passa. Falta:\n"
                  + "\n".join(missing or lines) + "\nResolva cada item e termine de novo; com tudo verde, a sessão recebe a ordem de se "
                  "arquivar. " + REWRITE_ENTRY)
        return _block(reason), 0
    import _safe
    try:
        moved = _safe.move_backup_copies(wt)
    except _safe.RemovalFailed as e:
        reason = f"Fecho vermelho ({wt.name}): as cópias do `_backups/` não saíram para o checkout principal ({e}); nada foi marcado."
        return ("" if payload.get("stop_hook_active") else _block(reason)), 0
    _write_mark(mark, {"worktree": str(wt), "branch": branch, "head": head, "at": _now()})
    try:
        red.unlink()                                   # green now: the memory of the red hold is spent (this script wrote it)
    except OSError:
        pass
    note = f" {len(moved)} cópia(s) do `_backups/` foram para o `_backups/` do checkout principal." if moved else ""
    return _block(ARCHIVE_ORDER.format(wt=wt.name, branch=branch, mark=mark, moved=note)), 0


def pending(main):
    """F206: the marks of sessions ordered to archive themselves that did not (their worktree is still on disk), as lines, each with the close
    check run again (the worktree may have changed since: recheck P2-2). The marks and the red holds whose worktree left are removed
    here - this script wrote them (rotating, owner)."""
    for path in sorted((Path(main) / REDS).glob("*.json")) if (Path(main) / REDS).is_dir() else []:
        if not Path((_read_mark(path) or {}).get("worktree") or "/nonexistent").is_dir():
            try:
                path.unlink()
            except OSError:
                pass
    folder = Path(main) / MARKS
    if not folder.is_dir():
        return []
    out = []
    for path in sorted(folder.glob("*.json")):
        data = _read_mark(path) or {}
        wt = Path(data.get("worktree") or "")
        if data.get("worktree") and wt.is_dir():
            try:
                _lines, code = session_check(wt)
            except Exception:                              # noqa: BLE001 - the listing goes on; the check is said unread
                code = 2
            now = {0: "o fecho segue verde", 1: "o fecho ficou vermelho depois: rode `session_close.py check` nele antes de arquivar"}.get(
                code, "o fecho não pôde ser conferido agora")
            out.append(f"{wt.name} (ramo {data.get('branch', '?')}, fecho verde desde {data.get('at', '?')}; {now})")
        else:
            try:
                path.unlink()
            except OSError:
                pass
    return out


def session_start(payload=None, home=None):
    """The `SessionStart` hook (F206): in the MAIN checkout only, the pending marks and then the cleanup of the merged worktrees. Lines
    for the session to read; nothing in a linked worktree (a page session starting must not tear down its siblings). Never raises."""
    try:
        root, linked = session_root(payload, home)
        if root is None or linked:
            return []
        out = []
        left = pending(root)
    except Exception as e:                                 # noqa: BLE001 - a hook never fails the session start
        return [f"session_close: não avaliei as sessões por arquivar ({type(e).__name__}: {e})"]
    if left:
        out.append(f"session_close: {len(left)} sessão(ões) receberam a ordem de se arquivar e não se arquivaram (o worktree continua no disco):")
        out += [f"  - {x}" for x in left]
        out.append("  Arquive cada uma de fecho verde pelo app (`archive_session` com o id que `list_sessions` dá para o worktree); a rede "
                   "do app as arquiva em 2 dias parada.")
    try:
        lines, failures = clean_worktrees(cwd=root, apply=True)
    except Exception as e:                                 # noqa: BLE001 - a hook never fails the session start
        return out + [f"session_close: a limpeza dos worktrees não rodou ({type(e).__name__}: {e})"]
    gone = [x for x in lines if x.startswith("saiu") or x.startswith("FALHOU")]
    if gone:
        out.append(f"session_close: limpeza dos worktrees mesclados (sem trava, sem atividade há 1 h) — {sum(x.startswith('saiu') for x in gone)} saiu(íram)"
                   + (f", {failures} falhou(aram)" if failures else ""))
        out += [f"  {x}" for x in gone]
    return out


# --------------------------------------------------------------------------------------------- CLI

def _hook_payload():
    """The JSON the AI Platform sends a hook on stdin; {} when there is none (a terminal) or it does not parse."""
    if sys.stdin is None or sys.stdin.isatty():
        return {}
    try:
        data = json.loads(sys.stdin.read() or "{}")
    except ValueError:
        return {}
    return data if isinstance(data, dict) else {}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("stop-hook")
    sub.add_parser("session-start")
    sub.add_parser("pending")
    p = sub.add_parser("clean-worktrees"); p.add_argument("--apply", action="store_true")
    p = sub.add_parser("check"); p.add_argument("worktree"); p.add_argument("--session"); p.add_argument("--base", default="main")
    a = ap.parse_args(argv)
    if a.cmd == "stop-hook":
        text, code = stop_hook(_hook_payload())
        if text:
            print(text)
        return code
    if a.cmd == "session-start":
        for x in session_start(_hook_payload()):
            print(x)
        return 0
    if a.cmd == "pending":
        top = _git.run(None, "rev-parse", "--show-toplevel")
        import _pathclass
        root = Path(top.out.strip()) if top.code == 0 else Path.cwd()
        main_ = _pathclass.main_checkout(root) or root
        left = pending(main_)
        print("\n".join(left) if left else "session_close: nenhuma sessão com fecho verde por arquivar")
        return 0
    if a.cmd == "clean-worktrees":
        lines, failures = clean_worktrees(apply=a.apply)
        for x in lines:
            print("  " + x)
        print(f"clean-worktrees: {len(lines)} worktree(s) vistos" + (f", {failures} falhou(aram)" if failures else ""))
        return 1 if failures else 0
    lines, code = session_check(a.worktree, a.session, a.base)
    print("\n".join(lines))
    return code


if __name__ == "__main__":
    sys.exit(main())
