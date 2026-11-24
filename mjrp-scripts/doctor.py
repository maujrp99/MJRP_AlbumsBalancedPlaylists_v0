#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
doctor.py - the computational sensor of the harness.

Runs on any MJRP instance and returns an exit code. The criterion - which checks exist, why
each one exists, and what counts as error vs warning - lives in
docs/decisions/0002-doctor-verification-criteria.md (ADR-0002). This file is the
implementation; the ADR is the authority. On failure, every check names the incident that
created it: whoever reads the red understands why it is red.

  exit 0  green (warnings allowed)
  exit 1  at least one error
  exit 2  not evaluable, whole or in part (no contract, path missing, or a check that should have run and did not) - neither
          green nor red; the report says which. An error elsewhere is still exit 1.

Usage:
  python3 mjrp-scripts/doctor.py [path]           evaluates the instance (runs the sensors)
  python3 mjrp-scripts/doctor.py --skip-sensors   uses the last recorded result
  python3 mjrp-scripts/doctor.py --json           machine-readable output
"""
import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Callable, NamedTuple

import _clock
from _context import Context
from _contract import CONTRACT, UnreadableYaml, read_yaml_strict
from _doctor_budgets import w18_budgets
from _doctor_contract import f2_gates, i1_contract
from _doctor_docs import (i2_paths, i3_links, i4_agents, i5_principles_inheritance, w6_charter_not_migrated,
                          w17_folder_index, w19_scripts_catalog, w20_sdd_shape, w21_screen_answers,
                          w22_returned, w23_pile_up)
from _doctor_kernel import (i5_admin_kit, i5_constitution_generated, i5_kernel, i6_conformance, w7_kernel_downstream,
                            w16_portfolio_conformance)
from _doctor_memory import f1_log_shape, f1_memory, f1_wow_growth
from _doctor_repo import (f3_git, w4_uncommitted_edits, w9_structure, w10_sessions, w11_prototype_inventory,
                          w12_retired_names, w13_daily_backup, w14_prototype_sync, w15_fix_branch_status, w18_free_disk)
from _doctor_sensors import a1_sensors, a2_visual_sensor
from _doctor_skills import c1_conformance, w1_descriptions, w5_boundary_skills, w8_cowork_marker
from _report import AVISO, ERRO, NAO_AVALIAVEL, Report
from _skills import INSTALLED_DIRS, find_skills


def _finding_identity(cid, msg):
    """cid sozinho nao basta -- o mesmo cid pode carregar mais de um achado distinto na MESMA
    rodada (ex.: dois avisos F1 diferentes juntos), e usar a mensagem inteira faz a identidade
    tremer a toa (contagem de arquivo, timestamp de push mudam sem o achado ter sido corrigido --
    foi exatamente o bug que duplicou linha em `daily-checks/` na primeira versao disto, 16/09).
    Meio-termo: cid + a mensagem com todo digito apagado, que preserva achados diferentes
    distintos e absorve so' o que varia de rodada pra rodada."""
    normalizado = re.sub(r"\d+", "#", msg)
    return f"{cid}:{normalizado}"


def write_trace(root, cfg, rep):
    """The doctor's trace for the Control Center (BACKLOG #60, F73 TASK-17): every finding of the pass goes to `daily-checks/` (the
    ledgers) and `.mjrp/` (the state the Control Center reads), in THREE streams - errors, warnings and, since F73, "não avaliável".

    It is NOT a check of the registry (round-three audit #4, IV-01): it runs after the loop of checks, on the whole report, so a check
    added to the registry later reaches the Control Center without anyone having to keep this one last, and a crash of the trace is
    reported under its own id (`run` calls it) instead of looking like a defect of the memory check F1.

    The "segue aberto" of a check that could not be judged is by `check_id`, not by item: a W1 that could not read ONE skill keeps open
    the W1 findings of the other skills that had already been resolved. That noise is on the safe side - an unjudged check never closes
    what it cannot see - and the next pass that judges W1 closes them all."""
    import daily_checks
    when = _clock.contract_today(cfg).isoformat()
    def item(cid, lvl, msg, f):
        # the extra fields travel in .mjrp/<owner>__<ledger>_state.json, which the Control
        # Center reads (sensor_state); the markdown ledger stays as it was. The state format has two
        # levels (error, warning): the third one, "não avaliável", is the STREAM it is written to
        # (sensor-unevaluable.md), so a reader that predates it never sees an unknown severity (F73 TASK-17,
        # DP-25 Expand and Contract: the new level is a new optional file, the two old ones keep their shape).
        meta = {"check_id": cid, "severity": "error" if lvl == ERRO else "warning",
                "file": f, "rule": f"doctor#{cid}"}
        text = f"[{cid}] não avaliável: {msg}" if lvl == NAO_AVALIAVEL else f"[{cid}] {msg}"
        return (_finding_identity(cid, msg), text, meta)
    avisos = [item(cid, lvl, msg, f) for cid, lvl, msg, _inc, f in rep.findings if lvl == AVISO]
    erros = [item(cid, lvl, msg, f) for cid, lvl, msg, _inc, f in rep.findings if lvl == ERRO]
    nao_avaliaveis = [item(cid, lvl, msg, f) for cid, lvl, msg, _inc, f in rep.findings if lvl == NAO_AVALIAVEL]
    run_at = _clock.contract_iso(cfg)
    # a check that could not be judged says nothing about what it had found before: that finding stays open (it is not "resolved"
    # by the check that crashed) until a pass that CAN judge it closes it
    not_judged = {cid for cid, lvl, _m, _i, _f in rep.findings if lvl == NAO_AVALIAVEL}

    def kept(filename, current):
        have = {i for i, _t, _m in current}
        old = daily_checks.load_state(root, "doctor", filename)["open"]
        extra = [(i, v["text"], {k: v[k] for k in ("check_id", "severity", "file", "rule") if k in v})
                 for i, v in old.items() if v.get("check_id") in not_judged and i not in have]
        return current + extra
    avisos, erros = kept("sensor-warnings.md", avisos), kept("sensor-errors.md", erros)
    daily_checks.report(root, "doctor", "sensor-warnings.md", "doctor.py (avisos correntes)", avisos, when, run_at=run_at)
    daily_checks.report(root, "doctor", "sensor-errors.md", "doctor.py (erros correntes)", erros, when, run_at=run_at)
    # the third stream exists only once a pass could not judge something; after that it is rewritten every pass, to close:
    # as long as the state OR the versioned ledger exists (a checkout without .mjrp/ has only the ledger)
    if nao_avaliaveis or daily_checks.has_trace(root, "doctor", "sensor-unevaluable.md"):
        daily_checks.report(root, "doctor", "sensor-unevaluable.md", "doctor.py (não avaliável na última passada)",
                            nao_avaliaveis, when, run_at=run_at)


def derive_status(root, cfg, rep):
    """The daily pass of the derived status (F67 TASK-03): writes, in the main checkout, the status that derives from another one
    (it never commits: the report says what it wrote), and splits what is left into the MJRP's list and the agent's. It is the doctor's pass, not a check: it runs
    before the registry and never fails the run - a pass that could not run is 'não avaliável' under its own id, like the trace.
    The module is optional and loaded by name (a child project vendors the doctor and not `status_sync_daily.py`)."""
    import importlib
    try:
        daily = importlib.import_module("status_sync_daily")
    except ImportError:
        return
    try:
        daily.doctor_pass(root, rep, _clock.contract_today(cfg).isoformat(), run_at=_clock.contract_iso(cfg))
    except Exception as e:                          # noqa: BLE001 - the pass never ends the run
        reason = (str(e).strip().splitlines() or [""])[0][:160]
        rep.unevaluable("DERIVE", f"a passada do status derivado não rodou ({type(e).__name__}: {reason})", CRASH_INCIDENT)


class Check(NamedTuple):
    """One entry of the doctor's registry (F73 R6). `id` is the id the report prints for a crash of this check; `fn` is the
    check; `needs` names, in the order of `fn`'s positional parameters, which parts of the run's context it takes
    (root, cfg, rep, skill_files, skip_sensors, ctx); `severity` is the worst a finding of this check can be (ERRO or AVISO)."""
    id: str
    fn: Callable
    needs: tuple
    severity: str


# The order is the order of the report. A check that raises does not take the doctor down: `run_checks` turns the
# exception into a "não avaliável" finding with the id of the check and goes on (audit 2026-10-25, R6: one check that
# raised used to end the whole run with a traceback and no word about which).
CHECKS = [
    Check("C1", c1_conformance, ("root", "cfg", "rep",), ERRO),
    Check("I1", i1_contract, ("cfg", "rep",), ERRO),
    Check("I2", i2_paths, ("root", "cfg", "rep", "skill_files",), ERRO),
    Check("I3", i3_links, ("root", "rep", "cfg",), ERRO),
    Check("I4", i4_agents, ("root", "rep",), ERRO),
    Check("I5", i5_principles_inheritance, ("root", "rep",), ERRO),
    Check("I5", i5_kernel, ("root", "cfg", "rep", "ctx",), ERRO),
    Check("I5", i5_admin_kit, ("root", "rep",), ERRO),
    Check("W7", w7_kernel_downstream, ("root", "cfg", "rep", "ctx",), AVISO),
    Check("W16", w16_portfolio_conformance, ("root", "cfg", "rep",), AVISO),
    Check("I5", i5_constitution_generated, ("root", "cfg", "rep",), ERRO),
    Check("F1", f1_memory, ("root", "rep", "cfg",), ERRO),
    Check("F1", f1_log_shape, ("root", "rep",), ERRO),
    Check("F1", f1_wow_growth, ("root", "rep",), AVISO),
    Check("F2", f2_gates, ("cfg", "rep",), ERRO),
    Check("F3", f3_git, ("root", "rep",), ERRO),
    Check("A1", a1_sensors, ("root", "cfg", "rep", "skip_sensors",), ERRO),
    Check("A2", a2_visual_sensor, ("root", "cfg", "rep",), ERRO),
    Check("I6", i6_conformance, ("root", "cfg", "rep",), ERRO),
    Check("W1", w1_descriptions, ("rep", "skill_files",), ERRO),
    Check("W4", w4_uncommitted_edits, ("root", "rep",), AVISO),
    Check("W5", w5_boundary_skills, ("root", "rep", "skill_files",), AVISO),
    Check("W6", w6_charter_not_migrated, ("root", "rep",), AVISO),
    Check("W8", w8_cowork_marker, ("root", "cfg", "rep",), AVISO),
    Check("W9", w9_structure, ("root", "rep",), AVISO),
    Check("W10", w10_sessions, ("root", "rep",), AVISO),
    Check("W11", w11_prototype_inventory, ("root", "rep",), AVISO),
    Check("W12", w12_retired_names, ("root", "rep",), AVISO),
    Check("W13", w13_daily_backup, ("root", "rep",), ERRO),
    Check("W14", w14_prototype_sync, ("root", "rep",), AVISO),
    Check("W15", w15_fix_branch_status, ("root", "cfg", "rep",), AVISO),
    Check("W17", w17_folder_index, ("root", "cfg", "rep",), AVISO),
    Check("W18", w18_free_disk, ("root", "rep",), AVISO),
    Check("W18", w18_budgets, ("root", "rep",), AVISO),
    Check("W19", w19_scripts_catalog, ("root", "cfg", "rep",), AVISO),
    Check("W20", w20_sdd_shape, ("root", "cfg", "rep",), AVISO),
    Check("W21", w21_screen_answers, ("root", "rep",), AVISO),
    Check("W22", w22_returned, ("root", "rep",), AVISO),
    Check("W23", w23_pile_up, ("root", "rep",), AVISO),
]


CRASH_INCIDENT = ("2026-10-25 (auditoria dos scripts, R6): uma checagem que levantava exceção derrubava o doctor inteiro com "
                  "traceback, sem dizer qual — agora vira «não avaliável» com o id dela, e o doctor segue")


def run_checks(context, rep, checks=None):
    """Runs every check of the registry against `context` (a dict with the names `needs` uses). An exception becomes a
    "não avaliável" finding and the id of the check is kept in `rep.crashed`: the criterion could not be evaluated, which
    is never green (the exit is 2 when nothing is red)."""
    for check in (CHECKS if checks is None else checks):
        before = len(rep.findings)
        try:
            check.fn(*[context[n] for n in check.needs])
            if check.severity == AVISO and any(f[1] == ERRO for f in rep.findings[before:]):
                # the registry says this check only warns; it raised an error. Either the declaration or the check is wrong -
                # and the error must not slip out of a check that is not allowed to fail (F73 critique MA-01)
                raise AssertionError(f"a checagem está registrada como AVISO e levantou ERRO ({check.id})")
        except Exception as e:                      # noqa: BLE001 - the whole point: a check never ends the run
            reason = (str(e).strip().splitlines() or [""])[0][:160]
            rep.unevaluable(check.id, f"a checagem `{check.fn.__name__}` não rodou até o fim "
                                      f"({type(e).__name__}: {reason}) — não avaliável", CRASH_INCIDENT)
            rep.crashed.append(check.id)


def run(root, skip_sensors):
    rep = Report()
    cfile = root / CONTRACT
    if not cfile.exists():
        print(f"doctor: {root} não tem {CONTRACT} — instância não avaliável (exit 2)")
        print("        um projeto sem contrato não é verde nem vermelho: é desconhecido.")
        return None, 2
    try:
        raw = read_yaml_strict(cfile.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, UnreadableYaml) as e:
        print(f"doctor: {CONTRACT} ilegível ({type(e).__name__}: {e}) — instância não avaliável (exit 2)")
        print("        um contrato corrompido não é um contrato vazio: corrija o arquivo e rode de novo.")
        return None, 2
    cfg = raw.get("mjrp_harness") or {}
    if not cfg:
        print(f"doctor: {CONTRACT} sem bloco 'mjrp_harness:' (exit 2)")
        return None, 2

    src_root = root if cfg.get("profile") == "meta" else root
    skill_dirs = ["mjrp-skills"] if cfg.get("profile") == "meta" else INSTALLED_DIRS
    skill_files = [p for ps in find_skills(src_root, skill_dirs).values() for p in ps]

    derive_status(root, cfg, rep)                   # BEFORE the checks, so they judge the derived status (F67 TASK-03)
    run_checks({"root": root, "cfg": cfg, "rep": rep, "skill_files": skill_files, "skip_sensors": skip_sensors,
                "ctx": Context.for_project(root)}, rep)
    try:
        write_trace(root, cfg, rep)
    except Exception as e:                          # noqa: BLE001 - the trace is not a check, and it never ends the run
        reason = (str(e).strip().splitlines() or [""])[0][:160]
        rep.unevaluable("TRACE", f"o rastro em daily-checks/ não pôde ser escrito ({type(e).__name__}: {reason}) — o Control Center "
                                 "fica com a passada anterior", CRASH_INCIDENT)
    # F73 R3 (F71/UAT-330, option B, the MJRP 2026-10-25 17:01): nothing red but something NOT EVALUATED is 2, never 0 - the
    # emitters that are only the environment (C1 without the harness at hand, W13 without the destination of the daily copy) are notes, not findings.
    return rep, (1 if rep.errors else 2 if (rep.crashed or rep.unevaluable_) else 0)


def main():
    ap = argparse.ArgumentParser(description="sensor computacional do harness (ADR-0002)")
    ap.add_argument("path", nargs="?", default=".")
    ap.add_argument("--skip-sensors", action="store_true", help="usa o último resultado registrado")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    root = Path(a.path).resolve()
    if not root.is_dir():
        print(f"doctor: {root} não existe (exit 2)")
        sys.exit(2)

    t0 = time.time()
    try:   # F293 (regra 44): one heavy suite at a time on the machine; the turn is taken before the run, and a child inherits it
        import machine_load
    except ImportError:
        machine_load = None
    if machine_load is None:
        rep, code = run(root, a.skip_sensors)
    else:
        try:
            turn = machine_load.heavy("doctor", f"doctor.py {root.name}")
            turn.__enter__()
        except TimeoutError as exc:
            print(f"doctor: {exc}: não rodou (exit 2)", file=sys.stderr)
            sys.exit(2)
        try:
            rep, code = run(root, a.skip_sensors)
        finally:
            turn.__exit__(None, None, None)
    if rep is None:
        sys.exit(code)

    if a.json:
        print(json.dumps({
            "root": str(root), "exit": code,
            "erros": [{"id": i, "msg": m, "file": f} for i, l, m, _, f in rep.findings if l == ERRO],
            "avisos": [{"id": i, "msg": m, "file": f} for i, l, m, _, f in rep.findings if l == AVISO],
            "nao_avaliaveis": [{"id": i, "msg": m, "file": f} for i, l, m, _, f in rep.findings if l == NAO_AVALIAVEL],
        }, indent=2, ensure_ascii=False))
        sys.exit(code)

    print(f"\n  doctor · {root.name}")
    for cid, msg in rep.notes:
        print(f"  · [{cid}] {msg}")
    for cid, level, msg, inc, _f in rep.findings:
        tag = "ERRO " if level == ERRO else "aviso" if level == AVISO else "NÃO AVALIÁVEL"
        print(f"\n  [{tag} {cid}] {msg}")
        print(f"          nasceu de: {inc}")
    veredito = ("VERMELHO" if rep.errors else
                f"NÃO AVALIÁVEL — a(s) checagem(ns) {', '.join(rep.crashed)} não rodou(aram) até o fim (exit 2)" if rep.crashed else
                "NÃO AVALIÁVEL EM PARTE (exit 2)" if rep.unevaluable_ else "VERDE")
    print(f"\n  {veredito} — {len(rep.errors)} erro(s), {len(rep.warnings_)} aviso(s)"
          + (f", {len(rep.unevaluable_)} não avaliável(is)" if rep.unevaluable_ else "") + f" · {time.time()-t0:.1f}s")
    print(f"  critério: ADR-0002, emendada pela 0007 (docs/decisions/)\n")
    sys.exit(code)


if __name__ == "__main__":
    main()
