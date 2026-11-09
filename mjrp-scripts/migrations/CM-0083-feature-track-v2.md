---
id: CM-0083
item: feature-track
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0083 · feature-track@1 → feature-track@2

## Por que

O PDLC v12 (`pdlc-loops` § 2) tem duas vias, a padrão e a rápida; Full, Standard, Fast track e Fix deixaram de ser caminhos. O `track:` do `spec.md` misturava duas perguntas: por qual via a feature andou, e se ela entrega algo novo ou paga uma dívida. O MJRP decidiu em 2026-10-25 12:23 separar as duas em dois campos.

Nasceu de: a F64 (as skills da fábrica seguem o PDLC v12), TASK-02d.

## O que muda

- o frontmatter de cada `docs/specs/features/Fxx-*/spec.md` declara `lane: standard | fast` (a via que a feature percorreu) e `solution_type: feature | fix` (`fix` paga dívida: issues em `fixes:`, ou um NFR por `violates::`; `feature` entrega requisito novo). `fixes:` é obrigatório quando `solution_type: fix`.
- o `track:` antigo **segue aceito** e **não se apaga**: os leitores (`product_structure_check.py`, o Control Center, o grafo de requisitos) leem `track: Fix` como `solution_type: fix`, qualquer outro valor como `feature`, e `lane` ausente como `standard`; quando os dois existem, vale `solution_type`.

## O que o filho faz

1. `mjrp-specifying-sdd-artifacts`: em cada spec, acrescentar `lane:` e `solution_type:` ao frontmatter **sem tirar o `track:` nem mexer em mais nada** (feature fechada não se reescreve): `solution_type: fix` se `track: Fix`, senão `feature`; `lane: standard`, salvo evidência de via rápida no próprio spec, no log ou na entrada do Intake. Sem evidência, não infira: pergunte ao humano.
2. Spec nova nasce só com os dois campos, sem `track:` (o modelo `templates/spec.md` já é assim).
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0083` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `feature-track`.

## Quando não se aplica

Projeto sem `docs/specs/features/` (nada implementado ainda).
