---
id: CM-0093
item: requirement-nodes
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0093 · requirement-nodes@2 → requirement-nodes@3

## Por que

F137 (UAT-416), 2026-10-30. O MJRP: «stories vem do scrum, do agile e tem um padrao bem conhecido, um template de escrita e percebi que nao
estamos seguindo». No harness, das 202 stories, 18 seguiam o template da `mjrp-writing-reqs`: as outras eram escritas imitando a vizinha, com a
solução dentro do «quero», IDs, arquivos e parênteses na frase, e nenhum sensor julgava a frase.

## O que muda

- O modelo `templates/req-story-backlog.md` diz que a frase da story é **uma frase só, de até 220 caracteres**, numa das duas formas (Cohn ou
  Klement), sem ID, arquivo, versão, código de regra, crase nem parêntese; as outras línguas a espelham, com o título em negrito na primeira linha
  e a mesma forma. O detalhe vai a uma linha «Exemplos para o AC:», a fonte à `Origem:`.
- O `requirements_graph_check.py` ganha a regra `story_form` (declarada em `requirements_graph_rules.json → story_form`): o commit (`--staged`) e o
  gancho de parada (`--changed`) recusam a story cujo texto mudam fora do molde, com o motivo; a story aberta que ninguém tocou avisa até a data de
  virada (`turn_date`, 2026-11-30) e é achado depois; a entregue não se julga.
- A skill ganha o anti-padrão «a solução dentro da story», com o antes e o depois.
- O `check` do item **não muda**.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`: traz o sensor e as regras novas.
2. `python3 mjrp-scripts/requirements_graph_check.py .` lista, em `aviso [story_form]`, as stories abertas fora do molde, cada uma com o que mudar.
   Reescreva-as pela `mjrp-writing-reqs` antes da data de virada; as `Done` e `Accepted` não se editam.
3. Acrescente `CM-0093` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/requirements_graph_check.py .` sem nenhum `aviso [story_form]`, e `conformance_check.py . --gaps` não lista `requirement-nodes`.

## Quando não se aplica

Projeto sem nós de requisito em `docs/specs/requirements/*/` (`has_path:docs/specs/requirements/*/*.md`), ou cujo contrato declara outro formato
que não `story` (a regra só julga `format: story`).
