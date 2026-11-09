---
id: CM-0033
item: data-model
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0033 · data-model@0 → data-model@1

## Por que

Um projeto com código guarda dado em algum lugar — banco, planilha, arquivo —, e o `data-model.md` é onde as entidades, as relações e a persistência ficam escritas. É o que o `plan.md` de cada feature cita («o que este plano refina no `data-model.md`») e o que o auditor de documentos compara com o esquema real. O MJRP decidiu que o arquivo de arquitetura é do engineering canon e tem que estar em todo subprojeto que tenha código; o modelo de dados é o outro arquivo dessa dupla.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Arquivo de arquitetura é do engineering canon, tem que estar em todos os subprojetos que tenham código.»

## O que muda

- `docs/specs/data-model.md`, aberto pelo título `# Data Model`, com o que o modelo `templates/data-model.md` da `mjrp-specifying-sdd-artifacts` traz: entidades (campo, tipo, obrigatório, descrição), relações, persistência e notas de migração.

## O que o filho faz

1. `mjrp-designing-architecture` (esqueleto de `data-model.md`): se o arquivo **não existe**, parta do modelo `templates/data-model.md` e escreva as entidades que o código **já** usa — o esquema do banco, as abas e colunas da planilha, os tipos do contrato, os arquivos que o produto lê e grava; cada entidade com seus campos e a relação com as outras.
2. Um projeto sem dado persistente de verdade (só lê uma fonte e mostra) declara isso numa linha de `## Persistence` e lista as entidades que lê; o arquivo existe de qualquer jeito.
3. O que o código não responde (a regra de negócio de um campo, o que é obrigatório por decisão) **é do MJRP**: pergunte, com opções; não invente.
4. Se o arquivo **existe com outro título**, ajuste só o título; o conteúdo já escrito fica.
5. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0033` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `data-model`; `conformance_check.py . --check-note CM-0033` sai 0.

## Quando não se aplica

Projeto `content` ou `meta` (sem código de produto).
