---
id: CM-0163
item: report-names
from: 10
to: 11
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0163 · report-names@10 → report-names@11

## Por que

O modelo `templates/bug-browser-test.md` da `mjrp-ensuring-quality` é fonte do padrão deste item e ganhou `duration_s` e o veredito `not-checked` (S-248).

Nasceu de: o pedido do MJRP de 2026-11-20 17:01 (S-248, F316): o juiz visual levou ~25 minutos num conserto de bug. Decidido pelo agente, revisável pelo MJRP.

## O que muda

- só a fonte do padrão: o modelo do relatório do teste do bug traz `duration_s` e o veredito `not-checked`.
- **o `check` do item não muda**: é o mesmo da v10. Um filho que passa na v10 passa na v11.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0163` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.

## Como se confere

`conformance_check.py . --check-note CM-0163` sai 0 e `--gaps` não lista `report-names`.

## Quando não se aplica

Nos perfis `meta`, e onde não há `reports/`.
