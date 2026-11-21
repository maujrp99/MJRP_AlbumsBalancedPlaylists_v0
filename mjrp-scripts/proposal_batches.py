#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
r"""
proposal_batches.py - a batch of proposals of an agent (F181, S-211; CC-ADR-0042): the one home of its shape.

An agent of a project writes `reports/proposals/<AAAA-MM-DD-HHMM>-<slug>.md`: a set of equal items, each with the agent's recommendation,
that MJRP approves or corrects in the Control Center's «Agent Proposals» tab. The screen's server writes `→ respondida` on each item it
answered (CC-ADR-0042); the project's agent applies the answer in its next session and marks it here, with `mark`. The Control Center loads
THIS file by path (as `kernel_uat` does), so the shape, the valves and the marks live in one place (CC-ADR-0042 § 1).

The file:

    ---
    format: proposal-batch@1
    batch: 2026-11-04-1640-books-no-category        # the file's name, without `.md`
    title: Livros sem categoria
    asked_at: 2026-11-04 16:40
    question: Em que categoria este livro entra?
    effect: o livro entra no mapa da categoria escolhida   # optional
    options_from: data/raw/books_categories/MJRP Categories.md   # optional: the project's closed list, one entry per line
    ---
    ### D-01 · Ask, Jeff Wetzler
    Contexto: Sobre fazer perguntas melhores no trabalho.
    Base: fraca — só metadados; a nota não tem resumo
    Evidência: [[MJRPvault/Books/Ask|a nota do livro]]
    Escolha: várias                                  # `uma` (default) or `várias`
    - a) Leadership Essentials · Coaching, Feedback & Conversas (Recomendado)
    - b) Comunicação (Recomendado)

The marks, appended under the item, never edited:

    → respondida em 2026-11-07 22:50
      - a
      - (lista) Psicologia · Processos Cognitivos & Comportamento
      - (outra) um texto livre
      - comentário: …
    → aplicada em 2026-11-08 09:10: entrou nos mapas de Leadership e de Comunicação
    → não aplicada em 2026-11-08 09:10: a subcategoria não tem mapa no vault

What never goes in a batch: an acceptance, a stamp, a waiver (the human's valves) - `check` refuses it, and so does the route.

Usage:
  python3 mjrp-scripts/proposal_batches.py check <project> [<batch>]     # every batch of reports/proposals/, or one
  python3 mjrp-scripts/proposal_batches.py mark <project> <batch> <ITEM> aplicada|nao-aplicada "<o que fez ou por quê>"
Exit 0 ok · 1 a batch out of shape, or a mark refused · 2 not evaluable (no project, no file, bad arguments).
Stdlib only; vendored into every child with the kernel.
"""
from __future__ import annotations

import hashlib
import os
import re
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

FORMAT = "proposal-batch@1"
FOLDER = Path("reports") / "proposals"
MAX_ITEMS = 200
MAX_COMMENT = 500
MAX_OTHER = 200
REQUIRED = ("format", "batch", "title", "asked_at", "question")
BRASILIA = ZoneInfo("America/Sao_Paulo")

NAME = re.compile(r"^\d{4}-\d{2}-\d{2}-\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*$")
ITEM_HEAD = re.compile(r"^### ([A-Z][A-Z0-9]*-\d+) · (.+?)\s*$")
OPTION = re.compile(r"^- ([a-z])\) (.+?)\s*$")
RECOMMENDED = " (Recomendado)"
FIELD = re.compile(r"^(Contexto|Base|Evidência|Escolha|Pergunta): ?(.*)$")
MARK = re.compile(r"^→ (respondida|aplicada|não aplicada) em (\d{4}-\d{2}-\d{2} \d{2}:\d{2})(?::\s*(.*))?$")
ANSWER_LINE = re.compile(r"^  - (.+)$")
EVIDENCE = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")
# The human's valves never ride in a batch (CC-ADR-0042 § 5). The check is by words - the ADR's declared residue.
VALVES = (
    re.compile(r"\bHuman-(?:accepted|reopened|prioritized)\b", re.I),
    re.compile(r"\b(?:Conformance-waiver|Catalog-editorial)\b", re.I),
    re.compile(r"\baceit(?:e|a|ar|o)\s+(?:a|da|o|do)\s+(?:F\d+|S-\d+|feature|story|hist[óo]ria|ADR)\b", re.I),
    re.compile(r"\bcarimb(?:o|ar|e)\b", re.I),
    re.compile(r"\bdispens(?:a|ar)\s+(?:a|o|da|do)\b", re.I),
)


class BatchError(ValueError):
    """A batch that does not read, or an operation it refuses, in MJRP's words."""


def _front(text: str) -> tuple[dict[str, str], list[str]]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise BatchError("o lote não começa com o cabeçalho (---)")
    try:
        end = lines.index("---", 1)
    except ValueError:
        raise BatchError("o cabeçalho do lote não fecha (---)") from None
    head: dict[str, str] = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, sep, value = line.partition(":")
        if not sep:
            raise BatchError(f"linha do cabeçalho sem «:»: {line.strip()}")
        head[key.strip()] = value.split("  #")[0].strip()
    return head, lines[end + 1:]


def parse(text: str) -> dict:
    """The batch as plain data: the header, and the items with their options, recommendations and marks. Raises BatchError."""
    head, body = _front(text)
    items: list[dict] = []
    cur: dict | None = None
    last_mark: dict | None = None
    for raw in body:
        line = raw.rstrip()
        m = ITEM_HEAD.match(line)
        if m:
            cur = {"id": m.group(1), "subject": m.group(2), "context": "", "base": "", "evidence": [], "choice": "uma",
                   "question": "", "options": [], "recommended": [], "marks": []}  # fmt: skip
            items.append(cur)
            last_mark = None
            continue
        if cur is None or not line.strip():
            continue
        mk = MARK.match(line)
        if mk:
            last_mark = {"kind": mk.group(1), "at": mk.group(2), "text": (mk.group(3) or "").strip(), "answer": []}
            cur["marks"].append(last_mark)
            continue
        al = ANSWER_LINE.match(raw)
        if al and last_mark is not None:
            last_mark["answer"].append(al.group(1).strip())
            continue
        last_mark = None
        op = OPTION.match(line)
        if op:
            label = op.group(2)
            rec = label.endswith(RECOMMENDED)
            label = label[: -len(RECOMMENDED)] if rec else label
            cur["options"].append({"key": op.group(1), "label": label})
            if rec:
                cur["recommended"].append(op.group(1))
            continue
        fd = FIELD.match(line)
        if fd:
            key, value = fd.group(1), fd.group(2).strip()
            if key == "Contexto":
                cur["context"] = value
            elif key == "Base":
                cur["base"] = value
            elif key == "Evidência":
                cur["evidence"] = [{"path": p.strip(), "label": (lbl or p).strip()} for p, lbl in EVIDENCE.findall(value)]
            elif key == "Escolha":
                cur["choice"] = "várias" if value.startswith("vári") else "uma"
            elif key == "Pergunta":
                cur["question"] = value
    return {"head": head, "items": items}


def item_hashes(text: str) -> dict[str, str]:
    """One hash per item, of its text without the mark lines (CC-ADR-0042 § 3): the agent's «aplicada» on one item changes no hash."""
    _head, body = _front(text)
    out: dict[str, str] = {}
    cur: str | None = None
    buf: list[str] = []
    in_mark = False

    def close() -> None:
        if cur is not None:
            out[cur] = hashlib.sha256("\n".join(buf).strip().encode("utf-8")).hexdigest()[:16]

    for raw in body:
        m = ITEM_HEAD.match(raw.rstrip())
        if m:
            close()
            cur, buf, in_mark = m.group(1), [raw.rstrip()], False
            continue
        if cur is None:
            continue
        if MARK.match(raw.rstrip()):
            in_mark = True
            continue
        if in_mark and ANSWER_LINE.match(raw):
            continue
        in_mark = False
        buf.append(raw.rstrip())
    close()
    return out


def status(item: dict) -> str:
    """aberta · respondida · aplicada · não aplicada - from the newest mark."""
    kinds = [m["kind"] for m in item["marks"]]
    if not kinds:
        return "aberta"
    if kinds[-1] in ("aplicada", "não aplicada"):
        return kinds[-1]
    return "respondida"


def valve(text: str) -> str | None:
    for rx in VALVES:
        m = rx.search(text)
        if m:
            return m.group(0)
    return None


def problems(text: str, name: str | None = None) -> list[str]:
    """What is out of shape, one line each, in MJRP's words. Empty: the batch is in shape."""
    try:
        data = parse(text)
    except BatchError as why:
        return [str(why)]
    head, items, out = data["head"], data["items"], []
    for key in REQUIRED:
        if not head.get(key):
            out.append(f"o cabeçalho não tem «{key}»")
    if head.get("format") and head["format"] != FORMAT:
        out.append(f"formato desconhecido: {head['format']} (este kernel lê {FORMAT})")
    if name is not None and head.get("batch") and head["batch"] != name:
        out.append(f"«batch: {head['batch']}» não é o nome do arquivo ({name})")
    if name is not None and not NAME.match(name):
        out.append(f"o nome do arquivo não segue AAAA-MM-DD-HHMM-<slug>: {name}")
    if not items:
        out.append("o lote não tem nenhum item (### <ID> · <assunto>)")
    if len(items) > MAX_ITEMS:
        out.append(f"o lote tem {len(items)} itens; o teto é {MAX_ITEMS}: divida em outro arquivo")
    hit = valve(" ".join([head.get("title", ""), head.get("question", "")]))
    if hit:
        out.append(f"o lote pede uma válvula do MJRP («{hit}»): aceite, carimbo e dispensa nunca vêm num lote")
    seen: set[str] = set()
    for it in items:
        where = it["id"]
        if where in seen:
            out.append(f"{where}: id repetido")
        seen.add(where)
        if not it["options"]:
            out.append(f"{where}: nenhuma opção (- a) …)")
        keys = [o["key"] for o in it["options"]]
        if len(set(keys)) != len(keys):
            out.append(f"{where}: letra de opção repetida")
        if it["choice"] == "uma" and len(it["recommended"]) > 1:
            out.append(f"{where}: «Escolha: uma» com mais de uma recomendada")
        if len(it["evidence"]) > 3:
            out.append(f"{where}: mais de três evidências")
        hit = valve(" ".join([it["subject"], it["question"], *(o["label"] for o in it["options"])]))
        if hit:
            out.append(f"{where}: pede uma válvula do MJRP («{hit}»)")
        answered = False
        for mk in it["marks"]:
            if mk["kind"] == "respondida":
                answered = True
                if not mk["answer"]:
                    out.append(f"{where}: «→ respondida» sem a resposta embaixo")
            elif not answered:
                out.append(f"{where}: «→ {mk['kind']}» antes de «→ respondida»")
    return out


NUMBERED = re.compile(r"^\s*(\d+)((?:\.\d+)*)\.?\s+(\S.*?)\s*$")
BULLET = re.compile(r"^\s*[-*] (\S.*?)\s*$")


def closed_list(text: str) -> list[str]:
    """The entries of a project's closed list (`options_from`): a numbered outline gives `Categoria` and `Categoria · Subcategoria`
    (`1. Business Essentials` / `1.1 Construção & Escala`); with no numbered line, the bullets; prose around them is not an entry."""
    lines = text.splitlines()
    numbered = [m for m in (NUMBERED.match(line) for line in lines) if m]
    if numbered:
        out, top = [], ""
        for m in numbered:
            if m.group(2):
                out.append(f"{top} · {m.group(3)}" if top else m.group(3))
            else:
                top = m.group(3)
                out.append(top)
        return out
    return [m.group(1) for m in (BULLET.match(line) for line in lines) if m]


def answered_text(text: str, item_id: str, answer: list[str], at: str) -> str:
    """The batch with `→ respondida em <at>` and the answer lines appended to one item (the screen's server writes it; CC-ADR-0042 § 2)."""
    return _append(text, item_id, [f"→ respondida em {at}", *(f"  - {a}" for a in answer)])


def applied_text(text: str, item_id: str, applied: bool, what: str, at: str) -> str:
    """The batch with `→ aplicada` / `→ não aplicada` appended to one item. Refuses an item without «respondida». Raises BatchError."""
    item = next((i for i in parse(text)["items"] if i["id"] == item_id), None)
    if item is None:
        raise BatchError(f"o lote não tem o item {item_id}")
    if status(item) == "aberta":
        raise BatchError(f"{item_id} ainda não foi respondido: só se marca o que o MJRP respondeu")
    what = " ".join(what.split())
    if not what:
        raise BatchError("diga o que foi feito, ou por que não")
    kind = "aplicada" if applied else "não aplicada"
    return _append(text, item_id, [f"→ {kind} em {at}: {what}"])


def _append(text: str, item_id: str, new: list[str]) -> str:
    lines = text.split("\n")
    start = next((n for n, line in enumerate(lines) if (m := ITEM_HEAD.match(line.rstrip())) and m.group(1) == item_id), None)
    if start is None:
        raise BatchError(f"o lote não tem o item {item_id}")
    end = next((n for n in range(start + 1, len(lines)) if ITEM_HEAD.match(lines[n].rstrip())), len(lines))
    while end > start + 1 and not lines[end - 1].strip():
        end -= 1
    return "\n".join(lines[:end] + new + lines[end:])


def _replace(path: Path, text: str) -> None:
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(text)
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


def _batch_path(project: Path, name: str) -> Path:
    name = name[:-3] if name.endswith(".md") else name
    if not NAME.match(name):
        raise BatchError(f"nome de lote fora da forma: {name}")
    path = project / FOLDER / f"{name}.md"
    if path.is_symlink() or not path.is_file():
        raise BatchError(f"lote não encontrado: {FOLDER / (name + '.md')}")
    return path


def cmd_check(project: Path, name: str | None) -> int:
    folder = project / FOLDER
    files = [_batch_path(project, name)] if name else sorted(p for p in folder.glob("*.md") if not p.is_symlink()) if folder.is_dir() else []
    bad = 0
    for path in files:
        found = problems(path.read_text(encoding="utf-8"), path.stem)
        if found:
            bad += 1
            print(f"proposal_batches: {FOLDER / path.name} fora da forma")
            for line in found:
                print(f"  - {line}")
    if not bad:
        print(f"proposal_batches: {len(files)} lote(s) na forma {FORMAT}")
    return 1 if bad else 0


def cmd_mark(project: Path, name: str, item_id: str, kind: str, what: str) -> int:
    if (project / ".git").is_file():  # a worktree: the batch and its marks live in the main checkout (CC-ADR-0042 § 6)
        print("proposal_batches: marque no checkout principal do projeto, não num worktree: é lá que o lote e as respostas moram")
        return 1
    if kind not in ("aplicada", "nao-aplicada"):
        print("proposal_batches: o tipo é «aplicada» ou «nao-aplicada»")
        return 2
    path = _batch_path(project, name)
    before = path.read_text(encoding="utf-8")
    at = f"{datetime.now(BRASILIA):%Y-%m-%d %H:%M}"
    after = applied_text(before, item_id, kind == "aplicada", what, at)
    if path.read_text(encoding="utf-8") != before:
        print("proposal_batches: o lote mudou durante a marca; rode de novo")
        return 1
    _replace(path, after)
    print(f"proposal_batches: {item_id} → {'aplicada' if kind == 'aplicada' else 'não aplicada'} em {at}")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[0] not in ("check", "mark"):
        print(__doc__)
        return 2
    project = Path(argv[1]).expanduser()
    if not project.is_dir():
        print(f"proposal_batches: projeto não encontrado: {project} (não avaliável)")
        return 2
    try:
        if argv[0] == "check":
            return cmd_check(project, argv[2] if len(argv) > 2 else None)
        if len(argv) != 6:
            print(__doc__)
            return 2
        return cmd_mark(project, argv[2], argv[3], argv[4], argv[5])
    except BatchError as why:
        print(f"proposal_batches: {why}")
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
