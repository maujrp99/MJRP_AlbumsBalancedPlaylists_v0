#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
delivery_strategy_check.py - does the project say how IT delivers? The judge of the `delivery-strategy` catalog item
(F186, UAT-496): `docs/specs/arch.md` carries a `## Delivery strategy` section written for the project.

Born 2026-11-04 (UAT-496): the personal site has a preview and a production on Vercel, and it received from the harness the rule
"only the MJRP pushes, local main" - the harness has no site on the air, so the rule was copied, not decided. A batch of 50 commits
was about to reach production without a preview. Nothing asked how that project delivers. The rule of the harness
("only the MJRP pushes") is the harness's own strategy and the default until the project writes its own.

The form (what this script reads; the CONTENT is judged by `mjrp-critiquing-architecture`, the item's `judge_skill`):
  - the section `## Delivery strategy` (or `## Estratégia de entrega`) of docs/specs/arch.md, up to the next `## `;
  - a `Status:` line saying who stands behind it: a proposal (written by the agent, waiting for the MJRP) or confirmed. A proposal PASSES
    and is printed as a warning - the point is that it is written and marked, the decision is the MJRP's;
  - a project with no production says so in ONE line ("No production: ..." / "Sem produção: ...") and needs nothing else;
  - otherwise the section answers, each under a label (a sub-heading, a bold label, a table header or a `- label:` item), the seven
    questions: which branches exist · what makes a preview · what goes to production · who sends each one · what is checked at each
    step · how to go back · whether the preview uses production's credentials and data.

Usage:  python3 mjrp-scripts/delivery_strategy_check.py <project> [--json] [--quiet]
Exit: 0 written (a proposal is a warning) | 1 gap (no arch.md, no section, no status, a question unanswered) | 2 not evaluable (no folder).
Standard library only; imports no sibling (it runs vendored in the children, as a clause of the catalog).
"""
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True

ARCH_REL = "docs/specs/arch.md"
HEADING = re.compile(r"^##\s+(?:Delivery strategy|Estratégia de entrega)\s*$", re.I)
NEXT_H2 = re.compile(r"^##\s+\S")
FENCE = re.compile(r"^\s*(```|~~~)")
STATUS = re.compile(r"^[\s>*_`-]*status\s*[:：]\s*[*_`]*\s*(.+)$", re.I)
PROPOSAL = re.compile(r"^(proposal|proposed|proposta|rascunho|draft)\b", re.I)
CONFIRMED = re.compile(r"^(confirmed|confirmada|confirmado|approved|aprovada|aprovado|accepted|aceita|aceito|decided|decidida|decidido)\b", re.I)
NO_PRODUCTION = re.compile(r"^[\s>*_`-]*(?:no production|sem produção)\s*[*_`]*\s*[:—–-]\s*[*_`]*\s*(\S.{15,})$", re.I)

OWNER = "mjrp-pdlc-bootstrap"
HOW = ("o bootstrap lê o que o projeto tem (hospedagem, workflows, contrato), propõe a seção e a leva ao MJRP — "
       "`reference/delivery-strategy.md` da `mjrp-pdlc-bootstrap`; o modelo da seção está no `arch.md` da `mjrp-designing-architecture`")

# the seven questions: (id, how it reads in the message, the words a label must carry - every regex of the tuple must hit SOME label)
QUESTIONS = [
    ("branches", "que ramos existem", (r"\b(branch|branches|ramo|ramos)\b",)),
    ("preview", "o que gera preview", (r"\b(preview|previews|prévia|prévias|staging)\b",)),
    ("production", "o que vai a produção", (r"\b(production|produção)\b",)),
    ("sender", "quem envia cada um", (r"\b(who|sent by|sends|quem|enviado por|envia)\b",)),
    ("checks", "o que se confere em cada etapa", (r"(checked|verified|conferi|verific|confere)",)),
    ("rollback", "como se volta atrás", (r"(going back|go back|roll\s?back|revert|voltar atrás|volta atrás|reverter|desfaz)",)),
    ("preview_secrets", "se o preview usa as credenciais e os dados de produção",
     (r"(credential|credencia|secret|segredo|token)", r"\b(data|dados)\b")),
]


def section(text):
    """(line number of the heading, the body lines outside code fences) or (None, [])."""
    lines, start, body, fenced = text.splitlines(), None, [], False
    for n, line in enumerate(lines, 1):
        if FENCE.match(line):
            fenced = not fenced
            continue
        if fenced:
            continue
        if start is None:
            if HEADING.match(line):
                start = n
            continue
        if NEXT_H2.match(line):
            break
        body.append(line)
    return start, body


def labels(body):
    """What the section names: sub-headings, bold spans, table header cells and `- label:` items (lowercased)."""
    found = []
    for i, line in enumerate(body):
        s = line.strip()
        if re.match(r"^#{3,6}\s+\S", s):
            found.append(s.lstrip("#").strip())
        found += re.findall(r"\*\*(.+?)\*\*", s)
        found += re.findall(r"__(.+?)__", s)
        if s.startswith("|") and i + 1 < len(body) and re.match(r"^\s*\|?\s*:?-{2,}", body[i + 1]):
            found += [c.strip() for c in s.strip("|").split("|")]
        m = re.match(r"^[-*]\s+([^:\n]{2,80}):", s)
        if m:
            found.append(m.group(1))
    return [x.lower() for x in found if x.strip()]


def status_of(body):
    for line in body:
        m = STATUS.match(line.strip())
        if m:
            value = m.group(1).strip()
            if PROPOSAL.match(value):
                return "proposal", value
            if CONFIRMED.match(value):
                return "confirmed", value
            return "unknown", value
    return None, ""


def check(root):
    """(gaps, warnings) of a project. Each is a message; a gap names what is missing and who writes it."""
    path = Path(root) / ARCH_REL
    if not path.is_file():
        return [f"não há {ARCH_REL}: a estratégia de entrega mora nele, numa seção `## Delivery strategy` — {HOW}"], []
    start, body = section(path.read_text(encoding="utf-8", errors="replace"))
    if start is None:
        return [f"{ARCH_REL} não tem a seção `## Delivery strategy`: ninguém escreveu como este projeto entrega (ramos, preview, produção, quem envia, "
                f"como se volta atrás). A regra do harness («só o MJRP dá push») é a estratégia do harness e o padrão, não a deste projeto — {HOW}"], []
    gaps, warnings = [], []
    kind, value = status_of(body)
    if kind is None:
        gaps.append(f"{ARCH_REL}:{start}: falta a linha `Status:` da seção — diga se é uma proposta do agente à espera do MJRP ou se ele a confirmou")
    elif kind == "unknown":
        gaps.append(f"{ARCH_REL}:{start}: o `Status:` da seção diz «{value[:40]}» — comece por «proposal»/«proposta» (à espera do MJRP) ou "
                    f"«confirmed»/«confirmada» (ele a confirmou)")
    elif kind == "proposal":
        warnings.append(f"{ARCH_REL}:{start}: a estratégia de entrega é uma proposta, à espera do MJRP — ele a confirma, ajusta ou recusa; "
                        f"confirmada, o `Status:` passa a «confirmed»")
    if any(NO_PRODUCTION.match(l.strip()) for l in body):
        return gaps, warnings                     # one line is the whole answer of a project with nothing on the air
    have = labels(body)
    missing = [q for q in QUESTIONS if not all(any(re.search(rx, l) for l in have) for rx in q[2])]
    if missing:
        gaps.append(f"{ARCH_REL}:{start}: a seção não responde, sob um rótulo (subtítulo, negrito, cabeçalho de tabela ou item `- rótulo:`): "
                    + "; ".join(q[1] for q in missing) + " — projeto sem produção diz isso numa linha («No production: …» / «Sem produção: …»)")
    return gaps, warnings


def render(name, gaps, warnings):
    head = f"delivery_strategy_check: {name} — " + ("VERDE: a estratégia de entrega está escrita" if not gaps else f"VERMELHO: {len(gaps)} lacuna(s)")
    return [head] + [f"  {g}" for g in gaps] + [f"  [aviso] {w}" for w in warnings]


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    if any(a.startswith("--") and a not in ("--json", "--quiet") for a in argv) or len(args) != 1:
        print(__doc__.split("Usage:")[1].split("\n")[0].strip())
        return 2
    root = Path(args[0]).resolve()
    if not root.is_dir():
        print(f"delivery_strategy_check: {root} não é uma pasta")
        return 2
    gaps, warnings = check(root)
    if "--json" in argv:
        print(json.dumps({"project": root.name, "gaps": gaps, "warnings": warnings}, ensure_ascii=False, indent=2))
    else:
        print("\n".join(render(root.name, gaps, warnings)))
    return 1 if gaps else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
