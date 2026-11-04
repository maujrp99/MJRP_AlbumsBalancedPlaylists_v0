#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
structure_check.py - the structure-by-nature sensor (ADR-0014, EP-09).

Reads the single declaration, mjrp-scripts/structure_rules.json, and checks one project (or
all of them) against it:

  A. docs/ is MEMORY only - every direct child of docs/ is allowed for the project's profile
  B. inside docs/ - retired files (DEBUG_LOG), data files, agent output named as such
  C. the project root - a folder whose NAME says its nature (prototypes/, audits/...) outside home
  D. reports/, design/, data/ - only the declared subfolders
  E. profile meta - tree.py --check (every 1st/2nd level item has a declared purpose)

Every finding says where the item should live; moving is the human's call (nothing moves alone).

    python3 mjrp-scripts/structure_check.py [path]            one project (default: .)
    python3 mjrp-scripts/structure_check.py --all-projects    the harness, its apps/ and its siblings
    python3 mjrp-scripts/structure_check.py [path] --staged   only what the current commit adds (pre-commit)
    python3 mjrp-scripts/structure_check.py [path] --json

Exit: 0 conforming · 1 findings · 2 not evaluable (no contract, unknown profile).
Born from: 2026-09-05 (28 files moved folder, no sensor noticed) and 2026-09-26 (fin-control's
docs/ with 16 entries of four natures - each skill chose its own destination).
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import _git

HERE = Path(__file__).resolve().parent
RULES_FILE = HERE / "structure_rules.json"
CONTRACT = ".mjrp-project.yml"
IGNORE = {".git", "node_modules", "__pycache__", ".DS_Store"}
CHECK_ID = "W9"


def load_rules(path=RULES_FILE):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def read_profile(root):
    contract = root / CONTRACT
    if not contract.exists():
        return None
    m = re.search(r"^\s*profile:\s*([\w-]+)", contract.read_text(encoding="utf-8"), re.M)
    return m.group(1) if m else None


def _finding(path, msg, to=None):
    return {"path": path, "msg": msg, "to": to}


def _legacy_copy(rel_docs, rules):
    """F128: the original SDD files of a legacy sprint, copied verbatim into its feature (`specs/features/Fxx-slug/legacy/`): their names
    are the sprint author's, not an agent's output, and a rename would rewrite the record."""
    return any(re.match(rx, rel_docs) for rx in rules.get("skip_inside_docs_patterns", []))


def _suggest(name, rules, profile):
    """Where a misplaced item should go, from its name or extension - or None if unclear."""
    low = name.lower()
    # 2026-10-09 (MJRP): a requirement file is `<ID>-<slug>.md`; its slug is the English title, which may say
    # "prototype" or "handoff" about the subject - never about the file's nature
    if any(re.search(rx, low) for rx in rules.get("name_patterns_exempt", [])):
        return None
    for pat in rules["name_patterns"]:
        if re.search(pat["regex"], low):
            return pat["to"]
    ext = Path(low).suffix
    if ext in rules["data_extensions"]:
        return "data/raw"
    if ext in rules["visual_extensions"]:
        return "design/prototypes (protótipo) ou reports/presentations (deck/relatório)"
    return None


def _alias(aliases, low, profile):
    """Destination of a folder whose name says its nature - may depend on the profile; None = at home."""
    to = aliases.get(low)
    if isinstance(to, dict):
        to = to.get(profile)
    return to


def _screenshot_note(low, rules):
    """A folder named for images says nothing about its nature - point to the screenshot rule."""
    shots = rules.get("screenshots") or {}
    if low in shots.get("folder_names", []):
        return f"pasta de imagem sem natureza — {shots['rule']}"
    return None


def _sdd_note(parts_under_docs, rules):
    """spec/plan/tasks.md where no agent looks for them. Since S-63 (2026-10-04) each feature has its folder,
    docs/specs/features/Fxx-slug/; docs/specs/milestones/<id>/ is the frozen history; flat files in docs/specs/ are
    the previous model, accepted until the project's refresh. Anything else - another subfolder, a feature folder off
    the Fxx-slug pattern - is where the next session would not find the spec."""
    sdd = rules.get("sdd") or {}
    p = list(parts_under_docs)
    if len(p) <= 2 or p[0] != "specs" or p[-1].lower() not in sdd.get("files", []):
        return None
    if p[1] == sdd.get("history_dir"):
        return None
    if p[1] == sdd.get("features_dir") and len(p) == 4 and re.match(sdd.get("feature_pattern", "^$"), p[2]):
        return None
    return f"spec/plan/tasks fora da pasta da feature — {sdd['rule']}"


def _fix_hint(rel, to, is_dir):
    """The exact command to heal (git keeps the history; the human runs it or approves it)."""
    if not to or " " in to:
        return ""
    rel = rel.rstrip("/")
    if is_dir:
        parent = to.rsplit("/", 1)[0] if "/" in to else ""
        mk = f"mkdir -p {parent} && " if parent else ""
        return f" · sarar: {mk}git mv {rel} {to}"
    return f" · sarar: mkdir -p {to} && git mv {rel} {to}/"


def _check_docs(root, rules, prof, profile, out):
    docs = root / "docs"
    if not docs.is_dir():
        return
    tolerated = set(rules["tolerated_in_every_folder"])
    allowed = set(prof["docs_allowed"])
    retired_files = rules["retired_files"]
    retired_folders = rules["retired_folders"]
    aliases = rules["folder_aliases"]
    skip = [s.rstrip("/") for s in rules["skip_inside_docs"]]
    # A. direct children of docs/
    for e in sorted(docs.iterdir()):
        name, low = e.name, e.name.lower()
        if name in IGNORE or name in tolerated or name.startswith(".") or name in allowed:
            continue
        rel = f"docs/{name}" + ("/" if e.is_dir() else "")
        if low in retired_files:
            out.append(_finding(rel, retired_files[low]))
        elif e.is_dir() and low in retired_folders:
            out.append(_finding(rel, retired_folders[low]))
        elif e.is_dir() and _alias(aliases, low, profile):
            to = _alias(aliases, low, profile)
            out.append(_finding(rel, f"fora da natureza de docs/ (MEMÓRIA) → {to}/" + _fix_hint(rel, to, True), to))
        else:
            to = _suggest(name, rules, profile)
            if to:
                dest = f" → {to}" + ("" if " " in to else "/") + _fix_hint(rel, to, e.is_dir())
            elif e.is_dir() and _screenshot_note(low, rules):
                dest = " — " + _screenshot_note(low, rules)
            else:
                dest = " — decida a natureza (regra de bolso no structure_rules.json)"
            out.append(_finding(rel, f"fora da natureza de docs/ (MEMÓRIA){dest}", to))
    # B. inside the allowed subtrees of docs/
    flagged_dirs = []
    for p in sorted(docs.rglob("*")):
        rel_docs = p.relative_to(docs).as_posix()
        top = rel_docs.split("/")[0]
        if top not in allowed:
            continue                                       # already reported by A
        if any(part in IGNORE for part in p.parts):
            continue
        if any(rel_docs == s or rel_docs.startswith(s + "/") for s in skip) or _legacy_copy(rel_docs, rules):
            continue
        if any(rel_docs.startswith(f + "/") for f in flagged_dirs):
            continue
        rel = f"docs/{rel_docs}"
        low = p.name.lower()
        if top == "originals":                             # originals keeps its own shape: only DATA leaves it (ADR-0016)
            if p.is_file() and p.suffix.lower() in rules["data_extensions"]:
                out.append(_finding(rel, "dado dentro de docs/ (MEMÓRIA) → data/raw/ (ou data/fixtures/ se os testes leem)", "data/raw"))
            continue
        if p.is_dir():
            if "/" not in rel_docs:
                continue                                   # the allowed top folders themselves
            if low in retired_folders:
                out.append(_finding(rel + "/", retired_folders[low]))
                flagged_dirs.append(rel_docs)
            elif _alias(aliases, low, profile):
                to = _alias(aliases, low, profile)
                out.append(_finding(rel + "/", f"fora da natureza de docs/ (MEMÓRIA) → {to}/" + _fix_hint(rel, to, True), to))
                flagged_dirs.append(rel_docs)
            continue
        if _sdd_note(rel_docs.split("/"), rules):
            out.append(_finding(rel, _sdd_note(rel_docs.split("/"), rules)))
            continue
        if low in retired_files:
            out.append(_finding(rel, retired_files[low]))
            continue
        ext = p.suffix.lower()
        if ext in rules["data_extensions"]:
            out.append(_finding(rel, "dado dentro de docs/ (MEMÓRIA) → data/raw/ (ou data/fixtures/ se os testes leem)", "data/raw"))
            continue
        in_scope = any(rel_docs.startswith(s.replace("docs/", "", 1) + "/") for s in rules["name_patterns_scope"])
        if in_scope:
            to = _suggest(p.name, rules, profile)
            if to:
                out.append(_finding(rel, f"saída de agente dentro da especificação → {to}" + ("" if " " in to else "/")
                                    + _fix_hint(rel, to, False), to))


def _name_decides(rel, rules):
    """The destination a file's NAME imposes (e.g. *-proposal.html -> design/proposals), or None when
    the name decides nothing or the file is already there. Only for loose files at the root and inside
    the declared artifact roots (design/, reports/) - code folders are never judged by name."""
    nd = rules.get("name_decides")
    if not nd:
        return None
    parts = Path(rel).parts
    if len(parts) > 1 and parts[0] not in nd.get("scope_roots", []):
        return None
    low = parts[-1].lower()
    folder = "/".join(parts[:-1])
    for pat in nd["patterns"]:
        if re.search(pat["regex"], Path(low).stem) and not (folder == pat["to"] or folder.startswith(pat["to"] + "/")):
            return pat["to"]
    return None


def _check_root(root, rules, prof, out):
    aliases = rules["folder_aliases"]
    for e in sorted(root.iterdir()):
        low = e.name.lower()
        to = _alias(aliases, low, None) if e.is_dir() and e.name not in prof["roots"] else None
        if to and isinstance(aliases.get(low), str):
            out.append(_finding(e.name + "/", f"pasta com nome de natureza fora de casa → {to}/" + _fix_hint(e.name, to, True), to))
        elif e.is_dir() and e.name not in prof["roots"] and _screenshot_note(low, rules):
            out.append(_finding(e.name + "/", _screenshot_note(low, rules)))
        elif e.is_file() and low in rules["retired_files"]:
            out.append(_finding(e.name, rules["retired_files"][low]))
        elif e.is_file() and _name_decides(e.name, rules):
            to = _name_decides(e.name, rules)
            out.append(_finding(e.name, f"o nome diz a natureza → {to}/", to))


def _check_subfolders(root, rules, out):
    tolerated = set(rules["tolerated_in_every_folder"])
    for top, subs in rules["subfolders"].items():
        base = root / top
        if not base.is_dir():
            continue
        for e in sorted(base.iterdir()):
            if e.name in tolerated or e.name.startswith(".") or e.name in IGNORE:
                continue
            if e.is_dir() and e.name not in subs and _screenshot_note(e.name.lower(), rules):
                out.append(_finding(f"{top}/{e.name}/", _screenshot_note(e.name.lower(), rules)))
            elif e.is_dir() and e.name not in subs:
                out.append(_finding(f"{top}/{e.name}/", f"subpasta não declarada em {top}/ ({rules['natures'][top]}) — "
                                    f"as declaradas: {', '.join(subs)}; nova subpasta entra no structure_rules.json do harness"))
            elif e.is_file():
                out.append(_finding(f"{top}/{e.name}", f"arquivo solto em {top}/ — vai numa das subpastas: {', '.join(subs)}"))
            elif e.is_dir() and e.name in subs:
                for f in sorted(e.rglob("*")):
                    if f.is_file() and not any(x.startswith(".") or x in IGNORE for x in f.relative_to(root).parts):
                        rel = f.relative_to(root).as_posix()
                        to = _name_decides(rel, rules)
                        if to:
                            out.append(_finding(rel, f"o nome diz a natureza → {to}/", to))


def _diagram_theme_note(parts, rules):
    """What is wrong with a path under design/diagrams/ (the declared diagram_themes), or None.
    A diagram lives in a theme folder: design/diagrams/<theme>/AAAA-MM-DD-HHMM-<name>.(png|svg), or in its epic's
    subfolder inside the theme: design/diagrams/<theme>/ep-NN/<same name>."""
    dt = rules.get("diagram_themes")
    if not dt:
        return None
    root = Path(dt["root"]).parts
    parts = tuple(parts)
    if parts[:len(root)] != root or len(parts) <= len(root):
        return None
    rest = parts[len(root):]
    themes = dt["themes"]
    tolerated = set(rules["tolerated_in_every_folder"])
    if len(rest) == 1:
        if rest[0] in tolerated or rest[0].startswith(".") or rest[0] in IGNORE:
            return None
        return f"diagrama solto em {dt['root']}/ — vai num tema: {', '.join(themes)} (o render_diagram.js --theme gera o caminho)"
    if rest[0] not in themes:
        return (f"tema de diagrama não declarado em {dt['root']}/ — os declarados: {', '.join(themes)}; "
                f"tema novo entra no structure_rules.json do harness, com o OK do MJRP")
    epic = dt.get("epic_subfolder_regex")
    if len(rest) > 2 and epic and re.match(epic, rest[1]):
        rest = (rest[0],) + rest[2:]          # design/diagrams/<theme>/ep-NN/<file>: the epic's subfolder (2026-10-09)
    if len(rest) > 2:
        return "um tema aceita só a subpasta do épico (ep-NN), nenhuma outra"
    if rest[1] in tolerated or rest[1].startswith(".") or rest[1] in IGNORE:
        return None
    if not re.match(dt["name_regex"], rest[1]):
        return "nome fora do padrão AAAA-MM-DD-HHMM-<name>.(png|svg) — o render_diagram.js gera o nome certo"
    return None


def _check_diagram_themes(root, rules, out):
    dt = rules.get("diagram_themes")
    if not dt:
        return
    base = root / dt["root"]
    if not base.is_dir():
        return
    reported = set()
    for f in sorted(base.rglob("*")):
        rel = f.relative_to(root)
        if any(x.startswith(".") or x in IGNORE for x in rel.parts[len(Path(dt["root"]).parts):]):
            continue
        if f.is_dir():
            continue
        note = _diagram_theme_note(rel.parts, rules)
        if not note:
            continue
        first = rel.parts[len(Path(dt["root"]).parts)]
        if len(rel.parts) > len(Path(dt["root"]).parts) + 1 and first not in dt["themes"]:
            if first in reported:
                continue
            reported.add(first)
            out.append(_finding(f"{dt['root']}/{first}/", note))
        else:
            out.append(_finding(rel.as_posix(), note))


def _wireframe_note(parts, rules):
    """What is wrong with a path under design/wireframes/ (the declared wireframes block), or None.
    A wireframe lives flat in the folder: design/wireframes/<name>-vN-<screen>.(png|svg)."""
    wf = rules.get("wireframes")
    if not wf:
        return None
    root = Path(wf["root"]).parts
    parts = tuple(parts)
    if parts[:len(root)] != root or len(parts) <= len(root):
        return None
    rest = parts[len(root):]
    tolerated = set(rules["tolerated_in_every_folder"])
    if len(rest) > 1:
        return f"{wf['root']}/ é uma pasta só, sem subpastas — a tela e a versão vão no nome: <name>-vN-<screen>.(png|svg)"
    if rest[0] in tolerated or rest[0].startswith(".") or rest[0] in IGNORE:
        return None
    if not re.match(wf["name_regex"], rest[0]):
        return "nome fora do padrão <name>-vN-<screen>.(png|svg) — ex.: control-center-v3.3-overview.png"
    return None


def _check_wireframes(root, rules, out):
    wf = rules.get("wireframes")
    if not wf:
        return
    base = root / wf["root"]
    if not base.is_dir():
        return
    for f in sorted(base.rglob("*")):
        rel = f.relative_to(root)
        if f.is_dir() or any(x.startswith(".") or x in IGNORE for x in rel.parts[len(Path(wf["root"]).parts):]):
            continue
        note = _wireframe_note(rel.parts, rules)
        if note:
            out.append(_finding(rel.as_posix(), note))


def _kernel_theme_note(parts, rules):
    """What is wrong with a FILE path under docs/wiki/kernel/ (the declared kernel_themes), or None."""
    kt = rules.get("kernel_themes")
    if not kt:
        return None
    root = Path(kt["root"]).parts
    parts = tuple(parts)
    if parts[:len(root)] != root or len(parts) <= len(root):
        return None
    rest = parts[len(root):]
    if any(x.startswith(".") or x in IGNORE for x in rest):
        return None
    allowed = set(kt["root_files"]) | set(rules["tolerated_in_every_folder"])
    themes = kt["themes"]
    if len(rest) == 1:
        return None if rest[0] in allowed else f"página solta na raiz do kernel — vai num tema: {', '.join(themes)}"
    if rest[0] not in themes:
        return (f"tema do kernel não declarado — os declarados: {', '.join(themes)}; "
                "tema novo entra no structure_rules.json do harness, com o OK do MJRP")
    if len(rest) > 2:
        return "um tema do kernel é uma pasta só, sem subpastas"
    return None


def _check_kernel_themes(root, rules, out):
    """The kernel source (only the harness has docs/wiki/kernel/) lives in theme folders:
    docs/wiki/kernel/<theme>/<page>.md; at its root, only the glossary and the indexes."""
    kt = rules.get("kernel_themes")
    if not kt:
        return
    base = root / kt["root"]
    if not base.is_dir():
        return
    allowed = set(kt["root_files"]) | set(rules["tolerated_in_every_folder"])
    themes = kt["themes"]
    for e in sorted(base.iterdir()):
        if e.name.startswith(".") or e.name in IGNORE:
            continue
        rel = e.relative_to(root).as_posix()
        if e.is_file() and e.name not in allowed:
            out.append(_finding(rel, f"página solta na raiz do kernel — vai num tema: {', '.join(themes)}"))
        elif e.is_dir() and e.name not in themes:
            out.append(_finding(rel + "/", f"tema do kernel não declarado — os declarados: {', '.join(themes)}; "
                                           "tema novo entra no structure_rules.json do harness, com o OK do MJRP"))
        elif e.is_dir():
            for f in sorted(e.rglob("*")):
                if f.is_dir() and not f.name.startswith("."):
                    out.append(_finding(f.relative_to(root).as_posix() + "/", "um tema do kernel é uma pasta só, sem subpastas"))


def _check_tree(root, out):
    tree = root / "mjrp-scripts" / "tree.py"
    if not (tree.exists() and (root / "mjrp-scripts" / "structure.yml").exists()):
        return
    r = subprocess.run([sys.executable, str(tree), "--check"], cwd=root, capture_output=True, text=True, timeout=60)
    for line in r.stdout.splitlines():
        line = line.strip()
        if line.startswith("[?]"):
            out.append(_finding("STRUCTURE.md", "tree.py: " + line[3:].strip()))


def check(root, rules=None):
    """Returns (profile, findings) - profile None means not evaluable."""
    rules = rules or load_rules()
    root = Path(root).resolve()
    profile = read_profile(root)
    if profile not in rules["profiles"]:
        return None, []
    prof = rules["profiles"][profile]
    out = []
    _check_docs(root, rules, prof, profile, out)
    _check_root(root, rules, prof, out)
    _check_subfolders(root, rules, out)
    _check_diagram_themes(root, rules, out)
    _check_wireframes(root, rules, out)
    _check_kernel_themes(root, rules, out)
    if profile == "meta":
        _check_tree(root, out)
    return profile, out


def staged_paths(root):
    code, out = _git.run_tuple(root, "diff", "--cached", "--name-only", "--diff-filter=AR")
    return [l.strip() for l in out.splitlines() if l.strip()] if code == 0 else []


def judge_path(root, rel, rules=None):
    """Judge ONE prospective path (a file about to be created) - the same rules as check(), for
    the PreToolUse hook. Returns a finding dict, or None when the path is at home (or unknowable)."""
    rules = rules or load_rules()
    profile = read_profile(Path(root))
    if profile not in rules["profiles"]:
        return None
    prof = rules["profiles"][profile]
    parts = Path(rel).parts
    if not parts:
        return None
    low_name = parts[-1].lower()
    tolerated = set(rules["tolerated_in_every_folder"])
    aliases = rules["folder_aliases"]
    if low_name in rules["retired_files"]:
        return _finding(rel, rules["retired_files"][low_name])
    kn = _kernel_theme_note(parts, rules)
    if kn:
        return _finding(rel, kn)
    top = parts[0]
    if top == "docs" and len(parts) >= 2:
        first = parts[1]
        if first in tolerated and len(parts) == 2:
            return None
        if first not in prof["docs_allowed"]:
            low = first.lower()
            if len(parts) > 2 and low in rules["retired_folders"]:
                return _finding(rel, rules["retired_folders"][low])
            to = _alias(aliases, low, profile) if len(parts) > 2 else None
            to = to or _suggest(parts[-1], rules, profile)
            if to:
                dest = f" → {to}"
            elif len(parts) > 2 and _screenshot_note(low, rules):
                dest = " — " + _screenshot_note(low, rules)
            else:
                dest = " — decida a natureza (regra de bolso no structure_rules.json)"
            return _finding(rel, f"fora da natureza de docs/ (MEMÓRIA){dest}", to)
        inner = "/".join(parts[1:])
        if any(inner == sk or inner.startswith(sk + "/") for sk in rules["skip_inside_docs"]) or _legacy_copy(inner, rules):
            return None
        if _sdd_note(parts[1:], rules):
            return _finding(rel, _sdd_note(parts[1:], rules))
        if first == "originals":                           # originals keeps its own shape: only DATA leaves it (ADR-0016)
            if Path(low_name).suffix in rules["data_extensions"]:
                return _finding(rel, "dado dentro de docs/ (MEMÓRIA) → data/raw/ (ou data/fixtures/ se os testes leem)", "data/raw")
            return None
        for d in parts[2:-1]:
            dl = d.lower()
            if dl in rules["retired_folders"]:
                return _finding(rel, rules["retired_folders"][dl])
            if _alias(aliases, dl, profile):
                return _finding(rel, f"fora da natureza de docs/ (MEMÓRIA) → {_alias(aliases, dl, profile)}/",
                                _alias(aliases, dl, profile))
        if Path(low_name).suffix in rules["data_extensions"]:
            return _finding(rel, "dado dentro de docs/ (MEMÓRIA) → data/raw/ (ou data/fixtures/ se os testes leem)", "data/raw")
        if any(("/".join(parts[:-1]) + "/").startswith(sc.rstrip("/") + "/") for sc in rules["name_patterns_scope"]):
            to = _suggest(parts[-1], rules, profile)
            if to:
                return _finding(rel, f"saída de agente dentro da especificação → {to}", to)
        return None
    if len(parts) >= 2 and top.lower() in aliases and top not in prof["roots"] and isinstance(aliases.get(top.lower()), str):
        to = aliases[top.lower()]
        return _finding(rel, f"pasta com nome de natureza fora de casa → {to}/", to)
    if len(parts) >= 2 and top not in prof["roots"] and _screenshot_note(top.lower(), rules):
        return _finding(rel, _screenshot_note(top.lower(), rules))
    if top in rules["subfolders"]:
        subs = rules["subfolders"][top]
        if len(parts) >= 3 and parts[1] not in subs and _screenshot_note(parts[1].lower(), rules):
            return _finding(rel, _screenshot_note(parts[1].lower(), rules))
        if len(parts) == 2 and parts[1] not in tolerated:
            return _finding(rel, f"arquivo solto em {top}/ — vai numa das subpastas: {', '.join(subs)}")
        if len(parts) >= 3 and parts[1] not in subs:
            return _finding(rel, f"subpasta não declarada em {top}/ — as declaradas: {', '.join(subs)}; "
                                 f"nova subpasta entra no structure_rules.json do harness")
        note = _diagram_theme_note(parts, rules) or _wireframe_note(parts, rules)
        if note:
            return _finding(rel, note)
    to = _name_decides(rel, rules)
    if to:
        return _finding(rel, f"o nome diz a natureza → {to}/", to)
    return None


def staged_by_project(repo_root):
    """Paths the current commit adds, grouped by the project they belong to - the deepest folder
    with a contract. A nested project (apps/<app>/) is judged by its own profile, not the repo's."""
    groups = {}
    for rel in staged_paths(repo_root):
        parts = Path(rel).parts
        owner = repo_root
        for i in range(len(parts) - 1, 0, -1):
            cand = repo_root.joinpath(*parts[:i])
            if (cand / CONTRACT).exists():
                owner = cand
                break
        groups.setdefault(owner, []).append(Path(rel).relative_to(owner.relative_to(repo_root)).as_posix()
                                            if owner != repo_root else rel)
    return groups


def only_staged(findings, added):
    keep = []
    for f in findings:
        p = f["path"].rstrip("/")
        if any(a == p or a.startswith(p + "/") for a in added):
            keep.append(f)
    return keep


def all_projects(harness_root):
    roots = [harness_root]
    apps = harness_root / "apps"
    if apps.is_dir():
        roots += sorted(p for p in apps.iterdir() if (p / CONTRACT).exists())
    # siblings: on the Mac the harness sits inside projects/; through the Cowork bridge it is mounted
    # alone at $HOME/mnt/mjrp-harness and the projects folder at $HOME/mnt/projects (same fallback
    # as harness_feedback_check.py)
    for base in (harness_root.parent, harness_root.parent / "projects"):
        sibs = sorted(p for p in base.iterdir() if p.is_dir() and p.name != harness_root.name
                      and (p / CONTRACT).exists()) if base.is_dir() else []
        if sibs:
            roots += sibs
            break
    return roots


def main():
    ap = argparse.ArgumentParser(description="estrutura por natureza (ADR-0014)")
    ap.add_argument("path", nargs="?", default=".")
    ap.add_argument("--all-projects", action="store_true")
    ap.add_argument("--staged", action="store_true")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    rules = load_rules()

    if a.staged:
        groups = staged_by_project(Path(a.path).resolve())
        targets = sorted(groups) or [Path(a.path).resolve()]
    else:
        groups = {}
        targets = all_projects(HERE.parent) if a.all_projects else [Path(a.path).resolve()]
    report, any_findings, evaluated = [], False, 0
    for root in targets:
        profile, findings = check(root, rules)
        if profile is None:
            report.append({"project": root.name, "profile": None, "findings": []})
            continue
        evaluated += 1
        if a.staged:
            findings = only_staged(findings, groups.get(root, []))
        any_findings = any_findings or bool(findings)
        report.append({"project": root.name, "profile": profile, "findings": findings})

    if a.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        for r in report:
            if r["profile"] is None:
                if a.all_projects:
                    print(f"  · {r['project']}: não avaliável (sem contrato ou sem profile conhecido)")
                continue
            n = len(r["findings"])
            print(f"  {r['project']} [{r['profile']}]: {'conforme' if n == 0 else f'{n} item(ns) fora da natureza'}")
            for f in r["findings"]:
                print(f"    [{CHECK_ID}] {f['path']} — {f['msg']}")
    if evaluated == 0:
        if not a.all_projects:
            print(f"  structure_check: {targets[0]} não avaliável (sem {CONTRACT} ou profile desconhecido)")
        sys.exit(2)
    sys.exit(1 if any_findings else 0)


if __name__ == "__main__":
    main()
