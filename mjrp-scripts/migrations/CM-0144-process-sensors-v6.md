---
id: CM-0144
item: process-sensors
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0144 · process-sensors@5 → process-sensors@6

## Por que

A F275 (o board pelo estado registrado, UAT-592) trouxe ao kernel o grafo único dos estados do board (`board_states.json`), o comando que grava cada passagem (`board_move.py`) e o juiz dos dois (`board_states_check.py`). O board deixa de adivinhar a coluna: desenha só o que o comando gravou, e o juiz confere o registro contra a spec na `main`. O padrão do manifesto muda por isso (o digest), e a versão sobe.

## O que muda

- O `process_sensors.json` ganha `board_states_check.py`, que roda como sensor do contrato (`sensors.board_states`). Chega ao filho com o kernel, junto do grafo e do comando.
- O check do item passa a pedir também `sensors.board_states` no contrato do filho.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o grafo, o comando e o juiz.
2. Declara no `.mjrp-project.yml`, em `sensors:`, `board_states: "python3 mjrp-scripts/board_states_check.py ."`.
3. Roda `python3 mjrp-scripts/board_move.py seed` uma vez, no checkout principal, para o estado de partida de cada feature.
4. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0144` e acrescenta `CM-0144` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0144` sai 0; `python3 mjrp-scripts/board_states_check.py .` sai 0 depois do `seed`.

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
