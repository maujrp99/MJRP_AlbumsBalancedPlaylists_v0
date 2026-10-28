---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-16-save-generated-playlists-as-a-batch-in-the-cloud]]", "[[S-18-browse-the-saved-playlists-by-series-and-by-batch]]"]
planned_for: "[[ROADMAP#^REL-02]]"
---
<!-- docs/specs/features/F06-save-and-browse-playlist-batches/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F06: Guardar as playlists geradas num lote na nuvem e consultá-las depois, por série e por lote
**Approved**: not a gate

## Summary
**A feature:** a pessoa guarda as playlists geradas num lote ligado à série e, depois, abre as playlists guardadas organizadas por série e por lote, com busca, ordenação e as faixas de cada playlist.

**Por quê:** a pessoa quer voltar a uma mistura que já fez, de qualquer lugar onde entre com a conta, e achá-la entre muitas.

**Como saber que funcionou:** depois de clicar em «Save to Series History» o lote aparece na tela de playlists guardadas, dentro da série, com capas, contagens e data.

## Problem Statement
Gerar uma mistura e perdê-la ao fechar a página não serve: a pessoa precisa guardar o lote (S-16) e depois encontrá-lo (S-18). Proveniência: Sprint 5 do ROADMAP legado («Firestore Persistence: Cloud sync for Albums, Series, and Playlists»); commits 3919f18 (2025-12-06) e b6034b6 (2025-12-07). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa guarda as playlists geradas num lote ligado à série (botão «Save to Series History», que mostra «Saving…» e «Saved!»), e depois de guardar a tela passa a ser de edição do lote. · from [[S-16-save-generated-playlists-as-a-batch-in-the-cloud|S-16]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit b6034b6 (2025-12-07) — ver reports/evidence/F06/evidence.md
- [REQ-02] A pessoa abre as playlists guardadas organizadas por série e por lote, busca, ordena e vê as faixas de cada playlist; a lista tem estados de carregando, falha, vazio e sem resultado. · from [[S-18-browse-the-saved-playlists-by-series-and-by-batch|S-18]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 3919f18 (2025-12-06) — ver reports/evidence/F06/evidence.md

## Observable States
- S-16 · [[behavior#^playlists-save-saved]] · [[behavior#^playlists-save-failed]]
- S-18 · [[behavior#^saved-loading]] · [[behavior#^saved-load-failed]] · [[behavior#^saved-empty]] · [[behavior#^saved-filter-empty]] · [[behavior#^saved-hierarchy]] · [[behavior#^saved-batch-card]] · [[behavior#^saved-series-header]] · [[behavior#^saved-playlist-details]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-16 (REQ-01): o botão «Save to Series History» mostra «Saving…» e depois «Saved!»; guardar de novo um lote com o mesmo nome não avisa que sobrescreve; depois de guardar, a tela passa a ser de edição do lote.
- Para S-18 (REQ-02): os lotes vêm do mais novo ao mais antigo; cada lote começa recolhido e mostra capas, contagens e data; a lista tem estados de carregando, falha, vazio e sem resultado.

## Out of Scope
- Editar ou excluir um lote já guardado (F09, release R3).
- Dar nome ao lote (F13, release R4).
- Excluir uma playlist do lote antes de guardar e renomear uma playlist (itens que não funcionam hoje, tratados em outra frente do conform).
- Guardar de novo um lote com o mesmo nome não avisa que sobrescreve: é o comportamento do código, registrado na história S-16.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
