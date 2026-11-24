#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
conflict_marker_check.py - a commit or a merge does not enter with a git conflict marker in a text file (F305, UAT-617).

The incident: on F304 the merge of `main` into the branch was committed with the marker blocks still in `uat.md` and in the `## Now` of the app; no
hook refused, and the session saw it only afterwards. The `uat-check` of the train reads one file, and only in the train.

It judges the INDEX, the lines the commit ADDS (the new side of `git diff --cached -U0`): a line that starts with seven `<` and a space (the open),
seven `>` and a space (the close), a `|||||||` + space (the diff3 base), or a lone run of seven `=` (the middle) INSIDE a block the open started.
A lone run of seven `=` outside a block is a Markdown setext heading and passes. An open with no close, and a close with no open, are findings too.
Binary files (a NUL in the first 8 KiB) are not read; the size of a text file never exempts it, and `--text` keeps a `-diff` in .gitattributes from hiding the lines. A line already in HEAD is not judged: only what this commit brings.

Usage: python3 mjrp-scripts/conflict_marker_check.py <root> --staged
Exit: 0 passed | 1 refused (file:line printed) | 2 not evaluable (git failed).  Stdlib only (ADR-0015).
"""
import re
import subprocess
import sys

OPEN = "<" * 7 + " "
CLOSE = ">" * 7 + " "
BASE = "|" * 7 + " "
MID = "=" * 7
HUNK_RE = re.compile(r"^@@ -\S+ \+(\d+)(?:,(\d+))? @@")


def git(root, *args, text=True):
    return subprocess.run(["git", "-C", str(root), "-c", "core.quotePath=false", *args], capture_output=True, text=text)


def added_lines(root, path):
    """The line numbers (1-based, in the index) the commit adds to `path`; None if git cannot say."""
    p = git(root, "diff", "--cached", "-U0", "--text", "--no-color", "--no-renames", "--", path)
    if p.returncode != 0:
        return None
    lines = set()
    for ln in p.stdout.splitlines():
        m = HUNK_RE.match(ln)
        if m:
            start = int(m.group(1))
            count = 1 if m.group(2) is None else int(m.group(2))
            lines.update(range(start, start + count))
    return lines


def findings_of(content, added):
    """[(line, what)] for the markers on added lines; `=======` only inside an open block."""
    out = []
    open_at = None
    for n, raw in enumerate(content.split("\n"), 1):
        line = raw.rstrip("\r")
        if line.startswith(OPEN):
            open_at = n
            if n in added:
                out.append((n, "abre bloco de conflito"))
        elif line.startswith(BASE) and open_at is not None:
            if n in added:
                out.append((n, "base (diff3) de conflito"))
        elif line.rstrip() == MID and open_at is not None:
            if n in added:
                out.append((n, "meio de conflito"))
        elif line.startswith(CLOSE):
            if n in added:
                out.append((n, "fecha bloco de conflito" if open_at is not None else "fecha bloco de conflito sem abrir"))
            open_at = None
    if open_at is not None and open_at in added and not any(w.startswith("fecha") for _, w in out):
        out.append((open_at, "bloco de conflito aberto e nunca fechado"))
    return out


def main(argv):
    if len(argv) < 3 or argv[2] != "--staged":
        print("usage: conflict_marker_check.py <root> --staged", file=sys.stderr)
        return 2
    root = argv[1]
    names = git(root, "diff", "--cached", "--name-only", "--diff-filter=AMR", "--no-renames", "-z")
    if names.returncode != 0:
        print(f"conflict_marker_check: git diff falhou: {names.stderr.strip()[:200]}", file=sys.stderr)
        return 2
    bad = []
    for path in [p for p in names.stdout.split("\0") if p]:
        blob = git(root, "show", f":{path}", text=False)
        if blob.returncode != 0:
            print(f"conflict_marker_check: não leu {path} do índice", file=sys.stderr)
            return 2
        data = blob.stdout
        if b"\0" in data[:8192]:
            continue
        added = added_lines(root, path)
        if added is None:
            return 2
        for n, what in findings_of(data.decode("utf-8", "replace"), added):
            bad.append(f"  {path}:{n}: {what}")
    if bad:
        print("conflict_marker_check: marcador de conflito do git no commit:")
        print("\n".join(bad))
        print("  Resolva o conflito (mantenha as duas intenções quando as duas valem) e tire os marcadores; o commit só passa sem eles.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
