---
id: CM-0128
item: design-system
from: 8
to: 9
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0128 · design-system@8 → design-system@9

## Por que

A proporção de cor recomendada (HI-08) punha a cor principal no topo, e uma regra escrita a partir dela leu a ordem de destaque como ordem de área: deu à cor principal a maior parte da tela. O MJRP corrigiu num projeto filho (2026-11-07): a principal é a primeira para destaque; a base neutra de leitura é a maior área. A HI-08 foi emendada, e o modelo do design system separa os dois eixos (F214, S-222).

## O que muda

- Em `## Themes`, a proporção de cor (opcional) passa a ter, por tema, duas linhas: o papel (a ordem de destaque, a principal primeiro) e a área (a parte da tela de cada cor), cada uma com a fonte da escolha do humano; a medida do protótipo aprovado continua ao lado, como fato.
- Continua recomendação para peça nova, conferida com o humano, e nunca muda o que ele aprovou.
- A checagem do item não muda.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o modelo novo pela skill.
2. Um projeto que já declara a proporção pergunta ao humano, pela `mjrp-defining-design-systems`, se a linha que tem é a ordem de destaque ou a área, e a separa; sem a proporção declarada, nada a fazer.
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0128` e acrescenta `CM-0128` a `conformance.applied`.

## Como se confere

`conformance_check.py . --gaps` não lista `design-system`; a proporção, quando declarada, tem as linhas do papel e da área.

## Quando não se aplica

Num projeto sem tela, ou sem proporção de cor declarada: só registra a nota.
