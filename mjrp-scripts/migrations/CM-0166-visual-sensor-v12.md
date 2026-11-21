---
id: CM-0166
item: visual-sensor
from: 11
to: 12
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0166 · visual-sensor@11 → visual-sensor@12

## Por que

O portão `visual_gate.py` (e o `_passkey.py` que ele usa) passa a conferir, só no harness, a passkey única do conserto de bug (`kind: fix-release`, CC-ADR-0058): a assinatura cobre a ponta e a base; o merge confere `main == base` e a árvore do índice igual à da ponta, grava a nota de auditoria e o carimbo `merge` e gasta o uso `merge`.

Nasceu de: a UAT-589 e a decisão do MJRP de 2026-11-17 20:31 (aceite da CC-ADR-0058). Decidido pelo agente, revisável pelo MJRP.

## O que muda

- só o código do portão: sem pedido `fix-release`, o merge segue como hoje; num filho, a função devolve cedo e valem as duas passkeys.
- **o `check` do item não muda**: é o mesmo da v11. Um filho que passa na v11 passa na v12.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0166` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.

## Como se confere

`conformance_check.py . --check-note CM-0166` sai 0 e `--gaps` não lista `visual-sensor`.

## Quando não se aplica

Nos projetos sem tela (`has_screen` falso).
