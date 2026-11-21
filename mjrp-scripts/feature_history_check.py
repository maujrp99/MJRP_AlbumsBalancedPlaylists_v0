#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
feature_history_check.py - does what was delivered live under a feature? A clause of the `product-structure` catalog
item, beside product_structure_check.py: the delivered stories of every release must belong to a feature.

Born 2026-10-18 (UAT-257, MJRPpersonal): the ROADMAP had four releases (REL-01..04) with every story Done (11/11,
19/19, 12/12, 8/8) and `docs/specs/features/` held only a `.gitkeep`; the work delivered before the harness lived in
`docs/specs/milestones/M0..M11` (spec/plan/tasks each). The Control Center's Releases tab shows a release through its
features (and its UAT issues), so only REL-03 - the only one with issues - appeared; the others vanished. And
`product_structure_check.py` said VERDE, because it judges what a feature has, never that a release has none; the graph
sensor accepts a Done story with a `delivered_by` commit as evidence (`evidence_done`), with no feature.

The rule (derived, not new: "a delivered story stays with its feature"):
  - `release_done_without_feature`: a release of ROADMAP.md with stories Done/Accepted and NO feature that lands in it -
    a feature lands in a release when its spec declares `planned_for: "[[ROADMAP#^REL-xx]]"` or when the stories it
    imports are planned for it (the Control Center's own reading, `feature_release`). Fix features do not count: they
    pay UAT issues, they do not deliver the release's stories. In a project WITHOUT legacy history a Done story with a
    `delivered_by` commit (the graph's accepted evidence, `evidence_done`: a spike, an architecture decision) does not count
    toward the release: a release whose only Done stories are such is not a gap.
  - `story_done_not_in_feature` (ONLY in a project with legacy history, where a half-done migration leaves them): in a
    release that does have a feature, a Done/Accepted story planned for it that no feature imports. A release with no
    feature at all gets the first finding only, never both. In a project that delivered inside the harness a Done story
    with no feature is the graph's own accepted evidence (`delivered_by` commit, rule `evidence_done`: an architecture
    decision, a spike) and is not judged here - fin-control and the Control Center have such stories by design.
Both are judged by the same ruler already in use and add no new file rule: stories are read by product_structure_check's
own reader (`read_nodes`, `story_status`), releases by `parse_roadmap`, features by `feature_front`. NFRs, Deferred and
Cancelled stories do not count (graph rule); an unreadable ROADMAP, node or spec is the other clause's gap, not this one's.

SEVERITY: a WARNING (printed, `--json` under `warnings`, exit 0) in a project with legacy delivery history - a
`docs/specs/milestones/` (or `sprints/`) folder with something in it, or one already archived (`_archive/*milestones*`,
`_archive/*sprints*`; archiving first must not flip the severity): the work exists, only under another shape, and the
migration is a judgment the agent makes and the MJRP reviews. In any other project it is a GAP (exit 1): there the
delivery was done inside the harness and a release without a feature is a flow broken.
The remedy always names the owner skill (`mjrp-specifying-sdd-artifacts`, where the feature folder is born) and the
migration (`mjrp-pdlc-bootstrap`, reference/legacy-history.md).

Usage:  python3 mjrp-scripts/feature_history_check.py <project> [--json] [--quiet]
Exit: 0 nothing lost (warnings may be listed; also when ROADMAP.md or the requirements are absent or unreadable - there is no
release with Done stories to judge, and product_structure_check already reports the gap) · 1 gaps · 2 not evaluable (no
project, no contract, not a code-app).
"""
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import product_structure_check as psc   # noqa: E402  - the same readers the Control Center mirror uses; vendored together

OWNER = psc.OWNER_SDD
MIGRATION = ("migre o histórico: um marco foi uma release, não uma feature — mapeie cada marco à sua release, ache dentro dela as features "
             "(fatias verticais que entregam valor observável) e crie cada `docs/specs/features/Fxx-<slug>/` Done, com `planned_for` e "
             "`imports:` das stories; toda story feita fica em uma feature (a `mjrp-specifying-sdd-artifacts` é onde a pasta da feature "
             "nasce; o passo a passo é da `mjrp-pdlc-bootstrap`, `reference/legacy-history.md`)")
LEGACY_DIRS = ("docs/specs/milestones", "docs/specs/sprints")
CLOSED = ("done", "accepted")


def legacy_history(root):
    """The legacy folder that holds delivery history, or None: a milestones/ or sprints/ folder with something in it, or one
    ALREADY ARCHIVED (`_archive/<...milestones...>`, `_archive/<...sprints...>`) - archiving the folder before the migration is
    clean must not flip the severity from warning to gap (judge, 2026-10-18)."""
    root = Path(root)

    def filled(folder):
        return folder.is_dir() and any(not p.name.startswith(".") for p in folder.iterdir())
    for rel in LEGACY_DIRS:
        if filled(root / rel):
            return rel
    archive = root / "_archive"
    if archive.is_dir():
        for folder in sorted(archive.iterdir()):
            if any(w in folder.name.lower() for w in ("milestones", "sprints")) and filled(folder):
                return f"_archive/{folder.name}"
    return None


def delivered_by_commit(root, node):
    """True when the story's frontmatter names the commit that delivered it (`delivered_by:`) - the evidence the graph accepts for a
    Done story with no feature (requirements_graph_check `evidence_done`: an architecture decision, a spike)."""
    try:
        text = (Path(root) / node["path"]).read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return False
    front = text.split("\n---", 2)[0] if text.startswith("---") else ""
    return bool(re.search(r"^delivered_by:\s*[\"']?\S", front, re.M))


def read_features(root):
    """[{id, folder, status, imports, planned_for, spec}] of the normal features whose spec the screen can read."""
    base = Path(root) / psc.FEATURES_DIR
    out = []
    for folder in sorted(p.name for p in base.iterdir() if p.is_dir() and psc._FOLDER.match(p.name)) if base.is_dir() else []:
        spec = base / folder / "spec.md"
        rel = f"{psc.FEATURES_DIR}/{folder}/spec.md"
        try:
            front, _ = psc.feature_front(spec.read_text(encoding="utf-8"), rel)
        except (psc.FormatError, OSError, UnicodeDecodeError):
            continue          # no spec / unreadable: product_structure_check reports it (feature_no_spec, feature_unreadable)
        if psc.feature_kind(front)[1] == "fix":
            continue
        planned = psc._RELEASE.search(front.get("planned_for", ""))
        out.append({"id": psc._FOLDER.match(folder)["id"], "folder": folder, "spec": rel, "status": front.get("status", "").strip(),
                    "imports": [m["id"] for m in psc._LINK.finditer(front.get("imports", ""))],
                    "planned_for": planned.group(1) if planned else None, "track": "normal"})
    return out


def check(root):
    """(gaps, warnings, legacy) of a code-app project. Raises FormatError when ROADMAP.md or a requirement is unreadable."""
    root = Path(root)
    road_text = psc._read(root, psc.ROADMAP_FILE)
    if road_text is None or road_text is psc.BAD:
        raise psc.FormatError(0, "ROADMAP.md ausente ou ilegível")
    releases = psc.parse_roadmap(road_text)["releases"]
    nodes = psc.read_nodes(root)
    if nodes is None:
        raise psc.FormatError(0, "sem docs/specs/requirements/")
    by_id = {n["id"]: n for n in nodes}
    features = read_features(root)
    imported = {s for f in features for s in f["imports"]}
    legacy = legacy_history(root)
    gaps, warnings = [], []
    emit = (lambda *a: warnings.append(_item(*a))) if legacy else (lambda *a: gaps.append(_item(*a)))
    for rel in releases:
        closed = [n for n in nodes if not n["nfr"] and n["release"] == rel["id"] and psc.story_status(n["status"]) in CLOSED]
        if not legacy:
            # native mode: a Done story whose evidence is the `delivered_by` commit is the graph's accepted case (a spike, an
            # architecture decision) and does not ask for a feature; with legacy history every delivered story is judged (judge P1-1)
            closed = [n for n in closed if not delivered_by_commit(root, n)]
        live = [n for n in nodes if not n["nfr"] and n["release"] == rel["id"] and psc.story_status(n["status"]) not in psc.OFF_TRACK]
        if not closed:
            continue
        landing = [f for f in features if f["planned_for"] == rel["id"] or psc.feature_release(f, by_id, {}, releases) == rel["id"]]
        if not landing:
            emit("Releases", psc.ROADMAP_FILE, rel["line"], "release_done_without_feature",
                 f"{rel['id']} ({rel['name']}) tem {len(closed)} de {len(live)} stories feitas e nenhuma feature "
                 f"(`planned_for` {rel['id']}): a entrega dessa release não aparece em feature nenhuma e some do Delivery e da tela da release — {MIGRATION}",
                 f"{psc.ROADMAP_FILE}#^{rel['id']}")
            continue
        loose = [n["id"] for n in closed if n["id"] not in imported] if legacy else []
        if loose:
            shown = ", ".join(loose[:6]) + (f" e mais {len(loose) - 6}" if len(loose) > 6 else "")
            emit("Releases", psc.ROADMAP_FILE, rel["line"], "story_done_not_in_feature",
                 f"{rel['id']} ({rel['name']}): {len(loose)} stories feitas que nenhuma feature importa ({shown}) — uma story entregue fica com a "
                 f"feature que a entregou: acrescente cada uma ao `imports:` da feature que a entregou (ou escreva a feature que falta) — {MIGRATION}",
                 f"{psc.ROADMAP_FILE}#^{rel['id']}")
    return gaps, warnings, legacy


def _item(view, file, line, code, message, ref):
    return {"code": code, "view": view, "file": file, "line": line, "ref": ref, "message": message, "owner": OWNER}


def render(name, gaps, warnings, legacy):
    head = (f"feature_history_check: {name} — " + ("VERDE: toda release com story feita tem a feature que a entregou" if not gaps else
            f"VERMELHO: {len(gaps)} lacuna(s)") + (f" · {len(warnings)} aviso(s) (histórico legado em `{legacy}/`)" if warnings else ""))
    out = [head]
    for g in gaps:
        out.append(f"  [{g['view']}] {g['file']}:{g['line']}: {g['message']} → {g['owner']}")
    for w in warnings:
        out.append(f"  [aviso] {w['ref']}: {w['message']} → {w['owner']}")     # `<file>#^REL-xx`: the key of `conformance.asked`
    return out


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    as_json = "--json" in argv
    if any(a.startswith("--") and a not in ("--json", "--quiet") for a in argv):
        print("uso: feature_history_check.py <projeto> [--json] [--quiet]", file=sys.stderr)
        return 2
    root = Path(args[0] if args else ".").resolve()
    if not root.is_dir():
        print(f"feature_history_check: {root} não é uma pasta — não avaliável", file=sys.stderr)
        return 2
    profile = psc._profile(root)
    if profile is None:
        print(f"feature_history_check: {root.name} sem {psc.CONTRACT_FILE} — não avaliável", file=sys.stderr)
        return 2
    if profile != "code-app":
        print(f"feature_history_check: {root.name} tem perfil `{profile or '?'}` — só um code-app tem release e feature; não avaliável", file=sys.stderr)
        return 2
    try:
        gaps, warnings, legacy = check(root)
    except (psc.FormatError, OSError, UnicodeDecodeError) as e:
        # no readable ROADMAP / requirements = no release with Done stories to judge; the gap is product_structure_check's (it
        # reports roadmap_missing, requirements_missing, ...), so this clause does not make a second one out of it
        print(f"feature_history_check: {root.name} — nada a julgar ({getattr(e, 'reason', e)}); a lacuna é do product_structure_check")
        return 0
    if as_json:
        print(json.dumps({"project": root.name, "ok": not gaps, "legacy_history": legacy, "gaps": gaps, "warnings": warnings}, ensure_ascii=False, indent=2))
    else:
        print("\n".join(render(root.name, gaps, warnings, legacy)))
    return 1 if gaps else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
