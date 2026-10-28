---
id: CM-0085
item: adr-names
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0085 · adr-names@3 → adr-names@4

## Por que

A ADR ficou verbosa e difícil de revisar (as do harness com 17.000 a 46.000 caracteres), e o MJRP deixou de aceitar as ADRs técnicas: um agente tech lead (`mjrp-accepting-decisions`) as aceita, e as de produto, dinheiro, segurança ou que tocam uma válvula dele continuam com ele.

Nasceu de: a F62 (a ADR curta) e a F66 (o tech lead), 2026-10-26.

## O que muda

- o molde da `mjrp-recording-decisions` é o curto (`decision@3`): a decisão e o porquê em até três frases, cada alternativa numa linha, as consequências em tópicos, os arquivos; o cabeçalho traz `**Acceptance**: tech lead | MJRP`;
- o `adr_header_check.py`, nas ADRs com `**Date**:` a partir de 2026-10-26: no máximo 6.000 caracteres, a linha `Acceptance`, e, aceita, os Decisores abrindo com `tech lead (agente), <data>` ou `MJRP, <data>` (nunca o tech lead numa via `MJRP`).

## O que o filho faz

1. `--refresh-kernel` traz o `adr_header_check.py` novo. Commit por pathspec com entrada no log.
2. **Não reescreva ADR nenhuma:** as anteriores a 2026-10-26 são imutáveis e ficam isentas. A ADR nova segue o molde da skill.

Depois de conferir, acrescente `CM-0085` a `conformance.applied` no contrato.

## Como se confere

`adr_header_check.py .` sai 0 e `conformance_check.py . --gaps` não lista `adr-names`.

## Quando não se aplica

Projeto sem `docs/decisions/`.
