# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_context.py - which project a script judges, and which harness it runs from (F73 R12, audit 2026-10-25).

The scripts used to answer both questions with module-level globals computed from `__file__` (`ROOT_DIR`, `HARNESS_WIKI`,
`HARNESS_ROOT`) and then ignored the root they were handed: a check judging a child still read the wiki of whoever was running.
A `Context` carries the two answers as values; a check that needs the harness takes it as a parameter, with the default below,
so a test (or a caller judging another project) passes its own.

  Context.root          the project being judged
  Context.harness_root  the repository whose `mjrp-scripts/` is running - the harness itself, or, in a child project, the child
                        (a child carries a vendored copy of the scripts and reads its own kernel)
"""
from dataclasses import dataclass
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
SCRIPTS_REPO = SCRIPTS_DIR.parent          # the repository these scripts live in


def split_root_option(argv):
    """(the project folder or None, the other arguments): pulls `--root <dir>` out of an argument list. A script that judges or
    renders a project takes it from here, so the project is asked for the same way everywhere. `--root` without a folder raises
    ValueError (the caller answers "not evaluable")."""
    args = list(argv)
    if "--root" not in args:
        return None, args
    i = args.index("--root")
    if i + 1 >= len(args) or args[i + 1].startswith("--"):
        raise ValueError("--root pede a pasta do projeto")
    root = args[i + 1]
    del args[i:i + 2]
    return root, args


@dataclass(frozen=True)
class Context:
    root: Path
    harness_root: Path = SCRIPTS_REPO

    @classmethod
    def for_project(cls, root=None, harness_root=None):
        """The context of judging `root` (default: the repository the scripts live in) from `harness_root` (default: the same)."""
        return cls(root=Path(root).resolve() if root is not None else SCRIPTS_REPO,
                   harness_root=Path(harness_root).resolve() if harness_root is not None else SCRIPTS_REPO)

    @property
    def scripts_dir(self):
        return self.harness_root / "mjrp-scripts"

    @property
    def harness_wiki(self):
        """The wiki of the harness these scripts run from: where the kernel source (`docs/wiki/kernel/`) lives when this IS the
        harness, and the child's own wiki when the scripts are the vendored copy."""
        return self.harness_root / "docs" / "wiki"

    @property
    def memory(self):
        return self.root / "MEMORY.md"
