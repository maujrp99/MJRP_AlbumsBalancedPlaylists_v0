# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_boot.py - the one place that puts the scripts' folder on `sys.path` (F73 R17, audit 2026-10-25).

43 files each ran their own `sys.path.insert(0, str(HERE))`, some at the top and some inside a function right before a late
import, so a module could be importable or not depending on which function ran first. A script that needs its siblings does
`import _boot` once, at the top; the folder is added once (idempotent) and every import below it just works.

It is a module, not a package, on purpose: the hooks, the contracts and the child projects call `python3 mjrp-scripts/<x>.py`, a path
that a `python3 -m mjrp_scripts.<x>` package would break. A script run that way already has its own folder first on `sys.path`;
`_boot` is for the cases where it does not (a module loaded by path, a script imported from another folder, a child's copy).

`conformance_check.py` does NOT import it: the Control Center execs that file's bytes in memory and its tests copy it alone, so it
stays self-contained and adds the folder itself where it needs a sibling (see the comment at the top of that file).
"""
import sys
from pathlib import Path

SCRIPTS_DIR = str(Path(__file__).resolve().parent)
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)
