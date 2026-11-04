#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
screen_answers.py - which answers given on the Control Center screen no agent has executed yet (F166, UAT-471; CC-ADR-0039 section 8).

The server writes the log entry of type `answer` and the report's mark, and nothing else: it never touches MEMORY.md, and the doctor's F1 does
not count the type. So the notice is derived from the log. An `answer` entry is PENDING until a `decision` entry of the same or a later time
cites the question and the report (`conformance-audit-answers`); the agent that applied it writes that entry. The rule sees a citation, not the
work: it has the same residual as the mark. Read from the main checkout, where the server writes, and from this session's folder, whose branch
may hold the closing entry.

  python3 mjrp-scripts/screen_answers.py [--root <folder>]     the list, exit 0
  python3 mjrp-scripts/screen_answers.py --session-start       the block the SessionStart hook prints (silent when nothing is pending)

Standard library only: this script is vendored with the kernel, and its presence in a project is what the screen's route asks for.
"""

import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

LOG_REL = "docs/log.md"
AUDITS_REL = "reports/audits"
_ENTRY = re.compile(r"^## \[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\] ([\w-]+) — ([^\n]*)\n(.*?)(?=^## \[|\Z)", re.M | re.S)
_ANSWER_ID = re.compile(r"^auditoria (P-\d{2,})\b")
_REPORT = re.compile(r"^- Relatório: `([^`\n]+)`", re.M)


@dataclass
class Answer:
    id: str
    report: str
    at: str
    marked: bool = True


@dataclass
class State:
    pending: list = field(default_factory=list)  # the answers no decision cites yet
    uncommitted: list = field(default_factory=list)  # the files of an answer the server wrote and nobody committed


def entries(log_text):
    """(time, type, title, whole entry) of each dated entry of the log."""
    return [(m.group(1), m.group(2), m.group(3), m.group(0)) for m in _ENTRY.finditer(log_text or "")]


def _cites(body, question, report):
    return re.search(r"(?<![\w-])" + re.escape(question) + r"(?!\d)", body) is not None and report in body


def pending_in(log_texts):
    """The answers of these logs with no `decision` of the same or a later time that cites the question and the report."""
    all_entries = {e for text in log_texts for e in entries(text)}
    decisions = [e for e in all_entries if e[1] == "decision"]
    found, seen = [], set()
    for at, kind, title, body in sorted(all_entries):
        question, report = _ANSWER_ID.match(title), _REPORT.search(body)
        if kind != "answer" or question is None or report is None:
            continue
        key = (question.group(1), report.group(1), at)  # the same entry in the main checkout and in this session's branch
        if key not in seen and not any(d[0] >= at and _cites(d[3], key[0], key[1]) for d in decisions):
            seen.add(key)
            found.append(Answer(*key))
    return found


def has_mark(report_text, question, at):
    """The question's block has a mark of that time; without one, the entry was left behind by a failure before the mark."""
    block = re.search(r"^### " + re.escape(question) + r"\b.*?(?=^##|\Z)", report_text or "", re.M | re.S)
    return block is not None and re.search(r"^→ (?:respondida|seguimento respondido) em " + re.escape(at) + ":", block.group(0), re.M) is not None


def _git(root, *args):
    try:
        done = subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True, timeout=10, check=False)
    except (OSError, subprocess.SubprocessError):
        return None
    return done.stdout.rstrip() if done.returncode == 0 else None


def main_checkout(root):
    """The folder of the main checkout of `root`'s repository, the same relative place; `root` when git does not say."""
    root = Path(root).resolve()
    common, top = _git(root, "rev-parse", "--path-format=absolute", "--git-common-dir"), _git(root, "rev-parse", "--show-toplevel")
    if common is None or top is None or Path(common).name != ".git":
        return root
    return Path(common).parent / root.relative_to(Path(top).resolve())


def _read(path):
    try:
        return Path(path).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None


def state_of(root):
    """What waits in this project. A project with no log has nothing to say."""
    root = Path(root).resolve()
    main = main_checkout(root)
    folders = [main] if main == root else [main, root]
    logs = [_read(folder / LOG_REL) for folder in folders]
    state = State(pending=pending_in([text for text in logs if text]))
    for answer in state.pending:
        answer.marked = has_mark(_read(main / AUDITS_REL / answer.report), answer.id, answer.at)
    if state.pending and logs[0] and "] answer — " in logs[0]:
        rels = [LOG_REL, *sorted({f"{AUDITS_REL}/{a.report}" for a in state.pending})]
        dirty = _git(main, "status", "--porcelain", "--", *rels)
        state.uncommitted = sorted(ln[3:].strip() for ln in (dirty or "").splitlines() if ln.strip())
    return state


def lines_of(state):
    """The notice, in the MJRP's language; empty when nothing waits."""
    if not state.pending:
        return []
    done = [a for a in state.pending if a.marked]
    left = [a for a in state.pending if not a.marked]
    out = []
    for report in sorted({a.report for a in done}):
        ids = [a.id for a in done if a.report == report]
        out.append(f"{len(ids)} {'resposta' if len(ids) == 1 else 'respostas'} da tela sem executar: {', '.join(ids)} ({report})")
    if done:
        out.append("  Trate primeiro: aplique cada uma e escreva a entrada `decision` que cita a pergunta e o relatório, com o que foi aplicado.")
    if left:
        out.append(f"Entrada de resposta sem marca no relatório: {', '.join(a.id for a in left)}. A tela falhou no meio: reenvie por ela, e não aja sobre esta.")
    if state.uncommitted:
        out.append(f"  Sem commit: quem aplica commita, por pathspec: git commit -m \"...\" -- {' '.join(state.uncommitted)}")
    return out


def main(argv):
    args = list(argv)
    root = "."
    if "--root" in args:
        where = args.index("--root")
        root = args[where + 1] if where + 1 < len(args) else "."
        del args[where : where + 2]
    if set(args) - {"--session-start"}:
        print("uso: screen_answers.py [--session-start] [--root <pasta>]", file=sys.stderr)
        return 2
    lines = lines_of(state_of(root))
    if lines:
        print("\n".join(lines))
    elif "--session-start" not in args:
        print("nenhuma resposta da tela sem executar")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
