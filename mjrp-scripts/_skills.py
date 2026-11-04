# cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_skills.py - the SKILL.md side of the checks: where the skills are, and the digest that says whether one changed (F73 R7).

`find_skills`, `skill_digest` and `normalize_skill_text` are the ONE definition shared by the doctor's C1 (installed x source)
and by cowork_sync_check (what is installed in Cowork x the repository); a digest computed two ways would disagree about
the same file.
"""
import hashlib
import json
import re

import _fm


INSTALLED_DIRS = [".agent/skills", "skills", ".claude/skills"]


def _unquote(val):
    """The value of a frontmatter scalar without its quotes. A double-quoted one is read as the JSON string the AI Platform
    writes (2026-10-19: `\\u2014`, `\\"`, `\\\\`, `\\n`), a single-quoted one as YAML (`''`)."""
    val = val.strip()
    if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
        q = val[0]
        if q == '"':
            try:
                return str(json.loads(val))
            except ValueError:
                return val[1:-1].replace('\\"', '"').replace("\\n", " ").replace("\\t", " ")
        return val[1:-1].replace("''", "'").replace("\\'", "'")
    return val


def _scalar(val):
    return re.sub(r"\s+", " ", _unquote(val)).strip()


def _flow_items(inner):
    """The `key: value` entries of a flow mapping body, split on the commas that sit outside quotes and brackets."""
    parts, depth, quote, cur = [], 0, None, ""
    for ch in inner:
        if quote:
            if ch == quote and not cur.endswith("\\"):
                quote = None
        elif ch in "\"'":
            quote = ch
        elif ch in "{[":
            depth += 1
        elif ch in "}]":
            depth -= 1
        elif ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
            continue
        cur += ch
    parts.append(cur)
    return parts


def normalize_skill_text(text):
    """Canonical form of a SKILL.md for hashing. Ignores what the packager/Cowork rewrites without changing the meaning: the
    `name:` line (it becomes a slug), the FORM of `description:` (a `>` block in the source vs. one quoted line in Cowork -
    finding 19/09: 20 false positives in #62), the JSON escapes of a one-line quoted value (`\\u2014`), a nested (indented
    children) or flow (`{a: b}`) mapping such as `metadata:` - all become `key.child: value` -, trailing spaces and the final
    newline. The body stays intact. 2026-10-19: old packaged versions were flagged «edited in Cowork»; both sides go through
    this one function."""
    t = text.replace("\r\n", "\n")
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", t, re.S)
    if not m:
        return "\n".join(l.rstrip() for l in t.split("\n")).strip()
    fm, body = m.group(1), m.group(2)
    lines = fm.split("\n")
    out, i = [], 0
    while i < len(lines):
        line = lines[i]
        km = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
        if not km:
            i += 1
            continue
        key, val = km.group(1), km.group(2).strip()
        i += 1
        if key == "name":
            continue
        if val in (">", "|", ">-", "|-"):
            buf = []
            while i < len(lines) and (lines[i].startswith(" ") or lines[i].strip() == ""):
                buf.append(lines[i].strip())
                i += 1
            out.append(f"{key}: {_scalar(' '.join(x for x in buf if x))}")
        elif val == "" and i < len(lines) and re.match(r"^\s+[A-Za-z_][\w-]*:", lines[i]):
            while i < len(lines) and (lines[i].startswith(" ") or lines[i].strip() == ""):
                cm = re.match(r"^\s+([A-Za-z_][\w-]*):\s*(.*)$", lines[i])
                if cm:
                    out.append(f"{key}.{cm.group(1)}: {_scalar(cm.group(2))}")
                i += 1
        elif val.startswith("{") and val.endswith("}"):
            for part in _flow_items(val[1:-1]):
                k, _, v = part.partition(":")
                if k.strip():
                    out.append(f"{key}.{_unquote(k)}: {_scalar(v)}")
        else:
            out.append(f"{key}: {_scalar(val)}")
    canon = "\n".join(sorted(out)) + "\n---\n" + "\n".join(l.rstrip() for l in body.split("\n")).strip()
    return canon.strip()


def skill_digest(path):
    """Hash do conteúdo canônico (ver normalize_skill_text) — mesmo algoritmo do
    cowork_sync_check.skill_digest(texto); mudou aqui, muda lá."""
    t = path.read_text(encoding="utf-8", errors="replace")
    return hashlib.sha256(normalize_skill_text(t).encode()).hexdigest()[:16]


def frontmatter(path, strict=False):
    """The YAML frontmatter of a markdown file as a dict; {} when there is none. `strict=True` (F71 R13): a frontmatter
    that exists but does not parse raises `UnreadableYaml` instead of reading as an empty one."""
    return _fm.parse(path.read_text(encoding="utf-8", errors="replace"), strict=strict)


def find_skills(base, dirs):
    """{nome: caminho do SKILL.md} varrendo <base>/<dir>/**/SKILL.md."""
    out = {}
    for d in dirs:
        root = base / d
        if not root.is_dir():
            continue
        for f in root.rglob("SKILL.md"):
            out.setdefault(f.parent.name, []).append(f)
    return out
