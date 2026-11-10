#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
# GENERATED - do not edit (GERADO - não edite). Edit the fragments in mjrp-scripts/conformance/ and run
# `python3 mjrp-scripts/gen_conformance_check.py`; the sensor `--check` fails when this file drifts from them.
"""
conformance_check.py - the canonical conformance of the children (ADR-0019): catalog x child project.

Born 2026-10-13 (fin-control gap audit): the bootstrap installed the KERNEL in the fin-control, the doctor stayed
green, and yet the canonical artifacts of Discovery (info-arch.md, a design system that declares themes, a ROADMAP in
Now/Next/Later with outcomes, uat@2, `screen:` + `sensors.visual`) were never built. Nothing compared a child with
what the harness now calls canonical, so a standard that evolves in the harness reached the children only if somebody
remembered. This module is that comparison - and the gate that makes the harness write the migration note when the
standard changes.

Pieces (names fixed by ADR-0019 § Nomes), all stdlib:
  - the CATALOG, mjrp-scripts/canonical_catalog.json: items (id, version, title, path, applies_to, since, grace_days,
    born_of, owner_skill, check, migration, template, pattern_sources, pattern_digest, superseded), pattern_carriers,
    not_canonical, history. `title` (the Portuguese label of the message) is the one key added to the ADR's list;
  - the CHECK: one clause, a list of clauses (all), or {"any": [...]} (some); nestable. Clause kinds are a closed set
    with closed parameters: exists, glob, contains, frontmatter_key, contract_key, name_pattern, delegated, script
    (2026-10-14 19:57, decision of the MJRP: the fin-control Board came out empty and no declarative clause can say
    "the Control Center renders this product" - `script` runs a stdlib sensor that lives next to this file, vendored
    with it, on the project: exit 0 passes, 1 is a gap with its first lines, 2 is "não avaliável");
  - the MIGRATION NOTES, mjrp-scripts/migrations/CM-NNNN-<slug>.md: one per version step (from -> to), a chain, immutable;
    frontmatter only id, item, from, to;
  - the child's contract `conformance:` -> applied: [CM-...], received: {"<item>@<version>": date} (stamped only by
    new_project.py --refresh-kernel; none in a project that reads the kernel in place, ADR-0020 D.2), waived: [{item, reason, until}];
  - the LEARN GATE (--learn-gate, a sensor of the harness contract run by the doctor's A1): runs each item's check against
    its owning template, hashes the pattern sources that are not templates, and checks the catalog is whole.

Severity: a gap is a warning until max(since, received) + grace_days, an error after; a note listed in `applied` whose
check (of the version it targeted) fails is an error at once; "not evaluable" is never a pass. Waivers and editorial
rebaselines are the human's valves: they only count with the commit trailers `Conformance-waiver:` and
`Catalog-editorial:`, which the commit-msg hook refuses next to an agent's Co-Authored-By. The acceptance of a feature (CC-ADR-0024,
which amends ADR-0019 section 2) is a third valve: `Human-accepted:` and `Human-reopened:`, refused the same way.
The order of the features that did not start (CC-ADR-0029) is a fourth: `Human-prioritized:`.

The triage of the templates (CC-ADR-0014 / CC-ADR-0016 of the Control Center, 2026-10-14): the catalog may carry the agent's
queue `awaiting_item` and `awaiting_max_days`; the Learn gate lets the queue stand for its carrier only briefly (a row
warns from day 1 and is an ERROR after `awaiting_max_days`, default 2 - the queue is the agent's obligation, 2026-10-17),
keeps the lists disjoint and ties the human's stamp to the commit that introduced each batch; a CHILD reading a catalog
whose queue is not empty is judging against an incomplete criterion: `<project>` exits 2 with «catálogo incompleto» and
the conform cannot close (the item is born in the harness); and CATALOG_API = 1 versions
the three functions the Control Center's single adapter calls - `catalog_view`, `apply_marks`, `return_marks` (all pure:
bytes in, bytes or refusals out; the human commits). The doctor's I6 asks for `.mjrp/conformance_state.json`
(`conformance_state@1`) through `write_conformance_state`.

Usage:
  python3 conformance_check.py <project> [--gaps] [--pending] [--strict] [--json]     (--strict: the conform's exit criterion)
  python3 conformance_check.py <project> --write-state
  python3 conformance_check.py . --learn-gate
  python3 conformance_check.py . --rebaseline <item>
  python3 conformance_check.py --check-msg <commit-message-file>        (the commit-msg hook)
Exit: 0 conforms · 1 an overdue gap, or an invalid catalog / failing learn gate · 2 not evaluable (including an
incomplete catalog: the criterion itself is missing items, which the child cannot fix).
"""
import fnmatch
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

# SELF-CONTAINED ON PURPOSE (F73, 2026-10-25): the Control Center loads THIS file by path, hashes its bytes and execs them
# (adapters/kernel_catalog/loader.py; CC-ADR-0014 section 5), and its tests copy it alone into a throwaway root. So it imports no
# sibling module at module level and keeps its own small git and clock helpers (`_git`, `_brasilia_now`): the F73 common modules
# (`_git.py`, `_clock.py`) are not available there. The lazy imports below (inside functions, after `sys.path.insert(0, HERE)`)
# are for the command line only, where the siblings exist. The source lives in mjrp-scripts/conformance/*.py (fragments, one
# namespace) and gen_conformance_check.py concatenates them into this ONE file (F73 TASK-02b, plan A): the loader still reads and
# hashes a single file, so the guarantee "the hash is of the code that runs" holds.
HERE = Path(__file__).resolve().parent
CATALOG_FILE = HERE / "canonical_catalog.json"
NOTES_DIR = HERE / "migrations"
ROOT_OF_SOURCE = HERE.parent          # where templates and pattern_sources resolve: the harness checkout
CATALOG_REL = "mjrp-scripts/canonical_catalog.json"

ITEM_FIELDS = ("id", "version", "title", "path", "applies_to", "since", "check", "pattern_sources", "pattern_digest",
               "migration", "owner_skill", "born_of")
WHEN_STATIC = ("always", "has_screen")
NOTE_SECTIONS = ("## Por que", "## O que muda", "## O que o filho faz", "## Como se confere", "## Quando não se aplica")
MIGRATION_ID = re.compile(r"^CM-\d{4}$")
SKILL_NAME = re.compile(r"^mjrp-[a-z0-9]+(?:-[a-z0-9]+)*$")
MAX_WAIVER_DAYS = 90
MAX_WAIVER_COMMITS = 2                # the waiver and one renewal; the third is ignored
TRAILER_WAIVER, TRAILER_EDITORIAL = "Conformance-waiver", "Catalog-editorial"
TRAILER_ACCEPTED, TRAILER_REOPENED = "Human-accepted", "Human-reopened"   # CC-ADR-0024: the human's acceptance of a feature, and its inverse
TRAILER_PRIORITIZED = "Human-prioritized"   # CC-ADR-0029: the human's order of the features that did not start
TRAILER_PASSKEY = "Human-passkey"   # CC-ADR-0038: a key of the remote approval enrolled or revoked, or a lost note acknowledged
AGENT_SIGNATURE = re.compile(r"^Co-Authored-By:.*(claude|anthropic|codex|gemini|copilot|cursor|gpt|openai)", re.I | re.M)

# clause kind -> (required, optional); a parameter outside both is an invalid catalog
CLAUSES = {
    "exists": ({"paths"}, set()),
    "glob": ({"pattern"}, {"min"}),
    "contains": ({"pattern"}, {"path", "paths", "label", "min"}),
    "frontmatter_key": ({"glob", "key"}, {"min", "if", "label"}),
    "contract_key": ({"key"}, set()),
    "name_pattern": ({"glob"}, {"regex", "deny_words", "deny_suffixes", "allow_words", "skip", "label"}),
    "delegated": ({"code", "requires"}, set()),
    "script": ({"script"}, {"label"}),
}
# --- the triage of the templates and the marking of the batch (CC-ADR-0014 / CC-ADR-0016 of the Control Center) ---
CATALOG_API = 1                       # the API the Control Center's single adapter calls: catalog_view, apply_marks, return_marks
MAX_MARKS = 50                        # a batch carries 1..50 marks (the screen's limit, enforced here so it lives once)
AWAITING_MAX_DAYS_DEFAULT = 2         # a queue row older than this is an ERROR; younger ones warn from day 1.
# Was 14 days and warning-only (the MJRP, 2026-10-14 14:43) until the incident of 2026-10-16/17: 36 templates declared
# canonical sat in the queue, nobody turned them into items, and a child's conform closed without arch.md.
BATCH_RE = re.compile(r"^\d{8}-\d{6}-[0-9a-f]{8}$")
MARKED_AT_RE = re.compile(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$")
VERDICTS = ("canonical", "not_canonical")
VERDICT_PT = {"canonical": "canônico", "not_canonical": "não canônico"}     # the word the human reads, the commit trailer's too
REASON_MIN, REASON_MAX = 3, 200
STATE_SCHEMA = "conformance_state@1"
STATE_REL = ".mjrp/conformance_state.json"

SCRIPT_NAME = re.compile(r"^[a-z0-9_]+\.py$")      # a file next to this one, never a path: the clause cannot reach outside
SCRIPT_TIMEOUT = 120
# F71 R9: the deadline of a git call that had none (the history reads of the catalog). Expiry reads as "git cannot answer":
# not evaluable, never approval. The calls that already carried their own `timeout=` keep it.
GIT_TIMEOUT = 60
SCRIPT_LINES = 3


class Unknown(Exception):
    """A check that cannot tell. Reported as "não avaliável" - an unknown is never a pass."""


class ScriptUnknown(Unknown):
    """A `script` clause that could not run (script missing, crashed, timed out, exit 2): the child cannot tell whether it
    conforms. Unlike the other unknowns this one is a WARNING in the I6 - the obligation is real and unjudged, and a note
    would leave the child silent for as long as the script stays broken (verification 2026-10-14 P2-4)."""


class CatalogError(Exception):
    pass

# ---------------------------------------------------------------- check shape --------------------------------

def validate_check(check, where="check"):
    """Raises CatalogError for an unknown kind, a missing or extra parameter, or a regex that does not compile."""
    if isinstance(check, list):
        if not check:
            raise CatalogError(f"{where}: lista de cláusulas vazia")
        for c in check:
            validate_check(c, where)
        return
    if not isinstance(check, dict):
        raise CatalogError(f"{where}: cláusula deve ser objeto ou lista")
    if "any" in check:
        if set(check) != {"any"} or not isinstance(check["any"], list) or not check["any"]:
            raise CatalogError(f"{where}: `any` é uma lista não vazia e a única chave")
        for c in check["any"]:
            validate_check(c, where)
        return
    kind = check.get("kind")
    if kind not in CLAUSES:
        raise CatalogError(f"{where}: kind '{kind}' fora de {', '.join(CLAUSES)}")
    req, opt = CLAUSES[kind]
    keys = set(check) - {"kind"}
    if req - keys:
        raise CatalogError(f"{where}: {kind} sem {', '.join(sorted(req - keys))}")
    if keys - req - opt:
        raise CatalogError(f"{where}: {kind} com parâmetro desconhecido {', '.join(sorted(keys - req - opt))}")
    if kind == "contains" and not (("path" in check) ^ ("paths" in check)):
        raise CatalogError(f"{where}: contains leva `path` ou `paths`")
    if kind == "name_pattern" and not (check.get("regex") or check.get("deny_words") or check.get("deny_suffixes")):
        raise CatalogError(f"{where}: name_pattern leva ao menos `regex`, `deny_words` ou `deny_suffixes`")
    if kind == "name_pattern" and check.get("allow_words") and not (check.get("deny_words") or check.get("deny_suffixes")):
        raise CatalogError(f"{where}: name_pattern com `allow_words` e sem o que negar (`deny_words`/`deny_suffixes`)")
    for rx in (check.get("pattern") if kind in ("contains",) else None, check.get("regex")):
        if rx:
            try:
                re.compile(rx)
            except re.error as e:
                raise CatalogError(f"{where}: regex não compila ({e})")
    if kind == "script" and not SCRIPT_NAME.match(str(check["script"])):
        raise CatalogError(f"{where}: script é o nome de um arquivo .py ao lado do conformance_check.py, não um caminho")
    if kind == "delegated":
        if not check["requires"]:
            raise CatalogError(f"{where}: delegated sem `requires`")
        validate_check(check["requires"], where)


# ---------------------------------------------------------------- catalog ------------------------------------

def load_catalog(path=None, with_meta=False):
    """The validated catalog: a list of items (`since` as date, `_raw` the item as written). Raises CatalogError.
    With with_meta, returns (items, raw_document)."""
    path = Path(path) if path else CATALOG_FILE
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise CatalogError(f"catálogo ausente: {path}")
    except json.JSONDecodeError as e:
        raise CatalogError(f"catálogo ilegível ({path.name}): {e}")
    out = _catalog_from_doc(raw)
    return (out, raw) if with_meta else out


def _catalog_from_doc(raw):
    """The validated items of an already parsed catalog document (the body of load_catalog). Raises CatalogError."""
    items = raw.get("items") if isinstance(raw, dict) else None
    if not isinstance(items, list) or not items:
        raise CatalogError("catálogo sem a lista `items`")
    default_grace = raw.get("default_grace_days", 30)
    seen, migrations, out = set(), set(), []
    for it in items:
        iid = it.get("id", "?") if isinstance(it, dict) else "?"
        missing = [f for f in ITEM_FIELDS if not (isinstance(it, dict) and f in it and it[f] not in (None, ""))]
        if missing:
            raise CatalogError(f"item '{iid}': faltam campos {', '.join(missing)}")
        if iid in seen:
            raise CatalogError(f"id repetido: {iid}")
        seen.add(iid)
        if not MIGRATION_ID.match(str(it["migration"])) or it["migration"] in migrations:
            raise CatalogError(f"item '{iid}': migration '{it['migration']}' fora do formato CM-NNNN ou repetida")
        migrations.add(it["migration"])
        grace = it.get("grace_days", default_grace)
        if not isinstance(it["version"], int) or not isinstance(grace, int):
            raise CatalogError(f"item '{iid}': version e grace_days são inteiros")
        ap = it["applies_to"]
        if not isinstance(ap, dict) or not isinstance(ap.get("profiles"), list):
            raise CatalogError(f"item '{iid}': applies_to precisa de `profiles` (lista)")
        when = ap.get("when", "always")
        if when not in WHEN_STATIC and not when.startswith("has_path:"):
            raise CatalogError(f"item '{iid}': applies_to.when '{when}' fora de always · has_screen · has_path:<caminho>")
        if it.get("max_severity") not in (None, "warning"):
            raise CatalogError(f"item '{iid}': max_severity só pode ser 'warning'")
        js = it.get("judge_skill")
        if js is not None and not (isinstance(js, str) and SKILL_NAME.match(js)):
            raise CatalogError(f"item '{iid}': judge_skill é o nome de uma skill (mjrp-...) ou null (só a forma)")
        validate_check(it["check"], f"item '{iid}'")
        sup = it.get("superseded", [])
        if not isinstance(sup, list):
            raise CatalogError(f"item '{iid}': superseded é lista")
        for s in sup:
            if not isinstance(s, dict) or "version" not in s or "check" not in s:
                raise CatalogError(f"item '{iid}': superseded precisa de version e check")
            validate_check(s["check"], f"item '{iid}' superseded v{s['version']}")
            migrations.add(s.get("migration") or "")
        if not isinstance(it["pattern_sources"], list) or not isinstance(it["pattern_digest"], dict):
            raise CatalogError(f"item '{iid}': pattern_sources é lista e pattern_digest é mapa caminho → hash")
        try:
            since = date.fromisoformat(str(it["since"]))
        except ValueError:
            raise CatalogError(f"item '{iid}': since '{it['since']}' não é AAAA-MM-DD")
        item = dict(it)
        item["since"] = since
        item["grace_days"] = grace
        item["superseded"] = sup
        item["_raw"] = it
        out.append(item)
    _validate_triage_lists(raw)
    return out


def _validate_triage_lists(raw):
    """The triage keys (CC-ADR-0014 § 5, § 7): `not_canonical` rows may carry `marked_at` + `batch` (both or neither);
    `awaiting_item` rows (the agent's queue, default `[]`) carry path, reason, marked_at and batch; `awaiting_max_days`
    (default 14) is a positive integer. A catalog without these keys is valid - the defaults stand in."""
    def stamped(row, where, required):
        if not isinstance(row, dict) or not isinstance(row.get("path"), str) or not row["path"]:
            raise CatalogError(f"{where}: linha sem `path`")
        if not isinstance(row.get("reason"), str) or not row["reason"]:
            raise CatalogError(f"{where}: {row['path']} sem `reason`")
        has = [k for k in ("marked_at", "batch") if k in row]
        if has and len(has) != 2:
            raise CatalogError(f"{where}: {row['path']} tem {has[0]} sem {'batch' if has[0] == 'marked_at' else 'marked_at'}")
        if required and not has:
            raise CatalogError(f"{where}: {row['path']} sem `marked_at` e `batch`")
        if has:
            if not (isinstance(row["marked_at"], str) and MARKED_AT_RE.match(row["marked_at"])):
                raise CatalogError(f"{where}: {row['path']} com marked_at fora de AAAA-MM-DD HH:MM")
            if not (isinstance(row["batch"], str) and BATCH_RE.match(row["batch"])):
                raise CatalogError(f"{where}: {row['path']} com batch fora de AAAAMMDD-HHMMSS-<8 hex>")
    nc = raw.get("not_canonical", [])
    if not isinstance(nc, list):
        raise CatalogError("not_canonical é lista")
    for row in nc:
        stamped(row, "not_canonical", False)
    aw = raw.get("awaiting_item", [])
    if not isinstance(aw, list):
        raise CatalogError("awaiting_item é lista")
    for row in aw:
        stamped(row, "awaiting_item", True)
    mx = raw.get("awaiting_max_days", AWAITING_MAX_DAYS_DEFAULT)
    if not isinstance(mx, int) or isinstance(mx, bool) or mx < 1:
        raise CatalogError("awaiting_max_days é um inteiro positivo")


def awaiting_rows(doc):
    """The agent's queue of a loaded catalog document: `awaiting_item` (default `[]`)."""
    return list((doc or {}).get("awaiting_item") or [])


def awaiting_max_days(doc):
    """How old a queue row may get before the Learn gate fails (default 2 days; younger rows warn from day 1)."""
    return (doc or {}).get("awaiting_max_days", AWAITING_MAX_DAYS_DEFAULT)


def find_catalog(root):
    """The catalog a project is judged by: the copy in its own mjrp-scripts/, or - for a nested project that has none -
    the one of the repository it lives in (nearest parent). None when there is none."""
    p = Path(root).resolve()
    for d in [p, *p.parents]:
        if (d / "mjrp-scripts" / "canonical_catalog.json").is_file():
            return d / "mjrp-scripts" / "canonical_catalog.json"
    return None


def catalog_behind(child_items, source_items):
    """The `id@version` the source catalog has and the child's catalog has not received (a higher version, or an item
    the child's copy does not list at all). Sorted. Empty when the child is up to date.
    2026-10-19: MJRPpersonal carried a catalog that stopped at adr-names@2 while the source was at @3; `--pending` printed
    "0 nota(s) pendente(s)" because a stale catalog can only list the notes it already knows."""
    have = {it["id"]: it["version"] for it in child_items}
    return sorted(f"{it['id']}@{it['version']}" for it in source_items if have.get(it["id"], 0) < it["version"])


def behind_source(catalog_path):
    """`catalog_behind` of a child's catalog file against THIS harness's catalog (the source, when the reader runs from
    the harness). None when there is nothing to compare (the file is the source's own - a child running its vendored
    reader - or one of them cannot be read: the unreadable catalog has its own message); a list otherwise."""
    try:
        if Path(catalog_path).resolve() == CATALOG_FILE.resolve():
            return None
        return catalog_behind(load_catalog(catalog_path), load_catalog(CATALOG_FILE))
    except CatalogError:
        return None


def is_source():
    """True when this reader runs from the harness itself (new_project.py is not vendored into the children)."""
    return (HERE / "new_project.py").is_file()


def harness_valid(d):
    d = Path(d)
    return (d / CATALOG_REL).is_file() and (d / "mjrp-scripts" / "new_project.py").is_file() and (d / "docs" / "wiki" / "kernel").is_dir()


def _real_root(root):
    """The folder a (possibly linked-worktree) checkout belongs to: the working tree that owns the git directory."""
    try:
        r = subprocess.run(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], cwd=root, capture_output=True,
                           text=True, timeout=20)
        if r.returncode == 0 and r.stdout.strip():
            g = Path(r.stdout.strip())
            if g.name == ".git":
                return g.parent
    except Exception:
        pass
    return Path(root)


def find_harness(root, cfg):
    """The root of the harness a child is to be judged against, or None. 2026-10-19 (MJRP Personal: the conform ran the child's
    vendored reader on the child's own stale catalog and closed green): a reader that lives in the child needs to FIND the
    source. Order: the env `MJRP_HARNESS_ROOT` (an explicit override), the contract's `harness_root:` (absolute or relative; written by
    `--refresh-kernel`), the
    repository above a nested project, then the sibling folders of the project - and of the repository a linked worktree
    belongs to. Only a folder that really is the harness (catalog + new_project.py + kernel) counts."""
    if is_source():
        return ROOT_OF_SOURCE
    root = Path(root).resolve()
    cands = []
    if os.environ.get("MJRP_HARNESS_ROOT"):
        cands.append(Path(os.environ["MJRP_HARNESS_ROOT"]).expanduser())
    declared = (cfg or {}).get("harness_root")
    if declared:
        d = Path(str(declared)).expanduser()
        cands.append(d if d.is_absolute() else root / d)
    cands += list(root.parents)
    bases = []
    for r in (root, _real_root(root)):
        if r.parent not in bases:
            bases.append(r.parent)
    for b in bases:
        try:
            cands += sorted((c for c in b.iterdir() if c.is_dir()), key=lambda c: (c.name != "mjrp-harness", c.name))
        except OSError:
            pass
    for c in cands:
        if harness_valid(c):
            return c.resolve()
    return None


def harness_catalog(h):
    """(items, where it was read) of the harness `h`. A harness found from a child is read from its `main` branch (git show), not from
    whatever branch its checkout is on: a checkout on an old branch made a stale child look fresh (review P2-2). The source itself,
    and a folder that is not a git repository of its own (a fixture), are read from the file."""
    h = Path(h)
    if h.resolve() != ROOT_OF_SOURCE.resolve():
        try:
            top = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=h, capture_output=True, text=True, timeout=20)
            if top.returncode == 0 and Path(top.stdout.strip()).resolve() == h.resolve():
                r = subprocess.run(["git", "show", f"main:{CATALOG_REL}"], cwd=h, capture_output=True, text=True, timeout=30)
                if r.returncode == 0:
                    with tempfile.TemporaryDirectory() as t:
                        f = Path(t) / "canonical_catalog.json"
                        f.write_text(r.stdout, encoding="utf-8")
                        return load_catalog(f), "ramo main"
        except (OSError, subprocess.SubprocessError):
            pass
    return load_catalog(h / CATALOG_REL), "arquivo do checkout"


def compare_with_harness(root, cfg, catalog):
    """How the child's catalog stands against the harness's: {"state": fresh|behind|unreachable, "behind": [...],
    "harness": path|None, "read_from": ...}. `fresh` also when the catalog IS the harness's (the source itself, or a nested project).
    There is no way to switch the comparison off (2026-10-20, the MJRP): the fixtures point `MJRP_HARNESS_ROOT` at a harness built in
    the temp folder, like the real flow does."""
    h = find_harness(root, cfg)
    if h is None:
        res = {"state": "unreachable", "behind": [], "harness": None}
    else:
        try:
            if Path(catalog).resolve() == (h / CATALOG_REL).resolve():
                res = {"state": "fresh", "behind": [], "harness": str(h)}
            else:
                src, where = harness_catalog(h)
                behind = catalog_behind(load_catalog(catalog), src)
                res = {"state": "behind" if behind else "fresh", "behind": behind, "harness": str(h), "read_from": where}
        except CatalogError:
            res = {"state": "unreachable", "behind": [], "harness": str(h)}
    return res


def behind_message(behind, strict=False):
    head = f"catálogo defasado em {len(behind)} item(ns): {', '.join(behind)}; rode --refresh-kernel"
    return head + (" — o conform não fecha contra um critério velho" if strict else
                   " — as notas pendentes que ele lista são só as que conhece; rode "
                   "`python3 <harness>/mjrp-scripts/new_project.py <esta pasta> --refresh-kernel`")


UNREACHABLE_MESSAGE = ("não avaliável: harness não encontrado — o leitor não sabe se este catálogo está em dia; declare `harness_root:` "
                       "no contrato (ou MJRP_HARNESS_ROOT) e rode de novo")


def _source_text(spec, base):
    """`path` or `path#Heading`: the whole file, or the section that starts at that heading line (up to the next one
    of the same or a higher level). A source that is not there is None."""
    rel, _, head = spec.partition("#")
    p = Path(base) / rel
    if not p.is_file():
        return None
    text = p.read_text(encoding="utf-8", errors="replace")
    if not head:
        return text
    lines = text.splitlines()
    for i, l in enumerate(lines):
        m = re.match(r"^(#+)\s+(.*)$", l)
        if m and m.group(2).strip().lower() == head.strip().lower():
            level, out = len(m.group(1)), [l]
            for l2 in lines[i + 1:]:
                m2 = re.match(r"^(#+)\s", l2)
                if m2 and len(m2.group(1)) <= level:
                    break
                out.append(l2)
            return "\n".join(out)
    return None


def source_digest(spec, base=None):
    t = _source_text(spec, base or ROOT_OF_SOURCE)
    return None if t is None else "sha256:" + hashlib.sha256(t.encode("utf-8")).hexdigest()


def _scripts_of(check):
    """The `script` names a check runs, at any depth."""
    if isinstance(check, list):
        return [n for c in check for n in _scripts_of(c)]
    if "any" in check:
        return _scripts_of(check["any"])
    if check.get("kind") == "delegated":
        return _scripts_of(check["requires"])
    return [check["script"]] if check.get("kind") == "script" else []


def _source_of(spec):
    """The file a pattern source names (`path#Heading` -> `path`)."""
    return str(spec).partition("#")[0]


def _list_overlaps(items, doc):
    """CC-ADR-0014 § 7, the disjoint lists: a path in more than one of `not_canonical`, `awaiting_item` and
    (`template` ∪ `pattern_sources`) - or twice in the same list - is a problem. Returns the problem lines."""
    owners = {}
    for it in items:
        for spec in ([it["template"]] if it.get("template") else []) + list(it["pattern_sources"]):
            owners.setdefault(_source_of(spec), set()).add(f"item {it['id']}")
    where = {}
    for name in ("not_canonical", "awaiting_item"):
        for row in doc.get(name) or []:
            where.setdefault(row["path"], []).append(name)
    for path, ids in owners.items():
        if path in where:
            where[path] += sorted(ids)
    out = []
    for path in sorted(where):
        if len(where[path]) > 1:
            out.append(f"{path} está em mais de uma lista ({', '.join(where[path])}) — um modelo é de um item, ou não canônico, "
                       f"ou espera o agente na fila: uma lista só")
    return out


def _queue_findings(doc, now):
    """The agent's queue is the AGENT's obligation (the incident of 2026-10-16/17: 36 templates declared canonical sat in
    `awaiting_item`, the gate counted the queue as coverage and only warned after 14 days, and a child's conform closed
    without arch.md). Returns (errors, warnings): every queue row warns from day 1; a row older than `awaiting_max_days`
    (default 2) is an ERROR - it changes the exit of the gate. The queue is no longer a silent coverage."""
    limit, errors, warnings = awaiting_max_days(doc), [], []
    for row in awaiting_rows(doc):
        age = (now - datetime.strptime(row["marked_at"], "%Y-%m-%d %H:%M")).days
        if age > limit:
            errors.append(f"{row['path']} espera o agente há {age} dia(s) na fila `awaiting_item` (limite {limit}; marcada em "
                          f"{row['marked_at']}, lote {row['batch']}) — modelo declarado canônico sem item no catálogo: crie o "
                          f"item, a nota de migração e o check (a fila é obrigação do agente, não um backlog)")
        else:
            warnings.append(f"{row['path']} está na fila `awaiting_item` do agente (marcada em {row['marked_at']}, lote "
                            f"{row['batch']}; vira erro depois de {limit} dia(s)) — crie o item do catálogo")
    return errors, warnings


def incomplete_catalog(doc):
    """The paths of the canonical models that still have no catalog item (the queue `awaiting_item`); empty when the
    catalog is whole. A child cannot close a conform while this is not empty: the item is born in the harness."""
    return [r["path"] for r in awaiting_rows(doc) if isinstance(r, dict) and r.get("path")]


def incomplete_message(paths, limit=5):
    """The line the child reads (exit 2 of `--gaps`/`--pending`): the criterion itself is incomplete, not the child's work."""
    shown = ", ".join(paths[:limit]) + (f" e mais {len(paths) - limit}" if len(paths) > limit else "")
    return (f"catálogo incompleto: {len(paths)} modelos canônicos ainda sem item no harness ({shown}) — o conform não fecha; "
            f"o item nasce no harness. O filho não corrige isto: avise o MJRP e, quando o harness completar o catálogo, "
            f"rode `--refresh-kernel` e o conform de novo")

# ---------------------------------------------------------------- clauses ------------------------------------

def _dotted(cfg, key):
    cur = cfg
    for part in key.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def _frontmatter(text):
    m = re.match(r"---\n(.*?)\n---", text or "", re.S)
    return m.group(1) if m else ""


def _glob(root, pattern):
    return sorted(p for p in Path(root).glob(pattern) if p.is_file())


def c_exists(root, cfg, c):
    for rel in c["paths"]:
        p = Path(root) / rel
        if p.is_dir() if rel.endswith("/") else p.is_file():
            return []
    return [f"{' ou '.join(c['paths'])} ausente"]


def c_glob(root, cfg, c):
    n = len(_glob(root, c["pattern"]))
    return [] if n >= c.get("min", 1) else [f"nenhum arquivo em {c['pattern']}" if n == 0 else f"só {n} arquivo(s) em {c['pattern']}"]


def c_contains(root, cfg, c):
    paths = c.get("paths") or [c["path"]]
    present = [Path(root) / p for p in paths if (Path(root) / p).is_file()]
    if not present:
        return [f"{' ou '.join(paths)} ausente"]
    for p in present:
        if len(re.findall(c["pattern"], p.read_text(encoding="utf-8", errors="replace"), re.M)) >= c.get("min", 1):
            return []
    return [f"{' / '.join(paths)}: {c.get('label') or 'falta ' + c['pattern']}"]


def c_frontmatter_key(root, cfg, c):
    files = _glob(root, c["glob"])
    if len(files) < c.get("min", 1):
        return [f"nenhum arquivo em {c['glob']}"]        # an empty glob FAILS: nothing to carry the key is a gap
    cond = c.get("if")
    bad = []
    for p in files:
        fm = _frontmatter(p.read_text(encoding="utf-8", errors="replace"))
        if cond and not re.search(rf"^{re.escape(cond['key'])}:\s*{re.escape(str(cond['equals']))}\s*(#.*)?$", fm, re.M):
            continue
        if not re.search(rf"^{re.escape(c['key'])}:\s*\S", fm, re.M):
            bad.append(p.parent.name if p.name in ("spec.md", "plan.md", "tasks.md") else p.name)
    if not bad:
        return []
    return [f"{len(bad)} arquivo(s) de {c['glob']} sem `{c['key']}:` no frontmatter ({', '.join(bad[:4])}{'...' if len(bad) > 4 else ''})"]


def c_contract_key(root, cfg, c):
    return [] if _dotted(cfg, c["key"]) not in (None, "", [], {}) else [f"contrato sem `{c['key']}`"]


def _not_english_token(stem, deny, suffixes, allow):
    """The first token of a file stem that gives the name away as Portuguese, or None. Three signals, all deterministic:
    a character outside ASCII (a diacritic), a token in `deny_words` (whole word), a token that ends in one of
    `deny_suffixes` (the diacritic-free ending of Portuguese nouns: -cao, -dade, -mento) and is longer than the ending.
    `allow_words` are the English words the endings would catch by accident (memento, cacao); they win over both lists."""
    if any(ord(ch) > 127 for ch in stem):
        return next(ch for ch in stem if ord(ch) > 127)
    for token in re.split(r"[-_.\s]+", stem.lower()):
        if not token or token in allow:
            continue
        if token in deny or any(token.endswith(x) and len(token) > len(x) + 1 for x in suffixes):
            return token
    return None


def c_name_pattern(root, cfg, c):
    deny, skip = set(c.get("deny_words", [])), set(c.get("skip", []))
    suffixes, allow = tuple(c.get("deny_suffixes", [])), set(c.get("allow_words", []))
    rx = re.compile(c["regex"]) if c.get("regex") else None
    bad = []
    for p in _glob(root, c["glob"]):                     # an empty glob PASSES: there is no name to violate
        if p.name in skip:
            continue
        token = _not_english_token(p.stem, deny, suffixes, allow)
        if rx and not rx.match(p.name):
            bad.append(str(p.relative_to(root)))
        elif token:
            bad.append(f"{p.relative_to(root)} (`{token}`)")
    if not bad:
        return []
    return [f"{len(bad)} arquivo(s) com nome fora do padrão ou que não está em inglês: {', '.join(bad[:4])}{'...' if len(bad) > 4 else ''}"]


def c_script(root, cfg, c):
    """The sensor `c["script"]`, next to this file (vendored with it), run on the project: 0 passes; 1 is a gap - its
    first lines and the command for the whole list; 2, a crash or a missing script are Unknown (never a pass)."""
    path = HERE / c["script"]
    if not path.is_file():
        raise ScriptUnknown(f"{c['script']} ausente ao lado do conformance_check.py — rode `new_project.py <filho> --refresh-kernel`")
    try:
        p = subprocess.run([sys.executable, str(path), str(root), "--quiet"], capture_output=True, text=True,
                           timeout=SCRIPT_TIMEOUT)
    except (OSError, subprocess.TimeoutExpired) as e:
        raise ScriptUnknown(f"{c['script']} não rodou ({e.__class__.__name__})")
    if p.returncode == 0:
        return []
    if p.returncode == 1:
        lines = [l.strip() for l in p.stdout.splitlines() if l.strip()]
        head, detail = (lines[0] if lines else c["script"]), [l for l in lines[1:] if not l.startswith("[aviso]")][:SCRIPT_LINES]   # a warning is never the reason for a gap
        more = f"; lista inteira: `python3 mjrp-scripts/{c['script']} .`"
        return [f"{c.get('label') or head}: " + " | ".join(detail or [head]) + more]
    why = (p.stderr or p.stdout).strip().splitlines()
    raise ScriptUnknown(f"{c['script']} saiu {p.returncode}: {why[0] if why else 'sem mensagem'}")


LEAVES = {"exists": c_exists, "glob": c_glob, "contains": c_contains, "frontmatter_key": c_frontmatter_key,
          "contract_key": c_contract_key, "name_pattern": c_name_pattern, "script": c_script}


def run_check(check, root, cfg, delegated=None):
    """The reasons a check fails ([] = passes). `delegated` collects the codes of delegated clauses whose `requires` held."""
    if isinstance(check, list):
        out = []
        for c in check:
            out += run_check(c, root, cfg, delegated)
        return out
    if "any" in check:
        reasons = []
        for c in check["any"]:
            r = run_check(c, root, cfg, delegated)
            if not r:
                return []
            reasons += r
        return ["nenhuma das alternativas vale: " + " | ".join(reasons)]
    if check["kind"] == "delegated":
        r = run_check(check["requires"], root, cfg, delegated)
        if r:
            return [f"pré-condição de {check['code']} não vale: " + "; ".join(r)]
        if delegated is not None:
            delegated.append(check["code"])
        return []
    return LEAVES[check["kind"]](root, cfg, check)

# ---------------------------------------------------------------- notes and chains ---------------------------

def _note_fields(text):
    return {m.group(1): m.group(2).strip() for m in re.finditer(r"^(\w+):\s*(.*)$", _frontmatter(text), re.M)}


def read_notes(notes_dir=None):
    """Every note: [{id, item, from, to, path, text}]."""
    nd = Path(notes_dir) if notes_dir else NOTES_DIR
    out = []
    for p in sorted(nd.glob("CM-*.md")) if nd.is_dir() else []:
        text = p.read_text(encoding="utf-8")
        f = _note_fields(text)
        try:
            frm, to = int(f.get("from", "")), int(f.get("to", ""))
        except ValueError:
            frm = to = None
        out.append({"id": f.get("id"), "item": f.get("item"), "from": frm, "to": to, "path": p, "text": text})
    return out


def chain(item, notes):
    """The notes of one item, in order of `from`."""
    return sorted((n for n in notes if n["item"] == item["id"] and n["from"] is not None), key=lambda n: n["from"])


def check_of_version(item, version):
    if version == item["version"]:
        return item["check"]
    for s in item["superseded"]:
        if s["version"] == version:
            return s["check"]
    return None


def check_note(root, cfg, note_id, items, notes, gates=None):
    """(exit, text): the check of the version the note LEADS TO (its `to`), plus whether the item's current version
    passes - a note whose own check is stricter than the current one is satisfied by the current form (the conform
    mode then records the whole chain). Writes nothing.
    `gates` (the catalog's `open_warning_notes`): {note: sensor script}. For such a note a warning of that sensor is the WORK the
    note asks the conform to do, so the note is not satisfied while one is open - each warning is fixed, or its file recorded as a
    question to the MJRP in `conformance.asked` ({path, asked_at}, the stamp being a log entry that names the path: see
    `asked_entries`). An entry for a file that no longer warns is reported as stale (never silently ignored); a bad entry fails."""
    n = next((x for x in notes if x["id"] == note_id), None)
    if n is None:
        return 2, f"conformance_check: nota {note_id} não existe no catálogo deste projeto"
    it = next((i for i in items if i["id"] == n["item"]), None)
    chk = check_of_version(it, n["to"]) if it else None
    if chk is None:
        return 2, f"conformance_check: {note_id}: o catálogo não guarda o check de {n['item']}@{n['to']}"
    try:
        why = run_check(chk, root, cfg)
    except Unknown as e:
        return 2, f"{note_id} ({it['id']}@{n['from']}→{n['to']}): não avaliável — {e}"
    gates = {k: v for k, v in (gates or {}).items() if MIGRATION_ID.match(str(k)) and isinstance(v, str)}      # `_about` is prose
    script = gates.get(note_id)
    extra = []
    if script:
        try:
            warns = open_warnings(root, script)
            every = {f for s in set(gates.values()) for f, _ in (warns if s == script else open_warnings(root, s))}
        except Unknown as e:
            return 2, f"{note_id} ({it['id']}@{n['from']}→{n['to']}): não avaliável — {e}"
        asked = asked_entries(root, cfg)
        good = {e["path"] for e in asked if not e["problem"]}
        for e in asked:
            if e["problem"]:
                why = why + [f"conformance.asked: {e['path']}: {e['problem']}"]
        still = [w for f, w in warns if f not in good]
        recorded = [f for f, _ in warns if f in good]
        if still:
            shown = "; ".join(w for w in still[:3]) + (f"; e mais {len(still) - 3}" if len(still) > 3 else "")
            why = why + [f"{len(still)} aviso(s) de {script} em aberto — o conform os resolve (lê o relatório e escolhe o tipo) ou pergunta ao MJRP e "
                         f"registra cada arquivo em `conformance.asked: [{{path, asked_at}}]` (a hora de uma entrada do log que cita o arquivo): {shown}"]
        if recorded:
            extra.append(f"{len(recorded)} aviso(s) registrado(s) como pergunta ao MJRP em `conformance.asked` (o MJRP ainda não respondeu)")
        for e in asked:
            if not e["problem"] and e["path"] not in every:
                extra.append(f"[obsoleta] conformance.asked: {e['path']} já não avisa - tire a entrada do contrato (a pergunta foi respondida ou o arquivo mudou)")
    lines = [f"{note_id} ({it['id']}@{n['from']}→{n['to']}): " + ("passou" if not why else "reprovou — " + "; ".join(why))] + extra
    if n["to"] != it["version"]:
        try:
            cur = run_check(it["check"], root, cfg)
        except Unknown as e:
            cur = [f"não avaliável ({e})"]
        lines.append(f"versão atual ({it['id']}@{it['version']}): " + ("passou" if not cur else "reprovou — " + "; ".join(cur)))
    return (1 if why else 0), "\n".join(lines)


def pending(root, cfg, items=None, notes_dir=None, has_screen=None, today=None, trailer_commits=None):
    """Notes of the chain the child has not applied, in chain order. [(item, note_or_None)]. Never applies anything.
    An item that does not apply to the project (profile, process_level, `when`) has no pending note; an item is dropped
    only by a VALID waiver (the human's trailer found, within 90 days, at most one renewal) - not by a line in the contract.
    `has_screen` None keeps the screen items (cannot tell)."""
    items = items if items is not None else load_catalog()
    applied = (cfg.get("conformance") or {}).get("applied") or []
    today = today or date.today()
    notes = read_notes(notes_dir)
    out = []
    for it in items:
        if applies(it, cfg, root, has_screen) is False:
            continue
        if waiver_for(it, cfg, today, root, trailer_commits)[1]:
            continue
        ch = chain(it, notes)
        if not ch:
            out.append((it, None))
        out += [(it, n) for n in ch if n["id"] not in applied]
    return out


# ---------------------------------------------------------------- received stamp (refresh only) -------------

def stamp_received(contract_path, cfg, items, today, root, has_screen):
    """The ONLY writer of `conformance.received`: for each applicable <item>@<version> not yet in the map, today's date.
    Returns the keys stamped. Never rewrites an existing stamp, never touches `applied` or `waived`.
    A project that reads the kernel in place (ADR-0020 D.2) is never stamped: it receives nothing, the source holds it."""
    if kernel_in_repo(cfg):
        return []
    have = (cfg.get("conformance") or {}).get("received") or {}
    new = {f"{it['id']}@{it['version']}": today.isoformat() for it in items
           if applies(it, cfg, root, has_screen) is True and f"{it['id']}@{it['version']}" not in have}
    if not new:
        return []
    path = Path(contract_path)
    lines = path.read_text(encoding="utf-8").split("\n")
    entries = [f"      {k}: {v}" for k, v in new.items()]
    ci = next((i for i, l in enumerate(lines) if re.match(r"^  conformance:\s*(#.*)?$", l)), None)   # the key, with or without a comment
    if ci is None and any(re.match(r"^  conformance:\s*\S", l) and not re.match(r"^  conformance:\s*#", l) for l in lines):
        return []          # an inline map (or any value on the key's line) that we do not rewrite: never open a second block
    if ci is None:
        while lines and lines[-1] == "":
            lines.pop()
        lines += ["  conformance:                   # ADR-0019: applied = notas cumpridas; received = escrito só pelo --refresh-kernel; waived = dispensa do humano",
                  "    applied: []", "    received:"] + entries + [""]
    else:
        end = next((i for i in range(ci + 1, len(lines)) if lines[i].strip() and not lines[i].startswith("    ")), len(lines))
        ri = next((i for i in range(ci + 1, end) if re.match(r"^    received:", lines[i])), None)
        if ri is None:
            lines[ci + 1:ci + 1] = ["    received:"] + entries
        else:
            lines[ri] = "    received:"
            lines[ri + 1:ri + 1] = entries
    path.write_text("\n".join(lines), encoding="utf-8")
    return list(new)

# ---------------------------------------------------------------- evaluation ---------------------------------

def applies(item, cfg, root, has_screen):
    """True / False / None (cannot tell: the item needs the screen definition and the caller has none)."""
    ap = item["applies_to"]
    if cfg.get("profile") not in ap["profiles"]:
        return False
    if ap.get("process_levels") and cfg.get("process_level") and cfg.get("process_level") not in ap["process_levels"]:
        return False
    when = ap.get("when", "always")
    if when == "has_screen":
        return has_screen
    if when.startswith("has_path:"):
        rel = when.split(":", 1)[1]
        return any(Path(root).glob(rel)) if any(ch in rel for ch in "*?[") else (Path(root) / rel).exists()
    return True


def _as_date(v):
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    try:
        return date.fromisoformat(str(v))
    except ValueError:
        return None


def kernel_in_repo(cfg):
    """ADR-0020 D.2: a project nested in the harness repository reads the kernel in place (`kernel: {source: in-repo}`):
    it receives nothing, so it has no `received` stamp - the grace of every item counts from the item's own `since`."""
    k = (cfg or {}).get("kernel")
    return isinstance(k, dict) and str(k.get("source") or "").strip() == "in-repo"


def received_date(item, cfg):
    if kernel_in_repo(cfg):
        return None
    r = (cfg.get("conformance") or {}).get("received") or {}
    return _as_date(r.get(f"{item['id']}@{item['version']}")) if isinstance(r, dict) else None


def grace_until(item, cfg):
    """max(since, received) + grace_days: the carência counts from the day THIS child received the obligation."""
    rec = received_date(item, cfg)
    return max(item["since"], rec) + timedelta(days=item["grace_days"]) if rec else item["since"] + timedelta(days=item["grace_days"])


def severity(item, today, cfg=None):
    """warning inside the grace, error after - except an item with `max_severity: warning` (the MJRP's call for checks that
    are heuristics, e.g. english-names), which never escalates."""
    if item.get("max_severity") == "warning":
        return "warning"
    return "warning" if today <= grace_until(item, cfg or {}) else "error"


def waiver_for(item, cfg, today, root, commits=None):
    """(waiver, honored, why_not). A waiver needs: reason; `until` valid, not past, at most 90 days after the commit that
    carries the human's trailer; that trailer commit to exist (git); and not to be the third in a row for the item."""
    w = (cfg.get("conformance") or {}).get("waived") or []
    for x in w if isinstance(w, list) else []:
        if not (isinstance(x, dict) and x.get("item") == item["id"]):
            continue
        until = _as_date(x.get("until"))
        if until is None:
            return x, False, "a dispensa não tem `until` válido"
        if until < today:
            return x, False, f"a dispensa venceu em {until}"
        if not x.get("reason"):
            return x, False, "a dispensa não diz o motivo"
        dates = (commits or git_trailer_commits)(root, TRAILER_WAIVER, item["id"])
        if dates is None:
            return x, False, "sem git não há como conferir o trailer `Conformance-waiver:` — a dispensa não vale"
        if not dates:
            return x, False, f"a dispensa não tem commit com o trailer `{TRAILER_WAIVER}: {item['id']} — <motivo>` (só o humano a escreve)"
        if len(dates) > MAX_WAIVER_COMMITS:
            return x, False, f"a dispensa já foi renovada além do limite ({len(dates)} commits com o trailer; vale a original e uma renovação)"
        if until > max(dates) + timedelta(days=MAX_WAIVER_DAYS):
            return x, False, f"a dispensa passa de {MAX_WAIVER_DAYS} dias do commit que a escreveu (até {until})"
        return x, True, ""
    return None, False, ""


def _without_scripts(check):
    """The check with every `script` leaf taken out (None when nothing is left): the static part of a superseded version."""
    if isinstance(check, list):
        kept = [c for c in (_without_scripts(x) for x in check) if c]
        return kept or None
    if "any" in check:
        kept = [c for c in (_without_scripts(x) for x in check["any"]) if c]
        return {**check, "any": kept} if kept else None
    if check.get("kind") == "script":
        return None
    if check.get("kind") == "delegated":
        req = _without_scripts(check["requires"])
        return {**check, "requires": req} if req else None
    return check


def evaluate(root, cfg, today, items=None, has_screen=None, notes_dir=None, trailer_commits=None):
    """One result per applicable item: {id, status: ok|gap|unknown|waived, severity, reasons, delegated, item, no_stamp}
    (an `unknown` caused by a `script` clause that could not run also carries `warn: True`: the I6 warns on it).
    Plus, for an item whose applied note targeted an OLDER version, a gap judged by that version's own check (error).
    Nothing is written. `has_screen`: True/False from the one definition of "has a screen" (visual_gate.screen_on_disk),
    None when the caller cannot tell - then screen items come back `unknown`."""
    items = items if items is not None else load_catalog()
    notes = read_notes(notes_dir)
    applied = set((cfg.get("conformance") or {}).get("applied") or [])
    out = []
    for it in items:
        ap = applies(it, cfg, root, has_screen)
        if ap is False:
            continue
        res = {"id": it["id"], "severity": severity(it, today, cfg), "reasons": [], "delegated": [], "item": it,
               "no_stamp": received_date(it, cfg) is None, "grace_until": grace_until(it, cfg)}
        if ap is None:
            out.append({**res, "status": "unknown", "reasons": ["não sei se o projeto tem tela (visual_gate.py ausente)"]})
            continue
        waiver, honored, why_not = waiver_for(it, cfg, today, root, trailer_commits)
        if honored:
            out.append({**res, "status": "waived", "reasons": [f"dispensado até {waiver.get('until')}: {waiver.get('reason')}"]})
            continue
        try:
            res["reasons"] = list(dict.fromkeys(run_check(it["check"], root, cfg, res["delegated"])))
        except Unknown as e:
            out.append({**res, "status": "unknown", "reasons": [str(e)], "warn": isinstance(e, ScriptUnknown)})
            continue
        status = "gap" if res["reasons"] else "ok"
        if status == "gap" and why_not:
            res["reasons"].append(why_not)
        # `applied` is not a word: the LAST applied note of the chain is judged by the check of the version it targeted
        done = [n for n in chain(it, notes) if n["id"] in applied]
        if done:
            last = done[-1]
            if last["to"] == it["version"]:
                if status == "gap":
                    res["severity"] = "warning" if it.get("max_severity") == "warning" else "error"
                    res["reasons"].append(f"{last['id']} consta em `conformance.applied`, mas a checagem reprova")
            else:
                old = check_of_version(it, last["to"])
                if old is None:
                    out.append({**res, "status": "gap", "severity": "warning" if it.get("max_severity") == "warning" else "error", "reasons": [f"{last['id']} aplicada, mas o catálogo não guarda o check de {it['id']}@{last['to']} (superseded)"]})
                else:
                    # a `script` clause always runs the CURRENT script, so a rule the script learned after the note was applied would
                    # read as «the note lied» - an error with no grace. The superseded version is judged by its own static clauses only;
                    # what the current script now asks is the current version's gap, with its grace (report-names@3, 2026-10-18)
                    static_old = _without_scripts(old)
                    try:
                        why = run_check(static_old, root, cfg) if static_old else []
                    except Unknown as e:
                        why = [f"não avaliável ({e})"]
                    if why:
                        lie = {"severity": "warning" if it.get("max_severity") == "warning" else "error",
                               "reasons": [f"{last['id']} consta em `conformance.applied` e a checagem de {it['id']}@{last['to']} reprova: " + "; ".join(why)]}
                        if status == "gap":
                            # the CURRENT version fails too: ONE row for the item, not the superseded version's failure beside the
                            # current one (audit of pedroso-incorp, 2026-10-18, point 8). The lie of `applied` keeps its error severity.
                            res["severity"] = lie["severity"]
                            res["reasons"] = lie["reasons"] + [r for r in res["reasons"] if r not in lie["reasons"]]
                        else:
                            out.append({**res, "status": "gap", **lie})
        out.append({**res, "status": status})
    return out


def audit_plan(root, cfg, today, items, has_screen, notes_dir):
    """The conform's closing audit, item by item (`--audit-plan`): one row per catalog item that APPLIES to the project, with
    the form verdict the script gives and the skill that judges the CONTENT (`judge_skill`; None = form only). The auditor
    runs that skill's own critique on the artifact; the script only says who and where. Nothing is written."""
    rows = {}
    for r in evaluate(root, cfg, today, items, has_screen, notes_dir):
        it = r["item"]
        # ONE row per item - its current version - with the note that opened that version (`migration`); `evaluate` may carry a
        # second row for a superseded version's check, and the plan must not print the item twice (pedroso-incorp, point 8)
        row = {"id": it["id"], "version": it["version"], "path": it["path"], "owner_skill": it["owner_skill"],
               "form": r["status"], "judge_skill": it.get("judge_skill"), "note": it["migration"]}
        if it["id"] not in rows or r["status"] == "gap":
            rows[it["id"]] = row
    return list(rows.values())


def _warning_until(it, until):
    """ADR-0019 § 3: "aviso até AAAA-MM-DD, erro depois" - an item that never escalates (max_severity: warning) says so."""
    if it.get("max_severity") == "warning":
        return "só aviso (nunca vira erro)"
    return f"aviso até {until.isoformat()}, erro depois" if until else "aviso, vira erro depois da carência"


def describe(r):
    """The line the human reads (Portuguese): falta X (exigido desde D, nasceu de Y) -> rode <skill> (nota CM-NNNN)."""
    it = r["item"]
    if r["status"] == "unknown":
        return f"{it['id']}@{it['version']}: não avaliável — {'; '.join(r['reasons'])}"
    prazo = "erro" if r["severity"] == "error" else _warning_until(it, r.get("grace_until"))
    return (f"{it['id']}@{it['version']}: falta {it['title']} — {'; '.join(r['reasons'])} (exigido desde {it['since'].isoformat()}, "
            f"nasceu de {it['born_of']}) → rode {it['owner_skill']} (nota {it['migration']}) · {prazo}")


def _pending_deadline(it, cfg, today):
    """The tail of a pending note's line: the end of the item's grace for THIS project, or that it already escalated."""
    until = grace_until(it, cfg)
    if severity(it, today, cfg) == "error":
        return f"erro desde {(until + timedelta(days=1)).isoformat()}"
    return _warning_until(it, until)


def open_warnings(root, script):
    """The `[aviso] <file>: <message>` lines the sensor `script` (next to this file) prints on the project: [(file, line)].
    Raises ScriptUnknown when it cannot run."""
    path = HERE / script
    if not path.is_file():
        raise ScriptUnknown(f"{script} ausente ao lado do conformance_check.py — rode `new_project.py <filho> --refresh-kernel`")
    try:
        p = subprocess.run([sys.executable, str(path), str(root)], capture_output=True, text=True, timeout=SCRIPT_TIMEOUT)
    except (OSError, subprocess.TimeoutExpired) as e:
        raise ScriptUnknown(f"{script} não rodou ({e.__class__.__name__})")
    if p.returncode not in (0, 1):
        raise ScriptUnknown(f"{script} saiu {p.returncode}")
    out = []
    for l in p.stdout.splitlines():
        l = l.strip()
        if l.startswith("[aviso]"):
            body = l[len("[aviso]"):].strip()
            out.append((body.split(": ", 1)[0].strip(), body))
    return out


ASKED_STAMP = re.compile(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$")
# F71 R14: tolerates a CRLF log and a tab or extra spaces after `##` (a file the bridge or Windows touched)
_LOG_ENTRY = re.compile(r"^##[ \t]+\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\][^\r\n]*\r?\n(.*?)(?=^##[ \t]+\[|\Z)", re.M | re.S)


def _stamp_time(stamp):
    try:
        return datetime.strptime(stamp, "%Y-%m-%d %H:%M")
    except ValueError:
        return None


def _now_local(cfg):
    """Now, naive, in the contract's timezone (Brasília by default) - the clock `asked_at` is written in."""
    tz = ((cfg or {}).get("locale") or {}).get("timezone", "America/Sao_Paulo")
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo(tz)).replace(tzinfo=None)
    except Exception:
        return datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)


def asked_entries(root, cfg, now=None):
    """The QUESTIONS TO THE MJRP the conform recorded in the contract: `conformance.asked: [{path, asked_at}, ...]`, one entry per
    FILE (it serves every note that shares the sensor). [{path, asked_at, problem}] - `problem` is None for a good entry. An
    entry is good when `asked_at` (AAAA-MM-DD HH:MM) is the stamp of a dated entry of the project's log, `## [AAAA-MM-DD HH:MM]`,
    whose text names the path: the question is on record where the human reads, not self-certified by the agent that wants the
    note applied. The old forms (a bare path, a map without `asked_at`) are problems, never a pass. 2026-10-19: an `asked_at`
    later than `now` (default: the contract's clock) is a problem too - a question cannot have been asked in the future."""
    raw = (cfg.get("conformance") or {}).get("asked") or []
    if not isinstance(raw, list):
        raw = []
    sys.path.insert(0, str(HERE))
    try:
        from _contract import log_rel
        log_text = (Path(root) / log_rel(root)).read_text(encoding="utf-8", errors="replace")
    except Exception:
        log_text = ""
    entries = {m.group(1): m.group(0) for m in _LOG_ENTRY.finditer(log_text)}
    now = now or _now_local(cfg)
    out = []
    for e in raw:
        path = str(e.get("path") or "").strip() if isinstance(e, dict) else str(e).strip()
        stamp = str(e.get("asked_at") or "").strip() if isinstance(e, dict) else ""
        if not path:
            out.append({"path": "?", "asked_at": stamp, "problem": "entrada sem `path`"})
        elif not ASKED_STAMP.match(stamp):
            out.append({"path": path, "asked_at": stamp, "problem": "sem `asked_at: \"AAAA-MM-DD HH:MM\"` (a hora da pergunta ao MJRP)"})
        elif _stamp_time(stamp) is None or _stamp_time(stamp) > now:
            out.append({"path": path, "asked_at": stamp, "problem": (f"`asked_at` {stamp} é do futuro (agora são {now:%Y-%m-%d %H:%M}) - a pergunta ainda não foi feita; use a hora real, `TZ=America/Sao_Paulo date`" if _stamp_time(stamp) else f"`asked_at` {stamp} não é uma data e hora reais")})
        elif path not in entries.get(stamp, ""):
            out.append({"path": path, "asked_at": stamp, "problem": f"o log não tem a entrada `## [{stamp}]` que cita o arquivo - a pergunta não está registrada onde o MJRP lê"})
        else:
            out.append({"path": path, "asked_at": stamp, "problem": None})
    return out

def git_trailer_commits(root, trailer, item_id):
    """Dates of the commits touching the contract whose message carries `<trailer>: <item> — ...`, newest first;
    None when git cannot answer (no repository): not evaluable never becomes approval."""
    try:
        p = subprocess.run(["git", "log", "--format=%cs%x1f%B%x1e", "--", ".mjrp-project.yml"], cwd=str(root),
                           capture_output=True, text=True, timeout=30)
    except Exception:
        return None
    if p.returncode != 0:
        return None
    dates = []
    for rec in p.stdout.split("\x1e"):
        if "\x1f" not in rec:
            continue
        cs, body = rec.strip().split("\x1f", 1)
        if re.search(rf"^{re.escape(trailer)}:\s*{re.escape(item_id)}\b", body, re.M):
            d = _as_date(cs)
            if d:
                dates.append(d)
    return dates


def git_digest_changes(base, item_id):
    """[(messages, version_changed, first, commit)] for every commit of the principal branch that changed this item's pattern_digest.
    `messages` is where the human's stamp may be: the commit's own message; for a merge, also the messages of the commits it brought in
    (the integrator writes the merge's message, so a stamp on the branch is the only one a merged change can carry); and the
    `Catalog-editorial: <item> — ...` lines of any commit in the principal branch's history (merged in or not) that names this commit by its hash (7+ hex
    digits): the cure of an unstamped change already in the history, without rewriting it (F208, UAT-508: the merge `38e17187c` changed
    `process-sensors` with no stamp, and the error had no fix but waiting for it to leave the last 200 commits)."""
    try:
        # the history that counts is the principal branch's: an unmerged branch may rewrite its own catalog freely
        ok_main = subprocess.run(["git", "rev-parse", "--verify", "-q", "main"], cwd=str(base), capture_output=True,
                                 timeout=GIT_TIMEOUT).returncode == 0
        ref = "main" if ok_main else "HEAD"
        log = subprocess.run(["git", "log", ref, "--first-parent", "--format=%H", "-n", "200", "--", CATALOG_REL], cwd=str(base),
                             capture_output=True, text=True, timeout=60)
        # a cure counts anywhere in the principal branch's history, not only on its first-parent line: the human's cure commit
        # reaches main through the integrator's merge (F219, UAT-542: `23cbc852f` came in by the train merge `01dff473e`). A branch
        # not merged into main is outside `ref`'s history and still cures nothing; authenticity stays with commit-msg (no agent co-author).
        cures = subprocess.run(["git", "log", ref, "-E", f"--grep=^{TRAILER_EDITORIAL}:", "--format=%B%x1e"],
                               cwd=str(base), capture_output=True, text=True, timeout=60)
    except Exception:
        return None
    if log.returncode != 0 or cures.returncode != 0:
        return None
    cure_lines = [ln for ln in cures.stdout.splitlines() if re.match(rf"^{TRAILER_EDITORIAL}:\s*{re.escape(item_id)}\b", ln)]

    def cures_of(h):
        return [ln for ln in cure_lines if any(h.startswith(tok.lower()) for tok in re.findall(r"\b[0-9a-fA-F]{7,40}\b", ln))]

    def at(rev):
        p = subprocess.run(["git", "show", f"{rev}:{CATALOG_REL}"], cwd=str(base), capture_output=True, text=True,
                           timeout=GIT_TIMEOUT)
        if p.returncode != 0:
            return None
        try:
            return next((x for x in json.loads(p.stdout)["items"] if x["id"] == item_id), None)
        except (json.JSONDecodeError, KeyError):
            return None
    out = []
    try:
        for h in [x for x in log.stdout.split() if x]:
            cur, prev = at(h), at(h + "~1")
            if cur is None:
                continue
            if prev is None or prev.get("pattern_digest") != cur.get("pattern_digest"):
                msg = subprocess.run(["git", "log", "-1", "--format=%B", h], cwd=str(base), capture_output=True, text=True,
                                     timeout=GIT_TIMEOUT).stdout
                if subprocess.run(["git", "rev-parse", "--verify", "-q", f"{h}^2"], cwd=str(base), capture_output=True,
                                  timeout=GIT_TIMEOUT).returncode == 0:
                    msg += "\n" + subprocess.run(["git", "log", "--format=%B", f"{h}^1..{h}^2"], cwd=str(base), capture_output=True,
                                                  text=True, timeout=60).stdout
                msg += "\n" + "\n".join(cures_of(h))
                out.append((msg, prev is not None and prev.get("version") != cur.get("version"), prev is None, h))
    except subprocess.TimeoutExpired:
        return None                                  # git stopped answering: not evaluable, like "git cannot answer"
    return out


def _published_paths_by_id(base, ref, folders):
    """{note id: [path on `ref`]} for every CM-*.md under `folders` (relative to base) at `ref`; None if git cannot say."""
    by_id = {}
    for folder in sorted(folders):
        ls = subprocess.run(["git", "ls-tree", "-r", "--name-only", ref, "--", folder], cwd=str(base), capture_output=True, text=True, timeout=60)
        if ls.returncode != 0:
            return None
        for rel in ls.stdout.splitlines():
            if not re.match(r"CM-.*\.md$", Path(rel).name):
                continue
            shown = subprocess.run(["git", "show", f"{ref}:{rel}"], cwd=str(base), capture_output=True, timeout=60)
            if shown.returncode == 0:
                nid = _note_fields(shown.stdout.decode("utf-8", "replace")).get("id")
                by_id.setdefault(nid, []).append(rel)
    return by_id


def _git(base, *args, timeout=60):
    """(returncode, stdout) of a git command in `base`; (None, '') when git cannot run at all."""
    try:
        p = subprocess.run(["git", *args], cwd=str(base), capture_output=True, text=True, encoding="utf-8", timeout=timeout)
    except Exception:
        return None, ""
    return p.returncode, p.stdout


# ---------------------------------------------------------------- triage: the view and the marking -------------
# The Control Center prepares a marking of the canonical catalog on screen (CC-ADR-0014, CC-ADR-0016); its single adapter
# calls only what is below, versioned by CATALOG_API. The rules live HERE and nowhere else: the app passes bytes and
# the `message` of a refusal through. None of this runs a sensor, and none of it writes a file - the human commits.

def _brasilia_now():
    """Now in Brasília time, not the host's clock (the bridge and the cloud run in UTC)."""
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo("America/Sao_Paulo"))
    except Exception:
        return datetime.now(timezone(timedelta(hours=-3)))


def _naive(now):
    return now.replace(tzinfo=None)


def _stamp_str(now):
    return _naive(now).strftime("%Y-%m-%d %H:%M")


def _age_days(marked_at, now):
    return max(0, (_naive(now) - datetime.strptime(marked_at, "%Y-%m-%d %H:%M")).days)


def _git_blob_id(data):
    """The id git gives these bytes as a blob (sha1 of `blob <size>\\0<bytes>`)."""
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()

# ---------------------------------------------------------------- learn gate ---------------------------------

def _skill_exists(base, name):
    root = Path(base) / "mjrp-skills"
    return any(p.is_dir() and p.name == name for p in root.rglob(name)) if root.is_dir() else True   # no skills dir: nothing to judge


def _template_destination(item):
    """Where the owning skill copies the template: the first file the item's check reads (a glob's `*` becomes a folder)."""
    def walk(c):
        if isinstance(c, list):
            for x in c:
                d = walk(x)
                if d:
                    return d
        elif isinstance(c, dict):
            if "any" in c:
                return walk(c["any"])
            if c.get("kind") == "contains":
                return (c.get("paths") or [c.get("path")])[0]
            if c.get("kind") == "frontmatter_key":
                return c["glob"].replace("*", "F00-template")
        return None
    return walk(item["check"]) or item["path"]


def template_problems(item, base):
    """The Learn gate's strongest rule: the item's check runs against the item's own template, copied to the artifact's
    path in a scratch directory. Divergence of catalog and model cannot be re-stamped away."""
    src = Path(base) / item["template"]
    if not src.is_file():
        return [f"{item['id']}: o template não existe: {item['template']}"]
    with tempfile.TemporaryDirectory() as t:
        dest = Path(t) / _template_destination(item)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(src, dest)
        cfg = {"profile": item["applies_to"]["profiles"][0]}
        reasons = run_check(item["check"], t, cfg)
    return [f"{item['id']}: o template {item['template']} reprova o check do próprio item — {'; '.join(reasons)} "
            f"(o modelo e o catálogo divergem: mude o modelo, ou o item com uma nota nova)"] if reasons else []


def published_note_problems(notes, base):
    """ADR-0019 § 2: a published note is not rewritten. A note is published when it is on the principal branch (the same
    `main`/`--first-parent` reading as the digest rule above - an unmerged branch may still write its own drafts); its bytes
    must equal the bytes of the commit that first brought it there. There is no valve for a note (the editorial trailer is
    the digest's): correcting a wrong note is a new note. Born of the incident of 2026-10-14, when CM-0019 and CM-0003 were
    reworded on a branch after the refresh had already carried them to nine children (P1-3 of
    reports/audits/2026-10-14-product-structure-in-owners-verification.md).
    The note is found by its `id`, not by its path (P2-5 of the second verification, 2026-10-14): a published note renamed and
    edited on a branch is a new path to git, which would read as a draft and let the edit through; matched by `id` it is still
    the published note, and its bytes are judged against the ones published under its old name."""
    problems = []
    try:
        ok_main = subprocess.run(["git", "rev-parse", "--verify", "-q", "main"], cwd=str(base), capture_output=True,
                                 timeout=GIT_TIMEOUT).returncode == 0
    except subprocess.TimeoutExpired:
        return [f"o git não respondeu em {GIT_TIMEOUT}s: não há como conferir se as notas publicadas mudaram (ADR-0019 § 2)"]
    ref = "main" if ok_main else "HEAD"
    rels = {}
    for n in notes:
        try:
            rels[n["path"]] = Path(n["path"]).resolve().relative_to(Path(base).resolve()).as_posix()
        except ValueError:
            continue
    try:
        by_id = _published_paths_by_id(base, ref, {Path(r).parent.as_posix() for r in rels.values()})
    except Exception:
        by_id = None
    if by_id is None:
        return [f"sem git não há como conferir se as notas publicadas mudaram (ADR-0019 § 2)"]
    on_main = {r for paths in by_id.values() for r in paths}
    for n in notes:
        rel = rels.get(n["path"])
        if rel is None:
            continue
        candidates = list(dict.fromkeys(by_id.get(n["id"], []) + ([rel] if rel in on_main else [])))
        for pub in candidates:
            try:
                log = subprocess.run(["git", "log", ref, "--first-parent", "--diff-filter=A", "--format=%H", "--reverse", "--", pub],
                                     cwd=str(base), capture_output=True, text=True, timeout=60)
                first = (log.stdout.split() or [None])[0] if log.returncode == 0 else None
                shown = subprocess.run(["git", "show", f"{first}:{pub}"], cwd=str(base), capture_output=True, timeout=60) if first else None
            except Exception:
                return [f"sem git não há como conferir se as notas publicadas mudaram (ADR-0019 § 2)"]
            if log.returncode != 0:
                return [f"sem git não há como conferir se as notas publicadas mudaram (ADR-0019 § 2)"]
            if shown is None or shown.returncode != 0:
                continue                            # never reached the principal branch: still a draft
            if shown.stdout != Path(n["path"]).read_bytes():
                moved = f" (publicada como {Path(pub).name}, hoje {Path(n['path']).name})" if pub != rel else ""
                problems.append(f"{Path(n['path']).name}: a nota já foi publicada na main ({first[:8]}){moved} e os bytes mudaram — uma nota publicada não se reescreve "
                                f"(ADR-0019 § 2; não há válvula para nota). Volte aos bytes publicados com `git checkout {first[:8]} -- {pub}` e diga a mudança "
                                f"numa nota nova (um passo de versão do item)")
                break
    return problems


def cm_id_problems(notes, items):
    """Rule 4b of the Learn gate: a CM number is used once in the whole catalog, not once per item. The chain check above is
    per item, so two notes with the same number in different items (or a `migration` named twice) passed - and it nearly
    happened on 2026-10-18, when CM-0064 was taken on two branches at the same time. Judged here:
      - two note files with the same CM number in their name, or the same `id` in their frontmatter;
      - a note whose file name and frontmatter `id` disagree (the number a reader sees is not the one the catalog cites);
      - one CM number cited by two places of the catalog (`migration` of an item, `migration` of a `superseded` version),
        whether in two items or twice in the same one."""
    problems = []
    by_name, by_id = {}, {}
    for n in notes:
        name = n["path"].name
        m = re.match(r"(CM-\d{4})(?=-|\.)", name)
        if m:
            by_name.setdefault(m.group(1), []).append(name)
            if n["id"] and n["id"] != m.group(1):
                problems.append(f"{name}: o nome diz {m.group(1)} e o `id` do frontmatter diz {n['id']} - o número que o leitor vê tem de ser o que o catálogo cita")
        if n["id"]:
            by_id.setdefault(n["id"], []).append(name)
    for label, groups in (("no nome do arquivo", by_name), ("no `id` do frontmatter", by_id)):
        for cm, names in sorted(groups.items()):
            if len(names) > 1:
                problems.append(f"{cm} aparece {label} de {len(names)} notas ({', '.join(sorted(names))}) - o número da nota é único no catálogo todo; "
                                f"a que chegou depois renumera para o próximo livre")
    cited = {}
    for it in items:
        if it.get("migration"):
            cited.setdefault(it["migration"], []).append(f"{it['id']} (migration)")
        for sup in it.get("superseded", []):
            if sup.get("migration"):
                cited.setdefault(sup["migration"], []).append(f"{it['id']} (superseded v{sup.get('version')})")
    for cm, who in sorted(cited.items()):
        if len(who) > 1:
            problems.append(f"{cm} é citada {len(who)} vezes no catálogo ({', '.join(who)}) - cada nota é de um passo de um item só")
    return problems


def _stamp_check(doc, base, use_git=True):
    """CC-ADR-0014 § 7, the stamp tied to the commit. Returns (problems, unevaluable).

    The marked rows (the `not_canonical` ones with `marked_at`, and every `awaiting_item` row) are grouped by `batch`. For
    each batch the gate finds the commit that introduced it - the first of `git log -S<batch> --reverse HEAD -- <catalog>`,
    with no window (no main, no --first-parent, no -n) - and checks in it: (a) the subject names `batch <batch>` and the
    message has no `Co-Authored-By:`; (b) one `Catalog-editorial: <path> — <verdict>: <reason>` per row, with the verdict of
    the list where the row is today and its reason; (c) in the catalog of that commit the row is in the same list and equal
    field by field (path, reason, marked_at, batch). The seed: rows WITHOUT `marked_at` stay accepted ("a triar") unless the
    path already appeared in a `Catalog-editorial:` of a batch commit - a mark sent back to triage without the stamp.
    Without git or in a shallow clone the marked rows are NOT EVALUABLE - never red for lack of history, never green."""
    marked = [("not_canonical", r) for r in doc.get("not_canonical") or [] if "marked_at" in r] + \
             [("awaiting_item", r) for r in awaiting_rows(doc)]
    problems, unevaluable = [], []
    cantsay = None
    if marked:
        if not use_git:
            cantsay = "sem git"
        else:
            rc, out = _git(base, "rev-parse", "--is-shallow-repository")
            if rc is None or rc != 0:
                cantsay = "sem git (ou fora de um repositório)"
            elif out.strip() == "true":
                cantsay = "clone raso — a história que carrega o lote pode não estar aqui"
    if marked and cantsay:
        for _, r in marked:
            unevaluable.append(f"{r['path']} (lote {r['batch']}): {cantsay} — não há como conferir o carimbo do commit do lote")
    elif marked:
        groups = {}
        for name, r in marked:
            groups.setdefault(r["batch"], []).append((name, r))
        shown = {}
        for batch, rows in groups.items():
            rc, out = _git(base, "log", "--format=%H", f"-S{batch}", "--reverse", "HEAD", "--", CATALOG_REL)
            if rc is None or rc != 0:
                unevaluable += [f"{r['path']} (lote {batch}): o git não respondeu sobre a história do catálogo" for _, r in rows]
                continue
            sha = out.split()[0] if out.split() else None
            if sha is None:
                problems += [f"carimbo: {r['path']} (lote {batch}) — nenhum commit da história deste ramo introduziu o lote; "
                             f"a marcação não passou pelo commit do humano" for _, r in rows]
                continue
            rc, msg = _git(base, "show", "-s", "--format=%B", sha)
            if rc != 0:
                unevaluable += [f"{r['path']} (lote {batch}): não consegui ler o commit {sha[:7]}" for _, r in rows]
                continue
            subject = msg.splitlines()[0] if msg.splitlines() else ""
            if f"batch {batch}" not in subject:
                problems.append(f"carimbo: o commit {sha[:7]} que introduziu o lote {batch} não o nomeia no assunto ({subject!r})")
            if re.search(r"^Co-Authored-By:", msg, re.I | re.M):
                problems.append(f"carimbo: o commit {sha[:7]} do lote {batch} leva `Co-Authored-By:` — a marcação é do humano, sem a assinatura do agente")
            footers = {l.rstrip() for l in msg.splitlines()}
            if sha not in shown:
                rc, text = _git(base, "show", f"{sha}:./{CATALOG_REL}")
                try:
                    shown[sha] = json.loads(text) if rc == 0 else None
                except json.JSONDecodeError:
                    shown[sha] = None
            then = shown[sha]
            for name, r in rows:
                want = f"{TRAILER_EDITORIAL}: {r['path']} — {VERDICT_PT['canonical' if name == 'awaiting_item' else 'not_canonical']}: {r['reason']}"
                if want not in footers:
                    problems.append(f"carimbo: {r['path']} — o commit {sha[:7]} do lote {batch} não tem o rodapé `{want}` "
                                    f"(o veredito é o da lista onde a linha está hoje, o motivo é o dela)")
                theirs = next((x for x in (then or {}).get(name) or [] if isinstance(x, dict) and x.get("path") == r["path"]), None)
                if theirs is None:
                    problems.append(f"carimbo: {r['path']} — no catálogo do commit {sha[:7]} a linha não está em `{name}`, "
                                    f"onde está hoje: foi trocada de lista por outro commit")
                    continue
                diff = [k for k in ("path", "reason", "marked_at", "batch") if theirs.get(k) != r.get(k)]
                if diff:
                    problems.append(f"carimbo: {r['path']} — a linha mudou depois do commit {sha[:7]} do lote {batch} "
                                    f"({', '.join(diff)}): o motivo e a data não se reescrevem sem um lote novo")
    # the seed: a row WITHOUT marked_at is "a triar" - unless its path already appeared in a batch's footer
    unmarked = [r for r in doc.get("not_canonical") or [] if "marked_at" not in r]
    if unmarked and use_git and not cantsay:
        rc, shallow = _git(base, "rev-parse", "--is-shallow-repository")
        if rc == 0 and shallow.strip() != "true":
            rc, bodies = _git(base, "log", "--format=%B", "--grep=^catalog: .* from the screen, batch ", "HEAD", "--", CATALOG_REL)
            if rc == 0:
                stamped = {m.group(1) for m in re.finditer(rf"^{TRAILER_EDITORIAL}: (.+?) — ", bodies, re.M)}
                for r in unmarked:
                    if r["path"] in stamped:
                        problems.append(f"carimbo: {r['path']} voltou a «a triar» sem carimbo — o caminho já apareceu num "
                                        f"`{TRAILER_EDITORIAL}:` de commit de lote; devolver uma marcação é um commit com o aval do humano")
    return problems, unevaluable


def item_digest_problems(it, base):
    """Rule 3 for one item without a `template`: each pattern source matches its stamped `pattern_digest`."""
    out = []
    for spec in it["pattern_sources"]:
        cur = source_digest(spec, base)
        if cur is None:
            out.append(f"{it['id']}: a pattern_source não existe: {spec}")
        elif cur != it["pattern_digest"].get(spec):
            out.append(f"{it['id']}: o padrão mudou — {spec}. Suba a versão do item e escreva a nota da cadeia, depois "
                       f"`conformance_check.py . --rebaseline {it['id']}`; se foi só redação, o rebaseline vai num commit com "
                       f"`{TRAILER_EDITORIAL}: {it['id']} — <motivo>` (do humano)")
    return out


def digest_problems(items, base=None):
    """The FAST part of the learn gate (UAT-531, F253): only rule 3's disk half, no git and no notes - a second or two, where the full gate
    takes over a minute. The commit hook runs it when the commit stages a pattern source, so a changed pattern never reaches the trunk
    with the item's digest and version left behind. It does not replace the full gate (the doctor's A1)."""
    base = Path(base) if base else ROOT_OF_SOURCE
    return [p for it in items if not it.get("template") for p in item_digest_problems(it, base)]


def learn_gate(items=None, notes_dir=None, base=None, doc=None, use_git=True, now=None, warnings=None, unevaluable=None):
    """The source-side gate (ADR-0019 § 4), a sensor of the harness contract. Returns the problems:
      1. every pattern carrier (a template in `pattern_carriers`) is a `template` or pattern source of some item, or is in
         `not_canonical` or in the agent's queue `awaiting_item` (CC-ADR-0014 § 7);
      2. each item with a `template` passes its own check run against that template;
      3. each pattern source WITHOUT a template matches its `pattern_digest`; a re-stamp without a version bump needs the
         human's `Catalog-editorial: <item> — <motivo>` trailer in the commit that changed the digest (git log);
      4. the catalog is whole: valid clauses (the loader), notes chain without hole or duplicate up to `version`, every
         older note's version has its `check` in `superseded`, `migration` is the last note, `owner_skill` exists;
         4b. a CM number is used once in the WHOLE catalog (`cm_id_problems`): not by two note files, not cited by two
         `migration`/`superseded` entries - the chain check is per item and let CM-0064 pass on two branches (2026-10-18);
      5. a published note's bytes never change (`published_note_problems`: equal to the commit that first brought it to main);
      6. (CC-ADR-0014 § 7) the lists are disjoint, and the stamp of each marked row is checked against the commit that
         introduced its batch (`_stamp_check`);
      6b. every item names, in `judge_skill`, the skill that judges the CONTENT of its artifact in the conform's closing
         audit (null = form only), and that skill exists; a `template` that lives in a skill other than the item's
         `owner_skill` is a warning (the template goes with the owner);
      7. the agent's queue (`awaiting_item`) is the agent's obligation: a row warns from day 1 and is a PROBLEM after
         `awaiting_max_days` (default 2) - rule 1 lets the row stand for its carrier, but only for that long.
    Optional collectors: `warnings` receives the queue rows still within the limit; `unevaluable` receives what could not be
    judged (marked rows without git or in a shallow clone). When `unevaluable` is None those lines are returned as problems
    - a caller that does not collect them never reads a silent green. `now` is a datetime in Brasília time."""
    if items is None:
        items, doc = load_catalog(with_meta=True)
    doc = doc or {}
    base = Path(base) if base else ROOT_OF_SOURCE
    problems, owned = [], set()
    for it in items:
        owned.update(it["pattern_sources"])
        if it.get("template"):
            owned.add(it["template"])
    declared = {e.get("path") for e in doc.get("not_canonical", []) if isinstance(e, dict)}
    declared |= {e.get("path") for e in awaiting_rows(doc) if isinstance(e, dict)}
    for g in doc.get("pattern_carriers", []):
        for f in sorted(p for p in base.glob(g) if p.is_file()):
            rel = f.relative_to(base).as_posix()
            if rel not in owned and rel not in declared:
                problems.append(f"portador sem dono: {rel} — modelo que nenhum item do catálogo usa e que não está em `not_canonical` "
                                f"nem na fila `awaiting_item` (um padrão novo não passa calado: crie o item e a nota, ou declare-o não canônico com o motivo)")
    notes = read_notes(notes_dir)
    ids = {it["migration"] for it in items} | {s.get("migration") for it in items for s in it["superseded"] if s.get("migration")}
    for it in items:
        if it.get("template"):
            problems += template_problems(it, base)
        else:
            problems += item_digest_problems(it, base)
            ch = git_digest_changes(base, it["id"]) if use_git else []
            if ch is None:
                problems.append(f"{it['id']}: sem git não há como conferir o trailer `{TRAILER_EDITORIAL}:` do rebaseline")
            else:
                for msg, bumped, first, commit in ch:
                    if not bumped and not first and not re.search(rf"^{TRAILER_EDITORIAL}:\s*{re.escape(it['id'])}\b", msg, re.M):
                        problems.append(f"{it['id']}: o pattern_digest mudou sem subir a versão no commit {commit[:9]}, e nem ele nem um "
                                        f"commit que ele trouxe tem o trailer `{TRAILER_EDITORIAL}: {it['id']} — <motivo>` (só o humano o "
                                        f"escreve). Sana-se depois, sem reescrever a história, com um commit do humano na main que o nomeia: "
                                        f"`{TRAILER_EDITORIAL}: {it['id']} — sana {commit[:9]}: <motivo>`")
        ch = chain(it, notes)
        if not ch:
            problems.append(f"{it['id']}: sem nota de migração na cadeia — o catálogo mudou e o filho não tem como saber")
        else:
            for a, b in zip(ch, ch[1:]):
                if b["from"] != a["to"]:
                    problems.append(f"{it['id']}: a cadeia de notas tem buraco ou duplicata entre {a['id']} (→{a['to']}) e {b['id']} (de {b['from']})")
            if ch[-1]["to"] != it["version"]:
                problems.append(f"{it['id']}: a última nota ({ch[-1]['id']}) vai até a versão {ch[-1]['to']}, o item está na {it['version']} — escreva a nota nova")
            if ch[-1]["id"] != it["migration"]:
                problems.append(f"{it['id']}: `migration` ({it['migration']}) não é a última nota da cadeia ({ch[-1]['id']})")
            for n in ch:
                if n["to"] != it["version"] and check_of_version(it, n["to"]) is None:
                    problems.append(f"{it['id']}: a nota {n['id']} leva à versão {n['to']} e o item não guarda o check dela em `superseded`")
                for s in NOTE_SECTIONS:
                    if s not in n["text"]:
                        problems.append(f"{it['id']}: a nota {n['path'].name} não tem a seção `{s}`")
        for name in _scripts_of(it["check"]):
            # the clause runs in the CHILD: the script must exist here, travel with the kernel, and be a pattern source
            # (what it demands of the children changes only with a note, like any other standard)
            rel = f"mjrp-scripts/{name}"
            if not (base / rel).is_file():
                problems.append(f"{it['id']}: a cláusula script aponta para {rel}, que não existe")
            if rel not in it["pattern_sources"]:
                problems.append(f"{it['id']}: {rel} roda no filho e não está em `pattern_sources` — mudar o que ele cobra passaria sem nota")
            # VENDORED_FILES lives in new_project_kernel.py since the builder was split (F73 R5); the old file is read too (fixtures)
            np_text = "\n".join((base / "mjrp-scripts" / n).read_text(encoding="utf-8") for n in ("new_project.py", "new_project_kernel.py")
                                if (base / "mjrp-scripts" / n).is_file())
            if np_text and f'"{name}"' not in np_text:
                problems.append(f"{it['id']}: {rel} não está nos VENDORED_FILES do new_project.py — no filho a cláusula fica não avaliável")
        if not _skill_exists(base, it["owner_skill"]):
            problems.append(f"{it['id']}: owner_skill '{it['owner_skill']}' não existe em mjrp-skills/")
        if "judge_skill" not in it:
            problems.append(f"{it['id']}: sem `judge_skill` — a skill que julga o CONTEÚDO do artefato na auditoria do conform "
                            f"(`null` quando o item é só mecanismo: a auditoria lê a forma)")
        elif it["judge_skill"] and not _skill_exists(base, it["judge_skill"]):
            problems.append(f"{it['id']}: judge_skill '{it['judge_skill']}' não existe em mjrp-skills/")
        if warnings is not None and it.get("template"):
            _, tpl_skill = _skill_of(it["template"])
            if tpl_skill and tpl_skill != it["owner_skill"]:
                warnings.append(f"{it['id']}: o modelo mora na `{tpl_skill}` e o dono do conteúdo é a `{it['owner_skill']}` — "
                                f"o modelo vai com o dono (mjrp-crafting-skills)")
    if use_git:
        problems += published_note_problems(notes, base)
    problems += cm_id_problems(notes, items)
    for n in notes:
        if n["id"] not in ids:
            problems.append(f"{n['path'].name}: nota sem item no catálogo")
        elif n["from"] is None:
            problems.append(f"{n['path'].name}: frontmatter sem `from`/`to` numéricos")
    problems += [f"listas não disjuntas: {x}" for x in _list_overlaps(items, doc)]
    stamp_problems, cannot = _stamp_check(doc, base, use_git)
    problems += stamp_problems
    if unevaluable is None:
        problems += [f"não avaliável: {x}" for x in cannot]
    else:
        unevaluable.extend(cannot)
    q_errors, q_warnings = _queue_findings(doc, (now or _brasilia_now()).replace(tzinfo=None))
    problems += q_errors
    if warnings is not None:
        warnings.extend(q_warnings)
    return problems


def rebaseline(item_id, catalog_path=None, base=None, notes_dir=None, now=None):
    """Re-stamp pattern_digest of one item (the only edit this makes to the catalog). The item's current version must
    already be the last note of its chain (the migration was written). A wording-only change, with no version bump, also
    goes through here - and is accepted by the gate only when the COMMIT carries `Catalog-editorial: <item> — <motivo>`,
    which the commit-msg hook refuses next to an agent's Co-Authored-By. Returns (ok, message)."""
    path = Path(catalog_path) if catalog_path else CATALOG_FILE
    items, doc = load_catalog(path, with_meta=True)
    it = next((x for x in items if x["id"] == item_id), None)
    if it is None:
        return False, f"item '{item_id}' não existe no catálogo"
    if it.get("template"):
        return False, f"{item_id} tem `template`: o portão roda o check contra o modelo, não há hash a reestampar"
    base = Path(base) if base else ROOT_OF_SOURCE
    new = {}
    for spec in it["pattern_sources"]:
        d = source_digest(spec, base)
        if d is None:
            return False, f"a pattern_source não existe: {spec}"
        new[spec] = d
    ch = chain(it, read_notes(notes_dir))
    if not ch or ch[-1]["to"] != it["version"]:
        return False, f"a nota da versão {it['version']} de {item_id} ainda não está escrita"
    for x in doc["items"]:
        if x["id"] == item_id:
            x["pattern_digest"] = new
    doc.setdefault("history", []).append({"at": (now or datetime.now()).strftime("%Y-%m-%d %H:%M"), "change": f"{item_id}: pattern_digest reestampado"})
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return True, f"{item_id}: pattern_digest reestampado — comite com `{TRAILER_EDITORIAL}: {item_id} — <motivo>` se foi só redação (o humano)"


def message_problem(text):
    """The commit-msg rule: the human's valve trailers cannot sit next to an agent's Co-Authored-By."""
    valves = (TRAILER_WAIVER, TRAILER_EDITORIAL, TRAILER_ACCEPTED, TRAILER_REOPENED, TRAILER_PRIORITIZED, TRAILER_PASSKEY)
    if re.search(rf"^({'|'.join(valves)}):", text, re.M) and AGENT_SIGNATURE.search(text):
        return (f"os trailers `{TRAILER_WAIVER}:`, `{TRAILER_EDITORIAL}:`, `{TRAILER_ACCEPTED}:`, `{TRAILER_REOPENED}:` e "
                f"`{TRAILER_PRIORITIZED}:` e `{TRAILER_PASSKEY}:` são válvulas do humano e este commit leva `Co-Authored-By:` de agente — o humano "
                "comita sem a assinatura do agente")
    return None

def _serialize(doc):
    """How the catalog is written on disk (rebaseline writes the same): 2-space indent, keys in order, UTF-8 as is, `\\n` last."""
    return (json.dumps(doc, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def _writable(data):
    """(doc, items) of the catalog bytes, or CatalogError. Refuses bytes that do not round-trip through `_serialize`: a
    patch from a rewrite would then carry more than the lines the human is asked to read."""
    try:
        doc = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        raise CatalogError(f"catálogo ilegível: {e}")
    items = _catalog_from_doc(doc)
    if _serialize(doc) != data:
        raise CatalogError("o catálogo não está no formato em que o kernel o grava (JSON com recuo de 2, UTF-8, `\\n` no fim) — "
                           "a marcação reescreveria linhas que ninguém marcou")
    return doc, items


def _carrier_match(rel, carriers):
    """True when `rel` matches a `pattern_carriers` glob; `*` stands for one path segment, never crosses a `/`."""
    parts = rel.split("/")
    for g in carriers or []:
        gp = str(g).split("/")
        if len(gp) == len(parts) and all(fnmatch.fnmatchcase(a, b) for a, b in zip(parts, gp)):
            return True
    return False


def _owners(items):
    """path -> id of the first item that has it as `template` or `pattern_source` (a `#Heading` is dropped)."""
    out = {}
    for it in items:
        for spec in ([it["template"]] if it.get("template") else []) + list(it["pattern_sources"]):
            out.setdefault(_source_of(spec), it["id"])
    return out


def _skill_of(path):
    """(archetype, skill) of a template path `…/<archetype>/<skill>/templates/<file>`; (None, None) otherwise."""
    parts = path.split("/")
    if "templates" in parts[1:]:
        i = parts.index("templates", 1)
        return (parts[i - 2] if i >= 2 else None), parts[i - 1]
    return None, None


def catalog_view(path, now):
    """`catalog_view@1`: what the triage screen shows, read from the catalog FILE (never runs a sensor, never writes).
    Always a dict with the same keys; `status` is `ok` · `missing` · `parse_error` · `unsupported_format` and `detail` says
    why when it is not `ok` (the other fields are then empty, but `blob` and `sha256` still describe the bytes read).
      items[{id, version, title, path, applies_to, since, grace_days, owner_skill, born_of, template, pattern_sources,
             migration, superseded[{version, migration}]}]
      templates[{path, archetype, skill, state, item, reason, marked_at, batch}] - every file a `pattern_carriers` glob
        matches under the catalog's repository root; state is item_source (a template or pattern source of `item`) ·
        to_triage (a `not_canonical` row without marked_at) · not_canonical (marked) · awaiting (in the agent's queue)
      awaiting[{path, skill, reason, marked_at, batch, age_days, stalled}] - `stalled` is age_days > awaiting_max_days
      history[{at, change, batch}] - in the order of the file
    `now` is a datetime in Brasília time (it only feeds age_days)."""
    path = Path(path)
    view = {"view": "catalog_view@1", "status": "ok", "detail": None, "path": str(path), "blob": None, "sha256": None,
            "version": None, "default_grace_days": None, "awaiting_max_days": None,
            "items": [], "templates": [], "awaiting": [], "history": []}
    try:
        data = path.read_bytes()
    except FileNotFoundError:
        return {**view, "status": "missing", "detail": f"catálogo ausente: {path}"}
    except OSError as e:
        return {**view, "status": "missing", "detail": f"catálogo ilegível ({e.__class__.__name__}): {path}"}
    view["blob"], view["sha256"] = _git_blob_id(data), hashlib.sha256(data).hexdigest()
    try:
        doc = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        return {**view, "status": "parse_error", "detail": f"catálogo ilegível ({path.name}): {e}"}
    try:
        items = _catalog_from_doc(doc)
    except CatalogError as e:
        return {**view, "status": "unsupported_format", "detail": str(e)}
    root = path.resolve().parent.parent
    limit = awaiting_max_days(doc)
    view.update(version=doc.get("version"), default_grace_days=doc.get("default_grace_days", 30), awaiting_max_days=limit)
    view["items"] = [{"id": it["id"], "version": it["version"], "title": it["title"], "path": it["path"],
                      "applies_to": it["applies_to"], "since": it["since"].isoformat(), "grace_days": it["grace_days"],
                      "owner_skill": it["owner_skill"], "born_of": it["born_of"], "template": it.get("template"),
                      "pattern_sources": list(it["pattern_sources"]), "migration": it["migration"],
                      "superseded": [{"version": s["version"], "migration": s.get("migration")} for s in it["superseded"]]}
                     for it in items]
    owners = _owners(items)
    nc = {r["path"]: r for r in doc.get("not_canonical") or []}
    queue = {r["path"]: r for r in awaiting_rows(doc)}
    seen = set()
    for g in doc.get("pattern_carriers") or []:
        for f in sorted(p for p in root.glob(g) if p.is_file()):
            rel = f.relative_to(root).as_posix()
            if rel in seen:
                continue
            seen.add(rel)
            arch, skill = _skill_of(rel)
            row = {"path": rel, "archetype": arch, "skill": skill, "state": "to_triage", "item": None,
                   "reason": None, "marked_at": None, "batch": None}
            if rel in owners:
                row.update(state="item_source", item=owners[rel])
            elif rel in queue:
                q = queue[rel]
                row.update(state="awaiting", reason=q["reason"], marked_at=q["marked_at"], batch=q["batch"])
            elif rel in nc:
                n = nc[rel]
                row.update(state="not_canonical" if "marked_at" in n else "to_triage", reason=n["reason"],
                           marked_at=n.get("marked_at"), batch=n.get("batch"))
            view["templates"].append(row)
    view["templates"].sort(key=lambda r: r["path"])
    for q in awaiting_rows(doc):
        age = _age_days(q["marked_at"], now)
        view["awaiting"].append({"path": q["path"], "skill": _skill_of(q["path"])[1], "reason": q["reason"],
                                 "marked_at": q["marked_at"], "batch": q["batch"], "age_days": age, "stalled": age > limit})
    view["history"] = [{"at": h.get("at"), "change": h.get("change"), "batch": h.get("batch")}
                       for h in doc.get("history") or [] if isinstance(h, dict)]
    return view


# The refusals: a stable `rule` id and the sentence the screen shows (Portuguese; the app only passes it through).
REFUSALS = {
    "bad_path": "«{path}» não é um caminho válido: precisa ser relativo, sem «..», e o arquivo precisa existir no repositório.",
    "not_a_template": "«{path}» não é um modelo a triar: nenhum padrão de portador do catálogo o alcança, ou ele não está na lista de «a triar».",
    "item_source": "«{path}» já é fonte do item «{item}» do catálogo — não há o que triar.",
    "in_queue": "«{path}» já foi marcado como canônico e espera o agente na fila — não se marca de novo.",
    "already_marked": "«{path}» já foi marcado (em {marked_at}, lote {batch}); rever uma marcação não é desta tela.",
    "duplicate_in_batch": "«{path}» aparece duas vezes no mesmo lote.",
    "bad_verdict": "O veredito de «{path}» precisa ser «canônico» ou «não canônico».",
    "bad_reason": "O motivo de «{path}» precisa ter de 3 a 200 caracteres, numa linha só, sem espaço nas pontas e sem caractere de controle.",
    "empty_batch": "O lote está vazio: marque ao menos um modelo.",
    "too_many": "O lote tem marcações demais: o máximo é " + str(MAX_MARKS) + " por lote.",
    "rows_changed": "As linhas deste lote mudaram depois que entraram — a devolução não sai por este comando.",
}


def _show(path):
    """A path as the screen prints it: control characters out, cut at 120."""
    s = "".join("?" if (unicodedata.category(c)[0] == "C" or c in "  ") else c for c in str(path))
    return s if len(s) <= 120 else s[:117] + "..."


def _refusal(index, path, rule, **fmt):
    shown = _show(path) if isinstance(path, str) else ""
    return {"index": index, "path": path if isinstance(path, str) else None, "rule": rule,
            "message": REFUSALS[rule].format(path=shown, **fmt)}


def _reason_ok(reason):
    if not isinstance(reason, str) or not (REASON_MIN <= len(reason) <= REASON_MAX) or reason != reason.strip():
        return False
    return not any(unicodedata.category(c)[0] == "C" or c in "  " for c in reason)


def _path_shape_ok(rel):
    if not isinstance(rel, str) or not rel or rel.startswith("/") or "\\" in rel:
        return False
    if any(unicodedata.category(c)[0] == "C" for c in rel):
        return False
    return not any(seg in ("", ".", "..") for seg in rel.split("/"))


def apply_marks(catalog_bytes, marks, batch, now, root=None):
    """The catalog bytes with a batch of marks applied, or the refusals - pure: nothing is written (CC-ADR-0014 § 5).
    `marks` is a list of {path, verdict: canonical | not_canonical, reason}. A mark is accepted when its path is relative,
    without `..`, matches a `pattern_carriers` glob and exists under `root` (default: the repository of this script); is a
    `not_canonical` row WITHOUT `marked_at` ("a triar"); is neither a template nor a pattern source of an item; is not in
    `awaiting_item`; does not repeat in the batch; and the verdict and the reason (3-200 characters, one line, no control
    character, no space at the ends) are well formed. Every mark gets its first refusal; the batch-level ones are
    `empty_batch` and `too_many`.
    Written, per mark: the row leaves `not_canonical` and goes - with `marked_at` (from `now`) and `batch` - back to
    `not_canonical` in the same place, with the human's reason (verdict not_canonical), or to the end of `awaiting_item`
    (verdict canonical; the key is created after `not_canonical` if the catalog has none); and one `history` line
    {at, change: "<path>: marcado <canônico | não canônico> pela tela — <reason>", batch}. Nothing else changes: not even
    `version`. The serialization is the file's own, so the diff is the touched lines only.
    Returns {"ok": True, "bytes": ...} or {"ok": False, "refusals": [{index, path, rule, message}]}.
    Raises CatalogError when the bytes are not a catalog in the format this module writes, ValueError for a malformed `batch`."""
    if not isinstance(batch, str) or not BATCH_RE.match(batch):
        raise ValueError("batch fora de AAAAMMDD-HHMMSS-<8 hex>")
    doc, items = _writable(catalog_bytes)
    root = Path(root) if root else ROOT_OF_SOURCE
    if not isinstance(marks, list) or not marks:
        return {"ok": False, "refusals": [_refusal(None, None, "empty_batch")]}
    if len(marks) > MAX_MARKS:
        return {"ok": False, "refusals": [_refusal(None, None, "too_many")]}
    carriers = doc.get("pattern_carriers") or []
    owners = _owners(items)
    nc = {r["path"]: r for r in reversed(doc.get("not_canonical") or [])}      # the first row of a path wins
    queue = {r["path"] for r in awaiting_rows(doc)}
    refusals, seen = [], set()
    for i, m in enumerate(marks):
        p = m.get("path") if isinstance(m, dict) else None
        rule, extra = None, {}
        if not _path_shape_ok(p):
            rule = "bad_path"
        elif not _carrier_match(p, carriers):
            rule = "not_a_template"
        elif not ((root / p).is_file() and (root / p).resolve().is_relative_to(root.resolve())):
            rule = "bad_path"
        elif p in owners:
            rule, extra = "item_source", {"item": owners[p]}
        elif p in queue:
            rule = "in_queue"
        elif p in nc and "marked_at" in nc[p]:
            rule, extra = "already_marked", {"marked_at": nc[p]["marked_at"], "batch": nc[p]["batch"]}
        elif p not in nc:
            rule = "not_a_template"
        elif p in seen:
            rule = "duplicate_in_batch"
        elif m.get("verdict") not in VERDICTS:
            rule = "bad_verdict"
        elif not _reason_ok(m.get("reason")):
            rule = "bad_reason"
        if isinstance(p, str):
            seen.add(p)
        if rule:
            refusals.append(_refusal(i, p, rule, **extra))
    if refusals:
        return {"ok": False, "refusals": refusals}
    new = json.loads(json.dumps(doc))                    # a deep copy that keeps the key order
    rows = new["not_canonical"]
    queue_rows = list(new.get("awaiting_item") or [])
    history = list(new.get("history") or [])
    stamp = _stamp_str(now)
    for m in marks:
        idx = next(k for k, r in enumerate(rows) if r["path"] == m["path"])
        row = {"path": m["path"], "reason": m["reason"], "marked_at": stamp, "batch": batch}
        if m["verdict"] == "canonical":
            del rows[idx]
            queue_rows.append(row)
        else:
            rows[idx] = row
        history.append({"at": stamp, "change": f"{m['path']}: marcado {VERDICT_PT[m['verdict']]} pela tela — {m['reason']}", "batch": batch})
    out = {}
    for k, v in new.items():
        out[k] = v
        if k == "not_canonical" and queue_rows and "awaiting_item" not in new:
            out["awaiting_item"] = queue_rows               # the queue key is born right after `not_canonical`
    if "awaiting_item" in new:
        out["awaiting_item"] = queue_rows
    out["history"] = history
    return {"ok": True, "bytes": _serialize(out)}


RETURNED_REASON = "a triar — a marcação do lote entrou por {sha} sem o carimbo e foi devolvida"
MARKED_CHANGE = re.compile(r"^(?P<path>.+?): marcado (?P<verdict>canônico|não canônico) pela tela — (?P<reason>.*)$")


def return_marks(catalog_bytes, batch, landed_sha, now):
    """The catalog bytes with the rows of a batch that entered WITHOUT the stamp sent back to «a triar» (CC-ADR-0016 § 1) -
    pure: nothing is written. Each row of `batch` goes back to `not_canonical` without `marked_at` and `batch` (a row that
    was in the queue goes to the end of `not_canonical`), and the `history` GROWS: one line per row,
    {at, change: "<path>: devolvido a 'a triar' — entrou por <short sha> sem o carimbo", batch}; no item is taken out.
    `landed_sha` is the commit that carried the rows (7 to 40 hex digits; only the first 7 are written).
    Refuses `rows_changed` when a row of the batch is no longer as the marking wrote it - the rows are compared with the
    batch's own `history` lines (list, reason, `marked_at`, `batch`), and a batch with no rows to return, or already
    returned, is refused too.
    Returns {"ok": True, "bytes": ...} or {"ok": False, "refusals": [{index, path, rule, message}]}."""
    if not isinstance(batch, str) or not BATCH_RE.match(batch):
        raise ValueError("batch fora de AAAAMMDD-HHMMSS-<8 hex>")
    if not isinstance(landed_sha, str) or not re.fullmatch(r"[0-9a-f]{7,40}", landed_sha):
        raise ValueError("landed_sha é o id do commit (7 a 40 hex)")
    doc, _ = _writable(catalog_bytes)
    hist = [h for h in doc.get("history") or [] if isinstance(h, dict) and h.get("batch") == batch]
    marked = [(h, MARKED_CHANGE.match(h.get("change") or "")) for h in hist]
    marked = [(h, m) for h, m in marked if m]
    refusals = []
    if not marked or len(marked) != len(hist):                    # nothing marked by this batch, or it was already returned
        return {"ok": False, "refusals": [_refusal(None, None, "rows_changed")]}
    nc, queue = doc.get("not_canonical") or [], awaiting_rows(doc)
    expected = []
    for i, (h, m) in enumerate(marked):
        row = {"path": m["path"], "reason": m["reason"], "marked_at": h.get("at"), "batch": batch}
        lst = queue if m["verdict"] == "canônico" else nc
        if row not in lst:
            refusals.append(_refusal(i, m["path"], "rows_changed"))
        expected.append((m["path"], m["verdict"]))
    carried = [r for r in nc + queue if r.get("batch") == batch]
    if len(carried) != len(marked):
        refusals.append(_refusal(None, None, "rows_changed"))
    if refusals:
        return {"ok": False, "refusals": refusals}
    new = json.loads(json.dumps(doc))
    rows, queue_rows = new["not_canonical"], list(new.get("awaiting_item") or [])
    history = list(new.get("history") or [])
    stamp, sha = _stamp_str(now), landed_sha[:7]
    for path, verdict in expected:
        back = {"path": path, "reason": RETURNED_REASON.format(sha=sha)}
        if verdict == "canônico":
            queue_rows = [r for r in queue_rows if r["path"] != path]
            rows.append(back)
        else:
            rows[next(k for k, r in enumerate(rows) if r["path"] == path)] = back
        history.append({"at": stamp, "change": f"{path}: devolvido a 'a triar' — entrou por {sha} sem o carimbo", "batch": batch})
    out = {}
    for k, v in new.items():
        out[k] = queue_rows if k == "awaiting_item" else v
    out["history"] = history
    return {"ok": True, "bytes": _serialize(out)}

# ---------------------------------------------------------------- conformance_state@1 (the child's state file) -------
# The I6 of the doctor, running in a child, asks this module to leave `.mjrp/conformance_state.json` behind. The Control
# Center reads it (it never computes a grace date: `grace_until` comes from here) and compares `catalog_sha256` with the
# sha256 of the child's copy of the catalog.

def _iso(v):
    d = _as_date(v)
    return d.isoformat() if d else str(v)


def build_conformance_state(root, cfg, now=None, has_screen=None, results=None, pend=None, catalog_file=None):
    """The `conformance_state@1` dict for a project (nothing is written). `results` / `pend` can be passed when the caller
    (the doctor's I6) already evaluated, so a `script` clause does not run twice.
      schema_version, ran_at (ISO, Brasília), catalog_version, catalog_sha256 (of the FILE of the child's copy), status
      (ok | gaps | no_catalog | invalid_catalog), profile, received{"<item>@<v>": date},
      gaps[{id, severity, grace_until, message, owner_skill, note}], pending[{note, item, grace_until}],
      waived[{item, until}], items[{id, result: gap | ok | na | unknown}]   (`items` is the matrix's, an additive extension;
      `na` is an item that does not apply to the project, or that a valid waiver dispensed)
    `catalog_file`: judge by this catalog instead of the project's own copy (F50: the harness measures a child by ITS
    catalog, so a child whose copy is behind shows the items it has not received as gaps / pending notes)."""
    now = now or _brasilia_now()
    cfg = cfg or {}
    state = {"schema_version": STATE_SCHEMA, "ran_at": now.isoformat(timespec="seconds"), "catalog_version": None,
             "catalog_sha256": None, "status": "no_catalog", "profile": cfg.get("profile"),
             "received": {}, "gaps": [], "pending": [], "waived": [], "items": []}
    rec = (cfg.get("conformance") or {}).get("received") or {}
    if isinstance(rec, dict):
        state["received"] = {str(k): _iso(v) for k, v in rec.items()}
    catalog = Path(catalog_file) if catalog_file else find_catalog(root)
    if catalog is None:
        return state
    state["catalog_sha256"] = hashlib.sha256(catalog.read_bytes()).hexdigest()
    try:
        items, doc = load_catalog(catalog, with_meta=True)
    except CatalogError:
        try:
            doc = json.loads(catalog.read_text(encoding="utf-8"))
            state["catalog_version"] = doc.get("version") if isinstance(doc, dict) else None
        except Exception:
            pass
        state["status"] = "invalid_catalog"
        return state
    state["catalog_version"] = doc.get("version")
    today = now.date()
    if has_screen is None:
        has_screen = child_has_screen(root, cfg)
    nd = catalog.parent / "migrations"
    if results is None:
        results = evaluate(root, cfg, today, items, has_screen, nd)
    if pend is None:
        pend = pending(root, cfg, items, nd, has_screen, today)
    seen = {}
    for r in results:                                    # an item can come back twice (its own check and an applied note's older one)
        seen.setdefault(r["id"], set()).add(r["status"])
    waivers = {x.get("item"): x for x in (cfg.get("conformance") or {}).get("waived") or [] if isinstance(x, dict)}
    for r in results:
        if r["status"] == "gap":
            state["gaps"].append({"id": r["id"], "severity": r["severity"], "grace_until": r["grace_until"].isoformat(),
                                  "message": describe(r), "owner_skill": r["item"]["owner_skill"], "note": r["item"]["migration"]})
        elif r["status"] == "waived":
            state["waived"].append({"item": r["id"], "until": _iso(waivers.get(r["id"], {}).get("until"))})
    state["pending"] = [{"note": n["id"] if n else it["migration"], "item": it["id"], "grace_until": grace_until(it, cfg).isoformat()}
                        for it, n in pend]
    for it in items:
        st = seen.get(it["id"], set())
        result = "gap" if "gap" in st else "unknown" if "unknown" in st else "ok" if "ok" in st else "na"
        state["items"].append({"id": it["id"], "result": result})
    state["status"] = "gaps" if state["gaps"] else "ok"
    return state


def write_conformance_state(root, cfg, now=None, has_screen=None, results=None, pend=None):
    """Builds the state and writes it to `<root>/.mjrp/conformance_state.json` atomically (a temporary file in the same
    folder, then `os.replace`: a reader never sees half a file). It is a derived state, rewritten at every pass, like
    `.mjrp/sensors.json`. Returns (path, state). Raises OSError when it cannot write."""
    state = build_conformance_state(root, cfg, now, has_screen, results, pend)
    dest = Path(root) / STATE_REL
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(f".{dest.name}.{os.getpid()}.tmp")
    try:
        tmp.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        os.replace(tmp, dest)
    finally:
        if tmp.exists():
            tmp.unlink()
    return dest, state

# ---------------------------------------------------------------- CLI ----------------------------------------

def load_child(root):
    """(cfg, error): the child's `mjrp_harness` block, through the doctor's own reader."""
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(HERE))
    from _contract import read_yaml
    cfile = Path(root) / ".mjrp-project.yml"
    if not cfile.is_file():
        return None, f"{root} sem .mjrp-project.yml"
    return (read_yaml(cfile.read_text(encoding="utf-8")) or {}).get("mjrp_harness") or {}, None


def child_has_screen(root, cfg):
    sys.path.insert(0, str(HERE))
    try:
        import visual_gate
    except ModuleNotFoundError:
        return None
    return bool(visual_gate.screen_on_disk(root, cfg.get("screen") if isinstance(cfg.get("screen"), list) else None))


def main(argv):
    import argparse
    ap = argparse.ArgumentParser(description="conformidade canônica dos filhos (catálogo x projeto) — ADR-0019")
    ap.add_argument("path", nargs="?")
    ap.add_argument("--gaps", action="store_true", help="lista as lacunas (padrão)")
    ap.add_argument("--pending", action="store_true", help="lista as notas de migração pendentes")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--learn-gate", action="store_true")
    ap.add_argument("--digest-gate", action="store_true", help="a parte rápida do portão (o pattern_digest contra o disco, sem git): o hook de commit a roda")
    ap.add_argument("--audit-plan", action="store_true", help="o plano da auditoria de fechamento: cada item que se aplica, o veredito de forma e a skill que julga o conteúdo")
    ap.add_argument("--rebaseline", metavar="ITEM")
    ap.add_argument("--check-note", metavar="CM-NNNN", help="roda o check da versão que a nota alvejou (e diz se a atual passa); não escreve")
    ap.add_argument("--check-msg", metavar="FILE", help="o commit-msg: recusa trailer do humano com Co-Authored-By de agente")
    ap.add_argument("--strict", action="store_true", help="a saída do conform: qualquer lacuna (mesmo dentro da carência) ou nota pendente dá exit 1")
    ap.add_argument("--write-state", action="store_true", help=f"grava {STATE_REL} (conformance_state@1) do projeto; o I6 do doctor faz o mesmo")
    a = ap.parse_args(argv)
    if a.check_msg:
        prob = message_problem(Path(a.check_msg).read_text(encoding="utf-8", errors="replace"))
        if prob:
            print(f"conformance_check: {prob}")
            return 1
        return 0
    if not a.path:
        ap.print_help()
        return 2
    if a.write_state:                                  # a child with no (valid) catalog gets its state too: no_catalog / invalid_catalog
        root = Path(a.path).resolve()
        cfg, err = load_child(root)
        if err:
            print(f"conformance_check: {err} (não avaliável)")
            return 2
        dest, state = write_conformance_state(root, cfg)
        print(f"conformance_check: {dest} ({state['status']}, {len(state['gaps'])} lacuna(s))")
        return 0
    if a.digest_gate and not is_source():
        # F260, UAT-580: the gate is the harness's. A child vendors the catalog and this reader but not the pattern sources the digests
        # were taken from, so judging it there refused the commit of `--refresh-kernel`. (Decided in the reader, not in each hook.)
        print("conformance_check: o portão rápido de digest é do harness; não se aplica num projeto filho.")
        return 0
    catalog = find_catalog(a.path) if not (a.learn_gate or a.digest_gate or a.rebaseline) else CATALOG_FILE
    if catalog is None:
        print("conformance_check: ERRO — o projeto não tem mjrp-scripts/canonical_catalog.json; rode "
              "`python3 <harness>/mjrp-scripts/new_project.py <esta pasta> --refresh-kernel`")
        return 1
    try:
        items, doc = load_catalog(catalog, with_meta=True)
    except CatalogError as e:
        print(f"conformance_check: {e}")
        return 1 if "catálogo" in str(e) and "ausente" not in str(e) else 2
    if a.digest_gate:
        problems = digest_problems(items)
        for p in problems:
            print(f"  [ERRO digest-gate] {p}")
        print(f"conformance_check: {len(items)} item(ns), {len(problems)} problema(s) de digest")
        return 1 if problems else 0
    if a.learn_gate:
        warns, cannot = [], []
        problems = learn_gate(items, doc=doc, warnings=warns, unevaluable=cannot)
        for p in problems:
            print(f"  [ERRO learn-gate] {p}")
        for x in cannot:
            print(f"  [não avaliável learn-gate] {x}")
        for x in warns:
            print(f"  [aviso learn-gate] {x}")
        print(f"conformance_check: {len(items)} item(ns), {len(problems)} problema(s)"
              + (f", {len(cannot)} não avaliável(is)" if cannot else "") + (f", {len(warns)} aviso(s)" if warns else ""))
        return 1 if problems else 2 if cannot else 0
    if a.rebaseline:
        ok, msg = rebaseline(a.rebaseline)
        print(f"conformance_check: {msg}")
        return 0 if ok else 1
    root = Path(a.path).resolve()
    cfg, err = load_child(root)
    if err:
        print(f"conformance_check: {err} (não avaliável)")
        return 2
    sys.path.insert(0, str(HERE))
    import _clock
    nd = catalog.parent / "migrations"
    if a.check_note:
        code, text = check_note(root, cfg, a.check_note, items, read_notes(nd), gates=doc.get("open_warning_notes") or {})
        print(text)
        return code
    if a.audit_plan:
        rows = audit_plan(root, cfg, _clock.contract_today(cfg), items, child_has_screen(root, cfg), nd)
        if a.json:
            print(json.dumps({"root": str(root), "items": rows}, ensure_ascii=False, indent=2))
        else:
            for x in rows:
                judge = f"conteúdo: {x['judge_skill']}" if x["judge_skill"] else "conteúdo: sem skill que julgue (só a forma)"
                print(f"  {x['id']}@{x['version']} ({x['note']}) · {x['path']} · forma: {x['form']} · {judge}")
            print(f"conformance_check: {root.name}: {len(rows)} item(ns) se aplicam, {sum(1 for x in rows if x['judge_skill'])} com skill que julga o conteúdo")
        return 0
    res = evaluate(root, cfg, _clock.contract_today(cfg), items, child_has_screen(root, cfg), nd)
    gaps = [r for r in res if r["status"] == "gap"]
    unknown = [r for r in res if r["status"] == "unknown"]
    pend = pending(root, cfg, items, nd, child_has_screen(root, cfg), _clock.contract_today(cfg))
    missing = incomplete_catalog(doc)
    cmp_ = compare_with_harness(root, cfg, catalog)
    behind = cmp_["behind"]
    if a.json:
        print(json.dumps({"root": str(root), "catalog_behind": behind, "catalog_compare": cmp_,
                          "catalog_incomplete": {"count": len(missing), "paths": missing, "message": incomplete_message(missing)} if missing else None,
                          "gaps": [{"id": r["id"], "severity": r["severity"], "message": describe(r),
                                    "grace_until": r["grace_until"].isoformat()} for r in gaps],
                          "unknown": [{"id": r["id"], "message": describe(r)} for r in unknown],
                          "pending": [n["id"] if n else it["migration"] for it, n in pend]}, ensure_ascii=False, indent=2))
    else:
        if a.pending:
            for it, n in pend:
                print(f"  {n['id'] if n else '(sem nota)'} · {it['id']}@{n['from'] if n else '?'}→{n['to'] if n else it['version']} → {it['owner_skill']}"
                      f" · {_pending_deadline(it, cfg, _clock.contract_today(cfg))}")
        if a.gaps or not a.pending:
            for r in gaps:
                print(f"  [{r['severity']}] {describe(r)}")
            for r in unknown:
                print(f"  [não avaliável] {describe(r)}")
        print(f"conformance_check: {root.name}: {len(gaps)} lacuna(s), {len(unknown)} não avaliável(is), {len(pend)} nota(s) pendente(s)"
              + (f", catálogo defasado em {len(behind)} item(ns)" if behind else ""))
        if behind:
            print(f"  [{'ERRO' if a.strict else 'aviso'}] {behind_message(behind, a.strict)}")
        if cmp_["state"] == "unreachable":
            print(f"  [{'não avaliável' if a.strict else 'aviso'}] {UNREACHABLE_MESSAGE}")
        if missing:
            print(f"  [catálogo incompleto] {incomplete_message(missing)}")
            for pth in missing:
                print(f"    - {pth}")
    if any(r["severity"] == "error" for r in gaps):
        return 1                                   # the child's own overdue work comes first
    if a.strict and (gaps or pend):
        return 1                                   # the conform's exit criterion: nothing left, not even inside the grace
    if a.strict and behind:
        return 1                                   # 2026-10-19: a stale catalog cannot list what it does not know - never green
    if a.strict and cmp_["state"] == "unreachable":
        return 2                                   # cannot tell whether the criterion is current: not evaluable, never green
    return 2 if (unknown and not gaps) or missing else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
