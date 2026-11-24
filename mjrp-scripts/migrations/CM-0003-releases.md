---
id: CM-0003
item: releases
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0003 · releases@0 → releases@1

## Por que

No grafo de requisitos a release é um nó com âncora `^REL-xx`; as stories se organizam por release. O fin-control agrupava por fase.

Nasceu de: auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes).

## O que muda

- cada release ganha uma âncora `^REL-xx` no título (`#### 1.0 · Mac (`^REL-01`)`), no ROADMAP ou no PRD;
- as stories apontam `planned_for` para a release.

## O que o filho faz

1. `mjrp-coaching-pm`: decidir as releases e ancorá-las no `docs/specs/prd.md` (ou no ROADMAP).
2. `mjrp-writing-reqs`: ligar as stories às releases (`planned_for`).
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0003` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `releases`; o sensor do grafo passa.

## Quando não se aplica

Perfil `minimal`: o projeto pequeno não precisa de releases.
