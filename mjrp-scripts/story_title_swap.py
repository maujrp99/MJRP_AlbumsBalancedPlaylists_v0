#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""story_title_swap.py — the mechanical swap of a story's title for its sentence (F172, UAT-479). No model writes text here.

  plan  <root> [-o out.json]   dry run: each story of <root> that would change, and the reason each other one is left as it is.
  apply <root> [-o out.json]   writes the stories `plan` says are swappable. Each is judged by the sensor's own functions
                               (story_form_problems and story_title_problems) before it is written, and a diff that touches more than
                               the title and the sentence's old place is refused.

The sentence moves word for word: the H1 (`# <id> · <sentence>`) takes the Portuguese sentence, the bold first line of `## en` takes
the English one, and the paragraph that held each sentence before leaves its section. The frontmatter, the ID, the status, `accepted_in`,
the criteria and every other line stay byte for byte. A story is left as it is, with the reason, when it has no statement (a note), its
«para que» (or «so that») still waits for the human, its H1 has no « · », its sentence is not in a form or is over the limit, its
sentence is not the first paragraph, or its English does not fit the form.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401,E402  (the scripts folder on sys.path, F73 R17)
import requirements_graph_check as g  # noqa: E402
import story_rewrite as sr  # noqa: E402

HERE = Path(__file__).resolve().parent
PT, EN = "pt-BR", "en"
PLACEHOLDER = re.compile(r"a escrever|to be written|\?")
WAITING = {PT: re.compile(r"\bpara que\b", re.I), EN: re.compile(r"\bso that\b|\bso I can\b", re.I)}


def rules():
    return json.loads((HERE / "requirements_graph_rules.json").read_text(encoding="utf-8"))


def section(lines, lang):
    """(start, end) line indices of the `## <lang>` section's content, or None."""
    head = next((i for i, ln in enumerate(lines) if ln.strip() == f"## {lang}"), None)
    if head is None:
        return None
    end = next((i for i in range(head + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
    return head + 1, end


def fm_end(lines):
    """The index of the first line after the frontmatter's closing `---` (0 when there is none)."""
    if not lines or lines[0].strip() != "---":
        return 0
    close = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    return close + 1 if close is not None else 0


def h1_index(lines):
    """The index of the H1 that carries the title (`# <id> · <title>`), or None."""
    return next((i for i, ln in enumerate(lines) if ln.startswith("# ") and " · " in ln), None)


def fits(sentence, cfg, lang):
    return any(re.match(p, sentence) for p in cfg["forms"][lang].values())


def drop_with_blank(lines, start, s0, s1, end, drops):
    """Mark [start+s0, start+s1) for removal; the blank line after it goes too when the blank before it is there already (no doubled
    blank left behind)."""
    drops.update(range(start + s0, start + s1))
    after = start + s1
    if after < end and not lines[after].strip() and start + s0 - 1 >= start and not lines[start + s0 - 1].strip():
        drops.add(after)


def swap_one(text, cfg, langs):
    """(new_text, reason): new_text is the swapped file, or None with the reason it is left as it is."""
    lines = text.split("\n")
    fm, body = g.frontmatter(text)
    if str(fm.get("format") or "").strip() != "story":
        return None, "não é story"
    h1 = h1_index(lines)
    if h1 is None:
        return None, "o H1 não tem « · » — não há onde pôr a frase"
    pt_sec = section(lines, PT)
    if pt_sec is None:
        return None, "falta `## pt-BR`"
    start, end = pt_sec
    _, first, _ = sr.sentence_span(lines[start:end])
    _, _, s0, s1 = sr.statement_span(lines[start:end])
    if s0 == s1:
        if fits(lines[h1].split(" · ", 1)[1].strip(), cfg, PT):
            return None, "já está no formato"
        return None, "sem enunciado (é uma nota: a linha de origem e uma descrição)"
    if s0 != first:
        return None, "o enunciado não é o primeiro parágrafo de `## pt-BR`"
    pt_sentence = " ".join(ln.strip() for ln in lines[start + s0:start + s1])
    if not fits(pt_sentence, cfg, PT):
        return None, "a frase de `## pt-BR` não está numa das duas formas — não se troca às cegas"
    if not WAITING[PT].search(pt_sentence):
        return None, "o «para que» ainda não tem resultado — espera o MJRP"
    if PLACEHOLDER.search(pt_sentence):
        return None, "a frase tem marcador (a escrever / ?)"
    if len(pt_sentence) > cfg["max_chars"]:
        return None, f"a frase tem {len(pt_sentence)} caracteres, acima do teto de {cfg['max_chars']}"
    h1_title = lines[h1].split(" · ", 1)[1].strip()
    if fits(h1_title, cfg, PT) and h1_title != pt_sentence:
        return None, "o título já é outra frase — a troca não sobrescreve o que está no H1"
    replacements, drops = {}, set()
    prefix = lines[h1].split(" · ", 1)[0]
    replacements[h1] = f"{prefix} · {pt_sentence}"
    drop_with_blank(lines, start, s0, s1, end, drops)
    if EN in langs and (en_sec := section(lines, EN)) is not None:
        estart, eend = en_sec
        ti, _, es0, es1 = sr.statement_span(lines[estart:eend])
        if es0 == es1:
            return None, "`## en` sem enunciado"
        en_sentence = " ".join(ln.strip() for ln in lines[estart + es0:estart + es1])
        if not fits(en_sentence, cfg, EN):
            return None, "a frase de `## en` não está numa das duas formas"
        if not WAITING[EN].search(en_sentence) or PLACEHOLDER.search(en_sentence):
            return None, "a frase em inglês ainda não tem resultado ou tem marcador — espera o MJRP"
        if ti is not None:
            replacements[estart + ti] = f"**{en_sentence}**"
            drop_with_blank(lines, estart, es0, es1, eend, drops)
        else:
            replacements[estart + es0] = f"**{en_sentence}**"
            drops.update(range(estart + es0 + 1, estart + es1))
    replacements = {i: v for i, v in replacements.items() if lines[i] != v}
    if not replacements and not drops:
        return None, "já está no formato"
    head = fm_end(lines)
    if any(i < head for i in drops | set(replacements)):
        return None, "a troca tocaria a frontmatter — não gravado"
    kept = [replacements.get(i, ln) for i, ln in enumerate(lines) if i not in drops]
    new_text = "\n".join(kept)
    fm2, body2 = g.frontmatter(new_text)
    problems = g.story_form_problems(body2, langs, cfg) + g.story_title_problems(body2, langs, cfg)
    if problems:
        return None, "o sensor recusaria a troca: " + " · ".join(problems)
    return new_text, None


def scan(root):
    """(path, text, node id) of every story file under `root`/docs/specs/requirements."""
    base = Path(root).resolve() / "docs" / "specs" / "requirements"
    for f in sorted(base.rglob("*.md")):
        text = f.read_text(encoding="utf-8")
        fm, _ = g.frontmatter(text)
        if str(fm.get("format") or "").strip() == "story":
            yield f, text, str(fm.get("id") or f.stem)


def run(root, write):
    """The swap over `root`: the report (`swapped`, `left`), and the files written when `write`."""
    cfg, langs = rules()["story_form"], rules()["languages"]
    swapped, left = [], []
    for f, text, nid in scan(root):
        new_text, reason = swap_one(text, cfg, langs)
        rel = f.relative_to(Path(root).resolve()).as_posix()
        if new_text is None:
            left.append({"id": nid, "path": rel, "reason": reason})
            continue
        if write:
            f.write_text(new_text, encoding="utf-8")
        swapped.append({"id": nid, "path": rel})
    return {"swapped": swapped, "left": left, "counts": {"swapped": len(swapped), "left": len(left)}}


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("command", choices=["plan", "apply"])
    ap.add_argument("root")
    ap.add_argument("-o", "--out")
    args = ap.parse_args(argv)
    report = run(args.root, write=args.command == "apply")
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
    print(f"{args.command}: {report['counts']['swapped']} troca(s), {report['counts']['left']} deixada(s)")
    for item in report["left"]:
        print(f"  deixada {item['id']} ({item['path']}): {item['reason']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
