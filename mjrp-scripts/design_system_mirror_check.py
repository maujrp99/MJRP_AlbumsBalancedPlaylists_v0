#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
design_system_mirror_check.py - the design system in Claude is a mirror of `docs/specs/design-system.md`, never a source (F200, S-215).

The MJRP, 2026-11-06 21:48: every project, the harness and each child, has its design system in Claude (the Artifact type «Design System»).
The MJRPpersonal learned the rule the hard way (lesson A1 of its design lessons): an extraction from the code would have published a
retired theme, because the code had not followed the approved prototype yet. So the repository's document is the source and the published
system mirrors it, and this sensor is the judge (AGENTS.md: «o agente não é o juiz»). The owner skill (`mjrp-defining-design-systems`)
builds the mirror in a folder outside the repository (`<folder>/project/README.md`, `<folder>/project/tokens.json`, ... - the files the
publish sends) and runs this right before publishing; with any exit but 0, nothing is published. It judges:

  - the mirror has no `project/tokens.json` or no `project/README.md` ................................. 1
  - a color value of `tokens.json` (any theme; hex, or a function value) is not in the document ...... 1, naming the token
  - a font family (the first face of each `type.families` stack) is not in the document ............. 1, naming the family
  - the README does not name the document's path ....................................................... 1
  - the document differs from the one on `main` and the README does not declare the branch
    (`--declared-branch <name>`, and the name written in the README) ...................................... 1 (lesson A5: mirror from main)
  - the README names no commit whose document is the one being mirrored ................................ 1
  - the document is missing or outside git, the tokens do not parse, git gives no answer ................. 2 (NOT EVALUABLE)

The link line (`**Design system no Claude:** <url>`) is written into the document by the publish itself, so it is ignored when two versions
of the document are compared. A token alias (`"{other}"`) is not a value and is skipped; generic CSS families (serif, system-ui, ...) too.

Usage: python3 mjrp-scripts/design_system_mirror_check.py <design-system.md> <mirror folder> [--declared-branch NAME] [--main REF] [--quiet]
Exit: 0 passed | 1 diverges | 2 not evaluable.  Stdlib only (ADR-0015); vendored into every child with the kernel.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

SOURCE_NAME = "docs/specs/design-system.md"
LINK_LINE_WHOLE = re.compile(r"^.*\*\*Design system no Claude:\*\*.*(?:\n|$)", re.M)
HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
COMMIT = re.compile(r"\b[0-9a-f]{7,40}\b")
GENERIC_FACES = {"serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif",
                 "ui-monospace", "ui-rounded", "math", "emoji", "fangsong", "-apple-system", "blinkmacsystemfont"}


class NotEvaluable(Exception):
    pass


def norm_hex(h):
    """`#ABC` -> `#aabbcc`; `#AABBCCDD` stays 8 digits, lowercased."""
    h = h.lower()
    if len(h) in (4, 5):
        h = "#" + "".join(c * 2 for c in h[1:])
    return h


def without_link(text):
    return LINK_LINE_WHOLE.sub("", text)


def color_values(tokens):
    """(token name, value) for every color value of every theme."""
    for t in (tokens.get("color") or {}).get("tokens") or []:
        v = t.get("value")
        for val in (v.values() if isinstance(v, dict) else [v]):
            if isinstance(val, str):
                yield t.get("name", "?"), val.strip()


def first_faces(tokens):
    for key, stack in ((tokens.get("type") or {}).get("families") or {}).items():
        face = str(stack).split(",")[0].strip().strip("'\"")
        if face and face.lower() not in GENERIC_FACES:
            yield key, face


def content_problems(source_text, tokens, readme):
    """What diverges between the mirror's content and the document."""
    problems = []
    hexes = {norm_hex(h) for h in HEX.findall(source_text)}
    flat = re.sub(r"\s+", "", source_text.lower())
    for name, val in color_values(tokens):
        if val.startswith("{"):
            continue
        if HEX.fullmatch(val):
            if norm_hex(val) not in hexes:
                problems.append(f"a cor `{name}` = {val} não está no documento")
        elif re.sub(r"\s+", "", val.lower()) not in flat:
            problems.append(f"a cor `{name}` = {val} não está no documento")
    low = source_text.lower()
    for key, face in first_faces(tokens):
        if face.lower() not in low:
            problems.append(f"a família de fonte `{key}` ({face}) não está no documento")
    if SOURCE_NAME not in readme:
        problems.append(f"o README do espelho não aponta o documento de origem ({SOURCE_NAME})")
    return problems


def git(cwd, *args):
    try:
        p = subprocess.run(["git", "-C", str(cwd), *args], capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.TimeoutExpired) as e:
        raise NotEvaluable(f"git sem resposta ({e.__class__.__name__})")
    return p.returncode, p.stdout


def origin_problems(cwd, rel, source_text, readme, main, declared):
    """Lesson A5: the mirror is made from the document on main, or the README says which branch; and the README names the commit."""
    rc, on_main = git(cwd, "show", f"{main}:{rel}")
    if rc:
        raise NotEvaluable(f"`{main}` não tem {rel} (ou a ref não existe)")
    problems, current = [], without_link(source_text)
    if without_link(on_main) != current:
        if not declared:
            problems.append(f"o documento difere do da `{main}`: espelhe da `{main}`, ou declare o ramo (--declared-branch) e escreva-o no README")
        elif declared not in readme:
            problems.append(f"o ramo declarado ({declared}) não está escrito no README do espelho")
    for sha in COMMIT.findall(readme):
        rc, then = git(cwd, "show", f"{sha}:{rel}")
        if rc == 0 and without_link(then) == current:
            return problems
    return problems + ["o README do espelho não nomeia o commit do documento espelhado"]


def judge(source, mirror, declared=None, main="main"):
    """Returns the list of problems; raises NotEvaluable."""
    source, mirror = Path(source).resolve(), Path(mirror)
    if not source.is_file():
        raise NotEvaluable(f"{source} ausente: não há documento para espelhar")
    rc, top = git(source.parent, "rev-parse", "--show-toplevel")
    if rc:
        raise NotEvaluable("o documento está fora de um repositório git")
    rel = source.relative_to(Path(top.strip()).resolve()).as_posix()
    tok_path, readme_path = mirror / "project" / "tokens.json", mirror / "project" / "README.md"
    if not tok_path.is_file() or not readme_path.is_file():
        return [f"o espelho não tem project/tokens.json e project/README.md em {mirror}"]
    try:
        tokens = json.loads(tok_path.read_text(encoding="utf-8"))
    except ValueError as e:
        raise NotEvaluable(f"tokens.json ilegível ({e.__class__.__name__})")
    source_text, readme = source.read_text(encoding="utf-8"), readme_path.read_text(encoding="utf-8")
    return content_problems(source_text, tokens, readme) + origin_problems(source.parent, rel, source_text, readme, main, declared)


def main(argv=None):
    ap = argparse.ArgumentParser(description="o espelho do design system no Claude bate com o design-system.md (F200, S-215)")
    ap.add_argument("source", help="o docs/specs/design-system.md do projeto")
    ap.add_argument("mirror", help="a pasta do espelho (a que tem project/README.md e project/tokens.json)")
    ap.add_argument("--declared-branch", metavar="NAME", help="o documento vem deste ramo, e o README o diz")
    ap.add_argument("--main", default="main", metavar="REF")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    try:
        problems = judge(a.source, a.mirror, a.declared_branch, a.main)
    except NotEvaluable as e:
        print(f"design_system_mirror_check: não avaliável — {e}")
        return 2
    if problems:
        print(f"o espelho do design system no Claude diverge do documento ({len(problems)}) — não publique:")
        for p in problems:
            print(f"  {p}")
        return 1
    if not a.quiet:
        print("design_system_mirror_check: o espelho bate com o documento e veio da main (ou do ramo declarado)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
