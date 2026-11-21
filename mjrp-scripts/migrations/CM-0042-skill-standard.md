---
id: CM-0042
item: skill-standard
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0042 · skill-standard@0 → skill-standard@1

## Por que

Uma skill é o artefato que o harness entrega: o `SKILL.md` com `name`, `description` (onde moram os gatilhos e o «não cobre») e `metadata` (arquétipo e dicas de modelo), mais as pastas `reference/` e `templates/`. A `mjrp-crafting-skills` guarda três modelos para isso — o `SKILL.template.md`, o `ledger.template.md` (o registro de uma migração: cada seção do original e para onde foi) e o `removed-section.template.md` (a seção que saiu, com o motivo e o commit). O MJRP os marcou canônicos; o repositório que **é** a fonte das skills (perfil `meta`) é o único que os cumpre, e agora o catálogo o diz.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para o nosso harness.»

## O que muda

- no projeto de perfil `meta` (o harness): todo `mjrp-skills/*/*/*/SKILL.md` traz `name:`, `description:` e `metadata:` no frontmatter. O resto do padrão (as dez regras, o tamanho da `description`, o arquétipo) segue sendo do `build_plugin.py --check`, do `doctor` (W1) e da revisão da `mjrp-crafting-skills`.
- o ledger e as seções removidas de uma migração moram em `_backups/` (fora do git) e seguem o modelo, mas o catálogo não os lê.

## O que o filho faz

1. `mjrp-crafting-skills`: abra a skill que o check lista e corrija o frontmatter pelo `templates/SKILL.template.md` — `name`, `description` em terceira pessoa com os gatilhos e o «não cobre», `metadata` com `archetype`, `model_hint`, `effort_hint`. Uma skill nova nasce do modelo, não de memória.
2. Ao migrar uma skill, o ledger sai de `templates/ledger.template.md` e cada seção retirada de `templates/removed-section.template.md`, como o `reference/migrate.md` manda.
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0042` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `skill-standard`.

## Quando não se aplica

Todo projeto que não é o `meta` (um filho `code-app` ou `content` não tem skills do harness).
