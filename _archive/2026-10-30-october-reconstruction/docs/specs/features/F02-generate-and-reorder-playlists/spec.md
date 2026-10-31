---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-09-generate-balanced-playlists-from-a-series]]", "[[S-14-see-the-generated-playlists-tracks-and-lengths]]", "[[S-15-reorder-playlists-by-dragging-and-removing-tracks]]"]
planned_for: "[[ROADMAP#^REL-01]]"
---
<!-- docs/specs/features/F02-generate-and-reorder-playlists/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F02: Gerar playlists equilibradas a partir de uma série e reorganizá-las arrastando as faixas
**Approved**: not a gate

## Summary
**A feature:** a partir de uma série, o app gera playlists que equilibram as faixas de todos os álbuns («Greatest Hits», «Deep Cuts», «Orphan Tracks»); a pessoa vê cada playlist com o título, as faixas e a duração e a reorganiza arrastando as faixas ou tirando as que não quer.

**Por quê:** quem ouve álbuns quer uma mistura coerente em vez de álbum por álbum, e quer conferir e ajustar o resultado antes de guardar ou exportar.

**Como saber que funcionou:** gerar a partir de uma série mostra as playlists com título, número de faixas e duração; arrastar uma faixa para outra playlist ou tirá-la com o ✕ muda a playlist na hora.

## Problem Statement
O consumo de música em álbuns, um a um, não dá a mistura coerente que a pessoa quer ouvir; ela precisa de playlists que equilibrem as faixas de todos os álbuns da série (S-09), de ver o resultado (S-14) e de deixá-lo do jeito dela (S-15). Proveniência: Sprint 4 do ROADMAP legado («Core playlist generation», «Drag-and-drop with Sortable.js»), entregue em um único commit, c8be9fa (2025-11-27), que trouxe as três histórias juntas. Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A partir de uma série, o app gera playlists que equilibram as faixas de todos os álbuns («Greatest Hits», «Deep Cuts», «Orphan Tracks»); sem nota nenhuma nos álbuns pergunta se a pessoa quer continuar, e sem álbuns carregados pede para carregá-los. · from [[S-09-generate-balanced-playlists-from-a-series|S-09]]
  verified_by:: test/algorithms/mixins.test.js (balanceamento entre playlists e «Orphan Tracks») e test/algorithms/topn.test.js; entrega em produção: commit c8be9fa (2025-11-27) — ver reports/evidence/F02/evidence.md
- [REQ-02] A pessoa vê as playlists geradas com o título, as faixas, a duração e a posição de cada faixa por fonte de nota (a minha em azul, BestEverAlbums em laranja, Spotify em verde); a grade tem 1, 2 ou 3 colunas conforme a largura. · from [[S-14-see-the-generated-playlists-tracks-and-lengths|S-14]]
  verified_by:: test/views/PlaylistsView.test.js (formato mm:ss da duração); entrega em produção: commit c8be9fa (2025-11-27) — ver reports/evidence/F02/evidence.md
- [REQ-03] No computador, a pessoa arrasta faixas dentro de uma playlist e de uma para outra e tira a faixa que não quer (o ✕ aparece ao passar o mouse); no toque o arrasto começa depois de 100 ms. · from [[S-15-reorder-playlists-by-dragging-and-removing-tracks|S-15]]
  verified_by:: test/services/PlaylistsService.test.js (moveTrack e retrato do estado); entrega em produção: commit c8be9fa (2025-11-27) — ver reports/evidence/F02/evidence.md

## Observable States
- S-09 · [[behavior#^playlists-generating]] · [[behavior#^playlists-no-albums]] · [[behavior#^playlists-no-ratings-confirm]] · [[behavior#^playlists-generate-no-albums]] · [[behavior#^playlists-generated-names]]
- S-14 · [[behavior#^playlists-grid]] · [[behavior#^playlists-track-row]]
- S-15 · [[behavior#^playlists-track-removed]] · [[behavior#^playlists-track-dragged]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-09 (REQ-01): o app gera «Greatest Hits», «Deep Cuts» e «Orphan Tracks»; sem nota nenhuma nos álbuns, pergunta se quero continuar mesmo assim; sem álbuns carregados, pede para carregá-los.
- Para S-14 (REQ-02): a grade tem 1, 2 ou 3 colunas conforme a largura; cada faixa mostra selos de posição (a minha em azul, BestEverAlbums em laranja, Spotify em verde).
- Para S-15 (REQ-03): no computador o ✕ da faixa aparece ao passar o mouse; no toque o arrasto começa depois de 100 ms.

## Out of Scope
- Desfazer e refazer mudanças da playlist, excluir uma playlist do lote antes de guardar, renomear uma playlist e recuperar as playlists após recarregar a página: itens que não funcionam hoje, tratados em outra frente do conform (conserto), não nesta feature.
- Guardar o lote na nuvem (F06) e baixar ou enviar as playlists (F03, F10, F11).
- Escolher outra receita (F08) e ajustar a receita (F13): aqui só a receita recomendada gera.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
