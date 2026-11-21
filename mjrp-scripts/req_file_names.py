#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""req_file_names.py -- names every requirement file `<ID>-<slug>.md` and rewrites the links to it (MJRP, 2026-10-09).

The ID is the node's identity (frontmatter `id:` plus `aliases: [ID]`); the slug is the English title -- the bold line
that opens `## en` -- in lowercase ASCII kebab-case, at most 50 characters. A title longer than that is cut at a word
here; the agent shortens it by judgment in a map (`ID<TAB>slug` per line) that wins over the machine slug. The slug
is frozen at birth: renaming later is explicit (`--reslug ID`) and rewrites the links in the same run.

Links and embeds name the whole stem (Obsidian resolves file names, not aliases), with the ID as display text:
  ![[S-31]]                  -> ![[S-31-decide-how-data-reaches-the-screen]]
  [[S-31]]                   -> [[S-31-decide-how-data-reaches-the-screen|S-31]]   (`\\|` inside a table row)
  [[S-31|the decision]]      -> [[S-31-decide-how-data-reaches-the-screen|the decision]]
  supersedes: "[[S-39]]"     -> supersedes: "[[S-39-<slug>]]"                      (frontmatter: no display text)
A link whose stem is a bare ID or an outdated slug of a node of <root> is brought to the current stem, so a second
run changes nothing (idempotent). Code (fences and inline) is an example, never rewritten. Only live `.md`/`.yml`
files of the git repository are touched; history, copies and sources are not (EXCLUDED_DIRS, EXCLUDED_PATHS). In
every folder-index.md under requirements/, `<OLD>.md` becomes `<NEW>.md` (tree, link label and target).

<root> is a project root: the harness (one folder per epic + nfr/), a nested project (apps/<app>/, flat requirements/)
or a child project. Its links are rewritten in the whole git repository that holds it.

Usage:
  python3 mjrp-scripts/req_file_names.py <root>                         dry-run: the table, the flags, the counts
  python3 mjrp-scripts/req_file_names.py <root> --write-map out.tsv     dry-run + the proposed slugs, to shorten by hand
  python3 mjrp-scripts/req_file_names.py <root> --map map.tsv --apply   git mv + aliases + links + folder-index
  python3 mjrp-scripts/req_file_names.py <root> --reslug S-31 [--map map.tsv] [--apply]
  --allow-dirty   apply on a working tree with uncommitted changes (the backup copy is still written)

--apply refuses on a blocking flag (duplicate ID, target exists, invalid map slug, a name the structure rules would
send elsewhere) and on a dirty tree. Before writing, every file it changes is copied to
<repo>/_backups/req-file-names-<YYYYMMDD-HHMM>/ (America/Sao_Paulo) with the plan. After writing, the requirements
graph is checked again and any finding the run introduced is printed (exit 1).
Exit: 0 ok · 1 blocking flag or new graph finding · 2 not evaluable (no requirements/, not a git repo for --apply).
"""
import re
import shutil
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent

REQ_REL = "docs/specs/requirements"
SLUG_MAX = 50
NODE_STEM = re.compile(r"^(?P<id>(?:S|UC|EA|NFR)-\d{2,})(?:-(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*))?$")
SLUG_OK = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
# a wikilink or embed whose target is a requirement stem (bare ID or ID-slug), with optional #anchor and |text
# (`\|` is the pipe escaped inside a table row)
LINK = re.compile(r"(?P<bang>!?)\[\[(?P<stem>(?:S|UC|EA|NFR)-\d{2,}(?:-[a-z0-9]+)*)(?P<anchor>#[^\]|\\]*)?"
                  r"(?P<text>\\?\|[^\]]*)?\]\]")
# a requirement file name in a folder-index.md (tree line, link label, link target)
FILE_REF = re.compile(r"(?<![\w-])(?P<stem>(?:S|UC|EA|NFR)-\d{2,}(?:-[a-z0-9]+)*)\.md(?![\w-])")
STOPWORDS = {"a", "an", "the", "of", "to", "in", "on", "for", "and", "or", "by", "with", "from", "at", "as", "into",
             "its", "it", "is", "be", "that", "this", "per", "vs", "via", "than", "then", "when", "so", "but",
             "whether", "if", "about", "what", "how", "which", "who", "where", "my", "your", "our", "their", "each",
             "every", "any", "all", "not", "no"}
EXCLUDED_DIRS = {"_archive", "_backups", "reports", "mjrp-skills", "mjrp-scripts", ".mjrp", "daily-checks", ".git",
                 "node_modules"}
EXCLUDED_PATHS = ("design/proposals/", "docs/wiki/sources/", "docs/wiki/harness/")
EXCLUDED_FILES = ("docs/log.md",)
LIVE_SUFFIXES = (".md", ".yml", ".yaml")


# ---- names ---------------------------------------------------------------------------------------------------
def node_id(stem):
    m = NODE_STEM.match(stem) or re.match(r"^((?:S|UC|EA|NFR)-\d{2,})(?=-|$)", stem)
    return m.group(1) if m else None


def english_title(text):
    """The bold line that opens `## en` (the first bold line of the section)."""
    sec = re.search(r"^## en\s*\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    if not sec:
        return ""
    m = re.search(r"^\s*\*\*(.+?)\*\*\s*$", sec.group(1), re.M)
    return m.group(1).strip() if m else ""


def slug_words(title):
    t = title.replace("'", "").replace("’", "")
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return [w for w in t.split("-") if w]


def slugify(title, limit=SLUG_MAX):
    """(slug, cut): kebab-case ASCII, at most `limit` chars, cut at a word, trailing stopwords dropped."""
    words = slug_words(title)
    full = "-".join(words)
    out = []
    for w in words:
        if len("-".join(out + [w])) > limit:
            break
        out.append(w)
    while len(out) > 1 and out[-1] in STOPWORDS:
        out.pop()
    if not out and words:
        out = [words[0][:limit]]
    return "-".join(out), len(full) > limit


def read_map(path):
    out, errors = {}, []
    for n, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        cols = line.split("\t")
        if len(cols) < 2:
            errors.append(f"map linha {n}: esperava ID<TAB>slug")
            continue
        nid, slug = cols[0].strip(), cols[1].strip()
        if not SLUG_OK.match(slug) or len(slug) > SLUG_MAX:
            errors.append(f"map linha {n}: slug '{slug}' de {nid} fora do padrão (kebab-case ASCII, até {SLUG_MAX})")
            continue
        out[nid] = slug
    return out, errors


# ---- git -----------------------------------------------------------------------------------------------------
import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
from _git import run_tuple as git   # (code, stdout); 124 = deadline, 127 = no git (F73 R4)


def repo_top(root):
    code, out = git(root, "rev-parse", "--show-toplevel")
    return Path(out.strip()).resolve() if code == 0 and out.strip() else None


def excluded(rel):
    parts = rel.split("/")
    if any(p in EXCLUDED_DIRS for p in parts[:-1]):
        return True
    low = "/" + rel
    if any("/" + x in low for x in EXCLUDED_PATHS):
        return True
    return any(low.endswith("/" + f) for f in EXCLUDED_FILES)


def live_files(top):
    """Tracked and untracked (not ignored) .md/.yml files of the repository, minus the excluded ones."""
    code, out = git(top, "ls-files", "-co", "--exclude-standard")
    if code != 0:
        files = [p.relative_to(top).as_posix() for p in top.rglob("*") if p.is_file()]
    else:
        files = out.splitlines()
    return sorted({f for f in files if f.endswith(LIVE_SUFFIXES) and not excluded(f) and (top / f).is_file()})


# ---- the rewrite ---------------------------------------------------------------------------------------------
def _protected_spans(text):
    """Code fences and inline code: examples, never rewritten."""
    spans = [m.span() for m in re.finditer(r"^(```|~~~).*?^\1[^\n]*$", text, re.M | re.S)]
    for m in re.finditer(r"`[^`\n]+`", text):
        if not any(a <= m.start() < b for a, b in spans):
            spans.append(m.span())
    return spans


def rewrite_links(text, stems, yaml_file=False):
    """stems: ID -> current stem. Returns (new text, number of links changed). A YAML file is all frontmatter:
    its links get no display text."""
    fm_end = len(text) if yaml_file else 0
    if not yaml_file and text.startswith("---\n"):
        e = text.find("\n---", 3)
        fm_end = e + 4 if e != -1 else 0
    spans = _protected_spans(text)
    count = 0

    def repl(m):
        nonlocal count
        if any(a <= m.start() < b for a, b in spans):
            return m.group(0)
        stem = m.group("stem")
        nid = node_id(stem)
        new = stems.get(nid)
        if not new or stem == new:
            return m.group(0)
        anchor, text_ = m.group("anchor") or "", m.group("text") or ""
        in_fm = m.start() < fm_end
        if not text_ and not m.group("bang") and not in_fm:
            line_start = text.rfind("\n", 0, m.start()) + 1
            in_table = re.match(r"^\s*(?:>\s*)*\|", text[line_start:m.start() + 1]) is not None
            text_ = ("\\|" if in_table else "|") + nid
        count += 1
        return f"{m.group('bang')}[[{new}{anchor}{text_}]]"

    return LINK.sub(repl, text), count


def rewrite_file_refs(text, stems):
    count = 0

    def repl(m):
        nonlocal count
        stem = m.group("stem")
        new = stems.get(node_id(stem))
        if not new or new == stem:
            return m.group(0)
        count += 1
        return new + ".md"

    return FILE_REF.sub(repl, text), count


def add_alias(text, nid):
    """`aliases: [ID]` right after `id:` in the frontmatter; an existing aliases list gains the ID."""
    if not text.startswith("---\n"):
        return text
    end = text.find("\n---", 3)
    if end == -1:
        return text
    fm, rest = text[:end], text[end:]
    m = re.search(r"^aliases:\s*(.*)$", fm, re.M)
    if m:
        items = [x.strip().strip("'\"") for x in m.group(1).strip().strip("[]").split(",") if x.strip()]
        if nid in items:
            return text
        if m.group(1).strip().startswith("[") or not m.group(1).strip():
            fm = fm[:m.start()] + f"aliases: [{', '.join(items + [nid])}]" + fm[m.end():]
            return fm + rest
        return text      # a block list -- left to the human
    idm = re.search(r"^id:.*$", fm, re.M)
    if not idm:
        return text
    return fm[:idm.end()] + f"\naliases: [{nid}]" + fm[idm.end():] + rest


# ---- the plan ------------------------------------------------------------------------------------------------
def structure_judge(name):
    """(hits a name pattern, exempt) for a requirement file name, by the structure rules."""
    try:
        import json
        rules = json.loads((HERE / "structure_rules.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None, False
    low = name.lower()
    hit = next((p["to"] for p in rules.get("name_patterns", []) if re.search(p["regex"], low)), None)
    exempt = any(re.search(rx, low) for rx in rules.get("name_patterns_exempt", []))
    return hit, exempt


def other_project_ids(top, req_dir):
    """IDs of the other requirements graphs in the same repository (a nested project's, the harness's)."""
    ids = {}
    mine = req_dir.resolve().relative_to(top).as_posix() + "/" if req_dir.resolve().is_relative_to(top) else None
    for rel in live_files(top):
        i = ("/" + rel).find("/" + REQ_REL + "/")
        if i == -1 or (mine is not None and rel.startswith(mine)):
            continue
        nid = node_id(Path(rel).stem)
        if nid and Path(rel).name.lower() != "folder-index.md":
            ids.setdefault(nid, rel[:i + len(REQ_REL)].lstrip("/"))
    return ids


def plan(root, overrides, reslug=None):
    req = root / REQ_REL
    rows, flags, by_id = [], [], {}
    for f in sorted(req.rglob("*.md")):
        if f.name.lower() in ("readme.md", "folder-index.md", "index.md"):
            continue
        nid = node_id(f.stem)
        if not nid:
            flags.append(("block", f"{f.relative_to(root)}: nome não começa por um ID de requisito"))
            continue
        by_id.setdefault(nid, []).append(f)
    for nid, files in sorted(by_id.items(), key=lambda kv: (kv[0].split("-")[0], int(kv[0].split("-")[1]))):
        if len(files) > 1:
            flags.append(("block", f"{nid}: ID duplicado — {', '.join(str(x.relative_to(root)) for x in files)}"))
            continue
        f = files[0]
        text = f.read_text(encoding="utf-8", errors="replace")
        title = english_title(text)
        m = NODE_STEM.match(f.stem)
        has_slug = bool(m and m.group("slug"))
        row = {"id": nid, "path": f, "old": f.stem, "new": f.stem, "title": title, "cut": False, "src": "kept",
               "full_len": len("-".join(slug_words(title)))}
        if not m:
            flags.append(("warn", f"{nid}: '{f.name}' fora do padrão <ID>-<slug>.md — recebe o slug do título (ou do map)"))
        elif has_slug and nid in overrides and overrides[nid] != m.group("slug") and reslug != nid:
            flags.append(("warn", f"{nid}: já tem slug ({m.group('slug')}); o slug do map só vale com --reslug {nid}"))
        if not has_slug or reslug == nid or not m:
            if nid in overrides:
                slug, row["src"] = overrides[nid], "map"
            elif title:
                slug, row["cut"] = slugify(title)
                row["src"] = "title"
            else:
                slug = None
                flags.append(("warn", f"{nid}: sem título em inglês (linha em negrito abrindo `## en`) e sem slug no map — fica sem slug"))
            if slug:
                row["new"] = f"{nid}-{slug}"
        rows.append(row)
        if row["new"] != row["old"]:
            target = f.with_name(row["new"] + ".md")
            if target.exists() and target.resolve() != f.resolve():
                flags.append(("block", f"{nid}: o destino {target.relative_to(root)} já existe"))
            hit, exempt = structure_judge(row["new"] + ".md")
            row["pattern"] = f"{hit} ({'isento' if exempt else 'BLOQUEIA'})" if hit else ""
            if hit and not exempt:
                flags.append(("block", f"{nid}: {row['new']}.md cai em name_patterns ({hit}) — a regra de estrutura o mandaria embora"))
    for nid in overrides:
        if nid not in by_id:
            flags.append(("warn", f"map: {nid} não é nó de {REQ_REL}/ deste projeto"))
    return rows, flags


import _clock
now_sp = _clock.now   # Brasília (F73 R4)


def graph_findings(root):
    try:
        import json
        import requirements_graph_check as rgc
        rules = json.loads((HERE / "requirements_graph_rules.json").read_text(encoding="utf-8"))
        return set(rgc.Graph(root, rules).run())
    except Exception as e:  # the graph check is a guard here, never the reason the tool breaks
        print(f"  (aviso) checagem do grafo não rodou: {e}")
        return None


# ---- main ----------------------------------------------------------------------------------------------------
def main(argv):
    def opt(name):
        if name in argv:
            i = argv.index(name)
            if i + 1 < len(argv):
                return argv[i + 1]
            raise SystemExit(f"{name} pede um valor")
        return None

    valued = {opt(n) for n in ("--map", "--reslug", "--write-map")} - {None}
    pos = [a for a in argv if not a.startswith("--") and a not in valued]
    if not pos:
        print(__doc__)
        return 2
    root = Path(pos[0]).resolve()
    apply, allow_dirty = "--apply" in argv, "--allow-dirty" in argv
    req = root / REQ_REL
    if not req.is_dir():
        print(f"[req_file_names] sem {REQ_REL}/ em {root} — nada a nomear (não avaliável)")
        return 2
    overrides, errors = ({}, [])
    if opt("--map"):
        overrides, errors = read_map(opt("--map"))
    reslug = opt("--reslug")
    rows, flags = plan(root, overrides, reslug)
    flags = [("block", e) for e in errors] + flags
    top = repo_top(root)
    if top:
        others = other_project_ids(top, req)
        for r in rows:
            if r["id"] in others:
                flags.append(("block", f"{r['id']}: o mesmo ID existe em {others[r['id']]} — os links do repositório ficariam ambíguos"))
    stems = {r["id"]: r["new"] for r in rows}
    renames = [r for r in rows if r["new"] != r["old"]]

    # what the links would become
    scan_top = top or root
    link_changes, ref_changes = {}, {}
    for rel in live_files(scan_top):
        p = scan_top / rel
        txt = p.read_text(encoding="utf-8", errors="replace")
        _, n = rewrite_links(txt, stems, rel.endswith((".yml", ".yaml")))
        if n:
            link_changes[rel] = n
    for fi in sorted(req.rglob("folder-index.md")):
        _, n = rewrite_file_refs(fi.read_text(encoding="utf-8", errors="replace"), stems)
        if n:
            ref_changes[fi.relative_to(scan_top).as_posix()] = n

    # the report
    over = [r for r in rows if r["full_len"] > SLUG_MAX and r["src"] == "title" and r["new"] != r["old"]]
    print(f"[req_file_names] {root.relative_to(top) if top and root != top else root.name} — {len(rows)} nó(s), "
          f"{len(renames)} a renomear")
    if renames:
        print("  ID | atual → novo | origem do slug | título em inglês")
        for r in renames:
            tag = r["src"] + (" · cortado (título > 50)" if r["cut"] else "") + (f" · padrão: {r['pattern']}" if r.get("pattern") else "")
            print(f"  {r['id']} | {r['old']} → {r['new']} | {tag} | {r['title']}")
    for kind, msg in flags:
        print(f"  [{'BLOQUEIA' if kind == 'block' else 'aviso'}] {msg}")
    print(f"  links a reescrever: {sum(link_changes.values())} em {len(link_changes)} arquivo(s) · "
          f"folder-index: {sum(ref_changes.values())} referência(s) em {len(ref_changes)} arquivo(s)")
    for rel, n in sorted(link_changes.items()):
        print(f"    {n:4d}  {rel}")
    print(f"  resumo: {len(renames)} arquivo(s) a renomear · {len(over)} slug(s) de título com mais de {SLUG_MAX} "
          f"caracteres (cortados na palavra — encurte por julgamento no --map) · "
          f"{sum(1 for k, _ in flags if k == 'block')} bloqueio(s)")

    if opt("--write-map"):
        out = Path(opt("--write-map"))
        lines = [f"# ID\tslug\tfull title slug length\tcut\tEnglish title\tcurrent file  (generated {now_sp():%Y-%m-%d %H:%M}"
                 f" America/Sao_Paulo; edit column 2 only, keep it kebab-case ASCII <= {SLUG_MAX})"]
        for r in rows:
            slug = r["new"][len(r["id"]) + 1:] if r["new"] != r["id"] else ""
            lines.append(f"{r['id']}\t{slug}\t{r['full_len']}\t{'yes' if r['cut'] else 'no'}\t{r['title']}\t"
                         f"{r['path'].relative_to(root).as_posix()}")
        out.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"  map escrito: {out} ({len(rows)} linha(s))")

    if not apply:
        return 1 if any(k == "block" for k, _ in flags) else 0

    # ---- apply -------------------------------------------------------------------------------------------------
    if not top:
        print("[req_file_names] --apply precisa de um repositório git (git mv guarda a história)")
        return 2
    if any(k == "block" for k, _ in flags):
        print("[req_file_names] --apply recusado: resolva os bloqueios acima")
        return 1
    code, dirty = git(top, "status", "--porcelain")
    if dirty.strip() and not allow_dirty:
        print("[req_file_names] --apply recusado: a árvore tem mudanças não commitadas — commite antes (o git é o backup) "
              "ou passe --allow-dirty")
        return 1
    before = graph_findings(root)
    if before is not None:
        # a finding that only names the file changes its text with the rename -- compare it under the new name
        olds = {r["old"] + ".md": r["new"] + ".md" for r in renames}
        before = {(rule, re.sub(r"(?<![\w-])((?:S|UC|EA|NFR)-\d{2,}(?:-[a-z0-9]+)*\.md)", lambda m: olds.get(m.group(1), m.group(1)), msg))
                  for rule, msg in before}
    # F71 R16: ONE backup mechanism -- every file about to change is copied by `_safe.snapshot` (root = this project), like
    # everything else in the harness; the plan (old -> new names) is a file beside the copies, never overwritten.
    import _safe
    stamp = now_sp().strftime("%Y%m%d-%H%M")
    touched = sorted({r["path"].relative_to(top).as_posix() for r in rows} | set(link_changes) | set(ref_changes))
    for rel in touched:
        _safe.snapshot(top / rel, root=top)
    plan_file = top / "_backups" / f"req-file-names-plan.{stamp}.tsv"
    n = 2
    while plan_file.exists():        # two runs in the same minute (harness, then a nested project) keep both plans
        plan_file = top / "_backups" / f"req-file-names-plan.{stamp}-{n}.tsv"
        n += 1
    plan_file.parent.mkdir(parents=True, exist_ok=True)
    plan_file.write_text("".join(f"{r['id']}\t{r['old']}\t{r['new']}\n" for r in rows), encoding="utf-8")
    print(f"  plano: {plan_file.relative_to(top)} ({len(touched)} arquivo(s) copiados antes)")

    changed = set()
    for r in renames:
        new_path = r["path"].with_name(r["new"] + ".md")
        code, _ = git(top, "mv", str(r["path"].relative_to(top)), str(new_path.relative_to(top)))
        if code != 0:
            shutil.move(str(r["path"]), str(new_path))
        r["path"] = new_path
        changed.add(new_path.relative_to(top).as_posix())
    for r in rows:
        t = r["path"].read_text(encoding="utf-8")
        t2 = add_alias(t, r["id"])
        if t2 != t:
            r["path"].write_text(t2, encoding="utf-8")
            changed.add(r["path"].relative_to(top).as_posix())
    n_links = 0
    for rel in live_files(top):
        p = top / rel
        t = p.read_text(encoding="utf-8", errors="replace")
        t2, n = rewrite_links(t, stems, rel.endswith((".yml", ".yaml")))
        if n:
            p.write_text(t2, encoding="utf-8")
            n_links += n
            changed.add(rel)
    n_refs = 0
    for fi in sorted(req.rglob("folder-index.md")):
        t = fi.read_text(encoding="utf-8")
        t2, n = rewrite_file_refs(t, stems)
        if n:
            fi.write_text(t2, encoding="utf-8")
            n_refs += n
            changed.add(fi.relative_to(top).as_posix())
    if changed:
        git(top, "add", "--", *sorted(changed))
    print(f"  aplicado: {len(renames)} renomeado(s) · {n_links} link(s) · {n_refs} referência(s) em folder-index · "
          f"{len(changed)} arquivo(s) no stage — desfazer: git reset -q && git checkout -- . (ou o backup)")
    after = graph_findings(root)
    if before is not None and after is not None:
        new = sorted(after - before)
        if new:
            print(f"  [grafo] {len(new)} achado(s) novo(s) depois da renomeação:")
            for rule, msg in new:
                print(f"    [{rule}] {msg}")
            return 1
        print("  [grafo] nenhum achado novo")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
