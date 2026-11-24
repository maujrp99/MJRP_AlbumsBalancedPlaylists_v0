---
id: CM-0068
item: evidence-folder
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0068 · evidence-folder@2 → evidence-folder@3

## Por que

O texto de `feature-artifacts.md` (a referência da skill de especificação, fonte do item) dizia que o NFR «nunca é importado». A regra mudou para a feature de engenharia
da trilha Fix (CM-0067) e a referência não podia contradizê-la.

Nasceu de: o feedback do `fin-control` de 2026-10-18 (ponto 3) e o pedido de manter os modelos e a referência iguais à regra.

## O que muda

- `reference/feature-artifacts.md`: o critério de qualidade do `imports:` diz que o NFR não é importado por uma feature de produto, e que a feature `track: Fix`
  que paga uma `violates:: [[NFR-xx]]` o importa. A pasta da evidência (`reports/evidence/<TASK-ID>/`) **não muda**, nem o script.

## O que o filho faz

Nada. Registre a nota: acrescente `CM-0068` a `conformance.applied`, sem rodada. A regra em si está na CM-0067.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0068` sai 0 (o mesmo check da v2).

## Quando não se aplica

Projeto sem features em `docs/specs/features/*/spec.md` (`has_path:docs/specs/features/*/spec.md`).
