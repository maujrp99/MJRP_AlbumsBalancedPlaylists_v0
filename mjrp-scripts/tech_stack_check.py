#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""tech_stack_check.py - the form of `docs/specs/tech-stack.md` (catalog item `tech-stack`, CM-0071).

The ONE place of the expressions that the file's form rests on. The catalog clause for `status:` carries STATUS_RE verbatim; the Control Center
reader (v4.11) imports this module or mirrors these constants, and `apps/control-center/tests/compat/test_tech_stack_form.py` is where the two
meet: the template and a good sample have to satisfy them, so the check and the screen cannot drift.

What it asks (the template of `mjrp-designing-architecture`, `templates/tech-stack.md`, is the model):
  - frontmatter `status:` is `Draft` or `Aprovado pelo MJRP em AAAA-MM-DD` - the value alone, no trailing comment (STATUS_RE);
  - `## Stack`: the five-column table (STACK_HEADER) with at least one row; every row has five cells;
  - the Decisão cell (the last one, in `## Stack` and in `## Decidido não usar`) is `—`, or one or more `[[ADR-NNNN]]` separated by ` · `, each with
    an optional ` § x` (DECISION_CELL_RE). Commentary goes in "Para quê". Each `[[ADR-NNNN]]` resolves to the project's own
    `docs/decisions/NNNN-*.md` - a link to an ADR that is not there is a gap;
  - `## Decidido não usar` is OPTIONAL ("quando houver"); when present its table has the three columns of NOT_USE_HEADER;
  - `## Restrições`: at least one bullet; an ADR cited there uses the same link form (a bare `ADR-0002` or a `[[ADR-2]]` is a gap).
A row of the untouched template (every cell a `<placeholder>`) is skipped. Exit 0 passes, 1 is a gap, 2 could not run. `--quiet` prints only
the problems. Standard library only (it travels to the children with the kernel)."""
import re
import sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
from _fm import block as frontmatter   # the raw YAML block, one reader (F73 R4)

ARTIFACT = "docs/specs/tech-stack.md"
STATUS_RE = r"^status:\s*(Draft|Aprovado pelo MJRP em \d{4}-\d{2}-\d{2})\s*$"
ADR_LINK = r"\[\[ADR-\d{4}\]\]"
ADR_REF = ADR_LINK + r"(?: § [^·|\[\]]*[^·|\[\]\s])?"
DECISION_CELL_RE = rf"^(?:—|{ADR_REF}(?: · {ADR_REF})*)$"
STACK_HEADER = ["Camada", "Tecnologia", "Versão", "Para quê", "Decisão"]
NOT_USE_HEADER = ["Tecnologia", "Por que não", "Decisão"]
H_STACK, H_NOT_USE, H_CONSTRAINTS = "Stack", "Decidido não usar", "Restrições"


def sections(text):
    """{heading of a `## ` section: its lines}."""
    out, cur = {}, None
    for l in text.splitlines():
        m = re.match(r"^##\s+(.*?)\s*$", l)
        if m:
            cur = m.group(1)
            out[cur] = []
        elif cur is not None:
            out[cur].append(l)
    return out


def table(lines):
    """(header cells, [data rows as cell lists]) of the first table in the lines; ([], []) when there is none."""
    rows = [[c.strip() for c in l.strip().strip("|").split("|")] for l in lines if l.lstrip().startswith("|")]
    rows = [r for r in rows if not all(re.fullmatch(r":?-{2,}:?", c) for c in r)]
    return (rows[0], rows[1:]) if rows else ([], [])


def _placeholder(row):
    return all(c.startswith("<") and c.endswith(">") for c in row)


def decision_cells(text):
    """Every Decisão cell of the file, for the reader that mirrors this: [(section, cell)] without the template's placeholder rows."""
    out = []
    for name in (H_STACK, H_NOT_USE):
        _, rows = table(sections(text).get(name, []))
        out += [(name, r[-1]) for r in rows if r and not _placeholder(r)]
    return out


def problems(text, root=None):
    out = []
    if not re.search(STATUS_RE, frontmatter(text), re.M):
        out.append("o frontmatter não traz `status: Draft` nem `status: Aprovado pelo MJRP em AAAA-MM-DD` (só o valor, sem comentário na linha)")
    secs = sections(text)
    refs = set()
    for name, header in ((H_STACK, STACK_HEADER), (H_NOT_USE, NOT_USE_HEADER)):
        if name not in secs:
            if name == H_STACK:
                out.append("sem a seção `## Stack`")
            continue                                            # `## Decidido não usar` is optional
        head, rows = table(secs[name])
        if head != header:
            if name == H_STACK or head:                        # an optional section with no table at all is simply empty
                out.append(f"`## {name}`: o cabeçalho da tabela deveria ser `| {' | '.join(header)} |`")
            continue
        data = [r for r in rows if not _placeholder(r)]
        if name == H_STACK and not rows:
            out.append("`## Stack`: a tabela não tem nenhuma linha")
        for r in data:
            if len(r) != len(header):
                out.append(f"`## {name}`: a linha `{r[0]}` tem {len(r)} células, deveria ter {len(header)}")
                continue
            if not re.fullmatch(DECISION_CELL_RE, r[-1]):
                out.append(f"`## {name}`: a Decisão de `{r[0]}` (`{r[-1]}`) fora da forma: `—`, ou `[[ADR-NNNN]]` (com ` § x` opcional) separados por ` · `; "
                           f"comentário vai em «Para quê»")
            refs.update(re.findall(r"ADR-(\d{4})", r[-1]))
    cons = secs.get(H_CONSTRAINTS)
    if cons is None:
        out.append("sem a seção `## Restrições`")
    else:
        bullets = [l for l in cons if re.match(r"^\s*[-*]\s+\S", l)]
        if not bullets:
            out.append("`## Restrições`: nenhuma restrição (cada uma com a fonte: NFR, constituição ou ADR)")
        body = "\n".join(bullets)
        for tok in re.findall(r"\[\[ADR[^\]]*\]\]", body):
            if not re.fullmatch(ADR_LINK, tok):
                out.append(f"`## Restrições`: `{tok}` fora da forma `[[ADR-NNNN]]`")
        rest = re.sub(r"\[\[[^\]]*\]\]", " ", body)
        if re.search(r"ADR-\d", rest):
            out.append("`## Restrições`: ADR citada fora da forma `[[ADR-NNNN]]`")
        refs.update(re.findall(r"\[\[ADR-(\d{4})\]\]", body))
    if root is not None:
        for n in sorted(refs):
            if not list(Path(root, "docs", "decisions").glob(f"{n}-*.md")):
                out.append(f"`[[ADR-{n}]]` não resolve: não há `docs/decisions/{n}-*.md` neste projeto")
    return out


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    quiet = "--quiet" in argv
    root = Path(args[0] if args else ".")
    path = root / ARTIFACT
    if not path.is_file():
        print(f"tech_stack_check: {ARTIFACT} ausente")
        return 1
    try:
        found = problems(path.read_text(encoding="utf-8"), root)
    except OSError as e:
        print(f"tech_stack_check: {e}", file=sys.stderr)
        return 2
    if found:
        print(f"tech_stack_check: {len(found)} problema(s) em {ARTIFACT}")
        for p in found:
            print(f"  {p}")
        return 1
    if not quiet:
        print(f"tech_stack_check: {ARTIFACT} ok")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
