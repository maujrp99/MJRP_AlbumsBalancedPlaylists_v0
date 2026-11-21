#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
session_close.py - the close of a page session, in the harness and in every child (F206, S-218).

A page session works in a linked worktree and declares it is done with its closing log entry (`Session:` naming the branch, written by
`mjrp-saving-context`). From there the machine decides, never the agent:

  stop-hook          the `Stop` hook of every session. In a linked worktree whose session declared it is done (the closing entry not older
                     than the last commit of work): the close check red -> the turn is held once with the list of what is missing; green ->
                     the stamped copies of the worktree's `_backups/` move to the main checkout, the mark «ready to archive» is written in
                     the main checkout's `.mjrp/to-archive/`, and the turn is held once with the order to archive the session itself (the app
                     removes the worktree with it). Once per commit. Anywhere else, or with no closing entry, it says nothing.
                     In a page session of a feature whose branch already carries delivered work (a commit of work ahead of the trunk, or the
                     branch merged) and has NO closing entry: the end of the turn asks for the entry once per state (F290, UAT-600).
                     In the main checkout: the orchestrator is told once which work branches reached the trunk, with the `session-check` run
                     on each session - only the green one is ordered to archive, the red one comes with what is missing (F245, F290) - and
                     the upkeep it must still do: features merged with open tasks or a spec short of `Done`, and the page sessions that
                     delivered and stopped with no closing entry (F290). Those stay listed until they close.
  session-start      the `SessionStart` hook. In the main checkout only: the marks whose worktree is still there are listed (the session
                     did not archive itself), the others removed; then the merged, clean worktrees are torn down (`clean-worktrees --apply`).
  check WORKTREE     the close check (F101): exit 0 may archive, 1 not yet (each item said), 2 not evaluable. `merge_train.py session-check`
                     is the same function.
  clean-worktrees [--apply]  the linked worktrees whose branch is merged into main and that are clean (class 3, ADR-0023) and, with
                     `--apply`, each one torn down through `_safe.discard`; the others stay, with the reason (F120, F123, F207).
  pending            the marks of sessions that did not archive themselves.
  upkeep             the merged features still open and the delivered sessions with no closing entry (F290), as the orchestrator sees them.
  post-merge         the `post-merge` hook: the features the merge touched that are still open after it (F290; a child has no train).

Nothing is deleted outside `_safe`. Comments and docstrings are English; what the human reads is Portuguese.
"""
import argparse
import hashlib
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
MERGED = Path(".mjrp") / "merged-announced.json"   # in the MAIN checkout: the work branches already announced as merged (F245), rotating
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


FRONT_STATUS = re.compile(r"\A---[ \t]*\n(.*?)\n---", re.S)
STATUS_LINE = re.compile(r"^status:[ \t]*[\"']?(\S+?)[\"']?[ \t]*$", re.M)


def _status_of(text):
    """The `status:` of a spec's frontmatter, or None."""
    front = FRONT_STATUS.match(text or "")
    found = STATUS_LINE.search(front.group(1)) if front else None
    return found.group(1) if found else None


def feature_number(branch):
    """The feature a work branch is named after (`claude/f19-x` -> '19'), or None: a role session (the orchestrator, a Designer) is not."""
    m = BRANCH_FEATURE.match(branch or "")
    return m.group(1) if m else None


def feature_done(wt, branch):
    """F256 (UAT-570): is the spec of the feature the branch is named after `Done` in the worktree `wt`? The order to archive a session is only
    for the session of a feature that finished its cycle - the fast lane's retroactive step comes before `Done`. False for a branch that is not
    named after a feature."""
    n = feature_number(branch)
    if n is None:
        return False
    wt = Path(wt)
    roots = [wt / "docs/specs/features", *sorted((wt / "apps").glob("*/docs/specs/features"))]
    for root in roots:
        for spec in root.glob(f"F{n}-*/spec.md"):
            if _status_of(spec.read_text(encoding="utf-8", errors="replace")) == "Done":
                return True
    return False


def feature_done_on(root, trunk, branch):
    """The same question for a branch merged into `trunk`: the spec as the trunk has it (`git grep` of the first `status:` line of each spec)."""
    n = feature_number(branch)
    if n is None:
        return False
    found = _git.run(root, "grep", "-n", "-m", "1", "-E", "^status:", trunk, "--", f":(glob)**/docs/specs/features/F{n}-*/spec.md")
    for line in found.out.splitlines() if found.code == 0 else []:
        _ref, _path, _no, text = line.split(":", 3)
        if _status_of(f"---\n{text}\n---") == "Done":
            return True
    return False


def session_check(wt, session=None, base="main", branch=None):
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
    if br and branch and br != branch and feature_number(br) is not None and re.fullmatch(re.escape(br) + r"-[0-9a-f]{4,8}", branch):
        # F326 (UAT-633): the worktree was renamed to the convention name; the app still records `<name>-<hex suffix>`. Only that form, never a
        # sibling branch; and the app's own ref, when it still exists, must be in the base too (its work is the session's work)
        ref = _git.run(wt, "rev-parse", "-q", "--verify", f"refs/heads/{branch}")
        if ref.code == 0 and _git.run(wt, "merge-base", "--is-ancestor", branch, base).code != 0:
            item(False, f"o ramo {branch} (o do app para a sessão) tem trabalho fora da {base}: o fecho do ramo renomeado {br} não o cobre")
        branch = br
    if br and branch and br != branch:  # F313 (recheck P0): a worktree on another branch says nothing of this session's branch
        item(False, f"o worktree está no ramo {br}, não em {branch} (o ramo da sessão): o fecho que se confere seria o de outro ramo")
    if not br and branch:  # detached HEAD: only the tip of the session's branch speaks for it (F313 recheck 2)
        tip = _git.run(wt, "rev-parse", "-q", "--verify", f"refs/heads/{branch}")
        head = _git.run(wt, "rev-parse", "HEAD")
        if tip.code == 0 and tip.out.strip() != head.out.strip():
            item(False, f"HEAD destacado fora da ponta do ramo {branch}: o que se confere não é o trabalho da sessão")
    br_named = branch or br  # F313: a detached HEAD in a reused worktree still answers for the branch the app records for the session
    entries = _closing_entries(wt, br_named, session)
    last = _last_work_commit(wt)
    if not entries:
        named = " ou ".join(f"`{k}`" for k in (br_named, session) if k) or "o ramo (HEAD destacado: passe `--session`)"
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

def merged_without_worktree(root, branch, trunk="main"):
    """F313 (UAT-623): (ok, reason) for a feature session whose worktree is gone (the train removed it): ok when the branch is in `trunk`
    (its ref is an ancestor, or the ref is gone with the merge) and `trunk` carries the closing entry that names it and the spec `Done`."""
    if feature_number(branch) is None:
        return False, f"«{branch}» não é ramo de feature"
    ref = _git.run(root, "rev-parse", "--verify", "-q", f"refs/heads/{branch}")
    if ref.code == 0 and _git.run(root, "merge-base", "--is-ancestor", branch, trunk).code != 0:
        return False, f"o ramo {branch} não está na {trunk}"
    if ref.code != 0:  # ref gone: only a merge commit in the trunk that names the branch proves it went in (F313 recheck P0)
        mg = _git.run(root, "log", "--merges", "--format=%s", trunk)
        if mg.code != 0 or not any(_entry_names(x, branch) for x in mg.out.splitlines()):
            return False, f"o ramo {branch} não tem ref e a {trunk} não tem merge que o nomeie"
    found = _git.run(root, "grep", "-h", "-E", "^Branch:", trunk, "--", ":(glob)docs/log.md", ":(glob)apps/*/docs/log.md")
    named = [x for x in (found.out.splitlines() if found.code == 0 else []) if _entry_names(x, branch, "Branch")]
    if not named:
        return False, f"a {trunk} não tem a entrada de fechamento com `Branch: {branch}`"
    if not feature_done_on(root, trunk, branch):
        return False, f"a spec da feature de {branch} não está `Done` na {trunk}"
    return True, f"o ramo {branch} está na {trunk}, com a entrada de fechamento e a spec Done"


# --------------------------------------------------------------------------------------------- orphan test servers (F319, UAT-629)

RUNNERS = {"node", "nodejs", "bun", "deno", "npx", "pnpm", "yarn", "npm", "python", "python3"}   # programs that run a dev server named by an argument
SERVERS = {"next-server": None, "vite": None, "webpack-dev-server": None, "storybook": None, "nodemon": None,
           "next": {"dev", "start"}, "webpack": {"serve"}, "ng": {"serve"}, "astro": {"dev"}, "remix": {"dev"}}   # name -> the subcommand it needs


def is_dev_server(args):
    """True when the PROGRAM is a dev server: argv[0] (or the script a runner like `node` runs), never a word elsewhere in the line - an
    editor on `vite.config.ts`, a `tail` of `storybook.log` or a `git log --grep next-server` are not servers (F319 recheck P1)."""
    tokens = args.split()
    if not tokens:
        return False
    prog = os.path.basename(tokens[0])
    names = [prog]
    if prog in RUNNERS or prog.startswith("python"):
        names = [os.path.basename(t) for t in tokens[1:4] if not t.startswith("-")][:2] or names
        names = [re.sub(r"\.(m?js|cjs|py)$", "", n) for n in names]
    for k, name in enumerate(names):
        if name in SERVERS:
            need = SERVERS[name]
            rest = tokens[1:] if name == prog else tokens[k + 1:]
            return need is None or bool(need & set(rest[:3]))
    return False


SERVICE_NEVER = re.compile(r"(control[-_]center|\bcc serve\b|mjrp-control-center)")   # the service is never a test server
ORPHAN_HOURS = 12                         # a dev server this old in a worktree, with no owner, is collected (the owner: a live session; none can be told here)
TRASH = ".ccd-trash"


def _etime_seconds(text):
    """`ps` etime `[[dd-]hh:]mm:ss` -> seconds (None when it does not parse)."""
    m = re.fullmatch(r"(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+)", text.strip())
    if not m:
        return None
    d, h, mi, sec = (int(x or 0) for x in m.groups())
    return ((d * 24 + h) * 60 + mi) * 60 + sec


def _ps_servers():
    """[(pid, etime_seconds, args)] of every process `ps` shows (the filter is `orphan_servers`'; `ps` and `lsof` ship with macOS and Linux)."""
    import subprocess
    r = subprocess.run(["ps", "-axo", "pid=,etime=,args="], capture_output=True, text=True, timeout=20)
    if r.returncode != 0:
        raise RuntimeError("ps não respondeu")
    out = []
    for line in r.stdout.splitlines():
        parts = line.strip().split(None, 2)
        if len(parts) == 3 and parts[0].isdigit() and (sec := _etime_seconds(parts[1])) is not None:
            out.append((int(parts[0]), sec, parts[2]))
    return out


def _cwd_of(pid):
    import subprocess
    r = subprocess.run(["lsof", "-a", "-d", "cwd", "-p", str(pid), "-Fn"], capture_output=True, text=True, timeout=20)
    names = [x[1:] for x in r.stdout.splitlines() if x.startswith("n")]
    return names[0] if names else None


def orphan_servers(processes, cwd_of, roots, hours=ORPHAN_HOURS, exists=os.path.exists, extra_under=(), me=()):
    """Which dev-server processes to stop: [(pid, why)]. A process counts only when it is a dev server (`DEV_SERVER`), is not the Control
    Center service, and its working directory is inside a project folder (`roots`) - never anything outside them. It is an orphan when its
    directory is gone, is in the app's trash (`.ccd-trash`), is in a removed or about-to-be-removed worktree (`extra_under`, the one the
    closing session is leaving), or when it is in a `.claude/worktrees/` folder and has run longer than `hours`. A directory that cannot be
    read is never judged (when in doubt, nothing is stopped). Pure: the callers pass the processes and the reading of the directory."""
    found = []
    for pid, seconds, args in processes:
        if pid in me or not is_dev_server(args) or SERVICE_NEVER.search(args):
            continue
        where = cwd_of(pid)
        if not where:
            continue
        inside = any(where == r or where.startswith(str(r).rstrip(os.sep) + os.sep) for r in roots)
        if not inside:
            continue
        if TRASH in where:
            found.append((pid, f"a pasta de trabalho está na lixeira do app ({where})"))
        elif not exists(where):
            found.append((pid, f"a pasta de trabalho não existe mais ({where})"))
        elif any(where == str(u) or where.startswith(str(u).rstrip(os.sep) + os.sep) for u in extra_under):
            found.append((pid, f"a sessão dele terminou ({where})"))
        elif f"{os.sep}.claude{os.sep}worktrees{os.sep}" in where and seconds > hours * 3600:
            found.append((pid, f"roda há {seconds // 3600} h numa worktree, sem dono ({where})"))
    return found


def collect_orphan_servers(roots, extra_under=(), apply=True, processes=None, cwd_of=_cwd_of, kill=None, hours=ORPHAN_HOURS, grace=3.0):
    """F319 (UAT-629): stop the orphan dev servers `orphan_servers` names - TERM, then KILL if still alive after `grace` s. Returns lines.
    Never raises: a collection that fails is a line, never a failure of the close or of the cleanup."""
    try:
        procs = _ps_servers() if processes is None else processes
        found = orphan_servers(procs, cwd_of, roots, hours=hours, extra_under=extra_under, me={os.getpid(), os.getppid()})
    except Exception as e:  # noqa: BLE001
        return [f"servidores de teste órfãos: não consegui listar ({type(e).__name__}: {e})"]
    import signal
    send = kill or os.kill
    lines = []
    for pid, why in found:
        if not apply:
            lines.append(f"encerraria o servidor de teste {pid}: {why}")
            continue
        try:
            send(pid, signal.SIGTERM)
            deadline = time.time() + grace
            while time.time() < deadline:
                try:
                    send(pid, 0)
                except ProcessLookupError:
                    break
                time.sleep(0.2)
            else:
                send(pid, signal.SIGKILL)
            lines.append(f"servidor de teste {pid} encerrado: {why}")
        except ProcessLookupError:
            lines.append(f"servidor de teste {pid} já tinha saído: {why}")
        except OSError as e:
            lines.append(f"servidor de teste {pid} NÃO encerrado ({e}): {why}")
    return lines


def _project_roots(wt):
    """The folders a dev server may be collected from: the repository's own tree and its parent (`.../projects`, where the projects live)."""
    import _pathclass
    main = _pathclass.main_checkout(wt)
    return [Path(os.path.realpath(main)).parent] if main else []


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
    if apply:   # F319 (UAT-629): the dev servers a removed or trashed worktree left behind
        try:
            lines += collect_orphan_servers([Path(os.path.realpath(paths[0])).parent], extra_under=[w for w in paths[1:] if not w.exists()])
        except Exception as e:  # noqa: BLE001 - the cleanup never fails for this
            lines.append(f"servidores de teste órfãos: não rodou ({type(e).__name__})")
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


ARCHIVE_ALL = ("Arquive agora estas sessões (o `session-check` passou em cada uma): {branches}. `list_sessions` acha a sessão pelo ramo e "
               "`archive_session` a arquiva. Sessão de papel (designer, orquestradora) não se arquiva, e sessão que ainda trabalha fica. "
               "Sem essa ferramenta, diga ao MJRP quais sessões arquivar.")


MERGED_VERSION = 2     # the file written before F256 also held the branches that had never committed: it is read as a first reading


def _merged_branches(root):
    """(trunk, the work branches merged into it), or None when git does not answer. `integrate/*` is left out: its branches are what counts.
    A branch whose tip sits on the trunk's first-parent line has no commit of its own (just opened from the trunk): it is not merged, it
    is new (F256, UAT-570; the same test as `_pathclass.has_own_commit`). A branch the train merged with `--no-ff` has its tip off that line."""
    trunk = next((b for b in ("main", "master") if _git.run(root, "rev-parse", "--verify", "-q", f"refs/heads/{b}").code == 0), None)
    if trunk is None:
        return None
    found = _git.run(root, "for-each-ref", f"--merged=refs/heads/{trunk}", "--format=%(refname:short) %(objectname)",
                     "refs/heads/claude", "refs/heads/feat", "refs/heads/fix")
    line = _git.run(root, "rev-list", "--first-parent", f"refs/heads/{trunk}")
    if found.code or line.code:
        return None
    on_line = set(line.out.split())
    return trunk, {name for name, sha in (x.split(" ", 1) for x in found.out.splitlines()) if sha not in on_line}


def _merged_order(root, payload):
    """The main checkout's part (F245, S-240; F290, UAT-600): the orchestrator is told which work branches reached the trunk, with the
    `session-check` RUN on each session - the archive order is only for the green one, the red one comes with what is missing and who owns
    it (the session of the branch), and a branch with no worktree on disk says so (nothing to check is not an approval). The first reading
    in a repository only records: what was merged before is not news. F256 (UAT-570): only a branch of a feature whose spec is `Done` on the
    trunk is judged - a role session has no such branch, and a fast-lane feature merged before its retroactive step is not finished; it is
    listed in the upkeep until its spec turns `Done`. The upkeep (features still open, delivered sessions with no closing entry) is told
    whenever it changes; the same text is never told twice."""
    if payload.get("stop_hook_active"):
        return "", 0
    found = _merged_branches(root)
    if found is None:
        return "", 0
    trunk, merged = found
    path = Path(root) / MERGED
    seen = _read_mark(path)
    first = seen is None or seen.get("v") != MERGED_VERSION
    # the Stop of the main checkout runs at every turn: nothing moved since the last reading (the trunk, each worktree's HEAD) means nothing new
    sig = hashlib.sha1((_git.run(root, "rev-parse", f"refs/heads/{trunk}").out + _git.run(root, "worktree", "list", "--porcelain").out).encode("utf-8")).hexdigest()
    if not first and seen.get("sig") == sig:
        return "", 0
    known = merged if first else set(seen.get("branches") or []) & merged
    told = "" if first else str(seen.get("told") or "")
    fresh = sorted(b for b in merged - known if feature_done_on(root, trunk, b))
    where = dict((br, wt) for wt, br in linked_worktrees(root))
    green, red, gone = [], [], []
    for b in fresh:
        wt = where.get(b)
        if wt is None:
            gone.append(b)
            continue
        import _pathclass
        lines, code = session_check(wt)
        miss = [x[4:] for x in lines[1:] if x.startswith("  ✗ ")] or lines[:1]
        blockers = _pathclass.archive_blockers(wt) if code != 2 else []   # what the session's own close also refuses: a class 1 file the app would delete with the worktree
        (green if code == 0 and not blockers else red).append((b, wt, miss + list(blockers) if code or blockers else miss))
    parts = []
    if green:
        parts.append(ARCHIVE_ALL.format(branches=", ".join(f"`{b}` ({wt.name})" for b, wt, _ in green)))
    if red:
        parts.append("NÃO arquive estas (o `session-check` falhou); cada uma volta ao dono, a sessão do ramo (`list_sessions` acha pelo ramo; "
                     "mande o que falta com `SendMessage`):\n" + "\n".join(
                         f"  - `{b}` ({wt.name}): " + " | ".join(miss) for b, wt, miss in red))
    if gone:
        parts.append("Sem worktree no disco (nada a conferir; arquive só se a sessão ainda aparece no app e não tem trabalho): "
                     + ", ".join(f"`{b}`" for b in gone))
    up = upkeep_lines(root)
    if up:
        parts.append("\n".join(up))
    text = ("Entraram na `main` estes ramos de trabalho: " + ", ".join(f"`{b}`" for b in fresh) + ".\n" if fresh else "") + "\n\n".join(parts) if parts else ""
    ordered = {b for b, _, _ in green} | set(gone)     # a red branch is not recorded: it is judged again until its close is green
    # the fingerprint leaves out the green part: it is told once and recorded as known, so the next turn's text (red and upkeep only) is
    # the same text and is not told again; only a change in what is still open tells it anew
    keep = "\n\n".join(x for x in parts if not x.startswith("Arquive agora"))
    stamp = hashlib.sha1(keep.encode("utf-8")).hexdigest() if keep else ""
    _write_mark(path, {"v": MERGED_VERSION, "branches": sorted(known | ordered), "at": _now(), "told": stamp, **({} if red else {"sig": sig})})   # a red close is judged again every turn: what clears it may leave no commit (recheck-2 P2-1)
    if not text or (not green and stamp == told):
        return "", 0
    return _block(text), 0


# --------------------------------------------------------------------------------------------- the upkeep (F290, UAT-600)

FEATURE_FILE = re.compile(r"(?:^|/)features/F(\d+)-[^/]+/(spec|tasks)\.md$")
TERMINAL_STATUS = {"Done", "Accepted", "Cancelled", "Canceled", "Deferred", "Superseded", "Rejected"}   # a spec in one of these is closed or off


def features_on(root, trunk):
    """{feature number: {"status": the spec's status or None, "open": [open task ids], "spec": path}} as the trunk has them: two `git grep`
    over the whole trunk, never the working tree (F290: the merged work is judged where it landed). A task that declares `waiting::` is
    waiting on purpose and is not open (the same rule as `open_tasks`)."""
    out = {}
    spec = _git.run(root, "grep", "-n", "-m", "1", "-E", "^status:", trunk, "--", ":(glob)**/features/F*/spec.md")
    for line in spec.out.splitlines() if spec.code == 0 else []:
        try:
            _ref, path, _no, text = line.split(":", 3)
        except ValueError:
            continue
        m = FEATURE_FILE.search(path)
        if m:
            out.setdefault(m.group(1), {"status": text.split(":", 1)[1].strip().strip("\"'") or None, "open": [], "spec": path})
    tasks = _git.run(root, "grep", "-n", "-E", r"^- \[ \] TASK-", trunk, "--", ":(glob)**/features/F*/tasks.md")
    for line in tasks.out.splitlines() if tasks.code == 0 else []:
        try:
            _ref, path, _no, text = line.split(":", 3)
        except ValueError:
            continue
        m = FEATURE_FILE.search(path)
        t = TASK_OPEN.match(text)
        if m and t and "waiting::" not in t.group(2) and m.group(1) in out:
            out[m.group(1)]["open"].append(t.group(1))
    return out


def pending_features(root, trunk, numbers=None):
    """UAT-600 hole 3: the fast lane leaves the `Done` for after the merge, and nothing asked for it. The features (of `numbers`, or every
    one the trunk has) with an open task or a spec short of a closed status, as lines. State read from the trunk each time, so the
    pendency lives until the feature closes - nobody has to remember it."""
    found = features_on(root, trunk)
    lines = []
    for n in sorted(found if numbers is None else {x for x in numbers if x in found}, key=int):
        f = found[n]
        why = []
        if f["status"] not in TERMINAL_STATUS:
            why.append(f"spec em `{f['status'] or 'sem status'}`, não em `Done`")
        if f["open"]:
            why.append(f"{len(f['open'])} task(s) aberta(s) ({', '.join(f['open'][:4])}{' …' if len(f['open']) > 4 else ''})")
        if why:
            lines.append(f"F{n} ({f['spec'].rsplit('/', 1)[0]}): " + "; ".join(why))
    return lines


def merged_feature_pending(root, branch):
    """The lines the train (and the child's `post-merge`) print right after a merge: the feature the merged branch is named after, if it
    is still open. Empty when the branch is not named after a feature or the feature closed."""
    n = feature_number(branch)
    trunk = next((b for b in ("main", "master") if _git.run(root, "rev-parse", "--verify", "-q", f"refs/heads/{b}").code == 0), None)
    if n is None or trunk is None:
        return []
    found = pending_features(root, trunk, {n})
    return ([f"  pendência da via rápida: {found[0]} - o orquestrador a vê na lista até fechar (passo retroativo, tasks, `Done`)"]
            if found else [])


def linked_worktrees(root):
    """[(path, branch)] of the linked worktrees of the repository `root` belongs to, the main checkout left out."""
    listing = _git.run(root, "worktree", "list", "--porcelain")
    if listing.code != 0:
        return []
    out = []
    for i, block in enumerate(b for b in listing.out.split("\n\n") if b.startswith("worktree ")):
        if i == 0:
            continue
        path = Path(os.path.realpath(block.split("\n")[0][9:]))
        if not path.is_dir():
            continue                                           # a worktree whose folder is gone (prunable): nothing on disk to read
        br = next((x[7:].removeprefix("refs/heads/") for x in block.splitlines() if x.startswith("branch ")), "")
        out.append((path, br))
    return out


def _delivered_ahead(wt, trunk):
    """Does the branch carry a commit of work ahead of the trunk - one that touches more than the logs, MEMORY.md and the feature's own
    spec/plan/tasks (the start commit is not a delivery)?"""
    r = _git.run(wt, "log", f"{trunk}..HEAD", "--format=@%h", "--name-only")
    if r.code != 0:
        return False
    return any(x.strip() and not CLOSE_ONLY.search(x.strip()) and not FEATURE_FILE.search(x.strip()) and not re.search(r"/features/F\d+-[^/]+/plan\.md$", x.strip())
               for x in r.out.splitlines() if not x.startswith("@"))


def delivered_without_entry(root, trunk, merged):
    """UAT-600 hole 2: [(worktree, branch, "merged"|"ahead")] - the page sessions of a feature whose branch carries delivered work (merged
    into the trunk with a commit of its own, or a commit of work ahead of it) and that wrote no closing entry (`closing_state` None). A
    session that wrote an entry and went back to work is `stale`, working: not listed."""
    out = []
    for wt, br in linked_worktrees(root):
        if not br or feature_number(br) is None:
            continue
        kind = "merged" if br in merged else ("ahead" if _delivered_ahead(wt, trunk) else None)
        if kind and closing_state(wt, br) is None:
            out.append((wt, br, kind))
    return out


def post_merge_lines(root):
    """The child's `post-merge` (F290: a child has no train): the features the merge just made touch that are still open after it. The files
    the merge brought come from the diff against the first parent of a merge commit (or `ORIG_HEAD` after a fast-forward), and the feature the
    merged branch is named after from the merge commit's subject. Never raises."""
    try:
        trunk = next((b for b in ("main", "master") if _git.run(root, "rev-parse", "--verify", "-q", f"refs/heads/{b}").code == 0), None)
        if trunk is None or _git.run(root, "symbolic-ref", "--short", "-q", "HEAD").out.strip() != trunk:
            return []                                          # only a merge that lands on the trunk is a delivery
        parents = _git.run(root, "rev-list", "--parents", "-n", "1", "HEAD").out.split()
        base = "HEAD^1" if len(parents) > 2 else "ORIG_HEAD"
        names = _git.run(root, "diff", "--name-only", base, "HEAD")
        nums = {m.group(1) for m in (FEATURE_FILE.search(x) for x in names.out.splitlines()) if m} if names.code == 0 and len(parents) > 2 else set()   # a fast-forward brings the trunk's own commits: no guess from the files
        subject = _git.run(root, "log", "-1", "--format=%s").out        # `merge: claude/f40-x` or `Merge branch 'claude/f40-x'`: the branch names its feature
        nums |= {m.group(1) for m in BRANCH_FEATURE.finditer(subject)} if len(parents) > 2 else set()
        found = pending_features(root, trunk, nums) if nums else []
    except Exception:                                          # noqa: BLE001 - a hook never fails the merge
        return []
    return (["session_close: feature(s) mesclada(s) ainda abertas - o orquestrador as vê na lista até fechar "
             "(passo retroativo, tasks marcadas, spec em `Done`):"] + [f"  - {x}" for x in found]) if found else []


def upkeep_lines(root):
    """What the orchestrator still owes, as lines (state read from git each time): the merged features short of `Done` or with open tasks,
    and the page sessions that delivered and stopped with no closing entry. Empty when there is nothing."""
    found = _merged_branches(root)
    if found is None:
        return []
    trunk, merged = found
    out = []
    pend = pending_features(root, trunk, {n for n in (feature_number(b) for b in merged) if n})
    if pend:
        out.append("Features mescladas ainda abertas (o `Done` da via rápida vem depois do merge: passo retroativo, tasks marcadas, spec em `Done`):")
        out += [f"  - {x}" for x in pend]
    silent = delivered_without_entry(root, trunk, merged)
    if silent:
        out.append("Sessões que entregaram o ramo e pararam sem a entrada de fechamento (`mjrp-saving-context`, com `Branch:` no cabeçalho):")
        out += [f"  - {wt.name} (ramo `{br}`, {'já na main' if kind == 'merged' else 'commits de trabalho à frente da main'}): mande o pedido ao dono "
                "(`list_sessions` acha a sessão pelo ramo)" for wt, br, kind in silent]
    return out


def _uncollected_order(wt, branch, main, payload):
    """Stop hook of a page session of a feature with delivered work and no closing entry: asks for the entry once per state ('ahead', then
    'merged'), never twice for the same (a session mid-work is not nagged at every turn)."""
    if payload.get("stop_hook_active"):
        return "", 0
    found = _merged_branches(wt)
    if found is None:
        return "", 0
    trunk, merged = found
    kind = "merged" if branch in merged else ("ahead" if _delivered_ahead(wt, trunk) else None)
    if kind is None:
        return "", 0
    record = Path(main) / REDS / f"{wt.name}.noentry.json"
    if (_read_mark(record) or {}).get("kind") == kind:
        return "", 0
    _write_mark(record, {"worktree": str(wt), "branch": branch, "kind": kind, "at": _now()})
    where = "já está na `main`" if kind == "merged" else "tem commits de trabalho à frente da `main`"
    return _block(f"Sem entrada de fechamento ({wt.name}, ramo {branch}): o ramo {where} e nenhuma entrada de log com `Session:` e "
                  f"`Branch: {branch}` o fecha. Se o trabalho acabou, escreva a entrada agora (`mjrp-saving-context`: `## Now`, decisões, "
                  "log) e commite por pathspec; o fecho é conferido e a sessão recebe a ordem de se arquivar. Se ainda trabalha, siga: "
                  "este aviso vem uma vez."), 0


def _stop_hook(payload, home):
    import _pathclass
    wt, linked = session_root(payload, home)
    if wt is not None and not linked:
        return _merged_order(wt, payload)
    if wt is None or not linked or not _is_own_checkout(wt, payload):
        return "", 0
    branch = _branch(wt)
    if feature_number(branch) is None:
        return "", 0                                   # F256 (UAT-570): a role session (the orchestrator, a Designer) is never closed by this hook
    state = closing_state(wt, branch)
    if state is None:
        main = _pathclass.main_checkout(wt)
        return _uncollected_order(wt, branch, main, payload) if main is not None else ("", 0)   # F290: the entry is asked for, not left silent
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
                  "arquivar, quando a spec da feature estiver em `Done`. " + REWRITE_ENTRY)
        return _block(reason), 0
    if not feature_done(wt, branch):
        return "", 0                                   # F256: green, but the feature is not Done (the fast lane's retroactive step is still to do)
    import _safe
    try:
        moved = _safe.move_backup_copies(wt)
    except _safe.RemovalFailed as e:
        reason = f"Fecho vermelho ({wt.name}): as cópias do `_backups/` não saíram para o checkout principal ({e}); nada foi marcado."
        return ("" if payload.get("stop_hook_active") else _block(reason)), 0
    _write_mark(mark, {"worktree": str(wt), "branch": branch, "head": head, "at": _now()})
    try:
        freed = collect_orphan_servers(_project_roots(wt), extra_under=[wt])   # F319: the session's own dev servers go with it
    except Exception:  # noqa: BLE001 - the close never fails for this
        freed = []
    try:
        red.unlink()                                   # green now: the memory of the red hold is spent (this script wrote it)
    except OSError:
        pass
    note = f" {len(moved)} cópia(s) do `_backups/` foram para o `_backups/` do checkout principal." if moved else ""
    note += (" " + " ".join(freed)) if freed else ""
    try:  # F275: the green close is the delivery: what the branch carries waits for the integrator («Esperando o merge»)
        import board_move
        said = board_move.on_delivered(wt, branch, payload.get("session_id"))
        note += (" " + " ".join(said)) if said else ""
    except Exception as exc:  # noqa: BLE001 - the board never holds the close
        note += f" O board não registrou a entrega ({type(exc).__name__})."
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
    try:  # F290: what the orchestrator still owes is read from git at every start, so it never depends on remembering
        out += upkeep_lines(root)
    except Exception as e:                                 # noqa: BLE001 - a hook never fails the session start
        out.append(f"session_close: não avaliei a manutenção das sessões ({type(e).__name__}: {e})")
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
    sub.add_parser("upkeep")
    sub.add_parser("post-merge")
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
    if a.cmd in ("upkeep", "post-merge"):
        top = _git.run(None, "rev-parse", "--show-toplevel")
        root = Path(top.out.strip()) if top.code == 0 else Path.cwd()
        if a.cmd == "upkeep":
            lines = upkeep_lines(root)
            print("\n".join(lines) if lines else "session_close: nada em aberto na manutenção das sessões")
        else:
            for x in post_merge_lines(root):
                print(x)
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
