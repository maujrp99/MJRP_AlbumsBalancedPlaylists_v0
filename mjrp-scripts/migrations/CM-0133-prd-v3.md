---
id: CM-0133
item: prd
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0133 · prd@2 → prd@3

## Por que

O PRD começava pelo objetivo, pelas métricas e pelos épicos: quem o abria, o MJRP ou um agente que ia trabalhar no projeto, lia o detalhe antes de saber que produto era aquele. No projeto de finanças, o primeiro texto que um agente escreveu sobre o produto abria pelo simulador de gasto e soou como controle de gastos, quando o produto é planejamento. O MJRP pediu, em 2026-11-07: «creio que temos que ter uma narrativa no PRD para todos no "o Que é" … precisa ser kaizen do harness do prd, a narrativa do produto, logo no topo». É a S-220, entregue pela F211.

## O que muda

- O PRD abre com a seção `## O que é`: o primeiro `##` do arquivo, logo abaixo da linha do status. Uma citação ou um parágrafo antes dela, sem `##`, continua valendo.
- O que vai nela é a narrativa do produto, para quem nunca o viu:
  - o primeiro parágrafo diz que tipo de produto é este e o que ele faz por quem usa;
  - não abre por uma funcionalidade, e não diz que o produto «responde a uma pergunta»: isso não conta o que ele é (o MJRP, 2026-11-07);
  - depois, uma linha com a ordem do produto (`A ordem do produto é **…**:`) e as partes, numeradas, cada uma nomeada pela ação de quem usa, com a aba ou a peça entre parênteses;
  - a história completa, parte por parte, pode ir numa página da wiki do projeto, com o link na seção.
- A narrativa se escreve lendo o código e as telas, não só os documentos.
- O Control Center mostra a seção no topo da aba Product; sem ela, a aba diz o que falta.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o modelo novo do PRD pela skill.
2. A `mjrp-coaching-pm` escreve a seção `## O que é` no topo do `docs/specs/prd.md`, lendo o código e as telas, e o humano aprova o texto antes do commit. O modelo e o guia estão na skill (`templates/prd.md`, `reference/prd-guide.md`).
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0133` e acrescenta `CM-0133` a `conformance.applied`.

## Como se confere

`conformance_check.py . --gaps` não lista a lacuna `prd` da seção «O que é», e a aba Product do projeto, no Control Center, mostra a narrativa no topo.

## Quando não se aplica

Num projeto sem PRD (o perfil `content`, o `meta`, ou o nível de processo `minimal`): só registra a nota. Um projeto aninhado no repositório do harness já é o harness.
