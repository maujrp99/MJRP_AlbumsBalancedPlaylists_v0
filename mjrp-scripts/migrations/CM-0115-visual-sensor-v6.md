---
id: CM-0115
item: visual-sensor
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0115 · visual-sensor@5 → visual-sensor@6

## Por que

A F193 (o merge do trem que não morre no Touch ID) alterou o `mjrp-scripts/visual_gate.py`, e a única mudança nesse arquivo foi um **comentário**: nenhuma linha de código mudou. Como o `visual_gate.py` é a `pattern_source` do item `visual-sensor`, o digest dele ficou para trás e o learn-gate acusou «o padrão mudou». O item sobe de versão para que a cadeia de notas continue a contar a história, e não por efeito no filho.

## O que muda

- Só o comentário do `visual_gate.py`. **Sem efeito no filho:** o portão do merge de tela decide o mesmo que decidia na v5.
- O check do item **não muda** (as cláusulas `sensors.visual` e `A2` são as mesmas da v5).
- O catálogo sobe o `visual-sensor` à versão 6, guarda a v5 em `superseded` e reestampa o `pattern_digest` do `visual_gate.py`.

## O que o filho faz

1. Nada é obrigatório: o comportamento não mudou. Se quiser o comentário novo, roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0115` e acrescenta `CM-0115` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0115` sai 0 e `--gaps` não lista `visual-sensor`.

## Quando não se aplica

Projeto sem tela, como na CM-0007, e projeto que lê o kernel no lugar (`kernel.source: in-repo`).
