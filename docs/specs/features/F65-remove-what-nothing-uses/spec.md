---
status: Done
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-203", "UAT-21", "UAT-29", "UAT-10", "UAT-11", "UAT-30"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F65: Tirar o que nada usa
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O código que nenhuma entrada do app ou do servidor alcança sai do repositório, com as telas alcançáveis só por endereço, a rota do servidor que nenhum cliente chama, os scripts e as páginas que nada roda e os testes que nenhum comando executa. Dois testes novos seguram o resultado: um reprova módulo morto, o outro reprova credencial escrita em arquivo.

**Por quê:** O que não é usado custa a cada leitura e esconde o que é de verdade; dois scripts sem uso traziam um token escrito; três testes do servidor importavam um arquivo que não existe.

**Como saber que funcionou:** `npx vitest run` passa com os dois testes novos dentro; o grafo de importações não acha módulo morto; `npx vite build` compila; toda tela que tem caminho no menu continua abrindo (prova do integrador, no navegador).

## Problem Statement
Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`) e a triagem das issues abertas (`reports/audits/2026-11-19-mjrpalbumblender-v0-open-issues-triage.md`). As decisões de retirar as telas, a rota e os scripts estão no `docs/log.md` de 2026-11-19 21:03: tomadas pelo agente integrador sob a dispensa do MJRP, revisáveis; o código fica no histórico do git.

O que a feature conserta, e o que só diminui:
- **UAT-203** — código morto, estilos sem definição, roteiros de navegador que não rodam. Conserta o código morto por arquivo e os roteiros (saem); dos estilos sem definição entrega a lista, sem reestilizar (sem navegador).
- **UAT-21** — testes de curadoria importam arquivo que não existe. violates:: [[constitution#IV]]. Saem com a curadoria; o que era verdadeiro em `server/test/` passa a rodar no `npx vitest run`.
- **UAT-10** — telas de ranking alcançáveis só por endereço: aposentadas.
- **UAT-11** — tela de migração sem caminho no app: removida.
- **UAT-30** — «Album Not Found» ao clicar no álbum: a mensagem só sobrevivia na tela de ranking por endereço, que saiu.
- **UAT-29** — já estava em `fixed` pela triagem; fica na lista `fixes` como o integrador a pôs.
- **Diminuem, sem fechar:** UAT-17 (os dois scripts com o token saem e um teste impede a volta; trocar o token no Discogs é do MJRP, e a F66 é a dona da issue), UAT-20 (a busca de segredos vira teste e o ESLint passa a ler cada pasta como o que ela é; o lint ainda não é portão), UAT-19 (os arquivos que importam o `app.js` caem de seis para quatro).

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] Todo módulo de `public/js`, `shared` e `server` é alcançado, pelo grafo de importações, a partir de uma entrada (`public/index.html`, `server/index.js`, ou um arquivo que os scripts dos `package.json` e de `scripts/` nomeiem); toda folha de `public/css` também. Teste não conta como uso. Um teste reprova o módulo que ninguém alcança, a importação de arquivo que não existe e a importação com nome montado em tempo de execução; as exceções são uma lista escrita, com o motivo de cada uma. · fixes UAT-203
  verified_by:: `test/architecture/noDeadModules.test.js` (com `test/architecture/support/importGraph.js`)
- [REQ-02] O app não tem mais as telas `/ranking/:albumId`, `/consolidated-ranking` e `/save-all`, nem o código «Data Sync» do menu: o endereço digitado leva para a Home, como qualquer endereço que o app não conhece, e nenhuma outra tela muda. · fixes UAT-10, UAT-11, UAT-30
  verified_by:: `test/architecture/noDeadModules.test.js`, `test/security/outsideTextIsText.test.js` (o caminho de navegação sem o ramo de ranking), `test/router.test.js` («unknown address»: vai para a Home) e [[uat#^UAT-10]], [[uat#^UAT-11]] (a prova no navegador, do integrador)
- [REQ-03] O servidor não tem mais a rota `POST /api/playlists` nem a curadoria que só ela usava; o cliente não tem mais os métodos que a chamavam. As demais rotas respondem como antes. · fixes UAT-203
  verified_by:: `test/architecture/noDeadModules.test.js`, `test/server/authGuard.test.js`, `test/api/client.test.js` e a prova do servidor descrita no `plan.md` (cópia local: `/_health` 200, `/api/playlists` 404, `/api/enrich-album` 401 sem login)
- [REQ-04] Todo teste do repositório roda num comando só, `npx vitest run`: não há teste que importe arquivo inexistente nem pasta de testes fora do comando. · fixes UAT-21
  verified_by:: `test/server/answerParsing.test.js`, `test/architecture/noDeadModules.test.js` (nenhuma importação de arquivo que não existe) e o `include` do `vitest.config.js`
- [REQ-05] Nenhum arquivo de texto acompanhado pelo git traz credencial escrita; um teste acusa arquivo, linha e regra, e nunca mostra o valor. Os valores públicos por desenho são uma lista escrita, com o motivo. · fixes UAT-203
  verified_by:: `test/security/noSecretsInRepo.test.js` (com `test/security/support/secretScan.js`)
- [REQ-06] Os dois `package.json` declaram o que o código usa e só isso: entram `espree` e `postcss` na raiz; saem as dependências usadas só por código removido; os dois `package-lock.json` acompanham, sem mudar a versão de nenhum pacote que fica. · fixes UAT-203
  verified_by:: `npm ci` numa cópia limpa do ramo, seguido de `npx vitest run` e `npx vite build`, e `npm ci --omit=dev` numa cópia do servidor (registrados no `plan.md`)
- [REQ-07] `npx eslint .` lê cada parte do código como o que ela é (navegador, worker, compartilhado, CommonJS do servidor, Node, testes do Vitest) e não lê o que é construído, instalado ou de terceiros. · fixes UAT-203
  verified_by:: `eslint.config.mjs` e a medição do `plan.md` (377 avisos `no-undef` por falta de globais na `main`; 1 no ramo, que é um defeito de verdade)

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nó de requisito. Nenhum estado do `docs/specs/behavior.md` descrevia as três telas retiradas, e o arquivo não mudou. O `docs/specs/info-arch.md` não existe neste projeto.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- O grafo de importações não acha módulo morto em `public/js`, `shared` e `server` (medido: 254 arquivos alcançados, 0 mortos; na `main` eram 49 mortos, 4.998 linhas).
- `npx vitest run` passa (1945 testes em 162 arquivos, com a F69 dentro) e `npx vite build` compila sem aviso de importação não resolvida.
- A busca de segredos é vermelha na `main` (em `scripts/generate-dataset.js:8` e `scripts/fetch-missing-artists.js:12`) e verde no ramo.
- `npm ci` aceita os dois `package-lock.json`.
- O servidor sobe e responde: `/_health` 200, `/api/playlists` 404.
- No navegador (integrador): cada uma das 15 rotas que restam abre como antes; os três endereços retirados levam para a Home.

## Out of Scope
- Reestilizar o app: as classes escritas sem regra no CSS (105, lista no `plan.md`) ficam como estão; decidir o que fazer com cada uma pede navegador e é do MJRP.
- Função exportada ou método que ninguém chama dentro de um arquivo vivo (o grafo é por arquivo).
- Pôr o ESLint na CI ou nos roteiros de publicação: restam 25 erros.
- `firestore.rules`: quatro regras ficaram sem nenhum código que as use; fechá-las é do MJRP (a lista está no `plan.md`).
- Trocar o token do Discogs (do MJRP; F66).
- Os cerca de 44 MB de `public/assets` que o app não carrega (dados e imagens): listados no `plan.md`, não removidos.
- `docs/specs/uat.md`, `MEMORY.md`, `ROADMAP.md`, `docs/specs/priority.md`: do integrador.

## Open Questions
<!-- ALL resolved before Plan. -->
- As duas telas de ranking e a tela de migração saem? — Sim; decidido pelo agente integrador sob a dispensa do MJRP, 2026-11-19 21:03, revisável (o MJRP julga; tarefa aberta no `tasks.md`).
- A rota `POST /api/playlists` e `shared/curation.js` saem? — Sim, mesma decisão; conferido neste ramo que nada vivo importa a curadoria.
- Os roteiros de navegador (`test/e2e`) voltam a rodar ou saem? — Saem; decidido pelo agente implementador, 2026-11-19, revisável: 4 dos 17 elementos que procuram não existem mais, nenhum comando da CI ou da publicação os roda, e a prova no navegador do projeto é a do integrador. Voltar atrás é reverter um commit.
- O `dotenv` sai da raiz? — Não; decidido pelo agente implementador, 2026-11-19: um módulo do servidor que os testes da raiz carregam o pede ao carregar.
