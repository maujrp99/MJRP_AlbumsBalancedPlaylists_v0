#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
priority_gate_check.py - the «Priorizada» column governs what starts: the pre-commit's gate (F125, UAT-407).

AGENTS.md § A coluna «Priorizada» manda no que começa: a feature of the HUMAN track that is not in the MJRP's list (`docs/specs/priority.md`
of its project) does not start. UAT-407: nothing charged it - the orchestrator started features outside the list, in any order. The rule
"the agent is not the judge" asks for a script that answers 0 or 1; this is it, at the one point every start passes through: the commit.

A commit STARTS a feature when, comparing HEAD with the index, the feature goes from not started to started - its `tasks.md` gets its first
ticked task, or its spec status leaves Draft/Ready/Queued/Backlog for `In progress` (a spec born `In progress`, `Done` or `Accepted` in this
commit started too). "Started" is `priority_next.has_started` (the app's `not_started` + `In progress`).

  - neither the feature nor an item linked to it is in the project's list (S-201: a story it imports, an issue it fixes, a task of it,
    the epic of a story) ............................ REFUSED (exit 1): «a Fxx não está na «Priorizada»: o humano a arrasta no board»
  - it is, by itself or by a linked item ............ passes; if an item ABOVE its best place has not started (the start of each type,
                                                      `priority_next.Items.started`), a WARNING (never a refusal: parallel work inside
                                                      the list is allowed, skipping one above only warns)
  - the AGENT track ................................. always passes: a fix whose `fixes:` issues all have `Reportado por` `agente` or `juiz` in
                                                      the project's `uat.md` and none `prioridade: humano` (`priority_next.is_agent_track`)
  - registering a feature (Draft, no task ticked) ... never refused: it does not start anything
  - a merge that brings the start in ................ passes: the feature's index state is the one of MERGE_HEAD, so it started on the
                                                      branch that comes in, which this gate judged there (UAT-417: merging `main` with the
                                                      F134 done into the F135 branch was refused)
  - the branch already worked on the feature ........ passes: commits of its own on the feature's folder since it left `main` - the open
                                                      branch is "started" for the board too (CC-ADR-0029's `not_started`; UAT-417)
  - a project with no `priority.md` ................. no column, no gate (the app reads an absent file as an empty list too); the file
                                                      deleted by this commit is NOT EVALUABLE, not a pass
  - the list out of the format, an id that names no item of the project, git without an answer
                                                      exit 2 (NOT EVALUABLE; "não avaliável" is never a pass, ADR-0002 § 8)

It judges the INDEX (what the commit will contain) against the list AT `main` (F217, UAT-537): the board's drag commits there wherever the
checkout is, and a branch opened before the drag carries an old copy - on 2026-11-07 the F205, dragged to `main`'s list, would have been
refused on its own branch. Only a commit that changes `priority.md` itself is judged by its own copy; a repository with no `main`, by the
index. `priority.md` is the human's: the agent never writes it, and a commit that carries it
stamped (`Human-prioritized:`) touches no feature file, so this gate does not run for it.

Usage: python3 mjrp-scripts/priority_gate_check.py <root> --staged
Exit: 0 passed (warnings are printed) | 1 refused | 2 not evaluable.  Stdlib only (ADR-0015); vendored into every child with the kernel.
"""
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402
import _git  # noqa: E402
import priority_next as pn  # noqa: E402

_FEATURE_FILE = re.compile(r"^(?P<proj>(?:.*/)?)" + re.escape(pn.FEATURES_REL) + r"/(?P<dir>(?P<id>F\d{2,})-[^/]+)/(?P<kind>spec|tasks)\.md$")


def blob(top, ref, rel):
    """The text of `rel` at `ref` (`:` = the index, `HEAD`, `MERGE_HEAD`); None when it is not there. A git that does not answer raises NotEvaluable."""
    try:
        r = _git.run(top, "show", f":{rel}" if ref == ":" else f"{ref}:{rel}")
    except _git.GitError as exc:
        raise pn.NotEvaluable(f"git show {ref}:{rel}: {exc}") from exc
    return r.out if r.code == 0 else None


def has_main(top):
    """The repository has `main`: the list the screen writes is read there (F217)."""
    try:
        return _git.run(top, "rev-parse", "--verify", "-q", pn.TARGET_REF).code == 0
    except _git.GitError as exc:
        raise pn.NotEvaluable(f"git rev-parse {pn.TARGET_REF}: {exc}") from exc


def staged_features(top):
    """{(project prefix, Fxx, folder)} of the feature files the commit adds, changes or renames to."""
    try:
        r = _git.run(top, "-c", "core.quotePath=false", "diff", "--cached", "--name-only", "--diff-filter=AMR", "-z")
    except _git.GitError as exc:
        raise pn.NotEvaluable(f"git diff --cached: {exc}") from exc
    if r.code != 0:
        raise pn.NotEvaluable(f"git diff --cached saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    out = set()
    for rel in r.out.split("\0"):
        m = _FEATURE_FILE.match(rel)
        if m:
            out.add((m["proj"], m["id"], m["dir"]))
    return sorted(out)


def state(top, ref, proj, folder):
    """(spec fields, ticks) of a feature at `ref`; the empty state when the feature is not there."""
    base = f"{proj}{pn.FEATURES_REL}/{folder}"
    spec = blob(top, ref, f"{base}/spec.md")
    tasks = blob(top, ref, f"{base}/tasks.md")
    return (pn.spec_fields(spec) if spec is not None else None), pn.ticked(tasks)


def starts(top, proj, folder):
    """The commit takes the feature from not started to started. Returns the index state (spec fields) when it does, else None."""
    before, before_ticks = state(top, "HEAD", proj, folder)
    after, after_ticks = state(top, ":", proj, folder)
    if after is None:
        return None
    was = pn.has_started(before["status"] if before else "", before_ticks)
    now = pn.has_started(after["status"], after_ticks)
    if not now or was:
        return None
    if merging(top) and state(top, "MERGE_HEAD", proj, folder) == (after, after_ticks):
        return None                                   # UAT-417: it started on the branch that comes in, not here
    if worked_on_branch(top, proj, folder):
        return None                                   # UAT-417: the branch already worked on it - started, as the board says
    return after


def merging(top):
    """A merge is open (MERGE_HEAD exists)."""
    try:
        return _git.run(top, "rev-parse", "-q", "--verify", "MERGE_HEAD").code == 0
    except _git.GitError as exc:
        raise pn.NotEvaluable(f"git rev-parse MERGE_HEAD: {exc}") from exc


def worked_on_branch(top, proj, folder):
    """The current branch has commits of its own on the feature's folder since it left `main`: the work started before this commit.
    The board's `not_started` counts the open branch of the feature as started (CC-ADR-0029); the gate follows it. On `main` (or with no
    `main`) the range is empty and the commit is judged by the list. F212 (UAT-533): a branch whose diff touches only Discovery artifacts
    (the prototype, the screen's record, the sketch) did not start the work, as the board says: its start commit is judged by the list."""
    try:
        base = _git.run(top, "merge-base", "HEAD", "refs/heads/main")
        if base.code != 0:
            return False
        r = _git.run(top, "log", "--format=%H", f"{base.out.strip()}..HEAD", "--", f"{proj}{pn.FEATURES_REL}/{folder}")
    except _git.GitError as exc:
        raise pn.NotEvaluable(f"git log da feature no ramo: {exc}") from exc
    if r.code != 0 or not r.out.strip():
        return False
    return not pn.discovery_only(pn.changed_paths(top, "refs/heads/main", "HEAD"))


def judge(top):
    """(refusals, warnings): lists of lines. Raises NotEvaluable."""
    refused, warned, groups = [], [], {}
    for proj, fid, folder in staged_features(top):
        fields = starts(top, proj, folder)
        if fields is None:
            continue
        groups.setdefault(proj, []).append((fid, folder, fields))
    if not groups:
        return refused, warned
    branches = None
    for proj, started in sorted(groups.items()):
        project = Path(top) / proj if proj else Path(top)
        plist_rel = f"{proj}{pn.PRIORITY_REL}"
        staged, head = blob(top, ":", plist_rel), blob(top, "HEAD", plist_rel)
        if staged is None and head is not None:
            raise pn.NotEvaluable(f"{plist_rel}: o commit apaga a «Priorizada» - ela é do humano (o board a escreve)")
        text = staged if staged != head or not has_main(top) else blob(top, pn.TARGET_REF, plist_rel)
        if text is None:
            continue                                  # no column in this project: no gate
        order = pn.parse_priority(text)
        uat = blob(top, ":", f"{proj}{pn.UAT_REL}")
        starting = {f for f, _, _ in started}
        if branches is None:
            branches = pn.branch_features(top)
        items = pn.Items(project, branches)
        pn.checked(items, order)                      # an id that names no item: the order is unknown (S-201 R1)
        has_epic = any(pn.kind_of(i) == "epic" for i in order)
        for fid, folder, fields in started:
            if fields["solution_type"] == "fix" and pn.is_agent_track(fields["fixes"], uat):
                continue                              # the Agent track goes straight on (AGENTS.md § Duas trilhas)
            epics = items.epics_of(fields["imports"]) if has_epic else ()
            rank = pn.rank_of(fid, order, pn.linked_items(fields["imports"], fields["fixes"], epics))
            if rank is None:
                refused.append(f"a {fid} não está na «Priorizada»: o humano a arrasta no board ({pn.RULE})")
                continue
            above = [(i, t) for i, _, t in pn.unstarted(project, branches, order[:rank - 1], items)
                     if i not in starting and pn.feature_of(i) not in starting]
            if above:
                names = ", ".join(f"{i} ({t})" for i, t in above)
                warned.append(f"aviso: a {fid} começa com item(ns) acima dela na «Priorizada» ainda não começado(s): {names} ({pn.RULE})")
    return refused, warned


def main(argv):
    args = list(argv)
    if "--staged" not in args or len(args) != 2:
        print("uso: priority_gate_check.py <raiz> --staged", file=sys.stderr)
        return 2
    args.remove("--staged")
    top = Path(args[0])
    if not top.is_dir():
        print(f"priority_gate_check: {top} não é uma pasta - não avaliável", file=sys.stderr)
        return 2
    try:
        refused, warned = judge(top)
    except pn.NotEvaluable as exc:
        print(f"priority_gate_check: «Priorizada» não avaliável - {exc}", file=sys.stderr)
        return 2
    for line in warned:
        print(f"  {line}")
    for line in refused:
        print(f"  {line}")
    return 1 if refused else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
