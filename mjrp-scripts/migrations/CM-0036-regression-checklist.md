---
id: CM-0036
item: regression-checklist
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0036 · regression-checklist@0 → regression-checklist@1

## Por que

Quem mexe no projeto pergunta «quebrei alguma coisa?». A resposta é a `docs/specs/regression_checklist.md`: uma lista por módulo, cada módulo com uma tag (`[CORE]`, `[CADASTRO]`…), que a `mjrp-ensuring-quality` roda depois de uma mudança e a `mjrp-debugging` aumenta quando um defeito pode voltar. O item protege a forma — tags no título, caixas de marcar — para que «rode a checklist [TAG]» tenha o que ler.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para o nosso harness.»

## O que muda

- quando o projeto **tem** `docs/specs/regression_checklist.md`: ao menos um título `##`/`###` com a tag do módulo entre colchetes (`### 🔴 [CORE] …`, `## [CADASTRO] …`) e ao menos uma caixa `- [ ]` ou `- [x]`.

## O que o filho faz

1. `mjrp-ensuring-quality` (modelo `templates/regression-checklist.md`): ajuste no lugar — título com a tag do módulo entre colchetes, itens como caixas de marcar; o conteúdo já escrito fica.
2. Se o projeto ainda **não tem** o arquivo, o item não se aplica a ele (o check só vale onde o arquivo existe); o `mjrp-ensuring-quality` o cria quando for planejar a regressão.
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0036` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `regression-checklist`.

## Quando não se aplica

Projeto sem `docs/specs/regression_checklist.md`. Fora do perfil `code-app`.
