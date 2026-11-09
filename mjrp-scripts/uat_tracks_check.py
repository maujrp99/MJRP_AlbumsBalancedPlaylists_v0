#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
uat_tracks_check.py - does `docs/specs/uat.md` keep the two tracks apart? The judge of the `uat` catalog item (uat@3, CM-0081).

Born 2026-10-19 (F48, the MJRP): the board and the acceptance list mixed what waits for the MJRP with what the judges and agents
open and close among themselves. The table gets the column `Reportado por` (after `Reportado em`):
  - `MJRP`   - the human track: the MJRP opened it, only his OK closes it;
  - `juiz`   - a judge, critic, verifier or recheck opened it: the agent track, closed by the independent recheck;
  - `agente` - any other agent opened it: the same track.
An agent-opened row goes up to the human track only when it asks the MJRP to DECIDE, to SEE (a defect visible by using the product)
or is a SECURITY matter (F76, the MJRP, 2026-10-25 21:55), and says so in the same cell:
`agente · prioridade: humano — decidir|ver|segurança: <motivo>`. A technical P0 stays on the agent track (it closes by the recheck).
The old mark `— P0: <motivo>` is valid only on rows reported up to 2026-10-25 21:55 (legacy, like TRACKS_SINCE); after that it is a gap.

What is a gap (exit 1):
  - uat_tracks_header: the issue table header is not the nine columns with `Reportado por` right after `Reportado em`;
  - uat_tracks_value: the cell is not `MJRP`, `juiz` or `agente` (+ the optional priority);
  - uat_tracks_priority: `prioridade: humano` malformed (needs `— decidir|ver|segurança: <motivo>`), on a MJRP row (already human),
    `— P0:` on a row reported after 2026-10-25 21:55, or (legacy rows) `P0` on a row whose Gravidade is not P0;
  - uat_tracks_copy (F158, S-208): a row of `Tipo` `copy` opened by a judge or an agent without `prioridade: humano`: a text change is
    closed by the MJRP's OK whoever opened it, so it is on his track from the start (`— ver: <motivo>`), and the recheck never closes it;
  - uat_tracks_marker: the `**Aberta por:**` marker of the description contradicts the column (the marker is the machine's
    reading of "an agent opened it": a MJRP row has none; a juiz/agente row reported from 2026-10-19 19:34 has it);
  - uat_tracks_ok: the OK cell of a MJRP row cites the independent recheck or the green tests (only the human closes his), or the OK
    of an agent row reported from 2026-10-19 19:34 is neither `recheck independente: <relatório>, <data hora>` nor
    `testes verdes: <comando>, <data hora>` (AGENTS.md § Duas trilhas, the MJRP 2026-10-27 17:43: what touches no gate closes with its
    green tests) nor the MJRP's (a row that went up to the human track by `prioridade: humano` closes only with his).
Old rows are not judged on the marker/OK rules (they predate the column); the header and the value are judged on all.
A file with no issue rows, or no `docs/specs/uat.md`: exit 0 (nothing to judge). Exit 2: the path is not a folder.

Usage:
  python3 mjrp-scripts/uat_tracks_check.py <project> [--json] [--quiet]
Stdlib only (ADR-0015); vendored into every child with the kernel.
"""
import json
import re
import sys
from pathlib import Path

UAT_FILE = "docs/specs/uat.md"
OWNER = "mjrp-specifying-sdd-artifacts"
TRACKS_SINCE = "2026-10-19 19:34"      # a row reported from the moment the MJRP approved the tracks (F48) is judged on the marker and OK rules
PRIO_P0_UNTIL = "2026-10-25 21:55"      # the legacy mark `— P0:` is valid only on a row reported up to this moment (F76); after it, a technical P0 does not go up
HEAD = ["ID", "Contexto", "Tipo", "Gravidade", "Reportado em", "Reportado por", "Descrição", "Status", "OK do humano"]
VALUES = ("MJRP", "juiz", "agente")
COPY_KIND = "copy"                      # F158: the `Tipo` of a small text change; its OK is always the MJRP's

_CELLS = re.compile(r"(?<!\\)\|")
_VALUE = re.compile(r"^(?P<who>MJRP|juiz|agente)(?:\s+·\s+(?P<prio>prioridade: humano.*))?$")
_PRIO = re.compile(r"^prioridade: humano\s+—\s+(?P<why>decidir|ver|segurança|P0):\s*(?P<reason>\S.*)$")
# the same reading as the Control Center (uat.py `split_opened_by`): the marker is the LAST part, after a `<br>`; a mention in the text is not it
_MARKER = re.compile(r"\s*<br\s*/?>\s*\*\*Aberta por:\*\*[ \t]*(?P<value>[^<]*?)\s*$", re.I)
# what closes an agent row by machine: the independent recheck, or the green tests when the fix touches no gate (AGENTS.md § Duas trilhas)
_RECHECK = re.compile(r"^(?:recheck independente|testes verdes):\s*\S.*,\s*\d{4}-\d{2}-\d{2}", re.I)
# the two words alone, in any case and in any shape: on a row of the MJRP they are a gap even when the rest of the form is wrong
_MACHINE_WORDS = re.compile(r"^\s*(?:recheck independente|testes verdes)\b", re.I)
# the MJRP's own OK: `MJRP, AAAA-MM-DD ...` (the template) or `AAAA-MM-DD ... (MJRP, ...)` (the rows he closed); a "MJRP" inside a
# recheck's report path is not his OK
_HUMAN_OK = re.compile(r"^(?:MJRP,\s*\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}[^()]*\(MJRP\b)")


# The API the Control Center's acceptance rule loads by path (CC-ADR-0024 section 2, "one reader, the kernel's"): the OK that closes an
# agent row (RECHECK, or the MJRP's own, HUMAN_OK), the date from which the rows are judged (TRACKS_SINCE) and the cell splitter (cells).
UAT_TRACKS_API = 2                                  # 2 (2026-10-20): VALUE and CELLS too -- the app copies neither the grammar of `Reportado por` nor the cut of a cell
RECHECK, HUMAN_OK = _RECHECK, _HUMAN_OK
VALUE, CELLS = _VALUE, _CELLS


def cells(line):
    return [p.strip() for p in _CELLS.split(line)[1:-1]]


def check(root):
    """{"gaps": [{code, file, line, message, owner}], "rows": {MJRP: n, juiz: n, agente: n}}."""
    path = Path(root) / UAT_FILE
    out = {"gaps": [], "rows": dict.fromkeys(VALUES, 0)}
    if not path.is_file():
        return out

    def gap(number, code, message):
        out["gaps"].append({"code": code, "file": UAT_FILE, "line": number, "message": message, "owner": OWNER})

    head_ok = False
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if line.startswith("| ID "):
            head_ok = cells(line) == HEAD
            if not head_ok:
                gap(number, "uat_tracks_header", "o cabeçalho da tabela não tem a coluna `Reportado por` logo depois de `Reportado em` "
                    "(as nove colunas: " + " · ".join(HEAD) + ")")
            continue
        if not line.startswith("| UAT-"):
            continue
        row = cells(line)
        if not head_ok or len(row) < len(HEAD):
            gap(number, "uat_tracks_header", f"{row[0] if row else 'linha'}: a linha não tem as nove colunas (`Reportado por` ausente)")
            continue
        ident, _ctx, kind, severity, reported, by, desc, _status, ok = row[:9]
        found = _VALUE.match(by)
        if not found:
            gap(number, "uat_tracks_value", f"{ident}: `Reportado por` é `{by or 'vazio'}`, e só aceita MJRP · juiz · agente "
                "(com `· prioridade: humano — decidir|ver|segurança: <motivo>` se subiu para a trilha dele)")
            continue
        who, prio = found.group("who"), found.group("prio")
        out["rows"][who] += 1
        new = reported[:16] >= TRACKS_SINCE
        found_marker = _MARKER.search(desc)
        marked = bool(found_marker) and found_marker.group("value").strip().lower() != "humano"
        if prio is not None:
            p = _PRIO.match(prio)
            if who == "MJRP":
                gap(number, "uat_tracks_priority", f"{ident}: `prioridade: humano` numa issue do MJRP — ela já é da trilha dele")
            elif not p:
                gap(number, "uat_tracks_priority", f"{ident}: `prioridade: humano` só com `— decidir:`, `— ver:` ou `— segurança:` e o motivo")
            elif p.group("why") == "P0" and reported[:16] > PRIO_P0_UNTIL:
                gap(number, "uat_tracks_priority", f"{ident}: `— P0:` só vale nas linhas reportadas até {PRIO_P0_UNTIL}; um P0 técnico fica na trilha do agente "
                    "(a marca é `— decidir:`, `— ver:` ou `— segurança:`)")
            elif p.group("why") == "P0" and severity != "P0":
                gap(number, "uat_tracks_priority", f"{ident}: `prioridade: humano — P0` numa issue de Gravidade `{severity}`")
        if who == "MJRP":
            if marked:
                gap(number, "uat_tracks_marker", f"{ident}: `Reportado por` é MJRP e a descrição traz `**Aberta por:** agente (...)`")
            if _MACHINE_WORDS.match(ok):
                gap(number, "uat_tracks_ok", f"{ident}: a issue é do MJRP — só o OK dele a fecha, não a reconferência nem os testes")
        elif new:
            if kind.strip().casefold() == COPY_KIND and prio is None:
                gap(number, "uat_tracks_copy", f"{ident}: uma issue de tipo `copy` aberta por {who} sobe à trilha do MJRP, que dá o OK: "
                    "`Reportado por` é `" + who + " · prioridade: humano — ver: <motivo>`")
            if not marked:
                gap(number, "uat_tracks_marker", f"{ident}: `Reportado por` é {who} e a descrição não termina em `**Aberta por:** agente (<quem>)`")
            if ok:
                prio_ok = bool(_HUMAN_OK.match(ok))
                if prio is not None and not prio_ok:
                    gap(number, "uat_tracks_ok", f"{ident}: subiu para a trilha do MJRP (`prioridade: humano`) — só o OK dele a fecha")
                elif not (_RECHECK.match(ok) or prio_ok):
                    gap(number, "uat_tracks_ok", f"{ident}: o OK de uma issue de {who} é `recheck independente: <relatório>, <data hora>`, "
                        "`testes verdes: <comando>, <data hora>` (ou o do MJRP)")
    return out


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    as_json, quiet = "--json" in argv, "--quiet" in argv
    root = Path(args[0] if args else ".").resolve()
    if not root.is_dir():
        print(f"uat_tracks_check: {root} não é uma pasta - não avaliável", file=sys.stderr)
        return 2
    r = check(root)
    if as_json:
        print(json.dumps({"project": root.name, "ok": not r["gaps"], **r}, ensure_ascii=False, indent=2))
    else:
        counts = " · ".join(f"{k} {v}" for k, v in r["rows"].items())
        print(f"uat_tracks_check: {root.name} - " + (f"VERDE ({counts})" if not r["gaps"] else f"VERMELHO: {len(r['gaps'])} lacuna(s)"))
        for g in r["gaps"]:
            print(f"  {g['file']}:{g['line']}: {g['message']} -> {g['owner']}")
    return 1 if r["gaps"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
