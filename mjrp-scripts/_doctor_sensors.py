# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_doctor_sensors.py - the doctor's checks that RUN the sensors the contract declares, and the visual sensor's
declaration (A1, A2), with the cache of their results and the fingerprint that says which state of the repository a result
belongs to.

Family module of the doctor (F73 R5).
"""
import hashlib
import json
import re
import sys
from datetime import datetime

import _git
from _run import ShellNeeded, sh


# 2026-10-12 (ADR-0017, revised after its architecture audit; decision of the MJRP): a sensor may be a mapping
# {cmd, when, config}. `when: pre-merge` is allowed for `sensors.visual` ONLY - the visual parity runs two servers and
# browsers for minutes, at the independent visual recheck before a screen feature's merge, and the pre-merge-commit
# gate (visual_gate.py) is what holds it there. Any other sensor with `when`, any other value, or a mapping without
# `cmd` fails: an escape of one line out of the A1 is how "declared and never run" comes back.
STATION_SENSOR, STATION_WHEN = "visual", "pre-merge"


SENSOR_CACHE = ".mjrp/sensors.json"


SENSOR_TIMEOUT = 300


# Cache format version. A record written by an older doctor has no fingerprint and cannot be
# trusted to describe the current tree - it is read as stale, not as a pass.
SENSOR_CACHE_VERSION = 2


# Paths that a sensor result must NOT depend on: they are produced BY the run. Without this
# filter the fingerprint would change every time the doctor writes its own cache, and no record
# would ever match the state that follows it. Same list the stop_gate uses, for the same reason.
DERIVED = ("__pycache__", "/.mjrp/", "_backups/", "dist/", "mjrp-skills-packages/",
           "daily-checks/")  # 16/09: o proprio rastro de aviso/erro nao pode invalidar


def repo_fingerprint(root):
    """What state of the repository a sensor result belongs to.

    A stored sensor result is a claim about CODE, and code changes. On 09/09 `.mjrp/sensors.json`
    held `code: 1` for the loop sensor while the loop selftest had already been fixed and passed:
    the record was true when written and false when read, and nothing in it said which. The
    fingerprint is what makes the difference visible.

    HEAD alone is not enough - most of the day the work is uncommitted. So: HEAD, plus the
    porcelain status with the derived paths filtered out, plus size and mtime of everything that
    status names. That covers the commit, the staging, and the edit that happened one second ago.
    Returns None when git cannot answer: a fingerprint that cannot be computed must not be
    invented, and a record without one reads as stale.
    """
    code, head = _git.run_tuple(root, "rev-parse", "HEAD", strip=True)
    if code != 0:
        return None
    code, status = _git.run_tuple(root, "status", "--porcelain", "-uall", strip=True)
    if code != 0:
        return None
    partes = [head.strip()]
    for linha in sorted(status.splitlines()):
        caminho = linha[3:].strip().strip('"')
        if any(d in f"/{caminho}" for d in DERIVED):
            continue
        partes.append(linha)
        try:
            st = (root / caminho).stat()
            partes.append(f"{st.st_size}:{st.st_mtime_ns}")
        except OSError:
            partes.append("ausente")
    return hashlib.sha1("\n".join(partes).encode("utf-8")).hexdigest()[:16]


def _is_station(name, spec):
    return name == STATION_SENSOR and str(spec.get("when", "")).strip() == STATION_WHEN


def _sensor_map_problem(name, spec):
    """Why a sensor declared as a mapping cannot run in the A1, or None. The stage's sensor is judged by the A2."""
    if "when" in spec and name != STATION_SENSOR:
        return (f"sensor '{name}' declara `when: {spec.get('when')}` — só `sensors.{STATION_SENSOR}` pode ser de "
                f"etapa (`when: {STATION_WHEN}`); os demais rodam a cada doctor")
    if "when" in spec and str(spec.get("when", "")).strip() != STATION_WHEN:
        return f"sensor '{name}': `when: {spec.get('when')}` desconhecido — o único valor é `{STATION_WHEN}`"
    if not str(spec.get("cmd") or "").strip():
        return f"sensor '{name}' declarado como mapa sem `cmd` — não há o que rodar (nunca vira verde vazio)"
    return None


def a1_sensors(root, cfg, rep, skip):
    inc = "o contrato declara {lint, test, build} e nada verifica que rodam; o Albums v0 tem 310 arquivos em produção sem que se saiba se o teste dele roda"
    inc_cache = ("09/09: o `.mjrp/sensors.json` guardava `code: 1` para o sensor do loop enquanto "
                 "o loop_selftest já estava consertado e passando — o registro era verdadeiro "
                 "quando foi escrito e falso quando foi lido, e nada nele dizia qual dos dois")
    inc_map = ("2026-10-12, crítica da ADR-0017 (achados 2 e 3): um sensor-mapa sem `cmd` virava `sh(\"\")`, que sai "
               "0 — verde sem rodar nada; e o `when` tirava qualquer sensor do A1, calado")
    sensors = cfg.get("sensors") or {}
    if not sensors:
        rep.fail("A1", "contrato sem sensores declarados — não há o que medir, só opinião", inc)
        return
    cache_file = root / SENSOR_CACHE
    cache = {}
    if cache_file.exists():
        try:
            cache = json.loads(cache_file.read_text())
        except Exception:
            cache = {}
    agora = repo_fingerprint(root)
    if skip:
        velhos, lidos = [], 0
        for name in sensors:
            if isinstance(sensors[name], dict):
                if _is_station(name, sensors[name]):
                    continue                     # the stage's sensor: the doctor never runs it (A2 judges it)
                bad = _sensor_map_problem(name, sensors[name])
                if bad:
                    rep.fail("A1", bad, inc_map)
                    continue
            r = cache.get(name)
            if not r:
                rep.fail("A1", f"sensor '{name}' nunca foi executado (sem registro)", inc)
            elif agora is None or r.get("fingerprint") != agora:
                velhos.append(name)
            elif r.get("code") != 0:
                rep.fail("A1", f"sensor '{name}' falhou na última execução ({r.get('when','?')})", inc)
            else:
                lidos += 1
        if velhos:
            # NÃO é aprovação e NÃO é reprovação: é não avaliável, o exit 2 do contrato do
            # harness. O registro descreve outro estado do repositório; dizer verde a partir
            # dele é o defeito, e dizer vermelho seria inventar uma falha que ninguém viu.
            rep.fail("A1", f"{len(velhos)} sensor(es) com registro de OUTRO estado do repositório "
                           f"({', '.join(sorted(velhos)[:4])}{'…' if len(velhos) > 4 else ''}) — "
                           f"não avaliável; rode o doctor sem --skip-sensors", inc_cache)
        if lidos:
            rep.note("A1", f"{lidos} sensor(es) lidos do registro, no estado atual (--skip-sensors)")
        return
    stage = {}
    for name, cmd in list(sensors.items()):
        if isinstance(cmd, dict):
            if _is_station(name, cmd):
                stage[name] = cmd
                continue
            bad = _sensor_map_problem(name, cmd)
            if bad:
                rep.fail("A1", bad, inc_map)
                continue
            cmd = str(cmd.get("cmd")).strip()
        try:
            code, out = sh(cmd, root, SENSOR_TIMEOUT)
        except ShellNeeded as e:
            # F71 R8: not run, not green. Red (not a quiet «não avaliável»): until R3 is decided that level exits 0, and a
            # sensor that used to run must not turn into one that is silently skipped.
            rep.fail("A1", f"sensor '{name}' não avaliável: o doctor não executa shell do contrato e o comando {e} "
                           f"— vire um script (`python3 mjrp-scripts/x.py`) e declare o script", inc)
            continue
        cache[name] = {"code": code, "when": datetime.now().isoformat(timespec="seconds"),
                       "fingerprint": agora, "v": SENSOR_CACHE_VERSION}
        if code == 127:
            rep.fail("A1", f"sensor '{name}' não executa: {out[:120]}", inc)
        elif code != 0:
            rep.fail("A1", f"sensor '{name}' reprovou (exit {code}): {out.splitlines()[-1][:120] if out else ''}", inc)
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    cache_file.write_text(json.dumps(cache, indent=2, ensure_ascii=False))
    rep.note("A1", f"{len(sensors) - len(stage)} sensor(es) executados"
                   + (f" · {len(stage)} de etapa, fora desta passada ({', '.join(sorted(stage))}: when: pre-merge)"
                      if stage else ""))


# 2026-10-12 (ADR-0017 of the harness, Accepted): a project with a screen and an approved prototype declares how its
# screen is compared with that prototype. The incident (2026-10-11): the Control Center 1.0 reached the UAT with the UI
# far from its approved prototype v4.1 - standardized components and the collapse of every card missing, the brand,
# the shell's order, the fonts and the design system's CSS off - with every sensor green; no sensor compared the two,
# and the fix took a Playwright diagnosis, four rounds of correction and three rechecks by a separate agent.
def load_visual_gate():
    """visual_gate.py (vendored next to this file): the one definition of "this project has a screen"."""
    sys.dont_write_bytecode = True
    try:
        import visual_gate
        return visual_gate
    except ModuleNotFoundError:
        return None


def _npm_script(cwd, words):
    """`npm run [--prefix D] S` / `npm --prefix D run S`: (the folder, the script's text), or None."""
    if not words or words[0] != "npm":
        return None
    prefix, rest, i = cwd, [], 1
    while i < len(words):
        if words[i] == "--prefix" and i + 1 < len(words):
            prefix = cwd / words[i + 1]
            i += 2
            continue
        rest.append(words[i])
        i += 1
    if len(rest) >= 2 and rest[0] in ("run", "run-script"):
        try:
            scripts = json.loads((prefix / "package.json").read_text(encoding="utf-8")).get("scripts", {})
        except Exception:
            return prefix, ""
        return prefix, scripts.get(rest[1], "")
    return None


def _visual_files(root, cmd, depth=0):
    """The existing files a visual sensor's command reaches (npm scripts expanded), as absolute paths."""
    found = []
    for part in re.split(r"&&|\|\||;", cmd):
        words = part.split()
        npm = _npm_script(root, words)
        if npm and depth < 3:
            found += _visual_files(npm[0], npm[1], depth + 1)
            continue
        for w in words:
            w = w.strip("\"'")
            if ("/" in w or w.endswith((".mjs", ".js", ".ts", ".cjs"))) and not w.startswith("-"):
                f = (root / w).resolve()
                if f.is_file():
                    found.append(f)
    return found


def _visual_reach(root, spec):
    """Why the declared visual sensor does not reach the kit and an existing config, or None."""
    cmd = str(spec.get("cmd") or "").strip() if isinstance(spec, dict) else str(spec or "").strip()
    if not cmd:
        return "`sensors.visual` declarado sem comando (`cmd`) — não há o que rodar na reconferência visual"
    if not isinstance(spec, dict) or str(spec.get("when", "")).strip() != STATION_WHEN:
        return ("`sensors.visual` sem `when: pre-merge` — é o sensor da reconferência visual, de etapa; "
                "a string solta roda a cada doctor e nada a liga à etapa")
    config = str(spec.get("config") or "").strip()
    if not config or not (root / config).is_file():
        return (f"`sensors.visual.config` {'ausente' if not config else 'não existe: ' + config} — o sensor tem de "
                f"apontar para o config visual do projeto (referência, cenários, condições)")
    files = _visual_files(root, cmd)
    kit = [f for f in files if f.name == "run.mjs" and f.parent.name == "visual_parity"
           or "visual_parity/" in f.read_text(encoding="utf-8", errors="replace")]
    if not kit:
        return (f"`sensors.visual` ({cmd[:60]}) não chega ao kit de paridade visual — nem "
                f"`mjrp-scripts/visual_parity/run.mjs` nem um juiz do projeto que importe dele")
    return None


def a2_visual_sensor(root, cfg, rep):
    """A2 - a code-app with a screen and an approved prototype declares its visual parity sensor (sensors.visual)."""
    inc = ("2026-10-11: o Control Center 1.0 chegou ao UAT com a tela longe do protótipo aprovado v4.1 — componentes "
           "padronizados, o minimizar/expandir dos cards, a marca, a ordem da casca, as fontes e o CSS do design system "
           "— com todos os sensores verdes: nenhum comparava a tela com o protótipo")
    if cfg.get("profile") != "code-app":
        return
    vg = load_visual_gate()
    if vg is None:
        rep.note("A2", "visual_gate.py ausente nesta instância — paridade visual não avaliada "
                       "(chega com o kernel: `new_project.py --refresh-kernel`)")
        return
    ia = root / "docs" / "specs" / "info-arch.md"
    approved = vg.approved_reference(ia.read_text(encoding="utf-8", errors="replace")) if ia.is_file() else None
    declared = cfg.get("screen") if isinstance(cfg.get("screen"), list) else None
    screen = vg.screen_on_disk(root, declared)
    if not approved or not screen:
        rep.note("A2", "paridade visual: " + ("sem referência visual aprovada no info-arch.md" if not approved else "sem tela")
                 + " — não se aplica")
        return
    visual = (cfg.get("sensors") or {}).get("visual")
    if not visual:
        rep.fail("A2", f"o projeto tem tela ({screen}) e referência visual aprovada no info-arch.md, e o contrato não declara "
                       "`sensors.visual` — nada compara a tela com a referência aprovada (kit: mjrp-scripts/visual_parity/)",
                 inc, file=".mjrp-project.yml")
        return
    bad = _visual_reach(root, visual)
    if bad:
        rep.fail("A2", bad, inc, file=".mjrp-project.yml")
    else:
        rep.note("A2", f"paridade visual declarada e alcançável: {str(visual.get('cmd')).strip()[:60]} · "
                       f"config {visual.get('config')}")
