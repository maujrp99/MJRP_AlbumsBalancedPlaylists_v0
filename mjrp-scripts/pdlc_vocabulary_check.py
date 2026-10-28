#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""pdlc_vocabulary_check.py - the skills and the kernel speak the PDLC of today (v12), and a fast-lane feature closes with its record.

Two checks in one sensor, both about the same failure: the process changed and the text that teaches it did not.

  1. VOCABULARY. The skills (mjrp-skills/) and the kernel pages (docs/wiki/kernel/) must not teach the old PDLC:
       - the old lanes: Fast track, quick fix, "quinta fila" / fifth lane, quatro trilhas / four tracks, Full track,
         Standard track, Fix track / trilha Fix, "feature Fix", the list "Full, Standard, Fast track, Fix";
       - the merge as the agent's ("merge do agente", "the merge is the agent's"): only the integrator writes to main;
       - "contract" as the approval of the requirements ("etapa Contrato", "Ready é o contrato", "before the contract",
         "back to the contract"...): since 2026-10-24 14:23 it is «Pronto para construir» («Ready to build»); the word
         "contrato" belongs to the project's .mjrp-project.yml and to the data contracts, and those are not flagged.
     It reads every text file of a skill (.md .yml .yaml .json .txt: the bootstrap's contract.yml template once taught
     "o humano aprova o contrato" and no Markdown sensor saw it) and the kernel's Markdown. It does not judge records, which
     keep the name of their day: a `## History` section; an entry in the register's own shape ("- **2026-10-24 14:33** · ..."
     or "## [2026-10-24 14:33] ...", with its indented continuation) - a line that merely mentions a date is live text; a
     sentence that says the term LEFT, with the term as its object ("X saiu", "X was replaced by", "Y replaces X", "substitui X", "não há
     mais X", "never call it X" - but not "The X replaces..."); an `<!-- origin: -->` comment; and, in evals/, a checklist
     line that tests the ABSENCE of the term (or the user's own words in `**Message:**`).
     Every hit is an error (exit 1).

  2. THE FAST LANE'S RETROACTIVE STEP. A feature with `lane: fast` and `status: Done` has to carry its record: the
     documentation and the prototype are written AFTER the judge's OK and before the item closes (mjrp-syncing-docs).
     What the sensor reads (nothing it reads needs judgement):
       a. no sketch marker: the first six lines of spec.md, plan.md and tasks.md do not say "Esboço" / "Sketch" /
          "Outline" (the opening commit marks them; the retroactive step rewrites them to what was built and drops the mark);
       b. the prototype, when a screen changed: the commits that cite the feature id (F76) and touch a screen file of
          the project's contract (`mjrp_harness.screen`, the doctor's A2 list; the default web/ and src/ when absent)
          also touch a prototype (`design/inception/`) and `docs/specs/info-arch.md`; or spec.md carries the line
          `**Prototype**: none - <who said so>` (the MJRP said no prototype is needed: recorded, as mjrp-designing-ui asks).
     What it does NOT read: whether the text is true or good (that is mjrp-auditing-docs), a screen text kept outside
     the contract's `screen:` list, a feature whose commits do not cite its id.
     A feature whose spec.md entered git before RULE_SINCE only WARNS (it closed before the rule existed - ADR-0002's
     "warning with a turning date"); from RULE_SINCE on a missing piece is an error.

Incident (ADR-0002 asks for one): 2026-10-25. The agent repeated "feature Fix" (a word the v12 retired) on the fast lane
because 12 of 24 skills still taught the old lanes (audit 2026-10-24, reports/audits/2026-10-24-factory-skills-vs-pdlc-v12.md),
and the F76 was about to close with the prototype not updated - nothing mechanical would have stopped it; the judge found it.

It is a SENSOR DECLARED in the contract (`sensors:`), run by the doctor's A1, like check_docs.py: it does not take a place in
ADR-0002's ceiling of 12 error checks of the doctor itself. The error ceiling is full, so the only error it adds is A1's own
(the declared sensor that returns 1); the legacy cases are warnings.

    python3 mjrp-scripts/pdlc_vocabulary_check.py [root]     0 clean (warnings allowed) · 1 errors · 2 not evaluable (git did not answer)
"""
import re
import sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _fm  # noqa: E402
import _git  # noqa: E402
import visual_gate  # noqa: E402
from _contract import read_yaml  # noqa: E402

RULE_SINCE = "2026-10-26"   # a fast-lane feature whose spec.md entered git before this day only warns
SKILL_DIR = "mjrp-skills"
KERNEL_DIR = "docs/wiki/kernel"
SKIP_PARTS = ("_archive", "_backups", "node_modules", "dist", ".git")
TEXT_SUFFIXES = {SKILL_DIR: {".md", ".yml", ".yaml", ".json", ".txt"}, KERNEL_DIR: {".md"}}   # a skill also carries templates in YAML/JSON/text
SKIP_NAMES = ("harness-kaizen.md",)   # the kernel's own register of lessons: every line is a record

# ------------------------------------------------------------------------------------------------ the vocabulary
LANES = (
    (r"\bfast[ -]track\b", re.I, "«Fast track»"),
    (r"\bquick[ -]fix\b", re.I, "«quick fix»"),
    (r"\bquinta fila\b|\bfifth lane\b", re.I, "«quinta fila» (the quick fix as a fifth lane)"),
    (r"\b(?:quatro|4) trilhas\b|\b(?:four|4) tracks\b", re.I, "«quatro trilhas»"),
    (r"\bFull track\b|\btrilha Full\b|\bStandard track\b|\btrilha Standard\b", re.I, "«Full/Standard track»"),
    (r"\bFix track\b|\btrilha Fix\b|\b[Ff]eatures? Fix\b", 0, "«Fix track» / «feature Fix» (the fix rides the fast lane; its kind is `solution_type: fix`)"),
    (r"\bFull\s*(?:·|,|×|/|e|and)\s*Standard\b", 0, "the list «Full · Standard»"),
)
MERGE = (
    (r"\bmerge do agente\b|\bo merge é do agente\b|\bmerge feito pelo agente\b|\bthe agent'?s merge\b|"
     r"\bthe merge is the agent'?s\b|\bmerge (?:made|done) by the agent\b", re.I, "the merge as the agent's (only the integrator writes to main)"),
)
CONTRACT = (
    (r"\betapa (?:do |de )?contrato\b|\bContrato ◆|→ Contrato\b|\) → Contrato\b|\bContrato →", re.I, "«Contrato» as a stage"),
    (r"\bready (?:é|no|\(o) (?:o )?contrato\b|\bReady is the contract\b", re.I, "«Ready é o contrato»"),
    (r"\b(?:antes|depois) do contrato\b|\b(?:before|back to|outside) the contract\b(?!['’]| exists| file| declares)", re.I,
     "«contract» as the approval of the requirements (before/back to/outside)"),
    (r"\b(?:volta|voltar|escalada|escalar)\s+(?:ao|para o)\s+contrato\b|\bfora do contrato\b", re.I, "«contrato» as the approval (volta/escalada/fora do)"),
    (r"\bdecide(?:m)? (?:só |apenas )?(?:o |no )contrato\b|\baprov\w+ (?:só |apenas )?o contrato\b|\bcontrato \(?aprovad\w+", re.I,
     "«aprovar o contrato»"),
    (r"\bdo contrato (?:à|ao) (?:homologação|UAT)\b|\bstories do contrato\b|\bo contrato (?:ainda )?está aberto\b|\bcontract stories\b", re.I,
     "«contrato» as the approval of the requirements (the screen's words)"),
    (r"\b(?:the human |you )?(?:approves?|approved|decides?) (?:at )?the contract\b|\bMoment 2\s*[—-]\s*the contract\b", re.I,
     "«approve the contract»"),
)
RULES = [(re.compile(p, fl), why, kind) for kind, group in (("lane", LANES), ("merge", MERGE), ("contract", CONTRACT)) for p, fl, why in group]

# lines that keep a term on purpose
PROJECT_CONTRACT = re.compile(r"Pronto para construir|Ready to build|\.mjrp-project|project'?s? contract|contrato do projeto|contrato de instância", re.I)
# A dated RECORD is an entry of the register's own shape ("- **2026-10-24 14:33** · ..." / "## [2026-10-24 14:33] ..." and its
# indented continuation) - not any line that mentions a date: "Since 2026-10-25, use the Fast track" is live teaching.
RECORD_LINE = re.compile(r"^\s*(?:[-*]\s+)?\*\*\d{4}-\d\d-\d\d|^\s*[-*]\s+\d{4}-\d\d-\d\d|^#{1,4}\s*\[\d{4}-\d\d-\d\d", re.M)
# A term is retired ON PURPOSE only when it is the object of what left or of what replaced it, in the same sentence:
# "X saiu", "X was retired", "no lugar de X", "não há mais X", "never call it X". "The X replaces..." / "Y replaces X" are live.
SENTENCE_END = re.compile(r"[.;!?](?:\s|$)")
RETIRED_BEFORE = re.compile(r"(?:substitu[ií]\w*|replaces?|replaced|no lugar d[eoas]+|em vez d[eoas]+|instead of|in place of|nunca (?:chame|use|diga)|never (?:call|use|say)|"
                            r"n[aã]o h[aá] mais|n[aã]o existe mais|no longer|chamava-se|era chamad\w+|was called|formerly|\bex-|\bformer|"
                            r"aposentad\w+|retired|renomead\w+|renamed)\W", re.I)
RETIRED_AFTER = re.compile(r"\b(?:saiu|sa[ií]ram|saem|sai\b|deixou de|deixam de|foi aposentad\w+|foram aposentad\w+|"
                           r"(?:was|were|is|are) retired|replaced by|substitu[ií]d\w+ (?:pel|por)\w*|virou|became)", re.I)
LIST_CONNECTORS = re.compile(r"\b(?:nem|ou|e|or|and|nor)\b", re.I)
MAX_WORDS_BETWEEN = 3   # the retirement phrase and the term it retires may be at most this many words apart
ORIGIN = re.compile(r"<!--\s*origin", re.I)
RECORD_SECTION = re.compile(r"^##\s+(History|Histórico|Historico|Findings|Lições|Licoes)\b", re.I)
HEADING2 = re.compile(r"^##\s")
NEGATION = re.compile(r"\bdoes not\b|\bdoesn't\b|\bnever\b|\bnot\b|\bwithout\b|\bno\b|\bnunca\b|\bnão\b|\bsem\b", re.I)


def _close(line, a, b, spans):
    """Whether line[a:b], the stretch between a retirement phrase and the term, is short enough to be about that term: at most
    MAX_WORDS_BETWEEN words, in one comma-piece. Other old terms of the same list ("quatro trilhas, Fast track, quick fix") and
    a parenthesis do not count; a new clause ("No lugar da via padrão, use o Fast track") does."""
    parts, i = [], a
    for s0, e0 in sorted(spans):
        if a <= s0 and e0 <= b and s0 >= i:
            parts += [line[i:s0], " "]
            i = e0
    parts.append(line[i:b])
    seg = re.sub(r"\([^)]*\)", " ", "".join(parts))
    pieces = [re.findall(r"\w+", LIST_CONNECTORS.sub(" ", piece)) for piece in seg.split(",")]
    return sum(len(w) for w in pieces) <= MAX_WORDS_BETWEEN and sum(1 for w in pieces if w) <= 1


def retired_on_purpose(line, m):
    """Whether the matched term is the object of a sentence that says it left: a retirement phrase right before it
    (RETIRED_BEFORE) or one right after it (RETIRED_AFTER), at most MAX_WORDS_BETWEEN words away and in the same clause."""
    spans = {mm.span() for rx, _, _ in RULES for mm in rx.finditer(line)} - {m.span()}
    starts = [e.end() for e in SENTENCE_END.finditer(line, 0, m.start())]
    lo = starts[-1] if starts else 0
    if any(_close(line, lo + k.end(), m.start(), spans) for k in RETIRED_BEFORE.finditer(line[lo:m.start()])):
        return True
    nxt = SENTENCE_END.search(line, m.end())
    hi = nxt.start() if nxt else len(line)
    return any(_close(line, m.end(), m.end() + k.start(), spans) for k in RETIRED_AFTER.finditer(line[m.end():hi]))


def doc_files(root):
    root = Path(root)
    out = []
    for base in (SKILL_DIR, KERNEL_DIR):
        top = root / base
        if not top.is_dir():
            continue
        for f in sorted(p for p in top.rglob("*") if p.is_file() and p.suffix in TEXT_SUFFIXES[base]):
            rel = f.relative_to(root).as_posix()
            if any(p in rel.split("/") for p in SKIP_PARTS) or f.name in SKIP_NAMES:
                continue
            out.append(f)
    return out


def vocabulary_findings(root):
    """[(relative file, line number, what, the line)] - the old PDLC taught by a skill or a kernel page."""
    root = Path(root)
    hits = []
    for f in doc_files(root):
        rel = f.relative_to(root).as_posix()
        in_eval = "/evals/" in f"/{rel}"
        record = False
        entry = False
        try:
            lines = f.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeDecodeError):
            continue
        for n, line in enumerate(lines, 1):
            if HEADING2.match(line):
                record = bool(RECORD_SECTION.match(line))
            if HEADING2.match(line) or not line.strip():
                entry = False
            elif RECORD_LINE.match(line):
                entry = True
            elif entry and not line.startswith(("  ", "\t")):
                entry = False
            if record or entry or not line.strip() or ORIGIN.search(line):
                continue
            if in_eval and (line.lstrip().startswith("**Message:**") or (line.lstrip().startswith("- [ ]") and NEGATION.search(line))):
                continue
            for rx, why, kind in RULES:
                if kind == "contract" and PROJECT_CONTRACT.search(line):
                    continue
                m = next((m for m in rx.finditer(line) if not retired_on_purpose(line, m)), None)
                if m:
                    hits.append((rel, n, why, line.strip()[:160]))
                    break
    return hits


# ------------------------------------------------------------------------------------------------ the fast lane's record
SKETCH = re.compile(r"\b(?:esbo[cç]o|sketch|outline)\b", re.I)
PROTOTYPE_NONE = re.compile(r"^\*\*Prototype\*\*:\s*none\b", re.I | re.M)
RECORD_FILES = ("spec.md", "plan.md", "tasks.md")


def projects(root):
    root = Path(root)
    found = [root] if (root / ".mjrp-project.yml").is_file() else []
    apps = root / "apps"
    if apps.is_dir():
        found += [p for p in sorted(apps.iterdir()) if (p / ".mjrp-project.yml").is_file()]
    return found


def screen_globs(proj):
    try:
        data = read_yaml((proj / ".mjrp-project.yml").read_text(encoding="utf-8")) or {}
    except OSError:
        return None
    declared = (data.get("mjrp_harness") or {}).get("screen")
    return [str(x) for x in declared] if isinstance(declared, list) and declared else None


def done_fast_features(proj):
    """[(folder, spec path)] of the features with `lane: fast` and a finished status."""
    out = []
    for spec in sorted((proj / "docs" / "specs" / "features").glob("*/spec.md")):
        front = _fm.parse(spec.read_text(encoding="utf-8"))
        if str(front.get("lane", "")).strip().casefold() == "fast" and str(front.get("status", "")).strip().casefold() in ("done", "accepted"):
            out.append((spec.parent, spec))
    return out


def feature_id(folder):
    m = re.match(r"(F\d+)-", folder.name)
    return m.group(1) if m else None


def first_commit_day(top, rel):
    """The day (YYYY-MM-DD) the file first entered git; None when git does not know it."""
    out = _git.text(top, "log", "--diff-filter=A", "--format=%cs", "--", rel)
    days = out.splitlines() if out else []
    return days[-1] if days else None


def feature_paths(top, fid):
    """Every path the commits that cite the feature id touched (repo-relative)."""
    rx = rf"(^|[^A-Za-z0-9]){fid}([^0-9]|$)"
    out = _git.text(top, "log", "-E", f"--grep={rx}", "--name-only", "--format=") or ""
    return {line.strip() for line in out.splitlines() if line.strip()}


def fast_lane_findings(root):
    """(errors, warnings): each (relative path of the feature, what is missing)."""
    root = Path(root)
    errors, warnings = [], []
    for proj in projects(root):
        features = done_fast_features(proj)
        if not features:
            continue
        top = _git.toplevel(proj)
        if top is None:
            continue
        prefix = proj.resolve().relative_to(Path(top).resolve()).as_posix()
        prefix = "" if prefix == "." else prefix + "/"
        globs = screen_globs(proj)
        for folder, spec in features:
            missing = []
            for name in RECORD_FILES:
                p = folder / name
                head = "\n".join(p.read_text(encoding="utf-8").splitlines()[:6]) if p.is_file() else ""
                if not p.is_file():
                    missing.append(f"{name} não existe")
                elif SKETCH.search(head):
                    missing.append(f"{name} ainda é o esboço (o cabeçalho diz «Esboço»): o passo retroativo o reescreve para o que foi construído")
            fid = feature_id(folder)
            if fid and not PROTOTYPE_NONE.search(spec.read_text(encoding="utf-8")):
                touched = feature_paths(top, fid)
                rel_in = {t[len(prefix):] for t in touched if t.startswith(prefix)}
                if any(visual_gate.is_screen_file(t, globs) for t in rel_in):
                    if not any(t.startswith("design/inception/") for t in rel_in):
                        missing.append(f"a feature mexeu na tela e nenhum commit dela atualiza o protótipo (design/inception/); "
                                       f"se o MJRP disse que não precisa, registre `**Prototype**: none - <quem disse>` no spec.md")
                    elif "docs/specs/info-arch.md" not in rel_in:
                        missing.append("a feature mexeu na tela e atualizou o protótipo, mas nenhum commit dela atualiza o docs/specs/info-arch.md")
            if not missing:
                continue
            rel = folder.relative_to(root).as_posix()
            day = first_commit_day(top, f"{prefix}{spec.relative_to(proj).as_posix()}")
            (warnings if day and day < RULE_SINCE else errors).extend((rel, m) for m in missing)
    return errors, warnings


def main(argv):
    root = Path(argv[0]) if argv else Path(".")
    vocab = vocabulary_findings(root)
    try:
        errors, warnings = fast_lane_findings(root)
    except _git.GitError as e:
        print(f"pdlc_vocabulary_check: {e} - não avaliável (exit 2)")
        return 2
    for rel, n, why, line in vocab:
        print(f"  ✗ {rel}:{n}: {why} - «{line}»")
    for rel, what in errors:
        print(f"  ✗ {rel}: via rápida fechada sem o registro - {what}")
    for rel, what in warnings:
        print(f"  ! {rel}: via rápida fechada antes da regra ({RULE_SINCE}) - {what}")
    bad = len(vocab) + len(errors)
    print(f"pdlc_vocabulary_check: {len(vocab)} termo(s) do PDLC antigo, {len(errors)} via rápida sem registro, {len(warnings)} aviso(s)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
