```markdown
+### MJRP Albums Balanced Playlists — Resumo Executivo

Este documento sumariza o propósito, arquitetura, fluxo principal e pendências operacionais do projeto **MJRP Albums Balanced Playlists**.

**Objetivo**
- Gerar playlists balanceadas a partir de dados de "aclamação" por faixa, combinando evidência determinística (BestEverAlbums) com enriquecimento por modelo de IA (Gemini / Google Generative Language).
- Servir uma UI estática (Firebase Hosting) que persiste curadorias no Firestore e protege chaves de IA por meio de um proxy server.

**Visão Geral do Fluxo**
- Frontend (`public/`) chama o proxy em `POST /api/generate` para obter metadados normalizados do álbum + ranking de faixas.
- Proxy (`server/index.js`) tenta primeiro obter evidência do scraper `BestEverAlbums` (`server/lib/scrapers/besteveralbums.js`).
- Se o scraper for parcial, o proxy solicita ao modelo para enriquecer e mescla resultados (scraper vence conflitos).
- Normalização, validação e sanitização são feitas por `server/lib/normalize.js`, `server/lib/schema.js` (AJV opcional) e `server/lib/validateSource.js`.
- Consolidação de rankings usa Borda (ver `server/lib/ranking.js`).
- O algoritmo de curadoria (cliente) (`public/js/curation.js`) gera playlists P1/P2/DeepCuts, respeita regras de P1/P2 e preenche até a duração alvo.

**Componentes Principais**
- Frontend: `public/hybrid-curator.html`, `public/js/app.js`, `public/js/api.js`, `public/js/curation.js`.
- Proxy / Backend: `server/index.js` e módulos em `server/lib/` (`aiClient.js`, `normalize.js`, `ranking.js`, `schema.js`, `validateSource.js`, `scrapers/besteveralbums.js`).
- Tests: `server/test/*` e `test/*` com runners simples (node-based).
- CI/CD: workflow em `.github/workflows/ci-firebase.yml` (build/test + deploy). Hosting configurado em `firebase.json` (public → `public/`).

**Como rodar localmente (resumo rápido)**
- Backend proxy:
  - `cd server && npm ci`
  - criar `.env` com `AI_API_KEY`, `AI_ENDPOINT` (opcional), `AI_MODEL` (opcional), `PORT` (opcional)
  - `npm start` (escuta por padrão em `:3000`)
- Frontend static:
  - servir `public/` (ex.: `python3 -m http.server 8000 -d public`)
  - abrir `http://localhost:8000/hybrid-curator.html` (cliente usa `http://<host>:3000/api/generate` por padrão)
- Testes do server:
  - `cd server && npm test`

**Estado atual de CI/CD e deploy**
- Workflow de GitHub Actions configurado para instalar dependências (root + `server/`), rodar lint/test e fazer deploy usando `firebase-tools` com `FIREBASE_TOKEN` e `FIREBASE_PROJECT`.
- Segredos necessários: `FIREBASE_PROJECT`, `FIREBASE_TOKEN` (ou, alternativamente, `FIREBASE_SERVICE_ACCOUNT` se migrarmos para Service Account).
- Preview PR criado (branch `ci-firebase-test`) e run em andamento / monitorado.

**Observações técnicas e riscos**
- Scraper-first é poderoso para proveniência mas frágil a mudanças no HTML do BestEverAlbums.
- Validação AJV é opcional hoje — se `ajv` não estiver instalado, a validação fica desativada (recomenda-se instalar em CI para garantir contratos).
- CORS no `server/index.js` tem comportamento permissivo em dev; rever para produção.
- `aiClient.js` usa query param `?key=` para chamadas Google GL — chave deve permanecer no servidor.

**Pendências e próximos passos (prioritários)**
1. Validar o run do PR de preview (capturar logs e URL de preview). Se OK, promover merge para `main` para deploy de produção.
2. Executar e corrigir quaisquer falhas de teste (`cd server && npm ci && npm test`) — rodar em CI também.
3. Reforçar validação instalando `ajv` no `server` e garantir que CI execute a validação.
4. Rever `corsOptions` para ajustar origem em produção.
5. Habilitar branch protection (exigir checks do workflow) para `main`.
6. (Opcional) Migrar deploy para Service Account JSON (`FIREBASE_SERVICE_ACCOUNT`) para melhor gestão de credenciais.

**Checklist rápido para retomar deploy agora**
- [x] `FIREBASE_PROJECT` e `FIREBASE_TOKEN` adicionados aos secrets do repositório.
- [ ] Aguardar finalização do workflow do PR e verificar preview URL e logs.
- [ ] Mergiar para `main` quando o preview estiver validado.
- [ ] Habilitar proteção de branch para `main`.

**Comandos úteis**
- Listar runs e ver logs:
  - `gh run list --repo maujrp99/MJRP_AlbumsBalancedPlaylists_v0`
  - `gh run view <run-id> --repo maujrp99/MJRP_AlbumsBalancedPlaylists_v0 --log`
- Rodar testes server local:
  - `cd server && npm ci && npm test`
- Definir secrets (local):
  - `gh secret set FIREBASE_PROJECT --body "your-firebase-project-id" --repo maujrp99/MJRP_AlbumsBalancedPlaylists_v0`
  - `gh secret set FIREBASE_TOKEN --body "<token>" --repo maujrp99/MJRP_AlbumsBalancedPlaylists_v0`

## Architecture Review & v1.5 Refactor Plan (2025-11-25)

An architecture review identified key areas for improvement to ensure scalability and maintainability (v1.5).

**Prioritized Refactor Items:**

1.  **Frontend Modularization (High Risk):**
    *   **Problem:** `app.js` and `curation.js` are monolithic and tightly coupled to the DOM/Globals.
    *   **Solution:** Refactor `curation.js` into a pure ES Module with a clear API, decoupling state and heuristics from the UI.

2.  **Backend Service Layer (High Risk):**
    *   **Problem:** `index.js` handles HTTP, orchestration, and business logic.
    *   **Solution:** Extract `fetchRankingForAlbum` into a dedicated service module (`server/lib/fetchRanking.js`) to improve composability and testing.

3.  **Shared Normalization (Medium Risk):**
    *   **Problem:** Logic duplication between client and server for key normalization.
    *   **Solution:** Create a shared ES Module (`shared/normalize.js`) usable by both Frontend (native import) and Backend (import/require).

4.  **Testing & Observability:**
    *   **Plan:** Add headless browser tests (Vitest/JSDOM) for curation logic and improve client-side telemetry for fallback scenarios.

**Design Patterns to Emphasize:**
*   **Proxy:** Server hiding API keys.
*   **Strategy:** Dynamic ranking source selection (Scraper vs AI).
*   **Facade:** Simplified client API.
*   **Adapter:** Standardizing external API responses.

--
Arquivo gerado automaticamente a partir da análise do repositório em 2025-11-23.

``` 
