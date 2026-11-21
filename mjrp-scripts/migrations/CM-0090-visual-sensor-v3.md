---
id: CM-0090
item: visual-sensor
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0090 · visual-sensor@2 → visual-sensor@3

## Por que

F61 (S-162, a via rápida que o MJRP julga na tela), 2026-10-30. Na via rápida o veredito visual é o OK do MJRP, sem juiz
agente (decisão dele de 2026-10-26: «meu ok no chat deveria valer como evidência, é fast lane»). Até aqui esse OK chegava
ao portão como um relatório `who_judged: human` escrito pelo agente que integrava, e o portão aceitava qualquer
`verdict: pass`: um agente podia escrever o OK por ele. E `GIT_REFLOG_ACTION=x git merge …` pulava a trava inteira.

## O que muda

- o `visual_gate.py` reconhece a via rápida: todas as specs de feature que o ramo muda dizem `lane: fast`;
- nesse caso, sem relatório de reconferência depois do último commit de tela, o hook `pre-merge-commit` pede o Touch ID do
  MJRP no próprio `git merge` (o utilitário `presence` do Control Center, `~/.mjrp/control-center/bin/presence`,
  CC-ADR-0031); o diálogo espera 35 s, dentro dos 60 s que o `merge_train.py` dá a cada git; sem o dedo, ou sem o
  utilitário, o merge é recusado;
- o relatório `who_judged: human` deixa de valer como o OK dele;
- a via padrão não muda: o relatório da reconferência independente segue a tabela da CM-0023;
- a tela que nenhuma revisão nomeada mudou é recusada também quando o `GIT_REFLOG_ACTION` foi renomeado;
- o `check` do item não muda: o contrato continua declarando `sensors.visual` e o A2 do doctor segue julgando o sensor.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`: traz o `visual_gate.py` novo e o hook `pre-merge-commit`.
2. Num projeto com tela, o MJRP instala o utilitário `presence` uma vez (`apps/control-center/ops/install-service.sh` do
   harness); até lá, o merge de tela da via rápida é recusado, e a saída é a válvula dele (`VISUAL_RECHECK_SKIP="<motivo>"`).
3. Relatório já escrito não se reescreve; o `who_judged: human` antigo vale para o merge que já aconteceu.
4. Acrescenta `CM-0090` a `conformance.applied`, se quiser registrar a nota.

## Como se confere

`python3 mjrp-scripts/visual_gate_selftest.py` sai 0, e `conformance_check.py . --gaps` não lista `visual-sensor`.

## Quando não se aplica

Projeto sem tela, como na CM-0007.
