---
id: CM-0102
item: requirement-nodes
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0102 · requirement-nodes@3 → requirement-nodes@4

## Por que

F172 (UAT-479), 2026-11-04. O MJRP: «o titulo da story deveria ser o padrao». Até aqui o título da story era um verbo curto, e a frase
ficava abaixo dele: o quadro e as listas mostravam um título que não dizia que aquilo era uma story. Decidido com o MJRP às 11:11: o
título é a própria frase, e ela fica num lugar só.

## O que muda

- O molde (`templates/req-story-backlog.md` e `req-story-ready.md`) e a skill `mjrp-writing-reqs` dizem que a frase fica no H1
  (`# <id> · <frase>`) e na linha em negrito de `## en`, e que nenhum parágrafo a repete.
- O `requirements_graph_check.py` ganha a regra `story_title`, declarada em `requirements_graph_rules.json` com
  `story_form.title_turn_date` (2026-11-30, a mesma data do `story_form`). O commit recusa a story cujo título não é a frase, ou que ainda
  repete a frase no corpo, com o motivo. A story aberta que ninguém tocou avisa até a data e é achado depois. A nota sem enunciado não se
  julga. Enquanto o filho não recebe a troca, o `story_form` ainda lê a frase do parágrafo antigo, então nada quebra antes.
- Chega `mjrp-scripts/story_title_swap.py`, a troca mecânica (sem modelo): `plan` diz o que mudaria e por que o resto fica; `apply` grava o
  que o sensor aprova, e só toca o H1, a linha em negrito de `## en` e o parágrafo antigo da frase. Status, `accepted_in`, critérios e ID
  ficam como estão.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`: traz o sensor, as regras, a skill e o `story_title_swap.py`.
2. `python3 mjrp-scripts/story_title_swap.py plan <projeto>`: lista o que muda e as stories que ficam, cada uma com o motivo (sem enunciado,
   «para que» que espera o dono, frase acima de 220 caracteres, fora da forma). Confira a lista com o MJRP antes de gravar.
3. `python3 mjrp-scripts/story_title_swap.py apply <projeto>`: grava a troca. Depois, `python3 mjrp-scripts/requirements_graph_check.py .`
   não lista `story_title`.
4. Acrescente `CM-0101` e `CM-0102` a `conformance.applied`, no mesmo refresh.

## Como se confere

`python3 mjrp-scripts/requirements_graph_check.py .` sem nenhum achado nem aviso `story_title`, e
`python3 mjrp-scripts/conformance_check.py . --check-note CM-0102` passa.

## Quando não se aplica

Projeto sem nós de story em `docs/specs/requirements/` (`format: story`), ou cujo contrato declara outro formato que não `story` (a regra só
julga `format: story`).

## Nota para a integração

A versão 4 do item entra no `canonical_catalog.json` na integração, como rebaseline editorial do MJRP (trailer `Catalog-editorial`, que o
agente não escreve). Até lá, o `--check-note CM-0102` não tem a versão 4 para comparar.
