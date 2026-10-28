#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
product_structure_check.py - can the Control Center show this product? Reads a project the way the Control Center
reads it and says, per screen, what it cannot render: the judge of the `product-structure` catalog item.

Born 2026-10-14 19:57 (decision of the MJRP, critical): in the fin-control the epics were right (11 `^EP-`, 70 stories
with `epic:`) but there was no `^REL-` and no `planned_for:`, so the Control Center Board - built by release - came out
empty; the catalog did not see it (`releases@1` only asks that some `^REL` exists, and in ROADMAP.md OR the PRD, while
the Control Center reads releases only from ROADMAP.md). Nothing compared a child with what the screen needs.

The readers below mirror the Control Center's own parsers (apps/control-center/src/control_center/adapters/repo_fs/:
roadmap.py, prd.py, requirements.py, features.py, uat.py, mdtext.py) and its rules (rules/graph.py: the story status, the
"n de m" tally; modules/tracking/delivery.py: the release of a feature and of a UAT round). They are copied, not
imported: this script is harness core (stdlib only, ADR-0015) and is vendored into every child, where the Control
Center does not exist. A test of the Control Center (tests/adapters/test_product_structure_pin.py) pins these readers
to the real parsers on the Control Center itself and on the harness root: change a parser there and that test fails
until this file follows.

What is a gap (each with file:line and the owner skill):
  - outcomes (ROADMAP.md): the file, its format, at least one outcome, each in Now/Next/Later, with its measure
    (`- **Medida:**` in its own `###` section - the only way the screen shows it) and its `tags::`; a declared
    `contributes_to::` that the screen would not resolve (rules/contribution.py: the target is the ROADMAP.md of a
    project with a contract, inside the same repository, not the roadmap itself, holds that `^OUT-xx` block - a `^REL`
    is not one - and the edges close no cycle);
  - releases: at least one `^REL-xx` in ROADMAP.md (a release only in the PRD never reaches the screen), and each one
    with at least one story that counts (a release with none shows "sem stories": either it has stories or it is not a
    release yet - the human's call);
  - epics (docs/specs/prd.md): the file, its format, at least one epic, each serving (`serves::`) an outcome that exists,
    and every row of the epic table with a name the screen can find (`epic_name_missing`, product-structure@8, CM-0069:
    `| **EP-xx · nome** |`, `| EP-xx · nome |` or `| EP-xx | nome |` under a `Nome`/`Épico` header - same rule as the reader,
    `epic_identity`; the reader takes the second cell as the name only under such a header, never "Serve" or "Estado");
  - stories (docs/specs/requirements/): every node readable; every story that is not Deferred or Cancelled has an
    `epic:` that is an epic of the PRD; from Prioritized on it also has a `planned_for:` that is a release of ROADMAP.md (the
    epic's own `planned_for` does not reach the screen) - the same ruler as the requirements-graph sensor with
    `release_required` on (`product-structure@2`). Only a Backlog story without a release is legitimate (the release is
    chosen when the story is prioritized); it is counted in "sem release", and a `planned_for:` it does declare must still
    resolve. A transversal NFR (`type: nfr`, or an `NFR-nn` / `<PFX>-NFR-nn` id) binds every feature and has neither epic
    nor release, by the requirements-graph rule: it raises no gap and is NOT counted in "sem release" nor in any release's
    "n de m" (the Control Center core, rules/graph.py `is_transversal`, F22 - UAT-150); it is only reported apart;
  - features (docs/specs/features/Fxx-*/): spec.md and tasks.md readable; a normal feature imports stories that exist
    and land in a release, a Fix feature (`solution_type: fix`) names UAT issues (`fixes:`) whose round lands in a release.
    A feature carries `lane:` (`standard | fast`, the PDLC lane) and `solution_type:` (`feature | fix`); the legacy `track:`
    of the closed specs still reads (`Fix` = fix, anything else = feature; no `lane` = standard; `solution_type` wins when
    both exist - `feature_kind`). A feature with none of them is read as a normal one - listed in the counts;
    every feature has its `## Summary` right before `## Problem Statement`, in three paragraphs, each starting with its
    label - `**A feature:**`, `**Por quê:**`, `**Como saber que funcionou:**`, in this order (`product-structure@3`): the
    drawer shows the whole Summary, the paragraphs as written (features.py `description_of`);
  - UAT (docs/specs/uat.md): readable, in uat@2 (the Gravidade column), each round's release name is a release; and
    each issue that is not closed, or was reported on or after UAT3_SINCE (2026-10-16), has its `Descrição` in the
    labeled parts of `uat@3` (`product-structure@4`) - **O que acontece:** · **O que deveria acontecer:** · **Como
    ver:** (a list) · **Evidência:** (a list) · and, optional, **Causa:** -, joined by `<br>`: the drawer of the issue
    draws each part (uat.py `description_parts`). An issue closed before that day is not judged until its rewrite.
    After the parts, optional and the very last, `**Aberta por:** agente (<quem>)` (UAT-220): who opened the issue -
    absent = the human, the MJRP; an agent's issue is checked and closed by an agent. It is not a part of the
    description (uat.py `split_opened_by` takes it off first); a value that is not `agente (<quem>)` (or `humano`), or
    the label anywhere but last, is the gap `uat_issue_opened_by`. Accepting it widens the grammar, it rejects nothing
    that was valid: `product-structure@4` stays.
WARNINGS (`product-structure@5`, CM-0027; born of the audit of the fin-control conform, 2026-10-17, where notes passed by
form only): printed after the gaps, in `--json` under `warnings`, and they NEVER change the exit code. They are judgments of
content that a pattern can only approximate, so they point at what a separate-agent audit must read:
  - outcomes: a `###` outcome without `- **Problema:**` / `- **Quem sente:**` (`outcome_no_problem`, `outcome_no_who`; the
    file-level demand is the catalog's `roadmap@4`); the OUTCOME CYCLE - an outcome in Now whose stories are all done and
    that has no `achieved:: AAAA-MM-DD` (`outcome_done_not_achieved`: it is "em monitoramento", only the MJRP marks it
    achieved), one that has `achieved::` and is still in Now (`outcome_achieved_in_now`), one achieved or in `## Alcançados`
    that lacks the date or the `- **Valor medido:**` / `- **Aprendizado:**` bullets (`outcome_achieved_incomplete`), and more
    than 5 outcomes in progress in Now (`now_too_many`; "em monitoramento" does not count);
  - features: the SIZE SIGNALS of a feature - a feature is the smallest vertical slice that delivers value observable by
    whoever uses it, fits one round of execution and verification and is confirmed with a single verification - more than
    8 imported stories (`feature_many_stories`), stories from 3 or more epics (`feature_many_epics`), more than 12 tasks
    (`feature_many_tasks`). Never a failure: the split is the human's call;
  - UAT: code or function names in the plain parts of an issue (`uat_issue_code_in_plain_part`), a fix report ("Corrigido:")
    where the expectation belongs (`uat_issue_fix_report`), and an issue whose evidence cites a judge, recheck, critique or
    audit but has no `**Aberta por:** agente (<quem>)` (`uat_issue_opened_by_missing`).
  (The PRD x specs comparison of `product-structure@7`, `entregue_status_mismatch` / `entregue_done_not_cited`, was retired in `product-structure@9`,
  CM-0079: the PRD no longer has a `## Entregue` section - what is done is read from the embedded stories; the `prd@2` item guards the form.)
A file that is not valid UTF-8 is a gap naming the file (the screen cannot read it), never an exit 2.
It also prints the counts the screen shows ("n de m" per release, epic and outcome; "sem release").

Every gap in `--json` carries a stable `code` (snake_case); the messages are prose and may be reworded, the codes may not
(the structure gate and the tests select on them).

Usage:
  python3 mjrp-scripts/product_structure_check.py <project> [--json] [--quiet]
  python3 mjrp-scripts/product_structure_check.py <project> --story <story file> [--json]
Exit: 0 every view renders · 1 gaps (listed) · 2 not evaluable (no project, no contract, not a code-app).
`--story` is the Discovery -> Delivery gate of `mjrp-pdlc`: only the gaps on that story's file plus the ones that stop the
screen from reading ROADMAP.md, the PRD or the requirements (GATE_BLOCKING); the rest of the project's gaps do not block it.
The path may be relative to the working directory or to the project, `./`-prefixed or absolute; a path that is not a
requirement node of the project is exit 2 (not evaluable is never a pass).
A feature with an open branch is read in the working tree here (the screen reads it at the branch head).
"""
import json
import os
import re
import sys
from pathlib import Path

# ------------------------------------------------------------------ owners ----------------------------------------
OWNER_PM = "mjrp-coaching-pm"
OWNER_REQS = "mjrp-writing-reqs"
OWNER_SDD = "mjrp-specifying-sdd-artifacts"

ROADMAP_FILE = "ROADMAP.md"
PRD_FILE = "docs/specs/prd.md"
REQUIREMENTS_DIR = "docs/specs/requirements"
FEATURES_DIR = "docs/specs/features"
UAT_FILE = "docs/specs/uat.md"
CONTRACT_FILE = ".mjrp-project.yml"

# ------------------------------------------------------------------ mdtext.py (mirror) ------------------------------
_MD_MARKER = re.compile(r"\^(?:[A-Z]+-)?(?:OUT|REL|EP)-\d+")
_MD_KIND = re.compile(r"\bkind::\s*\w+")


def flat(text):
    return re.sub(r"\s+", " ", text).strip()


def plain(text):
    text = _MD_KIND.sub("", _MD_MARKER.sub("", text))
    text = text.replace("**", "").replace("`", "")
    return flat(text).strip("* ").strip()


def table_cells(line):
    body = line.strip()
    if body.startswith("|"):
        body = body[1:]
    if body.endswith("|") and not body.endswith("\\|"):
        body = body[:-1]
    cells, current, in_code = [], [], False
    chars = iter(range(len(body)))
    for i in chars:
        ch = body[i]
        if ch == "`":
            in_code = not in_code
        if ch == "\\" and body[i + 1:i + 2] == "|":
            current.append("|")
            next(chars, None)
        elif ch == "|" and not in_code:
            cells.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    cells.append("".join(current).strip())
    return cells


def is_separator(line):
    cells = table_cells(line)
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", c) for c in cells)


class FormatError(ValueError):
    """A file the screen cannot read: the line and the reason (the Control Center's `failed` read)."""

    def __init__(self, line, reason, file=None):
        super().__init__(reason)
        self.line, self.reason, self.file = line, reason, file


# ------------------------------------------------------------------ roadmap.py (mirror) -----------------------------
TITLE_LIMIT = 160
_PREFIX = r"(?:[A-Z]+-)?"
_ANY_MARKER = re.compile(rf"\^{_PREFIX}(?:OUT|REL)-\d+")
_OUT_END = re.compile(rf"\^(?P<id>{_PREFIX}OUT-\d+)\s*$")
_REL_END = re.compile(rf"^(?P<text>.*?)\s*\^(?P<id>{_PREFIX}REL-\d+)\s*$")
_CONTRIBUTES = re.compile(r"^contributes_to::\s*\[\[(?P<target>[^\]|]+)(?:\|[^\]]*)?\]\]")
_ACHIEVED = re.compile(r"^achieved::\s*(?P<day>\d{4}-\d{2}-\d{2})")
_BULLET = re.compile(r"^- ")
_LABELED = re.compile(r"^- \*\*(?P<label>.+?)\*\*(?P<rest>.*)$")
_HORIZON = re.compile(r"(Now|Next|Later)\b")
_FIELD_LABELS = ("quem sente", "problema", "hoje", "medida", "sinal", "solução", "opções")


def _horizon(*headings):
    for heading in headings:
        found = _HORIZON.match(heading or "")
        if found:
            return found[1]
    return None


def _road_sections(lines):
    blocks, h2, h3, start = [], None, None, 0
    for i, line in enumerate(lines):
        if line.startswith(("## ", "### ")):
            blocks.append((h2, h3, start, i))
            start = i
            if line.startswith("## "):
                h2, h3 = line[3:].strip(), None
            else:
                h3 = line[4:].strip()
    blocks.append((h2, h3, start, len(lines)))
    return blocks


def _unit_start(lines, end, floor):
    i = end
    while i > floor and lines[i].strip() and not _BULLET.match(lines[i]):
        if not lines[i - 1].strip() or lines[i - 1].startswith("#"):
            break
        i -= 1
    return i


def _fields(lines):
    found = {}
    for i, line in enumerate(lines):
        match = _LABELED.match(line)
        if not match:
            continue
        label = plain(match["label"]).rstrip(":").casefold()
        parts = [match["rest"]]
        for follow in lines[i + 1:]:
            if not follow.strip() or _BULLET.match(follow):
                break
            parts.append(follow)
        found.setdefault(label, plain(" ".join(parts)).lstrip(":").strip())
    return found


def _pick(fields, *names):
    for name in names:
        for label, text in fields.items():
            if label.startswith(name) and text:
                return text
    return None


def parse_roadmap(text):
    """{"outcomes": [...], "releases": [...]} as the Control Center reads them, plus the line of each marker.
    Raises FormatError when the screen would show the roadmap as `failed/unsupported_format`."""
    lines = text.splitlines()
    marked = [i for i, line in enumerate(lines, 1) if _ANY_MARKER.search(line)]
    if not marked:
        raise FormatError(1, "sem marcadores ^OUT-xx / ^REL-xx")
    outcomes = {}
    for h2, h3, first, last in _road_sections(lines):
        block = lines[first:last]
        ends = [(i, _OUT_END.search(lines[i])) for i in range(first, last)]
        ends = [(i, m) for i, m in ends if m]
        single = len(ends) == 1 and h3 is not None
        fields = _fields(block) if single else {}
        tags = re.findall(r"#([\w-]+)", next((x for x in block if x.startswith("tags::")), ""))
        contributes = next((m["target"].strip() for m in map(_CONTRIBUTES.match, block) if m), None)
        achieved = next((m["day"] for m in map(_ACHIEVED.match, block) if m), None)
        for i, match in ends:
            if match["id"] in outcomes:
                continue
            unit = flat(" ".join(lines[_unit_start(lines, i, first):i + 1]))
            labeled = _LABELED.match(unit)
            is_field = bool(labeled) and plain(labeled["label"]).rstrip(":").casefold().startswith(_FIELD_LABELS)
            bare = re.sub(r"^[-*]\s+(?:\[[ xX]\]\s*)?", "", unit)
            title = h3 if (single and is_field) else plain(bare)[:TITLE_LIMIT]
            outcomes[match["id"]] = {
                "id": match["id"], "horizon": _horizon(h3, h2), "title": plain(title or match["id"]),
                "who": _pick(fields, "quem sente"), "problem": _pick(fields, "problema", "hoje"),
                "measure": _pick(fields, "medida", "sinal"), "tags": list(tags if single else ()),
                "contributes_to": contributes if single else None, "line": i + 1, "single": single,
                # product-structure@5 (not on the screen yet - the pin test compares only the keys above): the outcome cycle
                "achieved": achieved if single else None, "section": h2,
                "has_value": bool(_pick(fields, "valor medido")), "has_learning": bool(_pick(fields, "aprendizado", "o que aprendemos")),
            }
    releases = {}
    for number, line in enumerate(lines, 1):
        match = _REL_END.match(line)
        if not match or match["id"] in releases:
            continue
        body = re.sub(r"^[-*]\s*", "", match["text"])
        named = re.match(r"\*\*(?P<name>.+?)\*\*\s*[—–-]?\s*(?P<desc>.*)$", body)
        name, desc = (named["name"], named["desc"]) if named else (body, "")
        releases[match["id"]] = {"id": match["id"], "name": plain(name) or match["id"], "desc": plain(desc) or None,
                                 "line": number}
    if not outcomes and not releases:
        raise FormatError(marked[0], "marcador ^OUT-xx / ^REL-xx fora do fim da linha")
    return {"outcomes": list(outcomes.values()), "releases": list(releases.values())}


# ------------------------------------------------------------------ prd.py (mirror) ---------------------------------
INTAKE_EPIC = "EP-90"
_ROW_BOLD = re.compile(rf"^\*\*(?P<id>{_PREFIX}EP-\d+)\s*(?:[·—–:]|\s-)\s*(?P<name>[^*]+?)\*\*")
_ID_TOKEN = re.compile(r"\b(?:[A-Z]+-)+\d+\b")
_ROW_ID = re.compile(rf"^(?P<id>{_PREFIX}EP-\d+)\b")
_ROW_ONE_CELL = re.compile(rf"^(?P<id>{_PREFIX}EP-\d+)\s*(?:[·—–:]|\s-)\s*(?P<name>\S.*)$")
NAME_HEADERS = ("nome", "name", "título", "titulo", "épico", "epico", "epic", "o que é", "o que e")
_SECTION = re.compile(rf"^### (?P<id>{_PREFIX}EP-\d+)\s*·\s*(?P<name>.+?)\s*$")
_OUT = re.compile(rf"\^({_PREFIX}OUT-\d+)")


def _named(eid, name):
    """A name made only of ID tokens (`OUT-03`, `EP-11 - EP-12`) is a column read by mistake, not a name."""
    return (eid, name) if _ID_TOKEN.sub("", name).strip(" \t,;:·—–-/+&") else None


def epic_identity(cells, header):
    """(id, name) of an epic-table row, or None when the name cannot be found (prd.py `epic_identity`, product-structure@8)."""
    first = cells[0] if cells else ""
    bold = _ROW_BOLD.match(first)
    if bold:
        return _named(bold["id"], plain(bold["name"]))
    flat = plain(first)
    one = _ROW_ONE_CELL.match(flat)
    if one:
        return _named(one["id"], plain(one["name"]))
    bare = _ROW_ID.match(flat)
    if bare and flat == bare["id"] and len(cells) > 1 and len(header) > 1:
        if plain(header[1]).casefold().startswith(NAME_HEADERS) and plain(cells[1]):
            return bare["id"], plain(cells[1])
    return None


def why_no_name(cells):
    if _ROW_ID.match(plain(cells[0] if cells else "")):
        return "épico sem nome: escreva `EP-xx · nome` na primeira célula (ou um cabeçalho `Nome` na segunda coluna)"
    return "linha da tabela de épicos sem `EP-xx`"


def epic_name_problems(text):
    """[(line, reason)] of EVERY epic-table row that has an `EP-xx` and no name the screen can find (the reader stops at
    the first and fails the whole PRD; the gate lists them all, so the child fixes the table in one pass). A row with no
    `EP-xx` at all stays the reader's `prd_unreadable`."""
    found = []
    for _, header, rows in _tables(text.splitlines()):
        if not plain(header[0]).casefold().startswith(("epic", "épico", "epico")):
            continue
        for row_number, cells in rows:
            if epic_identity(cells, header) is None and _ROW_ID.match(plain(cells[0] if cells else "")):
                found.append((row_number, why_no_name(cells)))
    return found


def _column(header, *names):
    for index, cell in enumerate(header):
        if plain(cell).casefold().startswith(names):
            return index
    return None


def _cell(cells, index):
    if index is None or index >= len(cells):
        return None
    return plain(cells[index]) or None


def _tables(lines):
    found, i = [], 0
    while i < len(lines):
        if lines[i].lstrip().startswith("|") and i + 1 < len(lines) and is_separator(lines[i + 1]):
            rows, j = [], i + 2
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                rows.append((j + 1, table_cells(lines[j])))
                j += 1
            found.append((i + 1, table_cells(lines[i]), rows))
            i = j
        else:
            i += 1
    return found


def parse_prd(text):
    """{"epics": [{id, name, outcomes, exit_criterion, declared, line}]} as the Control Center reads them.
    Raises FormatError where the screen would show `failed/unsupported_format`."""
    lines = text.splitlines()
    table = {}
    for number, header, rows in _tables(lines):
        if not plain(header[0]).casefold().startswith(("epic", "épico", "epico")):
            continue
        state, exit_ = _column(header, "estado", "status"), _column(header, "critério", "criterio")
        placed = 0
        for row_number, cells in rows:
            identity = epic_identity(cells, header)
            if identity is None:
                raise FormatError(row_number, why_no_name(cells))
            eid, name = identity
            placed += 1
            if eid != INTAKE_EPIC:
                table[eid] = {"name": name, "exit": _cell(cells, exit_), "declared": _cell(cells, state), "line": row_number}
        if not placed:
            raise FormatError(number, "tabela de épicos sem nenhuma linha")
    sections = {}
    for i, line in enumerate(lines):
        match = _SECTION.match(line)
        if not match:
            continue
        serves, exit_ = (), None
        for follow in lines[i + 1:]:
            if follow.startswith("#"):
                break
            if follow.startswith("serves::"):
                serves = tuple(dict.fromkeys(_OUT.findall(follow)))
            elif follow.startswith("exit::"):       # prd@2: the criterion moved from the table column to this line
                exit_ = plain(follow[len("exit::"):]) or None
        sections[match["id"]] = (plain(match["name"]), serves, i + 1, exit_)
    epics = []
    for eid in dict.fromkeys([*table, *(k for k in sections if k != INTAKE_EPIC)]):
        row = table.get(eid)
        name, serves, sline, section_exit = sections.get(eid, (row["name"] if row else eid, (), None, None))
        epics.append({"id": eid, "name": row["name"] if row else name, "outcomes": list(serves),
                      "exit_criterion": (row["exit"] if row else None) or section_exit, "declared": row["declared"] if row else None,
                      "line": sline or (row["line"] if row else 1), "has_section": sline is not None})
    return {"epics": epics}


# ------------------------------------------------------------------ requirements.py (mirror) --------------------------
INDEX_NAME = "folder-index.md"
_KEY = re.compile(r"^(?P<key>[A-Za-z_][\w-]*):(?:[ \t]+(?P<value>.*))?$")
_COMMENT = re.compile(r"\s+#.*$")
_EPIC = re.compile(rf"\^({_PREFIX}EP-\d+)")
_RELEASE = re.compile(rf"\^({_PREFIX}REL-\d+)")
_NFR_ID = re.compile(r"^(?:[A-Z]+-)?NFR-\d+$")   # a transversal NFR: no epic, no release (rules/graph.py is_transversal)


def _scalar(raw):
    value = _COMMENT.sub("", (raw or "").strip()).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    return value or None


def parse_frontmatter(text):
    """(keys -> raw value, continuations, the line of each key). Raises FormatError as the Control Center does."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise FormatError(1, "sem frontmatter (a primeira linha deveria ser ---)")
    found, more, at, key = {}, {}, {}, ""
    for number, line in enumerate(lines[1:], start=2):
        if line.strip() == "---":
            return found, {k: "\n".join(v) for k, v in more.items()}, at
        if not line.strip() or line.startswith("#"):
            continue
        if line.startswith((" ", "\t", "-")):
            more.setdefault(key, []).append(line.strip())
            continue
        match = _KEY.match(line.rstrip())
        if not match:
            raise FormatError(number, "linha do frontmatter que não é chave: valor")
        key = match["key"]
        found[key] = match["value"]
        at[key] = number
    raise FormatError(len(lines), "frontmatter sem a linha --- de fechamento")


def parse_node(text, path):
    fields, more, at = parse_frontmatter(text)
    node_id, status = _scalar(fields.get("id")), _scalar(fields.get("status"))
    if not node_id:
        raise FormatError(1, "frontmatter sem id")
    if not status:
        raise FormatError(1, "frontmatter sem status")

    def whole(key):
        return f"{fields.get(key) or ''}\n{more.get(key, '')}"

    first = lambda rx, t: (rx.search(t) or [None, None])[1]  # noqa: E731
    return {"id": node_id, "status": status, "epic": first(_EPIC, whole("epic")),
            "nfr": _scalar(fields.get("type")) == "nfr" or bool(_NFR_ID.match(node_id)),
            "release": first(_RELEASE, whole("planned_for")), "path": path,
            "has_epic_key": "epic" in fields, "has_planned_key": "planned_for" in fields,
            "epic_line": at.get("epic", 1), "planned_line": at.get("planned_for", at.get("epic", 1))}


def read_nodes(root):
    """[node] or raises FormatError(file=...) - one unreadable node fails the whole reading, as on the screen.
    None when the folder does not exist (the screen: "sem grafo")."""
    folder = Path(root) / REQUIREMENTS_DIR
    if not folder.is_dir():
        return None
    nodes = []
    for file in sorted(folder.rglob("*.md")):
        if file.name == INDEX_NAME:
            continue
        rel = file.relative_to(root).as_posix()
        try:
            nodes.append(parse_node(file.read_text(encoding="utf-8"), rel))
        except FormatError as exc:
            exc.file = rel
            raise
        except UnicodeDecodeError:
            raise FormatError(1, "o arquivo não é UTF-8 válido", rel)
        except OSError:
            raise FormatError(1, "não foi possível ler", rel)
    return nodes


# ------------------------------------------------------------------ rules/graph.py (mirror) ---------------------------
_STORY_WORDS = {
    "backlog": "backlog", "prioritized": "prioritized", "ready": "ready",
    "in progress": "doing", "done": "done", "accepted": "accepted", "deferred": "deferred",
    "cancelled": "cancelled", "canceled": "cancelled",
}
OFF_TRACK = ("deferred", "cancelled")
SIZE_STORIES, SIZE_EPICS, SIZE_TASKS = 8, 3, 12     # product-structure@5: the size signals of a feature (a warning, never a gap)
NOW_MAX = 5                                          # product-structure@5: outcomes in progress in Now before the warning
PRE_RELEASE = ("backlog",)      # product-structure@2: no `planned_for:` required in Backlog only; from Prioritized on it is (epic: always)


def story_status(raw):
    text = raw.casefold()
    for word in sorted(_STORY_WORDS, key=len, reverse=True):
        if re.search(rf"\b{word}\b", text):
            return _STORY_WORDS[word]
    return "backlog"


def tally(statuses):
    """(done, live): "n de m" on the screen - Done+Accepted over everything but Deferred and Cancelled."""
    return sum(s in ("done", "accepted") for s in statuses), sum(s not in OFF_TRACK for s in statuses)


# ------------------------------------------------------------------ features.py + uat.py (mirror) ---------------------
_FOLDER = re.compile(r"^(?P<id>F\d{2,})-[a-z0-9-]+$")
_LINK = re.compile(r"\[\[(?P<id>(?:S|UC|EA)-\d+)[^\]]*\]\]")
_UAT_ID = re.compile(r"UAT-\d+")
_BOX = re.compile(r"^- \[(?P<x>[ xX])\]")


def feature_front(text, file):
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise FormatError(1, "sem frontmatter", file)
    out, at = {}, {}
    for number, line in enumerate(lines[1:], start=2):
        if line.strip() == "---":
            return out, at
        if ":" not in line:
            raise FormatError(number, "linha do frontmatter sem chave", file)
        key, _, value = line.partition(":")
        out[key.strip()] = value.strip()
        at[key.strip()] = number
    raise FormatError(1, "frontmatter sem fim", file)


def tasks_seen(text, file):
    inside = seen = False
    done = total = 0
    for line in text.splitlines():
        if line.startswith("## "):
            inside = line.startswith(("## Implementation", "## Verification"))
            seen = seen or inside
            continue
        box = _BOX.match(line) if inside else None
        if box:
            total += 1
            done += box.group("x") != " "
    if not seen:
        raise FormatError(1, "sem seção ## Implementation nem ## Verification", file)
    return done, total


_SUMMARY = re.compile(r"^## Summary[ \t]*$", re.M)
_PROBLEM = re.compile(r"^## Problem Statement[ \t]*$", re.M)
_HTML_COMMENT = re.compile(r"<!--.*?-->", re.S)
SUMMARY_LABELS = ("**A feature:**", "**Por quê:**", "**Como saber que funcionou:**")


def section_paragraphs(text, heading):
    """features.py `_paragraphs`: the paragraphs of a `##` section (blank-line separated, each one line; HTML comments
    out), up to the next heading. None when the section is not there."""
    text = _HTML_COMMENT.sub("", text or "")
    found = heading.search(text)
    if not found:
        return None
    out, cur = [], []
    for line in text[found.end():].splitlines():
        if line.startswith("#"):
            break
        if not line.strip():
            if cur:
                out.append(" ".join(cur))
                cur = []
            continue
        cur.append(line.strip())
    if cur:
        out.append(" ".join(cur))
    return out


def summary_problems(text):
    """What a feature's `## Summary` lacks (product-structure@3), as [(code, message, line)]: [] when it is right."""
    lines = (text or "").splitlines()

    def line_of(rx):
        return next((i for i, x in enumerate(lines, start=1) if rx.fullmatch(x)), None)
    at, problem_at = line_of(_SUMMARY), line_of(_PROBLEM)
    labels = " · ".join(SUMMARY_LABELS)
    if at is None:
        return [("feature_summary_missing", "sem `## Summary`: a gaveta da feature mostra só o problema — escreva, antes do "
                 f"`## Problem Statement`, o resumo em três parágrafos, cada um começando pelo rótulo: {labels}", problem_at or 1)]
    if problem_at is not None and problem_at < at:
        return [("feature_summary_after_problem", "o `## Summary` vem depois do `## Problem Statement`: ele vai logo antes", at)]
    paragraphs = section_paragraphs(text, _SUMMARY) or []
    starts = [next((lb for lb in SUMMARY_LABELS if p.startswith(lb)), None) for p in paragraphs]
    missing = [lb for lb in SUMMARY_LABELS if lb not in starts]
    if not missing:
        if [x for x in starts if x] != list(SUMMARY_LABELS):
            return [("feature_summary_labels", f"os rótulos do `## Summary` fora da ordem ou repetidos: {labels}, um parágrafo cada", at)]
        return []
    joined = [lb for lb in missing if any(lb in p for p in paragraphs)]
    absent = [lb for lb in missing if lb not in joined]
    why = []
    if joined:
        why.append(f"{', '.join(joined)} " + ("não começam o próprio parágrafo — pule uma linha antes de cada rótulo" if len(joined) > 1 else "não começa o próprio parágrafo — pule uma linha antes do rótulo"))
    if absent:
        why.append(f"falta {', '.join(absent)}")
    return [("feature_summary_labels", f"o `## Summary` não está em três parágrafos ({labels}): {'; '.join(why)}", at)]


def feature_kind(front):
    """(lane, solution_type, declared) of a spec's frontmatter. `solution_type:` (`feature | fix`) wins; the legacy
    `track:` still reads (`Fix` = fix, any other value = feature); an absent `lane:` (`standard | fast`) reads as
    standard. `declared` is False when the spec says none of the three keys (the screen reads it as a normal feature)."""
    lane = front.get("lane", "").strip().casefold()
    kind = front.get("solution_type", "").strip().casefold()
    legacy = front.get("track", "").strip()
    if kind not in ("feature", "fix"):
        kind = "fix" if legacy.casefold() == "fix" else "feature"
    return (lane if lane in ("standard", "fast") else "standard"), kind, bool(lane or front.get("solution_type", "").strip() or legacy)


def read_feature(root, folder):
    """{id, folder, imports, track, lane, solution_type, fixes, has_track, line} or a FormatError (the card shows the failure)."""
    base = Path(root) / FEATURES_DIR / folder
    spec, tasks = base / "spec.md", base / "tasks.md"
    rel_spec = f"{FEATURES_DIR}/{folder}/spec.md"
    rel_tasks = f"{FEATURES_DIR}/{folder}/tasks.md"

    def text_of(path, rel):
        try:
            return path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            raise FormatError(1, "o arquivo não é UTF-8 válido", rel)

    spec_text = text_of(spec, rel_spec) if spec.is_file() else None
    front, at = feature_front(spec_text, rel_spec) if spec_text is not None else ({}, {})
    tasks_total = 0
    if tasks.is_file():
        tasks_total = tasks_seen(text_of(tasks, rel_tasks), rel_tasks)[1]
    lane, solution_type, declared = feature_kind(front)
    return {"id": _FOLDER.match(folder)["id"], "folder": folder, "spec": rel_spec, "spec_exists": spec.is_file(),
            "imports": [m["id"] for m in _LINK.finditer(front.get("imports", ""))],
            "lane": lane, "solution_type": solution_type,
            "track": "fix" if solution_type == "fix" else "normal",
            "has_track": declared, "fixes": _UAT_ID.findall(front.get("fixes", "")),
            "status": front.get("status", "").strip(), "status_line": at.get("status", 1),
            "imports_line": at.get("imports", 1), "fixes_line": at.get("fixes", 1),
            "summary": summary_problems(spec_text) if spec_text is not None else [], "tasks_total": tasks_total}


_ROUND = re.compile(r"^## Rodada (?P<n>\d+)\s+—\s+(?P<release>[^·(]+?)\s*(?:[·(].*)?$")
_HEAD_V1 = ["ID", "Contexto", "Tipo", "Reportado em", "Descrição", "Status", "OK do humano"]
_HEAD_V2 = ["ID", "Contexto", "Tipo", "Gravidade", "Reportado em", "Descrição", "Status", "OK do humano"]
_HEAD_V3 = ["ID", "Contexto", "Tipo", "Gravidade", "Reportado em", "Reportado por", "Descrição", "Status", "OK do humano"]
_SEVERITY = re.compile(r"^P[012]$")
_FIXING = re.compile(r"^fixing\s*\((?P<f>F\d{2,})\)")
_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")
UAT3_SINCE = "2026-10-16"       # `uat@3`: an issue reported on or after this day is judged even when closed
UAT_PARTS = (("happens", "O que acontece"), ("expected", "O que deveria acontecer"), ("how_to_see", "Como ver"),
             ("evidence", "Evidência"), ("cause", "Causa"))
_UAT_KEYS = {label: key for key, label in UAT_PARTS}
_UAT_BR = re.compile(r"\s*<br\s*/?>\s*", re.I)
_UAT_ANY = "|".join(re.escape(label) for _key, label in UAT_PARTS)
_UAT_LABEL = re.compile(r"^\*\*(?P<label>" + _UAT_ANY + r"):\*\*\s*(?P<rest>.*)$", re.S)
_UAT_LABEL_INSIDE = re.compile(r"\*\*(?:" + _UAT_ANY + r"):\*\*")
_UAT_ITEM = re.compile(r"^-\s+(?P<item>.+)$", re.S)
_UAT_OPENED_BY = re.compile(r"\s*<br\s*/?>\s*\*\*Aberta por:\*\*[ \t]*(?P<value>[^<]*?)\s*$", re.I)
_UAT_AGENT = re.compile(r"^agente(?:\s*\((?P<who>.+)\))?$", re.I | re.S)
_UAT_OPENED_LABEL = re.compile(r"\*\*Aberta por:\*\*", re.I)


def split_opened_by(cell):
    """uat.py `split_opened_by`: (the description without the marker, "human" | "agent", who) of a `Descrição` cell."""
    found = _UAT_OPENED_BY.search(cell)
    if found is None:
        return cell, "human", None
    agent = _UAT_AGENT.match(found.group("value").strip())
    who = agent.group("who").strip().replace("\\|", "|") if agent and agent.group("who") else None
    return cell[:found.start()], "agent" if agent else "human", who or None


def opened_by_problems(cell):
    """What the `**Aberta por:**` part of a `Descrição` gets wrong (UAT-220), as [(code, message)]: [] when it is absent
    (the human opened it) or is `agente (<quem>)` / `humano`, the very last."""
    body, _kind, _who = split_opened_by(cell)
    if _UAT_OPENED_LABEL.search(re.sub(r"`[^`]*`", "", body)):  # in `code` it is a mention, not the part
        return [("uat_issue_opened_by", "`**Aberta por:**` tem de ser a última parte da descrição, uma só, separada por `<br>`")]
    found = _UAT_OPENED_BY.search(cell)
    if found is None:
        return []
    value = found.group("value").strip()
    if re.match(r"^humano$", value, re.I):
        return []
    agent = _UAT_AGENT.match(value)
    if agent is None or not (agent.group("who") or "").strip():
        return [("uat_issue_opened_by", "`**Aberta por:**` aceita `agente (<quem>)` — o papel de quem abriu: juiz da F22, crítica de UX, "
                 "verificador — ou `humano`; sem a parte, a issue é do humano")]
    return []


def description_parts(text):
    """uat.py `description_parts`: [(key, text, (items,))] of a `Descrição` cell in `uat@3`; [] when it does not open
    with a label (the one paragraph it always was)."""
    segments = [seg.strip() for seg in _UAT_BR.split(text) if seg.strip()]
    if not segments or not _UAT_LABEL.match(segments[0]):
        return []
    parts = []          # [key, [text pieces], [items]]
    for seg in segments:
        label, item = _UAT_LABEL.match(seg), _UAT_ITEM.match(seg)
        if label:
            parts.append([_UAT_KEYS[label.group("label")], [label.group("rest").strip()], []])
        elif item:
            parts[-1][2].append(item.group("item").strip())
        else:
            parts[-1][1].append(seg)
    esc = lambda value: value.replace("\\|", "|")       # noqa: E731 - the cell's own escape
    return [(key, esc(" ".join(p for p in pieces if p)), tuple(esc(i) for i in items)) for key, pieces, items in parts]


def uat_issue_problems(text, parts):
    """What an issue's `Descrição` lacks (product-structure@4), as [(code, message)]: [] when it is in `uat@3`."""
    required = [key for key, _label in UAT_PARTS[:4]]
    named = " · ".join(f"**{label}:**" for _key, label in UAT_PARTS[:4]) + " · e, se houver, **Causa:**"
    if not parts:
        if _UAT_LABEL_INSIDE.search(text):
            return [("uat_issue_labels", "a descrição tem rótulos mas não abre por `**O que acontece:**` — ele é a primeira "
                     "parte, sem texto antes; separe as partes com `<br>`")]
        return [("uat_issue_unlabeled", "a descrição é um parágrafo só: escreva-a em partes, cada uma abrindo pelo rótulo em "
                 f"negrito e separadas por `<br>` — {named} (`mjrp-specifying-sdd-artifacts`, `uat-issue-description`)")]
    keys = [p[0] for p in parts]
    why = []
    absent = [label for key, label in UAT_PARTS if key in required and key not in keys]
    if absent:
        why.append("falta " + ", ".join(f"**{x}:**" for x in absent))
    elif keys != required and keys != required + ["cause"]:
        why.append(f"os rótulos fora da ordem ou repetidos: {named}")
    joined = sorted({p[0] for p in parts for field in (p[1], *p[2]) if _UAT_LABEL_INSIDE.search(field)})
    if joined:
        why.append("há rótulo que não abre a própria parte — separe as partes com `<br>`")
    by_key = {p[0]: p for p in parts}
    if "happens" in by_key and not by_key["happens"][1]:
        why.append("**O que acontece:** sem texto")
    if "expected" in by_key and not by_key["expected"][1]:
        why.append("**O que deveria acontecer:** sem texto")
    if "how_to_see" in by_key and not by_key["how_to_see"][2]:
        why.append("**Como ver:** sem passos (uma lista, `<br>- passo` por linha)")
    if "evidence" in by_key and not by_key["evidence"][2] and not by_key["evidence"][1]:
        why.append("**Evidência:** vazia (uma lista, um caminho ou link por linha; se não há, diga que não há)")
    return [("uat_issue_labels", "a descrição não está nas partes do `uat@3`: " + "; ".join(why))] if why else []


# ---- product-structure@5: content warnings on a description (a pattern approximates what only a reader sees)
_CODE_SPAN = re.compile(r"`[^`]+`")
_CODE_CALL = re.compile(r"\b[A-Za-z_]\w*\(\)")
_CODE_SNAKE = re.compile(r"\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b")
_CODE_UPPER = re.compile(r"\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b")
_CODE_CAMEL = re.compile(r"\b[a-z]{2,}[A-Z][A-Za-z0-9]*\b")
_CODE_FILE = re.compile(r"\b[\w-]+\.(?:py|mjs|cjs|jsx?|tsx?|html|css|json|ya?ml|md|sh|gs|sql)\b")
_CODE_OK = {"macOS", "iOS", "iPadOS", "watchOS", "tvOS", "visionOS", "iCloud", "eBay"}          # brand names that look like camelCase
_FIX_REPORT = re.compile(r"\b(?:corrigid[oa]s?|resolvid[oa]s?)\**\s*:", re.I)    # «Corrigido:» and «**Corrigido**:» (the colon outside the bold: UAT-02)
_AGENT_SOURCE = re.compile(r"\b(?:juiz|reconfer[eê]ncia|cr[ií]tica|critique|recheck|judge|verificador|audit(?:oria|or)?)\b|recheck|critique|-audit", re.I)
PLAIN_PARTS = ("happens", "expected")      # `uat@3`: plain words about what the person sees; names of code, files and commits live in Evidência/Causa ("Como ver" may point at where to look)


def code_name_in(text):
    """The first token of `text` that reads as a code name (a code span, `fn()`, snake_case, UPPER_SNAKE, camelCase, a file), or None."""
    for rx in (_CODE_SPAN, _CODE_CALL, _CODE_FILE, _CODE_UPPER, _CODE_SNAKE, _CODE_CAMEL):
        for m in rx.finditer(text):
            if m.group(0) not in _CODE_OK:
                return m.group(0)
    return None


def uat_content_warnings(row):
    """What an issue's `Descrição` gets wrong that a pattern can only approximate, as [(code, message)] (never a gap):
    a code name in a plain part ("O que acontece" / "O que deveria acontecer"), a fix report where the expectation belongs, an agent's finding without `**Aberta por:**`."""
    out = []
    labels = dict(UAT_PARTS)
    for key, text, items in row["parts"]:
        if key in PLAIN_PARTS:
            token = code_name_in(" ".join([text, *items]))
            if token:
                out.append(("uat_issue_code_in_plain_part", f"**{labels[key]}:** tem um nome de código ou arquivo ({token.strip('`')}): aqui vão palavras "
                            "comuns, o que a pessoa vê, para quem não abre o código; o nome técnico é da Evidência ou da Causa — reescreva dizendo o que a pessoa vê"))
        if key in ("happens", "expected") and _FIX_REPORT.search(" ".join([text, *items])):
            out.append(("uat_issue_fix_report", f"**{labels[key]}:** traz um relato de correção («Corrigido:»), que é o que se fez, não o que se vê nem o que se espera — "
                        "o que foi feito mora na linha do Status (`fixed (<commit> · …)`), a expectativa fica só com o que deveria acontecer"))
    evidence = " ".join(" ".join([text, *items]) for key, text, items in row["parts"] if key == "evidence")
    if row["opened_by"] == "human" and row["parts"] and _AGENT_SOURCE.search(evidence):
        out.append(("uat_issue_opened_by_missing", "a evidência cita um juiz, uma reconferência, uma crítica ou uma auditoria e a issue não tem `**Aberta por:** agente (<quem>)`: "
                    "sem a parte, a tela a mostra como aberta pelo MJRP e quem a fecha é ele; se um agente a achou, ele a fecha"))
    return out


def uat_judged(row):
    """An issue is judged when it is not closed, or was reported on or after UAT3_SINCE."""
    day = _DATE.search(row["reported"])
    return row["state"] != "closed" or bool(day and day.group(0) >= UAT3_SINCE)


def _uat_cells(line):
    return [p.strip() for p in re.split(r"(?<!\\)\|", line)[1:-1]]


def _uat_state(status, human_ok):
    if _DATE.search(human_ok):
        return "closed", None
    fixing = _FIXING.match(status)
    if fixing:
        return "fixing", fixing.group("f")
    for word in ("fixed", "open"):
        if status.startswith(word):
            return word, None
    raise ValueError("Status fora da gramática")


def parse_uat(text):
    """{"format", "rows": [{id, round, release_name, state, feature, line, round_line}], "header": bool}."""
    fmt, rows, round_n, release, round_line, header, tracks = None, [], 0, None, None, False, False
    for number, line in enumerate(text.splitlines(), start=1):
        found = _ROUND.match(line)
        if found:
            round_n, release, round_line = int(found.group("n")), found.group("release").strip(), number
            continue
        if line.startswith("| ID "):
            head = _uat_cells(line + " |") if not line.rstrip().endswith("|") else _uat_cells(line)
            fmt = "uat@2" if head in (_HEAD_V2, _HEAD_V3) else "uat@1" if head == _HEAD_V1 else None
            tracks = head == _HEAD_V3       # F48 (uat@3 of the catalog, CM-0081): `Reportado por` after `Reportado em`
            header = True
            if fmt is None:
                raise FormatError(number, "cabeçalho da tabela desconhecido")
            continue
        if not line.startswith("| UAT-"):
            continue
        cells = _uat_cells(line)
        want = 9 if tracks else 8 if fmt == "uat@2" else 7
        if fmt is None or len(cells) < want:
            raise FormatError(number, "linha fora do formato")
        if fmt == "uat@1":
            cells = [*cells[:3], "—", *cells[3:]]
        if tracks:
            cells = [*cells[:5], *cells[6:]]      # the column is judged by uat_tracks_check.py; the reader does not need it
        ident, _context, _kind, severity, reported, cell, status, human = cells[:8]
        text_, opened_by, opened_by_who = split_opened_by(cell)
        if severity != "—" and not _SEVERITY.match(severity):
            raise FormatError(number, "Gravidade fora de P0 · P1 · P2 · —")
        try:
            state, feature = _uat_state(status, human)
        except ValueError as exc:
            raise FormatError(number, str(exc))
        rows.append({"id": ident, "round": round_n, "release_name": release, "state": state, "feature": feature,
                     "line": number, "round_line": round_line, "reported": reported, "text": text_,
                     "parts": description_parts(text_), "cell": cell, "opened_by": opened_by,
                     "opened_by_who": opened_by_who})
    return {"format": fmt or "uat@2", "rows": rows, "header": header}


def feature_release(feature, by_id, uat_rows, releases):
    """modules/tracking/delivery.py `_release_of`: the release a feature card lands in - the one most of its stories
    (a normal feature) or of its UAT issues' rounds (a Fix) sit in. A tie is left to the screen's set order; here the
    smallest id, so the output is stable (the pin test never feeds a tie)."""
    if feature["track"] == "fix":
        found = [release_id(uat_rows[i]["release_name"], releases) for i in feature["fixes"] if i in uat_rows]
    else:
        found = [by_id[s]["release"] for s in feature["imports"] if s in by_id]
    known = [r for r in found if r]
    return max(sorted(set(known)), key=known.count) if known else None


def release_id(name, releases):
    """modules/tracking/delivery.py: the round's release (`1.0`) as an id - by name, by the start of a name, or by id."""
    if not name:
        return None
    for r in releases:
        if r["name"] == name or r["name"].startswith(f"{name} ") or r["id"] == name:
            return r["id"]
    return None


# ------------------------------------------------------------------ the check -------------------------------------------

class Report:
    def __init__(self, root):
        self.root, self.gaps, self.warnings, self.counts = Path(root), [], [], {}

    def gap(self, view, file, line, message, owner, code):
        """`code` is the gap's stable name (snake_case, English): what the structure gate and the tests select on. The
        message is prose for the human and may be reworded freely; the code never is without a catalog note."""
        self.gaps.append({"code": code, "view": view, "file": file, "line": line, "message": message, "owner": owner})

    def warn(self, view, file, line, message, owner, code):
        """A judgment of content (product-structure@5): listed, never changes the exit code. Same stable `code` rule as `gap`."""
        self.warnings.append({"code": code, "view": view, "file": file, "line": line, "message": message, "owner": owner})


BAD = object()      # a file that is there but is not valid UTF-8 (the gap is already reported; callers skip it)


def _read(root, rel, report=None, view="", owner="", code="file_not_utf8"):
    """The text of a project file; None when absent; BAD (plus a gap, when a report is given) when it is not valid UTF-8."""
    p = Path(root) / rel
    if not p.is_file():
        return None
    try:
        return p.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        if report is not None:
            report.gap(view, rel, 1, "o arquivo não é UTF-8 válido: a tela não o lê (regrave-o em UTF-8)", owner, code)
        return BAD


def _profile(root):
    text = _read(root, CONTRACT_FILE)
    if text is None:
        return None
    m = re.search(r"^  profile:\s*['\"]?([\w-]+)", text, re.M)
    return m.group(1) if m else ""


# ---- rules/contribution.py + usecases/contributions.py (mirror): what a declared `contributes_to::` resolves to ----------
_TARGET = re.compile(r"^(?P<path>[^#]*)#\^(?P<id>[A-Za-z][A-Za-z0-9-]*)\s*$")


def _repository_of(folder):
    """The repository a project belongs to (ADR-0020 A.4): the root of the repository when the project is nested below it
    and that root has a contract; any other project is its own repository."""
    here = Path(os.path.normpath(folder))
    if (here / ".git").exists():
        return here
    for parent in here.parents:
        if (parent / ".git").exists():
            return parent if (parent / CONTRACT_FILE).is_file() else here
    return here


def resolve_contribution(road_file, raw):
    """(kind, reason, (target file, outcome id) | None) - `rules/contribution.resolve` over the files on disk:
    resolved · missing (bare_id, own_roadmap, no_block) · unreachable (not_a_roadmap, outside_repository, unreadable)."""
    text = raw.strip()
    found = _TARGET.match(text)
    path, oid = ((found["path"].strip() or None, found["id"]) if found else (None, text.lstrip("#^").strip() or None))
    if path is None or oid is None:
        return "missing", "bare_id", None            # never falls back to the local graph
    joined = os.path.normpath(os.path.join(os.path.dirname(road_file), path))
    target = joined if os.path.splitext(joined)[1] else joined + ".md"
    if target == os.path.normpath(road_file):
        return "missing", "own_roadmap", None
    file = Path(target)
    if file.name != ROADMAP_FILE or not file.is_file() or not (file.parent / CONTRACT_FILE).is_file():
        return "unreachable", "not_a_roadmap", None
    if _repository_of(file.parent) != _repository_of(Path(road_file).parent):
        return "unreachable", "outside_repository", None
    try:
        road = parse_roadmap(file.read_text(encoding="utf-8"))
    except (FormatError, OSError, UnicodeDecodeError):
        return "unreachable", "unreadable", None
    if oid not in {o["id"] for o in road["outcomes"]}:
        return "missing", "no_block", None            # a `^REL` (or any block that is not an outcome) lands here
    return "resolved", None, (target, oid)


def _next_hop(node):
    """The (file, outcome) the outcome `node` contributes to, or None (it declares none, or it does not resolve)."""
    file, oid = node
    try:
        road = parse_roadmap(Path(file).read_text(encoding="utf-8"))
    except (FormatError, OSError, UnicodeDecodeError):
        return None
    doc = next((o for o in road["outcomes"] if o["id"] == oid), None)
    if not doc or not doc["contributes_to"]:
        return None
    kind, _why, target = resolve_contribution(file, doc["contributes_to"])
    return target if kind == "resolved" else None


def contribution_in_cycle(road_file, oid):
    """Does the outcome sit on a `contributes_to` cycle? (`rules/contribution.in_cycle`: each outcome has one target.)"""
    start = (os.path.normpath(road_file), oid)
    here, seen = _next_hop(start), set()
    while here is not None and here not in seen:
        if here == start:
            return True
        seen.add(here)
        here = _next_hop(here)
    return False


_CONTRIBUTION_WHY = {
    "bare_id": "alvo sem caminho (`[[<caminho>/ROADMAP#^OUT-xx]]`)",
    "own_roadmap": "o alvo é o próprio ROADMAP",
    "not_a_roadmap": "o alvo não existe ou não é o ROADMAP.md de um projeto com contrato (`.mjrp-project.yml` ao lado)",
    "outside_repository": "o alvo está fora deste repositório",
    "unreadable": "o ROADMAP do alvo não é legível",
    "no_block": "o alvo não tem esse resultado `^OUT-xx` (um `^REL` ou outro bloco não vale)",
    "cycle": "as arestas `contributes_to::` fecham um ciclo",
}


def _in_achieved(o):
    return (o.get("section") or "").casefold().startswith("alcançad")


def check(root):
    """The Report of a code-app project. Raises FileNotFoundError / ValueError for "not evaluable"."""
    root = Path(root)
    r = Report(root)

    # ---- ROADMAP: outcomes and releases (Product, Release pages)
    outcomes, releases, road_ok = [], [], False
    road_text = _read(root, ROADMAP_FILE, r, "Produto", OWNER_PM, "roadmap_not_utf8")
    if road_text is BAD:
        pass
    elif road_text is None:
        r.gap("Produto", ROADMAP_FILE, 0, "ROADMAP.md ausente: a tela não tem resultados nem releases", OWNER_PM, code="roadmap_missing")
    else:
        try:
            road = parse_roadmap(road_text)
            outcomes, releases, road_ok = road["outcomes"], road["releases"], True
        except FormatError as e:
            r.gap("Produto", ROADMAP_FILE, e.line, f"a tela não lê o ROADMAP ({e.reason})", OWNER_PM, code="roadmap_unreadable")
    if road_ok:
        if not outcomes:
            r.gap("Produto", ROADMAP_FILE, 1, "nenhum resultado `^OUT-xx` no fim de uma linha", OWNER_PM, code="outcomes_none")
        for o in outcomes:
            where = f"{o['id']} ({o['title'][:60]})"
            if o["horizon"] is None and not _in_achieved(o):       # `## Alcançados` is the cycle's last stop (product-structure@5)
                r.gap("Produto", ROADMAP_FILE, o["line"], f"{where} fora de `## Now`/`## Next`/`## Later`: aparece em \"sem horizonte\"", OWNER_PM, code="outcome_no_horizon")
            if not o["single"]:
                r.gap("Produto", ROADMAP_FILE, o["line"], f"{where} não está sozinho numa seção `###`: a tela não lê a medida nem as tags dele", OWNER_PM, code="outcome_not_alone")
                continue
            if not o["problem"]:
                r.warn("Produto", ROADMAP_FILE, o["line"], f"{where} sem `- **Problema:**`: a tela mostra o campo vazio — o que dói hoje, nas palavras de quem sente; "
                       "o texto é do humano (perguntado com a fonte, não redigido pelo agente)", OWNER_PM, code="outcome_no_problem")
            if not o["who"]:
                r.warn("Produto", ROADMAP_FILE, o["line"], f"{where} sem `- **Quem sente:**` (linha de lista com o rótulo em negrito): a tela mostra o campo vazio",
                       OWNER_PM, code="outcome_no_who")
            if not o["measure"]:
                r.gap("Produto", ROADMAP_FILE, o["line"], f"{where} sem medida: escreva `- **Medida:** <hoje → alvo> ^{o['id']}` na seção dele", OWNER_PM, code="outcome_no_measure")
            if not o["tags"]:
                r.gap("Produto", ROADMAP_FILE, o["line"], f"{where} sem `tags::` (1 a 3) na seção dele", OWNER_PM, code="outcome_no_tags")
            if o["contributes_to"]:
                kind, why, _target = resolve_contribution(root / ROADMAP_FILE, o["contributes_to"])
                if kind == "resolved" and contribution_in_cycle(root / ROADMAP_FILE, o["id"]):
                    kind, why = "missing", "cycle"
                if kind != "resolved":
                    r.gap("Produto", ROADMAP_FILE, o["line"], f"{where}: `contributes_to::` não chega ao alvo — {_CONTRIBUTION_WHY[why]}", OWNER_PM, code="contribution_unresolved")
        if not releases:
            prd_peek = _read(root, PRD_FILE)
            in_prd = re.search(rf"\^{_PREFIX}REL-\d+", prd_peek if isinstance(prd_peek, str) else "")
            r.gap("Releases", ROADMAP_FILE, 1, "nenhum release `^REL-xx` no ROADMAP.md" +
                  (" (há `^REL` no PRD, mas a tela lê releases só do ROADMAP.md)" if in_prd else "") +
                  ": o Board por release fica vazio", OWNER_PM, code="releases_none")
    rel_ids = {x["id"] for x in releases}
    out_ids = {x["id"] for x in outcomes}

    # ---- PRD: epics (Product, Epic pages)
    epics, prd_ok = [], False
    prd_text = _read(root, PRD_FILE, r, "Épicos", OWNER_PM, "prd_not_utf8")
    if prd_text is BAD:
        prd_text = None
    elif prd_text is None:
        r.gap("Épicos", PRD_FILE, 0, "docs/specs/prd.md ausente: a tela não tem épicos", OWNER_PM, code="prd_missing")
    else:
        no_name = epic_name_problems(prd_text)
        for line_no, reason in no_name:
            r.gap("Épicos", PRD_FILE, line_no, f"a tela não acha o nome do épico ({reason}): o PRD inteiro fica ilegível na tela", OWNER_PM, code="epic_name_missing")
        try:
            if not no_name:  # with a row nameless the reader fails the whole PRD: those rows are the gaps already
                epics, prd_ok = parse_prd(prd_text)["epics"], True
        except FormatError as e:
            r.gap("Épicos", PRD_FILE, e.line, f"a tela não lê o PRD ({e.reason})", OWNER_PM, code="prd_unreadable")
    if prd_ok:
        if not epics:
            r.gap("Épicos", PRD_FILE, 1, "nenhum épico (`### EP-xx · nome` com `serves::`)", OWNER_PM, code="epics_none")
        for e in epics:
            if not e["outcomes"]:
                why = "sem a seção `### " + e["id"] + " · nome`" if not e["has_section"] else "sem `serves:: [[ROADMAP#^OUT-xx]]`"
                r.gap("Épicos", PRD_FILE, e["line"], f"{e['id']} {why}: aparece solto, fora de todo resultado", OWNER_PM, code="epic_not_serving")
            elif road_ok:
                for o in e["outcomes"]:
                    if o not in out_ids:
                        r.gap("Épicos", PRD_FILE, e["line"], f"{e['id']} serve {o}, que não existe no ROADMAP.md", OWNER_PM, code="epic_outcome_dangling")
    epic_ids = {e["id"] for e in epics}

    # ---- requirements: the stories (Board, Release, Epic pages)
    nodes = None
    try:
        nodes = read_nodes(root)
        if nodes is None:
            r.gap("Board", REQUIREMENTS_DIR, 0, "sem grafo de requisitos (`docs/specs/requirements/`): a tela mostra o projeto \"sem grafo\"", OWNER_REQS, code="requirements_missing")
        elif not nodes:
            r.gap("Board", REQUIREMENTS_DIR, 0, "nenhum requisito em `docs/specs/requirements/`", OWNER_REQS, code="requirements_empty")
    except FormatError as e:
        r.gap("Board", e.file, e.line, f"a tela não lê os requisitos: {e.reason} (um nó ilegível derruba a leitura inteira)", OWNER_REQS, code="requirements_unreadable")
        nodes = None
    epic_planned = set()
    if prd_text:
        for m in re.finditer(rf"^### ({_PREFIX}EP-\d+)[^\n]*\n(?:(?!#)[^\n]*\n)*?planned_for::", prd_text, re.M):
            epic_planned.add(m.group(1))
    for n in nodes or ():
        st = story_status(n["status"])
        if st in OFF_TRACK or n["nfr"]:
            continue
        if n["epic"] is None:
            r.gap("Board", n["path"], n["epic_line"], f"{n['id']} sem `epic: \"[[prd#^EP-xx]]\"`: fica fora de todo épico", OWNER_REQS, code="story_epic_missing")
        elif prd_ok and n["epic"] not in epic_ids:
            r.gap("Board", n["path"], n["epic_line"], f"{n['id']}: o épico {n['epic']} não existe no PRD", OWNER_REQS, code="story_epic_dangling")
        if n["release"] is None and st in PRE_RELEASE:
            pass          # the release is chosen when the story is prioritized (writing-reqs): Backlog without one is legitimate
        elif n["release"] is None:
            hint = " (o `planned_for` do épico não chega à tela)" if n["epic"] in epic_planned else ""
            r.gap("Board", n["path"], n["planned_line"], f"{n['id']} sem `planned_for: \"[[ROADMAP#^REL-xx]]\"`: cai em \"sem release\", fora do Board{hint} — que release é decisão do humano", OWNER_REQS, code="story_release_missing")
        elif road_ok and n["release"] not in rel_ids:
            r.gap("Board", n["path"], n["planned_line"], f"{n['id']}: o release {n['release']} não existe no ROADMAP.md: a story some do Board", OWNER_REQS, code="story_release_dangling")

    # ---- features (Delivery board)
    by_id = {n["id"]: n for n in nodes or ()}
    uat_rows, uat = {}, None
    uat_text = _read(root, UAT_FILE, r, "Delivery", OWNER_SDD, "uat_not_utf8")
    if isinstance(uat_text, str):
        try:
            uat = parse_uat(uat_text)
            uat_rows = {x["id"]: x for x in uat["rows"]}
        except FormatError as e:
            r.gap("Delivery", UAT_FILE, e.line, f"a tela não lê o uat.md ({e.reason})", OWNER_SDD, code="uat_unreadable")
    fdir = root / FEATURES_DIR
    folders = sorted(p.name for p in fdir.iterdir() if p.is_dir() and _FOLDER.match(p.name)) if fdir.is_dir() else []
    no_track, landed = [], {}
    for folder in folders:
        try:
            f = read_feature(root, folder)
        except FormatError as e:
            r.gap("Delivery", e.file, e.line, f"{folder}: o card mostra a falha — {e.reason}", OWNER_SDD, code="feature_unreadable")
            continue
        except (OSError, UnicodeDecodeError):
            r.gap("Delivery", f"{FEATURES_DIR}/{folder}", 0, f"{folder}: não foi possível ler", OWNER_SDD, code="feature_unreadable")
            continue
        if not f["spec_exists"]:
            r.gap("Delivery", f["spec"], 0, f"{f['id']} sem spec.md: o card não tem stories nem trilha", OWNER_SDD, code="feature_no_spec")
            continue
        for code, why, line in f["summary"]:
            r.gap("Delivery", f["spec"], line, f"{f['id']}: {why}", OWNER_SDD, code=code)
        n_stories = len(f["imports"])
        n_epics = len({by_id[s]["epic"] for s in f["imports"] if s in by_id and by_id[s]["epic"]})
        size = "uma feature é a menor fatia vertical que entrega valor observável a quem usa, cabe numa rodada de execução e verificação e se confirma com uma verificação só"
        if n_stories > SIZE_STORIES:
            r.warn("Delivery", f["spec"], f["imports_line"], f"{f['id']} importa {n_stories} stories (sinal acima de {SIZE_STORIES}): {size} — partir é decisão do humano",
                   OWNER_SDD, code="feature_many_stories")
        if n_epics >= SIZE_EPICS:
            r.warn("Delivery", f["spec"], f["imports_line"], f"{f['id']} importa stories de {n_epics} épicos (sinal a partir de {SIZE_EPICS}): {size} — uma fatia que cruza épicos costuma ser mais de uma feature; partir é decisão do humano",
                   OWNER_SDD, code="feature_many_epics")
        if f["tasks_total"] > SIZE_TASKS:
            r.warn("Delivery", f["spec"], 1, f"{f['id']} tem {f['tasks_total']} tasks (sinal acima de {SIZE_TASKS}): {size} — não cabe numa rodada; partir é decisão do humano",
                   OWNER_SDD, code="feature_many_tasks")
        if not f["has_track"]:
            no_track.append(f["id"])       # the screen reads it as a normal feature: the `feature-track` item asks for it
        if f["track"] == "fix":
            if not f["fixes"]:
                r.gap("Delivery", f["spec"], f["fixes_line"], f"{f['id']} é Fix e não diz que issues corrige (`fixes: [UAT-xx]`)", OWNER_SDD, code="feature_fix_no_fixes")
            found = []
            for i in f["fixes"]:
                if uat is not None and i not in uat_rows:
                    r.gap("Delivery", f["spec"], f["fixes_line"], f"{f['id']}: {i} não está no uat.md", OWNER_SDD, code="feature_fix_issue_dangling")
                elif i in uat_rows:
                    found.append(release_id(uat_rows[i]["release_name"], releases))
        else:
            if not f["imports"]:
                r.gap("Delivery", f["spec"], f["imports_line"], f"{f['id']} não importa nenhuma story (`imports: [\"[[S-xx-slug]]\"]`): o card fica sem release", OWNER_SDD, code="feature_no_imports")
            missing = [s for s in f["imports"] if s not in by_id]
            if nodes is not None and missing:
                r.gap("Delivery", f["spec"], f["imports_line"], f"{f['id']} importa story que não existe: {', '.join(missing[:5])}", OWNER_SDD, code="feature_import_dangling")
            found = [by_id[s]["release"] for s in f["imports"] if s in by_id]
        landed[f["id"]] = feature_release(f, by_id, uat_rows, releases)
        known = [x for x in found if x and x in rel_ids]
        judged = nodes is not None if f["track"] == "normal" else uat is not None
        if (f["imports"] if f["track"] == "normal" else f["fixes"]) and judged and not known and road_ok:
            r.gap("Delivery", f["spec"], f["fixes_line"] if f["track"] == "fix" else f["imports_line"],
                  f"{f['id']}: nenhuma das stories ou issues dela está num release: o card cai no quadro sem release", OWNER_SDD, code="feature_no_release")
    if uat is not None:
        if uat["header"] and uat["format"] == "uat@1":
            r.gap("Delivery", UAT_FILE, 1, "uat.md em uat@1 (sem a coluna Gravidade): a tela não mostra a gravidade", OWNER_SDD, code="uat_old_format")
        for row in uat["rows"]:
            if uat_judged(row):
                for code, why in uat_issue_problems(row["text"], row["parts"]) + opened_by_problems(row["cell"]):
                    r.gap("Delivery", UAT_FILE, row["line"], f"{row['id']}: {why}", OWNER_SDD, code=code)
                for code, why in uat_content_warnings(row):
                    r.warn("Delivery", UAT_FILE, row["line"], f"{row['id']}: {why}", OWNER_SDD, code=code)
        lost = {}
        for row in uat["rows"]:
            if release_id(row["release_name"], releases) is None:
                lost.setdefault((row["round_line"], row["release_name"]), []).append(row["id"])
        for (line, name), ids in lost.items():
            what = f"a rodada \"{name}\" não é o nome de um release do ROADMAP.md" if name else "issues fora de uma `## Rodada <n> — <release>`"
            r.gap("Delivery", UAT_FILE, line or 1, f"{what}: {len(ids)} issue(s) no quadro sem release ({', '.join(ids[:4])})", OWNER_SDD, code="uat_round_no_release")

    # ---- the counts the screen shows
    if nodes is not None:
        statuses = {n["id"]: story_status(n["status"]) for n in nodes}
        counted = [n for n in nodes if not n["nfr"]]       # a transversal NFR is in no release and not in "sem release" (F22)
        rel_counts = []
        for x in releases:
            mine = [statuses[n["id"]] for n in counted if n["release"] == x["id"]]
            d, live = tally(mine)
            rel_counts.append({"id": x["id"], "name": x["name"], "done": d, "of": live})
            if not live:
                r.gap("Releases", ROADMAP_FILE, x["line"], f"{x['id']} ({x['name']}) sem nenhuma story que conte: o Board e a tela da release ficam \"sem stories\" — "
                      "ou ela ganha stories (`planned_for:`), ou ainda não é release (decisão do humano)", OWNER_PM, code="release_empty")
        loose = [statuses[n["id"]] for n in counted if n["release"] is None]
        d, live = tally(loose)
        epic_counts = []
        for e in epics:
            mine = [statuses[n["id"]] for n in nodes if n["epic"] == e["id"]]
            ed, elive = tally(mine)
            epic_counts.append({"id": e["id"], "done": ed, "of": elive})
        out_counts = []
        for o in outcomes:
            serving = {e["id"] for e in epics if o["id"] in e["outcomes"]}
            mine = [statuses[n["id"]] for n in nodes if n["epic"] in serving]
            od, olive = tally(mine)
            out_counts.append({"id": o["id"], "done": od, "of": olive})
        r.counts = {"stories": len(nodes), "releases": rel_counts,
                    "no_release": {"stories": len(loose), "done": d, "of": live,
                                   "shown": bool(releases) and bool(loose)},
                    "epics": epic_counts, "outcomes": out_counts,
                    "off_track": sum(s in OFF_TRACK for s in statuses.values()),
                    "nfr": sum(1 for n in nodes if n["nfr"])}
    if road_ok and outcomes:
        done_of = {x["id"]: x for x in r.counts.get("outcomes", [])}
        monitoring = lambda o: bool(done_of.get(o["id"]) and done_of[o["id"]]["of"] and done_of[o["id"]]["done"] == done_of[o["id"]]["of"])  # noqa: E731
        for o in outcomes:
            if not o["single"]:
                continue
            where = f"{o['id']} ({o['title'][:60]})"
            if o["horizon"] == "Now" and monitoring(o) and not o["achieved"]:
                x = done_of[o["id"]]
                r.warn("Produto", ROADMAP_FILE, o["line"], f"{where} tem {x['done']} de {x['of']} stories feitas e segue em Now sem `achieved:: AAAA-MM-DD`: está em monitoramento. "
                       "Só o MJRP marca o resultado como alcançado (o agente não propõe): medida atingida, ele põe `achieved::` e o resultado vai para `## Alcançados` com "
                       "`- **Valor medido:**` e `- **Aprendizado:**`; impacto parcial ou nulo, segue no Now e volta à Discovery", OWNER_PM, code="outcome_done_not_achieved")
            if o["horizon"] == "Now" and o["achieved"]:
                r.warn("Produto", ROADMAP_FILE, o["line"], f"{where} tem `achieved:: {o['achieved']}` e segue em `## Now`: alcançado sai do Now para `## Alcançados`",
                       OWNER_PM, code="outcome_achieved_in_now")
            if o["achieved"] or _in_achieved(o):
                missing = [name for name, ok in (("`achieved:: AAAA-MM-DD`", o["achieved"]), ("`- **Valor medido:**`", o["has_value"]),
                                                  ("`- **Aprendizado:**`", o["has_learning"])) if not ok]
                if missing:
                    r.warn("Produto", ROADMAP_FILE, o["line"], f"{where} alcançado e sem {', '.join(missing)}: o histórico guarda a data, o valor medido e o aprendizado",
                           OWNER_PM, code="outcome_achieved_incomplete")
        running = [o for o in outcomes if o["horizon"] == "Now" and not o["achieved"] and not monitoring(o)]
        if len(running) > NOW_MAX:
            r.warn("Produto", ROADMAP_FILE, running[0]["line"], f"{len(running)} resultados em curso em `## Now` (o aviso começa acima de {NOW_MAX}; «em monitoramento» não conta): "
                   f"{', '.join(o['id'] for o in running)} — foco é escolher; qual desce para Next é decisão do humano", OWNER_PM, code="now_too_many")
    by_release = {}
    for fid, rel in landed.items():
        by_release.setdefault(rel if rel in rel_ids else None, []).append(fid)
    r.counts["features"] = {"total": len(folders), "no_track": no_track, "by_release": by_release}
    return r


def render(r, name):
    out = []
    for g in r.gaps:
        loc = f"{g['file']}:{g['line']}" if g["line"] else g["file"]
        out.append(f"  [{g['view']}] {loc}: {g['message']} → {g['owner']}")
    c = r.counts
    if c.get("releases") is not None:
        out.append("")
        nfr = f"; {c['nfr']} NFR transversais, sem épico nem release por regra" if c.get("nfr") else ""
        out.append(f"  Como a tela conta ({c['stories']} nós; {c['off_track']} Deferred/Cancelled fora do progresso{nfr}):")
        for x in c["releases"]:
            out.append(f"    release {x['id']} · {x['name']}: {x['done']} de {x['of']}")
        nr = c["no_release"]
        out.append(f"    sem release: {nr['stories']} stories ({nr['done']} de {nr['of']})" +
                   ("" if nr["shown"] or not nr["stories"] else " — sem nenhum release declarado, o card nem aparece"))
        if c["epics"]:
            out.append("    épicos: " + " · ".join(f"{x['id']} {x['done']} de {x['of']}" for x in c["epics"]))
        if c.get("outcomes"):
            out.append("    resultados: " + " · ".join(f"{x['id']} {x['done']} de {x['of']}" for x in c["outcomes"]))
        ft = c.get("features")
        if ft and ft["total"]:
            placed = " · ".join(f"{k or 'sem release'} {len(v)}" for k, v in sorted(ft.get("by_release", {}).items(), key=lambda kv: (kv[0] is None, kv[0] or "")))
            out.append(f"    features: {ft['total']}" + (f" (no quadro: {placed})" if placed else "") + (f"; sem `solution_type:` nem `track:` (lidas como normais; o item feature-track cobra): {', '.join(ft['no_track'])}" if ft["no_track"] else ""))
    if r.warnings:
        out.append("")
        out.append(f"  Avisos ({len(r.warnings)}) — julgamento de conteúdo, não mudam o resultado; o auditor separado do conform os lê:")
        for w in r.warnings:
            loc = f"{w['file']}:{w['line']}" if w["line"] else w["file"]
            out.append(f"  [aviso][{w['view']}] {loc}: {w['message']} → {w['owner']}")
    head = (f"product_structure_check: {name} — " +
            ("VERDE: todas as vistas do Control Center têm o que mostrar" if not r.gaps else
             f"VERMELHO: {len(r.gaps)} lacuna(s) em {len({g['view'] for g in r.gaps})} vista(s)") +
            (f" · {len(r.warnings)} aviso(s)" if r.warnings else ""))
    return "\n".join([head, *out])


# Gaps that stop the screen from reading the files a story's edges point to (ROADMAP.md, the PRD, the requirements folder):
# they block every story. Selected by `code`, never by the words of the message (the messages are prose and get reworded).
GATE_BLOCKING = frozenset({
    "roadmap_missing", "roadmap_unreadable", "roadmap_not_utf8",
    "prd_missing", "prd_unreadable", "epic_name_missing", "prd_not_utf8",
    "requirements_missing", "requirements_empty", "requirements_unreadable",
})
USAGE = ("uso: product_structure_check.py <projeto> [--json] [--quiet]\n"
         "     product_structure_check.py <projeto> --story <arquivo da story> [--json]   (o portão Discovery→Delivery)")


def resolve_story(root, arg):
    """The story's path relative to the project root (posix), or None when `arg` is not a file inside the project.
    `arg` may be relative to the working directory (also the repository root of a nested app), relative to the project,
    absolute, or start with `./` - all normalised through the real path before anything is compared."""
    base = Path(os.path.realpath(root))
    p = Path(arg)
    for cand in ([p] if p.is_absolute() else [Path.cwd() / p, base / p]):
        real = Path(os.path.realpath(cand))
        if real.is_file():
            try:
                return real.relative_to(base).as_posix()
            except ValueError:
                continue
    return None


def gate(root, report, story_rel):
    """The structure gate for one story: the gaps on its own file plus the blocking ones. Exit 2 (never a pass) when the
    path is not a requirement file of the project."""
    if not story_rel.startswith(REQUIREMENTS_DIR + "/") or Path(story_rel).name == INDEX_NAME:
        return None
    try:
        nodes = read_nodes(root)
    except (FormatError, OSError, UnicodeDecodeError):
        nodes = None                  # an unreadable graph is itself a blocking gap
    if nodes is not None and story_rel not in {n["path"] for n in nodes}:
        return None
    return [g for g in report.gaps if g["file"] == story_rel or g["code"] in GATE_BLOCKING]


def main(argv):
    argv = list(argv)
    story_arg = None
    if "--story" in argv:
        i = argv.index("--story")
        if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
            print("product_structure_check: --story pede o arquivo da story\n" + USAGE, file=sys.stderr)
            return 2
        story_arg = argv[i + 1]
        del argv[i:i + 2]
    args = [a for a in argv if not a.startswith("--")]
    as_json, quiet = "--json" in argv, "--quiet" in argv
    if story_arg is None and any(a.startswith("--") and a not in ("--json", "--quiet") for a in argv):
        print(USAGE, file=sys.stderr)
        return 2
    root = Path(args[0] if args else ".").resolve()
    if not root.is_dir():
        print(f"product_structure_check: {root} não é uma pasta — não avaliável", file=sys.stderr)
        return 2
    profile = _profile(root)
    if profile is None:
        print(f"product_structure_check: {root.name} sem {CONTRACT_FILE} — não avaliável", file=sys.stderr)
        return 2
    if profile != "code-app":
        print(f"product_structure_check: {root.name} tem perfil `{profile or '?'}` — só um code-app tem produto na tela; não avaliável", file=sys.stderr)
        return 2
    story_rel = None
    if story_arg is not None:
        story_rel = resolve_story(root, story_arg)
        if story_rel is None:
            print(f"product_structure_check: {story_arg} não é um arquivo dentro de {root.name} — o portão não avalia (exit 2 não é aprovação)\n"
                  "  passe o caminho da story como o `--json` o imprime (relativo à pasta do projeto), ou absoluto", file=sys.stderr)
            return 2
    try:
        r = check(root)
    except (OSError, UnicodeDecodeError) as e:
        print(f"product_structure_check: {root.name}: leitura falhou ({e}) — não avaliável", file=sys.stderr)
        return 2
    if story_rel is not None:
        picked = gate(root, r, story_rel)
        if picked is None:
            print(f"product_structure_check: {story_rel} não é um nó de `{REQUIREMENTS_DIR}/` deste projeto — o portão não avalia "
                  "(exit 2 não é aprovação)", file=sys.stderr)
            return 2
        if as_json:
            print(json.dumps({"project": root.name, "story": story_rel, "ok": not picked, "gaps": picked}, ensure_ascii=False, indent=2))
        else:
            print(f"product_structure_check: portão de {story_rel} — " + ("VERDE: a tela coloca a story" if not picked else f"VERMELHO: {len(picked)} lacuna(s)"))
            for g in picked:
                loc = f"{g['file']}:{g['line']}" if g["line"] else g["file"]
                print(f"  [{g['view']}] {loc}: {g['message']} → {g['owner']}")
        return 1 if picked else 0
    if as_json:
        print(json.dumps({"project": root.name, "ok": not r.gaps, "gaps": r.gaps, "warnings": r.warnings, "counts": r.counts},
                         ensure_ascii=False, indent=2))
    elif quiet:
        print(render(r, root.name).splitlines()[0])
        for g in r.gaps[:20]:
            print(f"  [{g['view']}] {g['file']}:{g['line']}: {g['message']} → {g['owner']}")
        if len(r.gaps) > 20:
            print(f"  … e mais {len(r.gaps) - 20}")
        for w in r.warnings[:10]:
            print(f"  [aviso][{w['view']}] {w['file']}:{w['line']}: {w['message']} → {w['owner']}")
        if len(r.warnings) > 10:
            print(f"  … e mais {len(r.warnings) - 10} aviso(s)")
    else:
        print(render(r, root.name))
    return 1 if r.gaps else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
