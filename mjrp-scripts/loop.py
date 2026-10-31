#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
loop.py - the TASK loop.

The turn loop belongs to the platform: the model calls a tool, reads the result, calls again,
and stops when IT decides to stop. That is opinion, not fact. This loop is ours: it repeats the
turn until an EXTERNAL COMMAND passes, and state travels by file between passes.

    python3 mjrp-scripts/loop.py --until "python3 mjrp-scripts/doctor.py ." \
                                --prompt "Corrija o que o doctor apontar" --max 3

Exit contract (0-2 the same as the doctor's):
    0  the criterion passed
    1  the iteration ceiling ran out and the criterion did not pass
    2  NOT EVALUABLE - no --until, or --until does not run. Never counts as approval.
    3  NO PROGRESS - the agent's passes changed nothing for --stale passes in a row (default 2)
    4  BUDGET - the tokens spent reached --budget-tokens

The four stop rules of the PDLC in loops (docs/wiki/kernel/ways-of-working/pdlc-loops.md §5): the criterion, the ceiling, the
budget, no progress. The harness decides to stop, never the model (PRINCIPLES II.3). Progress is the fingerprint of
--progress-cmd (default: the repository's `git status --porcelain` + `git diff`) before and after each pass. Tokens
come from the agent's JSON output when it reports `usage` (claude -p --output-format json); otherwise they are
estimated at 4 characters per token, and the report says "estimado".

Number 2 is the rule: with no declared and verifiable exit criterion, the loop REFUSES TO
START. It is PRINCIPLES II.4 turned into mechanism, instead of advice ignored under pressure.

Memory between iterations (ADR-0008):
  .mjrp/loop-state.md          what has been tried - the next iteration READS it before acting
  docs/wiki/kernel/ways-of-working/harness-kaizen.md  the lesson, when the loop ends without converging - durable
"""
import argparse, fcntl, hashlib, json, os, re, shlex, shutil, subprocess, sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _clock
_sp_now = _clock.now   # Brasília, not the host's clock (F73 R4)

ROOT_DIR = Path(__file__).resolve().parent.parent
STATE_FILE = ROOT_DIR / ".mjrp" / "loop-state.md"
DEFAULT_MAX = 3  # rounds per task (decision of 2026-10-13: was 5)
MODELS = ("opus", "sonnet")  # `model::` values in tasks.md; mandatory on every task (no default)
# F134 (ADR-0025 § 1.1): the one form of the task id -- TASK-NN, a split task takes the letter (TASK-02a)
TASK_RE = re.compile(r"^- \[(?P<done>[ xX])\] (?P<id>TASK-\d{2,}[a-z]?)\b(?P<rest>.*)$")
MARK_RE = re.compile(r"\b(?P<key>model|rounds)::\s*(?P<val>[^\s·]+)")
DEFAULT_AGENT = os.environ.get("MJRP_LOOP_AGENT", "claude -p")


def now() -> str:
    return _sp_now().strftime("%Y-%m-%d %H:%M")


def kaizen_path() -> Path:
    """Where the lesson is written. MJRP_LOOP_KAIZEN redirects the destination - that is what
    allows testing the loop without writing to the real memory, the same way MJRP_LOOP_AGENT
    allows testing it without spending tokens. Born on 2026-09-09: the selftest saved and
    restored the file, but captured the state AFTER the first cases had already written - 160
    identical lines leaked into harness-kaizen.md, 35% of the file. A guard on the wrong line
    is a guard that does not exist."""
    override = os.environ.get("MJRP_LOOP_KAIZEN")
    if override:
        return Path(override)
    # 16/09: harness-kaizen.md moved into docs/wiki/kernel/ (it is now a kernel page too -
    # every child project should see it). Old locations kept as fallback for repos not yet
    # on this layout, same pattern as the pre-existing docs/concepts/ legacy fallback.
    for c in ("docs/wiki/kernel/ways-of-working/harness-kaizen.md", "docs/wiki/harness-kaizen.md",
              "docs/concepts/harness-kaizen.md"):
        if (ROOT_DIR / c).exists():
            return ROOT_DIR / c
    return ROOT_DIR / "docs/wiki/kernel/ways-of-working/harness-kaizen.md"


def run_cmd(cmd: str, timeout: int = 300):
    """Return (exit code, output). Exit 127 = the command does not exist -> not evaluable.
    2026-10-25 (F72, R8): no shell. The command is split into an argv (shlex) and run as one; a pipe, `&&` or `$(...)` in it is
    just text. The criterion, the agent command and the progress command are all plain argv commands."""
    try:
        r = subprocess.run(shlex.split(cmd), cwd=ROOT_DIR, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout + r.stderr).strip()
    except subprocess.TimeoutExpired:
        return 124, f"estourou o tempo ({timeout}s)"
    except Exception as e:                                    # noqa: BLE001
        return 127, str(e)


def evaluable(cmd: str) -> bool:
    """--until must be executable BEFORE the first iteration spends a token."""
    prog = shlex.split(cmd)[0] if cmd.strip() else ""
    if not prog:
        return False
    if prog in ("python3", "python", "bash", "sh", "test", "["):
        return True
    return shutil.which(prog, path=os.environ.get("PATH")) is not None or os.access(prog, os.X_OK)


def write_state(n: int, cmd: str, code: int, output: str) -> None:
    ultimas = "\n".join(output.strip().splitlines()[-6:])
    with STATE_FILE.open("a", encoding="utf-8") as f:
        f.write(f"## Iteração {n} — {now()}\n\n`{cmd}` devolveu **{code}**\n\n```\n{ultimas}\n```\n\n")


def _atomic_write(path: Path, text: str) -> None:
    """tmp + os.replace (R23, F72): a reader sees the old file or the new one, never half of it. Inlined (a shared module would have
    to be added to the files new_project.py vendors into every project)."""
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def append_lesson(entry: str) -> None:
    """Adds one entry under `## Lições do loop` of the kaizen page. The page is read, changed and rewritten whole, so two loops
    ending together lost a lesson (or half-wrote the page): the read-modify-write is under a flock and the write is atomic."""
    k = kaizen_path()
    if not k.exists():
        return
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE.parent / "kaizen.lock", "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        t = k.read_text(encoding="utf-8")
        mark = "## Lições do loop"
        if mark in t:
            i = t.index(mark) + len(mark)
            t = t[:i] + "\n\n" + entry.rstrip() + t[i:]
        else:
            t = t.rstrip() + f"\n\n{mark}\n\n{entry}"
        _atomic_write(k, t)


def write_lesson(cmd: str, ceiling: int) -> None:
    """A loop that ends without converging becomes a durable lesson - it does not die in the terminal."""
    append_lesson(f"- **{now()}** · `loop.py` esgotou {ceiling} iterações sem que "
                  f"`{cmd}` passasse. Estado completo em `.mjrp/loop-state.md`. "
                  f"Loop que não converge é sintoma de critério mal posto ou de tarefa maior "
                  f"do que uma passada — as duas coisas se resolvem fora do loop.\n")


DEFAULT_PROGRESS_CMD = "git status --porcelain"


def fingerprint(cmd: str) -> str:
    """What the working tree looks like now — a pass that leaves it identical made no progress.
    The default has no shell (so no `&&`): it is the status plus the diff, two argv commands."""
    code, out = run_cmd(cmd)
    if cmd == DEFAULT_PROGRESS_CMD:
        out += "\n" + run_cmd("git diff")[1]
    return hashlib.sha256(f"{code}\n{out}".encode("utf-8")).hexdigest()


def tokens_of(prompt: str, output: str):
    """(tokens, exact?) for one agent pass: the agent's own usage report when it gives one, else an estimate."""
    for line in reversed(output.strip().splitlines() or [""]):
        try:
            data = json.loads(line)
        except ValueError:
            continue
        usage = data.get("usage") if isinstance(data, dict) else None
        if isinstance(usage, dict):
            total = sum(int(v) for k, v in usage.items()
                        if k.endswith("_tokens") and isinstance(v, (int, float)))
            if total:
                return total, True
    return (len(prompt) + len(output)) // 4, False


def write_stop_lesson(cmd: str, why: str) -> None:
    """A loop stopped by a stop rule is a lesson too — what stopped it and where the state is."""
    append_lesson(f"- **{now()}** · `loop.py` parou por regra ({why}) sem que `{cmd}` passasse. Estado em "
                  f"`.mjrp/loop-state.md`. Parada por regra escala: o código (nova tarefa), a spec (o contrato, com o "
                  f"humano) ou a premissa (a Discovery, pelo Intake) — kernel `pdlc-loops` §5.\n")


def check_tasks(path: str) -> int:
    """Sensor over a feature's tasks.md: every task carries `model:: opus|sonnet`, and every closed
    task carries `rounds::` (a positive integer; it exists to measure, not to cap).
    Exit 0 ok, 1 violations, 2 file missing."""
    f = Path(path)
    if not f.is_file():
        print(f"  [tasks] NÃO AVALIÁVEL — arquivo não existe: {path}")
        return 2
    bad, total = [], 0
    for line in f.read_text(encoding="utf-8").splitlines():
        m = TASK_RE.match(line)
        if not m:
            continue
        total += 1
        marks = {k.group("key"): k.group("val") for k in MARK_RE.finditer(m.group("rest"))}
        if marks.get("model") not in MODELS:
            bad.append(f"{m.group('id')}: model:: {marks.get('model', '(missing)')} (use {'|'.join(MODELS)})")
        if m.group("done") in "xX":
            r = marks.get("rounds", "")
            if not r.isdigit() or int(r) < 1:
                bad.append(f"{m.group('id')}: task fechada sem rounds:: <número>")
    for b in bad:
        print(f"  [tasks] {b}")
    print(f"  [tasks] {total} task(s) · {len(bad)} problema(s)")
    return 1 if bad else 0


def record_rounds(path: str, task: str, rounds: int) -> None:
    """Writes ` · rounds:: N` on the task's line (once; an existing value is kept)."""
    f = Path(path)
    out = []
    for line in f.read_text(encoding="utf-8").splitlines():
        m = TASK_RE.match(line)
        if m and m.group("id") == task and "rounds::" not in line:
            line = f"{line} · rounds:: {rounds}"
        out.append(line)
    _atomic_write(f, "\n".join(out) + "\n")


def main() -> int:
    ap = argparse.ArgumentParser(add_help=True, description="o loop da tarefa")
    ap.add_argument("--until", dest="until", default=None,
                    help="OBRIGATÓRIO — o comando que decide que acabou (exit 0 = acabou)")
    ap.add_argument("--prompt", default="Continue a tarefa até o critério de saída passar.")
    ap.add_argument("--max", type=int, default=DEFAULT_MAX, help=f"teto de iterações (padrão {DEFAULT_MAX})")
    ap.add_argument("--agent", default=DEFAULT_AGENT, help="o que executa a passada")
    ap.add_argument("--dry-run", action="store_true", help="não chama o agente; só avalia o critério")
    ap.add_argument("--budget-tokens", type=int, default=int(os.environ.get("MJRP_LOOP_BUDGET", "0") or 0),
                    help="orçamento de tokens do loop (0 = sem orçamento; ou MJRP_LOOP_BUDGET)")
    ap.add_argument("--stale", type=int, default=2,
                    help="passadas seguidas sem mudança que param o loop (padrão 2; 0 desliga)")
    ap.add_argument("--progress-cmd", default=DEFAULT_PROGRESS_CMD,
                    help="o comando cuja saída mede o progresso (padrão: git status + git diff)")
    ap.add_argument("--check-tasks", metavar="TASKS_MD", default=None,
                    help="sensor: valida model::/rounds:: do tasks.md e sai (0 ok, 1 problema)")
    ap.add_argument("--task", default=None, help="TASK-xx cujas rodadas serão gravadas no --tasks-file")
    ap.add_argument("--tasks-file", default=None, help="tasks.md onde gravar `rounds::` da --task")
    a = ap.parse_args()

    if a.check_tasks:
        return check_tasks(a.check_tasks)

    if not a.until:
        print("  [loop] RECUSADO — nenhum loop começa sem critério de saída.")
        print("         Declare --until <comando com exit code>. (PRINCIPLES II.4)")
        return 2

    from stop_gate import resolve_criterion                       # the contract's closed list (R19): the same one the turn gate reads
    argv, why = resolve_criterion(a.until)
    if argv is None:
        print(f"  [loop] RECUSADO — o --until {why}: {a.until}")
        print("         O critério vem da lista fechada do contrato, não do agente. (PRINCIPLES II.3, II.4)")
        return 2

    if not evaluable(a.until):
        print(f"  [loop] NÃO AVALIÁVEL — o --until não roda: {a.until}")
        print("         Não é reprovação: é não saber. Corrija o comando.")
        return 2

    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    _atomic_write(STATE_FILE,
        "# Estado do loop — o que já se tentou\n\n"
        "> Sobrescrito a cada loop novo. A iteração seguinte lê isto antes de agir: é a memória\n"
        "> de trabalho do loop, e é o que impede repetir a mesma tentativa.\n\n")

    print(f"  [loop] critério: {a.until}")
    print(f"  [loop] teto: {a.max} iteração(ões) · agente: {'(nenhum)' if a.dry_run else a.agent}")
    print(f"  [loop] orçamento: {a.budget_tokens or 'sem'} token(s) · sem progresso: "
          f"{a.stale or 'desligado'} passada(s) seguida(s)\n")

    spent, exact, stale = 0, True, 0
    before = fingerprint(a.progress_cmd)
    for n in range(1, a.max + 1):
        code, output = run_cmd(a.until)
        if code == 0:
            print(f"  [{n}/{a.max}] critério PASSOU · exit 0")
            print(f"\n  [loop] VERDE em {n} iteração(ões).")
            if a.task and a.tasks_file:
                record_rounds(a.tasks_file, a.task, n)
            return 0
        print(f"  [{n}/{a.max}] critério ainda não passa · exit {code}")
        write_state(n, a.until, code, output)
        if n == a.max:
            break
        if a.dry_run:
            print(f"        (dry-run: não chamo o agente)")
            continue
        p = (f"{a.prompt}\n\nO critério de saída é: {a.until}\n"
             f"Ele devolveu {code}" + (" (2 = não avaliável, no todo ou em parte: o relatório diz o que não foi medido; corrija isso, não o código)" if code == 2 else "")
             + ". O que já foi tentado está em .mjrp/loop-state.md — leia antes de agir.")
        ac, asaida = run_cmd(f"{a.agent} {shlex.quote(p)}", timeout=900)
        print(f"        agente rodou · exit {ac}" + (f" · {asaida.splitlines()[-1][:80]}" if asaida else ""))
        t, is_exact = tokens_of(p, asaida)
        spent += t
        exact = exact and is_exact
        after = fingerprint(a.progress_cmd)
        stale = stale + 1 if after == before else 0
        before = after
        if a.budget_tokens and spent >= a.budget_tokens:
            label = "" if exact else " (estimado)"
            write_state(n, a.until, code, f"orçamento esgotado: {spent}{label} de {a.budget_tokens} tokens")
            write_stop_lesson(a.until, f"orçamento: {spent}{label} de {a.budget_tokens} tokens")
            print(f"\n  [loop] ORÇAMENTO — {spent}{label} token(s) de {a.budget_tokens}; o critério não passou.")
            return 4
        if a.stale and stale >= a.stale:
            write_state(n, a.until, code, f"sem progresso: {stale} passada(s) seguida(s) sem mudança")
            write_stop_lesson(a.until, f"sem progresso em {stale} passadas seguidas")
            print(f"\n  [loop] SEM PROGRESSO — {stale} passada(s) seguida(s) não mudaram nada; o critério não passou.")
            return 3

    write_lesson(a.until, a.max)
    print(f"\n  [loop] VERMELHO — {a.max} iteração(ões) e o critério não passou.")
    k = kaizen_path()
    shown = k.relative_to(ROOT_DIR) if k.is_relative_to(ROOT_DIR) else k       # MJRP_LOOP_KAIZEN may point outside the repo
    print(f"         Lição registrada em {shown}; estado em .mjrp/loop-state.md")
    return 1


if __name__ == "__main__":
    sys.exit(main())
