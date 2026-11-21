---
status: In Progress
lane: fast
solution_type: feature
imports: ["[[S-66-check-each-screen-against-its-approved-prototype]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F84: O sensor visual do projeto, com o Playwright
**Approved**: pendente

## Summary
**A feature:** O projeto ganha o sensor de paridade visual do harness: o Playwright instalado e uma configuração que compara as telas construídas com os protótipos aprovados (a Home da F79 e a página de entrada da F80).

**Por quê:** Desde que há protótipos aprovados registrados, o doctor exige o sensor (achado A2); sem ele, a reconferência visual depende de scripts feitos à mão a cada vez.

**Como saber que funcionou:** O doctor deixa de acusar o A2; o sensor roda pela fila da máquina e diz as diferenças de verdade.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «Instala o playwright e vamos com as capas da Apple pq por enqto só eu uso».

## Requirements
- [REQ-01] O Playwright é dependência de desenvolvimento do projeto e o `.mjrp-project.yml` declara `sensors.visual`, com uma configuração que cobre as duas referências aprovadas a 1280 e 393 px, sem conta aberta e sem escrever em dados de produção · fixes S-66
- [REQ-02] O sensor acusa só diferença de verdade: os seletores de região da configuração são acertados para a Home (a primeira rodada deu 18 P0 de ordem de região no computador, que o agente que montou atribui aos seletores e não à tela) · fixes S-66

## Observable States
Nenhum: não muda tela.

## Success Criteria
O doctor sem o A2; a suíte de testes sem pegar os arquivos do Playwright; uma rodada do sensor com cada achado explicado.

## Out of Scope
Os estados que o kit não exprime (movimento reduzido, sem JavaScript, o caixote só em CSS) ficam com as capturas da reconferência.

## Open Questions
- ~~Os 18 P0 da primeira rodada são mesmo dos seletores?~~ Conferido par a par (2026-11-21): o `header` genérico era outro elemento nos dois lados; com os seletores da casca, o P0 de ordem continua nos mesmos 18 estados a 1280 e é real: o protótipo aprovado renderiza o rodapé com 0 px (logotipo sem tamanho), o produto tem o rodapé. Relatado em `reports/evidence/F84/2026-11-21-sensor-findings.md`; a decisão é do MJRP.
