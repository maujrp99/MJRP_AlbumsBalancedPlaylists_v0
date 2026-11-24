---
id: CM-0089
item: product-structure
from: 10
to: 11
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0089 · product-structure@10 → product-structure@11

## Por que

A medida de um resultado passou a ser opcional (`roadmap@7`, CM-0088, F127): o resultado sem medida traz a linha `- **Medida:** sem medida` e é dado como alcançado pelo julgamento do MJRP. O `product_structure_check.py` cobrava `- **Valor medido:**` de todo resultado alcançado, o que não faz sentido sem medida, e a mensagem da lacuna `outcome_no_measure` pedia sempre «hoje → alvo».

Decidido pelo agente (classe a: o leitor precisa conhecer o formato que o MJRP aprovou; técnico e reversível), revisável pelo MJRP.

## O que muda

- `outcome_no_measure` segue sendo a lacuna da **linha** de medida ausente; a mensagem passa a oferecer também `- **Medida:** sem medida`. `- **Medida:** sem medida` não é lacuna (já não era: o valor é não vazio, agora testado);
- `outcome_achieved_incomplete` (aviso) deixa de pedir `- **Valor medido:**` de um resultado `sem medida`: pede a data (`achieved::`) e o `- **Aprendizado:**`; a mensagem do `outcome_done_not_achieved` (aviso) cita o julgamento do MJRP para o resultado sem medida.
- **Só afrouxa**: um filho que passava na v10 passa na v11; nenhuma lacuna nova.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0089` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.

## Como se confere

`conformance_check.py . --check-note CM-0089` sai 0 e `--gaps` não lista `product-structure`.

## Quando não se aplica

Projeto `content` ou `meta` (o harness raiz é `meta`).
