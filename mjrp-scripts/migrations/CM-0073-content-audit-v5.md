---
id: CM-0073
item: content-audit
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0073 · content-audit@4 → content-audit@5

## Por que

A auditoria de conteúdo cobra uma linha na tabela «item por item» para todo item que se aplica ao projeto. Um item novo que o filho acabou de receber (o `tech-stack`, CM-0071) tem a carência dele, e a carência pode
acabar **depois** da do `content-audit`: o filho aplica a nota do `content-audit`, escreve a auditoria, e o `content_audit_check.py` reprova por `audit_row_missing` um item que ele ainda nem tem como fechar. O conform
não fechava nem com a CM-0071 aplicada em dia.

Nasceu de: o achado do juiz do ramo do `tech-stack` (2026-10-18), conferido na cópia do pedroso-incorp.

## O que muda

- O `content_audit_check.py` **não cobra a linha** de um item novo para o filho: o kernel o trouxe (carimbo em `conformance.received`, ou o projeto lê o kernel no lugar), nenhuma nota dele — a atual ou uma superada — está em `conformance.applied`, e a data de hoje ainda não passou do `grace_until` dele. Imprime o aviso `item_in_grace`.
- Só a linha **que falta** é dispensada. Uma linha que existe continua sendo julgada por inteiro (veredito, arquivo do juiz, âncoras), e o item que o filho já aplicou numa versão mais velha (a nota da cadeia em `applied`) continua pedindo a linha. Passada a carência, a linha volta a ser cobrada.
- O `check` do item é o mesmo da v4 (as duas cláusulas script).

## O que o filho faz

Nada. Registre a nota: acrescente `CM-0073` a `conformance.applied`, sem rodada. Quem aplica a CM-0071 depois da auditoria passa a ter a linha do `tech-stack` na auditoria seguinte (a skill juíza é a `mjrp-critiquing-architecture`).

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0073` sai 0 (o mesmo check da v4).

## Quando não se aplica

Projeto `meta` (o harness se julga pelo próprio Learn gate).
