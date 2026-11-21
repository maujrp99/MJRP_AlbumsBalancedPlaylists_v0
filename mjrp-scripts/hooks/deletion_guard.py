#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
deletion_guard.py - the PreToolUse(Bash) hook that refuses an AGENT's command that would delete what cannot come back
(ADR-0023 section 5; F74 TASK-07). Until now "before `rm`, move it" was a request, and "a request is not a rule" (T4). It is the
sibling of human_valves_guard.py and catalog_marks_guard.py and reads the command the same way (it imports that guard's shell
reader, so the three cannot disagree about what a simple command is). The class of each target comes from `_pathclass.classify`:
the same function `_safe.py discard` uses, so the guard and the door cannot disagree either.

It refuses (exit 2, one line on stderr that Claude Code hands back to the agent) when a SIMPLE command is:
  1. `rm` / `unlink` (with or without `-r`, `-f`), and a target is not class 3 (derived). Class 1, 2 and 4 are refused; so is a target
     the hook cannot resolve (`$VAR`, `$(...)`, a `{a,b}` brace) - because `_safe.py discard` classifies the path already resolved, so
     the agent is never locked out. `~`, `$HOME`, `$TMPDIR` and a glob (`*`, `?`, `[`) ARE resolved (the glob against the disk); a path
     that does not exist passes (nothing to lose). `xargs rm` is refused: the targets come from a pipe. A word that ends in `/` (or `/.`)
     and is a symlink also has the class of what it points to judged (`rm -rf link/` deletes the TARGET); the more protective wins.
  2. `find ... -delete`, or `find ... -exec|-execdir|-ok rm`, and a starting folder is not class 3.
  3. `rmtree` / `os.remove` / `os.unlink` / `Path.unlink` inside the program of an interpreter (`python3 -c`, or the heredoc THAT command is fed: `python3 - <<PY`, `node <<JS`; never the heredoc of `cat >`,
     `git commit -F -` or another command on the line), when the LITERAL path is not class 3. A target the program computes
     (`rmtree(tmp)` after `mkdtemp()`) passes: that is the Python program, the named door ADR-0023 section 5 says the hook does not cover.
  4. `git worktree remove [--force] <path>` and the worktree is not class 3 (merged, clean, nothing ignored outside `derived`, unlocked).
  5. `git branch -D` (or `-d --force`, `--delete --force`): `git branch -d` deletes only a merged branch.
  6. `git reset --hard`, `git checkout -- <paths>` / `git checkout .` / `git checkout -f`, and `git restore` that touches the work tree (no
     `--staged` alone), when a tracked file under the target has an uncommitted edit.
  7. `git clean` without `-n`, judged by the list of `git clean -n` (the files it would remove): any that is not class 3 refuses.
The message names the way out: `python3 mjrp-scripts/_safe.py discard <path>` for the derived, `... retire <path>` for the class 1, `git rm` for
the versioned, and `... restore <file>` to put the committed text back over an uncommitted edit (the copy goes to `_backups/` first; F180, UAT-487:
the old message pointed to `retire`, which leaves a tracked file that is gone - still a change - and the agents then bypassed the guard).

How it avoids false positives: only `Bash`; only the COMMAND position counts (`echo rm -r x`, `grep "rm -r" docs`, a commit message that
quotes `git clean`, `git log --grep=reset` pass); a class 3 target (a `node_modules`, anything in $TMPDIR, a merged and clean worktree)
passes, and so does a path that is not there. It calls `git` only when the command has one of the verbs above.

How it follows the folder: a `cd <dir>` earlier in the same command moves where the relative targets are resolved; a `cd` it cannot resolve
makes the later relative targets unresolvable (refused).

What it does NOT catch, by design (named in ADR-0023 section 5): a script FILE that deletes (`python3 clean.py`, `sh x.sh`), an alias, a path
or a verb assembled by a variable, `git stash drop`, and the other platforms (Codex, Gemini, the Cowork) where no hook runs.

Any doubt of its own - unreadable input, an error in the hook, `_pathclass` missing - exits 0 with `deletion-guard: nao avaliou (<reason>)` on
stderr: a gate that blocks what it should not gets switched off (the lesson of stop_gate.py).

Input: the hook JSON on stdin (tool_name, tool_input.command, cwd). Python 3 stdlib only.
"""
import glob
import json
import os
import re
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True                      # runs inside every project: leave no __pycache__
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))                        # catalog_marks_guard (the shell reader)
sys.path.insert(0, str(HERE.parent))                 # _pathclass, _git (the classifier)

MAX_DEPTH = 5
SAFE_WAY = ("Para o derivado: `python3 mjrp-scripts/_safe.py discard <caminho>` (só ele remove); para tirar o insubstituível do lugar: "
            "`python3 mjrp-scripts/_safe.py retire <caminho>`; o versionado sai por `git rm` e commit")
# The way out of a refused `git restore` / `checkout --` / `reset --hard`. NOT `_safe.py retire`: that moves the file out and leaves a tracked
# file that is gone, which is still a change to the guard (UAT-487: the agents then rewrote it with `git show HEAD:<file> >`).
RESTORE_WAY = ("Para devolver o texto commitado de UM arquivo (o que o build reescreveu, por exemplo): `python3 mjrp-scripts/_safe.py restore <arquivo>` "
               "— guarda a edição em `_backups/` e então restaura. Para ficar com a edição: commite. Não use `retire` aqui: ele tira o arquivo "
               "do lugar e o git segue vendo uma mudança")
RM_VERBS = {"rm", "unlink"}
FIND_EXEC = {"-exec", "-execdir", "-ok", "-okdir"}
PY_DELETERS = re.compile(r"\brmtree\s*\(|\bos\s*\.\s*(?:remove|unlink|removedirs)\s*\(|\.\s*unlink\s*\(|\b(?:rmSync|rmdirSync|unlinkSync|rimraf|rm_rf)\s*\(")
PY_LITERAL = re.compile(r"\b(?:rmtree|remove|unlink|removedirs|rmSync|rmdirSync|unlinkSync|rimraf|rm_rf)\s*\(\s*(?:(?:pathlib\.)?Path\s*\(\s*)?[rRuU]?(['\"])(.*?)\1")
PY_PATH_LITERAL = re.compile(r"\bPath\s*\(\s*[rRuU]?(['\"])(.*?)\1\s*\)\s*\.\s*(?:unlink|rmdir)\s*\(")      # Path('x').unlink()
UNRESOLVED = re.compile(r"[$`{]|\\")


class Unresolved(Exception):
    """A target the hook cannot turn into a path."""


def _guard():
    try:
        import catalog_marks_guard as g
        return g
    except Exception:                                # noqa: BLE001 - reported by main() as "nao avaliou"
        return None


def _pathclass():
    import _pathclass as pc
    return pc


def expand_word(word, cwd):
    """The absolute path a word stands for, or raises Unresolved. `~`, `$HOME` and `$TMPDIR` are expanded; any other variable,
    `$(...)`, backtick or brace is not."""
    w = word
    if w == "~" or w.startswith("~/"):
        w = os.path.expanduser(w)
    for var, value in (("HOME", os.environ.get("HOME") or str(Path.home())),
                       ("TMPDIR", (os.environ.get("TMPDIR") or tempfile.gettempdir()).rstrip("/"))):
        w = re.sub(r"\$\{" + var + r"\}|\$" + var + r"(?![A-Za-z0-9_])", lambda _m, v=value: v, w)
    if UNRESOLVED.search(w):
        raise Unresolved(word)
    if not os.path.isabs(w):
        if cwd is None:
            raise Unresolved(word)
        w = os.path.join(cwd, w)
    return w


def targets_of(words, cwd):
    """The paths a list of words names (globs expanded against the disk). A glob with no match yields nothing."""
    out = []
    for w in words:
        full = expand_word(w, cwd)
        if re.search(r"[*?\[]", full):
            out += glob.glob(full)
        else:
            out.append(full)
    return out


def refusal_for(path, verb):
    """The refusal text when `path` must not go, else None."""
    if not (os.path.exists(path) or os.path.islink(path)):
        return None
    pc = _pathclass()
    verdict = pc.classify(path)
    if verdict.klass == pc.DERIVED:
        return None
    way = {pc.VERSIONED: "Sai por `git rm` + commit, nunca por apagar o arquivo.",
           pc.ROTATING: "Quem poda é o dono dele (veja `owner` em `structure_rules.json`), não o agente."}.get(verdict.klass)
    return f"deletion-guard: `{verb}` recusado em {path} — {verdict}. {way or SAFE_WAY + '.'}"


def refusal_for_word(path, verb, word):
    """`refusal_for`, and - when the word ends in `/` or `/.` and is a symlink - the class of what the link points to too: `rm -rf link/`
    and `find link/ -delete` act on the TARGET (the shell's completion puts the slash there; macOS follows it), while the bare `link`
    is only the link, which `_safe.py discard` also removes. The more protective of the two wins."""
    hit = refusal_for(path, verb)
    if hit or not (word.endswith("/") or word.endswith("/.")):
        return hit
    link = path
    while link.endswith("/") or link.endswith("/."):
        link = link[:-1] if link.endswith("/") else link[:-2]
    if not os.path.islink(link):
        return None
    target = os.path.realpath(link)
    hit = refusal_for(target, verb)
    if hit:
        return hit + f" (`{word}` é um link para {target}: com a barra no fim o `{verb}` age sobre o ALVO; sem a barra só o link sai)"
    return None


def refusal_unresolved(word, verb):
    return (f"deletion-guard: `{verb}` recusado — não consegui resolver o alvo `{word}` (variável, `$(...)`, chave ou pasta de trabalho "
            f"desconhecida). Passe o caminho já resolvido: `python3 mjrp-scripts/_safe.py discard <caminho>` classifica e remove só o "
            f"derivado, e `... retire <caminho>` move o resto para `_backups/`.")


def rm_targets(args):
    """The words of an `rm`/`unlink` that are paths (not options)."""
    out, only_paths = [], False
    for w in args:
        if only_paths or not w.startswith("-") or w == "-":
            out.append(w)
        elif w == "--":
            only_paths = True
    return out


def find_starts(args):
    """The starting folders of a `find`: the words before the first expression (a `-option`, `(`, `!`); `.` when there are none."""
    starts = []
    for w in args:
        if (w.startswith("-") and w != "-") or w in ("(", ")", "!", ","):
            break
        starts.append(w)
    return starts or ["."]


def judge_rm(verb, args, cwd):
    for w in rm_targets(args):
        try:
            paths = targets_of([w], cwd)
        except Unresolved:
            return refusal_unresolved(w, verb)
        for p in paths:
            hit = refusal_for_word(p, verb, w)
            if hit:
                return hit
    return None


def judge_find(argv, cwd):
    args = argv[1:]
    deletes = "-delete" in args or any(w in FIND_EXEC and i + 1 < len(args) and os.path.basename(args[i + 1]) in RM_VERBS | {"shred"}
                                       for i, w in enumerate(args))
    if not deletes:
        return None
    for w in find_starts(args):
        try:
            paths = targets_of([w], cwd)
        except Unresolved:
            return refusal_unresolved(w, "find -delete")
        for p in paths:
            hit = refusal_for_word(p, "find -delete", w)
            if hit:
                return hit
    return None


def judge_python(programs, cwd):
    """An interpreter's inline program (or the heredoc it is fed) that deletes a LITERAL path: refused unless that path is class 3.
    A non-literal target (`rmtree(tmp)` with `tmp = tempfile.mkdtemp()`) passes: a program that deletes what it computes at run time is the
    named door the hook does not cover (ADR-0023 section 5, "o script que remove"), and the way out the refusal would point to cannot
    classify a path that only exists while the program runs."""
    for prog in programs:
        if not PY_DELETERS.search(prog):
            continue
        for lit in [m.group(2) for m in PY_LITERAL.finditer(prog)] + [m.group(2) for m in PY_PATH_LITERAL.finditer(prog)]:
            try:
                paths = targets_of([lit], cwd)
            except Unresolved:
                return refusal_unresolved(lit, "rmtree")
            for p in paths:
                hit = refusal_for(p, "rmtree")
                if hit:
                    return hit
    return None


def git_run(cwd, *args):
    import _git
    return _git.run(cwd, *args, timeout=30)


def tracked_edits(cwd, pathspecs):
    """True when a tracked file under `pathspecs` (all, when empty) has an uncommitted change; raises on a git failure."""
    r = git_run(cwd, "--literal-pathspecs", "status", "--porcelain", "-uno", *(["--", *pathspecs] if pathspecs else []))
    if r.code != 0:
        raise RuntimeError(r.err.strip() or "git status falhou")
    return bool(r.out.strip())


def git_dir_of(cwd, cdir):
    if cdir is None:
        return cwd
    return expand_word(cdir, cwd)


def judge_git(sub, rest, cwd, cdir):
    """The refusal for a git subcommand that destroys, else None."""
    try:
        where = git_dir_of(cwd, cdir)
    except Unresolved as e:
        return refusal_unresolved(str(e), f"git -C {e}")
    opts = [w for w in rest if w.startswith("-") and w != "--"]
    plain = [w for w in rest if not w.startswith("-")]
    after_dd = rest[rest.index("--") + 1:] if "--" in rest else []
    if sub == "worktree":
        if not plain or plain[0] != "remove":
            return None
        paths = plain[1:]
        if not paths:
            return None
        for w in paths:
            try:
                full = expand_word(w, where)
            except Unresolved:
                return refusal_unresolved(w, "git worktree remove")
            hit = refusal_for(full, "git worktree remove")
            if hit:
                return hit + " (um worktree só sai se estiver mesclado na `main`, limpo e sem ignorado fora de `derived`)"
        return None
    if sub == "branch":
        forced = any(o == "-D" or (o.startswith("-") and not o.startswith("--") and "D" in o) for o in opts)
        delete_force = any(o in ("-d", "--delete") or (o.startswith("-") and not o.startswith("--") and "d" in o) for o in opts) and any(
            o in ("-f", "--force") or (o.startswith("-") and not o.startswith("--") and "f" in o) for o in opts)
        if forced or delete_force:
            return ("deletion-guard: `git branch -D` recusado — apaga um ramo mesmo sem estar mesclado, e o trabalho que só ele tem some. "
                    "`git branch -d <ramo>` apaga só ramo já mesclado.")
        return None
    if sub == "reset":
        if "--hard" not in opts:
            return None
        specs = []                                       # the whole work tree
    elif sub == "checkout":
        forced = "-f" in opts or "--force" in opts
        if not (after_dd or "." in plain or forced):
            return None                                  # a branch switch: git itself refuses to lose edits
        specs = after_dd or (["."] if "." in plain or forced else [])
    elif sub == "restore":
        if "--staged" in opts and "--worktree" not in opts and "-W" not in opts:
            return None                                  # only the index: the work tree keeps its edits
        specs = [w for w in plain if w != "--"]
    elif sub == "clean":
        return judge_clean(rest, where)
    else:
        return None
    try:
        edits = tracked_edits(where, [] if "." in specs else specs)
    except Exception as e:                               # noqa: BLE001 - a doubt about the repo is a refusal here
        return (f"deletion-guard: `git {sub}` recusado — não consegui ver se há edição sem commit ({str(e)[:80]}). Veja `git status`. "
                f"{RESTORE_WAY}.")
    if edits:
        return (f"deletion-guard: `git {sub}` recusado — há edição sem commit em arquivo rastreado ao alcance dele, e o git não a devolve. "
                f"{RESTORE_WAY}.")
    return None


def judge_clean(rest, where):
    opts = [w for w in rest if w.startswith("-") and w != "--"]
    if any(o in ("-n", "--dry-run") or (o.startswith("-") and not o.startswith("--") and "n" in o) for o in opts):
        return None                                      # a dry run removes nothing
    if not any(o in ("-f", "--force") or (o.startswith("-") and not o.startswith("--") and "f" in o) for o in opts):
        return None                                      # without -f git itself refuses
    try:
        r = git_run(where, "clean", "-n", *[w for w in rest if w not in ("-f", "--force")])
    except Exception as e:                               # noqa: BLE001
        return f"deletion-guard: `git clean` recusado — não consegui listar o que ele removeria ({str(e)[:80]})."
    if r.code != 0:
        return f"deletion-guard: `git clean` recusado — não consegui listar o que ele removeria ({r.err.strip()[:80]})."
    top = None
    try:
        top = git_run(where, "rev-parse", "--show-toplevel").out.strip()
    except Exception:                                    # noqa: BLE001
        pass
    for line in r.out.splitlines():
        m = re.match(r"Would remove (.+)$", line)
        if not m:
            continue
        path = os.path.join(top or where, m.group(1).strip().rstrip("/"))
        hit = refusal_for(path, "git clean")
        if hit:
            return hit
    return None


def judge(command, cwd, depth=0):
    """The reason (a refusal text) when the command must be refused, else None."""
    g = _guard()
    if g is None:
        raise RuntimeError("catalog_marks_guard.py nao esta ao lado deste hook")
    flat, heredocs = g.lift_heredocs(command)
    here, next_body = cwd, 0
    for argv in g.simple_commands(flat):
        # a heredoc belongs to the simple command that carries its `<<`: only that command's interpreter or shell reads it as a program
        # (the body of `cat > f <<EOF` or of a commit message `-F - <<MSG` is text, even on a line that also runs python)
        opened = sum(1 for w in argv if re.match(r"^<<-?$", w))
        own, next_body = heredocs[next_body:next_body + opened], next_body + opened
        a = g.strip_prefix(argv)
        if not a:
            continue
        base = os.path.basename(a[0])
        # 2026-11-05: F153 made `xargs` a prefix the guards look behind (`catalog_marks_guard.strip_prefix`), so `ls | xargs rm`
        # reached here as a bare `rm` with no target and passed; a delete verb behind `xargs` takes its targets from a pipe
        piped = any(os.path.basename(w) == "xargs" for w in argv[:len(argv) - len(a)])
        if base in ("cd", "pushd"):
            target = next((w for w in a[1:] if not w.startswith("-")), None)
            try:
                here = expand_word(target, here) if target else here
            except Unresolved:
                here = None                              # relative targets after this are unresolvable
            continue
        if base == "popd":
            here = None
            continue
        if depth < MAX_DEPTH:
            if base in g.SHELLS:
                for k, w in enumerate(a[1:], 1):
                    if re.match(r"^-[A-Za-z]*c[A-Za-z]*$", w) and k + 1 < len(a):
                        hit = judge(a[k + 1], here, depth + 1)
                        if hit:
                            return hit
                        break
                for body in own:
                    hit = judge(body, here, depth + 1)
                    if hit:
                        return hit
            elif base == "eval" and len(a) > 1:
                hit = judge(" ".join(a[1:]), here, depth + 1)
                if hit:
                    return hit
        if base in RM_VERBS and piped:
            hit = ("deletion-guard: `xargs rm` recusado — os alvos vêm de um pipe e não dá para classificá-los antes. "
                   "Liste os caminhos e passe cada um ao `python3 mjrp-scripts/_safe.py discard <caminho>`.")
        elif base in RM_VERBS:
            hit = judge_rm(base, a[1:], here)
        elif base == "xargs" and any(os.path.basename(w) in RM_VERBS for w in a[1:3]):
            hit = ("deletion-guard: `xargs rm` recusado — os alvos vêm de um pipe e não dá para classificá-los antes. "
                   "Liste os caminhos e passe cada um ao `python3 mjrp-scripts/_safe.py discard <caminho>`.")
        elif base == "find":
            hit = judge_find(a, here)
        elif any(g.ROUTE_INTERPRETERS.match(os.path.basename(w)) for w in a[:4]):
            hit = judge_python(g.inline_programs(a) + own, here)
        else:
            hit = None
        if hit:
            return hit
        parts = g.git_parts(a)
        if parts is not None:
            sub, rest, cdir, _configs = parts
            hit = judge_git(sub, rest, here, cdir)
            if hit:
                return hit
    return None


def crude(command):
    """The fallback when shlex cannot read the command: only the plainest, two-signal case, never a free refusal."""
    if re.search(r"(?:^|[\s;&|(])rm\s+-[a-zA-Z]*[rf][a-zA-Z]*\s+(?:/|~|\.\.?(?:\s|$)|\$)", command):
        return ("deletion-guard: `rm -r` num comando que não consegui ler por inteiro, com alvo na raiz, no `~`, em `.` ou numa variável — "
                + SAFE_WAY + ".")
    return None


def main():
    try:
        data = json.load(sys.stdin)
        if not isinstance(data, dict):
            raise ValueError("a entrada nao e um objeto JSON")
    except Exception as exc:                        # noqa: BLE001
        print(f"deletion-guard: nao avaliou ({exc})", file=sys.stderr)
        return 0
    try:
        if data.get("tool_name") != "Bash":
            return 0
        command = (data.get("tool_input") or {}).get("command")
        if not isinstance(command, str) or not command.strip():
            return 0
        cwd = data.get("cwd") if isinstance(data.get("cwd"), str) and data.get("cwd") else os.getcwd()
        try:
            refusal = judge(command, cwd)
        except ValueError:                          # shlex: unbalanced quote and the like
            refusal = crude(command)
    except Exception as exc:                        # noqa: BLE001
        print(f"deletion-guard: nao avaliou ({exc})", file=sys.stderr)
        return 0
    if refusal:
        print(refusal, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
