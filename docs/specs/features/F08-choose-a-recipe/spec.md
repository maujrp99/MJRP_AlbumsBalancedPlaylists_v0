---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-10-choose-among-several-recipes-to-build-the-playlist]]"]
planned_for: "[[ROADMAP#^REL-03]]"
---
<!-- docs/specs/features/F08-choose-a-recipe/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F08: Escolher entre mais de uma receita para montar a playlist
**Approved**: not a gate

## Summary
**A feature:** a pessoa escolhe a receita da mistura entre as que o app oferece (a recomendada, de cascata balanceada, e as de «Top N» por popularidade no Spotify, por crítica ou pela ordem da própria pessoa) e a fonte da nota que ela usa.

**Por quê:** a playlist deve sair do jeito que a pessoa quer ouvir, e não de uma única forma de montar.

**Como saber que funcionou:** o painel de geração mostra as quatro receitas e o seletor de fonte da nota; escolher outra receita e gerar muda os nomes e o conteúdo das playlists.

## Problem Statement
Uma única forma de montar a playlist não atende a quem quer outra mistura (S-10). Proveniência: Sprint 8 do ROADMAP legado («Algorithm Selector UI», três algoritmos) e Sprint 17.9 (ADR-0015, «Flavor» vira «Recipe», 2026-01-11); commit e038315 (2025-12-16). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa escolhe a receita da mistura entre as que o app oferece (hoje quatro: a recomendada «[MJRP] Zé's Balanced Playlists» e três de «Top N», por popularidade no Spotify, por crítica ou pela ordem da própria pessoa) e a fonte da nota que ela usa. · from [[S-10-choose-among-several-recipes-to-build-the-playlist|S-10]]
  verified_by:: test/algorithms/topn.test.js (registro com as quatro receitas; Top N por popularidade e por crítica); entrega em produção: commit e038315 (2025-12-16) — ver reports/evidence/F08/evidence.md

## Observable States
- S-10 · [[behavior#^playlists-generation-settings]] · [[behavior#^blend-recipe-choice]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-10 (REQ-01): hoje são quatro receitas (a recomendada «[MJRP] Zé's Balanced Playlists», mais três de «Top N» por popularidade no Spotify, por crítica ou pela minha ordem); a palavra «receita» substituiu «flavor» em 2026-01-11.

## Out of Scope
- O menu de mistura em passos e o ajuste dos ingredientes (F13, release R4).
- Misturar séries diferentes numa só receita e receber recomendações (resultado OUT-05, ainda sem história).
- A troca do nome «flavor» por «receita» (Sprint 17.9) não tem história própria no grafo; está dita no «Hoje» de S-10.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
