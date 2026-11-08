---
id: CM-0058
item: product-structure
from: 6
to: 7
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0058 · product-structure@6 → product-structure@7

## Por que

A auditoria do conform do `pedroso-incorp` (2026-10-18, ponto 4) achou que **nada cruzava a seção `## Entregue` do PRD com o `status:` dos specs**: o `product_structure_check` passou com «F01 … Done» no PRD e `status: In progress` no spec. A CM-0051 criou a seção `## Entregue` («o que já existe, por resultado»), e uma seção que diz o que foi entregue e pode discordar do quadro, sem que nada a pegue, é o PRD mentindo.

Nasceu de: o feedback do `pedroso-incorp`, registrado no `harness-kaizen`.

## O que muda

- Dois **avisos** novos no `product_structure_check.py` (que já lê o PRD e os specs; o item `prd` só tem cláusulas de forma, e cruzar duas fontes é o que este sensor faz). Aviso nunca muda o exit code:
  - `entregue_status_mismatch` — o PRD (§ Entregue) cita uma feature `Fnn` num trecho que diz `Done` (ou `In progress`) e o `spec.md` dela diz outra coisa. O trecho é a frase (corte em `. ` e `;`); um trecho com os dois estados, ou nenhum, não afirma nada.
  - `entregue_done_not_cited` — a seção cita algum `Fnn`, e uma feature `status: Done` não está entre eles. Seção sem nenhum ID de feature não é comparada (não há o que cruzar).
- Só avisos mudam: o que reprova é o da v6. Nada fica mais exigente.

## O que o filho faz

1. `python3 mjrp-scripts/product_structure_check.py .` — os avisos `entregue_*` são a agenda: um dos dois lados está velho. O `status:` do spec é o que o grafo e o quadro leem; corrija o PRD (pela `mjrp-coaching-pm`, a dona do topo do PRD e da seção `## Entregue`, a mesma que o aviso nomeia) ou, se o spec é que está velho, o spec (pela `mjrp-specifying-sdd-artifacts`).
2. Acrescente `CM-0058` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0058` sai 0 (o aviso não é lacuna).

## Quando não se aplica

No perfil `content` e no `meta`, e no `process_level: minimal`, como nas CM-0019 a CM-0028.
