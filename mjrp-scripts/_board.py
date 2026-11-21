# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_board.py - the board configuration (board@1) as the harness sensors judge it: the default merged with the project's file, every
shape refusal and the coverage of each board (F134; ADR-0025 § 6, ADR-0026, ADR-0027).

Why it exists: the board's columns, types, phases, stages and saved views are configuration, so a wrong `docs/specs/board.json`
would put cards in the wrong column without an error. `requirements_graph_check.py` runs this at the commit, in the Stop hook and
in the doctor, and reports each problem as `board_config_shape`.

It is the twin of the Control Center's `itemboard.checks` and `itemboard.config.merge` (the scripts cannot import the app,
ADR-0015): both refuse the same shapes with the same codes, and `apps/control-center/tests/compat/test_board_config_pair.py` fails
when their verdicts differ.

Where the two files live:
  - the harness default: `board_defaults.json`, next to this file (carried to every child with the kernel);
  - the project's: `docs/specs/board.json` (optional). It ADDS record types and boards (a board with a default's id replaces it)
    and REPLACES the stages of a phase the default declares (it may leave a stage out; it adds no phase), columns,
    hidden_categories, origin_rules and waiting_after_days (days, or a text with its unit: "30m", "2h", "1d"; F146); states and structure_types are the harness's and a project file that
    writes them is refused.

The stages (ADR-0027): each phase lists its stages; a stage id is unique across the phases (the phase comes from it); exactly one
stage is `from_fact: "accepted"`; a state of the table points to a declared stage, never to that one; `by_stage` takes a board
filtered to one phase, and the global hidden categories apply to it.

Coverage: for each board, every stage x category pair an item can reach - the base pair of each state of each type the filter
admits, plus `queued` from `not_started` and `waiting` from `in_progress` in the same stage, `reopened` from `in_progress`, `done`
and `closed` of a type that `reopens` (F143; a type that follows its parent never takes it), `evaluating` and `done` from
`in_progress` of a type with `evaluated` (the judge's rule R7, F146), and `accepted` in the accepted stage
(from `done` and `closed`, or from any category of a type that follows its parent) - that the filter keeps and the hidden set does
not hide must fall in EXACTLY one column.
"""
import json
import re
from pathlib import Path

FORMAT = "board@1"
DEFAULTS = Path(__file__).resolve().parent / "board_defaults.json"
PROJECT_REL = "docs/specs/board.json"
CATEGORIES = ("not_started", "queued", "reopened", "in_progress", "waiting", "waiting_human", "waiting_agent", "evaluating",
              "awaiting_merge", "done", "closed", "accepted", "off")
# the state table may give only these; queued, reopened, waiting, evaluating and accepted come from facts (ADR-0026 § Consequences;
# F143; F146)
TABLE_CATEGORIES = ("not_started", "in_progress", "done", "closed", "off")
RECORD = "record"                       # the `states` row every record type takes
BY_CATEGORY = "by_category"
BY_STAGE = "by_stage"
PROJECT_FIXED = ("states", "structure_types")
STRUCTURE_FLAGS = ("in_filter", "follows_parent", "accept_by_children", "reopens", "evaluated")
GROWS = {"not_started": {"queued"}, "in_progress": {"waiting"}}   # R1, R2/R4, in the same stage
REOPENS = ("in_progress", "done", "closed")                       # R6, a type that `reopens`, in the same stage (F143)
JUDGED = {"in_progress": {"evaluating", "done"}}                  # R7, of an `evaluated` type only (F146)
# F275: waiting_human, waiting_agent and awaiting_merge come only from the record (board_move.py) and are never required of a board:
# where no column takes them, the item stands in «Esperando» (itemboard/category.py, the RR rule)
SPAN = re.compile(r"^\s*(\d+)\s*([mhd])\s*$")                    # `waiting_after_days` with its unit (F146)


def waiting_after_ok(value):
    """Whether `waiting_after_days` reads: an integer of days from 1 up, or a text with its unit ("30m", "2h", "1d"), at least 1
    (the twin of itemboard.checks.waiting_after)."""
    if isinstance(value, bool):
        return False
    if isinstance(value, int):
        return value >= 1
    m = SPAN.match(value) if isinstance(value, str) else None
    return bool(m) and int(m.group(1)) >= 1


class Unreadable(Exception):
    """The disk did not let the file be read: not evaluable (exit 2), never a shape problem."""


def read(path):
    """The JSON of `path`; None when the file does not exist. A JSON that does not parse is a problem, not an Unreadable:
    it is returned as the string `"json: <reason>"` so the caller reports it as `board_config_shape`."""
    p = Path(path)
    if not p.exists():
        return None
    try:
        text = p.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        raise Unreadable(f"{p.name}: o disco não deixou ler ({exc})") from exc
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        return f"json: JSON ilegível na linha {exc.lineno}: {exc.msg}"


def merge(default, project):
    """The configuration a project sees: the default with the project's additions and replacements (itemboard.config.merge)."""
    out = dict(default)
    if not project:
        return out
    out["record_types"] = list(default.get("record_types", [])) + list(project.get("record_types", []))
    boards = {b.get("id"): b for b in default.get("boards", []) if isinstance(b, dict)}
    order = list(boards)
    for b in project.get("boards", []):
        bid = b.get("id") if isinstance(b, dict) else None
        if bid not in boards:
            order.append(bid)
        boards[bid] = b
    out["boards"] = [boards[i] for i in order]
    mine = {p.get("id"): p for p in project.get("phases", []) if isinstance(p, dict)}
    if mine:
        out["phases"] = [dict(p, stages=mine[p.get("id")].get("stages", [])) if p.get("id") in mine else p
                         for p in default.get("phases", [])]
    for key in ("columns", "hidden_categories", "origin_rules", "waiting_after_days"):
        if key in project:
            out[key] = project[key]
    return out


def project_problems(project, default=None):
    """What only the project's file can get wrong: its format, the keys that are the harness's, a board twice, a phase the
    default does not declare."""
    if not isinstance(project, dict):
        return [("format", "board", "a configuração não é um objeto JSON")]
    out = [("format", "format", f"formato {project.get('format')!r}, esperava {FORMAT}")] if project.get("format") != FORMAT else []
    out += [("project_fixed", k, f"{k} é do padrão do harness; o board.json do projeto não o muda") for k in PROJECT_FIXED if k in project]
    ids = [b.get("id") for b in project.get("boards", []) if isinstance(b, dict)]
    out += [("duplicate_id", f"boards.{i}", f"o board {i!r} aparece duas vezes no board.json") for i in sorted({i for i in ids if ids.count(i) > 1})]
    known = {p.get("id") for p in (default or {}).get("phases", []) if isinstance(p, dict)} if isinstance(default, dict) else set()
    for p in project.get("phases", []):
        pid = p.get("id") if isinstance(p, dict) else None
        if pid not in known:
            out.append(("project_phase", f"phases.{pid}", f"a fase {pid!r} não é do padrão: o projeto troca as etapas de uma fase, não cria fase"))
    return out


def problems(cfg):
    """[(code, where, reason)] of a merged configuration - empty when it is valid. The codes are itemboard.checks'."""
    out = []

    def bad(code, where, reason):
        out.append((code, where, reason))

    if not isinstance(cfg, dict):
        return [("format", "board", "a configuração não é um objeto JSON")]
    if cfg.get("format") != FORMAT:
        bad("format", "format", f"formato {cfg.get('format')!r}, esperava {FORMAT}")
    stage_phase, accepted = _phases(cfg.get("phases"), bad)

    structure = cfg.get("structure_types")
    if not isinstance(structure, dict) or not structure:
        bad("structure_types", "structure_types", "structure_types é um objeto tipo → flags, não vazio")
        structure = {}
    for t, flags in structure.items():
        if not isinstance(flags, dict) or any(k not in STRUCTURE_FLAGS or not isinstance(v, bool) for k, v in flags.items()):
            bad("structure_types", f"structure_types.{t}", f"as flags são {', '.join(STRUCTURE_FLAGS)}, cada uma true ou false")

    records = _records(cfg.get("record_types", []), structure, bad)
    types = set(structure) | set(records)
    states = _states(cfg.get("states"), structure, records, stage_phase, accepted, bad)

    columns = _columns(cfg.get("columns"), "columns", bad, by_category=True)
    hidden_cats = cfg.get("hidden_categories", [])
    if not isinstance(hidden_cats, list) or any(c not in CATEGORIES for c in hidden_cats):
        bad("category_unknown", "hidden_categories", "hidden_categories só tem categorias conhecidas")
        hidden_cats = []
    reach = _Reach(states, structure, records, stage_phase, accepted)
    seen = set()
    for i, b in enumerate(cfg.get("boards", [])):
        _board(b, i, seen, types, stage_phase, columns, set(hidden_cats), reach, bad)

    for i, rule in enumerate(cfg.get("origin_rules", [])):
        where = f"origin_rules[{i}]"
        when = rule.get("when") if isinstance(rule, dict) else None
        if not isinstance(when, dict) or rule.get("type") not in types:
            bad("origin_rule", where, "cada regra tem when {origin_stage?, nature?} e um type conhecido")
        elif "origin_stage" in when and when["origin_stage"] not in stage_phase:
            bad("origin_rule", where, f"a etapa {when['origin_stage']!r} não está declarada")

    days = cfg.get("waiting_after_days")
    if days is not None and not waiting_after_ok(days):
        bad("waiting_after_days", "waiting_after_days", 'waiting_after_days é um inteiro de dias de 1 para cima, ou um texto com a unidade ("30m", "2h", "1d")')
    return out


def check(root, defaults=DEFAULTS):
    """[(file label, code, where, reason)] of the default and the project's board.json at `root`. Raises Unreadable."""
    out = []
    default = read(defaults)
    if default is None:
        raise Unreadable(f"{Path(defaults).name}: o padrão do board não está no kernel")
    if isinstance(default, str):
        return [(Path(defaults).name, "json", "json", default[len("json: "):])]
    for code, where, reason in problems(default):
        out.append((Path(defaults).name, code, where, reason))
    project = read(Path(root) / PROJECT_REL)
    if project is None or out:
        return out
    if isinstance(project, str):
        return [("board.json", "json", "json", project[len("json: "):])]
    found = project_problems(project, default)
    found += [p for p in problems(merge(default, project)) if p not in found]
    return [("board.json", code, where, reason) for code, where, reason in found]


def _phases(spec, bad):
    """({stage: phase}, the accepted stage) of `phases`; the problems go to `bad`."""
    if not isinstance(spec, list) or not spec:
        bad("phases", "phases", "phases é uma lista de {id, stages}, não vazia")
        return {}, None
    out, seen, facts = {}, set(), []
    for i, p in enumerate(spec):
        pid = p.get("id") if isinstance(p, dict) else None
        stages = p.get("stages") if isinstance(p, dict) else None
        if not isinstance(pid, str) or not pid or not isinstance(stages, list) or not stages:
            bad("phases", f"phases[{i}]", "cada fase é {id, stages}, com ao menos uma etapa")
            continue
        if pid in seen:
            bad("duplicate_id", f"phases.{pid}", f"a fase {pid!r} aparece duas vezes")
        seen.add(pid)
        for s in stages:
            sid = s.get("id") if isinstance(s, dict) else None
            if not isinstance(sid, str) or not sid:
                bad("phases", f"phases.{pid}", "toda etapa tem id")
                continue
            if sid in out:
                bad("duplicate_id", f"phases.{pid}.{sid}", f"a etapa {sid!r} aparece duas vezes (a fase sai dela)")
            out.setdefault(sid, pid)
            if "from_fact" in s:
                facts.append((sid, s["from_fact"]))
    one = len(facts) == 1 and facts[0][1] == "accepted"
    if not one:
        bad("from_fact", "phases", "exatamente uma etapa é from_fact 'accepted' (o aceite do humano)")
    return out, facts[0][0] if one else None


def _records(spec, structure, bad):
    records, tipo_owner = [], {}
    for i, r in enumerate(spec if isinstance(spec, list) else []):
        rid = r.get("id") if isinstance(r, dict) else None
        where = f"record_types[{i}]"
        if not isinstance(rid, str) or not rid:
            bad("record_types", where, "todo tipo de registro tem id")
            continue
        if rid in records:
            bad("duplicate_id", where, f"o tipo de registro {rid!r} aparece duas vezes")
        elif rid in structure or rid == RECORD:
            bad("record_type_structure", where, f"o tipo de registro {rid!r} repete um tipo de estrutura")
        records.append(rid)
        tipos = r.get("tipo")
        if not isinstance(tipos, list) or not tipos or not all(isinstance(v, str) and v for v in tipos):
            bad("record_types", where, f"{rid}: tipo é a lista dos valores da célula Tipo que ele lê")
            continue
        for v in tipos:
            key = v.strip().casefold()
            if key in tipo_owner and tipo_owner[key] != rid:
                bad("tipo_twice", where, f"o valor {v!r} da célula Tipo é lido por {tipo_owner[key]} e por {rid}")
            tipo_owner.setdefault(key, rid)
    return records


def _states(spec, structure, records, stage_phase, accepted, bad):
    if not isinstance(spec, dict):
        bad("states", "states", "states é um objeto tipo → estado → {stage, category}")
        return {}
    for t, rows in spec.items():
        if t not in structure and t != RECORD:
            bad("states", f"states.{t}", f"{t!r} não é tipo de estrutura nem {RECORD!r}")
        if not isinstance(rows, dict) or not rows:
            bad("states", f"states.{t}", "a tabela do tipo é um objeto estado → {stage, category}, não vazio")
            continue
        for s, row in rows.items():
            where = f"states.{t}.{s}"
            row = row if isinstance(row, dict) else {}
            if row.get("stage") not in stage_phase and row.get("fallback") in stage_phase:
                row = {**row, "stage": row["fallback"]}  # F275: a project whose phases lack the stage (`backlog`) takes the fallback
            if row.get("stage") not in stage_phase:
                bad("state_stage", where, f"a etapa {row.get('stage')!r} não está declarada")
            elif row.get("stage") == accepted:
                bad("state_from_fact", where, f"nenhum estado aponta a etapa {accepted!r}: só o aceite do humano leva a ela")
            if row.get("category") not in TABLE_CATEGORIES:
                bad("state_category", where, f"a categoria {row.get('category')!r} não sai da tabela (só {', '.join(TABLE_CATEGORIES)}; "
                                             "queued, reopened, waiting e accepted vêm de fatos)")
    for t in sorted(structure):
        if t not in spec:
            bad("states", f"states.{t}", f"o tipo {t!r} não tem linha na tabela de estados")
    if records and RECORD not in spec:
        bad("states", f"states.{RECORD}", "há tipos de registro e nenhuma linha record na tabela de estados")
    return spec


def _board(b, i, seen, types, stage_phase, columns, hidden, reach, bad):
    bid = b.get("id") if isinstance(b, dict) else None
    where = f"boards[{i}]" if not bid else f"boards.{bid}"
    if not isinstance(bid, str) or not bid:
        bad("board", where, "todo board tem id")
        return
    if bid in seen:
        bad("duplicate_id", where, f"o board {bid!r} aparece duas vezes")
    seen.add(bid)
    flt = b.get("filter", {}) if isinstance(b.get("filter", {}), dict) else {}
    ftypes, fphases, fstages, fcats = (_set(flt.get(k)) for k in ("types", "phases", "stages", "categories"))
    for name, chosen, known in (("tipos", ftypes, types), ("fases", fphases, set(stage_phase.values())),
                                ("etapas", fstages, set(stage_phase))):
        if chosen is not None and chosen - known:
            bad("board_filter", where, f"{name} desconhecidos no filtro: {sorted(chosen - known)}")
    if fcats is not None and fcats - set(CATEGORIES):
        bad("category_unknown", where, f"categorias desconhecidas: {sorted(fcats - set(CATEGORIES))}")
    if b.get("columns") == BY_CATEGORY:
        cols, hide = columns, (None, None, hidden or None)
    elif b.get("columns") == BY_STAGE:
        if fphases is None or len(fphases) != 1:
            bad("board_columns", where, "by_stage pede um filtro de uma fase só")
            return
        (pid,) = fphases
        cols = [(s, (None, {s}, None)) for s, p in stage_phase.items() if p == pid]
        hide = (None, None, hidden or None)
    else:
        cols = _columns(b.get("columns"), where, bad, by_category=False)
        h = b.get("hidden") if isinstance(b.get("hidden"), dict) else {}
        hide = (_set(h.get("phases")), _set(h.get("stages")), _set(h.get("categories"))) if b.get("hidden") else None
    if not cols:
        return
    for stage, cat in sorted(reach.pairs(ftypes)):
        phase = stage_phase[stage]
        if not _takes((fphases, fstages, fcats), phase, stage, cat):
            continue
        if hide and _takes(hide, phase, stage, cat):
            continue
        takers = [cid for cid, m in cols if _takes(m, phase, stage, cat)]
        if not takers:
            bad("coverage_none", where, f"o par {stage} × {cat} não cai em nenhuma coluna")
        elif len(takers) > 1:
            bad("coverage_two", where, f"o par {stage} × {cat} cai em duas colunas ({', '.join(takers)})")


def _set(values):
    return set(values) if isinstance(values, list) and values else None


def _columns(spec, where, bad, by_category):
    """[(column id, (phases, stages, categories))] of a column list; the problems go to `bad`."""
    if not isinstance(spec, list) or not spec:
        bad("columns_empty", where, "a lista de colunas está vazia")
        return []
    out, seen = [], set()
    for i, c in enumerate(spec):
        cid = c.get("id") if isinstance(c, dict) else None
        cw = f"{where}.columns[{i}]" if not by_category else f"columns[{i}]"
        if not isinstance(cid, str) or not cid:
            bad("columns_empty", cw, "toda coluna tem id")
            continue
        if cid in seen:
            bad("duplicate_id", cw, f"a coluna {cid!r} aparece duas vezes")
        seen.add(cid)
        m = {"categories": c.get("categories")} if by_category else (c.get("match") if isinstance(c.get("match"), dict) else {})
        cats = _set(m.get("categories"))
        if by_category and not cats:
            bad("columns_empty", cw, f"a coluna {cid!r} não tem categoria")
            continue
        if cats is not None and cats - set(CATEGORIES):
            bad("category_unknown", cw, f"categorias desconhecidas: {sorted(cats - set(CATEGORIES))}")
        out.append((cid, (_set(m.get("phases")), _set(m.get("stages")), cats)))
    return out


def _takes(match, phase, stage, cat):
    phases, stages, cats = match
    return (phases is None or phase in phases) and (stages is None or stage in stages) and (cats is None or cat in cats)


class _Reach:
    """The stage x category pairs the items of each type can reach (itemboard.checks._Reach)."""

    def __init__(self, states, structure, records, stage_phase, accepted):
        self.states, self.structure, self.records = states, structure, records
        self.stage_phase, self.accepted = stage_phase, accepted

    def rows(self, t):
        table = self.states.get(RECORD if t in self.records else t)
        if not isinstance(table, dict):
            return []
        return [r for r in table.values() if isinstance(r, dict) and r.get("stage") in self.stage_phase
                and r.get("stage") != self.accepted and r.get("category") in TABLE_CATEGORIES]

    def flag(self, t, name):
        return isinstance(self.structure.get(t), dict) and bool(self.structure[t].get(name))

    def grown(self, t, cat):
        out = {cat, *GROWS.get(cat, ())}
        if self.flag(t, "evaluated"):
            out |= JUDGED.get(cat, set())
        return out | {"reopened"} if self.flag(t, "reopens") and cat in REOPENS else out

    def pairs(self, only):
        every_type = list(self.structure) + list(self.records)
        # a child follows its open mother, except into «Reaberto»: the reopening is the mother's
        every = {c for t in every_type for r in self.rows(t) for c in self.grown(t, r["category"])} - {"reopened"}
        out = set()
        for t in every_type:
            if only is not None and t not in only:
                continue
            follows = self.flag(t, "follows_parent")
            for r in self.rows(t):
                cats = every if follows else self.grown(t, r["category"])
                out |= {(r["stage"], c) for c in cats}
                if self.accepted and (follows or r["category"] in ("done", "closed")):
                    out.add((self.accepted, "accepted"))
        return out
