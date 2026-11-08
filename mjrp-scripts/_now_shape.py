# cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_now_shape.py - the form of `## Now` in MEMORY.md and the check that it is not behind the log (F73 R7).

`now_shape`, `now_section` and `now_behind_log` used to be imported by check_docs, memory_check and session_journal from
the doctor itself, which imports them back; they live here, and the doctor (F1) and those sensors import this module.
It is the ONE measure of the form of `## Now`: four blocks, a ceiling of lines, pointers that resolve, and a time not older
than the newest log entry (S-61, 2026-10-04 14:11).
"""
import re
from datetime import date
from pathlib import Path

import _clock
from _contract import log_rel


IGNORED_LOG_TYPES = ("inventory", "acceptance", "answer")   # entries that are not session state (S-61, CC-ADR-0024, CC-ADR-0039)


def now_behind_log(root, now_body):
    """S-61 (MJRP, 2026-10-04 14:11): the CONTENT of ## Now, not the file's date. Returns a message when the newest
    time written in ## Now (YYYY-MM-DD HH:MM) is older than the newest log entry, else None. Born 2026-10-04: the
    file was newer than the last commit while its ## Now still said a step already committed was pending."""
    stamp = re.compile(r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})")
    now_times = [" ".join(m) for line in (now_body or []) for m in stamp.findall(line)]
    try:
        log = (Path(root) / log_rel(root)).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None
    # entries written by a scheduled pass (type `inventory`) are not session state: the daily inventory would turn F1
    # red every morning before anyone worked. The same for the type `acceptance` (CC-ADR-0024): the human's acceptance
    # commit writes one, and his valve cannot leave the doctor red until the next session updates ## Now. By TYPE, never
    # by a title that says "aceita pelo MJRP": 14 session entries written by agents already have that title.
    log_times = [" ".join(m[:2]) for m in re.findall(r"^## \[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})\] (\S+)", log, re.MULTILINE)
                 if m[2] not in IGNORED_LOG_TYPES]
    if not log_times or now_body is None:
        return None
    newest_log, newest_now = max(log_times), (max(now_times) if now_times else None)
    if newest_now is None or newest_now < newest_log:
        return (f"MEMORY.md: o ## Now para em {newest_now or 'nenhuma hora escrita'}, a última entrada do "
                f"{log_rel(root)} é de {newest_log} — atualize o ## Now com o estado de agora (S-61)")
    return None


def now_section(text):
    """The lines of the ## Now section of MEMORY.md - the part that overwrites.
    Without the section, returns None: the file lost its active memory."""
    lines = text.splitlines()
    ini = None
    for i, l in enumerate(lines):
        if l.strip().lower() == "## now":
            ini = i + 1
            break
    if ini is None:
        return None
    body = []
    for l in lines[ini:]:
        if l.startswith("## ") or l.startswith("# "):
            break
        if l.strip() and not l.startswith(">") and not l.strip().startswith("*(") and l.strip() != "---":
            body.append(l)
    return body


NOW_BLOCKS = ("Where the Work Stopped", "Pending on Agent", "Pending on Human", "Do Not Forget")


PENDING_BLOCKS = ("Pending on Agent", "Pending on Human")


_PTR_RE = re.compile(r"\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]")


_ISO_RE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")


_DM_RE = re.compile(r"\((\d{2})/(\d{2})\)")


def _latest_date(text, today):
    found = [date(int(y), int(m), int(d)) for y, m, d in _ISO_RE.findall(text)]
    found += [date(today.year, int(m), int(d)) for d, m in _DM_RE.findall(text)]
    return max(found) if found else None


def _earliest_date(text, today):
    found = [date(int(y), int(m), int(d)) for y, m, d in _ISO_RE.findall(text)]
    found += [date(today.year, int(m), int(d)) for d, m in _DM_RE.findall(text)]
    return min(found) if found else None


def _norm(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def now_shape(root, text, cfg=None):
    """The FORM of ## Now (ADR-0008 §5, amended 10/09): four blocks, pointers instead of detail,
    pending items dated and fresh, nothing that AGENTS.md already says. Returns
    (fails, warns, notes). Line counts are notes - never a verdict: a line cap as an error made
    the agent cut exactly the Pending/Do-Not-Forget lines that keep the next session from erring."""
    cfg = cfg or {}
    mem = cfg.get("memory") or {}
    expiry = int(mem.get("pending_expiry_days", 7))
    # 2026-11-05 (MJRP: «o memory onde parei, nao está muito longo nao? considerando que temos o log?»): the Control Center's
    # «Where the Work Stopped» had grown to 7,000 characters, a diary back to 31/10, because every session appended and none
    # replaced. The block says where the work IS; the history is the log's. Over the ceiling, or spanning more days than the
    # age, it fails - the cap is on this block only, never on Pending/Do-Not-Forget (the 09/09 lesson below stands).
    stopped_chars = int(mem.get("stopped_max_chars", 1500))
    stopped_days = int(mem.get("stopped_max_age_days", 2))
    budget = int(mem.get("layer0_budget_chars", 12000))
    fails, warns, notes = [], [], []
    body = now_section(text)
    if body is None:
        return ["MEMORY.md não tem seção '## Now' — a memória ativa sumiu (ADR-0006)"], warns, notes
    blocks, order, cur = {}, [], None
    for l in body:
        s = l.strip()
        hit = next((b for b in NOW_BLOCKS if s.startswith(f"**{b}")), None)
        if hit:
            cur = hit
            order.append(hit)
            blocks[cur] = [s]
        elif cur:
            blocks[cur].append(s)
    missing = [b for b in NOW_BLOCKS if b not in blocks]
    if missing:
        fails.append(f"## Now sem o(s) bloco(s) {', '.join(missing)} — os quatro são a forma (ADR-0008 §5)")
    if order != [b for b in NOW_BLOCKS if b in blocks]:
        warns.append("## Now com os blocos fora da ordem — a leitura é sempre a mesma: parou, meu, dele, não esquecer")
    names, aliases = set(), set()
    wiki = root / "docs" / "wiki"
    if wiki.exists():
        for p in wiki.rglob("*.md"):
            names.add(p.stem)
            m = re.search(r"^aliases:\s*\[(.*?)\]", p.read_text(encoding="utf-8", errors="replace")[:2000], re.M)
            if m:
                aliases.update(a.strip().strip("'\"") for a in m.group(1).split(","))
    today = _clock.contract_today(cfg)
    nptr = 0
    for b, ls in blocks.items():
        txt = " ".join(ls)
        ptrs = [p.strip() for p in _PTR_RE.findall(txt)]
        nptr += len(ptrs)
        for ptr in ptrs:
            if ptr not in names and ptr not in aliases:
                fails.append(f"## Now aponta para [[{ptr}]] e não existe docs/wiki/{ptr}.md (nem alias) — "
                             f"ponteiro que não resolve é detalhe perdido")
        if b == "Where the Work Stopped":
            if len(txt) > stopped_chars:
                fails.append(f"'Where the Work Stopped' com {len(txt)} caracteres, acima de {stopped_chars} "
                             f"(memory.stopped_max_chars): o bloco diz onde o trabalho está agora; o histórico é do log — reescreva, não acrescente")
            # the span of the block's own dates, not their age: a block left alone is the job of now_behind_log; a block that
            # keeps 30/10 next to 05/11 is a diary
            oldest, newest = _earliest_date(txt, today), _latest_date(txt, today)
            if oldest is not None and (newest - oldest).days > stopped_days:
                fails.append(f"'Where the Work Stopped' vai de {oldest.isoformat()} a {newest.isoformat()}, {(newest - oldest).days} dias "
                             f"(limite {stopped_days}, memory.stopped_max_age_days): o que já passou mora no log — reescreva o bloco")
        n = len(ls)
        if b != "Do Not Forget" and n > 3 and not ptrs:
            fails.append(f"bloco '{b}' com {n} linhas e nenhum ponteiro — detalhe que mora no lugar errado; "
                         f"o que não cabe em duas linhas vira [[página]] ou data no log")
        if n > 6:
            warns.append(f"bloco '{b}' com {n} linhas — virou histórico?")
        if b in PENDING_BLOCKS and n > 1:
            latest = _latest_date(txt, today)
            if latest is None:
                warns.append(f"'{b}' sem data — não dá para saber se está parado")
            elif (today - latest).days > expiry:
                warns.append(f"'{b}' parado há {(today - latest).days} dias (limite {expiry}, "
                             f"memory.pending_expiry_days) — estado morto ou por reescrever")
    agents = root / "AGENTS.md"
    if agents.exists():
        ag = _norm(agents.read_text(encoding="utf-8", errors="replace"))
        for l in body:
            s = re.sub(r"^\*\*[^*]+\*\*\s*", "", l.strip())
            if len(s) >= 40 and _norm(s) in ag:
                warns.append(f"## Now repete o que o AGENTS.md já diz: \"{s[:60]}…\" — custo fixo sem informação")
    lines = text.splitlines()
    layer0 = 0
    keep = False
    for l in lines:
        if l.startswith("## "):
            keep = l.startswith("## Now") or l.startswith("## Ways of Working")
        if keep:
            layer0 += len(l) + 1
    idx = wiki / "index.md"
    if idx.exists():
        layer0 += len(idx.read_text(encoding="utf-8", errors="replace"))
    if layer0 > budget:
        warns.append(f"camada 0 (## Now + ## Ways of Working + wiki/index.md) com {layer0} chars — "
                     f"orçamento {budget} (memory.layer0_budget_chars); mover detalhe para página")
    notes.append(f"## Now: {len(body)} linhas, {len(blocks)}/4 blocos, {nptr} ponteiro(s) · "
                 f"camada 0: {layer0} chars (orçamento {budget})")
    return fails, warns, notes
