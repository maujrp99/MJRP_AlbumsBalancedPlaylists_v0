<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F54: Fecho da v4.0: apagar do inventário e acabamento · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do código (passo retroativo da via rápida), a partir do `docs/log.md` de 2026-11-19 e dos commits do ramo `fix/f54-close-v4-inventory-delete-and-polish`.

## Architecture Approach
Nenhuma mudança de arquitetura. Três consertos foram feitos no ponto compartilhado em vez de em cada tela, para valerem para todos os usos: o texto como propriedade no `SafeDOM`, a duração num formatador único (`utils/duration.js`, função pura), e o esquecimento do guardado no repositório do inventário, que é quem conhece a chave.

## Technical Design
- `public/js/controllers/InventoryController.js`: `handleDelete` chama `inventoryStore.removeAlbum` e trata a falha (REQ-01).
- `public/js/repositories/InventoryRepository.js`: `removeAlbum` esquece a resposta «já está no inventário» guardada para o álbum do item (REQ-02).
- `public/js/utils/duration.js`: `formatDuration(seconds)`; usado por `components/ranking/UserRankModal.js` e `components/ranking/TracksTable.js` (REQ-03).
- `public/js/utils/SafeDOM.js`: `textContent` vira o texto do elemento (REQ-04).
- `public/index.html`, `public/favicon.png`, `public/apple-touch-icon.png`, `public/favicon.ico`, `public/js/views/HomeView.js`: ícone e título (REQ-05).

## UI/UX Design (if the feature touches a screen)
Sem desenho novo: rótulo, valores e ícone que já deviam estar lá.

## Dependencies
Nenhuma.

## Documents Consulted
- `docs/specs/uat.md` (UAT-01, UAT-188, UAT-195)
- `reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md`
- `public/js/models/Track.js` (a duração em segundos)

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — sem mudança: nenhum componente, fluxo técnico ou integração novos
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade, campo ou esquema mudou
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — atualizado (commit `82336c2`)
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou

## Risks & Considerations
- O `SafeDOM` é usado em quase todas as telas: o teste cobre que `textContent` não é lido como HTML e que filhos e cliques continuam funcionando.
- Faixa sem duração passa a mostrar «--:--» na janela de ranking (antes «0:00» para todas).

## Test plan
- `test/controllers/InventoryController.delete.test.js`, `test/repositories/InventoryRepository.remove.test.js` (REQ-01, REQ-02), vistos falhar antes.
- `test/utils/duration.test.js` (REQ-03), visto falhar antes.
- `test/utils/SafeDOM.test.js` (REQ-04), escrito junto com o conserto.
- No navegador: a evidência da feature (REQ-01, REQ-03, REQ-04, REQ-05).
