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
- **A Ref-A pega também a gravação** (a troca do `setDoc` e as transações), não só os `import` e o construtor: a contradição entre o § 4.7 e o § 6.2 (nota do § 17) se resolve partindo a Ref-A em duas tarefas, a mudança de casa e as regras de convivência.
- **O tamanho:** 18 REQs e 29 tarefas passam do sinal de tamanho de uma feature. É um marco, e a proposta o ordena em fatias que valem sozinhas; cada fatia do site é publicada sozinha. Partir em features menores é escolha do MJRP.
