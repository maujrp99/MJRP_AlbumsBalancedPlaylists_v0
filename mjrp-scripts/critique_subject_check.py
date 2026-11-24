#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""critique_subject_check.py - the `subject` of an architecture critique names every ADR by its whole id, never by a range (F269, UAT-585).

The incident (2026-11-16): the critique of the Control Center ADRs had `subject: "CC-ADR-0047 a 0053 · ..."`. The acceptance rule finds the
critique of an ADR by the whole id in the `subject` (`critiques_of`, `rules/acceptance_adr.py`), and a range names only its first id: the
CC-ADR-0048 to 0053 were left with no clean critique and never showed up for acceptance on the phone, with nothing warning who wrote it.

Decision (the agent's, revisable by the MJRP): the range is REFUSED, not expanded. Expanding would guess which ADRs the critique really judged
(the hole between two ids may hold an ADR that was not read), and the author is the one who knows. The fix is one id per ADR, written out.

What it flags, in the frontmatter `subject` of a critique that is not `status: closed` (a closed critique is history; the acceptance already used it):
  - an ADR id followed by `a`, `à`, `até`, `to`, `through`, a dash or `..` and a second number (`CC-ADR-0047 a 0053`, `ADR-0001–0003`,
    `CC-ADR-0047 a CC-ADR-0053`)
A list of whole ids (`ADR-0001 e ADR-0002`) is not a range and passes; the sensor asks only for the range, the case that hid six ADRs.

Usage: python3 mjrp-scripts/critique_subject_check.py <project|critique.md> [--quiet]
Exit 0 passes, 1 a range found (names file and subject), 2 not evaluable. Standard library only (vendored into every child with the kernel);
the owner skill (`mjrp-critiquing-architecture`) runs it on the critique right after writing it.
"""
import re
import sys
from pathlib import Path

AUDITS = "reports/audits"
ID = r"(?:[A-Z][A-Z0-9]*-)?ADR-\d{1,4}"
SEP = r"\s*(?:até\s+a|a|à|até|ate|to|through|thru|\.\.\.?|–|—|-|~)\s*"
RANGE_RE = re.compile(rf"\b{ID}{SEP}(?:{ID}|\d{{4}})\b(?!-\d)", re.I)
SUBJECT_RE = re.compile(r'^subject:\s*(?P<v>.*?)\s*$', re.M)
STATUS_RE = re.compile(r'^status:\s*"?(?P<v>[\w-]+)"?\s*$', re.M)


def frontmatter(text):
    if not text.startswith("---"):
        return ""
    end = text.find("\n---", 3)
    return text[3:end] if end > 0 else ""


def range_in(subject):
    """The range text found in the subject, or None. `ADR-0047 a 0053`; `ADR-0001-0003` is read as a range too (a dash)."""
    found = RANGE_RE.search(subject or "")
    return found.group(0) if found else None


def problem_of(path, text):
    fm = frontmatter(text)
    st, sub = STATUS_RE.search(fm), SUBJECT_RE.search(fm)
    if sub is None or (st and st.group("v").lower() == "closed"):
        return None
    hit = range_in(sub.group("v"))
    if hit is None:
        return None
    return (f"{path}: o `subject` nomeia um intervalo («{hit}»): a aceitação acha a crítica pelo id inteiro, e o intervalo nomeia só o primeiro; "
            "escreva um id por ADR («CC-ADR-0047, CC-ADR-0048, ...»)")


def problems(target):
    p = Path(target)
    if p.is_file():
        files = [p]
    elif (p / AUDITS).is_dir():
        files = sorted((p / AUDITS).glob("*.md"))
    else:
        return None
    out = []
    for f in files:
        found = problem_of(str(f), f.read_text(encoding="utf-8", errors="replace"))
        if found:
            out.append(found)
    return out


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    found = problems(args[0])
    if found is None:
        print(f"critique_subject_check: não há {AUDITS}/ em {args[0]} (não avaliável)")
        return 2
    if found:
        print("critique_subject_check: crítica com intervalo de ADRs no `subject`")
        for line in found:
            print(f"  {line}")
        return 1
    if "--quiet" not in argv:
        print("critique_subject_check: cada crítica aberta nomeia as ADRs pelo id inteiro")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
