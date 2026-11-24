#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
status_sync.py - each status has ONE source; what derives from it is written in the same commit (F67, S-168).

The rules live in requirements_graph_rules.json -> `derivation` (one place). In short: a feature's status comes from its
tasks.md; a requirement's from the features that import it; a UAT issue in `fixing (Fxx)` becomes `fixed (Fxx)` when Fxx
is delivered AND its folder cites the issue (UAT-429: a feature already Done does not fix the issue opened after it).
The derivation only moves forward: it never demotes a delivered status, never writes Accepted and never
closes an issue. Epic and release statuses are computed by whoever shows them, never stored.

  python3 mjrp-scripts/status_sync.py [root] --check            the drift of the whole project: exit 1 with the list, 0 none, 2 not evaluable
  python3 mjrp-scripts/status_sync.py [root] --apply            writes every derived status of the project to the working tree
  python3 mjrp-scripts/status_sync.py <top> --daily            the daily pass (status_sync_daily.py): writes the derivation of the root and the nested
                                                                projects in the main checkout (never commits), lists what is the MJRP's and the agent's
  python3 mjrp-scripts/status_sync.py <top> --staged            pre-commit: for each project the staged work touches, derives from the
                                                                INDEX what the commit touches and writes it to the index AND the working tree
  python3 mjrp-scripts/status_sync.py <top> --touched-projects  the projects (relative to the top, `.` for it) the staged work touches
  python3 mjrp-scripts/status_sync.py <top> --post-commit       post-commit: after a `git commit -- <paths>`, aligns the real index
                                                                with HEAD for the files the pre-commit wrote

Why the index and not the disk (--staged): the commit carries the index. Reading the disk would derive from an edit that is
not in the commit, and writing the disk and `git add`-ing it would sweep someone's unstaged edit into the commit.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402
import _git  # noqa: E402
from _fm import parse_with_body as frontmatter  # noqa: E402
from requirements_graph_check import link_targets, node_id  # noqa: E402

HERE = Path(__file__).resolve().parent
RULES = HERE / "requirements_graph_rules.json"
CONTRACT = ".mjrp-project.yml"
WRITTEN = "status_sync-written"          # under the git dir: the files the pre-commit wrote, for the post-commit
OPEN_BOX = re.compile(r"^\s*[-*]\s+\[ \]")
TICKED_BOX = re.compile(r"^\s*[-*]\s+\[[xX]\]")
STATUS_LINE = re.compile(r"^(status:[ \t]*)(.*?)([ \t]*)$", re.M)
UAT_ROW = re.compile(r"^\|\s*(UAT-\d+)\s*\|")
CELL_SPLIT = re.compile(r"(?<!\\)\|")
FIXING = re.compile(r"^fixing(\s*\(\s*(F\d{2,})\b)")
UAT_ID = re.compile(r"\bUAT-\d+\b")


class NotEvaluable(Exception):
    """The derivation could not read what it needs: never an empty answer."""


# ---- reading a project -----------------------------------------------------------------------------------------
def read(path):
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def boxes(tasks_text):
    """(ticked, open) boxes of a tasks.md, outside code fences (the graph's Done rule counts the same boxes)."""
    ticked = opened = 0
    fenced = False
    for line in (tasks_text or "").splitlines():
        if line.lstrip().startswith("```"):
            fenced = not fenced
            continue
        if fenced:
            continue
        if OPEN_BOX.match(line):
            opened += 1
        elif TICKED_BOX.match(line):
            ticked += 1
    return ticked, opened


def load(project, rules):
    """The features, the requirement nodes and the UAT rows of a project folder (a working tree or an index export)."""
    paths = rules["paths"]
    feats, reqs, rows = {}, {}, []
    fdir = project / paths["features"]
    if fdir.is_dir():
        for d in sorted(x for x in fdir.iterdir() if x.is_dir() and re.match(r"^F\d{2,}-", x.name)):
            spec = read(d / "spec.md")
            if spec is None:
                continue
            fm, _ = frontmatter(spec)
            ticked, opened = boxes(read(d / "tasks.md"))
            # the issues the feature's own record cites (its `fixes:`, its tasks, its text): the fixer writes the issue into the folder
            cites = {m for name in ("spec.md", "plan.md", "tasks.md") for m in UAT_ID.findall(read(d / name) or "")}
            feats[d.name[:d.name.index("-")]] = {
                "dir": d.name, "rel": f"{paths['features']}/{d.name}/spec.md",
                "status": str(fm.get("status") or "").strip(), "lane": str(fm.get("lane") or "standard").strip().casefold(),
                "imports": [t[1] for t in link_targets(fm.get("imports"))], "ticked": ticked, "open": opened, "cites": cites}
    rdir = project / paths["requirements"]
    if rdir.is_dir():
        for f in sorted(rdir.rglob("*.md")):
            fm, _ = frontmatter(read(f) or "")
            nid = str(fm.get("id") or node_id(f.stem)).strip()
            if fm.get("type") == "requirement" and nid:
                reqs[nid] = {"rel": f.relative_to(project).as_posix(), "status": str(fm.get("status") or "").strip(),
                             "points_to": bool(link_targets(fm.get("points_to")))}
    uat = read(project / paths["uat"])
    if uat:
        col = by_col = ok_col = None
        for line in uat.splitlines():
            cells = [c.strip() for c in CELL_SPLIT.split(line)]
            if line.startswith("|") and len(cells) > 2 and cells[1] == "ID":
                col = next((i for i, c in enumerate(cells) if c == "Status"), None)
                by_col = next((i for i, c in enumerate(cells) if c == "Reportado por"), None)
                ok_col = next((i for i, c in enumerate(cells) if c == "OK do humano"), None)
                continue
            m = UAT_ROW.match(line)
            if m and col is not None and col < len(cells):
                # `by` and `ok` only feed the daily pass's lists (who the issue waits for); the derivation reads `status`
                rows.append({"id": m.group(1), "col": col, "status": cells[col],
                             "by": cells[by_col] if by_col is not None and by_col < len(cells) else "",
                             "ok": cells[ok_col] if ok_col is not None and ok_col < len(cells) else ""})
    return feats, reqs, rows


# ---- the derivation (pure) -------------------------------------------------------------------------------------
def rank(status, rules):
    order = [s.casefold() for s in rules["statuses"]]
    s = (status or "").casefold()
    return order.index(s) if s in order else -1


def feature_target(ft, rules):
    d = rules["derivation"]["feature"]
    st = ft["status"]
    if st.casefold() in {s.casefold() for s in d["never_touch"]} or ft["ticked"] + ft["open"] == 0:
        return None
    if ft["open"] == 0:
        want = d["all_ticked"]
    elif ft["ticked"] > 0:
        want = d["some_ticked"]
    else:
        return None
    # the derivation only moves forward (F67; F94, UAT-374): a `Done` feature whose tasks.md still has an open box is a FINDING for
    # the graph sensor (`done_feature_complete`: the tasks.md is stale or the Done is wrong), never a rewrite back to In Progress
    if st.casefold() == d["all_ticked"].casefold() and want.casefold() != st.casefold():
        return None
    return want if want.casefold() != st.casefold() else None


def points_to_threshold(rules, fast_only):
    """The status from which the graph gate refuses a requirement with no `points_to` edge (None: the rules declare no such edge)."""
    edge = next((e for e in rules.get("edges", []) if e.get("name") == "points_to"), None)
    if edge is None:
        return None
    if fast_only and edge.get("enforced_from_fast_lane"):
        return edge["enforced_from_fast_lane"]
    return edge.get("enforced_from")


def requirement_target(req, importers, rules, fast_only=False, refused=None):
    """`importers`: the effective statuses of the features that import the requirement.
    `fast_only`: every feature that imports it is on the fast lane (the graph gate then enforces `points_to` later).
    `refused`: a list that receives {rel, want, from} when the derivation would write a status the graph gate refuses for a
    requirement with no `points_to` edge (F169: the deadlock of a project with no info-arch.md). Such a status is not written."""
    d = rules["derivation"]["requirement"]
    st = req["status"]
    if not importers or st.casefold() in {s.casefold() for s in d["never_touch"]}:
        return None
    open_ = {s.casefold() for s in d["open_feature_statuses"]}
    delivered = {s.casefold() for s in d["delivered_feature_statuses"]}
    sts = [s.casefold() for s in importers]
    if any(s in open_ for s in sts):
        want = d["any_feature_open"]
    elif all(s in delivered for s in sts):
        want = d["all_features_delivered"]
    else:
        return None
    if rank(want, rules) <= rank(st, rules):
        return None
    threshold = points_to_threshold(rules, fast_only)
    if threshold and not req.get("points_to", True) and rank(want, rules) >= rank(threshold, rules):
        if refused is not None:
            refused.append({"rel": req["rel"], "want": want, "from": threshold})
        return None
    return want


HUMAN_TRACK_MARK = "prioridade: humano"
COMMIT_HASH = re.compile(r"\b[0-9a-f]{7,40}\b")
EVIDENCE_WORDS = re.compile(r"\b(teste|test|testes|passos)\b", re.I)


def is_human_row(row):
    """An issue of the human track: opened by the MJRP, or raised to him (`agente · prioridade: humano`). Only his OK closes it."""
    by = row.get("by", "")
    return by == "MJRP" or HUMAN_TRACK_MARK in by


def has_evidence(status):
    """`fixing (Fxx: <evidence>)` carries what uat.md demands for `fixed`: a colon, then a commit hash and the test, or the steps re-run.
    A bare `fixing (Fxx)` carries none: the derivation cannot invent it (UAT-545)."""
    _head, colon, rest = status.partition(":")
    return bool(colon) and bool(COMMIT_HASH.search(rest)) and bool(EVIDENCE_WORDS.search(rest))


def uat_block(row, feature_status, rules, cites=None):
    """Why a `fixing (Fxx)` whose feature is delivered and cites it is NOT derived to `fixed`: 'human' (it waits for the MJRP: the
    derivation never closes what is his) or 'no-evidence' (the Status cell holds no commit and test, or re-run steps). None when
    nothing stops it or the row is not in that spot. UAT-545: the daily pass turned a P1 that asked the MJRP a question into `fixed`."""
    m = FIXING.match(row["status"])
    if not m or m.group(2) not in feature_status or row["id"] not in (cites or {}).get(m.group(2), ()):
        return None
    if feature_status[m.group(2)].casefold() not in {s.casefold() for s in rules["derivation"]["uat_issue"]["fixing_to_fixed_when"]}:
        return None
    if is_human_row(row):
        return "human"
    return None if has_evidence(row["status"]) else "no-evidence"


def uat_target(row, feature_status, rules, cites=None):
    """`fixing (Fxx: <evidence>)` -> `fixed (Fxx: <evidence>)` when Fxx is delivered AND its folder cites the issue (`cites`: {Fxx: {UAT ids}}).
    UAT-429: a feature that was already Done when the issue was opened used to close it in the commit that opened it; the
    issue is fixed by a conserto that names it, never by the feature's status alone.
    UAT-545: and never without the evidence uat.md demands, and never an issue of the human track (`uat_block` says which)."""
    m = FIXING.match(row["status"])
    if not m or m.group(2) not in feature_status:
        return None
    if row["id"] not in (cites or {}).get(m.group(2), ()):
        return None
    if feature_status[m.group(2)].casefold() in {s.casefold() for s in rules["derivation"]["uat_issue"]["fixing_to_fixed_when"]}:
        if uat_block(row, feature_status, rules, cites):
            return None
        return "fixed" + row["status"][len("fixing"):]
    return None


def derive(feats, reqs, rows, rules, scope=None, refused=None):
    """The changes [(rel, kind, key, old, new)], kind `status` (frontmatter) or `uat` (the row `key`).
    `scope` None: the whole project. Otherwise {"features": {Fxx}, "requirements": {ids}, "uat": bool}: only what the commit touches.
    `refused`: a list that receives (rid, want, threshold) for each requirement whose derived status the graph gate would refuse."""
    changes = []
    write_feats = set(feats) if scope is None else scope["features"] & set(feats)
    effective = {}
    for fid, ft in feats.items():
        want = feature_target(ft, rules) if fid in write_feats else None
        effective[fid] = want or ft["status"]
        if want:
            changes.append((ft["rel"], "status", fid, ft["status"], want))
    importers = {}
    for fid, ft in feats.items():
        for rid in ft["imports"]:
            importers.setdefault(rid, []).append(effective[fid])
    if scope is None:
        write_reqs = set(reqs)
    else:
        write_reqs = set(scope["requirements"]) | {r for f in write_feats for r in feats[f]["imports"]}
    for rid in sorted(write_reqs & set(reqs)):
        lanes = {feats[f]["lane"] for f in feats if rid in feats[f]["imports"]}
        blocked = []
        want = requirement_target(reqs[rid], importers.get(rid, []), rules, fast_only=lanes == {"fast"}, refused=blocked)
        if want:
            changes.append((reqs[rid]["rel"], "status", rid, reqs[rid]["status"], want))
        if blocked and refused is not None:
            refused.append((rid, blocked[0]["want"], blocked[0]["from"]))
    uat_rel = rules["paths"]["uat"]
    cites = {fid: ft.get("cites", ()) for fid, ft in feats.items()}
    for row in rows:
        m = FIXING.match(row["status"])
        if scope is not None and not scope["uat"] and not (m and m.group(2) in write_feats):
            continue
        want = uat_target(row, effective, rules, cites)
        if want:
            changes.append((uat_rel, "uat", row["id"], row["status"], want))
    return changes


# ---- editing a text (the same edit for the index blob and the working tree) -------------------------------------
def edit(text, kind, key, old, new):
    """The text with the change applied, or None when the text does not hold `old` where the change expects it."""
    if kind == "status":
        m = re.match(r"\A﻿?---[ \t]*\r?\n(.*?)\r?\n---", text, re.S)
        if not m:
            return None
        block = m.group(1)
        s = STATUS_LINE.search(block)
        if not s or s.group(2).strip().strip("\"'") != old:
            return None
        start = m.start(1) + s.start(2)
        return text[:start] + new + text[m.start(1) + s.end(2):]
    out, hit = [], False
    for line in text.splitlines(keepends=True):
        m = UAT_ROW.match(line)
        if m and m.group(1) == key and not hit:
            parts = CELL_SPLIT.split(line)
            for i, cell in enumerate(parts):
                if i > 1 and cell.strip() == old:
                    parts[i] = cell.replace(old, new, 1)
                    line, hit = "|".join(parts), True
                    break
        out.append(line)
    return "".join(out) if hit else None


def label(change):
    rel, kind, key, old, new = change
    return f"{key}: {old or '(vazio)'} → {new}  ({rel})"


# ---- projects --------------------------------------------------------------------------------------------------
def git_ok(top, *args, **kw):
    r = _git.run(top, *args, **kw)
    if r.code != 0:
        raise NotEvaluable(f"git {' '.join(args)} saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    return r.out


def staged_paths(top):
    return [p for p in git_ok(top, "diff", "--cached", "--name-only", "-z").split("\0") if p]


FIXTURE_DIR = "tests"


def project_of(top, rel):
    """The nearest folder holding a contract, from the path up to the top (`.` for the top), or None.

    A contract under a `tests/` folder belongs to a test sample (a kernel sample copies a whole child project), not to a
    project: the sample's synthetic nodes would be judged as real ones and refuse the commit that adds it (F148). Its files
    count for the project that owns the `tests/` folder."""
    p = Path(rel).parent
    while True:
        if FIXTURE_DIR not in p.parts and (top / p / CONTRACT).is_file():
            return p.as_posix()
        if p == Path("."):
            return None
        p = p.parent


def touched_projects(top, rules, paths=None):
    """{project rel: [paths relative to the project]} - only projects that carry a requirements graph."""
    out = {}
    for rel in staged_paths(top) if paths is None else paths:
        proj = project_of(top, rel)
        if proj is None or not (top / proj / rules["paths"]["requirements"]).is_dir():
            continue
        inner = rel if proj == "." else rel[len(proj) + 1:]
        out.setdefault(proj, []).append(inner)
    return out


def scope_of(inner_paths, rules):
    feat = rules["paths"]["features"].rstrip("/") + "/"
    req = rules["paths"]["requirements"].rstrip("/") + "/"
    sc = {"features": set(), "requirements": set(), "uat": False}
    for p in inner_paths:
        if p.startswith(feat):
            folder = p[len(feat):].split("/")[0]
            if re.match(r"^F\d{2,}-", folder):
                sc["features"].add(folder[:folder.index("-")])
        elif p.startswith(req) and p.endswith(".md"):
            sc["requirements"].add(node_id(Path(p).stem))
        elif p == rules["paths"]["uat"]:
            sc["uat"] = True
    return sc


# ---- the modes -------------------------------------------------------------------------------------------------
def report_refused(refused):
    for rid, want, threshold in refused:
        print(f"[status_sync] não gravei — {rid}: o status derivado «{want}» exige `points_to` (a trava do grafo cobra a partir de "
              f"«{threshold}»); a story não aponta para nenhum estado observável")


def whole(root, rules, apply):
    feats, reqs, rows = load(root, rules)
    refused = []
    changes = derive(feats, reqs, rows, rules, refused=refused)
    report_refused(refused)
    if not apply:
        if not changes:
            print(f"[status_sync] VERDE — nenhum status derivado fora da fonte ({len(feats)} feature(s), {len(reqs)} requisito(s))")
            return 0
        print(f"[status_sync] {len(changes)} status derivado(s) fora da fonte (rode --apply, ou commite o nó: o pre-commit grava):")
        for c in changes:
            print(f"  {label(c)}")
        return 1
    for c in changes:
        path = root / c[0]
        new = edit(read(path) or "", *c[1:])
        if new is None:
            raise NotEvaluable(f"{c[0]}: não achei o status {c[3]!r} de {c[2]} para trocar")
        path.write_text(new, encoding="utf-8")
        print(f"[status_sync] gravado — {label(c)}")
    if not changes:
        print("[status_sync] nada a gravar")
    return 0


def export_index(top, proj, rules, dest):
    """The project's specs as the commit will carry them (the index), under `dest`."""
    roots = [rules["paths"]["features"], rules["paths"]["requirements"], rules["paths"]["uat"]]
    pre = "" if proj == "." else proj + "/"
    listed = git_ok(top, "ls-files", "-z", "--cached", "--", *[pre + r for r in roots])
    files = [p for p in listed.split("\0") if p]
    if files:
        git_ok(top, "checkout-index", f"--prefix={dest}/", "--", *files)
    return dest / proj


def write_index(top, rel, content):
    """Puts `content` as the index entry of `rel` (keeping its mode), without touching the working tree."""
    entry = git_ok(top, "ls-files", "-s", "--", rel).split()
    if not entry:
        raise NotEvaluable(f"{rel}: não está no índice")
    sha = _git.run(top, "hash-object", "-w", "--stdin", f"--path={rel}", input=content)
    if sha.code != 0:
        raise NotEvaluable(f"git hash-object {rel}: {sha.err.strip()[:200]}")
    git_ok(top, "update-index", "--cacheinfo", f"{entry[0]},{sha.out.strip()},{rel}")


def staged(top, rules):
    written = []
    with tempfile.TemporaryDirectory(prefix="cc-status-sync-") as tmp:
        for proj, inner in sorted(touched_projects(top, rules).items()):
            sc = scope_of(inner, rules)
            if not (sc["features"] or sc["requirements"] or sc["uat"]):
                continue
            base = export_index(top, proj, rules, Path(tmp) / "idx")
            refused = []
            changes = derive(*load(base, rules), rules, scope=sc, refused=refused)
            report_refused(refused)
            by_file = {}
            for c in changes:
                by_file.setdefault(c[0], []).append(c)
            for inner_rel, cs in by_file.items():
                rel = inner_rel if proj == "." else f"{proj}/{inner_rel}"
                idx = read(base / inner_rel)
                disk_path = top / rel
                disk = read(disk_path)
                for c in cs:
                    new_idx = edit(idx or "", *c[1:])
                    if new_idx is None:
                        raise NotEvaluable(f"{rel}: não achei o status {c[3]!r} de {c[2]} no índice")
                    idx = new_idx
                    # the working tree takes the same edit only where it still holds the old status: an unstaged edit
                    # of the status line is the person's, never overwritten
                    new_disk = edit(disk, *c[1:]) if disk is not None else None
                    if new_disk is not None:
                        disk = new_disk
                    else:
                        print(f"[status_sync] aviso — {rel}: a cópia de trabalho tem outro status para {c[2]}; só o commit recebe {c[4]}")
                    print(f"[status_sync] derivado no commit — {label((rel,) + c[1:])}")
                write_index(top, rel, idx)
                if disk is not None:
                    disk_path.write_text(disk, encoding="utf-8")
                written.append(rel)
    remember(top, written)
    return 0


def git_path(top, name, env=None):
    p = Path(git_ok(top, "rev-parse", "--git-path", name, env=env).strip())
    return p if p.is_absolute() else top / p


def remember(top, written):
    """A `git commit -- <paths>` commits a temporary index: the real one keeps the old blobs of the files written here,
    and `git status` would show the derived line as a change to undo. The post-commit aligns them; it needs the list."""
    target = git_path(top, WRITTEN)
    index = os.environ.get("GIT_INDEX_FILE", "")
    if not written or not Path(index).name.startswith("next-index"):
        if target.exists():
            target.unlink()                       # the owner removes its own stale state
        return
    head = _git.run(top, "rev-parse", "-q", "--verify", "HEAD").out.strip()
    tmp = target.with_name(target.name + ".tmp")
    tmp.write_text(json.dumps({"parent": head, "files": written}), encoding="utf-8")
    os.replace(tmp, target)


def real_index_git(top, *args):
    """git on the REAL index: the post-commit may inherit the GIT_INDEX_FILE of the temporary one."""
    env = {k: v for k, v in os.environ.items() if k != "GIT_INDEX_FILE"}
    p = subprocess.run(["git", *args], cwd=top, env=env, capture_output=True, text=True, timeout=_git.TIMEOUT)
    return p.stdout.strip() if p.returncode == 0 else ""


def post_commit(top):
    target = git_path(top, WRITTEN)
    if not target.exists():
        return 0
    try:
        data = json.loads(target.read_text(encoding="utf-8"))
    finally:
        target.unlink()                           # the owner removes its own state, read or not
    if real_index_git(top, "rev-parse", "-q", "--verify", "HEAD^") != data.get("parent"):
        return 0                                  # a list left by an aborted commit: not this commit's
    for rel in data.get("files", []):
        entry = real_index_git(top, "ls-files", "-s", "--", rel).split()
        before = real_index_git(top, "rev-parse", "-q", "--verify", f"HEAD^:{rel}")
        after = real_index_git(top, "rev-parse", "-q", "--verify", f"HEAD:{rel}")
        if not entry or not after or entry[1] != before:
            # the real index holds another prepared change of this file: it is the person's, never replaced
            print(f"[status_sync] aviso — {rel}: o índice tem outra mudança preparada; não alinhei com o commit")
            continue
        real_index_git(top, "update-index", "--cacheinfo", f"{entry[0]},{after},{rel}")
    return 0


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    root = Path(args[0] if args else ".").resolve()
    try:
        rules = json.loads(RULES.read_text(encoding="utf-8"))
        if "derivation" not in rules:
            raise NotEvaluable(f"{RULES.name} não declara `derivation`")
        if "--post-commit" in argv:
            return post_commit(root)
        if "--touched-projects" in argv:
            for proj in sorted(touched_projects(root, rules)):
                print(proj)
            return 0
        if "--daily" in argv:
            import status_sync_daily as daily          # imported here: it imports this module
            res = daily.run(root, rules=rules)
            for line in daily.report_lines(res):
                print(f"[status_sync] {line}")
            return 2 if res["error"] else 0
        if "--staged" in argv:
            return staged(root, rules)
        if not (root / rules["paths"]["requirements"]).is_dir():
            print("[status_sync] sem docs/specs/requirements/ — projeto sem grafo de requisitos (não avaliável)")
            return 2
        return whole(root, rules, apply="--apply" in argv)
    except (NotEvaluable, _git.GitError, OSError, ValueError) as e:
        print(f"[status_sync] NÃO AVALIÁVEL — {e}")
        return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
