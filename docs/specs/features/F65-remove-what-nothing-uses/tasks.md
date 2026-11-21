<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F65: Tirar o que nada usa · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `fix/f65-remove-what-nothing-uses`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] ramo criado: `fix/f65-remove-what-nothing-uses`, a partir da `main` em `2f9215b`
- [x] suíte da `main` verde antes de começar (1869 testes em 156 arquivos) e `npx vite build` compilando; o grafo de importações medido antes de mexer (49 módulos mortos, 4.998 linhas)
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
- [x] TASK-01 `test/architecture/support/importGraph.js`: o grafo de importações a partir das entradas (estáticas, dinâmicas, `require`, `?worker`, HTML, `@import`), com a lista dos módulos mortos da `main` — commit `40b2eb2` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 os 38 módulos de `public/js` que nada alcança saem (`git rm`), com o teste do `SharedAlbumRepository`, dois casos de `test/security/outsideTextIsText.test.js` e as linhas deles em `test/architecture/complexityAllowlist.js` e `test/architecture/layerBoundaries.test.js` — commit `40b2eb2` · implements:: REQ-01 · model:: sonnet · rounds:: 2
- [x] TASK-03 `public/js/app.js`, `public/js/components/TopNav.js`, `public/js/components/Breadcrumb.js`: saem as rotas `/ranking/:albumId`, `/consolidated-ranking` e `/save-all`, as três telas, `MigrationUtility`, `AlbumRepository` e o «Data Sync»; os testes das telas saem e os dois testes de segurança que as citavam são ajustados — commit `c9f15ec` · implements:: REQ-02 · model:: opus · rounds:: 2
- [x] TASK-04 `server/index.js`, `server/routes/playlists.js`, `shared/curation.js`, `public/js/api/client.js`: sai a rota `POST /api/playlists`, a curadoria e os dois métodos do cliente, depois de conferir que nada vivo importa a curadoria — commit `b76c3b3` · implements:: REQ-03 · model:: opus · rounds:: 2
- [x] TASK-05 `server/test/**` sai e `test/server/answerParsing.test.js` entra (7 casos: o que era verdadeiro e roda sem rede); `server/scripts/**`, as páginas de depuração e as configurações de lint do servidor saem; `server/package.json` e `server/package-lock.json` sem os pacotes de desenvolvimento — commit `b76c3b3` · implements:: REQ-04, REQ-06 · model:: opus · rounds:: 2
- [x] TASK-06 `test/security/support/secretScan.js` e `test/security/noSecretsInRepo.test.js`: a busca de segredos, vermelha com os dois scripts do Discogs na árvore e verde sem eles; os dezesseis arquivos sem uso de `scripts/` e quatro soltos da raiz saem — commit `f9d1abd` · implements:: REQ-05 · model:: opus · rounds:: 2
- [x] TASK-07 as páginas de `public/` fora da build, `public/legacy/**`, `public/_api.main.js`, `public/config.js`, `public/package.json`, o atalho `public/js/shared`, `tests/**`, `test/scripts/**` e `test/e2e/**` saem; `package.json` da raiz (descrição, `espree`, `postcss`, sem `puppeteer` e `jsonwebtoken`, sem os scripts `test:e2e`) e `package-lock.json` — commit `fd1cbea` · implements:: REQ-01, REQ-04, REQ-06 · model:: sonnet · rounds:: 1
- [x] TASK-08 `test/architecture/noDeadModules.test.js`: o teste que reprova módulo morto, folha de estilo sem uso, importação quebrada e importação que o grafo não segue, com a exceção escrita; conferido por mutação — commit `121bbdd` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-09 `eslint.config.mjs`: a lista do que não é lido e um bloco por tipo de código; `.eslintrc.json` sai; a medição de antes e de depois por regra; importações sem uso tiradas de `components/TopNav.js` e `api/client.js` — commit `170cdf2` · implements:: REQ-07 · model:: opus · rounds:: 1
- [x] TASK-10 o levantamento das classes escritas sem regra no CSS construído (lista no `plan.md`) e a saída da regra `.text-accent-secondary` de `public/css/modals.css` — commit `0bb5e47` · implements:: REQ-01 · model:: sonnet · rounds:: 1
- [x] TASK-11 a `main` com a F69 trazida para o ramo: `views/helpers/SeriesGridHelper.js` continua removido (nada o importa) e a lista de complexidade perde as linhas que os dois lados tiraram — commit `1e6e6f0` · implements:: REQ-01 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-12 `npx vitest run` (1945 passando em 162 arquivos, com a F69 dentro) e `npx vite build` compilando sem aviso de importação não resolvida; o grafo sem módulo morto; numa cópia limpa do ramo, `npm ci` de verdade (395 pacotes), a suíte, a build e o servidor de desenvolvimento respondendo; o servidor numa cópia fora do repositório (`npm ci --omit=dev`, `/_health` 200, `/api/playlists` 404, rotas guardadas 401) · implements:: REQ-01, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07 · model:: sonnet · rounds:: 1
- [x] TASK-13 prova no navegador, pelo integrador (o implementador não tinha navegador): toda tela ainda abre, pelas 15 rotas do `app.js`, com o console sem erro novo e sem pedido 404 a arquivo do app; os três endereços retirados levam para a Home; o servidor local responde (os dois roteiros estão no `plan.md`) — prova: `reports/evidence/F65/2026-11-19-remove-what-nothing-uses-proof.md` · implements:: REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-14 o passo retroativo da via rápida, a parte do agente: «Prototype: none» gravada na `spec.md` com a frase do MJRP (2026-11-20 00:10); a reconferência visual independente, por quem não implementou: `reports/audits/2026-11-19-F65-visual-parity-recheck.md` (passa, 0 P0, 0 P1); o código está na `main` (merges `ef1b721`, `7be0701`, `1e6e6f0`) e nenhum merge traz nota de Touch ID (não há nota `mjrp-visual-ok` no repositório), então o olhar dele na tela fica na marca `needs_human` da spec, não numa tarefa · implements:: REQ-01 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/specs/arch.md` (a seção nova da F65 e as linhas que citavam o que saiu), `docs/specs/data-model.md`, `docs/specs/tech-stack.md`, `docs/manual/` (as entradas dos módulos removidos marcadas; 01, 02, 03, 11, 17, 18, 19 e 24 reescritas onde descreviam o que saiu), `docs/onboarding/` (QA e UX) e `README.md` dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia

## For the owner at UAT
- O MJRP julga as duas telas de ranking, a tela de migração, a rota `/api/playlists` e os roteiros de navegador ficarem fora (decisões de agentes, revisáveis); o que fazer com as classes sem regra, com as quatro regras do `firestore.rules` sem uso e com os 44 MB de `public/assets` sem uso
- `docs/specs/constitution.md` cita os testes de navegador em Puppeteer, que a F65 tirou; a emenda da constituição é do MJRP.
- O olhar dele na tela é a marca `needs_human` da spec; o aceite é dele no UAT.
