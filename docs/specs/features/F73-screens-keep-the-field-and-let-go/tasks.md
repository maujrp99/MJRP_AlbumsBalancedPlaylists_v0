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
- [ ] TASK-07 o redesenho mantém a rolagem da página (inventário: mudar o status não volta ao topo) · implements:: REQ-05 · model:: opus

## Verification
- [x] TASK-05 suíte (2351 testes), lint e build verdes; prova no navegador em `reports/evidence/F73/2026-11-19-screens-keep-the-field-proof.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: opus · rounds:: 1
- [ ] TASK-06 o passo retroativo da via rápida: a reconferência visual por quem não implementou · implements:: REQ-03 · model:: sonnet · waiting:: human — o fecho depende do relatório de reconferência visual · action:: o integrador manda fazer a reconferência e junta o relatório

## Documentation
- [x] `docs/specs/behavior.md`: `^playlists-batch-name-live`, `^playlists-no-albums`, `^screens-left-and-stale-tab`
- [x] `docs/specs/uat.md`: UAT-212 a UAT-215 em `fixed`

## For the owner at UAT
- digitar o nome do lote logo depois de gerar playlists, enquanto as notas chegam
- dizer como foi que a tela antiga apareceu ao recarregar (o rascunho não voltou em produção; aqui voltou)
