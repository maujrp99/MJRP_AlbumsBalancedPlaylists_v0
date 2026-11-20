---
status: Draft
updated: 2026-10-28
---
# Tech stack — MJRP_AlbumsBalancedPlaylists_v0

> Com o que o produto é construído, lido do que o código usa (2026-10-28): `package.json` e `package-lock.json` (raiz), `server/package.json` e `server/package-lock.json`, `server/Dockerfile`, `firebase.json`, `cloudbuild.yaml`, `.github/workflows/ci-firebase.yml` e os cabeçalhos de `public/index.html`. A versão é a que o lockfile fixa; onde nada a fixa, a célula traz `—` e o motivo vai em «Para quê». Decisão: nenhuma escolha da stack tem ADR (as quatro ADRs do v0 tratam de padrões de código, não de tecnologia), então toda a coluna é `—`. Desde 2026-11-19 duas linhas citam ADR: o Node do servidor (ADR-0020) e o Tailwind (ADR-0021, proposta). Escrito pelo agente, revisável pelo MJRP; corrigido no mesmo dia depois da crítica independente (`reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md`). O `arch.md` aponta para cá.

## Stack
| Camada | Tecnologia | Versão | Para quê | Decisão |
|---|---|---|---|---|
| Linguagem | JavaScript, ES Modules no navegador e na raiz (`"type": "module"`, `package.json`) | — | todo o código do produto; sem TypeScript. O servidor é CommonJS (`require`, `server/index.js`) | — |
| Runtime | Node.js | 24 | roda o servidor (`FROM node:24-slim`, `server/Dockerfile`); a CI e a máquina do dono rodam os testes em Node 26 (`.github/workflows/ci.yml`); era 18, fora de suporte, até 2026-11-19 | [[ADR-0020]] |
| Front | Vanilla JS em SPA (MVC com Stores), sem framework | — | interface; a decisão de não usar framework é do Art. II da constituição | — |
| Front | Vite | 5.4.21 | servidor de desenvolvimento (porta 5000, proxy de `/api` para a 3000) e build para `dist` (`vite.config.js`) | — |
| Front | Tailwind CSS, compilado junto com o site | 3.4.19 | classes utilitárias da interface. Dependência de desenvolvimento; o Vite o roda pelo PostCSS (`vite.config.js`, `css.postcss`) no servidor de desenvolvimento e no build, a partir de `public/css/tailwind.css` (importado por `public/js/app.js`). O tema e a lista dos arquivos onde há classes (`public/index.html`, `public/js/**/*.js`) ficam no `tailwind.config.js` da raiz; classe montada na hora entra na `safelist` de lá. Até 2026-11-19 vinha por `<script>` do CDN `cdn.tailwindcss.com`, sem versão fixa. A ADR está em «Proposed», à espera do aceite do MJRP | [[ADR-0021]] |
| Front | SortableJS | 1.15.6 | arrastar e soltar (séries, área de montagem da Home, tabela de faixas) | — |
| Front | uFuzzy | 1.0.14 | busca aproximada de álbuns, copiada para `public/js/vendor/uFuzzy.js` (não vem do npm) | — |
| Front | Google Fonts, família Syne | — | tipografia, por `<link>` (`public/index.html:15-17`) | — |
| Back | Express | 4.21.2 | servidor HTTP da API sob `/api` (`server/index.js`) | — |
| Back | cors | 2.8.5 | CORS pela lista `ALLOWED_ORIGIN` em produção | — |
| Back | dotenv | 16.6.1 | lê `server/.env` em desenvolvimento | — |
| Back | Cheerio | 1.1.2 | raspa o HTML do BestEverAlbums (`server/lib/scrapers/besteveralbums.js`) | — |
| Back | AJV | 8.17.1 | valida o álbum contra `server/schema/album.schema.json` | — |
| Back | Axios | 1.13.2 | chamadas HTTP do servidor (Gemini, raspador). A raiz também o declara, para os testes da raiz que carregam módulos do servidor; o cliente não o importa (a importação sem uso de `public/js/api/client.js` saiu na F65): as chamadas dele são `fetch` | — |
| Back | jsonwebtoken | 9.0.3 | assina o token de desenvolvedor do Apple MusicKit (ES256) | — |
| Dados | Firebase SDK (Firestore e Auth) pelo npm | 10.14.1 | persistência do usuário e login anônimo, direto do navegador; o servidor não acessa o Firestore | — |
| Dados | IndexedDB `mjrp-cache` e `localStorage` | — | cache em duas camadas no navegador (L1 memória, L2 IndexedDB) e preferências | — |
| Integrações externas | Google Gemini, por REST (`generativelanguage.googleapis.com`), modelo padrão `gemini-2.5-flash` | — | enriquecimento de ranking e metadados pela IA (`server/lib/aiClient.js:7, 15`) | — |
| Integrações externas | Apple MusicKit JS | v3 | busca no catálogo, biblioteca e exportação para o Apple Music; carregado de `js-cdn.music.apple.com` (`services/musickit/MusicKitAuth.js:124`) | — |
| Integrações externas | Spotify Web API, com OAuth PKCE | — | busca, popularidade e exportação; token guardado no navegador | — |
| Integrações externas | BestEverAlbums (raspagem) | — | a fonte das notas de faixa; não tem API | — |
| Testes | Vitest com jsdom | 1.6.1 / 23.2.0 | testes unitários da raiz (`test/**/*.test.js`, `vitest.config.js:9`) | — |
| Testes | @vitest/coverage-v8 | 1.6.1 | cobertura | — |
| Testes | espree e postcss | 10.4.0 / 8.5.6 | leem o código e o CSS nos testes de arquitetura (`test/architecture/`); declarados na raiz desde a F65 | — |
| Testes | ESLint | 9.39.2 | lint do repositório inteiro, pela raiz (`eslint.config.mjs`, um bloco por tipo de código desde a F65); ainda não é portão | — |
| Build | Docker, imagem base `node:24-slim` | 24 | empacota o servidor (`server/Dockerfile`) | [[ADR-0020]] |
| Build | `gcloud run deploy --source` (Cloud Build por baixo) | — | constrói a imagem pelo `server/Dockerfile` e implanta o servidor no Cloud Run (`scripts/deploy-server.sh`); o `cloudbuild.yaml` foi removido na F64 | — |
| Build | GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`) e `firebase-tools` por `npx` | — | CI e implantação do frontend; `firebase-tools` sem versão fixa (`.github/workflows/ci-firebase.yml`) | — |
| Observabilidade | `server/lib/logger.js`, com `console` de reserva | — | log do servidor; sem coletor de erros nem de métricas no repositório | — |

## Decidido não usar
| Tecnologia | Por que não | Decisão |
|---|---|---|
| Framework de UI (React, Vue e semelhantes) | a constituição prefere a simplicidade e as tecnologias web padrão ao aprisionamento num framework complexo, "where possible" (Art. II); é preferência, não proibição, e o v1 do produto adota outra stack | — |

## Restrições
- JavaScript puro em ES Modules, Vite e variáveis CSS; Tailwind só se pedido — Constituição, Art. II.
- A lógica de negócio nova entra como Service e a rota ou o componente só orquestra — [[ADR-0016]].
- A Store guarda apenas estado; a lógica, o Firestore e a persistência ficam no Service — [[ADR-0017]].
- Backend em Node.js, contêiner sem estado no Cloud Run, lógica compartilhada com o frontend pelo diretório `/shared` e validação (AJV) de todo dado externo — Constituição, *Technology Standards*.
- Frontend em SPA com roteamento pela History API, hospedado no Firebase Hosting, mobile-first — Constituição, *Technology Standards*.
- Segredos por variável de ambiente ou Secret Manager, nunca no código — Constituição, Art. V; `PRINCIPLES.md` §I.14.
- A stack só muda por ADR, e a coluna Decisão a cita — harness, nota CM-0071.
