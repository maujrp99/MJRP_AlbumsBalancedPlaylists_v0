#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
board_mapping_check.py - the judge of how a project's existing items enter the board (F136, S-202; the board@1 of ADR-0025,
ADR-0026 and ADR-0027, read by _board.py).

Why it exists: reconciling what a project already has (epics, features, sprints, versions, issues, history in prose) with a
board configuration is judgment, and judgment under pressure equates concepts by their shape - in the Album Blender v0 an agent
turned sprints into features (ADR-0025, option B). The skill `mjrp-configuring-boards` writes the proposal; this script refuses
what is incomplete or against a rule, and shows the proposal to the human before anything is written. It never decides a row.

The record (`board_mapping@1`, JSON): `sources` (the inventory: id, path, anchor, kind, label), `items` (id, type, state,
accepted, groupings, title), `groupings` (id, kind, title), `rows` (one per source: `to` + `reason` + `approval`, or `excluded`,
or `ambiguous` with the question and the candidates), `config` (`board`: the proposed docs/specs/board.json; `groupings`: the
grouping kinds turned on), `decisions` (each configuration choice, for the human) and `approved` (the orchestrator's OK).

Three uses:
  board_mapping_check.py --mapping <file> [--proposal]   judge a record: exit 0 clean, 1 findings, 2 unreadable
      --table                                            print the from-to table (Markdown), whatever the verdict
      --preview <file.html>                              write the visual preview of the board built with the proposal
  board_mapping_check.py <project> [--quiet]             the project mode, the `check` of the catalog item board@1: the
                                                         board.json exists and passes _board.py, every `Tipo` cell of uat.md is
                                                         read by a board type, a legacy grouping folder has its record, and the
                                                         record (docs/specs/board-mapping.json), when it exists, passes strict

`--proposal` is the record shown for approval: an ambiguous row (a question, two candidates or more, none chosen) and a human
decision not yet answered pass. Without it - before writing - both are findings, and so is a record the orchestrator did not OK.

Standard library only; it imports _board (one ruler for the board@1) and nothing of the Control Center (ADR-0015).
"""
import html
import json
import re
import sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _board

FORMAT = "board_mapping@1"
MAPPING_REL = "docs/specs/board-mapping.json"
UAT_REL = "docs/specs/uat.md"
LEGACY_DIRS = ("docs/specs/sprints", "docs/specs/milestones")
SOURCE_KINDS = ("epic", "feature", "story", "task", "issue", "sprint", "version", "milestone", "release", "prose", "other")
TIME_KINDS = {"sprint", "version", "milestone", "release"}           # become a grouping, never an item (S-202 R3)
WORK_KINDS = {"epic", "feature", "story", "task", "issue"}           # become an item, never a grouping
GROUPING_KINDS = ("release", "sprint", "milestone")
GROUPING_ALWAYS = {"release"}                                        # the others are turned on by a human decision
APPROVERS = ("orchestrator", "human")
MODES = ("greenfield", "brownfield", "conform")
KIND_TYPES = {"epic": {"epic"}, "feature": {"feature"}, "story": {"story"}, "task": {"task"}}   # an issue takes a record type
APPROVED_WAITING_DAYS = 1                                            # the MJRP's rule (ADR-0025, P3): no decision needed
UAT_CELLS = re.compile(r"(?<!\\)\|")                                 # requirements_graph_check.UAT_CELLS

STAGE_LABEL = {"explore": "Explorar", "frame": "Enquadrar", "draw": "Desenhar", "ready": "Pronto para construir",
               "specify": "Specify", "plan": "Plan", "tasks": "Tasks", "execute_verify": "Executar ⇄ Verificar",
               "homologation": "Homologação", "deploy": "Deploy", "accepted": "Aceito"}
PHASE_LABEL = {"discovery": "Discovery", "design": "Design", "delivery": "Delivery", "release": "Release"}
CATEGORY_LABEL = {"not_started": "Não começado", "queued": "Na fila", "reopened": "Reaberto", "in_progress": "Em andamento", "waiting": "Esperando",
                  "evaluating": "Em avaliação (Evals)", "done": "Feito", "closed": "Fechado", "accepted": "Aceito", "off": "Fora"}
KIND_LABEL = {"release": "versão do produto", "sprint": "sprint", "milestone": "milestone"}   # «Release» alone is the phase
BOARD_LABEL = {"all": "Tudo", "epics": "Épicos", "features": "Features", "stories": "Stories", "tasks": "Tasks",
               "discovery": "Discovery", "design": "Design", "delivery": "Delivery", "release": "Release",
               "end-to-end": "Ponta a ponta"}


class Unreadable(Exception):
    """The disk did not let a file be read, or it is not JSON: not evaluable (exit 2)."""


def read_json(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError) as exc:
        raise Unreadable(f"{Path(path).name}: o disco não deixou ler ({exc})") from exc
    except json.JSONDecodeError as exc:
        raise Unreadable(f"{Path(path).name}: JSON ilegível na linha {exc.lineno}: {exc.msg}") from exc


def _text(v):
    return isinstance(v, str) and bool(v.strip())


def _list(v):
    return v if isinstance(v, list) else []


class Config:
    """The merged board@1 a proposal sees: types, the state table of each type, the stage of each phase, the accepted stage."""

    def __init__(self, default, board):
        self.cfg = _board.merge(default, board)
        structure = self.cfg.get("structure_types") or {}
        self.records = [r.get("id") for r in _list(self.cfg.get("record_types")) if isinstance(r, dict)]
        self.types = list(structure) + self.records
        self.states = self.cfg.get("states") or {}
        self.stage_phase, self.accepted = {}, None
        for p in _list(self.cfg.get("phases")):
            for s in _list(p.get("stages") if isinstance(p, dict) else None):
                if isinstance(s, dict) and _text(s.get("id")):
                    self.stage_phase.setdefault(s["id"], p.get("id"))
                    if s.get("from_fact") == "accepted":
                        self.accepted = s["id"]

    def table(self, t):
        rows = self.states.get(_board.RECORD if t in self.records else t)
        return rows if isinstance(rows, dict) else {}

    def place(self, item):
        """(phase, stage, category) of an item, or None with the reason."""
        if item.get("accepted") is True:
            if not self.accepted:
                return None, "a configuração não tem a etapa do aceite"
            return (self.stage_phase[self.accepted], self.accepted, "accepted"), None
        row = self.table(item.get("type")).get(item.get("state"))
        if not isinstance(row, dict):
            return None, f"o estado {item.get('state')!r} não está na tabela do tipo {item.get('type')!r}"
        stage = row.get("stage")
        if stage not in self.stage_phase:
            return None, f"a etapa {stage!r} do estado {item.get('state')!r} não está declarada na proposta"
        return (self.stage_phase[stage], stage, row.get("category")), None


def items_epics(m):
    return {i.get("id") for i in _list(m.get("items")) if isinstance(i, dict) and i.get("type") == "epic"}


def config_choices(board, default, groupings):
    """{choice key: what it is} - every difference of the proposed board.json from the harness default, and every grouping kind
    beyond the release: each one is a configuration choice that only a human decision covers (S-202 R4)."""
    out = {}
    for r in _list(board.get("record_types")):
        rid = r.get("id") if isinstance(r, dict) else None
        out[f"record_type:{rid}"] = f"o tipo de registro novo {rid!r}"
    base = {p.get("id"): [s.get("id") for s in _list(p.get("stages")) if isinstance(s, dict)]
            for p in _list(default.get("phases")) if isinstance(p, dict)}
    for p in _list(board.get("phases")):
        pid = p.get("id") if isinstance(p, dict) else None
        mine = [s.get("id") for s in _list(p.get("stages") if isinstance(p, dict) else None) if isinstance(s, dict)]
        if mine != base.get(pid):
            gone = [s for s in base.get(pid) or [] if s not in mine]
            out[f"stages:{pid}"] = f"as etapas da fase {pid!r}" + (f" sem {', '.join(gone)}" if gone else " trocadas")
    for b in _list(board.get("boards")):
        bid = b.get("id") if isinstance(b, dict) else None
        out[f"board:{bid}"] = f"o board {bid!r}"
    for key in ("columns", "hidden_categories", "origin_rules"):
        if key in board:
            out[key] = f"o {key} do projeto no lugar do padrão"
    if "waiting_after_days" in board and board["waiting_after_days"] != APPROVED_WAITING_DAYS:
        out["waiting_after_days"] = f"«Esperando» depois de {board['waiting_after_days']} dias (a regra aprovada é 1)"
    for kind in sorted(set(groupings) - GROUPING_ALWAYS):
        out[f"grouping:{kind}"] = f"o agrupamento {kind!r} ligado"
    return out


def judge(m, proposal=False, defaults=_board.DEFAULTS):
    """[(code, where, reason)] of a board_mapping@1 record - empty when it is clean. Raises Unreadable on the harness default."""
    out = []

    def bad(code, where, reason):
        out.append((code, where, reason))

    if not isinstance(m, dict) or m.get("format") != FORMAT:
        return [("format", "format", f"formato {m.get('format') if isinstance(m, dict) else type(m).__name__!r}, esperava {FORMAT}")]
    default = _board.read(defaults)
    if not isinstance(default, dict):
        raise Unreadable(f"{Path(defaults).name}: o padrão do board não se lê")
    if m.get("mode") not in MODES:
        bad("format", "mode", f"mode é {', '.join(MODES)}")
    config = m.get("config") if isinstance(m.get("config"), dict) else {}
    board = config.get("board")
    if not isinstance(board, dict):
        bad("format", "config.board", "config.board é o docs/specs/board.json proposto (um objeto board@1)")
        board = {"format": _board.FORMAT}
    found = _board.project_problems(board, default)
    found += [p for p in _board.problems(_board.merge(default, board)) if p not in found]
    for code, where, reason in found:
        bad("board_config_shape", f"config.board.{where}", f"{reason} ({code})")
    cfg = Config(default, board)

    groupings_on = config.get("groupings", sorted(GROUPING_ALWAYS))
    if not isinstance(groupings_on, list) or any(k not in GROUPING_KINDS for k in groupings_on):
        bad("grouping_kind_off", "config.groupings", f"os agrupamentos são {', '.join(GROUPING_KINDS)}")
        groupings_on = sorted(GROUPING_ALWAYS)
    groupings_on = set(groupings_on) | GROUPING_ALWAYS

    sources = {}
    for i, s in enumerate(_list(m.get("sources"))):
        sid = s.get("id") if isinstance(s, dict) else None
        if not _text(sid) or not _text(s.get("path")) or s.get("kind") not in SOURCE_KINDS:
            bad("source_shape", f"sources[{i}]", f"toda fonte tem id, path e kind ({', '.join(SOURCE_KINDS)})")
            continue
        if sid in sources:
            bad("duplicate_id", f"sources.{sid}", f"a fonte {sid!r} aparece duas vezes")
        sources[sid] = s

    groups = {}
    for i, g in enumerate(_list(m.get("groupings"))):
        gid = g.get("id") if isinstance(g, dict) else None
        if not _text(gid) or g.get("kind") not in GROUPING_KINDS:
            bad("grouping_shape", f"groupings[{i}]", f"todo agrupamento tem id e kind ({', '.join(GROUPING_KINDS)})")
            continue
        if gid in groups:
            bad("duplicate_id", f"groupings.{gid}", f"o agrupamento {gid!r} aparece duas vezes")
        groups[gid] = g

    items = {}
    for i, it in enumerate(_list(m.get("items"))):
        iid = it.get("id") if isinstance(it, dict) else None
        if not _text(iid):
            bad("item_shape", f"items[{i}]", "todo item tem id")
            continue
        if iid in items or iid in groups:
            bad("duplicate_id", f"items.{iid}", f"o id {iid!r} aparece duas vezes (itens e agrupamentos)")
        items[iid] = it
        if it.get("type") not in cfg.types:
            bad("item_type", f"items.{iid}", f"o tipo {it.get('type')!r} não é um tipo do board ({', '.join(cfg.types)})")
        else:
            row = cfg.table(it["type"]).get(it.get("state"))
            if not isinstance(row, dict):
                bad("item_state", f"items.{iid}", f"o estado {it.get('state')!r} não está na tabela do tipo {it['type']!r} "
                                                  f"({', '.join(cfg.table(it['type']))})")
            elif it.get("accepted") is not True and row.get("stage") not in cfg.stage_phase:
                bad("item_stage_off", f"items.{iid}", f"o estado {it.get('state')!r} cai na etapa {row.get('stage')!r}, que a proposta não declara")
        for gid in _list(it.get("groupings")):
            if gid not in groups:
                bad("grouping_unknown", f"items.{iid}", f"o agrupamento {gid!r} não está declarado em groupings")
        if it.get("epic") is not None and (not isinstance(it["epic"], str) or it["epic"] not in items_epics(m)):
            bad("epic_unknown", f"items.{iid}", f"o épico {it['epic']!r} não é um item do tipo epic do registro")
        # brownfield: a feature carries the functionalities its spec specified and the work implemented (refactored, in a refactor)
        funcs = it.get("functionalities")
        if funcs is not None and (not isinstance(funcs, list) or any(
                not isinstance(f, dict) or not _text(f.get("text")) or not _text(f.get("evidence")) for f in funcs)):
            bad("functionalities_shape", f"items.{iid}", "cada funcionalidade tem text (o que o spec.md especificou) e evidence (o que mostra que foi implementada)")
        elif m.get("mode") == "brownfield" and it.get("type") == "feature" and funcs is None:
            bad("functionalities_missing", f"items.{iid}", "no brownfield, a feature lista as funcionalidades do spec.md que foram implementadas (functionalities)")

    targets_used, candidate_targets, seen_rows = set(), set(), set()
    for i, r in enumerate(_list(m.get("rows"))):
        src = r.get("source") if isinstance(r, dict) else None
        where = f"rows[{i}]" if not _text(src) else f"rows.{src}"
        if src not in sources:
            bad("row_unknown_source", where, f"a fonte {src!r} não está no inventário (sources)")
            continue
        if src in seen_rows:
            bad("row_twice", where, f"a fonte {src!r} tem duas linhas: uma fonte, uma linha (vários destinos vão no `to`)")
        seen_rows.add(src)
        kind = sources[src]["kind"]
        shapes = [k for k in ("to", "excluded", "ambiguous") if k in r]
        if len(shapes) != 1:
            bad("row_shape", where, "a linha tem uma e só uma de to, excluded, ambiguous" + (f" (tem {', '.join(shapes)})" if shapes else ""))
            continue
        if "excluded" in r:
            if not _text(r["excluded"]):
                bad("row_shape", where, "a fonte excluída diz a razão (excluded)")
            continue
        if "ambiguous" in r:
            a = r["ambiguous"] if isinstance(r["ambiguous"], dict) else {}
            cands = _list(a.get("candidates"))
            if not _text(a.get("question")) or len(cands) < 2 or r.get("approval") != "human":
                bad("ambiguous_shape", where, "o ambíguo tem a pergunta, dois candidatos ou mais e approval human — nunca um escolhido")
            for c in cands:
                for t in _list(c.get("to") if isinstance(c, dict) else None):
                    if not isinstance(t, str) or (t not in items and t not in groups):
                        bad("target_unknown", where, f"o candidato aponta {t!r}, que não está em items nem em groupings")
                    candidate_targets.add(t)
                if not isinstance(c, dict) or not isinstance(c.get("to"), list) or not _text(c.get("why")):
                    bad("ambiguous_shape", where, "cada candidato tem to (a lista vazia é «não trazer») e why")
            if not proposal:
                bad("ambiguous_open", where, f"a fonte {src!r} está ambígua: a pergunta vai ao humano antes de gravar")
            continue
        to = r["to"]
        if not isinstance(to, list) or not to or not _text(r.get("reason")) or r.get("approval") not in APPROVERS:
            bad("row_shape", where, f"a linha mapeada tem to (uma lista), reason e approval ({', '.join(APPROVERS)})")
            continue
        for t in to:
            if not isinstance(t, str):
                bad("row_shape", where, f"o destino {t!r} não é um id")
                continue
            if t in items:
                want = KIND_TYPES.get(kind)
                if want and items[t].get("type") not in want:
                    bad("form_equated", where, f"a fonte {src!r} é {kind} e virou o item {t!r} de tipo {items[t].get('type')!r}")
                if kind in TIME_KINDS:
                    bad("form_equated", where, f"a fonte {src!r} é {kind} e virou o item {t!r}: {kind} é agrupamento, nunca item "
                                               "(as features que ela entregou são itens à parte, ligados a ela)")
            elif t in groups:
                if kind in WORK_KINDS:
                    bad("form_equated", where, f"a fonte {src!r} é {kind} e virou o agrupamento {t!r}: {kind} é item, nunca agrupamento")
            else:
                bad("target_unknown", where, f"o destino {t!r} não está em items nem em groupings")
            targets_used.add(t)

    for sid in sources:
        if sid not in seen_rows:
            bad("source_unmapped", f"sources.{sid}", f"a fonte {sid!r} ({sources[sid]['path']}) não tem linha no de-para: "
                                                    "mapeie, exclua com a razão, ou marque ambígua")
    for tid in list(items) + list(groups):
        if tid not in targets_used and tid not in candidate_targets:
            bad("item_without_source", tid, f"{tid!r} não nasce de nenhuma fonte do de-para (nada se inventa)")
    # a grouping kind left off is a finding only for a grouping that is in the mapping (a mapped row, or a mapped item in it);
    # one that only a candidate offers waits for the human's answer, and the question may be exactly whether to turn it on
    member = {gid for iid, it in items.items() if iid in targets_used for gid in _list(it.get("groupings"))}
    for gid, g in groups.items():
        if g["kind"] not in groupings_on and (gid in targets_used or gid in member or not proposal):
            bad("grouping_kind_off", f"groupings.{gid}", f"o agrupamento {g['kind']!r} não está ligado em config.groupings")

    choices = config_choices(board, default, groupings_on)
    covered = {}
    for i, d in enumerate(_list(m.get("decisions"))):
        did = d.get("id") if isinstance(d, dict) else None
        where = f"decisions.{did}" if _text(did) else f"decisions[{i}]"
        if not _text(did) or not _text(d.get("choice")) or not _list(d.get("covers")) or d.get("approver") != "human":
            bad("decision_shape", where, "a decisão tem id, choice, covers (as escolhas que cobre) e approver human")
            continue
        for k in d["covers"]:
            covered[k] = d
        ans = d.get("answer")
        if not proposal and not (isinstance(ans, dict) and _text(ans.get("text")) and _text(ans.get("at"))):
            bad("decision_open", where, f"a decisão {did!r} espera a resposta do humano (answer: text e at, a hora da entrada do log)")
    for key, what in sorted(choices.items()):
        if key not in covered:
            bad("config_choice_undeclared", f"config.{key}", f"{what} é escolha de configuração: vai ao humano numa decisão (decisions[].covers)")

    if not proposal:
        ok = m.get("approved", {}).get("orchestrator") if isinstance(m.get("approved"), dict) else None
        if not (isinstance(ok, dict) and _text(ok.get("by")) and _text(ok.get("at"))):
            bad("not_approved", "approved.orchestrator", "o de-para mecânico espera o OK do orquestrador (by, at)")
    return out


# ---- the table and the preview: the same record shown, never rewritten

def mapped_targets(m):
    """The ids a mapped row gives - an item or a grouping that only an ambiguous candidate offers is not in the board yet."""
    return {t for r in _list(m.get("rows")) if isinstance(r, dict) and isinstance(r.get("to"), list) for t in r["to"]}


def _target_label(cfg, m, t):
    items = {i.get("id"): i for i in _list(m.get("items")) if isinstance(i, dict)}
    groups = {g.get("id"): g for g in _list(m.get("groupings")) if isinstance(g, dict)}
    if t in items:
        it = items[t]
        place, _why = cfg.place(it)
        where = f"{PHASE_LABEL.get(place[0], place[0])} · {STAGE_LABEL.get(place[1], place[1])}" if place else "sem etapa"
        epic = f", épico {it['epic']}" + (f" (cita {', '.join(_list(it.get('epic_also')))})" if _list(it.get("epic_also")) else "") if it.get("epic") else ""
        return f"{t} ({it.get('type')}, {where}{epic})" + ("" if t in mapped_targets(m) else " — candidato")
    if t in groups:
        return f"{t} ({KIND_LABEL.get(groups[t].get('kind'), groups[t].get('kind'))})" + ("" if t in mapped_targets(m) else " — candidato")
    return f"{t} (?)"


def _cell(v):
    return str(v).replace("|", "\\|").replace("\n", " ")


def table(m, defaults=_board.DEFAULTS):
    """The from-to table in Markdown."""
    cfg = Config(_board.read(defaults), (m.get("config") or {}).get("board") or {})
    sources = {s.get("id"): s for s in _list(m.get("sources")) if isinstance(s, dict)}
    lines = [f"# De-para do board — {m.get('project', '?')} ({m.get('mode', '?')}, {m.get('proposed_at', '?')})", "",
             "| Fonte | Tipo | Vira | Razão | Aprova |", "|---|---|---|---|---|"]
    amb, excl = [], []
    for r in _list(m.get("rows")):
        s = sources.get(r.get("source"), {})
        label = f"{s.get('label') or s.get('id')} — `{s.get('path')}{'#' + s['anchor'] if s.get('anchor') else ''}`"
        if "ambiguous" in r:
            amb.append((label, r))
            continue
        if "excluded" in r:
            excl.append((label, s, r))
            continue
        to = ", ".join(_target_label(cfg, m, t) for t in _list(r.get("to")))
        lines.append(f"| {_cell(label)} | {s.get('kind')} | {_cell(to)} | {_cell(r.get('reason', ''))} | {r.get('approval', '')} |")
    if excl:
        lines += ["", "## Excluídas", "", "| Fonte | Tipo | Por quê |", "|---|---|---|"]
        lines += [f"| {_cell(label)} | {s.get('kind')} | {_cell(r['excluded'])} |" for label, s, r in excl]
    if amb:
        lines += ["", "## Ambíguas — vão ao humano", ""]
        for label, r in amb:
            a = r.get("ambiguous") or {}
            lines.append(f"- **{label}** — {a.get('question')}")
            for c in _list(a.get("candidates")):
                to = ", ".join(_target_label(cfg, m, t) for t in _list(c.get("to"))) or "não trazer"
                lines.append(f"  - {to}: {c.get('why')}")
    with_funcs = [i for i in _list(m.get("items")) if isinstance(i, dict) and _list(i.get("functionalities"))]
    if with_funcs:
        lines += ["", "## Funcionalidades por feature", ""]
        for it in with_funcs:
            lines.append(f"- **{it.get('id')} · {it.get('title', '')}** — {len(it['functionalities'])} funcionalidade(s)")
            sdd = [f for f in _list(it.get("sdd")) if isinstance(f, dict) and _text(f.get("path"))]
            if sdd:
                lines.append("  - SDD: " + " · ".join(f"{f.get('kind', '')} `{f['path']}`" + (f" @ {f['rev']}" if f.get("rev") else "") for f in sdd))
            for f in it["functionalities"]:
                tag = " (refactor)" if f.get("refactor") else ""
                lines.append(f"  - {f.get('text')}{tag} — {f.get('evidence')}")
    decisions = _list(m.get("decisions"))
    if decisions:
        lines += ["", "## Escolhas de configuração — do humano", ""]
        for d in decisions:
            ans = d.get("answer") if isinstance(d.get("answer"), dict) else None
            state = f"respondida: {ans.get('text')} ({ans.get('at')})" if ans else f"recomendação: {d.get('recommendation', '—')}"
            lines.append(f"- **{d.get('id')} · {d.get('choice')}** — {d.get('why', '')} · {state}")
    return "\n".join(lines) + "\n"


def board_columns(cfg, b):
    """[(column id, label, (phases, stages, categories))] of a board and the hidden match, as _board judges them."""
    noop = lambda *a: None  # noqa: E731  (the shape problems are judge()'s)
    hidden = set(cfg.cfg.get("hidden_categories") or [])
    flt = b.get("filter", {}) if isinstance(b.get("filter"), dict) else {}
    if b.get("columns") == _board.BY_CATEGORY:
        cols = [(cid, " · ".join(CATEGORY_LABEL.get(c, c) for c in sorted(m[2] or [])), m)
                for cid, m in _board._columns(cfg.cfg.get("columns"), "columns", noop, by_category=True)]
        return cols, (None, None, hidden or None)
    if b.get("columns") == _board.BY_STAGE:
        phases = _board._set(flt.get("phases")) or set()
        cols = [(s, STAGE_LABEL.get(s, s), (None, {s}, None)) for s, p in cfg.stage_phase.items() if p in phases]
        return cols, (None, None, hidden or None)
    cols = [(cid, BOARD_LABEL.get(cid, PHASE_LABEL.get(cid, cid)), mt)
            for cid, mt in _board._columns(b.get("columns"), b.get("id", ""), noop, by_category=False)]
    h = b.get("hidden") if isinstance(b.get("hidden"), dict) else {}
    return cols, ((_board._set(h.get("phases")), _board._set(h.get("stages")), _board._set(h.get("categories"))) if h else None)


CSS = """:root{--bg:#f7f7f5;--card:#fff;--ink:#1d1d1b;--soft:#6b6b66;--line:#e2e2dc;--accent:#2f6f5e;--warn:#a5521b}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--card:#21211f;--ink:#ecece8;--soft:#a3a39c;--line:#34342f;--accent:#7fc4ae;--warn:#e59a62}}
body{margin:0;padding:16px;background:var(--bg);color:var(--ink);font:14px/1.45 -apple-system,system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:0}.soft{color:var(--soft)}
.sum{display:flex;flex-wrap:wrap;gap:16px;margin:12px 0 20px}.sum b{font-size:22px;display:block}
details{background:var(--card);border:1px solid var(--line);border-radius:10px;margin:0 0 14px;padding:12px}
summary{cursor:pointer}.cols{display:flex;gap:10px;overflow-x:auto;margin-top:12px;padding-bottom:6px}
.col{flex:0 0 220px;background:var(--bg);border-radius:8px;padding:8px}.col h3{font-size:13px;margin:0 0 8px}
.c{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:6px 8px;margin:0 0 6px}
.c b{color:var(--accent)}.c small{display:block;color:var(--soft)}.off h3{color:var(--warn)}"""


def preview(m, defaults=_board.DEFAULTS):
    """The HTML of the board built with the proposal: one panel per board of the merged configuration that has items."""
    cfg = Config(_board.read(defaults), (m.get("config") or {}).get("board") or {})
    mapped = mapped_targets(m)
    every = [i for i in _list(m.get("items")) if isinstance(i, dict)]
    items = [i for i in every if i.get("id") in mapped]
    groups = [g for g in _list(m.get("groupings")) if isinstance(g, dict) and g.get("id") in mapped]
    rows = _list(m.get("rows"))
    e = html.escape
    amb = sum(1 for r in rows if isinstance(r, dict) and "ambiguous" in r)
    excl = sum(1 for r in rows if isinstance(r, dict) and "excluded" in r)
    parts = [f"<h1>Prévia do board — {e(str(m.get('project', '?')))}</h1>",
             f"<div class=soft>{e(str(m.get('mode', '')))} · proposta de {e(str(m.get('proposed_at', '')))} · nada foi gravado no projeto</div>",
             "<div class=sum>" + "".join(f"<div><b>{n}</b>{e(t)}</div>" for n, t in (
                 (len(_list(m.get("sources"))), "fontes"), (len(items), "itens"), (len(groups), "agrupamentos"),
                 (excl, "excluídas"), (amb, "ambíguas"), (len(_list(m.get("decisions"))), "escolhas do humano"))) + "</div>"]
    if len(every) > len(items) or len(_list(m.get("groupings"))) > len(groups):
        parts.append(f"<p class=soft>Fora dos boards até o humano responder: {len(every) - len(items)} itens e "
                     f"{len(_list(m.get('groupings'))) - len(groups)} agrupamentos que só um candidato de pergunta oferece.</p>")
    if groups:
        parts.append("<details><summary><h2 style='display:inline'>Agrupamentos</h2> <span class=soft>versões do produto, sprints, milestones</span></summary><div class=cols>")
        for kind in GROUPING_KINDS:
            mine = [g for g in groups if g.get("kind") == kind]
            if not mine:
                continue
            cards = "".join(f"<div class=c><b>{e(str(g.get('id')))}</b> {e(str(g.get('title', '')))}<small>"
                            f"{sum(1 for i in items if g.get('id') in _list(i.get('groupings')))} itens · {e(str(g.get('by', '')))}</small></div>"
                            for g in mine)
            parts.append(f"<div class=col><h3>{e(KIND_LABEL[kind])} <span class=soft>{len(mine)}</span></h3>{cards}</div>")
        parts.append("</div></details>")
    placed = [(it, *cfg.place(it)) for it in items]
    first = True
    for b in _list(cfg.cfg.get("boards")):
        if not isinstance(b, dict):
            continue
        flt = b.get("filter", {}) if isinstance(b.get("filter"), dict) else {}
        ftypes, fphases, fstages, fcats = (_board._set(flt.get(k)) for k in ("types", "phases", "stages", "categories"))
        cols, hide = board_columns(cfg, b)
        mine = [(it, p, why) for it, p, why in placed if ftypes is None or it.get("type") in ftypes]
        lanes, loose = {cid: [] for cid, _l, _m in cols}, []
        for it, p, why in mine:
            if p is None:
                loose.append((it, why))
                continue
            phase, stage, cat = p
            if not _board._takes((fphases, fstages, fcats), phase, stage, cat) or (hide and _board._takes(hide, phase, stage, cat)):
                continue
            takers = [cid for cid, _l, mt in cols if _board._takes(mt, phase, stage, cat)]
            if len(takers) == 1:
                lanes[takers[0]].append(it)
            else:
                loose.append((it, "nenhuma coluna aceita" if not takers else f"duas colunas aceitam ({', '.join(takers)})"))
        count = sum(len(v) for v in lanes.values()) + len(loose)
        if not count:
            continue
        name = BOARD_LABEL.get(b.get("id"), b.get("id"))
        parts.append(f"<details{' open' if first else ''}><summary><h2 style='display:inline'>{e(str(name))}</h2> "
                     f"<span class=soft>{count} itens</span></summary><div class=cols>")
        first = False
        for cid, label, _mt in cols:
            cards = "".join(_card(cfg, it) for it in lanes[cid])
            parts.append(f"<div class=col><h3>{e(label)} <span class=soft>{len(lanes[cid])}</span></h3>{cards}</div>")
        if loose:
            cards = "".join(_card(cfg, it, why) for it, why in loose)
            parts.append(f"<div class='col off'><h3>Sem coluna <span class=soft>{len(loose)}</span></h3>{cards}</div>")
        parts.append("</div></details>")
    return (f"<!doctype html><html lang=pt-BR><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
            f"<title>Prévia do board</title><style>{CSS}</style></head><body>{''.join(parts)}</body></html>\n")


def _card(cfg, it, why=None):
    e = html.escape
    p, _w = cfg.place(it)
    where = f"{STAGE_LABEL.get(p[1], p[1])} · {CATEGORY_LABEL.get(p[2], p[2])}" if p else ""
    groups = ", ".join(_list(it.get("groupings")) + ([f"épico {it['epic']}"] if it.get("epic") else []))
    extra = f"<small>{e(why)}</small>" if why else ""
    sdd = [f for f in _list(it.get("sdd")) if isinstance(f, dict) and _text(f.get("path"))]
    if sdd:
        extra += (f"<details><summary><small>{len(sdd)} arquivo(s) SDD</small></summary>"
                  + "".join(f"<small>• {e(str(f.get('kind', '')))}: {e(f['path'])}{' @ ' + e(str(f['rev'])) if f.get('rev') else ''}</small>"
                            for f in sdd) + "</details>")
    funcs = _list(it.get("functionalities"))
    if funcs:
        extra += (f"<details><summary><small>{len(funcs)} funcionalidade(s)</small></summary>"
                  + "".join(f"<small>• {e(str(f.get('text')))}{' (refactor)' if f.get('refactor') else ''}</small>" for f in funcs)
                  + "</details>")
    return (f"<div class=c><b>{e(str(it.get('id')))}</b> {e(str(it.get('title', '')))}"
            f"<small>{e(str(it.get('type')))} · {e(where)}{' · ' + e(groups) if groups else ''}</small>{extra}</div>")


# ---- the project mode: the catalog item board@1

def uat_types_unread(root, cfg):
    """[(line, issue id, value)] of the uat.md rows whose `Tipo` cell no record type of the board reads."""
    uat = Path(root) / UAT_REL
    if not uat.exists():
        return []
    try:
        text = uat.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        raise Unreadable(f"{UAT_REL}: o disco não deixou ler ({exc})") from exc
    reads = {v.strip().casefold() for r in _list(cfg.get("record_types")) if isinstance(r, dict)
             for v in _list(r.get("tipo")) if isinstance(v, str)}
    out, tipo_at = [], None
    for number, line in enumerate(text.splitlines(), start=1):
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in UAT_CELLS.split(line)[1:-1]]
        if line.startswith("| ID "):
            tipo_at = cells.index("Tipo") if "Tipo" in cells else None
            continue
        if tipo_at is None or len(cells) <= tipo_at or not cells[0].startswith("UAT-"):
            continue
        if cells[tipo_at].casefold() not in reads:
            out.append((number, cells[0], cells[tipo_at]))
    return out


def project_findings(root, defaults=_board.DEFAULTS):
    """[(code, where, reason)] of a project against the catalog item board@1. Raises Unreadable / _board.Unreadable."""
    root = Path(root)
    out = []
    if not (root / _board.PROJECT_REL).exists():
        out.append(("board_missing", _board.PROJECT_REL, "o projeto não tem docs/specs/board.json: rode a skill mjrp-configuring-boards"))
    for label, code, where, reason in _board.check(root, defaults):
        out.append(("board_config_shape", f"{label}: {where}", f"{reason} ({code})"))
    default, project = _board.read(defaults), _board.read(root / _board.PROJECT_REL)
    if isinstance(default, dict) and not isinstance(project, str):
        cfg = _board.merge(default, project if isinstance(project, dict) else None)
        for number, iid, value in uat_types_unread(root, cfg):
            out.append(("uat_type_unread", f"{UAT_REL}:{number}", f"{iid}: a célula Tipo {value[:60]!r} não é lida por nenhum tipo do board"))
    record = root / MAPPING_REL
    m = read_json(record) if record.exists() else None
    paths = [str(s.get("path", "")).split("#")[0].rstrip("/") for s in _list((m or {}).get("sources")) if isinstance(s, dict)]
    for d in LEGACY_DIRS:
        p = root / d
        if p.is_dir() and any(not c.name.startswith(".") for c in p.iterdir()) and not any(x == d or x.startswith(d + "/") for x in paths):
            out.append(("legacy_unmapped", d, f"{d}/ tem o histórico antes do harness e o {MAPPING_REL} não tem fonte nele: o de-para da skill mjrp-configuring-boards"))
    if m is not None:
        for code, where, reason in judge(m, proposal=False, defaults=defaults):
            out.append((code, f"{MAPPING_REL}: {where}", reason))
        for s in _list(m.get("sources")):
            rel = str(s.get("path", "")).split("#")[0] if isinstance(s, dict) else ""
            if rel and not s.get("rev") and not (root / rel).exists():
                out.append(("source_missing", f"{MAPPING_REL}: sources.{s.get('id')}", f"{rel} não existe no projeto (uma fonte só do git leva rev)"))
    return out


def _print(found, head):
    print(f"{head}: {len(found)} achado(s)" if found else f"{head}: limpo")
    for code, where, reason in found:
        print(f"  {code}  {where}: {reason}")


def main(argv):
    args = list(argv)
    flags = {"--proposal", "--table", "--quiet", "--json"}
    try:
        if "--mapping" in args:
            i = args.index("--mapping")
            path = args[i + 1]
            out_html = args[args.index("--preview") + 1] if "--preview" in args else None
            m = read_json(path)
            found = judge(m, proposal="--proposal" in args)
            if "--table" in args:
                print(table(m))
            if out_html:
                Path(out_html).write_text(preview(m), encoding="utf-8")
                print(f"prévia: {out_html}")
        else:
            rest = [a for a in args if a not in flags]
            if len(rest) != 1 or not Path(rest[0]).is_dir():
                print("uso: board_mapping_check.py <projeto> [--quiet] | --mapping <arquivo> [--proposal] [--table] [--preview <html>]",
                      file=sys.stderr)
                return 2
            found = project_findings(rest[0])
    except (Unreadable, _board.Unreadable) as exc:
        print(f"board_mapping_check: não avaliável — {exc}", file=sys.stderr)
        return 2
    except (IndexError, ValueError):
        print("uso: --mapping <arquivo> e --preview <html> pedem o caminho", file=sys.stderr)
        return 2
    if "--json" in args:
        print(json.dumps([{"code": c, "where": w, "reason": r} for c, w, r in found], ensure_ascii=False, indent=1))
    elif found or "--quiet" not in args:
        _print(found, "o de-para do board" if "--mapping" in args else "o board do projeto")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
