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

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): Nenhuma.
