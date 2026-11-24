#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""adr_on_main.py - the ADR that waits for the MJRP is born on `main`, with a number nobody else holds (F300, UAT-595).

The failure (2026-11-17): the CC-ADR-0057 and the CC-ADR-0058, `Proposed` and routed to the MJRP's acceptance, lived only on the branch of the
feature that wrote them. The Control Center reads `main`, so the MJRP never saw them ("adr 057 nao aparece no control center"); and the F275
branch wrote its own CC-ADR-0057 beside it. Two judgments, on what a branch ADDS (an ADR that main already has is edited freely):

  1. a NEW ADR whose status is `Proposed` and whose route is `**Acceptance**: MJRP` is refused on a branch that is not `main`: it is
     registered on `main` first, by the integrator, with a number from `python3 mjrp-scripts/merge_train.py next-adr-id --reserve`; the branch
     then does not edit the registered text (a change goes back to the integrator, with a new critique). An ADR for the tech lead (not the MJRP) may be born on the branch.
  2. a NEW ADR whose number a different file already holds on `main` or on another open branch is refused (two branches, one number).

Modes: `--staged` (the pre-commit: what the index adds, on the branch being committed) and `--branch REF [--base main]` (the train, `merge_train.py`
`adr_gate`: what REF added since `base`). A rename counts as an add; an ADR the main already has is never new (a merge of `main` into the branch). Exit 0 passes, 1 is a finding, 2 could not judge (never an approval). Standard library only."""
import argparse
import re
import subprocess
import sys

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402  (the scripts folder on sys.path, F73 R17)
import adr_header_check  # noqa: E402  the one reading of an ADR header (the kernel carries it to the children)

ADR_FILE = re.compile(r"^(?P<dir>(?:.*/)?docs/decisions)/(?P<num>\d{4})(?:-[^/]*)?\.md$")
HEAD_LINES = adr_header_check.HEADER_LINES   # the reader's window


class Unevaluable(Exception):
    pass


def git(args, cwd=None):
    try:
        r = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise Unevaluable(f"git não respondeu ({exc})") from exc
    if r.returncode != 0:
        raise Unevaluable(f"git {' '.join(args[:2])} saiu {r.returncode}: o ref ou o caminho não existe neste repositório")
    return r.stdout


def header(text):
    """(status, route) of an ADR, read EXACTLY as the Control Center's reader and `adr_header_check.py` read them (their expressions, the first
    line of the window that has each field): a guard with a reading of its own would disagree with the screen on some header, and a header
    the screen reads as waiting for the MJRP would pass it (the recheck rounds of F300 found six such forms, one per round)."""
    lines = text.splitlines()[:HEAD_LINES]
    status = next((m["word"] for m in (re.search(adr_header_check.STATUS_RE, l) for l in lines) if m), None)
    route = next((m["route"] for m in (re.search(adr_header_check.ACCEPTANCE_RE, l) for l in lines) if m), None)
    return status, route


def open_branches(base, skip, cwd=None):
    out = git(["for-each-ref", f"--no-merged={base}", "--format=%(refname:short)", "refs/heads"], cwd)
    return [b for b in out.split() if b not in (base, skip) and not b.startswith("archive/")]


def holders(ref_names, cwd=None):
    """{(dir, number): {path, ...}} of the ADR files the refs hold."""
    found = {}
    for ref in ref_names:
        for line in git(["ls-tree", "-r", "--name-only", ref], cwd).splitlines():
            m = ADR_FILE.match(line)
            if m:
                found.setdefault((m["dir"], m["num"]), set()).add(line)
    return found


def on_base(base, path, cwd=None):
    """Whether the main line already has the file (`git cat-file -e`): an ADR it has is edited freely, wherever the change came from (a merge of
    `main` into the branch brings the ADRs the branch did not write)."""
    try:
        r = subprocess.run(["git", "cat-file", "-e", f"{base}:{path}"], cwd=cwd, capture_output=True, timeout=30)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise Unevaluable(f"git não respondeu ({exc})") from exc
    return r.returncode == 0


def judge(added, read, base, branch, cwd=None, modified=()):
    """`added`: the ADR paths the change adds (a rename counts: the new name is a new ADR); `read(path)`: their text. The findings, one line each."""
    problems = []
    # an ADR the main has, edited on the branch so that it now waits for the MJRP when on the main it did not: the decision that waits for the
    # human would live only on the branch (an Accepted record turned back into a Proposed one for the MJRP)
    for path in sorted(set(modified) | {p for p in added if on_base(base, p, cwd)}):   # a path the branch rewrites and the main already has: edited, not born
        before = header(git(["show", f"{base}:{path}"], cwd)) if on_base(base, path, cwd) else None
        if before is not None and header(read(path)) == ("Proposed", "MJRP") and before != ("Proposed", "MJRP"):
            problems.append(f"{path}: a ADR que a `main` tem passou a esperar o MJRP (`Proposed`, aceite do MJRP) só neste branch: o Control Center lê a `main` e ele "
                            "não a vê. A mudança vai pela `main` (o integrador a registra), não só pelo branch")
    added = [p for p in added if not on_base(base, p, cwd)]
    if not added:
        return problems
    others = holders([base, *open_branches(base, branch, cwd)], cwd)
    seen = {}
    for path in sorted(added):
        m = ADR_FILE.match(path)
        twin = seen.setdefault((m["dir"], m["num"]), path)
        if twin != path:
            problems.append(f"{path}: o número {m['num']} é o de {twin}, no mesmo branch")
        status, route = header(read(path))
        if status == "Proposed" and route == "MJRP":
            problems.append(f"{path}: a ADR que espera o MJRP (`Proposed`, aceite do MJRP) nasce na `main`, não só no branch `{branch}`: o Control Center lê a `main` "
                            "e ele não a vê (UAT-595). Peça ao orquestrador que a registre na `main` com o número de "
                            "`python3 mjrp-scripts/merge_train.py next-adr-id --reserve`; depois o branch não edita o texto registrado: uma mudança volta ao integrador, que registra de novo depois de uma crítica nova")
        clash = sorted(p for p in others.get((m["dir"], m["num"]), set()) if p != path)
        if clash:
            problems.append(f"{path}: o número {m['num']} já é de outra ADR ({clash[0]}) na `main` ou em outro branch; reserve um novo com "
                            "`python3 mjrp-scripts/merge_train.py next-adr-id --reserve`")
    return problems


def run(mode, ref, base, cwd=None):
    if mode == "staged":
        branch = git(["rev-parse", "--abbrev-ref", "HEAD"], cwd).strip()
        if branch == base:
            return []   # the integrator writes `main`: that is where the ADR is born
        def names(kind):
            return [n for n in git(["diff", "--cached", "--name-only", f"--diff-filter={kind}", "-z"], cwd).split("\0") if n and ADR_FILE.match(n)]
        return judge(names("AR"), lambda p: git(["show", f":{p}"], cwd), base, branch, cwd, modified=names("M"))

    def names(kind):
        return [n for n in git(["diff", "--name-only", f"--diff-filter={kind}", "-z", f"{base}...{ref}"], cwd).split("\0") if n and ADR_FILE.match(n)]
    return judge(names("AR"), lambda p: git(["show", f"{ref}:{p}"], cwd), base, ref, cwd, modified=names("M"))


def main(argv=None):
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--staged", action="store_true")
    g.add_argument("--branch", metavar="REF")
    ap.add_argument("--base", default="main")
    ap.add_argument("--root", default=None)
    a = ap.parse_args(argv)
    try:
        problems = run("staged" if a.staged else "branch", a.branch, a.base, a.root)
    except Unevaluable as exc:
        print(f"adr_on_main: não avaliou ({exc})")
        return 2
    for p in problems:
        print("  " + p)
    if problems:
        print(f"adr_on_main: {len(problems)} achado(s)")
        return 1
    print("adr_on_main: ok - nenhuma ADR que espera o MJRP nasce só num branch, e nenhum número se repete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
