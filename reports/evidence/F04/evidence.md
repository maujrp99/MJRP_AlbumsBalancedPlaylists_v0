# Evidência — Feature F04: Entrar com a conta Google ou Apple e ter séries, playlists e coleção guardadas na nuvem

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-02 (R2 · Dados na nuvem e inventário).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-37 · Entrar com a conta Google ou Apple, ou seguir como convidado | `18fbfc4` | 2025-12-11 | fix(auth-persistence): Resolve regressions and stabilize Sprint 6 features |
| S-38 · Ter as séries, as playlists e a coleção guardadas na nuvem, por conta | `6eb6682` | 2025-11-28 | Sprint 5 Phases 1-2: Firestore Persistence + Cache + Migration (34/34 tests ✅) |
| S-38 · Ter as séries, as playlists e a coleção guardadas na nuvem, por conta | `b85f473` | 2025-12-03 | feat: implement persistence and series management UI |
| S-38 · Ter as séries, as playlists e a coleção guardadas na nuvem, por conta | `edc38ee` | 2025-12-21 | fix(auth): implement AuthService to gate routing behind auth readiness - fixe… |

## Testes automatizados que existem

- REQ-01 (S-37): `test/services/AuthService.test.js` (entrar com Google, entrar com Apple, sair) e `test/stores/UserStore.test.js` (o estado ao entrar e ao sair; o erro de entrada vira o texto do erro). Cobrem o serviço de entrada e a loja do usuário. NÃO cobrem a janela de entrada (as três opções, o Esc que não fecha, as frases como «Sign-in cancelled» em `LoginModal.js:90`) nem o menu com foto, nome e «Sign Out»: não há teste de `LoginModal` nem de `AuthNav`/`TopNav`.
- REQ-02 (S-38) — o que os testes provam e o que NÃO provam:
  - `test/services/DataSyncService.test.js` existe e cobre a função que copia: `migrateInventory` (`:11-48`) e `migrateSeries` (`:50-67`) recebem um repositório de mentira e uma lista montada à mão e recriam os itens, contando os que deram certo. Prova que a cópia funciona quando alguém a chama.
  - `test/services/auth/UserSyncService.test.js` existe e cobre só as duas funções soltas, com a entrada montada à mão: `handleUserChange` chama a função de migração quando o teste entrega `currentUserId = 'guest'` e `newUser = { id: 'user-1' }` (`:22-29`), e `migrateSeries` repassa a série a `saveSeries`, que ali é um dublê (`:5-7`, `:41-50`). Além disso o teste usa `mockDataSync` dentro de `vi.mock` antes de ele ser declarado (`:5-11`), coisa que o vitest costuma recusar; como não foi executado, não se sabe sequer se ele carrega.
  - **NÃO provam o fluxo real do visitante que entra com uma conta, e esse fluxo não funciona hoje: UAT-12 (`docs/specs/uat.md`, [[uat#^UAT-12]]).** Os valores do teste não existem no app: nada atribui `'guest'` (o visitante é `'anonymous-user'`, `public/js/stores/albumSeries.js:19` e `:74`; `git grep -n "'guest'" -- public/js` só acha `UserSyncService.js:22`), o usuário do Firebase tem `uid`, não `id` (`UserSyncService.js:19`; `SeriesService.js:50` usa `newUser.uid`) e `dataSyncService.saveSeries` não existe (`UserSyncService.js:38`; `DataSyncService.js` só tem `migrateInventory` e `migrateSeries`). O teste passaria mesmo com a migração real quebrada, e ela está quebrada. A migração das séries do visitante para a conta NÃO está coberta por teste nenhum; fica como defeito aberto até a UAT-12 ser consertada. O caminho do inventário (`public/js/stores/inventory.js:29-60`) é outro código, não passa por `UserSyncService`, e esta pasta não o dá como provado.
  - Também não há teste do que o REQ-02 diz sobre abrir o app: a entrada sozinha como convidado (`public/js/services/AuthService.js:58`) e o aviso «Authentication issue. Some features may be limited.» (`public/js/app.js:64`).
- Nenhum destes testes foi executado nesta passagem; «existe e cobre X» é leitura do teste e do código, não resultado de execução.

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
