---
id: CM-0107
item: process-sensors
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0107 · process-sensors@0 → process-sensors@1

## Por que

No `MJRPpersonal` (UAT-489, 2026-11-04) o doctor passava verde e cinco features de via rápida (F46, F50, F51, F53, F55) entraram na `main` com o protótipo atrasado e sem dispensa. O contrato do harness declara 73 sensores e o de lá, 6; o `pdlc_vocabulary_check.py` chegava ao filho e nada o rodava; as duas travas do fecho (`retro_step_check.py` e `sdd_shape_check.py`) vinham sem o `artifacts.json` e sem os moldes que julgam, respondiam «NÃO foi conferido» e saíam 0. O MJRP decidiu (2026-11-04) que o sensor do processo é parte do kernel: o filho herda por padrão, e o doctor cobra.

## O que muda

- O refresh passa a levar `mjrp-scripts/process_sensors.json` (o manifesto: cada `*_check.py` ou vai ao filho e diz onde roda, ou é `harness_only` com o motivo), `mjrp-scripts/artifacts.json`, os três moldes do SDD (`mjrp-skills/mjrp-sw-factory/builder/mjrp-specifying-sdd-artifacts/templates/`), o `inventory_check.py` (o W17 do doctor o importava e se calava sem ele) e o hook `pre-merge-commit` para todo filho (antes só para quem tem tela).
- O filho não tem o trem de merge: o `pre-merge-commit` e o `pre-commit` recusam o merge e o commit que fecham uma feature que a trava não conseguiu julgar (exit 2, nunca 0).
- O I5 do doctor lê o manifesto: sensor herdado que falta no disco, ou que só roda declarado e o contrato não declara, é **erro**.
- O catálogo ganha o item `process-sensors@1` (a cláusula pede `sensors.pdlc_vocabulary`, `sensors.sdd_shape` e `sensors.requirements_graph_check` no contrato).

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness.
2. Declara no `.mjrp-project.yml`, em `sensors:`, os três comandos que o manifesto lista (`command` de cada um):
   `pdlc_vocabulary: "python3 mjrp-scripts/pdlc_vocabulary_check.py ."` · `sdd_shape: "python3 mjrp-scripts/sdd_shape_check.py ."` · `requirements_graph_check: "python3 mjrp-scripts/requirements_graph_check.py ."`
3. Roda os três e trata o que acusam. O `pdlc_vocabulary_check` lista a feature de via rápida fechada sem o registro (protótipo, wireframes, info-arch): ou o passo retroativo é feito, ou a dispensa do MJRP entra no `spec.md` (`**Prototype**: none — <quem disse>`). Não afrouxe o sensor.
4. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0107` e acrescenta `CM-0107` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0107` sai 0, e `python3 mjrp-scripts/doctor.py .` não traz erro do I5 sobre sensores do processo.

## Quando não se aplica

Projeto que não é `code-app` (o item só vale para `code-app`).
