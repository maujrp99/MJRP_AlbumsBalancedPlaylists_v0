# Deployment & Setup Guide

**Source**: `scripts/deploy-site.sh`, `scripts/deploy-server.sh`, `scripts/lib/deploy-common.sh`, `server/Dockerfile`, `.github/workflows/ci.yml` (F64)
**Last Updated**: 2026-11-19

---

## 1. Onde o produto roda

| Parte | Plataforma | Endereço |
|-----------|----------|-----|
| **Site** | Firebase Hosting (projeto `mjrp-playlist-generator`) | `https://mjrp-playlist-generator.web.app` |
| **Servidor** | Cloud Run, serviço `mjrp-proxy`, região `southamerica-east1` | `https://mjrp-proxy-540062660076.southamerica-east1.run.app` (o site chega nele por `/api/**`, `firebase.json`) |
| **Banco** | Firestore | projeto `mjrp-playlist-generator` |

---

## 2. Publicar: um caminho só

Há um comando para o site e um para o servidor. Não existe outro caminho: os scripts antigos
(`scripts/deploy-prod.sh`, `scripts/deploy-backend.sh`) e o `cloudbuild.yaml` foram removidos, e a
automação do GitHub não publica nada.

```bash
npm run deploy:site              # publica o site
npm run deploy:server            # publica o servidor

npm run deploy:site:dry-run      # faz tudo, menos publicar e conferir a produção
npm run deploy:server:dry-run
```

Os dois publicam **a `main` local, como está commitada**: exportam uma cópia limpa dela
(`git archive`) para uma pasta temporária do sistema e trabalham lá. A pasta de trabalho nunca é
usada para o build, e nada é escrito nem apagado dentro do repositório. Podem ser chamados de
qualquer cópia do repositório (a pasta principal ou um worktree). A pasta temporária é removida no
fim; `--keep` (por exemplo `./scripts/deploy-site.sh --dry-run --keep`) a preserva para inspeção.

### 2.1 O que precisa existir na máquina

| O quê | Para quê | Como conferir |
|---|---|---|
| `.env` na pasta onde a `main` está aberta, com `VITE_SPOTIFY_CLIENT_ID` | O Vite lê o valor na hora do build; sem ele o Spotify quebra em produção. Só o site precisa. Outro arquivo pode ser indicado com `DEPLOY_ENV_FILE=<caminho>`. | o script recusa se o arquivo ou a variável faltar |
| Firebase CLI com login (`firebase login`) | publicar o site | `firebase login:list` |
| gcloud com login (`gcloud auth login`), com permissão de publicar no projeto | publicar o servidor | `gcloud auth list` |
| Node.js e npm; `git`; `curl` | exportar, instalar, testar, construir e conferir | — |

Não é preciso chave de conta de serviço. Se houver uma, ela é aceita no lugar do login:
`GOOGLE_APPLICATION_CREDENTIALS=<arquivo da chave>` (site e servidor; no servidor vale só para
aquela execução, o login guardado na máquina não muda) ou `FIREBASE_TOKEN` (site).

### 2.2 O que cada script faz, em ordem

Qualquer passo que falha interrompe tudo; nada é publicado.

| # | Site (`scripts/deploy-site.sh`) | Servidor (`scripts/deploy-server.sh`) |
|---|---|---|
| 1 | Recusa se a `main` tem mudança não commitada em arquivo versionado | o mesmo |
| 2 | Confere o `.env` e o login do Firebase | Confere o login do gcloud; lê e mostra a revisão que serve agora (o ponto de volta) |
| 3 | Exporta a `main` para a pasta temporária; `npm ci` | o mesmo |
| 4 | `npx vitest run`; um teste falhando interrompe | o mesmo |
| 5 | Copia o `.env` para a cópia limpa; `npx vite build` | Monta o contexto da imagem: `shared/` vira `server/_shared_temp` (com um `package.json` `{"type": "module"}`) e `config/` vira `server/config` |
| 6 | Copia o que o Vite não empacota: `public/js/firebase-config.js`, `public/css/`, `public/assets/`, `public/favicon.ico` | — |
| 7 | Confere o que construiu: o script principal que o `index.html` nomeia existe; o Client ID do Spotify está nos scripts; nenhum arquivo `.map`; todo arquivo local que o `index.html` aponta está em `dist/`; `css/` e `assets/` chegaram inteiros | Confere o contexto (`Dockerfile`, `index.js`, lockfile, `config/prompts.json`, sem `.env`) e **sobe o servidor localmente**, numa cópia arrumada como a imagem arruma, com as dependências do lockfile e sem segredo nenhum: `/_health` e `/api/musickit-status` respondem 200, `/api/debug/files` responde 404, os prompts e os módulos de `shared/` carregam. Nenhuma rota paga é chamada. |
| 8 | `firebase deploy --only hosting --project mjrp-playlist-generator` | `gcloud run deploy mjrp-proxy --source server --region southamerica-east1 --project mjrp-playlist-generator --allow-unauthenticated` |
| 9 | Confere a produção: o `index.html` no ar nomeia o script recém-construído, e esse endereço devolve um script (o Hosting responde 200 com a página do app para arquivo que não existe) | Confere a produção: a revisão nova recebe 100% do tráfego; `/api/musickit-status` responde 200 e `/api/debug/files` responde 404 |
| 10 | Mostra como voltar atrás | Mostra o comando para voltar à revisão anterior, com o nome dela |

Com `--dry-run`, os passos 8 e 9 não rodam; todo o resto roda de verdade.

### 2.3 Voltar atrás

**Site.** No console do Firebase, em Hosting, o histórico de versões guarda cada publicação:
escolher a anterior e «Rollback» (`https://console.firebase.google.com/project/mjrp-playlist-generator/hosting/sites`).
É imediato e não precisa de build.

**Servidor.** O script mostra, antes de publicar, a revisão que estava servindo, e ao fim o comando pronto:

```bash
gcloud run services update-traffic mjrp-proxy --to-revisions=<revisão anterior>=100 \
  --region southamerica-east1 --project mjrp-playlist-generator
```

Depois de voltar atrás o serviço fica preso àquela revisão: uma publicação nova cria a revisão mas
não recebe tráfego (o script acusa isso na conferência). Antes da próxima publicação, soltar:

```bash
gcloud run services update-traffic mjrp-proxy --to-latest \
  --region southamerica-east1 --project mjrp-playlist-generator
```

Se a revisão nova não sobe, o Cloud Run mantém a anterior servindo.

### 2.4 A imagem do servidor: uma receita

A imagem é construída pelo Cloud Build a partir de `server/Dockerfile`, por
`gcloud run deploy --source server`; é assim que a produção foi publicada (a imagem em uso vem do
repositório `cloud-run-source-deploy`). O `scripts/deploy-server.sh` é o único lugar que monta o
contexto que o `Dockerfile` espera. O `cloudbuild.yaml`, uma segunda receita que não copiava os
prompts nem marcava `shared/` como módulo ES, foi removido (UAT-22).

- **Node:** o `Dockerfile` parte de `node:26-slim`, a mesma versão maior usada para desenvolver e
  na automação de testes. O script avisa quando o Node da máquina e o da imagem diferem.
- **Variáveis e segredos:** o script não define nenhum; o serviço mantém os seus de uma revisão
  para a outra. Em 2026-11-19 o serviço tinha quatro, todos vindos do Secret Manager:

  | Variável no servidor | Segredo |
  |---|---|
  | `AI_API_KEY` | `AI_API_KEY` |
  | `APPLE_TEAM_ID` | `musickit-team-id` |
  | `APPLE_KEY_ID` | `musickit-key-id` |
  | `APPLE_MUSIC_PRIVATE_KEY` | `musickit-private-key` |

  Mudar uma variável ou um segredo é feito no serviço (`gcloud run services update`), não por este script.
- **Regras do Firestore:** nenhum dos dois scripts publica `firestore.rules`.

### 2.5 Automação do GitHub

`.github/workflows/ci.yml` roda a verificação de código (`npx eslint . --quiet`) e depois
`npx vitest run` em todo push e pull request, e mais nada: não publica. O repositório não tem
segredo de publicação, e um build feito lá sairia sem o Client ID do Spotify.

O lint (`npm run lint`, que é `npx eslint .`) **é uma trava** desde 2026-11-19 (F64, UAT-20): os
dois comandos de publicação rodam `npx eslint . --quiet` na cópia limpa, antes dos testes, e um
erro recusa a publicação («the code check (lint) found errors: nothing was deployed»). Avisos (23,
todos `no-unused-vars`) não recusam. Eram 22 erros; todos foram consertados.

**Não testado:** o arquivo foi reescrito na F64 e ainda não rodou no GitHub.

---

## 3. Environment Configuration

### Backend (`server/.env`)
```bash
AI_API_KEY=your-gemini-api-key    # Required
AI_ENDPOINT=...                    # Optional (defaults to Gemini)
AI_MODEL=...                       # Optional (defaults to gemini-1.5-flash)
PORT=3000                          # Optional
ALLOWED_ORIGIN=http://localhost:8000  # CORS
NODE_ENV=development|production
```

### Frontend (`.env` na raiz, lido pelo Vite na hora do build)
```bash
VITE_SPOTIFY_CLIENT_ID=...         # Client ID do app no painel do Spotify (valor público)
```
Sem essa variável a conexão com o Spotify quebra, no ambiente local e no build que vai para produção.

### Endereço local: um só
O app roda em **`http://127.0.0.1:5010`** e só nele (`vite.config.js`: porta fixa, `strictPort`).
O navegador guarda login, tokens e cache por origem, e o Spotify só aceita o IP de loopback como
retorno local; por isso `localhost` e `127.0.0.1` não se misturam. Uma página aberta em
`http://localhost:5010` é mandada pelo próprio app para `127.0.0.1` (`public/js/utils/localAddress.js`).

Cadastros que valem para esse endereço:

| Onde | O quê |
|---|---|
| Painel do Spotify, Redirect URIs | `http://127.0.0.1:5010/callback` |
| Firebase Authentication, Authorized domains | `127.0.0.1` |

### Frontend (`public/config.js`)

> **F65 (2026-11-19):** `public/config.js` was an empty stub and was removed. The Firebase web configuration is `public/js/firebase-config.js` (model: `public/js/firebase-config.example.js`), with the shape below.
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "mjrp-playlist-generator.firebaseapp.com",
  projectId: "mjrp-playlist-generator",
  // ...
};
```
