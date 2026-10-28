---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-30-navigate-the-app-on-a-phone-with-the-drawer-menu]]", "[[S-31-read-album-tracks-on-a-phone-stacked-rows-and-tabs]]", "[[S-32-order-an-albums-tracks-by-touch-full-screen]]"]
planned_for: "[[ROADMAP#^REL-05]]"
---
<!-- docs/specs/features/F18-phone-use/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F18: Usar o app no celular: menu em gaveta, faixas empilhadas e ordenação pelo toque
**Approved**: not a gate

## Summary
**A feature:** no celular, o menu vira um botão ☰ que abre uma gaveta com todas as telas; a tabela de faixas de um álbum empilha as linhas e a janela de detalhes troca a tabela por abas (Original, BestEverAlbums e Spotify); e a janela «Rank It» ocupa a tela toda para ordenar as faixas com o dedo.

**Por quê:** quem escuta no celular quer usar o app inteiro lá, sem precisar do computador.

**Como saber que funcionou:** abaixo de 768 px o menu aparece como ☰ e abre a gaveta; a tabela de faixas não tem rolagem horizontal; «Rank It» abre em tela cheia.

## Problem Statement
O app, desenhado para o computador, não cabia na tela do celular (S-30, S-31, S-32). Proveniência: Sprint 21 do ROADMAP legado («Mobile Layout: responsive grid/list, fullscreen modals, touch-friendly tables») e sua spec arquivada (docs/technical/specs/archive/sprint21-mobile-ux/); commits 8bd0b5c (2025-12-06), 29b3f5e e 6d79577 (ambos de 2026-01-14). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] No celular, abaixo de 768 px, o menu vira o botão ☰ que abre uma gaveta com todas as telas; a gaveta fecha ao tocar num link, no fundo, no ✕ ou ao ampliar a janela, e trava a rolagem da página. · from [[S-30-navigate-the-app-on-a-phone-with-the-drawer-menu|S-30]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 8bd0b5c (2025-12-06), 6d79577 (2026-01-14) — ver reports/evidence/F18/evidence.md
- [REQ-02] No celular, a tabela de faixas de um álbum empilha as linhas e a janela de detalhes troca a tabela larga pelas abas Original, BestEverAlbums e Spotify. · from [[S-31-read-album-tracks-on-a-phone-stacked-rows-and-tabs|S-31]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 6d79577 (2026-01-14) — ver reports/evidence/F18/evidence.md
- [REQ-03] No celular, até 768 px de largura, a janela «Rank It» ocupa a tela toda e a pessoa arrasta as faixas com o dedo. · from [[S-32-order-an-albums-tracks-by-touch-full-screen|S-32]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 29b3f5e (2026-01-14), 6d79577 (2026-01-14) — ver reports/evidence/F18/evidence.md

## Observable States
- S-30 · [[behavior#^app-mobile-drawer]]
- S-31 · [[behavior#^album-track-table]] · [[behavior#^album-detail-modal]]
- S-32 · [[behavior#^album-rank-it-modal]] · [[behavior#^album-rank-it-saved]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-30 (REQ-01): abaixo de 768 px o menu vira o botão ☰; a gaveta fecha ao tocar num link, no fundo, no ✕ ou ao ampliar a janela, e trava a rolagem da página.
- Para S-31 (REQ-02): no celular a tabela de faixas empilha as linhas, e a janela de detalhes troca a tabela larga pelas três abas.
- Para S-32 (REQ-03): até 768 px de largura a janela «Rank It» ocupa a tela toda.

## Out of Scope
- Remover uma faixa e abrir detalhes só pelo toque: o v0 ainda não faz.
- Aplicativos para celular: está em «Later» do ROADMAP, é outro produto.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
