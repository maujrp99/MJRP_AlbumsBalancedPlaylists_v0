---
id: CM-0150
item: process-sensors
from: 7
to: 8
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0150 · process-sensors@7 → process-sensors@8

## Por que

Em 2026-11-18 as regras do orquestrador falharam porque dependiam da memória do agente, e ninguém via num lugar só que trava garantia cada regra (S-245, F291). O MJRP pediu «um documento mapeando todos os hooks como mapeamos todos os scripts»: o mapa dos hooks, e um juiz que reprova o hook que existe no disco e não está nele (regra 47: toda regra tem um hook, e todo hook está no mapa).

## O que muda

- O `process_sensors.json` ganha `hooks_map_check.py`, sensor do contrato (`sensors.hooks_map`): sai 1 quando um hook do agente (`.claude/settings.json`) ou do git (`mjrp-scripts/hooks/*`) existe no disco e não está no mapa, quando um guarda de `mjrp-scripts/hooks/` não é ligado por nenhuma entrada do settings, ou quando o mapa vale por uma entrada sem `does`/`kind`.
- O kernel leva ao filho `hooks_map.py` (o leitor), `hooks_map_check.py` (o juiz) e `hooks-catalog.json` (o mapa do kernel).
- Um hook que existe só no filho entra num `mjrp-scripts/hooks-catalog.local.json` do próprio filho (chave `agent:<script> <arg>` ou `git:<hook>`, com `kind` e `does`); o arquivo do kernel é sobrescrito a cada refresh e não se edita no filho.
- O check do item passa a pedir a chave `sensors.hooks_map` no contrato.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o leitor, o juiz e o mapa.
2. Declara no `.mjrp-project.yml`, em `sensors:`: `hooks_map: "python3 mjrp-scripts/hooks_map_check.py ."`.
3. Roda `python3 mjrp-scripts/hooks_map_check.py .`. Se reprovar por um hook só do filho, escreve o `hooks-catalog.local.json` com a entrada dele.
4. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0150` e acrescenta `CM-0150` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0150` sai 0 (o contrato declara `sensors.hooks_map`), `python3 mjrp-scripts/hooks_map_check.py .` sai 0, e no harness `python3 mjrp-scripts/hooks_map_check_selftest.py` sai 0.

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele).
