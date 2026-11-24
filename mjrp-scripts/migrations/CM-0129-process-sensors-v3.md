---
id: CM-0129
item: process-sensors
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0129 · process-sensors@2 → process-sensors@3

## Por que

A F220 (o sensor do que o MJRP devolve pelo iPhone, S-226) trouxe um sensor novo, o `returned_check.py`. Em 2026-11-07 o MJRP devolveu pelo iPhone treze itens travados de quatro projetos; a mensagem aparecia no início de sessão e nada obrigava o agente dono a agir. O sensor mede, por projeto, a mensagem devolvida que nenhum agente marcou (`remote_approval.py returned --ack <id>`) além do prazo do contrato.

## O que muda

- O `process_sensors.json` ganha o sensor `returned_check.py`, com `runs: [doctor]`: o doctor o importa (W22, aviso) e a trava de fim de turno (`stop_gate.py`) também, para o orquestrador do projeto (a sessão no checkout principal) não encerrar o turno com mensagem atrasada.
- O prazo é o campo `mjrp_harness.returned_deadline_hours` do contrato, em horas inteiras; sem o campo, valem 24 h.
- O script chega ao filho com o kernel. O contrato não precisa declarar nada: o check do item não muda.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` uma vez, para trazer o manifesto novo, o script e a trava de fim de turno que o importa.
2. Se quiser outro prazo que não as 24 h, escreve `returned_deadline_hours: <horas>` em `mjrp_harness:` do `.mjrp-project.yml` (decisão do MJRP; o agente não muda o padrão por conta própria).
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0129`, e acrescenta `CM-0129` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0129` sai 0, e `mjrp-scripts/returned_check.py` existe no filho (o I5 do doctor, herança do `PRINCIPLES.md`, reprova o sensor do manifesto que falta no disco).

## Quando não se aplica

Projeto que não é `code-app` (o item não se aplica a ele). O script chega com o refresh do mesmo jeito, e o doctor e a trava o usam.
