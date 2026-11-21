#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""hooks_map.py - reads the hooks a project really has and compares them with the map (F291, S-245).

Reason to exist: on 2026-11-18 the orchestrator rules failed because they lived in the agent's memory, and nobody could see in one place
which lock guarded which rule. The MJRP asked for «um documento mapeando todos os hooks como mapeamos todos os scripts». This module is the
reader (the page generator and the judge both use it); it travels to the children with the kernel (stdlib only, VENDORED_FILES).

A hook is one of two things, and both are read from disk, never declared:
  agent   an entry of `.claude/settings.json` -> hooks -> <Event> -> [{matcher, hooks: [{command}]}]; the identity is the script plus its
          argument (`stop_gate.py --hook bash-pre`), because one script serves several hooks. One identity may sit in several events.
  git     a file of `mjrp-scripts/hooks/` that is not a `.py` (pre-commit, commit-msg, pre-merge-commit, post-commit, reference-transaction,
          pre-push...); the identity is the file name. What it calls is every `*.py` its text names.
A `.py` of `mjrp-scripts/hooks/` that no settings entry wires is a guard on disk that guards nothing: it is a finding too.

The map is `mjrp-scripts/hooks-catalog.json` (the kernel's, vendored) plus, in a child, an optional `hooks-catalog.local.json` for hooks that
exist only there. Keys are `agent:<script> <arg>` and `git:<name>`.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

CATALOG = "mjrp-scripts/hooks-catalog.json"
LOCAL_CATALOG = "mjrp-scripts/hooks-catalog.local.json"
SETTINGS = ".claude/settings.json"
HOOKS_DIR = "mjrp-scripts/hooks"
KINDS = ("refuses", "warns", "informs", "records")   # what the hook does to the agent or the commit
SCRIPT = re.compile(r"mjrp-scripts/((?:hooks/)?[\w\-]+\.py)")
ARGS = re.compile(r'python3\s+"\$[A-Za-z]+"([^|;&]*)')
CALLED = re.compile(r"\b((?:[a-z][a-z0-9_]*/)?[a-z][a-z0-9_]*\.py)\b")


class HooksUnreadable(Exception):
    """A `.claude/settings.json` that exists and cannot be read: not evaluated is never approved (the judge exits 2)."""


def _norm_args(raw: str) -> str:
    """The arguments after `python3 "$S"`, without redirections and the shell's `|| true`; empty when none."""
    raw = re.sub(r"\d*>>?\s*&?\S+", " ", raw)
    return " ".join(raw.split())


def agent_hooks(root) -> list[dict]:
    """[{key, event, matcher, script, args, timeout}] of the project's `.claude/settings.json` (empty when it has none)."""
    f = Path(root) / SETTINGS
    if not f.is_file():
        return []
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
        hooks = data.get("hooks", {})
        if hooks is None:
            hooks = {}
        if not isinstance(hooks, dict):
            raise ValueError("`hooks` is not an object")
    except (OSError, ValueError, AttributeError) as e:
        raise HooksUnreadable(f"{f}: {e}") from e
    out = []
    for event, groups in hooks.items():
        for group in groups or []:
            for h in group.get("hooks") or []:
                cmd = str(h.get("command") or "")
                cmd = re.sub(r"\d*>>?\s*&?\S+", " ", cmd)   # a redirection and its destination are not part of the hook
                m = SCRIPT.search(cmd)
                if not m:
                    continue
                args = _norm_args(ARGS.search(cmd).group(1)) if ARGS.search(cmd) else ""
                script = m.group(1).split("/")[-1]
                out.append({"key": f"agent:{script}" + (f" {args}" if args else ""), "event": event,
                            "matcher": group.get("matcher") or "", "script": script, "args": args, "timeout": h.get("timeout")})
    return out


def git_hooks(root) -> list[dict]:
    """[{key, name, calls}] of the extensionless files of `mjrp-scripts/hooks/` (the git hooks); `calls` are the scripts their text names."""
    folder = Path(root) / HOOKS_DIR
    out = []
    if folder.is_dir():
        for p in sorted(folder.iterdir()):
            if p.is_file() and p.suffix == "" and not p.name.startswith("."):
                text = p.read_text(encoding="utf-8", errors="replace")
                calls = sorted({c.split("/")[-1] for c in CALLED.findall(text) if not c.startswith("new_project")} - {"python3"})
                out.append({"key": f"git:{p.name}", "name": p.name, "calls": calls})
    return out


def unwired_guards(root) -> list[str]:
    """The `.py` files of `mjrp-scripts/hooks/` that no entry of `.claude/settings.json` runs."""
    folder = Path(root) / HOOKS_DIR
    wired = {h["script"] for h in agent_hooks(root)} | {c for g in git_hooks(root) for c in g["calls"]}   # a helper a git hook names is wired
    return sorted(p.name for p in folder.glob("*.py") if p.name not in wired) if folder.is_dir() else []


def hooks_path_armed(root) -> bool | None:
    """True when the clone's git is told to run `mjrp-scripts/hooks`; None when it cannot be read (not a git work tree)."""
    import subprocess
    try:
        inside = subprocess.run(["git", "-C", str(root), "rev-parse", "--is-inside-work-tree"], capture_output=True, text=True, timeout=15)
        if inside.returncode != 0:
            return None

        r = subprocess.run(["git", "-C", str(root), "config", "--get", "core." + "hooksPath"], capture_output=True, text=True, timeout=15)
    except (OSError, subprocess.SubprocessError):
        return None
    if r.returncode not in (0, 1):
        return None
    value = r.stdout.strip().rstrip("/")   # relative (a child) or absolute (the harness, which every worktree shares)
    return value == HOOKS_DIR or value.endswith("/" + HOOKS_DIR)


def discover(root) -> dict:
    """Every hook of one project, by key: {key: {"kind": "agent"|"git", "events": [(event, matcher)], "calls": [...]}}."""
    found: dict[str, dict] = {}
    for h in agent_hooks(root):
        e = found.setdefault(h["key"], {"kind": "agent", "script": h["script"], "args": h["args"], "events": [], "calls": [h["script"]]})
        if (h["event"], h["matcher"]) not in e["events"]:
            e["events"].append((h["event"], h["matcher"]))
    for g in git_hooks(root):
        found[g["key"]] = {"kind": "git", "script": g["name"], "args": "", "events": [(g["name"], "")], "calls": g["calls"]}
    return found


def load_catalog(root) -> dict | None:
    """The hooks map (the kernel's file with the project's local one on top); None when the kernel's file is not there."""
    f = Path(root) / CATALOG
    if not f.is_file():
        return None
    data = json.loads(f.read_text(encoding="utf-8"))
    local = Path(root) / LOCAL_CATALOG
    if local.is_file():
        data.setdefault("hooks", {}).update((json.loads(local.read_text(encoding="utf-8")) or {}).get("hooks") or {})
    return data


def portfolio_catalog(root, project_roots) -> dict | None:
    """The kernel's map of `root` with the local map of every project read on top: a child's own hooks are in ITS `hooks-catalog.local.json`."""
    catalog = load_catalog(root)
    if catalog is None:
        return None
    for p in project_roots:
        local = Path(p) / LOCAL_CATALOG
        if local.is_file():
            catalog.setdefault("hooks", {}).update((json.loads(local.read_text(encoding="utf-8")) or {}).get("hooks") or {})
    return catalog


def problems(found_by_project: dict, catalog: dict, owns_catalog: bool, unwired: dict | None = None) -> list[str]:
    """The judge's findings. `found_by_project` is {project name: discover(...)}. A hook that exists and is not in the map is always a
    finding; the map citing a hook that exists nowhere is one only where `owns_catalog` (a child carries the whole kernel catalog, so
    entries are left over there by construction). A catalog entry without a valid `kind` or without `does` is a finding too."""
    out, entries = [], catalog.get("hooks") or {}
    seen: set[str] = set()
    for project, hooks in found_by_project.items():
        for key in sorted(hooks):
            seen.add(key)
            if key not in entries:
                out.append(f"{project}: o hook `{key}` existe no disco e não está no mapa (mjrp-scripts/hooks-catalog.json)")
    for project, names in (unwired or {}).items():
        for name in names:
            out.append(f"{project}: o guarda mjrp-scripts/hooks/{name} existe e nenhuma entrada do .claude/settings.json o liga")
    if owns_catalog:
        for key in sorted(set(entries) - seen):
            out.append(f"o mapa cita `{key}`, que não existe em nenhum projeto lido (tire a entrada de hooks-catalog.json)")
    for key, e in sorted(entries.items()):
        if e.get("kind") not in KINDS:
            out.append(f"entrada `{key}` sem `kind` válido (um de {', '.join(KINDS)})")
        if not str(e.get("does") or "").strip():
            out.append(f"entrada `{key}` sem `does` (o que recusa, avisa ou registra)")
    return out
