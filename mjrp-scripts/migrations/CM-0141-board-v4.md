---
id: CM-0141
item: board
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0141 · board@3 → board@4

## Por que

A F272 (a UAT-588, 2026-11-17) mudou o padrão do harness: a feature `Cancelled` deixa de cair na categoria `off`, que o board esconde, e passa à categoria `closed`, no estágio `homologation`. O MJRP cancelou uma feature e queria vê-la no board, junto das fechadas. A adiada (`deferred`) continua `off`: pode voltar.

## O que muda

- O padrão (`mjrp-scripts/board_defaults.json`): `states.feature.cancelled` vale `{stage: homologation, category: closed}`.
- A coluna das fechadas dos boards por categoria passa a se chamar «Encerrado» (Features e Tudo) e agrupa dentro dela «Fechadas» e «Canceladas»; cada card diz o desfecho. A tela é do Control Center; o filho só recebe o padrão.
- As tasks de uma feature cancelada ou adiada deixam o board com ela.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o padrão novo.
2. Se o `docs/specs/board.json` do projeto **não** declara `states.feature` nem `columns`, não há mais nada: o padrão já vale.
3. Se ele declara `states.feature.cancelled`, a `mjrp-configuring-boards` decide com o MJRP se a feature cancelada aparece em «Encerrado» (a categoria `closed`, como o padrão) ou continua escondida (`off`). Se ele declara `columns` sem a coluna das fechadas (categoria `closed`), a feature cancelada cai em «sem coluna» na conferência: acrescente a coluna.
4. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0141` e acrescenta `CM-0141` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0141` sai 0; `board_mapping_check.py .` sai 0 e uma feature `Cancelled` aparece em «Encerrado».

## Quando não se aplica

Projeto que não é `code-app` (o item `board` não se aplica a ele).
