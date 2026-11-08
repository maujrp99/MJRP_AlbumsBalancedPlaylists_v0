---
id: CM-0065
item: report-names
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0065 · report-names@4 → report-names@5

## Por que

O `pedroso-incorp` tem um relatório de conferência dos números da importação dos lançamentos
(`reports/audits/2026-09-28-pedroso-incorp-migration-reconciliation.md`) que não cabia em nenhum tipo da lista: o `graph-reconciliation` é a
reconciliação de um nó do grafo de requisitos, e o `measurement-report` mede o trabalho. O MJRP decidiu em 2026-10-18 que a conferência de dados
importados contra a fonte é um tipo, `data-reconciliation`.

Nasceu de: a pergunta do `pedroso-incorp` sobre o tipo desse relatório (a auditoria de conformidade de 2026-10-18), registrada no `harness-kaizen`.

## O que muda

- `mjrp-scripts/report_types.json` ganha o tipo **`data-reconciliation`**: tema `migration`, pasta `audits`, sem skill dona (permitido pelo MJRP),
  «conferência de dados migrados ou importados contra a fonte (contagens e valores, por exemplo ao centavo), com as divergências e a decisão de cada uma».
  O Control Center lê o tema da lista; a tela já o mostra em Migração.
- Quando um relatório não declara o tipo, a sugestão do `report_types_check` agora desempata pela **dica mais específica**: o nome `…-migration-reconciliation`
  aponta o `data-reconciliation` antes do `graph-reconciliation`.
- O check do item **não muda**.

## O que o filho faz

Um relatório que cabe no tipo **o declara** (`type: data-reconciliation` no cabeçalho); nada mais muda. Se o filho não tem relatório assim, só registre a
nota: acrescente `CM-0065` a `conformance.applied`, sem rodada.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0065` sai 0 (o mesmo check da v4).

## Quando não se aplica

Projeto sem `reports/` (`has_path:reports`).
