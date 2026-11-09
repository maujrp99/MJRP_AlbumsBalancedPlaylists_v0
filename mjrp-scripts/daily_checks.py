#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""daily_checks.py -- rastro DATADO (aberto/resolvido) de aviso e erro, compartilhado por
sensores informativos (SDD_chain_artifacts_check.py) e pelo proprio doctor.py.

Por que existe: um aviso/erro que so aparece ao vivo no stdout de um hook e some do rastro no
segundo seguinte -- ninguem sabe desde quando esta aberto nem quando foi corrigido (achado do
MJRP, 16/09, no meio da implementacao do BACKLOG #58; generalizado no #60 pra cobrir TODO
aviso/erro do doctor.py, nao so o SDD_chain).

Cada "dono" (SDD_chain, doctor, ...) tem sua propria secao dentro do MESMO arquivo
(`daily-checks/sensor-warnings.md` ou `sensor-errors.md`), demarcada por
`<!-- sensor:<id>:start/end -->`, pra varios donos escreverem no mesmo arquivo sem se atropelar.
O estado (o que esta aberto desde quando) fica em `.mjrp/<id>_state.json` -- por isso
`daily-checks/` e `.mjrp/` ficam fora do `repo_fingerprint()` (ver DERIVED em doctor.py): o
proprio rastro nao pode invalidar o cache de sensor que ele mesmo atualiza.

IDENTIDADE != TEXTO. Cada item e' (identity, texto): identity decide se e' o MESMO item entre
rodadas (ex.: o `cid` do doctor.py, tipo "W4"; ou o texto inteiro do furo do SDD_chain, que nao
tem parte volatil). texto e' o que aparece no ledger, e PODE mudar sem trocar de identidade --
achado do MJRP, 16/09: usar o texto inteiro do doctor.py como identidade duplicava entradas a
cada rodada, porque a mensagem carrega contagem/timestamp ao vivo (ex.: "14 arquivos" vs "16
arquivos" no mesmo aviso W4, sem nada ter sido corrigido de verdade).
"""
import fcntl
import json
import os
from pathlib import Path

import _pathclass

RESOLVED_KEEP = 20

HEADER = {
    "warnings": (
        "# Avisos nao-bloqueantes\n\n"
        "> Cada dono (sensor informativo ou o proprio `doctor.py`) tem sua secao abaixo, "
        "demarcada por `<!-- sensor:<id>:start/end -->` -- gerada pelo proprio codigo, nao "
        "editar a mao dentro das marcas.\n"
    ),
    "errors": (
        "# Erros bloqueantes -- historico\n\n"
        "> O erro em si ja bloqueia o `doctor`/`stop_gate` ao vivo; este arquivo so registra "
        "QUANDO cada um apareceu e foi corrigido, pra dar pra ver o que fica se repetindo.\n"
    ),
    "unevaluable": (
        "# Nao avaliavel -- o que o doctor nao conseguiu julgar\n\n"
        "> Terceiro nivel, ao lado de erros e avisos (F73, UAT-361): uma checagem que quebrou ou que nao "
        "conseguiu comparar com a fonte nao e verde nem aviso. Fica aqui enquanto a rodada seguinte nao a "
        "avaliar; o Control Center mostra o projeto como \"nao avaliavel\", nunca como sem achados. O que a checagem tinha "
        "achado antes segue aberto nos outros dois rastros POR check_id, nao por item: um W1 que nao leu uma skill mantem aberto o "
        "W1 ja resolvido de outra (ruido do lado seguro; a proxima passada que julgar o W1 fecha tudo).\n"
    ),
}


def _state_key(owner_id, filename):
    """Achado do MJRP, 16/09: um mesmo owner_id (ex.: 'doctor') escreve em DOIS ledgers
    diferentes (sensor-warnings.md e sensor-errors.md) -- se os dois lessem/escrevessem o MESMO
    arquivo de estado, a chamada do segundo (com uma lista de itens diferente) apagava o que a
    primeira acabou de salvar. A chave do estado tem que amarrar owner_id AO arquivo, no' so' ao
    dono."""
    stem = Path(filename).stem.replace("-", "_")
    return f"{owner_id}__{stem}"


def _state_path(root, owner_id, filename):
    return Path(root) / ".mjrp" / f"{_state_key(owner_id, filename)}_state.json"


def has_trace(root, owner_id, filename):
    """True when this owner already keeps a trace for this ledger -- the state in `.mjrp/` OR the markdown ledger in
    `daily-checks/` -- so an optional stream (F73 TASK-17) is written again, to close what it had open, even in a pass that has
    nothing to put in it. BOTH are asked because only the ledger is versioned: a checkout that got the stream through git has the
    `.md` and no `.mjrp/`, and asking only the state would leave its open item open for ever. It is the same test the Control
    Center's reader makes (`_read_optional`: the state or the ledger)."""
    return _state_path(root, owner_id, filename).exists() or (Path(root) / "daily-checks" / filename).exists()


def load_state(root, owner_id, filename):
    p = _state_path(root, owner_id, filename)
    if not p.exists():
        return {"open": {}, "resolved": []}
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
        d.setdefault("open", {})
        d.setdefault("resolved", [])
        return d
    except Exception:
        return {"open": {}, "resolved": []}


def save_state(root, owner_id, filename, state):
    """R23 (F72): tmp + os.replace under a flock. An interrupted write used to leave half a JSON, which load_state reads as "no
    state" - every open item then looked new and the ledger of what was already seen was lost. (Limit: the lock covers the write,
    not the caller's load-then-save; two doctors racing still last-writer-wins, but on a whole file.)"""
    p = _state_path(root, owner_id, filename)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p.with_name(p.name + ".lock"), "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        tmp = p.with_name(f".{p.name}.{os.getpid()}.tmp")
        tmp.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, p)


def update_state(state, current_items, when):
    """current_items: lista de (identity, texto) ou (identity, texto, meta). Retorna (state,
    abriu_ou_fechou) -- o texto de um item que continua aberto e' sempre atualizado pro mais
    recente, mas isso sozinho NAO conta como abriu_ou_fechou (senao a mensagem oscilando
    reimprimiria pra sempre, o mesmo problema que a identidade por texto causava).

    meta (optional dict: check_id, severity, file, rule) is stored on the open entry and kept
    on the resolved one -- the Control Center reads it from the state file (S-133 R5, 2026-10-10)."""
    still_open = {}
    for entry in current_items:
        ident, text = entry[0], entry[1]
        meta = entry[2] if len(entry) > 2 and entry[2] else {}
        prev = state["open"].get(ident)
        since = prev["since"] if prev else when
        still_open[ident] = {"since": since, "text": text, **meta}
    newly_resolved = [ident for ident in state["open"] if ident not in still_open]
    for ident in newly_resolved:
        prev = state["open"][ident]
        extra = {k: v for k, v in prev.items() if k not in ("since", "text")}
        state["resolved"].insert(0, {
            "text": prev["text"], "opened_at": prev["since"], "resolved_at": when, **extra,
        })
    changed = set(state["open"]) != set(still_open)
    state["open"] = still_open
    state["resolved"] = state["resolved"][:RESOLVED_KEEP]
    return state, changed


def render_section(owner_id, title, state):
    lines = [f"<!-- sensor:{owner_id}:start -->", f"### {title}", "", "**Abertos**", ""]
    if state["open"]:
        lines += ["| Desde | Item |", "|---|---|"]
        ordenado = sorted(state["open"].items(), key=lambda kv: kv[1]["since"])
        lines += [f"| {v['since']} | {v['text']} |" for _k, v in ordenado]
    else:
        lines.append("_nenhum aberto no momento._")
    lines += ["", f"**Resolvidos (ultimos {RESOLVED_KEEP})**", ""]
    if state["resolved"]:
        lines += ["| Aberto em | Resolvido em | Item |", "|---|---|---|"]
        lines += [f"| {r['opened_at']} | {r['resolved_at']} | {r['text']} |" for r in state["resolved"]]
    else:
        lines.append("_nenhum ainda._")
    lines.append(f"<!-- sensor:{owner_id}:end -->")
    return "\n".join(lines) + "\n"


def write_ledger(root, filename, owner_id, section_text):
    p = Path(root) / "daily-checks" / filename
    start, end = f"<!-- sensor:{owner_id}:start -->", f"<!-- sensor:{owner_id}:end -->"
    if p.exists():
        text = p.read_text(encoding="utf-8")
        if start in text and end in text:
            text = text.split(start)[0] + section_text + text.split(end)[1]
        else:
            text = text.rstrip("\n") + "\n\n" + section_text
    else:
        kind = ("errors" if filename.startswith("sensor-errors")
                else "unevaluable" if filename.startswith("sensor-unevaluable") else "warnings")
        text = HEADER[kind] + "\n" + section_text
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text.rstrip("\n") + "\n", encoding="utf-8")  # nao deixa linha em branco acumular a cada rodada


def in_linked_worktree(root):
    """True when `root` is the root of a LINKED worktree (an agent's, git's `worktree add`). The versioned ledger is written only
    by the main checkout: a pass inside a worktree measures and reports, but writing `daily-checks/*.md` there makes the worktree
    dirty and puts a second, diverging copy of the ledger on the branch (F84, UAT-367). When git cannot say, the answer is False:
    the ledger is written as it always was."""
    try:
        return _pathclass.is_linked_worktree(Path(root))
    except Exception:                                 # noqa: BLE001 - the trace never ends a pass
        return False


def report(root, owner_id, filename, title, current_items, when, run_at=None):
    """current_items: lista de (identity, texto) -- ver update_state. Sempre reescreve o ledger
    (o texto de um item aberto pode ter mudado mesmo sem abrir/fechar nada), mas so' retorna
    changed=True quando algo abriu ou fechou de verdade -- e' isso que decide se vale falar no
    stdout do chamador.

    run_at (optional ISO-8601 instant with offset) is the moment of this pass, kept as
    state["last_run_at"]: the Control Center says when the last pass ran and whether it is from
    today (S-133, 2026-10-10); a date alone cannot say it.

    In a linked worktree the state in `.mjrp/` is still kept, but the versioned ledger in `daily-checks/` is NOT written (F84)."""
    state = load_state(root, owner_id, filename)
    state, changed = update_state(state, current_items, when)
    if run_at:
        state["last_run_at"] = run_at
    save_state(root, owner_id, filename, state)                  # `.mjrp/` is derived and ignored: safe in any checkout
    if not in_linked_worktree(root):                             # the versioned ledger belongs to the main checkout (F84)
        write_ledger(root, filename, owner_id, render_section(owner_id, title, state))
    return state, changed
