#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""requirement_evidence.py - which requirements of a feature's spec.md have no test that proves them (`verified_by::`).

One rule, two readers (F116, UAT-391). The requirements graph (requirements_graph_check.py) reads the requirements of every
spec.md through `spec_requirements` and refuses a closed feature with a requirement that has no `verified_by::`
(`edge_verified_by` for a strict REQ-nn, `done_feature_complete` for a project-style REQ-F-05). The Control Center loads this
file BY PATH (the way it loads uat_tracks_check.py) and asks `unproven` before it asks the MJRP's finger for an acceptance: an
acceptance the graph would refuse in the pre-commit is refused on the screen first, naming the requirement - not after the
Touch ID, as «o commit falhou».

Incident (ADR-0002 asks for one): 2026-10-27 15:18. The MJRP dragged F60 and F58 to «Aceito», confirmed with the Touch ID, and the
screen said only «o commit falhou (o motivo está acima)»: ten Done features had a requirement with no `verified_by::`, the graph
refused the acceptance in the pre-commit, and nothing said so before the finger.

Stdlib only, no sibling import: it runs inside the app's process, loaded by path, and must not touch `sys.path`.

  spec_requirements(body) -> (strict, wide)   {REQ-nn: [verified_by...]}, {REQ-F-05 and REQ-nn: [verified_by...]}
  unproven(spec_text, status="Accepted")      the requirement ids the graph refuses at that status, in the spec's order

Usage (by hand): python3 mjrp-scripts/requirement_evidence.py <spec.md>   -> the unproven ids, one a line; exit 1 if any
"""
import json
import re
import sys
from pathlib import Path

REQUIREMENT_EVIDENCE_API = 1
RULES = Path(__file__).with_name("requirements_graph_rules.json")

_WIDE_REQ_BODY = r"REQ-(?:[A-Za-z][A-Za-z0-9]*-)*\d{2,}"          # REQ-01, and the project style REQ-F-05
# a definition is a heading or a bracketed/bold item -- a bare `- REQ-F-11 -> lives in F04` is a pointer
WIDE_REQ = re.compile(r"^(?:#{2,6}\s+|[-*]\s+(?:\*\*\[?|\[))(" + _WIDE_REQ_BODY + r")\b")
STRICT_REQ = re.compile(r"^(?:#{2,6}\s+|[-*]\s+(?:\*\*)?\[?)(REQ-\d{2,})\b")
INLINE_FIELD = re.compile(r"^\s*(?:[-*]\s+)?([a-z_]+)::\s*(.+)$")
_FRONTMATTER = re.compile(r"\A﻿?---[ \t]*\r?\n.*?\r?\n---[ \t]*(?:\r?\n|\Z)", re.S)


def spec_requirements(body):
    """The requirements a spec.md body defines and the `verified_by::` under each, read line by line: a `verified_by::` belongs to
    the requirement defined last above it. `strict` holds the REQ-nn; `wide` every id the wider pattern sees (REQ-F-05 too)."""
    strict, wide = {}, {}
    cur = last = None
    for line in body.splitlines():
        m = STRICT_REQ.match(line)
        if m:
            cur = last = m.group(1)
            strict.setdefault(cur, [])
            wide.setdefault(last, [])
            continue
        m = WIDE_REQ.match(line)
        if m:
            cur, last = None, m.group(1)
            wide.setdefault(last, [])
            continue
        f = INLINE_FIELD.match(line)
        if f and f.group(1) == "verified_by":
            if cur:
                strict[cur].append(f.group(2).strip())
            if last:
                wide[last].append(f.group(2).strip())
    return strict, wide


def _rule(rules):
    rules = rules if rules is not None else json.loads(RULES.read_text(encoding="utf-8"))
    edge = next(e for e in rules["edges"] if e["name"] == "verified_by")
    return rules["statuses"], edge


def enforced(status, rules=None):
    """Whether a feature at `status` must carry the evidence (the edge's `enforced_from`, by the lifecycle's order)."""
    statuses, edge = _rule(rules)
    frm = edge.get("enforced_from", "always")
    if frm == "always":
        return True
    return status in statuses and frm in statuses and statuses.index(status) >= statuses.index(frm)


def unproven(spec_text, status="Accepted", rules=None):
    """The requirements of the spec that the graph refuses at `status`: a REQ-nn with fewer `verified_by::` than the edge's
    `min` once the edge is enforced (edge_verified_by), and a project-style REQ-F-05 with none once the feature is closed
    (done_feature_complete). Empty when the status charges neither."""
    _statuses, edge = _rule(rules)
    body = _FRONTMATTER.sub("", spec_text, count=1)
    strict, wide = spec_requirements(body)
    out = [r for r, ver in strict.items() if len(ver) < edge["min"]] if enforced(status, rules) else []
    closed = status in ("Done", "Accepted")          # done_feature_complete: closed, whatever the edge says
    out += [r for r, ver in wide.items() if closed and r not in strict and not ver]
    order = list(wide)
    return sorted(set(out), key=order.index)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__.strip().splitlines()[-1].strip())
        sys.exit(2)
    missing = unproven(Path(sys.argv[1]).read_text(encoding="utf-8"))
    for rid in missing:
        print(rid)
    sys.exit(1 if missing else 0)
