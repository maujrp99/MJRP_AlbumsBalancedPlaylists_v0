#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
r"""
now_questions_check.py - does `MEMORY.md ## Now` copy the conformance audit's questions? A clause of the `memory-layer` catalog item
(memory-layer@2, CM-0062).

Born 2026-10-18 (the MJRP; the UX critique of the F40 screen): the audit's questions live ONLY in the report
(`reports/audits/*conformance-audit*.md`), where the Control Center reads them and shows them in one group. The pedroso-incorp had
copied them into `Pending on Human` ("As perguntas 1-21 do relatorio ... (tipo do migration-reconciliation, metricas do PRD, ...)"):
the screen showed them twice and the copy drifted from the report at every answer. `--check-note CM-0062` passed on that child,
because a `contains` clause cannot ask for what is ABSENT - this script does.

What is a gap (exit 1): in the `**Pending on Human.**` block of `## Now`, a sentence (the block is split at `. `, at ` · ` and at line ends)
that talks about the audit's questions - "perguntas" together with "conformidade", "conformance-audit" or "Perguntas para o MJRP" (not any
report under `reports/audits/`: a UX critique is not this audit) - and is not a pointer, because it enumerates. The signs, read on the sentence
with its `code spans` and its dates (`2026-10-18`, `12:30`) taken out: a numeric range or list (`1-21`, `3, 5`), a `P-NN` id, a `§`, an
option letter `(a)`, a `;`, a `:`, two or more commas outside parentheses, a parenthesis that lists (three items or more, or an item of
several words - «(fin, pedroso)» is two project names and passes), or more than 220 characters.
The pointer passes: «perguntas da auditoria de conformidade, em `reports/audits/<file>`», with a date, a count in front or a second report
(«... em `a` e `b` (fin, pedroso)»).
No `MEMORY.md`, no `## Now` or no `Pending on Human`: nothing to judge here (the other clauses of the item say it is missing), exit 0.

Usage:
  python3 mjrp-scripts/now_questions_check.py <project> [--quiet]
Stdlib only; vendored into every child with the kernel, next to `conformance_check.py`.
"""
import re
import sys
from pathlib import Path

MAX_POINTER = 220
_ABOUT_QUESTIONS = re.compile(r"perguntas?", re.I)
_ABOUT_AUDIT = re.compile(r"conformidade|conformance-audit|perguntas para o mjrp", re.I)
_DATES = re.compile(r"\d{4}-\d{2}-\d{2}|\b\d{1,2}:\d{2}\b")
_SIGNS = (
    (re.compile(r"\d+\s*[\u2013\u2014-]\s*\d+"), "faixa de números"),
    (re.compile(r"\b\d+\s*(?:,|e)\s*\d+\b"), "lista de números"),
    (re.compile(r"(?<![\w-])P-\d+"), "id P-NN"),
    (re.compile(r"\u00a7"), "`§`"),
    (re.compile(r"\(\s*[a-z]\s*\)"), "opção `(a)`"),
    (re.compile(r";"), "`;`"),
    (re.compile(r":"), "`:` (uma lista depois dos dois pontos)"),
)


def _outside_parentheses(s):
    depth, out = 0, []
    for ch in s:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        elif depth == 0:
            out.append(ch)
    return "".join(out)


def _lists_in_parentheses(s):
    """True when a parenthesis lists topics: three items or more, or an item of several words («(fin, pedroso)» is not)."""
    for inner in re.findall(r"\(([^()]*)\)", s):
        if "," not in inner and ";" not in inner:
            continue
        items = [x.strip() for x in re.split(r"[,;]", inner) if x.strip()]
        if len(items) >= 3 or any(len(x.split()) > 1 for x in items):
            return True
    return False


def pending_block(text):
    """The text of the `**Pending on Human.**` block inside `## Now`, or None."""
    m = re.search(r"^## Now[ \t]*$", text, re.M)
    if not m:
        return None
    rest = text[m.end():]
    end = re.search(r"^## ", rest, re.M)
    section = rest[:end.start()] if end else rest
    p = re.search(r"^\*\*Pending on Human\.\*\*", section, re.M)
    if not p:
        return None
    body = section[p.end():]
    nxt = re.search(r"^\*\*[A-Z][^*\n]*\.\*\*", body, re.M)
    return body[:nxt.start()] if nxt else body


def sentences(block):
    out = []
    for line in block.splitlines():
        for part in re.split(r"\s+\u00b7\s+", line):
            out += [s.strip() for s in re.split(r"(?<=[.!?])\s+(?=[A-Z\u00c0-\u00dd])", part) if s.strip()]
    return out


def copies(block):
    """[(sentence, why)] - the sentences of the block that copy the audit's questions instead of pointing to the report."""
    found = []
    for s in sentences(block):
        plain = _DATES.sub("", re.sub(r"`[^`]*`", "X", s))
        plain = re.sub(r"\(\s*\)", "", plain)                      # the empty parenthesis a date stamp leaves
        if not (_ABOUT_QUESTIONS.search(plain) and _ABOUT_AUDIT.search(s)):
            continue
        why = None
        if len(plain) > MAX_POINTER:
            why = f"mais de {MAX_POINTER} caracteres: é um resumo, não um ponteiro"
        else:
            for rx, name in _SIGNS:
                if rx.search(plain):
                    why = f"enumera as perguntas ({name})"
                    break
            else:
                if _outside_parentheses(plain).count(",") >= 2:
                    why = "enumera as perguntas (duas vírgulas ou mais fora do parêntese)"
                elif _lists_in_parentheses(plain):
                    why = "enumera as perguntas (um parêntese que lista temas)"
        if why:
            found.append((s, why))
    return found


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    path = Path(args[0]) / "MEMORY.md"
    if not path.is_file():
        return 0
    block = pending_block(path.read_text(encoding="utf-8", errors="replace"))
    if block is None:
        return 0
    found = copies(block)
    if not found:
        if "--quiet" not in argv:
            print("now_questions_check: o `Pending on Human` não copia as perguntas da auditoria")
        return 0
    if "--quiet" not in argv:
        print("now_questions_check: o `## Now` copia as perguntas da auditoria de conformidade (elas moram só no relatório)")
    for s, why in found:
        print(f"MEMORY.md `Pending on Human`: «{s[:90]}{'…' if len(s) > 90 else ''}» — {why}; troque por «perguntas da auditoria de conformidade, em `reports/audits/<arquivo>`»")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
