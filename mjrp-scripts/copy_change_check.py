#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
copy_change_check.py - a small text change goes straight to `main`, and only a text change does: the pre-commit's gate (F158, S-208).

The MJRP, 2026-11-01: a small text or copy change is free of the «Priorizada» and of a feature, is done directly on `main` by the
integrator and goes straight to «Em andamento» («o tipo copy deve liberar o agente pra colocar direto em andamento»). A shortcut with no
judge becomes the way everything goes in (AGENTS.md: «o agente não é o juiz»), so this gate holds the shortcut to what it was opened for.

It judges a direct commit on the main line (`main`, or `master` where a child still has it), comparing the commit's base with the index:

  - any other branch, a detached HEAD, a merge in progress, a repository's first commit ... passes: not this gate's commit
  - the commit touches no page of the text registry and no `copy` row ...................... passes
  - a file in `content/copy/` of a project with no text registry (no page of it at the base has a `texts` object) is not a page
  - the commit turns an existing row of another `Tipo` into `copy` ......................... REFUSED: only a new row is born `copy`
  - the commit changes a `copy` row of `docs/specs/uat.md` (a new row, or any cell but «OK do humano», which is the human's acceptance)
      - a path other than `content/copy/*.json`, `docs/specs/uat.md`, `docs/log.md` of that project ... REFUSED
      - and it touches a page:
          - no entry in the project's `docs/log.md`, or a changed row of another type ...... REFUSED
          - more than MAX_ENTRIES entries changed, counting the copy commits right before it . REFUSED: that is not small, it takes a branch
          - inside the page, anything but the `pt` and `en` of an existing entry ............ REFUSED
  - the commit touches a page with no `copy` row:
      - the screen's own save (only pages, each with a new `history` item: the `self_logged` of the contract, CC-ADR-0030) passes when it changes
        only `pt` and `en`, which stay strings, plus a new `version` and well-formed new `history` items, and every text it changes is in a new
        item whose `after` is the new text. The markers and an emptied text are not judged there: the text is the MJRP's on his screen, and a
        refused save would leave it written and uncommitted, refusing every save after it
      - anything else ................................................................... REFUSED: a text change on `main` is carried by a `copy` issue
  - git without an answer, the board configuration unreadable .............................. exit 2 (NOT EVALUABLE; ADR-0002 § 8)

Inside an entry, `pt` and `en` stay text (a string): one `null` fails the app's read of the WHOLE registry. On a `copy` row's commit they are also not
emptied, and their markers (`{x}`, `{ s }`, `%s`) stay the same, counted, because the code fills them. A page that does not parse at the base is compared
with its last version that does (MAX_WALK commits back on the main line); with none, the commit that repairs it passes when the new page reads. `--amend` judges the whole commit being amended, against its parent, in both directions (the pre-commit tells
an amend apart as the commit-msg does).

It judges the INDEX (what the commit will contain). What the `Tipo` cell says is read from the board configuration (`_board`, the record type
`copy`), never copied here. The bare `fixing` of such a row is the reader's (`adapters/repo_fs/uat.py`, its mirror in `product_structure_check`).

Usage: python3 mjrp-scripts/copy_change_check.py <root> --staged [--amend]
Exit: 0 passed | 1 refused | 2 not evaluable.  Stdlib only (ADR-0015); vendored into every child with the kernel.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
import pathlib as _pl, sys as _sys  # noqa: E401  (this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402
import _board  # noqa: E402
import _git  # noqa: E402
import uat_tracks_check as tracks  # noqa: E402

MAIN_LINE = ("main", "master")
COPY_RECORD = "copy"                    # the record type's id in the board configuration
MAX_ENTRIES = 10                        # «pequenas mudanças», the MJRP: the coordinator's ceiling of 2026-11-02, revisable by him; the one place it lives
# 2026-11-07 (F208, UAT-463 P2-C): the ceiling held each commit, and three commits of ten passed. It holds the small change: the copy commits in a row on
# the main line, since the last commit that is not one, add up (the agent's decision of 2026-11-05, by the MJRP's delegation, revisable by him).
# MAX_WALK bounds how far back the gate reads, here and for the last readable version of a page.
MAX_WALK = 50
ENTRY_TEXT = ("pt", "en")               # what an entry says on the screen; `where`, `purpose` and `deprecated_by` describe it
TEXTS = "texts"
HISTORY = "history"
VERSION = "version"
SAVE_ADDS = (VERSION, HISTORY)          # the top-level keys the screen's own save changes (`rules/copy.py`)
EDIT_FIELDS = {"id", "at", "key", "lang", "before", "after", "from", "undo_of"}   # `contract/copy.py`, CopyEdit: the reader forbids any other
EDIT_REQUIRED = EDIT_FIELDS - {"undo_of"}
OK_COLUMN, TIPO_COLUMN, ID_COLUMN = "OK do humano", "Tipo", "ID"
_PAGE = re.compile(r"^(?P<proj>(?:.*/)?)content/copy/[^/]+\.json$")
_UAT = re.compile(r"^(?P<proj>(?:.*/)?)docs/specs/uat\.md$")
_LOG = re.compile(r"^(?P<proj>(?:.*/)?)docs/log\.md$")
# `{x}`, `{ s }`, `{"a": 1}` and the printf `%s`, `%d`, `%(n)s`; never a flag or a space after the `%`: «100% de» is prose
_PLACEHOLDER = re.compile(r"\{[^{}]*\}|%(?:\(\w+\))?[sd]")
RULE = "AGENTS.md § A coluna «Priorizada»"


class NotEvaluable(Exception):
    """The gate could not judge: git without an answer, or a configuration it cannot read."""


def _run(top, *args):
    try:
        return _git.run(top, *args)
    except _git.GitError as exc:
        raise NotEvaluable(f"git {' '.join(args)}: {exc}") from exc


def on_main_line(top):
    """The commit lands directly on the main line: the branch is `main`/`master` and no merge is open."""
    r = _run(top, "symbolic-ref", "-q", "--short", "HEAD")
    if r.code not in (0, 1):
        raise NotEvaluable(f"git symbolic-ref saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    if r.code == 1 or r.out.strip() not in MAIN_LINE:
        return False
    return _run(top, "rev-parse", "-q", "--verify", "MERGE_HEAD").code != 0


def base_of(top, amend):
    """What the commit is compared with: HEAD, or the parent of the commit an `--amend` replaces; None on a repository's first commit."""
    ref = "HEAD~1" if amend else "HEAD"
    return ref if _run(top, "rev-parse", "-q", "--verify", f"{ref}^{{commit}}").code == 0 else None


def staged_paths(top, base):
    """Every path the commit adds, changes or removes; a rename is its two sides (`--no-renames`), so a moved page is judged as what it is."""
    r = _run(top, "-c", "core.quotePath=false", "diff", "--cached", "--name-only", "--no-renames", "-z", base)
    if r.code != 0:
        raise NotEvaluable(f"git diff --cached saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    return [p for p in r.out.split("\0") if p]


def blob(top, ref, rel):
    """The text of `rel` at `ref` (`:` = the index, or the base); None when it is not there."""
    r = _run(top, "show", f":{rel}" if ref == ":" else f"{ref}:{rel}")
    return r.out if r.code == 0 else None


def copy_values(top, proj):
    """The values of the `Tipo` cell the record type `copy` reads, casefolded, from the project's board configuration."""
    try:
        default, project = _board.read(_board.DEFAULTS), _board.read(Path(top) / proj / _board.PROJECT_REL)
    except _board.Unreadable as exc:
        raise NotEvaluable(str(exc)) from exc
    for name, cfg in (("o padrão do board", default), (_board.PROJECT_REL, project)):
        if cfg is not None and not isinstance(cfg, dict):
            raise NotEvaluable(f"{name}: {cfg}")
    if default is None:
        raise NotEvaluable(f"{_board.DEFAULTS.name} não existe")
    found = set()
    for record in _board.merge(default, project).get("record_types", []):
        if isinstance(record, dict) and record.get("id") == COPY_RECORD:
            found |= {str(v).strip().casefold() for v in record.get("tipo", [])}
    return found


def rows_of(text):
    """{UAT id: (Tipo, the row's cells without the human's OK)} of a uat.md text; each table says its columns by its own header."""
    rows, head = {}, None
    for line in (text or "").splitlines():
        if line.startswith("| ID "):
            head = tracks.cells(line)
        elif line.startswith("| UAT-") and head and TIPO_COLUMN in head:
            cells = tracks.cells(line)
            if len(cells) > head.index(TIPO_COLUMN):
                ok = head.index(OK_COLUMN) if OK_COLUMN in head else None
                rows[cells[head.index(ID_COLUMN)]] = (cells[head.index(TIPO_COLUMN)].strip().casefold(),
                                                      tuple(c for i, c in enumerate(cells) if i != ok))
    return rows


def changed_rows(before, after, values):
    """(the `copy` rows the commit changes, the other rows it changes, the existing rows it turns into `copy`), comparing every cell but the human's OK."""
    old, new = rows_of(before), rows_of(after)
    copy_ids, other_ids, retyped = [], [], []
    for ident in sorted(set(old) | set(new)):
        if ident in old and ident in new and old[ident][0] not in values and new[ident][0] in values:
            retyped.append(ident)
        elif old.get(ident) is None or new.get(ident) is None or old[ident][1] != new[ident][1]:
            kind = (new.get(ident) or old[ident])[0]
            (copy_ids if kind in values else other_ids).append(ident)
    return copy_ids, other_ids, retyped


def _page(text):
    """The page as a dict; None when the text does not parse into one."""
    try:
        data = json.loads(text)
    except (TypeError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def _has_texts(page):
    return isinstance(page, dict) and isinstance(page.get(TEXTS), dict)


def has_registry(top, proj, base):
    """The project has the text registry: a page of its `content/copy/` at the base has the `texts` object, or does not parse there and gets one in this
    commit (the repair of a lone page). A child's own JSON there is not one."""
    r = _run(top, "-c", "core.quotePath=false", "ls-tree", "--name-only", "-z", base, f"{proj}content/copy/")
    if r.code != 0:
        raise NotEvaluable(f"git ls-tree saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    for rel in r.out.split("\0"):
        if rel and _PAGE.match(rel):
            page = _page(blob(top, base, rel))
            if _has_texts(page) or (page is None and _has_texts(_page(blob(top, ":", rel)))):
                return True
    return False


def last_readable(top, ref, rel):
    """The text of the newest version of the page `rel`, at `ref` or before it on the main line, that reads with its `texts`; None when none does."""
    r = _run(top, "log", "--first-parent", f"-n{MAX_WALK}", "--format=%H", ref, "--", rel)
    if r.code != 0:
        raise NotEvaluable(f"git log saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    for commit in r.out.split():
        text = blob(top, commit, rel)
        if _has_texts(_page(text)):
            return text
    return None


def comparable(top, ref, rel):
    """What a page at `ref` is compared with: its text there, or, when it does not read there, its last version that does (F208, UAT-463 P2-C:
    the commit that repaired an unreadable page went in with entries added and fields changed, because only `pt` and `en` were judged)."""
    text = blob(top, ref, rel)
    if text is None or _page(text) is not None:
        return text
    return last_readable(top, ref, rel) or text


def is_copy_commit(top, parent, commit, paths):
    """The commit changes a `copy` row of a uat.md: a commit of the small change."""
    for rel in (p for p in paths if _UAT.match(p)):
        if changed_rows(blob(top, parent, rel), blob(top, commit, rel), copy_values(top, _UAT.match(rel)["proj"]))[0]:
            return True
    return False


def earlier_copy_entries(top, base):
    """How many entries the copy commits right before this one changed, walking the main line back from `base` until a commit that is not one
    (a merge, a repository's first commit, any other commit), at most MAX_WALK."""
    r = _run(top, "log", "--first-parent", f"-n{MAX_WALK}", "--format=%H %P", base)
    if r.code != 0:
        raise NotEvaluable(f"git log saiu {r.code}: {(r.err or r.out).strip()[:200]}")
    total = 0
    for line in r.out.splitlines():
        commit, *parents = line.split()
        if len(parents) != 1:
            break
        d = _run(top, "-c", "core.quotePath=false", "diff", "--name-only", "--no-renames", "-z", parents[0], commit)
        if d.code != 0:
            raise NotEvaluable(f"git diff saiu {d.code}: {(d.err or d.out).strip()[:200]}")
        paths = [p for p in d.out.split("\0") if p]
        if not is_copy_commit(top, parents[0], commit, paths):
            break
        total += sum(changed_entries(comparable(top, parents[0], rel), blob(top, commit, rel)) for rel in paths if _PAGE.match(rel))
    return total


def changed_entries(before, after):
    """How many entries of a page the commit changes (0 when it cannot be compared: the page's problems say why)."""
    old, new = _page(before), _page(after)
    if not _has_texts(old) or not _has_texts(new):
        return 0
    return sum(1 for key in old[TEXTS].keys() & new[TEXTS].keys() if old[TEXTS][key] != new[TEXTS][key])


def page_problems(rel, before, after, screen=False):
    """What the commit changes in a page beyond the text of its entries, each as a sentence. `screen`: the screen's own save, which also adds a
    `version` and `history` items, and may rewrite the page in its own order."""
    if before is None:
        return [f"{rel}: página nova; uma mudança de copy só troca o texto de entradas que existem"]
    if after is None:
        return [f"{rel}: página removida; uma mudança de copy só troca o texto de entradas que existem"]
    old, new = _page(before), _page(after)
    if new is None:
        return [f"{rel}: o JSON do commit está ilegível"]
    if not _has_texts(new):
        return [f"{rel}: sem o objeto `{TEXTS}`"]
    if old is None:                                   # unreadable at the base: nothing to compare with, and this commit may be the repair
        return sorted(p for key, entry in new[TEXTS].items() for p in _entry_problems(f"{rel}: {key}", _as_text(entry), entry))
    free = SAVE_ADDS if screen else ()
    out = [f"{rel}: `{key}` mudou, fora do texto das entradas" for key in sorted(set(old) | set(new))
           if key != TEXTS and key not in free and old.get(key) != new.get(key)]
    if screen:
        out += _save_problems(rel, old, new)
    was, now = old.get(TEXTS), new[TEXTS]
    if not isinstance(was, dict):
        return [*out, f"{rel}: sem o objeto `{TEXTS}`"]
    if set(was) != set(now) or (not screen and list(was) != list(now)):
        out.append(f"{rel}: entrada acrescentada, removida ou movida; só o texto delas pode mudar")
    for key in was.keys() & now.keys():
        out += _entry_problems(f"{rel}: {key}", was[key], now[key], screen)
    return sorted(out)


def _as_text(entry):
    """An entry as its own base, when the page had none: only the shape of `pt` and `en` is then judged, with the same markers by construction."""
    return dict(entry) if isinstance(entry, dict) else {}


def _save_problems(rel, old, new):
    """The screen's save writes what the reader reads: an integer `version` and `history` items of the contract's shape; one wrong fails the read."""
    out = []
    if not isinstance(new.get(VERSION), int) or isinstance(new.get(VERSION), bool):
        out.append(f"{rel}: `{VERSION}` não é um inteiro")
    items = new.get(HISTORY)
    if not isinstance(items, list):
        return [*out, f"{rel}: `{HISTORY}` não é uma lista"]
    seen = {_item_key(item) for item in old.get(HISTORY) or []}
    fresh = [item for item in items if _item_key(item) not in seen]
    for item in fresh:
        if not _edit_is_read(item):
            out.append(f"{rel}: um item novo do `{HISTORY}` está fora da forma que o app lê")
    # 2026-11-07 (F208, UAT-463 P2-A): a well-formed item of any key let a save change sixty texts. Each text the save changes is in a new item
    # whose `after` is the new text: one edit or undo (`key`, `lang`, `after` a string), or the reset (`after` a map key -> language -> text).
    recorded = set()
    for item in fresh:
        after = item.get("after") if isinstance(item, dict) else None
        if isinstance(after, str):
            recorded.add((item.get("key"), item.get("lang"), after))
        elif isinstance(after, dict):
            recorded |= {(key, lang, text) for key, texts in after.items() if isinstance(texts, dict) for lang, text in texts.items()}
    was, now = old.get(TEXTS), new.get(TEXTS)
    if isinstance(was, dict) and isinstance(now, dict):
        for key in sorted(was.keys() & now.keys()):
            a, b = was[key], now[key]
            if not isinstance(a, dict) or not isinstance(b, dict):
                continue                              # the entry's change of shape is said by _entry_problems
            for lang in ENTRY_TEXT:
                if a.get(lang) != b.get(lang) and (key, lang, b.get(lang)) not in recorded:
                    out.append(f"{rel}: {key} ({lang}) mudou sem um item novo do `{HISTORY}` com o texto novo")
    return out


def _item_key(item):
    return json.dumps(item, sort_keys=True, ensure_ascii=False)


def _edit_is_read(item):
    return (isinstance(item, dict) and EDIT_REQUIRED <= set(item) <= EDIT_FIELDS
            and all(isinstance(item.get(f), str) for f in ("id", "at", "key", "from")) and item.get("lang") in (*ENTRY_TEXT, "*")
            and all(isinstance(item.get(f), (str, dict)) for f in ("before", "after")))


def _entry_problems(where, was, now, screen=False):
    if not isinstance(was, dict) or not isinstance(now, dict):
        return [] if was == now else [f"{where}: a entrada mudou de forma"]
    out = [f"{where}: `{field}` mudou; só `pt` e `en` são o texto da entrada" for field in sorted(set(was) | set(now))
           if field not in ENTRY_TEXT and was.get(field) != now.get(field)]
    for field in ENTRY_TEXT:
        old_text, new_text = was.get(field), now.get(field)
        if not isinstance(new_text, str):
            out.append(f"{where}: `{field}` deixou de ser texto, e o app para de ler o registro inteiro")
        elif screen:
            continue
        elif not new_text.strip() and (old_text or "").strip():
            out.append(f"{where}: `{field}` ficou vazio")
        elif isinstance(old_text, str) and Counter(_PLACEHOLDER.findall(old_text)) != Counter(_PLACEHOLDER.findall(new_text)):
            out.append(f"{where}: `{field}` mudou um marcador como {{x}}, que o código preenche; isso não é só texto")
    return out


def is_screen_save(paths, pages, read):
    """The Admin screen's own commit: only pages, each with a `history` item its base version does not have. Its content is judged apart."""
    if set(paths) != set(pages):
        return False
    for rel in pages:
        old, new = _page(read("base", rel)) or {}, _page(read(":", rel)) or {}
        seen = {_item_key(item) for item in old.get(HISTORY) or []}
        items = new.get(HISTORY)
        if not isinstance(items, list) or not any(_item_key(item) not in seen for item in items):
            return False
    return True


def judge(top, amend=False):
    """The sentences that refuse this commit; [] when it passes."""
    if not on_main_line(top):
        return []
    base = base_of(top, amend)
    if base is None:
        return []
    paths = staged_paths(top, base)
    def read(ref, rel):
        if ref != "base":
            return blob(top, ref, rel)
        return comparable(top, base, rel) if _PAGE.match(rel) else blob(top, base, rel)
    candidates = {_PAGE.match(p)["proj"] for p in paths if _PAGE.match(p)}
    registries = {proj for proj in candidates if has_registry(top, proj, base)}
    pages = [p for p in paths if _PAGE.match(p) and _PAGE.match(p)["proj"] in registries]
    copy_ids, other_ids, projects, retyped = {}, {}, set(registries), []
    for rel in (p for p in paths if _UAT.match(p)):
        proj = _UAT.match(rel)["proj"]
        mine, others, changed_type = changed_rows(read("base", rel), read(":", rel), copy_values(top, proj))
        other_ids[proj] = others
        retyped += changed_type
        if mine:
            copy_ids[proj] = mine
            projects.add(proj)
    if retyped:
        return [f"{', '.join(retyped)}: uma linha que já existe não vira `copy`, porque isso troca o tipo e a trilha da issue. Só uma linha nova nasce `copy` ({RULE})"]
    if not pages and not copy_ids:
        return []
    if not copy_ids:
        if is_screen_save(paths, pages, read):
            return [f"{line}. O salvar da tela só troca o texto das entradas ({RULE})"
                    for rel in pages for line in page_problems(rel, read("base", rel), read(":", rel), screen=True)]
        return [f"texto em `content/copy/` direto na main sem uma issue de tipo `copy` neste commit: {', '.join(pages)}. "
                f"Registre a issue no `uat.md`, no mesmo commit, ou siga o caminho normal, por um ramo ({RULE})"]
    earlier = earlier_copy_entries(top, base) if pages else 0
    return _copy_commit_problems(paths, pages, copy_ids, other_ids, projects, read, earlier)


def _copy_commit_problems(paths, pages, copy_ids, other_ids, projects, read, earlier=0):
    named = ", ".join(i for ids in copy_ids.values() for i in ids)
    if len(projects) > 1:
        return [f"o commit da issue de tipo `copy` ({named}) toca mais de um projeto: {', '.join(sorted(p or '.' for p in projects))}. Um commit por projeto"]
    proj = next(iter(projects))
    allowed = {f"{proj}docs/specs/uat.md", f"{proj}docs/log.md"}
    outside = [p for p in paths if p not in allowed and not (p in pages and _PAGE.match(p)["proj"] == proj)]
    out = []
    if outside:
        out.append(f"o commit da issue de tipo `copy` ({named}) direto na main só toca `content/copy/*.json`, o `uat.md` e o log, e este toca também: "
                   f"{', '.join(outside)}. O resto segue o caminho normal, por um ramo ({RULE})")
    if pages:
        if f"{proj}docs/log.md" not in paths:
            out.append(f"o commit que muda o texto da issue de tipo `copy` ({named}) traz a entrada em {proj}docs/log.md")
        if other_ids.get(proj):
            out.append(f"o commit que muda o texto da issue de tipo `copy` ({named}) muda também a linha de outra issue: {', '.join(other_ids[proj])}. Um commit para cada")
        changed = sum(changed_entries(read("base", rel), read(":", rel)) for rel in pages)
        if changed + earlier > MAX_ENTRIES:
            more = f", somadas às {earlier} dos commits de copy seguidos logo antes dele," if earlier else ""
            out.append(f"o commit muda {changed} entradas de texto{more} e a mudança pequena vai até {MAX_ENTRIES}. Acima disso segue o caminho "
                       f"normal, por um ramo ({RULE})")
        for rel in pages:
            out += [f"{line}. Mudança de copy é só o texto das entradas; o resto segue por um ramo ({RULE})"
                    for line in page_problems(rel, read("base", rel), read(":", rel))]
    return out


def main(argv):
    args = list(argv)
    amend = "--amend" in args
    args = [a for a in args if a != "--amend"]
    if "--staged" not in args or len(args) != 2:
        print("uso: copy_change_check.py <raiz> --staged [--amend]", file=sys.stderr)
        return 2
    args.remove("--staged")
    top = Path(args[0])
    if not top.is_dir():
        print(f"copy_change_check: {top} não é uma pasta - não avaliável", file=sys.stderr)
        return 2
    try:
        refused = judge(top, amend)
    except NotEvaluable as exc:
        print(f"copy_change_check: não avaliável - {exc}", file=sys.stderr)
        return 2
    for line in refused:
        print(f"  {line}")
    return 1 if refused else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
