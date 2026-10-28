#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""session_journal.py -- the AI Platform hooks of S-61: no decision is lost to a context compaction.

Born 2026-10-04: a compaction found the human's latest answers only in the AI Platform's own summary, not in the
repository, and the ## Now of MEMORY.md still described a step already done. Four modes, one per hook:

  precompact   PreCompact: appends to .mjrp/diary/<session>.md what the human said in the session -- their
               messages and the answers to the agent's questions (AskUserQuestion) -- and the skills invoked.
               The diary accumulates across compactions; each item is written once.
  reinject     SessionStart (source compact): prints the ## Now of MEMORY.md, the newest log entries and the tail
               of the diary, so the agent resumes from the repository and not only from the summary.
  gate         Stop: blocks the end of the turn (exit 2) while an answer of the human is newer than the newest
               log entry -- a decision taken and not registered.
  skill        PostToolUse (Skill): appends one line to data/raw/skill-usage.csv (date, time, skill, session) -- the log
               counts editions of a skill, this counts use.

The hooks run only where the AI Platform loads this project's settings (a local session in the project folder). A
cloud session that reaches the project through a bridge does not load them; there the guard is the git hook
commit-msg (log_entry_check.py) and the onboarding rule of registering each decision before moving on.
Hook input is the JSON the AI Platform sends on stdin. Python 3 stdlib only (ADR-0015: core).
"""
import csv
import fcntl
import json
import os
import re
import subprocess
import sys
import zlib
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent

import pathlib as _pl, sys as _sys  # noqa: E401  (F73 GV-06: this script's folder on sys.path even when it is loaded by path)
_sys.path[:0] = [d for d in [str(_pl.Path(__file__).resolve().parent)] if d not in _sys.path]
import _boot  # noqa: F401  (the scripts folder on sys.path, F73 R17)
import _clock
LOCAL = _clock.tz()   # Brasília (F73 R4)

REMINDER = re.compile(r"<system-reminder>.*?</system-reminder>", re.DOTALL)
ENTRY = re.compile(r"^## \[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\]", re.MULTILINE)
DIARY_ITEM = re.compile(r"<!-- id:([^ ]+) -->")
SENT_AT = re.compile(r"Message sent at \w+ (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) local time")


def _checkouts(project):
    """The resolved paths of every checkout of the repository that holds `project`: its main one and the linked worktrees, as the
    VCS itself lists them (`worktree list --porcelain`). An empty set when the VCS does not answer."""
    try:
        r = subprocess.run(["git", "worktree", "list", "--porcelain"], cwd=project, capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return set()
    if r.returncode != 0:
        return set()
    return {Path(line[len("worktree "):]).resolve() for line in r.stdout.splitlines() if line.startswith("worktree ")}


def resolve_root(hook, default=None):
    """F85 (UAT-370): the checkout the SESSION works in, used ONLY to READ its state (the log the Stop gate compares, the log and the
    MEMORY.md `reinject` shows). The hook's `cwd` (the AI Platform sends it: the worktree root once Claude is in a worktree) wins over
    `default` (the project this script sits in) when, and only when, it resolves to a checkout the repository itself lists in
    `worktree list --porcelain` (the main one or a linked worktree). A folder that merely carries a forged `.git` file pointing at the
    repository is not in that list, so it is not followed (recheck P2-1). Anything else keeps `default`.

    Nothing a hook WRITES goes through here: the skill-usage CSV and the diary stay in `ROOT`, the main checkout (recheck P1-1). A hook
    that wrote into the worktree of the session would turn a merged, clean worktree into class 1 (ADR-0023) and undo F80/F84."""
    default = default or ROOT
    cwd = (hook or {}).get("cwd")
    if not cwd or not Path(cwd).is_dir():
        return default
    try:
        top = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=cwd, capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return default
    if top.returncode != 0 or not top.stdout.strip():
        return default
    here = Path(top.stdout.strip()).resolve()
    return here if here in _checkouts(default) and (here / "docs").is_dir() else default


def local_time(iso):
    if iso.startswith("local:"):  # already in Brasília time (the human's own "sent at")
        return iso[6:]
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(LOCAL).strftime("%Y-%m-%d %H:%M")
    except Exception:
        return "????-??-?? ??:??"


def clean(text):
    return REMINDER.sub("", text or "").strip()


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
    return ""


def read_transcript(path):
    """Yields (id, iso_time, kind, text): kind is 'human', 'answer' or 'skill'."""
    asks = {}
    try:
        lines = Path(path).read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return
    for line in lines:
        try:
            o = json.loads(line)
        except ValueError:
            continue
        ts, uid, typ = o.get("timestamp", ""), o.get("uuid", ""), o.get("type")
        if typ == "attachment" and (o.get("attachment") or {}).get("type") == "queued_command":
            raw = text_of(o["attachment"].get("prompt"))
            t = clean(raw)
            sent = SENT_AT.search(raw)
            if t and sent:  # a message the platform re-delivers keeps its own "sent at": one item, its real time
                uid, ts = "msg-" + sent.group(1).replace(" ", "T") + "-" + format(zlib.crc32(t.encode("utf-8")), "08x"), "local:" + sent.group(1)
            if t:
                yield uid, ts, "human", t
            continue
        msg = o.get("message") or {}
        content = msg.get("content")
        if typ == "assistant" and isinstance(content, list):
            for b in content:
                if b.get("type") == "tool_use" and b.get("name") == "AskUserQuestion":
                    asks[b.get("id")] = [q.get("question", "") for q in (b.get("input") or {}).get("questions", [])]
                if b.get("type") == "tool_use" and b.get("name") == "Skill":
                    yield b.get("id"), ts, "skill", str((b.get("input") or {}).get("skill", "?"))
        if typ == "user" and not o.get("isMeta"):
            if isinstance(content, list):
                for b in content:
                    if b.get("type") == "tool_result" and b.get("tool_use_id") in asks:
                        yield b.get("tool_use_id"), ts, "answer", clean(text_of(b.get("content")))
            t = clean(text_of(content))
            if t and not t.startswith("This session is being continued from a previous conversation"):
                yield uid, ts, "human", t


def log_file(root=None):
    """The log of `root` (default: the project this script sits in). Reading only: `root` is the session's checkout (resolve_root)."""
    root = root or ROOT
    try:
        from log_entry_check import log_path
        return root / log_path(root, "")
    except Exception:
        return root / "docs" / "log.md"


FIXTURE_DIRS = {"tests", "test", "samples", "fixtures", "node_modules"}   # a nested contract under these is a fixture, not a project that owns decisions


def log_files(root=None):
    """F86 (UAT-372): every log of the checkout `root` that can hold a decision -- the root's own plus those of the nested projects (the ones
    with a `.mjrp-project.yml` of their own), because the decision goes to the log of the OWNING project (ADR-0020), not always the root's.
    Resolved with the same helpers the commit-msg check uses (`nested_projects`, `log_path`), never re-derived here. Reading only, and only
    inside `root`. The root's log comes first; a nested project the VCS does not list (or a VCS that does not answer) is just not there."""
    root = root or ROOT
    found = [log_file(root)]
    try:
        from log_entry_check import log_path, nested_projects
        real = root.resolve()
        for proj in sorted(p for p in nested_projects(root) if p and not FIXTURE_DIRS & set(Path(p).parts)):
            f = root / log_path(root, proj)
            if f.is_file() and f.resolve().is_relative_to(real) and f not in found:
                found.append(f)
    except Exception:
        pass
    return found


def newest_entry(root=None):
    """The newest `## [AAAA-MM-DD HH:MM]` among the logs of the checkout (F86), or None when none has an entry."""
    times = []
    for f in log_files(root):
        try:
            times += ENTRY.findall(f.read_text(encoding="utf-8"))
        except OSError:
            continue
    return max(times) if times else None


def diary_path(session):
    return ROOT / ".mjrp" / "diary" / f"{session or 'unknown'}.md"


def _atomic_write(path, text):
    """tmp + os.replace (R23, F72): a reader sees the old diary or the new one, never half of it. Inlined (a shared module would have
    to be added to the files new_project.py vendors into every project)."""
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def precompact(hook):
    path = diary_path(hook.get("session_id"))
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path.with_name(path.name + ".lock"), "w") as lock:       # two compactions (or a compaction and a reinject) at once
        fcntl.flock(lock, fcntl.LOCK_EX)
        old = path.read_text(encoding="utf-8") if path.exists() else f"# Diário da sessão {hook.get('session_id')}\n\n"
        seen = set(DIARY_ITEM.findall(old))
        label = {"human": "MJRP disse", "answer": "MJRP respondeu", "skill": "skill invocada"}
        new = []
        for uid, ts, kind, text in read_transcript(hook.get("transcript_path", "")):
            if uid and uid not in seen:
                seen.add(uid)
                body = text if len(text) <= 4000 else text[:4000] + " […]"
                new.append(f"- **{local_time(ts)}** · {label[kind]}: {body} <!-- id:{uid} -->\n")
        if new:
            _atomic_write(path, old + "".join(new))
    print(f"[session_journal] diário: {len(new)} item(ns) novo(s) em {path.relative_to(ROOT)}")
    return 0


def reinject(hook):
    from _now_shape import now_section
    out = ["## Retomada depois da compactação (S-61) — o repositório, não só o resumo", ""]
    sess = resolve_root(hook)          # the checkout of the session: where the log and the MEMORY.md to READ live (F85)
    mem = sess / "MEMORY.md"
    if mem.exists():
        body = now_section(mem.read_text(encoding="utf-8")) or []
        out += ["### MEMORY.md — ## Now", *body, ""]
    entries = []                       # F86: the newest entries of the root log and of the nested projects' logs, together
    for f in log_files(sess):
        try:
            text = f.read_text(encoding="utf-8")
        except OSError:
            continue
        for part in re.split(r"(?m)^(?=## \[)", text)[1:4]:
            m = ENTRY.match(part)
            if m:
                entries.append((m.group(1), str(f.relative_to(sess)), part.strip()[:2500]))
    if entries:
        top = sorted(entries, key=lambda e: e[0], reverse=True)[:3]
        out += [f"### {', '.join(dict.fromkeys(e[1] for e in top))} — as 3 entradas mais recentes",
                *[f"({e[1]})\n{e[2]}" for e in top], ""]
    d = diary_path(hook.get("session_id"))
    if d.exists():
        items = [l for l in d.read_text(encoding="utf-8").splitlines() if l.startswith("- **")]
        out += [f"### Diário da sessão — os últimos {min(30, len(items))} itens ({d.relative_to(ROOT)})",
                *[DIARY_ITEM.sub("", l).rstrip() for l in items[-30:]], ""]
    out.append("Confira se toda resposta do diário mais nova que a última entrada do log está registrada antes de seguir.")
    print("\n".join(out))
    return 0


def gate(hook):
    if hook.get("stop_hook_active"):
        return 0  # already blocked once in this stop; never loop
    sess = resolve_root(hook)          # F85: the log of the checkout the session works in (READ only)
    newest = newest_entry(sess)
    pending = [(local_time(ts), text) for _, ts, kind, text in read_transcript(hook.get("transcript_path", ""))
               if kind == "answer" and (newest is None or local_time(ts) > newest)]
    if not pending:
        return 0
    first = pending[0]
    print(f"[session_journal] {len(pending)} resposta(s) do humano sem registro no log (a última entrada é de "
          f"{newest or 'nenhuma'}). A primeira, de {first[0]}: {first[1][:300]} — registre cada decisão no "
          f"log do projeto dono ({', '.join(str(f.relative_to(sess)) for f in log_files(sess))}; hora de `TZ=America/Sao_Paulo date`) e atualize o ## Now antes de "
          f"encerrar o turno (S-61).", file=sys.stderr)
    return 2


def skill(hook):
    name = (hook.get("tool_input") or {}).get("skill") or (hook.get("tool_input") or {}).get("name")
    if not name:
        return 0
    f = ROOT / "data" / "raw" / "skill-usage.csv"
    f.parent.mkdir(parents=True, exist_ok=True)
    now = datetime.now(LOCAL)
    (ROOT / ".mjrp").mkdir(parents=True, exist_ok=True)
    with open(ROOT / ".mjrp" / "skill-usage.lock", "w") as lock:       # R23: the header test and the append are one step (lock kept out of data/)
        fcntl.flock(lock, fcntl.LOCK_EX)
        new = not f.exists()
        with f.open("a", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            if new:
                w.writerow(["date", "time", "skill", "session"])
            w.writerow([now.strftime("%Y-%m-%d"), now.strftime("%H:%M"), name, hook.get("session_id", "")])
    return 0


MODES = {"precompact": precompact, "reinject": reinject, "gate": gate, "skill": skill}


def main(argv):
    if not argv or argv[0] not in MODES:
        print(f"uso: session_journal.py {{{'|'.join(MODES)}}}  (JSON do hook no stdin)", file=sys.stderr)
        return 1
    try:
        hook = json.loads(sys.stdin.read() or "{}")
    except ValueError:
        hook = {}
    try:
        return MODES[argv[0]](hook)
    except Exception as e:  # a broken hook must never take the session down
        print(f"[session_journal] {argv[0]} falhou: {e}", file=sys.stderr)
        return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
