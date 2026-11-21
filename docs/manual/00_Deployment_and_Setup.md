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
| 8 | `firebase deploy --only hosting --project mjrp-playlist-generator` | `gcloud run deploy mjrp-proxy --source server --region southamerica-east1 --project mjrp-playlist-generator --allow-unauthenticated --max-instances 3` |
| 9 | Confere a produção: o `index.html` no ar nomeia o script recém-construído, e esse endereço devolve um script (o Hosting responde 200 com a página do app para arquivo que não existe) | Confere a produção: a revisão nova recebe 100% do tráfego; `/api/musickit-status` responde 200 e `/api/debug/files` responde 404 |
| 10 | Mostra como voltar atrás | Mostra o comando para voltar à revisão anterior, com o nome dela |

Com `--dry-run`, os passos 8 e 9 não rodam; todo o resto roda de verdade.

**No máximo 3 instâncias do servidor** (`MAX_INSTANCES` no `deploy-server.sh`, F78, REQ-18). O limite
por pessoa mora na memória de cada instância (`server/lib/rateLimit.js`), então o teto de verdade é o
limite vezes o número de instâncias: 60 chamadas pagas de IA por hora por pessoa vezes 3 dá 180 no
pior caso; com o padrão do Cloud Run (20, lido do serviço em 2026-11-20) dava 1.200. Uma instância
dá conta do uso de hoje (uma pessoa, 80 pedidos ao mesmo tempo por instância); as outras duas cobrem
a partida a frio e uma rajada de carga de álbuns. Para outro número numa publicação:
`MAX_INSTANCES=5 ./scripts/deploy-server.sh`. O `test/server/deployFixesMaxInstances.test.js` falha
se o comando de publicar deixar de fixar o número. A contagem sai da instância antes do app ser
público (proposta da F78, § 8 e § 10).

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

  A F75 (valor estimado do inventário) lê mais três, descritas em «2.4b O interruptor dos valores do Discogs»:

  | Variável no servidor | De onde vem | Para quê |
  |---|---|---|
  | `DISCOGS_TOKEN` | segredo `discogs-token` | o token da conta do Discogs; sem ele a fonte de valor fica desligada |
  | `DISCOGS_VALUES` | variável comum (opcional) | `off` desliga a fonte de valor; ausente, ou qualquer outro texto, não desliga |
  | `DISCOGS_VALUES_FOR` | variável comum (opcional) | os ids (uid do Firebase) das pessoas para quem a fonte fica ligada, separados por vírgula; ausente, vale para toda pessoa com conta |
  | `VALUE_CALLS_PER_HOUR` | variável comum (opcional) | quantas leituras de valor uma pessoa faz por hora (padrão 900) |

  Mudar uma variável ou um segredo é feito no serviço (`gcloud run services update`), não por este script.
- **Regras do Firestore:** nenhum dos dois scripts publica `firestore.rules`.

### 2.4b O interruptor dos valores do Discogs (F75)

O valor estimado do inventário é lido do Discogs pelo servidor, com o token da conta do MJRP. A fonte está **ligada** só quando `DISCOGS_TOKEN` existe no serviço **e** `DISCOGS_VALUES` não é `off`. Ligar e desligar é mudar uma variável do serviço: cada comando abaixo cria uma revisão nova em cerca de um minuto, **sem publicar código**. O app pergunta ao servidor quando o inventário abre; quem está com o inventário aberto vê a mudança ao abri-lo de novo.

**Ligar pela primeira vez** (o código tem de estar publicado antes: `npm run deploy:server`):

```bash
gcloud run services update mjrp-proxy \
  --update-secrets DISCOGS_TOKEN=discogs-token:latest \
  --region southamerica-east1 --project mjrp-playlist-generator
```

Se a revisão não subir por falta de permissão de leitura do segredo, dar à conta de serviço do `mjrp-proxy` o papel de leitura só desse segredo e repetir o comando acima:

```bash
gcloud secrets add-iam-policy-binding discogs-token \
  --member "serviceAccount:<conta de serviço do mjrp-proxy>" \
  --role roles/secretmanager.secretAccessor --project mjrp-playlist-generator
```

**Desligar** (o app deixa de mostrar botão, valor e aviso do Discogs; o valor escrito à mão, os totais, a moeda, a ordem e os links de compra seguem):

```bash
gcloud run services update mjrp-proxy --update-env-vars DISCOGS_VALUES=off \
  --region southamerica-east1 --project mjrp-playlist-generator
```

**Ligar de novo:**

```bash
gcloud run services update mjrp-proxy --remove-env-vars DISCOGS_VALUES \
  --region southamerica-east1 --project mjrp-playlist-generator
```

**Deixar ligada só para uma pessoa** (recomendado: os termos de uso da API do Discogs dão o preço para uso pessoal; sem isto, toda pessoa com conta no app vê preços lidos com o token do MJRP):

```bash
gcloud run services update mjrp-proxy --update-env-vars DISCOGS_VALUES_FOR=<uid do Firebase> \
  --region southamerica-east1 --project mjrp-playlist-generator
```

**Conferir:** `GET https://<site>/api/value-sources`, com o login de uma pessoa com conta, responde `{ "data": { "discogs": "on" }, "outcome": "found" }` ou `"off"`. O token nunca aparece em resposta nem em linha de log; a linha de log de cada leitura é `album_value`, com a resposta e o tempo.

**Trocar o token:** gravar uma versão nova do segredo `discogs-token` e rodar de novo o comando de «Ligar pela primeira vez» (`:latest` é resolvido quando a revisão sobe).

### 2.4c A medição do uso (F77)

O site mede o que as pessoas fazem (a lista está em `shared/usageEvents.js`; o que é e o que nunca é medido, no `docs/specs/behavior.md`, «Medição do uso»). A medição está **ligada** só quando o build recebe `VITE_POSTHOG_KEY` **e** nada a desliga. Sem a chave, o site funciona igual, não baixa a biblioteca do PostHog e não pede nada a nenhum host de medição.

**Ligar pela primeira vez** (uma vez, pelo MJRP):
1. Criar a conta e um projeto no PostHog, na nuvem da Europa (`https://eu.posthog.com`).
2. Em Settings > Project > Privacy, conferir que «IP data capture configuration» está desligado (na Europa já nasce assim).
3. Copiar a chave do projeto (Project API key, começa com `phc_`; é pública, só permite mandar eventos) para o `.env` da pasta onde a `main` está: `VITE_POSTHOG_KEY=<a chave>`. Para a nuvem dos EUA, também `VITE_POSTHOG_HOST=https://us.i.posthog.com`.
4. `npm run deploy:site`. O script diz «measurement of use: ON (the PostHog project key is in the built scripts)», ou recusa publicar se a chave não chegou ao build.
5. Abrir o site, usar algumas telas e ver em Activity, no PostHog, os eventos (`screen_viewed`, …) chegarem.

**Desligar:**
- **Num navegador, sem build:** no console do site, `localStorage.setItem('mjrp.usage', 'off')` e recarregar. Para voltar: `localStorage.removeItem('mjrp.usage')`.
- **Para todos:** `VITE_USAGE_MEASUREMENT=off` no `.env` (ou apagar `VITE_POSTHOG_KEY`) e `npm run deploy:site`. O script diz «measurement of use: OFF».

**Ver o que seria medido, sem mandar nada:** `localStorage.setItem('mjrp.usage', 'debug')`, recarregar, usar o site e ler `window.__usageEvents` no console. Funciona com ou sem chave, local ou em produção.

**Um host próprio** (proxy reverso do PostHog) exige acrescentar o host ao `connect-src` do CSP em `public/index.html`; hoje só as duas nuvens estão liberadas.

### 2.4d A página de entrada e as capas dela (F80)

A raiz do site (`/`) é a página de entrada para quem não entrou com conta; quem entrou vai direto a `/start` (F85; o logotipo do app leva à página por `/?entry`), e todo outro endereço é o app. No `dist/`, a página é `index.html` e o app é `app.html` (o `deploy-site.sh` confere os dois; o `firebase.json` reescreve tudo, menos `/api/**` e os arquivos, para `/app.html`).

**As capas.** O build escolhe o conjunto pela variável `VITE_SPLASH_COVERS` do `.env`:
- sem ela (o padrão), ou com qualquer valor que não seja `real`: as **capas fictícias** (arte original, «Fictional albums · original art»);
- `VITE_SPLASH_COVERS=real`: as **capas reais** do protótipo aprovado, vindas do CDN da Apple, com crédito, «Listen on Apple Music» e a linha de marcas da Apple. **Só com a decisão do MJRP** sobre os termos da Apple (DPLA 3.3.6(D), App Review 4.5.2(ii)).

Para ver a página localmente: `npx vite` e abrir `http://127.0.0.1:5010/` (sem conta) ou `http://127.0.0.1:5010/?entry` (com conta, a página aparece mesmo assim). Para ver o build como em produção: `npx vite build` e `npx vite preview`.

### 2.5 Automação do GitHub

`.github/workflows/ci.yml` roda a verificação de código (`npx eslint . --quiet`) e depois
`npx vitest run` em todo push e pull request, e mais nada: não publica. O repositório não tem
segredo de publicação, e um build feito lá sairia sem o Client ID do Spotify.

O lint (`npm run lint`, que é `npx eslint .`) **é uma trava** desde 2026-11-19 (F64, UAT-20): os
dois comandos de publicação rodam `npx eslint . --quiet` na cópia limpa, antes dos testes, e um
erro recusa a publicação («the code check (lint) found errors: nothing was deployed»). Avisos (23,
todos `no-unused-vars`) não recusam. Eram 22 erros; todos foram consertados.

**Não testado:** o arquivo foi reescrito na F64 e ainda não rodou no GitHub.

### 2.6 O app para iPhone e Android (F78, esqueleto)

O app mora em `app/` (Expo SDK 58, React Native 0.88.1, TypeScript; ADR-0022) e é um espaço de
trabalho da raiz: o `npm install` (ou `npm ci`) da raiz instala também o que o app usa, e nada vai
para `app/node_modules` (um React só, pelo `overrides` da raiz). Nada do app é publicado ainda.

**As checagens, sem simulador** (o que esta máquina prova hoje):

| Comando | O que faz |
|---|---|
| `npm run app:check` (na raiz) | tudo abaixo, em ordem; para no primeiro erro |
| `npm run typecheck --workspace app` | o compilador do TypeScript, estrito |
| `npm run lint --workspace app` | o ESLint do Expo, com zero avisos; recusa importar `public/` ou `server/` e um pacote nativo fora da sua ligação |
| `npm run test --workspace app` | os testes do app (Jest): portas, telas e o autoteste do corpo dourado («3343 of 3343 match»), uns 15 s |
| `npm run bundle:ios --workspace app`, `bundle:android` | o `expo export`: o JavaScript do app empacotado pelo Metro em bytecode Hermes, em `app/dist/` (fora do git) |
| `npm run app:scan-bundles` (na raiz) | procura nos pacotes os nomes dos segredos do servidor e formas de chave; falha se achar |

A suíte da raiz (`npx vitest run`) roda os sensores do app: `appAndSiteApart` e
`noSecretsInTheApp` (este também lê os pacotes de `app/dist/` quando existem).

**O modo de demonstração.** Sem configuração, o app abre com uma conta falsa e três séries de
exemplo, em memória: nada sai do aparelho. O Firebase de verdade só com
`EXPO_PUBLIC_DATA_MODE=firebase` (e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; a medição, com
`EXPO_PUBLIC_POSTHOG_KEY`), e isso ainda não foi provado: precisa do build nativo e do registro do
app no Firebase. Nenhum agente entra no projeto Firebase de produção nem grava nele.

**O app no simulador do iPhone (modo de demonstração).** Provado em 2026-11-20 no «iPhone 17 Pro»
com iOS 26.5 (relatório `reports/evidence/F78/2026-11-20-first-simulator-run.md`).

O que precisa no Mac, uma vez:

| O quê | Como | Nota |
|---|---|---|
| Xcode, licença aceita, um runtime de simulador do iOS | App Store; `sudo xcodebuild -license accept`; `xcodebuild -downloadPlatform iOS` | os dois comandos são do MJRP (`sudo`) |
| CocoaPods | `brew install cocoapods` | sem `sudo`; 1.17.0 em 2026-11-20 |
| As dependências do repositório | `npm ci` na raiz | o app é espaço de trabalho da raiz |

Não precisa: Watchman, conta da Apple, `GoogleService-Info.plist`, Android Studio. O `xcode-select`
pode continuar nas Command Line Tools: o script usa o Xcode só no próprio processo
(`DEVELOPER_DIR`). Para as ferramentas que exigem o `xcode-select` no Xcode (a de controle do
simulador do Claude Code), o MJRP roda `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.

O comando, na raiz:

```
npm run app:ios:demo                          # no «iPhone 17 Pro»
APP_IOS_DEVICE="iPhone 17" npm run app:ios:demo
```

`scripts/app-ios-demo.sh`: gera `app/ios` (`expo prebuild`, com `--no-clean` quando a pasta já é de demonstração: no SDK 58 o padrão é apagar e refazer tudo; a pasta não é commitada), instala os
pods, constrói `Debug` para o simulador com o `xcodebuild` (o primeiro build leva uns 10 min de pods
e 6 min de compilação; os seguintes, bem menos), liga o simulador, instala e abre o app, e deixa o
Metro rodando no terminal (o app em `Debug` lê o JavaScript dele; Ctrl+C para). Não usa
`npx expo run:ios` porque, nesta máquina, ele para em `xcrun devicectl` antes de construir.

O build de demonstração deixa fora os pacotes nativos do Firebase, do Google Sign-In e do Sign in
with Apple (`app/nativeBuild.js`, `app/app.config.js`, `app/react-native.config.js`); o build com
Firebase é `EXPO_PUBLIC_DATA_MODE=firebase` e ainda não foi gerado nem provado.

Abrir telas sem tocar (só no modo de demonstração), com o app já instalado:

```
xcrun simctl launch booted com.mjrp.albumblender -demoSignIn apple                                  # entra e abre Albums
xcrun simctl launch booted com.mjrp.albumblender -demoSignIn apple -demoRoute /blend                # uma aba
xcrun simctl launch booted com.mjrp.albumblender -demoSignIn apple -demoRoute "/diagnostics?run=1"  # o autoteste, rodando
xcrun simctl io booted screenshot tela.png
```

(Fechar o app antes: `xcrun simctl terminate booted com.mjrp.albumblender`.) Os links
`albumblender://diagnostics?run=1` e `albumblender://sign-in?as=apple` também existem, mas pelo
`simctl openurl` o iOS pergunta «Abrir com…» e só um toque responde.

**O autoteste.** Na tela: toque longo no título «Albums». Ou pelo argumento acima. Ele mostra
«N of N match» e escreve duas linhas que começam por `[golden-self-test]` (a contagem; o motor e
um id de amostra), lidas no terminal do Metro ou no log do simulador:

```
xcrun simctl spawn booted log stream --predicate 'process == "AlbumBlender"' | grep golden-self-test
```

Em 2026-11-20: `3343 of 3343 match`, `engine: Hermes`, ids v4, ~81 s no build `Debug`.

O iPhone de verdade e o login com a Apple pedem ainda a conta de desenvolvedor da Apple e o app
registrado no Firebase; o Android, o Android Studio com um emulador.

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
DISCOGS_TOKEN=...                  # Optional: o token da conta do Discogs; sem ele os valores do Discogs ficam desligados (F75)
DISCOGS_VALUES=off                 # Optional: desliga os valores do Discogs mesmo com o token
DISCOGS_VALUES_FOR=uid1,uid2       # Optional: só essas pessoas têm os valores do Discogs
```

### Frontend (`.env` na raiz, lido pelo Vite na hora do build)
```bash
VITE_SPOTIFY_CLIENT_ID=...         # Client ID do app no painel do Spotify (valor público)
VITE_POSTHOG_KEY=...               # Optional: a chave do projeto do PostHog (valor público); sem ela, nada é medido
VITE_POSTHOG_HOST=...              # Optional: o host de ingestão; vazio = https://eu.i.posthog.com (EUA: https://us.i.posthog.com)
VITE_USAGE_MEASUREMENT=off         # Optional: constrói um site que não mede nada, mesmo com a chave
VITE_SPLASH_COVERS=real            # Optional: as capas reais na página de entrada (F80); vazio = as fictícias. Só com a palavra do MJRP
```
Sem `VITE_SPOTIFY_CLIENT_ID` a conexão com o Spotify quebra, no ambiente local e no build que vai para produção. As três da medição estão na seção 2.4c.

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
