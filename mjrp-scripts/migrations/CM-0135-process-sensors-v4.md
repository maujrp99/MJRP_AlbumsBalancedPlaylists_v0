---
id: CM-0135
item: process-sensors
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0135 · process-sensors@3 → process-sensors@4

## Por que

A F222 (o sensor do acúmulo do board, S-227) trouxe um script novo no kernel, o `pile_up_check.py`. Ele mede o board que o servidor do Control Center serve, e o filho não tem esse servidor: o manifesto o declara `harness_only`, com o motivo. O padrão do manifesto muda por isso (o digest), e a versão sobe para o portão do catálogo.

## O que muda

- O `process_sensors.json` ganha `pile_up_check.py` em `harness_only`. Nada chega ao filho: o script não está nos `VENDORED_FILES`, e a trava de fim de turno do filho (`stop_gate.py`) importa o sensor sob `except ImportError` e solta quando ele falta.
- O check do item não muda.

## O que o filho faz

1. Nada obrigatório. Um `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o manifesto novo, se quiser.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0135` e acrescenta `CM-0135` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0135` sai 0.

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
