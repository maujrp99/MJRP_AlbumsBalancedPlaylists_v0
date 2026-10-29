---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-37-sign-in-with-google-or-apple-or-continue-as-guest]]", "[[S-38-keep-series-playlists-and-collection-in-the-cloud]]"]
planned_for: "[[ROADMAP#^REL-02]]"
---
<!-- docs/specs/features/F04-sign-in-and-cloud-storage/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F04: Entrar com a conta Google ou Apple e ter séries, playlists e coleção guardadas na nuvem
**Approved**: not a gate

## Summary
**A feature:** a pessoa entra com a conta Google ou Apple, ou segue como convidado, e as suas séries, playlists e coleção ficam guardadas na nuvem, ligadas à conta.

**Por quê:** o que a pessoa montou precisa estar ao voltar ao app, em outro navegador ou em outro aparelho, e ficar ligado à conta dela.

**Como saber que funcionou:** entrar com uma conta mostra a foto e o nome no menu; as séries e as playlists continuam lá depois de fechar e abrir o app, inclusive em outro navegador.

## Problem Statement
Sem conta e sem nuvem, o que a pessoa monta fica preso a um navegador. As duas histórias entregam o par: guardar na nuvem por conta (S-38) e entrar com Google ou Apple, sair ou seguir como convidado (S-37). Proveniência: Sprints 5 e 6 do ROADMAP legado («Firestore Persistence: Cloud sync for Albums, Series, and Playlists», «Google Sign-In», «Apple Sign-In»); commits 6eb6682 (2025-11-28), b85f473 (2025-12-03), edc38ee (2025-12-21) e 18fbfc4 (2025-12-11). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa entra com a conta Google ou Apple, sai quando quiser ou segue como convidado; a janela de entrada tem três opções e não fecha com Esc, os erros viram frases como «Sign-in cancelled» e, depois de entrar, o menu mostra a foto e o nome e oferece «Sign Out». · from [[S-37-sign-in-with-google-or-apple-or-continue-as-guest|S-37]]
  verified_by:: test/services/AuthService.test.js (Google, Apple, sair) e test/stores/UserStore.test.js; entrega em produção: commit 18fbfc4 (2025-12-11) — ver reports/evidence/F04/evidence.md
- [REQ-02] As séries, as playlists e a coleção ficam guardadas na nuvem, ligadas à conta; ao abrir, o app entra sozinho como convidado e, se isso falhar, avisa «Authentication issue. Some features may be limited.». · from [[S-38-keep-series-playlists-and-collection-in-the-cloud|S-38]]
  verified_by:: test/services/DataSyncService.test.js (a função que copia séries e álbuns para um repositório) e test/services/auth/UserSyncService.test.js (duas funções soltas, com a entrada montada à mão); a migração real das séries do visitante ao entrar com uma conta NÃO está provada e não funciona hoje: [[uat#^UAT-12]]; testes não executados nesta sessão (falta npm ci); entrega em produção: commit 6eb6682 (2025-11-28), b85f473 (2025-12-03), edc38ee (2025-12-21) — ver reports/evidence/F04/evidence.md

## Observable States
- S-37 · [[behavior#^auth-login-modal]] · [[behavior#^auth-login-result]] · [[behavior#^auth-user-menu]] · [[behavior#^auth-sign-out]]
- S-38 · [[behavior#^auth-anonymous-start]] · [[behavior#^inventory-saved-per-user]] · [[behavior#^playlists-save-saved]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-37 (REQ-01): a janela de entrada tem três opções e não fecha com Esc; erros viram frases como «Sign-in cancelled»; depois de entrar, o menu mostra a foto e o nome e oferece «Sign Out».
- Para S-38 (REQ-02): ao abrir, o app entra sozinho como convidado; se isso falhar, avisa «Authentication issue. Some features may be limited.».

## Out of Scope
- Levar para a nuvem o que já estava só no navegador (item que o v0 ainda não faz, fora desta feature).
- Abrir o app sem janela de login nem de autorização (F14, release R4).
- Regras de acesso do Firestore: hoje parte dos dados está aberta a qualquer visitante autenticado (arch.md); corrigir isso é conserto, não esta feature.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
