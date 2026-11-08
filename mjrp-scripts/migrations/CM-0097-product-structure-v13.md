---
id: CM-0097
item: product-structure
from: 12
to: 13
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0097 · product-structure@12 → product-structure@13

## Por que

O leitor do `uat.md` dava por `closed` toda linha com data na célula «OK do humano». Com isso, `recheck independente` ou `testes verdes` numa issue do MJRP, que só o OK dele fecha, a tirava do aceite dele (F159, UAT-461; a reconferência `apps/control-center/reports/audits/2026-11-02-recheck-f159-closures.md`, P2-3). A regra é a do `AGENTS.md` § Duas trilhas: o código era o defeito.

Decidido pelo agente (classe a: o leitor acompanha a regra aprovada; técnico e reversível), revisável pelo MJRP.

## O que muda

- Numa issue do MJRP, ou que subiu para ele (`prioridade: humano`), a célula de máquina não muda o estado: vale o Status. Em qualquer caixa e fora da forma também.
- O leitor do Control Center faz o mesmo (`adapters/repo_fs/uat.py`), e um teste prende os dois.
- Nenhuma lacuna nova do item: muda só o estado que o leitor devolve nessas linhas.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0097` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*. Uma issue do MJRP com a célula de máquina volta a contar como não fechada, e `uat_tracks_check.py` a acusa (CM-0096).

## Como se confere

`conformance_check.py . --check-note CM-0097` sai 0 e `--gaps` não lista `product-structure`.

## Quando não se aplica

Projeto `content` ou `meta` (o harness raiz é `meta`).
