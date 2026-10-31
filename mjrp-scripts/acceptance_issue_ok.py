#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
acceptance_issue_ok.py - the effect `acceptance_stamped` gained with CC-ADR-0029 (step 2 of ADR-0019 section 2 for the
issue): a cell `OK do humano` of `docs/specs/uat.md` that BECAME the MJRP's OK (the form `uat_tracks_check._HUMAN_OK`) came
in a commit stamped `Human-accepted:` that names the issue (`issue:UAT-nn`) or a feature that links it, with no agent
`Co-Authored-By`. The OK is the human's; it is the commit his command makes, never a cell an agent wrote.

The incident is CC-ADR-0024's own (an agent wrote the OK by hand in his name), and the issue scope of CC-ADR-0029 makes the
cell the WHOLE effect of the acceptance, so the node-based `acceptance_stamped` does not cover it.

The cut is a place in the history: the commit that put the CC-ADR-0029 in `Accepted` (the first commit whose diff changes the
count of `**Status**: Accepted` in the ADR). A commit that is not an ancestor of it is judged; what came before stays. While the
ADR is not `Accepted` (or is not in this repository, as in a child that reads the kernel in place) the effect judges nothing and
`judge` says why in its note: never green by omission, and never a finding for a rule that did not start.

Called by `requirements_graph_check.py`; it needs no state of its own: `git` is the caller's runner `git(*args) -> (code, out)`.
"""
import re
from pathlib import Path

import uat_tracks_check as uat

ADR_NAME = "0029-the-board-moves-by-dragging.md"
UAT_REL = "docs/specs/uat.md"
FEATURES_REL = "docs/specs/features"
STATUS_ACCEPTED = "**Status**: Accepted"
ID_CELL, STATUS_CELL, OK_CELL = 0, 7, 8
FIXES = re.compile(r"^fixes:\s*\[([^\]]*)\]", re.M)


def ok_cells(text):
    """{UAT id: (Status cell, OK cell)} of every issue row of a uat.md text (rows outside the nine columns are not read)."""
    out = {}
    for line in text.splitlines():
        if not line.startswith("| UAT-"):
            continue
        cells = uat.cells(line)
        if len(cells) >= 9:
            out[cells[ID_CELL]] = (cells[STATUS_CELL], cells[OK_CELL])
    return out


def find_cut(git):
    """(sha, note): the commit that accepted the CC-ADR-0029, or (None, why the effect does not judge)."""
    code, listed = git("ls-files", "--", "*" + ADR_NAME)
    path = listed.splitlines()[0] if code == 0 and listed else None
    if path is None:
        return None, "a CC-ADR-0029 não está neste repositório: o OK do humano na issue não é julgado aqui"
    code, text = git("show", f"HEAD:./{path}")
    if code != 0 or STATUS_ACCEPTED not in text:
        return None, "a CC-ADR-0029 ainda não está `Accepted`: o OK do humano na issue ainda não é julgado"
    code, out = git("log", "--format=%H", "--reverse", f"-S{STATUS_ACCEPTED}", "--", f"./{path}")
    first = out.splitlines()[0] if code == 0 and out else None
    if first is None:
        return None, "o commit que aceitou a CC-ADR-0029 não está no histórico: o OK do humano na issue não é julgado"
    return first, None


def _linked(git, sha, feature, ident, status):
    """The feature of a stamp links the issue: the `fixes:` of its spec in that commit lists it, or the issue's Status cell cites it."""
    if re.search(rf"(?<![\w-]){re.escape(feature)}(?!\w)", status):
        return True
    code, listing = git("ls-tree", "--name-only", sha, f"./{FEATURES_REL}/")
    for name in (listing.splitlines() if code == 0 else []):
        if Path(name).name.startswith(feature + "-"):
            code, spec = git("show", f"{sha}:./{name}/spec.md")
            found = FIXES.search(spec) if code == 0 else None
            if found and ident in re.findall(r"UAT-\d+", found.group(1)):
                return True
    return False


def judge(git, brasilia, stamp, agent_signature):
    """(findings [(rule, message)], note or None). `stamp` is the pattern of `Human-accepted: <value>`; `brasilia(ts)` the stamp of a
    timestamp; `agent_signature` the pattern of an agent's Co-Authored-By."""
    cut, note = find_cut(git)
    if cut is None:
        return [], note
    code, log = git("log", "--topo-order", "--format=%H %ct %P", f"{cut}..HEAD", "--", f"./{UAT_REL}")
    found = []
    for line in (log.splitlines() if code == 0 else []):
        sha, ts, *parents = line.split()
        if not parents:
            continue
        code, after = git("show", f"{sha}:./{UAT_REL}")
        if code != 0:
            continue
        rows = ok_cells(after)
        befores = []
        for parent in parents:                      # a merge is judged too: the OK is new only when NO parent had it
            code, text = git("show", f"{parent}:./{UAT_REL}")
            befores.append(ok_cells(text) if code == 0 else {})
        for ident, (status, ok) in sorted(rows.items()):
            if not uat.HUMAN_OK.match(ok) or any(uat.HUMAN_OK.match(b.get(ident, ("", ""))[1]) for b in befores):
                continue
            message = git("show", "-s", "--format=%B", sha)[1]
            stamps = stamp.findall(message)
            who = f"{ident}: o `OK do humano` passou a `{ok}` em {sha[:7]} ({brasilia(ts)})"
            if len(stamps) > 1:
                found.append(("acceptance_stamped", f"{who} num commit com {len(stamps)} carimbos `Human-accepted:` — um aceite, um carimbo"))
            elif not stamps or not (stamps[0] in (f"issue:{ident}", "requirements")
                                    or (re.fullmatch(r"F\d{2,}", stamps[0]) and _linked(git, sha, stamps[0], ident, status))):
                found.append(("acceptance_stamped", f"{who} sem o carimbo `Human-accepted: issue:{ident}` (nem o da feature que a liga) — o OK é do "
                              "humano e vem do commit que o comando da tela dele faz (CC-ADR-0029); escrito à mão não vale"))
            elif agent_signature.search(message):
                found.append(("acceptance_stamped", f"{who} num commit com `Human-accepted:` e `Co-Authored-By:` de agente — "
                              "o humano comita sem a assinatura do agente"))
    return found, None
