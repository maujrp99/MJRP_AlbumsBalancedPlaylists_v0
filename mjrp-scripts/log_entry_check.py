#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""log_entry_check.py -- every commit brings a new entry in the project log (S-61).

Born 2026-10-03 17:48: in the skills revision, four commits went out with no entry in docs/log.md, and on
2026-10-04 a context compaction found the human's latest decisions only in the AI Platform's summary, not in
the repository. The git hook commit-msg calls this script, so it guards every session that commits -- local or
in the cloud, on any AI Platform -- because git runs where the repository is.

Rule (MJRP, 2026-10-04 14:11):
  - every commit adds at least one new entry heading (`## [YYYY-MM-DD HH:MM] <type>`) to the log of each project
    it touches (the harness root, or a nested project with its own .mjrp-project.yml, such as apps/<app>/);
  - exempt: a commit that touches only derived files (folder-index.md, daily-checks/, _backups/), a merge,
    and a commit made by a declared scaffold script (environment MJRP_LOG_EXEMPT, set by new_project.py);
  - the entry goes to the log of the OWNING project only (2026-10-13, ADR-0020 D.1, accepted by the MJRP): when a
    commit touches more than one project, (a) if it touches any path the root contract declares in
    `mjrp_harness.log_owner.root_paths` the owner is the root, else (b) the owner is the project with the most
    non-derived files touched (the logs themselves do not count), a tie going to the root. The commit needs a new entry in the owner's log; the other
    projects it touches are dispensed (an extra entry in their log is allowed, never required). The declaration is
    read from the committed root contract (HEAD), like `self_logged`: the rule is decided in the contract, never at
    commit time, and a commit cannot edit the rule it is judged by. Born from the root log carrying pointer entries
    ("detail in the Control Center log") because the check demanded an entry in both logs (ADR-0020, S7);
  - exempt per project, a file that carries its own history (2026-10-11, ADR-0004 of the Control Center, accepted
    by the MJRP): the contract declares `mjrp_harness.self_logged: [{path, history}]`, and a commit is exempt in that
    project only when (i) it touches, in that project, only declared paths, and (ii) the staged blob of each one has,
    in its JSON `history` list, at least one item the base blob does not have (compared item by serialized item, so
    trimming the oldest items does not matter). A hand edit with no new history item still needs the log entry.
    The declaration is read from the committed contract (HEAD), never from the working tree. A declared `path` is
    an exact file, or (2026-10-26, CC-ADR-0030) a pattern in the NAME only: the folder is exact and `fnmatchcase`
    judges the name (`content/copy/*.json` covers `content/copy/tracking.json`, never `content/copy/sub/x.json`).
    Born from the
    Control Center's screen edit: its commit carried the agent's uncommitted log entry, and the agent's next commit
    was then refused for "no new entry" (audit 2026-10-10, finding #6);
  - exempt, the catalog marking (2026-10-14, CC-ADR-0014 section 6 and CC-ADR-0016 section 2, accepted by the MJRP):
    a declared self_logged path with `stamp: catalog-mark` does NOT get the generic rule above; it gets this narrow
    one, which also reads the commit message (`--msg <file>`, the "$1" of the commit-msg hook). The commit is exempt
    only when ALL FOUR hold: (1) it is the only non-derived file of the whole commit, of every project; (2) every
    new `history` item carries the same `batch` (YYYYMMDD-HHMMSS-<8 hex>) and a `change` that starts with
    `<path>: marcado ` or, all of them, `<path>: devolvido ` (never mixed), and the history only grows; (3) the
    subject is `catalog: <N> marking(s) from the screen, batch <batch>` (or `<N> return(s) to triage`), N being the
    number of new items, with exactly one `Catalog-editorial: <path> — <verdict>: <reason>` per new item, the same
    set of paths, verdicts and reasons as the history, and no `Co-Authored-By:`; (4) with `not_canonical`,
    `awaiting_item` and `history` removed, the base blob and the staged blob are equal. Any failure, or no message
    given, falls back to the normal rule (a new entry in the root log). Born so that a batch marked on the Control
    Center screen and committed by the human does not turn the root's F1 red once per batch;
  - exempt, the order of the features (2026-10-27, F114, CC-ADR-0029 section 3: «o `priority`, que não toca o log»): the commit
    is exempt when the ONLY staged file is `docs/specs/priority.md` of a project (the root's or a nested one's) and the
    message (`--msg <file>`) carries a `Human-prioritized: <value>` line and no `Co-Authored-By:`. Any other file along, no
    stamp, an empty stamp or an agent's co-author falls back to the normal rule. Born from UAT-389: the drag on the board's
    «Priorizada» prepared exactly this commit and the check refused it (`o log não está no commit`), so no order was ever saved;
  - --amend is judged against the parent of the commit being amended;
  - an entry is its whole heading line, so two entries in the same minute are two entries (2026-10-09: the second
    commit of a minute was refused as "no new entry");
  - a new entry's <type> is one of KINDS (2026-10-09 21:26: an entry went out as `decisão`, and the Control Center,
    which reads the log, broke on the unknown type);
  - a NEW entry's time may not be later than now, in the zone the contract declares (`mjrp_harness.locale.timezone`,
    Brasília by default), beyond TOLERANCE_MIN minutes (2026-10-19, harness-kaizen: twice in one day subagents wrote
    entries ahead of the clock -- 7 estimated entries up to 35 min ahead of their commits, and 5 entries in UTC, 3 h
    ahead -- and no sensor caught it). The clock is the system's, never the entry's; the zone is read from the
    committed contract of the owning project (HEAD, like the other rules), falling back to the root's. Only entries
    the commit adds are judged, never old ones; a merge is exempt, as above;
  - a new entry of the type `acceptance` also passes in the commit of the key list with `Human-passkey: enroll|revoke` (CC-ADR-0038);
  - a new entry of the type `acceptance` (CC-ADR-0024) needs a `Human-accepted:` or `Human-reopened:` line in the message: that type is
    the one the doctor's F1 does not count, so it is the human's acceptance commit's, never a session's;
  - a NEW entry that closes a conform (heading «conform fechado», «conform N fechado», «fechamento do conform…: fechado»; never
    «não fechado») has a source for every claim (2026-10-19, the MJRP Personal's agent: "the audit stays valid" with no word on
    which catalog): each claim carries the command that checked it and the catalog it was checked against (`catálogo` + `item@N`
    or a date), and that catalog is the current one; a claim without a source, or citing an older catalog, is refused. The
    entry is accepted only when the project's own reader says `catalog_compare.state == fresh` at the moment of the commit -
    an unreachable harness never closes a conform (2026-10-20, review P1-2);
  - going over it (git commit --no-verify) is the human's call, never the agent's.

The log path comes from the contract (`mjrp_harness.session_history`, for content projects Core/log.md);
default docs/log.md. Python 3 stdlib only (constitution, ADR-0015: this is core).

Usage:
  python3 mjrp-scripts/log_entry_check.py [--amend] [--msg <commit-message-file>]   (from the hook: judges what is staged)
  python3 mjrp-scripts/log_entry_check.py --insert <log.md> <entry.md>   (writes one entry above the newest one, never in the preamble)
  python3 mjrp-scripts/log_entry_check.py --headings <log.md>            (exit 1 when a `## ` line of the log is no entry)
Exit: 0 passed or exempt · 1 blocked.

UAT-529 (F209): a writer that does not go through the hook (the scheduled inventory, by the Cowork bridge) looked for the first
`## [` anywhere and put its entry INSIDE the preamble's line that shows the format; the next commit of every session was refused.
`--insert` puts the entry before the first line that IS an entry (`^## [AAAA-MM-DD HH:MM]`), and refuses to write a log that
would have a `## ` line the reader cannot read; `--headings` is the same check for a log already written.
"""
import fnmatch
import json
import os
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _clock
import _git

HERE = Path(__file__).resolve().parent
from _contract import CONTRACT, log_rel, read_yaml  # the same contract reading as the doctor (F73 R7)

ENTRY = re.compile(r"^## \[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\].*$", re.MULTILINE)
KIND = re.compile(r"^## \[[^\]]+\] *([^\s—]*)")
def answer_entry_ok(log_text, head):
    """The entry of type `answer` names its question in the title and its report in the body (CC-ADR-0039 section 9), or, for a batch of
    proposals of an agent, the batch in the title and the batch's file in the body (CC-ADR-0042 section 3)."""
    audit = re.search(r"\] answer — auditoria P-\d{2,}\b", head) is not None
    batch = re.search(r"\] answer — lote (\d{4}-\d{2}-\d{2}-\d{4}-[a-z0-9-]+)\s*$", head)
    if not audit and batch is None:
        return False
    at = (log_text or "").find(head)
    rest = (log_text or "")[at + len(head):] if at >= 0 else ""
    following = re.search(r"^## \[", rest, re.M)
    body = rest[: following.start()] if following else rest
    if batch is not None:
        return re.search(r"^- Lote: `reports/proposals/" + re.escape(batch.group(1)) + r"\.md`", body, re.M) is not None
    return re.search(r"^- Relatório: `[^`\n]+`", body, re.M) is not None


KINDS = ("session", "decision", "inventory", "ingest", "harness-feedback", "review", "acceptance", "answer", "step")   # the types the logs use;
# review: a critique pass (UX, architecture) pointing to its report — MJRP, 2026-10-09 22:49
# step: the small step of a feature (a prototype version, a retroactive pass); the Control Center card «Log recente» leaves it
# out and shows decisions and closings first -- F251, UAT-525
# acceptance: the entry the human's acceptance commit writes (CC-ADR-0024); the doctor's F1 does not count it as session state
DERIVED_NAMES = ("folder-index.md",)
# The catalog marking (CC-ADR-0014 section 6, CC-ADR-0016 section 2): the one `stamp` a contract may declare on a self_logged path.
STAMP_CATALOG_MARK = "catalog-mark"
BATCH = re.compile(r"^\d{8}-\d{6}-[0-9a-f]{8}$")
TRIAGE_KEYS = ("not_canonical", "awaiting_item", "history")   # the only catalog keys a marking commit may change
HISTORY_CHANGE = re.compile(r"^(?P<path>.+?): (?P<kind>marcado|devolvido) (?P<rest>.*)$", re.DOTALL)
MARK_REST = re.compile(r"^(?P<verdict>canônico|não canônico) pela tela — (?P<reason>.+)$", re.DOTALL)
STAMP_LINE = re.compile(r"^Catalog-editorial:", re.IGNORECASE)
PRIORITY_REL = "docs/specs/priority.md"   # CC-ADR-0029 section 3: the one file the order of the features rewrites, in each project
PRIORITY_STAMP = re.compile(r"^Human-prioritized:[ \t]*\S", re.IGNORECASE | re.MULTILINE)   # CC-ADR-0029
HUMAN_STAMP = re.compile(r"^Human-(?:accepted|reopened):[ \t]*\S", re.IGNORECASE | re.MULTILINE)   # CC-ADR-0024
STAMP_FORM = re.compile(r"^Catalog-editorial:[ \t]+(?P<path>.+?) — (?P<verdict>canônico|não canônico|devolvido): (?P<reason>.+)$",
                        re.IGNORECASE)
# CC-ADR-0038: a key enrolled or revoked is the same kind of commit, run by the server after the Touch ID. Only with this stamp and only in a commit of the list; `note-lost` is another act.
PASSKEY_STAMP = re.compile(r"^Human-passkey:[ \t]*(?:enroll|revoke)[ \t]+\S", re.IGNORECASE | re.MULTILINE)
PASSKEY_LIST = "apps/control-center/ops/passkeys/trusted.json"
CO_AUTHORED = re.compile(r"^Co-Authored-By:", re.IGNORECASE | re.MULTILINE)
DERIVED_DIRS = ("daily-checks/", "_backups/")
TOLERANCE_MIN = 2                      # a new entry may be at most this many minutes ahead of the clock
DEFAULT_TZ = _clock.TZ_NAME
STAMP_TIME = re.compile(r"^## \[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\]")
# 2026-11-05: a fragment of the log's own header, glued at the end of the Control Center log by a merge (`808b2ddb2`, 2026-10-31),
# broke the screen's log reader for five days, and no commit noticed: this check read only the new entries. Every `## ` line of a
# staged log, outside a code fence, must now be an entry the reader understands (the same shape as `repo_fs/log.py`'s `_ENTRY`).
HEADING = re.compile(r"^## \[(\d{4}-\d{2}-\d{2})(?: (\d{2}:\d{2}))?\][ \t]+([A-Za-z][A-Za-z0-9-]*)"
                     r"(?:[ \t]+(\([^)]*\)))?[ \t]+—[ \t]+(\S.*?)[ \t]*$")
FENCE = re.compile(r"^\s*(```|~~~)")


def bad_headings(text):
    """The line numbers of the `## ` lines, outside a fence, that are no entry the screen's reader can read."""
    out, in_fence = [], False
    for number, line in enumerate(text.splitlines(), start=1):
        if FENCE.match(line):
            in_fence = not in_fence
        if not in_fence and line.startswith("## ") and not HEADING.match(line):
            out.append(number)
    return out


# F71 R9: the deadline of every git call here, in seconds. This runs inside the commit hook: a git stuck on a locked index
# would hang the commit for good. Expiry answers exit 124, which every caller already reads as "git did not answer".
GIT_TIMEOUT = 60


def git(root, *args):
    return _git.run_tuple(root, *args, timeout=GIT_TIMEOUT)


def is_derived(path):
    name = path.rsplit("/", 1)[-1]
    if name in DERIVED_NAMES:
        return True
    return any(("/" + path).find("/" + d) != -1 for d in DERIVED_DIRS)


def project_of(root, path, projects):
    """The nested project that owns the path (longest prefix), or '' for the root project."""
    best = ""
    for p in projects:
        if p and path.startswith(p + "/") and len(p) > len(best):
            best = p
    return best


def nested_projects(root):
    _, out = git(root, "ls-files", "*.mjrp-project.yml", ".mjrp-project.yml")
    found = set()
    for line in out.splitlines():
        d = str(Path(line).parent)
        found.add("" if d == "." else d)
    found.add("")
    return found


def root_paths(root):
    """The repo-relative paths the committed root contract declares as always the root's (`log_owner.root_paths`):
    a folder (ends in `/`) or a file. Empty when there is no declaration; read from HEAD, never from the working tree."""
    code, text = git(root, "show", f"HEAD:{CONTRACT}")
    if code != 0:
        return []
    try:
        owner = (read_yaml(text) or {}).get("mjrp_harness", {}).get("log_owner") or {}
        items = owner.get("root_paths") or []
    except (AttributeError, TypeError, ValueError):
        return []
    if isinstance(items, str):
        items = [x.strip() for x in items.strip("[] ").split(",") if x.strip()]
    return [str(x).strip() for x in items if str(x).strip()] if isinstance(items, list) else []


def is_root_path(path, declared):
    return any(path == d or (d.endswith("/") and path.startswith(d)) for d in declared)


def owner_of(root, content, projects):
    """The one project that owes the log entry of a commit that touches several (ADR-0020 D.1): the root when any
    file is under `root_paths`; else the project with the most non-derived files; a tie goes to the root."""
    if any(is_root_path(f, root_paths(root)) for f in content):
        return ""
    logs = {log_path(root, p) for p in projects}
    work = [f for f in content if f not in logs] or content   # the log is the record of the work, it does not vote
    count = {}
    for f in work:
        proj = project_of(root, f, projects)
        count[proj] = count.get(proj, 0) + 1
    top = max(count.values())
    leaders = sorted(p for p, n in count.items() if n == top)
    return "" if "" in leaders else leaders[0]


def log_path(root, project):
    rel = log_rel(Path(root) / project if project else Path(root))
    return f"{project}/{rel}" if project else rel


def entries(root, spec):
    code, text = git(root, "show", spec)
    return set(ENTRY.findall(text)) if code == 0 else set()


def contract_timezone(root, project):
    """The IANA zone of the project's committed contract (`mjrp_harness.locale.timezone`), else the root's, else Brasília."""
    for contract in ([f"{project}/{CONTRACT}"] if project else []) + [CONTRACT]:
        code, text = git(root, "show", f"HEAD:{contract}")
        if code != 0:
            continue
        try:
            tz = ((read_yaml(text) or {}).get("mjrp_harness", {}).get("locale") or {}).get("timezone")
        except (AttributeError, TypeError, ValueError):
            tz = None
        if tz and str(tz).strip():
            return str(tz).strip()
    return DEFAULT_TZ


def now_in(tzname):
    """Now, naive, in the zone `tzname` -- from the system clock. Falls back to UTC-3 when the zone is unknown."""
    return _clock.now_naive(tzname)


def future_entry(head, tzname):
    """(entry time, real now) as `AAAA-MM-DD HH:MM` when the entry heading is later than now + tolerance, else None."""
    m = STAMP_TIME.match(head)
    if not m:
        return None
    try:
        stamped = datetime.strptime(m.group(1), "%Y-%m-%d %H:%M")
    except ValueError:
        return None
    now = now_in(tzname)
    if stamped > now + timedelta(minutes=TOLERANCE_MIN):
        return m.group(1), now.strftime("%Y-%m-%d %H:%M")
    return None


def self_logged(root, project):
    """{repo-relative path: (history field, stamp)} that the project's committed contract declares as self-logged.
    `stamp` is '' for the generic rule, or a name that selects a narrow rule (`catalog-mark`)."""
    contract = f"{project}/{CONTRACT}" if project else CONTRACT
    code, text = git(root, "show", f"HEAD:{contract}")
    if code != 0:
        return {}
    try:
        items = (read_yaml(text) or {}).get("mjrp_harness", {}).get("self_logged") or []
    except (AttributeError, TypeError, ValueError):
        return {}
    declared = {}
    for item in items if isinstance(items, list) else []:
        if isinstance(item, dict) and str(item.get("path") or "").strip():
            rel = str(item["path"]).strip().strip("/")
            declared[f"{project}/{rel}" if project else rel] = (str(item.get("history") or "history").strip(),
                                                                str(item.get("stamp") or "").strip())
    return declared


def declared_spec(declared, rel):
    """The (history field, stamp) a repo-relative path is declared with: the exact path, or a declaration whose last
    segment is a pattern for the NAME in that very folder (`fnmatchcase`; the folder part is never a pattern)."""
    if rel in declared:
        return declared[rel]
    folder, _, name = rel.rpartition("/")
    for path, spec in declared.items():
        head, _, tail = path.rpartition("/")
        if head == folder and fnmatch.fnmatchcase(name, tail):
            return spec
    return None


def history_items(root, spec, field):
    """The items of the JSON list `field` in the blob `spec`, serialized; None when the blob is absent or not JSON."""
    code, text = git(root, "show", spec)
    if code != 0:
        return None
    try:
        items = json.loads(text).get(field)
    except (ValueError, AttributeError):
        return None
    if not isinstance(items, list):
        return None
    return {json.dumps(item, sort_keys=True, ensure_ascii=False) for item in items}


def blob_json(root, spec):
    """The JSON object of the blob `spec`, or None when the blob is absent or not a JSON object."""
    code, text = git(root, "show", spec)
    if code != 0:
        return None
    try:
        data = json.loads(text)
    except ValueError:
        return None
    return data if isinstance(data, dict) else None


def message_lines(msg):
    """The lines of a commit message without the `#` comment lines that git strips in editor mode."""
    return [ln.rstrip() for ln in msg.splitlines() if not ln.startswith("#")]


def catalog_mark_exempt(root, path, history, content, base, has_head, msg):
    """The narrow rule of the catalog marking (CC-ADR-0014 section 6, CC-ADR-0016 section 2): True only when the four
    conditions hold. `msg` is the commit message text, or None when the hook did not pass it (then never exempt)."""
    if msg is None or not has_head:
        return False
    if content != [path]:                                           # 1. one file in the whole commit, of every project
        return False
    new_doc, old_doc = blob_json(root, f":{path}"), blob_json(root, f"{base}:{path}")
    if new_doc is None or old_doc is None:
        return False
    new_list, old_list = new_doc.get(history), old_doc.get(history)
    if not isinstance(new_list, list) or not isinstance(old_list, list):
        return False

    def ser(item):
        return json.dumps(item, sort_keys=True, ensure_ascii=False)

    new_count, old_count = Counter(ser(i) for i in new_list), Counter(ser(i) for i in old_list)
    if old_count - new_count:                                       # the history only grows: no item leaves
        return False
    added = list((new_count - old_count).elements())
    if not added:
        return False
    batches, kinds, expected = set(), set(), Counter()              # 2. only items of one batch and of one kind
    for raw in added:
        item = json.loads(raw)
        if (not isinstance(item, dict) or not BATCH.match(str(item.get("batch") or ""))
                or not isinstance(item.get("change"), str)):
            return False
        m = HISTORY_CHANGE.match(item["change"])
        if not m:
            return False
        batches.add(item["batch"])
        kinds.add(m.group("kind"))
        if m.group("kind") == "marcado":
            mm = MARK_REST.match(m.group("rest"))
            if not mm:
                return False
            expected[(m.group("path"), mm.group("verdict"), mm.group("reason"))] += 1
        else:                                                       # devolvido: the reason is what follows the first " — "
            _, sep, tail = m.group("rest").partition(" — ")
            expected[(m.group("path"), "devolvido", tail if sep else m.group("rest"))] += 1
    if len(batches) != 1 or len(kinds) != 1:
        return False
    batch, kind, n = next(iter(batches)), next(iter(kinds)), len(added)
    lines = message_lines(msg)                                      # 3. the message agrees with the history
    subject = next((ln for ln in lines if ln.strip()), "")
    want = (f"catalog: {n} marking(s) from the screen, batch {batch}" if kind == "marcado"
            else f"catalog: {n} return(s) to triage, batch {batch}")
    if subject != want or CO_AUTHORED.search("\n".join(lines)):
        return False
    stamps, found = [ln for ln in lines if STAMP_LINE.match(ln)], Counter()
    if len(stamps) != n:
        return False
    for ln in stamps:
        m = STAMP_FORM.match(ln)
        if not m:
            return False
        found[(m.group("path"), m.group("verdict").lower(), m.group("reason"))] += 1
    if found != Counter({(p, v.lower(), r): c for (p, v, r), c in expected.items()}):
        return False

    def untriaged(doc):                                             # 4. only the triage keys may differ
        return {k: v for k, v in doc.items() if k not in TRIAGE_KEYS}

    return untriaged(new_doc) == untriaged(old_doc)


def priority_exempt(files, projects, msg):
    """The narrow rule of the order of the features (F114, CC-ADR-0029 section 3): True only when the whole commit is ONE
    file, the `docs/specs/priority.md` of a project, and the message carries `Human-prioritized: <value>` and no
    `Co-Authored-By:`. `msg` is the commit message text, or None when the hook did not pass it (then never exempt)."""
    if msg is None or len(files) != 1:
        return False
    path = files[0]
    owner = project_of(None, path, projects)
    if path != (f"{owner}/{PRIORITY_REL}" if owner else PRIORITY_REL):
        return False
    text = "\n".join(message_lines(msg))
    return bool(PRIORITY_STAMP.search(text)) and not CO_AUTHORED.search(text)


def self_logged_exempt(root, project, files, base, has_head, content=None, msg=None):
    """True when every file of this project in the commit is self-logged and brings a new history item. A path
    declared with `stamp: catalog-mark` is judged ONLY by the narrow rule (it also needs the commit message)."""
    declared = self_logged(root, project)
    specs = {f: declared_spec(declared, f) for f in files}
    if not files or not declared or any(spec is None for spec in specs.values()):
        return False
    if any(spec[1] for spec in specs.values()):
        if len(files) != 1 or specs[files[0]][1] != STAMP_CATALOG_MARK:   # an unknown stamp is never an exemption
            return False
        return catalog_mark_exempt(root, files[0], specs[files[0]][0], content if content is not None else files,
                                   base, has_head, msg)
    for f in files:
        new = history_items(root, f":{f}", specs[f][0])
        old = (history_items(root, f"{base}:{f}", specs[f][0]) or set()) if has_head else set()
        if not new or not (new - old):
            return False
    return True


CLOSING_TITLE = re.compile(r"fechamento do conform|\bconform\b[^\n]*?\bfechad[oa]s?\b", re.IGNORECASE)   # the real forms: «conform fechado»,
# «conform 4 fechado», «fechamento do conform de AAAA-MM-DD: fechado» (review P2-4); «conform não fechado» is excluded below
NOT_CLOSED = re.compile(r"\bn[ãa]o\s+fechad", re.IGNORECASE)
SOURCE_COMMAND = re.compile(r"`[^`\n]*(python3|\.py\b|--[a-z])[^`\n]*`")
SOURCE_CATALOG = re.compile(r"catálogo[^\n]*?(\b[a-z][a-z-]*@\d+|\d{4}-\d{2}-\d{2})", re.IGNORECASE)
CATALOG_DATE = re.compile(r"catálogo[^\n]*?(\d{4}-\d{2}-\d{2})", re.IGNORECASE)
ITEM_REF = re.compile(r"\b([a-z][a-z-]*)@(\d+)\b(?!\s*→)")
CLAIM = re.compile(r"verde|\b0 (?:lacunas?|notas?|erros?)|lacunas?: ?0|segue valendo|sem lacuna|nenhuma (?:lacuna|nota)|exit 0|em dia|"
                   r"\bpass(?:a|ou|am|aram)\b|conforme|\bok\b", re.IGNORECASE)
CLAIM_SECTION = re.compile(r"fechamento|medi[çc]|verifica|resultado|afirma|confer", re.IGNORECASE)


def is_closing_entry(head):
    return bool(CLOSING_TITLE.search(head)) and not NOT_CLOSED.search(head)


def _bullets(lines):
    out, cur = [], None
    for line in lines:
        if re.match(r"^[-*] ", line):
            cur = [line]
            out.append(cur)
        elif cur is not None and line.startswith((" ", "\t")) and line.strip():
            cur.append(line)
        elif not line.strip():
            continue
        else:
            cur = None
    return [" ".join(x.strip() for x in b) for b in out]


def closing_problems(text, head, catalog=None):
    """The claims of a conform's closing entry that have no source, or a source that is not the current catalog.
    2026-10-19 (MJRP Personal's agent): the close said «a auditoria segue valendo» and nothing said against WHICH catalog; the
    catalog was the project's own stale copy. Every claim carries the command that checked it (a `code span` with python3, a
    .py or a --flag) and the catalog it was checked against (the word `catálogo` with an `item@N` or a date), and that catalog
    is the current one: an `item@N` below the project's catalog, or a date older than its `version`, is refused (review P2-4,
    2026-10-20). Which items are claims: with `###` subsections, those under a fechamento/medições/verificação section (the
    Decisões and Next Session of a save are not measurements); with none, the items that state a result («verde», «0 lacunas»,
    «segue valendo»...). `catalog` is the project's catalog document (dict) or None. Returns the first words of each offender."""
    start = text.find(head)
    if start < 0:
        return []
    body = text[start + len(head):]
    nxt = ENTRY.search(body)
    body = body[:nxt.start()] if nxt else body
    lines = body.splitlines()
    if any(l.startswith("### ") for l in lines):
        claims, keep = [], False
        for k, line in enumerate(lines):
            if line.startswith("### "):
                keep = bool(CLAIM_SECTION.search(line))
                continue
            if keep:
                claims.append(line)
        judged = _bullets(claims)
        if not judged:
            return ["(sem itens numa seção de fechamento/medições)"]
    else:
        every = _bullets(lines)
        if not every:
            return ["(a entrada não tem afirmações em lista)"]
        judged = [b for b in every if CLAIM.search(b)]
    items = {it.get("id"): it.get("version") for it in (catalog or {}).get("items", []) if isinstance(it, dict)}
    cat_version = str((catalog or {}).get("version") or "")
    bad = []
    for b in judged:
        if not (SOURCE_COMMAND.search(b) and SOURCE_CATALOG.search(b)):
            bad.append(b[:70])
            continue
        old = [f"{m.group(1)}@{m.group(2)}" for m in ITEM_REF.finditer(b)
               if m.group(1) in items and isinstance(items[m.group(1)], int) and int(m.group(2)) != items[m.group(1)]]
        d = CATALOG_DATE.search(b)
        if old:
            bad.append(f"cita {', '.join(old)}, que não é o catálogo atual: {b[:50]}")
        elif d and cat_version and d.group(1) < cat_version:
            bad.append(f"cita o catálogo de {d.group(1)}, anterior ao atual ({cat_version}): {b[:50]}")
    return bad


def reader_catalog_state(root, project):
    """What the project's own reader says about its catalog against the harness at this very moment: its `catalog_compare.state`,
    or a reason it could not say. The entry that closes a conform is accepted only on `fresh` (review P1-2, 2026-10-20)."""
    base = Path(root) / project if project else Path(root)
    reader = base / "mjrp-scripts" / "conformance_check.py"
    if not reader.is_file():
        return None, "o projeto não tem o leitor mjrp-scripts/conformance_check.py"
    try:
        r = subprocess.run([sys.executable, str(reader), ".", "--json"], cwd=base, capture_output=True, text=True, timeout=120)
        cmp_ = json.loads(r.stdout).get("catalog_compare")
    except Exception as e:
        return None, f"o leitor não respondeu ({type(e).__name__})"
    if not isinstance(cmp_, dict):
        return None, "o leitor é anterior à checagem de defasagem do catálogo"
    return cmp_.get("state"), ""


def project_catalog(root, project):
    rel = f"{project}/mjrp-scripts/canonical_catalog.json" if project else "mjrp-scripts/canonical_catalog.json"
    code, text = git(root, "show", f":{rel}")
    if code != 0:
        p = Path(root) / rel
        text = p.read_text(encoding="utf-8", errors="replace") if p.is_file() else ""
    try:
        return json.loads(text) if text else None
    except ValueError:
        return None


def check(root, amend=False, msg=None):
    """Returns a list of (project, log, reason) failures; empty list = pass. `msg` is the commit message text
    (only the catalog-mark exemption reads it)."""
    if os.environ.get("MJRP_LOG_EXEMPT"):
        print(f"[log_entry] isento: commit de script declarado ({os.environ['MJRP_LOG_EXEMPT']})")
        return []
    code, gitdir = git(root, "rev-parse", "--git-dir")
    if code == 0 and (root / gitdir.strip() / "MERGE_HEAD").exists():
        return []
    code, staged = git(root, "diff", "--cached", "--name-only", "--no-renames")
    if code != 0:
        # F71 R9: an empty list from a git that did not answer is not "nothing staged" -- it would approve the commit unjudged
        return [("git", "o log", f"o git não respondeu (exit {code}) ao listar o que está staged: não avaliável")]
    files = [f for f in staged.splitlines() if f.strip()]
    content = [f for f in files if not is_derived(f)]
    if not content:
        return []
    has_head = git(root, "rev-parse", "-q", "--verify", "HEAD")[0] == 0
    base = "HEAD~1" if amend else "HEAD"
    if amend and git(root, "rev-parse", "-q", "--verify", "HEAD~1")[0] != 0:
        has_head = False
    projects = nested_projects(root)
    if priority_exempt(files, projects, msg):
        print("[log_entry] isento: só o docs/specs/priority.md, com o carimbo Human-prioritized (CC-ADR-0029)")
        return []
    touched = sorted({project_of(root, f, projects) for f in content})
    if len(touched) > 1:
        touched = [owner_of(root, content, projects)]   # ADR-0020 D.1: only the owner's log needs the entry
    fails = []
    for proj in touched:
        mine = [f for f in content if project_of(root, f, projects) == proj]
        if self_logged_exempt(root, proj, mine, base, has_head, content, msg):
            print(f"[log_entry] isento ({proj or 'raiz'}): só arquivo self_logged, com histórico novo dentro dele")
            continue
        log = log_path(root, proj)
        if not (root / log).exists() and git(root, "cat-file", "-e", f":{log}")[0] != 0:
            continue  # project without a log yet (scaffold in progress): nothing to compare
        new = entries(root, f":{log}")
        old = entries(root, f"{base}:{log}") if has_head else set()
        where = proj or "raiz"
        if log in files:
            broken = bad_headings(git(root, "show", f":{log}")[1])
            if broken:
                fails.append((where, log, f"o log tem linha `## ` que não é entrada (linha {', '.join(map(str, broken[:5]))}): "
                                          f"o leitor da tela para nela e o card do log some inteiro; corrija a linha ou tire o pedaço"))
        if not (new - old):
            fails.append((where, log, "o commit não acrescenta entrada nova" if log in files
                          else "o log não está no commit"))
        for head in sorted(new - old):
            if is_closing_entry(head):
                state, why = reader_catalog_state(root, proj)
                if state != "fresh":
                    fails.append((where, log, f"a entrada de fechamento do conform `{head[:60]}` só entra se o leitor do projeto disser que o "
                                              f"catálogo está `fresh` em relação ao harness agora; ele disse {state or why!r}. Rode "
                                              f"`new_project.py <esta pasta> --refresh-kernel` (do harness) e o conform de novo; se o harness "
                                              f"não é alcançável, o conform não está fechado: registre-o como aberto, não como fechado"))
                bad = closing_problems(git(root, "show", f":{log}")[1], head, project_catalog(root, proj))
                if bad:
                    fails.append((where, log, f"a entrada de fechamento do conform `{head[:60]}` tem afirmação sem fonte ou com fonte velha: "
                                              f"«{bad[0]}»{' e mais ' + str(len(bad) - 1) if len(bad) > 1 else ''} — cada afirmação cita o "
                                              f"comando que a conferiu (`python3 mjrp-scripts/...`) e o catálogo ATUAL contra o qual "
                                              f"(`catálogo de AAAA-MM-DD`, `item@N`)"))
            kind = KIND.match(head).group(1)
            if kind not in KINDS:
                fails.append((where, log, f"a entrada `{head[:60]}` tem o tipo `{kind or '(vazio)'}`, fora de "
                                          f"{', '.join(KINDS)}"))
            if kind == "acceptance" and not HUMAN_STAMP.search(msg or "") and not (PASSKEY_STAMP.search(msg or "") and PASSKEY_LIST in files):
                # CC-ADR-0024: the type that the doctor's F1 does not count belongs to the human's acceptance commit. An entry typed
                # `acceptance` in any other commit would silence F1 with nobody having accepted anything
                fails.append((where, log, f"a entrada `{head[:60]}` é do tipo `acceptance`, que só vale num commit com o carimbo "
                                          "`Human-accepted:` ou `Human-reopened:` (o commit do comando da tela do MJRP), ou com `Human-passkey:` no commit da lista de chaves"))
            if kind == "answer" and not answer_entry_ok(git(root, "show", f":{log}")[1], head):
                # CC-ADR-0039 section 9: the type the F1 does not count belongs to an answer of the screen, with its question and its report
                fails.append((where, log, f"a entrada `{head[:60]}` é do tipo `answer`, que só vale para uma resposta da tela: o título "
                                          "`auditoria P-NN: …` e, no corpo, `- Relatório: `<arquivo>``; ou, de um lote de propostas, `lote <nome>` e `- Lote: `reports/proposals/<nome>.md``"))
            tzname = contract_timezone(root, proj)
            ahead = future_entry(head, tzname)
            if ahead:
                fails.append((where, log, f"a entrada `{head[:60]}` tem a hora {ahead[0]}, depois de agora ({ahead[1]}, "
                                          f"{tzname}) — a hora é a do relógio, não estimada nem em UTC: rode "
                                          f"`TZ=America/Sao_Paulo date \"+%Y-%m-%d %H:%M\"` e use a saída"))
    return fails


def read_msg(argv):
    """The text of the file after `--msg`, or None when the flag is absent, empty or the file is unreadable."""
    if "--msg" not in argv:
        return None
    i = argv.index("--msg")
    if i + 1 >= len(argv) or not argv[i + 1]:
        return None
    try:
        return Path(argv[i + 1]).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None


def insert_entry(text, entry):
    """The log with `entry` above its newest entry (the first line that IS one), or at the end when it has none yet. The preamble is
    never searched for a `## [`: its own line that shows the format is not an entry (UAT-529)."""
    entry = entry.strip("\n") + "\n\n"
    if not ENTRY.match(entry):
        raise ValueError("a entrada não começa por `## [AAAA-MM-DD HH:MM] <tipo> — <título>`")
    first = ENTRY.search(text)
    if first is None:
        return text.rstrip("\n") + "\n\n" + entry
    return text[:first.start()] + entry + text[first.start():]


def _log_tool(argv):
    """`--insert <log> <entry>` and `--headings <log>`: 0 done, 1 refused (the reason printed), 2 wrong use."""
    if argv[0] == "--headings" and len(argv) == 2:
        broken = bad_headings(Path(argv[1]).read_text(encoding="utf-8"))
        if broken:
            print(f"log_entry_check: {argv[1]} tem linha `## ` que não é entrada (linha {', '.join(map(str, broken[:5]))})")
            return 1
        return 0
    if argv[0] == "--insert" and len(argv) == 3:
        log = Path(argv[1])
        text = log.read_text(encoding="utf-8")
        try:
            new = insert_entry(text, Path(argv[2]).read_text(encoding="utf-8"))
        except ValueError as e:
            print(f"log_entry_check: nada gravado - {e}")
            return 1
        broken = bad_headings(new)
        if broken:
            print(f"log_entry_check: nada gravado - o log ficaria com linha `## ` que não é entrada (linha {', '.join(map(str, broken[:5]))})")
            return 1
        tmp = log.with_name(log.name + ".tmp")
        tmp.write_text(new, encoding="utf-8")
        os.replace(tmp, log)
        print(f"log_entry_check: entrada gravada em {log}, acima da mais nova")
        return 0
    print(__doc__)
    return 2


def main(argv):
    if argv and argv[0] in ("--insert", "--headings"):
        return _log_tool(argv)
    root = Path(git(Path.cwd(), "rev-parse", "--show-toplevel")[1].strip() or ".")
    fails = check(root, amend="--amend" in argv, msg=read_msg(argv))
    if not fails:
        return 0
    print("")
    for where, log, why in fails:
        print(f"  commit bloqueado ({where}): {why} em {log}.")
    print("  Toda mudança leva uma entrada `## [AAAA-MM-DD HH:MM] <tipo>` no log do projeto que ela toca, com a hora de")
    print("  `TZ=America/Sao_Paulo date \"+%Y-%m-%d %H:%M\"` — S-61. Num commit que toca mais de um projeto, a entrada vai")
    print("  ao log do projeto DONO (ADR-0020): a raiz se tocar algum `log_owner.root_paths` do contrato da raiz; senão o")
    print("  projeto com mais arquivos tocados; empate, a raiz. Isentos: só derivado (folder-index.md, daily-checks/,")
    print("  _backups/), merge, script declarado, arquivo self_logged com histórico novo dentro dele, a ordem das features")
    print("  (só o docs/specs/priority.md, com `Human-prioritized:`; CC-ADR-0029). Ir por cima")
    print("  (--no-verify) é decisão do humano, nunca do agente.")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
