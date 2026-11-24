---
id: CM-0139
item: report-names
from: 7
to: 8
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0139 · report-names@7 → report-names@8

## Por que

O conform do MJRP Personal (2026-11-16) fechou de 9 lacunas a 1, e a que sobrou era da lista do harness (UAT-584, F266): os 12 lotes de `reports/proposals/` (o Agent Proposals, `format: proposal-batch@1`) saíam reprovados um a um pelo `report_types_check.py` («sem `type:` — nenhum tipo da lista serve de longe»), e o filho não pode inventar tipo. O mesmo projeto tem pesquisas em `reports/research/`, e o harness tem as suas, com `type: research`, que também não estava na lista. Pasta nova de relatório criada por uma feature (a F181 criou `reports/proposals/`) tem de entrar na lista na mesma feature.

## O que muda

- `mjrp-scripts/report_types.json`: o tipo **`proposal-batch`** — `by_folder`, pasta `proposals`, tema `handoffs`, sem `type:` no cabeçalho (o lote leva `format: proposal-batch@1`, que o `proposal_batches.py` valida); e o tipo **`research`** — pasta `research`, tema `measure`, `type: research` no cabeçalho. Nenhum tema novo: a tela do Control Center segue com os 12.
- O check do item **não muda**: o `report_types_check.py` já lê `by_folder` da lista.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `report_types.json` novo.
2. Nada a reescrever nos lotes: eles não levam `type:`. Uma pesquisa em `reports/research/` declara `type: research` ou outro tipo da lista que a descreva melhor (`measurement-report`, `content-audit`…): o que já declara um tipo da lista continua valendo.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0139` e acrescenta `CM-0139` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0139` sai 0, e `python3 mjrp-scripts/report_types_check.py .` não acusa mais arquivo de `reports/proposals/`.

## Quando não se aplica

Projeto sem `reports/`.
