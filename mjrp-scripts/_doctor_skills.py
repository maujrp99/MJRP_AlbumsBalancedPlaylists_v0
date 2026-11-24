# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_doctor_skills.py - the doctor's checks of the skills: installed against source (C1), the size of the descriptions
(W1), the boundary skills that age (W5) and the Cowork marker (W8).

Family module of the doctor (F73 R5).
"""
import json
import os
import time
from datetime import datetime
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _git
from _contract import UnreadableYaml
from _skills import INSTALLED_DIRS, find_skills, frontmatter, skill_digest


def c1_conformance(root, cfg, rep):
    """instalado × fonte: sobra, divergiu por hash, duplicata."""
    inc = "22 skills que não existem mais na fonte no htmlPreview; 9 de 9 no visual-notes-hub; duplicatas ativas no mesmo diretório"
    # 17/09 (BACKLOG #63): C1 só enxerga INSTALLED_DIRS no filesystem local. O cache de sync do
    # Cowork (/root/.claude/skills/synced/<bucket>/) só existe dentro de uma sessão Cowork ativa
    # e nunca foi lido por este check, em nenhum ambiente - rodando daqui (device_bash/Mac) ou de
    # dentro do próprio Cowork. Sem esta linha o veredito de C1 é lido como "a instalação está
    # ok" quando o enunciado real é "o que dá para ver do disco está ok" - foi essa confusão que
    # deixou 39/54 skills divergentes 8 dias sem nenhum sensor acusar (achado 17/09). Verificação
    # de verdade é o #62, ainda não construído.
    rep.note("C1", "Cowork (skills sincronizadas numa sessão ativa) não verificado por este "
                   "check - só vê o filesystem local; ver BACKLOG #62/#63")
    if cfg.get("profile") == "meta":
        rep.note("C1", "n/a — este repositório é a fonte")
        return
    installed = find_skills(root, INSTALLED_DIRS)
    if not installed:
        # 2026-10-20 (review P2-1): in a child the skills arrive by the plugin, so «nothing installed» is true of EVERY child - a line
        # that always shows teaches to ignore it. It is a note; «source not found» below is the real «could not compare».
        rep.note("C1", "nenhuma skill instalada nesta instância (as skills vêm pelo plugin) — nada instalado a comparar com a fonte")
        return
    src_root = Path(os.path.expanduser(str(cfg.get("harness_root") or cfg.get("source") or "~/mjrp/projects/mjrp-harness")))
    if not (src_root / "mjrp-skills").is_dir():
        # F73 R3 (the MJRP, 2026-10-25 17:01): a missing source is the ENVIRONMENT (a child without the harness at hand, the bridge,
        # the Cowork), declared here as a note; the exit 2 of the doctor is for a check that should have run and did not.
        rep.note("C1", f"fonte das skills não encontrada em {src_root} — instalada × fonte não comparada neste ambiente")
        return
    source = find_skills(src_root, ["mjrp-skills"])
    for name, paths in sorted(installed.items()):
        if len(paths) > 1:
            rep.fail("C1", f"'{name}' instalada em {len(paths)} lugares: " +
                     ", ".join(str(p.relative_to(root)) for p in paths), inc)
        if name not in source:
            rep.fail("C1", f"'{name}' instalada e não existe mais na fonte (fantasma)", inc)
        elif skill_digest(paths[0]) != skill_digest(source[name][0]):
            rep.fail("C1", f"'{name}' divergiu da fonte (hash diferente)", inc)
    for name in installed:
        alt = name[5:] if name.startswith("mjrp-") else "mjrp-" + name
        if alt in installed:
            rep.fail("C1", f"'{name}' e '{alt}' instaladas juntas — roteamento ambíguo", inc)
            break
    rep.note("C1", f"{len(installed)} skills instaladas conferidas contra a fonte")


# The platform's HARD limit. Above it the upload is REFUSED - the skill simply does not
# install, and the message that says so appears in the tool, not here. This is not the same
# thing as W1: W1 is about cost (tokens in every session), this is about the skill existing
# at all. Two different failures, two different checks.
DESCRIPTION_HARD_LIMIT = 1024


DESCRIPTION_MARGIN = 950          # within 8% of the ceiling: one edit away from breaking


# There is NO per-skill target here, and that absence is the decision.
#
# It was 200, a number I invented and wrote into ADR-0002 as criterion. When the 53 skills were
# actually rewritten to meet it, the Zé looked at the result and said the opposite of what I had
# assumed: the mjrp-sw-factory (ex-build-framework) skills are the ones he expects to APPEAR ON THEIR OWN, so they are
# where the trigger list earns its cost. I then proposed 650 - a number calibrated on the very
# cut he had just rejected. Two invented numbers in one day is enough.
#
# What is left are the two limits the PLATFORM gives, which nobody has to agree with:
#   · 1024 - above it the upload is refused and the skill does not install. Error.
#   · the margin below it - one edit away from that. Warning.
# And the SUM, which is the only cost that is actually paid: reported always, warned about only
# when it GROWS past where a deliberate decision left it. It measures drift, not taste.
DESCRIPTION_BUDGET = 33000


def w1_descriptions(rep, skill_files):
    inc = ("49 de 49 descriptions acima de 200 caracteres — cerca de 8.000 tokens em toda "
           "sessão; em 09/09, com a memória já enxuta, eram 67% de todo o custo fixo")
    inc_1024 = ("09/09: o upload da mjrp-onboarding foi RECUSADO — 'description must be at most "
                "1024 characters'. Outra ferramenta encurtou o arquivo no disco para conseguir "
                "subir, e ninguém soube por quê; o harness não media esse limite")
    estouradas, no_limite = [], []
    total = 0
    for f in skill_files:
        try:
            d = str(frontmatter(f, strict=True).get("description", ""))
        except UnreadableYaml as e:
            # F71 R13: an unparsable frontmatter has no readable description -- not "0 characters, within the limit"
            rep.unevaluable("W1", f"{f.parent.name}: o frontmatter do SKILL.md não é legível ({e}) — o limite de description "
                                  f"não foi medido", inc_1024, str(f))
            continue
        n = len(d)
        total += n
        pass
        if n > DESCRIPTION_HARD_LIMIT:
            estouradas.append((f.parent.name, n))
        elif n > DESCRIPTION_MARGIN:
            no_limite.append((f.parent.name, n))
    # The hard limit is an ERROR: a skill that does not install is not a warning.
    for nome, n in sorted(estouradas, key=lambda x: -x[1]):
        rep.fail("W1", f"{nome}: description com {n} chars — acima do limite duro de "
                       f"{DESCRIPTION_HARD_LIMIT}; a skill NÃO instala", inc_1024)
    if no_limite:
        pior = max(no_limite, key=lambda x: x[1])
        rep.warn("W1", f"{len(no_limite)} skill(s) a menos de {DESCRIPTION_HARD_LIMIT - DESCRIPTION_MARGIN} "
                       f"chars do limite duro (pior: {pior[0]}, {pior[1]}/{DESCRIPTION_HARD_LIMIT}) — "
                       f"uma frase a mais e para de instalar", inc_1024)
    if total > DESCRIPTION_BUDGET:
        rep.warn("W1", f"as {len(skill_files)} descriptions somam {total} chars (~{total // 4} "
                       f"tokens em TODA sessão), acima de onde a decisão de 09/09 deixou "
                       f"({DESCRIPTION_BUDGET}) — cresceu; veja o que entrou", inc)
    else:
        rep.note("W1", f"descriptions: {total} chars (~{total // 4} tokens/sessão), "
                       f"dentro de {DESCRIPTION_BUDGET}")


# BACKLOG #42 / ADR-0009: skills de fronteira envelhecem caladas — rodam uma vez, no início,
# quando ninguém tem repertório para desconfiar; o custo de estarem erradas é pago espalhado por
# toda sessão seguinte, não na sessão em que rodaram. Incidente: 11/09, a mjrp-project-bootstrap
# estava 14 pontos atrasada (nem criava o .mjrp-project.yml) e ninguém tinha notado.
#
# Lista em código, não no contrato — mantém o critério da ADR-0002 §4 (determinístico, sem rede,
# sem julgamento). Proxy de "revisada" é a data do último commit do SKILL.md fonte, mesma lógica
# que F3/W2 já usam para git: não é prova de revisão substantiva, é o único sinal que já existe.
# 04/10, S-63: mjrp-project-bootstrap renomeada mjrp-pdlc-bootstrap; o nome antigo fica enquanto
# projeto-filho tiver a pasta antiga instalada (some quando o kernel de todos for atualizado).
# 04/10, S-72: mjrp-onboarding renomeada mjrp-pdlc-onboarding; mesma regra para o nome antigo.
BOUNDARY_SKILLS = {"mjrp-onboarding", "mjrp-pdlc-onboarding", "mjrp-pdlc-bootstrap", "mjrp-project-bootstrap"}


BOUNDARY_STALE_DAYS = 30


def w5_boundary_skills(root, rep, skill_files):
    inc = ("11/09: a mjrp-project-bootstrap estava atrasada em 14 pontos — nem criava o "
           ".mjrp-project.yml — e ninguém tinha notado; skill de fronteira envelhece calada")
    alvos = [f for f in skill_files if f.parent.name in BOUNDARY_SKILLS]
    stale = []
    for f in sorted(alvos, key=lambda f: f.parent.name):
        code, out = _git.run_tuple(root, "log", "-1", "--format=%ct", "--", str(f), strip=True)
        if code != 0 or not out.strip().isdigit():
            rep.warn("W5", f"{f.parent.name}: sem histórico git para o SKILL.md — não dá para "
                           f"medir a janela de revisão", inc)
            continue
        dias = (time.time() - int(out.strip())) / 86400
        if dias > BOUNDARY_STALE_DAYS:
            stale.append((f.parent.name, int(dias)))
    for nome, dias in stale:
        rep.warn("W5", f"{nome}: sem revisão (sem commit no SKILL.md) há {dias} dias — passou "
                       f"da janela de {BOUNDARY_STALE_DAYS}; é skill de fronteira, revisar por "
                       f"calendário", inc)
    if alvos and not stale:
        rep.note("W5", f"{len(alvos)} skill(s) de fronteira dentro da janela de "
                       f"{BOUNDARY_STALE_DAYS} dias")


# BACKLOG #62/#63: nada roda sozinho hoje - nem de tempos em tempos, nem em gatilho automático
# (achado do MJRP, 17/09, ver conversa com outro agente registrada em MEMORY.md). O `#62` de
# verdade (verificar o que está DE FATO instalado no Cowork) só dá para rodar DE DENTRO de uma
# sessão Cowork ativa - ver `cowork_sync_check.py` e a scheduled task diária. Mas metade do gap
# não precisa do Cowork nenhum: o `skills_status.py` já sabe responder "o que mudou desde a
# última subida" (BACKLOG #63) usando só `git diff` contra o marcador - só que ninguém digitava o
# comando, e foi exatamente esse silêncio que deixou 53+ skills mudarem por 8 dias sem
# ninguém notar. W8 é essa MESMA lógica, rodando sozinha a cada SessionStart, de graça (sem
# device_bash, sem Cowork, só o git local) - não substitui o #62, avisa que HÁ trabalho pendente
# enquanto o #62 (a verificação de verdade, diária) ainda não rodou.
def w8_cowork_marker(root, cfg, rep):
    """W8 - drift do marcador de Cowork sem ninguém rodar skills_status.py à mão."""
    inc = ("17/09: o marcador de skills_status.py ficou 8 dias parado enquanto 53+ skills "
           "mudavam, e nada avisava - só apareceu porque o MJRP pediu verificação manual")
    if cfg.get("profile") != "meta":
        rep.note("W8", "n/a — só se aplica à fonte (profile: meta)")
        return
    try:
        import importlib
        import skills_status as ss
        importlib.reload(ss)
        ss.ROOT_DIR = root
        ss.MARKER = root / ".mjrp" / "cowork-install.json"
    except Exception as e:
        rep.warn("W8", f"skills_status.py não pôde ser importado ({e}) — drift de Cowork não avaliado", inc)
        return

    if not ss.MARKER.exists():
        rep.warn("W8", "nenhuma subida para o Cowork jamais registrada "
                       "(.mjrp/cowork-install.json não existe) — rode "
                       "`python3 mjrp-scripts/skills_status.py --marcar` depois de subir tudo", inc)
        return

    try:
        marco = json.loads(ss.MARKER.read_text(encoding="utf-8"))
        nomes, _novas = ss.changed(marco["commit"])
    except Exception as e:
        rep.warn("W8", f"marcador ilegível ou git falhou ({e}) — drift de Cowork não avaliado", inc)
        return

    idade_dias = int((time.time() - datetime.strptime(marco["quando"], "%Y-%m-%d %H:%M").timestamp()) / 86400)
    if nomes:
        # one warning per changed skill (2026-10-10, Control Center F04): the skill name is part of
        # the finding identity, so each skill has its own age in the ledger and the one that is
        # uploaded closes alone on the next pass
        for nome in sorted(nomes):
            rep.warn("W8", f"skill {nome} mudou desde a última subida pro Cowork "
                           f"({marco['quando']}, {idade_dias}d atrás) e ainda não foi reempacotada — "
                           f"`propose_skills` + git commit fecham isto "
                           f"(Ways of Working, MEMORY.md 17/09 21:46)", inc)
    else:
        rep.note("W8", f"nenhuma skill mudou desde a última subida pro Cowork "
                       f"({marco['quando']}, {idade_dias}d atrás)")
