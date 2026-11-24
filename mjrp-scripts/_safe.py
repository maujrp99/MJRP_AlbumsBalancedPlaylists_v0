# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_safe.py - the ONE way a harness script (and the agent) removes or moves a path (ADR-0023; F74).

What cannot be recovered is never deleted; what can be recovered has an owner and a ceiling. The class of a path comes from
`_pathclass.classify` (1 irreplaceable, 2 versioned, 3 derived, 4 rotating); this module acts on it:

  discard <path>   the only removal. Class 3 (derived) goes; classes 1, 2 and 4 are refused with the reason (exit 1). When the
                   removal itself fails - the file bridge has no permission to delete - it exits 1 with the reason, never 0.
  retire  <path>   moves the path into `_backups/` with a timestamp (class 1). A derived path is discarded instead (it never
                   goes to `_backups/`); a versioned one leaves by `git rm`, a rotating one by its owner.
  restore <path>   the way back for a TRACKED file the build (or the agent) rewrote: the uncommitted edit goes to `_backups/` first, then
                   git puts the committed content back. The deletion guard refuses `git restore` over an edit, and a file `retire` already
                   moved is still a "change" to it (a tracked file that is gone) - this door is the one path that finishes (F180, UAT-487).
  classify <path>  prints the class and why.

`release_worktree` (no verb: `merge_train.py clean-worktrees --apply` calls it before `discard`) empties a merged, clean worktree of the
rotating `.mjrp/` of an ended session and of its stamped `_backups/` copies - the copies move into the MAIN checkout's `_backups/` -, gives
the committed content back to the traces a tool rewrote (`rewritten_traces`, by `restore`) and discards the untracked derived files (F207).

`_backups/` is gitignored and grows: it is the safety net against the agent's mistake, NOT a backup (it lives on the same disk;
see its README.md, which this module writes). The owner prunes it by itself: after each copy, `prune_to_ceiling` removes the stamped
copies older than the ceiling's days and the oldest ones while the folder is over its GB (`structure_rules.json -> budgets`, the
`retired-backups` entry: 30 days and 1 GB) - only what carries this module's stamp, never the copy just made. `prune(N)` (`--prune N`,
opt-in) is the manual one, by count. Neither touches repository content.

Which project's `_backups/` is the project ASKED FOR, passed as a value (F73 TASK-18, R12; DP-17 Context Object): `ctx=` a
`_context.Context` (its `root`), or `root=` a folder, or - when neither is given - the top of the git project that holds the path,
or - when the path is in no repository - the repository these scripts live in. There is no module-level ROOT or BACKUPS.
"""
import hashlib
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

import _clock
import _git
import _pathclass
from _context import Context
from _pathclass import DERIVED, ROTATING, VERSIONED

_sp_now = _clock.now   # Brasília, not the host's clock (the bridge and the cloud run in UTC; 2026-10-09)

BACKUPS_README = "README.md"
README_TEXT = """# _backups/

Isto é a **rede contra engano do agente, não backup.**

Quando um script do harness (ou o agente, pelo `_safe.py retire`) tira um arquivo do lugar, a cópia vem para cá, com o carimbo
`<caminho>.<AAAAMMDD-HHMMSS>`. Serve para desfazer um engano de hoje. Esta pasta mora **no mesmo disco** que o resto: se o disco
se perder, ela se perde junto. O backup que sobrevive ao disco é a cópia diária levada ao disco externo (ADR-0024) e o GitHub
até o último push.

- Tem teto: 30 dias e 1 GB. O `_safe` poda sozinho, depois de cada cópia, as cópias carimbadas que passaram do teto (as mais velhas primeiro), sem tocar a cópia que acabou de fazer; o W18 do doctor avisa se ainda assim passar. A poda manual, por quantidade, é `build_plugin.py --prune N`.
- Não é versionada (o `.gitignore` a ignora). O que não tem o carimbo do `_safe` não é dele e a poda nunca o toca.
- Regra e classes: ADR-0023 e o `AGENTS.md` (o que não se recupera nunca se apaga).
"""


class Refused(Exception):
    """`discard` or `retire` will not act on this path: its class forbids it. `.verdict` is the PathClass."""

    def __init__(self, verdict, message):
        super().__init__(message)
        self.verdict = verdict


class RemovalFailed(Exception):
    """The path was allowed to go and the removal failed (no permission to delete, a locked file, git refused)."""


def versioned(path):
    """True when git versions `path` or anything under it - and when git cannot be asked (cannot prove it is not).

    harness-kaizen 2026-10-23 21:11: a cleanup deleted 1,628 versioned images once. What git holds is the MJRP's evidence, not a
    derived capture, whatever folder it sits in (`reports/evidence/UAT-visual/` has 3,000+ files in git)."""
    p = Path(path)
    probe = p if p.is_dir() else p.parent
    if not probe.is_dir():
        return False
    where = ["--", "."] if p.is_dir() else ["--", p.name]
    try:       # --literal-pathspecs: a name with [ * ? is that name, not a glob that matches other files (F70 B12)
        done = _git.run(probe, "--literal-pathspecs", "ls-files", *where, timeout=60)
    except _git.GitError:
        return True
    return done.code == 0 and bool(done.out.strip())     # 128: in no repository, nothing is versioned


def classify(path):
    """The class of `path` (see `_pathclass.classify`)."""
    return _pathclass.classify(path)


def _stamp():
    return _sp_now().strftime("%Y%m%d-%H%M%S")


def _toplevel(path):
    """The top folder of the git project that holds `path`, or None when it is in no repository (or git cannot say)."""
    p = Path(path).resolve()
    probe = p if p.is_dir() else p.parent
    if not probe.is_dir():
        return None
    top = _git.text_or_none(probe, "rev-parse", "--show-toplevel", timeout=30)
    return Path(top).resolve() if top else None


def backups_dir(ctx=None):
    """The `_backups/` of the project asked for (`ctx.root`); by default the repository these scripts live in."""
    return (ctx or Context.for_project()).root / "_backups"


def _project(path, root, ctx=None):
    """(root, backups folder) for `path`: the given `root`, else the project of `ctx`, else the toplevel of the project the
    path lives in, else this harness. The copy of a file of a child project goes to ITS `_backups/`, with its path inside that
    project - not to the harness's, with only the file name (F70 B11)."""
    if root is not None:
        top = Path(root).resolve()
    elif ctx is not None:
        top = Path(ctx.root).resolve()
    else:
        top = _toplevel(path) or Context.for_project().root.resolve()
    return top, top / "_backups"


def _make_backups(backups):
    """Creates `_backups/` and, the first time, its README: the folder says what it is (ADR-0023 § 4)."""
    backups.mkdir(exist_ok=True)
    readme = backups / BACKUPS_README
    if not readme.exists():
        readme.write_text(README_TEXT, encoding="utf-8")


NAME_MAX_BYTES = 255                    # the file-system limit of one name (macOS and Linux), in UTF-8 bytes
_NAME_RESERVE = len(".YYYYMMDD-HHMMSS") + len(".99999")      # what `_unique_dest` appends: the stamp and a `.n` of up to 5 digits


def _fit_name(rel):
    """`rel` (a path with / as __) cut to what leaves room for the stamp and the `.n` within `NAME_MAX_BYTES` bytes. What fits is returned
    as it is. What does not keeps the END of the path (it says which file the copy is) behind `<12 hex of the sha256 of the whole path>~`,
    so two long paths that end alike do not collide and the origin can still be checked (F243, UAT-569: a worktree's copy path passed 255
    bytes and the cleaning stopped with Errno 63). The stamp stays the tail, so `_STAMPED` and the pruning still recognize the copy."""
    room = NAME_MAX_BYTES - _NAME_RESERVE
    if len(rel.encode("utf-8")) <= room:
        return rel
    head = hashlib.sha256(rel.encode("utf-8")).hexdigest()[:12] + "~"
    tail = rel.encode("utf-8")[-(room - len(head)):]
    return head + tail.decode("utf-8", errors="ignore")      # a cut inside a multi-byte letter drops that letter's stray bytes


def _unique_dest(path, top, backups):
    """A name in `backups` that does not exist yet: `<path from the project root, / as __>.<stamp>[.n]`. Two copies in the
    same second get `.1`, `.2`... - never the same name (a second `copy2` would overwrite the first)."""
    path = Path(path)
    # a symlink is named by where IT sits, not by its target (UAT-488, the recheck's P2-6: the copy of a link is the link)
    resolved = path.parent.resolve() / path.name if path.is_symlink() else path.resolve()
    try:
        rel = resolved.relative_to(top).as_posix().replace("/", "__")
    except ValueError:                    # outside the project: keep the whole path so the origin is not lost
        rel = "abs" + resolved.as_posix().replace("/", "__")
    rel = _fit_name(rel)
    dest = backups / f"{rel}.{_stamp()}"
    n = 1
    while dest.exists():
        dest = backups / f"{rel}.{_stamp()}.{n}"
        n += 1
    return dest


def _is_derived(path):
    """Derived by what the PROJECT declares: the library protects a project's files, it does not judge the $TMPDIR (that is
    `discard`'s and the guard's, with the global entries)."""
    return _pathclass.classify(path, scope="project").klass == DERIVED


def retire_path(path, root=None, ctx=None):
    """Move `path` para _backups/ em vez de apagar. Devolve o destino, ou None.
    `root` / `ctx`: the project the path belongs to; by default the toplevel of the git project that holds it.
    A derived path (class 3) is not copied: it is discarded, because whoever creates it deletes it (ADR-0023 § 1)."""
    path = Path(path)
    if not path.exists():
        return None
    if _is_derived(path):
        _discard_derived(path)
        print(f"  derivado regenerável: removido sem cópia — {path.name}")
        return None
    top, backups = _project(path, root, ctx)
    _make_backups(backups)
    dest = _unique_dest(path, top, backups)
    shutil.move(str(path), str(dest))
    print(f"  backup: {path.name} -> {backups.name}/{dest.name}")
    _after_copy(top, dest)
    return dest


def snapshot(path, root=None, ctx=None, follow_symlinks=True):
    """Copy `path` into _backups/ WITHOUT removing it. For in-place overwrites. Same `root` / `ctx` rule as `retire_path`.
    `follow_symlinks=False` copies a symlink as the link itself (where it pointed), broken or not - what `restore` loses when git
    puts the committed link back (UAT-488, P2-6); the default follows it, as a write through the link changes the target."""
    path = Path(path)
    link = not follow_symlinks and path.is_symlink()
    if not (path.exists() or link):
        return None
    if _is_derived(path):
        return None   # a derived path is never copied into _backups/
    top, backups = _project(path, root, ctx)
    _make_backups(backups)
    dest = _unique_dest(path, top, backups)          # the same collision loop as retire_path (F70 B10)
    if link or path.is_file():
        shutil.copy2(str(path), str(dest), follow_symlinks=not link)
    else:
        shutil.copytree(str(path), str(dest))
    print(f"  backup: {path.name} -> {backups.name}/{dest.name}")
    _after_copy(top, dest)
    return dest


# ---------------------------------------------------------------- the removal: ONE door

def _no_permission_hint(error):
    return (f"{error.__class__.__name__}: {error}. A ponte de arquivos do Cowork não tem a permissão de apagar até o MJRP "
            f"concedê-la; o `git` e este comando deixam sobra sem ela (AGENTS.md, protocolo de sessão)")


def _discard_derived(path):
    """Removes a path already judged class 3. Raises RemovalFailed with the reason; a linked worktree goes through git."""
    p = Path(path)
    try:
        if _pathclass.is_linked_worktree(p):
            dirs = _pathclass.git_dirs(p)
            main_tree = dirs[1].parent
            done = _git.run(main_tree, "worktree", "remove", str(p.resolve()), timeout=120)
            if done.code != 0:
                raise RemovalFailed(f"o `git worktree remove` recusou: {done.err.strip() or done.out.strip()}")
        elif p.is_symlink() or p.is_file():
            p.unlink()
        else:
            shutil.rmtree(p)
    except RemovalFailed:
        raise
    except _git.GitError as e:
        raise RemovalFailed(f"o git não respondeu: {e}") from e
    except OSError as e:
        raise RemovalFailed(_no_permission_hint(e)) from e
    if p.exists() or p.is_symlink():
        raise RemovalFailed("o caminho continua lá depois da remoção (sobra de uma remoção parcial)")


def _refusal_text(verdict, verb):
    if verdict.klass == VERSIONED:
        return f"{verdict}. Sai por commit (`git rm`), não por `{verb}`."
    if verdict.klass == ROTATING:
        return f"{verdict}. Quem sobrescreve e poda é o dono (veja `owner` em `structure_rules.json`), não `{verb}`."
    return f"{verdict}. Não se apaga: se precisa sair do lugar, `python3 mjrp-scripts/_safe.py retire <caminho>` move para `_backups/`."


def discard(path):
    """The only removal. Returns the PathClass of what went (always DERIVED), or None when the path is already gone. Raises
    Refused when its class forbids it and RemovalFailed when the removal failed."""
    p = _pathclass.lexical(path)
    if not (p.exists() or p.is_symlink()):
        return None
    verdict = _pathclass.classify(p)
    if verdict.klass != DERIVED:
        raise Refused(verdict, _refusal_text(verdict, "discard"))
    _discard_derived(p)
    return verdict


def retire(path, root=None, ctx=None):
    """`retire_path` for the command line: class 1 moves into `_backups/`, class 3 is discarded, 2 and 4 are refused (and a
    linked worktree that is not class 3 is never moved - git keeps a pointer to where it lives). Returns the destination, or
    None when nothing was moved."""
    p = _pathclass.lexical(path)
    if not (p.exists() or p.is_symlink()):
        return None
    verdict = _pathclass.classify(p)
    if verdict.klass in (VERSIONED, ROTATING):
        raise Refused(verdict, _refusal_text(verdict, "retire"))
    if verdict.klass == DERIVED:
        discard(p)
        print(f"  derivado regenerável: removido sem cópia — {p.name}")
        return None
    if _pathclass.is_linked_worktree(p):
        raise Refused(verdict, f"{verdict}. Um worktree não se move para `_backups/` (o git guarda onde ele mora): "
                               f"commite e mescle o ramo, depois `python3 mjrp-scripts/_safe.py discard <caminho>`.")
    top, backups = _project(p, root, ctx)
    if backups.resolve() == p or p in backups.resolve().parents:
        raise Refused(verdict, f"{verdict}. Não dá para mover `{p.name}` para o `_backups/` que mora dentro dele: é a raiz de um projeto. "
                               f"Mova-o para fora com `mv` (o `_backups/` dele vai junto) ou commite o que importa; se for um rascunho no "
                               f"`$TMPDIR`, ele é derivado e sai por `discard`.")
    _make_backups(backups)
    dest = _unique_dest(p, top, backups)
    try:
        shutil.move(str(p), str(dest))
    except OSError as e:
        raise RemovalFailed(_no_permission_hint(e)) from e
    print(f"  backup: {p.name} -> {backups.name}/{dest.name}")
    _after_copy(top, dest)
    return dest


def restore(path, root=None, keep=True):
    """Puts the committed content back into a TRACKED file that has an uncommitted edit (or is gone), after the edit is copied into
    `_backups/` (of `root`, when given: `release_worktree` keeps the copy in the MAIN checkout, not in the worktree that is about to go).
    `keep=False` skips the copy: `release_worktree` passes it for a trace the main's rules declare derived (a build output: a derived path
    never goes to `_backups/`, ADR-0023 section 1; F207 recheck P2-1). Returns the copy's path, or None when there was nothing to copy (the file was already gone, or already clean).
    Refuses (Refused) a path git does not track (nothing to restore from), a folder (name the files), and a file with a STAGED change
    (the index would give back the staged text, not the committed one: `git restore --staged <file>` first). It is the named door the deletion
    guard's message points to: the guard still refuses a bare `git restore` over an edit, and this keeps the edit before it goes."""
    p = _pathclass.lexical(path)
    top = _toplevel(p)
    if top is None:
        raise Refused(None, f"{p} não está num repositório git: não há de onde restaurar.")
    try:
        rel = p.relative_to(top).as_posix()
    except ValueError:
        raise Refused(None, f"{p} está fora do repositório {top}.") from None
    if p.is_dir() and not p.is_symlink():
        raise Refused(None, f"{p} é uma pasta: restaure os arquivos um a um (o `git status` lista quais mudaram).")
    try:
        tracked = _git.run(top, "--literal-pathspecs", "ls-files", "--error-unmatch", "--", rel, timeout=60).code == 0
        staged = _git.run(top, "--literal-pathspecs", "diff", "--cached", "--quiet", "--", rel, timeout=60).code != 0
        changed = _git.run(top, "--literal-pathspecs", "diff", "--quiet", "--", rel, timeout=60).code != 0
    except _git.GitError as e:
        raise RemovalFailed(f"o git não respondeu: {e}") from e
    if not tracked:
        raise Refused(None, f"{rel} não é rastreado pelo git: não há conteúdo commitado para devolver. "
                            f"Se é seu e não importa, `python3 mjrp-scripts/_safe.py retire {rel}` o tira do lugar.")
    if staged:
        raise Refused(None, f"{rel} tem mudança no índice (staged): `git restore --staged {rel}` primeiro, para o git devolver o texto commitado.")
    if not changed:
        return None
    try:
        dest = snapshot(p, root=root, follow_symlinks=False) if keep and (p.exists() or p.is_symlink()) else None
    except OSError as e:          # UAT-488, P2-4: disk full, `_backups/` read-only - nothing is restored without the copy
        raise RemovalFailed(f"a cópia da edição para `_backups/` falhou ({e.strerror or e}): nada foi restaurado, a edição ficou como estava") from e
    done = _git.run(top, "--literal-pathspecs", "restore", "--", rel, timeout=60)
    if done.code != 0:
        raise RemovalFailed(f"o `git restore` falhou: {done.err.strip() or done.out.strip()}")
    return dest


def release_worktree(path, glob_rules=None):
    """The step BEFORE judging a merged worktree (UAT-401, F120; the integrator's `clean-worktrees --apply` runs it, then `discard`).

    A merged, clean worktree held only by what its own session left behind - the rotating `.mjrp/` of an ENDED session, the stamped
    copies in its `_backups/`, the unstaged rewrite of a tracked trace (`rewritten_traces`: the doctor's `daily-checks/sensor-*.md`, the
    build of an old branch) and an untracked file `derived` covers (F207, UAT-527) - is class 3 once those leave (`_pathclass.judge_worktree` says so, by the rules committed on `main`). This
    makes it true: the stamped copies are MOVED into the main checkout's `_backups/` (the same stamp-and-prune door as `retire_path`, so
    nothing is lost and the 30-day / 1 GB ceiling applies), and the session entries of `.mjrp/` are removed (a lease and a turn file are
    rewritten by the next session; they hold no words of the MJRP).

    It acts ONLY when the worktree would be class 3 afterwards: a dirty one, an unmerged one, a locked one, one with a stray ignored file
    (a `.env`) or with a live session is left exactly as it is - class 1 protection is untouched. Returns the ReleasePlan carried out (an
    empty one when there was nothing to do), or None when the worktree was not released. Raises RemovalFailed when a removal fails (the
    copies already moved stay moved)."""
    p = Path(path)
    verdict, plan = _pathclass.judge_worktree(p, glob_rules)
    if verdict.klass != DERIVED:
        return None
    if not plan.paths:
        return plan
    main = _pathclass.main_checkout(p)
    if (plan.copies or plan.restored) and main is None:
        raise RemovalFailed("não achei o checkout principal para guardar as cópias do `_backups/`; nada foi movido")
    rules = None
    if plan.restored or plan.strays:
        try:
            rules = _pathclass.main_rules(p)      # the judge's rules (the main's), not the old ones the worktree carries (UAT-364)
        except ValueError as e:
            raise RemovalFailed(f"as regras da `main` não puderam ser lidas ({e}); os rastros e os derivados não rastreados ficaram") from e
    declared = _pathclass.Declared(rules, _pathclass.empty_rules(), p.resolve()) if rules else None
    batch = []                                           # gone, or derived: nothing to copy, so one `git restore` for all (F207 recheck P2-3)
    for trace in plan.restored:
        keep = declared.kind(trace, False) != DERIVED
        if not keep or not (trace.exists() or trace.is_symlink()):
            batch.append(trace)
            continue
        try:
            restore(trace, root=main, keep=True)
        except Refused as e:
            raise RemovalFailed(f"o rastro `{trace.name}` não voltou ao último commit: {e}") from e
        print(f"  rastro reescrito: {trace.name} voltou ao último commit em {p.name}")
    _restore_batch(p.resolve(), batch)
    if plan.strays:
        for stray in plan.strays:
            verdict = _pathclass.classify(stray, rules=rules)
            if verdict.klass != DERIVED:
                raise RemovalFailed(f"`{stray.name}` deixou de ser derivado antes da remoção ({verdict}); ele e os seguintes ficaram")
            _discard_derived(stray)
            print(f"  derivado não rastreado: {stray.name} saiu de {p.name}")
    _move_copies(p, plan.copies)
    mjrp = p.resolve() / ".mjrp"
    for item in plan.runtime:
        if item.parent != mjrp or item.is_symlink():
            continue                                     # the plan only lists direct children of `.mjrp/`; anything else is not ours
        try:
            shutil.rmtree(item) if item.is_dir() else item.unlink()
        except OSError as e:
            raise RemovalFailed(_no_permission_hint(e)) from e
        print(f"  sessão encerrada: {item.name} saiu do .mjrp/ de {p.name}")
    return plan


def _move_copies(p, copies):
    """Moves each stamped copy into the main checkout's `_backups/` (the stamp-and-prune door of `retire_path`). Returns the destinations."""
    main = _pathclass.main_checkout(p)
    if copies and main is None:
        raise RemovalFailed("não achei o checkout principal para guardar as cópias do `_backups/`; nada foi movido")
    moved = []
    for copy in copies:
        backups = main / "_backups"
        _make_backups(backups)
        dest = _unique_dest(copy, main, backups)
        try:
            shutil.move(str(copy), str(dest))
        except OSError as e:
            raise RemovalFailed(_no_permission_hint(e)) from e
        print(f"  backup: {copy.name} -> {backups.name}/{dest.name}")
        _after_copy(main, dest)
        moved.append(dest)
    return moved


def move_backup_copies(path, glob_rules=None):
    """The step BEFORE a page session archives itself (F206, S-218): the app removes the worktree with the session, branch merged or not,
    so the stamped copies directly in `<worktree>/_backups/` move into the main checkout's `_backups/` first - the same move
    `release_worktree` makes for a merged one, without its merged-and-clean condition (the close check judged the rest). Only the copies
    the rules committed on `main` declare rotating; anything else in `_backups/` stays, and `_pathclass.archive_blockers` names it.
    Returns the destinations; raises RemovalFailed when a move fails (the copies already moved stay moved)."""
    p = Path(path)
    top = p.resolve()
    try:
        declared = _pathclass.Declared(_pathclass.main_rules(p), glob_rules if glob_rules is not None else _pathclass.global_rules(), top)
    except (ValueError, _git.GitError) as e:
        raise RemovalFailed(f"as regras da `main` não puderam ser lidas ({e}); nada foi movido") from e
    return _move_copies(p, _pathclass.release_plan(top, declared).copies)


def _restore_batch(top, paths, chunk=200):
    """`git restore` of the tracked files `paths` of the worktree at `top` with nothing to copy (gone, or derived by the main's rules): one
    git call per `chunk` instead of three per file - a worktree of the MJRPpersonal had 950 of them. Only `release_worktree` calls it, with
    the paths its plan already proved unstaged (` M` or ` D`). Raises RemovalFailed when git refuses."""
    rels = [x.relative_to(top).as_posix() for x in paths]
    for i in range(0, len(rels), chunk):
        try:                                             # the index NOW: a change staged after the plan would win over the disk (recheck P2-R3-1)
            staged = _git.run(top, "--literal-pathspecs", "diff", "--cached", "--name-only", "--", *rels[i:i + chunk], timeout=60)
            if staged.code != 0 or staged.out.strip():
                raise RemovalFailed(f"mudança no índice depois do plano ({staged.out.strip().splitlines()[0] if staged.out.strip() else staged.err.strip()}); nada foi restaurado neste lote")
            done = _git.run(top, "--literal-pathspecs", "restore", "--", *rels[i:i + chunk], timeout=120)
        except _git.GitError as e:
            raise RemovalFailed(f"o git não respondeu: {e}") from e
        if done.code != 0:
            raise RemovalFailed(f"o `git restore` falhou: {done.err.strip() or done.out.strip()}")
    if rels:
        print(f"  rastro reescrito: {len(rels)} arquivo(s) sem cópia (apagado ou derivado) voltaram ao último commit em {top.name}")


def backups_size(ctx=None):
    """(count, bytes) of what is stored in the `_backups/` of `ctx` - so the caller can warn about it."""
    backups = backups_dir(ctx)
    if not backups.exists():
        return 0, 0
    items = [i for i in backups.iterdir() if i.name != BACKUPS_README]      # the README says what the folder is; it is not a copy
    total = sum(f.stat().st_size for f in backups.rglob("*") if f.is_file() and f.name != BACKUPS_README)
    return len(items), total

_STAMPED = re.compile(r"^(.*)\.\d{8}-\d{6}(\.\d+)?$")
_STAMPED_AT = re.compile(r"^.*\.(\d{8}-\d{6})(?:\.\d+)?$")


def prune(keep, ctx=None):
    """OPT-IN pruning: keeps the `keep` most recent copies of each file. Touches only _backups/.

    The group of a copy is its name without the `.<YYYYMMDD-HHMMSS>[.n]` this module appended, matched by an anchored
    regex. Anything in `_backups/` that does not have that tail was not made by this module (a `scratch-keep`, a
    `mjrp-skills`, the README) and is left alone - the old key cut at the first `.2` of any name, so `design__v1.2.svg` and
    `design__v1.2.md` shared a group and one was deleted for good (F70 B9)."""
    backups = backups_dir(ctx)
    if not backups.exists():
        return
    groups, held = {}, _versioned_names(backups)
    for item in backups.iterdir():
        m = _STAMPED.match(item.name)
        if m and item.name not in held:
            groups.setdefault(m.group(1), []).append(item)
    for _key, items in groups.items():
        items.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        for old in items[keep:]:
            shutil.rmtree(old) if old.is_dir() else old.unlink()
            print(f"  podado: _backups/{old.name}")


DEFAULT_CEILING = {"max_days": 30, "max_gb": 1}      # ADR-0023 section 3, as decided under the MJRP's delegation (log 2026-10-26 01:08)


def _ceiling(top):
    """The `retired-backups` budget of the project (structure_rules.json), or the default."""
    try:
        for entry in _pathclass.project_rules(top)["budgets"]["project"]:
            if entry.get("id") == "retired-backups":
                return {**DEFAULT_CEILING, **{k: entry[k] for k in ("max_days", "max_gb") if k in entry}}
    except ValueError:
        pass
    return dict(DEFAULT_CEILING)


def _tree_size(path):
    total = 0
    for root, _dirs, files in os.walk(path):
        for name in files:
            try:
                total += (Path(root) / name).lstat().st_size
            except OSError:
                continue
    return total


def _versioned_names(backups):
    """The names directly in `backups` that git versions (or holds something under): a project that versions its `_backups/` (the
    MJRPpersonal) keeps those copies in git, and the pruning never removes them (class 2 leaves by `git rm`; F207). When git cannot be
    asked, every name: nothing is pruned (the safe side)."""
    try:
        done = _git.run(backups, "ls-files", "-z", "--", ".", timeout=60)
    except _git.GitError:
        return {i.name for i in backups.iterdir()}
    if done.code == 128 and _toplevel(backups) is None:
        return set()                                     # in no repository: nothing is versioned
    if done.code != 0:                                   # any other failure (128 inside a repository too): nothing is pruned
        return {i.name for i in backups.iterdir()}
    return {n.split("/")[0] for n in done.out.split("\0") if n}


def prune_to_ceiling(top, keep=None):
    """The OWNER's automatic pruning (ADR-0023 sections 3 and 4): after each copy, removes the stamped copies older than the ceiling's
    days and, while `_backups/` is over its GB, the oldest stamped ones. Only entries that carry this module's stamp (class 4) and that git does
    not version are touched -
    never a `scratch-keep`, the README or `mjrp-skills/` - and never `keep` (the copy just made). Returns the names removed."""
    backups = Path(top) / "_backups"
    if not backups.is_dir():
        return []
    ceiling = _ceiling(top)
    now, stamped = _sp_now().replace(tzinfo=None), []
    held = _versioned_names(backups)
    for item in backups.iterdir():
        m = _STAMPED_AT.match(item.name)
        if m and item != keep and item.name not in held:
            try:
                stamped.append((datetime.strptime(m.group(1), "%Y%m%d-%H%M%S"), item))
            except ValueError:
                continue
    stamped.sort(key=lambda pair: pair[0])
    removed = []

    def drop(item):
        shutil.rmtree(item) if item.is_dir() and not item.is_symlink() else item.unlink()
        removed.append(item.name)
        print(f"  podado (teto do _backups/): {item.name}")

    for moment, item in list(stamped):
        if (now - moment).total_seconds() > float(ceiling["max_days"]) * 86400:
            drop(item)
            stamped.remove((moment, item))
    limit = float(ceiling["max_gb"]) * 1024 ** 3
    # the GB counts only what the pruning may remove: a versioned `_backups/` past the ceiling would otherwise sweep every unversioned
    # copy, of any age, on each new copy (F207 recheck round 2, P2-1)
    size = sum(_tree_size(i) if i.is_dir() and not i.is_symlink() else i.lstat().st_size
               for i in backups.iterdir() if i.name not in held and i.name != BACKUPS_README)
    while stamped and size > limit:
        _moment, item = stamped.pop(0)
        size -= _tree_size(item) if item.is_dir() else item.lstat().st_size
        drop(item)
    return removed


def _after_copy(top, dest):
    """Runs the owner's pruning after a copy, never failing the caller: a copy that was made stays made."""
    try:
        prune_to_ceiling(top, keep=dest)
    except OSError as e:
        print(f"  (a poda do _backups/ não rodou: {e})")


# ---------------------------------------------------------------- the command line

USAGE = """uso: python3 mjrp-scripts/_safe.py <comando> <caminho>...

  discard   a única remoção: só o derivado (classe 3) sai; as outras classes são recusadas, com o motivo
  retire    move para `_backups/` com carimbo (classe 1); o derivado é removido, o versionado e o rotativo são recusados
  restore   devolve o conteúdo commitado de um arquivo RASTREADO que o build reescreveu, guardando antes a edição em `_backups/`
  classify  diz a classe do caminho e por quê

saída: 0 feito · 1 recusado ou a remoção falhou (o motivo vai na mensagem) · 2 uso errado"""


def main(argv):
    if len(argv) < 2 or argv[0] not in ("discard", "retire", "restore", "classify"):
        print(USAGE, file=sys.stderr)
        return 2
    verb, failed = argv[0], False
    for raw in argv[1:]:
        try:
            if verb == "classify":
                print(f"{raw}: {_pathclass.classify(raw)}")
            elif verb == "discard":
                done = discard(raw)
                print(f"  já não existe: {raw}" if done is None else f"  removido (classe 3, derivado): {raw}")
            elif verb == "restore":
                gone = not (Path(raw).exists() or Path(raw).is_symlink())
                kept = restore(raw)
                # UAT-488, P2-5: a file that was gone comes back - that is not «já estava igual»
                print(f"  restaurado do último commit: {raw}" + (f" (a edição ficou em _backups/{kept.name})" if kept
                                                                  else " (estava apagado; nada a guardar)" if gone else " (já estava igual)"))
            else:
                if retire(raw) is None and not (Path(raw).exists() or Path(raw).is_symlink()):
                    print(f"  já não existe: {raw}")
        except Refused as e:
            print(f"_safe {verb}: RECUSADO {raw}: {e}", file=sys.stderr)
            failed = True
        except RemovalFailed as e:
            print(f"_safe {verb}: FALHOU {raw}: {e}", file=sys.stderr)
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
