# cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_doctor_budgets.py - the doctor's W18, second half: the TOTAL ceiling and the owner of everything that writes outside the
versioning (ADR-0023 § 3; F74 TASK-05). The first half (free disk) is `_doctor_repo.w18_free_disk`.

The ceilings are declared in `structure_rules.json -> budgets` (project and global entries), each with an `owner` (who cleans) and
a `when`. This check only MEASURES them and WARNS above the ceiling - never an error: the ADR-0002 cap of 12 errors is full and
the 13th slot belongs to W13 (ADR-0024). Four incidents of October 2026 named the rule: the iCloud backup (203 + 329 GB, a
folder per worktree), the $TMPDIR renders (92 GB in 24 h), the captures kept in `_backups/` (2.3 GB) and the worktrees nobody
tore down (52, then 110 GB).

A budget whose path cannot be SEEN from where the doctor runs (the file bridge, a machine without that folder) is a note
"não avaliável", never 0 GB: a number the check did not measure is not green (IV-08; the decision of the R3).

An entry: {"id", "glob" | "kind", "max_gb", "max_files", "max_days", "max_count", "max_growth", "owner", "when"}.
  glob     what is measured: relative to the project root in `project`, absolute in `global` (`$TMPDIR`, `~` expanded)
  max_gb   the total size of what the glob matches
  max_files / max_count   how many entries the glob matches / how many worktrees `kind` finds
  max_days   the age of the stamped copies inside the folder (`<name>.<YYYYMMDD-HHMMSS>[.n]`)
  max_growth   the newest match may not be larger than this many times the one before it (by name order)
  kind "merged_clean_worktrees"   the linked worktrees that are class 3 (merged, clean): none should be left after the train. One held only
                                  by the `.mjrp/` of an ended session or by stamped `_backups/` copies counts (`judge_worktree`, F120)
  kind "worktrees_total"   the size of the WHOLE `.claude/worktrees/` of the main checkout (`max_gb`), whatever the class of each worktree
                           (UAT-401: 29 worktrees, 31 GB, and the ceiling saw only the 4 that were derived)
"""
import glob as _glob
import os
import re
from datetime import datetime
from pathlib import Path

import _clock
import _git
import _pathclass as pc

INCIDENT = ("2026-10 (ADR-0023): quatro incidentes de disco por acúmulo sem teto total — o backup no iCloud (203 + 329 GB, uma pasta "
            "por worktree), o $TMPDIR dos renders (92 GB em 24 h), as capturas no `_backups/` (2,3 GB) e os worktrees de agente "
            "nunca desmontados (52 e 110 GB)")
STAMP = re.compile(r"\.(\d{8}-\d{6})(?:\.\d+)?$")
GB = 1024 ** 3


def _size(path):
    """Bytes under `path` (a file or a folder); links are counted as links, not followed."""
    p = Path(path)
    try:
        if not p.is_dir() or p.is_symlink():
            return p.lstat().st_size
        total = 0
        for root, dirs, files in os.walk(p):
            for name in files:
                try:
                    total += (Path(root) / name).lstat().st_size
                except OSError:
                    continue
        return total
    except OSError:
        return 0


def _forms(entry, scope, root):
    """The absolute glob patterns of an entry (a global glob can have several forms: $TMPDIR with and without symlinks)."""
    g = entry["glob"]
    if scope == "project":
        return [str(Path(root) / g.rstrip("/"))]
    return [f.rstrip("/") for f in pc.expand_global(g)]


def _anchor(pattern):
    """The deepest folder of `pattern` before its first wildcard."""
    head = re.split(r"[*?\[]", pattern, 1)[0]
    return head if head.endswith("/") else str(Path(head).parent)


def _matches(forms):
    found = {}
    for form in forms:
        for hit in _glob.glob(form):
            found[os.path.realpath(hit)] = hit
    return sorted(found.values())


def _stamp_age_days(name, path):
    m = STAMP.search(name)
    try:
        if m:
            moment = datetime.strptime(m.group(1), "%Y%m%d-%H%M%S")
            return (_clock.now_naive() - moment).total_seconds() / 86400
        return (_clock.now_naive().timestamp() - Path(path).lstat().st_mtime) / 86400
    except (OSError, ValueError):
        return 0


def _measure_glob(entry, scope, root, rep):
    bid = entry.get("id") or entry.get("glob")
    forms = _forms(entry, scope, root)
    anchors = [a for a in map(_anchor, forms) if a]
    if scope == "global" and not any(os.path.isdir(a) for a in anchors):
        rep.note("W18", f"budget `{bid}`: {anchors[0] if anchors else entry['glob']} não se vê daqui (a ponte, outra máquina, ou ainda não criado) "
                        f"— não avaliável, não é 0 GB")
        return
    hits = _matches(forms)
    over = []
    facts = [f"{len(hits)} item(ns)"]
    if "max_gb" in entry:
        total = sum(_size(h) for h in hits)
        facts.append(f"{total / GB:.2f} GB de {entry['max_gb']:g}")
        if total > float(entry["max_gb"]) * GB:
            over.append(f"{total / GB:.1f} GB, acima de {entry['max_gb']:g} GB")
    if "max_files" in entry and len(hits) > int(entry["max_files"]):
        over.append(f"{len(hits)} arquivos, acima de {entry['max_files']}")
    if "max_days" in entry:
        limit = float(entry["max_days"])
        old = []
        for hit in hits:
            kids = [Path(hit) / n for n in os.listdir(hit)] if os.path.isdir(hit) else [Path(hit)]
            old += [k.name for k in kids if STAMP.search(k.name) and _stamp_age_days(k.name, k) > limit]
        facts.append(f"{len(old)} com mais de {entry['max_days']:g} dias")
        if old:
            over.append(f"{len(old)} cópia(s) com mais de {entry['max_days']:g} dias ({old[0]}…)")
    if "max_growth" in entry and len(hits) >= 2:
        newest, before = hits[-1], hits[-2]
        ratio = _size(newest) / max(_size(before), 1)
        facts.append(f"a mais nova é {ratio:.1f}× a anterior")
        if ratio > float(entry["max_growth"]):
            over.append(f"a mais nova ({Path(newest).name}) é {ratio:.1f}× a anterior, acima de {entry['max_growth']:g}×")
    if over:
        rep.warn("W18", f"budget `{bid}` estourou: {'; '.join(over)}. Dono: {entry.get('owner', '?')}. Regra: {entry.get('when', '?')}", INCIDENT)
    else:
        rep.note("W18", f"budget `{bid}`: " + " · ".join(facts))


def _measure_worktrees(entry, root, rep):
    bid = entry.get("id") or entry.get("kind")
    top = _git.toplevel(root)
    if top is None:
        rep.note("W18", f"budget `{bid}`: o projeto não está sob git — não avaliável")
        return
    listing = _git.run(top, "worktree", "list", "--porcelain")
    if listing.code != 0:
        rep.note("W18", f"budget `{bid}`: o git não listou os worktrees — não avaliável")
        return
    here = Path(os.path.realpath(root))
    merged = []
    for block in listing.out.split("\n\n"):
        first = block.strip().split("\n")[0]
        if not first.startswith("worktree "):
            continue
        wt = Path(os.path.realpath(first[9:]))
        if wt == Path(os.path.realpath(top)) or wt == here or not pc.is_linked_worktree(wt):
            continue            # the main checkout, and the worktree this very run lives in, are not "left after the train"
        if pc.judge_worktree(wt)[0].klass == pc.DERIVED:      # the same judge as `clean-worktrees` (UAT-364, F120)
            merged.append(wt.name)
    ceiling = int(entry.get("max_count", 0))
    if len(merged) > ceiling:
        rep.warn("W18", f"budget `{bid}` estourou: {len(merged)} worktree(s) mesclado(s) e limpo(s) ainda montado(s), acima de {ceiling} "
                        f"({', '.join(merged[:4])}{'…' if len(merged) > 4 else ''}). Dono: {entry.get('owner', '?')}. "
                        f"Saem com `python3 mjrp-scripts/merge_train.py clean-worktrees --apply` (solta antes o `.mjrp/` de sessão encerrada e as cópias do "
                        f"`_backups/`, que vão para o `_backups/` do principal); um só, por `python3 mjrp-scripts/_safe.py discard <caminho>`", INCIDENT)
    else:
        rep.note("W18", f"budget `{bid}`: {len(merged)} worktree(s) mesclado(s) e limpo(s) (teto {ceiling})")


def _measure_worktrees_total(entry, root, rep):
    """The whole `.claude/worktrees/` of the MAIN checkout in GB, whatever the class of each worktree. From a linked worktree the folder is
    the main checkout's, not the one this run lives in (which has none): the measure is taken there. A main checkout git does not name is
    "não avaliável", never 0 GB (F120)."""
    bid = entry.get("id") or entry.get("kind")
    top = _git.toplevel(root)
    if top is None:
        rep.note("W18", f"budget `{bid}`: o projeto não está sob git — não avaliável")
        return
    main = pc.main_checkout(top)
    if main is None:
        rep.note("W18", f"budget `{bid}`: o git não disse onde está o checkout principal — não avaliável")
        return
    folder = main / ".claude" / "worktrees"
    if not folder.is_dir():
        rep.note("W18", f"budget `{bid}`: {folder} não existe — nenhum worktree montado (0 GB medido)")
        return
    total = _size(folder)
    count = sum(1 for e in os.scandir(folder) if e.is_dir(follow_symlinks=False))
    ceiling = float(entry.get("max_gb", 10))
    if total > ceiling * GB:
        rep.warn("W18", f"budget `{bid}` estourou: {total / GB:.1f} GB em {count} worktree(s) de `.claude/worktrees/`, acima de {ceiling:g} GB. "
                        f"Dono: {entry.get('owner', '?')}. Regra: {entry.get('when', '?')}. "
                        f"`python3 mjrp-scripts/merge_train.py clean-worktrees` mostra o que sai e o que fica, com o motivo", INCIDENT)
    else:
        rep.note("W18", f"budget `{bid}`: {total / GB:.2f} GB de {ceiling:g} em {count} worktree(s)")


def w18_budgets(root, rep):
    """W18 (2/2) - the declared budgets: a warning above the ceiling, a "não avaliável" note when the path is not visible, a note
    with the measure otherwise. Never an error (ADR-0023 § 3)."""
    try:
        project, glob_rules = pc.project_rules(root), pc.global_rules()
    except ValueError as e:
        rep.note("W18", f"budgets não avaliáveis: as regras não puderam ser lidas ({e})")
        return
    entries = [("project", e) for e in project["budgets"]["project"]] + [("global", e) for e in glob_rules["budgets"]["global"]]
    if not entries:
        rep.note("W18", "nenhum budget declarado no `structure_rules.json` deste projeto")
        return
    for scope, entry in entries:
        try:
            if entry.get("kind") == "merged_clean_worktrees":
                _measure_worktrees(entry, root, rep)
            elif entry.get("kind") == "worktrees_total":
                _measure_worktrees_total(entry, root, rep)
            elif isinstance(entry.get("glob"), str):
                _measure_glob(entry, scope, root, rep)
            else:
                rep.note("W18", f"budget `{entry.get('id', '?')}` sem `glob` nem `kind` conhecido — não avaliável")
        except (OSError, ValueError, KeyError, _git.GitError) as e:
            rep.note("W18", f"budget `{entry.get('id', '?')}` não avaliável ({e.__class__.__name__}: {e})")
