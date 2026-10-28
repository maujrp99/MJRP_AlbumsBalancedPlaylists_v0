#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""requirements_graph_check.py -- checks the requirements graph of a project against its single declaration,
requirements_graph_rules.json (S-63, kernel page requirements-graph).

Nodes: requirement and NFR files in docs/specs/requirements/ (frontmatter), epics in prd.md (heading + the
paragraph below it, which carries the inline edges and the ^EP-xx block anchor), outcomes and releases in
ROADMAP.md (^OUT-xx, ^REL-xx block anchors), observable states in info-arch.md and behavior.md (block anchors; a path-qualified link resolves in a nested project), features in
docs/specs/features/Fxx-slug/ (spec.md frontmatter; REQ-xx and TASK-xx are local IDs).

Edges are written in one direction only; each one is enforced only from the status the rules declare
(lesson of SDD_chain_artifacts_check, 16/09: checking every pattern in every pair gave 366 false positives).

Informational until it proves quiet (S-63 step 7): exits 0 and prints the findings. --strict exits 1 when there
are findings and 2 when the project has no requirements graph yet (contract: 0 passed, 1 failed, 2 not
evaluable). Python 3 stdlib only (constitution, ADR-0015: this is core).

File names (MJRP 2026-10-09): a requirement file is `<ID>-<slug>.md` -- the ID prefix of the stem is the node's
identity (node_id), the slug is the English title, lowercase ASCII kebab-case, at most `file_name.slug_max`
characters (node_slug). Links and embeds name the whole stem with the ID as display text
(`[[S-31-decide-how-data-reaches-the-screen|S-31]]`); a bare ID or an outdated slug pointing to a slugged file is
flagged (link_stem). A file with no slug has the ID as its whole stem, so `[[S-31]]` is the right link to it. Every
finding about a node starts with its ID, so --staged/--changed match them against the touched nodes.

contributes_to (ADR-0020 A.2): an outcome declares the outcome of ANOTHER roadmap it contributes to, in its section of
the ROADMAP (`contributes_to:: [[../../ROADMAP#^OUT-03]]`). The target is a path relative to the declaring file + `#^ID`,
never a bare ID, and is read only when it is the ROADMAP.md of a project with a contract in the same repository.
Three outcomes: resolved (passes); missing -- the block is not there, the target is the own roadmap, a bare ID, a
cycle -- an error (exit 1); unreachable -- outside the repository, not on disk, not a project's ROADMAP.md -- not
evaluable (exit 2 under --strict, "NÃO AVALIÁVEL", never green, never read).

Identity (ADR-0020 D.3): an ID is unique in the repository. A project nested in the repository of another one carries
the contract's `id_prefix` (CC) in outcome, epic and NFR IDs, and a node ID repeated in the root project is an error.

Design system (audit C F10, MJRP 2026-10-09): a Ready requirement that points to a screen state (info-arch.md)
needs docs/specs/design-system.md in the same project -- the visual identity is decided before the contract.

Tags (MJRP 2026-10-06): every outcome carries 1-3 category tags (`tags:: #a #b` in its ROADMAP section); every
epic inherits them and may add up to 3 of its own. Free vocabulary: format and count only. --tags lists them.

Warnings (UAT-290, 2026-10-24): the only rule that is not a finding. A line `aviso [uat_fixes_cited]` is printed and the exit
code ignores it: a Fix feature declares in `fixes:` the open issues whose Status cell cites it (the Delivery board reads
only `fixes:`, so an undeclared one lets F52 show «Aceito» with the work open). It warns first because it meets data
that was already there.

Evidence (S-67, MJRP 2026-10-04): a status is checked against reality, never trusted. In progress needs an open
feature or recent activity; Done needs a Done feature or `delivered_by:` with the commit; Accepted also needs
`accepted_in:` pointing to the human's acceptance; Ready is warned when its observable state changed afterwards.

Usage:
  python3 mjrp-scripts/requirements_graph_check.py [root] [--strict] [--summary] [--tags] [--rules path]
  python3 mjrp-scripts/requirements_graph_check.py [root] --staged          (pre-commit: exit 1 on a contradiction in a staged node)
  python3 mjrp-scripts/requirements_graph_check.py [root] --changed --gate  (Stop hook: exit 2 on a contradiction in an uncommitted node)
"""
import json
import re
import sys
import time
from datetime import timedelta
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _clock
import _git
from _fm import parse_with_body as frontmatter

# F71 R9: the deadline of every git call here, in seconds. A git stuck on a locked index (the file bridge leaves them behind)
# would hang the commit hook and the doctor forever; 60 s is far above any real answer of these read-only commands.
GIT_TIMEOUT = 60

HERE = Path(__file__).parent
# CC-ADR-0024 (accepted by the MJRP in commit 2fc3592d, 2026-10-19 23:36 Brasília): from that commit on, `status: Accepted` enters
# only through the commit of the human's acceptance, stamped `Human-accepted:`. What was Accepted before stays (as the uat@3
# TRACKS_SINCE). The cut is a place in the HISTORY -- a commit that is not an ancestor of ACCEPTANCE_CUT_SHA is judged -- and not
# a date, because the date of a commit is whatever GIT_COMMITTER_DATE says. A repository that does not have that commit (a child
# that reads the kernel in place) falls back to the date, and the output says so.
ACCEPTANCE_CUT_SHA = "2fc3592d0f1ad713b7a417844be5f9bf217b7a2e"
ACCEPTANCE_STAMPED_SINCE = "2026-10-19 23:36"
STAMP_ACCEPTED = re.compile(r"^Human-accepted:[ \t]*(\S+)[ \t]*$", re.I | re.M)
# CC-ADR-0028 (F56): an ADR born on the MJRP's route (`**Acceptance**: MJRP`, decision@3; or born with no route line and dated from
# adr_header_check.SHORT_SINCE on) becomes Accepted only in the commit of his acceptance, stamped `Human-accepted: adr:<ID>`. The
# route counts AS BORN (the version of the commit that added the file): moving it to `tech lead` afterwards is the valve bypassed.
from adr_header_check import SHORT_SINCE  # noqa: E402  (the date from which an ADR with no route line is the MJRP's)
ADR_TITLE = re.compile(r"^# (?:(?P<prefix>[A-Z][A-Z0-9]*)-)?ADR-(?P<number>\d{4}):", re.M)
from _contract import read_yaml, log_rel  # one YAML reader and log path for every sensor (F73 R7)

WIKILINK = re.compile(r"\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|[^\]]*)?\]\]")
# a spec's requirements and their evidence: one reader, shared with the Control Center's acceptance (F116, UAT-391)
from requirement_evidence import _WIDE_REQ_BODY, INLINE_FIELD, WIDE_REQ, spec_requirements  # noqa: E402
# the IDs a feature's spec.md defines for itself: REQ-01, REQ-F-05 and the NFR of the feature (NFR-F-02, a letter segment
# marks it as local -- NFR-08 is a node). prototype_inventory.py (W11) reads the same pattern.
SPEC_LOCAL_ID_IN_TEXT = re.compile(r"(?<![\w-])(?:" + _WIDE_REQ_BODY + r"|NFR-[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z][A-Za-z0-9]*)*-\d{2,})(?!\w)")
BLOCK_ANCHOR = re.compile(r"\s\^([A-Za-z0-9-]+)\s*$")
HEADING = re.compile(r"^(#{1,6})\s+(.*)$")
# uat.md (UAT-290): the cells of an issue row, and the feature a Status cell cites (`fixing (F52)`, `fixed (F52: <evidence>)`)
UAT_CELLS = re.compile(r"(?<!\\)\|")
UAT_STATUS_FEATURE = re.compile(r"^(?P<verb>fixing|fixed)\s*\(\s*(?P<f>F\d{2,})\b")
# the ID prefix of a requirement file stem: S-31 in S-31-decide-how-data-reaches-the-screen (MJRP, 2026-10-09)
_NODE_ID_BODY = r"(?:S|UC|EA|(?:[A-Z]{2,}-)?NFR)-\d{2,}"
NODE_ID = re.compile(r"^(" + _NODE_ID_BODY + r")(?=-|$)")
NODE_ID_IN_TEXT = re.compile(r"(?<![\w-])" + _NODE_ID_BODY + r"(?!\w)")   # a node cited in a cell or a sentence (S-12, [[S-12-slug|S-12]])


def feature_track(fm):
    """The name the `imports.nfr_tracks` rule compares: `Fix` / `Feature` from `solution_type:` when it says one, else the
    legacy `track:` as written (so a closed spec with `track: Fix` still pays debt)."""
    kind = str(fm.get("solution_type") or "").strip().casefold()
    if kind in ("feature", "fix"):
        return "Fix" if kind == "fix" else "Feature"
    return str(fm.get("track") or "").strip()


def node_id(stem):
    """The requirement ID a file stem names (`S-31-some-slug` -> `S-31`, `S-31` -> `S-31`); any other stem as is."""
    m = NODE_ID.match(stem)
    return m.group(1) if m else stem




def as_list(v):
    if v is None or v == "":
        return []
    return v if isinstance(v, list) else [v]


def link_targets(value):
    """Every [[file#anchor]] in a value -> list of (file, id). id = anchor without ^, or the node the file stem
    names (the ID prefix of a requirement stem: [[S-31-some-slug|S-31]] -> S-31)."""
    out = []
    for item in as_list(value):
        for f, a in WIKILINK.findall(str(item)):
            f = f.strip()
            a = (a or "").strip()
            out.append((f, a.lstrip("^") if a else node_id(Path(f).stem)))
    return out


def local_ids(value, pattern):
    return [m for item in as_list(value) for m in re.findall(pattern, str(item))]


def repo_top(path):
    """The directory of the nearest `.git` (a folder, or a file in a worktree) at or above `path`; None when there is none."""
    p = Path(path).resolve()
    for d in [p, *p.parents]:
        if (d / ".git").exists():
            return d
    return None


def violates_targets(body):
    """Every [[target]] of the `violates::` lines of a spec body, outside code fences -> [(file, id)]."""
    out, fenced = [], False
    for line in body.splitlines():
        if line.lstrip().startswith("```"):
            fenced = not fenced
            continue
        f = INLINE_FIELD.match(line)
        if f and not fenced and f.group(1) == "violates":
            out.extend(link_targets(f.group(2)))
    return out


def requirement_node_ids(root, live_only=False):
    """The IDs of the nodes (S-, UC-, EA-, NFR-) in the project's requirements folder, read with the graph's own loader and
    its single declaration. Empty when the project has no such folder. `live_only` leaves out the Cancelled nodes and the
    superseded ones: they are not coverage. Used by prototype_inventory.py (W11): an inventory row names the node it is
    covered by."""
    return requirement_graph_view(root)["live" if live_only else "nodes"]


def requirement_graph_view(root):
    """{"nodes": every node ID, "live": those that still count, "successor": {old ID: the ID that supersedes it}} of the
    project's requirements folder (empty when it has none)."""
    rules = json.loads((HERE / "requirements_graph_rules.json").read_text(encoding="utf-8"))
    g = Graph(root, rules)
    if g.p["requirements"].is_dir():
        g.load_requirements()
    successor = {}
    for nid, node in g.nodes.items():
        for _, old in node["edges"].get("supersedes", []):
            successor.setdefault(old, nid)
    return {"nodes": set(g.nodes), "live": {n for n in g.nodes if g.is_live(n)}, "successor": successor}


def contract_of(root):
    """The `mjrp_harness` block of the project contract at `root` ({} when absent or unreadable)."""
    f = Path(root) / ".mjrp-project.yml"
    if not f.exists():
        return {}
    try:
        data = read_yaml(f.read_text(encoding="utf-8")) or {}
        return data.get("mjrp_harness") or {}
    except Exception:
        return {}


class Graph:
    def __init__(self, root, rules, scope=None):
        self.root = Path(root)
        self.rules = rules
        # F78 (DP-17: the pass's context travels as a parameter with a default, never a global): the IDs a --staged/--changed pass
        # judges (touched_nodes); None = the whole graph (the daily pass, --summary, the doctor). Only the rule that costs git (the
        # acceptance stamp: ~99% of the old ~42 s) honours it; every other rule still runs on every node, and main() keeps its own
        # filter by the first token of the message, so the verdict of a scoped pass is the full pass's verdict, minus the cost.
        self.scope = None if scope is None else set(scope)
        self.p = {k: self.root / v for k, v in rules["paths"].items()}
        self.types = rules["node_types"]
        self.nodes = {}      # id -> {"type", "file", "status", "edges": {name: [targets]}}
        self.features = {}   # fid -> {"status", "imports", "reqs": {REQ: verified_by[]}, "tasks": {TASK: [REQ]}, "dir"}
        self.findings = []
        # ADR-0020 D.3: the contract's id_prefix (a nested project) makes outcome, epic and NFR IDs accept `<PREFIX>-`
        contract = contract_of(self.root)
        pfx = contract.get("id_prefix")
        self.prefix = str(pfx).strip() if pfx else None
        # ADR-0020 A.5: planned_for is optional unless the contract turns release_required on
        rr = (self.rules.get("release_required") or {})
        opt = (contract.get("requirements") or {}).get("release_required", rr.get("default", False))
        self.release_required = opt is True or str(opt).strip().lower() == "true"
        # ADR-0020 A.2: contributes_to targets that could not be read (outside the repository, not on disk, not a
        # project's ROADMAP.md) -- not evaluable: neither a finding nor green
        self.unreachable = []
        # brownfield acceptance by history (MJRP 2026-10-18): the nodes that took the legacy phrase, and why it could not be judged
        self.legacy_accepted = set()
        self.legacy_unevaluable = None
        # CC-ADR-0024: why the stamp of the human's acceptance could not be judged (no repository, a shallow clone): not evaluable, never green
        self.acceptance_unevaluable = None
        # CC-ADR-0029: why the OK of an issue (uat.md) is not judged yet (the ADR is not Accepted, or is not here); None: judged
        self.issue_ok_note = None
        # CC-ADR-0024: True when the stamp rule had to cut by DATE (the repository has no ACCEPTANCE_CUT_SHA): said in the output
        self.date_cut_used = False
        # a warning is printed and never fails the check (exit code, --staged and --changed ignore it): a rule that is new on data
        # that was already there (UAT-290) warns first
        self.warnings = []

    def find(self, rule, msg):
        self.findings.append((rule, msg))

    def warn(self, rule, msg):
        self.warnings.append((rule, msg))

    def tags_field(self):
        return (self.rules.get("tags") or {}).get("field", "tags")

    def id_pattern(self, name):
        """The ID pattern of a node type; the types the identity rule prefixes also accept this project's `<PREFIX>-`."""
        pat = self.types[name].get("id_pattern")
        if pat and self.prefix and name in (self.rules.get("identity") or {}).get("prefixed_types", []):
            pat = "^(?:" + re.escape(self.prefix) + "-)?" + pat.lstrip("^")
        return pat

    def type_of(self, nid):
        for name, t in self.types.items():
            pat = self.id_pattern(name)
            if pat and t.get("form") != "local_id" and re.match(pat, nid) and name != "observable_state":
                return name
        return None

    # ---- loading ---------------------------------------------------------------------------
    def load_anchors(self, key, wanted_types):
        path = self.p.get(key)
        if not path or not path.exists():
            return
        section, tags_in, anchors_in, edges_in = 0, {}, {}, {}
        # inline edges an outcome declares in its section (contributes_to, ADR-0020 A.2), read like the tags line
        outcome_edges = {e["name"] for e in self.rules["edges"]
                         if "outcome" in (e["from"] if isinstance(e["from"], list) else [e["from"]])}
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            if HEADING.match(line):
                section += 1
            f = INLINE_FIELD.match(BLOCK_ANCHOR.sub("", line))
            if f and f.group(1) == self.tags_field():
                tags_in.setdefault(section, []).extend(f.group(2).replace(",", " ").split())
            elif f and f.group(1) in outcome_edges and "outcome" in wanted_types:
                edges_in.setdefault(section, {}).setdefault(f.group(1), []).extend(link_targets(f.group(2)))
            m = BLOCK_ANCHOR.search(line)
            if not m:
                continue
            nid = m.group(1)
            anchors_in.setdefault(section, []).append(nid)
            t = self.type_of(nid)
            if key in ("info_arch", "behavior") and t is None:
                t = "observable_state"
            if t in wanted_types:
                edges = {}
                self.nodes[nid] = {"type": t, "file": path.name, "status": None, "edges": edges}
        # tags (MJRP, 2026-10-06): the `tags::` line of an outcome's section belongs to the outcome anchored in it
        for sec, tags in tags_in.items():
            outs = [a for a in anchors_in.get(sec, []) if (self.nodes.get(a) or {}).get("type") == "outcome"]
            if len(outs) == 1:
                self.nodes[outs[0]]["tags"] = tags
            elif len(outs) > 1:
                self.find("tags", f"{', '.join(outs)}: uma linha `tags::` numa seção com mais de um resultado — um resultado por seção")
        for sec, found in edges_in.items():
            outs = [a for a in anchors_in.get(sec, []) if (self.nodes.get(a) or {}).get("type") == "outcome"]
            names = "/".join(found)
            if len(outs) == 1:
                for name, targets in found.items():
                    self.nodes[outs[0]]["edges"].setdefault(name, []).extend(targets)
            elif len(outs) > 1:
                self.find("contributes_to", f"{', '.join(outs)}: uma linha `{names}::` numa seção com mais de um resultado — um resultado por seção")
            else:
                self.find("contributes_to", f"{path.name}: linha `{names}::` numa seção sem resultado ancorado (^OUT-NN) — a aresta pertence a um resultado")

    def load_inline_nodes(self, key, node_type):
        """Nodes that live inside a document: the heading names them, the paragraph below carries the inline
        edges and ends with the ^ID block anchor (Obsidian does not anchor headings)."""
        path = self.p.get(key)
        if not path or not path.exists():
            return
        pat = self.id_pattern(node_type).strip("^$")
        current = None
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            h = HEADING.match(line)
            if h:
                m = re.match(r"(" + pat + r")\b", h.group(2).strip())
                current = m.group(1) if m else None
                if current:
                    self.nodes.setdefault(current, {"type": node_type, "file": path.name, "status": None,
                                                    "edges": {}, "anchored": False})
                continue
            if not current:
                continue
            f = INLINE_FIELD.match(BLOCK_ANCHOR.sub("", line))
            if f and f.group(1) == "folder":
                self.nodes[current]["folder"] = f.group(2).strip().strip("`").strip("/")
            elif f and f.group(1) == self.tags_field():
                self.nodes[current].setdefault("tags", []).extend(f.group(2).replace(",", " ").split())
            elif f:
                self.nodes[current]["edges"].setdefault(f.group(1), []).extend(link_targets(f.group(2)))
            a = BLOCK_ANCHOR.search(line)
            if a and a.group(1) == current:
                self.nodes[current]["anchored"] = True

    def check_file_name(self, f, nid, fm):
        """MJRP, 2026-10-09: <ID>-<slug>.md -- the slug is lowercase ASCII kebab-case, at most slug_max characters."""
        spec = self.rules.get("file_name") or {}
        if not spec:
            return
        m = re.match(spec.get("pattern", r"^(?P<id>[A-Z]+-\d+)(?:-(?P<slug>[a-z0-9-]+))?$"), f.stem)
        if not m:
            self.find("node_slug", f"{nid}: nome '{f.name}' fora do padrão <ID>-<slug>.md — o slug é o título em inglês, "
                                   "minúsculo, ASCII, palavras separadas por hífen")
            return
        slug = m.group("slug") or ""
        mx = spec.get("slug_max")
        if mx and len(slug) > mx:
            self.find("node_slug", f"{nid}: slug com {len(slug)} caracteres, o máximo é {mx} — encurte mantendo o sentido "
                                   f"(req_file_names.py --reslug {nid})")
        if spec.get("slug_required") and not slug:
            self.find("node_slug", f"{nid}: arquivo sem slug — o nome é <ID>-<slug>.md (req_file_names.py)")
        if spec.get("alias_required") and nid not in [str(a).strip() for a in as_list(fm.get("aliases"))]:
            self.find("node_slug", f"{nid}: frontmatter sem `aliases: [{nid}]`")

    def load_requirements(self):
        d = self.p["requirements"]
        for f in sorted(d.rglob("*.md")):
            if f.name.lower() in ("readme.md", "folder-index.md", "index.md"):
                continue
            raw = f.read_text(encoding="utf-8", errors="replace")
            fm, body = frontmatter(raw)
            # MJRP, 2026-10-09: the file is <ID>-<slug>.md -- the node is the ID prefix; every message starts with it
            # (the --staged/--changed filter matches the first token against the touched nodes)
            nid = node_id(f.stem)
            # S-110 (MJRP, 2026-10-05): every node in each declared language, as a `## <lang>` section of the same file
            for lang in self.languages():
                sec = re.search(r"^## " + re.escape(lang) + r"\s*\n(.*?)(?=^## |\Z)", body or "", re.M | re.S)
                if not sec or not sec.group(1).strip():
                    self.find("bilingual", f"{nid}: sem a seção `## {lang}` (ou vazia) em {f.name} — o nó vem nas línguas {', '.join(self.languages())}")
            t = self.type_of(nid)
            if t not in ("requirement", "nfr"):
                self.find("node_id", f"{nid}: o nome do arquivo ({f.name}) não começa por um ID de requisito (S-, UC-, EA-, NFR-)")
                continue
            if fm.get("id") and str(fm.get("id")) != nid:
                self.find("node_id", f"{nid}: frontmatter id '{fm.get('id')}' difere do ID do nome do arquivo ({f.name})")
            self.check_file_name(f, nid, fm)
            status = fm.get("status")
            valid = self.rules["statuses"] + self.rules.get("off_track_statuses", [])
            if status not in valid:
                self.find("status", f"{nid}: status '{status}' fora da lista {valid}")
            edges = {}
            for e in self.rules["edges"]:
                if e["name"] in fm:
                    edges[e["name"]] = link_targets(fm[e["name"]])
            if nid in self.nodes and self.nodes[nid].get("path"):
                self.find("node_id", f"{nid}: dois arquivos com o mesmo ID ({self.nodes[nid]['path'].relative_to(d)}, {f.relative_to(d)})")
            self.nodes[nid] = {"type": t, "file": f.name, "path": f, "stem": f.stem, "status": status, "edges": edges,
                               "delivered_by": [str(x).strip().strip("`") for x in as_list(fm.get("delivered_by"))],
                               "accepted_in": str(fm.get("accepted_in") or "").strip()}

    def load_features(self):
        d = self.p["features"]
        if not d.exists():
            return
        fpat = self.types["feature"]["folder_pattern"]
        for fd in sorted(x for x in d.iterdir() if x.is_dir()):
            if not re.match(fpat, fd.name):
                self.find("node_id", f"features/{fd.name}: pasta fora do padrão Fxx-slug")
                continue
            fid = fd.name[:3]
            spec = fd / "spec.md"
            tasks = fd / "tasks.md"
            fm, body = frontmatter(spec.read_text(encoding="utf-8")) if spec.exists() else ({}, "")
            feat = {"dir": fd.name, "status": fm.get("status"), "imports": link_targets(fm.get("imports")),
                    # `solution_type:` (`feature | fix`) wins; the legacy `track:` of the closed specs still reads (F64 TASK-02d)
                    "track": feature_track(fm),
                    "solution_type": str(fm.get("solution_type") or "").strip().casefold(),
                    "accepted_in": str(fm.get("accepted_in") or "").strip(),
                    "fixes": [str(x).strip() for x in as_list(fm.get("fixes")) if str(x).strip()],
                    # F67: the PDLC lane (`standard` | `fast`); the fast lane moves `points_to` to `enforced_from_fast_lane`
                    "lane": str(fm.get("lane") or "standard").strip().casefold(),
                    # what the feature pays: `violates:: [[NFR-xx]]` or, for a constitution article (not a graph node),
                    # `violates:: [[constitution#N]]`. A line inside a code fence is an example, not a declaration.
                    "violates": violates_targets(body),
                    "reqs": {}, "tasks": {}}
            for f in ("spec.md", "plan.md", "tasks.md"):
                if not (fd / f).exists():
                    self.find("feature_files", f"{fd.name}: falta {f}")
            # the requirements and their `verified_by::`, read by the one reader the Control Center also loads before an acceptance
            # (F116): a REQ with a project-style ID (REQ-F-05) is invisible to the strict pattern; the Done rule still has to see it
            # (pedroso-incorp, 2026-10-18: six Done features, REQ without verified_by, green)
            feat["reqs"], feat["wide_reqs"] = spec_requirements(body)
            if tasks.exists():
                cur = None
                fenced = False
                for n, line in enumerate(tasks.read_text(encoding="utf-8").splitlines(), 1):
                    if line.lstrip().startswith("```"):
                        fenced = not fenced
                    # ANY unchecked box counts, whatever the task ID looks like (T-230, TASK-F-01, none): the Done rule
                    # must not depend on the project having used `TASK-nn`
                    box_open = re.match(r"^\s*[-*]\s+\[ \]", line)
                    if box_open and not fenced:
                        ident = re.search(r"\b(TASK-[A-Z0-9-]*\d+|T-\d+)\b", line)
                        feat.setdefault("open_boxes", []).append(ident.group(1) if ident else f"linha {n}")
                    m = re.match(r"^(?:#{2,6}\s+|[-*]\s+(?:\[[ xX]\]\s+)?(?:\*\*)?\[?)(TASK-\d{2,})\b", line)
                    if m:
                        cur = m.group(1)
                        feat["tasks"].setdefault(cur, [])
                        box = re.match(r"^[-*]\s+\[([ xX])\]", line)
                        if box and box.group(1) == " ":
                            feat.setdefault("open_tasks", []).append(cur)
                    m = re.search(r"implements::\s*(.+)$", line)
                    if cur and m:
                        feat["tasks"][cur].extend(local_ids(m.group(1), r"REQ-\d{2,}"))
            self.features[fid] = feat

    def load(self):
        self.load_anchors("roadmap", {"outcome", "release"})
        self.load_anchors("info_arch", {"observable_state"})
        self.load_anchors("behavior", {"observable_state"})
        self.load_inline_nodes("prd", "epic")
        self.load_requirements()
        self.load_features()

    # ---- checks ----------------------------------------------------------------------------
    def status_rank(self, s):
        """Position in the lifecycle; -1 for an off-track status (Deferred) or an unknown one -- never enforced."""
        st = self.rules["statuses"]
        return st.index(s) if s in st else -1

    def enforced(self, edge, status):
        frm = edge.get("enforced_from", "always")
        return frm == "always" or (status is not None and self.status_rank(status) >= self.status_rank(frm))

    def nested_anchor(self, f, tid):
        """A link with a path (`apps/control-center/docs/specs/info-arch#^x`) points into a nested project's own
        document: resolve the anchor there. Returns an observable_state node or None."""
        if "/" not in f:
            return None
        doc = self.root / (f if f.endswith(".md") else f + ".md")
        if not doc.exists():
            return None
        for line in doc.read_text(encoding="utf-8", errors="replace").splitlines():
            m = BLOCK_ANCHOR.search(line)
            if m and m.group(1) == tid:
                return {"type": "observable_state", "file": f, "status": None, "edges": {}}
        return None

    def check_target(self, src, edge, target):
        f, tid = target
        node = self.nested_anchor(f, tid) or self.nodes.get(tid)
        allowed = edge["to"] if isinstance(edge["to"], list) else [edge["to"]]
        if node is None:
            self.find("target_exists", f"{src} —{edge['name']}→ [[{f}{'#^' + tid if f and tid != node_id(Path(f).stem) else ''}]]: alvo não existe")
        elif node["type"] not in allowed:
            self.find("edge_type", f"{src} —{edge['name']}→ {tid}: alvo é {node['type']}, a aresta pede {'/'.join(allowed)}")

    # ---- contributes_to (ADR-0020 A.2) ---------------------------------------------------------------------
    def foreign_outcomes(self, project_root):
        """The outcomes (with their own contributes_to) of the ROADMAP.md of another project, loaded once."""
        cache = self.__dict__.setdefault("_foreign", {})
        key = str(project_root)
        if key not in cache:
            g = Graph(project_root, self.rules)
            g.load_anchors("roadmap", {"outcome", "release"})
            cache[key] = g
        return cache[key]

    def resolve_contributes_to(self, g, target):
        """Where does a contributes_to target of Graph `g` land? Returns (state, detail):
        ("ok", (project Graph, outcome ID)) | ("missing", reason) | ("type", reason) | ("unreachable", reason).
        Only the ROADMAP.md of a project with a contract, in the same repository, is ever opened."""
        f, tid = target
        if not f or "/" not in f or tid == Path(f).stem:       # no path, or no #^ID (link_targets then names the file)
            return "missing", ("o alvo é um ID nu, sem caminho — escreva o caminho relativo ao arquivo que declara + #^ID "
                               "([[../../ROADMAP#^OUT-03]]); um ID nu casaria só no grafo local")
        roadmap = g.p["roadmap"]
        tpath = (roadmap.parent / (f if f.endswith(".md") else f + ".md")).resolve()
        top = repo_top(g.root)
        if top is None or not tpath.is_relative_to(top) or repo_top(tpath.parent) != top:
            return "unreachable", "o caminho sai do repositório (ou este repositório não é um clone git) — o alvo não é lido"
        if tpath == roadmap.resolve():
            return "missing", "o alvo é o próprio roadmap — contribuir é para o resultado de OUTRO roadmap"
        if tpath.name != Path(g.rules["paths"]["roadmap"]).name:
            return "unreachable", f"{tpath.name} não é o ROADMAP.md de um projeto — o alvo não é lido"
        if not tpath.is_file():
            return "unreachable", "o arquivo não está no disco (ponte, nuvem ou projeto ausente)"
        if not (tpath.parent / ".mjrp-project.yml").is_file():
            return "unreachable", f"{tpath.parent.name}/ não tem contrato (.mjrp-project.yml) — não é um projeto do harness, o alvo não é lido"
        fg = self.foreign_outcomes(tpath.parent)
        node = fg.nodes.get(tid)
        if node is None:
            return "missing", f"o bloco ^{tid} não existe em {tpath.relative_to(top)}"
        if node["type"] != "outcome":
            return "type", f"o alvo é {node['type']}, a aresta pede outcome"
        return "ok", (fg, tid)

    def check_contributes_to(self, nid, edge, targets):
        for t in targets:
            shown = f"[[{t[0]}#^{t[1]}]]" if t[0] else f"[[#^{t[1]}]]"
            state, detail = self.resolve_contributes_to(self, t)
            if state == "unreachable":
                self.unreachable.append(f"{nid} —contributes_to→ {shown}: {detail}")
                continue
            if state == "missing":
                rule = "target_exists" if detail.startswith("o bloco ") else "contributes_to"
                self.find(rule, f"{nid} —contributes_to→ {shown}: {detail}")
                continue
            if state == "type":
                self.find("edge_type", f"{nid} —contributes_to→ {shown}: {detail}")
                continue
            # ok: follow the chain; coming back to a node already seen is a cycle (the chain has 0..1 edge per node)
            seen = {(self.p["roadmap"].resolve(), nid)}
            fg, tid = detail
            while True:
                key = (fg.p["roadmap"].resolve(), tid)
                if key in seen:
                    self.find("contributes_to", f"{nid} —contributes_to→ {shown}: ciclo — a cadeia volta a "
                                                f"{key[0].parent.name}/{key[1]}")
                    break
                seen.add(key)
                nxt = fg.nodes[tid]["edges"].get("contributes_to") or []
                if not nxt:
                    break
                s2, d2 = self.resolve_contributes_to(fg, nxt[0])
                if s2 != "ok":
                    break          # a broken link further up is that roadmap's own finding
                fg, tid = d2

    # ---- identity (ADR-0020 D.3) ----------------------------------------------------------------------------
    def check_id_unique(self):
        """A node ID of a project nested in a repository is not repeated in the root project of that repository."""
        top = repo_top(self.root)
        if top is None or top == self.root.resolve() or not (top / ".mjrp-project.yml").is_file():
            return
        unique = set((self.rules.get("identity") or {}).get("unique_types", []))
        root_graph = Graph(top, self.rules)
        root_graph.load()
        root_ids = {n for n, v in root_graph.nodes.items() if v["type"] in unique}
        for nid, node in self.nodes.items():
            if node["type"] in unique and nid in root_ids:
                pfx = f" — o projeto aninhado leva o prefixo do contrato (`id_prefix: {self.prefix}`)" if self.prefix else \
                      " — o projeto aninhado declara `id_prefix` no contrato e o leva nos IDs de resultado, épico e NFR"
                self.find("id_unique", f"{nid}: ID repetido no repositório, já existe no projeto da raiz do repositório{pfx}")

    def epic_release(self, node):
        epic = (node["edges"].get("epic") or [(None, None)])[0][1]
        return (self.nodes.get(epic) or {}).get("edges", {}).get("planned_for", [])

    def fast_lane_only(self):
        """F67 (MJRP, 2026-10-26 11:30): the requirements imported only by fast-lane features (at least one)."""
        lanes = {}
        for ft in self.features.values():
            for _, rid in ft["imports"]:
                lanes.setdefault(rid, set()).add(ft.get("lane", "standard"))
        return {rid for rid, ls in lanes.items() if ls == {"fast"}}

    def check_node_edges(self):
        rr_from = (self.rules.get("release_required") or {}).get("from", "Prioritized")
        fast_only = self.fast_lane_only()
        for nid, node in self.nodes.items():
            for edge in self.rules["edges"]:
                srcs = edge["from"] if isinstance(edge["from"], list) else [edge["from"]]
                if node["type"] not in srcs:
                    continue
                shortcut = False
                if edge.get("enforced_from_fast_lane") and nid in fast_only:
                    edge = dict(edge, enforced_from=edge["enforced_from_fast_lane"])
                if self.release_required and edge["name"] == "planned_for" and node["type"] == "requirement":
                    edge = dict(edge, min=1, enforced_from=rr_from)    # ADR-0020 A.5; the epic's own release satisfies it
                    shortcut = True
                targets = node["edges"].get(edge["name"], [])
                if shortcut and not targets:
                    targets = self.epic_release(node)
                if edge.get("to") == "acceptance":
                    # S-79: an acceptance is an anchor of uat.md or a log entry, not a node -- resolved by
                    # acceptance_resolves (the uat.md anchors were reported as missing targets before)
                    raw = node.get("accepted_in", "")
                    if raw and not self.acceptance_resolves(raw, node):
                        self.find("target_exists", f"{nid} —accepted_in→ {raw}: aceite não encontrado (âncora do uat.md, entrada do log, "
                                  "ou \"histórico anterior ao harness\" com entrega anterior ao contrato)")
                    continue
                if edge["name"] == "contributes_to":
                    self.check_contributes_to(nid, edge, targets)       # never falls back to the local graph
                else:
                    for t in targets:
                        self.check_target(nid, edge, t)
                if not self.enforced(edge, node["status"]):
                    continue
                if len(targets) < edge["min"]:
                    self.find(f"edge_{edge['name']}", f"{nid}: precisa de pelo menos {edge['min']} aresta '{edge['name']}'"
                              + (f" (cobrada a partir de {edge['enforced_from']})" if edge.get("enforced_from") != "always" else "")
                              + (" — na própria story ou no épico dela (release_required)" if shortcut else ""))
                if edge.get("max") is not None and len(targets) > edge["max"]:
                    self.find(f"edge_{edge['name']}", f"{nid}: no máximo {edge['max']} aresta '{edge['name']}', tem {len(targets)}")
            if node["type"] == "epic" and not node.get("anchored", True):
                self.find("anchor", f"{nid}: o parágrafo abaixo do heading não termina com ^{nid}")

    def effective_tags(self, nid):
        """An outcome's own tags; an epic's own tags plus those of the outcome it serves (MJRP, 2026-10-06)."""
        node = self.nodes.get(nid) or {}
        tags = list(node.get("tags", []))
        if node.get("type") == "epic" and (self.rules.get("tags") or {}).get("epic_inherits", True):
            for _, out in node["edges"].get("serves", []):
                tags += [t for t in (self.nodes.get(out) or {}).get("tags", []) if t not in tags]
        return tags

    def check_tags(self):
        """MJRP, 2026-10-06: every outcome carries 1-3 category tags; every epic inherits them and may add up to 3
        of its own. Free vocabulary -- only the format and the count are checked."""
        spec = self.rules.get("tags")
        if not spec:
            return
        pat = re.compile(spec.get("pattern", r"^#[a-z0-9]+(-[a-z0-9]+)*$"))
        limits = {"outcome": spec.get("outcome", {}), "epic": spec.get("epic_own", {})}
        for nid, node in self.nodes.items():
            if node["type"] not in limits:
                continue
            own, lim = node.get("tags", []), limits[node["type"]]
            for t in own:
                if not pat.match(t):
                    self.find("tags", f"{nid}: tag '{t}' fora do formato (#kebab-case em inglês, ex.: #visual-management)")
            if len(set(own)) != len(own):
                self.find("tags", f"{nid}: tag repetida em `{spec.get('field', 'tags')}::`")
            if len(own) < lim.get("min", 0):
                self.find("tags", f"{nid}: resultado sem tag — declare de {lim.get('min', 1)} a {lim.get('max', 3)} em `{spec.get('field', 'tags')}:: #tag` na seção dele no ROADMAP")
            if lim.get("max") is not None and len(own) > lim["max"]:
                what = "tags próprias" if node["type"] == "epic" else "tags"
                self.find("tags", f"{nid}: {len(own)} {what}, o máximo é {lim['max']}")

    def release_of(self, rid):
        node = self.nodes.get(rid) or {}
        own = node.get("edges", {}).get("planned_for", [])
        if own:
            return own[0][1]
        epic = (node.get("edges", {}).get("epic") or [(None, None)])[0][1]
        via = (self.nodes.get(epic) or {}).get("edges", {}).get("planned_for", [])
        return via[0][1] if via else None

    def is_live(self, nid):
        """A node that still counts: not Cancelled and not the target of another node's `supersedes`."""
        node = self.nodes.get(nid)
        if not node or node["status"] == "Cancelled":
            return False
        return not any(nid == t[1] for other in self.nodes.values() for t in other["edges"].get("supersedes", []))

    def constitution_article_exists(self, anchor):
        """`[[constitution#N]]` names an article: a heading that is, or starts with, the anchor ("5", "5. Layers",
        "Article 5") or a block anchor `^N`. No constitution file, or no such article: False."""
        doc = self.root / "docs" / "specs" / "constitution.md"
        anchor = anchor.strip().lstrip("^")
        if not anchor or not doc.is_file():
            return False
        a = re.escape(anchor)
        for line in doc.read_text(encoding="utf-8", errors="replace").splitlines():
            h = HEADING.match(line)
            if h and re.match(rf"(?i)(?:(?:art(?:icle|igo|\.)?)\s*)?{a}(?:\s*$|[.):\s—–-])", h.group(2).strip()):
                return True
            if re.search(rf"\s\^{a}\s*$", line):
                return True
        return False

    def check_features(self):
        imp_edge = next(e for e in self.rules["edges"] if e["name"] == "imports")
        ver_edge = next(e for e in self.rules["edges"] if e["name"] == "verified_by")
        open_st = set(self.rules["open_feature_statuses"])
        open_by_req = {}
        for fid, ft in self.features.items():
            # fin-control, 2026-10-18 (S-66): an engineering feature (a refactor planned by an ADR, infrastructure) has no
            # product requirement, and a story invented for it is a forced node. The rule it serves is an NFR, so a
            # feature of the tracks the contract lists (`imports.nfr_tracks`: Fix, the item that pays a `violates::`)
            # imports the NFR -- or names the constitution article it violates -- and needs no story.
            pays_debt = ft.get("track", "").casefold() in {t.casefold() for t in imp_edge.get("nfr_tracks", [])}
            violated = {t[1] for t in ft.get("violates", [])}
            articles = [t for t in ft.get("violates", []) if Path(t[0]).stem.lower() == "constitution"]
            real_articles = [t for t in articles if self.constitution_article_exists(t[1])]
            by_article = pays_debt and bool(real_articles) and bool(ft.get("fixes"))
            # PDLC v12 (F64; F94): a fix (`solution_type: fix`) imports no story -- its requirement is the issue it fixes (`fixes:`)
            by_issue = ft.get("solution_type") == "fix" and bool(ft.get("fixes"))
            if pays_debt:
                # the exception is the debt it pays, not the track alone: a Fix feature that names no `fixes:` has no card
                # release (product-structure: feature_fix_no_fixes), and an NFR import with no `violates::` is a story-less
                # feature with nothing to say what it serves
                if real_articles and not ft.get("fixes"):
                    self.find("fix_nfr_import", f"{ft['dir']}: paga a violação de um artigo da constitution sem `fixes: [UAT-xx]` (a issue de dívida; sem ela o card não tem release)")
                for t in articles:
                    if t not in real_articles:
                        self.find("fix_nfr_import", f"{ft['dir']}: `violates:: [[constitution#{t[1]}]]` — o artigo não existe em docs/specs/constitution.md")
            if len(ft["imports"]) < imp_edge["min"] and not by_article and not by_issue:
                self.find("feature_has_requirement", f"{ft['dir']}: não importa nenhum requisito"
                          + ("" if pays_debt else " (uma feature de engenharia da trilha Fix importa o NFR que serve)"))
            nfr_edge = {**imp_edge, "to": [imp_edge["to"], "nfr"]} if pays_debt else imp_edge
            for t in ft["imports"]:
                self.check_target(ft["dir"], nfr_edge, t)
                node = self.nodes.get(t[1])
                is_nfr = bool(node) and node["type"] == "nfr"
                if is_nfr and not pays_debt:
                    self.find("nfr_not_imported", f"{ft['dir']}: importa {t[1]}, um NFR — NFR é restrição de todas as features, não se importa "
                                                  "(só a feature da trilha Fix que paga uma violação dele o importa)")
                elif is_nfr:
                    why = []
                    if not ft.get("fixes"):
                        why.append("sem `fixes: [UAT-xx]` (a issue de dívida que ela paga; sem ela o card não tem release)")
                    if t[1] not in violated:
                        why.append(f"sem `violates:: [[{t[1]}]]` na spec (fora de bloco de código) que diga qual violação ela paga")
                    if not self.is_live(t[1]):
                        why.append(f"{t[1]} está {node['status']} ou foi substituído: não é regra viva")
                    if why:
                        self.find("fix_nfr_import", f"{ft['dir']}: importa o NFR {t[1]} " + "; ".join(why))
                if ft["status"] in open_st and not is_nfr:       # an NFR constrains many features: several may be open on it
                    open_by_req.setdefault(t[1], []).append(ft["dir"])
            implemented = {r for reqs in ft["tasks"].values() for r in reqs}
            for task, reqs in ft["tasks"].items():
                if not reqs:
                    self.find("edge_implements", f"{ft['dir']}/{task}: não implementa nenhum REQ")
                for r in reqs:
                    if r not in ft["reqs"]:
                        self.find("target_exists", f"{ft['dir']}/{task} —implements→ {r}: o REQ não existe no spec.md da feature")
            for req, ver in ft["reqs"].items():
                if req not in implemented:
                    self.find("spec_req_implemented", f"{ft['dir']}/{req}: nenhuma TASK o implementa")
                if self.enforced(ver_edge, ft["status"]) and len(ver) < ver_edge["min"]:
                    self.find("edge_verified_by", f"{ft['dir']}/{req}: feature {ft['status']} sem verified_by")
            rels = {self.release_of(t[1]) for t in ft["imports"]} - {None}
            if len(rels) > 1:
                self.find("feature_single_release", f"{ft['dir']}: importa requisitos de releases diferentes ({', '.join(sorted(rels))})")
        for rid, dirs in open_by_req.items():
            if len(dirs) > 1:
                self.find("one_open_feature", f"{rid}: importado por mais de uma feature aberta ({', '.join(dirs)}) — fatie o requisito")

    # ---- evidence: the status is checked against reality, not trusted (S-67, MJRP 2026-10-04) --------------
    def git(self, *args):
        code, out = _git.run_tuple(self.root, *args, timeout=GIT_TIMEOUT)
        return code, out.strip()

    def last_commit_ts(self, path):
        # --follow + no pure renames: moving a node into its epic's folder (S-123) is not activity on it
        follow = ["--follow", "--diff-filter=AMC"] if Path(path).is_file() else []
        code, out = self.git("log", "-1", *follow, "--format=%ct", "--", str(Path(path).relative_to(self.root)))
        return int(out) if code == 0 and out.isdigit() else None

    def state_line_changed(self, doc, tid, node_path):
        """The state's own line (the one ending with ^tid) differs between the node's last commit and now.
        A Ready criterion ages when ITS state changes, not when another state of the same file does
        (MJRP, 2026-10-10: one new tab in info-arch.md flagged every Ready node)."""
        rel = str(Path(node_path).relative_to(self.root))
        follow = ["--follow", "--diff-filter=AMC"] if Path(node_path).is_file() else []
        code, sha = self.git("log", "-1", *follow, "--format=%H", "--", rel)
        if code != 0 or not sha:
            return True
        code, old = self.git("show", f"{sha}:./{Path(doc).relative_to(self.root).as_posix()}")   # ./ = relative to cwd (a nested project)
        if code != 0:
            return True
        pick = lambda text: next((l.rstrip() for l in text.splitlines() if l.rstrip().endswith("^" + tid)), None)
        before, now = pick(old), pick(Path(doc).read_text(encoding="utf-8", errors="replace"))
        return before is None or before != now

    SHA = re.compile(r"^[0-9a-f]{7,40}$")

    def commit_exists(self, sha):
        """Does the commit exist? One `git cat-file --batch-check` answers every `delivered_by` of the graph at the first
        question (2026-10-13: ~200 `git cat-file -e` processes were 1.7 s of the 1.8 s of the pre-commit hook and broke the
        commit budget, ADR-0004 #7); a hash the batch did not see falls back to the single question. Same answer, fewer forks."""
        if not self.SHA.match(sha):
            return False
        cache = self.__dict__.setdefault("_commits", {})
        if not cache:
            self.prefetch_commits(cache)
        if sha not in cache:
            cache[sha] = self.git("cat-file", "-e", sha + "^{commit}")[0] == 0
        return cache[sha]

    def prefetch_commits(self, cache):
        shas = sorted({s for n in self.nodes.values() if n["type"] == "requirement" for s in n["delivered_by"] if self.SHA.match(s)})
        if not shas:
            return
        try:
            r = _git.run(self.root, "cat-file", "--batch-check", input="".join(f"{s}^{{commit}}\n" for s in shas), timeout=GIT_TIMEOUT)
        except _git.GitError:
            return
        lines = r.out.splitlines()
        if r.code != 0 or len(lines) != len(shas):
            return                                   # no repository, or an unexpected shape: ask one by one
        for sha, line in zip(shas, lines):
            cache[sha] = not line.endswith((" missing", " ambiguous"))

    def languages(self):
        """Languages every node is written in (rules `languages`; the contract's
        mjrp_harness.requirements.languages overrides; [] turns the rule off)."""
        if getattr(self, "_langs", None) is not None:
            return self._langs
        langs = self.rules.get("languages", [])
        contract = self.root / ".mjrp-project.yml"
        if contract.exists():
            try:
                data = read_yaml(contract.read_text(encoding="utf-8")) or {}
                req = ((data.get("mjrp_harness") or {}).get("requirements") or {})
                if "languages" in req:
                    langs = req.get("languages") or []
            except Exception:
                pass
        self._langs = list(langs)
        return self._langs

    def stale_days(self):
        days = (self.rules.get("defaults") or {}).get("stale_days", 14)
        contract = self.root / ".mjrp-project.yml"
        if contract.exists():
            try:
                data = read_yaml(contract.read_text(encoding="utf-8")) or {}
                days = int(((data.get("mjrp_harness") or {}).get("requirements") or {}).get("stale_days", days))
            except Exception:
                pass
        return days

    def log_entries(self):
        """(timestamp 'YYYY-MM-DD HH:MM', text) of every entry of the project log."""
        if not hasattr(self, "_log"):
            try:
                text = (self.root / log_rel(self.root)).read_text(encoding="utf-8", errors="replace")
            except OSError:
                text = ""
            parts = re.split(r"(?m)^(?=## \[)", text)
            self._log = [(m.group(1), p) for p in parts for m in [re.match(r"## \[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\]", p)] if m]
        return self._log

    def now_local(self):
        return _clock.now_naive()

    def recent_activity(self, nid, node, importers):
        limit = self.stale_days()
        ts = [self.last_commit_ts(node["path"])] + [self.last_commit_ts(self.p["features"] / ft["dir"]) for ft in importers]
        ts = [t for t in ts if t]
        if ts and (time.time() - max(ts)) <= limit * 86400:
            return True
        since = (self.now_local() - timedelta(days=limit)).strftime("%Y-%m-%d %H:%M")
        return any(stamp >= since and re.search(r"\b" + re.escape(nid) + r"\b", text) for stamp, text in self.log_entries())

    # Brownfield rule (MJRP, 2026-10-18): work closed BEFORE the harness is closed and accepted. Its `accepted_in` is this
    # phrase (then " — regra do MJRP de 2026-10-18"), not a uat.md anchor or a log entry: no human acceptance exists to point at.
    LEGACY_ACCEPTANCE = "histórico anterior ao harness"

    def harness_start(self):
        """(timestamp, state) of when the harness began in this project: the commit that first added `.mjrp-project.yml` (the contract
        is the first thing a bootstrap or a conform writes, and git keeps its date; a folder date or a `created:` field can be
        rewritten). Rename detection is on (`--follow`, `--diff-filter=AR`). The state is "ok"; "nogit" (the folder is not a git
        repository: the legacy phrase can only be taken as written, and the output says so); or "unknown" (it IS a repository but no
        add of the contract is visible - a rename the log cannot follow, a subtree, a shallow clone: NOT evaluable, never a pass)."""
        if "_harness_start" not in self.__dict__:
            code, inside = self.git("rev-parse", "--is-inside-work-tree")
            if code != 0 or inside != "true":
                self._harness_start = (None, "nogit")
            else:
                code, out = self.git("log", "--follow", "--diff-filter=AR", "--format=%ct", "--", ".mjrp-project.yml")
                stamps = [int(x) for x in out.split() if x.isdigit()] if code == 0 else []
                self._harness_start = (min(stamps), "ok") if stamps else (None, "unknown")
        return self._harness_start

    def legacy_acceptance_holds(self, node):
        """The legacy phrase holds only for work that really predates the harness: at least ONE `delivered_by` commit exists AND none is
        newer than the contract's first commit. A node with no `delivered_by` (or only unknown commits) does not hold: without a commit
        there is nothing that dates the work, and the phrase would let an agent accept post-harness work itself (judge's P0, 2026-10-19)."""
        start, state = self.harness_start()
        if state == "nogit":
            self.legacy_accepted.add(node["stem"] if node else "?")
            return True
        if state == "unknown":
            self.legacy_unevaluable = "o repositório não mostra o commit que criou o `.mjrp-project.yml` (renomeado, subtree ou clone raso)"
            return True            # not red node by node: the verdict is 'não avaliável', reported once
        known = [sha for sha in (node["delivered_by"] if node else []) if self.commit_exists(sha)]
        if not known:
            return False
        for sha in known:
            code, out = self.git("show", "-s", "--format=%ct", sha + "^{commit}")
            if code != 0 or not out.isdigit() or int(out) > start:
                return False
        self.legacy_accepted.add(node["stem"])
        return True

    def acceptance_resolves(self, ref, node=None):
        if ref.strip().lower().startswith(self.LEGACY_ACCEPTANCE):
            return self.legacy_acceptance_holds(node)
        m = re.search(r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2})", ref)
        if m:
            return any(stamp == m.group(1) for stamp, _ in self.log_entries())
        for f, tid in link_targets(ref):
            uat = self.p.get("uat")
            if uat and uat.exists() and Path(f).stem == uat.stem:
                return any(BLOCK_ANCHOR.search(l) and BLOCK_ANCHOR.search(l).group(1) == tid
                           for l in uat.read_text(encoding="utf-8").splitlines())
        return False

    def state_doc(self, f):
        if "/" in f:
            return self.root / (f if f.endswith(".md") else f + ".md")
        for key in ("behavior", "info_arch"):
            if self.p.get(key) and self.p[key].stem == Path(f).stem:
                return self.p[key]
        return None

    def shown_states(self, doc):
        """Block IDs listed in `shows::` lines of a screen-state doc -- the states an approved prototype shows."""
        shown = set()
        if not doc or not doc.exists():
            return shown
        for line in doc.read_text(encoding="utf-8", errors="replace").splitlines():
            f = INLINE_FIELD.match(line)
            if f and f.group(1) == "shows":
                shown.update(tid for _, tid in link_targets(f.group(2)))
        return shown

    def check_evidence(self):
        closed = {"Done", "Accepted"}
        open_st = set(self.rules["open_feature_statuses"])
        importers_of = {}
        for ft in self.features.values():
            for _, rid in ft["imports"]:
                importers_of.setdefault(rid, []).append(ft)
            if ft["status"] in closed:
                # one rule for "Done is complete": no open box in tasks.md, every REQ with verified_by (audit of
                # pedroso-incorp, 2026-10-18, point 2). The strict REQ-nn without verified_by is edge_verified_by.
                if ft.get("open_boxes"):
                    shown = ", ".join(ft["open_boxes"][:6]) + (f" e mais {len(ft['open_boxes']) - 6}" if len(ft["open_boxes"]) > 6 else "")
                    self.find("done_feature_complete", f"{ft['dir']}: {ft['status']} com tarefa aberta ({shown})")
                loose = [r for r, v in ft.get("wide_reqs", {}).items() if r not in ft["reqs"] and not v]
                if loose:
                    self.find("done_feature_complete", f"{ft['dir']}: {ft['status']} com REQ sem verified_by ({', '.join(loose)})")
        for nid, node in self.nodes.items():
            if node["type"] != "requirement":
                continue
            st, imps = node["status"], importers_of.get(nid, [])
            if st in closed:
                by_feature = any(ft["status"] in closed for ft in imps)
                bad = [s for s in node["delivered_by"] if not self.commit_exists(s)]
                by_commit = any(self.commit_exists(s) for s in node["delivered_by"])
                if not (by_feature or by_commit):
                    self.find("evidence_done", f"{nid}: {st} sem evidência — nenhuma feature Done o importa e "
                              + (f"`delivered_by` aponta commit que não existe ({', '.join(bad)})" if bad else "não há `delivered_by` com o commit que entregou"))
            if st == "Accepted" and not (node["accepted_in"] and self.acceptance_resolves(node["accepted_in"], node)):
                self.find("evidence_accepted", f"{nid}: Accepted sem `accepted_in` que aponte o aceite do humano (entrada do uat.md ou do log)")
            if st == "In progress" and not any(ft["status"] in open_st for ft in imps) and not self.recent_activity(nid, node, imps):
                self.find("status_stale", f"{nid}: In progress sem feature aberta e sem atividade em {self.stale_days()} dias "
                          "(commit no nó ou na feature, ou citação no log)")
            if st == "Ready":
                rts = self.last_commit_ts(node["path"])
                for f, tid in node["edges"].get("points_to", []):
                    doc = self.state_doc(f)
                    dts = self.last_commit_ts(doc) if doc and doc.exists() else None
                    if rts and dts and dts > rts and self.state_line_changed(doc, tid, node["path"]):
                        self.find("ready_state_changed", f"{nid}: o estado observável ^{tid} ({doc.name}) mudou depois do Ready — o critério pode ter envelhecido")
                    # a screen state is judged when an approved prototype shows it; behavior states have no screen
                    if doc and doc.exists() and doc.stem == "info-arch" and tid not in self.shown_states(doc):
                        self.find("state_judged", f"{nid}: Ready aponta para ^{tid} ({doc.name}), que nenhum protótipo aprovado "
                                  "mostra — falta a linha `shows::` no registro em § Protótipos aprovados")

    # ---- the human's acceptance (CC-ADR-0024 section 6) --------------------------------------------------------
    def brasilia(self, ts):
        return _clock.from_timestamp(ts).strftime(_clock.STAMP)

    def adr_status_at(self, sha, rel):
        """The first word of an ADR's `**Status**:` line in that commit (the reader of adr_header_check); None when absent."""
        cache = self.__dict__.setdefault("_adr_status_at", {})
        if (sha, rel) not in cache:
            code, text = self.git("show", f"{sha}:{rel}")
            cache[(sha, rel)] = None if code != 0 else adr_fields(text)[1]
        return cache[(sha, rel)]

    def status_at(self, sha, rel):
        """The `status:` VALUE of the file in that commit, read by the graph's own frontmatter reader (`"Accepted"` with quotes, two
        spaces or a comment is `Accepted` too; a line of the body that looks like the key is nothing); None when absent."""
        cache = self.__dict__.setdefault("_status_at", {})
        if (sha, rel) not in cache:                       # F78: the same (commit, file) is asked again by the next node of a merge
            code, text = self.git("show", f"{sha}:{rel}")
            value = None if code != 0 else frontmatter(text)[0].get("status")
            cache[(sha, rel)] = None if value is None else str(value).strip()
        return cache[(sha, rel)]

    def cut_in_history(self):
        if "_cut_known" not in self.__dict__:
            self._cut_known = self.git("cat-file", "-e", ACCEPTANCE_CUT_SHA + "^{commit}")[0] == 0
        return self._cut_known

    def accepted_by_commit(self, path, reader=None):
        """The newest commit after the cut that turned the file's `status` into `Accepted`: (sha, "YYYY-MM-DD HH:MM" Brasília, message),
        or None when there is none (the status is older than the cut, or it is only on disk or staged: the commit-msg hook judges it
        when the commit is made). A rename is followed: the before-state is read at the old name. A MERGE is judged too (the judge's
        P1-A of 2026-10-23: `git log --name-status` shows no diff for a merge, so a `status: Accepted` written inside one went
        unseen): the node entered `Accepted` in a merge only when NO parent had it Accepted -- when a parent had, the acceptance came
        from that parent's own commits, which are judged where they are. The order is the topological one, never the date's."""
        rel = "./" + Path(path).relative_to(self.root).as_posix()
        span = [f"{ACCEPTANCE_CUT_SHA}..HEAD"] if self.cut_in_history() else []
        code, out = self.git("log", "--follow", "-M", "--relative", "--name-status", "--format=%x01%H", *span, "--", rel)
        touched = {}                                               # the ordinary commits that changed the file: sha -> (new name, old name)
        for block in (out.split("\x01")[1:] if code == 0 else []):
            head, *rows = block.strip().splitlines()
            cols = (rows[-1].split("\t") if rows else [""])
            touched[head.strip()] = ("./" + cols[-1], "./" + (cols[1] if cols[0][:1] in "RC" and len(cols) == 3 else cols[-1]))
        topo = self.__dict__.setdefault("_topo", {})
        if tuple(span) not in topo:                       # F78: one walk of the history for every Accepted node, not one per node
            topo[tuple(span)] = self.git("log", "--topo-order", "--format=%H %ct %P", *span)
        code, out = topo[tuple(span)]
        for line in (out.splitlines() if code == 0 else []):
            sha, ts, *parents = line.split()
            if not span and self.brasilia(ts) < ACCEPTANCE_STAMPED_SINCE:
                continue                                   # no cut commit here: the date, the only mark there is
            status_at = reader or self.status_at
            if sha in touched:
                new, old = touched[sha]
                hit = status_at(sha, new) == "Accepted" and status_at(sha + "^", old) != "Accepted"
            elif len(parents) > 1:
                hit = status_at(sha, rel) == "Accepted" and not any(status_at(par, rel) == "Accepted" for par in parents)
            else:
                continue
            if hit:
                self.date_cut_used = self.date_cut_used or not span
                return sha, self.brasilia(ts), self.git("show", "-s", "--format=%B", sha)[1]
        return None

    def agent_signature(self):
        """The agent's `Co-Authored-By:` pattern of the commit-msg rule (conformance_check.AGENT_SIGNATURE), read once."""
        if "_agent_sig" not in self.__dict__:
            try:
                from conformance_check import AGENT_SIGNATURE
            except Exception:       # the reader cannot be loaded: the same pattern, written out
                AGENT_SIGNATURE = re.compile(r"^Co-Authored-By:.*(claude|anthropic|codex|gemini|copilot|cursor|gpt|openai)", re.I | re.M)
            self._agent_sig = AGENT_SIGNATURE
        return self._agent_sig

    def acceptance_candidates(self):
        """(ident, spec or node file, names the stamp may carry) of every Accepted node the stamp rule judges: not the brownfield ones."""
        out = [(nid, n["path"], {fid for fid, ft in self.features.items() if nid in [r for _, r in ft["imports"]]} or {"requirements"})
               for nid, n in self.nodes.items() if n["type"] == "requirement" and n["status"] == "Accepted"
               and not str(n["accepted_in"]).strip().lower().startswith(self.LEGACY_ACCEPTANCE)]
        return out + [(ft["dir"], self.p["features"] / ft["dir"] / "spec.md", {fid}) for fid, ft in self.features.items() if ft["status"] == "Accepted"]

    def check_acceptance(self):
        """acceptance_stamped: every node that became Accepted after ACCEPTANCE_STAMPED_SINCE came in a commit stamped
        `Human-accepted: <the feature that imports it | requirements>` and with no agent `Co-Authored-By` -- the step 2 of ADR-0019
        section 2 (the commit-msg hook is step 1). acceptance_coherent: an Accepted feature has an `accepted_in` that resolves and
        every requirement it imports (NFRs apart) is Accepted."""
        accepted = self.acceptance_candidates()
        self.acceptance_unevaluable = None
        if accepted:
            code, inside = self.git("rev-parse", "--is-inside-work-tree")
            if code != 0 or inside != "true":
                self.acceptance_unevaluable = "o projeto não está num repositório git"
            elif self.git("rev-parse", "--is-shallow-repository")[1] == "true":
                self.acceptance_unevaluable = "o clone é raso: o commit que aceitou cada nó não está todo no histórico"
        for ident, path, names in ([] if self.acceptance_unevaluable else accepted):
            if self.scope is not None and ident not in self.scope:
                continue                                   # F78: a --staged pass drops this finding anyway (not a touched node): ~0.5 s of git saved
            found = self.accepted_by_commit(path)
            if found is None:
                continue
            sha, when, message = found
            stamps = STAMP_ACCEPTED.findall(message)
            want = " | ".join(sorted(names))
            if len(stamps) > 1:
                self.find("acceptance_stamped", f"{ident}: Accepted em {sha[:7]} ({when}) num commit com {len(stamps)} carimbos `Human-accepted:` — um aceite, um carimbo")
            elif not stamps or stamps[0] not in names:
                self.find("acceptance_stamped", f"{ident}: Accepted em {sha[:7]} ({when}) sem o carimbo `Human-accepted: {want}` — o aceite é do humano e vem "
                          "do commit que o comando da tela dele faz (CC-ADR-0024); um `status: Accepted` escrito à mão não vale")
            elif self.agent_signature().search(message):
                self.find("acceptance_stamped", f"{ident}: Accepted em {sha[:7]} ({when}) num commit com `Human-accepted:` e `Co-Authored-By:` de agente — "
                          "o humano comita sem a assinatura do agente")
        if not self.acceptance_unevaluable and self.scope is None:
            self.check_adr_acceptance()
            self.check_issue_ok()
        for ft in self.features.values():
            if ft["status"] != "Accepted":
                continue
            if not (ft.get("accepted_in") and self.acceptance_resolves(ft["accepted_in"])):
                self.find("acceptance_coherent", f"{ft['dir']}: feature Accepted sem `accepted_in` que aponte o aceite do humano (entrada do log ou do uat.md)")
            for _, rid in ft["imports"]:
                node = self.nodes.get(rid)
                if node and node["type"] == "requirement" and node["status"] != "Accepted":
                    self.find("acceptance_coherent", f"{ft['dir']}: feature Accepted e o requisito {rid} que ela importa está {node['status']} — andam juntos")

    def check_issue_ok(self):
        """acceptance_stamped for the OK of an issue (CC-ADR-0029): see acceptance_issue_ok.py. Sets `issue_ok_note` when it judges nothing."""
        if not (self.root / "docs" / "specs" / "uat.md").is_file() or self.git("rev-parse", "--is-inside-work-tree")[1] != "true":
            return
        import acceptance_issue_ok
        found, self.issue_ok_note = acceptance_issue_ok.judge(self.git, self.brasilia, STAMP_ACCEPTED, self.agent_signature())
        for rule, msg in found:
            self.find(rule, msg)

    def check_adr_acceptance(self):
        """acceptance_stamped for the ADRs (CC-ADR-0028): an Accepted ADR born on the MJRP's route entered Accepted in a commit stamped
        `Human-accepted: adr:<ID>` with no agent signature, and still declares the route it was born with. Older ADRs (born with no
        route line, dated before SHORT_SINCE) are not judged: they are immutable and were accepted in the chat."""
        folder = self.root / "docs" / "decisions"
        if not folder.is_dir():
            return
        code, inside = self.git("rev-parse", "--is-inside-work-tree")
        if code != 0 or inside != "true":
            return
        for f in sorted(folder.glob("[0-9][0-9][0-9][0-9]-*.md")):
            text = f.read_text(encoding="utf-8", errors="replace")
            route, status, _ = adr_fields(text)
            title = ADR_TITLE.search(text)
            if status != "Accepted" or title is None:
                continue
            rel = "./" + f.relative_to(self.root).as_posix()
            code, born = self.git("log", "--follow", "--diff-filter=A", "--format=%H", "--", rel)
            first = born.splitlines()[-1] if code == 0 and born else None
            born_route, _, born_date = adr_fields(self.git("show", f"{first}:{rel}")[1]) if first else (route, None, None)
            if born_route is None and (born_date is None or born_date < SHORT_SINCE):
                continue
            ident = f"{title['prefix'] + '-' if title['prefix'] else ''}ADR-{title['number']}"
            if born_route == "tech lead":
                continue                                   # the tech lead's acceptance needs no stamp; adr_header_check judges its Deciders
            if route == "tech lead":
                self.find("acceptance_stamped", f"{ident}: nasceu na via `MJRP` e hoje diz `tech lead` — a via vale como nasceu; trocá-la "
                          "depois é aceitar pela válvula do MJRP sem ele (CC-ADR-0028)")
            found = self.accepted_by_commit(f, reader=self.adr_status_at)
            if found is None:
                continue
            sha, when, message = found
            stamps = STAMP_ACCEPTED.findall(message)
            if stamps != [f"adr:{ident}"]:
                self.find("acceptance_stamped", f"{ident}: Accepted em {sha[:7]} ({when}) sem o carimbo `Human-accepted: adr:{ident}` — "
                          "a ADR da via do MJRP é aceita pelo commit que o comando da tela dele faz (CC-ADR-0028)")
            elif self.agent_signature().search(message):
                self.find("acceptance_stamped", f"{ident}: Accepted em {sha[:7]} ({when}) num commit com `Human-accepted:` e `Co-Authored-By:` "
                          "de agente — o humano comita sem a assinatura do agente")

    TIME_RULES = {"status_stale", "ready_state_changed"}

    def next_phase(self, nid, node):
        """The next PDLC step for one requirement node, read from the graph (S-67)."""
        st, edges = node["status"], node["edges"]
        imps = [ft for ft in self.features.values() if nid in [r for _, r in ft["imports"]]]
        if st in ("Backlog", "Prioritized"):
            return ("promover a Ready (mjrp-writing-reqs)" if edges.get("points_to")
                    else "Discovery · Desenhar: estado observável — tela no info-arch.md ou exemplos no behavior.md")
        if st == "Ready":
            return "SDD Specify — nova feature que o importe" if not imps else "SDD em curso na feature " + imps[0]["dir"]
        if st == "In progress":
            if not imps:
                return "trabalho em sessão, sem feature — evidência: commit e log"
            fd = self.p["features"] / imps[0]["dir"]
            for f, phase in (("spec.md", "Specify"), ("plan.md", "Plan"), ("tasks.md", "Tasks")):
                if not (fd / f).exists() or not (fd / f).read_text(encoding="utf-8").strip():
                    return f"SDD {phase} na feature {imps[0]['dir']}"
            return (f"Implement na feature {imps[0]['dir']}" if imps[0].get("open_tasks")
                    else f"qualidade e fechamento da feature {imps[0]['dir']}")
        if st == "Done":
            return "aceite do humano (uat.md)"
        if st == "Deferred":
            return "adiado — nada a fazer"
        if st == "Cancelled":
            return "cancelado — nada a fazer (não volta; o retorno é um nó novo)"
        return "nada a fazer"

    def summary(self):
        reqs = {n: v for n, v in self.nodes.items() if v["type"] == "requirement"}
        by = {}
        for v in reqs.values():
            by[v["status"]] = by.get(v["status"], 0) + 1
        order = self.rules["statuses"] + self.rules.get("off_track_statuses", [])
        print("[requirements_graph] resumo — requisitos por status: "
              + " · ".join(f"{s} {by[s]}" for s in order if s in by))
        if self.features:
            fs = {}
            for ft in self.features.values():
                fs[ft["status"]] = fs.get(ft["status"], 0) + 1
            print("  features por status: " + " · ".join(f"{k} {v}" for k, v in fs.items()))
        contradicted = {re.split(r"[:/ ]", msg, maxsplit=1)[0] for rule, msg in self.findings}
        print("  próxima fase por nó (aberto):")
        for nid in sorted(reqs, key=lambda x: (x.split("-")[0], int(re.sub(r"\D", "", x) or 0))):
            v = reqs[nid]
            if v["status"] in ("Accepted",):
                continue
            step = "reconciliar primeiro (Guardian) — o status contradiz o grafo" if nid in contradicted else self.next_phase(nid, v)
            if v["status"] == "Done" and nid not in contradicted:
                continue
            print(f"    {nid} [{v['status']}] → {step}")

    def check_uat_fixes_cited(self):
        """UAT-290 (warning): a Fix feature declares in `fixes:` every open issue whose Status cell cites it.

        Incident: the Delivery board put F52 in «Aceito» while its spec was In Progress and UAT-285, 287 and 288 were
        `fixing (F52)`: the station of a Fix feature reads only `fixes:` (CC-ADR-0009 section 1, row 2: «as issues que ela
        corrige, declaradas, nunca inferidas»), and the issues born after the spec (UAT-284..288) cited F52 in the Status
        cell but were never added to `fixes:`. Judged: a row whose Status is `fixing (Fxx)` or `fixed (Fxx: ...)` and whose
        «OK do humano» is still empty (an issue that is closed no longer holds the board), on a feature of the Fix track
        (the other tracks read `imports:`, not `fixes:`)."""
        uat = self.p.get("uat")
        if not uat or not uat.exists():
            return
        status_at = ok_at = None
        for number, line in enumerate(uat.read_text(encoding="utf-8").splitlines(), start=1):
            if not line.startswith("|"):
                continue
            cells = [c.strip() for c in UAT_CELLS.split(line)[1:-1]]
            if line.startswith("| ID "):
                status_at = cells.index("Status") if "Status" in cells else None
                ok_at = cells.index("OK do humano") if "OK do humano" in cells else None
                continue
            if status_at is None or ok_at is None or len(cells) <= max(status_at, ok_at) or not cells[0].startswith("UAT-"):
                continue
            cited = UAT_STATUS_FEATURE.match(cells[status_at])
            ft = self.features.get(cited.group("f")) if cited else None
            if ft is None or cells[ok_at] or ft.get("track", "").casefold() != "fix" or cells[0] in ft["fixes"]:
                continue
            self.warn("uat_fixes_cited", f"{uat.name}:{number}: {cells[0]} está `{cited.group('verb')} ({cited.group('f')})`, mas o `fixes:` da {ft['dir']} não a lista — "
                      "o quadro do Delivery lê só o `fixes:` (CC-ADR-0009 § 1) e pode pôr a feature em «Aceito» com a issue aberta (UAT-290)")

    def check_link_stems(self):
        """MJRP, 2026-10-09: with link_form = stem, a link or embed to a requirement names its whole file stem --
        Obsidian resolves file names, not aliases, so [[S-31]] to S-31-some-slug.md is a broken link there. Checked
        on the edges of every node, the imports of every feature and the wikilinks/embeds of prd.md."""
        if (self.rules.get("file_name") or {}).get("link_form") != "stem":
            return
        seen = set()

        def judge(src, f):
            if not f or "#" in f:
                return
            stem = Path(f).stem
            node = self.nodes.get(node_id(stem))
            if not node or not node.get("stem") or stem == node["stem"] or (src, stem) in seen:
                return
            seen.add((src, stem))
            what = "ID solto" if stem == node_id(stem) else f"slug desatualizado ({stem})"
            self.find("link_stem", f"{src}: link para {node_id(stem)} com {what} — escreva [[{node['stem']}|{node_id(stem)}]] "
                                   f"(embed ![[{node['stem']}]])")

        for nid, node in self.nodes.items():
            for targets in node["edges"].values():
                for f, _ in targets:
                    judge(nid, f)
        for ft in self.features.values():
            for f, _ in ft["imports"]:
                judge(ft["dir"], f)
        prd = self.p.get("prd")
        if prd and prd.exists():
            for f, _ in WIKILINK.findall(prd.read_text(encoding="utf-8", errors="replace")):
                judge(prd.name, f.strip())

    def check_design_system(self):
        """Audit C F10 (MJRP, 2026-10-09): a Ready requirement that points to a screen state (info-arch.md, nested
        included) needs the design system of that project -- the identity is decided before the contract, not left
        in the prototype's code."""
        rel_ds = (self.rules.get("paths") or {}).get("design_system")
        rel_ia = (self.rules.get("paths") or {}).get("info_arch")
        if not rel_ds or not rel_ia:
            return
        for nid, node in self.nodes.items():
            if node["type"] != "requirement" or node["status"] != "Ready":
                continue
            missing = set()
            for f, _ in node["edges"].get("points_to", []):
                doc = self.state_doc(f)
                if not doc or doc.stem != Path(rel_ia).stem:
                    continue
                proj = doc
                for _ in Path(rel_ia).parts:
                    proj = proj.parent
                ds = proj / rel_ds
                if not ds.exists():
                    missing.add(str(ds.relative_to(self.root)) if ds.is_relative_to(self.root) else str(ds))
            for m in sorted(missing):
                self.find("design_system_exists", f"{nid}: Ready aponta para estado de tela, e {m} não existe — a identidade "
                                                  "visual vem antes do contrato (mjrp-defining-design-systems, a partir do protótipo aprovado)")

    def check_node_folder(self):
        """S-123 (MJRP, 2026-10-05): requirement files are grouped in one folder per epic. Dormant until the
        project's epics declare `folder::` in prd.md -- a project with a flat requirements/ is not judged."""
        epics = {nid: n for nid, n in self.nodes.items() if n["type"] == "epic"}
        if not any(n.get("folder") for n in epics.values()):
            return
        d = self.p["requirements"]
        nfr_dir = self.rules["paths"].get("nfr_folder", "nfr")
        seen = {}
        for nid, n in epics.items():
            fd = n.get("folder")
            if not fd:
                self.find("node_folder", f"{nid}: épico sem folder:: — os outros épicos declaram a pasta dos seus requisitos")
                continue
            if fd in seen:
                self.find("node_folder", f"{nid}: folder:: {fd} já é a pasta de {seen[fd]}")
            seen[fd] = nid
            if not re.match(r"^(?:[a-z]+-)?ep-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$", fd) or not fd.startswith(nid.lower() + "-"):
                self.find("node_folder", f"{nid}: folder:: {fd} fora do padrão {nid.lower()}-<slug-em-inglês>")
        for nid, n in self.nodes.items():
            if not n.get("path"):
                continue
            where = str(n["path"].parent.relative_to(d)).replace("\\", "/")
            if n["type"] == "nfr":
                want = nfr_dir
            else:
                ep = (n["edges"].get("epic") or [(None, None)])[0][1]
                want = (epics.get(ep) or {}).get("folder")
                if not want:
                    continue
            if where != want:
                self.find("node_folder", f"{nid}: está em requirements/{where if where != '.' else ''}, o lugar é requirements/{want}/")
        known = set(seen) | {nfr_dir}
        for sub in sorted(x for x in d.iterdir() if x.is_dir()):
            if sub.name not in known:
                self.find("node_folder", f"requirements/{sub.name}/: pasta que nenhum épico declara")

    def run(self):
        self.load()
        self.check_id_unique()
        self.check_node_folder()
        self.check_node_edges()
        self.check_tags()
        self.check_features()
        self.check_evidence()
        self.check_acceptance()
        self.check_design_system()
        self.check_link_stems()
        self.check_uat_fixes_cited()
        return self.findings


def adr_fields(text):
    """(route, status word, date) of an ADR's header, by the readers of adr_header_check (one reader, not a copy)."""
    from adr_header_check import ACCEPTANCE_RE, HEADER_LINES, STATUS_RE, record_date
    head = text.splitlines()[:HEADER_LINES]
    route = next((m["route"] for m in (re.search(ACCEPTANCE_RE, l) for l in head) if m), None)
    status = next((m["word"] for m in (re.search(STATUS_RE, l) for l in head) if m), None)
    return route, status, record_date(text)


class GitUnavailable(Exception):
    """F71 R2: git failed (missing, locked index, safe.directory...). The verdict is "not evaluable", never "nothing changed"."""


def touched_nodes(root, rules, mode):
    """IDs of requirement nodes and feature dirs touched by the staged (--staged) or uncommitted (--changed) work.
    Raises GitUnavailable when git cannot answer: an empty set would read as "nothing touched" and approve."""
    # --name-status -M: a pure rename (R100) changes no node content, so it cannot bring a new contradiction --
    # moving the nodes into their epic's folder (S-123) must not re-judge the old findings they carry
    args = ["diff", "--cached", "--name-status", "-M"] if mode == "staged" else ["status", "--porcelain", "-uall"]
    try:
        r = _git.run(root, *args, timeout=GIT_TIMEOUT)
    except _git.GitError as e:
        raise GitUnavailable(str(e)) from e
    if r.code != 0:
        raise GitUnavailable(f"git {' '.join(args)} saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    out = r.out
    # F79 (UAT-363): git writes these paths relative to the repository top; in a nested project (apps/control-center) the rules'
    # paths are relative to the project, so the prefix comes off and what lies outside the project is not this project's to judge
    try:
        pre = _git.run(root, "rev-parse", "--show-prefix", timeout=GIT_TIMEOUT)
    except _git.GitError as e:
        raise GitUnavailable(str(e)) from e
    if pre.code != 0:
        raise GitUnavailable(f"git rev-parse --show-prefix saiu {pre.code}: {(pre.err or pre.out).strip()[:200]}")
    prefix = pre.out.strip()
    req, feat = rules["paths"]["requirements"].rstrip("/") + "/", rules["paths"]["features"].rstrip("/") + "/"
    ids = set()
    for line in out.splitlines():
        if mode == "staged":
            cols = line.split("\t")
            if cols[0] == "R100":
                continue
            p = cols[-1].strip()
        else:
            p = line[3:].strip().strip('"')
            if " -> " in p:
                p = p.split(" -> ")[-1].strip('"')
        if prefix:
            if not p.startswith(prefix):
                continue
            p = p[len(prefix):]
        if p.startswith(req) and p.endswith(".md"):
            ids.add(node_id(Path(p).stem))      # MJRP, 2026-10-09: <ID>-<slug>.md -> the node is the ID
        elif p.startswith(feat):
            ids.add(p[len(feat):].split("/")[0])
    return ids


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    strict = "--strict" in argv
    rules_path = HERE / "requirements_graph_rules.json"
    if "--rules" in argv:
        rules_path = Path(argv[argv.index("--rules") + 1])
        args = [a for a in args if a != str(rules_path)]
    root = Path(args[0] if args else ".").resolve()
    rules = json.loads(rules_path.read_text(encoding="utf-8"))
    if not (root / rules["paths"]["requirements"]).is_dir():
        if "--staged" in argv or "--changed" in argv:
            return 0
        print("[requirements_graph] sem docs/specs/requirements/ — projeto ainda sem grafo de requisitos (não avaliável)")
        return 2 if strict else 0
    mode = "staged" if "--staged" in argv else "changed" if "--changed" in argv else None
    nodes = None
    if mode:
        # S-67: refuse only what THIS work introduces or touches - a contradiction in a node it touched. Time rules
        # (stale, state changed after Ready) are the daily pass's, never a reason to block a commit.
        # F78: the touched set is asked BEFORE the graph runs, so the graph skips the git it would only throw away.
        try:
            nodes = touched_nodes(root, rules, mode)
        except GitUnavailable as e:
            print(f"[requirements_graph] NÃO AVALIÁVEL — não sei quais nós este trabalho toca ({e}); nada foi julgado")
            return 2
    g = Graph(root, rules, scope=nodes)
    findings = g.run()
    if mode:
        mine = [(r, m) for r, m in findings if r not in Graph.TIME_RULES and re.split(r"[:/ ]", m, maxsplit=1)[0] in nodes]
        if not mine:
            return 0
        print(f"[requirements_graph] {len(mine)} contradição(ões) nos nós que este trabalho toca:")
        for r, m in mine:
            print(f"  [{r}] {m}")
        print("  conserte o status ou a evidência (delivered_by, accepted_in, tarefas) — ou reconcilie: kernel requirements-graph § Reconciliação")
        return 2 if "--gate" in argv else 1
    n_nodes = len(g.nodes)
    for rule, msg in g.warnings:
        print(f"[requirements_graph] aviso [{rule}] — {msg}")
    if "--summary" in argv:
        g.summary()
    if "--tags" in argv:
        # MJRP, 2026-10-06: the category of each outcome and epic -- an epic shows its own tags plus the inherited ones
        print("[requirements_graph] tags por resultado e épico:")
        for nid in sorted(n for n, v in g.nodes.items() if v["type"] in ("outcome", "epic")):
            v = g.nodes[nid]
            serves = ", ".join(t for _, t in v["edges"].get("serves", []))
            print(f"  {nid}{' → ' + serves if serves else ''}: {' '.join(g.effective_tags(nid)) or '(sem tag)'}")
    if g.legacy_accepted:
        _, lstate = g.harness_start()
        print(f"[requirements_graph] {len(g.legacy_accepted)} aceites por histórico (anteriores ao harness, sem aceite do humano)"
              + (" — sem git: aceitos como escritos, a data não foi conferida" if lstate == "nogit" else ""))
    if g.legacy_unevaluable:
        findings_text = "NÃO AVALIÁVEL" if not findings else "além disso, NÃO AVALIÁVEL"
        print(f"[requirements_graph] {findings_text} — aceite por histórico: {g.legacy_unevaluable}; a frase não vale sem a data do contrato")
    if g.date_cut_used or (g.acceptance_candidates() and not g.cut_in_history() and not g.acceptance_unevaluable):
        print("[requirements_graph] aviso — o carimbo do aceite (`Human-accepted:`) foi cortado pela DATA "
              f"({ACCEPTANCE_STAMPED_SINCE}, Brasília): este repositório não tem o commit de corte {ACCEPTANCE_CUT_SHA[:8]}, e a data de um commit é a que "
              "o autor escreve — o corte pelo histórico só vale onde esse commit existe")
    if g.issue_ok_note:
        print(f"[requirements_graph] aviso — {g.issue_ok_note}")
    if g.acceptance_unevaluable:
        findings_text = "NÃO AVALIÁVEL" if not findings else "além disso, NÃO AVALIÁVEL"
        print(f"[requirements_graph] {findings_text} — o carimbo do aceite (`Human-accepted:`): {g.acceptance_unevaluable}")
    if not findings and not g.unreachable and not g.legacy_unevaluable and not g.acceptance_unevaluable:
        print(f"[requirements_graph] VERDE — {n_nodes} nó(s), {len(g.features)} feature(s), nenhuma regra violada")
        return 0
    if findings:
        print(f"[requirements_graph] {len(findings)} achado(s) em {n_nodes} nó(s) e {len(g.features)} feature(s):")
        for rule, msg in findings:
            print(f"  [{rule}] {msg}")
    if g.unreachable:
        # ADR-0020 A.2: a target outside the repository, off the disk or not a project's ROADMAP.md is not read and is
        # not an error: the verdict is "not evaluable" (exit 2) -- never green
        verdict = "NÃO AVALIÁVEL" if not findings else "além disso, NÃO AVALIÁVEL"
        print(f"[requirements_graph] {verdict} — {len(g.unreachable)} alvo(s) de contributes_to fora de alcance (não lidos):")
        for msg in g.unreachable:
            print(f"  [contributes_to] {msg}")
    if findings:
        return 1 if strict else 0
    return 2 if strict else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
