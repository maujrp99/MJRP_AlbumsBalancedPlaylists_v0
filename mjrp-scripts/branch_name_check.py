#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
branch_name_check.py - the pre-commit refuses a work branch outside `branch-convention@2` (F132, UAT-411).

The board sees the work on a branch only by its name (F67, S-173: the Control Center reads the feature at the tip of an open branch whose
name carries the feature number). UAT-411: nothing charged the name - the F127 worked on `f127-outcome-measure-optional` and the F119 to F125
subagents on `worktree-agent-...`, and their cards stayed in «Priorizada» while the features moved. The MJRP chose the gate only (option 1,
2026-10-30): the Control Center does not learn to recognise a branch by its content.

  - the main line (`main`, or `master` where a child still has it) ..... passes
  - a name that follows `branch-convention@2` ........................... passes: `feat/fNN-<slug>`, `fix/fNN-<slug>` (BRANCH) and
                                                                           `claude/fNN-<slug>`, `claude/fNN-fMM-<slug>` (AGENT_BRANCH)
  - `wip/...` and `archive/...` (not feature branches, UAT-411) ......... passes
  - `integrate/...` (the integrator's train, mjrp-integrating-branches) . passes: it carries several features, never one
  - a detached HEAD, a rebase in progress ............................... passes: there is no branch to name (the rebase replays commits
                                                                           already judged on their branch)
  - any other name ...................................................... REFUSED (exit 1), with the exact `git branch -m` that cures it
  - the convention cannot be read, git does not answer .................. exit 2 (NOT EVALUABLE; never a pass, ADR-0002 § 8)

The convention is NOT copied here: `BRANCH` and `AGENT_BRANCH` are read from `rules/delivery.py` of the Control Center (the reader the board
uses), by the syntax tree - the module itself imports pydantic and the app's contract, which a hook must not need. In the harness the file is
in the repository; in a child it is read from the harness the child was refreshed from (`conformance_check.find_harness`: the contract's
`harness_root:`, `MJRP_HARNESS_ROOT`, the sibling `mjrp-harness`). A child that cannot find it is not evaluable - say where the harness is.

Usage: python3 mjrp-scripts/branch_name_check.py <root>
Exit: 0 passed | 1 refused | 2 not evaluable.  Stdlib only (ADR-0015); vendored into every child with the kernel.
"""
import ast
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402
import _git  # noqa: E402

DELIVERY_REL = Path("apps") / "control-center" / "src" / "control_center" / "rules" / "delivery.py"
CONVENTION_NAMES = ("BRANCH", "AGENT_BRANCH")
MAIN_LINE = ("main", "master")
FREE_PREFIXES = ("wip/", "archive/", "integrate/")
_FEATURE_NUMBER = re.compile(r"(?:^|[/_-])f(?P<n>\d{2,})(?=[-_/]|$)", re.I)


class NotEvaluable(Exception):
    """The gate could not judge: no convention to read, or git without an answer."""


def read_convention(source):
    """{name: compiled pattern} of BRANCH and AGENT_BRANCH, read from the `NAME = re.compile(<literal>)` assignments of `source`."""
    try:
        tree = ast.parse(Path(source).read_text(encoding="utf-8"), filename=str(source))
    except (OSError, SyntaxError, UnicodeDecodeError) as exc:
        raise NotEvaluable(f"{source}: não li a convenção ({exc})") from exc
    found = {}
    for node in tree.body:
        if not (isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name)):
            continue
        name, call = node.targets[0].id, node.value
        if (name in CONVENTION_NAMES and isinstance(call, ast.Call) and isinstance(call.func, ast.Attribute)
                and call.func.attr == "compile" and call.args and isinstance(call.args[0], ast.Constant)
                and isinstance(call.args[0].value, str)):
            found[name] = re.compile(call.args[0].value)
    missing = [n for n in CONVENTION_NAMES if n not in found]
    if missing:
        raise NotEvaluable(f"{source}: sem {', '.join(missing)} na forma `NOME = re.compile(r\"...\")` - a convenção mudou de forma?")
    return found


def convention_source(top):
    """The `rules/delivery.py` that holds the convention: the repository's own (the harness), else the harness a child was refreshed from."""
    own = Path(top) / DELIVERY_REL
    if own.is_file():
        return own
    import conformance_check as cc
    cfg, _ = cc.load_child(top)
    harness = cc.find_harness(top, cfg or {})
    if harness is not None and (Path(harness) / DELIVERY_REL).is_file():
        return Path(harness) / DELIVERY_REL
    raise NotEvaluable(f"não achei o harness com {DELIVERY_REL.as_posix()} (a convenção de nomes dos ramos): declare "
                       "`harness_root:` no .mjrp-project.yml, ou MJRP_HARNESS_ROOT, ou rode `new_project.py --refresh-kernel`")


def current_branch(top):
    """The checked-out branch's short name; None for a detached HEAD or a rebase in progress (nothing to name)."""
    try:
        for state in ("rebase-merge", "rebase-apply"):
            where = _git.text(top, "rev-parse", "--git-path", state)
            if where and (Path(top) / where).exists():
                return None
        r = _git.run(top, "symbolic-ref", "-q", "--short", "HEAD")
    except _git.GitError as exc:
        raise NotEvaluable(f"git não respondeu ({exc})") from exc
    if r.code == 1:
        return None                                   # detached HEAD
    if r.code != 0:
        raise NotEvaluable(f"git symbolic-ref saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    return r.out.strip()


def suggestion(name):
    """The `claude/fNN-<slug>` the branch should be called: the feature number it already carries, else placeholders."""
    bare = name.split("/", 1)[1] if "/" in name else name     # an old prefix (`feature/`, `claude/`) is not part of the slug
    m = _FEATURE_NUMBER.search(bare)
    if m:
        rest = (bare[:m.start()] + "-" + bare[m.end():]).replace("/", "-")
        slug = re.sub(r"[^a-z0-9]+", "-", rest.lower()).strip("-") or "<slug>"
        return f"claude/f{m['n']}-{slug}"
    return "claude/fNN-<slug>"


def free(name):
    """The branches that pass whatever the convention says: none to name, the main line, and the ones that are not a feature's."""
    return name is None or name in MAIN_LINE or name.startswith(FREE_PREFIXES)


def judge(name, convention):
    """None when the branch `name` passes; else the refusal, with the rename that cures it."""
    if free(name):
        return None
    if any(p.match(name) for p in convention.values()):
        return None
    new = suggestion(name)
    hint = "" if "fNN" not in new else " (NN = o número da feature deste trabalho; sem feature, crie-a no board, na main)"
    return (f"o ramo «{name}» está fora da branch-convention@2 (claude/fNN-<slug>, feat/fNN-<slug>, fix/fNN-<slug>): o board não vê o "
            f"trabalho dele (UAT-411).\n  renomeie e commite de novo:  git branch -m {new}{hint}")


def main(argv):
    if len(argv) != 1:
        print("uso: branch_name_check.py <raiz>", file=sys.stderr)
        return 2
    top = Path(argv[0])
    if not top.is_dir():
        print(f"branch_name_check: {top} não é uma pasta - não avaliável", file=sys.stderr)
        return 2
    try:
        name = current_branch(top)
        refusal = None if free(name) else judge(name, read_convention(convention_source(top)))   # main never waits on the harness
    except NotEvaluable as exc:
        print(f"branch_name_check: nome do ramo não avaliável - {exc}", file=sys.stderr)
        return 2
    if refusal:
        print(f"  {refusal}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
