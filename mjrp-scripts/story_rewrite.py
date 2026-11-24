#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""story_rewrite.py — the mechanics of the retroactive rewrite of story sentences (F164, UAT-467).

The rewrite itself is written by agents; this script is everything around it that must not be left to an agent:

  extract <root> [--ids S-1,S-2] [-o out.json]   the stories of <root> whose sentence is out of the template, as JSON: the
                                                 sentence and mirror as they are, the reasons the sensor gives, the status.
  check   <root> <rewrites.json> [-o out.json]   dry run: for each rewrite, the sensor's verdict on the NEW text, the diff that
                                                 would be written (only the sentence, the mirror, the notes), and the terms of the
                                                 old sentence that are in no place of the new text (`lost_terms`).
  apply   <root> <rewrites.json>                 writes the ones whose check passed; the rest is reported and left as it was.

A rewrite is `{"id": "S-48", "pt": {"sentence": "...", "examples": "...", "title": "..."},  "en": {...}}`: `sentence` is the new
one-sentence form; `examples` is the detail that left the sentence, kept in the `Exemplos para o AC:` / `Examples for the AC:` line
(merged into it when it exists); `title` is the bold mirror title, taken only when the section has none. Nothing else is written:
the frontmatter, the H1, the criteria, the `Origem:` line and every other line stay byte for byte (the check proves it).
Sensor judgment is `requirements_graph_check.story_form_problems`: the same function the commit hook uses, so what passes here passes there.
The script judges the form and finds the vanished terms; whether the MEANING stayed is for the agents that did not write the sentence.
"""
import argparse
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402  (the scripts folder on sys.path, F73 R17)
import requirements_graph_check as g  # noqa: E402

HERE = Path(__file__).resolve().parent

EXAMPLES_LABEL = {"pt-BR": "Exemplos para o AC:", "en": "Examples for the AC:"}
STOPWORDS = set("""
 para como quero quando que uma uns umas por com sem sobre entre ate seus suas dele dela isso essa esse esta este cada mais menos
 todo toda todos todas tudo seja sejam fica ficam pode podem possa possam tenha tenham sempre nunca ainda depois antes onde porque
 the and for with that this from into onto each have has had can will not are was were its their them they then than when what
 which while want wants being been does did too out all any one two per via his her him our your you
""".split())


def fold(text):
    return "".join(c for c in unicodedata.normalize("NFKD", text.casefold()) if not unicodedata.combining(c))


def terms(text):
    """The content words of `text`, folded and cut to a 5-letter stem (so «categorias» and «categoria» are the same term);
    a word with a digit, a dot, a dash or a slash (a number, a file, an ID) is kept whole."""
    out = set()
    for w in re.findall(r"[\w][\w./\-]*", fold(text)):
        w = w.strip(".-/")
        if not w or w in STOPWORDS:
            continue
        if re.search(r"[\d./\-_]", w):
            out.add(w)
        elif len(w) >= 4:
            out.add(w[:5])
    return out


def load(root):
    rules = json.loads((HERE / "requirements_graph_rules.json").read_text(encoding="utf-8"))
    graph = g.Graph(Path(root).resolve(), rules)
    graph.load_requirements()
    return rules, graph


def read_story(graph, nid):
    node = graph.nodes[nid]
    path = node["path"]
    text = path.read_text(encoding="utf-8")
    fm, body = g.frontmatter(text)
    return node, path, text, fm, body


def section_bounds(text, lang):
    """(start, end) character offsets of the content of the `## <lang>` section (after its header line), or None."""
    m = re.search(r"^## " + re.escape(lang) + r"[ \t]*\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    return (m.start(1), m.end(1)) if m else None


def sentence_span(lines):
    """(title_index, first, last_exclusive) of the sentence in the lines of a section, the same cut as `story_parts`."""
    i, title_i = 0, None
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i < len(lines) and g.STORY_TITLE_LINE.match(lines[i].strip()):
        title_i, i = i, i + 1
    while i < len(lines) and not lines[i].strip():
        i += 1
    first, j = i, i
    while j < len(lines):
        ln = lines[j].strip()
        if not ln or (j > first and (g.STORY_LABEL_LINE.match(ln) or g.STORY_CRITERIA_LINE.match(ln))):
            break
        j += 1
    return title_i, first, j


LABEL_FIRST = g.STORY_SOURCE_FIRST                  # the sensor owns the cut: one definition of «a note, not a story»
WANT = g.STORY_WANT


def _is_label(line):
    s = line.strip()
    if WANT.search(s.replace("*", "")):
        return False                       # «Como o MJRP, quero ver: …» has a colon early but it is the statement, not a label
    return bool(g.STORY_LABEL_LINE.match(s) or g.STORY_CRITERIA_LINE.match(s) or LABEL_FIRST.match(s))


def _statement_from(lines, k):
    """(s, j): the statement of the paragraph that starts at line k -- it begins after the label lines that open the paragraph («PRD:»,
    «Cabeçalho original:») and ends at a blank line, a label or a list item."""
    s = k
    while s < len(lines) and lines[s].strip() and _is_label(lines[s]):
        s += 1
    j = s
    while j < len(lines) and lines[j].strip() and not (j > s and _is_label(lines[j])):
        j += 1
    return s, j


def statement_span(lines):
    """(title_i, insert_at, s0, s1): where the new sentence goes, and the lines of the old statement it replaces. The statement is the first
    run of lines that says «quero» / «I want», after the label lines that may open its paragraph («Origem:», «PRD:», a header of priority,
    size and sprint) and up to the next label, list item or blank line. Everything else stays where it is, and the new sentence goes
    above the first paragraph (the template's place). With no «quero» anywhere, a first paragraph shaped like a story («Como …») is the
    statement; anything else is a note, not a story, and there is nothing to rewrite (the caller refuses)."""
    title_i, first, last = sentence_span(lines)
    if first >= len(lines):
        return title_i, first, first, first
    k = first
    while k < len(lines):
        while k < len(lines) and not lines[k].strip():
            k += 1
        if k >= len(lines):
            break
        s, j = _statement_from(lines, k)
        if s < j and WANT.search(" ".join(lines[s:j]).replace("*", "")):
            return title_i, first, s, j
        k = j if j > k else k + 1
    s, j = _statement_from(lines, first)
    if s < j and g.STORY_SHAPED.match(lines[s].strip()):
        return title_i, first, s, j
    return title_i, first, first, first


def part_of(rewrite, lang):
    """The block of `rewrite` for `lang`: the brief names the Portuguese one `pt`, the section is `pt-BR`."""
    return rewrite.get(lang) or (rewrite.get("pt") if lang == "pt-BR" else None)


def rewrite_text(text, rewrite, langs):
    """The file text with the sentences, titles and notes of `rewrite` written; (new_text, keep) where `keep` is the set of old line
    numbers (0-based, whole file) the rewrite is allowed to change."""
    allowed = set()
    # last section first: a rewrite shifts the lines after it, so the line numbers kept in `allowed` stay the old file's
    order = sorted((l for l in langs if part_of(rewrite, l)), key=lambda l: -(section_bounds(text, l) or (0, 0))[0])
    for lang in order:
        part = part_of(rewrite, lang)
        b = section_bounds(text, lang)
        if not b:
            raise ValueError(f"falta a seção `## {lang}`")
        before, sec, after = text[:b[0]], text[b[0]:b[1]], text[b[1]:]
        lines = sec.split("\n")
        title_i, ins, s0, s1 = statement_span(lines)
        if s0 >= len(lines) or s0 == s1:
            raise ValueError(f"`## {lang}`: não achei a frase")
        new = [part["sentence"].strip()]
        notes = (part.get("examples") or "").strip()
        label = EXAMPLES_LABEL[lang]
        ex_i = next((k for k in range(s1, len(lines)) if lines[k].strip().startswith(label)), None)
        if notes and ex_i is None:
            new.append(f"{label} {notes}")
        elif notes:
            current = lines[ex_i].strip()[len(label):].strip()
            if re.match(r"(?:a escrever|to be written)\b", current, re.I):
                lines[ex_i] = f"{label} {notes}"          # the placeholder the template left is replaced, not kept beside the note
            else:
                lines[ex_i] = lines[ex_i].rstrip().rstrip(".;") + "; " + notes
        base = before.count("\n")                  # the section's first line, in the file
        allowed.update(range(base + s0, base + s1))
        if notes and ex_i is not None:
            allowed.add(base + ex_i)
        if s0 == ins:
            lines[s0:s1] = new
        else:                                       # the source line first: the sentence goes above it, the old statement goes
            drop = s0 - 1 if s0 > 0 and not lines[s0 - 1].strip() else s0
            allowed.update(range(base + drop, base + s0))
            del lines[drop:s1]
            lines[ins:ins] = new + [""]
        if title_i is None and part.get("title") and lang != langs[0]:
            lines[ins:ins] = [f"**{part['title'].strip()}**", ""]
        text = before + "\n".join(lines) + after
    return text, allowed


def changed_only_allowed(old, new, allowed):
    """True when every old line the diff removes or replaces is one of `allowed` (insertions are free)."""
    a, b = old.split("\n"), new.split("\n")
    for tag, i1, i2, _, _ in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag in ("replace", "delete") and any(k not in allowed for k in range(i1, i2)):
            return False
    return True


def old_sentences(body, langs):
    """{lang: (title, statement)}: the statement the rewrite replaces (the sensor's sentence, or the later paragraph when the first
    one is a source line)."""
    out = {}
    for lang in langs:
        sec = g.lang_section(body, lang) or ""
        lines = sec.split("\n")
        title_i, ins, s0, s1 = statement_span(lines)
        title = g.STORY_TITLE_LINE.match(lines[title_i].strip()).group(1).strip() if title_i is not None else None
        out[lang] = (title, " ".join(ln.strip() for ln in lines[s0:s1]))
    return out


def check_one(rules, graph, rewrite, langs):
    nid = rewrite["id"]
    if nid not in graph.nodes:
        return {"id": nid, "ok": False, "problems": [f"{nid}: não existe neste projeto"]}
    node, path, text, fm, body = read_story(graph, nid)
    old = old_sentences(body, langs)
    try:
        new_text, allowed = rewrite_text(text, rewrite, langs)
    except ValueError as exc:
        return {"id": nid, "ok": False, "problems": [str(exc)]}
    _, new_body = g.frontmatter(new_text)
    problems = g.story_form_problems(new_body, langs, rules["story_form"])
    if not changed_only_allowed(text, new_text, allowed):
        problems.append("o texto novo mexe em linha que não é a frase nem a nota")
    lost = {}
    for lang in langs:
        haystack = " ".join((g.lang_section(new_body, lang) or "").split("\n"))
        gone = sorted(terms(old[lang][1]) - terms(haystack))
        if gone:
            lost[lang] = gone
    return {"id": nid, "ok": not problems, "problems": problems, "lost_terms": lost, "status": node.get("status"),
            "old": {lang: {"title": old[lang][0], "sentence": old[lang][1]} for lang in langs},
            "new": {lang: dict(zip(("title", "sentence"), g.story_parts(g.lang_section(new_body, lang)))) for lang in langs},
            "_text": new_text if not problems else None, "_path": str(path)}


def cmd_extract(args):
    rules, graph = load(args.root)
    langs = graph.languages()
    wanted = set(args.ids.split(",")) if args.ids else None
    out = []
    for nid in sorted(graph.nodes):
        node = graph.nodes[nid]
        if node.get("type") != "requirement" or not node.get("story_form") or (wanted and nid not in wanted):
            continue
        _, path, text, fm, body = read_story(graph, nid)
        if not graph.is_story(nid, fm):
            continue
        old = old_sentences(body, langs)
        pt_sentence = old[langs[0]][1]
        form = next((k for k, pat in rules["story_form"]["forms"][langs[0]].items() if re.match(pat, pt_sentence)), None)
        out.append({"id": nid, "path": str(path.relative_to(Path(args.root).resolve())), "status": node.get("status"),
                    "problems": node["story_form"], "pt_form_matches": form,
                    "sections": {lang: g.lang_section(body, lang) for lang in langs}})
    dump(out, args.o)
    print(f"{len(out)} story(ies) fora do template em {args.root}", file=sys.stderr)


def cmd_check(args, apply=False):
    rules, graph = load(args.root)
    langs = graph.languages()
    rewrites = json.loads(Path(args.rewrites).read_text(encoding="utf-8"))
    results, written = [], 0
    for rw in rewrites:
        r = check_one(rules, graph, rw, langs)
        if apply and r["ok"]:
            Path(r["_path"]).write_text(r["_text"], encoding="utf-8")
            written += 1
        r.pop("_text", None), r.pop("_path", None)
        results.append(r)
    dump(results, getattr(args, "o", None))
    bad = [r for r in results if not r["ok"]]
    print(f"{len(results) - len(bad)} de {len(results)} passam no sensor" + (f"; {written} gravada(s)" if apply else ""), file=sys.stderr)
    for r in bad:
        print(f"  {r['id']}: " + " · ".join(r["problems"]), file=sys.stderr)
    return 1 if bad and apply else 0


def dump(data, path):
    text = json.dumps(data, ensure_ascii=False, indent=1)
    if path:
        Path(path).write_text(text + "\n", encoding="utf-8")
    else:
        print(text)


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("extract"); e.add_argument("root"); e.add_argument("--ids"); e.add_argument("-o")
    c = sub.add_parser("check"); c.add_argument("root"); c.add_argument("rewrites"); c.add_argument("-o")
    a = sub.add_parser("apply"); a.add_argument("root"); a.add_argument("rewrites"); a.add_argument("-o")
    args = ap.parse_args(argv)
    if args.cmd == "extract":
        return cmd_extract(args) or 0
    return cmd_check(args, apply=args.cmd == "apply")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
