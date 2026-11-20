<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F64: Um caminho só, testado, para produção · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do código (passo retroativo da via rápida), a partir do que foi feito no ramo `fix/f64-one-tested-way-to-production` em 2026-11-19.

## Architecture Approach
Nenhuma mudança na arquitetura do produto: a feature troca o modo de publicar. O que era conhecimento repetido (dois scripts, um `cloudbuild.yaml`, dois jobs de publicação na automação, os passos à mão no log) passa a ter uma representação: um script por destino, com a parte comum num arquivo só. Refina as linhas de implantação do `docs/specs/arch.md` (que ainda descrevem o estado anterior; ver «Out of Scope» da spec).

A produção é sempre construída da `main` commitada, numa cópia exportada para a pasta temporária do sistema. Daí saem três propriedades: o que vai ao ar é o que está no git; nada é escrito nem apagado no repositório; o script pode ser chamado de qualquer worktree.

## Technical Design
Fluxo, igual nos dois: recusar se a `main` está suja → conferir ferramentas e login → exportar a `main` → `npm ci` → `npx vitest run` → preparar (build do site, ou contexto da imagem) → conferir o preparado → publicar → conferir a produção → mostrar a volta. Com `--dry-run`, os passos de publicar e de conferir a produção não rodam.

- `scripts/lib/deploy-common.sh` (REQ-01, REQ-02, REQ-03): achar o repositório e a pasta onde a `main` está aberta (`git worktree list`); recusar com mudança não commitada em arquivo versionado; criar a pasta temporária (`mktemp -d` sob `TMPDIR`, recusada se ficar dentro do repositório) e removê-la na saída, só se tiver o nome que o próprio script criou; exportar (`git archive`); `npm ci`; rodar os testes.
- `scripts/deploy-site.sh` (REQ-01, REQ-03): acha o `.env` (`DEPLOY_ENV_FILE`, a pasta da `main`, a cópia atual), lê o Client ID sem nunca escrevê-lo na saída; confere o login do Firebase CLI (ou `GOOGLE_APPLICATION_CREDENTIALS`, ou `FIREBASE_TOKEN`); `npx vite build`; copia `firebase-config.js`, `css/`, `assets/` e `favicon.ico`; confere o script principal, o Client ID nos scripts, a ausência de `.map`, cada arquivo local que o `index.html` aponta e cada arquivo de `public/css` e `public/assets`; `firebase deploy --only hosting`; busca o `index.html` no ar e o script que ele nomeia (o Hosting responde 200 com a página do app para arquivo inexistente, então o conteúdo é olhado).
- `scripts/deploy-server.sh` (REQ-02, REQ-03, REQ-04): confere o login do gcloud (ou `GOOGLE_APPLICATION_CREDENTIALS`, só para a execução); lê do serviço a revisão que serve e o endereço; monta `server/_shared_temp` (com `{"type": "module"}`) e `server/config`; recusa `.env` ou `node_modules` no contexto; copia o contexto para uma arrumação igual à da imagem, `npm ci --omit=dev`, sobe o servidor sem nenhuma variável de segredo e pergunta `/_health`, `/api/musickit-status` (200) e `/api/debug/files` (404), depois carrega os prompts e os módulos de `shared/`; `gcloud run deploy mjrp-proxy --source server`; confere que a revisão nova recebe 100% do tráfego e repete as duas perguntas na produção; mostra `gcloud run services update-traffic` com o nome da revisão anterior.
- `server/Dockerfile` (REQ-04): `node:26-slim`; `npm ci --omit=dev`, sem a queda para `npm install`; cabeçalho dizendo quem monta o contexto.
- `cloudbuild.yaml`, `scripts/deploy-prod.sh`, `scripts/deploy-backend.sh` (REQ-04, REQ-06): removidos.
- `.github/workflows/ci.yml` (REQ-05; era `ci-firebase.yml`): um job, `npm ci` e `npx vitest run`, em push e pull request; sem publicação, sem segredo.
- `package.json` (REQ-06): `deploy:site`, `deploy:server` e as variantes `:dry-run`.
- `docs/manual/00_Deployment_and_Setup.md`, `.env.example`, `.github/copilot-instructions.md`, `.github/instructions/copilot.instructions.md` (REQ-06).

### As duas receitas da imagem
Lido do serviço em 2026-11-19: a imagem em uso vem de `southamerica-east1-docker.pkg.dev/.../cloud-run-source-deploy/mjrp-proxy`, com as anotações de build do `gcloud run deploy --source`; o `cloudbuild.yaml` empurraria para `gcr.io/.../mjrp-proxy`. A produção usa, portanto, a receita do `--source` com `server/Dockerfile`. O `cloudbuild.yaml` não copiava `config/` nem marcava `shared/` como módulo ES (UAT-22) e foi removido. A única coisa que só ele registrava, a ligação dos quatro segredos, foi para o manual (seção 2.4), conferida contra o serviço.

## Fatia do lint (2026-11-19, ramo `fix/f58-layers-and-lint-gate`; UAT-20)

`npx eslint .` na `main` em `44b5dd0`: **22 erros e 78 avisos** (a issue falava em 81 erros; a F65 consertou a configuração e ficaram 25; a fatia 5 da F52 e a F65 tiraram mais três, entre eles o `no-dupe-else-if` de `server/lib/normalize.js` e dois `no-empty`). Depois desta fatia: **1 erro e 24 avisos**.

| Regra | Antes | Depois | O que foi feito |
|---|---|---|---|
| `no-useless-escape` | 17 | 0 | Barras sem efeito dentro de classes de caracteres, em seis expressões: `[\(\[]` e `[\)\]]` viraram `[([]` e `[)\]]` (`toCore` do app; `toCore`, `toFuzzyCore` e `normalizeFuzzy` do servidor); `[\.)\-:]` virou `[.)\-:]` (a lista numerada); `[\.\):]` e `[\s\.\)-]` viraram `[.):]` e `[\s.)-]` (o número na frente do título de uma faixa). Dentro de uma classe, `\(`, `\[`, `\)` e `\.` são o próprio caractere: o significado é o mesmo. Nenhuma tinha teste: os testes foram escritos e rodados antes da troca |
| `no-dupe-keys` | 2 | 1 | `components/Icons.js` tinha `Plus` duas vezes. Num objeto vale a última: o app sempre desenhou a segunda (duas linhas). A primeira (dois traços `path`) saiu. A que resta é `sorting`, duas vezes iguais, em `controllers/InventoryController.js:44`, arquivo de outro ramo |
| `no-async-promise-executor` | 1 | 0 | `AlbumLoader.load` criava uma `Promise` com uma função `async` (um erro lançado ali se perde). Virou o método `async _read()`, com o mesmo `try/catch`: nunca rejeita, responde lista vazia e a chamada seguinte tenta de novo |
| `no-case-declarations` | 1 | 0 | um `const` dentro de um `case` ganhou o seu bloco (`SeriesEventHandler.js`) |
| `no-empty` | 1 | 0 | um `catch` vazio na busca da capa de uma série (`BlendSeriesSelector.js`) passou a escrever no console o mesmo `console.debug` que o `catch` vizinho já escrevia |
| `no-unused-vars` (aviso) | 77 | 24 | importações e variáveis sem uso, parâmetros de `catch` que ninguém lia (`catch (e)` virou `catch`), dois parâmetros de função de retorno. Ficam 17 parâmetros que documentam uma interface e 7 em arquivos de outro ramo |
| diretiva sem efeito (aviso) | 1 | 0 | um `eslint-disable-next-line` que não calava nada (`server/lib/asyncRoute.js`) |
| `no-undef` (aviso) | 0 | 0 | a issue citava um; já não existe na `main` |

**O portão não foi ligado.** A regra desta entrega: sem zero erros, nenhum passo novo na automação nem nos scripts, porque um passo que reprova sempre trava toda publicação. O passo que falta está escrito na TASK-13. O texto proposto para `scripts/lib/deploy-common.sh` foi rodado fora da publicação, contra este ramo: recusou com o erro que resta e a mensagem «the code check (lint) found errors: nothing was deployed».

```bash
# Runs ESLint on the clean copy. One error stops the deploy; warnings do not.
run_lint() {
  step "Checking the code (npx eslint . --quiet)"
  local log="$WORK_DIR/eslint.log"
  if ( cd "$SRC_DIR" && npx eslint . --quiet ) >"$log" 2>&1; then
    ok "no lint errors"
  else
    tail -40 "$log" >&2
    die "the code check (lint) found errors: nothing was deployed"
  fi
}
```

O `eslint`, o `@eslint/js` e o `globals` já estão em `devDependencies` e no `package-lock.json`: o `npm ci` da cópia limpa os instala. Os ensaios (`deploy:*:dry-run`) exportam sempre a `main` commitada, não o ramo: só provam o portão depois da junção.

**O que o lint apontou e não é mecânico** (não consertado aqui; cada um é uma decisão):
- `components/series/SeriesHeader.js`: `canGenerate` (há álbuns?) era calculado e nunca usado: o botão «Blend your Albums» aparece ligado mesmo sem álbuns. A variável saiu; o botão ficou como estava.
- `services/musickit/MusicKitCatalog.js:255`: um `sort((a, b) => 0)`, que não ordena nada.
- `server/lib/normalize.js`, a lista numerada: «3 - Gamma» fica «- Gamma» e «12 Monkeys» fica «Monkeys»; `besteveralbums.js`: «10.000 Days» fica «000 Days». Fixados nos testes como estão hoje.
- `components/ui/modals/InputModal.js`: criava dois botões de rodapé que jogava fora antes de criar os de verdade. A criação sem uso saiu.

## Dependencies
Nenhuma dependência nova no projeto. Na máquina: Firebase CLI e gcloud logados, Node, npm, git, curl.

## Documents Consulted
- `docs/specs/uat.md` (UAT-202, UAT-20, UAT-22)
- `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md` (tema 6) e `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md` (seção B)
- `docs/log.md` de 2026-11-19 (as publicações feitas à mão)
- `docs/specs/arch.md` (implantação), `firebase.json`, `vite.config.js`, `vitest.config.js`, `server/index.js`, `server/lib/prompts.js`
- o serviço `mjrp-proxy` no Cloud Run (só leitura: origem da imagem, nomes das variáveis)

## Risks & Considerations
- **Node 18 → 26 no servidor.** Muda o comportamento da produção na próxima publicação do servidor. Mostrado: o servidor sobe no Node 26.11 com as dependências do lockfile, responde às rotas de estado, carrega prompts e módulos compartilhados; `jsonwebtoken` assina e verifica ES256 (o algoritmo do token da Apple) com uma chave descartável; `cheerio` e `axios` carregam. Não mostrado: as rotas pagas e os raspadores contra os sites reais, e a imagem `node:26-slim` em si (a etiqueta existe no Docker Hub; a imagem só é construída na publicação). A volta é um comando, para a revisão anterior. Alternativa mais conservadora: `node:24-slim` (também em suporte), que não pôde ser exercitada nesta máquina.
- **`npm ci --omit=dev` sem queda para `npm install`:** um lockfile do servidor fora de passo passa a reprovar o build em vez de instalar outra coisa calado. O script acusa isso antes, na subida local.
- **O script roda da cópia onde é chamado, a fonte é sempre a `main`.** Chamado de um ramo, usa o script daquele ramo para publicar a `main`.
- **`npm ci` a cada execução:** alguns segundos a mais e depende da rede; em troca, o teste e o build usam exatamente o lockfile commitado.
- **Depois de uma volta atrás no servidor, o serviço fica preso à revisão:** a publicação seguinte cria a revisão e não recebe tráfego. O script acusa e mostra o comando `--to-latest`; o manual explica.
- **A automação do GitHub não foi testada.** O lockfile tem os pacotes opcionais de Linux (`@rollup/rollup-linux-x64-gnu`, `@esbuild/linux-x64`), mas o arquivo nunca rodou.
- **O contexto enviado ao Cloud Build** é a pasta `server/` da cópia limpa (sem `.env`, sem `node_modules`); arquivos de depuração versionados em `server/` (`search_debug.html`, `search_debug.png`, `test/`) seguem indo para a imagem, como antes.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 16:08 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `npm run deploy:site:dry-run` | saída 0; Client ID nos scripts, nenhum `.map`, script principal existe | script, ponta a ponta sem publicar | sim (o próprio script) |
| REQ-01 | publicação real do site | o `index.html` no ar nomeia o script construído | produção | sim (o próprio script); espera o sim do MJRP |
| REQ-02 | `npm run deploy:server:dry-run` | saída 0; servidor sobe; 200 e 404 nas duas rotas; prompts e `shared/` carregam | script, ponta a ponta sem publicar | sim |
| REQ-02 | publicação real do servidor | revisão nova com 100% do tráfego; 200 e 404 na produção | produção | sim; espera o sim do MJRP |
| REQ-01, REQ-02 | `main` com arquivo versionado alterado | recusa antes de qualquer passo, saída 1 | script | não (feito à mão num repositório descartável) |
| REQ-01 | `.env` com `VITE_SPOTIFY_CLIENT_ID` vazio | recusa, saída 1 | script | não (feito à mão) |
| REQ-03 | pasta temporária depois do ensaio | removida; nenhum arquivo novo no repositório | script | não (conferido à mão) |
| REQ-04 | subida local no Node 26 | igual ao REQ-02 | script | sim |
| REQ-05 | push ou pull request no GitHub | o job `unit-tests` passa | automação | não testado |
| REQ-06 | leitura do manual e do `package.json` | um caminho só | documento | não |
| REQ-08 | `textCleaningPatterns.test.js` (22 casos: parênteses e colchetes nos três normalizadores do servidor, a lista numerada, o número na frente de um título nas duas formas da página), `NormalizationUtils.test.js` (14), `Icons.test.js` (3: o desenho de `Plus`, nenhum ícone escrito duas vezes), `AlbumLoader.test.js` (6) | verdes antes e depois de cada troca | servidor, utilitário, componente, serviço | sim |
| REQ-08 | `npx eslint .` | 1 erro, no arquivo de outro ramo; 24 avisos | lint | à mão (ainda não é portão) |
| REQ-09 | `npx eslint .` na automação e nos dois ensaios | recusa com um erro; passa com avisos | automação, script | não ligado (TASK-13); o passo dos scripts foi rodado fora da publicação e recusou |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): Nenhuma.
