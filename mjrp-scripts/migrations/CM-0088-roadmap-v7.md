---
id: CM-0088
item: roadmap
from: 6
to: 7
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0088 · roadmap@6 → roadmap@7

## Por que

Todo resultado `^OUT-xx` do `ROADMAP.md` precisava de uma medida: o bootstrap e o conform paravam quando o projeto não tinha uma, e o PDLC a pedia nas saídas de etapa e no ciclo de aprendizado. O MJRP não quer que definir métricas seja obrigatório. A medida passa a ser **opcional**; a **linha** `- **Medida:**` segue obrigatória, e o valor `sem medida` é válido.

Nasceu de: a ordem do MJRP de 2026-10-29: «Quero que a definição de métricas seja opcional e não mandatória para o bootstrap» (e no PDLC), com três escolhas dele: (1) o resultado sem medida traz a linha explícita `- **Medida:** sem medida`; (2) sem medida, o resultado é dado como alcançado pelo julgamento dele (`achieved::` com a frase dele), com medida segue o hoje → alvo; (3) via rápida, feature própria (UAT-409, F127). A rota é a nota de migração, não o aval `Catalog-editorial:` dele: o conteúdo do padrão mudou (o modelo `templates/roadmap.md`), não só a redação.

## O que muda

- o modelo `templates/roadmap.md` da `mjrp-coaching-pm` aceita `[hoje → alvo; ou «sem medida»]` na linha de medida e diz que a medida é opcional e a linha não;
- os rótulos de duas cláusulas do `check` dizem o mesmo («cada um com a linha de medida: uma medida ou `sem medida`»); **o padrão (a expressão) de cada cláusula não muda**, e `- **Medida:** sem medida ^OUT-xx` já casava com `^- \*\*Medida:\*\*`;
- fora do catálogo: o `product_structure_check.py` não cobra `- **Valor medido:**` de um resultado alcançado `sem medida` (a data e o `- **Aprendizado:**` continuam), e a lacuna `outcome_no_measure` passa a significar «a linha de medida não existe».
- **o `check` do item não reprova nada que a v6 aprovava**: um filho que passa na v6 passa na v7. Quem reprovava (resultado sem a linha) continua reprovando.

## O que o filho faz

1. Se `conformance_check.py . --gaps` **não** lista `roadmap`, registre a nota: acrescente `CM-0088` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.
2. Se o `product_structure_check.py .` lista `outcome_no_measure` (resultado sem a linha de medida): se o registro (ROADMAP, PRD, log) traz uma medida, cite-a com a fonte; se não traz, escreva `- **Medida:** sem medida ^OUT-xx` (decidido pelo agente, revisável pelo MJRP) e siga — nada espera por uma resposta. O agente nunca inventa uma medida, nem escreve um marcador como «a definir».
3. Um resultado já alcançado sem medida não precisa de `- **Valor medido:**`; o `achieved:: AAAA-MM-DD` leva a frase do MJRP.

## Como se confere

`conformance_check.py . --check-note CM-0088` sai 0 e `--gaps` não lista `roadmap`; `product_structure_check.py .` não lista `outcome_no_measure` para um resultado com `- **Medida:** sem medida`.

## Quando não se aplica

Nos perfis `content` e `meta`.
