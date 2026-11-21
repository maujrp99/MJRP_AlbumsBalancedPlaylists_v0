<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F60: Nada do que foi salvo se perde · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] causa de cada defeito lida no código e reproduzida num teste antes de mexer; a UAT-198, que ninguém tinha conferido, foi confirmada no código e em seis casos de teste
- [x] ramo criado: `fix/f60-no-saved-work-lost`, a partir da `main` em `2adcdef`
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
- [x] TASK-01 `test/helpers/fakeFirestore.js`: Firestore em memória com envio atômico, que falha ou segura uma escrita quando mandado — commit `3b7402d` · implements:: REQ-01, REQ-02, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-02 testes do salvamento (falhavam) e a regra em `PlaylistsService.saveCurrentBatch` com a gravação atômica em `PlaylistRepository.replaceBatch`; `handleSave` do controlador reduzido — commit `3b7402d` · implements:: REQ-01, REQ-03, REQ-04 · model:: opus · rounds:: 1
- [x] TASK-03 um salvamento por vez (`playlistsStore.isSaving`) e o botão desenhado a partir do estado — commit `3b7402d` · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-04 apagar a série com as playlists num envio só (`SeriesRepository.deleteWithPlaylists`) e a contagem na janela de confirmação — commit `3b7402d` · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-05 aviso ao sair com alteração não salva (`views/playlists/unsavedChangesGuard.js`); o roteador pergunta aos ganchos também no voltar do navegador e deixa removê-los — commit `3b7402d` · implements:: REQ-06 · model:: opus · rounds:: 2
- [x] TASK-06 testes da troca de pessoa no inventário (falhavam) e o conserto em `stores/inventory.js` — commit `70753e2` · implements:: REQ-07 · model:: opus · rounds:: 1
- [x] TASK-07 rascunho das playlists não guardadas no navegador, com dono, e a volta dele ao abrir a tela (`restoreDraft`) — commit `704a705` · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-08 `BlendingController.regenerate` mantém a série do conjunto da tela — commit `704a705` · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-09 aviso na janela de entrada de que os dados de visitante não vão para a conta (decisão do MJRP: não levar e avisar); sair da conta recarrega o app · implements:: REQ-09 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-10 suíte (`npx vitest run`: 530 passando, 462 antes) e `npx vite build` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 · model:: sonnet · rounds:: 1
- [x] TASK-11 prova no navegador, com o login do MJRP, pelo roteiro do relatório de entrega (falha de gravação provocada, dois cliques, série ativa diferente, apagar série com playlists, sair com alteração, sair da conta, recarregar com playlists geradas) — prova: `reports/evidence/F60-no-saved-work-lost/F60-browser-2026-11-19.json` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 · model:: opus · rounds:: 1
- [x] TASK-12 o passo retroativo da via rápida, a parte do agente: «Prototype: none» gravada na `spec.md` com a frase do MJRP (2026-11-20 00:10); a reconferência visual independente, por quem não implementou: `reports/audits/2026-11-19-F60-visual-parity-recheck.md` (não passou limpo: 1 P1, que virou a UAT-216 (playlists salvas no celular), hoje `fixed` pela F76; o fecho da UAT-216 como `closed` é da reconferência independente); o código está na `main` (merges `bcdd114`, `fa141c0`, `c760592`) e nenhum merge traz nota de Touch ID (não há nota `mjrp-visual-ok` no repositório), então o olhar dele na tela fica na marca `needs_human` da spec, não numa tarefa · implements:: REQ-01 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/specs/behavior.md` (estados do salvar, do apagar série, do sair com alteração, do rascunho e do inventário na troca de pessoa), `docs/specs/data-model.md`, `docs/specs/arch.md` e `docs/manual/` (01, 06, 07, 17, 19, 20, 21, 24, 99) dizem o que o código faz agora
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia

## For the owner at UAT
- O MJRP confere e dá o OK na UAT-196, na UAT-197, na UAT-198 e na UAT-05.
- O olhar dele na tela é a marca `needs_human` da spec; o aceite é dele no UAT.
