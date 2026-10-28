---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-22-send-the-playlists-to-apple-music]]"]
planned_for: "[[ROADMAP#^REL-03]]"
---
<!-- docs/specs/features/F10-send-playlists-to-apple-music/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F10: Enviar as playlists para o Apple Music
**Approved**: not a gate

## Summary
**A feature:** a pessoa envia as playlists de um lote para o Apple Music, numa pasta com o nome da série; o app pede a autorização do Apple Music só nesse momento e avisa quantas playlists foram enviadas e quantas faixas não foram achadas.

**Por quê:** a pessoa quer ouvir a mistura no player que já usa.

**Como saber que funcionou:** exportar para o Apple Music cria uma pasta com o nome da série e uma playlist por item, e o aviso «N playlist(s) exported to …» diz quantas faixas não foram achadas.

## Problem Statement
A mistura só serve se puder ser ouvida no player da pessoa (S-22). Proveniência: Sprint 7 do ROADMAP legado («Apple Music Integration: MusicKit OAuth, export playlists»); commit 0be7441 (2025-12-12). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa envia as playlists do lote para o Apple Music, numa pasta com o nome da série; o app pede a autorização do Apple Music só nesse momento, cria uma playlist por item e avisa quantas foram enviadas e quantas faixas não foram achadas. · from [[S-22-send-the-playlists-to-apple-music|S-22]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 0be7441 (2025-12-12) — ver reports/evidence/F10/evidence.md

## Observable States
- S-22 · [[behavior#^apple-export-done]] · [[behavior#^apple-export-failed]] · [[behavior#^apple-music-not-configured]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-22 (REQ-01): o app pede a autorização do Apple Music só nesse momento; cria uma playlist por item e avisa quantas foram enviadas e quantas faixas não foram achadas.

## Out of Scope
- Enviar para o Spotify (F11).
- Pedir a autorização do Apple Music ao abrir o app: ao contrário, ela é só no envio (F14).

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
