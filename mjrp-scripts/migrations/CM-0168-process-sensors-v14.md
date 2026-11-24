---
id: CM-0168
item: process-sensors
from: 13
to: 14
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0168 · process-sensors@13 → process-sensors@14

## Por que

O check do kit do admin (`check.mjs`) é um sensor herdado de quem tem o kit (F332 TASK-11, CC-ADR-0068). Ele não é um `*_check.py` do kernel nem viaja com ele: viaja com o kit. O manifesto dos sensores do processo passa a dizê-lo numa seção própria.

### Por que esta nota chega também a quem não tem o kit

O `process_sensors.json` é a fonte do padrão do item `process-sensors`: qualquer mudança nele muda o digest, e o portão do catálogo (ADR-0019 § 4) só aceita um digest novo com a versão subindo, que é esta nota, ou com o trailer `Catalog-editorial:`, que só o MJRP escreve. O agente não tem essa válvula, então a versão subiu. Para o projeto sem o kit do admin a nota não pede trabalho novo: é o `--refresh-kernel` que ele já faz e uma linha em `conformance.applied`; até lá é um aviso, com 30 dias de prazo. (Reconferência da F332, P2-8: decidido pelo agente, revisável pelo MJRP, que pode trocar a subida pelo trailer dele.)

## O que muda

- O `process_sensors.json` ganha `kit_sensors`: `admin-kit/check.mjs`, que chega pela pasta `tools_path` do contrato e roda declarado em `sensors.admin_kit`. O check do item **não muda**: o projeto sem o kit não faz nada; o que tem o kit segue a CM-0167.

## O que o filho faz

1. Traz o kernel (`python3 mjrp-scripts/new_project.py <este projeto> --refresh-kernel`).
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0168` e acrescenta `CM-0168` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0168` sai 0; `python3 mjrp-scripts/doctor.py .` sem erro do I5.

## Quando não se aplica

Projeto que não é `code-app`.
