#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
human_valves_guard.py - the PreToolUse(Bash) hook that refuses an AGENT's command that would use one of the human's valves
(F72, R20; AGENTS.md "Push - e do humano" and "Commit so por pathspec": the push, `--no-verify` and `VISUAL_RECHECK_SKIP` are the
MJRP's, never the agent's). Until now these were only written down: "a request is not a rule" (T4). It is the sibling of
catalog_marks_guard.py (the valves of the catalog and of the acceptance) and reads the command the same way (it imports that
guard's shell reader, so the two cannot disagree about what a simple command is).

It refuses (exit 2, one line on stderr that Claude Code hands back to the agent) when a SIMPLE command is:
  1. `git push` (any options, `git -C dir push`, `git -c x=y push`), or a python running `push.py`: the push is the human's.
  2. `git commit|merge|am|rebase|cherry-pick|revert|push` with `--no-verify` (for `commit` also its short form `-n`, alone or inside
     a cluster such as `-nm msg`): skipping the hooks is the human's valve.
  3. any `git` command given `-c core.hooksPath=...` or `git config core.hooksPath ...`: the same valve by another door.
  4. a command that SETS `VISUAL_RECHECK_SKIP`: as `VAR=1 cmd`, after `env`/`export`, inside `sh -c`/`bash -c`/`eval`, or inside the
     inline program or heredoc of an interpreter (`python3 -c "os.environ['VISUAL_RECHECK_SKIP']='1'"`). Reading it passes.

How it avoids false positives: only `Bash`; only the COMMAND position counts (`echo git push`, `grep -r "git push" docs`,
`cat notes.md`, `git log --grep=push`, a commit message that quotes `--no-verify` pass); `git remote`, `git pull`, `git fetch`,
`git commit` without the flag pass.

What it does NOT catch, by design (an honest limit of a text reader; the second line of defence is the written rule): a script FILE
that pushes (`sh run.sh` - not read here), an alias (`git -c alias.p=push p`), a URL or command assembled by a variable, another
platform (Codex, Gemini, Cursor), and the push made by a program other than git or push.py (`gh`, a library).

Any doubt of its own - unreadable input, an error in the hook - exits 0 with `human-valves-guard: nao avaliou (<reason>)` on
stderr: a gate that blocks what it should not gets switched off (the lesson of stop_gate.py).

Input: the hook JSON on stdin (tool_name, tool_input.command, cwd). Python 3 stdlib only.
"""
import json
import os
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True                      # runs inside every project: leave no __pycache__
sys.path.insert(0, str(Path(__file__).resolve().parent))

REFUSAL_PUSH = ("human-valves-guard: o push e do MJRP - o agente commita e faz o merge local, o MJRP empurra "
                "(AGENTS.md, \"Push - e do humano\")")
REFUSAL_VERIFY = ("human-valves-guard: pular os hooks (--no-verify, core.hooksPath) e valvula do MJRP - se um hook reprova, "
                  "corrija o que ele aponta (AGENTS.md, valvulas do humano)")
REFUSAL_VISUAL = ("human-valves-guard: VISUAL_RECHECK_SKIP e a valvula do MJRP no merge de tela - o agente nao a liga "
                  "(AGENTS.md, valvulas do humano)")
SKIP_VAR = "VISUAL_RECHECK_SKIP"
# the variable being SET inside a program: `os.environ['VAR'] = 1`, `process.env.VAR = 1`, `{VAR: 1}`, `putenv('VAR', 1)`; not `== '1'`
VAR_SET = re.compile(SKIP_VAR + r"[\"']?\]?\s*(?:=(?!=)|:|,)")
HOOKS_PATH = re.compile(r"^core\.hookspath(?:=|$)", re.IGNORECASE)
NO_VERIFY_SUBS = {"commit", "merge", "am", "rebase", "cherry-pick", "revert", "push"}
SHORT_WITH_VALUE = set("mFCctS")                    # `git commit` short options that take a value: after one, the cluster is its value
MAX_DEPTH = 5
SEEN = []


def _guard():
    """The shell reader of the catalog guard. None when it is not beside this file."""
    try:
        import catalog_marks_guard as g
        return g
    except Exception:                               # noqa: BLE001 - reported by main() as "nao avaliou"
        return None


def commit_short_no_verify(rest):
    """True when a `git commit` word is the short `-n` (alone or in a cluster before a value-taking letter)."""
    i = 0
    while i < len(rest):
        t = rest[i]
        if t == "--":
            return False
        if t.startswith("--"):
            if "=" not in t and t in ("--message", "--file", "--author", "--date", "--reuse-message", "--reedit-message", "--fixup",
                                      "--squash", "--template", "--cleanup", "--trailer", "--pathspec-from-file") and i + 1 < len(rest):
                i += 1                              # skip the option's value
        elif t.startswith("-") and len(t) > 1:
            for j in range(1, len(t)):
                if t[j] == "n":
                    return True
                if t[j] in SHORT_WITH_VALUE:
                    if j == len(t) - 1:
                        i += 1                      # the value is the next word
                    break
        i += 1
    return False


def has_long_no_verify(rest):
    """`--no-verify` as a word of its own, not as the value of an option such as -m."""
    i = 0
    while i < len(rest):
        t = rest[i]
        if t == "--":
            return False
        if t == "--no-verify":
            return True
        if t.startswith("--"):
            if "=" not in t and t in ("--message", "--file", "--author", "--date", "--trailer", "--template", "--cleanup",
                                      "--reuse-message", "--reedit-message", "--fixup", "--squash") and i + 1 < len(rest):
                i += 1
        elif t.startswith("-") and len(t) > 1 and t[-1] in "mFCct" and t[1] != "-":
            i += 1                                   # `-m MSG`: the message is the next word
        i += 1
    return False


def sets_skip_var(argv, heredocs, g):
    """VISUAL_RECHECK_SKIP being set: a word `VAR=...`, an `export VAR=...`, or inside the program an interpreter runs."""
    if any(w.startswith(SKIP_VAR + "=") for w in argv):
        return True
    programs = g.inline_programs(argv)
    if any(g.ROUTE_INTERPRETERS.match(os.path.basename(w)) for w in argv):
        programs += heredocs
    return any(VAR_SET.search(p) for p in programs)


def judge(command, depth=0):
    """The reason (a REFUSAL_* text) when the command must be refused, else None."""
    g = _guard()
    if g is None:
        raise RuntimeError("catalog_marks_guard.py nao esta ao lado deste hook")
    flat, heredocs = g.lift_heredocs(command)
    for argv in g.simple_commands(flat):
        if sets_skip_var(argv, heredocs, g):
            return REFUSAL_VISUAL
        a = g.strip_prefix(argv)
        if not a:
            continue
        base = os.path.basename(a[0])
        if base == "export" and any(w.startswith(SKIP_VAR) for w in a[1:]):
            return REFUSAL_VISUAL
        if depth < MAX_DEPTH:
            if base in g.SHELLS:
                for k, w in enumerate(a[1:], 1):
                    if re.match(r"^-[A-Za-z]*c[A-Za-z]*$", w) and k + 1 < len(a):
                        hit = judge(a[k + 1], depth + 1)
                        if hit:
                            return hit
                        break
                for body in heredocs:               # `bash <<EOF`
                    if len(a) == 1 or "<<" in command:
                        hit = judge(body, depth + 1)
                        if hit:
                            return hit
            elif base == "eval" and len(a) > 1:
                hit = judge(" ".join(a[1:]), depth + 1)
                if hit:
                    return hit
        if re.match(r"^python[0-9.]*$", base) and any(os.path.basename(w) == "push.py" for w in a[1:3]):
            return REFUSAL_PUSH
        parts = g.git_parts(a)
        if parts is None:
            continue
        sub, rest, _cdir, configs = parts
        if any(HOOKS_PATH.match(c) for c in configs):
            return REFUSAL_VERIFY
        if sub == "config" and any(HOOKS_PATH.match(w) for w in rest if not w.startswith("-")):
            return REFUSAL_VERIFY
        if sub == "push":
            return REFUSAL_PUSH
        if sub in NO_VERIFY_SUBS and (has_long_no_verify(rest) or (sub == "commit" and commit_short_no_verify(rest))):
            return REFUSAL_VERIFY
    return None


def crude(command):
    """The fallback when shlex cannot read the command: two signals together, never one alone."""
    if re.search(r"(?:^|[\s;&|(])" + SKIP_VAR + "=", command) or VAR_SET.search(command):
        return REFUSAL_VISUAL
    if re.search(r"\bgit\b", command) and re.search(r"(?:^|[\s;&|(])git(?:\s+-\S+(?:\s+\S+)?)*\s+push\b", command):
        return REFUSAL_PUSH
    if re.search(r"\bgit\b", command) and re.search(r"\s--no-verify\b", command):
        return REFUSAL_VERIFY
    return None


def main():
    try:
        data = json.load(sys.stdin)
        if not isinstance(data, dict):
            raise ValueError("a entrada nao e um objeto JSON")
    except Exception as exc:                        # noqa: BLE001
        print(f"human-valves-guard: nao avaliou ({exc})", file=sys.stderr)
        return 0
    try:
        if data.get("tool_name") != "Bash":
            return 0
        command = (data.get("tool_input") or {}).get("command")
        if not isinstance(command, str) or not command.strip():
            return 0
        try:
            refusal = judge(command)
        except ValueError:                          # shlex: unbalanced quote and the like
            refusal = crude(command)
    except Exception as exc:                        # noqa: BLE001
        print(f"human-valves-guard: nao avaliou ({exc})", file=sys.stderr)
        return 0
    if refusal:
        print(refusal, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
