# cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_safe.py - the ONE way a harness script (and the agent) removes or moves a path (ADR-0023; F74).

What cannot be recovered is never deleted; what can be recovered has an owner and a ceiling. The class of a path comes from
`_pathclass.classify` (1 irreplaceable, 2 versioned, 3 derived, 4 rotating); this module acts on it:

  discard <path>   the only removal. Class 3 (derived) goes; classes 1, 2 and 4 are refused with the reason (exit 1). When the
                   removal itself fails - the file bridge has no permission to delete - it exits 1 with the reason, never 0.
  retire  <path>   moves the path into `_backups/` with a timestamp (class 1). A derived path is discarded instead (it never
                   goes to `_backups/`); a versioned one leaves by `git rm`, a rotating one by its owner.
  classify <path>  prints the class and why.

`release_worktree` (no verb: `merge_train.py clean-worktrees --apply` calls it before `discard`) empties a merged, clean worktree of the
rotating `.mjrp/` of an ended session and of its stamped `_backups/` copies - the copies move into the MAIN checkout's `_backups/`.

`_backups/` is gitignored and grows: it is the safety net against the agent's mistake, NOT a backup (it lives on the same disk;
see its README.md, which this module writes). The owner prunes it by itself: after each copy, `prune_to_ceiling` removes the stamped
copies older than the ceiling's days and the oldest ones while the folder is over its GB (`structure_rules.json -> budgets`, the
`retired-backups` entry: 30 days and 1 GB) - only what carries this module's stamp, never the copy just made. `prune(N)` (`--prune N`,
opt-in) is the manual one, by count. Neither touches repository content.

Which project's `_backups/` is the project ASKED FOR, passed as a value (F73 TASK-18, R12; DP-17 Context Object): `ctx=` a
`_context.Context` (its `root`), or `root=` a folder, or - when neither is given - the top of the git project that holds the path,
or - when the path is in no repository - the repository these scripts live in. There is no module-level ROOT or BACKUPS.
"""
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


def _unique_dest(path, top, backups):
    """A name in `backups` that does not exist yet: `<path from the project root, / as __>.<stamp>[.n]`. Two copies in the
    same second get `.1`, `.2`... - never the same name (a second `copy2` would overwrite the first)."""
    resolved = Path(path).resolve()
    try:
        rel = resolved.relative_to(top).as_posix().replace("/", "__")
    except ValueError:                    # outside the project: keep the whole path so the origin is not lost
        rel = "abs" + resolved.as_posix().replace("/", "__")
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


def snapshot(path, root=None, ctx=None):
    """Copy `path` into _backups/ WITHOUT removing it. For in-place overwrites. Same `root` / `ctx` rule as `retire_path`."""
    path = Path(path)
    if not path.exists():
        return None
    if _is_derived(path):
        return None   # a derived path is never copied into _backups/
    top, backups = _project(path, root, ctx)
    _make_backups(backups)
    dest = _unique_dest(path, top, backups)          # the same collision loop as retire_path (F70 B10)
    shutil.copy2(str(path), str(dest)) if path.is_file() else shutil.copytree(str(path), str(dest))
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


def release_worktree(path, glob_rules=None):
    """The step BEFORE judging a merged worktree (UAT-401, F120; the integrator's `clean-worktrees --apply` runs it, then `discard`).

    A merged, clean worktree held only by what its own session left behind - the rotating `.mjrp/` of an ENDED session and the stamped
    copies in its `_backups/` - is class 3 once those leave (`_pathclass.judge_worktree` says so, by the rules committed on `main`). This
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
    if plan.copies and main is None:
        raise RemovalFailed("não achei o checkout principal para guardar as cópias do `_backups/`; nada foi movido")
    for copy in plan.copies:
        backups = main / "_backups"
        _make_backups(backups)
        dest = _unique_dest(copy, main, backups)
        try:
            shutil.move(str(copy), str(dest))
        except OSError as e:
            raise RemovalFailed(_no_permission_hint(e)) from e
        print(f"  backup: {copy.name} -> {backups.name}/{dest.name}")
        _after_copy(main, dest)
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
    groups = {}
    for item in backups.iterdir():
        m = _STAMPED.match(item.name)
        if m:
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


def prune_to_ceiling(top, keep=None):
    """The OWNER's automatic pruning (ADR-0023 sections 3 and 4): after each copy, removes the stamped copies older than the ceiling's
    days and, while `_backups/` is over its GB, the oldest stamped ones. Only entries that carry this module's stamp (class 4) are touched -
    never a `scratch-keep`, the README or `mjrp-skills/` - and never `keep` (the copy just made). Returns the names removed."""
    backups = Path(top) / "_backups"
    if not backups.is_dir():
        return []
    ceiling = _ceiling(top)
    now, stamped = _sp_now().replace(tzinfo=None), []
    for item in backups.iterdir():
        m = _STAMPED_AT.match(item.name)
        if m and item != keep:
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
    size = _tree_size(backups)
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
  classify  diz a classe do caminho e por quê

saída: 0 feito · 1 recusado ou a remoção falhou (o motivo vai na mensagem) · 2 uso errado"""


def main(argv):
    if len(argv) < 2 or argv[0] not in ("discard", "retire", "classify"):
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
