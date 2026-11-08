---
id: CM-0034
item: record-shapes
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0034 · record-shapes@0 → record-shapes@1

## Por que

As skills do harness escrevem registros com forma fixa: o `plan.md` e o `tasks.md` de cada feature, a seção `## Test plan`, o relatório de UX, de documentos, de qualidade e de código, o relatório de cobertura do SDD, o relatório de bug e a seção `## History`. O MJRP marcou esses modelos canônicos; um modelo sem sensor é só uma sugestão. Nenhuma cláusula do catálogo lê «todo arquivo desta pasta tem este título», então a forma mora num script, o `record_shapes_check.py` (vendorizado com o kernel, ao lado do `conformance_check.py`).

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato SDD deve existir segundo nosso PDLC.» (plan, tasks) · «Artefato para nosso PDLC.» (coverage-report, history-section) · «Artefato para o nosso harness.» (test-plan, ux-audit, doc-audit, staleness-audit, code-quality-report, quality-review, bug-report).

## O que muda

O `check` do item é o script, que **reprova** (lacuna, com `code` estável e a skill dona) quando:

- `feature_plan_missing` / `feature_tasks_missing` — uma feature com spec já iniciado (status fora de `Draft`/`Queued`) não tem `plan.md` / `tasks.md` na pasta (o ciclo é spec → plan → tasks);
- `feature_plan_shape` / `feature_tasks_shape` — o arquivo não abre com `# Plan` / `# Tasks`;
- `feature_test_plan_missing` — uma feature **em curso** (`In progress`) cujo `plan.md` não tem `## Test plan` (a seção da `mjrp-ensuring-quality`: cada REQ com os casos de teste que o provam). Feature `Done` não é cobrada depois;
- `report_shape` — um relatório de `reports/` com a data no começo do nome (**2026-10-17 em diante**) e o tipo no nome (`-ux-audit`, `-doc-audit`, `-staleness-audit`, `-code-quality`, `-quality-review`, `-coverage-report`, `-bug-report`) sem os títulos do modelo; o `ux-audit` precisa também do frontmatter que o Control Center lê (`type: ux-audit`, `verdict`, `status`, `p0`, `p1`, `p2`);
- `history_line_shape` — uma linha do `## History` (de `docs/wiki/**` e `docs/specs/*.md`) datada de **2026-10-17 em diante** que não abre com `- **AAAA-MM-DD HH:MM** ·`.

Registro anterior a 2026-10-17 **não é julgado**: ninguém reescreve um registro para cumprir um modelo que não existia quando ele foi escrito. Projeto sem nenhum desses registros passa.

## O que o filho faz

1. `python3 mjrp-scripts/record_shapes_check.py .` — lista cada lacuna com o arquivo e a skill dona. O modo *conform* da `mjrp-pdlc-bootstrap` roteia cada uma, como no `product-structure`:
   - falta `plan.md`/`tasks.md` ou o `## Test plan` → `mjrp-specifying-sdd-artifacts` (plan e tasks, modelos `templates/plan.md` e `tasks.md`) e `mjrp-ensuring-quality` (o Test plan, `templates/test-plan.md`, derivado dos REQ do spec e dos critérios dos requisitos importados). O conteúdo vem do spec e do código que a feature já tem; o que o spec não responde (um caso de borda, um critério) é do MJRP, perguntado;
   - relatório fora do modelo → a skill dona do tipo (`mjrp-critiquing-ux`, `mjrp-auditing-docs`, `mjrp-assessing-code-quality`, `mjrp-ensuring-quality`, `mjrp-ensuring-sdd`) ajusta **o cabeçalho e os títulos no lugar**, sem tocar nos achados nem no veredito;
   - linha de `## History` fora da forma → `mjrp-syncing-docs`, que reescreve só o prefixo da linha com a hora do `TZ=America/Sao_Paulo date` do dia (nunca estimada).
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0034` a `conformance.applied` no contrato.

## Como se confere

`python3 mjrp-scripts/record_shapes_check.py .` sai 0 e `conformance_check.py . --check-note CM-0034` sai 0.

## Quando não se aplica

Projeto sem feature e sem esses relatórios (o script passa sozinho). Fora do perfil `code-app`.
