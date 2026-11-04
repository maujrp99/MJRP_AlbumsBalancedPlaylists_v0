---
id: CM-0044
item: record-shapes
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0044 · record-shapes@1 → record-shapes@2

## Por que

Os modelos de relatório que o `record-shapes` guarda (`doc-audit`, `staleness-audit`, `code-quality-report`, `quality-review`, `bug-report` e `coverage-report`) não traziam cabeçalho com `type:`; só o `ux-audit` trazia. O Control Center tira o tema do relatório do `type:` (lista única `mjrp-scripts/report_types.json`), e um relatório escrito do modelo ficava sem tema. Os seis modelos ganharam o cabeçalho `type: <tipo>` — e, como o modelo é fonte de padrão do item, mudar o modelo sobe a versão com uma nota.

Nasceu de: decisão do MJRP (2026-10-17 22:48, «sim, siga com as três»): todo modelo de relatório declara o seu `type:`; a cobrança do tipo no relatório do filho mora no `report-names@2` (CM-0043).

## O que muda

- Os seis modelos acima abrem com `type: <tipo>` (o nome do tipo na lista), e o `bug-report` e o `coverage-report` passam a dizer onde moram (`reports/audits/AAAA-MM-DD-<slug>-bug-report.md` e `...-<Fxx>-coverage-report.md`).
- **O check do item não muda**: `record_shapes_check.py` continua julgando a forma (título e seções) pelo tipo no nome do arquivo. Quem cobra o `type:` do relatório é o `report-names@2`; esta nota existe porque o padrão (o modelo) mudou, e o filho deve escrever os próximos relatórios do modelo novo.

## O que o filho faz

1. Nenhum arquivo a mudar por causa desta nota: o `record_shapes_check.py` passa como passava.
2. Os próximos relatórios dos seis tipos nascem do modelo novo (a skill dona entrega com o `type:`); os que já existem ganham o `type:` pela nota CM-0043, não por esta.

Depois de conferir, acrescente `CM-0044` a `conformance.applied` no contrato.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0044` sai 0 e `--gaps` não lista `record-shapes`.

## Quando não se aplica

Projeto que não é code-app, ou sem os relatórios desses seis tipos.
