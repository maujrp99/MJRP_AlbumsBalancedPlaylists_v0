---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-11-build-the-blend-in-steps-series-recipe-ingredients]]", "[[S-12-tune-the-recipe-tracks-per-album-grouping-length]]", "[[S-13-regenerate-with-another-recipe-in-place]]", "[[S-17-name-a-batch-of-playlists]]"]
planned_for: "[[ROADMAP#^REL-04]]"
---
<!-- docs/specs/features/F13-blending-menu-and-recipe-tuning/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F13: Montar a mistura em passos, ajustar a receita, dar nome ao lote e gerar de novo sem sair da tela
**Approved**: not a gate

## Summary
**A feature:** um menu de mistura em passos (série, receita, ingredientes e «Blend it!»), com o ajuste da receita (faixas por álbum, agrupamento, uma ou várias playlists, duração), o nome do lote que aparece nos títulos na hora e um painel para gerar de novo com outra receita sem sair da tela de playlists.

**Por quê:** a pessoa quer saber o que falta escolher, gerar a mistura de uma vez e comparar misturas sem voltar ao menu.

**Como saber que funcionou:** o menu trava os passos seguintes até o anterior ser escolhido; ao gerar abre a tela de playlists com os títulos «1. Lote - Título»; o painel «Reconfigure your Music Playlist Blend» gera de novo sobre os mesmos álbuns.

## Problem Statement
Gerar playlists exigia ir série por série; a documentação do menu de mistura (spec do Blending Menu, 2025-12-22) pede um assistente claro, com a metáfora do cardápio, para escolher série, receita e ingredientes (S-11), ajustar a receita (S-12), regenerar sem voltar (S-13) e reconhecer cada lote pelo nome (S-17). Proveniência: Sprints 7, 13, 15.5 e 16 do ROADMAP legado («Algorithm Renaming», «Grouping Tracks», «Batch Naming Integration»); commits e8ebe0b (2025-12-23), 333e72b (2025-12-23), 9d53fdf (2025-12-31), ab4bbb6 e a86877a (2026-01-02) e d3ed5e1 (2026-01-02). Quatro histórias de dois épicos que o histórico entregou juntas em torno do menu; ficam numa feature porque são um só ciclo de uso do menu. Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa percorre um menu de mistura em passos, escolhendo a série, a receita e os ingredientes, e gera no fim; os passos seguintes ficam trancados até o anterior ser escolhido, o lote nasce com o nome «TheAlbumBlender Playlist AAAA-MM-DD HH:mm» e no fim abre a tela de playlists. · from [[S-11-build-the-blend-in-steps-series-recipe-ingredients|S-11]]
  verified_by:: test/e2e/blending-wizard.test.js (assistente de ponta a ponta); entrega em produção: commit e8ebe0b (2025-12-23), 9d53fdf (2025-12-31) — ver reports/evidence/F13/evidence.md
- [REQ-02] A pessoa ajusta a receita escolhida: faixas por álbum (1 a 10), forma de agrupar (por álbum, por posição geral, por artista, intercalado, aleatório), uma playlist ou várias e a duração (30 a 180 minutos, só quando a receita a usa); os nomes das playlists levam SPFY, BEA ou UGR e o agrupamento. · from [[S-12-tune-the-recipe-tracks-per-album-grouping-length|S-12]]
  verified_by:: test/components/blend/BlendIngredientsPanel.test.js (controles por receita e normalização da escolha) e test/algorithms/topn.test.js; entrega em produção: commit ab4bbb6 (2026-01-02), a86877a (2026-01-02) — ver reports/evidence/F13/evidence.md
- [REQ-03] Na tela de playlists, a pessoa abre o painel «Reconfigure your Music Playlist Blend» (começa recolhido e mostra quantas playlists há), troca a receita e os ingredientes e gera de novo sobre os mesmos álbuns. · from [[S-13-regenerate-with-another-recipe-in-place|S-13]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 333e72b (2025-12-23) — ver reports/evidence/F13/evidence.md
- [REQ-04] A pessoa dá um nome ao lote de playlists num campo sempre à vista, com um nome padrão; ao digitar, os títulos da grade viram «1. Lote - Título» na hora e o nome vale também para a exportação. · from [[S-17-name-a-batch-of-playlists|S-17]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit d3ed5e1 (2026-01-02) — ver reports/evidence/F13/evidence.md

## Observable States
- S-11 · [[behavior#^blend-steps-unlock]] · [[behavior#^blend-series-choice]] · [[behavior#^blend-series-none]] · [[behavior#^blend-recipe-choice]] · [[behavior#^blend-generating]] · [[behavior#^blend-failed]] · [[behavior#^blend-default-batch-name]]
- S-12 · [[behavior#^blend-ingredients-by-recipe]] · [[behavior#^playlists-generated-names]]
- S-13 · [[behavior#^playlists-reconfigure-panel]]
- S-17 · [[behavior#^playlists-batch-name-live]] · [[behavior#^blend-default-batch-name]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-11 (REQ-01): os passos seguintes ficam trancados até o anterior ser escolhido; o lote nasce com o nome «TheAlbumBlender Playlist AAAA-MM-DD HH:mm»; no fim abre a tela de playlists.
- Para S-12 (REQ-02): a quantidade vai de 1 a 10 faixas por álbum; há cinco formas de agrupar (por álbum, por posição geral, por artista, intercalado e aleatório); a duração vai de 30 a 180 minutos e só aparece quando a receita a usa; os nomes das playlists levam SPFY, BEA ou UGR e o agrupamento.
- Para S-13 (REQ-03): o painel «Reconfigure your Music Playlist Blend» começa recolhido e mostra quantas playlists há.
- Para S-17 (REQ-04): o campo está sempre à vista, com um nome padrão; ao digitar, os títulos viram «1. Lote - Título» na hora; o nome vale também para a exportação.

## Out of Scope
- O Discovery Mode, que não tem efeito hoje, e abrir o menu com a série já escolhida: itens que não funcionam hoje, tratados em outra frente do conform.
- Escolher a receita pela primeira vez na tela de playlists (F08) e guardar o lote (F06).
- Misturar séries diferentes (resultado OUT-05).

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
