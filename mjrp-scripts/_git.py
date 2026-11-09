# cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_git.py - the one way the harness scripts ask git (F73 R4, audit 2026-10-25 R4/R9).

Before, 11 to 19 files each had their own wrapper, with returns of `int`, tuple or text, and most of them had no deadline:
a git stuck on a locked index (the device bridge leaves them) hung the hook that called it. Here there is ONE call:

  run(root, *args)        -> GitResult(code, out, err); raises GitError when git could not answer at all
                             (not installed, deadline passed) - an unanswered question is never an empty answer
  out(root, *args)        -> stdout, stripped; raises GitError on any non-zero exit (for callers that need the answer)
  run_tuple(root, *args)  -> (code, stdout) with the exit convention the old callers already read:
                             124 = the deadline passed, 127 = git could not start (kept so a caller migrates without
                             changing what it reads)
  toplevel(root)          -> Path of the working tree `root` belongs to, or None

Stdlib only: the scripts that import this travel to the child projects (new_project.VENDORED_FILES).
"""
import os
import subprocess
from pathlib import Path
from typing import NamedTuple

TIMEOUT = 60   # seconds; a local read. Pass `timeout=` for push/fetch/gc.


class GitError(RuntimeError):
    """git could not answer: not installed, or the deadline passed. A non-zero exit is NOT this - it is a GitResult."""


class GitTimeout(GitError):
    """The deadline passed."""


class GitNotRun(GitError):
    """git could not start (not installed, not executable)."""


class GitResult(NamedTuple):
    code: int
    out: str
    err: str

    @property
    def ok(self):
        return self.code == 0

    # CompletedProcess-shaped aliases, so a caller that read `r.returncode` / `r.stdout` migrates without a rewrite
    returncode = property(lambda self: self.code)
    stdout = property(lambda self: self.out)
    stderr = property(lambda self: self.err)


def run(root, *args, timeout=TIMEOUT, env=None, text=True, input=None):
    """Runs `git <args>` in `root` (cwd) and returns a GitResult. Raises GitError when git cannot answer.
    `text=False` returns the output as bytes (a blob compared byte for byte); `input` is fed to stdin."""
    kw = dict(text=True, encoding="utf-8", errors="surrogateescape") if text else {}
    try:
        p = subprocess.run(["git", *args], cwd=str(root) if root is not None else None, capture_output=True,
                           timeout=timeout, env=dict(os.environ, **env) if env else None, input=input, **kw)
    except subprocess.TimeoutExpired as e:
        raise GitTimeout(f"git {' '.join(args)}: não respondeu em {timeout}s") from e
    except OSError as e:
        raise GitNotRun(f"git {' '.join(args)}: não pôde rodar ({e})") from e
    return GitResult(p.returncode, p.stdout, p.stderr)


def out(root, *args, timeout=TIMEOUT, env=None):
    """stdout, stripped. Any non-zero exit raises GitError carrying git's own message."""
    r = run(root, *args, timeout=timeout, env=env)
    if r.code != 0:
        raise GitError(f"git {' '.join(args)}: {r.err.strip() or r.out.strip()}")
    return r.out.strip()


def run_tuple(root, *args, timeout=TIMEOUT, env=None, strip=False):
    """(code, stdout) - 124 when the deadline passed, 127 when git could not start; the convention of the old wrappers.
    `strip=True` strips the output (the doctor's reads); leave it off where the first column of the output matters."""
    try:
        r = run(root, *args, timeout=timeout, env=env)
    except GitTimeout:
        return 124, ""
    except GitError:                       # GitNotRun
        return 127, ""
    return r.code, (r.out.strip() if strip else r.out)


def text(root, *args, timeout=TIMEOUT):
    """stdout (stripped) when git answered with exit 0; None when it answered with a non-zero exit ("there is no such thing");
    RAISES GitError when it did not answer at all (deadline, not installed). Use this where "git did not answer" must not read
    as "nothing there" (F73 critique IV-08)."""
    r = run(root, *args, timeout=timeout)
    return r.out.strip() if r.code == 0 else None


def text_or_none(root, *args, timeout=TIMEOUT):
    """stdout (stripped) when git answered with exit 0, else None - for the reads where "no answer" and "no such thing" are
    the same to the caller (a fallback label, a best-effort path). Never raises. When they are NOT the same, use `text`."""
    try:
        r = run(root, *args, timeout=timeout)
    except GitError:
        return None
    return r.out.strip() if r.code == 0 else None


def toplevel(root):
    """The working tree git says `root` belongs to (an ancestor's `.git` counts: a nested project is under git), or None."""
    try:
        r = run(root, "rev-parse", "--show-toplevel")
    except GitError:
        return None
    first = r.out.strip().splitlines()
    return Path(first[0].strip()) if r.code == 0 and first else None
