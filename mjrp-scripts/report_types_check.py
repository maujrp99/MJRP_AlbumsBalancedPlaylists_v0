#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
report_types_check.py - does every report under `reports/` declare a `type:` from the harness's list? The judge of the
type half of the `report-names` catalog item (report-names@2, CM-0043).

Born 2026-10-17 from the MJRP's decision (22:48): the Control Center takes a report's theme from its header's `type:`, but
the list of types lived hard-coded in the screen and only two report templates declared a type, so the fin-control had six
reports with no theme (two `conformance-audit`, one `tech-debt-survey`, three with no header). Now ONE list lives in the
harness (`report_types.json`, vendored next to this script), every report template declares its `type:` from it, and this
script is what asks the child for it.

What it judges (the reports are the `*.md` files under `reports/`; the sub-folders whose theme comes from the FOLDER -
`evidence/`, `harness-feedback/`, `handoffs/`, `presentations/` (`by_folder` in the list) - and `folder-index.md` are not):
  - a report dated on or after the list's `required_since` (2026-10-17) with no `type:`, or one not in the list, is an
    ERROR (exit 1): the agent that writes a new report has the list in its template;
  - an older one is a WARNING (a `[aviso]` line, exit 0): a report is not rewritten to satisfy a rule that did not exist, but
    the conform adds the missing `type:` by reading the content and choosing the type; when no type fits it asks the MJRP,
    and the new type is added to the list in the harness - never invented in the child.
  The date is the one the name begins with (`AAAA-MM-DD-...`), else the header's `judged:`; a report with neither is a warning.
  Every message names the closest types (the declared one, the hints of the file name), with their theme.
  - a type that declares `required_fields` in the list (the critiques, `ux-audit` and `architecture-audit`: the Control Center
    fails a critique without `status:`) needs that field in the header, with one of the words the screen reads. A report that
    DECLARES such a type without it is an ERROR whatever its date - the screen shows it as an unreadable critique, which is
    exactly what adding only `type: ux-audit` to an old report did (report-names@3, CM-0059). The untyped old report keeps its
    warning, and the message says the critique types also need `status:` (`closed` when the report passes, no P0 open, nothing
    waiting for the MJRP; `open` otherwise; `superseded` when a newer one replaced it).
  - the NAME of a file in a by-folder folder that declares a `name_rule` (`reports/harness-feedback/`): no `type:` is asked
    there, but the name is `AAAA-MM-DD-<project>-<subject>.md`, lowercase ASCII and English - the first word after the date is
    the project's (the folder's name without `mjrp-`; a git worktree resolves to its repository). ALWAYS a warning, at any date:
    the rule was born on 2026-10-18, after feedback was written and triaged in the harness inbox under its old name, and renaming
    a triaged file is the MJRP's question, not an error the child can clear alone (`conformance.asked` releases a warning).
  - a file whose NAME says critique (`ux-audit`/`architecture-audit`), with a header and no `type:`, is an ERROR at any date:
    the Control Center reads it as a critique and fails it (the same failure as the declared type without `status:`).
  Every item carries its `kind` (`type`, `status`, `critique_header`, `name`); the summary line and each message say which.

Exit: 0 passes (warnings may be printed), 1 an error, 2 not evaluable (no project, no contract, the list missing or broken).

Usage:
  python3 mjrp-scripts/report_types_check.py <project> [--json] [--quiet]
Stdlib only (ADR-0015); vendored into every child with the kernel.
"""
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
from _fm import block as _frontmatter   # the raw YAML block, one reader (F73 R4)

HERE = Path(__file__).resolve().parent
LIST_FILE = HERE / "report_types.json"
CONTRACT_FILE = ".mjrp-project.yml"
INDEX = "folder-index.md"
CLOSEST = 3                                  # how many types a message suggests

_DATE_NAME = re.compile(r"^(\d{4}-\d{2}-\d{2})(?!\d)")
_DATE = re.compile(r"(\d{4}-\d{2}-\d{2})")


class ListError(Exception):
    """The list of types is missing or not in the format: the judgement cannot be made (exit 2)."""


def load_list(path=LIST_FILE):
    """{"required_since": str, "types": {type: entry}, "by_folder": {folder, ...}}; raises ListError."""
    try:
        doc = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise ListError(f"{Path(path).name} não se lê ({e.__class__.__name__})")
    if not isinstance(doc, dict) or doc.get("format") != "report_types@1" or not isinstance(doc.get("types"), list):
        raise ListError(f"{Path(path).name} fora do formato report_types@1")
    since = doc.get("required_since")
    if not isinstance(since, str) or not _DATE.fullmatch(since):
        raise ListError(f"{Path(path).name}: `required_since` não é uma data AAAA-MM-DD")
    types = {}
    for e in doc["types"]:
        if not isinstance(e, dict) or not isinstance(e.get("type"), str) or not isinstance(e.get("theme"), str):
            raise ListError(f"{Path(path).name}: uma entrada sem `type` e `theme`")
        types[e["type"]] = e
    by_folder = {e["folder"] for e in types.values() if e.get("by_folder") and isinstance(e.get("folder"), str)}
    name_rule = {e["folder"] for e in types.values() if e.get("name_rule") == "dated-project-english" and isinstance(e.get("folder"), str)}
    for e in types.values():
        fields = e.get("required_fields")
        if fields is not None and not (isinstance(fields, dict) and all(isinstance(v, dict) and v for v in fields.values())):
            raise ListError(f"{Path(path).name}: `required_fields` de `{e['type']}` fora do formato {{campo: {{canônico: [palavras]}}}}")
    return {"required_since": since, "types": types, "by_folder": by_folder, "name_rule": name_rule}


def _declared(fm):
    m = re.search(r"^type:\s*(.*?)\s*$", fm, re.M)
    if not m:
        return None
    value = re.sub(r"\s+#.*$", "", m.group(1)).strip().strip("'\"").strip()
    return value or None


def report_day(name, fm):
    """The day a report is dated by: the name's, else the header's `judged:`; None when it has neither."""
    m = _DATE_NAME.match(name)
    if m:
        return m.group(1)
    j = re.search(r"^judged:\s*(.*)$", fm, re.M)
    d = _DATE.search(j.group(1)) if j else None
    return d.group(1) if d else None


def closest(name, declared, types, limit=CLOSEST):
    """The types nearest to this report: the hints of its file name, the declared type spelled nearly like one."""
    low = name.lower()
    score = {}
    for t, e in types.items():
        matched = [h for h in e.get("name_hints", []) if h in low]
        hits = len(matched)
        if t in low:
            hits += 2
        if hits:
            # the most SPECIFIC hint breaks a tie: `migration-reconcil` (data-reconciliation) beats `reconcil` + `migration` (graph-reconciliation)
            score[t] = score.get(t, 0) + hits + max((len(h) for h in matched), default=0) / 1000
    if declared:
        for t in difflib.get_close_matches(declared.lower(), list(types), n=limit, cutoff=0.55):
            score[t] = score.get(t, 0) + 3
        parts = {p for p in re.split(r"[-_ ]+", declared.lower()) if len(p) > 3}
        for t in types:
            if parts & set(t.split("-")):
                score[t] = score.get(t, 0) + 1
    ranked = sorted(score, key=lambda t: (-score[t], t))
    return ranked[:limit]


def _first_word(text):
    """The first run of ASCII letters of a value, accents stripped and lowercased - how the Control Center reads a status."""
    plain = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode().casefold()
    found = re.search(r"[a-z]+", plain)
    return found.group(0) if found else ""


def _field(fm, name):
    m = re.search(rf"^{re.escape(name)}:\s*(.*?)\s*$", fm, re.M)
    return re.sub(r"\s+#.*$", "", m.group(1)).strip().strip("'\"").strip() if m else None


def missing_fields(entry, fm):
    """[(field, why)] of the `required_fields` of a type that the header lacks or spells with a word the screen does not read."""
    out = []
    for field, canon in (entry.get("required_fields") or {}).items():
        value = _field(fm, field)
        words = {w for ws in canon.values() for w in ws}
        if not value:
            out.append((field, f"sem `{field}:` no cabeçalho"))
        elif _first_word(value) not in words:
            out.append((field, f"`{field}: {value}` não é uma palavra que a tela lê ({'/'.join(canon)})"))
    return out


VERDICT_RULE = ("leia o veredito do relatório: `closed` se passa, sem P0 aberto e nada esperando o MJRP; `open` se não; "
                "`superseded` se um mais novo o substituiu")


def _fields_hint(names, types):
    need = [t for t in names if types[t].get("required_fields")]
    if not need:
        return ""
    fields = sorted({f for t in need for f in types[t]["required_fields"]})
    words = "/".join(next(iter(types[need[0]]["required_fields"].values())))
    return f"; {', '.join('`' + t + '`' for t in need)} exige também `{', '.join(fields)}:` ({words}) - {VERDICT_RULE}"


def _suggest(names, types):
    if not names:
        return "nenhum tipo da lista serve de longe; pergunte ao MJRP — o tipo novo entra na lista do harness, não se inventa aqui"
    return "mais próximos: " + ", ".join(f"`{t}` ({types[t]['theme']})" for t in names) + _fields_hint(names, types)


def project_slug(root):
    """The project's name as a report file names it: the folder without `mjrp-`; a git worktree resolves to its repository."""
    root = Path(root).resolve()
    name = root.name
    marker = root / ".git"
    if marker.is_file():
        m = re.search(r"gitdir:\s*(.+?)/\.git/worktrees/", marker.read_text(encoding="utf-8", errors="replace"))
        if m:
            name = Path(m.group(1)).name
    return re.sub(r"^mjrp-", "", name.lower())


def _english_judge(root):
    """A finder of a Portuguese word in a file stem, from the `english-names` item of the catalog beside this script (None when
    conformance_check or the catalog is not there: then only the ASCII rule of the name catches a Portuguese one)."""
    try:
        sys.dont_write_bytecode = True
        import conformance_check as cc
        catalog = cc.find_catalog(root) or (cc.CATALOG_FILE if cc.CATALOG_FILE.is_file() else None)
        clause = None
        for it in (cc.load_catalog(catalog) if catalog else []):
            if it["id"] == "english-names":
                clause = it["check"][0] if isinstance(it["check"], list) else it["check"]
        if clause is None:
            return None
        deny, suffixes, allow = set(clause.get("deny_words", [])), tuple(clause.get("deny_suffixes", [])), set(clause.get("allow_words", []))
        return lambda stem: cc._not_english_token(stem, deny, suffixes, allow)
    except Exception:
        return None


def name_problem(name, slug, english):
    """Why a file name in a `name_rule` folder is wrong (prose), or None."""
    m = re.match(r"^(\d{4}-\d{2}-\d{2})-(.+)\.md$", name)
    if not m or not re.fullmatch(r"[a-z0-9]+(?:[-.][a-z0-9]+)*", m.group(2)):
        return "o nome não é `AAAA-MM-DD-<projeto>-<assunto>.md` em minúsculas ASCII"
    first = slug.split("-")[0]
    if not (m.group(2) == first or m.group(2).startswith(first + "-")):
        return f"falta o segmento do projeto (`{first}`) depois da data: `AAAA-MM-DD-{first}-<assunto em inglês>.md`"
    token = english(m.group(2)) if english else None
    if token:
        return f"`{token}` não é inglês: o nome é inglês (`AAAA-MM-DD-{first}-<assunto em inglês>.md`)"
    return None


KINDS = {
    "type": "relatório sem `type:` da lista",
    "status": "crítica que declara o tipo sem `status:` que a tela lê",
    "critique_header": "crítica (pelo nome) com cabeçalho e sem `type:`",
    "name": "nome fora da regra em `reports/harness-feedback/`",
}


def _is_critique_by_name(name):
    """The Control Center reads a file as a critique by its name too (archdesign_text.audit_kind_by_name)."""
    return "ux-audit" in name or "architecture-audit" in name


def _has_header(fm):
    return bool(re.search(r"^[A-Za-z_][\w-]*:", fm, re.M))


def check(root, lst=None):
    """{"errors": [...], "warnings": [...], "counts": {...}} of the reports of a project. Every item carries its `kind`
    (KINDS), so the messages and the summary say WHICH failure it is."""
    root = Path(root)
    lst = lst or load_list()
    types, since, skip = lst["types"], lst["required_since"], lst["by_folder"]
    named = lst.get("name_rule", set())
    slug, english = project_slug(root), None
    base = root / "reports"
    errors, warnings = [], []
    counts = {"reports": 0, "typed": 0, "untyped": 0}
    files = sorted(base.rglob("*.md")) if base.is_dir() else []
    for f in files:
        rel_parts = f.relative_to(base).parts
        if f.name == INDEX or any(p.startswith(".") for p in rel_parts):
            continue
        rel = f.relative_to(root).as_posix()
        if len(rel_parts) > 1 and rel_parts[0] in named:
            # no `type:` here (the folder is the theme), but the NAME follows the rule. ALWAYS a warning, at any date: the rule was
            # born on 2026-10-18, so the cut of the type rule (2026-10-17) would turn a feedback the harness already triaged under
            # its old name into an error that `conformance.asked` cannot release (a name error is never the child's to fix alone)
            counts["named"] = counts.get("named", 0) + 1
            if english is None:
                english = _english_judge(root) or False
            why = name_problem(f.name, slug, english or None)
            if why:
                warnings.append({"kind": "name", "file": rel, "declared": None, "date": report_day(f.name, ""),
                                 "message": f"{why}; se o harness já triou este arquivo (o mesmo nome na caixa de entrada dele), "
                                            "renomear quebra a triagem: pergunte ao MJRP e registre em `conformance.asked`"})
            continue
        if len(rel_parts) > 1 and rel_parts[0] in skip:
            continue
        counts["reports"] += 1
        text = f.read_text(encoding="utf-8", errors="replace")
        fm = _frontmatter(text)
        declared = _declared(fm)
        if declared in types:
            counts["typed"] += 1
            # a critique type brings the fields the screen requires: without them the Control Center fails the file, at ANY date
            for field, why in missing_fields(types[declared], fm):
                counts["typed"] -= 1
                counts["untyped"] += 1
                words = "/".join(types[declared]["required_fields"][field])
                errors.append({"kind": "status", "file": rel, "declared": declared, "date": report_day(f.name, fm),
                               "message": f"declara `type: {declared}` e {why} - a tela do Control Center lê a crítica pelo `{field}:` e recusa o arquivo "
                                          f"sem ele (palavras: {words}); {VERDICT_RULE}"})
                break
            continue
        counts["untyped"] += 1
        day = report_day(f.name, fm)
        near = _suggest(closest(f.stem, declared, types), types)
        if not declared and _is_critique_by_name(f.name) and _has_header(fm):
            # the screen reads a name with `ux-audit`/`architecture-audit` as a critique, and a critique with a header and no `type:`
            # is a failed read (archdesign_text.critique_kind): an ERROR at any date, like the declared type without `status:`
            errors.append({"kind": "critique_header", "file": rel, "declared": None, "date": day,
                           "message": f"o nome diz crítica e o cabeçalho não tem `type:` - a tela do Control Center recusa o arquivo; dê o `type:` E o `status:` "
                                      f"na mesma edição ({near})"})
            continue
        what = ("sem `type:` no cabeçalho" if not declared else f"`type: {declared}` não está na lista de tipos")
        item = {"kind": "type", "file": rel, "declared": declared, "date": day, "message": f"{what} — {near}"}
        (errors if day and day >= since else warnings).append(item)
    counts["by_kind"] = {k: sum(1 for e in errors + warnings if e["kind"] == k) for k in KINDS}
    return {"errors": errors, "warnings": warnings, "counts": counts}


def _profile_ok(root):
    return (root / CONTRACT_FILE).is_file()


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    as_json = "--json" in argv
    root = Path(args[0] if args else ".").resolve()
    if not root.is_dir():
        print(f"report_types_check: {root} não é uma pasta - não avaliável", file=sys.stderr)
        return 2
    if not _profile_ok(root):
        print(f"report_types_check: {root.name} sem {CONTRACT_FILE} - não avaliável", file=sys.stderr)
        return 2
    try:
        lst = load_list()
    except ListError as e:
        print(f"report_types_check: {e} - não avaliável", file=sys.stderr)
        return 2
    r = check(root, lst)
    ok = not r["errors"]
    if as_json:
        print(json.dumps({"project": root.name, "ok": ok, "required_since": lst["required_since"], **r}, ensure_ascii=False, indent=2))
        return 0 if ok else 1
    since = lst["required_since"]
    by = {k: ([e for e in r["errors"] if e["kind"] == k], [e for e in r["warnings"] if e["kind"] == k]) for k in KINDS}
    parts = [f"{len(er)} erro(s) e {len(wa)} aviso(s) de «{KINDS[k]}»" for k, (er, wa) in by.items() if er or wa]
    if ok:
        print(f"report_types_check: {root.name} - VERDE: {r['counts']['typed']} de {r['counts']['reports']} relatórios têm tipo da lista"
              + ("; " + "; ".join(parts) + f" (aviso: relatório anterior a {since} sem tipo — leia o conteúdo, escolha o tipo e some `type:` ao cabeçalho; "
                 "sem tipo que sirva, pergunte ao MJRP)" if parts else ""))
    else:
        print(f"report_types_check: {root.name} - VERMELHO: " + "; ".join(parts))
    for k, (er, wa) in by.items():
        for e in er:
            print(f"  {e['file']}: [{k}] {e['message']}")
        for e in wa:
            print(f"  [aviso] {e['file']}: [{k}] {e['message']}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
