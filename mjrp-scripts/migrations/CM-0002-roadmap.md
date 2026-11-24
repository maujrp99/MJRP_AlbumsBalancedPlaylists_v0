---
id: CM-0002
item: roadmap
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0002 · roadmap@1 → roadmap@2

## Por que

O roadmap do harness passou em 2026-09-17 a Now/Next/Later, com cada resultado trazendo problema, medida, `tags::` e âncora. O fin-control ainda estava em fases com checklist de TASKs, e o sensor do grafo já avisava `^OUT-01` e `^OUT-02` sem tag.

Nasceu de: auditoria de lacunas do fin-control, 2026-10-13 (kernel instalado, doctor verde, artefatos canônicos ausentes); o ROADMAP do fin-control era fases com checklist de TASKs.

## O que muda

- seções `## Now`, `## Next`, `## Later`;
- cada resultado: problema, quem sente, medida, `tags::` e a âncora `^OUT-xx` no fim da linha da medida;
- o histórico de fases vai para o log.

## O que o filho faz

1. `mjrp-coaching-pm`: reescrever o `ROADMAP.md` na forma do modelo (o do Control Center é o exemplo vivo). Mantenha os `^OUT-xx` que o PRD já cita, para os `serves::` não quebrarem.
2. Mover o histórico de fases para o `docs/log.md`, com data; nada se apaga.
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0002` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `roadmap`; o sensor do grafo de requisitos deixa de avisar resultado sem tag.

## Quando não se aplica

Nunca: todo `code-app` tem roadmap. Limite do check: confere ao menos uma linha `tags::`, não uma por resultado.
