#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""delegation_brief.py - the brief of a delegated session, generated (F295, S-245, orchestrator rule 40).

Born from an incident (ADR-0002 asks for one): the orchestrator wrote each brief by hand and each time left something out - the move on the board as the
first step, the exit criterion, one of the closing rules - so the board lied and the session closed half done (2026-11-17/18). The brief now comes out of a
command, the same text every time, and the orchestrator adds only what is its own (the task, the files, the done).

  python3 mjrp-scripts/delegation_brief.py FNN [--task "<what to do>"] [--done "<the exit criterion>"] [--model sonnet|opus] [--effort medium|high]
                                           [--kernel] [--note "<one more line>"] [--root DIR]

What it prints (Portuguese, for the session that receives it, in this order):
  1. who and where: the feature, its title, its lane and type, its branch name, the spec folder;
  2. THE FIRST STEP: the move on the board (`board_move.py move FNN in_progress`) and the reservation - before any write (rule 39);
  3. the task and the exit criterion, declared (the invariant: no loop starts with no way out). `--done` is the orchestrator's; without it the brief
     says the exit is the feature's own success criteria, read from the spec;
  4. the closing rules, one line each: the guard with its self-test that fails without it, the map and the catalogs, the retroactive step, the graph, the
     independent recheck, the closing entry, the lease, the `session-check`, and the tip in one line to the orchestrator;
  5. with `--kernel` (the feature touches `mjrp-scripts/`): the kernel's self-tests, which the train runs before the merge;
  6. the model and effort the session runs on - the orchestrator's rule: a delegation declares them.
It reads the feature from the board's own sources (`board_move.py` finds the project and the folder) and writes nothing. Exit 0 printed, 2 when the
feature is not found. Stdlib only.
"""
import argparse
import re
import sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401, E402
import _fm  # noqa: E402

sys.dont_write_bytecode = True

KERNEL_SELFTESTS = ("_boot_selftest.py", "new_project_selftest.py", "conformance_check_selftest.py")


def slug_of(folder):
    return re.sub(r"^F\d+-", "", folder)


def feature_facts(root, item):
    """(project, folder, fields of the spec) of the feature, or raises LookupError."""
    import board_move as bm
    top = bm.top_of(root)
    for rel in bm.projects(top):
        folder = bm.features_of(top, rel).get(item)
        if folder:
            spec = Path(top) / rel / bm.FEATURES / folder / "spec.md"
            try:
                fields = _fm.parse(spec.read_text(encoding="utf-8")) or {}
            except OSError:
                fields = {}
            return rel, folder, fields, spec
    raise LookupError(f"{item}: nenhuma feature com esse id em {top}")


def title_of(spec):
    try:
        m = re.search(r"^# Feature F\d+:\s*(.+)$", spec.read_text(encoding="utf-8"), re.M)
    except OSError:
        m = None
    return m.group(1).strip() if m else ""


def build(item, rel, folder, fields, spec, task="", done="", model="sonnet", effort="medium", kernel=False, note=""):
    slug = slug_of(folder)
    branch = f"claude/{item.lower()}-{slug}"
    where = f"{rel}/docs/specs/features/{folder}" if rel != "." else f"docs/specs/features/{folder}"
    lane = fields.get("lane") or "?"
    kind = fields.get("solution_type") or "?"
    fixes = fields.get("fixes")
    out = [
        f"# Brief da {item} — {title_of(spec) or slug}",
        "",
        f"**Feature:** {item} ({title_of(spec) or slug}) · via `{lane}` · tipo `{kind}`" + (f" · conserta {fixes}" if fixes else "") + f" · spec em `{where}/`.",
        f"**Branch:** `{branch}`, a partir da `main` (o prefixo é o que o board lê).",
        "",
        "## 1. Primeiro passo — antes de qualquer escrita (regra 39, «o estado primeiro»)",
        f"- `python3 mjrp-scripts/session_lease.py claim --feature {item}` e `python3 mjrp-scripts/board_move.py move {item} in_progress --why \"<o que esta sessão vai fazer>\"`.",
        f"- O card em «Em andamento» é o que o hook `PreToolUse` e o pre-commit cobram: sem ele a primeira escrita é recusada. `board_move.py next {item}` mostra onde ele está.",
        "- Pediu algo ao MJRP ou depende de outra sessão: `board_move.py move <item> waiting_human|waiting_agent`, e de volta a `in_progress` quando voltar.",
        "",
        "## 2. A tarefa e o critério de saída (nenhum loop começa sem saída)",
        f"- Tarefa: {task.strip() or 'a da spec da feature (o `Summary` e os `Requirements`).'}",
        f"- Pronto quando: {done.strip() or 'os `Success Criteria` da spec cumpridos e provados por teste, e o fecho abaixo verde.'}",
    ]
    if note.strip():
        out.append(f"- {note.strip()}")
    out += [
        "",
        "## 3. O fecho (as regras que o juiz cobra)",
        "- Quem cria uma trava cria o autoteste que **falha sem ela**; a trava entra no mapa dos hooks (`docs/wiki/hooks-map.md`, gerado), em `process_sensors.json` (com `taught_by`: a skill que a ensina, ou `none: <motivo>`), em `VENDORED_FILES` quando vai ao filho, nos catálogos e no `structure.yml`.",
        "- A via rápida tem o passo retroativo: `python3 mjrp-scripts/retro_step_check.py . --branch HEAD --base main` verde; a spec `Done`, as tasks fechadas com `rounds::` e, num conserto, a linha da UAT em `fixed (...)`.",
        "- `python3 mjrp-scripts/requirements_graph_check.py apps/control-center` sem achado da feature.",
        "- A reconferência independente, num modelo menor, sem P0 nem P1 (relatório em `reports/audits/`); o `closed_by: \"recheck independente: <relatório>, <data hora>\"` na spec só depois dela.",
        "- A entrada de fechamento no `docs/log.md` (e no do app, se a feature é dele) **depois** do último commit de trabalho, com a hora de Brasília real; o `## Now` do `MEMORY.md` carimbado com ela.",
        f"- `python3 mjrp-scripts/session_lease.py release`, e `python3 mjrp-scripts/merge_train.py session-check .` com 0 pendência.",
        "- Nada de `--no-verify`, nada de contornar trava que recusa: a recusa vai ao orquestrador. Não junta na `main` (é do integrador) e não dá push (é do MJRP).",
        "- A ponta do branch, em **uma linha**, ao orquestrador (`SendMessage`); o resto está nos arquivos.",
    ]
    if kernel:
        out += [
            "",
            "## 4. A feature mexe em `mjrp-scripts/` — os autotestes do kernel",
            "- O trem os roda antes de juntar e recusa o branch que os deixa vermelhos: "
            + ", ".join(f"`{t}`" for t in KERNEL_SELFTESTS) + " (em segundo plano: passam de dois minutos).",
        ]
    out += [
        "",
        f"## {'5' if kernel else '4'}. Modelo",
        f"- A sessão roda no **{model}**, esforço **{effort}** (regra do orquestrador: toda delegação declara o modelo; o Designer é sempre Opus, o padrão é Sonnet médio).",
    ]
    return "\n".join(out) + "\n"


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("feature")
    ap.add_argument("--task", default="")
    ap.add_argument("--done", default="")
    ap.add_argument("--model", default="sonnet", choices=("sonnet", "opus", "haiku"))
    ap.add_argument("--effort", default="medium", choices=("low", "medium", "high"))
    ap.add_argument("--kernel", action="store_true", help="the feature touches mjrp-scripts/: add the kernel's self-tests to the brief")
    ap.add_argument("--note", default="")
    ap.add_argument("--root", default=".")
    a = ap.parse_args(argv)
    item = a.feature.upper()
    if not re.fullmatch(r"F\d{2,}", item):
        print(f"delegation_brief: «{a.feature}» não é uma feature (Fxx)", file=sys.stderr)
        return 2
    try:
        rel, folder, fields, spec = feature_facts(a.root, item)
    except LookupError as exc:
        print(f"delegation_brief: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:  # noqa: BLE001
        print(f"delegation_brief: não leu ({exc})", file=sys.stderr)
        return 2
    sys.stdout.write(build(item, rel, folder, fields, spec, a.task, a.done, a.model, a.effort, a.kernel, a.note))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
