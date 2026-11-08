#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
uat_readable_check.py - can the Control Center read this `uat.md`? The pre-commit's read of one file (UAT-375, 2026-10-26).

Born from an incident: the integrator wrote `fixing (UAT-373: ...)` in the Status cell of a row. The Control Center's reader
(`adapters/repo_fs/uat.py`, `parse_uat`) accepts only `open` | `fixing (Fxx)` | `fixed (...)` there (and the bare `fixing` on a row of
`Tipo` `copy`, F158) and, on ONE row outside the
format, fails the WHOLE read: the two tracks of the UAT Board went empty ("O uat.md nao pode ser lido"). Nothing at commit time
read the Status (`uat_tracks_check` judges the `Reportado por` column; `product_structure_check` is not in the hook).

It does not carry a grammar of its own: it calls `parse_uat` of `product_structure_check.py`, the reader's mirror that a test pins
to the app's (apps/control-center/tests/adapters/test_product_structure_pin.py), so a row the app rejects is a row this rejects.
What the reader fails on, and so this does: an unknown table header, a row with fewer cells than the header, a Gravidade outside
P0 | P1 | P2 | -, a Status outside the grammar (a closed row - a date in "OK do humano" - is not read for its Status).

Needs no contract and no profile: it reads any project's `uat.md`. The `pre-commit` runs it on the INDEX copy of every
`docs/specs/uat.md` the commit adds or changes, passing `--label` so the message names the real path.

Usage:
  python3 mjrp-scripts/uat_readable_check.py <uat.md> [--label <name shown in the message>]
Exit: 0 it reads | 1 it does not (the line and the reason are printed) | 2 not evaluable (no file, not UTF-8, the reader's mirror missing).
Stdlib only (ADR-0015); vendored into every child with the kernel.
"""
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402


def problem(text):
    """(line, reason) where the Control Center would fail the whole read of this `uat.md`; None when it reads."""
    import product_structure_check as psc
    try:
        psc.parse_uat(text)
    except psc.FormatError as exc:
        return exc.line, exc.reason
    return None


def main(argv):
    args = list(argv)
    label = None
    if "--label" in args:
        i = args.index("--label")
        if i + 1 >= len(args):
            print("uat_readable_check: --label pede um valor", file=sys.stderr)
            return 2
        label = args[i + 1]
        del args[i:i + 2]
    if len(args) != 1:
        print("uso: uat_readable_check.py <uat.md> [--label <nome>]", file=sys.stderr)
        return 2
    try:
        text = Path(args[0]).read_text(encoding="utf-8")
        found = problem(text)
    except (OSError, UnicodeDecodeError, ImportError) as exc:
        print(f"uat_readable_check: {args[0]}: não avaliável ({exc})", file=sys.stderr)
        return 2
    if found is None:
        return 0
    line, reason = found
    print(f"  {label or args[0]}:{line}: {reason} - o Control Center falharia a leitura INTEIRA da uat.md "
          "(Status: `open` | `fixing (Fxx)` | `fixed (<evidência>)`, e `fixing` sem feature só no Tipo `copy`; Gravidade: P0 | P1 | P2 | -; uma linha com as células do cabeçalho)")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
