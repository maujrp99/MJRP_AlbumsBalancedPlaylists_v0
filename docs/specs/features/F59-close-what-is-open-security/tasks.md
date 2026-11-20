<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F59: Fechar o que está aberto: banco, servidor e chaves · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, fatia por fatia (via rápida), cada fatia no seu ramo. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] um ramo por fatia, a partir da `main`: o da última parte da fatia E é `fix/f59-tailwind-local-and-url-schemes`
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
<!-- Atomic (one focused session), verifiable (a clear "done"), ordered by dependency: data → logic →
     components → composition → polish. -->
<!-- Marks, after `implements::`, separated by ` · `:
     model:: sonnet|opus — MANDATORY on every task; the author of this file decides, the implementer never does.
                        sonnet = MECHANICAL: texts and registry keys, summaries, format samples and tests, derived
                        files, renames. opus = code design, architecture, critique, visual recheck. There is no
                        default: a task without the mark fails the cross-check.
     rounds:: N       — written when the task CLOSES ([x]): how many Execute ⇄ Verify rounds it took (ceiling 3).
                        `python3 mjrp-scripts/loop.py --check-tasks tasks.md` fails a closed task without it. -->
- [x] TASK-01 `firestore.rules` igual às regras em vigor e apontado pelo `firebase.json`; `test/security/firestoreRules.test.js` — commit `90cd34f` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `SpotifyAuthService.js`: a volta do login conferida e os segredos vindos do gerador criptográfico; `test/services/spotify/SpotifyAuthSafety.test.js` — commit `90cd34f` · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-03 `AuthNav.js`: sair da conta encerra a sessão do Spotify; `test/components/AuthNav.signout.test.js` — commit `90cd34f` · implements:: REQ-03 · model:: sonnet · rounds:: 1
- [x] TASK-04 `vite.config.js`: build sem mapas de código (`90cd34f`); `test/security/buildHandsOutNoSource.test.js` (ramo `fix/f59-tailwind-local-and-url-schemes`) · implements:: REQ-04 · model:: sonnet · rounds:: 1
- [x] TASK-05 `server/lib/debugGate.js` e `server/lib/asyncRoute.js`: rotas de depuração desligadas por padrão; rota que quebra responde; `test/server/debugGate.test.js` — commit `c48689d` · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-06 `server/lib/auth/` (`verifyIdToken.js`, `requireUser.js`, `guards.js`) e `server/lib/rateLimit.js`: a porta das rotas pagas e o limite por pessoa; `test/server/authGuard.test.js` — commit `e253edd` · implements:: REQ-06 · model:: opus · rounds:: 1
- [x] TASK-07 `public/js/api/serverFetch.js`: o app chama o servidor por um lugar só, com o login; `test/api/serverFetch.test.js` — commit `e253edd` · implements:: REQ-07 · model:: opus · rounds:: 1
- [x] TASK-08 `escapeHtml` em `public/js/utils/stringUtils.js` e os 61 pontos em 20 arquivos; `test/utils/escapeHtml.test.js`, `test/security/outsideTextIsText.test.js`, `test/architecture/outsideTextEscaped.test.js` — commit `c98fa3f` · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-09 `public/js/utils/safeUrl.js`, usada em `Card.js`, `ConsolidatedRankingView.js` e `SpotifyExportModal.js`; `test/utils/safeUrl.test.js`, `test/security/outsideUrlIsChecked.test.js`, `test/architecture/outsideUrlChecked.test.js` (falhava com os três pontos antes do conserto) — commit `ca1a4b2` · implements:: REQ-09 · model:: opus · rounds:: 1
- [x] TASK-10 Tailwind 3.4.19 compilado pelo Vite: `tailwind.config.js` (tema, lista de arquivos, classes montadas na hora), `vite.config.js`, `public/css/tailwind.css`, `app.js`; `public/index.html` sem o script do CDN, sem a configuração embutida e sem o endereço do CDN na política de conteúdo; `test/architecture/tailwindBuiltWithSite.test.js` — commit `f73a211` · implements:: REQ-10, REQ-11 · model:: opus · rounds:: 1

## Verification
- [x] TASK-11 suíte (`npx vitest run`: 1002 passando, 982 antes do ramo), `npx vite build` com o CSS em `dist/assets/`, `npx vite` entregando os estilos, e complexidade até 10 nas funções novas (`npx eslint --rule '{"complexity":["error",10]}'`) · implements:: REQ-09, REQ-10, REQ-11 · model:: sonnet · rounds:: 1
- [x] TASK-12 prova no servidor de verdade e em produção das fatias A, B, C e do texto da fatia E: `reports/evidence/F59-close-what-is-open-security/F59-probe-2026-11-19.json` · implements:: REQ-01, REQ-02, REQ-05, REQ-06, REQ-08 · model:: opus · rounds:: 1
- [x] TASK-13 prova no navegador da troca do Tailwind e dos endereços: cada tela do app comparada com a de produção (Home com o Scan e a pilha de escolhidos; Albums em grade, em lista e expandido, com os selos; a janela de um álbum; o ranking de um álbum e a janela de ranking próprio; o ranking consolidado; o menu de blend com uma receita selecionada, que é onde estão as classes montadas na hora; as playlists geradas e o arrastar; as playlists salvas; o inventário e as suas janelas; a janela de entrada; o menu de cima no celular e o rodapé; a página de «em breve»); o console sem o aviso do CDN e sem recusa da política de conteúdo; o botão «abrir no Spotify» depois de exportar uma playlist — prova: `reports/evidence/F59/2026-11-19-tailwind-built-and-url-schemes-proof.md` · implements:: REQ-09, REQ-10, REQ-11 · model:: opus · rounds:: 1
- [ ] TASK-14 o passo retroativo da via rápida: «Prototype: none» dito pelo MJRP e o ok visual dele (Touch ID no merge) · implements:: REQ-01 · model:: opus · waiting:: human — o protótipo e o ok visual são do MJRP · action:: o MJRP diz «Prototype: none» para os consertos e dá o ok visual no merge

## Documentation
- [x] `docs/specs/tech-stack.md` (linha do Tailwind, com a [[ADR-0021]]), `docs/specs/arch.md` (a casca e a linha de CDN/Assets) e `docs/manual/` (07b, 09a, 31) dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md` (UAT-25 e UAT-199), `MEMORY.md` e `ROADMAP.md`: do agente integrador, depois da prova no navegador — conferido: UAT-25 e UAT-199 em `fixed`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia

## For the owner at UAT
- aceite da [[ADR-0021]] (o Tailwind fica, compilado junto com o site)
- Fecha quando o MJRP disser «Prototype: none» e der o ok visual (passo retroativo da via rápida); depois, o aceite é dele no UAT.
