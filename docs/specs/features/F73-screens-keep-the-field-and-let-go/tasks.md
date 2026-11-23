# Tasks — Feature F73: As telas mantêm o campo em uso e largam o que deixaram · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [x] ramo criado da `main` local (`e3d0676`): `fix/f73-screens-keep-the-field`
- [x] cada defeito visto no navegador antes do conserto (sonda de foco em todas as telas)

## Implementation
- [x] TASK-01 `utils/keepField.js` e o redesenho das telas de playlists e do inventário por ele; teste antes (`test/utils/keepField.test.js`) · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `installStaleBuildGuard` ligada em `app.js`; teste antes (`test/utils/staleBuild.test.js`) · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-03 `/playlists` sem playlists mostra «No playlists here yet» e leva ao Blending Menu; `renderInitialSettings` apagado · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-04 a `InventoryView` se inscreve por `this.subscriptions` e não desenha depois de deixada; `test/architecture/viewLifecycle.test.js` · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-07 o redesenho mantém a rolagem da página (`utils/keepField.js`; inventário: mudar o status não volta ao topo); teste antes; visto no navegador: rolagem em 9000 antes e depois do redesenho, o mesmo cartão no topo da janela · implements:: REQ-05 · model:: opus · rounds:: 1

## Verification
- [x] TASK-05 suíte (2351 testes), lint e build verdes; prova no navegador em `reports/evidence/F73/2026-11-19-screens-keep-the-field-proof.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: opus · rounds:: 1
- [x] TASK-06 o que a trava do passo retroativo ainda cobra antes do `Done` (`python3 mjrp-scripts/retro_step_check.py . --staged` com a feature em `Done`, conferido em 2026-11-21): Reconferência visual: a feature mexeu na tela e não há relatório `visual-parity-recheck` nem nota de Touch ID (`mjrp-visual-ok`) que a cubra. É trabalho de agente; nenhum item é do MJRP. O que falta de verdade é a reconferência visual independente (relatório `reports/audits/<data>-F73-visual-parity-recheck.md`, por quem não implementou, num navegador): nenhum merge traz nota de Touch ID. «Prototype: none» já está gravada na spec (MJRP, 2026-11-20 00:10). · implements:: REQ-03 · model:: opus · rounds:: 1 · feito em 2026-11-23: as reconferências visuais em lote de 2026-11-21, por agente separado, cobrem a F73 (`reports/audits/2026-11-21-mjrpalbumblender-v0-playlists-blend-visual-parity-recheck.md` e `reports/audits/2026-11-21-mjrpalbumblender-v0-inventory-visual-parity-recheck.md`: sem P0 e sem P1); `retro_step_check.py . --staged` com a feature em `Done` responde «o passo retroativo confere com o registro»

## Documentation
- [x] `docs/specs/behavior.md`: `^playlists-batch-name-live`, `^playlists-no-albums`, `^screens-left-and-stale-tab`
- [x] `docs/specs/uat.md`: UAT-212 a UAT-215 em `fixed`

## For the owner at UAT
- digitar o nome do lote logo depois de gerar playlists, enquanto as notas chegam
- dizer como foi que a tela antiga apareceu ao recarregar (o rascunho não voltou em produção; aqui voltou)
