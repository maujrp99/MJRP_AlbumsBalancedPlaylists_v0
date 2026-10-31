---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-01-create-a-named-album-series]]", "[[S-04-browse-every-series-and-its-albums-in-the-library]]", "[[S-05-find-an-album-in-the-library-by-search-and-filters]]", "[[S-25-see-album-tracks-with-the-besteveralbums-rating]]"]
planned_for: "[[ROADMAP#^REL-01]]"
---
<!-- docs/specs/features/F01-create-series-and-browse-library/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F01: Criar uma série de álbuns e achar os álbuns na biblioteca, com a nota de cada faixa
**Approved**: not a gate

## Summary
**A feature:** a tela inicial deixa a pessoa dar um nome a uma série e criá-la com os álbuns que escolheu; a biblioteca mostra todas as séries e os álbuns de cada uma, em grade ou em lista, com busca e filtros; e a lista de cada álbum traz as faixas com a posição e a nota da crítica no BestEverAlbums.

**Por quê:** quem monta playlists a partir de álbuns precisa de um conjunto de álbuns pronto, de achar o que já montou sem recomeçar e de saber quais faixas a crítica mais aclama.

**Como saber que funcionou:** criar uma série com um nome e dois álbuns abre a série criada com o aviso «Created series: X with 2 albums»; na biblioteca ela aparece com seus álbuns, a busca por título ou artista a encontra e a lista de faixas de um álbum mostra a nota de cada faixa.

## Problem Statement
Quem cura playlists a partir de álbuns precisa montar um conjunto de álbuns para misturar (S-01), voltar a ele sem recomeçar e achar um álbum numa biblioteca grande (S-04, S-05) e saber quais faixas a crítica mais aclama (S-25). Proveniência: entregue antes do harness nos Sprints 2, 3 e 4.5 do ROADMAP legado («HomeView with series creation»; «Albums Library, Ranking, Playlists views» e «BestEverAlbums badge integration»; «Grid vs Expanded view toggle»), pelos commits 5542a3c, 7154dc7, 1e5be0b e 585bed7. Feature reconstituída no conform de 2026-10-28 a partir das histórias S-01, S-04, S-05 e S-25.

## Requirements
- [REQ-01] Ao criar a série, a pessoa dá um nome (sem nome digitado vale «New Album Series») e escolhe os álbuns; o app abre a série criada, avisa quantos álbuns ela tem e, sem nenhum álbum escolhido, pede para escolher ao menos um. · from [[S-01-create-a-named-album-series|S-01]]
  verified_by:: test/stores/series.test.js (createSeries: série nova, ativa, no começo da lista) e test/services/SeriesService.test.js (createSeries); entrega em produção: commit 5542a3c (2025-11-26) — ver reports/evidence/F01/evidence.md
- [REQ-02] A biblioteca mostra todas as séries e os álbuns de cada uma, em grade ou em lista (a escolha fica guardada no navegador), com esqueleto enquanto carrega, aviso de falha e estado de biblioteca vazia. · from [[S-04-browse-every-series-and-its-albums-in-the-library|S-04]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 1e5be0b (2025-11-26) — ver reports/evidence/F01/evidence.md
- [REQ-03] A pessoa busca por título ou artista e filtra por série, artista, década e fonte da nota; sem resultado a tela diz «No albums match your filters», e trocar de série zera a busca e os filtros. · from [[S-05-find-an-album-in-the-library-by-search-and-filters|S-05]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 585bed7 (2025-11-28) — ver reports/evidence/F01/evidence.md
- [REQ-04] A lista de cada álbum mostra as faixas com a posição e a nota da crítica no BestEverAlbums; o cabeçalho da coluna ordena a tabela e mostra as médias; faixa sem dado fica na ordem original. · from [[S-25-see-album-tracks-with-the-besteveralbums-rating|S-25]]
  verified_by:: test/views/ConsolidatedRankingView.test.js (ordena as faixas por nota decrescente e filtra por álbum); entrega em produção: commit 1e5be0b (2025-11-26), 7154dc7 (2025-11-25) — ver reports/evidence/F01/evidence.md

## Observable States
- S-01 · [[behavior#^home-series-default-name]] · [[behavior#^home-series-created]] · [[behavior#^home-series-needs-album]] · [[behavior#^home-series-create-failed]]
- S-04 · [[behavior#^library-scope-url]] · [[behavior#^library-loading-skeleton]] · [[behavior#^library-load-failed]] · [[behavior#^library-empty]] · [[behavior#^library-view-mode-remembered]] · [[behavior#^album-card]] · [[behavior#^album-detail-modal]]
- S-05 · [[behavior#^library-search-and-filters]] · [[behavior#^library-filter-empty]]
- S-25 · [[behavior#^album-track-table]] · [[behavior#^album-card]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-01 (REQ-01): sem nome digitado, a série se chama «New Album Series»; ao criar, o app abre a série criada e avisa «Created series: X with N albums»; sem nenhum álbum escolhido pede para escolher ao menos um.
- Para S-04 (REQ-02): a escolha de grade ou lista fica guardada no navegador; enquanto carrega, cada série aparece como esqueleto; biblioteca vazia leva à tela inicial.
- Para S-05 (REQ-03): sem resultado, a tela diz «No albums match your filters»; trocar de série zera a busca e os filtros.
- Para S-25 (REQ-04): clicar no cabeçalho da coluna ordena a tabela; o cabeçalho mostra as médias; faixa sem dado fica na ordem original.

## Out of Scope
- Montar a série por artista (S-02), por lista colada (S-03) ou a partir de gênero, vibe e faixas soltas (ainda sem entrega no v0, rotas «em breve»): são outras features ou ainda Backlog.
- Ver todos os álbuns de uma série no painel geral, sem o teto de 12 por série, e abrir o ranking do álbum e de todas as faixas por endereço: itens que o v0 ainda não faz, fora desta feature.
- Editar, excluir e ordenar as séries: F05 e F15.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
