---
id: CM-0030
item: constitution
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0030 · constitution@0 → constitution@1

## Por que

A `constitution.md` é o que é da stack deste projeto — tipagem, tamanho de arquivo, nomes, padrões com endereço, proibições — herdando o `PRINCIPLES.md` do harness. É o documento que o SDD consulta antes de todo plano (a conferência «Constitution Check» do `plan.md`) e que a `mjrp-assessing-code-quality` usa de régua. Sem ela, o plano e a revisão não têm contra o que conferir.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para o nosso harness. (SDD)»

## O que muda

- `docs/specs/constitution.md`, aberta pelo título `# Constitution`, na forma de `templates/constitution.md` da `mjrp-pdlc-bootstrap`.

## O que o filho faz

1. `mjrp-pdlc-bootstrap` (modo conform), com `reference/constitution-guide.md` e o modelo `templates/constitution.md`: se o arquivo **não existe**, escreva-o a partir do que **é** verdade no código — `package.json`/`pyproject`, os padrões que o código já segue, a lista de proibições que o repositório já faz cumprir (lint, testes). A constituição reflete a **realidade**, não o ideal; o ideal vira decisão registrada (`mjrp-recording-decisions`).
2. O que o código não responde (o limite de tamanho que acende o alarme, uma proibição que o MJRP quer) é **dele**: pergunte, com opções e recomendação; não invente.
3. Se o arquivo **existe com outro título** (`# Constituição`, `# Princípios do projeto`), ajuste só o título e, se faltar, a linha de herança do `PRINCIPLES.md`; não reescreva o conteúdo.
4. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0030` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `constitution`; `conformance_check.py . --check-note CM-0030` sai 0.

## Quando não se aplica

Projeto `content` ou `meta`.
