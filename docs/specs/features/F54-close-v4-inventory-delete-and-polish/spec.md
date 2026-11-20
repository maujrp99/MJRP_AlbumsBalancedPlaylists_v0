---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-01", "UAT-188", "UAT-195"]
planned_for: "[[ROADMAP#^REL-39]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F54: Fecho da v4.0: apagar do inventário e acabamento
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Apagar um álbum do inventário passa a apagar de verdade; a janela de ranking e a de detalhe do álbum mostram a duração das faixas; o botão de fechar da janela de detalhe tem rótulo; a aba do navegador mostra o logo do site e um título só.

**Por quê:** São os defeitos que a regressão de 2026-11-19 e o MJRP acharam e que não dependem de mudar a arquitetura; fecham a v4.0.

**Como saber que funcionou:** No inventário, confirmar a exclusão remove o item e ele não volta ao recarregar; nas duas janelas, cada faixa mostra minutos e segundos; o botão mostra «Close».

## Problem Statement
O MJRP, em 2026-11-19: «na v4.0, eu fecharia os que nao impactam e dependem da arquitetura mais o fix do ranking que reportei»; «o botao no canto inferior direito nao tem label é o que?»; «sabe o logo do site … pode colocar ele como favicon do browser tb … e no texto do browser "MJRP The Album Blender - Playlist Generator"».

## Requirements
- [REQ-01] Confirmar a remoção de um item do inventário remove o item, avisa, e ele não volta ao recarregar; uma falha avisa e deixa a tela como estava. · fixes UAT-01
  verified_by:: `test/controllers/InventoryController.delete.test.js`, `reports/evidence/F54-close-v4-inventory-delete-and-polish/F54-browser-2026-11-19.json`
- [REQ-02] Um álbum removido do inventário pode ser adicionado de novo em seguida. · fixes UAT-01
  verified_by:: `test/repositories/InventoryRepository.remove.test.js`
- [REQ-03] A duração de uma faixa é formatada por uma função só, a partir de segundos, na janela de ranking e na tabela de faixas. · fixes UAT-188
  verified_by:: `test/utils/duration.test.js`, `reports/evidence/F54-close-v4-inventory-delete-and-polish/F54-browser-2026-11-19.json`
- [REQ-04] Um texto passado como propriedade a um elemento montado pelo `SafeDOM` aparece como texto. · fixes UAT-195
  verified_by:: `test/utils/SafeDOM.test.js`, `reports/evidence/F54-close-v4-inventory-delete-and-polish/F54-browser-2026-11-19.json`
- [REQ-05] A aba do navegador mostra o logo do site como ícone e o título «MJRP The Album Blender - Playlist Generator» em todas as telas. · fixes UAT-195
  verified_by:: `reports/evidence/F54-close-v4-inventory-delete-and-polish/F54-browser-2026-11-19.json`

## Observable States
N/A: a feature não importa nenhum requisito (conserto das issues UAT-01, UAT-188 e UAT-195). Os estados `^inventory-item-card` e `^album-rank-it-modal` do `behavior.md` foram reescritos para o que o código faz agora.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada: um botão ganhou o rótulo que já devia ter, duas colunas passaram a mostrar o valor certo, e a aba ganhou o logo que o site já usa. O ícone e o título foram pedidos pelo MJRP com o texto exato.
- Transversal layer touched: `utils/SafeDOM.js` (o ajudante que monta elementos) e a nova `utils/duration.js`.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- Remover «GNX» do inventário: de 24 para 23 itens, com aviso, e 23 depois de recarregar. Visto em 2026-11-19.
- A janela de ranking de «Brothers In Arms» mostra 6:59, 5:12, 8:26; antes, «0:00».
- A janela de detalhe do álbum não mostra nenhum «--:--» e o botão do rodapé diz «Close».

## Out of Scope
- A tela de edição de playlists (UAT-190) e o resto da UAT-192 (idioma das receitas, série de origem no blend): foram para a F62 e a F63, na v5.0.
- `TrackRow.formatDuration` e `PlaylistGrid.calculateDuration` continuam formatando por conta própria, em segundos e corretos; juntar ao formatador único fica para a F65.
- A tela de inventário desenhando por cima de outras telas (achado dos relatórios anteriores): não reproduzido; segue no mapa da v5.0.

## Open Questions
- Nenhuma.
