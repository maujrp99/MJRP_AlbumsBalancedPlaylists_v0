---
id: CM-0001
item: uat
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0001 · uat@1 → uat@2

## Por que

No UAT do Control Center 1.0 (2026-10-11) issues de gravidade diferente eram indistinguíveis na tabela: a severidade vivia na descrição e o quadro do Delivery não tinha como ordenar. A ADR-0009 do Control Center (F12) criou o `uat@2`; o Control Center migrou em 2026-10-12.

Nasceu de: ADR-0009 do Control Center, F12, 2026-10-12 (a gravidade virou coluna do UAT).

## O que muda

- coluna **Gravidade** depois de **Tipo**: `P0 · P1 · P2`, ou `—` para mudança sem gravidade;
- Status: `open` · `fixing (<Fxx>)` · `fixed (<evidência>)`;
- o comentário de cabeçalho declara `uat@2`.

## O que o filho faz

1. `mjrp-specifying-sdd-artifacts`: em `docs/specs/uat.md`, inserir a coluna `Gravidade` depois de `Tipo` em todas as tabelas; preencher com a gravidade que a descrição já declara (a mais grave, se declarar duas), `—` onde não declara. Nada se apaga.
2. Trocar os status fora do vocabulário pelo equivalente (sem evidência, `open`).
3. Acrescentar ao comentário de cabeçalho `uat@2` e a data da migração.
4. Commit por pathspec com entrada no log: "uat@2 (CM-0001)".

Depois de conferir, acrescente `CM-0001` a `conformance.applied` no contrato.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --gaps` não lista mais `uat`.

## Quando não se aplica

Projeto sem `docs/specs/uat.md` (nada implantado ainda): a nota fica de fora até o arquivo existir — e ele nasce do modelo, já em `uat@2`.
