#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
sdd_shape_check.py - do the features follow the SDD templates? The sensor of the SHAPE of `spec.md`, `plan.md` and `tasks.md` (F95, 2026-10-26).

Born from an incident: from F43 (2026-10-19) to F94 no feature had the `spec.md` in the shape of the template of `mjrp-specifying-sdd-artifacts`
(Problem Statement, Requirements, Observable States, Success Criteria, Out of Scope, Open Questions) - 50 in a row, 22 of them in one day,
created by copying the minimal shape of an already degraded feature; the `plan.md` stayed a one-line sketch, the `tasks.md` had no
Pre-Implementation and no Documentation. `mjrp-ensuring-sdd` checks the shape only when someone calls it, and nobody did (harness-kaizen,
2026-10-26 21:14). "The agent is not the judge": a rule that lives only in a skill text vanishes under pressure.

ONE source for the shape: the templates themselves (`mjrp-skills/.../mjrp-specifying-sdd-artifacts/templates/{spec,plan,tasks}.md`). A `## Section`
of the template is required unless its heading says `(optional)` or `(if ...)`; the frontmatter keys of the spec template, the `# ` title and the
`**Approved**:` line are required too. Change the template and the sensor follows; nothing is listed here.

A section is MISSING when it is absent and EMPTY when its body, after the template's own comments, the template's own placeholder lines and the
lines that carry nothing (a bare `-` or `- [ ]`, zero-width or no-break spaces, an empty code fence) are taken out, has nothing (a section with only
the comment of the template counts as missing). It does not judge the quality of the text - that is
`mjrp-ensuring-sdd`, called at the close. The marker `«a escrever»` is content for the sensor (the generator `new_feature.py` writes it where the
author still has to write), but it is counted: left in a closed feature it is an ERROR for the features born after the generator (PENDING_ERROR_FROM) and, for the acervo of F43 to F95, a
warning with an owner (the integrator, who writes each field when the feature closes) that turns into an ERROR on PENDING_TURN_DATE - otherwise the
marker would be a way around the sensor. The marker is read tolerantly (any case or spacing, through invisible characters, no need for the closing guillemet).

What it does, by the feature's `status:`:
  - Done / Accepted (closed): a missing or empty section, a missing file or frontmatter key is an ERROR (exit 1);
  - Draft / Ready / In Progress (open): the same gaps are only a WARNING - the fast lane documents afterwards, but before the close;
  - Cancelled / Deferred: not judged; any other word is an ERROR (a feature graded by another word would escape the gate).
Features numbered below SINCE_FEATURE are not judged: a record is not rewritten to satisfy a template its author did not follow (the acervo of
F43 to F94 was brought to the shape by F95 TASK-03; before F43 the specs already carried the shape).

Modes:
  python3 mjrp-scripts/sdd_shape_check.py <root>             the whole repository: the root project and each apps/*/ (the doctor's sensor `sdd_shape`)
  python3 mjrp-scripts/sdd_shape_check.py <root> --staged    only the features the commit touches, judged by the INDEX copy (the pre-commit)
  python3 mjrp-scripts/sdd_shape_check.py <root> --json      the findings as JSON (the doctor's W20 reads them through `findings()`)
Exit: 0 no error (warnings are printed) | 1 a closed feature is out of the shape | 2 not evaluable (no root, templates not found, git failed).
`--staged` reads the templates from the INDEX (the copy the commit will contain), never from the disk, like the features. Exception: the repository
versions no template at all - nothing in the index AND nothing in HEAD under their path (the throwaway repository of the acceptance test, a project
without the harness's skills) - exits 0 with the notice «NÃO foi conferido». If the index or HEAD has them and the index lacks a file (a `git mv`
in the same commit), it is exit 2; a `mv` or a sparse-checkout changes nothing (CI of 2026-10-27, test_acceptance_real_hooks; recheck P1-1).
Stdlib only (ADR-0015).
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

sys.dont_write_bytecode = True
import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402
import _clock  # noqa: E402
import _fm  # noqa: E402
import _git  # noqa: E402

HERE = Path(__file__).resolve().parent
TEMPLATES_REL = Path("mjrp-skills") / "mjrp-sw-factory" / "builder" / "mjrp-specifying-sdd-artifacts" / "templates"
FEATURES_REL = "docs/specs/features"
RECORD_REL = "docs/specs/board-mapping.json"         # F128: the approved from-to mapping, what came from the legacy
KINDS = ("spec", "plan", "tasks")
CLOSED = {"done", "accepted"}
OPEN = {"draft", "ready", "in progress", "in-progress", "queued", "backlog"}     # the cycle runs: gaps only warn
OFF_TRACK = {"cancelled", "deferred"}                                           # never delivered, never judged (requirements_graph_rules.json: off_track)
STATUS_VOCABULARY = "Draft · Ready · Queued · Backlog · In Progress · Done · Accepted · Cancelled · Deferred"
# F128: the legacy phrase in a closed spec's frontmatter (the requirements graph proves it by date: delivered_by older than the contract)
_LEGACY = re.compile(r"\A---\s*\n(?:(?!---).*\n)*?accepted_in:\s*[\"']?histórico anterior ao harness", re.M)
SINCE_FEATURE = 43            # the first feature judged: the day (2026-10-19) the shape stopped being followed
PENDING_ERROR_FROM = 96       # the first feature born by new_feature.py: a «a escrever» left in it, once closed, is an error
PENDING_TURN_DATE = date(2026, 11, 30)   # from this day a «a escrever» left in a CLOSED feature of the acervo (F43 to F95) is an error too:
#   the markers of the lot of F95 have an owner (the integrator, who writes each one when the feature closes) and a deadline; a warning with
#   no date teaches to ignore it (ADR-0002 section 3). Decided by the agent, class (a), reversible: one constant.
PENDING = re.compile(r"(?i)«\s*a\s+escrever")      # tolerant: any case, any spacing, no need for the closing »
_ZERO_WIDTH = re.compile("[\u200b-\u200f\u2060\ufeff\u00a0\u00ad]")      # zero-width, no-break and soft-hyphen: invisible in the page
_INVISIBLE = re.compile("[\u200b-\u200f\u2060\ufeff\u00ad]")          # the ones that hide inside a word (the marker is read through them)
_MARKUP = re.compile(r"&[a-zA-Z#0-9]+;|<[^>\n]*>")                       # `&nbsp;`, `<br>`: markup that shows nothing
_LIST_MARK = re.compile(r"^(?:[-*+]|\d+[.)])\s*(?:\[[ xX~]\])?\s*")
_FENCE = re.compile(r"^`{3,}[\w-]*$|^~{3,}[\w-]*$")

_COMMENT = re.compile(r"<!--.*?-->", re.S)
_FEATURE_FILE = re.compile(r"^(?P<proj>(?:.*/)?)" + re.escape(FEATURES_REL) + r"/(?P<dir>F(?P<num>\d{2,})-[^/]+)/(?P<kind>spec|plan|tasks)\.md$")
_FEATURE_DIR = re.compile(r"^F(\d{2,})-")


class NotEvaluable(Exception):
    """The sensor could not judge (templates not found, git failed): never an empty answer."""


class TemplatesMissing(NotEvaluable):
    """The SDD templates are not reachable from here: the project does not carry the harness's skills (a child with the vendored kernel,
    the throwaway repository of a test). Not a defect of the commit: the pre-commit (`--staged`) lets it through, loudly; the doctor's
    sensor (the whole repository) still says «não avaliável»."""


# ---- the shape, read from the templates ----------------------------------------------------------------------------
def _norm(line):
    return " ".join(line.split())


def _strip_comments(text):
    return _COMMENT.sub("", text)


def sections_of(text):
    """{heading as written: body lines} for the `## ` headings of `text`, comments out, fenced code kept as body."""
    out, cur, fenced = {}, None, False
    for line in _strip_comments(text).splitlines():
        if line.lstrip().startswith("```"):
            fenced = not fenced
        if not fenced and line.startswith("## "):
            cur = line[3:].strip()
            out[cur] = []
        elif cur is not None:
            out[cur].append(line)
    return out


def section_name(heading):
    """`Prototype Parity (if the feature touches a screen)` -> `prototype parity`."""
    return re.split(r"\s+\(", heading, maxsplit=1)[0].strip().casefold()


def is_optional(heading):
    low = heading.casefold()
    return "(optional)" in low or bool(re.search(r"\(if\b", low))


def parse_template(text):
    """The shape of one template: its title word, whether it has the Approved line, its frontmatter keys and its sections."""
    fm_block, body = _fm.split(text)
    h1 = re.search(r"^# (\w+)", _strip_comments(body), re.M)
    sections = {}
    for heading, lines in sections_of(body).items():
        sections[section_name(heading)] = {
            "heading": heading, "required": not is_optional(heading),
            "placeholders": {_norm(ln) for ln in lines if _norm(ln)}}
    return {"title": h1.group(1) if h1 else None,
            "approved": bool(re.search(r"^\*\*Approved\*\*", body, re.M)),
            "keys": [m.group(1) for m in (re.match(r"^([A-Za-z][\w-]*):", ln) for ln in (fm_block or "").splitlines()) if m],
            "sections": sections}


def templates_dir(root=None):
    """The templates folder: next to the scripts (the harness), or under the root being judged."""
    for base in (HERE.parent, Path(root) if root else None):
        if base is not None and (base / TEMPLATES_REL).is_dir():
            return base / TEMPLATES_REL
    raise TemplatesMissing(f"os moldes do SDD não estão em {TEMPLATES_REL} - não avaliável")


def load_shapes(root=None):
    d = templates_dir(root)
    shapes = {}
    for kind in KINDS:
        f = d / f"{kind}.md"
        try:
            shapes[kind] = parse_template(f.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError) as exc:
            raise NotEvaluable(f"molde {f}: ilegível ({exc})")
    return shapes


# ---- the judgement of one file (pure) ------------------------------------------------------------------------------
def meaningful(line):
    """False for a body line that carries nothing: blank, only a list mark or an empty checkbox (`-`, `- [ ]`), only invisible or no-break spaces,
    only a code fence, or only punctuation and markup (`- -`, `—`, `.`, `>`, `| |`, `&nbsp;`, `<br>`): a line needs at least one letter or digit.
    A section whose lines are all like this is empty (the S-181 asks the section filled)."""
    s = _ZERO_WIDTH.sub("", line).strip()
    s = _LIST_MARK.sub("", s).strip()
    if _FENCE.match(s):
        return False
    s = _MARKUP.sub("", s)
    return any(ch.isalnum() for ch in s)


def gaps_of(kind, text, shape):
    """[(what, detail)] where `text` (the spec, plan or tasks of a feature) leaves the shape of its template. Pure."""
    gaps = []
    fm_block, body = _fm.split(text)
    if kind == "spec":
        have = _fm.scalars(text)
        for key in shape["keys"]:
            if key not in have:
                gaps.append(("frontmatter", f"falta a chave `{key}:` do frontmatter"))
    clean = _strip_comments(body)
    if shape["title"] and not re.search(rf"^# {re.escape(shape['title'])}\b", clean, re.M):
        gaps.append(("title", f"falta o título `# {shape['title']} …`"))
    if shape["approved"] and not re.search(r"^\*\*Approved\*\*", clean, re.M):
        gaps.append(("approved", "falta a linha `**Approved**:`"))
    found = {section_name(h): lines for h, lines in sections_of(body).items()}
    for name, want in shape["sections"].items():
        if not want["required"]:
            continue
        lines = found.get(name)
        if lines is None:
            gaps.append(("missing", f"falta a seção `## {want['heading']}`"))
        elif not [ln for ln in map(_norm, lines) if meaningful(ln) and ln not in want["placeholders"]]:
            gaps.append(("empty", f"a seção `## {want['heading']}` está vazia (só o comentário ou o modelo)"))
    return gaps


def legacy_numbers(record_text):
    """F128: the numbers of the features the approved from-to mapping brought from the legacy (the `feature` items of a brownfield or conform
    docs/specs/board-mapping.json). The phrase alone is not enough (judge's P1-2): the record is judged strict by board_mapping_check.py."""
    try:
        m = json.loads(record_text) if record_text else {}
    except ValueError:
        return set()
    if not isinstance(m, dict) or m.get("mode") not in ("brownfield", "conform"):
        return set()
    out = set()
    for i in m.get("items") or []:
        hit = isinstance(i, dict) and i.get("type") == "feature" and re.match(r"^F(\d{2,})$", str(i.get("id")))
        if hit:
            out.add(int(hit.group(1)))
    return out


def feature_findings(num, status, texts, shapes, since=SINCE_FEATURE, pending_error_from=PENDING_ERROR_FROM, today=None, legacy=False):
    """[(level, kind, message)] for one feature; level is `error` | `warn`. `texts` maps spec/plan/tasks to the text or None. Pure.
    A status outside the vocabulary is an ERROR (a feature graded by another word would escape the gate)."""
    if num < since:
        return []
    key = (status or "").strip().casefold()
    if key in OFF_TRACK:
        return []
    if legacy and key in CLOSED and _LEGACY.search(texts.get("spec") or ""):
        return []           # F128: a legacy feature (closed before the harness) keeps the shape its sprint wrote, in `legacy/`
    if key not in CLOSED and key not in OPEN:
        return [("error", "spec", f"status `{(status or '').strip()}` fora do vocabulário ({STATUS_VOCABULARY}): o portão da forma não sabe se a feature fechou")]
    closed = key in CLOSED
    level = "error" if closed else "warn"
    turned = (today or _clock.today()) >= PENDING_TURN_DATE
    out = []
    for kind in KINDS:
        text = texts.get(kind)
        if text is None or not text.strip():
            out.append((level, kind, f"{kind}.md ausente ou vazio"))
            continue
        for _what, detail in gaps_of(kind, text, shapes[kind]):
            out.append((level, kind, detail))
        n = len(PENDING.findall(_INVISIBLE.sub("", _strip_comments(text))))
        if n and closed:
            hard = num >= pending_error_from or turned
            when = "" if num >= pending_error_from else (f" (erro desde {PENDING_TURN_DATE.isoformat()}; dono: o integrador, no fecho da feature)" if turned
                                                         else f" (vira erro em {PENDING_TURN_DATE.isoformat()}; dono: o integrador, no fecho da feature)")
            out.append(("error" if hard else "warn", kind, f"{n} campo(s) «a escrever» ainda no {kind}.md de uma feature fechada{when}"))
        elif n:
            out.append(("warn", kind, f"{n} campo(s) «a escrever» no {kind}.md (a via rápida documenta depois, mas antes do fecho)"))
    return out


def status_of(spec_text):
    return _fm.scalars(spec_text or "").get("status", "")


# ---- reading the repository ----------------------------------------------------------------------------------------
def projects_of(root):
    """The root and each apps/*/ that carries a features folder, as (label prefix, folder)."""
    root = Path(root)
    found = [("", root)]
    if (root / "apps").is_dir():
        found += [(f"apps/{p.name}/", p) for p in sorted((root / "apps").iterdir()) if p.is_dir()]
    return [(pre, p) for pre, p in found if (p / FEATURES_REL).is_dir()]


def read(path):
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def findings(root, shapes=None, since=SINCE_FEATURE, pending_error_from=PENDING_ERROR_FROM):
    """[(level, path of the feature folder, kind, message)] for the whole repository (the working tree)."""
    shapes = shapes or load_shapes(root)
    out = []
    for pre, proj in projects_of(root):
        mapped = legacy_numbers(read(proj / RECORD_REL))
        for d in sorted(x for x in (proj / FEATURES_REL).iterdir() if x.is_dir() and _FEATURE_DIR.match(x.name)):
            num = int(_FEATURE_DIR.match(d.name).group(1))
            if num < since:
                continue
            texts = {k: read(d / f"{k}.md") for k in KINDS}
            if texts["spec"] is None:
                out.append(("warn", f"{pre}{FEATURES_REL}/{d.name}", "spec", "spec.md ausente"))
                continue
            for level, kind, msg in feature_findings(num, status_of(texts["spec"]), texts, shapes, since, pending_error_from,
                                                     legacy=num in mapped):
                out.append((level, f"{pre}{FEATURES_REL}/{d.name}", kind, msg))
    return out


def staged_shapes(root, top):
    """The shapes for the pre-commit, read from the INDEX (the copy the commit will contain), never from the disk: a `mv`, a `git mv` in the same
    commit or a sparse-checkout must not drop the gate (recheck of 2026-10-27, P1-1). `TemplatesMissing` ONLY when the repository does not version
    the templates at all - nothing in the index AND nothing in HEAD under their path (a throwaway repository, a project without the harness's
    skills); if either has them and the index lacks a file, it is `NotEvaluable` (exit 2: the commit is refused)."""
    try:
        rel = (Path(root).resolve().relative_to(Path(top).resolve()) / TEMPLATES_REL).as_posix()
    except ValueError:
        raise NotEvaluable(f"{root}: fora de {top} - não avaliável")
    in_index = _git.run(top, "ls-files", "--cached", "-z", "--", rel)
    if in_index.code != 0:
        raise NotEvaluable(f"git ls-files saiu {in_index.code}: {(in_index.err or in_index.out).strip()[:160]}")
    in_head = _git.run(top, "ls-tree", "-r", "--name-only", "-z", "HEAD", "--", rel)   # non-zero in a repository with no commit yet: nothing there
    versioned_head = in_head.code == 0 and bool(in_head.out.strip("\0"))
    if not in_index.out.strip("\0") and not versioned_head:
        raise TemplatesMissing(f"os moldes do SDD não estão versionados em {TEMPLATES_REL} - não avaliável")
    shapes = {}
    for kind in KINDS:
        g = _git.run(top, "show", f":{rel}/{kind}.md")
        if g.code != 0:
            raise NotEvaluable(f"molde {rel}/{kind}.md: ausente do índice (o commit os tirou ou os moveu) - não avaliável")
        shapes[kind] = parse_template(g.out)
    return shapes


def staged_findings(root, shapes=None, since=SINCE_FEATURE, pending_error_from=PENDING_ERROR_FROM):
    """The same, for the features the commit adds or changes, read from the INDEX (what the commit will contain)."""
    top = _git.toplevel(root)
    if top is None:
        raise NotEvaluable(f"{root}: não é um repositório git - não avaliável")
    r = _git.run(top, "diff", "--cached", "--name-only", "--diff-filter=AMR", "-z")
    if r.code != 0:
        raise NotEvaluable(f"git diff --cached saiu {r.code}: {(r.err or r.out).strip()[:160]}")
    touched = {}
    for p in (x for x in r.out.split("\0") if x):
        m = _FEATURE_FILE.match(p)
        if m and int(m.group("num")) >= since:
            touched[m.group("proj") + FEATURES_REL + "/" + m.group("dir")] = int(m.group("num"))
    if not touched:
        return []
    shapes = shapes or staged_shapes(root, top)
    out = []
    for folder, num in sorted(touched.items()):
        texts = {}
        for k in KINDS:
            g = _git.run(top, "show", f":{folder}/{k}.md")
            texts[k] = g.out if g.code == 0 else None
        if texts["spec"] is None:
            out.append(("warn", folder, "spec", "spec.md fora do índice"))
            continue
        rec = _git.run(top, "show", f":{folder.split(FEATURES_REL)[0]}{RECORD_REL}")
        mapped = legacy_numbers(rec.out if rec.code == 0 else "")
        for level, kind, msg in feature_findings(num, status_of(texts["spec"]), texts, shapes, since, pending_error_from,
                                                 legacy=num in mapped):
            out.append((level, folder, kind, msg))
    return out


# ---- the report ----------------------------------------------------------------------------------------------------
def _grouped(found, level):
    """[(folder, kind, [messages])] of one level, in the order they were found (one line per file, not per gap)."""
    out = {}
    for lvl, folder, kind, msg in found:
        if lvl == level:
            out.setdefault((folder, kind), []).append(msg)
    return [(f, k, m) for (f, k), m in out.items()]


def report(found, staged):
    """Prints the findings, one line per file (errors first); returns the exit code."""
    errors = _grouped(found, "error")
    warns = _grouped(found, "warn")
    for folder, kind, msgs in errors:
        print(f"  ERRO  {folder}/{kind}.md: {' · '.join(msgs)}")
    for folder, kind, msgs in warns:
        print(f"  aviso {folder}/{kind}.md: {' · '.join(msgs)}")
    if errors:
        folders = sorted({f for f, _k, _m in errors})
        print(f"sdd_shape_check: {len(folders)} feature(s) FECHADA(S) fora do molde do SDD - "
              + ("o commit não pode fechar a feature assim; " if staged else "")
              + "escreva a seção (molde: mjrp-skills/mjrp-sw-factory/builder/mjrp-specifying-sdd-artifacts/templates/) "
                "e chame a `mjrp-ensuring-sdd`; uma feature nova nasce de `python3 mjrp-scripts/new_feature.py`")
        return 1
    if not staged:
        print(f"sdd_shape_check: ok - nenhuma feature fechada (F{SINCE_FEATURE}+) fora do molde; "
              f"{len({f for f, _k, _m in warns})} feature(s) com aviso (aberta ou com «a escrever»)")
    return 0


def main(argv):
    args = list(argv)
    staged = "--staged" in args
    as_json = "--json" in args
    args = [a for a in args if a not in ("--staged", "--json")]
    if len(args) != 1:
        print("uso: sdd_shape_check.py <raiz> [--staged] [--json]", file=sys.stderr)
        return 2
    root = Path(args[0]).resolve()
    if not root.is_dir():
        print(f"sdd_shape_check: {root}: não é uma pasta - não avaliável", file=sys.stderr)
        return 2
    try:
        found = staged_findings(root) if staged else findings(root)
    except TemplatesMissing as exc:
        if staged:   # ONLY a repository that does not version the templates (a throwaway repository, a project without the harness's skills)
            print(f"sdd_shape_check: {exc}; o commit NÃO foi conferido contra os moldes (este repositório não os versiona)", file=sys.stderr)
            return 0
        print(f"sdd_shape_check: {exc}", file=sys.stderr)
        return 2
    except (NotEvaluable, _git.GitError) as exc:
        print(f"sdd_shape_check: {exc}", file=sys.stderr)
        return 2
    if as_json:
        print(json.dumps([{"level": a, "folder": b, "kind": c, "message": d} for a, b, c, d in found], ensure_ascii=False, indent=1))
        return 1 if any(f[0] == "error" for f in found) else 0
    return report(found, staged)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
