<!-- GERADO de docs/specs/constitution.md — não edite aqui: a fonte escrita é docs/specs/constitution.md (PRINCIPLES.md, Parte III). Regenerado em 2026-10-28; a cópia anterior ficou em _backups/specify-memory-constitution.md.20261028. -->

# Constitution - MJRP_AlbumsBalancedPlaylists_v0

Este projeto segue o `PRINCIPLES.md` do MJRP Harness, versão 1.0 - cópia carimbada na raiz deste projeto (`PRINCIPLES.md`).

> **Origem.** Os artigos abaixo são os da constituição do v0 (`docs/CONSTITUTION.md`, **v1.0.0, ratificada em 2025-12-10**), com as palavras aprovadas mantidas em inglês, como foram escritas; só a forma passou ao modelo do harness (2026-10-28). Nenhum artigo foi reescrito para casar com o código: onde o código diverge, a regra manda e o código é dívida, registrada como itens de Fix com `violates::` no relatório de auditoria `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md`.

## O que é da stack deste projeto

- **Tipagem:** JavaScript puro em ES Modules, sem TypeScript (Art. II, *Tech Stack*).
- **Tamanho de arquivo:** acima de 200 linhas acende o alarme (sinal, não regra: investigue qual responsabilidade sobrou). É o alvo que o projeto já usou no Sprint 19 para views e componentes (`docs/technical/specs/archive/sprint19-frontend-modularization/`); a store pura fica abaixo de 150 (ADR-0017); "God File" é o que a ADR-0016 combate.
- **Nomes:** o **Universal Series Model** (Art. II, *Naming Conventions*); o algoritmo de geração é uma **Recipe** ("Flavor" não se usa mais - ADR-0015). A convenção `[Domínio][Responsabilidade]Service` é só uma proposta da ADR-0018 (`Proposed`) e **não é regra** até essa ADR ser aceita.
- **Padrões com endereço** (catálogo: `design-patterns`; padrão novo entra aqui com endereço e motivo):
    - **Store Pattern, Observer** (`DP-05`) em `public/js/stores/`: a store só guarda o estado e avisa quem assinou; sem lógica, sem API, sem efeito colateral (ADR-0017).
    - **Repository** (`DP-01`) em `public/js/repositories/`: o adaptador do Firestore, um por coleção, sobre `BaseRepository`; trocar a fonte de dados é mexer só aqui (`PRINCIPLES.md` §I.3). O `localStorage` passa por `public/js/services/infra/StorageService.js`.
    - **Service Layer** (`DP-12`) em `server/lib/services/` e `public/js/services/`: rota e componente são "orquestradores finos" que recebem a entrada, chamam o Service e devolvem a saída; a lógica de negócio nova nasce como Service (ADR-0016). Integrações externas (IA, Auth) também ficam em Service.
    - **Strategy** (`DP-04`) em `public/js/ranking/`, `public/js/algorithms/` e `public/js/services/album-search/classification/`: trocar o algoritmo sem mudar quem o usa.
    - **Facade** (`DP-11`) em `server/lib/fetchRanking.js`: esconde raspagem, IA e fallbacks atrás de `fetchRankingForAlbum`.
    - **Factory por injeção** (`DP-02`) em `server/routes/albums.js` (`initAlbumRoutes`): a rota recebe os Services prontos, o que permite trocá-los por mocks.
- **Proibições:** estilo genérico (Art. I); Tailwind sem pedido (Art. II); seções "Known Issues" em documento de arquitetura ou técnico (Art. III); código sem `implementation_plan.md` ou Implementation Guide aprovado pelo usuário (Art. III).
- **Tela e design system:** o CSS, os tokens, as fontes e os componentes compartilhados do design system são portados da referência visual aprovada (o protótipo, ou as exportações do Figma), não reescritos; cortar ou trocar qualquer um deles exige decisão registrada (ADR), nunca um corte calado no tema. A tela se compara com a referência pelo sensor de paridade visual (`sensors.visual`). Vale para tela nova ou alterada depois da adoção do harness; a tela já fechada e em produção não é comparada (regra do MJRP de 2026-10-18).
- **Requisitos em pt-BR e em inglês:** cada nó em `docs/specs/requirements/` com as seções `## pt-BR` e `## en` (padrão do harness; outra lista de línguas vai no contrato, `mjrp_harness.requirements.languages`).

## Artigos do v0

### I. User-Centric Quality
The user experience must be premium, dynamic, and polished.
- **Visuals**: Use curated color palettes, micro-animations, and responsive design. No generic styles.
- **Interaction**: UI must feel "alive". No dead clicks or silent failures.
- **Validation**: Features are not "done" until the User confirms they are done (Golden Rule).

*Relação com o harness: "no dead clicks or silent failures" é o `PRINCIPLES.md` §I.8; "done" só com o dono confirmando é o §I.10.*

### II. Clean Code & Modular Architecture
We favor simplicity and standard web technologies over complex framework lock-in where possible.
- **Tech Stack**: Vanilla Javascript (ES Modules), Vite, CSS Variables (Tailwind only if requested).
- **Patterns (not limited to)**:
    - **Store Pattern** for client-side state management (Observer-based).
    - **Repository Pattern** for data access (Firestore, LocalStorage).
    - **Service Layer** for external integrations (AI, Auth).
- **Structure**: Separation of concerns (View vs Logic vs Data). Modularization of logic and data access. Componentization of UI.
- **Naming Conventions**:
    - **Universal Series Model**: All curation contexts must be suffixed with `Series` (e.g., `AlbumSeries`, `ArtistSeries`, `GenreSeries`) and flow through the `Blending Menu`.
    - **Pipeline**: `create[Entity]Series` -> `blendSeries` -> `generatePlaylist`.

### III. Documentation First
Documentation is a living part of the codebase, not an afterthought.
- **Single Source of Truth**: `docs/manual/01_System_Architecture.md`, `ROADMAP.md`, and `manual/00_Deployment_and_Setup.md` must reflect reality.
- **Traceability**: Every bug fix requires an entry in `DEBUG_LOG.md`.
- **Planning**: No code is written without an `implementation_plan.md` or `Implementation Guide` approved by the user.
- **Issues ONLY in DEBUG_LOG**: Bug tracking, known issues, and investigation notes MUST be in `docs/debug/DEBUG_LOG.md`. Never add "Known Issues" sections to architecture or technical docs.
- **Architecture = Structure**: Architecture docs describe HOW the system works, not what's broken.

### IV. Spec-Driven & Test-Supported
We design before we build, and we verify what we built.
- **Spec-First**: For complex features (like Auth), a detailed technical specification is required before implementation (See `.specify/templates/`).
- **Testing**:
    - **Unit Tests** (Vitest) for core logic (Stores, Repositories).
    - **Manual Verification** plans must be explicit and executed.
    - **E2E Tests** (Puppeteer) for critical user flows, avoiding fragile external dependencies where possible.

*Relação com o harness: o ciclo spec -> plan -> tasks -> implement para toda feature é o `PRINCIPLES.md` §I.10; o artigo IV não o enfraquece.*

### V. Operational Excellence
Production stability is paramount.
- **Deployment**: Zero-downtime deployments via CI/CD.
- **Config**: Secrets managed via Environment Variables/Secret Manager.
- **Monitoring**: Logs must be meaningful and accessible.

*Relação com o harness: segredo fora do código é o `PRINCIPLES.md` §I.14.*

## Technology Standards

### Backend (Cloud Run)
- Node.js runtime.
- Stateless, scalable container.
- Shared logic with frontend via `/shared` directory.
- Input validation (AJV) for all external data.

### Frontend (Firebase Hosting)
- SPA Architecture.
- History API Routing.
- Mobile-first responsiveness.

## Governance

- **Amendments**: Changes to this constitution require User approval.
- **Compliance**: All Pull Requests and Design Docs must align with these principles.
- **Versioning**: This document follows Semantic Versioning (MAJOR.MINOR.PATCH).

**Version**: 1.0.0 | **Ratified**: 2025-12-10 | **Last Amended**: 2025-12-10 | **Forma ajustada ao modelo do harness**: 2026-10-28 (nenhum artigo mudou)

## O que NÃO vai aqui

Stack (qual framework/linguagem) e quem-faz-o-quê vivem no contrato de instância (`.mjrp-project.yml` -> `stack:`, `tools:`, `models:`); a lista de tecnologias com versão, em `docs/specs/tech-stack.md`.
