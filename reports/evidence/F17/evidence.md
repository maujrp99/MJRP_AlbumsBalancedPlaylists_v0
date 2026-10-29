# Evidência — Feature F17: Ver de onde vem a nota de cada faixa e buscar de novo os dados de um álbum

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-05 (R5 · Ranking pessoal, receitas e celular).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-28 · Ver de onde vem a nota de cada faixa | `bb801a5` | 2026-01-19 | fix(ranking): sprint 23 ranking refactor and bugfixes |
| S-29 · Buscar de novo os dados de um álbum | `a2f789e` | 2026-01-17 | feat(refetch): implement Refetch Metadata with refined UI (v3125) |

## Testes automatizados que existem

- REQ-01 (S-28): test/transformers/TrackTransformer.test.js (preserva as evidências da nota)
- REQ-02 (S-29): test/services/SeriesService.test.js (refetchAlbumMetadata grava o álbum atualizado)

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
