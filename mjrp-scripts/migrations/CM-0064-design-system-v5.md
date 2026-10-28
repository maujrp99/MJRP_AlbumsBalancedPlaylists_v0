---
id: CM-0064
item: design-system
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte 7ef3a2bef · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0064 · design-system@4 → design-system@5

## Por que

As telas densas (um card com 121 linhas, 8.985 px expandido a 1440) pedem limites que cada projeto declara: quantas linhas antes do «Ver mais», quantos níveis, quanta altura expandida. O cânone dá os valores de referência (DE-01, DE-07, DE-09); o projeto que quer outros os escreve no `docs/specs/design-system.md`. O modelo da `mjrp-defining-design-systems` ganha o lugar onde se declara: uma seção **opcional** `## Densidade`.

Nasceu de: decisão do MJRP de 2026-10-18 (a crítica de UX do v4.10 do Control Center achou a sobrecarga e não propôs forma visual; o MJRP mandou cada projeto declarar os seus limites).

## O que muda

- só o modelo (`templates/design-system.md`): a seção `## Densidade`, opcional.
- **o `check` do item não muda**: é o mesmo da v4 (`## Themes`, as Identity Specs e a linha `**Status: …**`). Um filho que passa na v4 passa na v5.

## O que o filho faz

**Nada, a menos que o projeto queira valores diferentes dos de referência.** Registre a nota: acrescente `CM-0064` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*. Se o projeto quer declarar os seus limites, a `mjrp-defining-design-systems` acrescenta a seção `## Densidade` ao `design-system.md` com os números que o MJRP decidir, lidos das telas dele — nunca inventados.

## Como se confere

`conformance_check.py . --check-note CM-0064` sai 0 e `--gaps` não lista `design-system`.

## Quando não se aplica

Projeto sem tela (`when: has_screen`), `content` e `meta`.
