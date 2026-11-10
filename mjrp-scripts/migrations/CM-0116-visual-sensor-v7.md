---
id: CM-0116
item: visual-sensor
from: 6
to: 7
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0116 · visual-sensor@6 → visual-sensor@7

## Por que

O OK visual da via rápida exigia o Touch ID na frente do Mac, e isso parava o merge quando o MJRP estava longe (UAT-453). A F153 traz a aprovação de longe, por passkey no iPhone (CC-ADR-0038). O portão visual mudou por isso.

## O que muda

- No repositório do harness, antes de pedir o dedo, o `mjrp-scripts/visual_gate.py` procura uma assinatura daquele tip. A válida é o veredito, e a nota diz `presence: passkey`; a inválida recusa sem pedir o dedo.
- Nos filhos, só Touch ID: o `_passkey.py` não vai para lá, e o portão segue como antes. Por trava, nenhum registro é lido fora do harness.
- O merge solto pela válvula do humano deixa uma nota com `presence: human-released`, nos filhos também.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o `visual_gate.py` novo.
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0116` e acrescenta `CM-0116` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/visual_gate_selftest.py` sai 0, e `conformance_check.py . --gaps` não lista `visual-sensor`.

## Quando não se aplica

No perfil `content` e no `meta`, e num projeto sem tela: só registra a nota.
