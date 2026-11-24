---
id: CM-0123
item: board
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0123 · board@2 → board@3

## Por que

A F146 (2026-11-01) pôs no padrão do harness a coluna «Em avaliação (Evals)»: a feature cujo trabalho terminou e espera o juiz. Nenhuma nota
levou a mudança aos filhos (UAT-455, achado P2-4 da crítica da ADR-0031). Um filho que escolheu as próprias colunas do board, ao atualizar o
kernel, passa a reprovar na conferência do de-para com `coverage_none`, e nada lhe diz o que fazer.

## O que muda

- O padrão do harness (`mjrp-scripts/board_defaults.json`) tem a categoria `evaluating`. Ela vem de um fato, como `queued`, `waiting`,
  `reopened` e `accepted`, e a tabela de estados não a dá. Tem também a flag de tipo `evaluated` (`structure_types.feature.evaluated: true`),
  a coluna `evaluating` logo depois de `waiting` na lista global `columns`, uma coluna `evaluating` no board `tasks`, e `evaluating` nas
  colunas do board `end-to-end`.
- A cobertura de cada board passa a cobrar onde caem os pares estágio × `evaluating` e estágio × `done` que um tipo `evaluated` alcança a
  partir de `in_progress` (a regra do juiz, R7). Os tipos que seguem a mãe não recebem a categoria.
- O `board_mapping_check.py` mostra a categoria como «Em avaliação (Evals)» no de-para.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o padrão e o `board_mapping_check.py` novos.
2. Se o `docs/specs/board.json` do projeto **não** declara `columns` nem boards com colunas por correspondência, não há nada a fazer: o
   padrão já traz a coluna.
3. Se ele declara `columns` (a lista global dos boards por categoria), a `mjrp-configuring-boards` acrescenta uma coluna que tome
   `evaluating`, de preferência `{"id": "evaluating", "categories": ["evaluating"]}` logo depois da coluna de `waiting`. Se o projeto
   declara um board com colunas por correspondência que admite features, a skill põe `evaluating` na coluna onde o projeto quer ver a
   feature que espera o juiz. Onde ela fica é escolha do MJRP; o padrão é depois de «Esperando».
4. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0123` e acrescenta `CM-0123` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/board_mapping_check.py .` sai 0, sem `board_config_shape` (`coverage_none` com `evaluating`), e
`conformance_check.py . --gaps` não lista `board`.

## Quando não se aplica

No perfil `content` e no `meta`. Um projeto sem `docs/specs/board.json` próprio, ou sem `columns` nem colunas por correspondência, só
registra a nota.
