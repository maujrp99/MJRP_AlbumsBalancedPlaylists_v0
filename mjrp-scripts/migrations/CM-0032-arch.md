---
id: CM-0032
item: arch
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0032 · arch@0 → arch@1

## Por que

Um projeto com código precisa da arquitetura escrita: os componentes e o que cada um faz, o caminho do dado, a infraestrutura e as restrições. É o que a `mjrp-critiquing-architecture` julga, o que todo `plan.md` refina («o que este plano muda no `arch.md`») e o que o auditor de documentos compara com o código. O MJRP decidiu que o arquivo de arquitetura é do engineering canon e tem que estar em todo subprojeto que tenha código.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Arquivo de arquitetura é do engineering canon, tem que estar em todos os subprojetos que tenham código.»

## O que muda

- `docs/specs/arch.md`, aberto pelo título `# Architecture`, com o que o modelo `templates/arch.md` da `mjrp-specifying-sdd-artifacts` traz: visão geral, mapa de componentes, fluxo de dados, infraestrutura e restrições.

## O que o filho faz

1. `mjrp-designing-architecture` (esqueleto de `arch.md`): se o arquivo **não existe**, parta do modelo `templates/arch.md` e escreva o que o código **é** — a estrutura de pastas, os módulos e a direção das dependências, onde o dado entra e sai, onde roda; num brownfield, a história do git ajuda (`reference/brownfield.md` da `mjrp-pdlc-bootstrap`). Reflita a realidade, não o ideal.
2. As escolhas que o código não revela (por que esta stack, o limite de escala que o MJRP quer) **são dele**: pergunte com opções; uma decisão difícil de reverter vira ADR (`mjrp-recording-decisions`), nascendo `Proposed`.
3. Se o arquivo **existe com outro título**, ajuste só o título; o conteúdo já escrito fica.
4. Recomendado, não exigido pelo check: uma passada da `mjrp-critiquing-architecture` no esqueleto novo (o item `arch-critique` cobra a crítica nos projetos com ADR).
5. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0032` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `arch`; `conformance_check.py . --check-note CM-0032` sai 0.

## Quando não se aplica

Projeto `content` ou `meta` (sem código de produto).
