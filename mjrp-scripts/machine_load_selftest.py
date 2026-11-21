#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""machine_load_selftest.py - proves the one-heavy-suite-at-a-time semaphore (machine_load.py, hooks/machine_load_guard.py, the doctor's turn; F293).

Incident behind it (2026-11-18): 40+ doctors ran together and the load went past 50. Each case fails if the trava is removed: the second
holder must wait and say who runs and for how long; a dead owner must be retaken; the guard must refuse a bare full suite and pass a narrow
or already-queued one; the doctor must queue behind a holder. Everything runs on a temporary home (`MJRP_MACHINE_HOME`), never on `~/.mjrp`.
"""
import io
import json
import os
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
failures = []


def case(name, cond, detail=""):
    print(f"  {'ok  ' if cond else 'FALHA'} {name}" + (f" — {detail}" if detail and not cond else ""))
    if not cond:
        failures.append(name)


with tempfile.TemporaryDirectory() as tmp:
    os.environ["MJRP_MACHINE_HOME"] = tmp
    os.environ.pop("MJRP_HEAVY_HELD", None)
    import machine_load as ml

    case("livre: ninguém segura a máquina", ml.holder() is None)
    fd = ml.acquire("doctor", "doctor.py x", wait=1)
    h = ml.holder()
    case("segurada: o dono aparece com rótulo e pid", bool(h) and h["label"] == "doctor" and h["pid"] == os.getpid(), h)
    out = io.StringIO()
    t0 = time.monotonic()
    second = ml.acquire("pytest", "pytest", wait=2, out=out)
    case("a segunda espera a vez e desiste no teto (sem rodar)", second is None and time.monotonic() - t0 >= 1.8, second)
    case("a espera diz quem roda e há quanto tempo", "fila: pytest" in out.getvalue() and "doctor" in out.getvalue() and "há " in out.getvalue(), out.getvalue())
    ml.release(fd)
    case("liberada: a máquina fica livre", ml.holder() is None)
    fd2 = ml.acquire("pytest", "pytest", wait=1)
    case("liberada: a segunda pega a vez", fd2 is not None)
    ml.release(fd2)

    # F325 (UAT-632): the turn goes in ARRIVAL order, not to whoever retries at the instant the lock drops
    holder_fd = ml.acquire("holder", "h", wait=1)
    waiters = []
    for n in range(3):
        code = ("import sys,os,time;sys.path.insert(0,%r);import machine_load as m;fd=m.acquire('w%d','x',wait=60);"
                "print('got w%d',time.time(),flush=True);time.sleep(0.3);m.release(fd)" % (str(HERE), n, n))
        waiters.append(subprocess.Popen([sys.executable, "-c", code], stdout=subprocess.PIPE, text=True, env=dict(os.environ)))
        for _ in range(100):
            if len(ml.queue()) == n + 1:
                break
            time.sleep(0.05)
    case("a fila mostra os três pedidos em ordem de chegada", [t["label"] for t in ml.queue()] == ["w0", "w1", "w2"], ml.queue())
    ml.release(holder_fd)
    got = []
    for w in waiters:
        w.wait(timeout=60)
        got.append((float(w.stdout.read().split()[-1]), w))
    order = [waiters.index(w) for _, w in sorted(got, key=lambda x: x[0])]
    case("três pedidos saem na ordem em que chegaram", order == [0, 1, 2], order)
    dead = subprocess.Popen([sys.executable, "-c", "import time;time.sleep(60)"])
    (ml._queue_dir() / f"{time.time_ns():020d}-{dead.pid}-dead.json").write_text(json.dumps({"pid": dead.pid, "label": "dead"}))
    os.kill(dead.pid, signal.SIGKILL)
    dead.wait()
    case("o ticket de processo morto sai sozinho", all(t["label"] != "dead" for t in ml.queue()), ml.queue())
    (ml._queue_dir() / f"{time.time_ns():020d}-{os.getpid()}-reuse.json").write_text(json.dumps({"pid": os.getpid(), "label": "reuse"}))
    fdr = ml.acquire("novo", "x", wait=5)
    case("ticket de pid reaproveitado (vivo, sem dono) não trava a fila", fdr is not None)
    if fdr is not None:
        ml.release(fdr)
    (ml._queue_dir() / f"{time.time_ns():020d}-1-bad.json").write_text("[]")
    case("ticket ilegível não derruba a fila", ml.queue() == [])

    # a dead owner is retaken: the owner process takes the lock and is killed with SIGKILL (no cleanup runs)
    code = ("import sys,time;sys.path.insert(0,%r);import machine_load as m;fd=m.acquire('doctor','x',wait=1);print('held',flush=True);time.sleep(60)" % str(HERE))
    p = subprocess.Popen([sys.executable, "-c", code], stdout=subprocess.PIPE, text=True, env=dict(os.environ))
    p.stdout.readline()
    case("o dono vivo (outro processo) segura", ml.holder() is not None and ml.holder()["pid"] == p.pid)
    os.kill(p.pid, signal.SIGKILL)
    p.wait()
    fd3 = ml.acquire("pytest", "pytest", wait=3)
    case("o lock de um processo morto é retomado", fd3 is not None)
    if fd3 is not None:
        ml.release(fd3)

    # the wrapper: runs the command, passes its exit, and a child of the holder does not queue again
    r = subprocess.run([sys.executable, str(HERE / "machine_load.py"), "run", "--label", "t", "--", sys.executable, "-c",
                        "import os,sys;sys.exit(3 if os.environ.get('MJRP_HEAVY_HELD') else 0)"], capture_output=True, text=True)
    case("`run` passa o exit do comando e marca o filho como dono (MJRP_HEAVY_HELD)", r.returncode == 3, r)
    fd4 = ml.acquire("doctor", "x", wait=1)
    r = subprocess.run([sys.executable, str(HERE / "machine_load.py"), "run", "--wait", "1", "--", sys.executable, "-c", "print('ran')"],
                       capture_output=True, text=True)
    case("`run` com a máquina ocupada não roda o comando e sai 75", r.returncode == 75 and "ran" not in r.stdout, r)

    # the doctor queues behind the holder (it takes the turn before it runs)
    d = subprocess.Popen([sys.executable, str(HERE / "doctor.py"), tmp], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                         env=dict(os.environ))
    time.sleep(3)
    waiting = d.poll() is None
    ml.release(fd4)
    try:
        _, err = d.communicate(timeout=60)
    except subprocess.TimeoutExpired:
        d.kill()
        err = "(não terminou)"
    case("o doctor espera a vez com a máquina ocupada e roda quando ela libera", waiting and "fila: doctor" in err, (waiting, err[-200:]))

# the reader: which commands are a heavy suite
hl = ml.heavy_label
case("doctor completo é pesado", hl(["python3", "mjrp-scripts/doctor.py", "."]) == "doctor")
case("o selftest do doctor não é o doctor", hl(["python3", "mjrp-scripts/doctor_selftest.py"]) is None)
case("pytest sem alvo é a bateria inteira", hl(["uv", "run", "--project", "apps/control-center", "pytest"]) == "pytest")
case("python -m pytest sem alvo é pesado", hl(["python3", "-m", "pytest", "-q"]) == "pytest")
case("pytest num arquivo ou -k é estreito", hl(["pytest", "tests/test_a.py"]) is None and hl(["pytest", "-k", "board"]) is None)
case("npm test e vitest sem arquivo são pesados", hl(["npm", "test"]) == "front" and hl(["npx", "vitest", "run"]) == "front")
case("vitest num arquivo é estreito", hl(["npx", "vitest", "run", "src/a.test.ts"]) is None)
case("o comando já na fila passa", hl(["python3", "mjrp-scripts/machine_load.py", "run", "--", "pytest"]) is None)
case("opção com .py/.ts e valor de opção não são alvo: a bateria inteira", hl(["pytest", "--cov=src/app.py"]) == "pytest" and hl(["npx", "vitest", "run", "--config", "vitest.config.ts"]) == "front")
case("env, timeout e nice na frente não escondem a suíte", hl(["env", "pytest"]) == "pytest" and hl(["timeout", "600", "pytest"]) == "pytest" and hl(["nice", "-n", "5", "python3", "mjrp-scripts/doctor.py", "."]) == "doctor")
case("pytest -p no:cacheprovider tests/a.py é estreito", hl(["pytest", "-p", "no:cacheprovider", "tests/a.py"]) is None)
case("git commit citando pytest não é pesado", hl(["git", "commit", "-m", "pytest"]) is None)


GUARD_HOME = tempfile.mkdtemp(prefix="machine-load-selftest-")   # derived: removed below
GUARD_HOME_EARLY = GUARD_HOME

# F323: low priority and few workers, configurable without restarting anything; no launchd/taskpolicy on the machine falls back to nice
mac = dict(platform="darwin", which=lambda n: f"/usr/bin/{n}")
case("macOS com taskpolicy: a suíte sobe em background (taskpolicy -b)", ml.low_priority(["pytest"], {}, **mac) == ["taskpolicy", "-b", "pytest"])
case("sem taskpolicy (Linux, contêiner, sem launchd): cai no nice 10", ml.low_priority(["pytest"], {}, platform="linux", which=lambda n: f"/usr/bin/{n}") == ["/usr/bin/nice", "-n", "10", "pytest"]
     and ml.low_priority(["pytest"], {}, platform="darwin", which=lambda n: "/usr/bin/nice" if n == "nice" else None)[1:3] == ["-n", "10"])
case("MJRP_HEAVY_NICE=15 manda nice 15 e =off deixa o comando como está", ml.low_priority(["x"], {"MJRP_HEAVY_NICE": "15"}, **mac)[1:3] == ["-n", "15"]
     and ml.low_priority(["x"], {"MJRP_HEAVY_NICE": "off"}, **mac) == ["x"])
case("nice negativo ou absurdo é contido em 0..19 e lixo cai no padrão", ml.low_priority(["x"], {"MJRP_HEAVY_NICE": "-5"}, **mac)[1:3] == ["-n", "0"] and ml.low_priority(["x"], {"MJRP_HEAVY_NICE": "99"}, **mac)[1:3] == ["-n", "19"] and ml.low_priority(["x"], {"MJRP_HEAVY_NICE": "lixo"}, **mac)[1:3] == ["-n", "10"])
case("sem nice nem taskpolicy o comando roda como está (não quebra)", ml.low_priority(["x"], {}, platform="linux", which=lambda n: None) == ["x"])
we = ml.worker_env({})
case("trabalhadores limitados a 2 por padrão nos runners", we["VITEST_MAX_WORKERS"] == "2" and we["JEST_WORKERS"] == "2" and we["OMP_NUM_THREADS"] == "2", we)
case("MJRP_HEAVY_WORKERS=4 muda o teto; off deixa os runners em paz; o valor do chamador vence",
     ml.worker_env({"MJRP_HEAVY_WORKERS": "4"})["VITEST_MAX_WORKERS"] == "4" and "VITEST_MAX_WORKERS" not in ml.worker_env({"MJRP_HEAVY_WORKERS": "off"})
     and ml.worker_env({"VITEST_MAX_WORKERS": "7"})["VITEST_MAX_WORKERS"] == "7")
BASE_NICE = os.getpriority(os.PRIO_PROCESS, 0)
probe = "import os;print(os.getpriority(os.PRIO_PROCESS, 0), os.environ.get('VITEST_MAX_WORKERS'))"
r_run = subprocess.run([sys.executable, str(HERE / "machine_load.py"), "run", "--", sys.executable, "-c", probe],
                   capture_output=True, text=True, env=dict(os.environ, MJRP_MACHINE_HOME=GUARD_HOME_EARLY, MJRP_HEAVY_NICE="10"))
case("`run` de verdade: o filho roda com nice 10 e teto de trabalhadores", r_run.stdout.split() == [str(min(19, BASE_NICE + 10)), "2"], r_run)   # relative to this process
code = ("import os,sys;sys.path.insert(0,%r);import machine_load as m;b=os.getpriority(os.PRIO_PROCESS,0)\n"
        "with m.heavy('doctor','x',wait=1): print(os.getpriority(os.PRIO_PROCESS,0)-b, os.environ.get('JEST_WORKERS'))" % str(HERE))
r = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, env=dict(os.environ, MJRP_MACHINE_HOME=GUARD_HOME_EARLY, MJRP_HEAVY_NICE="10"))
case("o doctor (`heavy()`) baixa a própria prioridade e limita os trabalhadores", r.stdout.split() == ["10", "2"], r)


def guard(command):
    r = subprocess.run([sys.executable, str(HERE / "hooks" / "machine_load_guard.py")], input=json.dumps(
        {"tool_name": "Bash", "tool_input": {"command": command}}), capture_output=True, text=True, env=dict(os.environ, MJRP_MACHINE_HOME=GUARD_HOME))
    return r


g = guard("python3 mjrp-scripts/doctor.py .")
case("o guarda recusa o doctor puro e dá o comando na fila", g.returncode == 2 and "machine_load.py run" in g.stderr, g)
g = guard("cd apps/control-center && uv run pytest -q")
case("o guarda recusa a bateria em cadeia (cd && pytest)", g.returncode == 2, g)
g = guard('bash -c "npm test"')
case("o guarda recusa a suíte escondida em bash -c", g.returncode == 2, g)
case("o guarda recusa bash -lc e timeout", guard('bash -lc "pytest"').returncode == 2 and guard("timeout 600 pytest").returncode == 2)
case("o guarda deixa o teste estreito passar", guard("uv run pytest tests/test_a.py").returncode == 0)
case("o guarda deixa o comando já na fila passar", guard("python3 mjrp-scripts/machine_load.py run -- python3 mjrp-scripts/doctor.py .").returncode == 0)
case("o guarda deixa a conversa sobre o comando passar", guard('git commit -m "roda o doctor.py e o pytest"').returncode == 0 and guard("grep -rn pytest docs").returncode == 0)
case("o guarda deixa o ls passar", guard("ls -la").returncode == 0)

import shutil
shutil.rmtree(GUARD_HOME, ignore_errors=True)

if failures:
    print("machine_load_selftest: FALHOU — " + "; ".join(failures))
    sys.exit(1)
print("machine_load_selftest: todos os casos passaram")
