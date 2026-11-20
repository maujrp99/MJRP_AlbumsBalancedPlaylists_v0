# Plan — Feature F78: O Album Blender como app para iPhone e Android · Spec: [[spec]]
**Approved**: pendente (o primeiro marco; espera o julgamento do MJRP, junto com o ADR-0022 e a emenda da constituição)

## Architecture Approach
O desenho é a proposta de arquitetura: `design/proposals/f78-app-architecture/architecture-proposal.md` (criticada, revista, reconferida; o MJRP mandou seguir a recomendação em 2026-11-20 13:44 e 13:45). A decisão da pilha está no ADR-0022, em «Proposed».
Em cinco linhas: React Native com Expo, uma base para iPhone e Android, em `app/`. As regras num núcleo de JavaScript, `shared/`, usado pelo site, pelo app e pelo servidor; o núcleo não importa navegador, React, Expo, Firebase, `fetch` nem PostHog e pede o que precisa por portas. Os repositórios em `shared/data/`, recebendo as funções do Firestore de fora; no app, o pacote nativo do Firebase. Swift e Kotlin só para o token do Apple Music. Toda gravação com prazo e estado na tela, e a convivência entre versões do app e o site (§ 5.3 e § 6.2).
Este plano cobre só o primeiro marco da spec: os spikes, a refatoração do site que dá casa ao núcleo (Ref-0, Ref-A, Ref-B) e o esqueleto ambulante.

## Technical Design
O fluxo do esqueleto: a tela de entrar → a conta (login nativo da Apple ou do Google, credencial no Firebase nativo) → `SeriesService` do núcleo → a guarda local (a cópia de antes) e o `SeriesRepository` de `shared/data/` com as funções do Firestore do app → a lista. A gravação de séries, que só o site faz neste marco, passa pela transação com conferência do mesmo `shared/data/`.

| Módulo | Onde mora | O que faz | REQ |
|---|---|---|---|
| Relatórios dos spikes S1 a S7 | `reports/audits/2026-11-…-mjrpalbumblender-v0-f78-spike-sN.md` | a pergunta, o sim ou o não, a evidência, o prazo gasto | REQ-01 a REQ-06 |
| Corpo dourado | `test/fixtures/golden-core/` (amostra da conta do MJRP com faixas sem `id`, mais as entradas dos testes do núcleo) e `scripts/golden-core.mjs` (roda no Node e grava a saída esperada) | a entrada e a saída que o app tem de repetir | REQ-01, REQ-06, REQ-16 |
| Porta de plataforma | `shared/platform/` (`newId`, comparar e normalizar texto) | o único lugar que depende do motor; o site entrega `crypto.randomUUID`, o app `expo-crypto` | REQ-07 |
| Pacote do núcleo | `package.json` da raiz (`workspaces`: `shared`, `app`), `shared/package.json` | o app enxerga `shared/` por um caminho só | REQ-08 |
| Sensores | `test/architecture/coreStaysPortable.test.js`, `appAndSiteApart.test.js`, `oldWriterKeepsNewFields.test.js`, `noSecretsInTheApp.test.js`; `usageBehindThePort.test.js` (estendido); `vitest.config.js` (os testes do núcleo também em ambiente `node`) | as linhas da arquitetura falham na suíte | REQ-08, REQ-10, REQ-15, REQ-17 |
| Repositórios | `shared/data/` (`BaseRepository` e os cinco), recebendo `doc`, `getDoc`, `updateDoc`, `runTransaction` e as outras por parâmetro; a ligação do site em `public/js/` entrega as do Firebase JS | caminhos e formato dos documentos, um lugar só | REQ-09 |
| Regras de convivência | `shared/data/BaseRepository.js` (gravar por campos, preservar o desconhecido, `_schemaVersion` nunca menor, só leitura acima da versão conhecida); `firestore.rules` (recusa rebaixar `_schemaVersion`) | um app antigo não apaga campo novo | REQ-10 |
| Séries no núcleo | `shared/services/SeriesService.js` (recebe repositório, guarda e aviso de fora); `SeriesFactsService.saveAlbumFacts` pelo mesmo caminho; a ligação do site entrega o `globalProgress` e a guarda | gravar série com conferência, quatro desfechos | REQ-11 |
| Deploy do servidor | `scripts/deploy-server.sh` (`--max-instances`) e o seu teste | o pior caso conhecido | REQ-18 |
| Rota da versão mínima | `server/routes/appConfig.js`, `GET /api/app-config`, pública, sem segredo | a versão mínima por plataforma | REQ-14 |
| O app | `app/` (Expo, `package.json` próprio): `app/src/screens/` (entrar, séries, sem rede, atualize, autoteste), `app/src/wiring/` (Firebase nativo, guarda local, PostHog, plataforma) | só telas e ligações; nenhuma regra | REQ-12 a REQ-17 |
| Medição do app | `app/src/wiring/usagePosthog.js`, sobre `shared/usageEvents.js` da F77 | os mesmos nomes de evento | REQ-15 |
| Roteiro do autoteste | `app/maestro/golden-core.yaml` e `scripts/app-selftest.sh` | um comando, as duas plataformas, «N of N match» | REQ-16 |

**Construído na primeira fatia (ramo `feat/f78-core-foundations`, 2026-11-20):**

| Módulo | Onde mora | O que faz | REQ |
|---|---|---|---|
| Porta do id | `shared/platform/newId.js`; a ligação do site em `public/js/services/platform/platformWiring.js` (o primeiro módulo do `app.js`); a dos testes em `test/setup.js` | `newId()` e `setIdSource(fn)`; sem fonte, erro que diz o que ligar | REQ-07 |
| Texto do motor | `shared/platform/text.js` | `normalizeText`, o `normalize` num lugar só; as duas regras de identidade o usam | REQ-08 |
| Pacote do núcleo | `shared/package.json` (`@album-blender/shared`, sem dependência), `"workspaces": ["shared"]` na raiz, `package-lock.json` | o `npm ci` liga o pacote; o Vite e o deploy do servidor seguem como antes | REQ-08 |
| Sensores | `test/architecture/coreStaysPortable.test.js`, `appAndSiteApart.test.js` (vazio até `app/` existir, menos `public/` → `app/`), `vitest.workspace.js` (projeto `core-node`: `test/shared/` sem jsdom) | as linhas da arquitetura falham na suíte | REQ-08 |
| Login do site | `public/js/services/auth/signIn.js` (saiu de `shared/services/AuthService.js`) | o núcleo não importa Firebase | REQ-08 |
| Corpo dourado | `test/fixtures/golden-core/` (entradas, a corrida neutra de motor, a referência), `scripts/golden-core.mjs` (`--check`, `--write`, `--hermes`), `test/architecture/goldenCoreUnchanged.test.js` | a saída das regras guardada; mudou, a suíte acusa | REQ-01, REQ-16 |
| Deploy do servidor | `scripts/deploy-server.sh` (`MAX_INSTANCES`, 3), `test/server/deployFixesMaxInstances.test.js` | o pior caso: 60 chamadas pagas por hora por pessoa vezes 3 | REQ-18 |

Dois consertos que o S1 achou, feitos na mesma fatia: o `TrackEnrichmentMixin` (comparador que deixava a ordem ao motor) estava morto e saiu; o dinheiro do inventário é arredondado a centavos antes de virar texto (`roundToCents` em `models/inventoryValue.js`).

**Construído na fatia Ref-A (ramo `feat/f78-ref-a-repositories-in-the-core`, 2026-11-20):**

| Módulo | Onde mora | O que faz | REQ |
|---|---|---|---|
| Repositórios | `shared/data/` (`BaseRepository` e os cinco), movidos com o histórico | os mesmos caminhos e formatos; nenhum `import` de Firestore, do site ou do navegador | REQ-09 |
| A store (porta dos dados) | `shared/data/store.js` (`STORE_FUNCTIONS`, `requireStore`); a do site em `public/js/repositories/firestoreStore.js` (`firestoreStore(db)`, as 13 funções do Firebase JS repassadas na hora da chamada) | o repositório recebe o `db` e as funções; o app vai entregar as do React Native Firebase | REQ-09 |
| Instância do ranking | `public/js/repositories/userRankings.js` | a instância única do site (antes no fim do arquivo do repositório, com o `db` de `firebase-init.js`) | REQ-09 |
| Regra da versão | `shared/data/schemaVersion.js` (`keptSchemaVersion`), usada por `BaseRepository.save`; `firestore.rules` (`keepsSchemaVersion()` no `update` dos quatro caminhos dos repositórios) | `_schemaVersion` nunca desce, no código e no servidor | REQ-10 |
| Provas | `test/repositories/writeSequence.test.js` e `test/fixtures/repositories/write-sequence.json` (o registro gravado na `main`, `7a3237b`, com `test/helpers/recordingFirestore.js`); `test/architecture/oldWriterKeepsNewFields.test.js`; `test/shared/data/schemaVersion.test.js`; `test/security/firestoreRules.test.js`; `firestoreBehindRepositories` estendido; `test/repositories/` também no projeto `core-node` | a mudança de casa não muda nenhuma chamada; o escritor velho não apaga campo novo | REQ-09, REQ-10 |

**A contradição do § 17 (o § 4.7 diz «só `import` e construtor», o § 6.2 põe a troca do `setDoc` na Ref-A), resolvida pelo menor passo.** A Ref-A fez a mudança de casa e a regra da versão; **nenhuma gravação mudou de forma**. Lido no código: o «`setDoc` sem fusão» do `BaseRepository` (`create`) só cria documento novo, com id automático; nenhum caminho de hoje regrava um documento existente sem `merge`: séries e inventário mudam por `update` (campos), playlists e o cache do Spotify por `set` com `merge`, o ranking por `setDoc` com `merge`. Por isso o campo desconhecido na raiz sobrevive em todos, e a regra 1 do § 6.2 já vale nos repositórios. **Foi para a Ref-B (TASK-17):** abrir só para leitura um documento de versão maior que a conhecida (regra 3, com o texto da tela), a série por transação com conferência, e os casos abertos abaixo.

**Convivência: casos abertos (para a Ref-B).** Não há teste pulado (o projeto não usa `it.skip`); os casos ficam escritos aqui e no cabeçalho de `oldWriterKeepsNewFields.test.js`:
- `SpotifyEnrichmentRepository.saveEnrichment`, e qualquer `save` com uma carga que não veio da leitura do documento: quem escreve não sabe a versão guardada e carimba a sua; com a regra publicada, o servidor recusa essa gravação quando o documento é de versão maior (recusada, não rebaixada). Para o cache do Spotify, uma gravação recusada só custa a próxima leitura.
- `PlaylistRepository.replaceBatch`: guarda a versão maior só se a playlist da tela trouxer o `_schemaVersion` que leu (o `PlaylistsService` copia a playlist da store; um lote gerado agora não traz). Com a regra publicada, salvar por cima de uma playlist de versão maior sem a versão lida é recusado.
- `UserRankingRepository.saveRanking` grava a lista `rankings` inteira: um campo desconhecido dentro de uma entrada só sobrevive se quem chama a devolver como leu. O mesmo vale para `albumQueries` em `SeriesService.updateSeries` (o repositório grava a lista que recebe; preservar o objeto lido é do caso de uso).
- Só leitura acima da versão conhecida (regra 3): nenhum leitor confere hoje; é do caso de uso, com a tela, na Ref-B.

**Construído no esqueleto do app (ramo `feat/f78-app-skeleton`, 2026-11-20), até onde esta máquina prova** (sem simulador: a licença do Xcode não está aceita, não há Android SDK nem contas). Versões conferidas na web no dia: Expo SDK 58 (`expo` 58.0.26), React Native 0.88.1, React 19.3.0, Expo Router 58.0.32, TypeScript 6.0, Jest 30 com jest-expo 58 e React Native Testing Library 14; a Nova Arquitetura é a única desde o React Native 0.82. A tabela acima previa `app/src/wiring/`; as ligações ficaram junto da porta de cada uma (`data/`, `auth/`, `usage/`, `platform/`), e o arquivo de cada ligação nativa diz no topo que não está provado.

| Módulo | Onde mora | O que faz | Provado aqui? | REQ |
|---|---|---|---|---|
| O projeto | `app/` (`@album-blender/app`, espaço de trabalho da raiz ao lado de `shared/`; `app.json`, `tsconfig.json` estrito, `metro.config.js`, `jest.config.js`, `eslint.config.js`); `npm run app:check` na raiz | Expo Router com as rotas em `app/src/app/`; o Metro resolve `shared/` pelo nome do pacote e pelo apelido `@shared` do site, um caminho só | sim: tipos, lint, testes, `expo export` iOS e Android | REQ-08 |
| Ligação da plataforma | `app/src/platform/wiring.ts` | o `newId()` do núcleo recebe o `randomUUID` do expo-crypto, uma vez, antes de qualquer tela | o mecanismo, no Jest (o expo-crypto nativo, não) | REQ-07 |
| Porta dos dados | `app/src/data/store.ts` (a interface), `memoryStore.ts`, `firebaseStore.ts`, `seriesList.ts`, `noCache.ts`; `app/src/demo/demoSeed.ts` | os mesmos repositórios de `shared/data/` com a store do app; a lista de séries, mais nova primeiro (`shared/seriesOrder.js`), com nome, contagem e capas (`shared/seriesSummary.js`) | a em memória, sim; a do React Native Firebase só compila e empacota (spike S2) | REQ-09, REQ-12 |
| Porta da conta | `app/src/auth/authPort.ts`, `fakeAuth.ts`, `nativeAuth.ts` | entrar com a Apple ou o Google, sair, quem está; sem visitante | o falso, sim; o nativo só compila e empacota | REQ-12 |
| Porta do uso | `app/src/usage/usage.ts`, `posthogAdapter.ts` | os eventos pela lista fechada de `shared/usageEvents.js`; desligado, em memória, PostHog só com chave | a porta, sim; o PostHog, não | REQ-15 |
| Composição | `app/src/composition.ts`, `app/src/ui/AppServicesContext.tsx` | modo de demonstração (padrão) ou `EXPO_PUBLIC_DATA_MODE=firebase`; as ligações nativas carregadas só nesse modo | o de demonstração, sim | REQ-12 |
| Telas | `app/src/app/` (rotas: `(tabs)/` com os cinco destinos, `sign-in`, `diagnostics`), `app/src/screens/`, `app/src/ui/` (tema e peças de `design-system.md` § Celular) | Albums (carregando, lista, vazio, falha com «Try again»), Entrar (os estados do REQ-12), «Not in the app yet» nos outros quatro | nos testes de componente; nenhuma tela vista num aparelho | REQ-12 |
| Autoteste | `app/src/selftest/goldenSelfTest.ts`, `sha256.ts`; `app/src/screens/SelfTestScreen.tsx` | o corpo dourado no motor do app, comparado com `reference/cases.tsv` pelo sha256 de cada linha; «N of N match» | no Jest: 3343 de 3343; no pacote do Metro: empacotado; no Hermes do aparelho, não | REQ-16 |
| Sensores | `test/architecture/appAndSiteApart.test.js` (lê todo arquivo do app e segue o que ele alcança fora de `app/`), `noSecretsInTheApp.test.js` e `scripts/app-bundle-scan.mjs`; `test/architecture/support/importGraph.js` (o que o app importa do núcleo é ponto de entrada); `app/eslint.config.js` (os pacotes nativos só nas suas ligações) | as linhas da arquitetura falham na suíte da raiz e no `check` do app | sim, cada um com o caso que quebra de propósito | REQ-08, REQ-17 |

Não feito neste esqueleto, e por quê: a guarda local e «Saved earlier»/«No connection» com o prazo de 10 s (REQ-13, TASK-20, depende do `SeriesService` no núcleo, Ref-B); a rota `GET /api/app-config` e «Update to continue» (REQ-14, TASK-21); o roteiro Maestro e `scripts/app-selftest.sh` (TASK-23, sem simulador não há o que rodar); a fonte Syne e os ícones (a rodada de desenho, TASK-18, ainda não houve: as telas seguem `design-system.md` § Celular e `info-arch.md`, sem protótipo julgado).

## UI/UX Design
As telas do esqueleto (entrar, lista de séries, cópia «Saved earlier», «No connection», «Update to continue», autoteste) vêm da rodada de desenho (`mjrp-designing-ui`), a partir do desenho de celular da F76, julgada pelo MJRP antes do código delas. As medidas são as de `design-system.md` § Celular. O sensor visual do projeto compara páginas do site; para o app, os pares são capturas do simulador e do emulador ao lado do protótipo julgado.

## Dependencies
- **Novas, só em `app/`, depois do ADR-0022 e da emenda aceitos:** `expo`, `react-native` (as versões do Expo SDK do dia), `@react-native-firebase/app`, `/auth` e `/firestore`, os pacotes de login com a Apple e com o Google para Expo (a escolher no S2), `expo-crypto`, `posthog-react-native`, Maestro (ferramenta do Mac, não do pacote).
- **No site e no servidor:** nenhuma dependência nova. `shared/` vira pacote de espaço de trabalho do npm, sem biblioteca.
- **Constitution Check:** o app contraria o Art. II (framework de interface), o IV (ponta a ponta com Puppeteer) e o V (publicação por CI/CD sem parada). A decisão registrada é o ADR-0022, e a emenda proposta está em `design/proposals/f78-app-architecture/constitution-amendment.md`. Até ele aceitar, nenhum código em `app/`; os spikes rodam em projetos descartáveis, fora do repositório, e a refatoração do site segue (cabe na constituição de hoje).
- **Fora do código:** Xcode e Android Studio nesta máquina; a conta de desenvolvedor da Apple; a chave do PostHog. Tudo do MJRP (as tarefas em espera).

## Documents Consulted
`AGENTS.md`, `design/proposals/f78-app-architecture/architecture-proposal.md` (§ 4.7, § 5.3, § 6.2, § 8, § 11, § 12, § 13, § 15, § 17), `reports/audits/2026-11-20-mjrpalbumblender-v0-f78-architecture-critique.md`, `docs/specs/constitution.md`, `docs/specs/tech-stack.md`, `docs/specs/prd.md` (EP-10), `ROADMAP.md` (REL-41), `docs/specs/requirements/ep-10-app-nas-lojas/S-60-use-the-album-blender-as-an-app-from-the-store.md`, `docs/decisions/` (0020, 0021), `docs/specs/features/F77-measure-how-the-app-is-used/spec.md`, `docs/specs/features/F75-cd-prices-and-where-to-buy/tasks.md`, `docs/log.md` (2026-11-20 13:44 e 13:45), `shared/`.

Declarações dos documentos de contexto, para o fecho deste marco:
- `docs/specs/constitution.md` — a mudar só se o MJRP aceitar a emenda; quem escreve o texto aceito é ele, ou o agente com o aceite dele no commit
- `docs/specs/arch.md` — a mudar: o núcleo `shared/` com `platform/` e `data/`, as portas, `app/`, a rota `GET /api/app-config`
- `docs/specs/data-model.md` — a mudar: as regras de convivência e o `_schemaVersion` que nunca desce
- `docs/specs/tech-stack.md` — a mudar depois do ADR-0022 aceito: as linhas do app; «Framework de UI — decidido não usar» passa a dizer «no site»
- `docs/specs/design-system.md` — a decidir na rodada de desenho: o que das medidas de celular vai para componentes nativos
- `docs/specs/behavior.md` — a mudar: os quatro desfechos de gravar uma série
- `docs/wiki/` — sem mudança prevista

## Risks & Considerations
Os riscos são os da proposta (§ 3). Este marco **retira**:
- **R1** (o núcleo menos reaproveitável do que se disse): o S1, o S7, a Ref-0, o `coreStaysPortable` e o autoteste do corpo dourado.
- **R2** (duas cópias das regras): a Ref-A e a Ref-B antes da fatia 2, e os sensores.
- **R6** (segredos no aparelho): o `noSecretsInTheApp` e o login no cofre do sistema (S2).
- **R10** (prisão ao Expo): o núcleo não importa nada do Expo; o build pode ser no Mac.
- **R14** (um app antigo apaga campo novo), na parte dos documentos: as regras de convivência e o `_schemaVersion` que não desce; a versão mínima do app.
- **R5** (gravação perdida), em parte: a gravação de séries com conferência e prazo; a gravação que pode esperar (inventário, ranking) fica para as fatias 4 e 6.
- **R7** (custo por pessoa), em parte: o S6 mede, e o `--max-instances` dá o pior caso.

Este marco **não retira**, e diz por quê:
- **R3** (Apple Music no Android): o S4 mede; exportar fica para a fatia 5.
- **R4** (recusa na App Store), **R11** (Spotify), **R12** (regras de `albums/` e `spotify_enrichment/`), **R13** (apagar a conta), **R15** (abuso sem App Check), **R16** (a receita sem fonte de nota): são do marco B, antes do público.
- **R8** (três alvos para uma pessoa): espera a decisão 1 do MJRP.
- **R9** (o desenho da F76 em telas nativas): o S5 mede a lista; o arrastar fica para a fatia 4.

Considerações:
- **Nenhum simulador roda nesta máquina hoje** (sem Xcode, sem Android SDK). Rodam já: o S6, a parte do S1 na linha de comando do Hermes, e toda a refatoração do site. O resto espera a instalação.
- **A ordem do § 15 da proposta vale:** primeiro o que custa minutos (S6), depois o S1 com o S3 e o S7, depois os outros spikes. Um «não» num spike volta à proposta e ao ADR antes de qualquer código em `app/`.
- **A Ref-A não mudou a forma de nenhuma gravação** (resolvido na fatia, 2026-11-20): a contradição entre o § 4.7 e o § 6.2 (nota do § 17) se resolveu pelo menor passo; a mudança de casa (TASK-14) e a regra da versão (TASK-15) estão na Ref-A, e o que mexe na forma de gravar foi para a Ref-B (TASK-17). Ver § Technical Design, «Construído na fatia Ref-A».
- **O tamanho:** 18 REQs e 29 tarefas passam do sinal de tamanho de uma feature. É um marco, e a proposta o ordena em fatias que valem sozinhas; cada fatia do site é publicada sozinha. Partir em features menores é escolha do MJRP.
