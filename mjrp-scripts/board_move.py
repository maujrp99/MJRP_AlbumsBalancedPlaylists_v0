#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
board_move.py - the one way a work item changes state on the board (F275, UAT-592): it checks the passage on the single graph
(`board_states.json`) and records it; the board draws only what this recorded (the Jira principle: the state changes by an
explicit move, never by a guess from the spec, the tasks, the branch or the clock).

  python3 mjrp-scripts/board_move.py move <item> <state> [--why TEXT] [--order "<words of the MJRP>"] [--session ID]
  python3 mjrp-scripts/board_move.py next <item>          where the item is and the passages it may take, with who makes each
  python3 mjrp-scripts/board_move.py show [--all]         the recorded state of every item of the project (`--all`: every project)
  python3 mjrp-scripts/board_move.py stamped <commit>     the post-commit: the MJRP's stamped commit moves what it decided
  python3 mjrp-scripts/board_move.py seed [--dry-run]     records, once, the state of each feature that has no record yet
  python3 mjrp-scripts/board_move.py graphs [--check]     writes (or compares) the wiki's drawings of the graph (docs/wiki/graphs/)
  python3 mjrp-scripts/board_move.py stage <item> <etapa> [--evidence <commit|caminho>] [--order "..."]
                                                         the stage of the cycle (lote 1b): Backlog → Explorar → Enquadrar → Desenhar →
                                                         Pronto para construir for a story; especificar → … → deploy for a feature
  python3 mjrp-scripts/board_move.py committed [<commit>] the post-commit: the MJRP's stamp, and the stage the commit closed
  python3 mjrp-scripts/board_move.py seed-moves <lista> [--dry-run]
                                                         once, after the seed: the moves the MJRP checked for the items whose Discovery
                                                         already moved (`- S-164 → draw — o porquê`)
  Every command takes `--root <dir>` (default: the cwd) and `--project <rel>` (default: the project that holds the item, or the cwd's).

Who makes a passage is the edge's `actor`: `agent` (any session; the MJRP too), `order` (the MJRP's decision, recorded by an agent
only with his words in `--order`, as the master rule asks) and `signed` (only the commit with his stamp, `Human-prioritized:`,
`Human-accepted:` or `Human-reopened:`, through `stamped`; an agent never). A passage the graph lacks is refused, and the refusal
names the passages the item may take and who makes each - never a refusal with no way out.

Where the record lives: `<main checkout>/<project>/.mjrp/board.jsonl` (ignored by git, carried by the daily backup; `MJRP_BOARD_DIR`
overrides), one JSON line per passage (`v: 1`), appended under a lock; every worktree of a repository writes to the main checkout's
file, at once, with no commit (a session that starts is «Em andamento» before any commit). The current state of an item is its newest line. The file is
irreplaceable (class 1 of ADR-0023): nothing here removes or rewrites a line. The sensor is `board_states_check.py`.

Exit: 0 done | 1 refused (the passage is not in the graph, or is not this actor's) | 2 not evaluable (no graph, no project, an item
that names nothing). Stdlib only; prose in Portuguese.
"""
import argparse
import fcntl
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401, E402
import _clock  # noqa: E402
import _fm  # noqa: E402

BOARD_MOVE_API = 1
GRAPH = Path(__file__).resolve().parent / "board_states.json"
FEATURES = "docs/specs/features"
PRIORITY = "docs/specs/priority.md"
ITEM = re.compile(r"^(F\d{2,}|UAT-\d+|S-\d+)$")
FEATURE_DIR = re.compile(r"^(F\d{2,})-")
STAMPS = ("Human-prioritized", "Human-accepted", "Human-reopened")
RECORD_FORMAT = 1  # the `v` of each line: a reader that meets a newer one says so instead of guessing
STAMP_FRESH_SECONDS = 600   # the post-commit runs at once; an older stamped commit replayed by hand never moves the board
DECIDED = ("accepted", "reopened")  # the MJRP's decisions recorded even off the graph (the sensor names the missing passage)
ACTORS = ("agent", "order", "signed")


class NotEvaluable(Exception):
    pass


class Refused(Exception):
    pass


# ---- the graph ---------------------------------------------------------------------------------------------------
def load_graph(path=GRAPH):
    try:
        graph = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise NotEvaluable(f"o grafo {path} não lê: {exc}") from exc
    if not isinstance(graph.get("states"), dict) or not isinstance(graph.get("edges"), list):
        raise NotEvaluable(f"o grafo {path} não tem `states` e `edges`")
    return graph


def label(graph, state):
    return graph["states"].get(state, {}).get("label", {}).get("pt", state) if state else "sem registro"


def edges_from(graph, state):
    return [e for e in graph["edges"] if e["from"] == state]


def edge(graph, frm, to):
    return next((e for e in graph["edges"] if e["from"] == frm and e["to"] == to), None)


def who(e):
    return {"agent": "qualquer sessão", "order": "o MJRP (o agente grava com as palavras dele, `--order`)",
            "signed": f"só o MJRP, pelo commit com `{e.get('stamp')}:`"}[e["actor"]]


def way_out(graph, state):
    """The passages an item in `state` may take, as lines, for a refusal or for `next`."""
    out = [f"  → {label(graph, e['to'])} ({e['to']}): {e['says']} · {who(e)}" for e in edges_from(graph, state)]
    return out or ["  (nenhuma: é um estado final)"]


# ---- where the record lives --------------------------------------------------------------------------------------
def git(root, *args):
    try:
        got = subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise NotEvaluable(f"git não respondeu em {root}: {exc}") from exc
    if got.returncode != 0:
        raise NotEvaluable(f"git {' '.join(args)}: {got.stderr.strip()[:200]}")
    return got.stdout


def top_of(root):
    return Path(git(root, "rev-parse", "--show-toplevel").strip())


def main_root(root):
    """The main checkout of the repository (the parent of the common git dir), so every worktree names the project the same way."""
    common = Path(git(root, "rev-parse", "--path-format=absolute", "--git-common-dir").strip())
    return common.parent if common.name == ".git" else common


def projects(top):
    """The project folders of a repository, relative: the root and each `apps/*/` with a contract (the ones status_sync treats)."""
    out = ["."]
    apps = Path(top) / "apps"
    if apps.is_dir():
        out += [f"apps/{d.name}" for d in sorted(apps.iterdir()) if (d / ".mjrp-project.yml").is_file()]
    return out


def store_of(main, rel):
    """The record of a project: `<main checkout>/<project>/.mjrp/board.jsonl` - ignored by git (`.mjrp/` is in every project's
    `.gitignore`), outside the derived list, so irreplaceable (class 1, ADR-0023) and carried by the daily backup with the working
    tree; it goes with the repository when the folder moves. `MJRP_BOARD_DIR` puts it elsewhere (the tests)."""
    if os.environ.get("MJRP_BOARD_DIR"):
        name = re.sub(r"[^A-Za-z0-9]+", "-", str((Path(main) / rel).resolve()).strip("/")).strip("-")
        return Path(os.environ["MJRP_BOARD_DIR"]) / f"{name}.jsonl"
    return Path(main) / rel / ".mjrp" / "board.jsonl"


def features_of(top, rel):
    """{Fxx: folder} of a project."""
    base = Path(top) / rel / FEATURES
    if not base.is_dir():
        return {}
    return {m.group(1): d.name for d in base.iterdir() if d.is_dir() and (m := FEATURE_DIR.match(d.name))}


def issues_of(top, rel):
    path = Path(top) / rel / "docs/specs/uat.md"
    try:
        return set(re.findall(r"^\|\s*(UAT-\d+)\s*\|", path.read_text(encoding="utf-8"), re.M))
    except OSError:
        return set()


def project_of(top, item, given=None):
    """The project that holds `item`: `given`, or the one project whose features (or issues) name it."""
    if given:
        if not (Path(top) / given).is_dir():
            raise NotEvaluable(f"o projeto {given} não existe em {top}")
        return given
    def holds(rel):
        if item.startswith("F"):
            return item in features_of(top, rel)
        if item.startswith("S-"):
            return item in story_statuses(top, rel)
        return item in issues_of(top, rel)

    holders = [rel for rel in projects(top) if holds(rel)]
    if len(holders) != 1:
        where = ", ".join(holders) if holders else "nenhum projeto"
        raise NotEvaluable(f"{item}: {where} o tem; diga qual com `--project <pasta>`")
    return holders[0]


def read_events(path):
    try:
        text = Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return []
    except OSError as exc:
        raise NotEvaluable(f"o registro {path} não lê: {exc}") from exc
    return parse_lines(text, path)


def parse_lines(text, path):
    out = []
    for n, line in enumerate(text.splitlines(), 1):
        if not line.strip():
            continue
        try:
            got = json.loads(line)
        except ValueError as exc:
            raise NotEvaluable(f"o registro {path}, linha {n}, não é JSON: {exc}") from exc
        if not isinstance(got, dict) or not isinstance(got.get("item"), str):
            raise NotEvaluable(f"o registro {path}, linha {n}, não é uma passagem (um objeto com `item`)")
        if int(got.get("v") or 1) > RECORD_FORMAT:
            raise NotEvaluable(f"o registro {path}, linha {n}, é do formato v{got.get('v')}; este board_move.py lê até o v{RECORD_FORMAT}")
        out.append(got)
    return out


def current(events, dim="state"):
    """{item: its newest event} of one dimension: the column's state (`state`, the default) or the stage of the cycle (`stage`)."""
    out = {}
    for e in events:
        if (e.get("dim") or "state") == dim:
            out[e["item"]] = e
    return out


NOT_CHECKED = object()


def append(path, event, expect=NOT_CHECKED):
    """Appends one line under a lock; the line is written whole or not at all (one write of a complete line). With `expect`, the item's
    state is read again under the same lock and must still be `expect` (two sessions moving the same item never both pass)."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(event, ensure_ascii=False, sort_keys=True) + "\n"
    with open(path, "a+", encoding="utf-8") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        try:
            if expect is not NOT_CHECKED:
                fh.seek(0)
                now = current(parse_lines(fh.read(), path), event.get("dim") or "state").get(event["item"])
                if (now or {}).get("to") != expect:
                    raise Refused(f"{event['item']} mudou de estado enquanto esta passagem era conferida: confira com `next`")
            fh.write(line)
            fh.flush()
            os.fsync(fh.fileno())
        finally:
            fcntl.flock(fh, fcntl.LOCK_UN)


class Board:
    """The record of one project, as the commands read and write it."""

    def __init__(self, root, rel=None, item=None, graph=None):
        self.top = top_of(root)
        self.main = main_root(root)
        self.graph = graph or load_graph()
        self.rel = project_of(self.top, item, rel) if item else (rel or project_at(self.top, root))
        self.path = store_of(self.main, self.rel)

    def state(self, item):
        got = current(read_events(self.path)).get(item)
        return got["to"] if got else None

    def move(self, item, to, actor="agent", by=None, why="", order="", stamp=None):
        """Records the passage `item` -> `to` by `actor`; raises Refused with the way out when the graph does not allow it."""
        if not ITEM.match(item):
            raise NotEvaluable(f"{item}: não é um item (uma feature Fxx ou uma issue UAT-nn)")
        if to not in self.graph["states"]:
            raise Refused(f"{to}: não é um estado do grafo. Os estados: {', '.join(self.graph['states'])}")
        frm = self.state(item)
        start = frm or self.graph["initial"]
        if start == to:
            return None  # already there: nothing to record
        e = edge(self.graph, start, to)
        if e is None:
            raise Refused(f"{item} está em «{label(self.graph, frm or start)}»: a passagem para «{label(self.graph, to)}» não "
                          f"existe no grafo. As que existem:\n" + "\n".join(way_out(self.graph, start)))
        if e["actor"] == "signed" and actor != "signed":
            raise Refused(f"{item} → «{label(self.graph, to)}» é decisão do MJRP: {who(e)}. O agente não a faz; leve ao orquestrador.")
        if e["actor"] == "order" and actor == "agent" and not order.strip():
            raise Refused(f"{item} → «{label(self.graph, to)}» é decisão do MJRP: grave com as palavras dele em `--order \"...\"`.")
        if e.get("requires") == "closure" and not self.closes(item):
            raise Refused(f"{item} → «{label(self.graph, to)}»: o fecho pela reconferência precisa do `closed_by:` na spec, e a regra de "
                          f"fecho do kernel (`feature_closure.py`) o aceita; sem ele, a feature vai a «Pronto para UAT», para o MJRP")
        event = {"v": RECORD_FORMAT, "at": _clock.iso(), "item": item, "project": self.rel, "from": frm, "to": to,
                 "actor": "signed" if actor == "signed" else ("order" if order.strip() else actor),
                 "by": by or os.environ.get("CLAUDE_SESSION_ID") or "?", "why": why}
        if order.strip():
            event["order"] = order.strip()
        if stamp:
            event["stamp"] = stamp
        append(self.path, event, expect=frm)
        return event

    def closes(self, item):
        """Whether the feature closes without the MJRP's acceptance, by the kernel's own rule, read from its spec on this checkout."""
        folder = features_of(self.top, self.rel).get(item)
        if folder is None:
            return False
        try:
            fields = _fm.parse((Path(self.top) / self.rel / FEATURES / folder / "spec.md").read_text(encoding="utf-8")) or {}
        except OSError:
            return False
        story_statuses(self.top, self.rel)  # reads the stories' points_to the closure rule needs
        return closed_by_machine(fields, issue_oks(self.top, self.rel), str(Path(self.top) / self.rel / "docs/specs/requirements"))


def project_at(top, root):
    """The project whose folder holds `root` (the deepest), or the root project."""
    here = Path(root).resolve()
    best = "."
    for rel in projects(top):
        base = (Path(top) / rel).resolve()
        if here == base or base in here.parents:
            best = rel if len(rel) > len(best) else best
    return best


# ---- the MJRP's stamped commits (the drag and the acceptance go through the same record) ------------------------
def trailers(top, commit):
    body = git(top, "log", "-1", "--format=%B", commit)
    return {t for t in STAMPS if re.search(rf"^{t}:", body, re.M)}


def show_at(top, ref, path):
    got = subprocess.run(["git", "-C", str(top), "show", f"{ref}:{path}"], capture_output=True, text=True, timeout=30)
    return got.stdout if got.returncode == 0 else ""


def priority_ids(text):
    return re.findall(r"^\s*\d+\.\s+(\S+)", text or "", re.M)


def spec_status(text):
    fields = _fm.parse(text or "") or {}
    return str(fields.get("status") or "").strip().casefold()


def stamped(root, commit, graph=None):
    """The passages a stamped commit of the MJRP decided, recorded with the commit as the signature. Returns the events."""
    top = top_of(root)
    marks = trailers(top, commit)
    if not marks:
        return []
    sha = git(top, "rev-parse", commit).strip()
    made = int(git(top, "log", "-1", "--format=%ct", sha).strip() or 0)
    if abs(time.time() - made) > STAMP_FRESH_SECONDS:
        raise Refused(f"o commit carimbado {sha[:9]} não é de agora: só o post-commit do próprio commit move o board por ele")
    for rel in projects(top):
        if any(e.get("stamp") == sha for e in read_events(store_of(main_root(top), rel))):
            raise Refused(f"o commit carimbado {sha[:9]} já moveu o board: um carimbo vale uma vez")
    changed = git(top, "diff-tree", "--no-commit-id", "--name-only", "-r", "-m", "--first-parent", sha).split()
    out = []
    for rel in projects(top):
        prefix = "" if rel == "." else f"{rel}/"
        board = Board(top, rel, graph=graph)
        wanted = []
        if "Human-prioritized" in marks and f"{prefix}{PRIORITY}" in changed:
            before = set(priority_ids(show_at(top, f"{sha}^", f"{prefix}{PRIORITY}")))
            after = set(priority_ids(show_at(top, sha, f"{prefix}{PRIORITY}")))
            feats = features_of(top, rel)
            wanted += [(i, "queued") for i in sorted(after - before) if i in feats and board.state(i) in (None, "prep")]
            wanted += [(i, "prep") for i in sorted(before - after) if i in feats and board.state(i) == "queued"]
        for path in changed:
            m = re.match(rf"^{re.escape(prefix)}{FEATURES}/(F\d{{2,}})-[^/]+/spec\.md$", path)
            if not m:
                continue
            old = spec_status(show_at(top, f"{sha}^", path))
            new = spec_status(show_at(top, sha, path))
            if "Human-accepted" in marks and new == "accepted" and old != "accepted":
                wanted.append((m.group(1), "accepted"))
            if "Human-reopened" in marks and old in ("accepted", "done") and new not in ("accepted", "done"):
                wanted.append((m.group(1), "reopened"))
        for item, to in wanted:
            try:
                got = board.move(item, to, actor="signed", by="MJRP", why=f"commit carimbado {sha[:9]}", stamp=sha)
            except Refused as exc:
                if to not in DECIDED:
                    continue  # his order never pulls back an item that already moved on
                # his acceptance or reopening is never lost: recorded as signed, and the sensor names the passage nobody recorded before
                frm = board.state(item)
                got = {"v": RECORD_FORMAT, "at": _clock.iso(), "item": item, "project": rel, "from": frm, "to": to, "actor": "signed", "by": "MJRP",
                       "why": f"commit carimbado {sha[:9]}; fora do grafo: {str(exc).splitlines()[0]}", "stamp": sha,
                       "outside": True}
                append(board.path, got)
            if got:
                out.append(got)
            if to in ("accepted", "reopened"):  # the same stamp closes the stage of the cycle
                try:
                    move_stage(board, item, "accepted" if to == "accepted" else "execute_verify", actor="signed", by="MJRP",
                               why=f"commit carimbado {sha[:9]}", stamp=sha)
                except (Refused, NotEvaluable):
                    pass
    return out


# ---- the steps that move by themselves (the agent does not choose to: the step is the move) -----------------------
BRANCH = re.compile(r"^(?:claude|feat|fix)/f(\d+)-", re.I)          # branch-convention@2 (rules/delivery.py `BRANCH`)
AGENT_BRANCH = re.compile(r"^claude/(f\d+(?:-f\d+)*)-", re.I)       # an agent's branch that names several features


def branch_features(branch):
    """The features a branch name carries (mirror of session_lease.branch_features)."""
    if m := AGENT_BRANCH.match(branch or ""):
        return [f"F{int(f[1:]):02d}" for f in m.group(1).lower().split("-")]
    if m := BRANCH.match(branch or ""):
        return [f"F{int(m.group(1)):02d}"]
    return []


NOT_AT_WORK = (None, "prep", "queued", "reopened", "waiting_human", "waiting_agent")  # a delivery from here went through «Em andamento»


def at_work_first(root, item, targets):
    """The delivery nobody recorded the start of: the passage to «Em andamento» first, so each step is an edge of the graph."""
    try:
        state = Board(root, item=item).state(item)
    except NotEvaluable:
        return targets
    return ["in_progress", *targets] if state in NOT_AT_WORK else targets


def step(root, item, targets, why, by=None):
    """Walks `item` along `targets` (each one a passage from where it stands), recording each that the graph allows; never raises: the
    step that called it (a lease, a close, a merge) is never undone by the board. Returns the lines to say."""
    try:
        board = Board(root, item=item)
    except NotEvaluable as exc:
        return [f"[board_move] {item}: o board não registrou ({exc})"]
    out = []
    for to in targets:
        try:
            got = board.move(item, to, by=by, why=why)
        except Refused as exc:
            return out + [f"[board_move] {item}: não passa a «{label(board.graph, to)}»: {str(exc).splitlines()[0]}"]
        except NotEvaluable as exc:
            return out + [f"[board_move] {item}: o board não registrou ({exc})"]
        if got:
            out.append(f"[board_move] {item}: «{label(board.graph, got['from'])}» → «{label(board.graph, to)}»")
    return out


def on_claim(root, feature, session=None):
    """A session reserves a feature (`session_lease.py claim`): it is «Em andamento» from that moment, with no commit.
    Also the start of every session (F298): a resumed session takes back the card that waited for the MJRP or another agent."""
    board_state = None
    try:
        board_state = Board(root, item=feature).state(feature)
    except NotEvaluable:
        pass
    if board_state in ("in_progress", "evaluating", "awaiting_merge"):
        return []
    if board_state in (None, "prep"):
        why_not = outside_priority_refusal(root, feature)
        if why_not:
            return [f"[board_move] {feature}: não passa a «Em andamento»: {why_not}"]
    return step(root, feature, ["in_progress"], "a sessão reservou a feature", by=session)


OPEN_ISSUE = ("open", "fixing", "reopened")  # the statuses of a `uat.md` row that is still to be fixed


def outside_priority_refusal(root, feature):
    """UAT-605: from «Preparação» (outside the «Priorizada») only the feature that fixes an open issue starts (the Agent track and the
    open UAT issue do not wait for the list); a product feature starts only from the «Priorizada». Returns the one-line reason when
    it may not start, else None."""
    out = f"fora da «Priorizada» só começa a feature que conserta uma issue aberta; {feature} espera o MJRP arrastá-la"
    try:
        top = top_of(root)
        rel = project_of(top, feature)
        folder = features_of(top, rel).get(feature)
        fields = _fm.parse((Path(top) / rel / FEATURES / folder / "spec.md").read_text(encoding="utf-8")) or {}
        issues = issue_oks(top, rel)
    except (NotEvaluable, OSError, TypeError):
        return out
    if str(fields.get("solution_type") or "").strip() != "fix":
        return out
    for uat in listed(fields.get("fixes")):
        row = issues.get(uat)
        if row and (row[0].split() or [""])[0] in OPEN_ISSUE:
            return None
    return out


BACK_TO = ("queued", "waiting_human", "waiting_agent")  # the states «Em andamento» has a passage back to (the graph's edges from `in_progress`)


def origin_of(board, item):
    """The state the card was in when the session last took it to «Em andamento» (`from` of that passage): None when it came from
    nowhere (a feature started outside the «Priorizada», from «Preparação») or the record has no such passage."""
    for e in reversed(read_events(board.path)):
        if e.get("item") == item and (e.get("dim") or "state") == "state" and e.get("to") == "in_progress":
            return e.get("from")
    return None


def on_stopped(root, feature, session=None, delivered_branch=None):
    """F298 (UAT-605), F303 (UAT-615): every session that held `feature` stopped (lease expired or released) with the card still
    «Em andamento». Three cases: the lease was released with the branch delivered (`delivered_branch`): the card is «Esperando o merge»
    (`on_delivered`), never a stop; the lease expired with nothing delivered: the card goes back to where it came from, the
    «Priorizada» only when it came from there; a card that came from outside the list («Preparação») has no passage back and stays,
    said in one line. The other states are left alone: waiting, judging and «Esperando o merge» have no live session on purpose."""
    try:
        board = Board(root, item=feature)
        state = board.state(feature)
        origin = origin_of(board, feature)
    except NotEvaluable:
        return []
    if state != "in_progress":
        return []
    if delivered_branch:   # the feature by the lease, not by the branch name (a `claim` on a branch outside the convention)
        return step(root, feature, at_work_first(root, feature, ["awaiting_merge"]), f"entregue no ramo {delivered_branch}", by=session)
    if origin not in BACK_TO:
        return [f"[board_move] {feature}: a sessão parou, mas o card não veio da «Priorizada» nem de uma espera: fica em «Em andamento»"]
    return step(root, feature, [origin], "a sessão parou sem entregar", by=session)


def on_delivered(root, branch, session=None):
    """The close is green (`session_close.py`): what the branch carries waits for the integrator («Esperando o merge»)."""
    out = []
    for fid in branch_features(branch):
        out += step(root, fid, at_work_first(root, fid, ["awaiting_merge"]), f"entregue no ramo {branch}", by=session)
    return out


def merged_features(top, branch):
    """UAT-606: the features a merge carries are the ones the branch name says plus every feature whose spec the merge took to `Done`
    (a batch-close branch names one feature and closes ten): `main` before the merge (`HEAD^1`) against `main` after (`HEAD`).
    No merge commit at HEAD (a replay by hand): the name alone."""
    found = list(branch_features(branch))
    got = subprocess.run(["git", "-C", str(top), "rev-parse", "--verify", "-q", "HEAD^2"], capture_output=True, text=True, timeout=30)
    if got.returncode != 0:
        return found
    names = git(top, "diff", "--name-only", "HEAD^1", "HEAD").split()
    for path in names:
        m = re.search(rf"{FEATURES}/(F\d{{2,}})-[^/]+/spec\.md$", path)
        if not m:
            continue
        fid = m.group(1)
        if spec_status(show_at(top, "HEAD", path)) == "done" and spec_status(show_at(top, "HEAD^1", path)) != "done" and fid not in found:
            found.append(fid)
    return found


def on_merged(root, branch):
    """The train merged `branch` into `main`: each feature it carries goes where its spec at `main` says - «Pronto para UAT», or
    «Encerrado» when the recheck closed it; a spec still `In progress` (a partial merge) moves nothing. The delivery nobody recorded is
    recorded first: the merge proves it."""
    top = top_of(root)
    out = []
    for fid in merged_features(top, branch):
        try:
            rel = project_of(top, fid)
        except NotEvaluable as exc:
            out.append(f"[board_move] {fid}: o board não registrou ({exc})")
            continue
        folder = features_of(top, rel).get(fid)
        try:
            fields = _fm.parse((Path(top) / rel / FEATURES / folder / "spec.md").read_text(encoding="utf-8")) or {}
        except OSError:
            continue
        status = str(fields.get("status") or "").strip().casefold()
        if status != "done":
            continue
        board = Board(top, rel)
        target = "closed" if board.closes(fid) else "ready"
        if board.state(fid) in (target, "ready", "closed", "accepted"):
            continue  # already recorded (the train and the hand-closed merge both run this): idempotent
        out += step(root, fid, at_work_first(root, fid, ["awaiting_merge", target]), f"o trem juntou {branch} na `main`",
                    by="merge_train")
        out += stage_walk(root, fid, [*FEATURE_STAGES, "homologation"], f"o trem juntou {branch} na `main`", by="merge_train")
    return out


# ---- the stage of the cycle: the second dimension of the same graph (lote 1b) ------------------------------------
def kind_of(item):
    return "story" if item.startswith("S-") else "feature"


def stage_edge(graph, frm, to):
    return next((e for e in graph["lifecycle"]["edges"] if e["from"] == frm and e["to"] == to), None)


def stage_label(graph, stage):
    return graph["lifecycle"]["stages"].get(stage, {}).get("label", {}).get("pt", stage) if stage else "sem registro"


def mentions(text, item):
    return re.search(rf"(?<![\w-]){re.escape(item)}(?![\w])", text or "") is not None


def run_git(top, *args):
    got = subprocess.run(["git", "-C", str(top), *args], capture_output=True, text=True, timeout=30)
    return got.stdout if got.returncode == 0 else None


def commit_holds(board, item, evidence, since):
    """A commit is evidence when it is a real commit (never an option: recheck 1b P1-2), already in the history of HEAD, made after
    the item's previous stage passage, and it changes a file that, at that commit, names the item (or the item's own folder)."""
    if not evidence or evidence.startswith("-"):
        return False
    sha = (run_git(board.top, "rev-parse", "--verify", "--quiet", f"{evidence}^{{commit}}") or "").strip()
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        return False
    if subprocess.run(["git", "-C", str(board.top), "merge-base", "--is-ancestor", sha, "HEAD"], capture_output=True,
                      timeout=30).returncode != 0:
        return False
    made = int((run_git(board.top, "log", "-1", "--format=%ct", sha) or "0").strip() or 0)
    if since and made < since:
        return False
    used = {str(e.get("evidence") or "") for e in read_events(board.path) if e.get("dim") == "stage" and e.get("item") == item}
    if any(u and sha.startswith(u) or u == sha for u in used if re.fullmatch(r"[0-9a-f]{7,40}", u)):
        return False  # a commit already proved an earlier stage of this item: it proves nothing new
    folder = features_of(board.top, board.rel).get(item) if item.startswith("F") else None
    changed = (run_git(board.top, "diff-tree", "--no-commit-id", "--name-only", "-r", "--root", sha) or "").split()
    for path in changed[:200]:
        if folder and f"/{folder}/" in f"/{path}":
            return True
        if mentions(run_git(board.top, "show", f"{sha}:{path}") or "", item):
            return True
    return False


def path_holds(board, item, evidence, since=0):
    """An artifact is evidence when it is a path inside the repository (relative, no `..`, never an option), present at `main`, naming
    the item there, changed at `main` after the previous passage, not the item's own requirement or feature file, and not already the
    evidence of an earlier passage of the item (recheck 1b P1-1, P1-A)."""
    if not evidence or evidence.startswith("-") or Path(evidence).is_absolute() or ".." in Path(evidence).parts:
        return False
    own = re.search(rf"/{re.escape(item)}-[^/]*\.md$", "/" + evidence) or (
        item.startswith("F") and re.search(rf"/features/{re.escape(item)}-", "/" + evidence))
    if own or not mentions(show_at(board.top, "main", evidence), item):
        return False
    changed = int((run_git(board.top, "log", "-1", "--format=%ct", "main", "--", evidence) or "0").strip() or 0)
    if since and changed < since:
        return False
    used = {str(e.get("evidence") or "") for e in read_events(board.path) if e.get("dim") == "stage" and e.get("item") == item}
    return evidence not in used


def at_head(board, rel_path):
    """A file as HEAD has it (committed), never the working tree: an uncommitted plan is not evidence."""
    return run_git(board.top, "show", f"HEAD:{rel_path}")


def evidence_holds(board, item, kind, evidence, order, since=0):
    """Whether one kind of evidence holds for the item; `evidence` is what the caller pointed at (a commit, a path); `since`, the time
    of the item's previous stage passage (a commit before it proves nothing new)."""
    top, rel = board.top, board.rel
    prefix = "" if rel == "." else rel + "/"
    folder = features_of(top, rel).get(item) if item.startswith("F") else None
    if kind == "order":
        return bool(order.strip())
    if kind == "commit":
        return commit_holds(board, item, evidence, since)
    if kind == "path":
        return path_holds(board, item, evidence, since)
    if kind == "prototype_approved":
        info = show_at(top, "main", f"{prefix}docs/specs/info-arch.md")
        section = re.search(r"^## Protótipos aprovados[ \t]*$(.*?)(?=^## |\Z)", info, re.M | re.S)
        for entry in re.split(r"^### ", section.group(1), flags=re.M)[1:] if section else []:
            head, _, body = entry.partition("\n")
            approved = re.search(r"^\s*-\s*Aprovado por:\s*(?!.*(<[^>]+>|AAAA))\S", body, re.M)
            if approved and mentions(head, item):
                return True
        return False
    if kind in ("plan", "tasks") and folder:
        return at_head(board, f"{prefix}{FEATURES}/{folder}/{kind}.md") is not None
    if kind == "first_task" and folder:
        text = at_head(board, f"{prefix}{FEATURES}/{folder}/tasks.md") or ""
        return re.search(r"^[-*]\s+\[[xX]\]\s+(?:\*\*)?TASK-\d", text, re.M) is not None
    if kind == "merged" and folder:
        return spec_status(show_at(top, "main", f"{prefix}{FEATURES}/{folder}/spec.md")) in ("done", "accepted")
    return False


def stage_of(board, item):
    got = current(read_events(board.path), "stage").get(item)
    return got["to"] if got else None


def move_stage(board, item, to, actor="agent", by=None, why="", order="", evidence="", stamp=None):
    """Records the passage of `item` to the stage `to`, checked on the cycle's edges and their evidence; raises Refused with the way out."""
    graph = board.graph
    stages = graph["lifecycle"]["stages"]
    kind = kind_of(item)
    if to not in stages or kind not in stages[to]["types"]:
        names = ", ".join(s for s, v in stages.items() if kind in v["types"])
        raise Refused(f"{to}: não é uma etapa de {kind}. As etapas: {names}")
    frm = stage_of(board, item)
    start = frm or graph["lifecycle"]["initial"][kind]
    if start == to:
        return None
    e = stage_edge(graph, start, to)
    if e is None:
        ways = [f"  → {stage_label(graph, x['to'])} ({x['to']}): {x['says']} · evidência: {', '.join(x.get('evidence') or [x.get('stamp', '')])}"
                for x in graph["lifecycle"]["edges"] if x["from"] == start]
        raise Refused(f"{item} está em «{stage_label(graph, start)}»: a passagem para «{stage_label(graph, to)}» não existe. As que existem:\n"
                      + "\n".join(ways or ["  (nenhuma)"]))
    if e["actor"] == "signed" and actor != "signed":
        raise Refused(f"{item} → «{stage_label(graph, to)}» é decisão do MJRP: só o commit com `{e.get('stamp')}:`.")
    if actor != "signed":
        kinds = e.get("evidence") or []
        last = current(read_events(board.path), "stage").get(item) or {}
        since = int(last.get("ts") or 0)  # the second of the previous passage (`ts`, written with every stage line)
        if not any(evidence_holds(board, item, k, evidence, order, since) for k in kinds):
            raise Refused(f"{item} → «{stage_label(graph, to)}» pede a evidência ({' ou '.join(kinds)}): aponte-a com `--evidence "
                          f"<commit ou caminho>` (ou as palavras do MJRP em `--order`)")
    event = {"v": RECORD_FORMAT, "dim": "stage", "at": _clock.iso(), "ts": int(time.time()), "item": item, "project": board.rel, "from": frm, "to": to,
             "actor": "signed" if actor == "signed" else ("order" if order.strip() else actor),
             "by": by or os.environ.get("CLAUDE_SESSION_ID") or "?", "why": why}
    if evidence and re.fullmatch(r"[0-9a-f]{7,40}", evidence):
        evidence = (run_git(board.top, "rev-parse", "--verify", "--quiet", f"{evidence}^{{commit}}") or evidence).strip()
    for key, value in (("order", order.strip()), ("evidence", evidence), ("stamp", stamp)):
        if value:
            event[key] = value
    append(board.path, event, expect=frm)
    return event


def stage_walk(root, item, targets, why, by=None, evidence=""):
    """Walks the item's stage along `targets`, each an edge from where it stands; never raises (the step that called it goes on)."""
    try:
        board = Board(root, item=item)
    except NotEvaluable as exc:
        return [f"[board_move] {item}: a etapa não foi registrada ({exc})"]
    out = []
    for to in targets:
        try:
            got = move_stage(board, item, to, by=by, why=why, evidence=evidence)
        except (Refused, NotEvaluable):
            continue  # a stage it already passed, or one whose evidence is not there yet: the next target may still hold
        if got:
            out.append(f"[board_move] {item}: etapa «{stage_label(board.graph, got['from'])}» → «{stage_label(board.graph, to)}»")
    return out


FEATURE_STAGES = ("plan", "tasks", "execute_verify")


def on_commit(root, commit="HEAD"):
    """The post-commit: the commit that writes a feature's plan, its tasks or its first closed task closes that stage (the step is the
    move). Returns the lines to say."""
    top = top_of(root)
    try:
        changed = git(top, "diff-tree", "--no-commit-id", "--name-only", "-r", commit).split()
    except NotEvaluable:
        return []
    feats = sorted({m.group(1) for p in changed if (m := re.search(r"/features/(F\d{2,})-[^/]+/(?:plan|tasks)\.md$", p))})
    out = []
    for fid in feats:
        out += stage_walk(top, fid, FEATURE_STAGES, f"o commit {commit[:9] if commit != 'HEAD' else 'HEAD'} fechou a etapa")
    return out


# ---- the migration ----------------------------------------------------------------------------------------------
MACHINE_OK = re.compile(r"^\s*(recheck independente|testes verdes)\b", re.I)  # mirror of rules/tracks.py `_MACHINE_OK`
OK_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")  # mirror of adapters/repo_fs/uat.py `_state`: a dated OK closes the issue
NODE_ID = re.compile(r"^((?:[A-Z]+-)*[A-Z]+-\d+[a-z]?)(?:-|$)")


def listed(value):
    """A frontmatter list (`[a, b]`, `["a"]`, or a YAML list the reader already split) as ids."""
    if isinstance(value, (list, tuple)):
        items = value
    else:
        items = re.split(r"[,\s]+", str(value or "").strip().strip("[]"))
    out = []
    for raw in items:
        text = re.sub(r"^\[\[|\]\]$", "", str(raw).strip().strip("\"'")).split("|")[0]
        if m := NODE_ID.match(text):
            out.append(m.group(1))
    return out


def story_statuses(top, rel):
    """{story id: its status, casefolded} of a project's requirement nodes."""
    out = {}
    base = Path(top) / rel / "docs/specs/requirements"
    for f in base.rglob("*.md") if base.is_dir() else ():
        try:
            fields = _fm.parse(f.read_text(encoding="utf-8")) or {}
        except OSError:
            continue
        if fields.get("type") == "requirement":
            key = str(fields.get("id") or "-".join(f.stem.split("-")[:2])).strip()
            out[key] = str(fields.get("status") or "").casefold()
            TARGETS[(str(base), key)] = [str(t) for t in (fields.get("points_to") or [])] if isinstance(
                fields.get("points_to"), list) else listed_raw(fields.get("points_to"))
    return out


TARGETS = {}  # (requirements folder, story id) -> its points_to, read with its status


def listed_raw(value):
    return [t for t in re.split(r"[,\s]+", str(value or "").strip().strip("[]")) if t]


def issue_oks(top, rel):
    """{UAT-nn: (status, the MJRP's OK cell)} of a project's issue register."""
    out, cols, by = {}, None, None
    try:
        text = (Path(top) / rel / "docs/specs/uat.md").read_text(encoding="utf-8")
    except OSError:
        return out
    for line in text.splitlines():
        cells = [c.strip() for c in line.split("|")]
        if len(cells) > 2 and cells[1] == "ID":
            cols = (cells.index("Status") if "Status" in cells else None, cells.index("OK do humano") if "OK do humano" in cells else None)
            by = cells.index("Reportado por") if "Reportado por" in cells else None
            continue
        if cols and len(cells) > 2 and re.match(r"^UAT-\d+$", cells[1]) and None not in cols and max(cols) < len(cells):
            who = cells[by] if by is not None and by < len(cells) else "MJRP"
            out[cells[1]] = (cells[cols[0]].casefold(), cells[cols[1]], who.startswith("MJRP") or "prioridade: humano" in who)
    return out


def accepted_by_others(fields, stories, issues):
    """Mirror of rules/board_items.py `_feature_accepted` beyond the spec: a fix whose issues all closed with the MJRP's OK, or a
    feature whose imported stories are all Accepted."""
    if str(fields.get("solution_type") or "").strip() == "fix":
        rows = [issues.get(u) for u in listed(fields.get("fixes"))]
        return bool(rows) and all(r is not None and OK_DATE.search(r[1] or "") and not MACHINE_OK.match(r[1] or "") for r in rows)
    imports = listed(fields.get("imports"))
    return bool(imports) and all("accepted" in stories.get(s, "") for s in imports)


def closed_by_machine(fields, issues, stories_dir=None):
    """A Done feature that closed without the MJRP's acceptance: its `closed_by:` stands by the kernel's own rule of who closes
    (`feature_closure.py`, the reader the board and the requirements graph use), or a fix whose issues all closed, at least one by
    the machine's OK (the Agent track)."""
    try:
        import feature_closure
        stories = [(sid, TARGETS.get((stories_dir, sid))) for sid in listed(fields.get("imports"))]
        his = [(u, issues[u][2] if u in issues else None) for u in listed(fields.get("fixes"))]
        eye = feature_closure.eye_reasons(stories, his, fields.get("needs_human"))
        if feature_closure.closes(fields.get("closed_by"), fields.get("status"), eye):
            return True
    except Exception as exc:  # noqa: BLE001 - no closure rule: only the Agent track's machine OK below, and it is said
        print(f"[board_move] a regra de fecho do kernel não respondeu ({type(exc).__name__}: {exc}); só o OK da máquina conta",
              file=sys.stderr)
    if str(fields.get("solution_type") or "").strip() != "fix":
        return False
    rows = [issues.get(u) for u in listed(fields.get("fixes"))]
    return bool(rows) and all(r is not None and OK_DATE.search(r[1] or "") for r in rows) and any(
        MACHINE_OK.match(r[1] or "") for r in rows)


def seed_state(fields, in_priority, working, accepted=False, machine_closed=False):
    """The state a feature with no record starts from, read from what is already explicit: its spec, the MJRP's list, a live lease,
    and the acceptance the board already counts (`accepted`: its stories or its issues accepted by the MJRP)."""
    status = str(fields.get("status") or "").strip().casefold()
    if status == "cancelled":
        return "cancelled"
    if status == "deferred":
        return "deferred"
    if status == "accepted" or (accepted and status == "done"):
        return "accepted"
    if status == "done":
        return "closed" if machine_closed else "ready"
    if working:
        return "in_progress"  # a live session builds it, whatever its spec still says
    if status == "in progress":
        return "waiting_agent"  # started and nobody at it: it waits for an agent to take it up again (or to finish its close)
    return "queued" if in_priority else "prep"


def open_branches(top):
    """{Fxx: branch} of the branches by the convention that `main` does not hold yet (the work that lives on a branch)."""
    out = {}
    try:
        names = git(top, "for-each-ref", "refs/heads", "--format=%(refname:short)").split()
    except NotEvaluable:
        return out
    for name in names:
        for fid in branch_features(name):
            done = subprocess.run(["git", "-C", str(top), "merge-base", "--is-ancestor", name, "main"], capture_output=True, timeout=30)
            if done.returncode == 1:
                out.setdefault(fid, name)
    return out


def seed(root, rel=None, dry_run=False, graph=None):
    """Records the starting state of every feature of the project(s) with no record. Returns [(project, item, state)]."""
    top = top_of(root)
    try:
        import session_lease
        working = {f for f, s in session_lease.claimed(top).items() if s == "working"}
    except Exception:  # no lease reader: nobody is taken for working, so an In progress spec waits for an agent
        working = set()
    out = []
    branches = open_branches(top)
    for r in ([rel] if rel else projects(top)):
        board = Board(top, r, graph=graph)
        known = current(read_events(board.path))
        in_list = set(priority_ids(show_at(top, "main", f"{'' if r == '.' else r + '/'}{PRIORITY}")))
        stories, issues = story_statuses(top, r), issue_oks(top, r)
        for fid, folder in sorted(features_of(top, r).items(), key=lambda kv: int(kv[0][1:])):
            if fid in known:
                continue
            # the spec as the `main` has it (the board's truth), the disk only for a feature born on this branch
            text = show_at(top, "main", f"{'' if r == '.' else r + '/'}{FEATURES}/{folder}/spec.md")
            try:
                text = text or (Path(top) / r / FEATURES / folder / "spec.md").read_text(encoding="utf-8")
            except OSError:
                continue
            fields = _fm.parse(text) or {}
            state = seed_state(fields, fid in in_list, fid in working, accepted_by_others(fields, stories, issues),
                               closed_by_machine(fields, issues, str(Path(top) / r / "docs/specs/requirements")))
            if fid in branches and state in ("prep", "queued", "waiting_agent"):
                # the work lives on a branch `main` does not hold: delivered there (its spec Done at the tip) it waits for the merge,
                # else for an agent to take it up again
                tip = show_at(top, branches[fid], f"{'' if r == '.' else r + '/'}{FEATURES}/{folder}/spec.md")
                state = "awaiting_merge" if spec_status(tip) == "done" else "waiting_agent"
            out.append((r, fid, state))
            if not dry_run:
                append(board.path, {"v": RECORD_FORMAT, "at": _clock.iso(), "item": fid, "project": r, "from": None, "to": state, "actor": "seed",
                                    "by": "board_move.py seed", "why": "o estado de partida, lido da spec, da «Priorizada» e do lease"})
    return out


def seed_stages(root, rel=None, dry_run=False, graph=None):
    """Records, once, the stage of the cycle of every feature and story with no stage yet - only what is unambiguous (the MJRP's option
    (a), recommended: a story whose Discovery moved is placed by a list of moves he checks, never guessed). Returns [(project, item, stage)]."""
    top = top_of(root)
    out = []
    for r in ([rel] if rel else projects(top)):
        board = Board(top, r, graph=graph)
        known = current(read_events(board.path), "stage")
        prefix = "" if r == "." else r + "/"
        stories, issues = story_statuses(top, r), issue_oks(top, r)
        building = {}
        for fid, folder in features_of(top, r).items():
            text = show_at(top, "main", f"{prefix}{FEATURES}/{folder}/spec.md")
            fields = _fm.parse(text) or {} if text else {}
            status = str(fields.get("status") or "").strip().casefold()
            for sid in listed(fields.get("imports")):
                building[sid] = max(building.get(sid, 0), {"in progress": 1, "done": 2, "accepted": 3}.get(status, 0))
            if fid in known or not text or status in ("cancelled", "deferred"):
                continue
            d = Path(top) / r / FEATURES / folder
            if status == "accepted" or (status == "done" and accepted_by_others(fields, stories, issues)):
                stage = "accepted"
            elif status == "done":
                stage = "homologation"
            elif status == "in progress":
                ticked = (d / "tasks.md").is_file() and re.search(r"^[-*]\s+\[[xX]\]\s+(?:\*\*)?TASK-\d",
                                                                  (d / "tasks.md").read_text(encoding="utf-8"), re.M)
                stage = "execute_verify" if ticked else "tasks" if (d / "tasks.md").is_file() else "plan" if (d / "plan.md").is_file() else "specify"
            else:
                stage = "specify"
            out.append((r, fid, stage))
        for sid, status in sorted(stories.items()):
            if sid in known or not sid.startswith("S-"):
                continue
            if "accepted" in status:
                stage = "accepted"
            elif "done" in status or building.get(sid, 0) >= 2:
                stage = "homologation"
            elif building.get(sid, 0) == 1 or "progress" in status or "doing" in status:
                stage = "execute_verify"
            elif "ready" in status:
                stage = "ready"
            else:
                stage = "backlog"  # untouched or not: a Discovery that moved goes by the list of moves the MJRP checks
            out.append((r, sid, stage))
        if not dry_run:
            for _, item, stage in [x for x in out if x[0] == r]:
                append(board.path, {"v": RECORD_FORMAT, "dim": "stage", "at": _clock.iso(), "item": item, "project": r, "from": None,
                                    "to": stage, "actor": "seed", "by": "board_move.py seed",
                                    "why": "a etapa de partida, só do que é inequívoco (a spec, o status da story, as features que a importam)"})
    return out


MOVE_LINE = re.compile(r"^\s*-\s*`?(S-\d+|F\d{2,})`?\s*(?:→|->)\s*`?([a-z_]+)`?\s*(?:[—–-]\s*(?P<why>.+))?$")


LISTED_STAGES = ("backlog", "explore", "frame", "draw")  # what the checked list may place: the Discovery and the drawing, never a gate
LIST_BY = "lista de movimentos conferida pelo MJRP"


def seed_moves(root, listing, rel=None, dry_run=False, order=""):
    """The list of moves the MJRP checked once (the option (a) of the seed, 2026-11-17): each line `- S-164 → draw — why` places an item
    whose Discovery already moved, as a migration line (`actor: seed`, the list as its evidence). Only an item still at its seeded stage
    moves: once a passage was recorded, only the command moves it. Returns [(item, stage)]."""
    if not order.strip():
        raise Refused("a lista só se aplica com as palavras do MJRP que a conferiu (`--order \"...\"`)")
    try:
        text = Path(listing).read_text(encoding="utf-8")
    except OSError as exc:
        raise NotEvaluable(f"a lista {listing} não lê: {exc}") from exc
    out, pending = [], []
    lines = [m for line in text.splitlines() if (m := MOVE_LINE.match(line))]
    for m in lines:  # the whole list is checked before any line is written (recheck 1b P2: all or nothing)
        if not m.group(1).startswith("S-") or m.group(2) not in LISTED_STAGES:
            raise Refused(f"{m.group(1)} → {m.group(2)}: a lista só põe uma story em {', '.join(LISTED_STAGES)}; o resto anda pelo "
                          "comando, com a evidência ou o carimbo do MJRP")
    for m in lines:
        item, stage = m.group(1), m.group(2)
        if not item.startswith("S-") or stage not in LISTED_STAGES:
            raise Refused(f"{item} → {stage}: a lista só põe uma story em {', '.join(LISTED_STAGES)}; o resto anda pelo comando, com a "
                          "evidência ou o carimbo do MJRP")
        board = Board(root, rel, item=item)
        if stage not in board.graph["lifecycle"]["stages"] or kind_of(item) not in board.graph["lifecycle"]["stages"][stage]["types"]:
            raise Refused(f"{item} → {stage}: não é uma etapa de {kind_of(item)}")
        events = read_events(board.path)
        mine = [e for e in events if e.get("dim") == "stage" and e["item"] == item]
        if len(mine) > 1 or any(e.get("actor") != "seed" for e in mine):
            continue  # it already moved (by the command, or by a list): the list applies once and never overrides a passage
        out.append((item, stage))
        if stage != (mine[-1]["to"] if mine else None):
            pending.append((board, item, stage, mine, m))
    for board, item, stage, mine, m in pending if not dry_run else ():
        append(board.path, {"v": RECORD_FORMAT, "dim": "stage", "at": _clock.iso(), "item": item, "project": board.rel,
                            "from": mine[-1]["to"] if mine else None, "to": stage, "actor": "seed", "ts": int(time.time()),
                            "by": LIST_BY, "evidence": str(listing), "order": order.strip(),
                            "why": (m.group("why") or "").strip()})
    return out


# ---- the drawings of the wiki, generated from the graph so they never diverge (docs/wiki/graphs/, F275) -------------
GRAPHS_DIR = "docs/wiki/graphs"
STATES_MMD = "05-board-states.mmd"
STATUS_MMD = "04-status-is-the-board.mmd"
CYCLE_MMD = "13-board-cycle.mmd"
ACTOR_NOTE = {"agent": "", "order": " · ordem do MJRP", "signed": " · carimbo do MJRP"}


def mermaid_states(graph):
    """The state machine of the board: each column a state, each arrow a passage the graph allows, with who makes it."""
    out = ["%% gerado por `python3 mjrp-scripts/board_move.py graphs` a partir de mjrp-scripts/board_states.json; não edite à mão",
           "stateDiagram-v2", "  direction TB"]
    for sid, s in graph["states"].items():
        out.append(f'  state "{s["label"]["pt"]}" as {sid}')
    out.append(f"  [*] --> {graph['initial']} : feature registrada")
    for e in graph["edges"]:
        out.append(f"  {e['from']} --> {e['to']} : {e['says']}{ACTOR_NOTE[e['actor']]}")
    out += ["  closed --> [*]", "  accepted --> [*]", "  cancelled --> [*]"]
    out += ["  classDef human fill:#FAECE7,stroke:#993C1D,color:#4A1B0C",
            "  classDef agent fill:#EEEDFE,stroke:#534AB7,color:#26215C",
            "  classDef done fill:#E1F5EE,stroke:#0F6E56,color:#04342C"]
    waits = [sid for sid, s in graph["states"].items() if s.get("waits_on") == "human"]
    ends = [sid for sid in graph["states"] if sid in ("ready", "accepted", "closed", "cancelled", "deferred")]
    work = [sid for sid in graph["states"] if sid not in waits + ends]
    out += [f"  class {','.join(work)} agent", f"  class {','.join(waits)} human", f"  class {','.join(ends)} done"]
    return "\n".join(out) + "\n"


def mermaid_status(graph):
    """One machine: each state of the board and the status the spec of a feature carries in it."""
    out = ["%% gerado por `python3 mjrp-scripts/board_move.py graphs` a partir de mjrp-scripts/board_states.json; não edite à mão",
           "flowchart LR"]
    statuses = []
    for s in graph["states"].values():
        for st in ([s["spec_status"]] if isinstance(s["spec_status"], str) else s["spec_status"]):
            if st not in statuses:
                statuses.append(st)
    out.append('  subgraph B["O estado do item no board — gravado pelo board_move.py, conferido pelo grafo"]')
    out.append("    direction TB")
    for sid, s in graph["states"].items():
        out.append(f'    {sid}["{s["label"]["pt"]}"]')
    out.append("  end")
    out.append('  subgraph S["O status na spec — a projeção do mesmo estado"]')
    out.append("    direction TB")
    for st in statuses:
        out.append(f'    s_{re.sub(r"[^A-Za-z]", "_", st)}["{st}"]')
    out.append("  end")
    for sid, s in graph["states"].items():
        for i, st in enumerate([s["spec_status"]] if isinstance(s["spec_status"], str) else s["spec_status"]):
            out.append(f'  {sid} {"-->" if i == 0 else "-.->"} s_{re.sub(r"[^A-Za-z]", "_", st)}')
    out += ["  classDef b fill:#EEEDFE,stroke:#534AB7,color:#26215C",
            "  classDef s fill:#E1F5EE,stroke:#0F6E56,color:#04342C",
            f"  class {','.join(graph['states'])} b",
            f"  class {','.join('s_' + re.sub(r'[^A-Za-z]', '_', st) for st in statuses)} s"]
    return "\n".join(out) + "\n"


def mermaid_cycle(graph):
    """The stage of the cycle (lote 1b): each stage of the board's phases, each arrow a passage with the evidence it asks."""
    life = graph["lifecycle"]
    out = ["%% gerado por `python3 mjrp-scripts/board_move.py graphs` a partir de mjrp-scripts/board_states.json; não edite à mão",
           "flowchart LR"]
    phases = {}
    for sid, st in life["stages"].items():
        phases.setdefault(st["phase"], []).append(sid)
    names = {"discovery": "Discovery", "design": "Design", "delivery": "Delivery", "release": "Release"}
    for phase, ids in phases.items():
        out.append(f'  subgraph {phase}["{names.get(phase, phase)}"]')
        out.append("    direction LR")
        out += [f'    {sid}["{life["stages"][sid]["label"]["pt"]}"]' for sid in ids]
        out.append("  end")
    for e in life["edges"]:
        why = f"carimbo {e['stamp']}" if e["actor"] == "signed" else " ou ".join(e.get("evidence") or [])
        out.append(f'  {e["from"]} -->|"{why}"| {e["to"]}')
    out += ["  classDef st fill:#EEEDFE,stroke:#534AB7,color:#26215C", f"  class {','.join(life['stages'])} st"]
    return "\n".join(out) + "\n"


def graphs(root, check=False, graph=None):
    """Writes (or, with `check`, compares) the two drawings of the wiki. Returns the files that differ (empty: in step); None when
    the repository has no `docs/wiki/graphs/` (a child: nothing to draw)."""
    graph = graph or load_graph()
    base = top_of(root) / GRAPHS_DIR
    if not base.is_dir():
        return None
    stale = []
    for name, text in ((STATES_MMD, mermaid_states(graph)), (STATUS_MMD, mermaid_status(graph)), (CYCLE_MMD, mermaid_cycle(graph))):
        path = base / name
        try:
            now = path.read_text(encoding="utf-8")
        except OSError:
            now = None
        if now != text:
            stale.append(f"{GRAPHS_DIR}/{name}")
            if not check:
                path.write_text(text, encoding="utf-8")
    return stale


# ---- the commands -----------------------------------------------------------------------------------------------
def cmd_move(args):
    board = Board(args.root, args.project, args.item)
    got = board.move(args.item, args.state, by=args.session, why=args.why or "", order=args.order or "")
    if got is None:
        print(f"[board_move] {args.item} já está em «{label(board.graph, args.state)}»: nada a gravar")
    else:
        print(f"[board_move] {args.item}: «{label(board.graph, got['from'])}» → «{label(board.graph, got['to'])}» gravado")
    return 0


def cmd_next(args):
    board = Board(args.root, args.project, args.item)
    stage = stage_of(board, args.item)
    kind = kind_of(args.item)
    start = stage or board.graph["lifecycle"]["initial"].get(kind)
    print(f"{args.item}: etapa «{stage_label(board.graph, stage)}»" + ("" if stage else f" (conta como «{stage_label(board.graph, start)}»)"))
    for x in board.graph["lifecycle"]["edges"]:
        if x["from"] == start:
            print(f"  etapa → {stage_label(board.graph, x['to'])} ({x['to']}): {x['says']} · evidência: "
                  f"{', '.join(x.get('evidence') or [x.get('stamp', '')])}")
    if args.item.startswith("S-"):
        return 0  # a story's column follows its status; its stage is what the cycle records
    state = board.state(args.item)
    print(f"{args.item} está em «{label(board.graph, state)}»" + ("" if state else f" (conta como «{label(board.graph, board.graph['initial'])}»)"))
    print("\n".join(way_out(board.graph, state or board.graph["initial"])))
    return 0


def cmd_show(args):
    top = top_of(args.root)
    rels = projects(top) if args.all else [args.project or project_at(top, args.root)]
    for rel in rels:
        board = Board(top, rel)
        rows = current(read_events(board.path))
        print(f"## {rel} — {board.path}")
        for item, e in sorted(rows.items(), key=lambda kv: (kv[0][0], int(re.sub(r'\D', '', kv[0]) or 0))):
            print(f"  {item}: {label(board.graph, e['to'])} · {e['at'][:16]} · {e.get('actor')} · {e.get('why', '')}")
    return 0


def cmd_stamped(args):
    for e in stamped(args.root, args.commit):
        print(f"[board_move] {e['item']}: «{e.get('from')}» → «{e['to']}» pelo commit carimbado do MJRP")
    return 0


def cmd_seed(args):
    for rel, item, state in seed(args.root, args.project, args.dry_run):
        print(f"[board_move] {'(simulação) ' if args.dry_run else ''}{rel} {item}: {state}")
    for rel, item, stage in seed_stages(args.root, args.project, args.dry_run):
        print(f"[board_move] {'(simulação) ' if args.dry_run else ''}{rel} {item}: etapa {stage}")
    return 0


def cmd_seed_moves(args):
    for item, stage in seed_moves(args.root, args.listing, args.project, args.dry_run, args.order):
        print(f"[board_move] {'(simulação) ' if args.dry_run else ''}{item}: etapa {stage}")
    return 0


def cmd_stage(args):
    board = Board(args.root, args.project, args.item)
    got = move_stage(board, args.item, args.stage, by=args.session, why=args.why or "", order=args.order or "", evidence=args.evidence or "")
    print(f"[board_move] {args.item}: " + (f"etapa «{stage_label(board.graph, got['from'])}» → «{stage_label(board.graph, got['to'])}» gravada"
                                            if got else f"já está em «{stage_label(board.graph, args.stage)}»"))
    return 0


MERGE_SUBJECT = re.compile(r"^(?:merge:\s*(\S+)|Merge branch '([^']+)')")


def merge_commit_branch(top, commit="HEAD"):
    """The branch a merge commit on `main` brought in (from its subject), or None when `commit` is not a merge or is not on `main`.
    A merge on any other branch (`main` brought into a feature branch) records nothing."""
    parents = git(top, "rev-list", "--parents", "-n", "1", commit).split()[1:]
    if len(parents) < 2:
        return None
    here = subprocess.run(["git", "-C", str(top), "symbolic-ref", "--short", "-q", "HEAD"], capture_output=True, text=True, timeout=30)
    if here.stdout.strip() != "main":
        return None
    m = MERGE_SUBJECT.match(git(top, "log", "-1", "--format=%s", commit).strip())
    return (m.group(1) or m.group(2)) if m else ""


def cmd_committed(args):
    """The post-commit: the MJRP's stamp, the stage the commit closed, and the merge the integrator closed by hand (UAT-606: `git commit`
    after a conflict runs no `post-merge`; the train's own merge runs `on_merged` itself, and both are idempotent)."""
    try:
        merged = merge_commit_branch(top_of(args.root), args.commit)
    except NotEvaluable:
        merged = None
    if merged is not None:
        try:
            for line in on_merged(args.root, merged):
                print(line)
        except Exception as exc:  # noqa: BLE001 - the commit is made: the stamp and the stage below still run
            print(f"[board_move] o merge não foi registrado ({type(exc).__name__}: {exc})")
    for e in stamped(args.root, args.commit):
        print(f"[board_move] {e['item']}: «{e.get('from')}» → «{e['to']}» pelo commit carimbado do MJRP")
    for line in on_commit(args.root, args.commit):
        print(line)
    return 0


def cmd_graphs(args):
    stale = graphs(args.root, check=args.check)
    if stale is None:
        print("[board_move] este repositório não tem docs/wiki/graphs/: nada a desenhar")
        return 0
    if args.check:
        if stale:
            print("[board_move] os desenhos não batem com o grafo: " + ", ".join(stale) + " (rode `board_move.py graphs`)")
            return 1
        print("[board_move] os desenhos batem com o grafo")
        return 0
    print("[board_move] " + (("reescrevi " + ", ".join(stale) + "; agora `node mjrp-scripts/render_graphs.mjs`") if stale else "nada mudou"))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="O estado de um item no board: confere a passagem no grafo único e grava.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("move", "next", "show", "stamped", "seed", "graphs", "stage", "committed", "seed-moves"):
        p = sub.add_parser(name)
        p.add_argument("--root", default=".")
        p.add_argument("--project", default=None)
        if name in ("move", "next", "stage"):
            p.add_argument("item")
        if name in ("move", "stage"):
            p.add_argument("state" if name == "move" else "stage")
            p.add_argument("--why", default="")
            p.add_argument("--order", default="")
            p.add_argument("--session", default=None)
        if name == "stage":
            p.add_argument("--evidence", default="")
        if name == "show":
            p.add_argument("--all", action="store_true")
        if name in ("stamped", "committed"):
            p.add_argument("commit", nargs="?", default="HEAD")
        if name in ("seed", "seed-moves"):
            p.add_argument("--dry-run", action="store_true")
        if name == "seed-moves":
            p.add_argument("listing")
            p.add_argument("--order", default="")
        if name == "graphs":
            p.add_argument("--check", action="store_true")
    args = ap.parse_args(argv)
    try:
        return {"move": cmd_move, "next": cmd_next, "show": cmd_show, "stamped": cmd_stamped, "seed": cmd_seed,
                "graphs": cmd_graphs, "stage": cmd_stage, "committed": cmd_committed,
                "seed-moves": cmd_seed_moves}[args.cmd](args)
    except Refused as exc:
        print(f"[board_move] recusado: {exc}", file=sys.stderr)
        return 1
    except NotEvaluable as exc:
        print(f"[board_move] não avaliável: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
