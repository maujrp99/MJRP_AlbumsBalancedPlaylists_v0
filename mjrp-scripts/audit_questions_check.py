#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
r"""
audit_questions_check.py - is the questions section of the conformance audit's report in the shape the screen reads? The second clause of
the `content-audit` catalog item (content-audit@3, CM-0063); the parse itself is `content_audit_check.parse_questions` (one parse, which the
Control Center mirrors).

Why a clause of its own: the first clause (`content_audit_check.py`) is the judge CM-0052 already applied, and its label says the audit "was
not done". A report whose questions are still the old numbered list is not an audit that was not done - and a child that wrote it before it
had the skills of the shape must not fail the conform's closing criterion for it. So:

  - the child has NOT applied CM-0063: a shape problem is a WARNING (`[aviso] questions_shape ...`), exit 0 - by design;
  - the child HAS applied CM-0063 (it has the skills): the same problem is a gap, exit 1, with its own label
    «perguntas fora da forma P-NN» (the catalog's), and the lines of what is wrong.

Content-audit@4 (CM-0066, the decision policy) adds the CLASS of an open question (`classe: b|c`, and `por que o agente não podia:` on a `c`;
`questions_class`) to this same clause: a warning until the child applies CM-0066, a gap after it - independent of CM-0063.

Looks at the NEWEST report of `reports/audits/` only; no report, or a report with no `## Perguntas para o MJRP`: nothing to judge (exit 0).
A mark with no `decision` entry of the same time in the log is a warning in both states (`mark_without_log`). Exit 2: not evaluable.

Usage:
  python3 mjrp-scripts/audit_questions_check.py <project> [--quiet]
Stdlib only; vendored into every child with the kernel, next to `content_audit_check.py`.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    import content_audit_check as cac
    errors, warns, err = cac.questions_gate(args[0])
    if err:
        print(f"audit_questions_check: {err} (não avaliável)")
        return 2
    quiet = "--quiet" in argv
    if errors:
        print("audit_questions_check: as perguntas do relatório da auditoria estão fora da forma P-NN")     # also quiet: the clause drops line 1
        for e in errors:
            print(e)
    elif not quiet:
        print("audit_questions_check: perguntas do relatório na forma P-NN (ou sem a seção)")
    if not quiet:
        for w in warns:
            print(f"[aviso] {w}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
