#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
inventory_check.py - the lint of a folder inventory.

Mechanical counterpart of the `mjrp-inventorying-folders` skill: the skill judges (is the description
right? is the name good?), this script checks what needs no judgement - EVERY FILE OF THE CURRENT LEVEL IS IN THE
TABLE, AND EVERY TABLE ITEM STILL EXISTS. The ASCII tree sits in a fenced block and is ignored
here: the sensor reads the table's first column only. It is Karpathy's LLM Wiki `lint` applied to a folder.

    python3 mjrp-scripts/inventory_check.py docs/wiki
    python3 mjrp-scripts/inventory_check.py "docs/**"      (the folder and every folder under it)
    python3 mjrp-scripts/inventory_check.py --todas        (those declared under inventory: in the contract)
    python3 mjrp-scripts/inventory_check.py --root <project> docs/wiki      (judge another project: the folders are relative to it)

The project judged is a VALUE (F73 TASK-18, R12; DP-17 Context Object): `--root` on the command line, a `base_dir` in the functions.
There is no module-level ROOT_DIR, so a check on a child never reads the folders of whoever runs it. Without `--root` the project is
the repository these scripts live in.

A target ending in /** is a subtree: the folder itself plus every folder below it that HAS a
folder-index.md. A folder with none is skipped here rather than failed - a subtree can be mid-
sweep. The exception is the target named explicitly without /**: there, a missing folder-index IS
the answer (exit 2), because someone asked about that folder specifically.

The file is `folder-index.md`. The legacy `index.md` is still accepted, with a warning, so a
repository can migrate one folder at a time.

    0  folder-index up to date
    1  folder-index stale - an item is missing, or it points at something that does not exist
    2  not evaluable - the folder does not exist, or has no folder-index.md
"""
import re
import sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _git
from _context import Context, split_root_option

IGNORE_DIRS = {".DS_Store", "folder-index.md", "index.md", ".gitkeep"}
# The skill writes folder-index.md. `index.md` stays accepted as the LEGACY name so a repo mid-
# migration does not read as "never inventoried" (exit 2) - a sensor that goes red on a rename it
# was told about teaches people to ignore red. folder-index.md wins when both exist.
INDEX_NAMES = ("folder-index.md", "index.md")


def index_file(folder):
    """The folder's inventory file, current name first. None when there is none."""
    for nome in INDEX_NAMES:
        alvo = folder / nome
        if alvo.exists():
            return alvo
    return None
# Derived or retired: never descend into these when expanding a subtree. They are gitignored
# (`_backups/`, `dist/`, `mjrp-skills-packages/`, `.mjrp/`, `__pycache__/`) or the graveyard
# (`_archive/`) - indexing what is generated or retired is inventory of what nobody reads.
NEVER_DESCEND = {"_archive", "_backups", "dist", "mjrp-skills-packages", ".mjrp",
                 "__pycache__", ".git", "node_modules", ".claude"}
# An application bundle is a directory on disk but ONE item to the skill (see tree_ascii.py's
# BUNDLES) - listed and linked without a trailing slash, like a file. folder_items() has to agree,
# or a correctly-written row for it never matches what os.path sees.
BUNDLES = (".app", ".bundle", ".framework", ".pkg", ".xcodeproj")


def expand(rel, base_dir):
    """A target -> the list of folders to verify. `docs/**` is the subtree; `docs/` is just it.

    The target need not live under this repo at all - the skill (and this sensor) work on any
    folder, not just mjrp-harness's own tree. When the subtree root falls outside base_dir (an
    absolute path elsewhere on disk, e.g. a Downloads folder), paths are kept absolute instead of
    forced relative_to(base_dir), which would raise on every one of them.
    """
    rel = rel.strip()
    if not rel.endswith("**"):
        return [rel.rstrip("/") or "."]
    base = rel[:-2].rstrip("/") or "."
    root = (base_dir / base).resolve()
    if not root.is_dir():
        return [base]
    try:
        root.relative_to(base_dir)
        sob_root_dir = True
    except ValueError:
        sob_root_dir = False
    output = [base]
    for p in sorted(root.rglob("*")):
        if not p.is_dir():
            continue
        parts = (p.relative_to(base_dir) if sob_root_dir else p.relative_to(root)).parts
        if any(x in NEVER_DESCEND or x.startswith(".") for x in parts):
            continue
        if index_file(p):                             # only folders the skill gave an index
            output.append(str(p.relative_to(base_dir)) if sob_root_dir else str(p))
    return output


def folder_items(folder):
    """What the index is REQUIRED to carry. Derived and retired folders are not required: the
    index of a folder is an inventory of what was authored, and `__pycache__/` in the index of
    mjrp-scripts/ is noise that goes stale with the next build. They are still ALLOWED - the root
    index lists them marked DERIVADO, because whoever opens the root wants to know they exist.
    Required-but-not-allowed would force noise; allowed-but-not-required lets the skill decide."""
    output = set()
    for p in sorted(folder.iterdir()):
        if p.name.startswith(".") or p.name in IGNORE_DIRS or p.name in NEVER_DESCEND:
            continue
        eh_bundle = p.is_dir() and p.name.endswith(BUNDLES)
        output.add(p.name + ("/" if p.is_dir() and not eh_bundle else ""))
    return output


def index_items(indice):
    """Only the FIRST COLUMN of the table, and only what belongs to this folder.

    An index cites things from outside - ROADMAP.md, ../diagrams.md, the page that does not
    exist yet. That is navigation, not inventory: counting it as an item makes the sensor flag
    what is correct, and a sensor that flags the correct teaches people to ignore red.
    """
    t = indice.read_text(encoding="utf-8", errors="replace")
    output = set()
    for linha in t.splitlines():
        if not linha.lstrip().startswith("|"):
            continue
        celula = linha.split("|")[1].strip() if linha.count("|") >= 2 else ""
        if not celula or set(celula) <= set("-: "):
            continue
        # LINKED = a real, inventoried item. Backticks only = mentioned (planned, pending).
        # The distinction lives in the data itself: what does not exist has nowhere to link to.
        # Try the <...> form FIRST: a filename with a literal "(" (e.g. "...42 (1).jpeg") forces
        # that spelling, and inside <> the parenthesis is just a character, not the link's own
        # closing paren - matching "up to the first )" on that form truncates the target.
        m = re.search(r"\[[^\]]*\]\(<([^>]+)>\)", celula)
        if m:
            target = m.group(1).strip()
        else:
            m = re.search(r"\[[^\]]*\]\(([^)]+)\)", celula)
            if not m:
                continue
            target = m.group(1).strip()
        if target.startswith(("http", "#", "/")) or ".." in target:
            continue
        # A subfolder link points at ITS folder-index.md (or the legacy index.md) in subtree
        # mode ("docs/folder-index.md"), not at the folder path itself - normalize both spellings
        # back to the folder name so they compare equal to what folder_items() lists.
        for nome in INDEX_NAMES:
            sufixo = "/" + nome
            if target.endswith(sufixo):
                target = target[: -len(nome)]
                break
        output.add(target.rstrip("/") + ("/" if target.endswith("/") else ""))
    return output


PROSE_HEADER = re.compile(r"(\d+) itens? no nível corrente")
TREE_LINE = re.compile(r"^[├└]── (?P<nome>[^/\s][^/]*)/  · (?P<n>\d+) arquivos?\s*(?P<resto>\(.*\))?\s*$")
OPAQUE = NEVER_DESCEND | {"venv", ".venv"}


def list_files(p, base):
    """Recursive file list of a folder (paths relative to `base`, posix), with the border of tree_ascii.py: hidden
    names, folder-index.md and index.md are not counted; derived/retired folders and application bundles are not opened."""
    out = []
    for x in sorted(p.iterdir()):
        if x.name in IGNORE_DIRS or x.name.startswith("."):
            continue
        if x.is_file():
            out.append(x.relative_to(base).as_posix())
        elif x.is_dir() and x.name not in OPAQUE and not x.name.endswith(BUNDLES):
            out += list_files(x, base)
    return out


def visible_files(folder):
    """What the VCS sees in the folder (tracked + untracked, not ignored), posix paths relative to it; None when it cannot say."""
    code, out = _git.run_tuple(folder, "ls-files", "-co", "--exclude-standard", "-z")
    return set(out.split("\0")) if code == 0 else None


def linked_worktree(folder):
    """True in a linked worktree: it lacks the ignored files the main checkout carries, so the tree totals the
    skill wrote there cannot be reproduced here."""
    code, out = _git.run_tuple(folder, "rev-parse", "--path-format=absolute", "--git-dir", "--git-common-dir", timeout=30)
    d = out.split("\n")
    return code == 0 and len(d) >= 2 and d[0] != d[1]


def prose_gaps(folder, indice, n_items):
    """The numbers the index states in prose, which no table lookup sees: `N itens no nível corrente` in the header
    and the `· N arquivos` of each first-level folder of the tree. Only what the file states is judged (a header
    without the number is skipped). A folder drawn `(fora do inventário)` is skipped, and so is a folder holding files
    the VCS ignores: the skill counts what is on the disk of the checkout where it ran, so that total cannot be
    reproduced elsewhere (a linked worktree has no `node_modules/`, `data/raw/*.csv`... and is not judged at all) and
    judging it would only add noise."""
    text = indice.read_text(encoding="utf-8", errors="replace")
    gaps = []
    m = PROSE_HEADER.search(text)
    if m and int(m.group(1)) != n_items:
        gaps.append(f"o cabeçalho diz {m.group(1)} itens e o nível corrente tem {n_items}")
    bloco = re.search(r"## A árvore\n\n```\n(.*?)\n```", text, re.S)
    vis = None
    skip_tree = linked_worktree(folder)          # the tree totals are not judged in a linked worktree (see above)
    for linha in (bloco.group(1).splitlines() if bloco and not skip_tree else []):
        t = TREE_LINE.match(linha)
        if not t or t.group("resto"):
            continue
        alvo = folder / t.group("nome")
        if not alvo.is_dir():
            continue
        if vis is None:
            vis = visible_files(folder) or set()
        arquivos = list_files(alvo, folder)
        if vis and any(a not in vis for a in arquivos):
            continue
        if len(arquivos) != int(t.group("n")):
            gaps.append(f"a árvore diz {t.group('nome')}/ com {t.group('n')} arquivos e tem {len(arquivos)}")
    return gaps


def verify(rel, base_dir, emit=print):
    folder = (base_dir / rel).resolve()
    if not folder.is_dir():
        emit(rel, f"não é pasta — não avaliável")
        return 2
    indice = index_file(folder)
    if indice is None:
        emit(rel, "sem folder-index.md — rode a skill mjrp-inventorying-folders (não avaliável)")
        return 2
    if indice.name != INDEX_NAMES[0]:
        emit(rel, f"usa o nome antigo `{indice.name}` — renomeie para `folder-index.md`")

    no_disco, no_indice = folder_items(folder), index_items(indice)
    faltando = sorted(no_disco - no_indice)
    # an index item that does not exist: only flagged if the path belongs to this folder
    fantasma = sorted(n for n in no_indice - no_disco if not (folder / n.rstrip("/")).exists())
    # the header counts the rows of the table that exist, derived folders the table allows (`_archive/`) included
    prosa = prose_gaps(folder, indice, len(no_disco | (no_indice - set(fantasma))))

    if not faltando and not fantasma and not prosa:
        emit(rel, f"em dia · {len(no_disco)} item(ns)")
        return 0
    for f in faltando:
        emit(rel, f"no disco e fora do índice: {f}")
    for f in fantasma:
        emit(rel, f"no índice e fora do disco: {f}")
    for g in prosa:
        emit(rel, f"contagem em prosa velha: {g}")
    return 1


def findings(targets, base_dir):
    """For the doctor (W17): (exit code, [(folder, message)]) of the declared targets, 'em dia' lines left out."""
    achados = []

    def coleta(rel, msg):
        if not msg.startswith("em dia"):
            achados.append((rel, msg))
    piores = [verify(f, base_dir, coleta) for a in targets for f in expand(a, base_dir)]
    return (1 if 1 in piores else (2 if 2 in piores else 0)), achados


def _print(rel, msg):
    print(f"  [{rel}] {msg}")


def declared(ctx):
    contrato = ctx.root / ".mjrp-project.yml"
    if not contrato.exists():
        return []
    try:
        from _contract import read_yaml
        cfg = (read_yaml(contrato.read_text(encoding="utf-8")) or {}).get("mjrp_harness", {})
    except Exception:                                          # noqa: BLE001
        return []
    v = cfg.get("inventory") or []
    return v if isinstance(v, list) else []


def main(argv=None):
    try:
        root, args = split_root_option(sys.argv[1:] if argv is None else argv)
    except ValueError as exc:
        print(f"inventory_check: {exc} (exit 2)")
        return 2
    ctx = Context.for_project(root)
    if not ctx.root.is_dir():
        print(f"inventory_check: o projeto {ctx.root} não existe (exit 2)")
        return 2
    targets = args
    if not targets or targets == ["--todas"]:
        targets = declared(ctx)
        if not targets:
            print("inventory_check: nenhuma pasta declarada em `inventory:` no contrato (exit 2)")
            return 2
    alvos = [f for a in targets for f in expand(a, ctx.root)]
    piores = [verify(a, ctx.root, _print) for a in alvos]
    return 1 if 1 in piores else (2 if 2 in piores else 0)


if __name__ == "__main__":
    sys.exit(main())
