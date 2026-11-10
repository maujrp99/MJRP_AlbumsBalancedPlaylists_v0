# cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_passkey.py - what the merge hook and `remote_approval.py` share about a remote approval (CC-ADR-0038): where the approvals live, the list of
trusted keys read from `main:` of the harness, the verifier and the book of used nonces. The checks of a signature live in one place, the
utility `passkey-verify` (ops/presence/passkey_verify.swift); nothing here repeats them.

Three reads are hardened on purpose: the account comes from `pwd`, never from $HOME (a variable on the merge's command line must not point
the gate elsewhere); and the list and the source of the verifier are read with no `GIT_*` from the environment and with
GIT_NO_REPLACE_OBJECTS: a linked worktree's hook inherits GIT_DIR, and `git replace` changes what `main:` returns with no commit and no hook.
This holds an agent's shortcut and error, not an agent decided to deceive in the same user (the limit CC-ADR-0038 names).

Stdlib only. It travels to the children with the support modules (`_*.py`, `VENDORED_FILES`), and since CC-ADR-0041 the passkey counts there too:
one list of keys, the harness's; the project is the folder of the merge's repository, under the fixed projects folder and in the Control Center's
registry; and a child's copy of this module and of `visual_gate.py`, minus the copy's stamp line, must be byte for byte the harness's at `main:`,
or the passkey is out and the Touch ID stays (a fix made here does not count in a child before its refresh).
"""
import base64
import binascii
import fcntl
import hashlib
import json
import os
import pwd
import re
import subprocess
import time
from pathlib import Path

ACCOUNT_HOME = Path(pwd.getpwuid(os.getuid()).pw_dir)
HARNESS_PROJECT = "mjrp-harness"
HARNESS_ROOT_COMMIT = "56bc71678a2fca1d5e235dd2886039afe5c8585c"   # a root commit of the harness: the folder is the harness only when its main holds it
FLOOR_FILES = ("_passkey.py", "visual_gate.py")                     # a child's copies that decide a remote approval (CC-ADR-0041)
COPY_STAMP = re.compile(re.escape("# cópia carimbada do MJRP Harness · ".encode()) + rb"[^\n]*\n")  # new_project_kernel.vendored_file_text
LIST_PATH = "apps/control-center/ops/passkeys/trusted.json"
SOURCE_PATH = "apps/control-center/ops/presence/passkey_verify.swift"
APPROVAL_NOTES = "refs/notes/mjrp-approval"          # the signature of an acceptance or a catalog marking; a merge's goes in mjrp-visual-ok
BUDGET_SECONDS = 10                                  # all the hook spends here, before it may still ask for the Touch ID (the train gives 60 s)
READ_SECONDS = 5


class Unevaluable(Exception):
    """The passkey cannot be evaluated here: the hook says so and asks for the Touch ID, and it never reads as "no key"."""


def cc_home():
    return ACCOUNT_HOME / ".mjrp" / "control-center"


def projects_dir():
    return ACCOUNT_HOME / "mjrp" / "projects"


def harness_path():
    return projects_dir() / HARNESS_PROJECT


def approvals_dir():
    return cc_home() / "approvals"


def verifier_path():
    return cc_home() / "bin" / "passkey-verify"


def clean_env():
    """The environment of a read that must not follow the merge in course: no `GIT_*`, no replaced objects."""
    env = {k: v for k, v in os.environ.items() if not k.startswith("GIT_")}
    env["GIT_NO_REPLACE_OBJECTS"] = "1"
    return env


def _run(argv, *, timeout=READ_SECONDS, env=None, cwd=None, data=None):
    try:
        return subprocess.run(argv, capture_output=True, timeout=timeout, env=env, cwd=cwd, input=data, check=False)
    except (OSError, subprocess.SubprocessError) as e:
        raise Unevaluable(f"{Path(argv[0]).name}: {type(e).__name__}") from e


def common_dir(cwd, env=None):
    """The absolute, resolved git common dir of `cwd`, or None. Two checkouts of one repository share it: a linked worktree too."""
    r = _run(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], env=env, cwd=str(cwd))
    return Path(r.stdout.decode().strip()).resolve() if r.returncode == 0 and r.stdout.strip() else None


def is_harness_repo(root):
    """Whether the merge in course happens in the harness. The left side keeps the hook's environment, which names the repository of the merge;
    the right side is the fixed folder with a clean one. Children get only the Touch ID (CC-ADR-0038)."""
    harness = harness_path()
    if not harness.is_dir():
        return False
    here, there = common_dir(root), common_dir(harness, clean_env())
    return here is not None and here == there


def harness_root():
    """The harness's folder, proven: the fixed folder, whose `main` holds the harness's root commit. Unevaluable when it is missing or another repository.
    A repository built with the same root commit passes: that is the limit CC-ADR-0038 names, not an error this holds."""
    harness = harness_path()
    if not harness.is_dir():
        raise Unevaluable(f"o harness não está em {harness}")
    r = _run(["git", "merge-base", "--is-ancestor", HARNESS_ROOT_COMMIT, "main"], env=clean_env(), cwd=str(harness))
    if r.returncode != 0:
        raise Unevaluable(f"{harness} não é o repositório do harness: a main de lá não tem o commit raiz")
    return harness


def registry():
    """{id: path} of the Control Center's `workspace.json`. Unevaluable when it cannot be read: a project is never assumed registered."""
    path = cc_home() / "workspace.json"
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise Unevaluable(f"o registro de projetos não se lê ({path})") from e
    projects = doc.get("projects") if isinstance(doc, dict) else None
    if not isinstance(projects, list):
        raise Unevaluable("o registro de projetos não tem a lista `projects`")
    return {str(p["id"]): Path(str(p["path"])) for p in projects if isinstance(p, dict) and p.get("id") and p.get("path")}


def project_of(root):
    """The project of the merge at `root`: the folder that holds its git common dir, read with the hook's environment. That folder must be
    `<account>/mjrp/projects/<name>` and the same repository read again with a clean one; a child must be in the registry; and the merge's work
    tree must be one of that repository's worktrees. A linked worktree counts; a clone in another folder or a `GIT_WORK_TREE` on the command line
    does not. Unevaluable otherwise: the name is never taken from the branch or from the record."""
    here = common_dir(root)
    if here is None:
        raise Unevaluable("o repositório do merge não responde")
    folder = here.parent
    if folder.parent != projects_dir().resolve():
        raise Unevaluable(f"{folder} não está em {projects_dir()}")
    if common_dir(folder, clean_env()) != here:
        raise Unevaluable(f"{folder} não é o repositório do merge")
    name = folder.name
    if name != HARNESS_PROJECT and name not in registry():
        raise Unevaluable(f"{name} não está no registro de projetos do Control Center")
    top = _run(["git", "rev-parse", "--show-toplevel"], cwd=str(root))
    trees = _run(["git", "worktree", "list", "--porcelain"], env=clean_env(), cwd=str(folder))
    listed = {Path(line[len("worktree "):]).resolve() for line in trees.stdout.decode().splitlines() if line.startswith("worktree ")}
    if top.returncode != 0 or Path(top.stdout.decode().strip()).resolve() not in listed:
        raise Unevaluable(f"a árvore do merge não é um worktree de {name}")
    return name


def copy_problem(folder=None):
    """None when this copy of FLOOR_FILES, minus the copy's stamp line (found by its pattern, never by its position, nor read for its source),
    is byte for byte the harness's file at `main:`. Else what to tell: a child behind the harness keeps the Touch ID until its refresh."""
    folder = Path(folder or Path(__file__).resolve().parent)
    for name in FLOOR_FILES:
        try:
            mine = COPY_STAMP.sub(b"", (folder / name).read_bytes(), count=1)
        except OSError:
            return f"{name} não se lê nesta cópia"
        r = _run(["git", "cat-file", "blob", f"main:mjrp-scripts/{name}"], env=clean_env(), cwd=str(harness_path()))
        if r.returncode != 0:
            return f"mjrp-scripts/{name} não está na main do harness"
        if mine != r.stdout:
            return f"a cópia de {name} difere da main do harness: falta o refresh do kernel neste projeto"
    return None


def read_list(rev="main", repo=None):
    """(`keys`) of the list at `rev` of the harness: [] when the list does not exist there. Unevaluable when it cannot be read or is malformed."""
    r = _run(["git", "cat-file", "blob", f"{rev}:{LIST_PATH}"], env=clean_env(), cwd=str(repo or harness_path()))
    if r.returncode != 0:
        probe = _run(["git", "rev-parse", "--verify", "--quiet", f"{rev}^{{commit}}"], env=clean_env(), cwd=str(repo or harness_path()))
        if probe.returncode != 0:
            raise Unevaluable(f"o repositório do harness não responde por {rev}")
        return []
    try:
        data = json.loads(r.stdout)
    except ValueError as e:
        raise Unevaluable("a lista de chaves não é JSON") from e
    keys = data.get("keys") if isinstance(data, dict) else None
    if not isinstance(keys, list) or data.get("v") != 1:
        raise Unevaluable("a lista de chaves não tem a forma {v: 1, keys: [...]}")
    return keys


def verifier_problem(repo=None):
    """None when the installed utility is the one built from the source at `main:`; else what to tell. A different one takes the passkey out."""
    binary = verifier_path()
    if not (binary.is_file() and os.access(binary, os.X_OK)):
        return f"{binary} não existe: rode o ops/install-service.sh"
    r = _run(["git", "cat-file", "blob", f"main:{SOURCE_PATH}"], env=clean_env(), cwd=str(repo or harness_path()))
    if r.returncode != 0:
        return "a fonte do verificador não está na main do harness"
    stamp = binary.with_name(binary.name + ".source-sha256")
    try:
        recorded = stamp.read_text(encoding="utf-8").strip()
    except OSError:
        recorded = ""
    if recorded != hashlib.sha256(r.stdout).hexdigest():
        return "o verificador instalado difere da fonte na main: rode o ops/install-service.sh"
    return None


def b64u_decode(text):
    try:
        return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))
    except (binascii.Error, ValueError, TypeError):
        return None


def payload_of(record):
    """The fields of the signed bytes of a record, or None. Read to FIND a record; what they are worth is the utility's to say."""
    raw = b64u_decode(record.get("payload_bytes_b64", "")) if isinstance(record, dict) else None
    try:
        data = json.loads(raw) if raw else None
    except ValueError:
        return None
    return data if isinstance(data, dict) else None


def signed_records():
    """[(path, record, payload)] of `approvals/signed/`; an unreadable file is skipped (it opens nothing)."""
    out = []
    for path in sorted((approvals_dir() / "signed").glob("*.json")):
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        payload = payload_of(record)
        if payload is not None:
            out.append((path, record, payload))
    return out


def record_of_tip(tip, project=None):
    """The newest signed record of a merge of this tip, or None; one of `project` first, since a clone shares its tips."""
    found = [(p.get("project") == project, p["issued_at"] if isinstance(p.get("issued_at"), int) else 0, r, p) for _path, r, p in signed_records()
             if p.get("kind") == "merge" and p.get("subject") == tip]
    return max(found, key=lambda x: x[:2])[2:] if found else None


def rp_of(keys, record):
    """The RP ID the list names for this record's credential, or None when the key is not on the list."""
    wanted = b64u_decode(record.get("credential_id", ""))
    for key in keys:
        if isinstance(key, dict) and wanted and b64u_decode(key.get("credential_id", "")) == wanted:
            return key.get("rp_id")
    return None


def verify(record, expect, keys, at, timeout=READ_SECONDS):
    """(exit, reason) of the utility: 0 valid, 1 refused, 2 cannot evaluate. `expect`: kind, scope, project, subject. `at`: an epoch or "issued"."""
    rp_id = rp_of(keys, record)
    if not rp_id:
        return 1, "unknown_key"
    argv = [str(verifier_path()), "--kind", expect["kind"], "--scope", expect["scope"], "--project", expect["project"],
            "--subject", expect["subject"], "--rp-id", rp_id, "--at", str(at)]
    r = _run(argv, timeout=timeout, data=json.dumps({"record": record, "keys": keys}).encode())
    said = r.stderr.decode(errors="replace").strip()
    return r.returncode if r.returncode in (0, 1, 2) else 2, said.split(": ", 1)[-1]


# --------------------------------------------------------------------------------------------- the book of used nonces
def _book():
    return approvals_dir() / "used.jsonl"


def _locked(flag):
    book = _book()
    book.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(book, os.O_RDWR | os.O_CREAT | flag, 0o600)
    fcntl.flock(fd, fcntl.LOCK_EX)
    return fd


def nonce_used(nonce):
    fd = _locked(0)
    try:
        with os.fdopen(os.dup(fd), encoding="utf-8") as f:
            f.seek(0)
            for line in f:
                try:
                    if json.loads(line).get("nonce") == nonce:
                        return True
                except ValueError:
                    continue
        return False
    finally:
        os.close(fd)


def consume_nonce(nonce, who, now=None):
    """Spends a nonce: append only, under the lock. False when it was already spent (the second one lost the race)."""
    fd = _locked(os.O_APPEND)                        # reading and appending under one lock: two spenders never both win
    try:
        data = b""
        while chunk := os.read(fd, 1 << 16):
            data += chunk
        for line in data.splitlines():
            try:
                if json.loads(line).get("nonce") == nonce:
                    return False
            except ValueError:
                continue
        os.write(fd, (json.dumps({"nonce": nonce, "at": int(now or time.time()), "by": who}) + "\n").encode())
        return True
    finally:
        os.close(fd)


# --------------------------------------------------------------------------------------------- what the hook asks
REASON_PT = {"expired": "a assinatura venceu", "wrong_subject": "a assinatura é de outro tip", "wrong_scope": "a assinatura é de outro ramo",
             "wrong_kind": "a assinatura é de outro tipo de aprovação", "wrong_project": "a assinatura é de outro projeto",
             "unknown_key": "a chave não está na lista da main", "key_expired": "a chave venceu: renovar pede o Mac",
             "key_revoked": "a chave foi revogada", "bad_signature": "a assinatura não confere",
             "no_user_verification": "o aparelho não confirmou a biometria", "no_user_presence": "o aparelho não confirmou o gesto",
             "wrong_origin": "a assinatura veio de outra origem", "wrong_rp": "a assinatura é de outro nome da máquina",
             "repeated": "a assinatura já foi usada"}


def judge_tip(root, tip, scope):
    """(state, why, record, payload) of the remote approval of this tip, in the harness or in a child (CC-ADR-0041). `state`: "none" (no record:
    the Touch ID as always), "valid", "invalid" (refuse, without the Touch ID) or "unavailable" (the passkey is out: say so and ask for the Touch
    ID). Everything that cannot be evaluated is decided before anything is refused."""
    started = time.monotonic()
    try:
        if record_of_tip(tip) is None:
            return "none", "", None, None
        project = project_of(root)
        record, payload = record_of_tip(tip, project)
        harness_root()
        problem = (copy_problem() if project != HARNESS_PROJECT else None) or verifier_problem()
        if problem:
            return "unavailable", problem, record, payload
        keys = read_list()
        if not keys and _run(["git", "cat-file", "-e", f"main:{LIST_PATH}"], env=clean_env(), cwd=str(harness_path())).returncode != 0:
            return "unavailable", "a lista de chaves não existe na main do harness", record, payload
        left = max(1.0, BUDGET_SECONDS - (time.monotonic() - started))
        code, reason = verify(record, {"kind": "merge", "scope": scope, "project": project, "subject": tip}, keys, int(time.time()),
                              timeout=left)
    except Unevaluable as e:
        return "unavailable", str(e), None, None
    if code == 2:
        return "unavailable", f"o verificador não avaliou ({reason})", record, payload
    if code == 1:
        return "invalid", REASON_PT.get(reason, reason), record, payload
    if not payload.get("nonce") or nonce_used(payload["nonce"]):
        return "invalid", REASON_PT["repeated"], record, payload
    return "valid", "", record, payload


def signature_line(record):
    """One line for a note: the whole record, as signed, so the signature can be checked again later."""
    return base64.urlsafe_b64encode(json.dumps(record, sort_keys=True, separators=(",", ":")).encode()).decode()


def record_of_note(fields):
    raw = b64u_decode(fields.get("signature", ""))
    try:
        return json.loads(raw) if raw else None
    except ValueError:
        return None
