#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""prd_source_check.py - the PRD is the source of truth of the content; the screen only renders it (catalog item `prd@2`, CM-0077).

Decision of the MJRP, 2026-10-19: "o source of truth do conteudo e o prd.md; a tela e apenas uma renderizacao organizada do prd.md"
(ROADMAP.md is also a source). "Isso e canonico, o harness conformance precisa garantir isso tambem." Born of an inconsistency: the PRD's epic
table had an `Estado` column with hand-written counts ("7/9 Done . 2 Backlog") that summarize the stories the PRD itself embeds and are never
updated - the Control Center's own PRD was stale in 3 of 6 epics. A count written by hand is a second source that goes stale; the progress of
an epic is READ from the stories the PRD embeds, never written.

Four clauses, one finding each:
  (a) `prd_epic_state` - the epic table has no state or count column, and no epic line (the list form) carries a hand-written count. A header cell that starts like the reader's state column (`Estado`,
      `Status`, plus `Progresso`, `Situacao`) or a cell that the reader's `declared()` would read (`7/9 Done . 2 Backlog`, `Done`, `Em curso`).
  (b) `prd_node_not_embedded` - every requirement node of `docs/specs/requirements/` (story, use case, EARS, NFR) is embedded in `prd.md`
      by the WHOLE file name: `![[S-07-import-the-card-statement]]`. A node that exists and is not embedded is a node the PRD does not
      contain; an embed by the bare ID of a slugged file does not count (the graph rule `link_stem`).
  (c) `prd_epic_table_form` - there is an epic table in the form the Control Center reader reads: a table whose first header cell starts with
      `Epic`/`Epico`, every row naming its epic as the reader finds it (`| **EP-nn . nome** |`, `| EP-nn . nome |`, or `| EP-nn | nome |` under a
      `Nome` header). A table of `EP-nn` rows under any other header is not read by the screen at all. The table is `Epico | Serve`: no exit-
      criterion column is expected (the criterion is the optional `exit::` line of the epic's section, decided by the agent 2026-10-19), and an
      extra column is allowed as long as clause (a) finds no state or count in it.
  (d) `prd_delivered_section` - the PRD has no `## Entregue` section. What is done is read from the status of the embedded stories; a hand-written
      "what already exists" is a second source of the same kind as the state column (the six changes of the PRD template, MJRP 2026-10-19). Before
      the child removes it, its content must be covered by embedded nodes; what is not covered is a finding for the PM, never silently dropped.

Nothing here is a second list of rules: the epic-table readers are `product_structure_check.py` (`epic_identity`, `_tables`, `_column`: the mirror
of `adapters/repo_fs/prd.py`), the node and embed patterns are `requirements_graph_check.py` (`NODE_ID`, `WIKILINK`, `node_id`). The only
expressions here are the two of clause (a) that copy `rules/graph.py` (`_COUNT`, `_WORD_STATUS`); `apps/control-center/tests/compat/
test_prd_source_of_truth.py` binds all of it to the reader.

Exit 0 passes (no PRD: nothing to judge, the `prd` item's section clauses say it is missing), 1 is a gap, 2 could not run. `--quiet` prints only
the problems. `--json` prints [{code, file, line, message}]. Standard library only; it travels to the children with the kernel (it imports
product_structure_check and requirements_graph_check, which travel with it)."""
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import product_structure_check as psc   # noqa: E402  - the epic-table readers (mirror of the Control Center's prd.py)
import requirements_graph_check as rgc  # noqa: E402  - the node and embed patterns of the requirements graph

PRD_FILE = psc.PRD_FILE
REQUIREMENTS_DIR = psc.REQUIREMENTS_DIR
EPIC_HEADERS = ("epic", "épico", "epico")                                   # prd.py: the first header cell of the epic table
STATE_HEADERS = ("estado", "status", "progresso", "progress", "situação", "situacao", "state")   # prd.py reads the first two as the state column
NOT_NODES = ("readme.md", "folder-index.md", "index.md")                    # requirements_graph_check.load_requirements
COUNT_CELL = re.compile(r"^(?P<done>\d+)\s*/\s*(?P<total>\d+)\s+Done\b(?P<rest>.*)$", re.I)                    # rules/graph.py _COUNT
WORD_CELLS = ("done", "feito", "in progress", "em curso", "backlog", "planned", "planejado")   # rules/graph.py _WORD_STATUS
EMBED = re.compile("!" + rgc.WIKILINK.pattern)                               # an embed is a wikilink with a `!`
FOLDER = re.compile(r"^folder::\s*(\S+)", re.M)


def _is_epic_table(header):
    return psc.plain(header[0]).casefold().startswith(EPIC_HEADERS) if header else False


def _state_cell(cell):
    """True when the reader's `declared()` would take the cell as a status: `7/9 Done . 2 Backlog`, `Done`, `Em curso`."""
    text = cell.replace("*", "").replace("_", "").strip()
    return bool(COUNT_CELL.match(text)) or text.strip(" .").casefold() in WORD_CELLS


def count_line_problems(lines):
    """[(line, message)] - clause (a), the list form: an `EP-nn` bullet or paragraph of the `## Epics` section that carries a hand-written count
    (pedroso-incorp: `- EP-01 . ... . 11 de 11 stories Done . saida: ...`). Table rows are judged by `state_problems`."""
    found, inside = [], False
    for number, line in enumerate(lines, start=1):
        if line.startswith("## "):
            inside = bool(EPICS_HEADING.match(line))
            continue
        if inside and not line.lstrip().startswith("|") and EPIC_REF.search(line):
            m = COUNT_LINE.search(line)
            if m:
                found.append((number, f"a linha do épico traz o andamento escrito à mão (`{m.group(0)[:40]}`): apague a contagem — o andamento se lê das stories embutidas; "
                                      "a lista de épicos vira a tabela `Épico | Serve` e o «saída:» vai para a linha `exit::` da seção do épico (ou sai, se só repete a Medida do resultado)"))
    return found


def state_problems(lines):
    """[(line, message)] - clause (a): a state/count column in an epic table, or a hand-written count in an epic line of the list form."""
    found = count_line_problems(lines)
    for number, header, rows in psc._tables(lines):
        if not _is_epic_table(header):
            continue
        for cell in header:
            if psc.plain(cell).casefold().startswith(STATE_HEADERS):
                found.append((number, f"a tabela de épicos tem a coluna `{psc.plain(cell)}`: o andamento de um épico se lê das stories que o PRD embute, "
                                      "nunca se escreve à mão (a contagem envelhece) — apague a coluna"))
                break
        for row_number, cells in rows:
            hand = [psc.plain(c) for c in cells[1:] if _state_cell(c)]
            if hand:
                found.append((row_number, f"a linha do épico traz o andamento escrito à mão (`{hand[0][:40]}`): apague a célula, a tela calcula das stories"))
    return found


def form_problems(lines):
    """[(line, message)] - clause (c): an epic table in the form the reader reads."""
    found, seen_table = [], False
    for number, header, rows in psc._tables(lines):
        if _is_epic_table(header):
            seen_table = True
            for row_number, cells in rows:
                if psc.epic_identity(cells, header) is None:
                    found.append((row_number, psc.why_no_name(cells)))
        elif any(psc._ROW_ID.match(psc.plain(cells[0] if cells else "")) for _, cells in rows):
            found.append((number, f"a tabela de linhas `EP-nn` abre com `{psc.plain(header[0])}`: a tela só lê a tabela cujo primeiro cabeçalho é `Épico`"))
    if not seen_table:
        found.append((1, "sem a tabela de épicos que a tela lê: `| Épico | Serve |`, um épico por linha, `| **EP-nn · nome** | `^OUT-nn` |` "
                         "(os épicos só nas seções `### EP-nn` não montam a tabela; o critério de saída é a linha `exit::` da seção do épico)"))
    return found


EPICS_HEADING = re.compile(r"^##\s+(?:Epics|[ÉE]picos)\b")
EPIC_REF = re.compile(r"(?:[A-Z]+-)?EP-\d+")
# a count written by hand in a line about an epic: `11 de 11 stories Done`, `0/3 Backlog`, `9 de 10 Done (S-33 In progress)`
COUNT_LINE = re.compile(r"\b\d+\s*(?:de|/|of)\s*\d+\b[^|]*?\b(?:Done|Backlog|In progress|Ready|Prioritized|stories|story|feitas?|conclu\w+)\b", re.I)
DELIVERED = re.compile(r"^##\s+Entregue\b")


def delivered_problems(lines):
    """[(line, message)] - clause (d): the obsolete `## Entregue` section."""
    return [(n, "o PRD tem a seção `## Entregue`: o que está feito se lê do status das stories embutidas, não se escreve à mão — confira que o conteúdo está coberto "
                "por nós embutidos (o que não estiver é achado para o PM, não se descarta) e remova a seção")
            for n, line in enumerate(lines, start=1) if DELIVERED.match(line)]


def node_files(root):
    """Every requirement node file, as the graph reads them: a `.md` in the requirements folder whose stem starts with a node ID."""
    folder = Path(root) / REQUIREMENTS_DIR
    if not folder.is_dir():
        return []
    return [f for f in sorted(folder.rglob("*.md")) if f.name.lower() not in NOT_NODES and rgc.NODE_ID.match(f.stem)]


def embedded_stems(text):
    """The file stems the PRD embeds (`![[S-07-slug]]`, `![[folder/S-07-slug|S-07]]`, `![[S-07-slug#^x]]` all name `S-07-slug`)."""
    return {Path(f.strip()).stem for f, _ in EMBED.findall(text)}


def embed_problems(root, text):
    """[(file, message)] - clause (b): a node that exists and is not embedded in the PRD by its whole file name."""
    stems, found = embedded_stems(text), []
    folders = {m.group(1) for m in FOLDER.finditer(text)}
    for f in node_files(root):
        if f.stem in stems:
            continue
        rel = f.relative_to(root).as_posix()
        nid = rgc.node_id(f.stem)
        by_id = nid in stems and nid != f.stem
        where = f" sob o épico da pasta `{f.parent.name}/`" if f.parent.name in folders else ""
        how = f"o embed `![[{nid}]]` não conta: escreva o nome inteiro" if by_id else "não está embutido"
        found.append((rel, f"{nid} {how} no {PRD_FILE} — acrescente `![[{f.stem}]]`{where}; o PRD contém todos os requisitos"))
    return found


def problems(root):
    root = Path(root)
    prd = root / PRD_FILE
    if not prd.is_file():
        return []
    text = prd.read_text(encoding="utf-8")
    lines = text.splitlines()
    found = [("prd_epic_state", PRD_FILE, n, m) for n, m in state_problems(lines)]
    found += [("prd_epic_table_form", PRD_FILE, n, m) for n, m in form_problems(lines)]
    found += [("prd_delivered_section", PRD_FILE, n, m) for n, m in delivered_problems(lines)]
    found += [("prd_node_not_embedded", rel, 1, m) for rel, m in embed_problems(root, text)]
    return found


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    root = Path(args[0] if args else ".")
    if not (root / PRD_FILE).is_file():
        print(f"prd_source_check: {PRD_FILE} ausente - nada a conferir")
        return 0
    try:
        found = problems(root)
    except (OSError, UnicodeDecodeError) as e:
        print(f"prd_source_check: {e}", file=sys.stderr)
        return 2
    if "--json" in argv:
        print(json.dumps([{"code": c, "file": f, "line": n, "message": m} for c, f, n, m in found], ensure_ascii=False, indent=1))
        return 1 if found else 0
    if found:
        print(f"prd_source_check: {len(found)} problema(s) - o prd.md é a fonte do conteúdo e a tela só o organiza")
        for _, f, n, m in found:
            print(f"  {f}:{n}: {m}")
        return 1
    if "--quiet" not in argv:
        print("prd_source_check: tabela de épicos sem estado, na forma que a tela lê, sem seção Entregue e todo requisito embutido no prd.md")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
