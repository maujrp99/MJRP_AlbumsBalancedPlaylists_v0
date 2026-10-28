# Architecture: MJRP_AlbumsBalancedPlaylists_v0 (Album Blender v0)

> Escrito em 2026-10-28 (conform do harness) **do que o código é hoje**, não do ideal, e corrigido no mesmo dia depois da crítica independente (`reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md`). Fontes: o manual do v0 (`docs/manual/01_System_Architecture.md` §1, §3, §5; `02`–`04`; `00_Deployment_and_Setup.md` §1–3), o mapa do código feito pelo V1 (`MJRPalbumblender-v1/reports/audits/2026-10-27-mjrpalbumblender-v1-project-bootstrap-report.md`, usado só para localizar) e a leitura direta do código, cujas linhas estão citadas. Onde o manual e o código discordam, vale o código.
> **Regras e código.** Este arquivo diz o que o código faz. Onde o código descumpre uma regra aprovada (constituição, `PRINCIPLES.md`, ADR), o texto traz a regra e, ao lado, **"Conserto:"** com o achado do relatório de auditoria que o registra; a regra continua valendo, e o código é que deve mudar. Não é uma lista de problemas (Art. III da constituição): é o ponteiro que impede ler a regra como se estivesse cumprida.
> Estado: **Draft** até o MJRP aprovar.

## System Overview
O Album Blender v0 monta playlists balanceadas a partir de **séries** de álbuns: o usuário cria uma série (artista ou lista curada), o app descobre os álbuns no Apple Music, busca a aclamação de cada faixa e o **Blending Menu** gera a playlist por uma **Recipe** (algoritmo de curadoria: `mjrp-balanced-cascade`, `top-n-popular`, `top-n-acclaimed`, `top-n-user`, registro em `public/js/algorithms/index.js:24-30`). A playlist pode ser editada, salva e exportada para o Spotify ou o Apple Music. Está **em produção**.

A forma é de **duas metades**: uma SPA em JavaScript puro, que roda no navegador, guarda o estado e fala direto com o Firestore, o Spotify e o Apple MusicKit; e um servidor Node/Express pequeno, no Cloud Run, que existe para o que o navegador não pode fazer: raspar o BestEverAlbums, chamar o Gemini com a chave guardada, e assinar o token de desenvolvedor do Apple MusicKit. **O servidor não acessa o Firestore** (nenhum import de Firebase em `server/`). Como não há servidor entre o navegador e o banco, **as regras do Firestore (`firestore.rules`) são a única autorização dos dados**.

## Component Map
Os nomes da coluna *Stack layer* são as camadas de `docs/specs/tech-stack.md`.

### Navegador (`public/`)
| Component | Responsibility | Stack layer |
|-----------|---------------|-------------|
| Casca da SPA e roteador (`public/index.html`, `js/app.js`, `js/router.js`) | arranque, as **18** rotas registradas por History API (`app.js:113-171`, 18 chamadas `router.register`), CSP e carga do Tailwind | Front |
| Views (`js/views/`) | desenham uma tela; assinam stores e delegam a ação ao controller | Front |
| Controllers (`js/controllers/`) | o "cérebro" de uma tela: recebe a entrada, chama Services, atualiza a store. Hoje `PlaylistsController.js:92-93, 312, 325, 334` instancia repositórios, e `SeriesController.js:22` e `BlendingController.js:22` usam `userRankingRepository` direto | Front |
| Componentes e renderizadores (`js/components/`, `js/views/renderers/`) | blocos de UI reutilizáveis (cartões, modais, assistente de Blend, navegação) | Front |
| Stores (`js/stores/`) | guardam o estado em memória e avisam quem assinou (Observer). **Regra: só estado** (ADR-0017). Hoje só `albumSeries.js` e `playlists.js` cumprem; `inventory.js`, `albums.js`, `SpotifyEnrichmentStore.js` e `UserStore.js` fazem I/O (repositório, cache, SDK do Firestore ou login). Conserto: achado 5 da auditoria | Front |
| Services (`js/services/`) | lógica de negócio e orquestração: séries, playlists, geração, persistência, exportação Spotify, autenticação, busca de álbuns (`services/album-search/`), MusicKit (`services/musickit/`), `services/infra/StorageService.js` (localStorage), `services/playlists/PlaylistHistoryService.js` (desfazer/refazer), `services/auth/UserSyncService.js` (migração de usuário) | Front |
| Algoritmos e ranking (`js/algorithms/`, `js/ranking/`, `js/transformers/`) | as Recipes de geração e as estratégias de ranking (Strategy). Não importam Firebase, DOM nem `localStorage` | Front |
| Repositories (`js/repositories/`) | **o adaptador declarado do Firestore**: um por fonte de dados, sobre `BaseRepository` (`repositories/BaseRepository.js`). Hoje o SDK do Firestore também é importado fora daqui (ver *Data Flow*) | Dados |
| Cache (`js/cache/`) | L1 memória + L2 IndexedDB `mjrp-cache` (`cache/CacheManager.js`) | Dados |
| Clientes externos (`js/api/client.js`, `services/SpotifyAuthService.js`, `services/musickit/`) | falam com `/api/*` (por `fetch`), com o Spotify (OAuth PKCE) e com o Apple MusicKit | Integrações externas |
| Worker de busca (`js/workers/search.worker.js`) | busca de autocompletar fora da thread principal, sobre `albums-autocomplete.json` | Front |

### Compartilhado (`shared/`)
| Component | Responsibility | Stack layer |
|-----------|---------------|-------------|
| Curadoria (`shared/curation.js`) | as regras de curadoria de playlist, executáveis nos dois lados | Linguagem |
| Normalização (`shared/normalize.js`) | limpeza de texto de título/artista | Linguagem |
| Autenticação de usuário (`shared/services/AuthService.js`) | login Google/Apple e saída, sobre `firebase/auth`; **só o navegador o usa** (`stores/UserStore.js` o importa por `@shared/`); o servidor não. Existe também outro `AuthService` em `public/js/services/AuthService.js` (login anônimo) | Dados |

### Servidor (`server/`, Cloud Run)
| Component | Responsibility | Stack layer |
|-----------|---------------|-------------|
| Entrada (`server/index.js`) | Express, CORS por `ALLOWED_ORIGIN`, saúde em `/_health` (`:87`), monta as rotas sob `/api` | Back |
| Rotas finas (`server/routes/`: `albums`, `playlists`, `ai`, `musickit`, `debug`) | recebem a requisição e chamam Services (`POST /api/enrich-album`, `/generate`, `/playlists`, `/ai/studio-albums`, `GET /musickit-token`, rotas de depuração) | Back |
| Services (`server/lib/services/`: `EnrichmentService`, `GenerationService`, `spotifyPopularity`) | a lógica de enriquecer e gerar | Back |
| Fachada de ranking (`server/lib/fetchRanking.js`, `lib/ranking.js`) | esconde raspagem + IA + fallbacks; consolida por Borda Count | Back |
| Raspador (`server/lib/scrapers/besteveralbums.js`) | lê as notas de faixa do BestEverAlbums | Back |
| Cliente de IA (`server/lib/aiClient.js`, `lib/prompts.js`, `config/prompts.json`) | chama o Gemini com prompts externalizados | Integrações externas |
| Validação (`server/lib/schema.js`, `server/schema/album.schema.json`) | valida o álbum com AJV | Back |
| Token do MusicKit (`server/services/MusicKitTokenService.js`) | assina o token de desenvolvedor (JWT ES256) | Integrações externas |

## Stack
As tecnologias, as versões e as decisões por trás delas moram em `docs/specs/tech-stack.md` - este arquivo aponta para lá, não as lista.

## Data Flow
```
Navegador (SPA)
  View -> Controller -> Service -> Repository --> Firestore   (direto; o servidor não participa)
                          |  \--> Store (estado; avisa as Views)
                          |  \--> Cache L1 memória / L2 IndexedDB / localStorage
                          +--> api/client.js --/api/*--> Firebase Hosting (rewrite) --> Cloud Run (server)
                          |                                     Rotas -> Services -> BestEverAlbums (raspa) / Gemini (REST)
                          +--> Spotify Web API (OAuth PKCE, token no localStorage)
                          +--> Apple MusicKit JS (token de desenvolvedor vem de /api/musickit-token)
```
O desenho acima é a **direção-alvo**; o que o código faz hoje está logo abaixo, em *Direção das dependências e fronteira do Firestore*.

1. **Criar a série.** Home -> "Scan Artist" no Apple Music -> montagem -> grava no Firestore só a lista de pedidos `albumQueries`, não os álbuns (Apêndice B §2 do mapa do V1).
2. **Carregar e enriquecer.** O cliente resolve cada pedido no Apple Music e pede `POST /api/enrich-album`; o servidor raspa o BestEverAlbums e devolve o ranking das faixas. A cascata completa só roda em `/generate`, o fallback legado: BestEverAlbums primeiro; o Spotify entra se o BestEverAlbums achar menos de 3 faixas com nota **e** menos de 40% das faixas conhecidas (`server/lib/fetchRanking.js:162-169`; o comentário do código diz "previously 50%"); depois o Gemini; depois Borda Count. O Spotify também enriquece pelo cliente, com cache global em `spotify_enrichment`.
3. **Gerar.** O assistente do Blending Menu (série -> Recipe -> ingredientes -> "Blend It!") roda a Recipe no navegador; o estado fica nas stores, o rascunho em `localStorage`.
4. **Salvar e exportar.** A playlist vai para o Firestore em `artifacts/mjrp-albums/users/{uid}/curator/data/series/{seriesId}/playlists` (`mjrp-albums` é um segmento de caminho fixo no código, não o projeto Firebase); a exportação para Spotify ou Apple Music sai do cliente.
5. **Identidade.** Firebase Auth com login anônimo automático para qualquer visitante (`public/js/services/AuthService.js:58`); os dados do usuário ficam sob o `uid`. O login com Google/Apple (`shared/services/AuthService.js:22`, `signInWithPopup`) troca de `uid`; os dados da sessão anônima ficam no `uid` antigo.
6. **Quando uma leitura do servidor falha.** O servidor responde **200 com resultado vazio**, não um erro: se o raspador falha, `/enrich-album` devolve `bestEverInfo: null` e notas nulas, igual ao álbum sem nota (`server/lib/services/EnrichmentService.js:27-33, 99-104`); `/ai/studio-albums` devolve `{ albums: [], error }` com 200 (`server/routes/ai.js:62-66`); sem `prompts.json`, `loadPrompts()` devolve `{}` com um aviso no log (`server/lib/prompts.js:6-22`). O cliente não distingue "sem dado" de "fonte fora do ar". Regra: sem falha silenciosa (`PRINCIPLES.md` §I.8). Conserto: achado 7 da auditoria.

### Direção das dependências e fronteira do Firestore
**Regras:** as dependências apontam para dentro, e o adaptador do Firestore é o Repository (`PRINCIPLES.md` §I.3; constituição, *Padrões com endereço*); a regra de negócio nasce como Service (ADR-0016); a Store só guarda estado e o Service a atualiza pelos setters (ADR-0017); trocar a fonte de dados é mexer num arquivo.

**O que o código faz hoje:**
- O núcleo está limpo: `algorithms/`, `models/`, `ranking/`, `transformers/` e `shared/curation.js` não importam Firebase, DOM nem `localStorage`.
- O SDK do Firestore é importado **fora de `repositories/`**: `public/js/services/PlaylistsService.js:17` (`writeBatch`, usado em `:243`), `public/js/stores/albums.js:9` (`getDocs`/`setDoc`/`addDoc` em `:273, 312, 315`) e `public/js/views/SaveAllView.js:5-6` (que carrega o SDK Firestore e Auth **11.6.1 pelo CDN `gstatic`**, enquanto o app usa o pacote npm 10.14.1: duas versões do SDK no mesmo app). Trocar a fonte de dados mexe em `BaseRepository`, nos 6 repositórios, nesses 3 arquivos, em `MigrationUtility` e em `firebase-init.js`, não em um. Viola `PRINCIPLES.md` §I.3 e a ADR-0017. Conserto: achado 1 da auditoria.
- O caminho "View -> Controller -> Service -> Repository" não vale sem exceção: `PlaylistsController` e `SeriesController` falam com `Repository` sem passar por Service; `views/SeriesView.js:16, 68` importa o `db` e o passa ao controller; `components/TopNav.js:8` e `stores/inventory.js:7` importam o `db` de `app.js` (que importa todas as Views, o que cria um ciclo `app.js <-> stores/inventory.js`). Viola `PRINCIPLES.md` §I.3 e a ADR-0016. Conserto: achado 4.

## Infrastructure
- Hosting: o **frontend** em Firebase Hosting, servindo `dist` (build do Vite); `firebase.json` reescreve `/api/**` para o serviço Cloud Run `mjrp-proxy` (região `southamerica-east1`) e o resto para `/index.html` (`firebase.json:3-20`). O **backend** em Cloud Run (`mjrp-proxy`, contêiner `node:18-slim`, `server/Dockerfile`), acesso público (`cloudbuild.yaml`: `--allow-unauthenticated`).
- Database: **Firestore** do projeto Firebase **`mjrp-playlist-generator`**. O app o recebe de `public/js/firebase-config.js:3-10` (`window.__firebase_config`), carregado por `public/index.html:111` antes do `app.js` (`:112`); `.firebaserc`, `scripts/deploy-backend.sh` (`PROJECT_ID`) e o CORS padrão do servidor (`server/index.js:58`) apontam para o mesmo projeto. O bloco `mjrp-albums` de `public/js/firebase-init.js:6-13` é só o valor reserva, com chave de marcador (`API_KEY_PLACEHOLDER`): não funciona. `mjrp-albums` também é o `appId` fixo no caminho `artifacts/mjrp-albums/...` (`InventoryRepository.js:20`, `SeriesRepository.js:21`), uma constante de caminho. No navegador, IndexedDB `mjrp-cache` e `localStorage`. O backend não tem banco.
- **Quem pode ler e escrever o quê no Firestore** (`firestore.rules`, lido linha a linha; "autenticado" vale para qualquer visitante, porque o app faz login anônimo sozinho):

| Caminho | Quem lê e escreve (regra) | Quem escreve no código |
|---|---|---|
| `artifacts/{appId}/users/{uid}/curator/**` e `.../inventory/**` (`:8-13`) | só o dono (`uid`) | repositórios e `PlaylistsService.saveBatch` |
| `users/{uid}/series/**` (`:19-28`) | só o dono | ninguém além da migração legada |
| `users/{uid}/albumRankings/{albumId}` (`:32-35`) | **qualquer pessoa, até sem login** (`allow read, write: if true`; o comentário das linhas 33-34 diz "DEBUG ... mudar para `request.auth != null` antes do lançamento") | `UserRankingRepository` |
| `albums/{albumId}` (`:42-43`) | **qualquer autenticado**, inclusive anônimo, em qualquer documento; sem dono | `stores/albums.js` |
| `spotify_enrichment/{albumKey}` (`:49-51`) | **qualquer autenticado**, inclusive anônimo; cache global sem dono | `SpotifyEnrichmentRepository` |

Regra: a estabilidade da produção e os dados do usuário não ficam abertos a qualquer visitante (constituição, Art. V). Conserto: achado 2 da auditoria. **Nenhum pipeline do repositório publica `firestore.rules`**: `firebase.json` não tem bloco `firestore`, e `.github/workflows/ci-firebase.yml:73, 120` e `scripts/deploy-prod.sh` implantam só `--only hosting`; o que está em produção pode não ser este arquivo.
- Segredos: no Secret Manager do Google Cloud, injetados no Cloud Run (`AI_API_KEY`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_MUSIC_PRIVATE_KEY`; `cloudbuild.yaml`, `--set-secrets`); em desenvolvimento, `server/.env`.
- Implantação do **frontend**: GitHub Actions (`.github/workflows/ci-firebase.yml`: lint, testes e build, depois `firebase deploy --only hosting` em `main`, `v0.2` e tags `v*`; canal de pré-visualização em PR) ou `scripts/deploy-prod.sh` (que também copia `firebase-config.js` para `dist/js/`).
- Implantação do **backend**: existem **duas receitas que divergem**, e o repositório não diz qual gerou a produção atual. `cloudbuild.yaml` copia `shared/` para `server/_shared_temp` e constrói a imagem, mas **não copia `config/`** (o servidor procura `prompts.json` em `server/config/` ou em `<raiz>/config/`, `server/lib/prompts.js:4-5`) e **não grava o `package.json` com `"type": "module"`** em `_shared_temp`, de que o `import()` dinâmico de `shared/*.js` precisa (`server/routes/playlists.js:23`, `server/lib/ranking.js:8`, `server/lib/fetchRanking.js:13`). `scripts/deploy-backend.sh` faz as duas coisas (`:27-33`) e usa `gcloud run deploy --source server`. A CI não implanta o backend. Regra: uma fonte da verdade (`PRINCIPLES.md` §I.5). Conserto: achado 12.
- CDN/Assets: Tailwind pelo CDN `cdn.tailwindcss.com`, com `tailwind.config` inline em `public/index.html:23`, e fonte Syne pelo Google Fonts (`:12, 15-17`); o SDK do Apple MusicKit vem de `js-cdn.music.apple.com` (`services/musickit/MusicKitAuth.js:124`); o conjunto de álbuns do autocompletar é o arquivo estático `albums-autocomplete.json`.

## Constraints
- **Segurança e abuso.**
  - Segredos por variável de ambiente e Secret Manager, nunca no código (Constituição Art. V; `PRINCIPLES.md` §I.14). A chave do Gemini e a chave privada da Apple ficam só no servidor: por isso o servidor existe.
  - O acesso aos dados do usuário é o da tabela da seção *Infrastructure*, não "escopo por dono em tudo".
  - O backend é público: sem autenticação e sem limite de taxa em nenhuma rota; em produção o CORS aceita as origens de `ALLOWED_ORIGIN` (padrão `https://mjrp-playlist-generator.web.app`, `server/index.js:58-70`) **e** qualquer requisição sem cabeçalho `Origin` (`:66`). As rotas de depuração (`/api/debug/*`, `/api/list-models`) são montadas em qualquer ambiente (`server/index.js:134-136`); `GET /api/debug/files` lista qualquer pasta do contêiner por `?path=` (`server/routes/debug.js:98-104`). `POST /api/ai/studio-albums` concatena o `artistName` livre no prompt e chama o Gemini pago com a busca do Google ligada (`server/routes/ai.js:7-27`, `server/lib/aiClient.js:32`). Regra: estabilidade da produção (Art. V). Conserto: achados 9 e 10 da auditoria.
  - Tokens do Spotify (acesso e renovação) ficam no `localStorage` (`services/SpotifyAuthService.js:179-182`), com um CSP que libera script inline (`public/index.html:9`).
- **Dependências entre camadas.** A Dependency Rule e a fronteira do Firestore são as da seção *Direção das dependências*, com as exceções descritas ali. Rota e componente são orquestradores finos (ADR-0016).
- **Compartilhamento.** A lógica que roda nos dois lados mora em `/shared` (Constituição, *Technology Standards*); o contêiner a recebe copiada, por isso o `Dockerfile` espera `_shared_temp`. Em `shared/`, só `curation.js` e `normalize.js` são usados também pelo servidor; `shared/services/AuthService.js` é do navegador.
- **Estado do servidor.** Contêiner sem estado e escalável (Constituição, *Backend*).
- **Validação.** Regra: todo dado externo que entra no servidor é validado com AJV (Constituição, *Backend*).
- **Tempo.** O raspador tem prazo de 30 s por requisição (`server/lib/scrapers/besteveralbums.js:8-9`), sem retentativa nem cache; o Gemini, 60 s (`server/lib/aiClient.js:10`). O cliente refaz a chamada 2 vezes, com espera fixa de 1 s (`public/js/api/client.js:21-23`), inclusive `/generate`, que chama o Gemini.
- **Runtime.** Node.js 18 no contêiner e na CI (`server/Dockerfile:1`; `ci-firebase.yml:22, 55`), versão fora de suporte desde abril de 2025.
- **Desempenho e escala.** TBD: o v0 não declara alvo de latência nem de carga; é decisão de produto do MJRP, não do agente. O custo por chamada paga (Gemini, Firestore) também não está estimado.
