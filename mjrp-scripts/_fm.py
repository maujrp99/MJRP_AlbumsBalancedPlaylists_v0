# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_fm.py - the one frontmatter reader of the harness scripts (F73 R4, audit 2026-10-25).

The same `---` block was read by hand in 12 files, each with its own regex and its own idea of what a quoted value or a
list is: a YAML with quotes or a list could be green in one sensor and red in another. Here there is one splitter and
three readings of the block it finds:

  split(text)             -> (block | None, body)    the raw YAML block between the two `---` lines, and what follows
  block(text)             -> str                     the raw block, "" when there is none
  parse(text, strict)     -> dict                    the block as YAML (`_contract`); strict raises UnreadableYaml
  parse_with_body(text)   -> (dict, body)
  scalars(text)           -> dict[str, str]          flat one-line pairs: quotes and a trailing comment stripped
  skill_fields(text)      -> dict[str, str]          the flat `key: value` pairs of a SKILL.md, folded blocks (`>`/`|`)
                                                     joined on one line and the outer quotes stripped; no PyYAML needed

Three sensors keep their own reading on purpose, because the catalog pins them as the pattern of a canonical item
(content_audit_check, record_shapes_check, report_types_check, tech_stack_check) or because they mirror the Control
Center's strict reader (product_structure_check); touching them is a catalog rebaseline, which is the MJRP's.
"""
import re

from _contract import read_yaml, read_yaml_strict

_BLOCK = re.compile(r"\A﻿?---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)", re.S)
_KEY = re.compile(r"^([A-Za-z][\w-]*):\s*(.*)$")
_FOLD_MARKS = (">", "|", ">-", "|-")


def split(text):
    """(raw block, body); (None, text) when the text does not open with a `---` block that closes."""
    text = text or ""
    m = _BLOCK.match(text)
    return (m.group(1), text[m.end():]) if m else (None, text)


def block(text):
    return split(text)[0] or ""


def parse(text, strict=False):
    """The frontmatter as a dict; {} when there is none. `strict=True`: a block that exists but does not parse raises
    `UnreadableYaml` instead of reading as an empty one (F71 R13)."""
    raw = split(text)[0]
    if raw is None:
        return {}
    if strict:
        return read_yaml_strict(raw)
    data = read_yaml(raw)
    return data if isinstance(data, dict) else {}


def parse_with_body(text):
    raw, body = split(text)
    if raw is None:
        return {}, body
    data = read_yaml(raw)
    return (data if isinstance(data, dict) else {}), body


def scalars(text):
    """Flat `key: value` pairs of the frontmatter, one line each: a quoted value loses its quotes, an unquoted one loses a trailing
    `# comment`. No folded blocks (use `skill_fields` for a SKILL.md)."""
    raw = split(text)[0]
    out = {}
    for k, v in re.findall(r"^([\w-]+):[ \t]*(.*)$", raw or "", re.M):
        v = v.strip()
        if v[:1] in "\"'" and v:
            q = v[0]
            end = v.find(q, 1)
            v = v[1:end] if end > 0 else v[1:]
        else:
            v = re.sub(r"\s+#.*$", "", v).strip()
        out[k] = v
    return out


def skill_fields(text):
    """Flat `key: value` pairs of a SKILL.md frontmatter, without PyYAML. A folded/literal block and indented
    continuation lines are joined with a space; a value wrapped in one pair of quotes loses them."""
    raw = split(text)[0]
    if raw is None:
        return {}
    out, key, buf = {}, None, []
    for line in raw.splitlines():
        m = _KEY.match(line)
        if m:
            if key:
                out[key] = " ".join(buf).strip()
            key, first = m.group(1), m.group(2).strip()
            buf = [] if first in _FOLD_MARKS else [first]
        elif key and (line.startswith("  ") or line.startswith("\t")):
            buf.append(line.strip())
    if key:
        out[key] = " ".join(buf).strip()
    for k, v in out.items():
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            out[k] = v[1:-1]
    return out
