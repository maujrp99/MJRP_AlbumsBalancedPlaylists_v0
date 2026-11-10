---
id: CM-0096
item: uat
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0096 · uat@3 → uat@4

## Por que

O juiz do item reprovava `testes verdes: <comando>, <hora>` numa issue da trilha Agente, que o `AGENTS.md` § Duas trilhas aceita desde 2026-10-27 para o conserto que não toca trava, hook nem sensor (UAT-461). E deixava passar a mesma forma numa issue do MJRP, onde só o OK dele fecha.

Decidido pelo agente (classe a: o juiz acompanha a regra aprovada; técnico e reversível), revisável pelo MJRP.

## O que muda

- `uat_tracks_ok` aceita `testes verdes: <comando>, <data hora>` na issue de agente ou juiz.
- **Aperta um caso:** `testes verdes` numa issue do MJRP passa a ser lacuna. As duas palavras valem em maiúscula ou minúscula.
- O resto é igual: a tabela, as colunas e os outros valores.

## O que o filho faz

Se `conformance_check.py . --gaps` não listar `uat`, nada além de registrar a nota: acrescente `CM-0096` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*. Se listar `testes verdes` numa issue do MJRP, a célula fica vazia até o OK dele.

## Como se confere

`conformance_check.py . --check-note CM-0096` sai 0 e `--gaps` não lista `uat`.

## Quando não se aplica

Projeto sem `docs/specs/uat.md`.
