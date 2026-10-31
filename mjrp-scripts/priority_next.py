#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
priority_next.py - what the MJRP prioritized and nobody started: the «Priorizada» column as a command (F125, UAT-407; any item, F134).

The column «Priorizada» of the board IS `docs/specs/priority.md` of a project: a numbered list of item ids, the MJRP's order (the
board's drag writes it; the agent NEVER does). UAT-407: nothing made the orchestrator look at it - it started features outside the list,
in any order, without asking. S-201 (F134): the list takes ANY item - `F129`, `S-197`, `UAT-410`, `F129/TASK-03`, `CC-EP-08` -; an id
that names no item of the project makes the list not evaluable. This is the reader the three pieces of F125 share:

  python3 mjrp-scripts/priority_next.py                 the items of the list that did not start, in the MJRP's order, with type and title
  python3 mjrp-scripts/priority_next.py --first         only the next one
  python3 mjrp-scripts/priority_next.py --session-start the block the SessionStart hook prints (silent when there is nothing to ask)
  python3 mjrp-scripts/priority_next.py --root <dir>    the repository (default: the git top level of the cwd)

and `priority_gate_check.py` (the pre-commit) imports its rules. Exit: 0 | 2 NOT EVALUABLE - the list is out of the format, cannot be read,
or git did not answer (never "an empty list": a file that cannot be read must not look like «nothing to ask»).

Where the lists are: the root project and each `apps/*/` that carries a `.mjrp-project.yml` (the same nested projects `status_sync.py` treats),
at `docs/specs/priority.md`. A project with NO `priority.md` has no column (the app reads an absent file as an empty list): nothing to ask,
and the gate does not apply to it. The features of a project: `docs/specs/features/Fxx-*/spec.md`.

The rules are MIRRORS of the Control Center's (stdlib only, ADR-0015: the scripts cannot import the app); each says which:
  - the item ids ........... `rules/item_ids.py` (the `node_types` of requirements_graph_rules.json)
  - the file format ........ `rules/priority.py` `parse` (header, then `N. <id>`, numbered 1..n, no repeated id) and `checked`
  - the best place ......... `rules/priority.py` `rank_of` and `linked_items` (a feature takes the place of its stories, its issues,
                             its tasks and the epics of its stories)
  - "started" of an item ... a story when a feature that imports it started; an issue past `open`; a task when its mother started; an
                             epic when a story of it started (the plan of F134 § 5)
  - "started" .............. `rules/delivery.py` `not_started` (a task ticked, an unmerged branch of the feature, or the spec delivered) plus the
                             spec `In progress` (an `In progress` spec with no tick is work under way too)
  - the branch of a feature  `rules/delivery.py` `features_of` (`feat|fix/fNN-…`, `claude/fNN-…`; a `worktree-agent-*` branch names no feature)
  - the ticked tasks ....... `rules/delivery.py` `ticked_tasks` (only under `## Implementation…` and `## Verification…`)
  - the track of a feature . `rules/tracks.py` `issue_track` (see `is_agent_track`)
Stdlib only; vendored into every child with the kernel.
"""
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402
import _fm  # noqa: E402
import _git  # noqa: E402

PRIORITY_REL = "docs/specs/priority.md"
FEATURES_REL = "docs/specs/features"
UAT_REL = "docs/specs/uat.md"
CONTRACT = ".mjrp-project.yml"
RULE = "AGENTS.md § A coluna «Priorizada»"
STARTED_STATUS = {"in progress", "in-progress", "done", "accepted"}   # `done`/`accepted`: rules/delivery.py DELIVERED

# rules/item_ids.py: one pattern per item type (the task before the feature it starts with)
_KINDS = (("task", r"F\d{2,}/TASK-\d{2,}[a-z]?"), ("feature", r"F\d{2,}"), ("story", r"(?:S|UC|EA)-\d{2,}"),
          ("record", r"UAT-\d{2,}"), ("epic", r"(?:[A-Z]{2,}-)?EP-\d{2,}"))
KIND_WORD = {"feature": "feature", "story": "story", "task": "task", "record": "issue", "epic": "épico"}
# rules/priority.py: _ITEM and _HEADER
_ITEM = re.compile(r"^(?P<n>\d+)\.[ \t]+(?P<id>" + "|".join(f"(?:{p})" for _, p in _KINDS) + r")[ \t]*$")
_HEADER = re.compile(r"^(#[^#].*|<!--.*-->)$")
# rules/delivery.py: BRANCH and AGENT_BRANCH
_BRANCH = re.compile(r"^(feat|fix)/f(?P<n>\d{2,})(-r\d+)?-")
_AGENT_BRANCH = re.compile(r"^claude/(?P<fs>f\d{2,}(?:-f\d{2,})*)-")
# rules/delivery.py: _TICKED
_TICKED = re.compile(r"^- \[[xX]\]\s*(?P<label>.*?)\s*$")
_FEATURE_DIR = re.compile(r"^(F\d{2,})-")
_TITLE = re.compile(r"^#\s+Feature\s+F\d{2,}:\s*(?P<t>.+?)\s*$", re.M)
_STORY_ID = re.compile(r"(?<![\w-])(?:S|UC|EA)-\d{2,}(?![\w])")
_EPIC_REF = re.compile(r"\^((?:[A-Z]{2,}-)?EP-\d{2,})")
REQUIREMENTS_REL = "docs/specs/requirements"
PRD_REL = "docs/specs/prd.md"


class NotEvaluable(Exception):
    """The column cannot be judged: the list is out of the format, a file does not read, git did not answer."""


# ---- the list ---------------------------------------------------------------------------------------------------
class Order(list):
    """The ids of the list, top first, with `lines`: the line of each id (the reason of an unknown one)."""
    lines = ()


def parse_priority(text):
    """The item ids of a `priority.md`, top first. Mirror of `rules/priority.py` `parse`; raises NotEvaluable naming the line."""
    order, in_list, lines = Order(), False, []
    for number, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line:
            continue
        item = _ITEM.match(line)
        if item:
            if int(item["n"]) != len(order) + 1:
                raise NotEvaluable(f"{PRIORITY_REL}:{number}: a numeração segue de 1 em 1: esperava {len(order) + 1}")
            if item["id"] in order:
                raise NotEvaluable(f"{PRIORITY_REL}:{number}: {item['id']} aparece duas vezes")
            order.append(item["id"])
            lines.append(number)
            in_list = True
        elif in_list:
            raise NotEvaluable(f"{PRIORITY_REL}:{number}: depois da lista só vêm itens `N. <id>`")
        elif not _HEADER.match(line):
            raise NotEvaluable(f"{PRIORITY_REL}:{number}: linha que não é cabeçalho nem item `N. <id>`")
    order.lines = tuple(lines)
    return order


def kind_of(item):
    """`task` | `feature` | `story` | `record` | `epic` of a whole id; None for any other (rules/item_ids.py `kind_of`)."""
    return next((kind for kind, pattern in _KINDS if re.fullmatch(pattern, item)), None)


def feature_of(item):
    """The mother feature of a task id (`F12/TASK-01` -> `F12`); None for any other id."""
    return item.split("/", 1)[0] if kind_of(item) == "task" else None


def linked_items(imports, fixes, epics=()):
    """The items whose place a feature takes (rules/priority.py `linked_items`): its stories, its issues, the epics of its stories."""
    return (*imports, *fixes, *epics)


def rank_of(item, order, linked=()):
    """The 1-based best place of `item` or of an item linked to it; a task of the list counts for its mother (rules/priority.py)."""
    wanted = {item, *linked}
    places = [n for n, i in enumerate(order, start=1) if i in wanted or feature_of(i) == item]
    return min(places) if places else None


# ---- a feature --------------------------------------------------------------------------------------------------
def ticked(tasks_md):
    """How many tasks a `tasks.md` has ticked under `## Implementation…` / `## Verification…` (rules/delivery.py `ticked_tasks`)."""
    n, inside = 0, False
    for line in (tasks_md or "").splitlines():
        if line.startswith("## "):
            inside = line.startswith(("## Implementation", "## Verification"))
        elif inside and _TICKED.match(line):
            n += 1
    return n


def spec_fields(spec_md):
    """{status, solution_type, fixes: [UAT-nnn], title} of a spec.md (flat frontmatter pairs; `fixes` may be a list or a link list)."""
    fm = _fm.scalars(spec_md)
    title = _TITLE.search(spec_md or "")
    return {"status": (fm.get("status") or "").strip(), "solution_type": (fm.get("solution_type") or "").strip().casefold(),
            "fixes": re.findall(r"UAT-\d+", fm.get("fixes") or ""), "title": title["t"] if title else "",
            "imports": list(dict.fromkeys(_STORY_ID.findall(fm.get("imports") or "")))}


def has_started(status, ticks, branch_open=False):
    """The work started: a task ticked, an open branch, or the spec in `In progress`/`Done`/`Accepted` (rules/delivery.py `not_started`, + `In progress`)."""
    return bool(branch_open or ticks > 0 or (status or "").strip().casefold() in STARTED_STATUS)


def is_agent_track(fixes, uat_text):
    """Agent track (rules/tracks.py `issue_track`, `feature_track`): a FIX whose issues all exist in `uat.md` with `Reportado por`
    `agente` or `juiz` and none carrying `prioridade: humano`. No fix, no issue, an unknown issue or an unknown reporter: Human track
    (an issue of the MJRP is never lost for a missing record). The cell grammar is `uat_tracks_check`'s own."""
    if not fixes or not uat_text:
        return False
    import uat_tracks_check as utc
    reporter, head_ok = {}, False
    for line in uat_text.splitlines():
        if line.startswith("| ID "):
            head_ok = utc.cells(line) == utc.HEAD
        elif head_ok and line.startswith("| UAT-"):
            row = utc.cells(line)
            found = utc.VALUE.match(row[5]) if len(row) >= len(utc.HEAD) else None
            if found:
                reporter[row[0]] = (found.group("who"), found.group("prio"))
    return all(i in reporter and reporter[i][0] in ("juiz", "agente") and reporter[i][1] is None for i in fixes)


# ---- the repository ---------------------------------------------------------------------------------------------
def toplevel(root):
    top = _git.toplevel(root)
    return top if top else Path(root).resolve()


def projects(root):
    """The folders of the repository that may carry a «Priorizada»: the root and each `apps/*/` with a contract; only those with the file."""
    root = Path(root)
    found = [root] + sorted(p.parent for p in (root / "apps").glob(f"*/{CONTRACT}")) if (root / "apps").is_dir() else [root]
    return [p for p in found if (p / PRIORITY_REL).is_file()]


def read_priority(project):
    try:
        return parse_priority((Path(project) / PRIORITY_REL).read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError) as exc:
        raise NotEvaluable(f"{PRIORITY_REL}:1: o arquivo não se lê ({exc})") from exc


def branch_features(root):
    """The feature numbers that have an UNMERGED branch by the convention (rules/delivery.py `features_of`, `branch_open`). One git call."""
    try:
        have = lambda ref: _git.run(root, "rev-parse", "--verify", "-q", ref).ok   # noqa: E731
        main = next((m for m in ("main", "master") if have(f"refs/heads/{m}")), None)
        args = ["for-each-ref", "--format=%(refname:short)"] + ([f"--no-merged={main}"] if main else []) + ["refs/heads"]
        r = _git.run(root, *args)
    except _git.GitError as exc:
        raise NotEvaluable(f"git não respondeu: {exc}") from exc
    if r.code != 0:
        raise NotEvaluable(f"git {' '.join(args)} saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    out = set()
    for name in r.out.split():
        if name == main:
            continue
        if m := _BRANCH.match(name):
            out.add(int(m["n"]))
        elif m := _AGENT_BRANCH.match(name):
            out.update(int(f[1:]) for f in m["fs"].split("-"))
    return out


def feature_dirs(project):
    """{Fxx: folder} of a project's features."""
    base = Path(project) / FEATURES_REL
    if not base.is_dir():
        return {}
    return {m[1]: d for d in sorted(base.iterdir()) if d.is_dir() and (m := _FEATURE_DIR.match(d.name))}


def read_text(path):
    try:
        return Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return None
    except (OSError, UnicodeDecodeError) as exc:
        raise NotEvaluable(f"{path}: não se lê ({exc})") from exc


class Items:
    """The items of one project, read only as far as the list needs: the feature folders always; the stories, the issues and the
    epics only when the list names one (or a feature's epics are asked) - the SessionStart block stays fast on a list of features."""

    def __init__(self, project, branches):
        self.project, self.branches = Path(project), branches
        self.dirs = feature_dirs(project)
        self._specs, self._nodes, self._issues, self._epics = {}, None, None, None

    def spec(self, fid):
        """(fields, ticks) of a feature folder, or None when it has no spec.md."""
        if fid not in self._specs:
            text = read_text(self.dirs[fid] / "spec.md") if fid in self.dirs else None
            self._specs[fid] = None if text is None else (spec_fields(text), ticked(read_text(self.dirs[fid] / "tasks.md")))
        return self._specs[fid]

    def nodes(self):
        """{story id: (status, epic, title)} of the requirement nodes."""
        if self._nodes is None:
            self._nodes = {}
            base = self.project / REQUIREMENTS_REL
            for f in sorted(base.rglob("*.md")) if base.is_dir() else ():
                m = _STORY_ID.match(f.name)
                if not m:
                    continue
                text = read_text(f) or ""
                fm = _fm.scalars(text)
                epic = _EPIC_REF.search(fm.get("epic") or "")
                head = re.search(r"^#\s+\S+\s+·\s+(?P<t>.+?)\s*$", text, re.M)
                self._nodes[m.group(0)] = ((fm.get("status") or "").strip(), epic.group(1) if epic else None, head["t"] if head else "")
        return self._nodes

    def issues(self):
        """{UAT id: (status cell, title)} of the project's uat.md."""
        if self._issues is None:
            import uat_tracks_check as utc
            self._issues, head_ok = {}, False
            for line in (read_text(self.project / UAT_REL) or "").splitlines():
                if line.startswith("| ID "):
                    head_ok = utc.cells(line) == utc.HEAD
                elif head_ok and line.startswith("| UAT-"):
                    row = utc.cells(line)
                    if len(row) >= len(utc.HEAD):
                        what = re.sub(r"\*\*[^*]+:\*\*\s*", "", row[6].split("<br>")[0]).strip()
                        self._issues[row[0]] = (row[7], what[:80])
        return self._issues

    def epics(self):
        """{epic id: title} from the PRD's headings (`### CC-EP-08 · O board agnóstico`)."""
        if self._epics is None:
            self._epics = {}
            for line in (read_text(self.project / PRD_REL) or "").splitlines():
                m = re.match(r"^#{2,6}\s+((?:[A-Z]{2,}-)?EP-\d{2,})\s+·\s+(?P<t>.+?)\s*$", line)
                if m:
                    self._epics[m.group(1)] = m["t"]
        return self._epics

    def exists(self, item):
        kind = kind_of(item)
        if kind in ("feature", "task"):   # a task resolves by its mother, as rules/priority.py `unresolved` (S-201 R1)
            return (feature_of(item) or item) in self.dirs
        if kind == "story":
            return item in self.nodes()
        if kind == "record":
            return item in self.issues()
        return kind == "epic" and (item in self.epics() or any(e == item for _, e, _ in self.nodes().values()))

    def title(self, item):
        kind = kind_of(item)
        if kind == "feature":
            s = self.spec(item)
            return "sem spec.md" if s is None else (s[0]["title"] or "(sem título)")
        if kind == "task":
            fid, local = item.split("/", 1)
            for line in (read_text(self.dirs[fid] / "tasks.md") or "").splitlines():
                m = re.match(r"^[-*]\s+\[[ xX]\]\s+(?:\*\*)?" + re.escape(local) + r"\b\s*(?P<t>.*)$", line)
                if m:
                    return m["t"].split(" · implements::")[0].strip()[:80] or "(sem título)"
            return "(task sem linha no tasks.md)"
        if kind == "story":
            return self.nodes()[item][2] or "(sem título)"
        if kind == "record":
            return self.issues()[item][1] or "(sem título)"
        return self.epics().get(item, "(sem título)")

    def feature_started(self, fid):
        s = self.spec(fid)
        return s is not None and has_started(s[0]["status"], s[1], int(fid[1:]) in self.branches)

    def started(self, item):
        """The start of each type (the plan of F134 § 5): a feature by its own predicate; a task when its mother started; a story when a
        feature that imports it started; an issue past `open`; an epic when a story of it started."""
        kind = kind_of(item)
        if kind == "feature":
            return self.feature_started(item)
        if kind == "task":
            return self.feature_started(feature_of(item))
        if kind == "story":
            return any(item in (self.spec(f) or ({"imports": []},))[0]["imports"] and self.feature_started(f) for f in self.dirs)
        if kind == "record":
            return not self.issues()[item][0].strip().casefold().startswith("open")
        return any(e == item and self.started(s) for s, (_, e, _) in self.nodes().items())

    def epics_of(self, imports):
        """The epics of the stories a feature imports."""
        return sorted({self.nodes()[s][1] for s in imports if s in self.nodes() and self.nodes()[s][1]})


def checked(items, order):
    """Raises NotEvaluable when an id of the list names no item of the project (rules/priority.py `checked`): the order is then
    unknown, never «nothing to ask». A task resolves by its mother's existence (rules/priority.py `unresolved`)."""
    lines = getattr(order, "lines", ())
    for n, item in enumerate(order):
        if not items.exists(item):
            where = f"{PRIORITY_REL}:{lines[n]}" if len(lines) == len(order) else PRIORITY_REL
            raise NotEvaluable(f"{where}: {item} não existe no projeto")


def unstarted(project, branches, order=None, items=None):
    """[(id, type word, title)] of the project's list that did not start, in the MJRP's order. `order`: the ids to judge when the caller
    already holds the list (the gate reads the index copy); default, the file on disk."""
    items = items or Items(project, branches)
    order = read_priority(project) if order is None else order
    checked(items, order)
    return [(i, KIND_WORD[kind_of(i)], items.title(i)) for i in order if not items.started(i)]


def all_unstarted(root):
    """[(project label, [(id, type, title)])] for every project with a column, only those with something unstarted."""
    root = toplevel(root)
    found = projects(root)
    if not found:
        return []
    branches = branch_features(root)
    out = []
    for p in found:
        rows = unstarted(p, branches)
        if rows:
            out.append((p.relative_to(root).as_posix() if p != root else ".", rows))
    return out


# ---- the output -------------------------------------------------------------------------------------------------
def session_block(groups):
    """The SessionStart block: the list in order and the rule. Empty string when there is nothing to ask."""
    if not groups:
        return ""
    lines = ["«Priorizada» — o MJRP ordenou estes itens e eles ainda não começaram:"]
    for label, rows in groups:
        if len(groups) > 1 or label != ".":
            lines.append(f"  [{label}]")
        lines += [f"  {n}. {item} ({kind}) — {title}" for n, (item, kind, title) in enumerate(rows, start=1)]
    lines.append(f"Regra: pergunte ao MJRP o que fazer antes de começar trabalho novo da trilha Humano ({RULE}).")
    return "\n".join(lines)


def main(argv):
    args, root = list(argv), None
    if "--root" in args:
        i = args.index("--root")
        if i + 1 >= len(args):
            print("priority_next: --root pede uma pasta", file=sys.stderr)
            return 2
        root = args[i + 1]
        del args[i:i + 2]
    first, session = "--first" in args, "--session-start" in args
    if set(args) - {"--first", "--session-start"}:
        print("uso: priority_next.py [--first | --session-start] [--root <pasta>]", file=sys.stderr)
        return 2
    try:
        groups = all_unstarted(root or ".")
    except NotEvaluable as exc:
        print(f"priority_next: «Priorizada» não avaliável — {exc}", file=sys.stderr if not session else sys.stdout)
        return 2
    if session:
        block = session_block(groups)
        if block:
            print(block)
        return 0
    for label, rows in groups[:1] if first else groups:
        for item, kind, title in rows[:1] if first else rows:
            print(f"{item}  {kind}  {title}" + (f"  [{label}]" if label != "." and not first else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
