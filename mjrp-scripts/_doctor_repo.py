# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_doctor_repo.py - the doctor's checks of the repository and the machine around it: git state, edits not committed,
the structure, sessions and orphan locks, the prototype inventory, retired names, backup, disk and the fix branches
(F3, W2, W4, W9, W10, W11, W12, W13, W14, W15, W18).

Family module of the doctor (F73 R5).
"""
import os
import re
import shutil
import sys
from pathlib import Path

import _clock
import _git
from _contract import CONTRACT, read_yaml


def f3_git(root, rep):
    inc = "careertransition, conteúdo de recolocação, sem git nenhum"
    top = _git.toplevel(root)
    if top is None:
        rep.fail("F3", "o projeto não está sob git — não há histórico nem como voltar atrás", inc)
        return
    aninhado = top.resolve() != Path(root).resolve()
    if aninhado:
        # projeto aninhado: o repo é do pai. Push e edições não-commitadas são do doctor
        # DELE (W2/W4 rodam lá, sobre a árvore inteira) — reportar de novo aqui seria eco.
        rep.note("F3", f"sob git do repo pai ({top.name}) — projeto aninhado, sem repo próprio")
        return
    code, out = _git.run_tuple(root, "status", "-sb", strip=True)
    m = re.search(r"ahead (\d+)", out or "")
    plog = root / ".mjrp" / "push.log"
    ultimo = "nunca registrado"
    if plog.exists():
        lines = [l for l in plog.read_text(encoding="utf-8").splitlines() if l.strip()]
        if lines:
            ultimo = lines[-1].split(" · ")[0] + (" (FALHOU)" if "FALHOU" in lines[-1] else "")
    if m:
        rep.warn("W2", f"{m.group(1)} commit(s) aguardando push · último push: {ultimo}",
                 "commits ficavam dias sem push e sem rastro — mjrp-scripts/push.py registra em .mjrp/push.log")
    rep.note("F3", f"sob git · último push: {ultimo}")


# Repository areas where an uncommitted edit matters to the agent right at session start:
# the human touched something, and the agent must know BEFORE acting over it.
WATCHED_AREAS = {
    "identidade": ("VISION.md", "MEMORY.md", "AGENTS.md", "CLAUDE.md", "PRINCIPLES.md", "docs/specs/prd.md", "ROADMAP.md",
                   "HOWTO.md", "README.md", ".mjrp-project.yml"),
    "wiki":       ("docs/wiki/",),
    "decisões":   ("docs/decisions/",),
    "skills":     ("mjrp-skills/",),
    "scripts":    ("mjrp-scripts/",),
    "arquivo":    ("_archive/",),
}


def _first_line(text):
    """The first non-empty line of a message, cut for a finding."""
    for line in (text or "").splitlines():
        if line.strip():
            return line.strip()[:160]
    return "sem mensagem"


def w4_uncommitted_edits(root, rep):
    """W4 - the human edited on disk and did not commit. Warning, not error: being mid-edit is
    normal. The value is at session start: the agent finds out someone touched something, and
    where, before writing over it. It does not say WHAT changed - that is `git diff`."""
    inc = ("08/09: o Zé reestruturou o VISION.md à mão, no disco, e o agente só soube porque ele "
           "perguntou e o agente rodou git status — nada no harness avisava")
    # F73 TASK-20 (the R1 rule): "git did not answer" is NOT "no edits". A project that is not under git has nothing to compare and
    # stays quiet (F3 is the check that says so); but a git that times out, cannot start or fails on the repository means the
    # edits were NOT looked at, and that is "não avaliável" - never the silence of a clean tree. LC_ALL=C keeps the message of a
    # missing repository in the words the test below matches.
    c_env = {"LC_ALL": "C"}
    try:
        tl = _git.run(root, "rev-parse", "--show-toplevel", timeout=30, env=c_env)
    except _git.GitError as exc:
        rep.unevaluable("W4", f"as edições sem commit não foram avaliadas: o git não respondeu ({exc})", inc)
        return
    if tl.code != 0:
        if "not a git repository" in tl.err.lower():
            return  # not under git: nothing to compare (F3 reports it)
        rep.unevaluable("W4", f"as edições sem commit não foram avaliadas: git rev-parse saiu {tl.code} "
                              f"({_first_line(tl.err or tl.out)})", inc)
        return
    top = Path(tl.out.strip().splitlines()[0].strip()) if tl.out.strip() else None
    if top is None or top.resolve() != Path(root).resolve():
        return  # aninhado: o doctor do repo pai é quem vê as edições da árvore
    # sh() strips the whole output and would eat the status space of the porcelain's first line.
    # Aqui o formato importa: _git.run, sem strip.
    try:
        pr = _git.run(root, "status", "--porcelain", "--untracked-files=normal", timeout=30, env=c_env)
    except _git.GitError as exc:
        rep.unevaluable("W4", f"as edições sem commit não foram avaliadas: o git não respondeu ({exc})", inc)
        return
    if pr.code != 0:
        rep.unevaluable("W4", f"as edições sem commit não foram avaliadas: git status saiu {pr.code} "
                              f"({_first_line(pr.err or pr.out)})", inc)
        return
    achados = {}
    for linha in pr.out.splitlines():
        if len(linha) < 4:
            continue
        state, path_str = linha[:2], linha[3:].strip()
        if path_str.startswith(("_backups/", ".mjrp/")):
            continue
        for area, prefixos in WATCHED_AREAS.items():
            if any(path_str == pfx or path_str.startswith(pfx) for pfx in prefixos):
                e = state.strip()
                tag = "novo" if e == "??" else ("removido" if "D" in e else "modificado")
                achados.setdefault(area, []).append((path_str, tag))
                break
    if not achados:
        rep.note("W4", "nenhuma edição sem commit nas áreas vigiadas")
        return
    total = sum(len(v) for v in achados.values())

    def summary(items):
        # ate 4 itens: lista; acima disso, agrupa por pasta de primeiro nivel e conta —
        # mover uma pasta inteira vira "48 removidos em _archive/", nao 48 linhas
        if len(items) <= 4:
            return ", ".join(f"{c} ({t})" for c, t in items)
        grupos = {}
        for c, t in items:
            topo = c.split("/")[0] + "/" if "/" in c else c
            grupos.setdefault((topo, t), 0)
            grupos[(topo, t)] += 1
        return ", ".join(f"{n} {t}{'s' if n > 1 else ''} em {topo}" for (topo, t), n in grupos.items())

    detalhe = " · ".join(f"{area}: {summary(v)}" for area, v in achados.items())
    rep.warn("W4", f"{total} arquivo(s) editado(s) sem commit — {detalhe}. Rode `git diff` antes de escrever por cima.", inc)


# 26/09, ADR-0014 (EP-09): structure by nature. The rules live in structure_rules.json (vendored);
# the logic in structure_check.py (vendored). Warning, never error: healing is a `git mv` the human
# approves, and a red doctor for a folder name would get the doctor ignored. One warning per item,
# so the daily-checks ledger tracks each one opening and closing.
def w9_structure(root, rep):
    inc = ("2026-09-05: 28 arquivos mudaram de pasta e nenhum sensor acusou; 2026-09-26: o docs/ do "
           "fin-control com 16 entradas de quatro naturezas — cada skill escolhia o próprio destino")
    sys.dont_write_bytecode = True                  # the import runs in every child: no __pycache__ left behind
    try:
        import structure_check
    except ModuleNotFoundError:
        rep.note("W9", "structure_check.py ausente nesta instância — estrutura por natureza não avaliada "
                       "(chega com o kernel: `new_project.py --refresh-kernel`)")
        return
    try:
        profile, findings = structure_check.check(root)
    except Exception as e:                           # a broken rules file must not break the doctor
        rep.warn("W9", f"structure_check falhou ({e}) — estrutura não avaliada", inc)
        return
    if profile is None:
        rep.note("W9", "estrutura: perfil sem regra no structure_rules.json — não avaliada")
        return
    if not findings:
        rep.note("W9", f"estrutura por natureza: conforme ({profile})")
    for f in findings:
        rep.warn("W9", f"{f['path']} — {f['msg']}", inc)
    if profile == "meta":                           # the source also watches every child, like W7
        fora = []
        for child in structure_check.all_projects(root)[1:]:
            cprof, cf = structure_check.check(child)
            if cprof and cf:
                fora.append(f"{child.name} ({len(cf)})")
        if fora:
            rep.warn("W9", f"{len(fora)} projeto(s) com item fora da natureza: {', '.join(fora)} — "
                           f"`python3 mjrp-scripts/structure_check.py --all-projects` diz o quê e para onde", inc)
        else:
            rep.note("W9", "estrutura: todos os projetos vizinhos conformes")


GIT_LOCK_MINUTES = 10      # a lock older than this with no git running is an orphan


BRANCH_AHEAD_MAX = 10      # work parked on a side branch this far ahead of the principal one


def _orphan_git_locks(root, now=None):
    """(relative path, minutes) of *.lock files in .git older than GIT_LOCK_MINUTES."""
    import time
    gitdir = Path(root) / ".git"
    if not gitdir.is_dir():
        return []
    now = now or time.time()
    found = []
    for f in (list(gitdir.glob("*.lock")) + list((gitdir / "refs").rglob("*.lock"))
              + list(gitdir.glob("objects/*.lock"))):       # maintenance.lock: gc parado
        try:
            age = (now - f.stat().st_mtime) / 60
        except OSError:
            continue
        if age > GIT_LOCK_MINUTES:
            found.append((f.relative_to(root).as_posix(), int(age)))
    return found


def _principal_branch(root):
    code, out = _git.run_tuple(root, "symbolic-ref", "--short", "refs/remotes/origin/HEAD", strip=True)
    if code == 0 and out.strip():
        return out.strip().split("/", 1)[-1]
    for b in ("main", "master"):
        if _git.run_tuple(root, "rev-parse", "--verify", "-q", f"refs/heads/{b}", strip=True)[0] == 0:
            return b
    return None


def w10_sessions(root, rep):
    """W10 - concurrent agent sessions on one repo: orphan git locks, sessions that ended without
    the closing handoff, more than one session active, work parked on a side branch."""
    inc = ("26-27/09: sessões paralelas no fin-control varreram o índice uma da outra e deixaram "
           "`.git/index.lock` órfão em 6 de 7 filhos; o MJRP-curated-content ficou 17 dias sem "
           "conseguir commitar por um HEAD.lock de 11/09")
    top = _git.toplevel(root)
    if top is None:
        return
    if top.resolve() != Path(root).resolve():
        rep.note("W10", "projeto aninhado — travas e sessões são do repo pai")
        return
    locks = _orphan_git_locks(root)
    hoje = _clock.today().strftime("%Y%m%d")
    for rel, mins in locks:
        rep.warn("W10", f"trava de git órfã: {rel} (há {mins} min) — se nenhum git estiver rodando, "
                        f"sarar: mv {rel} {rel}.orphan-{hoje}", inc)
    sys.dont_write_bytecode = True
    try:
        import session_lease
        ls = session_lease.leases(root)
    except ModuleNotFoundError:
        ls = []
    ativas = [l for l, s in ls if s == "active"]
    for l, s in ls:
        if s == "stale":
            rep.warn("W10", f"sessão terminou sem fechamento (sem handoff): {l.get('session')} · "
                            f"escopo: {l.get('scope') or '(não declarado)'} · último sinal {l.get('heartbeat')} — "
                            f"confira o que ficou sem commit e libere: session_lease.py release --session <id>", inc)
    if len(ativas) > 1:
        rep.warn("W10", f"{len(ativas)} sessões ativas neste repo agora: "
                        + "; ".join(f"{l.get('session')} ({l.get('scope') or 'sem escopo'})" for l in ativas)
                        + " — commit só por pathspec", inc)
    principal = _principal_branch(root)
    code, cur = _git.run_tuple(root, "rev-parse", "--abbrev-ref", "HEAD", strip=True)
    cur = (cur or "").strip()
    if principal and code == 0 and cur not in ("", "HEAD", principal):
        c2, n = _git.run_tuple(root, "rev-list", "--count", f"{principal}..HEAD", strip=True)
        ahead = int(n.strip()) if c2 == 0 and n.strip().isdigit() else 0
        if ahead > BRANCH_AHEAD_MAX:
            rep.warn("W10", f"trabalho parado na branch `{cur}`, {ahead} commit(s) à frente da `{principal}` — "
                            f"integre na principal ou declare o prazo da branch", inc)
    if not locks and not [1 for l, s in ls if s == "stale"] and len(ativas) <= 1:
        rep.note("W10", f"sessões: nenhuma trava órfã · {len(ativas)} sessão ativa registrada")
    if (read_yaml((Path(root) / CONTRACT).read_text(encoding="utf-8")) or {}).get("mjrp_harness", {}).get("profile") == "meta":
        try:
            import structure_check
            filhos = structure_check.all_projects(Path(root))[1:]
        except Exception:
            filhos = []
        com_trava = [f"{c.name} ({len(_orphan_git_locks(c))})" for c in filhos if _orphan_git_locks(c)]
        if com_trava:
            rep.warn("W10", f"{len(com_trava)} projeto(s) com trava de git órfã: {', '.join(com_trava)} — "
                            f"rode o doctor de cada um para o comando que sara", inc)


def w11_prototype_inventory(root, rep):
    """W11 - the prototype inventory (info-arch.md): every item ends in a destination. The prototype
    is a baseline, not a mold - what is checked is destination, never sameness."""
    inc = ("02/10/2026, EP-07: o que o humano aprovou no protótipo se perdia no caminho até o build — "
           "nada ligava o item da tela ao requisito; caso de origem no brainstorming do YouTube Control Center")
    sys.dont_write_bytecode = True
    try:
        import prototype_inventory as sdd   # S-77: extracted from the retired SDD_chain_artifacts_check
    except ModuleNotFoundError:
        return
    try:
        gaps = sdd.inventory_gaps(root)
    except Exception as e:
        rep.warn("W11", f"inventário do protótipo não avaliado ({e})", inc)
        return
    if gaps is None:
        return
    for g in gaps:
        rep.warn("W11", g.replace("inventario: ", "inventário do protótipo: "), inc)
    if not gaps:
        rep.note("W11", "inventário do protótipo: todo item com destino")


def w12_retired_names(root, rep):
    """W12 - no live document sends the agent to a skill that no longer exists (records keep the name of their time)."""
    inc = ("05/10/2026: depois do EP-10/EP-11 renomear 46 skills, outra sessão respondeu com nomes aposentados "
           "(mjrp-adr, mjrp-system-architect) — o README, 16 cabeçalhos de folder-index e ponteiros vivos em cinco "
           "filhos tinham escapado de uma varredura que só cobria as skills")
    sys.dont_write_bytecode = True
    try:
        import retired_names_check as rnc
    except ModuleNotFoundError:
        return
    try:
        hits = rnc.retired_mentions(root)
    except Exception as e:
        rep.warn("W12", f"nomes de skill aposentada não avaliados ({e})", inc)
        return
    if hits:
        sample = " · ".join(f"{f}:{n} {o} → {s}" for f, n, o, s in hits[:4])
        rep.warn("W12", f"{len(hits)} menção(ões) viva(s) a skill aposentada/renomeada — {sample}"
                        f"{' …' if len(hits) > 4 else ''} (python3 mjrp-scripts/retired_names_check.py . lista todas)", inc)
    else:
        rep.note("W12", "nenhum documento vivo cita skill aposentada")


def w14_prototype_sync(root, rep):
    """W14 - the newest prototype, its info-arch.md and the wireframes of every screen of its version move together."""
    inc = ("09/10/2026 19:36: o Control Center v3.5 mudou depois de aprovado e o dado envelheceu, com só 3 das 7 telas "
           "com wireframe e o info-arch ainda citando o v3.3 — a regra existia só em prosa; o MJRP: 'alterou protótipo, "
           "automaticamente wireframe e info-arch precisam ser atualizados' (hook commit-msg + este sensor)")
    sys.dont_write_bytecode = True
    try:
        import prototype_sync_check as psc
    except ModuleNotFoundError:
        return
    try:
        gaps = psc.drift(root)
    except Exception as e:                 # a git that does not answer is "not evaluable", never "no drift" (F73 IV-08)
        rep.unevaluable("W14", f"protótipo × info-arch × wireframes não avaliado ({e})", inc)
        return
    for g in gaps:
        rep.warn("W14", f"protótipo × wireframes: {g}", inc)
    if not gaps and psc.prototypes(Path(root).resolve()):
        rep.note("W14", "protótipo mais novo, info-arch e wireframes de todas as telas em dia")


def w13_daily_backup(root, rep):
    """W13 - the daily copy of all projects is verified and young (ADR-0024 § 5; the 13th slot of error checks, ADR-0002, by the MJRP).

    Error: no verified copy, the newest one older than 24 h, or a project `failed` in it. Warning: the copy taken to the external disk by
    hand is older than 2 days (or was never registered), a file the system would not let the script read, a last run that failed while an
    earlier copy is still young. Note: there is no destination here (the file bridge, the Cowork) - not evaluable, never an error.
    Every error cites `python3 mjrp-scripts/daily_backup.py run`. It reads three small files (`daily_backup_status.evaluate`) and never
    opens an archive."""
    inc = ("08/10/2026: o MJRP decidiu o backup recorrente do repositório; 21 e 22/10/2026: dois dias sem backup (disco cheio, commit pela ponte) "
           "e o doctor só deu aviso (F70, B3 da auditoria de 25/10); 25/10/2026: o backup a cada commit no iCloud deu lugar à cópia diária de "
           "todos os projetos (ADR-0024), e o MJRP deu a 13ª vaga de erro ao atraso de mais de 24 h")
    sys.dont_write_bytecode = True
    if not (root / "mjrp-scripts" / "daily_backup.py").exists():
        return                            # the daily copy is a feature of the repository that carries the script (the harness)
    try:
        import daily_backup_status as dbs
        import daily_backup_store as dbstore
    except ModuleNotFoundError:
        return
    try:
        status = dbs.evaluate(dbstore.Settings.from_env())
    except Exception as e:                # noqa: BLE001 - a crash in the sensor is "not evaluated", never "in date"
        rep.unevaluable("W13", f"cópia diária não avaliada ({type(e).__name__}: {e})", inc)
        return
    if not status.available:
        rep.note("W13", status.notes[0])
        return
    for text in status.errors:
        rep.fail("W13", text, inc)
    for text in status.warnings:
        rep.warn("W13", text, inc)
    for text in status.notes:
        rep.note("W13", text)


DISK_FLOOR_GB = 20      # W18: below this much free disk the doctor warns (never fails)


def w18_free_disk(root, rep):
    """W18 - free disk below 20 GB: a warning, never an error.

    Incident (harness-kaizen 2026-10-19 22:59, "o orquestrador encheu o disco do MJRP"): the session's scratch folder
    reached 278 GB of visual-judge captures, the agents' worktrees 110 GB more, and nobody looked at the free space until
    a merge commit stopped halfway on "No space left on device". The signal was there for hours; no sensor read it.
    `MJRP_DISK_FLOOR_GB` moves the floor (0 silences it; the selftest uses a huge one to force the warning).
    """
    inc = ("19/10/2026: o disco do MJRP encheu com capturas dos juízes visuais (278 GB) e worktrees de agentes (110 GB); "
           "só o primeiro ENOSPC num commit mostrou — harness-kaizen 2026-10-19 22:59")
    try:
        floor = float(os.environ.get("MJRP_DISK_FLOOR_GB", DISK_FLOOR_GB))
        free_gb = shutil.disk_usage(root).free / 1024 ** 3
    except (OSError, ValueError) as e:
        rep.note("W18", f"disco livre não avaliável ({e})")
        return
    if free_gb < floor:
        rep.warn("W18", f"disco livre: {free_gb:.1f} GB, abaixo de {floor:g} GB. Recolha antes de abrir mais agentes ou rodadas "
                        f"do juiz visual (a pasta temporária da sessão, os worktrees já mesclados, o `_backups/`)", inc)
    else:
        rep.note("W18", f"disco livre: {free_gb:.0f} GB (piso {floor:g} GB)")


def _uat_statuses(text):
    """{UAT-NN: status cell} read from every table of a uat.md (the Status column is found by header)."""
    out, col = {}, None
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if cells and cells[0] == "ID" and "Status" in cells:
            col = cells.index("Status")
        elif col is not None and re.match(r"UAT-\d+$", cells[0]) and len(cells) > col:
            out[cells[0]] = cells[col]
    return out


def _uat_state(cell):
    """open | fixing | fixed | other - the first word of the Status cell."""
    m = re.match(r"(open|fixing|fixed)\b", cell or "")
    return m.group(1) if m else "other"


def w15_fix_branch_status(root, cfg, rep):
    """W15 - a fix branch that changes a UAT issue's Status while main still says `open`."""
    inc = ("13/10/2026: as correções UAT-72, UAT-73..75 e UAT-76 foram feitas em branches `fix/uat-…` enquanto o "
           "`docs/specs/uat.md` da main seguia `open` (o status mudou só dentro de cada branch); o quadro Delivery, "
           "que lê a main, mostrou \"Em correção 0\" e o MJRP estranhou — o processo manda marcar `fixing (<Fxx>)` "
           "na main, ligada a uma feature da trilha Fix, antes de corrigir")
    root = Path(root)
    projects = [root]
    if cfg.get("profile") == "meta" and (root / "apps").is_dir():
        projects += sorted(p for p in (root / "apps").iterdir() if (p / CONTRACT).exists())
    projects = [p for p in projects if (p / "docs" / "specs" / "uat.md").is_file()]
    if not projects:
        return
    top = _git.toplevel(root)
    principal = _principal_branch(top) if top else None
    if top is None or principal is None:
        rep.note("W15", "correções em branch × status na main: não avaliável (sem git ou sem branch principal)")
        return
    code, out = _git.run_tuple(top, "for-each-ref", "--format=%(refname:short)", "--no-merged", principal, "refs/heads", strip=True)
    if code != 0:
        rep.note("W15", f"correções em branch × status na main: não avaliável (git falhou: {out[:80]})")
        return
    branches = [b for b in out.splitlines() if b.strip() and b != principal]
    found = False
    for proj in projects:
        rel = (proj.resolve().relative_to(top.resolve()) / "docs" / "specs" / "uat.md").as_posix()
        c, main_txt = _git.run_tuple(top, "show", f"{principal}:{rel}", strip=True)
        if c != 0:
            continue                                   # the file is not on main yet: nothing there to be stale
        main_st = _uat_statuses(main_txt)
        for b in branches:
            if _git.run_tuple(top, "diff", "--quiet", f"{principal}...{b}", "--", rel, strip=True)[0] == 0:
                continue                               # the branch does not touch this uat.md
            c1, base = _git.run_tuple(top, "merge-base", principal, b, strip=True)
            c2, base_txt = _git.run_tuple(top, "show", f"{base}:{rel}", strip=True) if c1 == 0 else (1, "")
            c3, br_txt = _git.run_tuple(top, "show", f"{b}:{rel}", strip=True)
            if c2 != 0 or c3 != 0:
                continue
            base_st, br_st = _uat_statuses(base_txt), _uat_statuses(br_txt)
            ids = sorted(i for i, v in br_st.items()
                         if base_st.get(i) is not None and _uat_state(v) != _uat_state(base_st[i])
                         and _uat_state(main_st.get(i)) == "open")
            if ids:
                found = True
                rep.warn("W15", f"a branch `{b}` já mexe no status de {', '.join(ids)} em {rel}, mas na `{principal}` "
                                f"{'essa issue segue' if len(ids) == 1 else 'essas issues seguem'} `open` — o quadro Delivery, que lê a "
                                f"`{principal}`, mostra \"Em correção 0\". Marque `fixing (<Fxx>)` na `{principal}`, ligada a uma "
                                f"feature `solution_type: fix` (`docs/specs/features/Fxx-*/spec.md` com `solution_type: fix` e `fixes:`)", inc, rel)
    if not found:
        rep.note("W15", "correções em branch: nenhuma branch aberta muda status de UAT que a main ainda tenha como `open`")
