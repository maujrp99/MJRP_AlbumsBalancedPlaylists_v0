#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
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
  - a fix of open UAT issues ........................ always passes, whoever opened them (the MJRP, 2026-11-09; `priority_next.fixes_open_issues`)
  - registering a feature (Draft, no task ticked) ... never refused: it does not start anything
  - a merge that brings the start in ................ passes: the feature's index state is the one of MERGE_HEAD, so it started on the
                                                      branch that comes in, which this gate judged there (UAT-417: merging `main` with the
                                                      F134 done into the F135 branch was refused)
  - the feature's work is already merged into main .. passes: the commit closes it, it does not start it (F312, UAT-626: the close of the
                                                      F281, a branch `claude/f281-*` merged, was refused as a start)
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
    if after["status"].strip().casefold() in ("done", "accepted") and merged_into_main(top, proj, folder):
        missing = unverified_reqs(top, proj, folder)
        if not missing:
            return None                               # F312 (UAT-626): its work is already in main - this commit closes it, not starts it
        after = dict(after, _unverified=missing)      # the close is refused with the list of what is not verified
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


_WORK_BRANCH = re.compile(r"^(?:claude|feat|fix)/f(?P<n>\d+)-")


def merged_into_main(top, proj, folder):
    """F312 (UAT-626): a work branch of the feature (`claude|feat|fix/fNN-*`) is merged into `main` with construction in it. The commit that
    takes the spec to Done / ticks the tasks of such a feature CLOSES it (session_close's upkeep asks for it): nothing starts. A branch whose
    tip sits on main's first-parent line has no commit of its own (just opened: not merged); a branch whose merge brought only Discovery
    artifacts did not start the work either (F212), so the real start of the feature is still judged by the list. A git that does not answer is
    NOT EVALUABLE (exit 2), never a pass. The exemption is for the CLOSE only (the caller requires the spec to go to Done/Accepted): a commit that merely
    starts (In progress, a first tick) is judged by the list, whatever was merged (the third recheck's P0). Decided by the agent: a Draft spec on
    main with work merged under the feature's own folder, taken to Done, is a close - the real case of the F281;
    a fast-forward merge leaves no branch tip off the first-parent line and stays refused (the safe side, as does a squash)."""
    num = int(re.match(r"F(\d+)", folder)[1])
    try:
        if _git.run(top, "rev-parse", "--verify", "-q", "refs/heads/main").code != 0:
            return False                              # no `main`: nothing is merged, the gate judges by the index (as has_main says)
        found = _git.run(top, "for-each-ref", "--merged=refs/heads/main", "--format=%(refname:short) %(objectname)",
                         "refs/heads/claude", "refs/heads/feat", "refs/heads/fix")
        line = _git.run(top, "rev-list", "--first-parent", "refs/heads/main")
        if found.code != 0 or line.code != 0:
            raise pn.NotEvaluable(f"git não disse os ramos mesclados da `main`: {((found.err or line.err) or '').strip()[:200]}")
        on_line = set(line.out.split())
        for row in found.out.splitlines():
            name, _, tip = row.partition(" ")
            m = _WORK_BRANCH.match(name)
            if not m or int(m["n"]) != num or tip in on_line:
                continue
            merges = _git.run(top, "rev-list", "--first-parent", "--ancestry-path", "--merges", f"{tip}..refs/heads/main")
            if merges.code != 0:
                raise pn.NotEvaluable(f"git rev-list dos merges de {name}: {(merges.err or merges.out).strip()[:200]}")
            last = merges.out.split()[-1:]
            if not last:
                continue
            paths = pn.changed_paths(top, f"{last[0]}^1", tip)
            # the branch must have worked on the feature's own folder (the second recheck's P0: construction merged with no commit in the
            # folder never passed through this gate as that feature's start) and brought more than Discovery
            if paths and any(x.startswith(f"{proj}{pn.FEATURES_REL}/{folder}/") for x in paths) and not pn.discovery_only(paths):
                return True
    except _git.GitError as exc:
        raise pn.NotEvaluable(f"git ramos mesclados da feature: {exc}") from exc
    return False


_REQ_LINE = re.compile(r"^\s*(?:[-*]\s*)?\[(REQ-\d+)\]")
_NOT_CONSTRUCTION_DIRS = {"docs", "_backups", "reports"}
_CODE_EXT = {"py", "js", "mjs", "cjs", "ts", "tsx", "jsx", "sh", "bash", "zsh", "swift", "kt", "java", "go", "rs", "rb", "php", "c", "h", "cpp", "sql", "css"}
_SKILL_TEST_DIRS = {"evals"}
_PATH_TOKEN = re.compile(r"[\w][\w.\-/]*\.\w{1,5}\b")


def unverified_reqs(top, proj, folder):
    """The REQs of the feature's spec (in the index) whose `verified_by::` names no file that exists in `main` (the recheck's P1: the exemption
    must not let a Done with only spec and tasks through; the other locks read the form, not the construction). A `verified_by::` is prose; a path-like
    token (`dir/file.ext`, `file.ext`) counts when a tracked file of `main` equals it or ends with `/token` (the F281's `evals/scenarios.md` is a
    skill's file), outside the feature's own folder. No REQ at all, or a REQ with no `verified_by::`, is a gap. Decided by the agent
    (the orchestrator's criterion, 2026-11-20): reversible, technical."""
    spec_text = blob(top, ":", f"{proj}{pn.FEATURES_REL}/{folder}/spec.md") or ""
    reqs, cur = {}, None
    for line in spec_text.splitlines():
        m = _REQ_LINE.match(line)
        if m:
            cur = m[1]
            reqs.setdefault(cur, [])
        elif cur and "verified_by::" in line:
            reqs[cur].append(line.split("verified_by::", 1)[1])
    if not reqs:
        return ["nenhum REQ na spec"]
    try:
        tree = _git.run(top, "ls-tree", "-r", "--name-only", "refs/heads/main")
    except _git.GitError as exc:
        raise pn.NotEvaluable(f"git ls-tree da main: {exc}") from exc
    if tree.code != 0:
        raise pn.NotEvaluable(f"git ls-tree da main: {(tree.err or tree.out).strip()[:200]}")
    own = f"{proj}{pn.FEATURES_REL}/{folder}/"
    # only CODE is construction (the rechecks 3-6 kept finding another kind of document that counted: AGENTS.md, VISION.md, a skill's plan.md, a PDF): an
    # allowlist of code extensions, plus a skill's eval (anything under `evals/`, which is its test); `docs/`, `reports/` and the backups never count
    files = []
    for f in tree.out.splitlines():
        dirs, name = set(f.split("/")[:-1]), f.rsplit("/", 1)[-1]
        if f.startswith(own) or dirs & _NOT_CONSTRUCTION_DIRS:
            continue
        if name.rsplit(".", 1)[-1].lower() not in _CODE_EXT and not dirs & _SKILL_TEST_DIRS:
            continue
        files.append(f)
    missing = []
    for req, notes in reqs.items():
        tokens = {t.strip("./") for note in notes for t in _PATH_TOKEN.findall(note)}
        if not any(f == t or f.endswith("/" + t) for t in tokens for f in files):
            missing.append(f"{req} (verified_by não aponta arquivo que exista na main)")
    return missing


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
            if fields["solution_type"] == "fix" and pn.fixes_open_issues(fields["fixes"], uat):
                continue                              # an open UAT issue does not wait for the list (AGENTS.md § A coluna «Priorizada»)
            epics = items.epics_of(fields["imports"]) if has_epic else ()
            rank = pn.rank_of(fid, order, pn.linked_items(fields["imports"], fields["fixes"], epics))
            if rank is None:
                gap = fields.get("_unverified")
                extra = f"; e o fecho de feature mesclada pede cada REQ com `verified_by::` num arquivo da main, faltam: {', '.join(gap)}" if gap else ""
                refused.append(f"a {fid} não está na «Priorizada»: o humano a arrasta no board ({pn.RULE}){extra}")
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
