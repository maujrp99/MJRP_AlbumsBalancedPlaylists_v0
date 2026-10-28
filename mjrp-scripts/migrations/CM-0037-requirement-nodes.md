---
id: CM-0037
item: requirement-nodes
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0037 · requirement-nodes@0 → requirement-nodes@1

## Por que

Cada requisito é um nó do grafo: um arquivo em `docs/specs/requirements/<pasta do épico>/` com o frontmatter que o sensor do grafo, o Board do Control Center e a `mjrp-ensuring-sdd` leem. Os cinco modelos da `mjrp-writing-reqs` (`req-story-backlog`, `req-story-ready`, `req-use-case`, `req-ears`, `req-nfr`) começam pelo mesmo frontmatter: `id`, `type`, `status`. Um nó sem um deles não aparece no Board nem entra na contagem do épico.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para nosso PDLC.»

## O que muda

- todo `docs/specs/requirements/*/*.md` traz `id:`, `type:` e `status:` no frontmatter. O resto do nó (formato, épico, `points_to`, `planned_for`, as seções `## pt-BR` e `## en`) segue sendo julgado pelo `requirements_graph_check.py` (o sensor do grafo que o doctor roda) — o item não o repete.

## O que o filho faz

1. `mjrp-writing-reqs`: abra o nó que o check lista e acrescente a chave que falta, **lendo do próprio nó** — o `id` está no nome do arquivo (`S-07-…` → `S-07`), o `type` é `requirement` (ou `nfr` na pasta `nfr/`) e o `status` é o que a evidência do projeto sustenta (a `mjrp-ensuring-sdd` reconcilia se não for claro). Não troque o formato nem o texto do requisito.
2. Rode `python3 mjrp-scripts/requirements_graph_check.py .` para ver o que o grafo ainda aponta.
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0037` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `requirement-nodes`.

## Quando não se aplica

Projeto sem nenhum nó em `docs/specs/requirements/*/` (o check só vale onde há requisitos). Fora do perfil `code-app`.
