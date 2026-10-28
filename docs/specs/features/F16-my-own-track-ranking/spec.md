---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-27-give-the-tracks-my-own-order-and-blend-by-it]]"]
planned_for: "[[ROADMAP#^REL-05]]"
---
<!-- docs/specs/features/F16-my-own-track-ranking/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F16: Dar a minha própria ordem às faixas de um álbum e misturar por ela
**Approved**: not a gate

## Summary
**A feature:** uma janela «Rank It» deixa a pessoa ordenar as faixas de um álbum arrastando e guardar essa ordem; a receita «Top Tracks by My Own Ranking» mistura por ela, e o cartão ganha o selo «MY RANKING», a coluna «My Rank» e o filtro «My Ranking».

**Por quê:** a playlist deve refletir o gosto da pessoa, não só a crítica nem a popularidade.

**Como saber que funcionou:** depois de guardar a ordem, o cartão do álbum mostra «Ranked» e uma playlist gerada com a receita «Top Tracks by My Own Ranking» traz primeiro as faixas que a pessoa pôs no topo.

## Problem Statement
A crítica e a popularidade não dizem o gosto da própria pessoa (S-27). Proveniência: Sprint 20 do ROADMAP legado («User Ranking System», «Recipe Parity») e sua spec arquivada (docs/technical/specs/archive/sprint20-user-ranking-ext/); commit 7aa9704 (2026-01-11). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa ordena as faixas de um álbum arrastando, guarda essa ordem e escolhe a receita que mistura por ela; guardada a ordem, o cartão ganha o selo «MY RANKING», a coluna «My Rank» e o filtro «My Ranking». · from [[S-27-give-the-tracks-my-own-order-and-blend-by-it|S-27]]
  verified_by:: test/ranking/UserRankingStrategy.test.js (ordena pela posição do usuário; ordem original sem ranking); entrega em produção: commit 7aa9704 (2026-01-11) — ver reports/evidence/F16/evidence.md

## Observable States
- S-27 · [[behavior#^album-rank-it-modal]] · [[behavior#^album-rank-it-saved]] · [[behavior#^library-search-and-filters]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-27 (REQ-01): a janela «Rank It» mostra a posição de cada faixa no BestEverAlbums e no Spotify como referência; guardada a ordem, o cartão ganha o selo «MY RANKING», a coluna «My Rank» e o filtro «My Ranking»; a receita «Top Tracks by My Own Ranking» usa essa ordem.

## Out of Scope
- Ordenar as faixas pelo toque no celular, em tela cheia (F18).
- Ver de onde vem a nota de cada faixa (F17).

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
