---
id: CM-0162
item: visual-sensor
from: 10
to: 11
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0162 · visual-sensor@10 → visual-sensor@11

## Por que

O portão `visual_gate.py` passa a conhecer o veredito `not-checked`: o juiz estourou o teto de tempo (5 minutos, 3 num conserto de bug) e nada foi aprovado.

Nasceu de: o pedido do MJRP de 2026-11-20 17:01 (S-248, F316): o juiz visual levou ~25 minutos num conserto de bug. Decidido pelo agente, revisável pelo MJRP.

## O que muda

- `verdict: not-checked` no relatório da reconferência é recusado como `incomplete`; `duration_s` no cabeçalho é gravado para medir e não é lido pelo portão.
- **o `check` do item não muda**: é o mesmo da v10. Um filho que passa na v10 passa na v11.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0162` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.

## Como se confere

`conformance_check.py . --check-note CM-0162` sai 0 e `--gaps` não lista `visual-sensor`.

## Quando não se aplica

Nos projetos sem tela (`has_screen` falso).
