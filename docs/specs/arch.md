# Architecture: MJRP_AlbumsBalancedPlaylists_v0 (Album Blender v0)

> Escrito em 2026-10-28 (conform do harness) **do que o código é hoje**, não do ideal. Fontes: o manual do v0 (`docs/manual/01_System_Architecture.md` §1, §3, §5; `02`–`04`; `00_Deployment_and_Setup.md` §1–3), o mapa do código feito pelo V1 (`MJRPalbumblender-v1/reports/audits/2026-10-27-mjrpalbumblender-v1-project-bootstrap-report.md`, §2 e Apêndices E, F, G, I; achados lidos, nada executado) e as ADRs em `docs/decisions/`. Os arquivos e linhas citados são do v0. Onde o manual e o código discordam, vale o código.
> Estado: **Draft** até o MJRP e a crítica de arquitetura lerem.

## System Overview
O Album Blender v0 monta playlists balanceadas a partir de **séries** de álbuns: o usuário cria uma série (artista ou lista curada), o app descobre os álbuns no Apple Music, busca a aclamação de cada faixa e o **Blending Menu** gera a playlist por uma **Recipe** (algoritmo de curadoria: `mjrp-balanced-cascade`, `top-n-popular`, `top-n-acclaimed`, `top-n-user`, registro em `public/js/algorithms/index.js:24-30`). A playlist pode ser editada, salva e exportada para o Spotify ou o Apple Music. Está **em produção**.

A forma é de **duas metades**: uma SPA em JavaScript puro, que roda no navegador, guarda o estado e fala direto com o Firestore, o Spotify e o Apple MusicKit; e um servidor Node/Express pequeno, no Cloud Run, que existe para o que o navegador não pode fazer: raspar o BestEverAlbums, chamar o Gemini com a chave guardada, e assinar o token de desenvolvedor do Apple MusicKit. **O servidor não acessa o Firestore** (Apêndice F §2/§7: busca por `firebase`/`firestore` em `server/` sem resultado).

## Component Map
Os nomes da coluna *Stack layer* são as camadas de `docs/specs/tech-stack.md`.

### Navegador (`public/`)
| Component | Responsibility | Stack layer |
|-----------|---------------|-------------|
| Casca da SPA e roteador (`public/index.html`, `js/app.js`, `js/router.js`) | arranque, as 17 rotas por History API (`app.js:113-171`), CSP e carga do Tailwind | Front |
| Views (`js/views/`) | desenham uma tela; assinam stores e delegam a ação ao controller | Front |
| Controllers (`js/controllers/`) | o "cérebro" de uma tela: recebe a entrada, chama Services, atualiza a store | Front |
| Componentes e renderizadores (`js/components/`, `js/views/renderers/`) | blocos de UI reutilizáveis (cartões, modais, assistente de Blend, navegação) | Front |
| Stores (`js/stores/`) | guardam o estado em memória e avisam quem assinou (Observer); alvo: só estado (ADR-0017) | Front |
| Services (`js/services/`) | lógica de negócio e orquestração: séries, playlists, geração, persistência, exportação Spotify, autenticação, busca de álbuns (`services/album-search/`), MusicKit (`services/musickit/`) | Front |
| Algoritmos e ranking (`js/algorithms/`, `js/ranking/`, `js/transformers/`) | as Recipes de geração e as estratégias de ranking (Strategy) | Front |
| Repositories (`js/repositories/`) | um por fonte de dados do Firestore, sobre `BaseRepository` (`repositories/BaseRepository.js`) | Dados |
| Cache (`js/cache/`) | L1 memória + L2 IndexedDB `mjrp-cache` (`cache/CacheManager.js`) | Dados |
| Clientes externos (`js/api/client.js`, `services/SpotifyAuthService.js`, `services/musickit/`) | falam com `/api/*`, com o Spotify (OAuth PKCE) e com o Apple MusicKit | Integrações externas |
| Worker de busca (`js/workers/search.worker.js`) | busca de autocompletar fora da thread principal, sobre `albums-autocomplete.json` | Front |

### Compartilhado (`shared/`)
| Component | Responsibility | Stack layer |
|-----------|---------------|-------------|
| Curadoria (`shared/curation.js`) | as regras de curadoria de playlist, executáveis nos dois lados | Linguagem |
| Normalização (`shared/normalize.js`) | limpeza de texto de título/artista | Linguagem |

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

1. **Criar a série.** Home -> "Scan Artist" no Apple Music -> montagem -> grava no Firestore só a lista de pedidos `albumQueries`, não os álbuns (Apêndice B §2).
2. **Carregar e enriquecer.** O cliente resolve cada pedido no Apple Music e pede `POST /api/enrich-album`; o servidor raspa o BestEverAlbums e devolve o ranking das faixas. A cascata completa (BEA, depois Spotify se menos de 50% das faixas, depois Gemini, depois Borda Count) só roda em `/generate`, o fallback legado (Apêndice G §2). O Spotify também enriquece pelo cliente, com cache global em `spotify_enrichment`.
3. **Gerar.** O assistente do Blending Menu (série -> Recipe -> ingredientes -> "Blend It!") roda a Recipe no navegador; o estado fica nas stores, o rascunho em `localStorage`.
4. **Salvar e exportar.** A playlist vai para o Firestore em `artifacts/mjrp-albums/users/{uid}/curator/data/series/{seriesId}/playlists`; a exportação para Spotify ou Apple Music sai do cliente.
5. **Identidade.** Firebase Auth com login anônimo automático (`services/AuthService.js:58`); os dados do usuário ficam sob o `uid`.

A direção das dependências: View -> Controller -> Service -> Repository / cliente externo; a regra de negócio nova nasce como Service (ADR-0016); a Store só guarda estado e o Service a atualiza pelos setters (ADR-0017); o domínio (algoritmos, `shared/`) não deve conhecer Firestore nem DOM. O modelo de dados está em `docs/specs/data-model.md`.

## Infrastructure
- Hosting: o **frontend** em Firebase Hosting, servindo `dist` (build do Vite); `firebase.json` reescreve `/api/**` para o serviço Cloud Run `mjrp-proxy` (região `southamerica-east1`) e o resto para `/index.html` (`firebase.json:3-20`). O **backend** em Cloud Run (`mjrp-proxy`, contêiner `node:18-slim`, `server/Dockerfile`), acesso público (`cloudbuild.yaml`: `--allow-unauthenticated`); a imagem é construída com `shared/` copiado para dentro do contexto (`cloudbuild.yaml` passo 1).
- Database: **Firestore** (projeto Firebase `mjrp-albums` no SDK do app, `firebase-init.js:10`); no navegador, IndexedDB `mjrp-cache` e `localStorage` (inventário em `data-model.md`). O backend não tem banco.
- Segredos: no Secret Manager do Google Cloud, injetados no Cloud Run (`AI_API_KEY`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_MUSIC_PRIVATE_KEY`; `cloudbuild.yaml`, `--set-secrets`); em desenvolvimento, `server/.env`.
- Implantação: frontend por GitHub Actions (`.github/workflows/ci-firebase.yml`: lint, testes e build, depois `firebase deploy --only hosting` em `main`, `v0.2` e tags `v*`; canal de pré-visualização em PR) ou por `scripts/deploy-prod.sh`; backend por Cloud Build (`cloudbuild.yaml`) ou `scripts/deploy-backend.sh` (`00_Deployment_and_Setup.md` §1).
- CDN/Assets: Tailwind pelo CDN `cdn.tailwindcss.com` e fonte Syne pelo Google Fonts (`public/index.html:12, 15-17`); o SDK do Apple MusicKit vem de `js-cdn.music.apple.com` (`services/musickit/MusicKitAuth.js:124`); o conjunto de álbuns do autocompletar é o arquivo estático `albums-autocomplete.json`.

## Constraints
- **Segurança.** Segredos por variável de ambiente e Secret Manager, nunca no código (Constituição Art. V; `PRINCIPLES.md` §I.14). Em produção o CORS do servidor só aceita as origens de `ALLOWED_ORIGIN` (padrão `https://mjrp-playlist-generator.web.app`, `server/index.js:58-70`). As regras do Firestore (`firestore.rules`) escopam o inventário, as séries e as playlists ao dono (`uid`). A chave do Gemini e a chave privada da Apple ficam só no servidor: por isso o servidor existe.
- **Dependências entre camadas.** Vale a Dependency Rule do `PRINCIPLES.md` §I.3: dependências apontam para dentro; trocar a fonte de dados é mexer no repositório. Rota e componente são orquestradores finos (ADR-0016).
- **Compartilhamento.** A lógica que roda nos dois lados mora em `/shared` (Constituição, *Technology Standards*); o contêiner a recebe copiada, por isso o `Dockerfile` espera `_shared_temp`.
- **Estado do servidor.** Contêiner sem estado e escalável (Constituição, *Backend*).
- **Validação.** Regra: todo dado externo que entra no servidor é validado com AJV (Constituição, *Backend*).
- **Tempo.** O raspador tem prazo de 30 s por requisição, sem retentativa nem cache (Apêndice G §8).
- **Desempenho e escala.** TBD: o v0 não declara alvo de latência nem de carga; é decisão de produto do MJRP, não do agente.
