---
id: CM-0095
item: board
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0095 · board@1 → board@2

## Por que

Na homologação de 2026-10-31, a F99 não passou (UAT-443), mas o board continuou mostrando a feature em «Feito», como se ela esperasse o
aceite. O MJRP pediu uma coluna «Reaberto», antes de «Em andamento», para a feature que já tinha chegado a «Feito» e tem uma issue
dele aberta ligada a ela (UAT-444, F143).

## O que muda

- O padrão do harness (`mjrp-scripts/board_defaults.json`) ganha a categoria `reopened`. Ela vem de um fato, como `queued`, `waiting` e
  `accepted`, e a tabela de estados não a dá. Ganha também a flag de tipo `reopens` (`structure_types.feature.reopens: true`), a coluna
  `reopened` logo depois de `queue` na lista global `columns`, e `reopened` nas colunas do board `end-to-end`.
- A cobertura de cada board passa a cobrar onde cai o par estágio × `reopened` de um tipo que `reopens`. Os tipos que seguem a mãe não
  recebem a categoria: a task de uma feature reaberta continua «Em andamento».
- O `board_mapping_check.py` mostra a categoria como «Reaberto» no de-para.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o padrão e o `board_mapping_check.py` novos.
2. Se o `docs/specs/board.json` do projeto **não** declara `columns` nem boards com colunas por correspondência, não há nada a fazer: o
   padrão já traz a coluna.
3. Se ele declara `columns` (a lista global dos boards por categoria), a `mjrp-configuring-boards` acrescenta uma coluna que tome
   `reopened`, de preferência `{"id": "reopened", "categories": ["reopened"]}` logo antes da coluna de `in_progress`. Se o projeto
   declara um board com colunas por correspondência que admite features, a skill põe `reopened` na coluna onde o projeto quer ver a
   feature reaberta. Onde ela fica é escolha do MJRP; o padrão é antes de «Em andamento».
4. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0095` e acrescenta `CM-0095` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/board_mapping_check.py .` sai 0, sem `board_config_shape` (`coverage_none` com `reopened`), e
`conformance_check.py . --gaps` não lista `board`.

## Quando não se aplica

No perfil `content` e no `meta`. Um projeto sem `docs/specs/board.json` próprio, ou sem `columns` nem colunas por correspondência, só
registra a nota.
