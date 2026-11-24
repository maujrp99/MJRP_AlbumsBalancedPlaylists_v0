#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""adr_header_check.py - the header of every ADR in `docs/decisions/`: the TITLE line and the STATUS line (catalog item `adr-names`, CM-0076).

The check that passed the file NAME while the Control Center could not READ the file (MJRPpersonal, 2026-10-18: ADRs titled
`# ADR 0002: ...` and with a `## Status` heading instead of `**Status**: x`; the screen said "4 ADRs de MJRPpersonal nao se leem" with
the catalog green - the fifth case of the day of "the check does not ask what the screen reads").

The ONE place of the expressions:
  - TITLE_RE - the canonical title this check demands: `# ADR-NNNN: titulo`, or `# <PREFIX>-ADR-NNNN: titulo` when the contract declares
    `id_prefix: <PREFIX>` (decision@2; the unprefixed form stays valid there, as the reader takes it). A colon, four digits, one space.
  - READER_RE - what the Control Center reader accepts as a title (`adapters/repo_fs/decisions.py`, `_ANY_PREFIX`): looser on purpose (a
    space or a hyphen before the number, any digits, `:` or a dash as separator), so a title a little off still shows on the screen. The
    check stays strict to ONE canonical form; the reader stays tolerant.
  - STATUS_RE - the reader's own status expression (`_STATUS`): `**Status**: x` or `- **Status:** x`, in the first 40 lines. A status the
    reader cannot find fails the WHOLE reading of that ADR, so there is no tolerant form to keep: the check asks for exactly what is read.
Since decision@3 (F62, 2026-10-26: the MJRP found the ADRs verbose and hard to review - the root ADRs ran 250 to 545 lines,
17,000 to 46,000 characters), an ADR dated on or after SHORT_SINCE also has to be SHORT (MAX_CHARS for the whole file, a few minutes
of reading) and has to declare its ACCEPTANCE route (`**Acceptance**: tech lead | MJRP`, F66: who accepts it); once Accepted, its
Deciders open with who accepted (`tech lead (agente), <date>` or `MJRP, <date>`), and the tech lead never on an MJRP route. The older ADRs are
immutable and stay exempt.
The expressions meet in `apps/control-center/tests/compat/test_adr_header_form.py`: every header this check accepts, the reader reads; a
header the reader cannot read, this check rejects; READER_RE and STATUS_RE are compared to the reader's own patterns.

Exit 0 passes, 1 is a gap, 2 could not run. `--quiet` prints only the problems. Standard library only (it travels to the children
with the kernel)."""
import re
import sys
from pathlib import Path

DECISIONS_DIR = "docs/decisions"
HEADER_LINES = 40                       # the reader's window (`HEADER_LINES` of decisions.py)
FILE_RE = r"^\d{4}-.+\.md$"             # the reader's `_FILE`: only these files are ADRs
TITLE_RE = r"^# (?:(?P<prefix>[A-Z][A-Z0-9]*)-)?ADR-(?P<number>\d{4}): (?P<title>\S.*?)\s*$"
READER_RE = r"^#\s+(?:(?P<prefix>[A-Z][A-Z0-9]*)-)?ADR[-\s]\s*(?P<number>\d+)\s*[:—–-]\s*(?P<title>.+?)\s*$"
DATE_RE = r"\*\*Date(?:\*\*:|:\*\*)\s*(?P<date>\d{4}-\d{2}-\d{2})"
ACCEPTANCE_RE = r"\*\*Acceptance(?:\*\*:|:\*\*)\s*(?P<route>tech lead|MJRP)\b"
DECIDERS_RE = r"\*\*Deciders(?:\*\*:|:\*\*)\s*(?P<who>.+)"
SHORT_SINCE = "2026-10-26"               # decision@3: the short record (F62) and the acceptance route (F66)
MAX_CHARS = 6000                         # the whole file; the evidence goes to the critique, the plan or the wiki page
# F188 (UAT-498): the notice that a LATER decision amended or superseded this one is written INTO the old ADR when the new one is accepted, and an
# accepted ADR is not edited otherwise; that pointer is not part of the decision, so the ceiling does not count it (ADR-0005 of the MJRPpersonal went
# from 5,961 to 6,017 characters by the notice alone).
# F188 (recheck P1-1): the exemption is for the POINTER only - the label, then the ADR id (a link or a bare id) and a date, in a short line.
# A line that is not that, or that is longer than NOTICE_MAX, is counted whole. The real notices run 120 to 1,255 characters (the longest
# is one line that lists four amending ADRs), so the limit leaves room for those and not for a decision hidden behind a label.
NOTICE_POINTER_RE = r"^\s*(?:[-*]\s+)?\*\*(?:Emendada por|Superada por)(?::\*\*|\*\*:)\s*\[?(?:[A-Z][A-Z0-9]*-)?ADR-\d{4}\b"
NOTICE_DATE_RE = r"\d{4}-\d{2}-\d{2}|\d{2}/\d{2}"
NOTICE_MAX = 1500
# F188 (recheck P1-2): NOTICE_MAX is per line, so many pointer-shaped lines hid text without a limit (40 lines hid 60,040 characters). The
# discount is capped in TOTAL per ADR: what the pointers sum beyond NOTICE_TOTAL_MAX counts like any other text. The real ADRs sum at most
# 3,101 characters in 9 lines. 4,000 is the integrator's call (2026-11-05), open to the MJRP's review.
NOTICE_TOTAL_MAX = 4000
# F289 (UAT-599): two ADRs of the Control Center were ACCEPTED over the ceiling (dated after SHORT_SINCE, 10,288 and 8,594 counted characters) and an
# accepted ADR is not edited, so the ceiling cannot be met by the text. They are listed here, by file name, with the size FROZEN at the day they were
# found: they pass up to it and fail above it (an amendment goes into a new ADR, never into the old one). The list never takes a new entry for a
# new ADR: a new one is judged against MAX_CHARS before it is accepted.
OVER_CEILING_ACCEPTED = {
    "0044-push-ordered-from-the-iphone-with-the-passkey.md": 10288,
    "0055-in-progress-from-the-session-reservation.md": 8594,
}
STATUS_RE = r"\*\*Status(?:\*\*:|:\*\*)\s*[*_]*\s*(?P<word>[^\s*_.,;:(·]+)"


def id_prefix(root):
    """The contract's `id_prefix` (None when absent) - read as text so the script needs no YAML."""
    try:
        text = (Path(root) / ".mjrp-project.yml").read_text(encoding="utf-8")
    except OSError:
        return None
    m = re.search(r"^\s+id_prefix:\s*[\"']?([A-Z][A-Z0-9]*)[\"']?\s*(?:#.*)?$", text, re.M)
    return m.group(1) if m else None


def title_problem(text, prefix=None):
    """Why the text's title line is not canonical, or None."""
    heading = next((l for l in text.splitlines()[:HEADER_LINES] if l.startswith("#") and not l.startswith("##")), None)
    if heading is None:
        return "sem a linha de titulo `# ADR-NNNN: titulo`"
    m = re.match(TITLE_RE, heading)
    if not m:
        return f"o titulo `{heading.strip()[:70]}` nao e `# {(prefix + '-') if prefix else ''}ADR-NNNN: titulo` (dois-pontos, quatro digitos, um espaco)"
    if m["prefix"] and m["prefix"] != prefix:       # like the reader: the title without the prefix stays valid, any other prefix fails
        return f"o titulo leva o prefixo `{m['prefix']}`, mas o contrato " + (f"declara `id_prefix: {prefix}`" if prefix else "nao declara `id_prefix`")
    return None


def status_problem(text):
    """Why the reader finds no status in the header, or None."""
    if any(re.search(STATUS_RE, l) for l in text.splitlines()[:HEADER_LINES]):
        return None
    return "sem a linha de status que a tela le (`**Status**: Accepted` ou `- **Status:** Accepted`, nas primeiras 40 linhas; `## Status` nao se le)"


def record_date(text):
    """The record's `**Date**:` (the first YYYY-MM-DD of the line), or None."""
    m = next((re.search(DATE_RE, l) for l in text.splitlines()[:HEADER_LINES] if re.search(DATE_RE, l)), None)
    return m["date"] if m else None


def is_notice(line):
    """True when the line is the pointer to a later amendment or supersession: the label, an ADR id (link or bare) and a date, within NOTICE_MAX."""
    return (len(line) <= NOTICE_MAX and re.match(NOTICE_POINTER_RE, line) is not None
            and re.search(NOTICE_DATE_RE, line) is not None)


def counted_chars(text):
    """The size the ceiling judges: the whole file less the pointer lines (`is_notice`), the discount capped at NOTICE_TOTAL_MAX
    in total. Returns (counted, discounted)."""
    lines = text.splitlines(keepends=False)
    discounted = min(sum(len(line) + 1 for line in lines if is_notice(line)), NOTICE_TOTAL_MAX)
    return sum(len(line) + 1 for line in lines) - discounted - (0 if text.endswith("\n") else 1), discounted


def short_problems(text, name=None):
    """Why a decision@3 record (dated on or after SHORT_SINCE) is not short or does not declare who accepts it; [] for older ones.
    `name` is the file name: an ADR in OVER_CEILING_ACCEPTED is judged against its frozen size instead of MAX_CHARS."""
    date = record_date(text)
    if date is None or date < SHORT_SINCE:
        return []
    found = []
    size, discounted = counted_chars(text)
    if size > OVER_CEILING_ACCEPTED.get(name, MAX_CHARS):
        found.append(f"a ADR tem {size} caracteres contados ({discounted} descontados nas linhas `Emendada por`/`Superada por` na forma do aviso: "
                     f"o rotulo, o id da ADR e a data, ate {NOTICE_MAX} caracteres por linha e {NOTICE_TOTAL_MAX} no total; fora disso conta inteiro); o teto e {MAX_CHARS} (decision@3): a decisao e o porque, cada alternativa numa "
                     "linha, as consequencias em topicos, os arquivos; a evidencia vai para a critica, o plan.md ou a pagina da wiki")
    head = text.splitlines()[:HEADER_LINES]
    route = next((m["route"] for m in (re.search(ACCEPTANCE_RE, l) for l in head) if m), None)
    if route is None:
        found.append("sem a linha `**Acceptance**: tech lead | MJRP` (quem aceita a ADR; decision@3)")
    status = next((m["word"] for m in (re.search(STATUS_RE, l) for l in head) if m), "")
    who = next((m["who"].strip() for m in (re.search(DECIDERS_RE, l) for l in head) if m), "")
    if route and status == "Accepted":
        # F66: the tech lead accepts only the technical route; an MJRP route accepted by an agent is the valve bypassed.
        if who.startswith("tech lead") and route == "MJRP":
            found.append("aceita pelo tech lead, mas a via e `MJRP` (produto, dinheiro, seguranca ou valvula dele): so o MJRP aceita esta ADR")
        elif not (who.startswith("tech lead (agente)") or who.startswith("MJRP")):
            found.append("`Accepted` sem quem aceitou: os Deciders comecam por `tech lead (agente), <data>` ou `MJRP, <data>`")
    return found


def problems(root):
    root = Path(root)
    folder, prefix = root / DECISIONS_DIR, id_prefix(root)
    found = []
    for f in sorted(folder.glob("*.md")) if folder.is_dir() else []:
        if not re.match(FILE_RE, f.name):
            continue
        text = f.read_text(encoding="utf-8", errors="replace")
        for why in (title_problem(text, prefix), status_problem(text), *short_problems(text, f.name)):
            if why:
                found.append(f"{DECISIONS_DIR}/{f.name}: {why}")
    return found


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    root = Path(args[0] if args else ".")
    if not (root / DECISIONS_DIR).is_dir():
        print(f"adr_header_check: {DECISIONS_DIR}/ ausente - nada a conferir")
        return 0
    try:
        found = problems(root)
    except OSError as e:
        print(f"adr_header_check: {e}", file=sys.stderr)
        return 2
    if found:
        print(f"adr_header_check: {len(found)} problema(s) no cabecalho ou no tamanho de ADR")
        for p in found:
            print(f"  {p}")
        return 1
    if "--quiet" not in argv:
        print("adr_header_check: titulo `# ADR-NNNN: titulo` e linha de status em todas as ADRs; as decision@3 curtas e com a via do aceite")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
