#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
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
    a report with `who_judged: human` .................................. not read - the human's OK is not written by
                                                                         an agent (F61); the table goes on without it
    fast lane, no report after the last screen commit ................... ask the MJRP's Touch ID (`--hook` only):
                                                                         granted -> allow; anything else -> refuse

The fast lane (F61, 2026-10-30; kernel page `pdlc-loops` § 2): on a branch whose changed feature specs all say `lane: fast`,
the judge of the screen is the MJRP looking at it - there is no agent judge, so there is no recheck report to read. When
such a branch changed a screen and holds no acceptable report after the last screen commit, the gate in `--hook` mode asks
for HIS presence: the Touch ID of the Control Center (`~/.mjrp/control-center/bin/presence`, CC-ADR-0031, the same proof
as the Aceite), with a dialog that names the features, the branch and its tip. His finger is the visual verdict (pass, no
P0); a cancel, a timeout or a Mac with no Touch ID refuses the merge. The OK is written nowhere an agent writes: the gate
asks for it live, and records it afterwards only as an audit note (`git notes --ref=mjrp-visual-ok show <tip>`), which
it never reads back. A report with `who_judged: human` - the OK of the chat that an agent transcribed (the practice of
2026-10-26 to 2026-10-29) - no longer counts as a verdict: an agent wrote it, so it is not his. A branch with any
standard-lane feature, or with no feature spec, keeps the recheck report; on the Agent track of the fast lane the
independent recheck writes its report and the finger is not asked.

Modes:
  python3 visual_gate.py --hook                 git pre-merge-commit: judges the revisions in GIT_REFLOG_ACTION, and refuses a staged
                                                screen file none of them changed; exit 1
                                                blocks the merge
  python3 visual_gate.py --check <rev> [--base <rev>]   the same judgement for a revision, from any shell

Escape -- the human's call, never the agent's: `git merge --no-verify`, or the environment variable
VISUAL_RECHECK_SKIP="<reason>" on the human's own command line (the gate prints the reason). It is the way out of a
P0: the agent brings the owner what the P0 is, and he decides whether it goes to main anyway. Python 3 stdlib only.
"""
import fnmatch
import os
import pwd
import subprocess
import time
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
WHO_JUDGED = re.compile(r"^who_judged:[ \t]*[\"']?([A-Za-z-]+)", re.M)
FEATURE_SPEC = re.compile(r"(^|/)docs/specs/features/(F\d+)[^/]*/spec\.md$")
LANE = re.compile(r"^lane:[ \t]*[\"']?([A-Za-z-]+)", re.M)
# The proof of presence of the Control Center (CC-ADR-0031). The home comes from the account, never from $HOME: a variable on the
# merge's command line must not be able to point the gate at another binary.
PRESENCE = Path(pwd.getpwuid(os.getuid()).pw_dir) / ".mjrp" / "control-center" / "bin" / "presence"
# Seconds the dialog waits for his finger. The integrator merges through `merge_train.py merge`, whose deadline on every git call is
# GIT_TIMEOUT (60 s): the dialog, its margin (PRESENCE_MARGIN) and the rest of the hook must end before it, or the train kills
# `git merge` mid-way (F61 judge, P1-1). The selftest holds PRESENCE_TIMEOUT + PRESENCE_MARGIN < merge_train.GIT_TIMEOUT.
PRESENCE_TIMEOUT = 35
PRESENCE_MARGIN = 10
NOTES_REF = "refs/notes/mjrp-visual-ok"              # the audit trail of the OK; the gate never reads it back
SKIP_VAR = "VISUAL_RECHECK_SKIP"                     # the human's valve, read here; only he sets it


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


def judged_by_human(text):
    """Whether a recheck report's frontmatter says `who_judged: human`: the OK of the human transcribed by an agent, which the gate no
    longer reads as a verdict (F61). Only the frontmatter."""
    fm = FRONTMATTER.match(text or "")
    m = WHO_JUDGED.search(fm.group(1)) if fm else None
    return bool(m) and m.group(1).lower() == "human"


def spec_lane(text):
    """The `lane:` of a feature spec's frontmatter, lower case ("fast" | "standard" | ...), or "" when it says none."""
    fm = FRONTMATTER.match(text or "")
    m = LANE.search(fm.group(1)) if fm else None
    return m.group(1).lower() if m else ""


def ask_presence(reason, timeout=PRESENCE_TIMEOUT):
    """(code, detail) of the Touch ID asked to the owner of the Mac: 0 granted, 2 denied, 3 unavailable, 4 timed out (the exits of
    `presence`, CC-ADR-0031); 3 also when the binary is missing or does not run. The only place the gate talks to a person."""
    if not PRESENCE.is_file() or not os.access(PRESENCE, os.X_OK):
        return 3, f"{PRESENCE} não existe (o Control Center o instala: ops/install-service.sh)"
    try:
        r = subprocess.run([str(PRESENCE), reason, str(timeout)], capture_output=True, text=True,
                           timeout=timeout + PRESENCE_MARGIN)
    except (OSError, subprocess.SubprocessError) as e:
        return 3, f"{type(e).__name__}: {e}"
    return r.returncode, (r.stderr or "").strip()


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


def branch_lanes(root, rev, changed):
    """({fast feature ids}, {other feature ids}): the features whose spec.md the branch changed, split by the `lane:` of the spec
    at `rev`. The branch is on the fast lane when the first set is not empty and the second is."""
    fast, other = set(), set()
    for path in changed:
        m = FEATURE_SPEC.search(path)
        if not m:
            continue
        (fast if spec_lane(_show(root, rev, path)) == "fast" else other).add(m.group(2))
    return fast, other


def _human_ok(root, rev, label, fast, waiting, ask):
    """The MJRP's OK on the screen for a fast-lane branch: ([(kind, message)], [note]). `waiting` is [(project name, what changed)];
    `ask` is None outside the hook (nothing is asked: the merge will ask) or ask_presence."""
    ids = ", ".join(sorted(fast, key=lambda f: int(f[1:])))
    where = "; ".join(f"{n}: {s}" for n, s in waiting)
    if ask is None:
        return [("human_ok", f"via rápida ({ids}): falta o OK do MJRP na tela ({where}) - o merge pede o Touch ID dele")], []
    tip = _git(root, "rev-parse", "--short=8", rev)[1].strip() or rev
    into = _git(root, "rev-parse", "--abbrev-ref", "HEAD")[1].strip() or "a main"
    code, detail = ask(f"MJRP Harness: OK visual de {ids} - o ramo {label or rev} @ {tip} entra em {into}")
    if code == 0:
        when = time.strftime("%Y-%m-%d %H:%M")
        full = _git(root, "rev-parse", rev)[1].strip() or rev
        note = (f"visual-ok: {ids}\npresence: touch-id\nat: {when}\nbranch: {label or rev}\ntip: {full}\nscreen: {where}\n"
                f"by: visual_gate.py (F61, pdlc-loops § 2)\n")
        saved = _git(root, "notes", f"--ref={NOTES_REF}", "add", "-f", "-m", note, full)[0] == 0
        tail = "" if saved else " (o registro de auditoria não foi gravado; o OK vale)"
        return [], [f"via rápida ({ids}): o MJRP deu o OK na tela com o Touch ID ({when}) - é o veredito visual{tail}"]
    why = {2: "o MJRP não confirmou (Touch ID cancelado ou recusado)",
           4: "o Touch ID expirou sem resposta"}.get(code, f"o Touch ID não pôde ser pedido aqui ({detail or f'exit {code}'})")
    kind = "human_no" if code in (2, 4) else "human_unavailable"
    return [(kind, f"via rápida ({ids}): {where} - {why}")], []


def judge_full(root, rev, base="HEAD", ask=None, label_of_branch=None):
    """([(kind, message)], [note]) for merging `rev` into `base`. A problem is one line per project whose screen
    changed without an acceptable recheck (kind: "missing" | "p0" | "incomplete" | "invalid"), or one line for the
    MJRP's OK of a fast-lane branch ("human_ok" outside the hook, "human_no", "human_unavailable"); a note is what the
    merge may go with (a `fail` report whose findings are issues of the feature, the OK he gave). No problem: the merge
    may go. `ask` asks for his presence (ask_presence in the hook; None elsewhere); `label_of_branch` is the branch's name."""
    root = str(root)
    code, mb = _git(root, "merge-base", base, rev)
    if code != 0:
        return [], []
    mb = mb.strip()
    _, out = _git(root, "diff", "--name-only", mb, rev)
    changed = [l for l in out.splitlines() if l]
    _, order = _git(root, "rev-list", "--topo-order", f"{mb}..{rev}")
    position = {c: i for i, c in enumerate(order.split())}          # 0 = the newest commit of the branch
    fast, other = branch_lanes(root, rev, changed)
    fast_lane = bool(fast) and not other
    problems, notes, waiting = [], [], []
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
                if judged_by_human(_show(root, rev, rp)):
                    notes.append(f"{name}: {rp} diz `who_judged: human` - o OK do humano escrito por um agente não vale como "
                                 f"veredito (F61); na via rápida o OK é o Touch ID que o merge pede")
                    continue
                after.append((position.get(rc, len(position)), rp))
        shown = f"{', '.join(screen[:3])}{'…' if len(screen) > 3 else ''}; último commit de tela {last[:8]}"
        if not after and fast_lane:
            waiting.append((name, shown))
            continue
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
    if waiting and problems and ask is not None:
        notes.append("via rápida: o Touch ID não foi pedido - o merge já é recusado pelo que vem abaixo")
        ask = None
    if waiting:
        p, n = _human_ok(root, rev, label_of_branch, fast, waiting, ask)
        problems += p
        notes += n
    return problems, notes


def judge(root, rev, base="HEAD"):
    """The problems that block merging `rev` into `base`, as text lines; an empty list means the merge may go."""
    return [msg for _kind, msg in judge_full(root, rev, base)[0]]


PROTECTED_BRANCH = "main"


def _merge_heads(root):
    """The revisions of an open merge (MERGE_HEAD, one per line): the pre-commit's `--hook` when a merge into main is closed by
    `git commit` - after a refusal or a conflict - where git runs no pre-merge-commit and sets no GIT_REFLOG_ACTION (UAT-418)."""
    code, path = _git(root, "rev-parse", "--git-path", "MERGE_HEAD")
    f = Path(path.strip()) if code == 0 and path.strip() else None
    if f is not None and not f.is_absolute():
        f = Path(root) / f
    if f is None or not f.is_file():
        return []
    return [l.strip() for l in f.read_text(encoding="utf-8").splitlines() if l.strip()]


def _revs_from_reflog_action():
    action = os.environ.get("GIT_REFLOG_ACTION", "")
    parts = action.split()
    if not parts or parts[0] != "merge":
        return []
    return [p for p in parts[1:] if not p.startswith("-")]


def staged_screen_files(root):
    """The screen files (repository paths) this merge brings into HEAD - read from what git staged (HEAD against the index), with
    the contract and info-arch.md of each project read from the index. The hook learns WHICH revisions are merged only from
    GIT_REFLOG_ACTION, and git writes MERGE_HEAD only after the hook; this is the content side of the same merge."""
    _, out = _git(root, "diff", "--cached", "--name-only", "HEAD")
    staged = [l for l in out.splitlines() if l]
    _, listed = _git(root, "ls-files")
    contracts = sorted({p[: -len(".mjrp-project.yml")] for p in listed.splitlines() if p.endswith(".mjrp-project.yml")},
                       key=len, reverse=True)
    found = set()
    for f in staged:
        prefix = next((c for c in contracts if f.startswith(c)), None)
        if prefix is None:
            continue
        profile, declared = contract_fields(_show(root, "", f"{prefix}.mjrp-project.yml"))
        if profile != "code-app" or not approved_reference(_show(root, "", f"{prefix}docs/specs/info-arch.md")):
            continue
        if is_screen_file(f[len(prefix):], declared):
            found.add(f)
    return found


def unjudged_screen(root, revs, base="HEAD"):
    """The staged screen files that none of the named revisions changed since its merge base with `base`: what the merge brings
    and the gate would not have judged. `GIT_REFLOG_ACTION=x git merge ...` (or `merge main`) named nothing - or the wrong thing
    - and used to skip the whole gate (F61 judge, pre-existing); now the gate refuses what it cannot tie to a named revision."""
    staged = staged_screen_files(root)
    covered = set()
    for rev in revs:
        code, mb = _git(root, "merge-base", base, rev)
        if code == 0:
            covered |= set(_git(root, "diff", "--name-only", mb.strip(), rev)[1].splitlines())
    return sorted(staged - covered)


def main(argv):
    root = _git(".", "rev-parse", "--show-toplevel")[1].strip() or "."
    if "--hook" in argv:
        into = _git(root, "rev-parse", "--abbrev-ref", "HEAD")[1].strip()
        if into != PROTECTED_BRANCH:
            # UAT-418: the gate guards what enters main; `git merge main` inside a feature branch brings work main already holds
            print(f"  [visual] merge em {into or 'HEAD destacado'}, não na {PROTECTED_BRANCH}: a trava visual julga só o que entra na {PROTECTED_BRANCH}")
            return 0
        revs = [(r, r) for r in _revs_from_reflog_action()] or [(r, r) for r in _merge_heads(root)]
    elif "--check" in argv:
        rev = argv[argv.index("--check") + 1]
        revs = [(rev, rev)]
    else:
        print(__doc__)
        return 2
    base = argv[argv.index("--base") + 1] if "--base" in argv else "HEAD"
    problems, notes = [], []
    # only a merge asks for the finger (--check says what the merge will ask), and not one the human already released
    released = bool(os.environ.get(SKIP_VAR, "").strip())
    ask = ask_presence if "--hook" in argv and not released else None
    for rev, label in revs:
        p, n = judge_full(root, rev, base, ask=ask, label_of_branch=label)
        problems += p
        notes += n
    if "--hook" in argv:
        loose = unjudged_screen(root, [r for r, _l in revs], base)
        if loose:
            shown = f"{', '.join(loose[:3])}{'…' if len(loose) > 3 else ''}"
            named = os.environ.get("GIT_REFLOG_ACTION", "")
            problems.append(("unnamed", f"o merge traz tela ({shown}) que nenhuma revisão nomeada mudou (GIT_REFLOG_ACTION="
                                        f"{named!r}): a trava não sabe o que está julgando"))
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
    print("\n  merge recusado: feature de tela sem veredito visual - a reconferência independente avaliada e sem P0 (pdlc-loops § 5)"
          "\n  ou, na via rápida, o OK do MJRP na tela (pdlc-loops § 2).")
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
    if kinds & {"human_ok", "human_no"}:
        print("  via rápida: o juiz da tela é o MJRP. O merge pede o Touch ID dele (o diálogo nomeia as features, o ramo e o tip);\n"
              "  sem o dedo dele não entra. Combine com ele e faça o merge de novo - o OK não se escreve em relatório.")
    if "unnamed" in kinds:
        print("  faça o merge pelo nome do ramo (`git merge <ramo>` ou `merge_train.py merge <ramo>`), sem trocar o GIT_REFLOG_ACTION.")
    if "human_unavailable" in kinds:
        print("  o Touch ID não está disponível nesta máquina ou neste processo (sem o Control Center instalado, sem sessão gráfica,\n"
              "  sandbox): faça o merge no Mac do MJRP, onde o diálogo aparece.")
    print("  a saída é do humano, nunca do agente: VISUAL_RECHECK_SKIP=\"<motivo>\" git merge … ou git merge --no-verify.")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
