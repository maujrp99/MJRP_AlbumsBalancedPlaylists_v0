---
id: CM-0079
item: product-structure
from: 8
to: 9
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0079 · product-structure@8 → product-structure@9

## Por que

O `product-structure@7` (CM-0058) comparava a seção `## Entregue` do PRD com o `status:` dos specs das features (`entregue_status_mismatch`, `entregue_done_not_cited`): o pedroso-incorp tinha o PRD dizendo «F03 Done» com o spec em `In progress`. A seção era uma segunda fonte do andamento, do mesmo tipo da coluna `Estado` da tabela de épicos: o que está feito se lê das stories e das features, nunca se escreve à mão em outro lugar.

Decisão do MJRP de 2026-10-19: o `prd.md` é a fonte do conteúdo e a tela só o organiza; o modelo do PRD perde a seção `## Entregue` («Sim, as seis», `prd@2`, CM-0077). Sem a seção, a comparação não tem o que comparar.

## O que muda

- o `product_structure_check.py` deixa de comparar o PRD com os specs: saem os avisos `entregue_status_mismatch` e `entregue_done_not_cited` (eram avisos, nunca mudaram o exit code). **Nenhuma lacuna nova e nenhuma regra mais dura**: um filho que passava na v8 passa na v9.
- a conferência de que o PRD não traz mais a seção (`## Entregue`) é do item `prd` (CM-0077), não deste.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0079` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*. O conteúdo da seção `## Entregue` que o filho ainda tem sai pelo passo da CM-0077 (conferir que está coberto pelas stories embutidas e remover).

## Como se confere

`conformance_check.py . --check-note CM-0079` sai 0 e `--gaps` não lista `product-structure`.

## Quando não se aplica

Projeto `content` ou `meta` (o harness raiz é `meta`).
