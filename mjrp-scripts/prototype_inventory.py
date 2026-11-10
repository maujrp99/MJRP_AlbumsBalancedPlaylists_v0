#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""prototype_inventory.py -- every item of the prototype inventory ends in a destination.

02/10/2026 (EP-07, reverse mapping): when `docs/specs/info-arch.md` has the section
`## Inventário do protótipo`, each item must end in a destination -- covered/evolved with a REQ that
exists in a feature's spec.md, or cut with a written reason. "Pendente" is a warning only once a spec
is approved. The prototype is a baseline, not a mold: what is checked is destination, never sameness.

18/10/2026 (fin-control, 64 W11 warnings): a project on the requirements graph covers an item with a NODE of
`docs/specs/requirements/` (`S-12`, `UC-xx`, `EA-xx`, `NFR-xx`), not with the REQ-nn that lives inside a feature's spec.md.
Both are accepted; the node IDs are the graph's own (requirements_graph_check), never a second list.

05/10/2026 (S-77): extracted from SDD_chain_artifacts_check.py, retired when every child moved to the
requirements graph (S-79). The REQs now live in `docs/specs/features/<F-ID>-<slug>/spec.md`; a flat
`docs/specs/spec.md` is still read while a project has one.

Used by doctor.py (W11). Standalone: python3 mjrp-scripts/prototype_inventory.py [root] -- prints the
gaps, always exits 0 (informative).
"""
import re
import sys
from pathlib import Path

INVENTORY_FILE = Path("docs") / "specs" / "info-arch.md"
INVENTORY_HEADING = re.compile(r"^##\s+Invent[aá]rio do prot[oó]tipo\s*$", re.I | re.M)
SPEC_APPROVED = re.compile(r"(?i)status\W{0,4}\s*(approved|aprovad[oa])")
STATES = {"pendente": "pendente", "coberto": "coberto", "evoluido": "evoluido", "evoluído": "evoluido",
          "cortado": "cortado"}


def _inventory_rows(text):
    """Rows of the table under '## Inventário do protótipo': [id, function, where, kind, state, req]."""
    m = INVENTORY_HEADING.search(text)
    if not m:
        return None
    body = text[m.end():]
    nxt = re.search(r"^##\s", body, re.M)
    body = body[:nxt.start()] if nxt else body
    rows = []
    for line in body.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if not cells or not re.match(r"^[A-Z]{1,4}-\d+$", cells[0]):
            continue                                    # header and separator rows
        rows.append((cells + [""] * 6)[:6])
    return rows


def _spec_texts(root):
    specs = sorted((root / "docs" / "specs" / "features").glob("*/spec.md"))
    flat = root / "docs" / "specs" / "spec.md"
    if flat.exists():
        specs.append(flat)
    return [p.read_text(encoding="utf-8", errors="replace") for p in specs]


def _graph(root):
    """The graph checker's view, or None when this copy of the sensors has none (then only REQ-nn counts):
    {"nodes": IDs of the nodes that exist, "live": those that still count (not Cancelled, not superseded),
     "node_in_text": regex of a node ID, "local_in_text": regex of a feature's own ID (REQ-01, REQ-F-05, NFR-F-02)}.
    The patterns are the sensor's own; an empty `nodes` is a project with no node, so no ID is one."""
    try:
        import requirements_graph_check as rg
        view = rg.requirement_graph_view(root)
        return {**view, "node_in_text": rg.NODE_ID_IN_TEXT, "local_in_text": rg.SPEC_LOCAL_ID_IN_TEXT}
    except Exception:
        return None


def inventory_gaps(root):
    """Warnings for prototype-inventory items with no destination. None = no inventory to check."""
    root = Path(root)
    ia = root / INVENTORY_FILE
    if not ia.exists():
        return None
    rows = _inventory_rows(ia.read_text(encoding="utf-8", errors="replace"))
    if rows is None:
        return None
    texts = _spec_texts(root)
    graph = _graph(root)
    local = graph["local_in_text"] if graph else re.compile(r"REQ-\d+")
    spec_reqs = set(r for t in texts for r in local.findall(t))
    approved = any(SPEC_APPROVED.search(t) for t in texts)
    out, seen = [], set()
    for iid, _fn, _where, _kind, state, dest in rows:
        if iid in seen:
            out.append(f"inventario: {iid} repetido -- ID de item e' unico e estavel")
        seen.add(iid)
        st = STATES.get(state.lower().strip("* "))
        reqs = local.findall(dest)
        cited = graph["node_in_text"].findall(dest) if graph else []
        has_text = bool(re.sub(r"[\s\-—–]|motivo:?", "", dest, flags=re.I))
        if st is None:
            out.append(f"inventario: {iid} com estado '{state}' -- use pendente, coberto, evoluido ou cortado")
        elif st == "cortado":
            if not has_text:
                out.append(f"inventario: {iid} cortado sem motivo escrito")
        elif st in ("coberto", "evoluido"):
            if not reqs and not cited:
                out.append(f"inventario: {iid} {st} sem REQ -- em que requisito ele vive? (um no do grafo, S-xx, ou REQ-nn)")
            for n in cited:
                if n not in graph["nodes"]:
                    out.append(f"inventario: {iid} aponta {n}, que nao existe em docs/specs/requirements/")
                elif n not in graph["live"]:
                    now, hops = n, 0
                    while now in graph["successor"] and hops < 10:       # S-01 -> S-59 -> S-62: cite the one in force
                        now, hops = graph["successor"][now], hops + 1
                    tail = f"substituido por {now} -- cite o vigente" if now != n and now in graph["live"] else "Cancelled -- nao e cobertura"
                    out.append(f"inventario: {iid} aponta {n}, {tail}")
            if texts:
                for r in reqs:
                    if r not in spec_reqs:
                        out.append(f"inventario: {iid} aponta {r}, que nao existe em nenhum spec.md de feature")
        elif st == "pendente" and approved:
            out.append(f"inventario: {iid} ainda pendente com o spec.md aprovado -- vira REQ ou e' cortado com motivo")
    return out


if __name__ == "__main__":
    gaps = inventory_gaps(sys.argv[1] if len(sys.argv) > 1 else ".")
    if gaps is None:
        print("[prototype_inventory] sem inventário do protótipo no info-arch.md -- nada a conferir")
    else:
        print("\n".join(gaps) if gaps else "[prototype_inventory] todo item com destino")
    sys.exit(0)
