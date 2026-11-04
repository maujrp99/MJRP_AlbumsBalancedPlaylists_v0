# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_doctor_kernel.py - the doctor's checks of what the harness hands down to a project: the kernel pages, the vendored
copies, the canonical catalog, the constitution mirror and the portfolio (I5 kernel, W7, W16, I5 constitution, I6).

Family module of the doctor (F73 R5). `kernel_divergentes` and `vendored_divergentes` here are delegates of `new_project_expected`
(F73 IV-03): the comparison of "what the stamp would write now" is the builder's, and the builder uses it directly, so the two
families no longer import each other. This module reaches the builder only through that one lazy import.
"""
import sys
from datetime import date
from datetime import datetime
from pathlib import Path

import _clock
from _context import Context
from _contract import CONTRACT, UnreadableYaml, read_yaml, read_yaml_strict
from _doctor_sensors import load_visual_gate


def kernel_in_repo(cfg):
    """ADR-0020 D.2: the contract says the kernel is read in place (`kernel: {source: in-repo}`), not copied."""
    k = (cfg or {}).get("kernel")
    return isinstance(k, dict) and str(k.get("source") or "").strip() == "in-repo"


def repo_kernel_root(root):
    """The nearest ancestor of `root`, inside the same repository, that holds the kernel (docs/wiki/kernel/) and a
    contract of its own - the folder a nested project reads the kernel from. None when there is none."""
    if (Path(root) / ".git").exists():
        return None                      # its own repository: nothing above it is its repository
    for d in Path(root).resolve().parents:
        if (d / CONTRACT).is_file() and (d / "docs" / "wiki" / "kernel").is_dir():
            return d
        if (d / ".git").exists():
            return None
    return None


KERNEL_STALE_DAYS = 30


def i5_kernel(root, cfg, rep, ctx=None):
    """The wiki kernel the project declares is really there, and its stamp is not stale.

    14/09: an agent inside fin-control had no way to know what log.md or ## Ways of Working
    are - the pages that define them live only in the harness. new_project.py now copies a
    stamped kernel into docs/wiki/harness/ and declares it in the contract; this is the check
    that the declaration and the disk agree (same shape as the PRINCIPLES.md inheritance).
    """
    inc = ("14/09: fin-control não tinha como saber o que log.md e ## Ways of Working são — os "
           "conceitos moravam só no harness, e a onboarding lê a wiki do projeto")
    if cfg.get("profile") == "meta":
        return   # the source does not carry a copy of itself
    k = cfg.get("kernel")
    if not k:
        rep.warn("I5", "contrato sem `kernel:` — o projeto não carrega os conceitos do harness; "
                       "rode `new_project.py --refresh-kernel <pasta>`", inc)
        return
    if kernel_in_repo(cfg):
        _i5_kernel_in_repo(root, cfg, rep)
        return
    pages = k.get("pages") or []
    if isinstance(pages, str):
        pages = [x.strip() for x in pages.strip("[] ").split(",") if x.strip()]
    faltam = [pg for pg in pages if not (root / "docs" / "wiki" / "harness" / f"{pg}.md").exists()]
    if faltam:
        rep.fail("I5", f"kernel declarado no contrato mas {len(faltam)} página(s) ausente(s) em "
                       f"docs/wiki/harness/: {', '.join(faltam[:4])} — declaração sem disco é a "
                       f"herança de mentira que o I5 existe para pegar", inc)
    v = k.get("version")
    try:
        vd = v if isinstance(v, date) else datetime.strptime(str(v), "%Y-%m-%d").date()
        idade = (_clock.today() - vd).days
    except (TypeError, ValueError):
        rep.fail("I5", f"kernel.version inválido ({v!r}) — esperado AAAA-MM-DD", inc)
        return

    # 16/09: o carimbo media IDADE, nunca CONTEUDO. Os 4 projetos ficaram com 3 paginas
    # desatualizadas (terms, adr-practice, harness-concept) no mesmo dia em que foram
    # carimbados, e o check disse VERDE - carimbo novo, conteudo velho. Um kernel so esta em
    # dia se o texto bate com a fonte; a data e pista, nao prova.
    if idade > KERNEL_STALE_DAYS:
        rep.warn("I5", f"kernel carimbado há {idade} dias (versão {vd}) — mesmo que o texto "
                       f"confira, faz tempo que ninguém verifica; rode `--refresh-kernel`", inc)

    velhas = kernel_divergentes(root, pages, (ctx or Context.for_project(root)).harness_wiki)
    if velhas is None:
        rep.note("I5", f"kernel: {len(pages)} página(s), versão {vd} — fonte não alcançável "
                       f"daqui, só a idade foi conferida")
    elif velhas:
        rep.fail("I5", f"kernel com {len(velhas)} página(s) DIVERGENTE(S) da fonte: "
                       f"{', '.join(velhas[:4])} — carimbo de {vd} mas o conteúdo envelheceu; "
                       f"rode `new_project.py --refresh-kernel <pasta>`",
                 "16/09: os 4 projetos foram carimbados e no mesmo dia 3 páginas do kernel "
                 "mudaram no harness; o I5 media só a idade e disse VERDE")
    else:
        rep.note("I5", f"kernel: {len(pages)} página(s) conferidas contra a fonte, versão {vd}, "
                       f"fonte {k.get('source', '?')}")

    # 18/09: PRINCIPLES.md e doctor.py entraram no kernel como `vendored` (arquivos fora da
    # wiki, mesmo carimbo) - mesma checagem de existencia+divergencia das paginas.
    inc_v = ("18/09: PRINCIPLES.md e doctor.py eram só referência (um caminho de texto quebrado, "
             "`<caminho-do-harness>`) até virarem cópia carimbada - sem eles no disco, ou "
             "desatualizados, o projeto não roda o próprio sensor nem sabe o que herdou")
    vendored = k.get("vendored") or []
    if isinstance(vendored, str):
        vendored = [x.strip() for x in vendored.strip("[] ").split(",") if x.strip()]
    if vendored:
        faltam_v = [ven for ven in vendored if not (root / ven).exists()]
        if faltam_v:
            rep.fail("I5", f"kernel declara {len(faltam_v)} arquivo(s) vendorizado(s) "
                           f"ausente(s): {', '.join(faltam_v)} — rode `new_project.py "
                           f"--refresh-kernel <pasta>`", inc_v)
        velhas_v = vendored_divergentes(root, vendored)
        if velhas_v is None:
            rep.note("I5", f"vendorizados: {len(vendored)} arquivo(s), versão {vd} — fonte não "
                           f"alcançável daqui, só a idade foi conferida")
        elif velhas_v:
            rep.fail("I5", f"{len(velhas_v)} arquivo(s) vendorizado(s) DIVERGENTE(S) da fonte: "
                           f"{', '.join(velhas_v)} — rode `new_project.py --refresh-kernel "
                           f"<pasta>`", inc_v)
        elif not faltam_v:
            rep.note("I5", f"vendorizados: {len(vendored)} arquivo(s) conferidos contra a "
                           f"fonte, versão {vd}")
    # 2026-10-12 (ADR-0017, revised): the visual parity kit is copied only to a code-app with a screen
    vg = load_visual_gate()
    if vg is not None and cfg.get("profile") == "code-app":
        declared = cfg.get("screen") if isinstance(cfg.get("screen"), list) else None
        has_screen = vg.screen_on_disk(root, declared) is not None
        has_kit = any(str(v).startswith("mjrp-scripts/visual_parity/") for v in vendored)
        if has_screen and not has_kit:
            rep.fail("I5", "o projeto tem tela e o kernel não traz o kit de paridade visual "
                           "(mjrp-scripts/visual_parity/) — rode `new_project.py --refresh-kernel <pasta>`", inc_v)
        elif has_kit and not has_screen:
            rep.warn("I5", "o kit de paridade visual está vendorizado num projeto sem tela — o próximo "
                           "`--refresh-kernel` não o traz mais; ele pode ir para `_archive/`", inc_v)


def _i5_kernel_in_repo(root, cfg, rep):
    """ADR-0020 D.2: a project nested in the harness repository reads the kernel in place - no pages, no vendored files,
    no version. What I5 confirms is that the kernel exists at the root of the repository, and that no stale copy is left
    to be read instead of it."""
    inc = ("2026-10-13 (ADR-0020): o Control Center carregava 29 páginas e ~50 scripts copiados do kernel para dentro do "
           "repositório que contém a fonte - uma cópia conferida contra o original no mesmo disco")
    src = repo_kernel_root(root)
    if src is None:
        rep.fail("I5", "kernel.source: in-repo, mas nenhuma pasta acima deste projeto, no mesmo repositório, traz o kernel "
                       "(docs/wiki/kernel/) e um contrato — declaração sem disco é a herança de mentira que o I5 existe "
                       "para pegar", inc)
        return
    extra = sorted(set(cfg["kernel"]) - {"source"})
    if extra:
        rep.warn("I5", f"kernel.source: in-repo não leva {', '.join(extra)} — o kernel é lido no lugar, sem versão nem "
                       "cópia; tire esses campos do contrato", inc)
    needed = ["mjrp-scripts/doctor.py", "mjrp-scripts/hooks/commit-msg", "mjrp-scripts/canonical_catalog.json"]
    faltam = [n for n in needed if not (src / n).is_file()]
    vg = load_visual_gate()
    declared = cfg.get("screen") if isinstance(cfg.get("screen"), list) else None
    if vg is not None and cfg.get("profile") == "code-app" and vg.screen_on_disk(root, declared) is not None:
        if not (src / "mjrp-scripts" / "visual_parity").is_dir():
            faltam.append("mjrp-scripts/visual_parity/")
    if faltam:
        rep.fail("I5", f"o kernel lido no lugar ({src.name}) não traz {', '.join(faltam)}", inc)
    copias = [n for n in ("docs/wiki/harness", "mjrp-scripts") if (root / n).exists()]
    if copias:
        rep.warn("I5", f"cópia do kernel ainda no disco ({', '.join(copias)}) num projeto que o lê no lugar - aposente-a "
                       "para `_backups/` (mjrp-scripts/_safe.py); os leitores seguem `kernel.source`, mas a cópia envelhece "
                       "calada", inc)
    if not faltam:
        rep.note("I5", f"kernel: lido no lugar, na raiz do repositório ({src.name}) - sem cópia a conferir")


def kernel_divergentes(root, pages, harness_wiki=None):
    """Which kernel pages of the project differ from what the stamp would generate today; None when that cannot be said from
    here (a child's vendored doctor has no builder to ask). The comparison is the builder's: `new_project_expected` (F73 IV-03)."""
    try:
        import new_project_expected as expected
    except Exception:
        return None
    return expected.kernel_divergentes(root, pages, harness_wiki)


def vendored_divergentes(root, vendored, harness_root=None):
    """The same for the vendored files outside the wiki (PRINCIPLES.md, the scripts); None when it cannot be said."""
    try:
        import new_project_expected as expected
    except Exception:
        return None
    return expected.vendored_divergentes(root, vendored, harness_root)


SPECKIT_MIRROR = Path(".specify") / "memory" / "constitution.md"


GENERATED_MARK = "GERADO de docs/specs/constitution.md"


def _pending_notes_count(child, child_cfg):
    """ADR-0019: how many canonical migration notes a neighbour has neither applied nor waived; None when it has no
    catalog copy of its own ("nunca conformado": never refreshed, so its old doctor cannot accuse itself)."""
    sys.dont_write_bytecode = True
    try:
        import conformance_check as cc
        cat = Path(child) / "mjrp-scripts" / "canonical_catalog.json"
        if not cat.is_file() and (Path(child).parent.name == "apps"):
            cat = cc.find_catalog(child) or cat      # a nested project is judged by its repository's catalog
        if not cat.is_file():
            return None
        vg = load_visual_gate()
        declared = child_cfg.get("screen") if isinstance(child_cfg.get("screen"), list) else None
        has_screen = None if vg is None else bool(vg.screen_on_disk(child, declared))
        return len(cc.pending(child, child_cfg, cc.load_catalog(cat), cat.parent / "migrations", has_screen, _clock.contract_today(child_cfg)))
    except Exception:
        return False        # could not tell: W7 says so, it never swallows it into "0 pending"


def _catalog_behind(child):
    """2026-10-19: the `id@version` this source's catalog has and the neighbour's vendored copy has not received; [] when it
    is up to date or has no copy of its own (the "nunca conformado" message covers that); None when it could not be told."""
    sys.dont_write_bytecode = True
    try:
        import conformance_check as cc
        cat = Path(child) / "mjrp-scripts" / "canonical_catalog.json"
        return cc.behind_source(cat) or [] if cat.is_file() else []
    except Exception:
        return None


def w7_kernel_downstream(root, cfg, rep, ctx=None):
    """Do lado da FONTE: mudei uma pagina do kernel - quem ficou defasado?

    16/09: o I5 passou a conferir o conteudo do kernel, mas so do lado do PROJETO - alguem
    tem que abrir o projeto para descobrir. Mudar `terms.md` aqui nao avisava nada, e foi
    assim que os 4 ficaram defasados no mesmo dia em que foram carimbados. Este e o espelho:
    rodando no harness, varre as pastas irmas e diz quem precisa de `--refresh-kernel`.

    E AVISO, nao erro: o harness nao e dono do ciclo de vida dos filhos, e um projeto pode
    estar legitimamente parado. Mas nao saber e o que nao pode continuar.
    """
    if cfg.get("profile") != "meta":
        return   # so a fonte olha para baixo
    inc = ("16/09: 3 paginas do kernel mudaram no harness e os 4 projetos seguiram com a copia "
           "velha; o I5 so acusa quando alguem abre o projeto, e ninguem abriu")
    vizinhos = sorted(d for d in root.parent.iterdir()
                      if d.is_dir() and d != root and (d / CONTRACT).exists())
    vizinhos += sorted(d for d in (root / "apps").glob("*") if d.is_dir() and (d / CONTRACT).exists())   # EP-13: nested projects too
    croot = Path(str(cfg.get("children_root") or root.parent)).expanduser()                              # EP-13: `children:` of the contract
    for nm in cfg.get("children") or []:
        d = croot / str(nm)
        if d.is_dir() and (d / CONTRACT).exists() and d != root and d not in vizinhos:
            vizinhos.append(d)
    if not vizinhos:
        return
    defasados, conferidos, com_notas, nunca, nao_av, cat_velho = [], 0, [], [], [], []
    for d in vizinhos:
        try:
            raw = read_yaml_strict((d / CONTRACT).read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, UnreadableYaml):
            nao_av.append(f"{d.name} (contrato ilegível)")       # F71 R13: unreadable is not "nothing to check"
            continue
        c = raw.get("mjrp_harness") or {}
        n_notas = _pending_notes_count(d, c) if c.get("profile") in ("code-app", "content") else 0   # ADR-0019
        if n_notas is None:
            nunca.append(d.name)
        elif n_notas is False:
            nao_av.append(d.name)
        elif n_notas:
            com_notas.append(f"{d.name} ({n_notas})")
        if c.get("profile") in ("code-app", "content") and n_notas is not None:
            behind = _catalog_behind(d)
            if behind:
                cat_velho.append(f"{d.name} ({', '.join(behind[:4])}{' e mais ' + str(len(behind) - 4) if len(behind) > 4 else ''})")
        k = c.get("kernel")
        if not k or kernel_in_repo(c):
            continue   # ADR-0020: a project that reads the kernel in place has no copy to be behind
        pages = k.get("pages") or []
        if isinstance(pages, str):
            pages = [x.strip() for x in pages.strip("[] ").split(",") if x.strip()]
        fora = kernel_divergentes(d, pages, (ctx or Context.for_project(root)).harness_wiki)
        if fora is None:
            continue
        conferidos += 1
        if fora:
            defasados.append(f"{d.name} ({len(fora)}: {', '.join(fora[:3])})")
    if nao_av:
        rep.warn("W7", f"notas de migração canônica não avaliáveis em {len(nao_av)} projeto(s) — {' · '.join(nao_av)} (catálogo ilegível ou erro ao avaliar)", inc)
    if nunca:
        rep.warn("W7", f"{len(nunca)} projeto(s) nunca conformado(s) — sem mjrp-scripts/canonical_catalog.json: {' · '.join(nunca)}. "
                       "O doctor velho deles não tem o I6 e não se acusa sozinho; rode `new_project.py <pasta> --refresh-kernel`", inc)
    if cat_velho:
        rep.warn("W7", f"{len(cat_velho)} projeto(s) com o catálogo canônico defasado desta fonte — {' · '.join(cat_velho)}. "
                       "Ele só lista as notas que conhece: \"0 pendentes\" ali não é \"em dia\". "
                       "Rode `new_project.py <pasta> --refresh-kernel`",
                 "2026-10-19: MJRPpersonal parou em adr-names@2 (a fonte, em @3) e o conformance_check disse \"0 nota(s) pendente(s)\"; "
                 "o Control Center mostrou ADRs que não sabe ler")
    if com_notas:
        rep.warn("W7", f"{len(com_notas)} projeto(s) com notas de migração canônica pendentes (ADR-0019) — {' · '.join(com_notas)}. "
                       "O `--refresh-kernel` as lista; a bootstrap em modo conform as executa", inc)
    if defasados:
        rep.warn("W7", f"{len(defasados)} projeto(s) com o kernel defasado desta fonte — "
                       f"{' · '.join(defasados)}. Rode `new_project.py <pasta> --refresh-kernel`", inc)
    elif conferidos:
        rep.note("W7", f"kernel: {conferidos} projeto(s) vizinho(s) em dia com esta fonte")


def w16_portfolio_conformance(root, cfg, rep):
    """F50 (UAT-268): the source measures the conformance of every project it sees, read-only, and leaves the result in the
    Control Center's home (`<CC_HOME>/conformance/<project>.json`) - never in a child. The child's own state is born only
    when the doctor runs INSIDE it, and the conform runs in a worktree, so the screen kept saying "nunca medida".

    A note, never a failure: a measurement that could not be written costs the screen its freshness, not the project its
    green. Only the real root of the harness writes the default home (a main checkout that the Control Center's
    `workspace.json` registers); a linked tree, a clone or a test tree measures only when `CC_HOME` is set on purpose
    (a scratch home). 2026-10-19 recheck: a selftest's temporary roots wrote test projects into the real home.
    """
    if cfg.get("profile") != "meta":
        return
    sys.dont_write_bytecode = True
    try:
        import portfolio_conformance as pc
    except ModuleNotFoundError:
        return
    allowed, why = pc.may_write_home(root)
    if not allowed:
        rep.note("W16", why)
        return
    try:
        results = pc.measure_portfolio(pc.portfolio_projects(root, cfg, read_yaml), pc.cc_home())
    except Exception as e:
        rep.warn("W16", f"conformidade do portfólio não medida ({e.__class__.__name__}: {e}) - o Control Center mostra a última medida",
                 "2026-10-18: o conform rodou num worktree e o Control Center seguiu com «nunca medida» em 7 de 11 projetos")
        return
    failed = [f"{n} ({err})" for n, _, err in results if err]
    if failed:
        rep.warn("W16", f"conformidade não medida em {len(failed)} projeto(s): {' · '.join(failed)}",
                 "2026-10-18: o conform rodou num worktree e o Control Center seguiu com «nunca medida» em 7 de 11 projetos")
    if results:
        rep.note("W16", f"conformidade medida em {len(results) - len(failed)} projeto(s) do portfólio, gravada em {pc.cc_home() / pc.STATE_DIR}")


def i5_constitution_generated(root, cfg, rep):
    """The SpecKit copy of the constitution is GENERATED, never a second written one.

    PRINCIPLES.md Part III: a project keeps two copies of the constitution - docs/specs/ and
    .specify/memory/, where SpecKit expects it - and they must be "one written and one
    generated, never two written". The incident the rule was born from: in 2 of 5 projects they
    had already diverged. 14/09, MJRPpersonal: they diverged again, and nothing saw it.
    """
    inc = ("2 dos 5 projetos com constitution.md divergente entre docs/specs/ e .specify/memory/; "
           "14/09, no retrofit do MJRPpersonal, divergiam de novo e nada acusava")
    if cfg.get("profile") == "meta":
        return   # the harness has no constitution of its own
    fonte = root / "docs" / "specs" / "constitution.md"
    espelho = root / SPECKIT_MIRROR
    if not espelho.exists():
        return   # no SpecKit copy: nothing to diverge
    if not fonte.exists():
        rep.fail("I5", f"{SPECKIT_MIRROR} existe sem a fonte docs/specs/constitution.md — "
                       f"a cópia gerada virou a única, e ninguém sabe do que ela foi gerada", inc)
        return
    texto = espelho.read_text(encoding="utf-8", errors="replace")
    if GENERATED_MARK not in texto:
        rep.fail("I5", f"{SPECKIT_MIRROR} não se declara gerada — sem o marcador, é uma SEGUNDA "
                       f"ESCRITA, e duas escritas divergem (PRINCIPLES III)", inc)
        return
    corpo = texto.split("-->", 1)[-1].lstrip("\n")
    if corpo.strip() != fonte.read_text(encoding="utf-8", errors="replace").strip():
        rep.fail("I5", f"{SPECKIT_MIRROR} se declara gerada mas **divergiu** da fonte — "
                       f"regenere de docs/specs/constitution.md", inc)
    else:
        rep.note("I5", "constitution: a cópia do SpecKit é gerada e bate com a fonte")


# 2026-10-13 (ADR-0019): the fin-control audit found the bootstrap had installed the kernel and nothing else - doctor
# green, while info-arch.md, a design system with themes, a ROADMAP in Now/Next/Later, uat@2 and the visual-sensor
# declaration were never built. I6 is the 12th and last error slot (ADR-0002's ceiling) and judges the CHILD only; the
# source's side (the Learn gate) is a sensor of the harness contract, run by A1:
#   `sensors.canonical_catalog: python3 mjrp-scripts/conformance_check.py . --learn-gate`.
# It compares the project with the catalog of what is canonical today (conformance_check.py + canonical_catalog.json,
# vendored with the kernel): warning until max(since, received) + grace_days, error after; a note in `applied` whose check
# fails is an error at once; a missing or invalid catalog is an error with the fix command; "não avaliável" is a note,
# never a pass - except a `script` clause that could not run (script missing, crash, timeout, exit 2), which is a warning.
def i6_conformance(root, cfg, rep):
    """I6 - canonical conformance of a child (code-app, content)."""
    if cfg.get("profile") not in ("code-app", "content"):
        return
    inc = ("2026-10-13: a auditoria do fin-control mostrou o kernel instalado, o doctor verde e os artefatos canônicos "
           "(info-arch, temas, ROADMAP Now/Next/Later, uat@2, screen/sensors.visual) nunca construídos")
    in_repo = kernel_in_repo(cfg)
    fix = ("o kernel deste projeto é lido no lugar (kernel.source: in-repo): restaure mjrp-scripts/ na raiz do repositório"
           if in_repo else "rode `python3 <harness>/mjrp-scripts/new_project.py <esta pasta> --refresh-kernel`")
    sys.dont_write_bytecode = True
    try:
        import conformance_check as cc
    except ModuleNotFoundError:
        rep.fail("I6", f"sem conformance_check.py nesta instância — a conformidade canônica não pode ser avaliada; {fix}", inc,
                 file=".mjrp-project.yml")
        return
    def leave_state(**kw):
        # 2026-10-14 (CC-ADR-0014 § 5): the pass leaves `.mjrp/conformance_state.json` (conformance_state@1) for the Control
        # Center. It is a courtesy to the reader: a pass that cannot write it (read-only folder, old kernel copy without the
        # writer) says so in a note and keeps its verdict - it never adds a failure or a warning.
        try:
            cc.write_conformance_state(root, cfg, **kw)
        except Exception as e:
            rep.note("I6", f"estado da conformidade não gravado em .mjrp/conformance_state.json ({e.__class__.__name__}) — "
                           f"o Control Center vai mostrar este projeto como «nunca medido»")
    catalog = cc.find_catalog(root)
    if catalog is None:
        leave_state()
        rep.fail("I6", f"sem mjrp-scripts/canonical_catalog.json — nada diz o que este projeto deve ter; {fix}", inc, file=".mjrp-project.yml")
        return
    try:
        items = cc.load_catalog(catalog)
    except cc.CatalogError as e:
        leave_state()
        rep.fail("I6", f"catálogo inválido ({e}); {fix}", inc, file="mjrp-scripts/canonical_catalog.json")
        return
    vg = load_visual_gate()
    declared = cfg.get("screen") if isinstance(cfg.get("screen"), list) else None
    has_screen = None if vg is None else bool(vg.screen_on_disk(root, declared))
    results = cc.evaluate(root, cfg, _clock.contract_today(cfg), items, has_screen, catalog.parent / "migrations")
    leave_state(has_screen=has_screen, results=results)
    gaps, unstamped = 0, False
    for r in results:
        text = cc.describe(r)
        if r["status"] == "unknown" and r.get("warn"):
            # a `script` clause that could not run (script missing, crashed, timed out): the obligation is real and unjudged
            rep.warn("I6", text, r["item"]["born_of"], file=".mjrp-project.yml")
        elif r["status"] == "unknown":
            rep.note("I6", text)
        elif r["status"] == "waived":
            rep.note("I6", f"{r['item']['title']}: {r['reasons'][0]}")
        elif r["status"] == "gap":
            gaps += 1
            unstamped = unstamped or r.get("no_stamp", False)
            (rep.fail if r["severity"] == "error" else rep.warn)("I6", text, r["item"]["born_of"], file=".mjrp-project.yml")
        for d in r.get("delegated", []):
            rep.note("I6", f"{r['item']['title']}: pré-condição vale; o veredito é do {d}")
    # the questions the conform could not resolve and put to the MJRP (`conformance.asked`): they wait for HIS answer, so the doctor
    # lists them in ONE line (never one per file) where the human reads, with the oldest date (2026-10-18, review of report-names@3)
    asked_of = getattr(cc, "asked_entries", None)
    asked = asked_of(root, cfg) if asked_of else []
    waiting = [e for e in asked if not e["problem"]]
    if waiting:
        since = min(e["asked_at"] for e in waiting)
        names = ", ".join(e["path"] for e in waiting[:4]) + (f" e mais {len(waiting) - 4}" if len(waiting) > 4 else "")
        rep.warn("I6", f"{len(waiting)} pergunta(s) ao MJRP esperando resposta em `conformance.asked` (a mais antiga, de {since}): {names} - "
                       "a resposta tira a entrada do contrato", "2026-10-18: a nota que se aplicava com o trabalho em aviso aberto; cada aviso sem solução "
                       "virou pergunta ao humano, e pergunta que ninguém vê não é respondida", file=".mjrp-project.yml")
    for e in asked:
        if e["problem"]:
            rep.warn("I6", f"conformance.asked: {e['path']}: {e['problem']}", "2026-10-18: `asked` declarado pelo próprio agente que quer a nota "
                     "aplicada não prova pergunta nenhuma", file=".mjrp-project.yml")
    if unstamped and in_repo:
        # ADR-0020 D.2: `received` leaves the contract of a nested project - it lives with the source, the grace counts from `since`
        rep.note("I6", "projeto aninhado que lê o kernel no lugar: o item entrou na data do seu `since`, na fonte; "
                       "a carência corre desde então (não há `conformance.received` aqui)")
    elif unstamped:
        rep.note("I6", "algum item sem carimbo em `conformance.received` — a carência conta do `since`; "
                       "o `--refresh-kernel` carimba o dia em que o projeto recebeu a obrigação")
    if not gaps:
        rep.note("I6", f"conformidade canônica: {len(items)} item(ns) no catálogo, nenhuma lacuna neste projeto")
