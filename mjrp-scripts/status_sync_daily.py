#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
status_sync_daily.py - the daily pass applies the derived status and proposes to the MJRP only what is his (F67 TASK-03).

The pre-commit (status_sync.py --staged) writes the derived status of what a commit TOUCHES. What no commit touched stayed as
drift (2026-10-24: 69 findings in the app's graph, and proposals from the daily pass left unapplied since 19/10). This pass closes
that: it derives the whole project, for the root and each nested project with a requirements graph, and WRITES it - the
derived status is nobody's decision, so it is never a line in anyone's list.

  python3 mjrp-scripts/status_sync.py <top> --daily        (the doctor calls the same function before its checks)

What it does, and what it does not:
  1. It writes only in the MAIN checkout, on `main`. In a linked worktree or on another branch it only measures: a derived status
     written there would put unrelated changes on the feature's branch and collide with the main's own pass.
  2. It touches nothing while a merge, rebase, cherry-pick, revert or an `index.lock` is open: the integrator owns the checkout then.
  3. A file with an uncommitted change is left alone (the person's edit is not swept in; their own commit derives it).
  4. It NEVER commits (integrator's decision, 2026-10-27: only the integrator writes to `main`, and every commit carries a log entry).
     It leaves the derived status in the files and says in the report what it wrote - how many and which nodes; the integrator, or the
     next commit (the pre-commit aligns the index), takes it.
  5. It never demotes (the derivation moves only forward, F94), never writes Accepted, never closes an issue, never writes `fixed` without the evidence uat.md demands (F221, UAT-545: and not an issue of the human track either), and a second run
     changes nothing.

Then it splits what is left in two lists:
  - the MJRP's: an issue of his track (`MJRP`, or `agente · prioridade: humano`) fixed and waiting for his OK, one by one; the `Done`
    features and requirements waiting for the human's «Aceite», as a count (the Control Center discounts what the human accepted);
  - the agent's: what the derivation cannot decide (a contradiction: `Done` with an open task, a requirement ahead of its feature,
    an issue `fixed` while its feature is open), and the issues of the agent track waiting for the independent recheck. The
    contradictions are written to the sensor ledger of each project (`daily-checks/`, owner `status_sync`), where the agent
    track and the Control Center read them.
"""
import json
import re
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402
import _git  # noqa: E402
import _pathclass  # noqa: E402
import status_sync as ss  # noqa: E402

MAIN_BRANCH = "main"
LEDGER_OWNER = "status_sync"
OPEN_OPERATIONS = ("MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply", "index.lock")
FIXED = re.compile(r"^fixed\s*\(\s*(F\d{2,})\b")      # `fixed (F77: ...)`: the feature that delivered it (a `fixed (UAT-375: ...)` has none)


# ---- which projects, and may the pass write ----------------------------------------------------------------------
def project_dirs(top, rules):
    """The top and each `apps/*` that carries a contract and a requirements graph (the same reach as the doctor's)."""
    top = Path(top)
    found = [top] + sorted(d for d in (top / "apps").glob("*") if d.is_dir())
    return [d for d in found if (d / ss.CONTRACT).is_file() and (d / rules["paths"]["requirements"]).is_dir()]


def write_gate(top):
    """(True, "") when the pass may write here, else (False, why). When git cannot say, the answer is no."""
    top = Path(top)
    try:
        if _pathclass.is_linked_worktree(top):
            return False, "worktree vinculado: a passada só mede; quem grava é a da main"
        branch = _git.out(top, "rev-parse", "--abbrev-ref", "HEAD")
        if branch != MAIN_BRANCH:
            return False, f"o ramo é {branch!r}, não {MAIN_BRANCH!r}: a passada só mede"
        for name in OPEN_OPERATIONS:
            if ss.git_path(top, name).exists():
                return False, f"{name} aberto: o checkout é do integrador agora"
    except (_git.GitError, OSError) as e:
        return False, f"o git não respondeu ({type(e).__name__}): na dúvida a passada só mede"
    return True, ""


def dirty_files(top, rels):
    """The tracked files among `rels` that carry an uncommitted change (staged or not)."""
    if not rels:
        return set()
    out = ss.git_ok(top, "status", "--porcelain", "-z", "--untracked-files=no", "--", *sorted(rels))
    dirty = set()
    for entry in out.split("\0"):
        if len(entry) > 3:
            dirty.add(entry[3:])
    return dirty


# ---- the two lists ---------------------------------------------------------------------------------------------
def _delivered(rules):
    return {s.casefold() for s in rules["derivation"]["requirement"]["delivered_feature_statuses"]}


_is_human_row = ss.is_human_row


def lists(feats, reqs, rows, rules):
    """(mjrp, agent, contradictions) for a project already derived. `mjrp` and `agent` are readable lines;
    `contradictions` are (key, text): what the derivation will not decide, for the sensor ledger.

    The MJRP's list here is what the repository alone decides: the issues of his track fixed and waiting for his OK, one by one. A
    `Done` feature or requirement is his too, but whether he already accepted it is on the Control Center's record (the `accept:`
    commits, the log), so they come as one count and the Control Center, which discounts what the human accepted, keeps the list itself."""
    mjrp, agent, contradictions = [], [], []
    open_ = {s.casefold() for s in rules["derivation"]["requirement"]["open_feature_statuses"]}
    delivered = _delivered(rules)
    done_feats = [fid for fid, ft in sorted(feats.items()) if ft["status"].casefold() == "done"]
    done_reqs = [rid for rid, rq in sorted(reqs.items()) if rq["status"].casefold() == "done"]
    if done_feats:
        mjrp.append(f"{len(done_feats)} feature(s) Done esperam o «Aceite» (o Control Center desconta as já aceitas)")
    if done_reqs:
        mjrp.append(f"{len(done_reqs)} requisito(s) Done esperam o aceite (o Control Center desconta os já aceitos)")
    rechecks, ahead = [], {}                              # issues of the agent track awaiting the recheck; Fxx -> issues fixed ahead of it
    for row in rows:
        if not row["status"].startswith("fixed"):
            continue
        if _is_human_row(row):
            if not row.get("ok"):
                mjrp.append(f"{row['id']}: fixed, espera o OK dele")
        elif not row.get("ok"):
            rechecks.append(row["id"])
        m = FIXED.match(row["status"])
        if m and m.group(1) in feats and feats[m.group(1)]["status"].casefold() not in delivered:
            ahead.setdefault(m.group(1), []).append(row["id"])
    if rechecks:
        agent.append(f"{len(rechecks)} issue(s) da trilha do agente esperam a reconferência independente")
    for fid, ft in sorted(feats.items()):
        if ft["status"].casefold() == "done" and ft["open"] > 0:
            contradictions.append((f"{fid}:done-open-box", f"{fid} está Done e o tasks.md tem {ft['open']} tarefa(s) aberta(s): "
                                   "o tasks.md está velho ou o Done está errado (a derivação não rebaixa)"))
    for rid, rq in sorted(reqs.items()):
        late = [fid for fid, ft in sorted(feats.items()) if rid in ft["imports"] and ft["status"].casefold() in open_]
        if rq["status"].casefold() in {"done", "accepted"} and late:
            contradictions.append((f"{rid}:ahead-of-feature", f"{rid} está {rq['status']} e a feature {', '.join(late)} que o "
                                   "importa segue aberta: o status está à frente da entrega (a derivação só anda para a frente)"))
    for fid, ids in sorted(ahead.items()):
        contradictions.append((f"{fid}:issues-fixed-ahead", f"{len(ids)} issue(s) estão fixed ({', '.join(ids[:4])}"
                               f"{'…' if len(ids) > 4 else ''}) e a {fid} segue {feats[fid]['status']}: a issue está à frente da feature"))
    effective = {fid: ft["status"] for fid, ft in feats.items()}
    cites = {fid: ft.get("cites", ()) for fid, ft in feats.items()}
    for row in rows:                                      # F221 (UAT-545): a `fixing` the pass will not close, and why: an agent looks
        why = ss.uat_block(row, effective, rules, cites)
        if why == "human":
            contradictions.append((f"{row['id']}:uat-waits-for-human", f"{row['id']} está `{row['status']}` e a feature já entregou, mas a "
                                   "issue é da trilha do MJRP: a passada não a fecha (só o OK dele); um agente confere a prova e a leva a fixed"))
        elif why == "no-evidence":
            contradictions.append((f"{row['id']}:uat-fixing-without-evidence", f"{row['id']} está `{row['status']}` e a feature já entregou, "
                                   "mas a célula não traz a evidência (commit e teste, ou os passos refeitos): a passada não escreve fixed sem ela; "
                                   "quem conserta a escreve"))
    refused = []                                          # F169: a story the graph gate would refuse, and the derivation does not write
    ss.derive(feats, reqs, rows, rules, refused=refused)
    for rid, want, threshold in refused:
        contradictions.append((f"{rid}:derivation-blocked-by-points_to",
                               f"{rid} deveria estar «{want}» pelas features que o importam, mas não tem `points_to` e a trava do grafo "
                               f"cobra a partir de «{threshold}»: falta apontar o estado observável (mjrp-writing-reqs); o status_sync não gravou"))
    agent += [text for _k, text in contradictions]
    return mjrp, agent, contradictions


# ---- the pass --------------------------------------------------------------------------------------------------
def _restore(originals):
    for path, text in originals.items():
        path.write_text(text, encoding="utf-8")


def run(top, rules=None):
    """The whole pass over `top`. Returns a dict: mode ('write' | 'measure'), why (when measuring), applied (labels), nodes (the ids
    written), skipped (dirty files left alone), error (what stopped it), pending (how many wait for the main, when measuring), and per
    project the lists. It never commits."""
    top = Path(top).resolve()
    rules = rules or json.loads(ss.RULES.read_text(encoding="utf-8"))
    res = {"mode": "measure", "why": "", "applied": [], "nodes": [], "skipped": [], "error": "", "projects": {}}
    projects = project_dirs(top, rules)
    pending = {proj: ss.derive(*ss.load(proj, rules), rules) for proj in projects}
    ok, why = write_gate(top)
    res["why"] = why
    res["mode"] = "write" if ok else "measure"
    todo = {p: c for p, c in pending.items() if c}
    if not todo:
        return _finish(top, res, projects, rules)
    if not ok:
        res["pending"] = sum(len(c) for c in todo.values())
        return _finish(top, res, projects, rules)
    rel_of = lambda proj, c: (proj / c[0]).relative_to(top).as_posix()                           # noqa: E731
    dirty = dirty_files(top, {rel_of(p, c) for p, cs in todo.items() for c in cs})
    originals = {}
    for proj, cs in todo.items():
        for c in cs:
            rel = rel_of(proj, c)
            if rel in dirty:
                if rel not in res["skipped"]:
                    res["skipped"].append(rel)
                continue
            path = proj / c[0]
            originals.setdefault(path, ss.read(path) or "")
            new = ss.edit(ss.read(path) or "", *c[1:])
            if new is None:
                _restore(originals)                       # all or nothing: a half-derived tree is the drift this pass ends
                res.update(error=f"{rel}: não achei o status {c[3]!r} de {c[2]} para trocar", applied=[], nodes=[])
                return _finish(top, res, projects, rules)
            path.write_text(new, encoding="utf-8")
            res["applied"].append(ss.label((rel,) + c[1:]))
            res["nodes"].append(c[2])
    return _finish(top, res, projects, rules)


def _finish(top, res, projects, rules):
    for proj in projects:
        feats, reqs, rows = ss.load(proj, rules)
        mjrp, agent, contradictions = lists(feats, reqs, rows, rules)
        res["projects"][proj.relative_to(top).as_posix() or "."] = {"mjrp": mjrp, "agent": agent, "contradictions": contradictions}
    return res


def write_ledgers(top, res, when, run_at=None):
    """The contradictions of each project to the sensor ledger of that project (owner `status_sync`). Written only when there is
    something or the project already keeps a trace, so a project with nothing to say gets no empty section."""
    import daily_checks
    for rel, data in res["projects"].items():
        proj = Path(top) / rel if rel != "." else Path(top)
        items = [(f"status_sync:{key}", f"[status_sync] {text}", {"check_id": "status_sync", "severity": "warning",
                                                                  "file": "", "rule": "status_sync#contradiction"})
                 for key, text in data["contradictions"]]
        if items or daily_checks.has_trace(proj, LEDGER_OWNER, "sensor-warnings.md"):
            daily_checks.report(proj, LEDGER_OWNER, "sensor-warnings.md", "status_sync.py (contradições do status derivado)",
                                items, when, run_at=run_at)


def report_lines(res):
    """The text the pass prints: what it did, then the two lists apart."""
    out = []
    if res["error"]:
        out.append(f"NÃO FEZ — {res['error']}")
    elif res["mode"] == "measure":
        out.append(f"só mediu — {res['why'] or 'nada a gravar'}" + (f" ({res['pending']} status derivado(s) esperando a main)" if res.get("pending") else ""))
    elif not res["applied"]:
        out.append("nada a gravar — o derivado já está na fonte")
    else:
        out.append(f"gravou {len(res['applied'])} status derivado(s) — {', '.join(res['nodes'])} — sem commitar: o integrador ou o próximo commit os leva")
        out += [f"  {a}" for a in res["applied"]]
    out += [f"deixou como estava (edição sem commit): {p}" for p in res["skipped"]]
    for rel, data in res["projects"].items():
        for title, key in (("para o MJRP", "mjrp"), ("para a trilha do agente", "agent")):
            if data[key]:
                out.append(f"{title} ({rel}): {len(data[key])}")
                out += [f"  {line}" for line in data[key]]
    return out


def doctor_pass(root, rep, when, run_at=None):
    """The doctor's hook: runs the pass, notes what it did and writes the ledgers. Not a check of the registry: it adds no finding
    of its own except 'não avaliável' when the pass itself could not run (the same way the trace does)."""
    res = run(root)
    summary = report_lines(res)
    rep.note("DERIVE", summary[0] if summary else "sem projetos com grafo de requisitos")
    if res["error"]:
        rep.unevaluable("DERIVE", f"a passada do status derivado não gravou: {res['error']}",
                        "2026-10-27 (F67 TASK-03): o derivado fora da fonte virou 69 achados em 24/10 e ninguém o aplicava")
    write_ledgers(root, res, when, run_at)
    return res
