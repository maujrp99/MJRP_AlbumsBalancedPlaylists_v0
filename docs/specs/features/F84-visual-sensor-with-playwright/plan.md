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
Os navegadores do Playwright moram num cache da máquina, comum a todos os projetos: `npx playwright install` sem nome de navegador remove as versões que outros projetos usam (aconteceu em 2026-11-21 com o WebKit 2215 do MJRPpersonal, já reposto por eles). Instalar sempre pelo nome (`npx playwright install chromium webkit`). Se o WebKit travar ao descompactar: baixar o zip da URL que o `--dry-run` mostra, descompactar numa pasta `webkit-<build>` e criar os marcadores `INSTALLATION_COMPLETE` e `DEPENDENCIES_VALIDATED` (relato da orquestradora do MJRPpersonal).
