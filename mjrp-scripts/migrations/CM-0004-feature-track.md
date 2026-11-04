---
id: CM-0004
item: feature-track
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0004 · feature-track@0 → feature-track@1

## Por que

O Intake põe cada demanda numa trilha (Full, Standard, Fast track, Fix). A trilha da feature mora no frontmatter do `spec.md`; sem ela, nada diz com que rigor a feature foi feita. A F01 do fin-control juntou MVP e pós-MVP sem trilha.

Nasceu de: auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes); F11 do Control Center já declara `track: Fix`.

## O que muda

- o frontmatter de cada `docs/specs/features/Fxx-*/spec.md` declara `track: <trilha>`.

## O que o filho faz

1. `mjrp-specifying-sdd-artifacts`: acrescentar `track:` ao frontmatter de cada spec, com a trilha em que a feature foi triada.
2. Feature que juntou duas voltas de Delivery: registre a trilha e abra a próxima feature para o que vier depois.
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0004` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `feature-track`.

## Quando não se aplica

Projeto sem `docs/specs/features/` (nada implementado ainda). Limite do check: não confere o campo `fixes` de `track: Fix`.
