#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""visual_gate.py -- a screen feature is merged with the independent visual recheck's report: evaluated, with no P0.

Born 2026-10-12 (ADR-0017 of the harness, revised after its architecture audit; decision of the MJRP): the Control
Center 1.0 reached its UAT with the UI far from the approved prototype and every sensor green, and one cause was that
the skill holding the check was never invoked. A station that lives only in skill text repeats that; this is the
mechanism behind it. It also holds the one definition of "this project has a screen" that the doctor's A2 and this
gate share.

Revised 2026-10-17 (decision of the MJRP, kernel page `pdlc-loops` § 5): the judge EVALUATES, it does not block. The
first Execute <-> Verify round goes to main even when the judge found things to fix - the findings become issues of
`uat.md` (marked "achado do juiz", `fixing (<Fxx>)` of the same feature) and the owner is the second judge: he gives
his OK, asks for the fix, or decides "fica como está". What still blocks is what the judge could not say or what the
owner has to weigh before main: no report, a stale report, a P0, a report that did not evaluate.

The rule, per project touched by the merged branch (the root, or a nested project with its own .mjrp-project.yml):
  - it applies to a `code-app` whose docs/specs/info-arch.md records an approved visual reference (§ Protótipos
    aprovados, an `Aprovado por:` line that is not the template's placeholder) - a live HTML prototype or static
    exports (Figma, another design tool), `reference_kind:: live | static`;
  - a screen file is one the contract declares in `screen:` (path prefixes ending in `/`, exact paths, or fnmatch
    globs); without the declaration: anything under `web/` but docs (README, *.md, .gitkeep), or a UI file
    (.tsx .jsx .vue .svelte .html .css .scss) under `src/`;
  - if the branch changed a screen file, the branch must hold a recheck report committed AFTER the last commit that
    changed a screen file (that commit is an ancestor of the report's commit); the NEWEST such report decides;
  - the report is `reports/audits/<YYYY-MM-DD>-<product>-visual-parity-recheck[-n].md` in that project, and it is read
    from its FRONTMATTER only, in English (what the machine reads is English - CLAUDE.md, "Nomes"):
        verdict: pass | fail | incomplete
        p0: <n>
    The prose line for the human ("Veredito: passa") is not read. Transition: the Control Center's recheck reports
    written before 2026-10-12 say `verdict: passes`, a legacy synonym of `pass` accepted in the frontmatter only (a
    report is not rewritten).

The decision table (the newest report after the last screen commit):

    no report after the last screen commit (only older ones, or none) ... refuse
    verdict: pass, p0: 0 (or no p0 - a pass has no real P0) ............ allow
    verdict: fail, p0: 0 ............................................... allow, with a note: each finding is an issue of
                                                                         `uat.md`, marked "achado do juiz"
    verdict: pass | fail, p0 > 0 ....................................... refuse - a P0 is the owner's call
    verdict: fail without `p0: <n>` .................................... refuse - without p0 there is no way to tell
    verdict: incomplete ................................................ refuse - the judge could not evaluate (sensor
                                                                         exit 2: no Node or Playwright, no facts, zero
                                                                         scenarios); nothing was compared
    no `verdict`, or a word other than the four above ................... refuse - the report does not say

Modes:
  python3 visual_gate.py --hook                 git pre-merge-commit: judges the revisions in GIT_REFLOG_ACTION; exit 1
                                                blocks the merge
  python3 visual_gate.py --check <rev> [--base <rev>]   the same judgement for a revision, from any shell

Escape -- the human's call, never the agent's: `git merge --no-verify`, or the environment variable
VISUAL_RECHECK_SKIP="<reason>" on the human's own command line (the gate prints the reason). It is the way out of a
P0: the agent brings the owner what the P0 is, and he decides whether it goes to main anyway. Python 3 stdlib only.
"""
import fnmatch
import os
import re
import sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
from _git import run_tuple as _git   # (code, stdout) with a deadline on every call: this runs in the pre-merge-commit hook (F73)

UI_SUFFIXES = {".tsx", ".jsx", ".vue", ".svelte", ".html", ".css", ".scss"}
DOC_NAMES = re.compile(r"(^|/)(readme[^/]*|[^/]*\.md|\.gitkeep|\.gitignore)$", re.I)
PRUNE = {"node_modules", ".venv", "__pycache__", "dist", "build", ".git"}
REPORT = re.compile(r"(^|/)reports/audits/\d{4}-\d{2}-\d{2}-[^/]*visual-parity-recheck[^/]*\.md$")
FRONTMATTER = re.compile(r"\A---[ \t]*\n(.*?)\n---[ \t]*(\n|\Z)", re.S)
VERDICT = re.compile(r"^verdict:[ \t]*[\"']?([A-Za-z-]+)[\"']?[ \t]*(#.*)?$", re.M)
P0_FIELD = re.compile(r"^p0:[ \t]*[\"']?(\d+)[\"']?[ \t]*(#.*)?$", re.M)
VERDICTS = {"pass": "pass", "passes": "pass",      # `passes`: legacy, see the docstring
            "fail": "fail", "incomplete": "incomplete"}


# ---------------------------------------------------------------------------------------------- the contract
def _strip(line):
    return re.sub(r"\s+#.*$", "", line).rstrip()


def contract_fields(text):
    """`profile` and `screen` of a contract (mjrp_harness.profile, mjrp_harness.screen) - a tiny reader, so this
    module needs neither PyYAML nor the doctor. `screen` is None when the contract does not declare it."""
    profile, screen = None, None
    lines = (text or "").splitlines()
    for i, raw in enumerate(lines):
        line = _strip(raw)
        m = re.match(r"^  profile:\s*(\S+)", line)
        if m:
            profile = m.group(1).strip("\"'")
        m = re.match(r"^  screen:\s*(.*)$", line)
        if m:
            rest = m.group(1).strip()
            if rest.startswith("["):
                screen = [x.strip().strip("\"'") for x in rest.strip("[]").split(",") if x.strip()]
            else:
                screen = []
                for nxt in lines[i + 1:]:
                    n = _strip(nxt)
                    mm = re.match(r"^\s{4,}-\s*(.+)$", n)
                    if not mm:
                        if n.strip():
                            break
                        continue
                    screen.append(mm.group(1).strip().strip("\"'"))
    return profile, screen


def approved_reference(info_arch_text):
    """The approval line of the first APPROVED VISUAL REFERENCE recorded in info-arch.md § Protótipos aprovados (the
    existing record, read as it is); None when there is none (the template's placeholder, `<humano> em AAAA-MM-DD`,
    does not count). The reference is whatever shows how the approved screen looks: a live HTML prototype, Figma
    exports, another design tool (MJRP, 2026-10-12); the entry says `reference_kind:: live | static` and
    `reference_path:: <where it lives>`, and an entry without `reference_kind::` reads as a live prototype."""
    m = re.search(r"^## Protótipos aprovados[ \t]*$(.*?)(?=^## |\Z)", info_arch_text or "", re.M | re.S)
    for line in (m.group(1).splitlines() if m else []):
        a = re.match(r"\s*-\s*Aprovado por:\s*(.+)", line)
        if a and not re.search(r"<[^>]+>|AAAA", a.group(1)):
            return a.group(1).strip()
    return None


approved_prototype = approved_reference      # the name of the first version of this module


# ---------------------------------------------------------------------------------------------- the screen
def is_screen_file(rel, declared=None):
    """Whether a project-relative path is a screen file: the contract's `screen:` when declared, else the default."""
    rel = rel.replace(os.sep, "/")
    if declared:
        for pat in declared:
            pat = pat.strip()
            if pat.endswith("/") and rel.startswith(pat):
                return True
            if rel == pat or fnmatch.fnmatch(rel, pat):
                return True
        return False
    if rel.startswith("web/") and not DOC_NAMES.search(rel) and not any(p in rel.split("/") for p in PRUNE):
        return True
    return rel.startswith("src/") and Path(rel).suffix in UI_SUFFIXES


def screen_on_disk(root, declared=None):
    """The first screen file on disk ('web/…' or 'src/…'), or None - what the doctor's A2 asks."""
    root = Path(root)
    bases = sorted({p.split("/")[0] for p in declared}) if declared else ["web", "src"]
    for base in bases:
        top = root / base
        if top.is_file():
            if is_screen_file(base, declared):
                return base
            continue
        if not top.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(top):
            dirnames[:] = [d for d in dirnames if d not in PRUNE]
            for f in filenames:
                rel = (Path(dirpath) / f).relative_to(root).as_posix()
                if is_screen_file(rel, declared):
                    return rel
    return None


def report_fields(text):
    """(verdict, p0) of a recheck report's frontmatter: verdict is "pass" | "fail" | "incomplete" | None (absent or any
    other word), p0 an int or None. Only the frontmatter is read."""
    fm = FRONTMATTER.match(text or "")
    if not fm:
        return None, None
    v, p = VERDICT.search(fm.group(1)), P0_FIELD.search(fm.group(1))
    return (VERDICTS.get(v.group(1).lower()) if v else None), (int(p.group(1)) if p else None)


def report_decision(text):
    """What a recheck report lets the gate do: (kind, why). kind is "ok" (merge), "fail_ok" (merge, with a note: the
    judge found things, they are issues of the same feature), "p0" (refuse: the owner's call), "incomplete" (refuse:
    the judge could not evaluate) or "invalid" (refuse: the report does not say)."""
    verdict, p0 = report_fields(text)
    if verdict is None:
        return "invalid", "o frontmatter não diz `verdict: pass`, `fail` ou `incomplete`"
    if verdict == "incomplete":
        return "incomplete", "o frontmatter diz `verdict: incomplete` - o juiz não conseguiu avaliar (nada foi comparado)"
    if p0 is not None and p0 > 0:
        return "p0", f"o frontmatter diz `p0: {p0}`"
    if verdict == "fail":
        if p0 is None:
            return "invalid", "`verdict: fail` sem `p0: <n>` no frontmatter - sem ele não há como saber se há P0"
        return "fail_ok", "o juiz achou o que corrigir (`verdict: fail`, `p0: 0`)"
    return "ok", "o juiz avaliou e não achou P0"


def verdict_passes(text):
    """Whether a recheck report's frontmatter says `verdict: pass` (or the legacy `passes`). Only the frontmatter."""
    return report_fields(text)[0] == "pass"


# ---------------------------------------------------------------------------------------------- git


def _show(root, rev, path):
    code, out = _git(root, "show", f"{rev}:{path}")
    return out if code == 0 else None


def _projects_of(root, rev, files):
    """{project prefix ('' for the root, 'apps/x/' for a nested one): [project-relative files]} - the nearest folder
    holding a .mjrp-project.yml at `rev`."""
    code, out = _git(root, "ls-tree", "-r", "--name-only", rev)
    contracts = sorted({p[: -len(".mjrp-project.yml")] for p in out.splitlines() if p.endswith(".mjrp-project.yml")},
                       key=len, reverse=True)
    groups = {}
    for f in files:
        prefix = next((c for c in contracts if f.startswith(c)), None)
        if prefix is None:
            continue
        groups.setdefault(prefix, []).append(f[len(prefix):])
    return groups


def judge_full(root, rev, base="HEAD"):
    """([(kind, message)], [note]) for merging `rev` into `base`. A problem is one line per project whose screen
    changed without an acceptable recheck (kind: "missing" | "p0" | "incomplete" | "invalid"); a note is what the
    merge may go with (a `fail` report whose findings are issues of the feature). No problem: the merge may go."""
    root = str(root)
    code, mb = _git(root, "merge-base", base, rev)
    if code != 0:
        return [], []
    mb = mb.strip()
    _, out = _git(root, "diff", "--name-only", mb, rev)
    changed = [l for l in out.splitlines() if l]
    _, order = _git(root, "rev-list", "--topo-order", f"{mb}..{rev}")
    position = {c: i for i, c in enumerate(order.split())}          # 0 = the newest commit of the branch
    problems, notes = [], []
    for prefix, rels in _projects_of(root, rev, changed).items():
        profile, declared = contract_fields(_show(root, rev, f"{prefix}.mjrp-project.yml"))
        if profile != "code-app" or not approved_reference(_show(root, rev, f"{prefix}docs/specs/info-arch.md")):
            continue
        screen = [r for r in rels if is_screen_file(r, declared)]
        if not screen:
            continue
        name = prefix.rstrip("/") or "o projeto da raiz"
        _, last = _git(root, "log", "-1", "--format=%H", f"{mb}..{rev}", "--", *[prefix + r for r in screen])
        last = last.strip()
        if not last:
            continue
        _, tree = _git(root, "ls-tree", "-r", "--name-only", rev, "--", f"{prefix}reports/audits/")
        reports = [p for p in tree.splitlines() if REPORT.search(p[len(prefix):] if p.startswith(prefix) else p)]
        after = []                          # (position, path): the reports committed after the last screen commit
        for rp in reports:
            _, rc = _git(root, "log", "-1", "--format=%H", rev, "--", rp)
            rc = rc.strip()
            if rc and rc != last and _git(root, "merge-base", "--is-ancestor", last, rc)[0] == 0:
                after.append((position.get(rc, len(position)), rp))
        shown = f"{', '.join(screen[:3])}{'…' if len(screen) > 3 else ''}; último commit de tela {last[:8]}"
        if not after:
            problems.append(("missing", f"{name}: o ramo mudou a tela ({shown}) e não traz reconferência visual "
                             f"(`verdict: pass` ou `fail`, com `p0: 0`, no frontmatter) commitada depois dele "
                             f"(reports/audits/<data>-<produto>-visual-parity-recheck[-n].md)"))
            continue
        newest = min(after)[1]                                      # the newest one decides
        kind, why = report_decision(_show(root, rev, newest))
        if kind == "ok":
            continue
        if kind == "fail_ok":
            notes.append(f"{name}: reconferência {newest} - {why}. O merge vai; cada achado do juiz tem de ser issue do "
                         f"`uat.md` (\"achado do juiz\", `fixing (<Fxx>)` da mesma feature) e o MJRP decide: OK, correção "
                         f"ou \"fica como está\" (pdlc-loops § 5)")
            continue
        label = {"p0": "tem P0", "incomplete": "não avaliou", "invalid": "não diz o veredito"}[kind]
        problems.append((kind, f"{name}: o ramo mudou a tela ({shown}) e a reconferência mais nova ({newest}) {label}: {why}"))
    return problems, notes


def judge(root, rev, base="HEAD"):
    """The problems that block merging `rev` into `base`, as text lines; an empty list means the merge may go."""
    return [msg for _kind, msg in judge_full(root, rev, base)[0]]


def _revs_from_reflog_action():
    action = os.environ.get("GIT_REFLOG_ACTION", "")
    parts = action.split()
    if not parts or parts[0] != "merge":
        return []
    return [p for p in parts[1:] if not p.startswith("-")]


def main(argv):
    root = _git(".", "rev-parse", "--show-toplevel")[1].strip() or "."
    if "--hook" in argv:
        revs = _revs_from_reflog_action()
        if not revs:
            return 0                       # not a `git merge <rev>` we can name: nothing to judge
    elif "--check" in argv:
        revs = [argv[argv.index("--check") + 1]]
    else:
        print(__doc__)
        return 2
    base = argv[argv.index("--base") + 1] if "--base" in argv else "HEAD"
    problems, notes = [], []
    for rev in revs:
        p, n = judge_full(root, rev, base)
        problems += p
        notes += n
    for n in notes:
        print(f"  [visual] {n}")
    if not problems:
        return 0
    skip = os.environ.get("VISUAL_RECHECK_SKIP", "").strip()
    for _kind, msg in problems:
        print(f"  [visual] {msg}")
    if skip:
        print(f"  [visual] merge liberado pelo humano: VISUAL_RECHECK_SKIP — {skip}")
        return 0
    kinds = {k for k, _m in problems}
    print("\n  merge recusado: feature de tela sem reconferência visual independente avaliada e sem P0 (pdlc-loops § 5).")
    if kinds & {"missing", "invalid"}:
        print("  rode a reconferência (mjrp-ensuring-quality, modo visual parity, por um agente que não implementou),\n"
              "  commite o relatório no ramo depois do último commit de tela e faça o merge de novo\n"
              "  (`verdict: pass` ou `fail`, com `p0: 0`; git merge --abort desfaz este). O juiz avalia, não barra:\n"
              "  um `fail` sem P0 entra, e cada achado vira issue do uat.md.")
    if "incomplete" in kinds:
        print("  o juiz não avaliou (sensor exit 2: sem Node ou Playwright, sem fatos, zero cenários): resolva a causa e\n"
              "  rode a reconferência de novo - nada foi comparado, e isso não é paridade.")
    if "p0" in kinds:
        print("  P0 é do MJRP: traga a ele o que é; ele decide se entra na main mesmo assim.")
    print("  a saída é do humano, nunca do agente: VISUAL_RECHECK_SKIP=\"<motivo>\" git merge … ou git merge --no-verify.")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
