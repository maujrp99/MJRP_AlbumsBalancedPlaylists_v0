#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
board_states_check.py - the judge of the single graph of states and of the board's record (F275, UAT-592).

  python3 mjrp-scripts/board_states_check.py [root]          the graph, and the record of every project of the repository at `root`
  python3 mjrp-scripts/board_states_check.py --graph-only    only the graph (the kernel's file)

The graph (`board_states.json`) fails when: a state has no Portuguese or English name, a category the board does not have, or a
spec status the specs do not use; an edge names a state that does not exist, has an actor that is not `agent`, `order` or
`signed`, or is `signed` with no stamp of the MJRP; the same passage appears twice; a state cannot be reached from the initial one.

The record (`<main checkout>/<project>/.mjrp/board.jsonl`, `board_move.py`), judged by each item's CURRENT passage, fails when: a line is a passage the graph lacks (a `seed` line
starts an item and is exempt; a `signed` line marked `outside` is the MJRP's decision over a passage nobody recorded before it,
and is named); a `signed` line cites a commit that does not carry the edge's stamp, does not decide that item, or signs a second passage of it; an `order` line has no words of the MJRP; a
feature whose spec left `Draft` at `main` has no record (it started, or was delivered, without a passage); a feature's spec at
`main` says a state the record does not (the merge done with no passage, a spec closed by hand). The wiki's drawings of the graph
(`docs/wiki/graphs/`, where the repository has them) must be the ones `board_move.py graphs` writes.

Exit 0 clean | 1 findings | 2 not evaluable (no graph, git did not answer). Stdlib only; prose in Portuguese.
"""
import argparse
import json
import re
import subprocess
import sys
from collections import deque
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401, E402
import _fm  # noqa: E402
import board_move as bm  # noqa: E402

# mirror of the Control Center's itemboard/model.py CATEGORIES (the scripts cannot import the app, ADR-0015)
CATEGORIES = ("not_started", "queued", "reopened", "in_progress", "waiting", "waiting_human", "waiting_agent", "evaluating",
              "awaiting_merge", "done", "closed", "accepted", "off")
SPEC_STATUSES = ("Draft", "In progress", "Done", "Accepted", "Cancelled", "Deferred")
SHOWN = 30  # the findings printed; the count says the rest
IN_FLIGHT_SPEC = {"draft", "in progress"}  # a passage on a branch has not reached the spec at main yet


def spec_statuses(state):
    """The spec statuses a state allows (`spec_status`: one, or a list whose first is the usual one)."""
    value = state.get("spec_status")
    return [value] if isinstance(value, str) else list(value or [])


def graph_problems(graph):
    out = []
    states, edges = graph.get("states") or {}, graph.get("edges") or []
    if graph.get("initial") not in states:
        out.append(f"o estado inicial {graph.get('initial')!r} não é um estado do grafo")
    for sid, s in states.items():
        name = s.get("label") or {}
        if not (name.get("pt") and name.get("en")):
            out.append(f"o estado {sid} não tem o nome em português e em inglês")
        if s.get("category") not in CATEGORIES:
            out.append(f"o estado {sid}: a categoria {s.get('category')!r} não é do board")
        wanted = spec_statuses(s)
        if not wanted or any(w not in SPEC_STATUSES for w in wanted):
            out.append(f"o estado {sid}: o status da spec {s.get('spec_status')!r} não é um dos da spec ({', '.join(SPEC_STATUSES)})")
    seen = set()
    for e in edges:
        pair = (e.get("from"), e.get("to"))
        for end in pair:
            if end not in states:
                out.append(f"a passagem {pair[0]} → {pair[1]} nomeia {end!r}, que não é um estado")
        if e.get("actor") not in bm.ACTORS:
            out.append(f"a passagem {pair[0]} → {pair[1]}: o ator {e.get('actor')!r} não é agent, order nem signed")
        if e.get("actor") == "signed" and e.get("stamp") not in bm.STAMPS:
            out.append(f"a passagem {pair[0]} → {pair[1]} é assinada e não diz o carimbo do MJRP ({', '.join(bm.STAMPS)})")
        if e.get("requires") not in (None, "closure"):
            out.append(f"a passagem {pair[0]} → {pair[1]}: `requires` {e.get('requires')!r} não é `closure`")
        if not e.get("says"):
            out.append(f"a passagem {pair[0]} → {pair[1]} não diz o que é")
        if pair in seen:
            out.append(f"a passagem {pair[0]} → {pair[1]} aparece duas vezes")
        seen.add(pair)
    reach, todo = set(), deque([graph.get("initial")])
    while todo:
        s = todo.popleft()
        if s in reach:
            continue
        reach.add(s)
        todo.extend(e["to"] for e in edges if e.get("from") == s)
    for sid in states:
        if sid not in reach:
            out.append(f"o estado {sid} não se alcança a partir de {graph.get('initial')}")
    return out + lifecycle_problems(graph)


EVIDENCE = ("commit", "path", "prototype_approved", "plan", "tasks", "first_task", "merged", "order")
BOARD_STAGES = ("backlog", "explore", "frame", "draw", "ready", "specify", "plan", "tasks", "execute_verify", "homologation",
                "accepted", "deploy")  # mirror of board_defaults.json `phases` (the stages of the harness's board)


def lifecycle_problems(graph):
    """The stage of the cycle (lote 1b): every stage a stage of the board with its phase and its types, every edge between stages of
    one type with evidence or a stamp, every stage reachable from the initial one of its types."""
    out = []
    life = graph.get("lifecycle")
    if not isinstance(life, dict):
        return ["o grafo não tem `lifecycle` (a etapa do ciclo, lote 1b)"]
    stages, edges = life.get("stages") or {}, life.get("edges") or []
    for sid, st in stages.items():
        if sid not in BOARD_STAGES:
            out.append(f"a etapa {sid} não é um estágio do board")
        if not (st.get("label") or {}).get("pt") or not st.get("phase") or not st.get("types"):
            out.append(f"a etapa {sid} não tem o nome, a fase ou os tipos")
    for kind, first in (life.get("initial") or {}).items():
        if first not in stages:
            out.append(f"a etapa inicial de {kind}, {first!r}, não é uma etapa")
    seen = set()
    for e in edges:
        pair = (e.get("from"), e.get("to"))
        if pair[0] not in stages or pair[1] not in stages:
            out.append(f"a passagem de etapa {pair[0]} → {pair[1]} nomeia uma etapa que não existe")
            continue
        if pair in seen:
            out.append(f"a passagem de etapa {pair[0]} → {pair[1]} aparece duas vezes")
        seen.add(pair)
        if e.get("actor") == "signed":
            if e.get("stamp") not in bm.STAMPS:
                out.append(f"a passagem de etapa {pair[0]} → {pair[1]} é assinada e não diz o carimbo do MJRP")
        elif not e.get("evidence") or any(k not in EVIDENCE for k in e["evidence"]):
            out.append(f"a passagem de etapa {pair[0]} → {pair[1]} não diz a evidência ({', '.join(EVIDENCE)})")
    for kind, first in (life.get("initial") or {}).items():
        reach, todo = set(), [first]
        while todo:
            x = todo.pop()
            if x in reach:
                continue
            reach.add(x)
            todo += [e["to"] for e in edges if e.get("from") == x]
        for sid, st in stages.items():
            if kind in (st.get("types") or []) and sid not in reach:
                out.append(f"a etapa {sid} não se alcança a partir de {first} ({kind})")
    return out


def stamp_of(top, sha):
    got = subprocess.run(["git", "-C", str(top), "log", "-1", "--format=%B", sha], capture_output=True, text=True, timeout=30)
    if got.returncode != 0:
        return None
    return {t for t in bm.STAMPS if re.search(rf"^{t}:", got.stdout, re.M)}


def spec_at_main(top, rel, folder):
    prefix = "" if rel == "." else f"{rel}/"
    text = bm.show_at(top, "main", f"{prefix}{bm.FEATURES}/{folder}/spec.md")
    return str((_fm.parse(text) or {}).get("status") or "").strip() if text else None


def stamp_touches(top, rel, sha, item, to):
    """Whether the stamped commit `sha` decided this passage of this item: an order (queued, prep) changes the project's list and the
    item is in it before or after; an acceptance or a reopening changes the item's own spec."""
    prefix = "" if rel == "." else f"{rel}/"
    got = subprocess.run(["git", "-C", str(top), "diff-tree", "--no-commit-id", "--name-only", "-r", "-m", "--first-parent", sha],
                         capture_output=True, text=True, timeout=30)
    changed = got.stdout.split() if got.returncode == 0 else []
    if to in ("queued", "prep"):
        if f"{prefix}{bm.PRIORITY}" not in changed:
            return False
        listed = set(bm.priority_ids(bm.show_at(top, sha, f"{prefix}{bm.PRIORITY}")))
        listed |= set(bm.priority_ids(bm.show_at(top, f"{sha}^", f"{prefix}{bm.PRIORITY}")))
        return item in listed
    return any(p.startswith(f"{prefix}{bm.FEATURES}/{item}-") and p.endswith("/spec.md") for p in changed)


def stage_problems(rel, graph, lines, top="."):
    """Each item's current stage passage is an edge of the cycle and leaves from where the item stood."""
    out, previous, newest = [], {}, {}
    for e in lines:
        previous[e["item"]] = newest.get(e["item"])
        newest[e["item"]] = e
    seen_seed = {}
    for e in lines:  # a migration line other than the item's first is only the MJRP's checked list, once, to a Discovery stage
        if e.get("actor") != "seed":
            continue
        n = seen_seed[e["item"]] = seen_seed.get(e["item"], 0) + 1
        if n > 1 and not (e.get("by") == bm.LIST_BY and (e.get("order") or "").strip() and e.get("to") in bm.LISTED_STAGES
                          and n == 2):
            out.append(f"{rel}: {e['item']}, etapa ({str(e.get('at', '?'))[:16]}): uma linha de migração que não é a lista conferida "
                       f"pelo MJRP (uma vez, com as palavras dele, para {', '.join(bm.LISTED_STAGES)})")
    for e in lines:  # every signed stage line carries the stamp of its edge
        if e.get("actor") == "signed":
            edge = bm.stage_edge(graph, e.get("from") or graph["lifecycle"]["initial"].get(bm.kind_of(e["item"])), e.get("to"))
            marks = stamp_of(top, str(e.get("stamp") or ""))
            if marks is None or (edge and edge.get("stamp") and edge["stamp"] not in marks):
                out.append(f"{rel}: {e['item']}, etapa ({str(e.get('at', '?'))[:16]}): a assinatura não cita um commit com o carimbo da "
                           "passagem")
    for item, e in sorted(newest.items()):
        if e.get("actor") == "seed":
            continue
        before = (previous.get(item) or {}).get("to")
        where = f"{rel}: {item}, etapa ({str(e.get('at', '?'))[:16]})"
        start = e.get("from") or graph["lifecycle"]["initial"].get(bm.kind_of(item))
        if e.get("from") != before:
            out.append(f"{where}: a passagem diz que saiu de «{bm.stage_label(graph, e.get('from'))}», e a linha anterior o deixou em "
                       f"«{bm.stage_label(graph, before)}»")
        edge = bm.stage_edge(graph, start, e.get("to"))
        if edge is None:
            out.append(f"{where}: «{bm.stage_label(graph, start)}» → «{bm.stage_label(graph, e.get('to'))}» não é uma passagem do ciclo")
        elif edge["actor"] == "signed" and e.get("actor") != "signed":
            out.append(f"{where}: «{bm.stage_label(graph, e.get('to'))}» é do MJRP e foi gravada por {e.get('actor')}")
    return out


def record_problems(top, rel, graph, events):
    """The findings of the record as it stands: each item's CURRENT passage is judged (a line later passages left behind is history,
    and a sensor that stays red over history no one can rewrite is a sensor nobody reads); a stamp is worth one passage."""
    out, previous, newest, uses = [], {}, {}, {}
    stage_lines = [e for e in events if e.get("dim") == "stage"]
    events = [e for e in events if (e.get("dim") or "state") == "state"]
    out += stage_problems(rel, graph, stage_lines, top)
    for e in events:
        item = e.get("item")
        previous[item] = newest.get(item)
        newest[item] = e
        if e.get("actor") == "signed" and e.get("stamp"):
            uses.setdefault((e["stamp"], item), []).append(e)
    for item, e in sorted(newest.items()):
        frm, to, actor = e.get("from"), e.get("to"), e.get("actor")
        before = (previous.get(item) or {}).get("to")
        where = f"{rel}: {item} ({str(e.get('at', '?'))[:16]})"
        if to not in graph["states"]:
            out.append(f"{where}: o estado {to!r} não é do grafo")
            continue
        if actor == "seed":
            continue
        if frm != before:
            out.append(f"{where}: a passagem diz que saiu de «{bm.label(graph, frm)}», e a linha anterior o deixou em "
                       f"«{bm.label(graph, before)}»")
        edge = bm.edge(graph, frm or graph["initial"], to)
        if e.get("outside"):
            out.append(f"{where}: o MJRP decidiu «{bm.label(graph, to)}» com o item em «{bm.label(graph, frm)}»: a passagem antes "
                       f"desta não foi gravada (grave a que falta e a dele de novo, ou siga com a próxima passagem)")
        elif edge is None:
            out.append(f"{where}: «{bm.label(graph, frm)}» → «{bm.label(graph, to)}» não é uma passagem do grafo")
            continue
        elif edge["actor"] == "signed" and actor != "signed":
            out.append(f"{where}: «{bm.label(graph, to)}» é do MJRP e foi gravada por {actor}")
        elif edge["actor"] == "order" and actor == "order" and not (e.get("order") or "").strip():
            out.append(f"{where}: decisão do MJRP gravada sem as palavras dele")
    # every signed line of the history, not only the newest: a forged signature hidden under a later passage is still named
    for e in events:
        if e.get("actor") != "signed":
            continue
        item, to, sha = e.get("item"), e.get("to"), str(e.get("stamp") or "")
        where = f"{rel}: {item} ({str(e.get('at', '?'))[:16]})"
        edge = bm.edge(graph, e.get("from") or graph["initial"], to)
        want = edge.get("stamp") if edge and edge.get("stamp") else {"accepted": "Human-accepted", "reopened": "Human-reopened",
                                                                       "queued": "Human-prioritized", "prep": "Human-prioritized"}.get(to)
        marks = stamp_of(top, sha)
        if marks is None:
            out.append(f"{where}: a assinatura cita o commit {sha!r}, que não existe")
        elif want and want not in marks:
            out.append(f"{where}: o commit {sha[:9]} não leva `{want}:`")
        elif not stamp_touches(top, rel, sha, item, to):
            out.append(f"{where}: o commit carimbado {sha[:9]} não decide «{bm.label(graph, to)}» de {item}")
        elif len(uses.get((sha, item), ())) > 1:
            out.append(f"{where}: o commit carimbado {sha[:9]} assina mais de uma passagem de {item}: um carimbo vale uma vez")
    return list(dict.fromkeys(out))


def feature_problems(top, rel, graph, recorded):
    out = []
    for fid, folder in sorted(bm.features_of(top, rel).items(), key=lambda kv: int(kv[0][1:])):
        status = spec_at_main(top, rel, folder)
        if status is None:
            continue  # not at main yet: born on a branch
        state = recorded.get(fid, {}).get("to")
        if state is None:
            if status.casefold() != "draft":
                out.append(f"{rel}: {fid} está `{status}` na `main` e não tem registro no board: passou sem passagem")
            continue
        wanted = [w.casefold() for w in spec_statuses(graph["states"].get(state, {}))]
        if not wanted or status.casefold() in wanted:
            continue
        if set(wanted) & IN_FLIGHT_SPEC and status.casefold() in IN_FLIGHT_SPEC:
            continue
        out.append(f"{rel}: {fid} está em «{bm.label(graph, state)}» no registro e `{status}` na `main` (o registro diz "
                   f"`{' ou '.join(spec_statuses(graph['states'][state]))}`): a passagem não foi gravada")
    return out


def problems(root, graph_only=False, graph=None):
    """[finding] - empty when clean; raises bm.NotEvaluable."""
    graph = graph or bm.load_graph()
    out = graph_problems(graph)
    if graph_only or out:
        return out
    top = bm.top_of(root)
    main = bm.main_root(root)
    stale = bm.graphs(top, check=True, graph=graph)
    out += [f"o desenho {f} não bate com o grafo: rode `python3 mjrp-scripts/board_move.py graphs`" for f in stale or ()]
    for rel in bm.projects(top):
        path = bm.store_of(main, rel)
        if not path.exists():
            continue  # a project not migrated yet (`board_move.py seed`): nothing recorded to judge
        events = bm.read_events(path)
        out += record_problems(top, rel, graph, events)
        out += feature_problems(top, rel, graph, bm.current(events))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="O juiz do grafo único de estados e do registro do board (F275).")
    ap.add_argument("root", nargs="?", default=".")
    ap.add_argument("--graph-only", action="store_true")
    args = ap.parse_args(argv)
    try:
        found = problems(args.root, args.graph_only)
    except bm.NotEvaluable as exc:
        print(f"board_states_check: não avaliável: {exc}", file=sys.stderr)
        return 2
    if not found:
        print("board_states_check: o grafo e o registro conferem")
        return 0
    print(f"board_states_check: {len(found)} achado(s)")
    for f in found[:SHOWN]:
        print(f"  - {f}")
    if len(found) > SHOWN:
        print(f"  … e mais {len(found) - SHOWN}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
