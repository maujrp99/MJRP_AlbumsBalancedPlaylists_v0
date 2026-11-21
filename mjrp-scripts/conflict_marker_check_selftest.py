#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""conflict_marker_check_selftest.py - proves the gate of F305 (UAT-617) with the REAL pre-commit and pre-merge-commit hooks on throwaway repositories
in $TMPDIR: a staged file with an open/middle/close block is refused with file and line; a setext `=======` heading passes; markers already in HEAD are
not judged; a binary passes; the open with no close and the close with no open are findings; the merge hook refuses a merge that brings the block. Without
the gate every refusal case would pass. Exit 0 ok, 1 failed."""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
GATE = HERE / "conflict_marker_check.py"
ENV = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t", "GIT_CONFIG_GLOBAL": os.devnull}
O, M, C = "<" * 7 + " ours", "=" * 7, ">" * 7 + " theirs"
fails = 0


def check(name, ok, detail=""):
    global fails
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else f"  -> {str(detail)[:300]}"))
    fails += 0 if ok else 1


def git(root, *a):
    return subprocess.run(["git", "-C", str(root), *a], capture_output=True, text=True, env=ENV)


def put(root, rel, text, binary=False):
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(text) if binary else p.write_text(text, encoding="utf-8")
    git(root, "add", rel)


def gate(root):
    return subprocess.run([sys.executable, str(GATE), str(root), "--staged"], capture_output=True, text=True, env=ENV)


def fresh(tmp, name):
    root = Path(tmp) / name
    root.mkdir()
    git(root, "init", "-q", "-b", "main")
    (root / "base.md").write_text("base\n")
    git(root, "add", "base.md")
    git(root, "commit", "-q", "-m", "base")
    return root


def main():
    with tempfile.TemporaryDirectory() as tmp:
        r = fresh(tmp, "a")
        put(r, "x.md", f"a\n{O}\nmine\n{M}\ntheirs\n{C}\nb\n")
        g = gate(r)
        check("a block in a staged file is refused, with file and line", g.returncode == 1 and "x.md:2" in g.stdout and "x.md:4" in g.stdout and "x.md:6" in g.stdout, g.stdout + g.stderr)
        git(r, "reset", "-q")
        put(r, "t.md", f"Title\n{M}\n\ntext\n")
        check("a setext heading with the run of equals passes", gate(r).returncode == 0, gate(r).stdout)
        put(r, "y.md", f"{O}\nmine\n")
        g = gate(r)
        check("an open with no close is refused", g.returncode == 1 and "y.md:1" in g.stdout, g.stdout)
        git(r, "reset", "-q")
        put(r, "z.md", f"fine\n{C}\n")
        g = gate(r)
        check("a close with no open is refused", g.returncode == 1 and "z.md:2" in g.stdout, g.stdout)
        git(r, "reset", "-q")
        put(r, "bin.dat", b"\0\0" + (O + "\n").encode(), binary=True)
        check("a binary file is not read", gate(r).returncode == 0)
        git(r, "reset", "-q")
        put(r, "ind.md", f"    {O}\n  {M}\n")
        check("an indented marker (a quoted example) passes", gate(r).returncode == 0)
        git(r, "reset", "-q")
        # markers already in HEAD are not judged; only the lines the commit adds
        put(r, "old.md", f"{O}\nm\n{M}\nt\n{C}\n")
        git(r, "-c", "core.hooksPath=/dev/null", "commit", "-q", "-m", "old")
        put(r, "old.md", f"{O}\nm\n{M}\nt\n{C}\nmore\n")
        check("a marker already in HEAD is not judged again", gate(r).returncode == 0, gate(r).stdout)
        put(r, "big.md", "x" * 4_500_000 + f"\n{O}\nm\n{M}\nt\n{C}\n")
        check("a text file over 4 MB is still judged", gate(r).returncode == 1)
        git(r, "reset", "-q")
        (r / ".gitattributes").write_text("*.md -diff\n")
        put(r, "attr.md", f"{O}\nm\n{M}\nt\n{C}\n")
        check("a `-diff` attribute does not hide the block", gate(r).returncode == 1)
        git(r, "reset", "-q")
        (r / ".gitattributes").unlink()
        # the real hooks: pre-commit and pre-merge-commit
        r2 = fresh(tmp, "b")
        for h in ("pre-commit", "pre-merge-commit", "commit-msg"):
            (r2 / ".h").mkdir(exist_ok=True)
        (r2 / "mjrp-scripts").mkdir()
        shutil.copy(GATE, r2 / "mjrp-scripts" / GATE.name)
        shutil.copy(HERE / "hooks" / "pre-commit", r2 / ".h" / "pre-commit")
        shutil.copy(HERE / "hooks" / "pre-merge-commit", r2 / ".h" / "pre-merge-commit")
        git(r2, "config", "core.hooksPath", ".h")
        git(r2, "add", "-A")
        git(r2, "-c", "core.hooksPath=/dev/null", "commit", "-q", "-m", "scaffold")
        put(r2, "k.md", f"{O}\nm\n{M}\nt\n{C}\n")
        c = git(r2, "commit", "-m", "x")
        check("the real pre-commit refuses the block", c.returncode != 0 and "k.md:1" in (c.stdout + c.stderr), c.stdout + c.stderr)
        git(r2, "reset", "-q", "--hard")
        git(r2, "checkout", "-q", "-b", "side")
        put(r2, "k.md", f"{O}\nm\n{M}\nt\n{C}\n")
        git(r2, "-c", "core.hooksPath=/dev/null", "commit", "-q", "-m", "side")
        git(r2, "checkout", "-q", "main")
        put(r2, "other.md", "o\n")
        git(r2, "-c", "core.hooksPath=/dev/null", "commit", "-q", "-m", "main moves")
        m = git(r2, "merge", "--no-ff", "-m", "merge", "side")
        check("the real pre-merge-commit refuses a merge that brings the block", m.returncode != 0 and "k.md" in (m.stdout + m.stderr), m.stdout + m.stderr)
    print("conflict_marker_check_selftest: " + ("todos os casos passaram" if not fails else f"{fails} caso(s) falharam"))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
