---
id: CM-0094
item: product-structure
from: 11
to: 12
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0094 · product-structure@11 → product-structure@12

## Por que

O histórico brownfield passou a entrar pelas sprints (F128, UAT-410). Uma pasta SDD de sprint vira uma feature, e as versões do produto agrupam as sprints pela versão do app. Num legado só de SDD, que nunca teve stories (o Album Blender v0), cada versão que já saiu ficava com a lacuna `release_empty` («sem nenhuma story que conte»), e cada feature com a `feature_no_imports`. As duas são lacunas de planejamento: apontam o que ainda vai sair sem story prometida. No que saiu antes do harness, elas contrariam a regra do MJRP de 2026-10-18: o que fechou antes do harness está fechado, e o juiz só olha o que não fechou.

Decidido pelo agente (classe a: a regra aprovada pesa mais que o código; técnico e reversível), revisável pelo MJRP.

## O que muda

- `release_empty` deixa de valer para a versão do produto que o de-para aprovado trouxe do legado: um agrupamento `release` do `docs/specs/board-mapping.json` cujo registro é `brownfield` ou `conform` (o `board_mapping@1` da `mjrp-configuring-boards`, julgado pelo `board_mapping_check.py`).
- `feature_no_imports` deixa de valer para a feature que o mesmo registro trouxe do legado (um item `feature` dele): a pasta SDD de uma sprint antiga não tinha story, e a feature diz a própria versão (`planned_for:`). O sensor do grafo a confere pela prova de data (`delivered_by:` anterior ao contrato).
- Um registro de `greenfield`, ou ilegível, não isenta nada.
- **Só afrouxa**: um filho que passava na v11 passa na v12, e nenhuma lacuna é nova.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0094` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.

## Como se confere

`conformance_check.py . --check-note CM-0094` sai 0, e `--gaps` não lista `product-structure`.

## Quando não se aplica

Projeto `content` ou `meta` (o harness raiz é `meta`).
