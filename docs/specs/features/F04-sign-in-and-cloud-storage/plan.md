<!-- docs/specs/features/F04-sign-in-and-cloud-storage/plan.md — o COMO, reconstituído do que foi entregue (commits `delivered_by`, ROADMAP legado, arch.md). -->
# Plan — Feature F04: Entrar com a conta Google ou Apple e ter séries, playlists e coleção guardadas na nuvem · Spec: [[spec]]
**Approved**: not a gate

## Architecture Approach
arch.md, «Identidade»: Firebase Auth com login anônimo automático; o login com Google ou Apple troca de uid. Os dados do usuário moram sob artifacts/mjrp-albums/users/{uid}/... (data-model.md), lidos e gravados pelos repositórios sobre o BaseRepository; o servidor não acessa o Firestore. O DataSyncService foi desenhado para migrar o que era de convidado para a conta, mas a migração real não acontece hoje (UAT-12).

## Technical Design
O fluxo de cada REQ é o que o código faz hoje (arch.md e behavior.md). Os arquivos de «Entregue em» são os dos commits entregues e os de «Onde mora», os do `Origem:` da história; o código seguiu evoluindo depois (as Sprints 17 a 19 refatoraram views e stores), então o caminho de hoje pode ser outro. É o registro do que foi feito, não um desenho novo.

- [REQ-01] (S-37) Fluxo: LoginModal → UserStore → AuthService (Firebase Auth, signInWithPopup) → o estado do usuário avisa o menu (AuthNav/TopNav) e as stores recarregam os dados do novo usuário.
  - Onde mora (origem da história): inventário do V1: L2, L3 (`components/LoginModal.js:9-121`, `components/navigation/AuthNav.js:21-97`); ROADMAP legado, Sprint 6 («Apple Sign-In», «Google Sign-In»).
  - Entregue em `18fbfc4` (2025-12-11, «fix(auth-persistence): Resolve regressions and stabilize Sprint 6 features»): `public/js/app.js`, `public/js/components/LoginModal.js`, `public/js/components/TopNav.js`, `public/js/firebase-init.js`, `public/js/repositories/BaseRepository.js`, `public/js/repositories/SeriesRepository.js`, `public/js/services/DataSyncService.js`, `public/js/stores/UserStore.js`, `public/js/stores/albumSeries.js` e mais 5.
- [REQ-02] (S-38) Fluxo: Login anônimo automático (Firebase Auth) → repositórios (BaseRepository e um por fonte) leem e gravam no Firestore sob o uid → o desenho prevê que o DataSyncService migre o que era de convidado quando a pessoa entra com uma conta, mas essa migração NÃO acontece hoje (UAT-12: `UserSyncService.js:22` só migra se o usuário anterior for `'guest'`, que nenhum código atribui; `saveSeries` não existe) — vale só a gravação por `uid`.
  - Onde mora (origem da história): inventário do V1: D1, I10, L1 (`repositories/*Repository.js:21-27`, `services/AuthService.js:36-67`); ROADMAP legado, Sprint 5 («Firestore Persistence»).
  - Entregue em `b85f473` (2025-12-03, «feat: implement persistence and series management UI»): `public/js/app.js`, `public/js/components/Icons.js`, `public/js/components/TopNav.js`, `public/js/repositories/BaseRepository.js`, `public/js/stores/albums.js`, `public/js/stores/playlists.js`, `public/js/stores/series.js`, `public/js/views/AlbumsView.js`, `public/js/views/HomeView.js` e mais 3.
  - Entregue em `6eb6682` (2025-11-28, «Sprint 5 Phases 1-2: Firestore Persistence + Cache + Migration (34/34 tests…»): `public/js/cache/CacheManager.js`, `public/js/cache/IndexedDBCache.js`, `public/js/cache/MemoryCache.js`, `public/js/migration/MigrationUtility.js`, `public/js/repositories/AlbumRepository.js`, `public/js/repositories/BaseRepository.js`, `public/js/repositories/InventoryRepository.js`, `public/js/repositories/PlaylistRepository.js`, `public/js/repositories/SeriesRepository.js` (os repositórios sob `users/{uid}`).
  - Entregue em `edc38ee` (2025-12-21, «fix(auth): implement AuthService to gate routing behind auth readiness - fixes deep linking»): `public/js/app.js`, `public/js/services/AuthService.js` (a entrada automática e o aviso «Authentication issue. Some features may be limited.»).

## UI/UX Design
Estados observáveis: os de docs/specs/behavior.md listados na spec (cada um com o texto que a tela mostra, em inglês, como está no código). Camada transversal (tokens, fontes, componentes compartilhados, responsividade): sem referência visual aprovada no v0, então nada é comparado; o sensor visual não roda no que está fechado e em produção (regra do MJRP de 2026-10-18).

## Dependencies
Firebase Auth e Firestore (SDK npm), citados no ROADMAP legado, Sprints 5 e 6.

## Documents Consulted
- docs/specs/arch.md (mapa de componentes e fluxo de dados) · docs/specs/data-model.md · docs/specs/behavior.md (estados) · docs/specs/tech-stack.md · docs/specs/constitution.md
- docs/specs/requirements/nfr/NFR-01 e NFR-02: restrições transversais, ainda Backlog; nenhuma é satisfeita ou violada por esta reconstituição.
- info-arch.md e design-system.md: não existem no v0 (sem protótipo aprovado).
- ROADMAP legado (docs/ROADMAP.md) e, quando há, a spec arquivada em docs/technical/specs/archive/.

## Risks & Considerations
Entrar com Google ou Apple troca de uid e os dados da sessão anônima ficam no uid antigo (arch.md, passo 5 do fluxo de dados). As regras do Firestore são a única autorização dos dados e algumas coleções estão abertas a qualquer autenticado, inclusive anônimo (arch.md, quadro de regras): risco registrado nos documentos canônicos, fora desta feature.
