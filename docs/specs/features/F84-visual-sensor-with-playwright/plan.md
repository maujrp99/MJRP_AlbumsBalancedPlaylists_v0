# Plan — Feature F84: O sensor visual do projeto, com o Playwright · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
O kit do harness (`mjrp-scripts/visual_parity/`) com uma configuração do projeto em `test/visual/visual.config.mjs`. O trabalho já existe, sem commit, num worktree (`.claude/worktrees/agent-acfc7b768bff35219`, ramo `chore/visual-sensor-setup`): o gancho de nomes recusou o ramo, que precisa ser `claude/f84-<slug>` depois de a feature estar na «Priorizada».

## Technical Design
`@playwright/test` 1.63.0 (a versão do harness; a 1.56.1 não baixou o WebKit); `vitest.config.js` exclui `test/visual/**`; `sensors.visual` com `when: pre-merge`.

## Dependencies
O kit `mjrp-scripts/visual_parity/`.

## Documents Consulted
`reports/audits/2026-11-20-F80-visual-parity-recheck.md`, `reports/audits/2026-11-21-F79-visual-parity-recheck-2.md`.

## Risks & Considerations
Um sensor que acusa diferença falsa vira ruído e passa a ser ignorado: os seletores da Home precisam ser acertados antes de ele valer no pré-merge.
