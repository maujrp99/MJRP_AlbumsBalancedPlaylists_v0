---
id: CM-0145
item: board
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0145 · board@4 → board@5

## Por que

A F275 (o board pelo estado registrado, UAT-592) troca a adivinhação da coluna por um registro: cada passagem de uma feature ou de uma issue é gravada pelo `board_move.py`, conferida no grafo único (`board_states.json`), e o board desenha o que foi gravado. O MJRP decidiu que «Esperando» são dois estados, esperando o cliente e esperando o agente, e que existe «Esperando o merge». São três categorias novas, que só o registro dá: `waiting_human`, `waiting_agent` e `awaiting_merge`.

## O que muda

- O padrão (`mjrp-scripts/board_defaults.json`) ganha as colunas «Esperando o cliente» (`waiting_human`), «Esperando o agente» (`waiting_agent`) e «Esperando o merge» (`awaiting_merge`), nos boards por categoria, no das tasks, no das issues e no ponta a ponta.
- O de-para (`board_mapping_check.py`) dá o rótulo das três.
- A Discovery ganha o estágio «Backlog» (`backlog`) antes de «Explorar»: a story que ninguém tocou fica nele, e não mais em «Explorar». A etapa do ciclo também é gravada (o lote 1b): `board_move.py stage <item> <etapa>`, com a evidência, e o board põe a fase e o estágio do item pela etapa gravada.
- Nenhuma coluna é exigida: onde a configuração do projeto não tem a coluna de uma espera gravada, o item fica em «Esperando», como antes.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o padrão, o grafo e o comando.
2. Se o `docs/specs/board.json` do projeto **não** declara `columns` nem os estágios da Discovery, não há mais nada: as colunas e o «Backlog» já valem. Se declara os estágios da Discovery, a `mjrp-configuring-boards` acrescenta `backlog` antes de `explore`. Se declara, a `mjrp-configuring-boards` pergunta ao MJRP se acrescenta as três colunas; sem elas, as esperas gravadas aparecem em «Esperando».
3. Roda `python3 mjrp-scripts/board_move.py seed` uma vez, no checkout principal (a nota CM-0144).
4. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0145` e acrescenta `CM-0145` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0145` sai 0; `board_mapping_check.py .` sai 0.

## Quando não se aplica

Projeto que não é `code-app` (o item `board` não se aplica a ele).
