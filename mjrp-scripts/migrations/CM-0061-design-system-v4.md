---
id: CM-0061
item: design-system
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0061 · design-system@3 → design-system@4

## Por que

O Control Center não lê `docs/specs/design-system.md` sem uma linha `**Status: …**` (o leitor `design_system_status`, com as palavras `aprovad`/`approved`/`accepted`/`aceit` e a data). O fin-control esbarrou nisso em 2026-10-17 e o `pedroso-incorp` em 2026-10-18: o `design-system@3` passava (as seções `## Themes` e as Identity Specs existiam) e a tela mostrava o arquivo como ilegível. O item não cobrava a linha, e o modelo da `mjrp-defining-design-systems` nem a trazia.

Nasceu de: o incidente do `pedroso-incorp` (2026-10-18) e o do fin-control (2026-10-17, `harness-kaizen`), o mesmo erro de um check que não pergunta o que o leitor da tela exige.

## O que muda

- O check do item ganha uma cláusula: o `design-system.md` tem a linha `**Status: …**` — a **mesma expressão** do leitor da tela (um teste do Control Center confere que as duas não se afastam).
- O modelo (`templates/design-system.md`) traz a linha no topo, `**Status: Draft**`, com o comentário de que ela só vira `**Status: Aprovado pelo MJRP em AAAA-MM-DD**` quando o humano aprova.
- As duas cláusulas da v3 (`## Themes` e as Identity Specs) continuam.

## O que o filho faz

1. `conformance_check.py . --gaps` lista `design-system` se falta a linha. A `mjrp-defining-design-systems` a acrescenta logo abaixo do título do arquivo.
2. **O status escrito tem de ser o verdadeiro.** Se o MJRP aprovou o design system, a linha diz `**Status: Aprovado pelo MJRP em AAAA-MM-DD**` com a data da aprovação e o registro dela (entrada do `log.md` ou do `uat.md`, ou o `Aprovado por:` do `info-arch.md`) — leia a data do registro, nunca a deduza. Sem aprovação registrada, a linha é `**Status: Draft**` e a pergunta de aprovação vai ao MJRP (é dele aprovar; o agente nunca escreve «aprovado» por ele).
3. Se o arquivo já tem uma linha de status em outra forma (`Status: aprovado` sem negrito, ou dentro de uma tabela), reescreva-a na forma `**Status: …**` mantendo o que ela dizia.
4. Acrescente `CM-0061` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0061` sai 0 e `--gaps` não lista `design-system`.

## Quando não se aplica

Projeto sem tela (`when: has_screen`), `content` e `meta`.
