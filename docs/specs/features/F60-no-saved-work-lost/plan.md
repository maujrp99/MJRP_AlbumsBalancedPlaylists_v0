<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F60: Nada do que foi salvo se perde · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do código (passo retroativo da via rápida), a partir do `docs/log.md` de 2026-11-19 e dos commits do ramo `fix/f60-no-saved-work-lost`.

## Architecture Approach
Sem camada nova e sem dependência nova. O que mudou de lugar, seguindo as ADRs 0016 (regra no serviço) e 0017 (loja só com estado):

- **A regra do salvamento saiu do controlador.** `PlaylistsController.handleSave` tinha complexidade 27 e falava direto com dois repositórios; agora pede ao serviço e avisa o resultado. A regra inteira (um salvamento por vez, de qual série, o que é substituído, quando a tela muda) está em `PlaylistsService.saveCurrentBatch`, testável sem tela.
- **O Firestore ficou atrás dos repositórios.** `PlaylistsService` não importa mais o Firestore; a gravação atômica é do `PlaylistRepository` e o apagar em cascata é do `SeriesRepository`. A lista de exceções do teste de fronteiras (`test/architecture/albumLoadBoundaries.test.js`) encolheu de dois arquivos para um.
- **Estado novo na loja, sem lógica.** `playlistsStore.isSaving`; o botão é desenhado a partir dele.
- **A série de um conjunto de playlists tem uma fonte só:** `playlistsStore.seriesId`, a série de onde as playlists da tela vieram.
- **`stores/inventory.js` continua sendo uma loja com repositório dentro** (não é estado puro como pede a ADR-0017). Reescrevê-la é maior que este conserto e não foi feito; o conserto ficou no caminho da troca de pessoa.

Refina no `docs/specs/arch.md` a linha de quem grava em `artifacts/.../curator/**` e no `docs/specs/data-model.md` o campo `order` e a chave `mjrp_current_playlists`.

## Technical Design
Fluxo do salvamento: tela → `PlaylistsController.handleSave` → `PlaylistsService.saveCurrentBatch` → `PlaylistRepository.replaceBatch` → Firestore (um `writeBatch`) → só então a loja muda.

- `public/js/repositories/PlaylistRepository.js`: `replaceBatch(playlists, replacedIds)` grava as playlists (atualiza as que têm `id`, cria as que não têm), apaga as substituídas que não estão entre elas e toca o `updatedAt` do documento da série, tudo num `writeBatch`. A série inexistente recusa o envio inteiro (`not-found`). Mais de 500 operações é recusado antes de gravar (REQ-01, REQ-04).
- `public/js/services/PlaylistsService.js`: `saveCurrentBatch({ userId, batchName })`, `resolveBatchName`, `hasUnsavedChanges`, `removePlaylist`; o rascunho no navegador (`saveToLocalStorage`, `watchStore`, `restoreDraft`), gravado com o `uid` de quem fez; `deleteBatch` passou a um envio só. O repositório e o «quem é a pessoa» entram por opções do construtor, para o teste (REQ-01, REQ-02, REQ-03, REQ-06, REQ-08).
- `public/js/controllers/PlaylistsController.js`: `handleSave` curto; `deletePlaylist` passa pelo serviço; `loadPlaylistsForEdit` esvazia a tela quando o lote não existe; `initialize` restaura o rascunho quando a tela abre vazia em modo de criação (REQ-01, REQ-02, REQ-06, REQ-08).
- `public/js/controllers/BlendingController.js`: `regenerate` mantém a série do conjunto da tela (REQ-03).
- `public/js/stores/playlists.js`: `isSaving` e `setSaving` (REQ-02).
- `public/js/components/playlists/PlaylistsGridRenderer.js`, `public/js/views/PlaylistsView.js`: o botão de salvar desenhado desabilitado enquanto `isSaving`; a tela instala e remove a guarda de alteração não salva (REQ-02, REQ-06).
- `public/js/views/playlists/unsavedChangesGuard.js` (novo): `installUnsavedChangesGuard({ router, hasUnsavedChanges, confirmLeave })` (REQ-06).
- `public/js/router.js`: `beforeNavigate` devolve a função que remove o gancho; os ganchos são perguntados também no voltar e avançar do navegador (`handleHistoryMove`, que repõe o endereço quando um gancho recusa); endereço desconhecido sem rota `/home` não chama mais a si mesmo sem fim (REQ-06).
- `public/js/repositories/SeriesRepository.js`: `findPlaylists(seriesId)`, `deleteWithPlaylists(seriesId)` (REQ-05).
- `public/js/services/SeriesService.js`: `countSavedPlaylists(id)`; `deleteSeries` usa `deleteWithPlaylists` (REQ-05).
- `public/js/components/series/SeriesModals.js`: conta antes de perguntar; a frase das playlists na janela; nada é apagado se a contagem falha (REQ-05).
- `public/js/stores/inventory.js`: `handleUserChange` esvazia na hora, não lê sem usuário, não copia nada; `loadAlbums` descarta a resposta que chega depois da troca de pessoa (REQ-07).

## UI/UX Design (if the feature touches a screen)
Sem desenho novo. Textos novos, todos em inglês como o resto do app: «Saving...» no botão; «Save failed: <motivo>. Nothing was changed: what was saved before is still there.»; «Its N saved playlists (M batches) will be deleted too.»; «Could not check the saved playlists of this series. Nothing was deleted.»; «You have changes to these playlists that are not saved. Leave without saving?»; «Your unsaved playlists were restored».

## Dependencies
Nenhuma.

## Documents Consulted
- `docs/specs/uat.md` (UAT-196, UAT-197, UAT-198, UAT-05, UAT-12)
- `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md` (seção B) e `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md` (tema 2)
- `docs/decisions/0016-service-layer-extraction.md`, `docs/decisions/0017-pure-state-stores.md`
- `firestore.rules` (cada `uid` só lê e grava o que é seu: é o que faz a leitura sem usuário falhar na UAT-198 e o que impede ler os dados do visitante depois do login na UAT-12)
- `docs/specs/behavior.md`, `docs/specs/data-model.md`, `docs/specs/arch.md`, `docs/manual/`

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — atualizado (commit `6cee4df`)
- `docs/specs/data-model.md` — atualizado (commit `6cee4df`)
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — atualizado (commit `6cee4df`)
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou

## Risks & Considerations
- **O salvamento agora exige que a série exista no banco.** Antes ele a recriava a partir da memória. Uma série que só existisse na memória deixaria de aceitar playlists; não achei caminho que crie série sem gravá-la (`SeriesService.createSeries` grava primeiro), mas é a mudança de comportamento mais larga da feature.
- **Apagar a série apaga playlists guardadas.** É o que a issue pede, e a janela avisa quantas; não há desfazer.
- **O roteador mudou no caminho do voltar do navegador.** Quando a pessoa recusa sair, o endereço é reposto com uma entrada nova no histórico (o «avançar» do navegador se perde nesse caso).
- **O rascunho no navegador pode ficar velho:** fica guardado até ser salvo, substituído por outra geração ou por um lote aberto para edição. Só volta à tela no endereço `/playlists` da mesma série, com a memória vazia.
- **Nada disto foi visto num navegador por quem implementou** (a prova no navegador é do agente integrador, que tem o login). O Firestore dos testes é um dublê em memória (`test/helpers/fakeFirestore.js`): confere a ordem e a atomicidade das escritas, não as regras nem os limites do Firestore de verdade.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 16:24 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/controllers/PlaylistsController.save.test.js` (UAT-196), visto falhar antes | gravação falha: o banco fica igual; uma só escrita (`commit`) no caminho feliz | controlador + serviço + repositório | sim |
| REQ-01 | `test/services/PlaylistsService.save.test.js` | a loja fica igual quando a gravação falha; o contexto de edição passa ao nome novo | serviço | sim |
| REQ-02 | `test/controllers/PlaylistsController.save.test.js`, visto falhar antes (quatro playlists em vez de duas) | segundo pedido com a gravação no ar não grava | controlador + serviço | sim |
| REQ-02 | `test/components/playlists/PlaylistsGridRenderer.save.test.js`, visto falhar antes | botão desabilitado com `isSaving` | componente | sim |
| REQ-03 | `test/controllers/PlaylistsController.save.test.js`, `test/controllers/BlendingController.regenerate.test.js`, vistos falhar antes | série ativa B, lote de A: só A muda | controlador | sim |
| REQ-04 | `test/controllers/PlaylistsController.save.test.js`, visto falhar antes | a série no banco não é regravada; série ausente recusa | controlador + repositório | sim |
| REQ-05 | `test/services/SeriesService.delete.test.js`, visto falhar antes | série e playlists somem juntas; falha deixa tudo; a janela diz quantas | serviço + repositório + componente | sim |
| REQ-06 | `test/views/unsavedChangesGuard.test.js`, `test/router.test.js`, vistos falhar antes | pergunta na navegação, no voltar e no fechar; não pergunta sem alteração | tela + roteador | sim |
| REQ-07 | `test/stores/inventory.userChange.test.js`, visto falhar antes (seis casos) | zero álbuns depois de sair; nenhuma escrita na conta seguinte | loja | sim |
| REQ-08 | `test/services/PlaylistsService.draft.test.js`, `test/controllers/PlaylistsController.restore.test.js`, vistos falhar antes | volta para a mesma pessoa e série; não volta para outra | serviço + controlador | sim |
| REQ-01 a REQ-08 | no navegador, com o login do MJRP (roteiro no relatório de entrega) | o que os testes dizem, visto na tela e no banco de produção | ponta a ponta | não (agente integrador) |
| REQ-09 | nenhum | não entregue | n/a | n/a |

Bordas fora dos critérios: salvar um conjunto vazio é recusado pelo serviço (num lote em edição, só apagaria o lote); a tela não oferece esse caminho.
