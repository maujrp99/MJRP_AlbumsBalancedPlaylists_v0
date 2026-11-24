#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
schema_bump_check.py - a version bump of a bundle schema does not enter a commit without the compatibility tests (F289, UAT-599).

The incident: F271 raised the Control Center's `state` bundle file to version 8 (and added three files) and left `tests/compat` as it was, so four
tests were red on `main` and nothing in the commit said so. The tests that bind a schema to its readers (`test_schema_check`, `test_bundle_schema`,
the enum record) are written against a version; a bump that does not touch them is a bump nobody re-judged.

It judges the INDEX: for each staged `<app>/schemas/<name>.schema.json` that is NEW or whose top-level `schema_version` (the `const`, else the
whole property) differs from HEAD's, the same commit has to stage a file under `<app>/tests/compat/`. A schema that changes with the version
untouched is not this gate's (the enum record test is). Anything else passes; a schema that does not parse is not evaluable (exit 2).

Usage: python3 mjrp-scripts/schema_bump_check.py <root> --staged
Exit: 0 passed | 1 refused | 2 not evaluable.  Stdlib only (ADR-0015).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

SCHEMA_RE = re.compile(r"^(?P<app>.*?)(?:^|/)?schemas/(?P<name>[^/]+\.schema\.json)$")


def git(root, *args):
    return subprocess.run(["git", "-C", str(root), "-c", "core.quotePath=false", *args], capture_output=True, text=True)


def version_of(text):
    """The `schema_version` property of a schema document, as a comparable value (the const, else the whole property)."""
    prop = (json.loads(text).get("properties") or {}).get("schema_version")
    if isinstance(prop, dict):
        return prop.get("const", json.dumps(prop, sort_keys=True))
    return None


def problems(root):
    """(refusals, errors) for the staged commit."""
    listed = git(root, "diff", "--cached", "--name-only", "--no-renames", "--diff-filter=AM")
    if listed.returncode != 0:
        return [], [f"git diff --cached falhou: {listed.stderr.strip()[:200]}"]
    staged = listed.stdout.splitlines()
    refused, errors = [], []
    for path in staged:
        m = SCHEMA_RE.match(path)
        if not m:
            continue
        app = m["app"].rstrip("/")
        new = git(root, "show", f":{path}")
        old = git(root, "show", f"HEAD:{path}")
        try:
            now = version_of(new.stdout)
            before = version_of(old.stdout) if old.returncode == 0 else "<new file>"
        except json.JSONDecodeError as e:
            errors.append(f"{path} nao e JSON ({e})")
            continue
        if now == before:
            continue
        prefix = (app + "/" if app else "") + "tests/compat/"
        if not any(p.startswith(prefix) for p in staged):
            refused.append(f"{path}: a versao do schema foi de {before} para {now} (ou o arquivo e novo) e nenhum arquivo de {prefix} entra no mesmo commit")
    return refused, errors


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    if "--staged" not in argv or not args:
        print("uso: schema_bump_check.py <root> --staged", file=sys.stderr)
        return 2
    refused, errors = problems(Path(args[0]))
    for e in errors:
        print(f"  schema_bump_check: NAO CONFERIDO - {e}", file=sys.stderr)
    if errors:
        return 2
    if refused:
        print("  schema_bump_check: a subida de versao de um schema nao entra sem os testes de compatibilidade (F289, UAT-599):")
        for r in refused:
            print(f"    {r}")
        print("    Atualize os testes que leem a versao (test_schema_check, test_bundle_schema, enum_values.json: `python -m tests.compat.test_enum_values`) e ponha-os neste commit.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
