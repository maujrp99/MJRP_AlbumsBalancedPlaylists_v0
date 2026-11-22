---
id: NFR-03
aliases: [NFR-03]
type: nfr
status: Backlog
---
# NFR-03 · Uma feature desligada não deixa rastro na tela e não carrega código próprio

## pt-BR

**Proposta do agente, pendente do MJRP** (não é decisão dele). Cada feature que pode ser ligada e desligada em produção (F93) vive em um módulo próprio, atrás de uma porta única; desligada, não aparece em tela nenhuma (nem botão, nem aviso, nem espaço vazio) e o código dela não é carregado nem executado. O resto do produto segue funcionando.
Vale para: as features que têm interruptor · conferida na revisão e por teste (com a feature desligada, a tela não a mostra e o pacote da tela não a traz).
Origem: o MJRP, em 2026-11-22: «A ideia é facilmente tirar features de prod por isso creio que a componentizacao e modularização sejam essências na arquitetura da plataforma, to certo?» A resposta (sim) é do agente; a constituição não foi mudada.

## en

**Proposed by the agent, pending the MJRP** (not his decision). Every feature that can be turned on and off in production (F93) lives in its own module behind one gate; turned off, it appears on no screen (no button, no notice, no empty gap) and its code is neither loaded nor run. The rest of the product keeps working.
Applies to: the features that have a switch · checked in review and by test.
Origin: the MJRP's question of 2026-11-22 (above).
