---
id: CM-0075
item: design-system
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0075 · design-system@5 → design-system@6

## Por que

No protótipo v4.11 do Control Center, o card Tech Stack aninhou o conteúdo de um jeito novo (cabeçalho de tabela solto sobre grupos de formato diferente; grupo de um item virado linha), contra a decisão de 2026-10-17, enquanto o card «Decisões (ADRs)» logo abaixo usava a lista agrupada. O padrão não estava no `design-system.md`; as skills de design não tinham onde consultá-lo. O `design-system.md` passa a ser o artefato vivo e a fonte de todo padrão visual: o modelo ganha um checklist de padrões na seção Key Components («lista todo padrão repetido, o aninhamento de conteúdo incluído»).

Nasceu de: decisão do MJRP de 2026-10-18 («isso não está definido no design-system, deveria estar… as skills de design deveriam sempre consultá-lo e melhorá-lo»).

## O que muda

- só o modelo (`templates/design-system.md`): o checklist de padrões em `## Key Components`.
- **o `check` do item não muda**: é o mesmo da v5. Um filho que passa na v5 passa na v6.

## O que o filho faz

Registre a nota: acrescente `CM-0075` a `conformance.applied`. Depois, a `mjrp-defining-design-systems` lê as telas e o protótipo do projeto e **acrescenta ao `## Key Components` as linhas dos padrões repetidos que faltam** (inclusive o aninhamento de conteúdo em card), cada uma marcada *pendente da aprovação do MJRP* — classe (a), revisável: nunca apaga nem reescreve linha que o MJRP já aprovou.

## Como se confere

`conformance_check.py . --check-note CM-0075` sai 0 e `--gaps` não lista `design-system`.

## Quando não se aplica

Projeto sem tela (`when: has_screen`), `content` e `meta`.
