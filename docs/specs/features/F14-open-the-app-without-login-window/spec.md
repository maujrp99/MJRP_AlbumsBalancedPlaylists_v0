---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-39-open-the-app-with-no-login-or-authorization-window]]"]
planned_for: "[[ROADMAP#^REL-04]]"
---
<!-- docs/specs/features/F14-open-the-app-without-login-window/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F14: Abrir o app e começar a usar sem janela de login nem de autorização
**Approved**: not a gate

## Summary
**A feature:** o app abre direto na tela inicial, sem janela de login nem de autorização do Apple Music; a janela de entrada só abre quando a pessoa toca em «Sign In» e a autorização do Apple Music só é pedida ao enviar uma playlist para lá.

**Por quê:** a pessoa só deve ser interrompida quando pede algo que exige conta.

**Como saber que funcionou:** abrir o app não mostra janela nenhuma; a autorização do Apple Music aparece apenas ao exportar para o Apple Music.

## Problem Statement
Pedir login e autorização ao abrir o app interrompe quem só quer usar (S-39). Proveniência: Sprint 15 do ROADMAP legado («ARCH-13: Lazy Authorize: Improved UX, no popup on load»); commit b3b9f32 (2025-12-31), o mesmo que entregou a busca de artista na edição da série (F05). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa abre o app e começa a usar sem que apareça janela de login ou de autorização; a autorização do Apple Music só é pedida ao enviar uma playlist para lá e a janela de entrada só abre ao tocar em «Sign In». · from [[S-39-open-the-app-with-no-login-or-authorization-window|S-39]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit b3b9f32 (2025-12-31) — ver reports/evidence/F14/evidence.md

## Observable States
- S-39 · [[behavior#^auth-anonymous-start]] · [[behavior#^auth-login-modal]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-39 (REQ-01): a autorização do Apple Music só é pedida ao enviar uma playlist para lá; a janela de entrada só abre quando eu toco em «Sign In».

## Out of Scope
- Entrar com Google ou Apple (F04) e enviar ao Apple Music (F10): aqui só muda o momento em que cada janela aparece.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
