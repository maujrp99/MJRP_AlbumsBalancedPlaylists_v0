# cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_doctor_contract.py - the doctor's checks of the contract itself: its schema, enums and gates (I1, W3, W6 stack, F2).

Family module of the doctor (F73 R5). The doctor (`doctor.py`) keeps the registry that runs it.
"""
import re
import shutil
from datetime import date
from datetime import datetime

import _clock


SCHEMA = {
    "version": str, "profile": str, "process_level": str, "context": str,
    "gates": list, "gate_sla_days": int, "gates_open": list,
    "stack": dict,         # QUEM FAZ O QUE - atribuicao de papel (§5.2.1 da proposta)
    "tech_stack": dict,    # 15/09: a tecnologia do PRODUTO - nao tinha campo, e ia parar no stack:
    "models": dict, "environment": dict, "sensors": dict,
    "orchestration": str, "source": str,
    # `inventory`: as pastas que a skill mjrp-inventorying-folders audita (09/09). Entrou no contrato
    # before the schema - W3 flagged it, which is exactly its job.
    "inventory": list,
    "locale": dict,        # 10/09: timezone, labels, content - what skills and sensors read instead of assuming
    "memory": dict,        # 10/09: pending_expiry_days, layer0_budget_chars - the form of ## Now (F1)
    "kernel": dict,        # 14/09: version, source, pages - the wiki kernel this project carries (I5)
    # 13/10 (ADR-0022): the project's colour in the Control Center - {light, dark}, IDs of the palette library.
    # The doctor checks only the SHAPE (_i1_palette_pair); whether the IDs exist is the Control Center's call.
    "project_palette": dict,
    "control_center": dict,  # 13/10 (ADR-0022): the app's own keys; `portfolio_palette` ("Todos os projetos") is checked
    "tools": dict,         # 14/09: category -> tool, one per category (docs/wiki/tools-catalog.md)
    # 16/09-05/10: "sdd_chain" (read by SDD_chain_artifacts_check.py) retired with it in S-77 - the
    # requirements graph (requirements_graph_check.py) replaced the chain.
    # 19/09 (EP-07): the child projects whose docs/harness-feedback/ the harness_feedback_check.py
    # sweeps into docs/wiki/feedback-from-other-projects/ - folder names, siblings of this repo.
    "children": list,
    "children_root": str,
    # 2026-10-12 (ADR-0017, revised): where this project's screen lives - path prefixes ending in `/`, exact paths or
    # globs. The doctor's A2 and the pre-merge-commit gate (visual_gate.py) read the same declaration.
    "screen": list,  # optional: where the children live when they are not siblings of this repo
    # 03/10 (S-62): format of the requirements (story | use-case | ears), written by new_project.py - W3 flagged it
    # in every new project until 04/10. 04/10 (S-67): stale_days - days without activity that make an In progress
    # requirement stale for the requirements graph sensor.
    "requirements": dict,
    # 04/10 (MJRP): the content profile's fields, written by new_project.py since 09/09 - W3 flagged them in every
    # content project ("campo desconhecido"); the onboarding skill carried a note explaining the warning.
    "content_root": str, "session_history": str, "destinations": list,
    # 2026-10-13 (ADR-0020 D.3): the identity prefix (CC) of a project nested in the repository of another one - carried by
    # the outcome, epic and NFR IDs that the containing project also uses (requirements_graph_check.py, rule id_unique).
    # `parent_epic` left the contract in the same ADR (A.4): "inside the harness" is derived from the path, not declared.
    "id_prefix": str,
    # 11/10 (ADR-0004 of the Control Center, accepted by the MJRP): files that carry their own history - a commit that
    # touches only them, with a new item in their history list, is exempt from the log entry (log_entry_check.py).
    "self_logged": list,
    # 2026-10-13 (ADR-0019): the canonical conformance of the children - `applied: [CM-NNNN]` (migration notes the project
    # carried out) and `waived: [{item, reason, until}]` (a dated, reasoned exception). Read by I6 and --refresh-kernel.
    "conformance": dict,
    # 2026-10-13 (ADR-0020 D.1): the root contract names the paths whose commits always owe the entry to the ROOT log:
    # `log_owner: {root_paths: [docs/wiki/kernel/, mjrp-scripts/, ...]}` (log_entry_check.py).
    "log_owner": dict,
    # 2026-10-19: the harness a child is refreshed from (written once by `new_project.py --refresh-kernel`); the conform and the
    # child's own conformance_check.py find the source here to compare their catalog with it (conformance_check.find_harness).
    "harness_root": str,
    # 2026-11-07 (F220, S-226): hours an agent has to act on what the MJRP handed back from the iPhone before returned_check.py charges it
    # (the doctor's W22 and the orchestrator's Stop gate). Absent: 24. An int in (0, 168]: the message lives a week.
    "returned_deadline_hours": int,
}


ENUMS = {
    "profile": {"code-app", "content", "meta"},
    "process_level": {"minimal", "standard", "full"},
    "context": {"eager", "lazy"},
    "orchestration": {"assisted", "autonomous"},
}


# 15/09: `stack:` e `tech_stack:` sao dois campos com nomes parecidos e sentidos opostos. O
# incidente: a wiki inverteu os dois em 14/09, e no dia seguinte 5 contratos foram preenchidos
# pela inversao. Isto NAO fixa valor - so reconhece as chaves que so fazem sentido em tech_stack.
CHAVES_DE_TECNOLOGIA = {
    "frontend", "backend", "hosting", "database", "language", "framework", "runtime",
    "build", "styling", "router", "testing", "lint", "ci", "secrets", "platform",
    "scripting", "data_source", "file_storage", "auth", "apis", "rendering",
}


PAPEIS = {"strategy", "build", "review", "design", "owns_loop", "ops", "content"}


def w6_stack_sense(cfg, rep):
    """`stack:` diz quem faz o que; a tecnologia do produto e `tech_stack:` (§5.2.1)."""
    inc = ("14/09 a wiki inverteu os sentidos de `stack:` e `models:`; em 15/09 cinco contratos "
           "foram preenchidos pela inversao antes de alguem abrir a §5.2.1")
    stack = cfg.get("stack")
    if not isinstance(stack, dict):
        return
    # `build` e `design` sao papeis E chaves de tecnologia - so contam as inequivocas
    suspeitas = sorted((set(stack) & CHAVES_DE_TECNOLOGIA) - PAPEIS)
    if suspeitas:
        rep.warn("W6", f"`stack:` tem {', '.join(suspeitas)} — isso parece tecnologia do produto, "
                       f"que e campo `tech_stack:`; `stack:` e atribuicao de papel (§5.2.1)", inc)


def i1_contract(cfg, rep):
    inc = "o marker do careertransition declara charter, destinations e notes — campos que a spec não prevê"
    if "ceremony" in cfg and "process_level" not in cfg:
        rep.fail("I1", "contrato usa `ceremony:`, renomeado para `process_level:` em 11/09/2026 "
                       "(em ágil, cerimônia é ritual; o campo mede quanto do método o projeto roda)", inc)
    for k in ("version", "profile", "process_level"):
        if k not in cfg:
            rep.fail("I1", f"contrato sem campo obrigatório '{k}'", inc)
    for k, v in cfg.items():
        if k not in SCHEMA:
            rep.warn("W3", f"contrato tem campo desconhecido '{k}' — a instância está à frente da spec", inc)
        elif not isinstance(v, SCHEMA[k]):
            rep.fail("I1", f"contrato: '{k}' deveria ser {SCHEMA[k].__name__}, veio {type(v).__name__}", inc)
        elif k in ENUMS and v not in ENUMS[k]:
            rep.fail("I1", f"contrato: '{k}: {v}' fora do domínio {sorted(ENUMS[k])}", inc)
    _i1_environment(cfg, rep)
    _i1_palette_pair("project_palette", cfg.get("project_palette"), rep, inc)
    app = cfg.get("control_center")
    if isinstance(app, dict) and "portfolio_palette" in app:
        _i1_palette_pair("control_center.portfolio_palette", app["portfolio_palette"], rep, inc)
    w6_stack_sense(cfg, rep)
    if not rep.errors:
        rep.note("I1", "contrato válido contra o schema")


def _i1_palette_pair(name, value, rep, inc):
    """ADR-0022: `{light, dark}` as one or two scalars; only the shape. The IDs are judged by the Control Center
    against the palette library (one source for the list), so a new palette never needs a change here."""
    if value is None:
        return
    if not isinstance(value, dict) or not value or set(value) - {"light", "dark"}:
        rep.fail("I1", f"contrato: '{name}' deve ser um dicionário com `light` e/ou `dark` (IDs da biblioteca de paletas)", inc)
    elif not all(isinstance(v, str) and v for v in value.values()):
        rep.fail("I1", f"contrato: '{name}.light'/'{name}.dark' devem ser um ID de paleta (texto)", inc)


def _i1_environment(cfg, rep):
    """The contract declares an environment; nothing checked that it holds HERE.

    The cheap half only. `environment.setup` is a command with side effects, and the doctor
    runs on every SessionStart - running it would be the harness installing things behind the
    user's back. The entry_check runs it (and clones the repo to do so), which is why it takes
    90 seconds and stays OUT of `sensors:`. What is left for here is what is both cheap and
    daily: does the runtime this contract requires exist on the machine reading it.
    """
    inc = ("08/09: o Zé rodou o doctor no Mac e teve que criar um venv à mão — o contrato "
           "declarava `pip install --user pyyaml`, que o Homebrew externally-managed recusa, "
           "e nada conferia que o `environment` declarado valia naquela máquina")
    env = cfg.get("environment")
    if not isinstance(env, dict) or not env:
        rep.warn("W3", "contrato sem `environment` — não há como saber o que a instância exige", inc)
        return
    if not str(env.get("setup", "")).strip():
        rep.fail("I1", "contrato: `environment.setup` vazio — declare `nenhum` se não há "
                       "pré-requisito; em branco não é o mesmo que nenhum", inc)
    faltando = []
    for prog in sorted(set(re.findall(r"\b(git|gh|node|npm|python3|uv|docker)\b",
                                     str(env.get("runtime", ""))))):
        if shutil.which(prog) is None:
            faltando.append(prog)
    if faltando:
        rep.fail("I1", f"contrato: `environment.runtime` exige {', '.join(faltando)}, "
                       f"que não está nesta máquina", inc)
    else:
        rep.note("I1", f"environment: runtime declarado disponível aqui")


def f2_gates(cfg, rep):
    inc = "albumblender-v1 parado 166 dias exatamente num gate; visual-notes-hub, 184"
    sla = cfg.get("gate_sla_days", 14)
    abertos = cfg.get("gates_open") or []
    for g in abertos:
        if not isinstance(g, dict) or "since" not in g:
            rep.fail("F2", f"gate aberto sem data: {g}", inc)
            continue
        d = g["since"] if isinstance(g["since"], date) else datetime.strptime(str(g["since"]), "%Y-%m-%d").date()
        dias = (_clock.today() - d).days
        quem = g.get("owner", "sem dono")
        if dias > sla:
            rep.fail("F2", f"gate '{g.get('id','?')}' aberto há {dias} dias (SLA {sla}), com {quem}", inc)
    rep.note("F2", f"{len(abertos)} gate(s) aberto(s), SLA {sla} dias")
