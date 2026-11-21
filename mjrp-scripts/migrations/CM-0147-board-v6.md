---
id: CM-0147
item: board
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0147 · board@5 → board@6

## Por que

A F285 (a UAT-456, 2026-11-18): uma versão do produto «Entregue» sem nenhuma feature nem issue no board é legítima, mas pede uma linha de justificativa no de-para da importação (o MJRP decidiu em 2026-11-18 00:15, D-01 = a). O juiz do board servido passa a reprovar a versão entregue vazia que não a tem.

## O que muda

- O registro do de-para (`docs/specs/board-mapping.json`) aceita `empty_reason` (uma linha de texto) num agrupamento de tipo `release`. O `board_mapping_check.py` reprova (`grouping_shape`) o campo vazio ou num agrupamento que não é versão do produto.
- O `board_served_check.py` (do harness, que serve o board) reprova `version_delivered_empty`: versão «Entregue» sem item e sem `empty_reason` do mesmo id no de-para.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o `board_mapping_check.py` novo.
2. Para cada versão entregue sem item que o harness apontar, escrever em `docs/specs/board-mapping.json`, no agrupamento `release` dela, `"empty_reason": "<por que ela não tem feature nem issue>"`. A razão é do projeto; não se inventa.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0147` e acrescenta `CM-0147` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0147` sai 0; `board_mapping_check.py .` sai 0.

## Quando não se aplica

Projeto que não é `code-app` (o item `board` não se aplica a ele), ou sem versões entregues vazias.
