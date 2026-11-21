---
status: Done
lane: fast
solution_type: fix
needs_human: "ver: o botão de salvar com «Saving…», a frase ao apagar uma série com playlists, a pergunta ao sair com alteração não salva"
imports: []
fixes: ["UAT-196", "UAT-197", "UAT-198", "UAT-05", "UAT-12"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F60: Nada do que foi salvo se perde
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Salvar a edição de um lote grava o novo e remove o antigo num envio só; um salvamento grava uma vez, na série das playlists que estão na tela; apagar uma série leva as playlists dela e avisa antes quantas são; sair da tela com alteração não salva pergunta antes; playlists geradas e não guardadas voltam depois de recarregar a página; ao sair da conta o inventário some da tela e não passa para a conta seguinte.

**Por quê:** Havia caminhos em que um lote sumia, um salvamento caía em outra série ou em dobro, playlists ficavam gravadas sem série, e o inventário de uma pessoa aparecia para a seguinte e era copiado para a conta dela.

**Como saber que funcionou:** Cada caminho tem um teste que falhava antes e passa agora; no navegador, uma falha de gravação provocada deixa o lote como estava.

**Decidido pelo MJRP em 2026-11-19:** os dados de visitante **não** passam para a conta ao entrar; a janela de entrada avisa disso antes (UAT-12). E sair da conta recarrega o app.

## Problem Statement
Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`, seção B) e o mapa da v5.0 (`reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md`, tema 2).

O que o código fazia, confirmado em teste antes de cada conserto:
- **UAT-196.** `PlaylistsController.handleSave`, em modo de edição, apagava as playlists do lote uma a uma e só depois gravava as novas. Com a gravação falhando, o lote já tinha sumido.
- **UAT-197.** (1) Um segundo clique em salvar, com a primeira gravação ainda no ar, gravava o lote de novo: o botão era desabilitado à mão, mas a tela se redesenha a cada mudança de estado e devolvia um botão novo, clicável. (2) A série do salvamento vinha da série ativa em outro lugar, e só na falta dela da série das playlists; «gerar de novo» também trocava a série do conjunto pela ativa. (3) Apagar uma série apagava só o documento dela: as playlists ficavam gravadas, sem série e sem tela que as mostrasse. (4) Nada avisava ao sair com alteração não salva.
- **Achado 2.2 do mapa, sem issue própria.** Todo salvamento regravava a série inteira a partir do que estava na memória, por cima do que estivesse no banco.
- **UAT-198.** Ao sair da conta, o inventário de quem saiu ficava na tela (a leitura feita sem usuário era recusada pelo banco e a loja mantinha os álbuns antigos) e, quando o app abria a conta anônima seguinte, era copiado inteiro para ela.
- **UAT-05.** As playlists geradas nem chegavam a ser gravadas no navegador (a geração escreve direto na loja), e nada as lia de volta ao abrir a tela.

## Requirements
- [REQ-01] Salvar a edição de um lote guardado grava as playlists novas e remove as que elas substituem num único envio: uma falha deixa o lote guardado e a tela como estavam, e a pessoa é avisada. · fixes UAT-196
  verified_by:: `test/controllers/PlaylistsController.save.test.js`, `test/services/PlaylistsService.save.test.js`
- [REQ-02] Um salvamento grava uma vez: pedir de novo com a gravação no ar não grava outra vez, e o botão aparece desabilitado enquanto ela dura. · fixes UAT-197
  verified_by:: `test/controllers/PlaylistsController.save.test.js`, `test/services/PlaylistsService.save.test.js`, `test/components/playlists/PlaylistsGridRenderer.save.test.js`
- [REQ-03] Um salvamento vai para a série das playlists que estão na tela, qualquer que seja a série ativa em outro lugar; gerar de novo não troca a série do conjunto; contexto de edição de outra série recusa o salvamento. · fixes UAT-197
  verified_by:: `test/controllers/PlaylistsController.save.test.js`, `test/services/PlaylistsService.save.test.js`, `test/controllers/BlendingController.regenerate.test.js`
- [REQ-04] Um salvamento não regrava a série a partir da memória; se a série não existe mais, o salvamento é recusado com aviso e nenhuma playlist é gravada. · fixes UAT-197
  verified_by:: `test/controllers/PlaylistsController.save.test.js`
- [REQ-05] Apagar uma série apaga as playlists guardadas dela no mesmo envio, e a janela de confirmação diz antes quantas playlists e lotes vão junto; se a contagem falha, nada é apagado. · fixes UAT-197
  verified_by:: `test/services/SeriesService.delete.test.js`
- [REQ-06] Sair da tela de playlists com alteração não salva pede confirmação: por navegação do app, pelo voltar do navegador e ao fechar ou recarregar a aba. · fixes UAT-197
  verified_by:: `test/views/unsavedChangesGuard.test.js`, `test/router.test.js`, `test/services/PlaylistsService.save.test.js`
- [REQ-07] Na troca de pessoa, o inventário em memória é descartado na hora; nada do inventário de uma conta é mostrado ou copiado para outra. · fixes UAT-198
  verified_by:: `test/stores/inventory.userChange.test.js`, `test/stores/inventory.test.js`
- [REQ-08] As playlists geradas e ainda não guardadas voltam à tela depois de recarregar a página, só para a mesma pessoa e a mesma série. · fixes UAT-05
  verified_by:: `test/services/PlaylistsService.draft.test.js`, `test/controllers/PlaylistsController.restore.test.js`
- [REQ-09] A janela de entrada diz, antes de a pessoa escolher, que o que foi feito como visitante não é copiado para a conta; nada é copiado. · fixes UAT-12
  verified_by:: `test/components/LoginModal.guestNotice.test.js`

## Observable States
N/A: a feature não importa nenhum requisito (conserto de issues). Estados do `docs/specs/behavior.md` reescritos para o que o código faz agora: `^series-delete-confirm`, `^series-delete-failed`, `^playlists-save-saved`, `^playlists-save-failed`, `^playlists-edit-mode`, `^playlists-edit-not-found`. Estados novos: `^playlists-leave-unsaved`, `^playlists-draft-restored`, `^inventory-person-changed`.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada. O que muda à vista: o botão de salvar fica desabilitado com «Saving...» enquanto grava (e não mostra mais «Saved!» por dois segundos: o aviso de sucesso continua); a janela de apagar série ganha uma frase quando há playlists; aparece a pergunta do navegador ao sair com alteração não salva; aparece o aviso «Your unsaved playlists were restored».
- Transversal layer touched: `router.js` (os ganchos de antes de navegar valem para o voltar do navegador e podem ser removidos).
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`. A pergunta ao sair usa o `confirm` do navegador, não a janela do app: ver Open Questions.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- Com a gravação falhando, o lote editado continua no banco igual ao que era (comparação exata nos testes).
- Dois pedidos de salvar com a primeira gravação no ar deixam no banco uma cópia de cada playlist, não duas.
- Com a série B ativa e um lote da série A na tela, o salvamento altera só a série A.
- Depois de apagar uma série com três playlists, o banco não tem nem a série nem as três playlists; com a gravação falhando, tem as quatro coisas.
- Depois de sair da conta, a loja do inventário tem zero álbuns e nenhuma escrita foi feita na conta seguinte.
- Suíte: 530 testes passando (462 antes da feature); `vite build` compila.

## Out of Scope
- Copiar os dados do visitante para a conta: decidido que não (MJRP, 2026-11-19).
- Achado 2.8 do mapa (lotes de mesmo nome se fundem, `%` no nome, lote sem nome, apagar lote sem confirmação): sem issue própria; não tocado.
- Edições não salvas de um lote **já guardado** não voltam depois de recarregar (só o conjunto ainda não guardado volta); para esse caso há o aviso ao sair.
- As séries e as playlists em memória não são esvaziadas ao sair da conta (só o inventário tinha issue): ver Open Questions.
- `services/PlaylistPersistenceService.js` (sem uso no app) ainda tem o apagar-antes-de-gravar; `SavedPlaylistsController.deleteBatch` apaga um lote playlist por playlist, sem envio único. Não tocados.
- A subcoleção `albums` de uma série (lida por `SeriesRepository.findWithAlbums`) não é apagada com a série.

## Open Questions
- **UAT-12, como levar os dados do visitante para a conta — respondida pelo MJRP em 2026-11-19: «não levar e avisar».** Feito: o aviso na janela de entrada. **Sair da conta deve recarregar o app? — «sim».** Feito: `utils/reloadApp.js`.
- **Sair da conta deve recarregar o app? — aberta, do MJRP.** Hoje, ao sair, o inventário é esvaziado (esta feature), mas as séries e as playlists em memória continuam na tela até a próxima carga. Recarregar a página ao sair garante que nada de uma pessoa fique em memória para a seguinte, de uma vez só; muda o que se vê ao sair (a tela pisca e volta à entrada).
- **A pergunta ao sair com alteração não salva usa o `confirm` do navegador — aberta, do MJRP.** O roteador decide na hora se navega; a janela do app (`DialogService`) responde depois. Usar a janela do app pede que a navegação do roteador passe a esperar a resposta: mudança de desenho pequena, mas no caminho de toda navegação.
