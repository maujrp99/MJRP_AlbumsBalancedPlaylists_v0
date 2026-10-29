# Evidência — Feature F01: Criar uma série de álbuns e achar os álbuns na biblioteca, com a nota de cada faixa

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-01 (R1 · Primeiras telas e primeira playlist).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-01 · Dar nome a uma série de álbuns e criá-la com os álbuns escolhidos | `5542a3c` | 2025-11-26 | feat(v2.0): Sprint 2 - Router & Views complete |
| S-04 · Ver todas as séries e os álbuns de cada uma na biblioteca | `1e5be0b` | 2025-11-26 | feat(v2.0): Sprint 3 - Albums & Ranking Views complete |
| S-05 · Achar um álbum na biblioteca por busca e filtros | `585bed7` | 2025-11-28 | Sprint 4.5 Phase 2: Partial completion - MODE 3 implemented, cache issue deferr… |
| S-25 · Ver as faixas de cada álbum com a nota do BestEverAlbums | `1e5be0b` | 2025-11-26 | feat(v2.0): Sprint 3 - Albums & Ranking Views complete |
| S-25 · Ver as faixas de cada álbum com a nota do BestEverAlbums | `7154dc7` | 2025-11-25 | feat(curator): feed balanced playlist generator with acclaim-ordered tracks |

## Testes automatizados que existem

- REQ-01 (S-01): test/stores/series.test.js (createSeries: série nova, ativa, no começo da lista) e test/services/SeriesService.test.js (createSeries)
- REQ-02 (S-04): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-03 (S-05): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-04 (S-25): `test/views/ConsolidatedRankingView.test.js` existe e, pelo nome, ordena as faixas por nota decrescente e filtra por álbum, mas NÃO pode ser contado como prova: ele importa e simula `public/js/stores/series.js` (`:4` e `:14`), arquivo que não existe (a loja de séries é `albumSeries.js`), e prepara `seriesStore` e `view.activeSeriesId` enquanto a tela usa `albumSeriesStore` e `activeAlbumSeriesId` (`ConsolidatedRankingView.js:3`, `:92`). Não foi executado; pela leitura, o carregamento falha ou os casos que desenham a tela não enxergam a série. É o único teste citado nestas 18 pastas com importação quebrada (conferidas todas). Falta consertar o teste (dono: quem implementa); até lá, o REQ-04 fica sem teste que o prove.

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
