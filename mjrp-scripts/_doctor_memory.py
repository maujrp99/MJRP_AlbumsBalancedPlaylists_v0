# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_doctor_memory.py - the doctor's checks of the memory layer: MEMORY.md, the shape of the log and the growth of the
Ways of Working (F1).

Family module of the doctor (F73 R5).
"""
import re

import _clock
from _now_shape import now_behind_log, now_section, now_shape


def f1_memory(root, rep, cfg=None):
    inc = "o foco atual vivia enterrado na última entrada de um log.md de 400 linhas — lido por último, escrito por último"
    cur = root / "MEMORY.md"
    if not cur.exists():
        rep.fail("F1", "MEMORY.md não existe — memória ativa sem casa (ADR-0006)", inc)
        return
    # 08→09/09: em 36 horas o arquivo foi de 0 a 452 linhas e 8.558 tokens em TODA sessão, 42%
    # do custo fixo, porque decisão e aprendizado moravam nele. Nada acusava o crescimento.
    inc_08 = ("08→09/09: o MEMORY.md chegou a 452 linhas e 8.558 tokens em toda sessão — 42% do "
              "custo fixo — e nenhum sensor via o arquivo crescer")
    texto = cur.read_text(encoding="utf-8", errors="replace")
    linhas = texto.splitlines()
    # 10/09: the line caps (## Now <= 20, file <= 40) stopped being verdicts. As errors they made
    # the agent cut exactly the Pending/Do-Not-Forget lines that keep the next session from
    # erring - the sensor optimised the proxy, not the goal. What F1 verifies now is the FORM:
    # four blocks, pointers instead of detail, pending items dated and fresh (now_shape).
    fails, warns, _notes = now_shape(root, texto, cfg)
    for m in fails:
        rep.fail("F1", m, inc, file="MEMORY.md")
    for m in warns:
        rep.warn("F1", m, inc_08, file="MEMORY.md")
    for m in _notes:
        rep.note("F1", m)
    # A section that ADR-0008 ordered emptied coming back means the write half regressed: a
    # decision was filed here instead of on the subject's page.
    # 10/09: a ghost line "## Ways of Working`, `## History`…" left by a bad slice passed this
    # check because it compared by PREFIX. Titles are compared exactly - a section is its name.
    voltou = [t for t in linhas if t.startswith("## ")
              and t.strip() not in ("## Now", "## Ways of Working")]
    if voltou:
        rep.fail("F1", f"MEMORY.md tem seção que a ADR-0008 esvaziou: {', '.join(voltou)} — "
                       f"decisão mora na página do assunto, não aqui", inc_08, file="MEMORY.md")
    behind = now_behind_log(root, now_section(texto))
    if behind:
        rep.fail("F1", behind, inc, file="MEMORY.md")
    rep.note("F1", f"MEMORY.md: {len(linhas)} linhas (contagem informativa — o veredito é a forma)")


# --- the episodic half of memory: docs/log.md and the growth of ## Ways of Working ------------
LOG_HEADER = "# log — o que aconteceu, em ordem"


LOG_ENTRY = re.compile(r"^## \[(\d{4}-\d{2}-\d{2})( \d{2}:\d{2})?\] (session|decision|ingest|inventory|harness-feedback|review|acceptance|answer|step)\b.* — ")


LOG_TIME_REQUIRED_FROM = "2026-09-10"   # the hour became mandatory on this date (log.md header)


WOW_LINES_PER_DAY_WARN = 4              # corrections of conduct do not arrive in batches


def f1_log_shape(root, rep):
    """The episodic memory keeps its shape: canonical header, parseable dated entries.

    14/09: a child project (fin-control) had docs/log.md titled "Histórico de Decisões do
    Projeto" and MEMORY.md ## Ways of Working with 12 lines in one day, all delivery
    milestones. Nothing here looked at log.md at all, and F1 only measured Ways of Working by
    size. The root was in this repository: new_project.py wrote "uma linha datada por decisão"
    into every new log.md - the template taught the wrong frame.
    """
    inc = ("14/09: fin-control nasceu com log.md 'Histórico de Decisões' e 12 marcos de entrega em "
           "## Ways of Working num só dia — o template do new_project.py dizia 'linha por decisão'")
    log = root / "docs" / "log.md"
    if not log.exists():
        return   # F1/I3 already handle the missing file; legacy paths are the onboarding's job
    linhas = log.read_text(encoding="utf-8", errors="replace").splitlines()
    primeira = next((l.strip() for l in linhas if l.strip()), "")
    if primeira != LOG_HEADER:
        rep.fail("F1", f"docs/log.md abre com '{primeira[:60]}' — o cabeçalho canônico é "
                       f"'{LOG_HEADER}': o log é episódico (o QUANDO), decisão mora na wiki", inc, file="docs/log.md")
    ruins, sem_hora = [], []
    for l in linhas:
        if not l.startswith("## "):
            continue
        m = LOG_ENTRY.match(l)
        if not m:
            ruins.append(l[:70])
        elif m.group(2) is None and m.group(1) >= LOG_TIME_REQUIRED_FROM:
            sem_hora.append(m.group(1))
    if ruins:
        rep.fail("F1", f"{len(ruins)} entrada(s) do log.md fora do formato "
                       f"'## [AAAA-MM-DD HH:MM] tipo — título' (ex.: {ruins[0]!r}) — sem o "
                       f"prefixo, o log deixa de responder por data e por grep", inc, file="docs/log.md")
    if sem_hora:
        rep.warn("F1", f"{len(sem_hora)} entrada(s) do log.md sem hora depois de "
                       f"{LOG_TIME_REQUIRED_FROM} (a primeira: {sem_hora[0]}) — duas do mesmo dia "
                       f"perdem a ordem entre si", inc, file="docs/log.md")


def f1_wow_growth(root, rep):
    """## Ways of Working grows one correction at a time; a batch is delivery history in disguise."""
    inc = ("14/09: fin-control acumulou 12 linhas em ## Ways of Working num só dia — "
           "'parametrizado', 'aprovado', 'gerada' — e o F1 só media o tamanho")
    cur = root / "MEMORY.md"
    if not cur.exists():
        return
    texto = cur.read_text(encoding="utf-8", errors="replace")
    i = texto.find("## Ways of Working")
    if i == -1:
        return
    hoje = _clock.today().isoformat()
    de_hoje = [l for l in texto[i:].splitlines() if l.startswith("- **" + hoje)]
    if len(de_hoje) > WOW_LINES_PER_DAY_WARN:
        rep.warn("F1", f"## Ways of Working ganhou {len(de_hoje)} linhas datadas de hoje (aviso a "
                       f"partir de {WOW_LINES_PER_DAY_WARN + 1}) — correção de conduta não vem em "
                       f"lote; marco de entrega mora no log.md, decisão mora na wiki", inc, file="MEMORY.md")
