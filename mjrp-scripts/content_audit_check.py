#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
r"""
content_audit_check.py - did the conform's CONTENT audit really run on this project? The judge of the `content-audit`
catalog item (content-audit@4: CM-0052, CM-0057, CM-0063, CM-0066).

Born 2026-10-17 (the MJRP): the canonical files the bootstrap produced in the children "did not come out good", and the
form check cannot tell. The closing audit of the conform has each item's `judge_skill` judge the content of its artifact.
The first version of this sensor read the REPORT's words (a row with «sólida» and a skill name) - and a table of 35 such
rows, written by the agent that ran the conform, closed the note (the independent critique of the branch, P0-1). So the
sensor now asks for the TRACE of each judge: a file the judging agent wrote itself, with its findings and anchors that exist.

What it reads, in `reports/audits/`:
  - the MAIN report, `*conformance-audit*.md` (the newest by its `judged:` time, or by file mtime when there is none): frontmatter
    `who_judged: separate-agent...`, `judged: "AAAA-MM-DD HH:MM"` and `content_p0: N` (a trailing `# comment` is fine); a table
    with one row per item that applies (the catalog, this item excluded), whose first cell names the item;
  - for each item WITH a `judge_skill`, the row names a JUDGE FILE, `*-content-<judge>.md`, that exists and has: frontmatter
    `type: content-judgment`, `who_judged: separate-agent...`, `judge_skill` = the item's, `judged` and `items: [...]` with the
    item; a section `### \`item\` — **sólida|fraca|errada**` whose verdict is the row's; and, under it, EVERY verdict (sólida too)
    leaves at least two anchored lines `- [ok|P0|P1|P2] path:line `quoted passage` — text`: the path is one of the ITEM'S OWN files (its
    catalog `path` or what its check reads - never `AGENTS.md` for a vision), the line (or range `10-14`) exists, and the quoted
    passage is what it says (whitespace normalized). A verdict that is not «sólida» also needs a P0/P1/P2 with its text, and
    «errada» a P0. The anchors exist so that faking the trace costs as much as reading the artifact; they do NOT prove that the judge
    thought - a script cannot. A P0 is closed by a re-read: `- [P0 fechado AAAA-MM-DD] ...`; an OPEN P0 anywhere fails, and the main
    report's `content_p0` has to say 0 (and equal the count);
  - an item with no judge: its row says «só a forma».

The QUESTIONS section of the report (`## Perguntas para o MJRP`) has its shape (`### P-NN · item: <catalog id or —> · <subject>`, one option per
line, the follow-up on its own line, the answer marks): `parse_questions` is the one parse, pure on text, that the Control Center mirrors;
`--parse-questions <report.md>` prints it as JSON. A shape problem is `questions_shape`, and THIS script only WARNS about it: the gap is the
clause of its own, `audit_questions_check.py` (label «perguntas fora da forma P-NN»), which reproves only in a child that applied CM-0063 (the
note that brings the skills with the shape) - a child that wrote its audit before having the skills is not failed for it. A mark with no
`decision` entry of the same time in the log that names the question and the report is always a WARNING (`mark_without_log`). A report with
no such section is not asked for one. Content-audit@4 (CM-0066, the decision policy): each OPEN question also carries `classe: b|c` (and
`por que o agente não podia:` on a `c`) - `questions_class`, a warning until the child applies CM-0066 and a gap, in the same clause, after it;
`classe: a` is not a question. The same note adds the policy's exit counts to the MAIN report's frontmatter, read like `content_p0`:
`avoidable_questions: N` and `bent_rules: N` (the open findings «pergunta evitável» / «regra dobrada», written as `- [P1] <name> · P-NN — …`
bullets; the count must equal the bullets); above 0, `audit_avoidable_open` / `audit_bent_rule_open` hold the close in a child that applied
CM-0066 (a warning before it). `--parse-questions` exits 1 on a shape or a class problem.

What is NOT a gap but is printed (`[aviso] anchor_aging`, `--json` `warnings`): an anchored LINE RANGE of an item file that changed in a commit AFTER the
judge file's `judged:` (`git log -L`; not the whole file - MEMORY.md and the log change every session) - the quoted passage may still be on its line while the fact moved (pedroso-incorp, 2026-10-18). The cure is a re-read.
The files that count as the item's own include the one the contract itself declares for it (`sensors.visual.config` for `visual-sensor`).

What is a gap (exit 1): audit_missing · audit_future (a date after now) · audit_before_note (judged before the newest `received`
stamp of ANY note, or before the last commit of the catalog = the last refresh) · audit_no_who · audit_p0_open ·
audit_row_missing · judge_file_missing · judge_file_invalid · judge_anchor_missing · (CM-0066 applied) audit_policy_count · audit_policy_unrecognized · audit_avoidable_open ·
audit_bent_rule_open. Exit 2: not evaluable. `--quiet`: gap lines only.

Usage:
  python3 mjrp-scripts/content_audit_check.py <project> [--quiet] [--json]
Stdlib only (ADR-0015); vendored into every child with the kernel, next to `conformance_check.py`.
"""
import fnmatch
import json
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _clock
import _fm
import _git
from _contract import log_rel

HERE = Path(__file__).resolve().parent
ITEM_ID = "content-audit"
AUDITS = "reports/audits"
JUDGE_FILE = re.compile(r"[\w.-]*-content-[\w-]+\.md")
_VERDICT = re.compile(r"(s[óo]lid|frac|errad)[ao]", re.I)
_SECTION = re.compile(r"^###\s+`?([\w-]+)(?:@\d+)?`?\s*[—–-]+\s*\**\s*(s[óo]lid[ao]|frac[ao]|errad[ao])\b", re.I | re.M)
_FINDING = re.compile(r"^\s*[-*]\s*\[(P[012]|ok)(?:\s+fechado\s+(\d{4}-\d{2}-\d{2}))?\]\s+(.+)$")
# `path:line` or `path:from-to`, then the QUOTED passage (backticks, or `>` up to the dash), then `— the text`
_ANCHOR = re.compile(r"^([\w./@-]+\.\w+):(\d+)(?:-(\d+))?\s+(?:`([^`]{6,})`|>\s*([^—]{6,}?))\s*(?:—\s*(.*))?$")
MIN_ANCHORS = 2
SLACK = timedelta(minutes=2)


def _frontmatter(text):
    return _fm.scalars(text)


def _stamp(value):
    """A `judged:` value -> naive datetime in Brasília time; None when it is not AAAA-MM-DD HH:MM (or AAAA-MM-DD)."""
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime((value or "").strip(), fmt)
        except ValueError:
            pass
    return None


def _now(cc):
    return cc._brasilia_now().replace(tzinfo=None)


def _last_refresh(root):
    """When the catalog was last committed in the project (the refresh-kernel), Brasília time; None without git or history."""
    return _last_commit(root, "mjrp-scripts/canonical_catalog.json")


def _last_commit(root, rel, lines=None):
    """When `rel` was last committed in the project (`git log -1 --format=%cI -- rel`), Brasília time; None without git or history.
    With `lines=(a, z)`: when THAT RANGE last changed (`git log -L a,z:rel`, which follows the lines through the history) - a file
    such as MEMORY.md or docs/log.md changes every session, but the anchored line may not have."""
    cmd = ["log", "-L", f"{lines[0]},{lines[1]}:{rel}", "-s", "-n", "1", "--format=%cI"] if lines else ["log", "-1", "--format=%cI", "--", rel]
    out = _git.text_or_none(root, *cmd, timeout=20)
    if not out:
        return None
    try:
        dt = datetime.fromisoformat(out)
    except ValueError:
        return None
    return _clock.to_naive(dt)


def _newest_received(cfg):
    r = (cfg.get("conformance") or {}).get("received") or {}
    ds = []
    for v in (r.values() if isinstance(r, dict) else []):
        if isinstance(v, date) and not isinstance(v, datetime):
            ds.append(v)
        else:
            s = _stamp(str(v))
            if s:
                ds.append(s.date())
    return max(ds) if ds else None


def newest_report(root):
    """(path, frontmatter, judged datetime) of the newest main report: by `judged:`, by the file's mtime when it has none."""
    best = None
    d = Path(root) / AUDITS
    for p in sorted(d.glob("*conformance-audit*.md")) if d.is_dir() else []:
        fm = _frontmatter(p.read_text(encoding="utf-8", errors="replace"))
        when = _stamp(fm.get("judged")) or datetime.fromtimestamp(p.stat().st_mtime)
        if best is None or when >= best[2]:
            best = (p, fm, when)
    return best if best else (None, {}, None)


def _norm(s):
    return " ".join(s.split())


def _dotted(cfg, key):
    cur = cfg
    for part in key.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


# the keys, under a contract key an item checks, that name a FILE or folder where the item's content lives
# (audit of pedroso-incorp, 2026-10-18, point 3: `sensors.visual.config` for visual-sensor)
DECLARED_FILE_KEYS = ("config", "path", "file", "dir")


def _declared_files(root, cfg, key):
    """The files/folders of the project that the contract itself declares under the dotted contract `key`."""
    out, value = set(), _dotted(cfg or {}, key)
    cands = [value] if isinstance(value, str) else [value.get(k) for k in DECLARED_FILE_KEYS] if isinstance(value, dict) else []
    for c in cands:
        if isinstance(c, str) and c.strip() and not c.startswith(("/", "..")) and (Path(root) / c.strip()).exists():
            out.add(c.strip())
    return out


def _item_files(it, root=None, cfg=None):
    """The patterns of the item's OWN files: its catalog `path`, every path/glob its check reads (a script clause reads none)
    and, for a `contract_key` clause, the file the contract itself declares there (`sensors.visual.config`)."""
    out = {it["path"]}
    def walk(c):
        if isinstance(c, list):
            for x in c:
                walk(x)
        elif isinstance(c, dict):
            for k in ("path", "glob"):
                if isinstance(c.get(k), str):
                    out.add(c[k])
            for k in ("paths",):
                if isinstance(c.get(k), list):
                    out.update(x for x in c[k] if isinstance(x, str))
            if c.get("kind") == "contract_key" and isinstance(c.get("key"), str) and root is not None:
                out.update(_declared_files(root, cfg, c["key"]))
            for k in ("any", "requires"):
                if k in c:
                    walk(c[k])
    walk(it.get("check"))
    return out


def _in_item(root, rel, it, cfg=None):
    for pat in _item_files(it, root, cfg):
        if any(ch in pat for ch in "*?["):
            if fnmatch.fnmatch(rel, pat):
                return True
        elif pat.endswith("/") or (Path(root) / pat).is_dir():
            if rel.startswith(pat.rstrip("/") + "/"):
                return True
        elif rel == pat:
            return True
    return False


def _anchor(root, it, text, cfg=None):
    """(key, None) when the anchor of a finding is good, else (None, reason). Good = it points into the item's own files, the
    line (or range) exists, and the QUOTED passage is what that line (or range) says, whitespace normalized."""
    m = _ANCHOR.match(text.strip())
    if not m:
        return None, "sem âncora `caminho:linha` seguida do trecho entre crases (ou depois de `>`)"
    rel, a, z = m.group(1), int(m.group(2)), int(m.group(3) or m.group(2))
    quote = _norm(m.group(4) or m.group(5) or "")
    if not _in_item(root, rel, it, cfg):
        return None, f"{rel} não é arquivo do item `{it['id']}` (o `path` do catálogo ou o que o check lê)"
    f = Path(root) / rel
    if not f.is_file():
        return None, f"{rel} não existe"
    lines = f.read_text(encoding="utf-8", errors="replace").splitlines()
    if not (1 <= a <= z <= len(lines)):
        return None, f"{rel}:{a}-{z} fora do arquivo ({len(lines)} linhas)"
    if quote not in _norm(" ".join(lines[a - 1:z])):
        return None, f"o trecho não está em {rel}:{a}" + (f"-{z}" if z != a else "")
    return (rel, a, z), None


def _judge_file(root, name, it, floor, last_refresh, now, row_verdict, cfg=None, warnings=None):
    """(gaps, open_p0) for one judge file read for one item. `warnings` (a list, optional) receives the AGING anchors."""
    rel = f"{AUDITS}/{name}"
    p = Path(root) / AUDITS / name
    if not p.is_file():
        return [f"judge_file_missing: a linha de `{it['id']}` cita {name}, que não existe em {AUDITS}/ - o juiz não deixou o rastro"], 0
    text = p.read_text(encoding="utf-8", errors="replace")
    fm = _frontmatter(text)
    out, bad = [], lambda why: out.append(f"judge_file_invalid: {rel} - {why}")
    if fm.get("type") != "content-judgment":
        bad("sem `type: content-judgment`")
    if not fm.get("who_judged", "").startswith("separate-agent"):
        bad("sem `who_judged: separate-agent` - o juiz não é um agente separado")
    if fm.get("judge_skill") != it["judge_skill"]:
        bad(f"`judge_skill` é {fm.get('judge_skill')!r}, o item `{it['id']}` pede `{it['judge_skill']}`")
    when = _stamp(fm.get("judged"))
    if when is None:
        bad("`judged:` ausente ou fora de AAAA-MM-DD HH:MM")
    else:
        if when > now + SLACK:
            bad(f"`judged: {fm.get('judged')}` está no futuro")
        if floor and when.date() < floor:
            bad(f"`judged: {fm.get('judged')}` é anterior à chegada da nota ({floor.isoformat()})")
        if last_refresh and when + SLACK < last_refresh:
            bad(f"`judged: {fm.get('judged')}` é anterior ao último refresh do kernel ({last_refresh.strftime('%Y-%m-%d %H:%M')})")
    items = re.findall(r"[\w-]+", fm.get("items", ""))
    if it["id"] not in items:
        bad(f"`items:` não traz `{it['id']}`")
    sections = {m.group(1): (m.start(), m.group(2)) for m in _SECTION.finditer(text)}
    if it["id"] not in sections:
        bad(f"sem a seção `### \\`{it['id']}\\` — **sólida|fraca|errada**`")
        return out, 0
    start, verdict = sections[it["id"]]
    nxt = [s for s, _ in sections.values() if s > start]
    body = text[start:min(nxt) if nxt else len(text)]
    findings = [(m.group(1), m.group(2), m.group(3)) for m in (_FINDING.match(l) for l in body.splitlines()) if m]
    open_p0 = sum(1 for sev, closed, _ in findings if sev == "P0" and not closed)
    good, why = {}, []
    for sev, _closed, ftext in findings:
        key, reason = _anchor(root, it, ftext, cfg)
        if key:
            good[key] = (sev, (_ANCHOR.match(ftext.strip()).group(6) or "").strip())
        else:
            why.append(reason)
    # AGING anchors (audit of pedroso-incorp, 2026-10-18, point 5): the quoted passage still sits on its line, but the file moved
    # AFTER the judge read it (a fact that changed elsewhere, `730db0e`, kept `[ok] prd.md:88` green). A warning, never a gap: a
    # commit after `judged:` is often the fix of the judge's own P0, and a re-read is the cure, not a blocked conform.
    if warnings is not None and when is not None:
        for rel_file, a, z in sorted(good):
            changed = _last_commit(root, rel_file, (a, z))      # the anchored RANGE, not the file: MEMORY.md and the log move every session
            if changed and changed > when + SLACK:
                where = f"{rel_file}:{a}" + (f"-{z}" if z != a else "")
                warnings.append(f"anchor_aging: {where} (âncora de `{it['id']}` em {rel}) mudou em {changed.strftime('%Y-%m-%d %H:%M')}, "
                                f"depois do `judged: {when.strftime('%Y-%m-%d %H:%M')}` do juiz - releia a linha e atualize o `judged:`")
    kind = _VERDICT.match(verdict).group(1).lower()[:2]         # só / fr / er
    if row_verdict and _VERDICT.match(row_verdict).group(1).lower()[:2] != kind:
        bad(f"o veredito de `{it['id']}` aqui é {verdict.lower()} e a linha do relatório diz {row_verdict.lower()}")
    # EVERY verdict, «sólida» included, leaves at least MIN_ANCHORS anchors: a line of the item's own file, the quoted passage that
    # line says, and a line that exists. Faking that costs as much as reading (and a script cannot prove the judge thought).
    if len(good) < MIN_ANCHORS:
        out.append(f"judge_anchor_missing: {rel} - `{it['id']}` ({verdict.lower()}) tem {len(good)} âncora(s) boa(s), pede {MIN_ANCHORS}: "
                   f"`- [ok|P0|P1|P2] caminho:linha `trecho que a linha diz` — texto`, com o arquivo do item"
                   + (f" [{'; '.join(why[:2])}]" if why else ""))
    if kind != "só" and kind != "so":                          # fraca / errada: findings with their text
        with_text = [s for s, tx in good.values() if s in ("P0", "P1", "P2") and len(tx) >= 8]
        if not with_text:
            out.append(f"judge_anchor_missing: {rel} - `{it['id']}` é {verdict.lower()} e nenhum achado P0/P1/P2 ancorado traz o texto do achado (`— …`)")
        if kind == "er" and not any(s == "P0" for s, tx in good.values()):
            bad(f"`{it['id']}` é errada e não traz nenhum achado P0 com âncora boa")
    return out, open_p0


# ---- the report's QUESTIONS section (`## Perguntas para o MJRP`): one shared parse, read by the Control Center too -------------
# Born 2026-10-18 (the MJRP; the UX critique of the F40 screen): a free-form list lost options, glued a follow-up onto the last
# option and left the screen guessing the catalog item. The shape is fixed (bootstrap references `conformance-audit-questions` and
# `conformance-audit-answers`); this is its ONE parse - pure functions on text, stdlib only, so the screen can mirror them.
#
#   ### P-07 · item: prd · Métricas do PRD            <- the heading: id, ONE catalog id or `—`, subject; single spaces
#   perguntada em 2026-10-18 12:40                    <- optional (a question added by a re-read)
#   classe: c                                         <- b | c (content-audit@4, CM-0066): why the question is the human's
#   por que o agente não podia: <text>                <- required on class c: the approved rule there is none to derive from
#   <question text, any lines before the first option>
#   - a) option, one line, no wrapping                <- letters in order from a; a trailing ` (Recomendado)` marks the recommended
#   Seguimento (sem opções): a follow-up, own line    <- at most one; it has its own answer line
#   → respondida em 2026-10-18 14:05: (b)             <- the human's answer: (b) | (a, c) | (outra) <his words>
#   → seguimento respondido em 2026-10-18 14:06: <text>
#   conferida na releitura de 2026-10-18 15:00        <- optional
#
# A question is OPEN until it has a mark and, when it has a follow-up, the follow-up's answer line. The screen keeps an answered
# question visible (mark + the log entry) and only takes it out of "aguardando".
QUESTIONS_SECTION = re.compile(r"^##[ \t]+Perguntas para o MJRP[ \t]*$", re.M)
QUESTIONS_NOTE = "CM-0063"                      # the child that applied this note has the skills of the shape: its shape problems are errors
CLASS_NOTE = "CM-0066"                          # the child that applied this note has the decision policy: an open question with no/odd class is an error
_Q_STAMP = r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2})"
_Q_HEAD = re.compile(r"^### (P-\d{2,}) · item: (\S+) · (\S.*)$")
_Q_OPT = re.compile(r"^- ([a-z])\) (\S.*)$")
_Q_FOLLOW = re.compile(r"^Seguimento \(sem opções\): (\S.*)$")
_Q_MARK = re.compile(r"^→ respondida em " + _Q_STAMP + r": (.*)$")
_Q_FMARK = re.compile(r"^→ seguimento respondido em " + _Q_STAMP + r": (\S.*)$")
_Q_ASKED = re.compile(r"^perguntada em " + _Q_STAMP + r"$")
_Q_CHECKED = re.compile(r"^conferida na releitura de " + _Q_STAMP + r"$")
_Q_CLASS = re.compile(r"^classe: (\S.*)$")
_Q_WHY_NOT = re.compile(r"^por que o agente não podia: (\S.*)$")
_Q_NONE = re.compile(r"^(Nenhuma pergunta|Sem perguntas)\b")
_Q_ITEM = re.compile(r"^[a-z][a-z0-9-]*$")
_Q_RECOMMENDED = " (Recomendado)"


def _q_stamp(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M")
    except (TypeError, ValueError):
        return None


def parse_questions(text, catalog_ids=None, now=None):
    """(questions, problems) of the report's `## Perguntas para o MJRP` section. `catalog_ids`: the item ids of the catalog (None = do
    not check `item:` against it). `now`: a naive datetime; a stamp after it is a problem (None = not checked). No section: ([], []).
    A question: {id, item, subject, line, asked_at, options: {letter: text}, recommended, follow_up, marks: [{at, letters, other, line}],
    follow_up_answers: [{at, text, line}], state: 'open' | 'answered', follow_up_open: bool, classe: str|None, why_not: str|None}.
    A problem is `linha N: ...` (1-based, in the file). The class lines are READ here but judged in `class_problems` (a gate of its own: CLASS_NOTE)."""
    lines = text.splitlines()
    start = next((i for i, l in enumerate(lines) if QUESTIONS_SECTION.match(l)), None)
    if start is None:
        return [], []
    end = next((i for i in range(start + 1, len(lines)) if re.match(r"^## ", lines[i])), len(lines))
    questions, problems, seen_ids, cur, stray, text_seen = [], [], set(), None, [], False

    def bad(i, msg):
        problems.append(f"linha {i + 1}: {msg}")

    def close(q):
        if q is None:
            return
        if len(q["options"]) < 2:
            bad(q["line"] - 1, f"{q['id']}: a pergunta tem {len(q['options'])} opção(ões) `- a) …`, pede ao menos 2 (uma opção por linha)")
        if sum(1 for t in q["options"].values() if t.endswith(_Q_RECOMMENDED)) > 1:
            bad(q["line"] - 1, f"{q['id']}: mais de uma opção `(Recomendado)`")
        if q["follow_up_answers"] and not q["follow_up"]:
            bad(q["follow_up_answers"][0]["line"] - 1, f"{q['id']}: `→ seguimento respondido` sem uma linha `Seguimento (sem opções): …`")
        q["follow_up_open"] = bool(q["follow_up"]) and not q["follow_up_answers"]
        q["state"] = "answered" if q["marks"] and not q["follow_up_open"] else "open"
        questions.append(q)

    for i in range(start + 1, end):
        raw = lines[i]
        s = raw.rstrip()
        if s.startswith("###") and not s.startswith("####"):
            close(cur)
            cur = None
            m = _Q_HEAD.match(s)
            if not m or "  " in s:
                bad(i, "o título não tem a forma `### P-NN · item: <id do catálogo ou —> · <assunto>` (um espaço entre as partes, o ponto médio ` · `, um só item)")
                if not re.match(r"^### (P-\d{2,})\b", s):
                    continue
                cur = {"id": re.match(r"^### (P-\d{2,})\b", s).group(1), "item": None, "subject": "", "line": i + 1}
            else:
                cur = {"id": m.group(1), "item": m.group(2), "subject": m.group(3), "line": i + 1}
                if m.group(2) != "—" and not _Q_ITEM.match(m.group(2)):
                    bad(i, f"{cur['id']}: `item: {m.group(2)}` não é um id de item do catálogo nem `—` (um item só; o resto vai no texto, `também: <id>`)")
                elif m.group(2) != "—" and catalog_ids is not None and m.group(2) not in catalog_ids:
                    bad(i, f"{cur['id']}: `item: {m.group(2)}` não existe no catálogo (mjrp-scripts/canonical_catalog.json)")
            if cur["id"] in seen_ids:
                bad(i, f"{cur['id']} aparece duas vezes (o id é único e não se renumera)")
            seen_ids.add(cur["id"])
            cur.update({"asked_at": None, "options": {}, "recommended": None, "follow_up": None, "marks": [],
                        "follow_up_answers": [], "checked_at": None, "classe": None, "why_not": None})
            text_seen = False
            continue
        if not s.strip():
            continue
        if cur is None:
            if not _Q_NONE.match(s):
                stray.append(i)
            continue
        has_options = bool(cur["options"])
        m = _Q_OPT.match(s)
        if m:
            want = chr(ord("a") + len(cur["options"]))
            if m.group(1) != want:
                bad(i, f"{cur['id']}: a opção é `{m.group(1)})`, a próxima letra é `{want})` (letras em ordem a partir de a, sem repetir)")
            if cur["follow_up"] or cur["marks"]:
                bad(i, f"{cur['id']}: opção depois do seguimento ou da marca (as opções vêm juntas, antes)")
            if "Seguimento (sem opções)" in m.group(2):
                bad(i, f"{cur['id']}: o seguimento está colado na opção `{m.group(1)})` — ele vai em linha própria, depois de uma linha em branco")
            cur["options"][m.group(1)] = m.group(2)
            if m.group(2).endswith(_Q_RECOMMENDED):
                cur["recommended"] = m.group(1)
            continue
        m = _Q_FOLLOW.match(s)
        if m:
            if cur["follow_up"]:
                bad(i, f"{cur['id']}: mais de um seguimento — o segundo é uma pergunta própria")
            if not has_options:
                bad(i, f"{cur['id']}: o seguimento vem depois das opções")
            cur["follow_up"] = m.group(1)
            continue
        m = _Q_MARK.match(s)
        if m:
            at, choice = _q_stamp(m.group(1)), m.group(2).strip()
            mark = {"at": m.group(1), "letters": [], "other": None, "line": i + 1}
            if at is None:
                bad(i, f"{cur['id']}: a marca tem data inválida `{m.group(1)}`")
            elif now is not None and at > now:
                bad(i, f"{cur['id']}: a marca é de {m.group(1)}, depois de agora")
            if not has_options:
                bad(i, f"{cur['id']}: marca antes das opções")
            mo = re.match(r"^\(outra\) (\S.*)$", choice)
            ml = re.match(r"^\(([a-z](?:, [a-z])*)\)$", choice)
            if mo:
                mark["other"] = mo.group(1)
            elif ml:
                mark["letters"] = ml.group(1).split(", ")
                missing = [x for x in mark["letters"] if x not in cur["options"]]
                if missing or len(set(mark["letters"])) != len(mark["letters"]):
                    bad(i, f"{cur['id']}: a marca escolhe `{choice}`, que não é opção da pergunta (opções: {', '.join(cur['options']) or 'nenhuma'}) ou repete letra")
            else:
                bad(i, f"{cur['id']}: a marca não traz a escolha — `(x)`, `(a, c)` ou `(outra) <texto>` (achei `{choice[:40]}`)")
            cur["marks"].append(mark)
            continue
        m = _Q_FMARK.match(s)
        if m:
            if _q_stamp(m.group(1)) is None or (now is not None and _q_stamp(m.group(1)) > now):
                bad(i, f"{cur['id']}: a resposta do seguimento tem data inválida ou futura `{m.group(1)}`")
            cur["follow_up_answers"].append({"at": m.group(1), "text": m.group(2), "line": i + 1})
            continue
        m = _Q_ASKED.match(s)
        if m:
            if _q_stamp(m.group(1)) is None:
                bad(i, f"{cur['id']}: `perguntada em` com data inválida")
            cur["asked_at"] = m.group(1)
            continue
        m = _Q_CHECKED.match(s)
        if m:
            if _q_stamp(m.group(1)) is None:
                bad(i, f"{cur['id']}: `conferida na releitura de` com data inválida")
            cur["checked_at"] = m.group(1)
            continue
        m = _Q_CLASS.match(s)
        if m:
            if has_options or text_seen:
                bad(i, f"{cur['id']}: `classe:` vem logo abaixo do título, antes do texto da pergunta e das opções")
            if cur["classe"] is not None:
                bad(i, f"{cur['id']}: mais de uma linha `classe:` (uma só, logo abaixo do título)")
            cur["classe"] = m.group(1).strip()
            continue
        m = _Q_WHY_NOT.match(s)
        if m:
            if has_options or text_seen:
                bad(i, f"{cur['id']}: `por que o agente não podia:` vem logo abaixo do título, antes do texto da pergunta e das opções")
            if cur["why_not"] is not None:
                bad(i, f"{cur['id']}: mais de uma linha `por que o agente não podia:` (uma só, logo abaixo do título)")
            cur["why_not"] = m.group(1).strip()
            continue
        if s.lstrip().startswith("→"):
            bad(i, f"{cur['id']}: linha de marca fora da forma `→ respondida em AAAA-MM-DD HH:MM: (x)` / `→ seguimento respondido em AAAA-MM-DD HH:MM: <texto>`")
            continue
        if s.lstrip().startswith(("- ", "* ")):
            bad(i, f"{cur['id']}: item de lista fora da forma `- a) …` (uma opção por linha, letra e parêntese)")
            continue
        if has_options:
            bad(i, f"{cur['id']}: linha depois das opções que não é opção, seguimento nem marca — uma opção quebrada em duas linhas? (cada opção cabe numa linha)")
        else:
            text_seen = True                                   # the question text: the class lines must come before it
    close(cur)
    if stray:
        bad(stray[0], f"{len(stray)} linha(s) de texto fora de uma pergunta `### P-NN · item: <id> · <assunto>` (a seção só tem perguntas nessa forma; uma lista numerada é a forma antiga)")
    return questions, sorted(problems, key=lambda p: int(p.split()[1].rstrip(":")))


def class_problems(questions):
    """The decision policy on the questions (content-audit@4, CM-0066): every OPEN question to the MJRP carries `classe: b` (a fact or an action
    only the human has) or `classe: c` (a product choice with no approved rule to derive from); a class c carries `por que o agente não podia: …`.
    `classe: a` is not a question at all (derivable, or technical and reversible: the agent decides, records and takes it out). [str], `linha N: ...`.
    An answered question is history and is not asked for the class. Whether the class is TRUE (a «c» that is really «a») is the judge's finding."""
    out = []
    for q in questions:
        if q["state"] == "answered":
            continue
        at, c = q["line"], q["classe"]
        if c is None:
            out.append(f"linha {at}: {q['id']}: sem `classe: b` ou `classe: c` logo abaixo do título (b = fato ou ação só do humano; c = escolha de produto sem regra aprovada de que derivar)")
        elif c == "a":
            out.append(f"linha {at}: {q['id']}: `classe: a` não é pergunta — o que se deriva de regra aprovada, ou é técnico, organizacional e reversível, o agente decide, registra (`decidido pelo agente — revisável`) e tira daqui")
        elif c not in ("b", "c"):
            out.append(f"linha {at}: {q['id']}: `classe: {c}` — a classe é `b` ou `c`")
        elif c == "c" and not q["why_not"]:
            out.append(f"linha {at}: {q['id']}: `classe: c` sem a linha `por que o agente não podia: …` (que regra aprovada falta para derivar a resposta)")
    return sorted(out, key=lambda p: int(p.split()[1].rstrip(":")))


def marks_without_log(questions, report_name, log_text):
    """The marks (and follow-up answers) that no `decision` entry of the log backs: a mark needs `## [AAAA-MM-DD HH:MM] decision — …` at the
    SAME time whose text names the question (`P-NN`) and the report file. [str]; empty when `log_text` is None (the log could not be read).
    This sees an ABSENT entry only: an agent that writes a false mark AND a false entry passes - the re-read of the correction round is the
    other half (the residual is stated in the conformance-notes History)."""
    if log_text is None:
        return []
    entries = {}
    for m in re.finditer(r"^## \[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\] ([\w-]+) — [^\n]*\n(?:.*?)(?=^## \[|\Z)", log_text, re.M | re.S):
        entries.setdefault(m.group(1), []).append((m.group(2), m.group(0)))
    out = []
    for q in questions:
        for kind, at, line in ([("marca", mk["at"], mk["line"]) for mk in q["marks"]]
                               + [("resposta do seguimento", fa["at"], fa["line"]) for fa in q["follow_up_answers"]]):
            token = re.compile(r"(?<![\w-])" + re.escape(q["id"]) + r"(?!\d)")
            backed = any(typ == "decision" and token.search(body) and report_name in body for typ, body in entries.get(at, []))
            if not backed:
                out.append(f"mark_without_log: linha {line}: {q['id']} tem a {kind} de {at}, mas o log não tem uma entrada `## [{at}] decision — …` "
                           f"que cite {q['id']} e {report_name}")
    return out


def question_findings(text, strict, catalog_ids=None, now=None, log_text=None, report_name="", class_strict=False):
    """(errors, warnings) for the questions section: the shape problems are errors when `strict` (the child applied QUESTIONS_NOTE) and
    warnings otherwise; the class problems (`questions_class`) likewise with `class_strict` (the child applied CLASS_NOTE); a mark with no
    log entry is always a warning."""
    questions, problems = parse_questions(text, catalog_ids, now)
    shaped = [f"questions_shape: {p}" for p in problems]
    errors, warns = (shaped, []) if strict else ([], shaped)
    classed = [f"questions_class: {p}" for p in class_problems(questions)]
    if class_strict:
        errors += classed
    else:
        warns += classed
    warns += marks_without_log(questions, report_name, log_text)
    return errors, warns


def questions_gate(root):
    """(errors, warnings, error|None) of the NEWEST report's questions section, in the project `root`: the clause `audit_questions_check.py`.
    Strict (errors) only when the project's `conformance.applied` has QUESTIONS_NOTE. No report: nothing to judge here (the presence is
    the other clause's)."""
    root = Path(root).resolve()
    sys.dont_write_bytecode = True
    import conformance_check as cc
    cfg, err = cc.load_child(root)
    if err:
        return [], [], err
    path, _fm, _judged = newest_report(root)
    if path is None:
        return [], [], None
    catalog = cc.find_catalog(root) or (cc.CATALOG_FILE if cc.CATALOG_FILE.is_file() else None)
    try:
        ids = {it["id"] for it in cc.load_catalog(catalog)} if catalog else None
    except cc.CatalogError:
        ids = None
    applied = (cfg.get("conformance") or {}).get("applied") or []
    errors, warns = question_findings(path.read_text(encoding="utf-8", errors="replace"), QUESTIONS_NOTE in applied, ids, _now(cc) + SLACK,
                                      _read_log(root), path.name, CLASS_NOTE in applied)
    rel = path.relative_to(root).as_posix()
    return [f"{rel}: {e}" for e in errors], [f"{rel}: {w}" for w in warns], None


def _read_log(root):
    """The project's log text; "" when the file does not exist (a mark has no entry to stand on); None when it cannot be located or read."""
    try:
        path = Path(root) / log_rel(root)
    except Exception:
        return None
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except FileNotFoundError:
        return ""
    except OSError:
        return None


_POLICY_FINDINGS = {
    "avoidable_questions": ("pergunta evitável", re.compile(r"^[ \t]*[-*][ \t]*\[P1\][ \t]+pergunta evitável\b", re.M | re.I)),
    "bent_rules": ("regra dobrada", re.compile(r"^[ \t]*[-*][ \t]*\[P1\][ \t]+regra dobrada\b", re.M | re.I)),
}


_FINDINGS_SECTION = re.compile(r"^##[ \t]+Achados sobre as perguntas e as recomendações[ \t]*$", re.M)
_FINDING_CLOSED = re.compile(r"^[ \t]*[-*][ \t]*\[P1 fechado \d{4}-\d{2}-\d{2}\][ \t]+(pergunta evitável|regra dobrada)\b", re.I)


def policy_findings(fm, text, strict, rel):
    """(gaps, warnings) of the decision policy's two exit counts (content-audit@4, CM-0066): the auditor writes each open «pergunta evitável» /
    «regra dobrada» as a bullet `- [P1] <name> · P-NN — …` (closed: `[P1 fechado AAAA-MM-DD]`, which does not count) and declares the number of
    open ones in the frontmatter (`avoidable_questions`, `bent_rules`), like `content_p0`. The count must equal the bullets, and above 0 the
    conform does not close. `strict` = the child applied CLASS_NOTE: a gap; before it, a warning (a report written before the skills is not failed),
    and a missing field warns only when there are bullets."""
    gaps, warns = [], []
    sink = gaps if strict else warns
    for key, (name, rx) in _POLICY_FINDINGS.items():
        actual, declared = len(rx.findall(text)), fm.get(key)
        if declared is None or not re.fullmatch(r"\d+", declared):
            if strict:
                gaps.append(f"audit_policy_count: {rel} sem `{key}: N` no frontmatter - o número de achados «{name}» abertos não está declarado")
            elif actual:
                warns.append(f"audit_policy_count: {rel} tem {actual} achado(s) «{name}» e não declara `{key}: N` no frontmatter")
            continue
        if int(declared) != actual:
            sink.append(f"audit_policy_count: {rel} declara {key}: {declared}, a seção de achados tem {actual} «{name}» aberto(s) (`- [P1] {name} · P-NN — …`)")
        if max(int(declared), actual) > 0:
            label = "audit_avoidable_open" if key == "avoidable_questions" else "audit_bent_rule_open"
            sink.append(f"{label}: {max(int(declared), actual)} achado(s) «{name}» aberto(s) em {rel} - o conform não fecha com nenhum "
                        f"(corrija, depois a releitura troca por `[P1 fechado AAAA-MM-DD]` e atualiza o número)")
    # a near-miss spelling (`pergunta-evitável`, `[P2] …`, a bullet with no name) would escape the count: inside the findings section, every bullet
    # or `[P…]` line must be an open finding, a closed one, or the text is not a list item. Outside the section, or with no bullets at all, the
    # script sees nothing - that residual is the auditor's re-read (stated in conformance-notes).
    sm = _FINDINGS_SECTION.search(text)
    if sm:
        rest = text[sm.end():]
        nxt = re.search(r"(?m)^## ", rest)
        for line in (rest[:nxt.start()] if nxt else rest).splitlines():
            if re.match(r"^[ \t]*([-*]|\[P\d)", line) and not _FINDING_CLOSED.match(line) and not any(rx.match(line) for _n, rx in _POLICY_FINDINGS.values()):
                sink.append(f"audit_policy_unrecognized: {rel}: a linha `{line.strip()[:70]}` da seção de achados não é `- [P1] pergunta evitável · P-NN — …`, "
                            f"`- [P1] regra dobrada · P-NN — …` nem `- [P1 fechado AAAA-MM-DD] …` - escrita fora da forma, ela não entra na contagem")
    return gaps, warns


def _new_in_grace(cc, it, cfg, today):
    """True for an item the child has not been through yet and whose own grace is still running: the kernel brought it (a `received` stamp, or the
    project reads the kernel in place) but none of its notes - the current one or a superseded one - is in `conformance.applied`, and today is not
    past its `grace_until`. The audit asks no row for it: the row of an item whose note the child may still apply is a duty from the grace's end
    on (an item the child already applied in an older version keeps its row). Only the MISSING row is excused - a row that is there is judged."""
    applied = set((cfg.get("conformance") or {}).get("applied") or [])
    chain = {it["migration"]} | {s.get("migration") for s in it.get("superseded") or [] if s.get("migration")}
    if applied & chain:
        return False
    if not (cc.kernel_in_repo(cfg) or cc.received_date(it, cfg)):
        return False
    return today <= cc.grace_until(it, cfg)


def problems(root, warnings=None):
    """(list of gap lines, error or None). `warnings` (a list, optional) receives the lines that are NOT a gap (`anchor_aging`)."""
    root = Path(root).resolve()
    sys.dont_write_bytecode = True
    import conformance_check as cc
    cfg, err = cc.load_child(root)
    if err:
        return [], err
    catalog = cc.find_catalog(root) or (cc.CATALOG_FILE if cc.CATALOG_FILE.is_file() else None)   # the one beside this script
    if catalog is None:
        return [], "o projeto não tem mjrp-scripts/canonical_catalog.json - rode `new_project.py <esta pasta> --refresh-kernel`"
    try:
        items = cc.load_catalog(catalog)
    except cc.CatalogError as e:
        return [], str(e)
    now = _now(cc)
    path, fm, judged = newest_report(root)
    if path is None:
        return [f"audit_missing: nenhum {AUDITS}/AAAA-MM-DD-<projeto>-conformance-audit.md - a auditoria de conteúdo do conform não rodou"], None
    out, rel = [], path.relative_to(root).as_posix()
    floor, last_refresh = _newest_received(cfg), _last_refresh(root)
    if judged > now + SLACK:
        out.append(f"audit_future: {rel} é de {judged.strftime('%Y-%m-%d %H:%M')}, depois de agora")
    m = re.match(r"^(\d{4}-\d{2}-\d{2})-", path.name)
    if m and date.fromisoformat(m.group(1)) > now.date():
        out.append(f"audit_future: o nome de {rel} traz uma data depois de hoje")
    if floor and judged.date() < floor:
        out.append(f"audit_before_note: {rel} é de {judged.strftime('%Y-%m-%d %H:%M')}, anterior à nota mais nova que o projeto recebeu ({floor.isoformat()}) - "
                   f"cada conform que traz notas pede uma auditoria nova")
    if last_refresh and judged + SLACK < last_refresh:
        out.append(f"audit_before_note: {rel} é anterior ao último refresh do kernel ({last_refresh.strftime('%Y-%m-%d %H:%M')}) - rode a auditoria de novo")
    if not fm.get("who_judged", "").startswith("separate-agent"):
        out.append(f"audit_no_who: {rel} sem `who_judged: separate-agent` no frontmatter")
    text = path.read_text(encoding="utf-8", errors="replace")
    _q_errors, q_warns = question_findings(text, False, {it["id"] for it in items}, now + SLACK, _read_log(root), path.name)
    if warnings is not None:
        warnings.extend(q_warns)
    rows = [l for l in text.splitlines() if l.lstrip().startswith("|")]
    has_screen = cc.child_has_screen(root, cfg)
    open_p0 = 0
    for it in items:
        if it["id"] == ITEM_ID or cc.applies(it, cfg, root, has_screen) is not True:
            continue
        mine = [l for l in rows if re.search(r"`" + re.escape(it["id"]) + r"(?:@\d+)?`", l.split("|")[1] if l.count("|") > 1 else "")]
        if not mine and _new_in_grace(cc, it, cfg, now.date()):
            if warnings is not None:
                warnings.append(f"item_in_grace: `{it['id']}` ainda não foi aplicado e está na carência (até {cc.grace_until(it, cfg).isoformat()}) - "
                                f"a linha dele na tabela só é cobrada depois da nota ou do fim da carência")
            continue
        if not mine:
            out.append(f"audit_row_missing: {rel} sem linha do item `{it['id']}` na tabela item por item")
            continue
        row = " ".join(mine)
        judge = it.get("judge_skill")
        if not judge:
            if "só a forma" not in row.lower():
                out.append(f"audit_row_missing: a linha de `{it['id']}` (sem juiz no catálogo) não diz «só a forma»")
            continue
        v = _VERDICT.search(row)
        files = JUDGE_FILE.findall(row)
        if not v or judge not in row:
            out.append(f"audit_row_missing: a linha de `{it['id']}` não traz o veredito de conteúdo (sólida/fraca/errada) de `{judge}`")
        if not files:
            out.append(f"judge_file_missing: a linha de `{it['id']}` não cita o arquivo do juiz (`AAAA-MM-DD-<projeto>-content-<juiz>.md`) - "
                       f"veredito sem rastro não vale, nem «sólida»")
            continue
        gaps, p0 = [], 0
        for name in dict.fromkeys(files):
            aging = []
            g, p0 = _judge_file(root, name, it, floor, last_refresh, now, v.group(0) if v else None, cfg, aging)
            gaps = g
            if not g:
                if warnings is not None:
                    warnings.extend(aging)
                break
        out += gaps
        open_p0 += p0
    declared = fm.get("content_p0")
    if declared is None or not re.fullmatch(r"\d+", declared):
        out.append(f"audit_p0_open: {rel} sem `content_p0: N` no frontmatter - o P0 de conteúdo aberto não está declarado")
    elif int(declared) != open_p0:
        out.append(f"audit_p0_open: {rel} declara content_p0: {declared}, os arquivos dos juízes têm {open_p0} P0 aberto(s)")
    if open_p0 > 0:
        out.append(f"audit_p0_open: {open_p0} P0 de conteúdo aberto nos arquivos dos juízes - a nota só se aplica com nenhum (feche com `[P0 fechado AAAA-MM-DD]` depois da releitura)")
    p_gaps, p_warns = policy_findings(fm, text, CLASS_NOTE in ((cfg.get("conformance") or {}).get("applied") or []), rel)
    out += p_gaps
    if warnings is not None:
        warnings.extend(p_warns)
    return out, None


def _parse_cli(argv):
    """`--parse-questions <report.md>`: the parse of the questions section as JSON (what the screen reads) and its problems; exit 1 with problems."""
    i = argv.index("--parse-questions")
    if i + 1 >= len(argv) or not Path(argv[i + 1]).is_file():
        print("content_audit_check: --parse-questions pede o caminho de um relatório")
        return 2
    sys.dont_write_bytecode = True
    ids = None
    try:
        import conformance_check as cc
        ids = {it["id"] for it in cc.load_catalog(cc.CATALOG_FILE)}
    except Exception:
        pass
    questions, problems_ = parse_questions(Path(argv[i + 1]).read_text(encoding="utf-8", errors="replace"), ids)
    class_ = class_problems(questions)
    print(json.dumps({"questions": questions, "problems": problems_, "class_problems": class_}, ensure_ascii=False, indent=2))
    return 1 if problems_ or class_ else 0


def main(argv):
    if "--parse-questions" in argv:
        return _parse_cli(argv)
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    warns = []
    gaps, err = problems(args[0], warns)
    if err:
        print(f"content_audit_check: {err} (não avaliável)")
        return 2
    if "--json" in argv:
        print(json.dumps({"gaps": gaps, "warnings": warns}, ensure_ascii=False, indent=2))
    elif gaps:
        if "--quiet" not in argv:
            print("content_audit_check: a auditoria de conteúdo do conform não está feita")
        for g in gaps:
            print(g)
    elif "--quiet" not in argv:
        print("content_audit_check: auditoria de conteúdo presente, com o rastro de cada juiz e nenhum P0 aberto")
    if warns and "--json" not in argv and "--quiet" not in argv:
        for w in warns:
            print(f"[aviso] {w}")
    return 1 if gaps else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
