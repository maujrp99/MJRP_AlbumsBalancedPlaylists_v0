---
id: CM-0023
item: visual-sensor
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0023 · visual-sensor@1 → visual-sensor@2

## Por que

Decisão do MJRP em 2026-10-17: a primeira rodada de execução e verificação já vai para a `main`, mesmo com o juiz encontrando o que corrigir — o juiz **avalia, não barra**. A liberação ajuda o MJRP a ser também juiz: ele vê a tela rodando, acha o que o juiz não achou, ou decide que está ok do jeito que está. Cada achado do juiz vira issue do `uat.md`, marcada «achado do juiz», em correção (`fixing (<Fxx>)`) pela mesma feature; a feature na `main` fica em homologação e fecha quando cada issue tem o OK dele ou o «fica como está» dele.

Até aqui o portão do merge de tela (`visual_gate.py`, no hook `pre-merge-commit`) só deixava passar a reconferência com `verdict: pass`: um `fail` segurava a feature no ramo.

## O que muda

- o `visual_gate.py` (e o texto do hook `pre-merge-commit`) passa a ler dois campos do frontmatter do relatório de reconferência, o mais novo depois do último commit de tela:
  - `verdict: pass | fail | incomplete`;
  - `p0: <n>` — quantos P0 reais o juiz confirmou.
- a tabela de decisão:
  - `pass`, e `p0` 0 ou ausente → o merge vai;
  - `fail` com `p0: 0` → o merge vai, com um aviso: cada achado do juiz é issue do `uat.md`;
  - `p0` maior que 0 (em `pass` ou `fail`) → o merge é recusado: **P0 é do MJRP** — o agente traz a ele o que é, e ele decide se entra na `main` mesmo assim, pela válvula dele (`VISUAL_RECHECK_SKIP="<motivo>"`), nunca do agente;
  - `fail` sem o campo `p0` → recusado (sem ele não há como saber se há P0);
  - `incomplete` → recusado: o juiz não conseguiu avaliar (o sensor saiu 2 — sem Node ou Playwright, sem fatos, zero cenários); nada foi comparado, e isso não é paridade;
  - sem relatório depois do último commit de tela, ou sem `verdict` → recusado, como antes.
- o `check` do item não muda: o contrato continua declarando `sensors.visual` e o A2 do doctor segue julgando o sensor.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`: traz o `visual_gate.py` novo e o hook `pre-merge-commit` (o `core.hooksPath` já aponta para `mjrp-scripts/hooks`).
2. Daqui em diante a `mjrp-ensuring-quality` (modo *visual parity*) grava `p0:` no frontmatter de todo relatório de reconferência e usa `verdict: incomplete` quando o sensor sai 2; a `mjrp-implementing-tasks` leva a feature à `main` depois da primeira rodada e do juiz, abrindo as issues dos achados (a regra está no kernel, `pdlc-loops` § 5).
3. Relatório já escrito não se reescreve: `verdict: pass` e o legado `passes` valem sem `p0`.
4. Acrescenta `CM-0023` a `conformance.applied`, se quiser registrar a nota.

## Como se confere

`python3 mjrp-scripts/visual_gate_selftest.py` sai 0 (o portão novo, em repositórios descartáveis), e `conformance_check.py . --gaps` não lista `visual-sensor`.

## Quando não se aplica

Projeto sem tela, como na CM-0007.
