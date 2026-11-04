#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""retro_step_check.py - the fast lane's retroactive step, charged by machine (F101, S-186).

Born from an incident (ADR-0002 asks for one): on 2026-10-27 the F83 closed with the retroactive step half done, and the integrator
itself summed it up as «plan, info-arch e protótipo» (log 2026-10-27 10:41); the G session did the F65's step with only the plan and
the info-arch. The step depended on the integrator sending a message to each page session. The sensors that existed ran late
(`pdlc_vocabulary_check.py` § fast lane, in the doctor and the CI, after the merge) or judged only the shape of the three files
(`sdd_shape_check.py`). The MJRP chose (log 2026-10-27 10:32): the machine refuses it - here, in the pre-commit and in the merge train.

ONE source for what the step updates: the registry `mjrp-scripts/artifacts.json` (F100). Each row the step enters (`retro`: `always`, or
`if` with the condition in `retro_text`) says in `retro_check` how the machine checks it; this script lists nothing of its own:
    sketch        the first lines of spec/plan/tasks no longer say «Esboço» (pdlc_vocabulary_check's marker)
    sdd           the file (`file`: spec | plan) in the SDD templates' shape, no «a escrever» left (sdd_shape_check's judgement)
    tasks         the tasks.md in shape, and every closed TASK carries `rounds::` (loop.py's marks)
    requirement   each imported node: `part: edges` -> `delivered_by:` and `points_to:`; `part: ac` -> criteria Given/When/Then (Dado/Então).
                  A fix with no imported node (`solution_type: fix`, `imports: []` - it repairs an issue, it delivers no story; F111,
                  UAT-385) is not charged a story it does not have: these rows do not apply, and it needs its `fixes:` instead
    touched       a commit of the feature touches the path (`paths`, project-relative); `nested_only`: not in the repository's root project
    declared      plan.md § Documents Consulted declares the document (`doc`; `token` the word looked for, default its file name) as
                  «atualizado» or «sem mudança»; «atualizado» also needs a commit of the feature touching it, in the feature's project or at
                  the repository top (`at_top`: only at the top)
    screen        when the feature touched a screen file (the contract's `screen:`, visual_gate), a commit of it touches `paths`;
                  `none_ok`: `**Prototype**: none - <who>` in the spec.md lets it go (the human said no prototype is needed);
                  `touch_id_ok`: on the Human track the MJRP's Touch ID at the merge fills the row (F154, UAT-454): the audit note the gate
                  writes (`git notes --ref=mjrp-visual-ok`, on a commit the judged copy reaches) names the feature and this project's screen.
                  There is no agent judge on that track, so no report (pdlc-loops § 2). A fix whose issues are all the agents' is on the Agent
                  track (`uat_tracks_check.VALUE` reads `Reportado por`; AGENTS.md § Duas trilhas): its judge is the recheck, the row asks the report
    fixes         when the spec's `fixes:` is not empty, a commit of the feature touches `paths` (the uat.md); for a fix
                  (`solution_type: fix`) each issue's Status cell in that uat.md also reads `fixed (<Fxx>: <commit> · <test or steps → result>)` (F111; the one format, UAT-393 / F117)
    sensor        another sensor checks it (`sensor`): listed, not judged here
    judgement     no machine can tell whether the condition held: listed for the agent, not judged

"A commit of the feature" = a commit whose message cites the feature id (F101), reachable from the judged revision, plus - in the
pre-commit - what this commit stages. The declaration in plan.md is what the machine can read about the documents that describe the
system: pdlc-loops § 2.1 asks each to be declared «atualizado» or «sem mudança».

The registry is read from the copy BEFORE the change (HEAD for the commit, the base for a branch), like the guards read from main: a
commit cannot loosen the rule it is judged by. Which features are judged: `lane: fast` going to `Done`/`Accepted` HERE - closed in the judged copy and not closed in the copy before it
(HEAD for the commit, the base for a branch). A feature that was already closed, a standard-lane feature, or one numbered below
sdd_shape_check.SINCE_FEATURE is not judged.

    python3 mjrp-scripts/retro_step_check.py <root> --staged                    the pre-commit: the INDEX against HEAD
    python3 mjrp-scripts/retro_step_check.py <root> --branch REF [--base REF]   merge_train.py merge: REF against the base (default HEAD)
In a MERGE commit (MERGE_HEAD exists) `--staged` judges a feature the other parent already closed by that parent's commits, as `--branch`
does, not by the diff of the merge (F147, UAT-439: the diff does not show what the branch already held); the feature this branch closes is
judged as in any commit.
Exit 0 nothing missing (the unchecked rows are printed) · 1 a fast-lane feature goes to Done without its step · 2 not evaluable (git did
not answer, the registry is not JSON). A repository that versions no registry (a child without the harness's scripts) exits 0 saying
it was NOT checked. Stdlib only (ADR-0015).
"""
import fnmatch
import json
import re
import sys

import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402
import _fm  # noqa: E402
import _git  # noqa: E402
import loop  # noqa: E402
import pdlc_vocabulary_check as pvc  # noqa: E402
import sdd_shape_check as ssc  # noqa: E402
import uat_tracks_check  # noqa: E402
import visual_gate  # noqa: E402
from _contract import read_yaml  # noqa: E402

REGISTRY = "mjrp-scripts/artifacts.json"
MAP_PAGE = "docs/wiki/kernel/ways-of-working/pdlc-artifact-map.md"
FEATURES = re.compile(r"^(?P<proj>(?:.*/)?)docs/specs/features/(?P<dir>F(?P<num>\d{2,})-[^/]+)/(?:spec|plan|tasks)\.md$")
UPDATED = re.compile(r"(?i)\batualizad[oa]s?\b|\bupdated\b")
UNCHANGED = re.compile(r"(?i)\bsem\s+mudan[çc]as?\b|\bno\s+change\b|\bunchanged\b")
GIVEN = re.compile(r"\b(?:Dado|Dada|Given)\b")
THEN = re.compile(r"\b(?:Então|Entao|Then)\b")
WIKI_LINK = re.compile(r"\[\[([^\]|#]+)")
DOCS_CONSULTED = "documents consulted"
ISSUE_ID = re.compile(r"\bUAT-\d+\b")
FEATURE_ID = re.compile(r"\bF\d{2,}\b")
ROOT_PROJECT = "o projeto da raiz"   # how the note's `screen:` names the repository's root project (visual_gate.py; the selftest holds it)
UAT_CELLS = re.compile(r"(?<!\\)\|")
NOT_APPLICABLE = "não se aplica"   # the prefix of an unchecked reason that is not the agent's judgement: the row does not apply here


class NotEvaluable(Exception):
    """The check could not judge (git did not answer, the registry is unreadable): never an empty answer."""


class NoRegistry(Exception):
    """The repository versions no registry: nothing to read the step from (a child without the harness's scripts)."""


# ---- where the texts come from: the index (the commit) or a revision (a branch, its base) -----------------------------------------
class Source:
    """Reads repository-relative files from the INDEX (`rev=None`) or from a revision; `None` when the file is not there."""

    def __init__(self, top, rev=None):
        self.top, self.rev = top, rev

    def _spec(self, rel):
        return f":{rel}" if self.rev is None else f"{self.rev}:{rel}"

    def read(self, rel):
        r = _git.run(self.top, "show", self._spec(rel))
        return r.out if r.code == 0 else None

    def files(self, prefix):
        args = (("ls-files", "--cached", "-z", "--", prefix) if self.rev is None
                else ("ls-tree", "-r", "--name-only", "-z", self.rev, "--", prefix))
        r = _git.run(self.top, *args)
        if r.code != 0:
            raise NotEvaluable(f"git {args[0]} saiu {r.code}: {(r.err or r.out).strip()[:160]}")
        return [x for x in r.out.split("\0") if x]


def load_registry(src):
    text = src.read(REGISTRY)
    if text is None:
        raise NoRegistry(f"{REGISTRY} não está versionado aqui")
    try:
        reg = json.loads(text)
    except json.JSONDecodeError as exc:
        raise NotEvaluable(f"{REGISTRY}:{exc.lineno}: não é JSON ({exc.msg})") from exc
    return [a for a in reg.get("artifacts", []) if a.get("retro") in ("always", "if")]


def load_shapes(src):
    """The SDD templates' shapes from the same source; None when the source versions no template (sdd_shape_check says it too)."""
    shapes = {}
    for kind in ssc.KINDS:
        text = src.read(f"{ssc.TEMPLATES_REL.as_posix()}/{kind}.md")
        if text is None:
            return None
        shapes[kind] = ssc.parse_template(text)
    return shapes


def screen_globs(src, proj):
    text = src.read(f"{proj}.mjrp-project.yml")
    if text is None:
        return None
    declared = ((read_yaml(text) or {}).get("mjrp_harness") or {}).get("screen")
    return [str(x) for x in declared] if isinstance(declared, list) and declared else None


def feature_paths(top, fid, rev):
    """Every path the commits citing the feature id touched, reachable from `rev` (pdlc_vocabulary_check's rule, from a revision)."""
    rx = rf"(^|[^A-Za-z0-9]){fid}([^0-9]|$)"
    r = _git.run(top, "log", "-E", f"--grep={rx}", "--name-only", "--format=", rev)
    if r.code != 0:
        raise NotEvaluable(f"git log {rev} saiu {r.code}: {(r.err or r.out).strip()[:160]}")
    return {ln.strip() for ln in r.out.splitlines() if ln.strip()}


# ---- the judgement of one feature (pure, given the readers) ----------------------------------------------------------------------
def _closed(spec_text):
    return ssc.status_of(spec_text).strip().casefold() in ssc.CLOSED


def _list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x).strip() for x in value if str(x).strip()]
    s = str(value).strip()
    return [] if s in ("", "[]", "~", "null") else [s]


def _section(text, name):
    for heading, lines in ssc.sections_of(text or "").items():
        if ssc.section_name(heading) == name:
            return [ln for ln in lines if ssc.meaningful(ln)]
    return None


def _token_rx(token):
    return re.compile(rf"(?i)(?<![\w-]){re.escape(token)}(?![\w-])")


def _hit(touched, base, globs):
    return any(fnmatch.fnmatch(t, base + g) for t in touched for g in globs)


def uat_status(text, uid):
    """The Status cell of issue `uid` in a uat.md text (the column named «Status» of the table it sits in); None when absent."""
    return uat_cell(text, uid, "Status")


def uat_cell(text, uid, column):
    """The cell of issue `uid` under `column`, in the table it sits in; None when the row or the column is absent."""
    header = None
    for line in (text or "").splitlines():
        if not line.lstrip().startswith("|"):
            header = None if not line.strip() else header
            continue
        cells = [c.strip() for c in UAT_CELLS.split(line.strip())[1:-1]]
        if cells and cells[0] == "ID" and column in cells:
            header = cells
        elif header and cells and cells[0] == uid and len(cells) >= len(header):   # the row may end in its ^block-id cell
            return cells[header.index(column)]
    return None


def fixed_by(status, fid):
    """True when a Status cell says the issue was fixed by `fid` with evidence: `fixed (<fid>: <something>)`."""
    return bool(re.match(rf"^fixed\s*\(\s*{re.escape(fid)}\s*:\s*\S", status or ""))


def on_agent_track(is_fix, fixes, uat_text):
    """A fix whose issues are all the agents' (the Control Center's `_feature_track` says the same): `juiz` or `agente`, not raised to the
    human. An issue nobody can place (no row, outside the grammar) stays with the human, as in feature_closure.py."""
    ids = [m.group(0) for f in fixes for m in [ISSUE_ID.search(f)] if m]
    if not is_fix or not ids:
        return False
    cells = [uat_cell(uat_text, uid, "Reportado por") for uid in ids]
    found = [uat_tracks_check.VALUE.match(c or "") for c in cells]
    return all(m and m.group("who") != "MJRP" and not m.group("prio") for m in found)


def read_touch_ids(top, revs):
    """[(features, screens)] of the Touch ID notes on the commits `revs` reach. The gate never reads these back (it asks live); this reads them
    to tell the row is filled, with the same trust as a report an agent commits: it opens neither a merge nor an acceptance."""
    r = _git.run(top, "notes", f"--ref={visual_gate.NOTES_REF}", "list")
    if r.code != 0:
        raise NotEvaluable(f"git notes saiu {r.code}: {(r.err or r.out).strip()[:160]}")
    pairs = [ln.split() for ln in r.out.splitlines() if ln.strip()]
    if not pairs:
        return []
    h = _git.run(top, "rev-list", *revs)
    if h.code != 0:
        raise NotEvaluable(f"git rev-list saiu {h.code}: {(h.err or h.out).strip()[:160]}")
    reached = set(h.out.split())
    out = []
    for blob, tip in pairs:
        text = _git.run(top, "cat-file", "-p", blob).out if tip in reached else ""
        fields = dict(line.partition(": ")[::2] for line in text.splitlines())
        if fields.get("presence") == "touch-id":
            out.append((set(FEATURE_ID.findall(fields.get("visual-ok", ""))), fields.get("screen", "").split("; ")))
    return out


def touch_id_holds(fingers, fid, proj):
    name = proj.rstrip("/") or ROOT_PROJECT
    return any(fid in features and any(s.startswith(f"{name}: ") for s in screens) for features, screens in fingers)


def judge(feature, rows, touched, src, shapes, globs, fingers=()):
    """(missing, unchecked) for one feature going to Done on the fast lane.
    `feature`: {"folder", "proj", "fid", "num", "texts": {spec, plan, tasks}} · `rows`: the registry's always/if rows ·
    `touched`: repository-relative paths the feature's commits touch · `src.read`/`src.files`: the judged copy ·
    `fingers`: the Touch ID notes (read_touch_ids).
    missing: [(row, what is missing and how to fix it)]; unchecked: [(row, why the machine does not judge it)]."""
    proj, texts = feature["proj"], feature["texts"]
    spec = texts.get("spec") or ""
    fm = _fm.parse(spec)
    rel_touched = {t[len(proj):] for t in touched if t.startswith(proj)}
    screen = any(visual_gate.is_screen_file(t, globs) for t in rel_touched)
    proto_none = bool(pvc.PROTOTYPE_NONE.search(spec))
    sdd = None
    if shapes is not None:
        sdd = ssc.feature_findings(feature["num"], "Done", texts, shapes, since=0)
    nodes = None
    is_fix = str(fm.get("solution_type") or "").strip().casefold() == "fix"
    imported = WIKI_LINK.findall(" ".join(_list(fm.get("imports"))))
    bare_fix = is_fix and not _list(fm.get("imports"))   # repairs an issue, delivers no story (UAT-385); a malformed imports is no bare fix (P2-4)
    missing, unchecked = [], []
    for row in rows:
        rc = row.get("retro_check") or {}
        by = rc.get("by")
        say = lambda msg, r=row: missing.append((r, msg))  # noqa: E731
        if by == "sketch":
            for name in pvc.RECORD_FILES:
                head = "\n".join((texts.get(name[:-3]) or "").splitlines()[:6])
                if pvc.SKETCH.search(head):
                    say(f"o {name} ainda é o esboço (o cabeçalho diz «Esboço»): reescreva-o para o que foi construído e tire a marca")
        elif by in ("sdd", "tasks"):
            kind = rc.get("file") or "tasks"
            if sdd is None:
                unchecked.append((row, "os moldes do SDD não estão versionados aqui"))
                continue
            gaps = [m for lvl, k, m in sdd if k == kind and lvl == "error"]
            if gaps:
                say(f"o {kind}.md fora do molde: {' · '.join(gaps)} (molde da `mjrp-specifying-sdd-artifacts`)")
            if by == "tasks":
                for line in (texts.get("tasks") or "").splitlines():
                    m = loop.TASK_RE.match(line)
                    if m and m.group("done") in "xX":
                        marks = {k.group("key"): k.group("val") for k in loop.MARK_RE.finditer(m.group("rest"))}
                        if not marks.get("rounds", "").isdigit():
                            say(f"a {m.group('id')} está fechada sem `rounds::` (quantas voltas Execute ⇄ Verify levou)")
        elif by == "requirement":
            names = imported
            if bare_fix:
                if not _list(fm.get("fixes")) and rc.get("part") == "edges":
                    say("um conserto sem requisito importado (`solution_type: fix`, `imports: []`) precisa de `fixes:` no spec.md "
                        "(a issue que ele conserta é o que ele entrega)")
                unchecked.append((row, f"{NOT_APPLICABLE}: conserto sem nó importado — entrega a issue de `fixes:`, não uma story"))
                continue
            if not names:
                say("o spec.md não importa nenhum requisito (`imports:`): sem o nó, nada recebe Done, delivered_by e os critérios")
                continue
            if nodes is None:
                nodes = {p.rsplit("/", 1)[-1][:-3]: p for p in src.files(f"{proj}docs/specs/requirements/") if p.endswith(".md")}
            for name in names:
                path = nodes.get(name.strip())
                node = src.read(path) if path else None
                if node is None:
                    say(f"o requisito [[{name}]] que o spec.md importa não está em {proj}docs/specs/requirements/")
                    continue
                nid = _fm.scalars(node).get("id") or name
                if rc.get("part") == "edges":
                    nfm = _fm.parse(node)
                    if not _list(nfm.get("delivered_by")):
                        say(f"o {nid} não tem `delivered_by:` (o commit que entregou)")
                    if not _list(nfm.get("points_to")):
                        say(f"o {nid} não tem `points_to:` (o estado do info-arch.md, ou do behavior.md quando não há tela)")
                else:
                    body = _fm.split(node)[1]
                    if not any(GIVEN.search(ln) and THEN.search(ln) for ln in body.splitlines()):
                        say(f"o {nid} não tem critérios de aceite (Dado … Quando … Então …): escreva-os do que o humano aprovou, "
                            f"apontando o estado (a `mjrp-writing-reqs`)")
        elif by == "touched":
            if rc.get("nested_only") and not proj:
                unchecked.append((row, "no projeto da raiz é do integrador"))
                continue
            if not _hit(touched, proj, rc["paths"]):
                say(f"nenhum commit da feature toca {', '.join(proj + p for p in rc['paths'])} — {row['retro_text']}")
        elif by == "declared":
            token = rc.get("token") or rc["doc"].rstrip("/").rsplit("/", 1)[-1]
            lines = _section(texts.get("plan"), DOCS_CONSULTED)
            said = [ln for ln in (lines or []) if _token_rx(token).search(ln)]
            if not said or not any(UPDATED.search(ln) or UNCHANGED.search(ln) for ln in said):
                say(f"o plan.md § Documents Consulted não declara `{token}` como «atualizado» ou «sem mudança» "
                    f"(uma linha: `{token}` — atualizado | sem mudança)")
                continue
            if any(UPDATED.search(ln) and not UNCHANGED.search(ln) for ln in said):
                doc = rc["doc"]
                bases = [""] if rc.get("at_top") or not proj else [proj, ""]   # an app's document may be the root's (the harness's behavior.md)
                if not any(_hit(touched, b, [doc + "*" if doc.endswith("/") else doc]) for b in bases):
                    say(f"o plan.md declara `{token}` «atualizado», mas nenhum commit da feature toca {' nem '.join(b + doc for b in bases)}")
        elif by == "screen":
            if not screen:
                continue
            if rc.get("none_ok") and proto_none:
                continue
            human = rc.get("touch_id_ok") and not on_agent_track(is_fix, _list(fm.get("fixes")), src.read(f"{proj}docs/specs/uat.md"))
            if human and touch_id_holds(fingers, feature["fid"], proj):
                continue
            if not _hit(touched, proj, rc["paths"]):
                tip = (" — ou, se o humano disse que não precisa de protótipo, `**Prototype**: none — <quem disse>` no spec.md"
                       if rc.get("none_ok") else "")
                tip += (" — ou o Touch ID do humano no merge, a nota `mjrp-visual-ok` que o portão visual grava: a via rápida da trilha "
                        "Humano não tem juiz agente, então junte o ramo antes de fechar" if human else "")
                say(f"a feature mexeu na tela e nenhum commit dela toca {', '.join(proj + p for p in rc['paths'])}{tip}")
        elif by == "fixes":
            fixes = _list(fm.get("fixes"))
            if fixes and not _hit(touched, proj, rc["paths"]):
                say(f"a feature conserta {', '.join(fixes)} e nenhum commit dela toca {', '.join(proj + p for p in rc['paths'])} "
                    f"(a issue `fixed`, com a evidência)")
            elif fixes and is_fix:
                uat = proj + rc["paths"][0]
                text = src.read(uat)
                for uid in [m.group(0) for f in fixes for m in [ISSUE_ID.search(f)] if m] or fixes:
                    status = uat_status(text, uid)
                    if not fixed_by(status, feature["fid"]):
                        say(f"a {uid} na {uat} não está `fixed ({feature['fid']}: <commit> · <teste ou passos → resultado>)` "
                            f"(o Status diz «{(status or 'a linha não existe')[:60]}»)")
        elif by == "sensor":
            unchecked.append((row, f"conferido por `{rc.get('sensor')}`"))
        else:
            unchecked.append((row, "julgamento do agente: a máquina não sabe se a condição valeu"))
    return missing, unchecked


# ---- which features go to Done here ---------------------------------------------------------------------------------------------
def _closing(folders, now, before):
    """[feature] of `folders` whose spec in `now` says lane fast + closed and in `before` is not closed (or absent)."""
    out = []
    for folder, (proj, num) in sorted(folders.items()):
        if num < ssc.SINCE_FEATURE:
            continue
        texts = {k: now.read(f"{folder}/{k}.md") for k in ssc.KINDS}
        spec = texts["spec"]
        if spec is None or str(_fm.scalars(spec).get("lane", "")).strip().casefold() != "fast" or not _closed(spec):
            continue
        old = before.read(f"{folder}/spec.md")
        if old is not None and _closed(old):
            continue
        fid = re.match(r"(F\d+)-", folder.rsplit("/", 1)[-1]).group(1)
        out.append({"folder": folder, "proj": proj, "fid": fid, "num": num, "texts": texts})
    return out


def _folders(paths):
    found = {}
    for p in paths:
        m = FEATURES.match(p)
        if m:
            found[f"{m.group('proj')}docs/specs/features/{m.group('dir')}"] = (m.group("proj"), int(m.group("num")))
    return found


def _names(top, *args):
    r = _git.run(top, *args)
    if r.code != 0:
        raise NotEvaluable(f"git {args[0]} saiu {r.code}: {(r.err or r.out).strip()[:160]}")
    return [x for x in r.out.split("\0") if x]


def staged(top):
    """The pre-commit: what the INDEX takes to Done, against HEAD; the feature's commits from HEAD plus what is staged."""
    names = _names(top, "diff", "--cached", "--name-only", "--diff-filter=AMR", "-z")
    has_head = _git.run(top, "rev-parse", "--verify", "-q", "HEAD").code == 0
    now = Source(top)
    before = Source(top, "HEAD") if has_head else _Nothing()
    features = _closing(_folders(names), now, before)
    # a merge commit (UAT-439, F147): the diff against HEAD carries what the OTHER parent brought, and a feature it closed has its step in
    # ITS commits, not in the diff of the merge. Judged like `--branch` does: by the commits of the other parent. The feature this branch
    # itself closes (not closed on the other side) keeps the rule of any commit. An octopus merge (several MERGE_HEADs) is judged as before.
    merging = has_head and _git.run(top, "rev-parse", "--verify", "-q", "MERGE_HEAD").code == 0
    other_side = set()
    if merging:
        theirs = Source(top, "MERGE_HEAD")
        other_side = {f["fid"] for f in features if _closed(theirs.read(f"{f['folder']}/spec.md") or "")}

    def touched_of(fid):
        if fid in other_side:
            return feature_paths(top, fid, "MERGE_HEAD") | feature_paths(top, fid, "HEAD")
        return (feature_paths(top, fid, "HEAD") if has_head else set()) | set(names)
    return now, before, features, touched_of


def branch(top, ref, base="HEAD"):
    """merge_train.py merge: what the branch takes to Done, against the base; the feature's commits from the branch."""
    if _git.run(top, "rev-parse", "--verify", "-q", f"{ref}^{{commit}}").code != 0:
        raise NotEvaluable(f"o ramo '{ref}' não existe")
    names = _names(top, "diff", "--name-only", "--diff-filter=AMR", "-z", f"{base}...{ref}")
    now, before = Source(top, ref), Source(top, base)
    return now, before, _closing(_folders(names), now, before), (lambda fid: feature_paths(top, fid, ref))


class _Nothing:
    def read(self, rel):
        return None


def check(top, mode, ref=None, base="HEAD"):
    """[(feature, missing, unchecked)] for every fast-lane feature going to Done in `mode` ('staged' | 'branch')."""
    now, before, features, touched_of = staged(top) if mode == "staged" else branch(top, ref, base)
    if not features:
        return []
    revs = [ref] if mode == "branch" else [r for r in ("HEAD", "MERGE_HEAD") if _git.run(top, "rev-parse", "--verify", "-q", r).code == 0]
    fingers = read_touch_ids(top, revs) if revs else []
    # the rule is read from the copy BEFORE the change (HEAD, the base): a commit or a branch does not loosen its own gate; only a
    # repository whose base has no registry yet reads it from the judged copy
    try:
        rows = load_registry(before)
    except NoRegistry:
        rows = load_registry(now)
    shapes = load_shapes(now)
    out = []
    for f in features:
        missing, unchecked = judge(f, rows, touched_of(f["fid"]), now, shapes, screen_globs(now, f["proj"]), fingers)
        out.append((f, missing, unchecked))
    return out


# ---- the report -----------------------------------------------------------------------------------------------------------------
def report(results, where):
    """Prints what is missing per feature (and what the machine did not judge); returns the exit code."""
    bad = 0
    for f, missing, unchecked in results:
        if missing:
            bad += 1
            print(f"  ✗ {f['folder']}: vai a Done pela via rápida sem o passo retroativo completo ({len(missing)} falta(s)):")
            for row, msg in missing:
                print(f"      - [{row['id']} · {row['name']}] {msg}")
        else:
            print(f"  ✓ {f['folder']}: o passo retroativo confere com o registro")
        judged = [row["name"] for row, why in unchecked
                  if (row.get("retro_check") or {}).get("by") != "sensor" and not why.startswith(NOT_APPLICABLE)]
        moot = [(row["name"], why) for row, why in unchecked if why.startswith(NOT_APPLICABLE)]
        others = [f"{row['name']} ({row['retro_check']['sensor']})" for row, why in unchecked if (row.get("retro_check") or {}).get("by") == "sensor"]
        if judged:
            print(f"      confira você (a máquina não sabe se a condição valeu): {' · '.join(judged)}")
        if others:
            print(f"      outro sensor confere: {' · '.join(others)}")
        if moot:
            print(f"      {moot[0][1]}: {' · '.join(name for name, _ in moot)}")
    if bad:
        print(f"retro_step_check: {bad} feature(s) da via rápida {where} sem o passo retroativo. Como sanar: faça cada linha acima no "
              f"próprio ramo, antes deste passo (a `mjrp-syncing-docs`, § the fast lane's retroactive step); a lista vem do registro "
              f"`{REGISTRY}` (campo retro; a página `{MAP_PAGE}`), não deste aviso.")
        return 1
    return 0


def main(argv):
    args = list(argv)
    mode, ref, base = None, None, "HEAD"
    if "--staged" in args:
        mode = "staged"
        args.remove("--staged")
    if "--branch" in args:
        i = args.index("--branch")
        mode, ref = "branch", (args[i + 1] if i + 1 < len(args) else None)
        del args[i:i + 2]
    if "--base" in args:
        i = args.index("--base")
        base = args[i + 1] if i + 1 < len(args) else "HEAD"
        del args[i:i + 2]
    if mode is None or len(args) != 1 or (mode == "branch" and not ref):
        print("uso: retro_step_check.py <raiz> --staged | --branch REF [--base REF]", file=sys.stderr)
        return 2
    try:
        top = _git.toplevel(args[0])
        if top is None:
            raise NotEvaluable(f"{args[0]}: não é um repositório git")
        results = check(top, mode, ref, base)
    except NoRegistry as exc:
        print(f"retro_step_check: {exc}; o passo retroativo NÃO foi conferido (este repositório não versiona o registro)", file=sys.stderr)
        return 0
    except (NotEvaluable, _git.GitError) as exc:
        print(f"retro_step_check: {exc} - não avaliável", file=sys.stderr)
        return 2
    return report(results, "do commit" if mode == "staged" else f"do ramo {ref}")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
