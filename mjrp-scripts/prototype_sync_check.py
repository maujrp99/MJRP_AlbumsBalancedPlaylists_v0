#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""prototype_sync_check.py -- a prototype, its screen inventory and its wireframes move together.

09/10/2026 19:36 (MJRP): the Control Center v3.5 changed after approval and its data went stale, but only 3 of its
7 screens had a wireframe and the info-arch.md still named the v3.3 as its source -- the rule existed only in prose
(structure_rules.json `wireframes`, mjrp-designing-ui), so it depended on the agent remembering. MJRP: "alterou
protótipo, automaticamente wireframe e info-arch precisam ser atualizados". Decided: hook + sensor; every version
of a prototype has the wireframe of every screen.

The rule:
  - a prototype is `design/inception/<name>-vN.html` (N may be dotted: v3.5);
  - every commit that adds or changes it also brings `docs/specs/info-arch.md` and the wireframes of that version,
    `design/wireframes/<name>-vN-<screen>.png`, one per screen;
  - the screens are those of the previous version that had wireframes, plus any new one; a screen dropped on
    purpose is declared in info-arch.md as `<!-- wireframe-retired: <screen> -->`;
  - info-arch.md names the newest prototype file (`<name>-vN.html`).
  - a wireframe regenerated IDENTICAL to the committed one never shows in the index (git has nothing to stage), so the
    gate also accepts the proof of the regeneration (F111, UAT-387: the F67 merge needed the human's valve because the 10
    other screens came out the same): the file on disk is byte-identical to HEAD and to the index AND was written after
    the prototype on disk (mtime strictly newer). A wireframe not regenerated keeps its old mtime and is still refused; one
    regenerated but different from HEAD has to be staged; a touch on a stale PNG is a deliberate lie, not an accident.
    What the gate accepted that way is written into the message as a machine trailer,
    `Prototype-regenerated-identical: <prototype path>: <screen>, <screen>` (left in history, P2-1 of the F111 recheck).
  - in a merge (MERGE_HEAD present) the integrator's checkout never rewrites the identical PNG, so its mtime proves
    nothing there (P1-1 of the F111 recheck: `merge_train` merges with --no-ff and the gate refused the branch that had
    passed). A wireframe of the merge counts as redone when its blob is the same in the index, HEAD and the merged head,
    and a commit of the merged side - from its newest commit that touched the prototype up to the merged head - either
    touched that wireframe or carries the trailer naming the prototype and the screen. A branch that took the human's
    valve carries no trailer, so its stale screens are refused again at the merge.
  - the trailer is the gate's own mark and nobody else's (UAT-394, P2-5 of the F111 recheck): a message that carries one the gate did not
    write is refused -- when it also carries `Prototype-sync: skip`, or when the trailer names a prototype that is not in the index
    (the gate only ever writes it for a staged prototype). Without that, a trailer typed by hand after the human's valve made the
    merge take a screen nobody redid. In an `--amend` the lines the commit being amended already carried are kept.
  - the doctor (W14, `drift`) reads the same trailer (UAT-392): a screen that a trailer of the newest prototype change, or of a
    later commit, names counts as up to date, the way the gate accepted it -- two sensors, one rule.

Modes:
  python3 prototype_sync_check.py <project root>
      drift report (doctor W14): prints one line per gap, always exits 0.
  python3 prototype_sync_check.py <repo root> --staged [--amend] [--msg <commit message file>]
      commit gate (commit-msg hook): exit 1 blocks the commit.
Escape -- the human's call, written in the commit message: a trailer line `Prototype-sync: skip -- <reason>`.
"""
import re
import sys
from pathlib import Path

import _git as _gitlib

PROTO = re.compile(r"^(?P<name>[a-z0-9]+(?:-[a-z0-9]+)*)-v(?P<ver>\d+(?:\.\d+)*)\.html$")
STAGED_PROTO = re.compile(r"^(?P<proj>(?:.+/)?)design/inception/(?P<file>[^/]+\.html)$")
RETIRED = re.compile(r"<!--\s*wireframe-retired:\s*([a-z0-9-]+)\s*-->")
SKIP = re.compile(r"^Prototype-sync:\s*skip\b", re.I | re.M)
TRAILER = "Prototype-regenerated-identical"
TRAILER_RE = re.compile(rf"^{TRAILER}:\s*(?P<proto>\S+?\.html)\s*:\s*(?P<screens>.+?)\s*$", re.M)
INFO_ARCH = Path("docs") / "specs" / "info-arch.md"
INCEPTION = Path("design") / "inception"
WIREFRAMES = Path("design") / "wireframes"
RULE_SINCE = "2026-10-09"   # the wireframes folder and this rule were born on this day; older prototypes are legacy


def vkey(ver):
    return tuple(int(x) for x in ver.split("."))


def prototypes(proj):
    """{name: [(version, path), ...] oldest first} for the prototypes in design/inception/."""
    out = {}
    d = proj / INCEPTION
    if not d.is_dir():
        return out
    for f in d.iterdir():
        m = PROTO.match(f.name)
        if f.is_file() and m:
            out.setdefault(m["name"], []).append((m["ver"], f))
    for name in out:
        out[name].sort(key=lambda x: vkey(x[0]))
    return out


def screens(proj, name, ver):
    """The screens that have a wireframe PNG for this version."""
    d = proj / WIREFRAMES
    prefix = f"{name}-v{ver}-"
    if not d.is_dir():
        return set()
    return {f.name[len(prefix):-4] for f in d.iterdir() if f.name.startswith(prefix) and f.name.endswith(".png")}


def retired(proj):
    p = proj / INFO_ARCH
    return set(RETIRED.findall(p.read_text(encoding="utf-8"))) if p.is_file() else set()


def required(proj, name, ver, versions):
    """Screens this version must have: the previous version's (with wireframes) minus the retired, plus its own."""
    prev = set()
    for v, _ in reversed([x for x in versions if vkey(x[0]) < vkey(ver)]):
        prev = screens(proj, name, v)
        if prev:
            break
    return (prev - retired(proj)) | screens(proj, name, ver)


def _git(root, *args):
    """git's text, "" for "no such thing"; a git that does NOT ANSWER raises GitError (it used to read as "no drift", F73 IV-08)."""
    return _gitlib.text(root, *args, timeout=30) or ""


def _ctime(proj, path):
    """Unix time of the newest commit touching path; 0 when git does not know it."""
    out = _git(proj, "log", "-1", "--format=%ct", "--", str(path))
    return int(out) if out.isdigit() else 0


def trailer_screens_since(proj, path, proto_rel):
    """The screens named by a `Prototype-regenerated-identical` trailer for `proto_rel` in the commits from the newest one that
    touched the prototype `path` up to HEAD (that commit included: the gate writes the trailer in the commit it accepts). A
    trailer from before the last change of the prototype says nothing about this version (UAT-392)."""
    last = _git(proj, "log", "-1", "--format=%H", "--", str(path)).strip()
    if not last:
        return set()
    out = set()
    for message in _git(proj, "log", "--format=%B%x1e", "HEAD", "--not", f"{last}^@").split("\x1e"):
        out |= trailer_screens(message, proto_rel)
    return out


def drift(proj):
    """Gaps between the newest prototype of each name, its wireframes and info-arch.md (doctor W14)."""
    proj = Path(proj).resolve()   # git -C <proj> with absolute paths: a relative root would be read twice
    gaps = []
    for name, versions in sorted(prototypes(proj).items()):
        ver, path = versions[-1]
        rel = f"{INCEPTION}/{path.name}"
        when = _git(proj, "log", "-1", "--format=%cs", "--", str(path))
        if when and when < RULE_SINCE:
            continue
        have = screens(proj, name, ver)
        if not have:
            gaps.append(f"{rel}: nenhum wireframe desta versão em {WIREFRAMES}/ ({name}-v{ver}-<tela>.png)")
        missing = sorted(required(proj, name, ver, versions) - have)
        if missing:
            gaps.append(f"{rel}: falta o wireframe de {', '.join(missing)} (a versão anterior tinha; tela retirada "
                        f"se declara no info-arch.md com <!-- wireframe-retired: <tela> -->)")
        ia = proj / INFO_ARCH
        if not ia.is_file():
            gaps.append(f"{rel}: sem {INFO_ARCH} (o inventário da tela)")
        elif path.name not in ia.read_text(encoding="utf-8"):
            gaps.append(f"{INFO_ARCH} não cita o protótipo mais novo ({path.name})")
        t = _ctime(proj, path)
        if t:
            stale = [f"{INFO_ARCH}"] if ia.is_file() and _ctime(proj, ia) < t else []
            late = [s for s in sorted(have) if _ctime(proj, proj / WIREFRAMES / f"{name}-v{ver}-{s}.png") < t]
            if late:   # the gate may have accepted them as regenerated identical: its trailer says so (UAT-392)
                prefix = _git(proj, "rev-parse", "--show-prefix").strip()
                redone = trailer_screens_since(proj, path, f"{prefix}{rel}")
                late = [s for s in late if s not in redone]
            stale += [f"{name}-v{ver}-{s}.png" for s in late]
            if stale:
                gaps.append(f"{rel} mudou depois de: {', '.join(stale)}")
    return gaps


def regenerated_identical(root, rel, proto_rel):
    """True when the wireframe `rel` (repo-relative) was regenerated after the prototype and came out identical to HEAD:
    the disk file is newer than the prototype on disk, and its blob equals both HEAD's and the index's (UAT-387)."""
    wf, proto = root / rel, root / proto_rel
    if not wf.is_file() or not proto.is_file():
        return False
    if wf.stat().st_mtime_ns <= proto.stat().st_mtime_ns:
        return False
    head = _git(root, "rev-parse", "-q", "--verify", f"HEAD:{rel}").strip()
    index = _git(root, "rev-parse", "-q", "--verify", f":{rel}").strip()
    disk = _git(root, "hash-object", "--", rel).strip()
    return bool(head) and head == index == disk


def merge_heads(root):
    """The commits being merged (MERGE_HEAD, one per line in an octopus); [] outside a merge."""
    rel = _git(root, "rev-parse", "--git-path", "MERGE_HEAD").strip()
    if not rel:
        return []
    path = Path(rel) if Path(rel).is_absolute() else root / rel
    if not path.is_file():
        return []
    return [ln.strip() for ln in path.read_text(encoding="utf-8", errors="replace").splitlines() if ln.strip()]


def trailer_screens(message, proto_rel):
    """The screens a commit message's trailer says were regenerated identical for `proto_rel`."""
    out = set()
    for m in TRAILER_RE.finditer(message or ""):
        if m["proto"] == proto_rel:
            out |= {x.strip() for x in m["screens"].split(",") if x.strip()}
    return out


def merged_redone(root, heads, rel, proto_rel, screen):
    """True, in a merge, when the wireframe `rel` is the same blob in the index, HEAD and a merged head, and that head's side
    redid it after its newest prototype change: a commit from there up to the head touched `rel` or names `screen` in the
    trailer for `proto_rel` (P1-1 of the F111 recheck)."""
    if not heads:
        return False
    head = _git(root, "rev-parse", "-q", "--verify", f"HEAD:{rel}").strip()
    index = _git(root, "rev-parse", "-q", "--verify", f":{rel}").strip()
    if not head or head != index:
        return False
    for mh in heads:
        if _git(root, "rev-parse", "-q", "--verify", f"{mh}:{rel}").strip() != head:
            continue
        touched_proto = _git(root, "rev-list", "-1", f"HEAD..{mh}", "--", proto_rel).strip()
        if not touched_proto:
            continue
        for c in _git(root, "rev-list", "--topo-order", f"HEAD..{mh}").split():
            if screen in trailer_screens(_git(root, "log", "-1", "--format=%B", c), proto_rel):
                return True
            if _git(root, "diff-tree", "--no-commit-id", "--name-only", "-r", "-m", c, "--", rel).strip():
                return True
            if c == touched_proto:
                break
    return False


def forged_trailers(root, msg_text, staged, skip, amend=False):
    """The `Prototype-regenerated-identical` lines of the message that the gate did not write (UAT-394): the gate writes the
    trailer only after it passed, for a prototype in the index, and never in a commit that took the human's `Prototype-sync: skip`.
    So a line in the message BEFORE the gate runs is typed by hand when the commit carries the valve or names a prototype that is
    not staged. In an `--amend` the lines the commit being amended already carried are the gate's own and stay."""
    kept = set()
    if amend:
        kept = {ln.strip() for ln in _git(root, "log", "-1", "--format=%B", "HEAD").splitlines()}
    out = []
    for m in TRAILER_RE.finditer(msg_text or ""):
        if m.group(0).strip() in kept:
            continue
        if skip or m["proto"] not in staged:
            out.append(m.group(0).strip())
    return out


def staged_gaps(root, msg_text="", notes=None, accepted=None, amend=False):
    """What a commit that adds or changes a prototype is missing (commit-msg gate). `notes`, when a list, receives the
    wireframes accepted without being staged; `accepted`, when a dict, gets {prototype path: {screen, ...}} of them (the
    trailer main() writes). `amend`: the commit replaces HEAD, whose own trailer lines are kept."""
    root = Path(root).resolve()
    skip = bool(SKIP.search(msg_text or ""))
    out = _git(root, "diff", "--cached", "--name-only", "--diff-filter=AMR")
    staged = set(out.splitlines()) if out else set()
    gaps = [f"a mensagem traz «{ln}», que a própria checagem não escreveu "
            f"({'o commit leva Prototype-sync: skip' if skip else 'nenhum protótipo dessa linha está no índice'}): essa linha é só da "
            f"checagem, tire-a da mensagem" for ln in forged_trailers(root, msg_text, staged, skip, amend)]
    if skip:
        return gaps
    for s in sorted(staged):
        m = STAGED_PROTO.match(s)
        pm = PROTO.match(m["file"]) if m else None
        if not pm:
            continue
        prefix, name, ver = m["proj"], pm["name"], pm["ver"]
        proj = root / prefix if prefix else root
        if f"{prefix}{INFO_ARCH.as_posix()}" not in staged:
            gaps.append(f"{s}: o commit não traz {prefix}{INFO_ARCH.as_posix()} (o inventário acompanha o protótipo)")
        versions = prototypes(proj)
        need = required(proj, name, ver, versions.get(name, [(ver, None)]))
        wf = f"{prefix}{WIREFRAMES.as_posix()}/{name}-v{ver}-"
        staged_screens = {x[len(wf):-4] for x in staged if x.startswith(wf) and x.endswith(".png")}
        if not need and not staged_screens:
            gaps.append(f"{s}: o commit não traz nenhum wireframe da versão ({wf}<tela>.png)")
        same = {x for x in need - staged_screens if regenerated_identical(root, f"{wf}{x}.png", s)}
        if same and notes is not None:
            notes.append(f"{s}: regenerado(s) e idêntico(s) ao HEAD, conta(m) como refeito(s): {', '.join(sorted(same))}")
        heads = merge_heads(root) if need - staged_screens - same else []
        merged = {x for x in need - staged_screens - same if merged_redone(root, heads, f"{wf}{x}.png", s, x)}
        if merged and notes is not None:
            notes.append(f"{s}: refeito(s) no ramo mesclado e idêntico(s) ao HEAD, conta(m) como refeito(s): "
                         f"{', '.join(sorted(merged))}")
        if (same or merged) and accepted is not None:
            accepted.setdefault(s, set()).update(same | merged)
        missing = sorted(need - staged_screens - same - merged)
        if missing:
            gaps.append(f"{s}: o commit não traz o wireframe refeito de {', '.join(missing)} ({wf}<tela>.png)")
    return gaps


def write_trailers(root, msg_file, accepted):
    """Records in the commit message, as machine trailers, what the gate took as redone without staging it."""
    args = ["interpret-trailers", "--in-place", "--if-exists", "addIfDifferent"]
    for proto, screens in sorted(accepted.items()):
        args += ["--trailer", f"{TRAILER}: {proto}: {', '.join(sorted(screens))}"]
    r = _gitlib.run(Path(root).resolve(), *args, str(msg_file))
    if r.code != 0:
        raise _gitlib.GitError(f"git interpret-trailers saiu {r.code}: {(r.err or r.out).strip()[:160]}")


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    root = Path(args[0]) if args else Path(".")
    if "--staged" in argv:
        msg, msg_file = "", None
        if "--msg" in argv:
            i = argv.index("--msg")
            if i + 1 < len(argv) and Path(argv[i + 1]).is_file():
                msg_file = Path(argv[i + 1]).resolve()
                msg = msg_file.read_text(encoding="utf-8", errors="replace")
        notes, accepted = [], {}
        try:
            gaps = staged_gaps(root, msg, notes, accepted, amend="--amend" in argv)
            if not gaps and accepted and msg_file is not None:
                write_trailers(root, msg_file, accepted)
        except _gitlib.GitError as e:
            print(f"prototype_sync_check: {e} — não avaliável (exit 2)")
            return 2
        for n in notes:
            print(f"  · {n}")
        for g in gaps:
            print(f"  ✗ {g}")
        if gaps and all(g.startswith("a mensagem traz") for g in gaps):
            print("\n  commit bloqueado: a marca «Prototype-regenerated-identical» é escrita só pela checagem, no commit que ela aceita.")
            return 1
        if gaps:
            print("\n  commit bloqueado: protótipo mudou sem o info-arch e os wireframes da versão no mesmo commit.\n"
                  "  refaça os wireframes de todas as telas (mjrp-designing-ui) e o info-arch — o que sair idêntico ao HEAD\n"
                  "  conta como refeito pela data no disco, sem entrar no commit (num merge, pelo trailer do ramo);\n"
                  "  se não há o que refazer,\n"
                  "  a decisão é do humano: trailer 'Prototype-sync: skip — <motivo>' na mensagem.")
            return 1
        return 0
    try:
        found = drift(root)
    except _gitlib.GitError as e:
        print(f"prototype_sync_check: {e} — não avaliável (exit 2)")
        return 2
    for g in found:
        print(f"  ! {g}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
