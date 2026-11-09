# cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_pathclass.py - the four classes of a path, decided by machine (ADR-0023 § 1; F74 TASK-03; the engine of `_safe.py discard`
and of the deletion guard hook).

  1 IRREPLACEABLE  outside git AND outside the derived list; or an uncommitted edit of a versioned file. Nobody deletes it.
  2 VERSIONED      git tracks it and the content is committed. Leaves only by a commit (`git rm`), never by `rm`.
  3 DERIVED        not versioned AND declared in `structure_rules.json -> derived`; or a LINKED WORKTREE that passes the four
                   git tests below. Whoever creates it, deletes it.
  4 ROTATING       declared in `structure_rules.json -> rotating`: the owner overwrites and prunes it (ADR-0023 § 1, class 4).

`classify(path)` is the ONE function that answers. What it cannot answer (git does not respond, the path is ambiguous, a rules
file is unreadable) falls into class 1: the safe side. It reads the rules of the PROJECT THAT CONTAINS THE PATH (the git
toplevel's `mjrp-scripts/structure_rules.json`), never the harness's rules for a child (DP-17: the project is a value, not a
global); outside any project only the GLOBAL entries apply, and those are read beside this file.

The rules sections are append-only (VT-05: a section is added, an existing key is never changed). Missing section = empty list.
Format (the F75 daily backup reads the same `derived.project` list for its exclusions):

    "derived":  {"project": [{"glob": "**/node_modules/", "owner": "npm install", "why": "rebuilt from package-lock.json"}],
                 "global":  [{"glob": "$TMPDIR/",          "owner": "...",         "why": "..."}]}
    "rotating": {"project": [...same entry shape...], "global": [...]}
    "budgets":  {"project": [...], "global": [...]}                 (read by the doctor's W18, see _doctor_budgets.py)
    "released_copies": {"project": [{"source": "STRUCTURE.md", "owner": "mjrp-scripts/tree.py", "why": "..."}], "global": []}
                 (read only by the judge of a MERGED WORKTREE: see `_release_test`)
    "rewritten_traces": {"project": [{"glob": "**/daily-checks/sensor-*.md", "owner": "...", "why": "..."}], "global": []}
                 (read only by the judge of a MERGED WORKTREE: see `release_plan`)

A `glob` is relative to the project root (`project`) or absolute (`global`; `$TMPDIR`, `${TMPDIR}` and a leading `~` are
expanded). `*` and `?` do not cross a `/`; a segment `**` is any number of folders; a trailing `/` says "folders only". A glob
that matches a folder covers everything under it. Linked worktrees are NOT listed: the four git tests decide them.

A FOLDER takes the most protective class of what it holds (1 > 2 > 4 > 3): it is derived only if everything in it is.
A SYMLINK is classified as the link, never as its target - but a link to a folder (or a dangling one) is "folder-like" for a glob that
ends in `/`: the `node_modules` of a worktree is a link into the main checkout's, and `**/node_modules/` must cover it (UAT-401, F120).

A MERGED WORKTREE that is held only by what its own session left behind (the rotating `.mjrp/` of an ENDED session, the stamped copies
in its `_backups/`, the unstaged rewrite of a tracked file declared in `rewritten_traces`, an untracked file `derived` covers) is judged by `judge_worktree`: it says what would leave first (`ReleasePlan`) and judges the worktree as if it had.
`_safe.release_worktree` is what makes it so, and moves the copies into the MAIN checkout's `_backups/` (nothing is lost).

Stdlib only: this module travels to the child projects with the kernel (VENDORED_FILES, the `_*.py` rule).
"""
import fnmatch
import json
import os
import re
import tempfile
import time
from pathlib import Path
from typing import NamedTuple

import _git

IRREPLACEABLE, VERSIONED, DERIVED, ROTATING = 1, 2, 3, 4
NAMES = {IRREPLACEABLE: "insubstituível", VERSIONED: "versionado", DERIVED: "derivado", ROTATING: "rotativo"}
_PROTECTION = {IRREPLACEABLE: 4, VERSIONED: 3, ROTATING: 2, DERIVED: 1}      # the more protective class wins in a folder
RULES_FILE = "structure_rules.json"
SECTIONS = ("derived", "rotating", "budgets", "released_copies", "rewritten_traces")
MAIN_REF = "refs/heads/main"


class PathClass(NamedTuple):
    klass: int
    reason: str

    @property
    def name(self):
        return NAMES[self.klass]

    def __str__(self):
        return f"classe {self.klass} ({self.name}): {self.reason}"


def _worst(*classes):
    """The most protective of several PathClass (1 > 2 > 4 > 3)."""
    return max(classes, key=lambda c: _PROTECTION[c.klass])


# ---------------------------------------------------------------- the rules

def empty_rules():
    return {s: {"project": [], "global": []} for s in SECTIONS}


def _parse_rules(text, label):
    """The rules in `text` (the content of a rules file; `label` names its origin in the error): a section missing is an empty
    list. Raises ValueError when the text cannot be read."""
    try:
        data = json.loads(text)
    except ValueError as e:
        raise ValueError(f"{label}: {e}") from e
    if not isinstance(data, dict):
        raise ValueError(f"{label}: deve ser um objeto")
    out = empty_rules()
    for section in SECTIONS:
        block = data.get(section) or {}
        if not isinstance(block, dict):
            raise ValueError(f"{label}: `{section}` deve ser um objeto com `project` e `global`")
        for scope in ("project", "global"):
            entries = block.get(scope) or []
            if not isinstance(entries, list) or any(not isinstance(e, dict) for e in entries):
                raise ValueError(f"{label}: `{section}.{scope}` deve ser uma lista de objetos")
            out[section][scope] = entries
    return out


def _read_rules_file(path):
    """The rules of one file: a section missing is an empty list. Raises ValueError when the file cannot be read."""
    try:
        text = Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return empty_rules()
    except (OSError, ValueError) as e:
        raise ValueError(f"{path}: {e}") from e
    return _parse_rules(text, str(path))


def project_rules(project_root):
    """The rules of the project at `project_root` (its own `mjrp-scripts/structure_rules.json`); empty when it has none."""
    return _read_rules_file(Path(project_root) / "mjrp-scripts" / RULES_FILE)


GLOBAL_RULES_ENV = "MJRP_GLOBAL_RULES"      # a rules file to read the global entries from instead (the selftests: the machine's $TMPDIR is not theirs)


def global_rules():
    """The global entries: the rules file that sits beside this module (the harness's, or the child's vendored copy), or the one
    `MJRP_GLOBAL_RULES` names."""
    return _read_rules_file(os.environ.get(GLOBAL_RULES_ENV) or Path(__file__).with_name(RULES_FILE))


def tmpdir():
    return os.environ.get("TMPDIR") or tempfile.gettempdir()


def expand_global(glob):
    """The absolute forms of a global glob: `$TMPDIR`, `${TMPDIR}` and `~` expanded, with and without symlinks resolved (macOS
    keeps `/var/folders/...` beside `/private/var/folders/...`)."""
    g = glob.replace("${TMPDIR}", "$TMPDIR")
    forms = set()
    if "$TMPDIR" in g:
        td = tmpdir().rstrip("/")
        for base in {td, os.path.realpath(td)}:
            forms.add(g.replace("$TMPDIR", base))
    else:
        forms.add(g)
    out = set()
    for f in forms:
        f = os.path.expanduser(f)
        out.add(f)
        head = f.split("*", 1)[0].split("?", 1)[0].split("[", 1)[0]
        anchor = head if head.endswith("/") else head.rsplit("/", 1)[0] + "/"
        if anchor.startswith("/") and os.path.isdir(anchor):
            out.add(os.path.realpath(anchor).rstrip("/") + "/" + f[len(anchor):])
    return sorted(out)


# ---------------------------------------------------------------- glob matching

def _segments_match(parts, segs):
    """True when `parts` (path segments) match `segs` (glob segments) whole; `**` stands for any number of segments."""
    if not segs:
        return not parts
    head, rest = segs[0], segs[1:]
    if head == "**":
        return any(_segments_match(parts[i:], rest) for i in range(len(parts) + 1))
    return bool(parts) and fnmatch.fnmatchcase(parts[0], head) and _segments_match(parts[1:], rest)


def glob_covers(glob, parts, is_dir):
    """True when `glob` matches the path (given as segments) or one of its ancestor folders. A glob ending in `/` needs a
    folder: an ancestor always is one, the path itself only when `is_dir`."""
    segs = [s for s in glob.strip("/").split("/") if s != ""]
    dir_only = glob.endswith("/")
    for n in range(1, len(parts) + 1):
        if _segments_match(list(parts[:n]), segs):
            if n < len(parts) or is_dir or not dir_only:
                return True
    return False


def _entry_globs(entries):
    return [e["glob"] for e in entries if isinstance(e.get("glob"), str)]


class Declared:
    """The derived and rotating globs that apply to the paths of ONE project (or of none): the project's own, relative to its
    root, plus the global ones, absolute."""

    def __init__(self, project, glob_rules, top, releasable=None, departing=()):
        self.top = top
        self.departing = frozenset(Path(d) for d in departing)    # paths a worktree release will take away before the judge looks (F120)
        self.releasable = releasable              # callable(abs_path) -> bool: a rotating copy the judge of a merged worktree releases
        self.released_sources = [e["source"] for e in project["released_copies"]["project"] if isinstance(e.get("source"), str)] if top else []
        self.derived_rel = _entry_globs(project["derived"]["project"]) if top else []
        self.rotating_rel = _entry_globs(project["rotating"]["project"]) if top else []
        self.rewritten_rel = _entry_globs(project["rewritten_traces"]["project"]) if top else []
        self.derived_abs = [f for g in _entry_globs(glob_rules["derived"]["global"]) for f in expand_global(g)]
        self.rotating_abs = [f for g in _entry_globs(glob_rules["rotating"]["global"]) for f in expand_global(g)]

    def kind(self, abs_path, is_dir):
        """ROTATING, DERIVED or None for what the declarations say about this path alone (rotating wins over derived).
        A path that is about to leave (`departing`) is DERIVED: the release takes it before anything is removed."""
        if self.departing and Path(abs_path) in self.departing:
            return DERIVED
        if not is_dir and _folder_link(abs_path):
            is_dir = True                       # `web/node_modules` linked into the main checkout: a link to a folder meets `**/node_modules/`
        parts_abs = Path(abs_path).parts[1:]
        parts_rel = None
        if self.top:
            try:
                parts_rel = Path(abs_path).relative_to(self.top).parts
            except ValueError:
                parts_rel = None
        for kind, rel, absolute in ((ROTATING, self.rotating_rel, self.rotating_abs), (DERIVED, self.derived_rel, self.derived_abs)):
            if parts_rel and any(glob_covers(g, parts_rel, is_dir) for g in rel):
                if kind == ROTATING and self.releasable and not is_dir and self.releasable(Path(abs_path)):
                    return DERIVED
                return kind
            if any(glob_covers(g, parts_abs, is_dir) for g in absolute):
                return kind
        return None

    def rewritten(self, abs_path):
        """True when a tracked file at `abs_path` is a trace a tool rewrites in place (`rewritten_traces`, F207)."""
        try:
            parts = Path(abs_path).relative_to(self.top).parts if self.top else None
        except ValueError:
            return False
        return bool(parts) and any(glob_covers(g, parts, False) for g in self.rewritten_rel)


# ---------------------------------------------------------------- git helpers

def lexical(path):
    """The absolute path with the folders resolved but the last component left alone (a symlink stays a symlink)."""
    p = Path(os.path.abspath(os.path.expanduser(str(path))))
    return Path(os.path.realpath(p.parent)) / p.name if p.name else p


def _is_dir(p):
    return p.is_dir() and not p.is_symlink()


def _folder_link(path):
    """True for a symlink whose target is a folder, or that points at nothing (the target was removed): for a glob that ends in `/` the
    link stands for the folder it was made to replace. The link is still what is judged and what goes - never its target."""
    p = Path(path)
    return p.is_symlink() and (p.is_dir() or not p.exists())


def git_dirs(p):
    """(git dir, common git dir) of the work tree at `p`, or None."""
    r = _git.run(p, "rev-parse", "--git-dir", "--git-common-dir")
    lines = r.out.split("\n") if r.code == 0 else []
    if len(lines) < 2:
        return None
    return tuple((p / ln.strip()).resolve() for ln in lines[:2])


def is_linked_worktree(p):
    """True when `p` is the root of a LINKED worktree (its git dir lives in the main repository's `worktrees/`)."""
    p = Path(p)
    if not (_is_dir(p) and (p / ".git").is_file()):
        return False
    dirs = git_dirs(p)
    return bool(dirs) and dirs[0] != dirs[1] and dirs[0].parent == dirs[1] / "worktrees"


def _status_lines(p, *extra):
    """The `git status --porcelain -z` entries of the work tree `p`: [(XY, path)]."""
    r = _git.run(p, "--literal-pathspecs", "status", "--porcelain", "-z", *extra)
    if r.code != 0:
        raise _git.GitError(r.err.strip() or "git status falhou")
    items = r.out.split("\0")
    out, i = [], 0
    while i < len(items):
        it = items[i]
        i += 1
        if len(it) < 4:
            continue
        xy, name = it[:2], it[3:]
        if xy[0] in "RC":                  # a rename or copy carries the origin as the next field
            i += 1
        out.append((xy, name))
    return out


def worktree_class(p, declared=None, departing=()):
    """The class of a LINKED worktree root, by the four git tests of ADR-0023 § 1 (all must hold for class 3):
    (a) its HEAD is an ancestor of `main`; (b) `git status --porcelain` is empty; (c) `git status --porcelain --ignored` lists
    nothing outside the derived list; (d) it is not locked. Anything else, or any git answer missing, is class 1.
    `departing`: paths a release is about to take away (`judge_worktree`); they count as derived, the rest is judged as it is."""
    p = Path(p)
    try:
        if _git.run(p, "rev-parse", "--verify", "-q", MAIN_REF).code != 0:
            return PathClass(IRREPLACEABLE, "worktree sem o ramo `main` para comparar (não há como provar que foi mesclado)")
        anc = _git.run(p, "merge-base", "--is-ancestor", "HEAD", MAIN_REF)
        if anc.code == 1:
            return PathClass(IRREPLACEABLE, "worktree com commits que a `main` ainda não tem (ramo não mesclado, ou rebase/squash)")
        if anc.code != 0:
            return PathClass(IRREPLACEABLE, f"worktree: o git não respondeu à pergunta do ancestral ({anc.err.strip()[:80]})")
        top = p.resolve()
        gone = frozenset(Path(d) for d in departing)
        dirty = [n for xy, n in _status_lines(p) if xy != "!!" and not _departs(top / n.rstrip("/"), n.endswith("/"), gone)]
        if dirty:
            return PathClass(IRREPLACEABLE, f"worktree com edição ou arquivo novo sem commit ({dirty[0]})")
        declared = declared or Declared(project_rules(top), global_rules(), top)
        if departing:
            declared.departing = frozenset(Path(d) for d in departing)
        declared.releasable = _release_test(p, top, declared.released_sources)
        for xy, name in _status_lines(p, "--ignored"):
            if xy != "!!":
                continue
            found = _declared_or_stray(top / name.rstrip("/"), name.endswith("/"), declared)   # git collapses an ignored folder: look inside it
            if found.klass == ROTATING:
                return PathClass(IRREPLACEABLE, f"worktree com um rotativo de sessão ou uma cópia carimbada ({name}: {found.reason}); "
                                                f"`merge_train.py clean-worktrees --apply` o tira antes de julgar (a cópia vai para o `_backups/` do principal), se a sessão acabou")
            if found.klass != DERIVED:
                return PathClass(IRREPLACEABLE, f"worktree com um ignorado que não é derivado ({name}: {found.reason}); o `git worktree remove` o apagaria")
        listing = _git.run(p, "worktree", "list", "--porcelain")
        if listing.code != 0:
            return PathClass(IRREPLACEABLE, "worktree: o git não listou os worktrees (não se sabe se está travado)")
        for block in listing.out.split("\n\n"):
            lines = block.strip().split("\n")
            if lines and lines[0].startswith("worktree ") and Path(os.path.realpath(lines[0][9:])) == top:
                if any(ln == "locked" or ln.startswith("locked ") for ln in lines[1:]):
                    return PathClass(IRREPLACEABLE, "worktree travado (`git worktree lock`)")
                break
    except _git.GitError as e:
        return PathClass(IRREPLACEABLE, f"worktree: o git não respondeu ({e})")
    return PathClass(DERIVED, "worktree de agente mesclado na `main`, limpo, sem ignorado fora de `derived` e sem trava")


def _departs(path, is_dir, gone):
    """True when `path` is about to leave (F207): it is in `gone`, or it is a folder git collapsed and everything in it is. An empty
    `gone` is always False - the strict judge of `classify` and the deletion guard."""
    if not gone:
        return False
    if path in gone:
        return True
    if not is_dir:
        return False
    try:
        children = list(os.scandir(path))
    except OSError:
        return False
    return all(_departs(Path(c.path), c.is_dir(follow_symlinks=False), gone) for c in children)


_COPY_NAME = re.compile(r"^(?P<flat>.+)\.\d{8}-\d{6}(?:\.\d+)?$")      # what `_safe._unique_dest` writes: <path with / as __>.<stamp>[.n]


def _release_test(p, top, sources):
    """The predicate that says whether a stamped copy in the worktree's `_backups/` is released: the worktree can leave without it.
    A copy is released only when ALL hold - the narrowest door the F84 found (UAT-367):
      1. it is a regular file directly in `<worktree>/_backups/`, named `<source with / as __>.<YYYYMMDD-HHMMSS>[.n]`;
      2. its source (`STRUCTURE.md`...) is declared in `structure_rules.json -> released_copies` (the generator that owns it said
         the file is regenerated, so a stale copy of it is not what the worktree protects);
      3. the copy's CONTENT is in the history of `main` at that path (`git log main --find-object=<blob> -- <source>`): what the copy
         would save already exists in git, recoverable. A copy of an uncommitted hand edit has a blob `main` never saw: it stays.
    Any other stamped copy (data, `.env`, a file nobody declared) stays class 4 and keeps the worktree from being derived. A git
    answer missing is "not released"."""
    backups = top / "_backups"

    def released(path):
        try:
            if path.is_symlink() or path.parent != backups or not path.is_file():
                return False
            m = _COPY_NAME.match(path.name)
            source = m.group("flat").replace("__", "/") if m else None
            if source not in sources:
                return False
            blob = _git.run(p, "hash-object", "--no-filters", "--", str(path))
            if blob.code != 0 or not blob.out.strip():
                return False
            seen = _git.run(p, "log", MAIN_REF, "-n1", "--format=%H", f"--find-object={blob.out.strip()}", "--", source)
            return seen.code == 0 and bool(seen.out.strip())
        except (_git.GitError, OSError):
            return False
    return released


def main_checkout(p):
    """The main checkout of the repository the linked worktree `p` belongs to: the first entry of `git worktree list`. None when
    git does not say (an error, a deadline, no answer)."""
    try:
        r = _git.run(p, "worktree", "list", "--porcelain")
    except _git.GitError:
        return None
    if r.code != 0:
        return None
    first = r.out.split("\n\n")[0].strip().split("\n")[0]
    return Path(os.path.realpath(first[9:])) if first.startswith("worktree ") else None


def main_rules(p):
    """The project rules AS COMMITTED on `main` (`git show main:mjrp-scripts/structure_rules.json`), not the working copy of the main
    checkout: an edit not committed there - or the main checkout sitting on another branch - must not widen what a worktree may
    lose (F80 recheck P2-1). The file absent on `main` is empty rules (as `project_rules`); anything else that fails raises
    ValueError, which the callers turn into class 1."""
    rel = f"mjrp-scripts/{RULES_FILE}"
    try:
        r = _git.run(p, "show", f"{MAIN_REF}:{rel}")
        if r.code != 0:
            listed = _git.run(p, "ls-tree", "--name-only", MAIN_REF, "--", rel)
            if listed.code == 0 and not listed.out.strip():
                return empty_rules()
            raise ValueError(f"`main:{rel}`: {r.err.strip()[:100] or 'o git não leu'}")
    except _git.GitError as e:
        raise ValueError(f"`main:{rel}`: {e}") from e
    return _parse_rules(r.out, f"main:{rel}")


def worktree_class_by_main(p, glob_rules=None, departing=()):
    """`worktree_class` judged by the rules COMMITTED on `main`, not by the ones the worktree carries: a worktree of an old branch
    holds old rules (a derived entry added since is missing) and would be kept for it (UAT-364, F80). The `top` stays the worktree's,
    so the project globs resolve inside it. Never raises: when the main's rules cannot be read, or git does not answer, the answer
    is class 1, the safe side (F84: the F80 recheck P2-1 and P2-2)."""
    p = Path(p)
    try:
        return worktree_class(p, Declared(main_rules(p), glob_rules if glob_rules is not None else global_rules(), p.resolve()), departing)
    except ValueError as e:
        return PathClass(IRREPLACEABLE, f"worktree: as regras da `main` não puderam ser lidas ({e})")
    except _git.GitError as e:
        return PathClass(IRREPLACEABLE, f"worktree: o git não respondeu ({e})")


SESSION_QUIET_SECONDS = 3600       # a `.mjrp/` written within this window may still have a session working in it


class ReleasePlan(NamedTuple):
    """What a merged worktree gives up before it is judged (UAT-401, F120): `runtime`, the rotating entries of `<worktree>/.mjrp/` (leases,
    turn files) of a session that ended; `copies`, the stamped copies directly in `<worktree>/_backups/`, which `_safe.release_worktree`
    moves into the MAIN checkout's `_backups/` - since F207 every entry there git does not version, stamped or not (the MJRPpersonal does not ignore
    its `_backups/`, and an entry git versions is never moved: git has it). `kept` says why `.mjrp/` stays, when it does. F207 (UAT-527): `restored`, the tracked files
    `rewritten_traces` declares with an unstaged rewrite (`_safe.restore` gives the committed content back); `strays`, the untracked files a
    `derived` glob covers (discarded as class 3)."""
    runtime: tuple = ()
    copies: tuple = ()
    kept: str = ""
    restored: tuple = ()
    strays: tuple = ()

    @property
    def paths(self):
        return self.runtime + self.copies + self.restored + self.strays

    def describe(self):
        bits = []
        if self.runtime:
            bits.append(f"{len(self.runtime)} item(ns) de sessão do `.mjrp/`")
        if self.copies:
            bits.append(f"{len(self.copies)} cópia(s) do `_backups/` para o `_backups/` do principal")
        if self.restored:
            bits.append(f"{len(self.restored)} rastro(s) rastreado(s) reescrito(s), restaurado(s) do último commit")
        if self.strays:
            bits.append(f"{len(self.strays)} derivado(s) não rastreado(s)")
        return " + ".join(bits)


def _entries(folder):
    try:
        return sorted(Path(e.path) for e in os.scandir(folder))
    except OSError:
        return []


def session_ended(top, now=None):
    """(True, "") when no session can still be working in the worktree at `top`; (False, why) otherwise. A session is alive when a lease in
    `.mjrp/sessions/` is active (`session_lease`: a heartbeat within LEASE_HOURS) or when anything under `.mjrp/` was written within
    SESSION_QUIET_SECONDS. A lease that cannot be read at all, or the module missing, is "not ended": the safe side."""
    mj = Path(top) / ".mjrp"
    if not _is_dir(mj):
        return True, ""
    try:
        import session_lease
        active = [str(lease.get("session", "?")) for lease, state in session_lease.leases(top) if state == "active"]
    except (ImportError, OSError, ValueError, AttributeError) as e:
        return False, f"não deu para ler as sessões do `.mjrp/` ({type(e).__name__})"
    if active:
        return False, f"a sessão {active[0]} ainda tem a trava ativa em `.mjrp/sessions/`"
    newest = 0.0
    for root, _dirs, files in os.walk(mj):
        for name in files + _dirs:
            try:
                newest = max(newest, (Path(root) / name).lstat().st_mtime)
            except OSError:
                continue
    if (now or time.time()) - newest < SESSION_QUIET_SECONDS:
        return False, f"algo em `.mjrp/` foi escrito há menos de {SESSION_QUIET_SECONDS // 60} min: pode haver sessão trabalhando"
    return True, ""


def _rewritten_and_strays(top, declared):
    """(restored, strays) of the worktree at `top` (F207, UAT-527): the tracked files `rewritten_traces` declares whose ONLY change is in the
    work tree (` M`, ` D`: a staged change is somebody's work), and the untracked entries a `derived` glob covers. Any other line of
    `git status` is not in either list, and keeps the worktree as class 1. Raises GitError when git does not answer."""
    restored, strays = [], []
    for xy, name in _status_lines(top):
        path = top / name.rstrip("/")
        if xy == "??":
            if _declared_or_stray(path, name.endswith("/"), declared).klass == DERIVED:
                strays.append(path)
        elif xy[0] == " " and xy[1] in "MD" and declared.rewritten(path):
            restored.append(path)
    return restored, strays


def release_plan(top, declared, now=None):
    """The ReleasePlan of the worktree at `top` under `declared` (the rules of the main). Read-only. In it: what is declared ROTATING directly in
    `<top>/.mjrp/` (when its session ended); every entry directly in `<top>/_backups/` that is not a link, not derived and not versioned by git
    (F207: the copies move to the main checkout's `_backups/`, nothing is deleted); the rewritten traces and the derived untracked entries
    (`_rewritten_and_strays`). Anything else keeps the worktree as class 1."""
    top = Path(top)
    runtime, copies, kept = [], [], ""
    mj = top / ".mjrp"
    if _is_dir(mj):
        ended, why = session_ended(top, now)
        if ended:
            runtime = [c for c in _entries(mj) if not c.is_symlink() and declared.kind(c, _is_dir(c)) == ROTATING]
        else:
            kept = why
    bk = top / "_backups"
    if _is_dir(bk):
        held = {h.split("/")[1] for h in _listing(top, ["ls-files"], "_backups") if "/" in h}   # what git versions there stays: git has it
        copies = [c for c in _entries(bk) if not c.is_symlink() and c.name not in held and declared.kind(c, _is_dir(c)) != DERIVED]
    restored, strays = _rewritten_and_strays(top, declared)
    return ReleasePlan(tuple(runtime), tuple(copies), kept, tuple(restored), tuple(strays))


ACTIVE_WORKTREE_SECONDS = 3600     # a file modified within this window anywhere in the worktree: a session may be working there, lease or not (F123)
FRESH_WORKTREE_DAYS = 7            # a worktree with no commit of its own leaves only after this many days with nothing touched in it (F123).
#                                    The agent's decision, revisable by the MJRP: a week covers a weekend and a long pause; an empty worktree
#                                    that old holds no work, and keeping it forever would pile up the 1.4 GB directories F120 collects.


def has_own_commit(p):
    """False when the HEAD of the worktree `p` sits on the first-parent line of `main`: its branch never committed anything of its own
    (a worktree just opened from `main`, or an agent that has not committed yet - a branch the train merged with `--no-ff` has its tip OFF
    that line). True otherwise. A branch fast-forwarded to `main` after its work was merged looks the same as a fresh one: it is held for
    FRESH_WORKTREE_DAYS of quiet, the safe side. Raises GitError when git does not answer."""
    head = _git.run(p, "rev-parse", "--verify", "-q", "HEAD")
    line = _git.run(p, "rev-list", "--first-parent", MAIN_REF)
    if head.code != 0 or line.code != 0:
        raise _git.GitError(f"git não disse o HEAD ou a linha principal da `main` ({(head.err or line.err).strip()[:80]})")
    return head.out.strip() not in set(line.out.split())


def newest_mtime(top, stop_at=None):
    """(mtime, path) of the newest entry (file, folder or link, by `lstat`) in the worktree at `top`, the root `.git` excluded. With
    `stop_at`, returns at the first entry at least that new (a recent write is enough to keep the worktree; no need to walk the rest).
    An entry that cannot be read counts as just written: unknown is not old."""
    top = Path(top)
    newest, where = 0.0, top
    for root, dirs, files in os.walk(top):
        if root == str(top):
            dirs[:] = [d for d in dirs if d != ".git"]
            files = [f for f in files if f != ".git"]
        for name in dirs + files:
            try:
                m = (Path(root) / name).lstat().st_mtime
            except OSError:
                return float("inf"), Path(root) / name
            if m > newest:
                newest, where = m, Path(root) / name
                if stop_at is not None and newest >= stop_at:
                    return newest, where
    try:
        m = top.lstat().st_mtime                       # the root last: a recent entry inside is the better thing to name
    except OSError:
        return float("inf"), top
    return (m, top) if m > newest else (newest, where)


def _spared(p, top, now):
    """The reason an otherwise-merged worktree is NOT for the automatic cleanup, or "" (F123, UAT-405). Two rules, the same for the end of
    the train and the manual `clean-worktrees --apply`: (1) a branch with no commit of its own stays until nothing in the worktree was touched
    for FRESH_WORKTREE_DAYS; (2) any worktree with a file modified within ACTIVE_WORKTREE_SECONDS stays. The age is the filesystem's."""
    own = has_own_commit(p)
    window = ACTIVE_WORKTREE_SECONDS if own else FRESH_WORKTREE_DAYS * 86400
    newest, where = newest_mtime(top, stop_at=now - window)
    if newest < now - window:
        return ""
    rel = os.path.relpath(where, top) if where != top else "."
    if not own:
        return (f"worktree recém-aberto, sem commit próprio (o ramo ainda é um ponto da `main`; `{rel}` mexido há menos de "
                f"{FRESH_WORKTREE_DAYS} dias): uma sessão pode estar começando aqui")
    return f"worktree com atividade recente (`{rel}` modificado há menos de {ACTIVE_WORKTREE_SECONDS // 60} min): pode haver sessão trabalhando, com ou sem trava"


def judge_worktree(p, glob_rules=None, now=None):
    """(PathClass, ReleasePlan) of the linked worktree `p`, by the rules COMMITTED on `main`, judging it as if the plan had already
    happened. This is the answer `clean-worktrees` and the doctor's budget use: a merged, clean worktree held only by the `.mjrp/` of an
    ended session or by stamped copies in its `_backups/` is class 3 here, and `_safe.release_worktree` makes it true on disk. A worktree
    that would be class 3 but is fresh (no commit of its own) or active (a file modified in the last hour) stays class 1 here, with the
    reason (F123, UAT-405): "merged" is not "abandoned". Never raises: what cannot be answered is class 1 with an empty plan (F120)."""
    p = Path(p)
    try:
        grules = glob_rules if glob_rules is not None else global_rules()
        top = p.resolve()
        declared = Declared(main_rules(p), grules, top)
        declared.releasable = _release_test(p, top, declared.released_sources)
        plan = release_plan(top, declared, now)
        verdict = worktree_class_by_main(p, grules, plan.paths)
        if verdict.klass == DERIVED:
            spared = _spared(p, top, now if now is not None else time.time())
            if spared:
                return PathClass(IRREPLACEABLE, spared), ReleasePlan()
        return verdict, plan
    except ValueError as e:
        return PathClass(IRREPLACEABLE, f"worktree: as regras da `main` não puderam ser lidas ({e})"), ReleasePlan()
    except _git.GitError as e:
        return PathClass(IRREPLACEABLE, f"worktree: o git não respondeu ({e})"), ReleasePlan()


def archive_blockers(p, glob_rules=None):
    """What archiving the session of the LINKED worktree `p` would erase (F206, S-218): the app removes the worktree with it, and
    `git worktree remove` takes the ignored files along. Returns [reason], one per ignored entry that is neither derived nor rotating,
    judged by the rules COMMITTED on `main` (a `.env`, a hand-made folder). The rotating entries go with no loss: the stamped copies of
    `_backups/` move to the main checkout first (`_safe.move_backup_copies`), and `.mjrp/` holds only the session's own runtime. Unlike
    `worktree_class` the branch need not be merged (it waits for the integrator) and the tracked edits are the close check's to judge.
    Never raises: an answer git does not give is a blocker, the safe side."""
    p = Path(p)
    try:
        top = p.resolve()
        declared = Declared(main_rules(p), glob_rules if glob_rules is not None else global_rules(), top)
        out = []
        for xy, name in _status_lines(p, "--ignored"):
            if xy != "!!":
                continue                       # `.mjrp/` too: only what `rotating`/`derived` declare there may go (the diary, a hand-placed
            #                                    file or the conform's state are class 1 - F206 recheck P1-3)
            found = _declared_or_stray(top / name.rstrip("/"), name.endswith("/"), declared)
            if found.klass == IRREPLACEABLE:
                out.append(f"`{name}` é ignorado e não é derivado ({found.reason}): o arquivamento o apagaria; "
                           "leve-o para fora com `python3 mjrp-scripts/_safe.py retire <caminho>` ou declare-o em `derived`")
        return out
    except ValueError as e:
        return [f"as regras da `main` não puderam ser lidas ({e}): não sei o que o arquivamento apagaria"]
    except (_git.GitError, OSError) as e:
        return [f"o git não respondeu sobre os ignorados ({e}): não sei o que o arquivamento apagaria"]


def _classify_leaf(p, declared, tracked, top):
    """A file or symlink."""
    if tracked:
        return PathClass(VERSIONED, "o git o rastreia e o conteúdo está commitado")
    kind = declared.kind(p, False)
    if kind == ROTATING:
        return PathClass(ROTATING, "declarado em `rotating`: o dono sobrescreve e poda")
    if kind == DERIVED:
        return PathClass(DERIVED, "não versionado e declarado em `derived`")
    where = "fora de qualquer repositório" if top is None else "não versionado"
    return PathClass(IRREPLACEABLE, f"{where} e fora da lista de derivados")


def _listing(top, args, rel):
    r = _git.run(top, "--literal-pathspecs", *args, "-z", "--", rel)
    if r.code != 0:
        raise _git.GitError(r.err.strip() or "git ls-files falhou")
    return [x for x in r.out.split("\0") if x]


def _declared_or_stray(path, is_dir, declared):
    """The class of an untracked (or ignored) entry that git listed: what the declarations say, or - for a folder git collapsed
    because all of it is ignored/untracked - the first thing inside it that no declaration covers (class 1). A covered folder is
    not entered; the walk ends at the first stray file."""
    kind = declared.kind(path, is_dir)
    if kind:
        return PathClass(kind, f"`{path.name}` está declarado em `{'rotating' if kind == ROTATING else 'derived'}`")
    if not is_dir:
        return PathClass(IRREPLACEABLE, f"tem `{path.name}` fora do git e fora da lista de derivados")
    seen = []
    try:
        children = sorted(os.scandir(path), key=lambda e: e.name)
    except OSError as e:
        return PathClass(IRREPLACEABLE, f"não deu para ler `{path.name}` ({e})")
    for child in children:
        found = _declared_or_stray(Path(child.path), child.is_dir(follow_symlinks=False), declared)
        if found.klass == IRREPLACEABLE:
            return found
        seen.append(found)
    return _worst(*seen) if seen else PathClass(DERIVED, "pasta vazia: não há o que perder")


def _classify_in_repo(p, top, declared):
    rel = p.relative_to(top).as_posix() if p != top else "."
    tracked = _listing(top, ["ls-files"], rel)
    if not _is_dir(p):
        edited = [n for xy, n in _status_lines(top, "--", rel) if xy not in ("??", "!!")] if tracked else []
        if edited:
            return PathClass(IRREPLACEABLE, "edição sem commit de um arquivo versionado")
        return _classify_leaf(p, declared, bool(tracked), top)
    parts = []
    if tracked:
        edited = [n for xy, n in _status_lines(top, "--", rel) if xy not in ("??", "!!")]
        parts.append(PathClass(IRREPLACEABLE, f"a pasta tem edição sem commit de arquivo versionado ({edited[0]})")
                     if edited else PathClass(VERSIONED, "a pasta tem arquivo rastreado e commitado"))
    covered = declared.kind(p, True)
    if covered:
        parts.append(PathClass(covered, "a própria pasta está declarada em `rotating`" if covered == ROTATING else "a própria pasta está declarada em `derived`"))
    else:
        loose = _listing(top, ["ls-files", "--others", "--exclude-standard", "--directory", "--no-empty-directory"], rel)
        loose += _listing(top, ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "--no-empty-directory"], rel)
        for entry in loose:
            found = _declared_or_stray(top / entry.rstrip("/"), entry.endswith("/"), declared)
            parts.append(found)
            if found.klass == IRREPLACEABLE:
                break                               # the most protective class: nothing can change the answer
    if not parts:
        return PathClass(DERIVED, "pasta vazia: não há o que perder")
    return _worst(*parts)


def _classify_outside_repo(p, declared):
    """A path in no repository: only the global declarations can make it anything but class 1."""
    found = _declared_or_stray(p, _is_dir(p), declared)
    if found.klass == IRREPLACEABLE:
        return PathClass(IRREPLACEABLE, found.reason.replace("fora do git", "fora de qualquer repositório"))
    return PathClass(found.klass, "fora de repositório e coberto por uma entrada global")


def _contained_worktrees(top, p):
    """The linked worktrees git lists that live under the folder `p` (so a folder of worktrees takes the class of the worst)."""
    r = _git.run(top, "worktree", "list", "--porcelain")
    if r.code != 0:
        raise _git.GitError(r.err.strip() or "git worktree list falhou")
    found = []
    for block in r.out.split("\n\n"):
        first = block.strip().split("\n")[0]
        if first.startswith("worktree "):
            w = Path(os.path.realpath(first[9:]))
            if w != Path(os.path.realpath(top)) and w != p and p in w.parents:
                found.append(w)
    return found


def classify(path, rules=None, global_rules_=None, scope="all"):
    """The class of `path` as a PathClass(klass, reason). `rules`/`global_rules_` replace the files (tests). Never raises: what
    cannot be answered is class 1, with the reason.

    `scope="project"` ignores the GLOBAL entries (the $TMPDIR, the daily copies): `_safe.retire_path` and `snapshot` protect a
    project's files and use only what the project declares. `discard` and the deletion guard use `scope="all"`."""
    try:
        p = lexical(path)
        if not (p.exists() or p.is_symlink()):
            return PathClass(IRREPLACEABLE, "o caminho não existe")
        glob_rules = global_rules_ if global_rules_ is not None else global_rules()
        if scope == "project":
            glob_rules = empty_rules()
        if is_linked_worktree(p):                           # a linked worktree is judged by the four tests of git, wherever it lives
            return worktree_class_by_main(p, glob_rules)
        # a GLOBAL derived entry (the $TMPDIR) beats the repository rules below: a throwaway repository under it - its `.git`, its
        # tracked files - is scratch by declaration (ADR-0023 § 1). The limit: a linked worktree INSIDE such a folder is not looked for
        # (the folder is not walked); worktrees are born in `.claude/worktrees/`, and the ones that matter are judged on their own root.
        if Declared(empty_rules(), glob_rules, None).kind(p, _is_dir(p)) == DERIVED:
            return PathClass(DERIVED, "coberto por uma entrada global de `derived` (vale mais que a raiz de repositório e o próprio git)")
        if ".git" in p.parts:
            return PathClass(IRREPLACEABLE, "é parte de um `.git`")
        probe = p if _is_dir(p) else p.parent
        top = _git.toplevel(probe)
        top = Path(os.path.realpath(top)) if top else None
        if _is_dir(p) and (p / ".git").exists():
            return PathClass(IRREPLACEABLE, "é a raiz de um repositório (tem `.git`)")
        project = rules if rules is not None else (project_rules(top) if top else empty_rules())
        declared = Declared(project, glob_rules, top)
        if top is None:
            return _classify_outside_repo(p, declared)
        result = _classify_in_repo(p, top, declared)
        if _is_dir(p) and result.klass != IRREPLACEABLE:    # class 1 already: no worktree can make the answer more protective
            inner = [worktree_class_by_main(w, glob_rules) for w in _contained_worktrees(top, p) if is_linked_worktree(w)]
            if inner:
                result = _worst(result, *inner)
        return result
    except (_git.GitError, ValueError, OSError) as e:
        return PathClass(IRREPLACEABLE, f"não deu para classificar ({type(e).__name__}: {str(e)[:120]}): a classe 1 é o lado seguro")
