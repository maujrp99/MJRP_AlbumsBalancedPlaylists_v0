#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
feature_closure.py - who closes a feature: the MJRP's acceptance or the independent recheck (F139, S-206).

Born 2026-10-30 (AGENTS.md § Duas trilhas, «A feature também só sobe com algo para ele», the MJRP, 20:22): about F57 in the
acceptance queue, «a f57 tenho a impressao que nao deveria ser eu que dou aceite». A feature goes to his acceptance only when
there is something for him in it:
  - to SEE: a story it imports points to a screen state (`points_to` into info-arch.md; a behavior state is not a screen, so the
    behavior the MJRP uses that the graph cannot see is sent to him by the mark below -- AGENTS.md § Duas trilhas);
  - an issue of HIS that it fixes: the row's `Reportado por` is `MJRP`, or an agent row that went up with
    `prioridade: humano — decidir|ver|segurança` (the reader's own classification of the row, `his`);
  - the mark the spec declares, for what the two above do not see (a decision, a document he reads, security):
    `needs_human: "<decidir|ver|segurança>: <motivo>"`.
A story nobody can read stays with him, like an issue nobody can place.
Everything else -- engineering, model, core, skill, a sensor with no effect he sees -- closes by the independent recheck, as an
agent's issue does: the spec stays `Done` and carries `closed_by: "recheck independente: <relatório>, <AAAA-MM-DD HH:MM>"`. The
state is Closed, never Accepted: the acceptance (`Human-accepted:`) stays his.

One place, three readers: the requirements graph (requirements_graph_check.py: a `closed_by` that does not stand is a finding),
the Control Center's board (the station `closed`, the category «Fechado») and its acceptance (the preparation refuses a closed
feature). The app loads this file by path (adapters/kernel_uat/closure.py), so it imports nothing but the stdlib.

The report a `closed_by:` cites is looked for in the project and at the repository's root (the graph hands `text` to report_problem). The
board reads a judge's verdict from the same two places (F156, UAT-459: adapters/git_cli/evaluations.py), so a report that closes a feature
is a report the board can see.
"""
import re
from datetime import datetime

FEATURE_CLOSURE_API = 1
CLOSED_BY = re.compile(r"^recheck independente:\s*(?P<report>[^\s,][^,]*?)\s*,\s*(?P<at>\d{4}-\d{2}-\d{2} \d{2}:\d{2})$")
NEEDS_HUMAN = re.compile(r"^(?P<why>decidir|ver|segurança):\s*(?P<reason>\S.*)$")
SCREEN_DOC = "info-arch"
CLOSABLE_STATUS = "done"


def screen_state(target):
    """Is a `points_to` target a screen state? As written (`info-arch#^x`, `[[info-arch#^x]]`, a path ending in info-arch)."""
    doc = str(target).strip().strip("[]").split("|", 1)[0].split("#", 1)[0].strip()
    return doc.rsplit("/", 1)[-1].removesuffix(".md").casefold() == SCREEN_DOC


def eye_reasons(stories, issues, mark):
    """Why the feature goes to the MJRP, in his words; empty: it closes by the independent recheck.

    stories: [(story id, [points_to targets] or None)] of the stories it imports (None: the node was not read);
    issues: [(issue id, his)] of the issues it fixes -- `his` true when the row is his or went up to him, None when the reader
            could not place the row (missing, outside the grammar): an issue nobody can place stays with him;
    mark: the spec's `needs_human:` (None or blank: none). A mark outside the form still sends the feature to him."""
    out = []
    for ident, targets in stories:
        if targets is None:
            out.append(f"a story {ident} não se lê: fica com o MJRP")
            continue
        screens = [t for t in targets if screen_state(t)]
        if screens:
            out.append(f"ver: {ident} aponta para o estado de tela {str(screens[0]).strip('[]')}")
    for ident, his in issues:
        if his is None:
            out.append(f"a issue {ident} não se lê no uat.md: fica com o MJRP")
        elif his:
            out.append(f"a issue {ident} é da trilha do MJRP")
    text = "" if mark is None else str(mark).strip()
    if text:
        found = NEEDS_HUMAN.match(text)
        out.append(f"{found['why']}: {found['reason']}" if found else f"a marca `needs_human` fora da forma: {text}")
    return out


VERDICTS_THAT_PASS = ("pass", "passes", "can-go")


def _field(frontmatter, key):
    found = re.search(rf"^{key}:[ \t]*(.*?)[ \t]*$", frontmatter, re.M)
    return found[1].strip("\"'") if found else None


def report_problem(value, text):
    """Why the report a `closed_by:` cites cannot close the feature; None when it can. `value` is the `closed_by:` text, `text` the
    report's content (None: the file was not found). The report is a path inside the repository, its frontmatter carries a verdict that
    passes (pass | can-go) and no P0 and no P1, and the hour of the declaration is a real moment."""
    found = CLOSED_BY.match("" if value is None else str(value).strip())
    if not found:
        return "fora da forma"
    path = found["report"]
    if path.startswith(("/", "~")) or ".." in path.replace("\\", "/").split("/"):
        return f"o relatório {path} precisa ser um caminho relativo, dentro do repositório"
    try:
        datetime.strptime(found["at"], "%Y-%m-%d %H:%M")
    except ValueError:
        return f"a hora {found['at']} não existe"
    if text is None:
        return f"o relatório {path} não existe no projeto nem na raiz do repositório"
    head = re.match(r"\A---\r?\n(.*?)\r?\n---", text, re.S)
    frontmatter = head[1] if head else ""
    verdict = _field(frontmatter, "verdict")
    if verdict not in VERDICTS_THAT_PASS:
        return f"o relatório {path} não passa (verdict: {verdict or 'ausente'}): só uma reconferência que passa fecha a feature"
    for key in ("p0", "p1"):
        count = _field(frontmatter, key)
        if count is not None and count != "0":
            return f"o relatório {path} tem {key.upper()} {count}: só a que não tem P0 nem P1 fecha a feature"
    return None


def closed_by_problem(value, status, eye):
    """Why a spec's `closed_by:` does not stand; None when it stands. `status` is the spec's, `eye` the eye_reasons."""
    text = "" if value is None else str(value).strip()
    if not CLOSED_BY.match(text):
        return "fora da forma `recheck independente: <relatório>, <AAAA-MM-DD HH:MM>`"
    if (status or "").strip().casefold() != CLOSABLE_STATUS:
        return f"numa feature {status or 'sem status'}: só a feature Done fecha"
    if eye:
        return "a feature pede o olho do MJRP (" + "; ".join(eye) + "): só o aceite dele a fecha"
    return None


def closes(value, status, eye):
    """Does the feature close by the recheck? It declares `closed_by:` and the declaration stands."""
    return value is not None and str(value).strip() != "" and closed_by_problem(value, status, eye) is None


def report_of(value):
    """The report a `closed_by:` cites (a path, as written); None when the value is outside the form."""
    found = CLOSED_BY.match("" if value is None else str(value).strip())
    return found["report"] if found else None
