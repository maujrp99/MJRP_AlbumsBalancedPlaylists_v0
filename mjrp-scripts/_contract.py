# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_contract.py - how the harness scripts read the project contract (`.mjrp-project.yml`) and any YAML.

One reader for every sensor (F73 R7, audit 2026-10-25): 13 sensors used to import `read_yaml` and `CONTRACT` from
`doctor.py`, so they depended on the orchestrator that imports them back. They import this module instead.

  read_yaml(text)         PyYAML when present, a minimal parser when not; LENIENT - an unreadable text is `{}`
  read_yaml_strict(text)  raises UnreadableYaml where "nothing" would pass for a verdict (the contract, a frontmatter)
  CONTRACT                the contract's file name
  log_rel(root)           where the project's log lives (the contract's `session_history`, default docs/log.md)
"""
import re
from datetime import date
from pathlib import Path

try:
    import yaml                                    # when present, it is the one that parses
except ModuleNotFoundError:
    yaml = None                                    # when absent, the doctor parses on its own (see _yaml_min)


class YamlNaoSuportado(Exception):
    """The minimal parser hit YAML it cannot read. It SHOUTS instead of inventing."""


def _flow_items(text):
    """The items of a flow collection, split at the commas outside quotes. A comma inside a quoted string is text: the spec's `waiting: {reason: "a, b"}`
    used to read as a broken map, and the whole frontmatter came back empty (F153, 2026-11-04)."""
    items, current, quote = [], "", None
    for char in text:
        if quote:
            quote = None if char == quote else quote
        elif char in "\"'":
            quote = char
        elif char == ",":
            items.append(current)
            current = ""
            continue
        current += char
    items.append(current)
    return items


def _esc(v):
    v = v.strip()
    if not v or v.startswith("#"):
        return ""
    v = re.split(r"\s+#", v)[0].strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        return v[1:-1]
    # a flow collection that opens and never closes is not a string: PyYAML refuses it, and the minimal parser SHOUTS too instead of
    # reading `[unclosed` as text (F94, UAT-365: without PyYAML the strict reader let an unreadable block pass as a readable one)
    if (v.startswith("[") and not v.endswith("]")) or (v.startswith("{") and not v.endswith("}")):
        raise YamlNaoSuportado(f"coleção inline que não fecha — {v[:40]}")
    if v.startswith("[") and v.endswith("]"):
        return [x.strip().strip("\"'") for x in _flow_items(v[1:-1]) if x.strip()]
    if v.startswith("{") and v.endswith("}"):
        d = {}
        for par in _flow_items(v[1:-1]):
            if not par.strip():
                continue
            if ":" not in par:
                raise YamlNaoSuportado(f"mapa inline sem ':' — {v}")
            k, _, s = par.partition(":")
            d[k.strip()] = _esc(s)
        return d
    if v in ("true", "True"):
        return True
    if v in ("false", "False"):
        return False
    if v in ("null", "~", ""):
        return None
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
        return date.fromisoformat(v)               # F2 does arithmetic on dates: a string will not do
    return v


def _yaml_minimal(text):
    """Reads the subset of YAML the harness uses, without depending on PyYAML.

    Born from an incident: on 2026-09-08 the doctor did not run on the user's Mac because
    Homebrew 3.14 is externally managed and the contract's `pip install --user pyyaml` is
    refused. The doctor is the FRONT DOOR of any instance - requiring an install for it to run
    is friction exactly where there must be none.

    The first version SILENTLY DROPPED BLOCK LISTS: gates_open became a loose map, F2 saw no
    gate at all, and the report came out green by silence (2026-09-09, found by the selftest
    running on the user's machine). It now RAISES YamlNaoSuportado on anything it cannot read -
    and the doctor exits 2, not evaluable. A sensor that invents is worse than a sensor that is
    missing.
    """
    lines = []
    for bruta in text.splitlines():
        if not bruta.strip() or bruta.lstrip().startswith("#"):
            continue
        if bruta.lstrip().startswith(("%", "---", "...", "&", "*", "<<")):
            raise YamlNaoSuportado(f"construção fora do subconjunto — {bruta.strip()[:40]}")
        lines.append((len(bruta) - len(bruta.lstrip()), bruta.strip(), bruta))

    def block(i, ind):
        """Return (value, next index) of the block starting at i with indentation >= ind."""
        if i < len(lines) and lines[i][1].startswith("- "):
            seq = []
            while i < len(lines) and lines[i][0] >= ind and lines[i][1].startswith("- "):
                body = lines[i][1][2:].strip()
                # The ':' that decides scalar-vs-map has to be looked for in the body WITHOUT
                # its inline comment, and outside quotes. Otherwise `- pasta/  # nota: assim`
                # becomes a dict whose key is the path plus the comment. Found on 2026-09-10 by
                # doctor_selftest, which compares this parser against PyYAML on the real contract.
                escopo = "" if body[:1] in ("\"", "'") else re.split(r"\s+#", body)[0].strip()
                if body.startswith("{") or ":" not in escopo:
                    seq.append(_esc(body))
                    i += 1
                else:                              # an item that is a multi-line map
                    k, _, resto = body.partition(":")
                    item = {}
                    if resto.strip():
                        item[k.strip()] = _esc(resto)
                    i += 1
                    while i < len(lines) and lines[i][0] > ind and not lines[i][1].startswith("- "):
                        kk, _, vv = lines[i][1].partition(":")
                        item[kk.strip()] = _esc(vv)
                        i += 1
                    seq.append(item)
            return seq, i
        mapa = {}
        while i < len(lines):
            atual, body, _bruta = lines[i]
            if atual < ind:
                break
            if ":" not in body:
                raise YamlNaoSuportado(f"linha sem ':' fora de lista — {body[:40]}")
            chave, _, resto = body.partition(":")
            chave, resto = chave.strip(), resto.strip()
            if resto.startswith("#"):              # `key:   # comment` is still a block
                resto = ""
            elif not resto.startswith(("\"", "'")):
                resto = re.split(r"\s+#", resto)[0].strip()
            if resto in (">", "|", ">-", "|-"):    # bloco dobrado
                i += 1
                buf = []
                while i < len(lines) and lines[i][0] > atual:
                    buf.append(lines[i][1])
                    i += 1
                # o `>` do YAML termina em uma quebra (modo clip) — igualar ao PyYAML
                mapa[chave] = (" ".join(buf).strip() + "\n") if resto.startswith(">") and not resto.endswith("-") else " ".join(buf).strip()
            elif resto == "":
                if i + 1 < len(lines) and lines[i + 1][0] > atual:
                    mapa[chave], i = block(i + 1, lines[i + 1][0])
                elif i + 1 < len(lines) and lines[i + 1][1].startswith("- ") and lines[i + 1][0] == atual:
                    mapa[chave], i = block(i + 1, atual)       # lista alinhada com a chave
                else:
                    mapa[chave] = {}
                    i += 1
            else:
                mapa[chave] = _esc(resto)
                i += 1
        return mapa, i

    valor, _ = block(0, 0)
    return valor


class UnreadableYaml(ValueError):
    """F71 R13: the text is not a YAML mapping we can read. An unreadable file is NOT an empty one."""


def read_yaml_strict(text):
    """Like `read_yaml`, but a text that does not parse (or whose root is not a mapping) raises `UnreadableYaml` instead
    of becoming `{}`. Use it wherever "nothing there" would be read as a verdict (the contract, a skill's frontmatter)."""
    try:
        value = yaml.safe_load(text) if yaml is not None else _yaml_minimal(text)
    except Exception as e:
        raise UnreadableYaml((str(e).strip().splitlines() or [type(e).__name__])[0][:160]) from e
    value = value or {}
    if not isinstance(value, dict):
        raise UnreadableYaml("a raiz do arquivo não é um mapa chave: valor")
    return value


def read_yaml(text):
    """PyYAML when available; the minimal parser when not. The doctor runs either way.
    LENIENT: an unreadable text comes back as `{}`. Fine where "nothing" is a valid answer; where it would pass for a
    verdict (the contract, a skill's frontmatter) use `read_yaml_strict`."""
    if yaml is not None:
        try:
            return yaml.safe_load(text) or {}
        except Exception:
            return {}
    try:
        return _yaml_minimal(text) or {}
    except YamlNaoSuportado:                       # the same lenient answer PyYAML's branch gives to a text it cannot read
        return {}


CONTRACT = ".mjrp-project.yml"


def log_rel(root):
    """The project's log, relative to its root: `mjrp_harness.session_history` in the contract (content projects keep
    it in Core/log.md), default docs/log.md."""
    rel = "docs/log.md"
    contract = Path(root) / CONTRACT
    if contract.exists():
        try:
            data = read_yaml(contract.read_text(encoding="utf-8")) or {}
            rel = str((data.get("mjrp_harness") or {}).get("session_history") or rel).strip()
        except Exception:
            pass
    return rel
