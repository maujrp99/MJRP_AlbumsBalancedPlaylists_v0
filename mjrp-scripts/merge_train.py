#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
merge_train.py - the tools of the integrator's train (F60, S-161): the mechanical parts of merging
several branches into main, so that the integrator decides instead of retyping.

Born from the 2026-10-23/24 trains, run by hand with an unversioned helper (`logmerge2.py`): the
logs conflicted on every branch, `uat.md` rows collided on the same id, and a second session's commit
landed in the middle of an open merge. The rules that worked are here, versioned and tested.

Subcommands
  log-union PATH...          resolve the conflict markers of a log file: the entries of both sides, date-ordered
                             (newest first), none lost. Whole entries only; anything else stays marked, exit 1.
  log-merge BASE OURS THEIRS 3-way merge of a log by entry (git merge driver signature: the result goes to OURS).
                             Wired by `install-driver` + `.gitattributes`; a clone without the driver merges as usual.
  uat-merge BASE OURS THEIRS merge uat.md: text 3-way, rows kept whole, cells 3-way by column name, an id both sides
                             created for different rows is renumbered (theirs gets the next free id). `--git PATH`
                             reads the three stages of a conflicted merge; `--out` writes the result.
  next-uat-id                the next free UAT id: reads uat.md on main and on every unmerged local branch (not archive/)
                             through `git show`; `--reserve` writes the id to a reservation shared by all worktrees.
  next-item-id               the same for a new story, feature or epic (`--kind`, `--project`, F145, CC-ADR-0036): the highest on main, on the
                             open branches and in the checkout; `--reserve` keeps it, the epic per project with the contract's `id_prefix`.
  preflight                  before a train: an open merge, orphan locks, a running git. Exit 1 on any finding.
  check-open-merge MSGFILE   the commit-msg hook: warns (never blocks) when a merge is open and this commit is not it.
  memory-merge BASE OURS THEIRS  3-way merge of a MEMORY.md (git merge driver signature; UAT-503): the sentences two branches prepended to the
                             same `## Now` block are joined (newer first), the list lines both added too; a block one side rewrote keeps the markers.
  install-driver             sets `merge.mjrp-log.driver` and `merge.mjrp-memory.driver` in the clone's git config and ties `docs/log.md`
                             and `MEMORY.md` to them in `.gitattributes`; says «instalado» only when `git check-attr` confirms (F218).
  merge BRANCH               one call per branch: preflight, the retroactive step of the fast-lane features the branch takes to Done
                             (F101: refused before the merge starts), `merge --no-ff`, and the check of the UAT ids when it went in
                             clean; on a conflict, lists each conflicted file with the subcommand that resolves it (F60 TASK-10).
  dist-resolve [--rebuild]   a conflict in a build folder (`apps/control-center/web/dist`, hashed file names). Where either side no
                             longer versions it (the Control Center's since F57, CC-ADR-0027) it keeps the removal: the build leaves the
                             index, the disk keeps it (derived). Where both sides version it: drops both sides, builds again from the
                             sources already merged, stages the result (F60 TASK-10).
  uat-check [--path P]       after a merge (open or committed) that touches a uat.md: a repeated id, or an id the merge
                             brought that no one reserved, exits 1 - a clean text merge needs this too (F60 TASK-10).
  session-check WORKTREE     before archiving a page session (F101): the worktree clean, the branch in main or delivered, the closing
                             log entry with `Session:` that names the worktree's branch (F198) not older than the last commit of work,
                             the lease released, the app's ## Now in
                             step, and (F184) the tasks of the feature a `claude/fNN-` branch is named after marked or waiting. Exit 0 archive, 1 not yet (each item said), 2 not evaluable.
  clean-worktrees [--apply]  the end of the train: lists the linked worktrees whose branch is merged into main and that are clean
                             (class 3, ADR-0023) and, with `--apply`, tears each down through `_safe.discard`; the others stay,
                             with the reason. Never the main checkout, never the one it runs in. A worktree held only by the `.mjrp/`
                             of an ended session or by stamped copies in its `_backups/` is released first: the copies move into the
                             main checkout's `_backups/` (F120). `merge BRANCH` runs it by itself when the merge lands on `main`.

Nothing is deleted: a lock is renamed (`--retire-orphans`), a renumbering is recorded in a NEW log entry, never by
editing an old one. Comments and docstrings are English; what the human reads is Portuguese.
"""
import argparse
import datetime as dt
import fcntl
import json
import os
import re
import shlex
import subprocess
import sys
import tempfile
from pathlib import Path

import _clock
import _git
from session_close import clean_worktrees, session_check  # the close check and the worktree cleanup are the kernel's since F206 (children too)

ENTRY_HEAD = re.compile(r"(?=^## \[)", re.M)
STAMP = re.compile(r"^## \[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\]")
ROW = re.compile(r"^\|\s*(UAT-(\d+))\s*\|")
CELL_SPLIT = re.compile(r"(?<!\\)\|")
MARK_OURS = re.compile(r"^<{7}( .*)?$")
MARK_BASE = re.compile(r"^\|{7}( .*)?$")
MARK_MID = re.compile(r"^={7}$")
MARK_THEIRS = re.compile(r"^>{7}( .*)?$")
DRIVER = "mjrp-log"
MEMORY_DRIVER = "mjrp-memory"
# F218 (UAT-539): the drivers act only on the paths `.gitattributes` ties to them. (path git asks about, driver, line the kernel writes);
# `**/` matches at the root too, so one line covers the project's log and memory and those of the apps inside it.
DRIVER_ATTRIBUTES = (("docs/log.md", DRIVER, f"**/docs/log.md merge={DRIVER}"),
                     ("MEMORY.md", MEMORY_DRIVER, f"**/MEMORY.md merge={MEMORY_DRIVER}"))
DRIVER_ATTRIBUTES_HEADER = ("# merge drivers (F218): the log merges by entry, newest first; the ## Now joins the blocks both sides prepended to.\n"
                            "# They act only where `python3 mjrp-scripts/merge_train.py install-driver` ran (the refresh of the kernel runs it).\n")
DRIVER_SCRIPT = "mjrp-scripts/merge_train.py"     # what the configured drivers run, relative to the checkout that merges
DIST_PATH = "apps/control-center/web/dist"      # the Control Center's build: not versioned since F57 (CC-ADR-0027 § 1)
DIST_BUILD_ENV = "MJRP_DIST_BUILD"              # overrides the build command (the selftests use a fake one)
DIST_BUILD_DEFAULT = "npm run build"            # runs in the folder above the dist (apps/control-center/web)
DIST_BUILD_TIMEOUT = 900


# --------------------------------------------------------------------------------------------- git helpers

# F71 R9: the deadline of every git call here, in seconds; expiry is an error the caller already treats as "git did not answer".
GIT_TIMEOUT = 60
# UAT-490 (2026-11-05): the `git merge` of the train runs the pre-merge-commit hook - the retroactive and visual checks, and the
# dialog that waits for the MJRP's finger - and under load (other sessions on the machine) that takes more than the 60 s of a plain git
# call: the merge died mid-way and left its result prepared, uncommitted. The merge has its own ceiling; one that still passes it is
# undone (`_timed_out_merge`), never left half done. The visual gate's dialog (PRESENCE_TIMEOUT + PRESENCE_MARGIN) must end before it.
MERGE_TIMEOUT = 300


def git(args, cwd=None, check=True, timeout=None):
    r = _git.run(cwd, *args, timeout=timeout or GIT_TIMEOUT)
    if check and not r.ok:
        raise _git.GitError(f"git {' '.join(args)}: {r.err.strip()}")
    return r


def git_path(name, cwd=None):
    """Absolute path of a file inside the git dir of THIS worktree (MERGE_HEAD is per worktree)."""
    p = git(["rev-parse", "--git-path", name], cwd=cwd).stdout.strip()
    return Path(p) if os.path.isabs(p) else Path(cwd or ".").resolve() / p


def common_dir(cwd=None):
    p = git(["rev-parse", "--git-common-dir"], cwd=cwd).stdout.strip()
    return Path(p) if os.path.isabs(p) else Path(cwd or ".").resolve() / p


def show(ref, path, cwd=None):
    r = git(["show", f"{ref}:{path}"], cwd=cwd, check=False)
    return r.stdout if r.returncode == 0 else None


def now_br():
    """Brasilia time as AAAA-MM-DD HH:MM (the logs are in it, whatever the machine's zone)."""
    return _clock.stamp()


# --------------------------------------------------------------------------------------------- log entries

def split_log(text):
    """(preamble, [entry, ...]) - an entry runs from its `## [` line to the next one, raw."""
    parts = ENTRY_HEAD.split(text)
    if parts and not parts[0].startswith("## ["):
        return parts[0], [p for p in parts[1:] if p]
    return "", [p for p in parts if p]


def header(entry):
    return entry.split("\n", 1)[0]


def stamp(entry):
    m = STAMP.match(entry)
    return m.group(1) if m else ""


def join_log(preamble, entries, last_of_inputs=()):
    """Raw concatenation (a file merged with itself comes back byte for byte). The only entries padded with a blank
    line are those that closed one of the input files - they had no successor there, and may have one now."""
    out = [preamble] if preamble else []
    for i, e in enumerate(entries):
        e = e if e.endswith("\n") else e + "\n"
        if i < len(entries) - 1 and e in last_of_inputs and not e.endswith("\n\n"):
            e += "\n"
        out.append(e)
    return "".join(out)


def keyed(entries):
    """[(text, n)]: the n-th occurrence of the same text, so identical entries are counted, not collapsed (the real
    logs repeat some headers, and some whole entries)."""
    seen, out = {}, []
    for e in entries:
        seen[e] = seen.get(e, 0) + 1
        out.append((e, seen[e]))
    return out


def merge_entries(base, ours, theirs):
    """3-way merge of two entry lists by CONTENT; returns (merged_entries, conflicts) - conflicts is always empty.

    An entry is its whole text. What a side added (not in base) stays; what either side removed from base goes; an edited
    entry is a removal plus an addition, so when both sides edited the same entry both versions stay (the doubled header
    is the signal, and nothing is lost). Ours keeps its order (minimal churn); an entry only theirs added is inserted
    before the first ours-entry that is older, so the file stays newest-first. Base empty (the marker mode) is a union."""
    kb, ko, kt = set(keyed(base)), keyed(ours), keyed(theirs)
    set_o, set_t = {k for k in ko}, {k for k in kt}
    gone = {k for k in kb if k not in set_o or k not in set_t}          # removed (or edited) by either side
    merged = [k for k in ko if k not in gone]
    present = set(merged)
    pos = 0
    for k in kt:
        if k in present:
            pos = merged.index(k) + 1
            continue
        if k in gone or k in kb:
            continue
        i = pos
        while i < len(merged) and stamp(merged[i][0]) >= stamp(k[0]):
            i += 1
        merged.insert(i, k)
        present.add(k)
        pos = i + 1
    return [e for e, _ in merged], []


def merge_preamble(b, o, t):
    if o == t or t == b:
        return o, True
    if o == b:
        return t, True
    return f"<<<<<<< ours\n{o}=======\n{t}>>>>>>> theirs\n", False


def log_merge(base_txt, ours_txt, theirs_txt):
    bp, be = split_log(base_txt)
    op, oe = split_log(ours_txt)
    tp, te = split_log(theirs_txt)
    pre, pre_ok = merge_preamble(bp, op, tp)
    entries, conflicts = merge_entries(be, oe, te)
    lasts = {x[-1] for x in (be, oe, te) if x}
    return join_log(pre, entries, lasts), (pre_ok and not conflicts)


def split_regions(text):
    """Yield ('text', str) and ('conflict', ours, base_or_None, theirs) pieces of a file with git markers."""
    lines = text.splitlines(keepends=True)
    i, buf = 0, []
    out = []
    while i < len(lines):
        if MARK_OURS.match(lines[i].rstrip("\n")):
            if buf:
                out.append(("text", "".join(buf)))
                buf = []
            ours, base, theirs, cur = [], None, [], "o"
            i += 1
            while i < len(lines):
                s = lines[i].rstrip("\n")
                if MARK_BASE.match(s) and cur == "o":
                    cur, base = "b", []
                elif MARK_MID.match(s) and cur in ("o", "b"):
                    cur = "t"
                elif MARK_THEIRS.match(s) and cur == "t":
                    break
                else:
                    {"o": ours, "b": base, "t": theirs}[cur].append(lines[i])
                i += 1
            out.append(("conflict", "".join(ours), None if base is None else "".join(base), "".join(theirs)))
        else:
            buf.append(lines[i])
        i += 1
    if buf:
        out.append(("text", "".join(buf)))
    return out


def log_union_file(path):
    """Resolves the conflict regions of one log. Returns the number of regions left unresolved."""
    p = Path(path)
    left = 0
    out = []
    for piece in split_regions(p.read_text(encoding="utf-8")):
        if piece[0] == "text":
            out.append(piece[1])
            continue
        _, o, b, t = piece
        pieces = [x for x in (o, t) if x.strip()]
        headless = any(not x.lstrip().startswith("## [") for x in pieces)
        if headless:
            left += 1
            out.append(f"<<<<<<< ours\n{o}" + (f"||||||| base\n{b}" if b is not None else "") + f"=======\n{t}>>>>>>> theirs\n")
            continue
        be = split_log(b)[1] if b else []
        merged, conflicts = merge_entries(be, split_log(o)[1], split_log(t)[1])
        if conflicts:
            left += 1
        # git keeps the blank line that follows a region outside it, unless both sides had it inside
        out.append(join_log("", merged, {x for x in (split_log(o)[1][-1:] + split_log(t)[1][-1:])}).rstrip("\n") + ("\n\n" if o.endswith("\n\n") and t.endswith("\n\n") else "\n"))
    p.write_text("".join(out), encoding="utf-8")
    return left


# --------------------------------------------------------------------------------------------- uat.md

def parse_row(line):
    """(cells, end): the cells between the pipes; `end` is "|" when the row is closed by a pipe (the older rows end
    in the anchor cell, with no closing pipe, and are written back the same way)."""
    parts = CELL_SPLIT.split(line.rstrip("\n"))[1:]
    if parts and parts[-1].strip() == "":
        return parts[:-1], "|"
    return parts, ""


def header_names(line):
    return [c.strip() for c in parse_row(line)[0]]


def row_dict(line, names):
    """({column name: raw cell}, end); the cells past the header (the ^UAT-n anchor) are `_anchor`, `_anchor2`..."""
    cells, end = parse_row(line)
    d = {}
    for i, c in enumerate(cells):
        key = names[i] if i < len(names) else ("_anchor" if i == len(names) else f"_anchor{i - len(names) + 1}")
        d[key] = c
    return d, end


def row_line(d, names, end="|"):
    cols = [k for k in names if k in d] + [k for k in d if k not in names]
    return "|" + "|".join(d[k] for k in cols) + end


def table_rows(text):
    """{id: (line, header_names_in_force)} for every UAT row in a text."""
    rows, names = {}, []
    for ln in text.split("\n"):
        if re.match(r"^\|\s*ID\s*\|", ln):
            names = header_names(ln)
        m = ROW.match(ln)
        if m:
            rows[m.group(1)] = (ln, names)
    return rows


def max_uat(texts):
    ids = [int(m.group(2)) for t in texts if t for ln in t.split("\n") for m in [ROW.match(ln)] if m]
    anchors = [int(x) for t in texts if t for x in re.findall(r"\^UAT-(\d+)\b", t)]
    return max(ids + anchors + [0])


def merge_cell(name, bv, ov, tv):
    """3-way of one cell; None means 'the column does not exist on that side'. Returns (value, ok)."""
    n = lambda x: None if x is None else x.strip()  # noqa: E731
    if n(ov) == n(tv):
        return (ov if ov is not None else tv), True
    if bv is not None and n(ov) == n(bv):
        return tv, True
    if bv is not None and n(tv) == n(bv):
        return ov, True
    if bv is None and tv is None:
        return ov, True
    if bv is None and ov is None:
        return tv, True
    return f" <<<<<<< ours {ov.strip()} ======= {tv.strip()} >>>>>>> theirs ", False


def renumber(line, old, new):
    """The id cell and the block anchor of a row; the description is left as it was."""
    line = re.sub(rf"^(\|\s*){re.escape(old)}(\s*\|)", rf"\g<1>{new}\g<2>", line, count=1)
    return re.sub(rf"\^{re.escape(old)}\b", f"^{new}", line)


def skeleton(text):
    return "\n".join(f"@@ROW {ROW.match(ln).group(1)}@@" if ROW.match(ln) else ln for ln in text.split("\n"))


def git_merge_file(base, ours, theirs):
    with tempfile.TemporaryDirectory() as d:
        paths = []
        for name, txt in (("ours", ours), ("base", base), ("theirs", theirs)):
            p = Path(d) / name
            p.write_text(txt, encoding="utf-8")
            paths.append(str(p))
        r = _git.run(None, "merge-file", "-p", "--diff3", "-L", "ours", "-L", "base", "-L", "theirs", *paths, timeout=GIT_TIMEOUT)
        return r.out, r.code


def resolve_skeleton_conflicts(text):
    """A conflict hunk made only of row placeholders is a union (ids ascending); the `Atualizado` stamp takes the
    newest; anything else stays marked. Returns (text, unresolved_count)."""
    out, left = [], 0
    for piece in split_regions(text):
        if piece[0] == "text":
            out.append(piece[1])
            continue
        _, o, b, t = piece
        lines = [x for x in (o + t).splitlines() if x.strip()]
        if lines and all(x.startswith("@@ROW ") for x in lines):
            seen, rows = set(), []
            for x in o.splitlines() + t.splitlines():
                if x.strip() and x not in seen:
                    seen.add(x)
                    rows.append(x)
            rows.sort(key=lambda x: int(re.search(r"UAT-(\d+)", x).group(1)))
            out.append("\n".join(rows) + "\n")
            continue
        ol, tl = o.strip().splitlines(), t.strip().splitlines()
        if len(ol) == 1 and len(tl) == 1 and "**Atualizado**" in ol[0] and "**Atualizado**" in tl[0]:
            out.append((max(ol[0], tl[0], key=lambda s: re.findall(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}", s)[-1:] or [""])) + "\n")
            continue
        left += 1
        out.append(f"<<<<<<< ours\n{o}" + (f"||||||| base\n{b}" if b is not None else "") + f"=======\n{t}>>>>>>> theirs\n")
    return "".join(out), left


# --------------------------------------------------------------------------------------------- MEMORY.md (UAT-503)

MEMORY_BLOCK = re.compile(r"^(\*\*[^*\n]+\.\*\* )(.*)$", re.S)     # `**Where the Work Stopped.** (stamp) text ...`
MEMORY_STAMP = re.compile(r"\((\d{4}-\d{2}-\d{2} \d{2}:\d{2})\)|\*\*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\*\*")


def _stamp_of(text):
    m = MEMORY_STAMP.search(text)
    return (m.group(1) or m.group(2)) if m else ""


def _join_memory_block(b, o, t):
    """One line of the `## Now` that both sides changed: every branch PREPENDS its sentence to the block (`**Head.** (stamp) new ...
    old body`). When both bodies end with the base body and the heads agree, the result is the head, the two new sentences (the newer
    stamp first) and the base body. None when a side rewrote the block instead (a person decides)."""
    mb, mo, mt = (MEMORY_BLOCK.match(x.rstrip("\n")) for x in (b, o, t))
    if not (mb and mo and mt) or not (mb.group(1) == mo.group(1) == mt.group(1)):
        return None
    base = mb.group(2)
    if not (mo.group(2).endswith(base) and mt.group(2).endswith(base)):
        return None
    po, pt = mo.group(2)[:len(mo.group(2)) - len(base)], mt.group(2)[:len(mt.group(2)) - len(base)]
    first, second = (po, pt) if _stamp_of(po) >= _stamp_of(pt) else (pt, po)
    if first and not first.endswith(" "):
        first += " "
    if second and not second.endswith(" "):
        second += " "
    return mb.group(1) + first + second + base + "\n"


def _resolve_memory_region(o, b, t):
    """The text that replaces one conflict region of MEMORY.md, or None. (1) block lines, one for one: each is a prepend on both
    sides; (2) list lines both sides only ADDED at the same place (`- ...` of the Ways of Working): both, the newer stamp first."""
    ol, tl = o.splitlines(keepends=True), t.splitlines(keepends=True)
    bl = b.splitlines(keepends=True) if b else []
    if bl and len(ol) == len(bl) == len(tl):
        joined = [_join_memory_block(x, y, z) if y != z else y for x, y, z in zip(bl, ol, tl)]
        if all(j is not None for j in joined):
            return "".join(joined)
    if not bl and ol and tl and all(x.startswith("- ") for x in ol + tl):
        added = ol + [x for x in tl if x not in ol]
        return "".join(sorted(added, key=_stamp_of, reverse=True) if all(_stamp_of(x) for x in added) else added)
    return None


def memory_merge(base, ours, theirs):
    """3-way merge of a MEMORY.md by what each branch really does to it (UAT-503). Returns (text, unresolved regions): the text has
    the git markers (diff3) in every region it could not join."""
    merged, _ = git_merge_file(base, ours, theirs)
    out, left = [], 0
    for piece in split_regions(merged):
        if piece[0] == "text":
            out.append(piece[1])
            continue
        _, o, b, t = piece
        joined = _resolve_memory_region(o, b, t)
        if joined is None:
            left += 1
            out.append(f"<<<<<<< ours\n{o}" + (f"||||||| base\n{b}" if b is not None else "") + f"=======\n{t}>>>>>>> theirs\n")
        else:
            out.append(joined)
    return "".join(out), left


class UatLostRows(RuntimeError):
    """The uat.md a merge would write has fewer issue rows than its inputs (UAT-551): the merge stops, the file is not written."""
    def __init__(self, ids):
        self.ids = list(ids)
        super().__init__(f"o resultado perderia {len(self.ids)} linha(s) de issue: {', '.join(self.ids)}")


def lost_ids(sources, result):
    """The ids that some source holds and the result does not, in numeric order. The renumbered row keeps its old id in `ours`, so a
    renumbering never reads as a loss."""
    have = set(_row_ids(result))
    want = {i for t in sources for i in _row_ids(t)}
    return sorted(want - have, key=lambda x: int(x.split("-")[1]))


def uat_merge(base, ours, theirs, free_start=0):
    """Returns (text, report) - report: renumbered {old: new}, conflicts [..], unresolved int."""
    sk, _ = git_merge_file(skeleton(base), skeleton(ours), skeleton(theirs))
    sk, unresolved = resolve_skeleton_conflicts(sk)
    rb, ro, rt = table_rows(base), table_rows(ours), table_rows(theirs)
    next_id = max(free_start, max_uat([base, ours, theirs])) + 1
    renum, conflicts, out, emitted = {}, [], [], set()
    names_now = []
    for ln in sk.split("\n"):
        if re.match(r"^\|\s*ID\s*\|", ln):
            names_now = header_names(ln)
        m = re.match(r"^@@ROW (UAT-\d+)@@$", ln)
        if not m:
            out.append(ln)
            continue
        i = m.group(1)
        if i in emitted:
            continue
        emitted.add(i)
        b, o, t = rb.get(i), ro.get(i), rt.get(i)
        if o and t and not b and o[0].strip() != t[0].strip():
            # both sides created this id for different rows: ours keeps it, theirs is renumbered
            new = f"UAT-{next_id}"
            next_id += 1
            renum[i] = new
            out.append(o[0])
            out.append(renumber(t[0], i, new))
            continue
        if o and t:
            names = names_now or o[1] or t[1]
            bd = row_dict(b[0], b[1])[0] if b else {}
            (od, end), (td, _) = row_dict(o[0], o[1]), row_dict(t[0], t[1])
            merged, ok = {}, True
            for k in list(dict.fromkeys(list(od) + list(td))):
                v, good = merge_cell(k, bd.get(k) if b else None, od.get(k), td.get(k))
                ok &= good
                if v is not None:
                    merged[k] = v
            if not ok:
                conflicts.append(i)
            out.append(row_line(merged, names, end))
        else:
            out.append((o or t or b)[0])  # one side only (or deleted on one: a row is never deleted)
    # UAT-551 (F232): a row is never deleted, so the result holds every id the three texts hold. A result that lost one (an empty
    # file, say, when the three inputs came from a path git does not hold in conflict) is not a merge: stop, write nothing.
    text = "\n".join(out)
    lost = lost_ids([base, ours, theirs], text)
    if lost:
        raise UatLostRows(lost)
    # UAT-502: a cell both sides changed is marked inside the row and listed in `conflicts`; it is also unresolved, or the report says 0
    return text, {"renumbered": renum, "conflicts": conflicts, "unresolved": unresolved + len(conflicts)}


def added_references(old_ids, base_ref, their_ref, cwd=None):
    """{old id: ["path:line: text"]} - the lines the branch ADDED (git diff base...their, -U0) that cite an old id as a whole
    word (`UAT-28` is not `UAT-285`), uat.md included; only the renumbered row itself is left out. After the merge the old
    id also names the issue that is on main, so these lines are listed, never rewritten blindly. None when git cannot say."""
    r = git(["diff", "-U0", "--no-color", "--no-ext-diff", f"{base_ref}...{their_ref}"], cwd=cwd, check=False)
    if r.returncode != 0:
        return None
    pats = {o: re.compile(rf"(?<![\w-]){re.escape(o)}(?!\d)") for o in old_ids}
    row = {o: re.compile(rf"^\|\s*{re.escape(o)}\s*\|") for o in old_ids}
    found = {o: [] for o in old_ids}
    path, line = "", 0
    for ln in r.stdout.split("\n"):
        if ln.startswith("+++ "):
            path = ln[6:] if ln.startswith("+++ b/") else ""
        elif ln.startswith("@@"):
            m = re.search(r"\+(\d+)", ln)
            line = int(m.group(1)) if m else 0
        elif ln.startswith("+") and not ln.startswith("+++"):
            for o in old_ids:
                if pats[o].search(ln) and not (path.endswith("uat.md") and row[o].match(ln[1:])):
                    found[o].append(f"{path}:{line}: {ln[1:].strip()[:140]}")
            line += 1
    return found


def log_note_entry(renum, branch, refs=None):
    lines = [f"## [{now_br()}] decision — ids de UAT renumerados na integração de `{branch}`", "",
             "> Participantes: Claude (Claude Code), integrador · Branch: main", ""]
    for old, new in renum.items():
        lines.append(f"- `{old}` da `{branch}` colidiu com outra issue de mesmo id e virou `{new}` (ordem de chegada).")
        if refs is None:
            lines.append(f"  - Não foi possível listar as referências do ramo ao id velho `{old}`: confira à mão.")
        elif refs.get(old):
            lines.append(f"  - As referências listadas abaixo ainda citam o id velho `{old}` e valem para a issue do ramo "
                         f"(hoje `{new}`); a reescrever em um commit seguinte, sem tocar nas que citam a issue da `main`:")
            lines.extend(f"    - `{x}`" for x in refs[old])
        else:
            lines.append(f"  - Nenhuma linha acrescentada pelo ramo cita `{old}` fora da própria linha da issue.")
    return "\n".join(lines) + "\n\n"


def insert_log_entry(path, entry):
    p = Path(path)
    pre, entries = split_log(p.read_text(encoding="utf-8"))
    merged, _ = merge_entries([], entries, [entry])
    p.write_text(join_log(pre, merged), encoding="utf-8")


# --------------------------------------------------------------------------------------------- next-uat-id

def open_branches(cwd=None):
    """Every local branch not yet merged into main, except `archive/` (retired ones). The repo also uses harness/, review/,
    docs/, chore/... and a judge on a review/ branch opens issues: a prefix list would miss their ids."""
    r = git(["for-each-ref", "--no-merged=main", "--format=%(refname:short)", "refs/heads"], cwd=cwd, check=False)
    return [x for x in r.stdout.split() if x and x != "main" and not x.startswith("archive/")]


def uat_paths(cwd=None, explicit=None):
    if explicit:
        return explicit
    r = git(["ls-tree", "-r", "--name-only", "main"], cwd=cwd).stdout.split("\n")
    return [p for p in r if p.endswith("docs/specs/uat.md")]


def reservation_file(cwd=None):
    return common_dir(cwd) / "mjrp-uat-reservations.json"


def _reservations(path, cwd, take=None, add=()):
    """Reads (and, when asked, extends) the reservations of one uat.md under a lock shared by every worktree.
    `take`: reserve one new id above `take`; `add`: reserve these ids. Returns (reserved ids, the new id or None)."""
    rf = reservation_file(cwd)
    rf.parent.mkdir(parents=True, exist_ok=True)
    with open(rf, "a+") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        fh.seek(0)
        raw = fh.read().strip()
        data = json.loads(raw) if raw else {}
        mine = data.get(path, [])
        new = None
        if take is not None:
            new = max([take] + mine) + 1
            mine = mine + [new]
        mine = sorted(set(mine) | set(add))
        if take is not None or add:
            data[path] = mine
            fh.seek(0)
            fh.truncate()
            fh.write(json.dumps(data, indent=1))
        fcntl.flock(fh, fcntl.LOCK_UN)
    return mine, new


def reserve_ids(path, ids, cwd=None):
    """The ids uat-merge hands out are taken too, so another worktree asking next-uat-id does not receive the same one."""
    _reservations(path, cwd, add=[int(i.split("-")[1]) if isinstance(i, str) else int(i) for i in ids])


def next_uat_id(cwd=None, path=None, reserve=False, branches=True):
    paths = uat_paths(cwd, [path] if path else None)
    if len(paths) != 1:
        raise RuntimeError(f"uat.md ambiguous or absent on main: {paths} - pass --path")
    path = paths[0]
    refs = ["main"] + (open_branches(cwd) if branches else [])
    texts = {r: show(r, path, cwd) for r in refs}
    top = max_uat(texts.values())
    if reserve:
        mine, new = _reservations(path, cwd, take=top)
        top = new - 1
    else:
        mine, _ = _reservations(path, cwd)
        top = max([top] + mine)
        new = top + 1
    return f"UAT-{new}", {"path": path, "highest": top, "seen_in": [r for r, t in texts.items() if t]}


# --------------------------------------------------------------------------------------------- next-item-id

_ITEM_FILE = {"story": re.compile(r"(?:^|/)docs/specs/requirements/(?:[^/]+/)*S-(\d+)(?:-[^/]*)?\.md$"),
              "feature": re.compile(r"(?:^|/)docs/specs/features/F(\d+)-[^/]+/")}
_EPIC_IN_PRD = re.compile(r"^#{2,4} (?:[A-Z]+-)?EP-(\d+)\b|^\| \*\*(?:[A-Z]+-)?EP-(\d+)\b", re.M)
_EPIC_INTAKE = 90  # `EP-90` is the intake row of the harness's table, not an epic
_ID_PREFIX = re.compile(r"^\s*id_prefix:\s*([A-Z]+)\b", re.M)


def _highest_of_files(kind, refs, cwd):
    """The highest story or feature number of the repository: an id is unique in it (ADR-0020 D.3), on main, on the open branches and in
    the checkout, whose new files the «+ Criar» of the Control Center leaves uncommitted."""
    pattern = _ITEM_FILE[kind]
    lists = [git(["ls-tree", "-r", "--name-only", ref], cwd=cwd, check=False).stdout for ref in refs]
    lists.append(git(["ls-files", "-co", "--exclude-standard", ":(top)"], cwd=cwd, check=False).stdout)
    return max((int(m.group(1)) for text in lists for line in text.split("\n") if (m := pattern.search(line))), default=0)


def _highest_epic(project, refs, cwd):
    rel = "docs/specs/prd.md" if project in (".", "") else f"{project.rstrip('/')}/docs/specs/prd.md"
    top = Path(git(["rev-parse", "--show-toplevel"], cwd=cwd).stdout.strip())
    disk = top / rel
    texts = [show(ref, rel, cwd) for ref in refs] + [disk.read_text(encoding="utf-8") if disk.is_file() else ""]
    numbers = [int(a or b) for text in texts for a, b in _EPIC_IN_PRD.findall(text or "")]
    return max((n for n in numbers if n < _EPIC_INTAKE), default=0)


def _id_prefix(project, cwd):
    top = Path(git(["rev-parse", "--show-toplevel"], cwd=cwd).stdout.strip())
    contract = top / project / ".mjrp-project.yml"
    found = _ID_PREFIX.search(contract.read_text(encoding="utf-8")) if contract.is_file() else None
    return f"{found.group(1)}-" if found else ""


def next_item_id(kind, project=".", cwd=None, reserve=False, branches=True):
    """The next free id of a new `story`, `feature` or `epic` (F145, CC-ADR-0036 § 3). The reservation shares the file of the UAT ids, under
    a key of its own: story and feature by the repository, the epic by its project's PRD."""
    refs = ["main"] + (open_branches(cwd) if branches else [])
    top = _highest_epic(project, refs, cwd) if kind == "epic" else _highest_of_files(kind, refs, cwd)
    key = f"next-item-id:epic:{project}" if kind == "epic" else f"next-item-id:{kind}"
    if reserve:
        _, new = _reservations(key, cwd, take=top)
    else:
        mine, _ = _reservations(key, cwd)
        new = max([top] + mine) + 1
    return {"story": f"S-{new:02d}", "feature": f"F{new:02d}"}.get(kind) or f"{_id_prefix(project, cwd)}EP-{new:02d}"


# --------------------------------------------------------------------------------------------- preflight / hook

def find_locks(cwd=None):
    gd = common_dir(cwd)
    wd = git_path("HEAD", cwd).parent
    found = []
    for base in {gd, wd}:
        for p in base.rglob("*.lock"):
            if "objects" in p.parts:
                continue
            found.append(p)
    return sorted(set(found))


def unique_orphan_name(p):
    """<lock>.orphan-AAAAMMDD; if that name exists (an orphan of the same day), add the time, then a counter. A rename
    over an existing file would erase it - the rule of the repo is that nothing is overwritten."""
    now = dt.datetime.now()
    base = p.with_name(p.name + ".orphan-" + now.strftime("%Y%m%d"))
    for cand in (base, p.with_name(base.name + now.strftime("-%H%M%S"))):
        if not cand.exists():
            return cand
    n = 2
    while True:
        cand = p.with_name(f"{base.name}-{now.strftime('%H%M%S')}-{n}")
        if not cand.exists():
            return cand
        n += 1


def _repo_roots(cwd=None):
    """Every directory whose git processes can hold a lock of this repository: the main checkout and each linked worktree."""
    roots = {str(common_dir(cwd).resolve().parent)}
    r = git(["worktree", "list", "--porcelain"], cwd=cwd, check=False)
    for line in r.stdout.splitlines():
        if line.startswith("worktree "):
            roots.add(str(Path(line[9:]).resolve()))
    return roots


def active_git_processes(cwd=None):
    """[(pid, args)] of the git processes alive in this repository (R22, F72). 2026-10-25: `--retire-orphans` renamed any lock older
    than 120 s without looking for a live git, though the docstring promised to: a long merge or a gc owns its `index.lock` for
    minutes. A process counts when its program is git (`git`, `git-*`) and its working directory, or its --git-dir/-C, is inside
    this repository. A process whose directory cannot be read counts as active (when in doubt, the lock is not touched).
    `ps` and `lsof` ship with macOS and Linux; with neither, the answer is "unknown" and the caller does not retire."""
    me = {os.getpid(), os.getppid()}
    ps = subprocess.run(["ps", "-axo", "pid=,args="], capture_output=True, text=True, timeout=20)
    if ps.returncode != 0:
        raise RuntimeError("ps não respondeu")
    roots = _repo_roots(cwd)
    found = []
    for line in ps.stdout.splitlines():
        parts = line.strip().split(None, 1)
        if len(parts) < 2 or not parts[0].isdigit() or int(parts[0]) in me:
            continue
        pid, args = int(parts[0]), parts[1]
        prog = os.path.basename(args.split(None, 1)[0])
        if not (prog == "git" or prog.startswith("git-")):
            continue
        if any(root in args for root in roots):
            found.append((pid, args))
            continue
        where = subprocess.run(["lsof", "-a", "-d", "cwd", "-p", str(pid), "-Fn"], capture_output=True, text=True, timeout=20)
        names = [l[1:] for l in where.stdout.splitlines() if l.startswith("n")]
        if not names and not _still_running(pid):   # it ended between `ps` and `lsof`: not alive (2026-10-25, the flaky R22 case)
            continue
        if not names or any(n == r or n.startswith(r + os.sep) for n in names for r in roots):
            found.append((pid, args))
    return found


def _still_running(pid):
    """True while the process exists (or cannot be signalled for lack of permission: then it exists)."""
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def _live_git(cwd=None):
    """The live git processes, or a one-item list saying the check could not run (then the lock is left alone)."""
    try:
        return active_git_processes(cwd)
    except (OSError, RuntimeError, subprocess.SubprocessError) as e:
        return [(0, f"não consegui conferir os processos ({e})")]


def preflight(cwd=None, retire=False, min_age=120):
    """Findings before a train. A lock older than `min_age` seconds AND with no git process alive in the repository is an orphan:
    no git operation of ours holds a lock for minutes (the 2026-10-24 one stayed for hours), but a long merge or a gc can. A fresh
    lock means someone is working: wait. An old lock with a live git is reported and not touched (R22)."""
    findings = []
    mh = git_path("MERGE_HEAD", cwd)
    if mh.exists():
        msg = git_path("MERGE_MSG", cwd)
        body = msg.read_text(encoding="utf-8") if msg.exists() else ""
        subj = body.splitlines()[0] if body else "?"
        findings.append(f"merge aberto neste checkout ({subj}): não é seu - veja de quem é antes de commitar")
    for p in find_locks(cwd):
        age = int(dt.datetime.now().timestamp() - p.stat().st_mtime)
        if age < min_age:
            findings.append(f"trava presente: {p} ({age}s) - alguém está no git; espere")
        elif retire and _live_git(cwd):
            pid, args = _live_git(cwd)[0]
            findings.append(f"trava velha com git vivo: {p} ({age}s) - o processo {pid} ({args[:60]}) pode ser o dono; não aposentada")
        elif retire:
            new = unique_orphan_name(p)
            p.rename(new)
            findings.append(f"trava órfã aposentada: {p.name} -> {new.name} ({age}s)")
        else:
            findings.append(f"trava órfã: {p} ({age}s) - use --retire-orphans (renomeia, não apaga)")
    findings += dirty_daily_checks(cwd)
    findings += dirty_uat(cwd)
    findings += dirty_created_items(cwd)
    findings += dirty_answers(cwd)
    return findings


def dirty_daily_checks(cwd=None):
    """The doctor rewrites `daily-checks/sensor-*.md` in the main checkout (a derived trace, tracked), and that dirties the index
    before the merge (first real train, 2026-10-24). The finding says what to do and does not touch the files: a commit by
    pathspec that only holds derived files needs no log entry; discarding would lose the trace."""
    r = git(["status", "--porcelain", "--", ":(top)daily-checks"], cwd=cwd, check=False)
    files = [ln[3:] for ln in r.stdout.split("\n") if ln.strip()] if r.returncode == 0 else []
    if not files:
        return []
    return [f"daily-checks/ sujo ({', '.join(files)}): é o rastro derivado que o doctor reescreve, e sujaria o índice do merge. "
            "Commite à parte, só ele, antes do trem: `git commit -m \"daily-checks: rastro do doctor\" -- daily-checks/` "
            "(só toca derivado: o commit-msg não pede entrada de log). Não descarte: é o histórico dos avisos."]


def dirty_uat(cwd=None):
    """The «+ Criar» of the Control Center (F144, CC-ADR-0035) adds an issue row to a `docs/specs/uat.md` of the checkout and never
    commits it: the integrator does, before the train. `git merge` refuses a file with a local edit the merge rewrites, and almost every
    branch touches a `uat.md`; the finding names the file and the commit to make. It does not touch the files."""
    r = git(["status", "--porcelain", "--", ":(top,glob)**/docs/specs/uat.md", ":(top)docs/specs/uat.md"], cwd=cwd, check=False)
    files = sorted({ln[3:] for ln in r.stdout.split("\n") if ln.strip()}) if r.returncode == 0 else []
    return [f"{f} sujo: é a issue que o «+ Criar» do Control Center acrescentou (ou uma edição sem commit), e o merge do trem a "
            f"recusaria. Commite antes do trem, por pathspec, com a entrada no log do projeto dono: `git commit -m \"uat: issue criada "
            f"pelo «+ Criar»\" -- {f} <o docs/log.md do projeto>`. Não descarte: é a issue do MJRP." for f in files]


def dirty_created_items(cwd=None):
    """The «+ Criar» (F145, CC-ADR-0036 § 5) also leaves a story, a feature, a task or an epic in the checkout, uncommitted: the `prd.md`, a
    node under `requirements/`, a folder or a `tasks.md` under `features/`. Same as `dirty_uat`: the integrator commits them before the train."""
    specs = ("prd.md", "requirements", "features")
    spec = [":(top,glob)**/docs/specs/" + (n if n == "prd.md" else f"{n}/**") for n in specs] + [f":(top)docs/specs/{n}" for n in specs]
    r = git(["status", "--porcelain", "--", *spec], cwd=cwd, check=False)
    files = sorted({ln[3:] for ln in r.stdout.split("\n") if ln.strip()}) if r.returncode == 0 else []
    if not files:
        return []
    return [f"{', '.join(files)} sujo: é o item que o «+ Criar» do Control Center gravou (ou uma edição sem commit), e nasce na `main`. "
            "Commite antes do trem, por pathspec, com a entrada no log do projeto dono. Não descarte: é o item do MJRP."]


def dirty_answers(cwd=None):
    """The answers of the Control Center's screen (F166, CC-ADR-0039 section 6) leave a log and a report edited in the checkout, no commit: the
    session that applies them commits them, and a merge would refuse the log. It names the commit to make and does not touch the files."""
    r = git(["diff", "--name-only", "-G", r"^## \[[^]]+\] answer — ", "--", ":(top,glob)**/docs/log.md", ":(top)docs/log.md"], cwd=cwd, check=False)
    logs = sorted(ln for ln in r.stdout.split("\n") if ln.strip()) if r.returncode == 0 else []
    return [f"{f} sujo com resposta da tela (entrada `answer`), e o merge do trem o recusaria. Commite antes do trem, por pathspec, com o "
            f"relatório da mesma pergunta: `git commit -m \"answer: respostas da tela\" -- {f} <o relatório em reports/audits/>`." for f in logs]


def _merge_names(merge_subject, cwd=None):
    """What a message of the merge itself may mention: the branch names in MERGE_MSG, the branches pointing at MERGE_HEAD and
    its short hash."""
    names = set(re.findall(r"'([^']+)'", merge_subject))
    r = git(["for-each-ref", "--points-at", "MERGE_HEAD", "--format=%(refname:short)", "refs/heads"], cwd=cwd, check=False)
    names |= {x for x in r.stdout.split() if x}
    h = git(["rev-parse", "--short=7", "MERGE_HEAD"], cwd=cwd, check=False).stdout.strip()
    if h:
        names.add(h)
    return {n.lower() for n in names if len(n) >= 4}


def check_open_merge(msgfile, cwd=None):
    """Warning only. This commit is the merge itself - and stays silent - when its subject starts with 'merge' (any case:
    the repo writes 'merge: ...'), repeats MERGE_MSG's, or when the message names a branch or the hash of MERGE_HEAD (the
    integrator rewrites the subject after a conflict). Anything else closes somebody's merge."""
    mh = git_path("MERGE_HEAD", cwd)
    if not mh.exists():
        return None
    msg = Path(msgfile).read_text(encoding="utf-8", errors="replace")
    subject = next((x for x in msg.splitlines() if x.strip() and not x.startswith("#")), "")
    mm = git_path("MERGE_MSG", cwd)
    body = mm.read_text(encoding="utf-8", errors="replace") if mm.exists() else ""
    merge_subject = body.splitlines()[0] if body.strip() else ""
    if re.match(r"(?i)\s*merge\b", subject) or (merge_subject and subject == merge_subject):
        return None
    low = msg.lower()
    # whole names only: 'other' is a branch, 'another' is not a mention of it
    if any(re.search(rf"(?<![\w/-]){re.escape(n)}(?![\w-])", low) for n in _merge_names(merge_subject, cwd)):
        return None
    return ("AVISO (merge_train): há um merge aberto neste checkout"
            + (f" ({merge_subject})" if merge_subject else "")
            + f" e este commit ('{subject[:60]}') não parece ser o merge.\n"
            "  O commit vai ser feito e FECHA esse merge, levando tudo o que está no índice. Se o merge era de outra sessão:\n"
            "  1) não faça `reset` nem `--amend`; 2) `git show --stat HEAD` mostra o que entrou; 3) avise o dono do merge\n"
            "  antes de qualquer outro comando; 4) se for preciso desfazer, é `git revert -m 1 HEAD`, decisão dele.\n"
            "  Depois disso, trabalhe em um worktree seu: o checkout principal é do integrador.")


# --------------------------------------------------------------------------------------------- web/dist

def toplevel(cwd=None):
    return Path(git(["rev-parse", "--show-toplevel"], cwd=cwd).stdout.strip())


def unwired_drivers(top):
    """F218: the (path, driver, line) of DRIVER_ATTRIBUTES whose path git does not tie to its driver in this checkout, read by
    `git check-attr` (it sees every .gitattributes, nested ones and later lines that turn the driver off). None: git did not answer."""
    r = _git.run(top, "check-attr", "merge", "--", *[path for path, _d, _l in DRIVER_ATTRIBUTES], timeout=GIT_TIMEOUT)
    if not r.ok:
        return None
    got = {}
    for line in r.stdout.splitlines():
        path, _, rest = line.partition(": merge: ")
        got[path.strip()] = rest.strip()
    return [(path, drv, line) for path, drv, line in DRIVER_ATTRIBUTES if got.get(path) != drv]


def wire_drivers(top, write=None):
    """F218: appends to `<top>/.gitattributes` the DRIVER_ATTRIBUTES lines it lacks - never rewrites what is there (a versioned file:
    adding loses nothing). `write(path, text)` replaces the plain write (the kernel's refresh copies the old file to `_backups/` first).
    Returns the lines written."""
    path = Path(top) / ".gitattributes"
    text = path.read_text(encoding="utf-8") if path.is_file() else ""
    have = {ln.strip() for ln in text.splitlines()}
    missing = [line for _p, _d, line in DRIVER_ATTRIBUTES if line not in have]
    if not missing:
        return []
    if text and not text.endswith("\n"):
        text += "\n"
    if DRIVER_ATTRIBUTES_HEADER.splitlines()[0] not in have:
        text += DRIVER_ATTRIBUTES_HEADER
    text += "".join(line + "\n" for line in missing)
    if write:
        write(path, text)
    else:
        path.write_text(text, encoding="utf-8")
    return missing


def configure_drivers(cwd=None):
    """Sets the two drivers in the clone's git config (shared by its worktrees). The command is relative: git runs a driver at the
    top of the checkout that is merging, main or any worktree."""
    git(["config", f"merge.{DRIVER}.name", "MJRP log: union by entry, newest first"], cwd=cwd)
    git(["config", f"merge.{DRIVER}.driver", f"python3 {DRIVER_SCRIPT} log-merge %O %A %B"], cwd=cwd)
    git(["config", f"merge.{MEMORY_DRIVER}.name", "MJRP memory: the branches' prepends to a block of ## Now"], cwd=cwd)
    git(["config", f"merge.{MEMORY_DRIVER}.driver", f"python3 {DRIVER_SCRIPT} memory-merge %O %A %B"], cwd=cwd)


def install_driver(cwd=None):
    """`install-driver` (F218, UAT-539): configures the drivers AND ties the log and the memory to them, and says «instalado» only when
    git confirms the tie. It used to set the config and stop: a child without the `.gitattributes` lines (or without the script the
    driver runs) heard «instalado» and kept conflicting on every merge. Returns (lines, exit code)."""
    top = toplevel(cwd)
    if not (top / DRIVER_SCRIPT).is_file():
        return [f"merge_train: {top.name} não tem `{DRIVER_SCRIPT}`, que os drivers chamam a cada merge — nada foi configurado.",
                f"  traga o script com o kernel: `python3 <harness>/mjrp-scripts/new_project.py {top} --refresh-kernel`, e rode de novo."], 1
    configure_drivers(top)
    lines = [f"merge.{DRIVER}.driver e merge.{MEMORY_DRIVER}.driver configurados neste clone"]
    written = wire_drivers(top)
    if written:
        lines.append(f".gitattributes: + {', '.join(written)} — commite o `.gitattributes` para a ligação valer nos outros clones")
    left = unwired_drivers(top)
    if left is None:
        return lines + ["merge_train: o git não respondeu ao `check-attr` — a ligação não foi confirmada"], 2
    if left:
        return lines + [f"merge_train: {path} não está ligado ao {drv} (o `git check-attr merge -- {path}` não o mostra): outro "
                        f".gitattributes o desliga depois da linha `{line}` — tire a linha que o desliga e rode de novo" for path, drv, line in left], 1
    return lines + [f"instalado e ligado: {', '.join(f'{p} → {d}' for p, d, _l in DRIVER_ATTRIBUTES)}"], 0


def unmerged_paths(cwd=None):
    """Every path the index still holds in conflict (any stage), sorted, without repeats."""
    r = git(["ls-files", "-u", "-z"], cwd=cwd, check=False)
    paths = {rec.split("\t", 1)[1] for rec in r.stdout.split("\0") if "\t" in rec}
    return sorted(paths)


def _under(path, folder):
    folder = folder.rstrip("/")
    return path == folder or path.startswith(folder + "/")


def _dist_allowed(top, dist):
    """The folder `--dist` may name: the Control Center's build, or a folder the project's rules declare derived (a build whose
    output the sensors already treat as regenerable). Never `docs/` or any folder that holds someone's work (judge P1-1, S4)."""
    if dist == DIST_PATH:
        return True
    import _pathclass
    rules = _pathclass.project_rules(top)
    declared = _pathclass.Declared(rules, _pathclass.global_rules(), top)
    return declared.kind(top / dist, True) == _pathclass.DERIVED


_UNMERGED_XY = {"DD", "AU", "UD", "UA", "DU", "AA", "UU"}


def _uncommitted_in(top, dist, merging):
    """Paths under `dist` with an edit that no commit holds and that the conflict does not already own: a tracked file changed in
    the tree, or (outside a merge) staged. Those are class 1 (`_safe.classify`): `git rm -f` would drop them for good. In an open
    merge a change that sits ONLY in the index (tree equal to the index) is the merge's own: git does not start a merge with anything
    staged (`Your local changes ... would be overwritten by merge`, exit 2), so what is staged now is what git merged by itself in
    three ways, e.g. a dist file both branches edited in different lines (judge P2-7, UAT-371). A change in the tree on top of the
    index stays an edit."""
    r = git(["status", "--porcelain", "-z", "--no-renames", "--", f":(top){dist}"], cwd=top, check=False)
    out = []
    for rec in r.stdout.split("\0"):
        if len(rec) < 4:
            continue
        xy, path = rec[:2], rec[3:]
        if xy in _UNMERGED_XY or xy == "??" or xy == "!!":
            continue
        if xy[1] != " ":
            out.append(path)
        elif xy[0] != " " and not merging:
            out.append(path)
    return out


def _link_in_path(top, dist):
    """The first component of `dist` (from the toplevel down) that is a symbolic link, or None. A link anywhere on the way makes the
    folder the script would walk and clean a different one from the one declared (ADR-0023 § 1: a link is classified, never its target)."""
    cur = Path(top)
    for part in Path(dist).parts:
        cur = cur / part
        if cur.is_symlink():
            return cur.relative_to(top).as_posix()
    return None


def _drop_new_untracked(top, dist):
    """The build's own leftovers: whatever sits untracked under `dist` after a failed build. The script verified before the first
    change that nothing untracked was there, so everything found now was created by this run - derived, and its creator removes it.

    This is a NAMED EXCEPTION to ADR-0023 § 2 ("one way to remove: `_safe.py discard`"), of the same kind as the render.mjs temporary
    folder and the backup_repo.py orphans (§ 6): `_safe.classify` would answer class 1 for these files (untracked and not declared
    `derived`: the build folder is versioned), but the script PROVES the provenance itself -- it refuses to start with anything
    untracked in the dist and the filter here is the same (`ls-files -o --exclude-standard`), so only what this run's build wrote can
    match; the ignored never enters. "Whoever creates, removes" (class 3), in the failure path of the creator. Registered in the
    ADR-0023 History (UAT-371, P2-9)."""
    for rel in git(["ls-files", "-o", "--exclude-standard", "-z", "--", f":(top){dist}"], cwd=top, check=False).stdout.split("\0"):
        if rel:
            (top / rel).unlink(missing_ok=True)
    root = top / dist
    if root.is_dir() and _link_in_path(top, dist) is None:     # never walk through a link (P2-8): its target is not ours to clean
        for d in sorted((x for x in root.rglob("*") if x.is_dir()), key=lambda x: len(x.parts), reverse=True):
            try:
                d.rmdir()
            except OSError:
                pass


def _restore_ours(top, dist):
    """Back to the dist of HEAD (ours), with nothing of the failed build staged or left in the tree."""
    git(["rm", "-r", "-f", "-q", "--ignore-unmatch", "--", f":(top){dist}"], cwd=top, check=False)
    _drop_new_untracked(top, dist)
    git(["checkout", "HEAD", "--", f":(top){dist}"], cwd=top, check=False)


def _names(out):
    """The paths of a `-z` listing: a name with a space stays one name."""
    return [p for p in out.split("\0") if p]


def _versioned(top, dist, merging):
    """Whether the build is versioned on every side in play: HEAD and, in an open merge, MERGE_HEAD. One side without it is a
    branch on the other side of the change that took the build out of git (F57): the result keeps the removal."""
    refs = ["HEAD", "MERGE_HEAD"] if merging else ["HEAD"]
    return all(git(["ls-tree", "-r", "--name-only", ref, "--", dist], cwd=top, check=False).stdout.strip() for ref in refs)


def _keep_removal(top, dist, unmerged):
    """F57 (CC-ADR-0027 § 12): the build is not versioned on one side, so nothing of it belongs in the result - the modify/delete
    conflicts of a branch older than the change, and the files such a merge staged by itself (new hashed names), all leave the index.
    `git rm --cached` only: the disk keeps what the merge wrote, ignored and derived (rebuilt by `npm run build` or by the service)."""
    staged = _names(git(["ls-files", "-z", "--", f":(top){dist}"], cwd=top, check=False).stdout)
    if not staged:
        return [f"{dist}: não é versionado (CC-ADR-0027) e o índice não tem nada dele: nada a fazer. Para testar a tela, "
                f"`npm run --prefix {Path(dist).parent.as_posix()} build` compila no disco."], 0
    git(["rm", "-r", "-q", "-f", "--cached", "--ignore-unmatch", "--", f":(top){dist}"], cwd=top)
    left = _names(git(["ls-files", "-z", "--", f":(top){dist}"], cwd=top, check=False).stdout)
    if left:
        return [f"{dist}: tirei do índice, mas {len(left)} caminho(s) seguem lá (ex.: {left[0]})"], 1
    in_conflict = sum(1 for p in unmerged if _under(p, dist))
    return [f"{dist}: não é versionado (CC-ADR-0027): mantive a remoção - {len(set(staged))} caminho(s) fora do índice"
            + (f", {in_conflict} deles em conflito" if in_conflict else "") + "; o disco ficou como o merge deixou (derivado, ignorado). "
            "Se há merge aberto, o `git commit` dele fecha sem o build."], 0


def dist_resolve(dist=DIST_PATH, build_cmd=None, rebuild=False, cwd=None):
    """A conflict in the versioned build is never merged: the file names carry a content hash, so two branches that built
    differently conflict on dozens of files (rename/rename included) and no side is "right". Both sides go, the build runs on
    the sources already merged, and the result is staged. Returns (lines, exit code).

    Order matters: everything that can refuse comes BEFORE the first change (a folder that is not a build, other conflicts, an
    edit without commit or an untracked file in the dist, no node_modules). After the change, a build that fails or produces
    nothing puts the "ours" dist back and removes what it wrote, so the checkout is never left without a dist or with a half one.
    No `rm`: `git rm` takes the tracked files (and the conflict stages) out of the index and the tree - the versioned class leaves
    through git, ADR-0023. A build that one side no longer versions (F57) is never rebuilt into the index: `_keep_removal`."""
    top = toplevel(cwd)
    dist = dist.strip("/")
    link = _link_in_path(top, dist) if dist and ".." not in Path(dist).parts else None
    if link:
        return [f"'{dist}' tem um link simbólico no caminho ({link}): o script percorreria e limparia o alvo do link, não a pasta "
                "declarada. Recusado, nada mudou."], 1
    if not dist or ".." in Path(dist).parts or not _dist_allowed(top, dist):
        return [f"'{dist}' não é uma pasta de build que eu possa recompilar: só `{DIST_PATH}` ou uma pasta declarada em "
                "`structure_rules.json → derived`. Recusado, nada mudou."], 1
    unmerged = unmerged_paths(top)
    if not _versioned(top, dist, git_path("MERGE_HEAD", top).exists()):
        return _keep_removal(top, dist, unmerged)
    in_dist = [p for p in unmerged if _under(p, dist)]
    others = [p for p in unmerged if not _under(p, dist)]
    if not in_dist and not rebuild:
        return [f"{dist}: sem conflito, nada a fazer (`dist-resolve --rebuild` recompila mesmo assim, ao fim do trem)"], 0
    if others:
        return [f"{len(others)} conflito(s) fora do {dist}: resolva antes (o build lê as fontes já mescladas):"]\
            + [f"  {p}" for p in others[:15]] + (["  ..."] if len(others) > 15 else []), 1
    cmd = build_cmd or os.environ.get(DIST_BUILD_ENV) or DIST_BUILD_DEFAULT
    web = (top / dist).parent
    if not web.is_dir():
        return [f"{web} não existe: não há de onde construir"], 2
    if cmd == DIST_BUILD_DEFAULT and not (web / "node_modules").is_dir():
        return [f"{web}/node_modules não existe: rode `npm ci --prefix {web.relative_to(top).as_posix()}` e repita"], 2
    edited = _uncommitted_in(top, dist, git_path("MERGE_HEAD", top).exists())
    if edited:
        return [f"{len(edited)} edição(ões) SEM commit em {dist} (ex.: {edited[0]}): são classe 1, o `git rm` as perderia. "
                "Commite-as ou guarde com `python3 mjrp-scripts/_safe.py retire <caminho>` e repita. Recusado, nada mudou."], 1
    stray = git(["ls-files", "-o", "--exclude-standard", "--", f":(top){dist}"], cwd=top, check=False).stdout.split()
    if stray:
        return [f"{len(stray)} arquivo(s) NÃO versionado(s) em {dist}, que o git não devolve (ex.: {stray[0]}). "
                "Mova-os antes com `python3 mjrp-scripts/_safe.py retire <caminho>` e repita."], 1
    lines = [f"{dist}: {len(in_dist)} caminho(s) em conflito; descarto os dois lados e recompilo ({cmd})"]
    git(["rm", "-r", "-f", "-q", "--ignore-unmatch", "--", f":(top){dist}"], cwd=top)
    try:
        b = subprocess.run(shlex.split(cmd), cwd=str(web), capture_output=True, text=True, timeout=DIST_BUILD_TIMEOUT)
        built = b.returncode == 0
        tail = (b.stdout + b.stderr).strip().splitlines()[-25:]
    except (OSError, subprocess.SubprocessError) as e:
        built, tail = False, [repr(e)]
    n = 0
    if built:
        git(["add", "-A", "--", f":(top){dist}"], cwd=top, check=False)      # fails when the build left no folder: n stays 0
        n = len(git(["ls-files", "--", f":(top){dist}"], cwd=top, check=False).stdout.split())
    if not built or n == 0:
        _restore_ours(top, dist)
        why = "saiu com erro" if not built else f"não deixou nenhum arquivo versionável em {dist}"
        return lines + [f"o build FALHOU ({why}); voltei o dist do nosso lado (HEAD), sem conflito, e tirei o que ele escreveu. "
                        "Não feche o merge assim: conserte o build e rode `python3 mjrp-scripts/merge_train.py dist-resolve --rebuild`. "
                        "Fim da saída:"] + [f"  {x}" for x in tail], 1
    left = [p for p in unmerged_paths(top) if _under(p, dist)]
    if left:
        return lines + [f"o build rodou, mas {len(left)} caminho(s) de {dist} seguem em conflito no índice (ex.: {left[0]})"], 1
    return lines + [f"{dist}: recompilado das fontes mescladas, {n} arquivo(s) no índice. Se há merge aberto, o `git commit` dele leva o dist novo; "
                    "fora de um merge, é um commit de dado (leva entrada no log do projeto dono)."], 0


# --------------------------------------------------------------------------------------------- uat-check

def _row_ids(text):
    return [m.group(1) for ln in (text or "").split("\n") for m in [ROW.match(ln)] if m]


def _merge_state(cwd=None):
    """('open', ours_ref) while MERGE_HEAD exists, ('done', 'HEAD^1') right after a merge commit, (None, None) otherwise."""
    if git_path("MERGE_HEAD", cwd).exists():
        return "open", "HEAD"
    parents = git(["rev-list", "--parents", "-n", "1", "HEAD"], cwd=cwd, check=False).stdout.split()
    return ("done", "HEAD^1") if len(parents) >= 3 else (None, None)


def _fork_point(cwd=None):
    """Where HEAD left main (F232 recheck P1-1): a branch behind main must not be accused of rows main gained after it forked."""
    r = git(["merge-base", "HEAD", "main"], cwd=cwd, check=False)
    return r.stdout.strip() if r.returncode == 0 and r.stdout.strip() else None


def uat_check(paths=None, reservations=True, cwd=None):
    """After a merge that touches a `uat.md` - with or without a conflict, committed or still open - confirms that no id is taken
    twice and that every id the merge BROUGHT was reserved (`next-uat-id --reserve` or `uat-merge`). `uat-merge` only runs when git
    stops on a conflict; a clean text merge puts two rows with the same id side by side and nobody looked (first real train,
    2026-10-24). Returns (lines, findings)."""
    state, ours_ref = _merge_state(cwd)
    ref = ours_ref or "HEAD"
    if paths:
        touched = list(paths)
    elif state is None:
        # not a merge (the renumbering commit that follows one, say): there is nothing "new" to compare, but a repeated id or a
        # marker still shows in the uat.md of HEAD (judge P2-4)
        touched = [p for p in git(["ls-tree", "-r", "--name-only", "HEAD"], cwd=cwd).stdout.split("\n") if p.endswith("docs/specs/uat.md")]
        if not touched:
            return ["HEAD não é um merge e não há nenhum docs/specs/uat.md: nada a conferir"], []
    else:
        diff = ["diff", "--name-only", "HEAD"] if state == "open" else ["diff", "--name-only", "HEAD^1", "HEAD"]
        names = set(git(diff, cwd=cwd).stdout.split()) | set(unmerged_paths(cwd))
        touched = sorted(p for p in names if p.endswith("docs/specs/uat.md"))
    if not touched:
        return ["o merge não toca nenhum docs/specs/uat.md: nada a conferir"], []
    lines, findings = [], []
    unmerged = set(unmerged_paths(cwd))
    for path in touched:
        if path in unmerged:
            findings.append(f"{path}: ainda em conflito no índice - rode `python3 mjrp-scripts/merge_train.py uat-merge --git {path}` antes")
            continue
        text = show(":0" if state == "open" else "HEAD", path, cwd)
        if text is None:
            findings.append(f"{path}: não consegui ler o arquivo do resultado do merge")
            continue
        if any(MARK_OURS.match(ln) or MARK_THEIRS.match(ln) for ln in text.split("\n")):
            findings.append(f"{path}: tem marcadores de conflito")
        ids = _row_ids(text)
        for uid in sorted({i for i in ids if ids.count(i) > 1}, key=lambda x: int(x.split("-")[1])):
            at = [str(n) for n, ln in enumerate(text.split("\n"), 1) if re.match(rf"^\|\s*{re.escape(uid)}\s*\|", ln)]
            findings.append(f"{path}: {uid} repetido (linhas {', '.join(at)}) - dois ramos criaram o mesmo id; renumere o segundo")
        old = set(_row_ids(show(ref, path, cwd)))
        # UAT-551 (F232): a uat.md never loses an issue row. In a merge it is compared with BOTH parents; outside one, with main.
        refs = [ref] + (["MERGE_HEAD" if state == "open" else "HEAD^2"] if state else ([_fork_point(cwd)] if _fork_point(cwd) and show(_fork_point(cwd), path, cwd) is not None else []))
        gone = lost_ids([show(r, path, cwd) or "" for r in refs], text)
        if gone:
            findings.append(f"{path}: perdeu {len(gone)} linha(s) de issue em relação a {' e '.join(dict.fromkeys(refs))}: {', '.join(gone)} "
                            f"(o resultado tem {len(set(ids))}); NÃO dê o merge por feito, refaça a junção")
        new = [i for i in dict.fromkeys(ids) if i not in old]
        if reservations and new:
            reserved = set(_reservations(path, cwd)[0])
            for uid in new:
                if int(uid.split("-")[1]) not in reserved:
                    findings.append(f"{path}: {uid} entrou com o merge e ninguém o reservou (fora da sequência de `next-uat-id --reserve`)")
        lines.append(f"{path}: {len(set(ids))} id(s)" + (f", {len(new)} novo(s) neste merge" if state else ", só repetidos e marcadores (HEAD não é um merge)"))
    return lines, findings


def uat_advice(findings):
    """What to do about the findings, one rule for the script, the skill's checklist and reference/conflicts.md (judge P2-3):
    a repeated id or a marker is renumbered or fixed; an unreserved id is READ, and kept (with --no-reservations) when no other
    branch and not main uses the number."""
    out = []
    if any("ninguém o reservou" in x for x in findings):
        out.append("id sem reserva: veja de qual ramo veio e se outro ramo ou a main já usa o número; se ninguém usa, siga com "
                   "`python3 mjrp-scripts/merge_train.py uat-check --no-reservations` e registre na entrada do trem; se usa, renumere")
    if any("ninguém o reservou" not in x for x in findings):
        out.append("id repetido ou marcador: renumere o segundo (`python3 mjrp-scripts/merge_train.py next-uat-id --reserve`) num commit "
                   "seguinte, com a linha nova no log, e confira de novo com `uat-check` (sem `--path` ele lê o HEAD)")
    return out


# --------------------------------------------------------------------------------------------- merge (one call per branch)

def _conflict_plan(paths, branch, dist=DIST_PATH, cwd=None):
    """One line per kind of conflicted file, with the subcommand or the rule that resolves it (reference/conflicts.md)."""
    plan, in_dist = [], [p for p in paths if _under(p, dist)]
    for p in paths:
        if _under(p, dist):
            continue
        if p.endswith("docs/log.md") or p == "docs/log.md":
            plan.append(f"  {p}: log - `python3 mjrp-scripts/merge_train.py log-union {p}` e `git add {p}`")
        elif p.endswith("docs/specs/uat.md"):
            project_log = p[:-len("specs/uat.md")] + "log.md"
            plan.append(f"  {p}: uat.md - `python3 mjrp-scripts/merge_train.py uat-merge --git {p} --log {project_log} --branch {branch}` e `git add {p}`")
        elif p.endswith("MEMORY.md"):
            plan.append(f"  {p}: MEMORY.md - à mão, os fatos dos dois lados (reference/conflicts.md)")
        else:
            plan.append(f"  {p}: fonte ou outro - leia os dois lados; duas intenções nas mesmas linhas: `git merge --abort` e devolva ao dono")
    if in_dist and not _versioned(toplevel(cwd), dist, True):
        plan.append(f"  {dist}: {len(in_dist)} caminho(s) - `python3 mjrp-scripts/merge_train.py dist-resolve` (o build não é versionado, "
                    "CC-ADR-0027: mantém a remoção, sem compilar)")
    elif in_dist:
        plan.append(f"  {dist}: {len(in_dist)} caminho(s) - `python3 mjrp-scripts/merge_train.py dist-resolve` (depois dos outros conflitos)")
    return plan


def retro_gate(branch, cwd=None):
    """F101 (S-186): the net for what escaped the commit. A fast-lane feature the branch takes to Done (closed in the branch, not in the
    base) without its retroactive step - the rows of the artifact registry, read from the base (main) - refuses the branch BEFORE the merge
    starts: nothing to abort. Same rule as the pre-commit (retro_step_check.py). Returns (lines, code): code 0 lets the merge go (the lines
    are notes: what was not checked), 1 refuses it, 2 could not evaluate."""
    top = toplevel(cwd)
    how = "no harness, `python3 mjrp-scripts/new_project.py <o projeto> --refresh-kernel` traz o que falta"
    try:
        import retro_step_check as rsc
    except ImportError:   # a repository that does not carry the gate (a child, a throwaway train): said, and refused when the branch closes a feature
        r = git(["diff", "--name-only", f"HEAD...{branch}"], cwd=cwd, check=False)
        closes = sorted({m.group(1) for m in re.finditer(r"(?:^|/)docs/specs/features/(F\d+)-[^/]+/spec\.md$", r.stdout, re.M)})
        if closes:   # F182 (UAT-489): «não conferido» is no approval - the branch touches a feature spec and nothing here can tell if it closes one
            return [f"o ramo {branch} mexe na spec de {', '.join(closes)} e retro_step_check.py não está neste repositório: o passo retroativo "
                    f"NÃO foi conferido; não comecei o merge ({how})"], 2
        return ["  passo retroativo: retro_step_check.py não está neste repositório - NÃO conferido (o ramo não mexe em spec de feature)"], 0
    try:
        results = rsc.check(top, "branch", branch, "HEAD")
    except rsc.NoRegistry as e:   # raised only when the branch takes a fast-lane feature to Done: that closing cannot be judged here
        return [f"o passo retroativo do ramo {branch} NÃO foi conferido ({e}); não comecei o merge ({how})"], 2
    except (rsc.NotEvaluable, _git.GitError) as e:
        return [f"o passo retroativo do ramo {branch} NÃO foi conferido ({e}); não comecei o merge"], 2
    bad = [(f, m) for f, m, _u in results if m]
    if not bad:
        return [], 0
    lines = [f"o ramo {branch} leva {len(bad)} feature(s) da via rápida a Done sem o passo retroativo; não comecei o merge:"]
    for f, missing in bad:
        lines.append(f"  {f['folder']}:")
        lines += [f"    - [{row['id']} · {row['name']}] {msg}" for row, msg in missing]
    lines.append(f"  -> devolva o ramo à sessão dele: o passo retroativo é feito no próprio ramo (a `mjrp-syncing-docs`); a lista vem de "
                 f"`{rsc.REGISTRY}`. Para ver o mesmo: `python3 mjrp-scripts/retro_step_check.py . --branch {branch}`")
    return lines, 1


CATALOG_REL = "mjrp-scripts/canonical_catalog.json"
EDITORIAL_STAMP = re.compile(r"^Catalog-editorial:[ \t]*(\S+)", re.M)


def catalog_gate(branch, cwd=None):
    """F208 (UAT-508): a branch that changes an item's `pattern_digest` in the canonical catalog without raising its version needs the
    human's `Catalog-editorial: <item> — <reason>` on one of its own commits; without it the branch is refused BEFORE the merge starts.
    Once merged, such a change was an error of the Learn gate that nothing fixed (the merge `38e17187c`, `process-sensors`). Returns
    (lines, code): 0 lets the merge go, 1 refuses it, 2 could not read the branch's catalog."""
    r = git(["merge-base", "HEAD", branch], cwd=cwd, check=False)
    base = r.stdout.strip() if r.returncode == 0 else ""
    old_text = show(base, CATALOG_REL, cwd) if base else None
    if old_text is None:
        return [], 0                                  # no catalog at the fork point: nothing of it can change without a stamp
    new_text = show(branch, CATALOG_REL, cwd)

    def items(text):
        try:
            return {x["id"]: x for x in json.loads(text)["items"]}
        except (TypeError, ValueError, KeyError):
            return None
    old, new = items(old_text), items(new_text) if new_text is not None else None
    if old is None or new is None:
        return [f"não consegui ler {CATALOG_REL} no ramo {branch} ou no ponto de onde ele saiu: o carimbo editorial NÃO foi conferido; "
                f"não comecei o merge"], 2
    changed = sorted(i for i, it in new.items() if i in old and it.get("pattern_digest") != old[i].get("pattern_digest")
                     and it.get("version") == old[i].get("version"))
    if not changed:
        return [], 0
    bodies = git(["log", "--format=%B", f"{base}..{branch}"], cwd=cwd, check=False).stdout
    stamped = {m.group(1) for m in EDITORIAL_STAMP.finditer(bodies)}
    missing = [i for i in changed if i not in stamped]
    if not missing:
        return [], 0
    return [f"o ramo {branch} muda o pattern_digest de {', '.join(missing)} no catálogo canônico sem subir a versão, e nenhum commit dele "
            f"tem o carimbo do humano; não comecei o merge:"] \
        + [f"  - {i}: suba a versão do item e escreva a nota da cadeia, ou o MJRP carimba um commit do ramo com "
           f"`Catalog-editorial: {i} — <motivo>` (só ele o escreve)" for i in missing], 1


def copy_retype_gate(branch, cwd=None):
    """F208 (UAT-463 P2-D): an existing row of `uat.md` turned into `copy` is refused on a direct commit to `main` (copy_change_check.py), and a
    branch carried it in through the train: the merge is not judged by the pre-commit. The same rule, on the branch against where it forked,
    BEFORE the merge starts. Returns (lines, code): 0 lets the merge go, 1 refuses it, 2 could not judge."""
    r = git(["merge-base", "HEAD", branch], cwd=cwd, check=False)
    base = r.stdout.strip() if r.returncode == 0 else ""
    if not base:
        return [], 0
    d = git(["-c", "core.quotePath=false", "diff", "--name-only", "--no-renames", base, branch], cwd=cwd, check=False)
    uats = [p for p in d.stdout.splitlines() if re.search(r"(?:^|/)docs/specs/uat\.md$", p)]
    if not uats:
        return [], 0
    try:
        import copy_change_check as ccc
    except ImportError:
        return [f"o ramo {branch} mexe em {', '.join(uats)} e copy_change_check.py não está neste repositório: a troca de tipo para `copy` NÃO foi "
                f"conferida; não comecei o merge"], 2
    retyped = []
    try:
        for rel in uats:
            proj = rel[: -len("docs/specs/uat.md")]
            retyped += ccc.changed_rows(show(base, rel, cwd), show(branch, rel, cwd), ccc.copy_values(toplevel(cwd), proj))[2]
    except ccc.NotEvaluable as e:
        return [f"a troca de tipo para `copy` no ramo {branch} NÃO foi conferida ({e}); não comecei o merge"], 2
    if not retyped:
        return [], 0
    return [f"o ramo {branch} troca para `copy` o tipo de uma linha que já existe ({', '.join(retyped)}); não comecei o merge. Só uma linha nova "
            f"nasce `copy`, porque isso troca o tipo e a trilha da issue ({ccc.RULE}). Devolva o ramo à sessão dele, com o tipo de antes"], 1


def end_of_train_cleanup(cwd=None, branch_to_watch="main"):
    """The train ends when a merge lands on `main` (F120, UAT-401): the owner of the worktrees (`clean-worktrees --apply`) runs by itself, so
    the merged ones do not wait for someone to remember. On any other branch (the integration branch, mid-train) nothing happens: what that
    branch took in is not in `main` yet, so no worktree of it would be class 3. Only what classifies as derived goes (`_safe.discard`); the
    others stay with their reason. Never raises: the merge already happened, a failed cleanup is a line, not a failure of the merge."""
    head = git(["rev-parse", "--abbrev-ref", "HEAD"], cwd=cwd, check=False)
    if head.returncode != 0 or head.stdout.strip() != branch_to_watch:
        return []
    try:
        cleaned, failures = clean_worktrees(cwd=cwd, apply=True)
    except Exception as e:                                         # noqa: BLE001 - the merge stays made whatever the cleanup does
        return [f"  fim do trem: a limpeza dos worktrees não rodou ({type(e).__name__}: {e}); rode `clean-worktrees --apply`"]
    out = [f"  fim do trem (limpeza dos worktrees): {x}" for x in cleaned]
    if failures:
        out.append(f"  fim do trem: {failures} worktree(s) não saíram; rode `clean-worktrees --apply` e veja o motivo")
    return out


def built_screen_check(cwd=None, dist=DIST_PATH):
    """F57: a merge that went in clean must not bring the build back into git. A branch older than F57 conflicts on the build
    (modify/delete) whenever it rebuilt it; this catches the rest - files the merge added by itself - since an automatic merge commit
    does not run the pre-commit guard. Returns the findings."""
    def tracked(ref):
        return _names(git(["ls-tree", "-r", "-z", "--name-only", ref, "--", dist], cwd=toplevel(cwd), check=False).stdout)
    now = tracked("HEAD")
    if not now or tracked("HEAD^1"):
        return []
    return [f"{dist}: o merge trouxe {len(now)} arquivo(s) da tela compilada de volta ao git (CC-ADR-0027 § 1); "
            f"tire-os num commit seguinte: `git rm -r -q --cached {dist}`, com a linha no log"]


def _timed_out_merge(branch, head_before, cwd=None):
    """The `git merge` passed MERGE_TIMEOUT (UAT-490): undo what it left, and say what happened. The merge may have committed in the
    last second (HEAD moved): then it went in and is said so. Otherwise: with a MERGE_HEAD, `merge --abort`; without one (the process
    was killed after the hook began and before the commit) `reset --merge` brings the index and the tree back to HEAD, keeping any edit
    that was not part of the merge (the preflight had checked the tree clean)."""
    why = f"passou de {MERGE_TIMEOUT} s (a conferência do portão e a espera do Touch ID, sob carga)"
    try:
        if git(["rev-parse", "HEAD"], cwd=cwd).stdout.strip() != head_before:
            return [f"o merge de {branch} {why} e mesmo assim entrou (o HEAD andou): confira com `git log -1` e rode o `uat-check`."]
        if git_path("MERGE_HEAD", cwd).exists():
            git(["merge", "--abort"], cwd=cwd, check=False)
        else:
            git(["reset", "--merge"], cwd=cwd, check=False)
        undone = (not git_path("MERGE_HEAD", cwd).exists()
                  and git(["diff", "--cached", "--quiet"], cwd=cwd, check=False).returncode == 0
                  and git(["rev-parse", "HEAD"], cwd=cwd).stdout.strip() == head_before)
    except _git.GitError:
        undone = False
    state = ("o merge foi DESFEITO sozinho: nada foi commitado e o índice voltou ao HEAD" if undone
             else "NÃO consegui desfazer o merge: veja `git status` e NÃO feche com `git commit` (o portão visual não roda nele)")
    return [f"o merge de {branch} {why}; {state}.",
            "rode de novo com a máquina mais livre; se o Touch ID não foi atendido a tempo, o que faltou foi o dedo, não o trem."]


def train_merge(branch, message=None, cwd=None):
    """One call per branch: `preflight` (an open merge, a lock, a dirty daily-checks stop it), `git merge --no-ff`, and - when the
    merge went in - the ids check. On a conflict the merge stays open and the output says what resolves each file. Returns (lines, code).
    The merge commits by itself, so the `pre-merge-commit` hook (the visual recheck gate) runs as in any `git merge`."""
    found = preflight(cwd)
    if found:
        return ["preflight não está limpo, não comecei o merge:"] + [f"  {x}" for x in found], 1
    if git(["rev-parse", "--verify", "-q", f"{branch}^{{commit}}"], cwd=cwd, check=False).returncode != 0:
        return [f"o ramo '{branch}' não existe"], 2
    notes, code = retro_gate(branch, cwd)
    if code:
        return notes, code
    for gate in (catalog_gate, copy_retype_gate):
        refused, code = gate(branch, cwd)
        if code:
            return refused, code
    head_before = git(["rev-parse", "HEAD"], cwd=cwd).stdout.strip()
    try:
        r = git(["merge", "--no-ff", "-m", message or f"merge: {branch}", branch], cwd=cwd, check=False, timeout=MERGE_TIMEOUT)
    except _git.GitTimeout:
        return _timed_out_merge(branch, head_before, cwd), 1
    said = (r.stdout + r.stderr).strip().splitlines()
    if r.returncode == 0:
        head = git(["rev-parse", "--short", "HEAD"], cwd=cwd).stdout.strip()
        lines = [f"merge de {branch} feito ({head})"] + notes
        chk, findings = uat_check(cwd=cwd)
        built = built_screen_check(cwd)
        lines += [f"  uat-check: {x}" for x in chk] + [f"  ACUSA {x}" for x in findings + built]
        lines += [f"  -> {x}" for x in uat_advice(findings)]
        lines += end_of_train_cleanup(cwd)
        return lines, 1 if findings or built else 0
    unmerged = unmerged_paths(cwd)
    if unmerged:
        return [f"conflito ao mesclar {branch}: {len(unmerged)} caminho(s). O merge ficou ABERTO; resolva e depois `git commit` (com a mensagem do merge):"] \
            + _conflict_plan(unmerged, branch, cwd=cwd) + ["depois do commit: `python3 mjrp-scripts/merge_train.py uat-check`"], 1
    if git_path("MERGE_HEAD", cwd).exists():
        # A hook (the visual recheck gate) refused the commit of a merge that git had already prepared. Leaving it open would put the
        # gate-skipping `git commit` one command away - `pre-merge-commit` does not run on it (harness-kaizen 2026-10-25 22:31). Nothing
        # was resolved by hand yet, so the merge goes back; the way through is the gate's own (the judge's report), never a bypass.
        ab = git(["merge", "--abort"], cwd=cwd, check=False)
        state = ("o merge foi ABORTADO (nada foi perdido)" if ab.returncode == 0 and not git_path("MERGE_HEAD", cwd).exists()
                 else "NÃO consegui abortar o merge (`git merge --abort` falhou): veja `git status` e NÃO feche com `git commit`")
        return [f"um hook recusou o merge de {branch}; {state}. Saída do git:"] + [f"  {x}" for x in said[-15:]] \
            + ["não feche esse merge com `git commit`: o portão visual não roda nele. O caminho é o do portão (a reconferência visual, o "
               "relatório do juiz do lote); um P0 só o MJRP libera."], 1
    return [f"o git recusou o merge de {branch}:"] + [f"  {x}" for x in said[-15:]], 1


# --------------------------------------------------------------------------------------------- CLI

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("log-union"); p.add_argument("paths", nargs="+")
    p = sub.add_parser("log-merge"); [p.add_argument(a) for a in ("base", "ours", "theirs")]
    p = sub.add_parser("uat-merge")
    p.add_argument("base", nargs="?"); p.add_argument("ours", nargs="?"); p.add_argument("theirs", nargs="?")
    p.add_argument("--git", metavar="PATH", help="read the three stages of a conflicted merge for this path")
    p.add_argument("--out"); p.add_argument("--log", help="the project's log, for the renumbering note")
    p.add_argument("--branch", default="o ramo"); p.add_argument("--no-branches", action="store_true")
    p.add_argument("--path", help="the uat.md path on main, for the reservation (default: the --git path)")
    p.add_argument("--their-ref", help="the branch being merged, to list its references to a renumbered id (--git: MERGE_HEAD)")
    p = sub.add_parser("memory-merge"); [p.add_argument(a) for a in ("base", "ours", "theirs")]
    p = sub.add_parser("next-uat-id")
    p.add_argument("--path"); p.add_argument("--reserve", action="store_true"); p.add_argument("--no-branches", action="store_true")
    p.add_argument("--json", action="store_true")
    p = sub.add_parser("next-item-id")
    p.add_argument("--kind", required=True, choices=("story", "feature", "epic")); p.add_argument("--project", default=".")
    p.add_argument("--reserve", action="store_true"); p.add_argument("--no-branches", action="store_true")
    p = sub.add_parser("preflight"); p.add_argument("--retire-orphans", action="store_true")
    p = sub.add_parser("check-open-merge"); p.add_argument("msgfile")
    sub.add_parser("install-driver")
    p = sub.add_parser("clean-worktrees"); p.add_argument("--apply", action="store_true")
    p = sub.add_parser("merge"); p.add_argument("branch"); p.add_argument("--message", help="the merge commit's subject (default: merge: <branch>)")
    p = sub.add_parser("session-check"); p.add_argument("worktree"); p.add_argument("--session", help="an id the closing entry may name instead of the branch (F198), and the lease must carry")
    p.add_argument("--base", default="main", help="the integration branch (default main)")
    p = sub.add_parser("dist-resolve")
    p.add_argument("--dist", default=DIST_PATH, help=f"the build folder (default {DIST_PATH}, not versioned since F57)")
    p.add_argument("--build-cmd", help=f"the build command, run in the folder above the dist (default: ${DIST_BUILD_ENV} or `{DIST_BUILD_DEFAULT}`)")
    p.add_argument("--rebuild", action="store_true", help="build again even with no conflict in the dist (the end of the train)")
    p = sub.add_parser("uat-check")
    p.add_argument("--path", action="append", help="a uat.md to check (default: every one the merge touches)")
    p.add_argument("--no-reservations", action="store_true", help="only the repeated ids; skip the 'nobody reserved it' check")
    a = ap.parse_args(argv)

    if a.cmd == "log-union":
        left = refused = 0
        for x in a.paths:
            if not _has_markers(x) and _unmerged(x):
                print(f"RECUSADO {x}: o git a mantém em conflito, mas o arquivo não tem marcadores - o driver caiu e o arquivo "
                      f"ficou só com o nosso lado. Refaça os marcadores com `git checkout --merge -- {x}` e rode de novo.")
                refused += 1
                continue
            left += log_union_file(x)
        print(f"regiões não resolvidas: {left}")
        return 1 if left or refused else 0
    if a.cmd == "log-merge":
        try:
            rd = lambda f: Path(f).read_bytes().decode("utf-8", "surrogateescape")  # noqa: E731
            text, ok = log_merge(rd(a.base), rd(a.ours), rd(a.theirs))
            Path(a.ours).write_bytes(text.encode("utf-8", "surrogateescape"))
            return 0 if ok else 1
        except Exception as e:  # never leave OURS as the clean result of a merge that did not happen
            print(f"merge_train log-merge FALHOU ({e!r}): deixei os marcadores do git no arquivo; resolva à mão.", file=sys.stderr)
            try:
                write_conflict_markers(a.base, a.ours, a.theirs)
            except Exception as e2:
                print(f"merge_train: nem os marcadores saíram ({e2!r}); o arquivo é só o nosso lado - NÃO dê git add.",
                      file=sys.stderr)
            return 1
    if a.cmd == "uat-merge":
        if a.git:
            base, ours, theirs = (show_stage(n, a.git) for n in (1, 2, 3))
            a.out = a.out or a.git
        else:
            base, ours, theirs = (Path(x).read_text(encoding="utf-8") for x in (a.base, a.ours, a.theirs))
        upath = a.path or a.git
        free = 0
        if not a.no_branches and upath:
            try:
                free = int(next_uat_id(path=upath)[1]["highest"])
            except RuntimeError:
                free = 0
        if a.git and not (ours or theirs):
            print(f"RECUSADO {a.git}: o git não o tem em conflito (nenhum estágio 2 ou 3 no índice); nada gravado. "
                  "Já resolvido ou sem conflito: rode `uat-check`; para refazer, `git checkout --merge -- <arquivo>`.", file=sys.stderr)
            return 2
        try:
            text, rep = uat_merge(base, ours, theirs, free_start=free)
        except UatLostRows as e:
            print(f"RECUSADO {a.git or a.out or 'uat-merge'}: {e}; nada gravado e o merge segue aberto.", file=sys.stderr)
            return 2
        if a.out:
            Path(a.out).write_text(text, encoding="utf-8")
        else:
            sys.stdout.write(text)
        refs = None
        if rep["renumbered"]:
            if upath:
                reserve_ids(upath, list(rep["renumbered"].values()))
            their = a.their_ref or ("MERGE_HEAD" if a.git else None)
            if their:
                refs = added_references(list(rep["renumbered"]), "HEAD", their)
            rep["references"] = refs
            for old, lst in (refs or {}).items():
                for x in lst:
                    print(f"  ainda cita {old}: {x}", file=sys.stderr)
        print(json.dumps(rep, ensure_ascii=False), file=sys.stderr)
        if rep["renumbered"] and a.log:
            insert_log_entry(a.log, log_note_entry(rep["renumbered"], a.branch, refs))
        return 1 if rep["conflicts"] or rep["unresolved"] else 0
    if a.cmd == "next-uat-id":
        uid, info = next_uat_id(path=a.path, reserve=a.reserve, branches=not a.no_branches)
        print(json.dumps({"id": uid, **info}, ensure_ascii=False) if a.json else uid)
        return 0
    if a.cmd == "next-item-id":
        print(next_item_id(a.kind, a.project, reserve=a.reserve, branches=not a.no_branches))
        return 0
    if a.cmd == "preflight":
        f = preflight(retire=a.retire_orphans)
        for x in f:
            print("  " + x)
        print("preflight: limpo" if not f else f"preflight: {len(f)} achado(s)")
        return 1 if f else 0
    if a.cmd == "clean-worktrees":
        lines, failures = clean_worktrees(apply=a.apply)
        for x in lines:
            print("  " + x)
        print(f"clean-worktrees: {len(lines)} worktree(s) vistos" + (f", {failures} falhou(aram)" if failures else ""))
        return 1 if failures else 0
    if a.cmd == "merge":
        lines, code = train_merge(a.branch, a.message)
        print("\n".join(lines))
        return code
    if a.cmd == "session-check":
        lines, code = session_check(a.worktree, a.session, a.base)
        print("\n".join(lines))
        return code
    if a.cmd == "dist-resolve":
        lines, code = dist_resolve(a.dist, a.build_cmd, a.rebuild)
        print("\n".join(lines))
        return code
    if a.cmd == "uat-check":
        lines, findings = uat_check(a.path, reservations=not a.no_reservations)
        for x in lines:
            print("  " + x)
        for x in findings:
            print("  ACUSA " + x)
        for x in uat_advice(findings):
            print("  -> " + x)
        print("uat-check: " + (f"{len(findings)} achado(s)" if findings else "ids conferidos"))
        return 1 if findings else 0
    if a.cmd == "memory-merge":
        try:
            rd = lambda f: Path(f).read_bytes().decode("utf-8", "surrogateescape")  # noqa: E731
            text, left = memory_merge(rd(a.base), rd(a.ours), rd(a.theirs))
            Path(a.ours).write_bytes(text.encode("utf-8", "surrogateescape"))
            return 1 if left else 0
        except Exception as e:  # the same rule as the log driver: OURS never stands for a merge that did not happen
            print(f"merge_train memory-merge FALHOU ({e!r}): deixei os marcadores do git no arquivo; resolva à mão.", file=sys.stderr)
            try:
                write_conflict_markers(a.base, a.ours, a.theirs)
            except Exception as e2:
                print(f"merge_train: nem os marcadores saíram ({e2!r}); o arquivo é só o nosso lado - NÃO dê git add.", file=sys.stderr)
            return 1
    if a.cmd == "check-open-merge":
        w = check_open_merge(a.msgfile)
        if w:
            print(w, file=sys.stderr)
        return 0
    if a.cmd == "install-driver":
        lines, code = install_driver()
        print("\n".join(lines), file=sys.stderr if code else sys.stdout)
        return code
    return 2


def _has_markers(path):
    return bool(re.search(r"^<{7}( |$)", Path(path).read_text(encoding="utf-8", errors="surrogateescape"), re.M))


def _unmerged(path):
    r = git(["ls-files", "-u", "--", path], check=False)
    return r.returncode == 0 and bool(r.stdout.strip())


def write_conflict_markers(base, ours, theirs):
    """The driver failed: put the git markers (diff3) in OURS, bytes in and out, so the file can never pass for a result.
    When the text merge is clean (nothing to mark), the whole file is marked, ours against theirs."""
    r = _git.run(None, "merge-file", "-p", "--diff3", "-L", "ours", "-L", "base", "-L", "theirs", ours, base, theirs,
                 timeout=GIT_TIMEOUT, text=False)
    out = r.out
    if r.code < 0 or b"<<<<<<<" not in out:
        o, t = Path(ours).read_bytes(), Path(theirs).read_bytes()
        out = b"<<<<<<< ours\n" + o + (b"" if o.endswith(b"\n") else b"\n") + b"=======\n" + t + \
            (b"" if t.endswith(b"\n") else b"\n") + b">>>>>>> theirs\n"
    Path(ours).write_bytes(out)


def show_stage(n, path):
    r = git(["show", f":{n}:{path}"], check=False)
    return r.stdout if r.returncode == 0 else ""


if __name__ == "__main__":
    try:
        sys.exit(main())
    except RuntimeError as e:
        print(f"merge_train: {e}", file=sys.stderr)
        sys.exit(2)
