# Plan — Feature F78: O Album Blender como app para iPhone e Android · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Capacidade nova em projeto existente: a proposta de arquitetura guiada por risco vem antes do ADR. Ela está em `design/proposals/f78-app-architecture/architecture-proposal.md` (2026-11-20; ainda sem crítica e sem aprovação do MJRP; nenhum ADR escrito).

O que ela recomenda, a criticar: React Native com Expo, com as regras do produto num núcleo em `shared/` usado pelo site, pelo app e pelo servidor; pedaços nativos em Swift e Kotlin só onde a plataforma exige (o token do usuário do Apple Music); Firebase para conta e dados; o servidor do Cloud Run como está; a medição pela porta da F77, com os nomes de evento em `shared/usage/`. O site não muda de lugar; as pastas de regras vão para `shared/` uma a uma, na ordem em que o app precisa.

O que ela mediu: 66 arquivos e 7.392 linhas de regras (`models`, `algorithms`, `ranking`, `transformers`, `helpers`, `stores`) não tocam o navegador; 24 de 51 serviços também não; 954 dos 2.640 casos de teste escritos exercitam só esse código; as telas (46% do site) são reescritas em qualquer opção nativa. **«Não toca o navegador» não é «roda no app»:** cerca de 34% das linhas do site é portável depois de um conserto pequeno (`crypto.randomUUID`), cerca de 28% sem tocar em nada, e 0% foi executado num aparelho. `SeriesService`, `PlaylistsService` e os repositórios pedem uma refatoração do site antes de o app usá-los (seção 4.7 da proposta).

Revista em 2026-11-20 depois da crítica independente (`reports/audits/2026-11-20-mjrpalbumblender-v0-f78-architecture-critique.md`: 2 P0 e 7 P1, respondidos na seção 16 da proposta). Mudou: Firebase nativo no app em vez do Firebase JS; toda gravação com prazo e estado na tela, inventário e ranking próprio gravando sem rede; regra de convivência entre versões do app e o site, com versão mínima; App Check e teto global de gasto; dois marcos (o app do MJRP, depois o público).

O que fica aberto e pode mudar a escolha: os spikes S1 a S9 da proposta (o núcleo dá no app o mesmo resultado que no site? qual Firebase? dá para criar playlist no Apple Music só com o token?) e as quinze decisões do MJRP da seção 13, das quais as quatro primeiras vêm antes de qualquer spike (entre elas a emenda da constituição, Art. II, que hoje não admite framework de interface nem TypeScript).

## Technical Design
A escrever.

## Dependencies
A declarar.

## Documents Consulted
`AGENTS.md`, `docs/specs/arch.md`, `docs/specs/constitution.md`, `docs/specs/tech-stack.md`, `docs/specs/data-model.md`, `docs/specs/design-system.md` (§ Celular), `docs/specs/info-arch.md` (§ O celular (F76)), `docs/decisions/` (0015 a 0021), `docs/specs/features/F77-measure-how-the-app-is-used/spec.md`, `docs/specs/requirements/ep-10-app-nas-lojas/S-60-use-the-album-blender-as-an-app-from-the-store.md`, `reports/audits/2026-11-20-mjrpalbumblender-v0-public-product-study.md`, `reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md`, `reports/audits/2026-11-20-mjrpalbumblender-v0-f78-architecture-critique.md`, `firestore.rules`, `vite.config.js`, `public/js/` (lido por script: pastas, linhas e dependências do navegador), `shared/`, `server/lib/auth/guards.js`, `test/architecture/`.

## Risks & Considerations
Os dezesseis riscos, cada um como cenário de falha, com o estado (reduzido ou aberto), estão na seção 3 da proposta. Os abertos que viajam para este plano: R1 (o núcleo no motor do app, até o spike S1), R3 (Apple Music no Android), R7 (custo por pessoa, não medido), R8 (três alvos para uma pessoa), R9 (o desenho da F76 em telas nativas), R12 (regras do Firestore de `albums/` e `spotify_enrichment/`), R13 (apagar a conta), R15 (abuso com a configuração pública, sem App Check) e R16 (a receita sem fonte de nota na versão pública).
