# cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_run.py - run a command with a deadline and without a shell (F71 R8/R9), for the doctor and the sensors.

A command string of the contract is split with `shlex` and never handed to a shell (`split_command`), because the
`sensors:` of a cloned contract run when the doctor runs: with a shell a contract from a stranger executes anything.
Exit 124 = the deadline passed, 127 = the command could not start.
"""
import shlex
import subprocess


class ShellNeeded(ValueError):
    """F71 R8: a command of the contract needs a shell (pipe, `&&`, redirect, substitution). The doctor never runs one."""


_SHELL_PUNCT = set("();<>|&")


def split_command(cmd):
    """A command string of the contract as an argv list, WITHOUT a shell. Raises ShellNeeded when the string needs one.
    Why: the `sensors:` of a cloned contract run when the doctor runs; with `shell=True` a contract from a stranger
    executes anything (audit 2026-10-25, R8). A command that needs a pipe or `&&` becomes a script the contract names."""
    if "`" in cmd or "$(" in cmd:
        raise ShellNeeded("usa substituição de comando (`` ` `` ou `$(`)")
    lex = shlex.shlex(cmd, posix=True, punctuation_chars=True)
    lex.whitespace_split = True
    try:
        toks = list(lex)
    except ValueError as e:                                  # unbalanced quote
        raise ShellNeeded(f"aspas desbalanceadas ({e})") from e
    for t in toks:
        if t and set(t) <= _SHELL_PUNCT:
            raise ShellNeeded(f"usa o operador de shell `{t}`")
    if not toks:
        raise ShellNeeded("está vazio")
    return toks


def sh(cmd, cwd, timeout=30):
    """Runs a command with a deadline. A str is split by `split_command` (no shell; ShellNeeded propagates), a list runs
    as is. Exit 124 = the deadline passed, 127 = could not start (F71 R8/R9)."""
    argv = split_command(cmd) if isinstance(cmd, str) else cmd
    try:
        p = subprocess.run(argv, cwd=cwd, text=True, capture_output=True, timeout=timeout)
        return p.returncode, (p.stdout + p.stderr).strip()
    except subprocess.TimeoutExpired as e:
        # UAT-377 (F209): what the command printed before the deadline is the only clue of where it stood; the last line stays the verdict
        part = "".join(x.decode(errors="replace") if isinstance(x, bytes) else x for x in (e.stdout, e.stderr) if x).strip()
        return 124, (part + "\n" if part else "") + f"estourou {timeout}s"
    except Exception as e:
        return 127, str(e)
