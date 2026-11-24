---
id: CM-0140
item: process-sensors
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0140 · process-sensors@4 → process-sensors@5

## Por que

A F269 (a UAT-585) trouxe um script novo no kernel, o `critique_subject_check.py`: o `subject` de uma crítica de arquitetura nomeia cada ADR pelo id inteiro, nunca um intervalo («CC-ADR-0047 a 0053»), que a aceitação leria como só a primeira ADR. O padrão do manifesto muda por isso (o digest), e a versão sobe para o portão do catálogo.

## O que muda

- O `process_sensors.json` ganha `critique_subject_check.py`, que roda pela skill `mjrp-critiquing-architecture` logo depois de a crítica ser escrita. Chega ao filho com o kernel.
- A skill passa a pedir um id por ADR no `subject` e a rodar o sensor. O check do item não muda.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o sensor e o manifesto novos.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0140` e acrescenta `CM-0140` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0140` sai 0; `python3 mjrp-scripts/critique_subject_check.py .` sai 0 num projeto sem intervalo em crítica aberta.

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
