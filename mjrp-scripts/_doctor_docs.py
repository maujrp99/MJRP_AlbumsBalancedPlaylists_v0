# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_doctor_docs.py - the doctor's checks of the documents: paths that exist, links that resolve, the identity files,
the folder indexes, the scripts catalog and the shape of the features (I2, I3, I4, I5 inheritance, W6 charter, W17, W19, W20).

Family module of the doctor (F73 R5).
"""
import datetime as dt
import os
import re
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

from _doctor_kernel import kernel_in_repo, repo_kernel_root
from _skills import frontmatter


# F103 (CC-ADR-0033): MEMORY.md too — it is read first in every session and cites the wiki as [[page]]; docs/log.md is in docs/**
IDENTITY_DOCS = ["AGENTS.md", "CLAUDE.md", "GEMINI.md", "README.md", "VISION.md", "MEMORY.md"]


ABS_PATH = re.compile(r"[`'\"( ](~?/Users/[A-Za-z0-9._-]+/[^\s`'\")\]]+)")


def i2_paths(root, cfg, rep, skill_files):
    """Every declared path exists. An absolute path outside the project is only evaluated
    where that filesystem can be seen - the manual audit already produced a false MISSING by
    running from a place that could not see the folders."""
    inc = "mjrp-vault-ops aponta para um vault que não está lá; três skills ainda citam /Users/mpedroso (Mac anterior); mjrp-adr grava em docs/architecture/, aposentado pela ADR-0001"
    checked, cegos, cegos_ns = 0, 0, set()
    vistos = set()

    def judge(raw, origem):
        """Evaluate the path only if this computer can see its namespace (/Users, /home).
        A path belonging to ANOTHER user is evaluable and must fail - that is how three skills
        kept pointing at the previous Mac with nothing flagging it."""
        nonlocal checked, cegos
        p = os.path.expanduser(raw.rstrip(".,;:"))
        ns = "/" + p.lstrip("/").split("/")[0]          # /Users, /home, /opt…
        if not Path(ns).is_dir():
            cegos += 1
            cegos_ns.add(ns)
            return
        checked += 1
        if not Path(p).exists() and (origem, p) not in vistos:
            vistos.add((origem, p))
            rep.fail("I2", f"{origem}: caminho declarado não existe — {p}", inc)

    for f in skill_files:
        for m in ABS_PATH.finditer(f.read_text(encoding="utf-8", errors="replace")):
            judge(m.group(1), f.parent.name)
    for key in ("setup", "runtime"):
        for m in re.finditer(r"(?<![\w-])(~?/[A-Za-z0-9._/-]{4,})", str(cfg.get("environment", {}).get(key, ""))):
            judge(m.group(1), f"contrato environment.{key}")

    msg = f"{checked} caminho(s) absoluto(s) verificado(s)"
    if cegos:
        msg += (f"; {cegos} em {', '.join(sorted(cegos_ns))} não avaliáveis nesta máquina"
                " — rode o doctor onde o projeto vive")
    rep.note("I2", msg)


def _wiki_targets(root, cfg=None):
    """Everything a [[wikilink]] may resolve to: concept page, declared alias, terms.md entry
    and ADR. Empty => wikilinks are not evaluable."""
    targets = set()
    conc = root / "docs" / "wiki"
    pages = []
    src = repo_kernel_root(root) if kernel_in_repo(cfg) else None   # ADR-0020: a nested project reads the root's kernel
    if src is not None:
        pages = list((src / "docs" / "wiki" / "kernel").rglob("*.md"))
    if conc.is_dir() or pages:
        # 14/09: the kernel copied by new_project.py lives in docs/wiki/harness/ and links to
        # itself ([[terms]], [[base-concept]]); those pages are part of this project's wiki.
        # 2026-10-09: the kernel source is organised by theme (docs/wiki/kernel/<theme>/<page>.md)
        for f in (list(conc.glob("*.md")) + list((conc / "harness").glob("*.md"))
                  + list((conc / "kernel").rglob("*.md")) + pages):
            targets.add(f.stem.lower())
            al = frontmatter(f).get("aliases") or []
            if isinstance(al, str):
                al = re.split(r",\s*", al.strip("[] "))
            for a in al:
                a = str(a).strip().strip("'\"")
                if a:
                    targets.add(a.lower())
    dec = root / "docs" / "decisions"
    if dec.is_dir():
        for f in dec.glob("[0-9]*.md"):
            targets.add("adr-%s" % f.stem.split("-")[0])
    # 04/10, S-63: the requirements graph links nodes by file name - a requirement or NFR file
    # ([[S-07]]), a spec document ([[prd#^EP-01]], [[info-arch#^state]]) or a root document
    # ([[ROADMAP#^OUT-01]]). Incident: the first new_project.py run with the graph template went
    # red on I3 for links that are correct. Whether the #^anchor exists is the graph sensor's job.
    specs = root / "docs" / "specs"
    if specs.is_dir():
        for f in list(specs.glob("*.md")) + list((specs / "requirements").rglob("*.md")):  # S-123: one folder per epic
            targets.add(f.stem.lower())
        # 2026-10-09 (MJRP): a requirement file is <ID>-<slug>.md and links name the whole stem; the bare ID
        # ([[S-31]]) still resolves here during the transition -- the graph sensor flags it (link_stem)
        for f in (specs / "requirements").rglob("*.md"):
            # the NFR may carry the ID prefix of a nested project (CC-NFR-03): the same pattern as the graph sensor
            m = re.match(r"((?:S|UC|EA|(?:[A-Z]{2,}-)?NFR)-\d{2,})(?=-|$)", f.stem)
            if m:
                targets.add(m.group(1).lower())
        # 2026-10-18 (fin-control): a feature is docs/specs/features/<Fxx-slug>/spec.md, so its file stem is `spec` and
        # `slows:: [[F09]]` named nothing. The ID of a feature resolves like a node's: the frontmatter `id:`, the `Fxx`
        # prefix of the folder and the whole folder name ([[F12-pl-and-cash-flow]], as the skills write it).
        for f in (specs / "features").glob("*/spec.md"):
            targets.add(f.parent.name.lower())
            m = re.match(r"(F\d{2,})(?=-|$)", f.parent.name)
            if m:
                targets.add(m.group(1).lower())
            fid = str(frontmatter(f).get("id") or "").strip().strip("'\"")
            if fid:
                targets.add(fid.lower())
        # the same for the other graph IDs a link may name bare: an issue of the UAT, an outcome or a release of the
        # ROADMAP, an epic of the PRD ([[uat#^UAT-12]] and [[ROADMAP#^OUT-01]] already resolve by the file)
        for rel, pat in (("uat.md", r"^\|\s*\**(UAT-\d+)\b"), ("prd.md", r"\^((?:[A-Z]{2,}-)?EP-\d{2,})\b")):
            if (specs / rel).is_file():
                txt = (specs / rel).read_text(encoding="utf-8", errors="replace")
                targets.update(i.lower() for i in re.findall(pat, txt, re.M))
    road = root / "ROADMAP.md"
    if road.is_file():
        targets.update(i.lower() for i in re.findall(r"\^((?:[A-Z]{2,}-)?(?:OUT|REL)-\d{2,})\b",
                                                      road.read_text(encoding="utf-8", errors="replace")))
    for f in root.glob("*.md"):
        targets.add(f.stem.lower())
    return targets


def i3_links(root, rep, cfg=None):
    inc = "a renomeação para mjrp-harness quebrou dois caminhos no visual-notes-hub sem que nada acusasse"
    inc_wiki = ("a revisão de 07/09 tirou definições do VISION apontando para páginas de conceito que não existiam, e nada acusou; "
                "o MJRP (2026-10-27) pediu o link quebrado acusado também no MEMORY.md e no log (F103)")
    docs = [root / d for d in IDENTITY_DOCS] + sorted((root / "docs").rglob("*.md"))
    targets = _wiki_targets(root, cfg)
    n = nw = 0
    for doc in docs:
        if not doc.exists() or "_backups" in doc.parts or "_archive" in doc.parts:
            continue
        n += 1
        txt = doc.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r"\]\(([^)#\s]+?)(?:#[^)]*)?\)", txt):
            t = m.group(1)
            if t.startswith(("http://", "https://", "mailto:")):
                continue
            if not (doc.parent / t).exists():
                rep.fail("I3", f"{doc.relative_to(root)}: link para '{t}' não existe", inc)
        # wikilinks: [[target]] or [[target|text]]. Inside code it is an example, not a reference.
        sem_codigo = re.sub(r"```.*?```", "", txt, flags=re.S)
        sem_codigo = re.sub(r"`[^`\n]*`", "", sem_codigo)
        for m in re.finditer(r"\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]", sem_codigo):
            target = m.group(1).strip().split("#", 1)[0].strip().lower()
            nw += 1
            if not target:
                continue  # [[#heading]] - a link inside the same page
            # A sibling file resolves too: the feature templates link plan.md to [[spec]] and tasks.md to
            # [[plan]] in the same folder, as Obsidian does (2026-10-10, F01 of the Control Center).
            sibling = doc.parent / (m.group(1).strip().split("#", 1)[0].strip() + ".md")
            if targets and target not in targets and not sibling.exists():
                rep.fail("I3", f"{doc.relative_to(root)}: wikilink [[{m.group(1).strip()}]] não resolve "
                               f"(nem página em docs/wiki/, nem alias, nem ADR)", inc_wiki)
    rep.note("I3", f"{n} documentos conferidos · {nw} wikilink(s)")


def i4_agents(root, rep):
    inc = "dois projetos com CLAUDE.md, dois com GEMINI.md, nenhum com AGENTS.md: instrução divergente por ferramenta"
    if not (root / "AGENTS.md").exists():
        rep.fail("I4", "AGENTS.md não existe — é o canônico (ADR-0001)", inc)
        return
    for name in ("CLAUDE.md", "GEMINI.md"):
        f = root / name
        if f.exists() and "AGENTS.md" not in f.read_text(encoding="utf-8", errors="replace"):
            rep.fail("I4", f"{name} não aponta para AGENTS.md — vira segunda fonte de instruções", inc)
    rep.note("I4", "AGENTS.md canônico, ponteiros ok")


def i5_principles_inheritance(root, rep):
    # 14/09: um projeto novo, aberto direto no Gemini sem passar por onboarding/bootstrap, não
    # declarou a herança do PRINCIPLES.md em lugar nenhum — nem AGENTS.md nem constitution.md a
    # mencionavam. PRINCIPLES.md §III é claro: são exatamente três coisas que um constitution.md
    # faz, e a primeira é "declara a herança". Sem meio-termo, então é ERRO, não aviso.
    inc = ("14/09: projeto bootstrapado fora do Claude Code (Gemini, sem onboarding/bootstrap) "
           "não declarou a herança do PRINCIPLES.md em AGENTS.md nem em constitution.md")
    agents = root / "AGENTS.md"
    if not agents.exists():
        return  # I4 já cobre a ausência do arquivo; não duplicar o erro aqui
    agents_txt = agents.read_text(encoding="utf-8", errors="replace")
    if "PRINCIPLES.md" in agents_txt:
        rep.note("I5", "herança do PRINCIPLES.md declarada em AGENTS.md")
        return
    const = root / "docs" / "specs" / "constitution.md"
    if const.exists() and "PRINCIPLES.md" in const.read_text(encoding="utf-8", errors="replace"):
        rep.note("I5", "herança do PRINCIPLES.md declarada em constitution.md")
        return
    rep.fail("I5", "nem AGENTS.md nem docs/specs/constitution.md declaram a herança do "
                   "PRINCIPLES.md (PRINCIPLES.md §III: \"este projeto segue o PRINCIPLES.md do "
                   "MJRP Harness, versão X\") — herdar não é opcional", inc)


def w6_charter_not_migrated(root, rep):
    # mesmo incidente do I5: o Gemini criou um CHARTER.md cheio (não o stub de 5 linhas do
    # retrofit) sem nenhum docs/specs/prd.md — exatamente o padrão que a migração CHARTER→PRD
    # (BACKLOG #33/#44) deveria ter aposentado. Aviso, não erro: um brownfield em retrofit
    # legítimo também pode ter um CHARTER.md grande por um tempo, e o doctor não julga isso —
    # só torna visível.
    inc = ("14/09: CHARTER.md completo (não-stub) sem prd.md correspondente num projeto aberto "
           "fora do fluxo de bootstrap — parece charter novo, não retrofit em andamento")
    charter = root / "CHARTER.md"
    if not charter.exists():
        return
    linhas = len(charter.read_text(encoding="utf-8", errors="replace").splitlines())
    prd = root / "docs" / "specs" / "prd.md"
    if linhas > 10 and not prd.exists():
        rep.warn("W6", f"CHARTER.md tem {linhas} linhas (não é o stub de 5 linhas do retrofit) e "
                       f"não existe docs/specs/prd.md — CHARTER.md foi substituído pelo PRD "
                       f"(mjrp-coaching-pm, reference/prd-guide.md); se é retrofit em andamento, "
                       f"ignore", inc)


def w17_folder_index(root, cfg, rep):
    """W17 - the folder indexes declared under `inventory:` still tell the truth (warning only, never an error: ADR-0002's cap).

    `inventory_check.py` already said exit 1 on a stale index, but nothing ran it. It checks the table both ways (a file on
    disk outside the index, an item that no longer exists) and the numbers the index states in prose: the `N itens` of
    the header and the `· N arquivos` of each first-level folder of the tree (the latter not in a linked worktree, which
    lacks the ignored files the checkout where the skill ran carried).
    """
    inc = ("20/10/2026: o folder-index de `mjrp-scripts/` ficou um dia atrás, com 4 scripts fora da tabela e as contagens em "
           "prosa velhas (\"90 itens\" que eram 94, `migrations/` \"78 arquivos\" que eram 81, catálogo \"18 itens\" que eram 34) — "
           "o `inventory_check.py` acusava, mas nenhum sensor o executava")
    declared = cfg.get("inventory")
    if not isinstance(declared, list) or not declared:
        return
    sys.dont_write_bytecode = True
    try:
        import inventory_check as ic
    except ModuleNotFoundError:
        return
    try:
        code, found = ic.findings([str(x) for x in declared], Path(root).resolve())
    except Exception as e:
        rep.warn("W17", f"folder-index não avaliado ({e.__class__.__name__}: {e})", inc)
        return
    por_pasta = {}
    for rel, msg in found:
        por_pasta.setdefault(rel, []).append(msg)
    for rel, msgs in por_pasta.items():
        if all(m.endswith("(não avaliável)") or m.startswith("não é pasta") for m in msgs):
            rep.note("W17", f"{rel}: folder-index não avaliável — {' · '.join(msgs)}")
            continue
        rep.warn("W17", f"folder-index de `{rel}` desatualizado — {' · '.join(msgs)}. Rode a skill mjrp-inventorying-folders nesta pasta", inc,
                 f"{rel}/folder-index.md")
    if not por_pasta:
        rep.note("W17", "folder-index das pastas declaradas em `inventory:` em dia")


def w19_scripts_catalog(root, cfg, rep):
    """W19 - every `mjrp-scripts/*.py` has its entry in `scripts-catalog.yml`, and no entry outlives its script (warning only, never an error).

    The catalog is what the Control Center's «Catálogo de Scripts & Sensors» card reads: a script born without an entry shows up
    «sem entrada no catálogo», unexplained; an entry left behind describes what is gone. `scripts_catalog_check.py` says it (the MJRP,
    2026-10-19 23:49). The second direction holds only where the catalog is OWNED (`profile: meta`, the harness): a child carries the
    whole catalog with the kernel and only the scripts it vendors, so entries without a script there are by design.
    """
    inc = ("19/10/2026 23:49: o MJRP pediu o catálogo de scripts na tela, com a regra «todo script tem a sua entrada» e um sensor que a "
           "cobre; sem ele, o script novo nascia sem entrada e só a tela mostraria — o aviso é o sensor")
    sys.dont_write_bytecode = True
    try:
        import scripts_catalog_check as scc
    except ModuleNotFoundError:
        return
    try:
        found = scc.findings(Path(root).resolve(), owns_catalog=cfg.get("profile") == "meta")
    except Exception as e:
        rep.warn("W19", f"catálogo de scripts não avaliado ({e.__class__.__name__}: {e})", inc)
        return
    if found is None:
        rep.note("W19", "catálogo de scripts: não há `mjrp-scripts/scripts-catalog.yml` neste projeto")
        return
    missing, stale = found
    if missing:
        rep.warn("W19", f"{len(missing)} script(s) sem entrada em `mjrp-scripts/scripts-catalog.yml` — {' · '.join(missing[:6])}"
                        f"{' …' if len(missing) > 6 else ''} (tema, frase, motivo de uso e quando roda; "
                        f"`python3 mjrp-scripts/scripts_catalog_check.py` lista todos)", inc, "mjrp-scripts/scripts-catalog.yml")
    if stale:
        rep.warn("W19", f"{len(stale)} entrada(s) de `scripts-catalog.yml` sem script — {' · '.join(stale[:6])}"
                        f"{' …' if len(stale) > 6 else ''} (tire a entrada)", inc, "mjrp-scripts/scripts-catalog.yml")
    if not missing and not stale:
        rep.note("W19", "todo script de `mjrp-scripts/` tem a sua entrada no catálogo")


def w20_sdd_shape(root, cfg, rep):
    """W20 - the features that are out of the SDD templates but not closed: the open ones with a missing/empty section, and the «a escrever»
    markers left in the closed ones of the acervo (warning only, never an error).

    The ERROR for a CLOSED feature out of the shape is not here: the ADR-0002 ceiling of error checks is full, so it is the declared sensor
    `sdd_shape` (`sdd_shape_check.py`, run by the A1 and by the pre-commit). This check only says what the sensor, which fails or passes, cannot:
    the fast lane documents afterwards but before the close, and the warning is the reminder (F95, harness-kaizen 2026-10-26 21:14).
    """
    inc = ("2026-10-26 21:14: de F43 a F94 nenhuma feature seguiu o molde do SDD e nada cobrou; o sensor recusa a feature que fecha sem as "
           "seções, e este aviso lembra a que corre — a via rápida documenta depois, mas antes do fecho")
    sys.dont_write_bytecode = True
    try:
        import sdd_shape_check as ssc
    except ModuleNotFoundError:
        return
    try:
        found = ssc.findings(Path(root).resolve())
    except ssc.NotEvaluable as e:
        rep.note("W20", f"forma das features nos moldes do SDD: não avaliável ({e})")
        return
    except Exception as e:
        rep.warn("W20", f"forma das features não avaliada ({e.__class__.__name__}: {e})", inc)
        return
    warned = sorted({f[1] for f in found if f[0] == "warn"})
    if warned:
        names = [Path(w).name.split("-")[0] for w in warned]
        rep.warn("W20", f"{len(warned)} feature(s) fora dos moldes do SDD ou com «a escrever» — {' · '.join(names[:10])}"
                        f"{' …' if len(names) > 10 else ''}. Dono: o integrador, que escreve cada campo no fecho da feature; "
                        f"a partir de {ssc.PENDING_TURN_DATE.isoformat()} o campo esquecido numa feature fechada vira erro do sensor `sdd_shape` "
                        f"(a aberta documenta antes do fecho). `python3 mjrp-scripts/sdd_shape_check.py .` diz a seção de cada uma", inc, warned[0])
    else:
        rep.note("W20", "as features (F43+) estão nos moldes do SDD, sem «a escrever» pendente")


def w21_screen_answers(root, rep):
    """W21 - an answer given on the Control Center's screen that stayed unexecuted for more than a day (F166, CC-ADR-0039 section 8), with the commit
    to make when it has none. A warning: the ceiling of error checks of ADR-0002 is full."""
    inc = ("2026-11-03: o MJRP perguntou como o agente do projeto fica sabendo de uma resposta dada na tela; o tipo `answer` fica fora do F1 e "
           "o ## Now não muda, então a resposta podia ficar parada sem ninguém executar")
    sys.dont_write_bytecode = True
    try:
        import screen_answers as sa
    except ModuleNotFoundError:
        return
    state = sa.state_of(root)
    limit = (dt.datetime.now(ZoneInfo("America/Sao_Paulo")) - dt.timedelta(days=1)).strftime("%Y-%m-%d %H:%M")
    old = [a for a in state.pending if a.at < limit]
    stale = [b for b in getattr(state, "batches", []) if b.answered and b.at and b.at < limit]  # F181 (CC-ADR-0042 section 6)
    if stale:
        rep.warn("W21", f"{len(stale)} lote(s) de propostas respondido(s) na tela e sem aplicar há mais de um dia: "
                        f"{', '.join(b.name for b in stale)}. " + " ".join(s.strip() for s in sa.lines_of(state)[1:]), inc)
    if old:
        rep.warn("W21", f"{len(old)} resposta(s) da tela parada(s) há mais de um dia: {', '.join(a.id for a in old)}. " + " ".join(s.strip() for s in sa.lines_of(state)[1:]), inc)


def w22_returned(root, rep):
    """W22 - what the MJRP handed back from the iPhone (F205) and no agent acted on past the contract's deadline (F220, S-226; `returned_check.py`).
    A warning: the ceiling of error checks of ADR-0002 is full; the block is the Stop gate of the project's orchestrator (stop_gate.py). A measure
    that does not read (a folder outside the account's projects, the bridge) is a note, never a red doctor: the sensor itself exits 2 for it."""
    inc = ("2026-11-07: o MJRP devolveu pelo iPhone treze itens travados de quatro projetos; a mensagem aparecia no início de sessão e nada "
           "obrigava o agente dono a agir («nao adianta eu devolver e ficar sem acao, precisamos de um sensor»)")
    sys.dont_write_bytecode = True
    try:
        import returned_check as rc
    except ModuleNotFoundError:
        return
    try:
        project, hours, late = rc.charged(root)
    except rc.Unevaluable as e:
        rep.note("W22", f"o que o MJRP devolve pelo iPhone não foi medido aqui ({e})")
        return
    if late:
        rep.warn("W22", " ".join(rc.report_lines(project, hours, late)), inc)
    else:
        rep.note("W22", f"nada do que o MJRP devolveu ao {project} está sem ação além de {hours:g} h")


def w23_pile_up(root, rep):
    """W23 - the board piled up outside «Pronto para UAT» (F222, S-227; `pile_up_check.py`): over 3 features or issues in «Esperando», over 10 in
    the backlog, or an item of the «Priorizada» not started with a free slot (four at a time). A warning: the ceiling of error checks of ADR-0002
    is full; the block is the Stop gate of the project's orchestrator. The measure builds the served board (~30 s), so the doctor reads the
    cache the sensor keeps (CACHE_SECONDS) and says so when there is none: a note, never a pass."""
    inc = ("2026-11-07: a F150 ficou dias «esperando o MJRP» sem ter ido à `main` e o board acumulava sem ninguém ser cobrado "
           "(«vamos deixar acumular apenas no pronto pra UAT, aí eu sou o gargalo»)")
    sys.dont_write_bytecode = True
    try:
        import pile_up_check as pc
    except ModuleNotFoundError:
        return
    import time as _time
    rows = pc.read_cache(Path(root) / ".mjrp", int(_time.time()))
    if rows is None:
        rep.note("W23", "o acúmulo do board não foi medido aqui (sem leitura recente; rode `python3 mjrp-scripts/pile_up_check.py`)")
    elif any(fs for _, fs in rows):
        rep.warn("W23", " ".join(s.strip() for s in pc.report_lines(rows)), inc)
    else:
        rep.note("W23", "o board não acumulou fora do «Pronto para UAT»")
