---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-21-download-the-playlists-as-a-json-file]]"]
planned_for: "[[ROADMAP#^REL-01]]"
---
<!-- docs/specs/features/F03-download-playlists-as-json/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F03: Baixar as playlists geradas num arquivo JSON
**Approved**: not a gate

## Summary
**A feature:** um botão «Download JSON» no quadro de ações das playlists baixa um arquivo com as playlists geradas e o nome do lote.

**Por quê:** a pessoa quer guardar uma cópia das playlists fora do app.

**Como saber que funcionou:** clicar em «Download JSON» baixa o arquivo `playlists_<lote>_<AAAA-MM-DD>.json` com as playlists e o nome do lote.

## Problem Statement
Quem gera playlists quer levar uma cópia delas para fora do app (S-21). Proveniência: Sprint 4 do ROADMAP legado, commit c8be9fa (2025-11-27). É uma fatia de uma história só, entregue junto com F02 no mesmo commit; ficou separada porque baixar um arquivo é um valor próprio, confirmado por uma verificação própria. Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa baixa as playlists geradas num arquivo JSON chamado `playlists_<lote>_<AAAA-MM-DD>.json`, com as playlists e o nome do lote. · from [[S-21-download-the-playlists-as-a-json-file|S-21]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit c8be9fa (2025-11-27) — ver reports/evidence/F03/evidence.md

## Observable States
- S-21 · [[behavior#^playlists-download-json]] · [[behavior#^playlists-actions-panel]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-21 (REQ-01): o arquivo se chama `playlists_<lote>_<AAAA-MM-DD>.json` e leva as playlists e o nome do lote.

## Out of Scope
- Enviar as playlists ao Apple Music (F10) ou ao Spotify (F11).
- Qualquer outro formato de arquivo além do JSON.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
