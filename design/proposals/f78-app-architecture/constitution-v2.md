---
type: constitution-proposal
feature: F78
status: proposta
written: "2026-11-20"
decides: MJRP
supersedes: docs/specs/constitution.md v1.0.0 (2025-12-10)
---
# Constitution v2.0.0 — proposta

> **Proposta — aguarda a leitura e o aceite do MJRP.** Nada aqui está em vigor. A constituição v1.0.0 (`docs/specs/constitution.md`) continua no lugar, sem mudança, até ele aceitar este texto, mudá-lo ou recusá-lo. A última seção diz o que muda no dia do aceite.
>
> **Por que existe.** Ao receber a proposta de emenda (`constitution-amendment.md`), o MJRP disse, em 2026-11-20 14:03: «Sobre a constitution pode ser superseded já envelheceu». Isso autoriza escrever a substituta, não a aceita. Sobre a tipagem, às 14:04: «Ignora o sem typescript, podemos ter typescript, creio que devemos inclusive». E, sobre o app, às 13:44 e 13:45: «Vc consegue seguir sua recomendação da f78 e construir a app registrando tudo conforme nosso pdlc?» e «Recomendação sua da proposta».
>
> **Como foi escrita.** Pelo modelo e pelo guia da skill `mjrp-designing-architecture` (`templates/constitution.md`, `reference/constitution-guide.md`): a primeira linha declara a herança; o resto é regra da stack, escrita do que o código já é (lido em 2026-11-20 na `main` `3d16d2c`), mais o app que o ADR-0022 propõe. Cada regra diz a fonte (um ADR, um teste, uma decisão do MJRP com a data) e como se confere. O que nada confere está marcado **princípio**. O que só passa a ser conferível quando a pasta `app/` existir está marcado **«vale quando `app/` existir»**, com o teste que vai conferir. A lista das tecnologias mora em `docs/specs/tech-stack.md`, a estrutura em `docs/specs/arch.md`, as decisões em `docs/decisions/`.
>
> **Língua.** Português, como o modelo da skill (o v1.0.0 guardava os artigos em inglês, como ratificados; este texto não tem nada ratificado a preservar). Nomes de código e de arquivo ficam como estão.

O texto que entra em `docs/specs/constitution.md` no dia do aceite começa na linha abaixo e vai até «O que NÃO vai aqui».

---

# Constitution - MJRP_AlbumsBalancedPlaylists_v0

Este projeto segue o `PRINCIPLES.md` do MJRP Harness, versão 1.0 - cópia carimbada na raiz deste projeto (`PRINCIPLES.md`).

> **Origem.** v2.0.0, aceita pelo MJRP em [data do aceite], substitui a v1.0.0 (ratificada em 2025-12-10), que ele julgou envelhecida: «Sobre a constitution pode ser superseded já envelheceu» (2026-11-20). Escrita do que o produto é em 2026-11-20 (site, núcleo, servidor) e do app para iPhone e Android do ADR-0022. A v1.0.0 fica guardada inteira em [local do texto substituído].

## O que é da stack deste projeto

- **Tipagem:** TypeScript é permitido no produto (MJRP, 2026-11-20 14:04). O app (`app/`) é escrito em TypeScript. O núcleo (`shared/`), o site (`public/`) e o servidor (`server/`) são JavaScript em ES Modules com JSDoc hoje (o servidor em CommonJS); cada um pode passar a TypeScript por partes, cada passo por um ADR que mostre o caminho de build funcionando: o site constrói com o Vite; o servidor é CommonJS e recebe `shared/` copiado na publicação, sem passo de compilação, então um núcleo em `.ts` precisa antes de uma resposta medida para o servidor. Confere: nenhum `.ts` em `shared/`, `public/` ou `server/` sem o ADR que o permite (revisão; nenhum teste ainda).
- **Tamanho de arquivo:** acima de 200 linhas acende o alarme (sinal, não regra). A store pura fica abaixo de 150 linhas, e as três que passam hoje estão numa lista que só encolhe (`test/architecture/layerBoundaries.test.js`; ADR-0017).
- **Complexidade:** nenhuma função passa de complexidade ciclomática 10, medida pela regra `complexity` do ESLint. Na carga de álbuns e no caminho de `POST /api/generate`, sem exceção; no resto de `public/js`, `server/` e `shared/`, as que passam hoje estão numa lista com o número de cada uma, e a lista só encolhe (`test/architecture/complexityLimit.test.js`, `complexityAllowlist.js`; limite do MJRP, F58, UAT-194).
- **Nomes:** o algoritmo de geração é uma **Recipe**; «Flavor» não se usa (ADR-0015). Princípio, sem teste: os contextos de curadoria terminam em `Series` (`AlbumSeries`, `ArtistSeries`), herdado do v1.0.0.
- **Padrões com endereço** (catálogo `design-patterns`): Store/Observer (`DP-05`) em `public/js/stores/`, só estado (ADR-0017); Repository (`DP-01`) em `public/js/repositories/`, o único adaptador do Firestore; Service Layer (`DP-12`) em `public/js/services/` e `server/lib/services/`, com rota e componente finos (ADR-0016); Strategy (`DP-04`) em `public/js/ranking/` e `public/js/algorithms/`; Facade (`DP-11`) em `server/lib/fetchRanking.js`; porta e adaptador para a medição (`public/js/services/usage/`, F77). Padrão novo entra aqui com endereço e motivo.
- **Proibições:** framework de interface no site sem ADR (`tech-stack.md`, «Decidido não usar»); código carregado de outro host quando há pacote (`firestoreBehindRepositories.test.js`, `tailwindBuiltWithSite.test.js`); `--no-verify` e qualquer desvio dos hooks pelo agente (válvula do MJRP, `human_valves_guard.py`).
- **Tela e design system:** o CSS, os tokens, as fontes e os componentes compartilhados do design system (`docs/specs/design-system.md`) são portados da referência visual aprovada (o protótipo, ou as exportações do Figma), não reescritos; cortar ou trocar qualquer um deles exige decisão registrada (ADR), nunca um corte calado no tema. A tela se compara com a referência pelo sensor de paridade visual (`sensors.visual`), na tela nova ou alterada depois da adoção do harness (regra do MJRP de 2026-10-18).
- **Requisitos em pt-BR e em inglês:** cada nó em `docs/specs/requirements/` com as seções `## pt-BR` e `## en` (padrão do harness; outra lista de línguas vai no contrato, `mjrp_harness.requirements.languages`).

## Artigos

Os números I, IV e V guardam o assunto que tinham no v1.0.0 (a experiência, os testes, a entrega), porque features fechadas os citam por `violates:: [[constitution#N]]` e o sensor do grafo os resolve pelo título.

### I. O que quem usa vê

1. **Nenhuma falha calada.** O que não pôde ser sabido nunca é respondido como «não tem». O servidor responde em duas formas só: `200 { data, outcome }`, com `outcome` sempre presente (`found`, `not_found`, `no_ratings`, `no_value`, `not_configured`), ou `4xx/5xx { error: { code, retryable } }`; nenhuma mensagem de fornecedor vai no corpo (`server/lib/outcome.js`, `test/server/outcome.test.js`; F52). Nenhum `catch` vazio no servidor fora da lista com motivo, que só encolhe, e nenhum `catch` que só escreve no log no caminho de `/api/generate` e `/api/enrich-album` (`test/architecture/noSwallowedFailure.test.js`). Fonte: `PRINCIPLES.md` §I.8.
2. **A interface fala inglês.** Nenhum texto de `public/js` em português, fora da lista de nomes próprios (`test/architecture/interfaceInEnglish.test.js`; F63, UAT-192). **Vale quando `app/` existir:** o mesmo para o app, pela mesma verificação estendida a `app/`.
3. **Uma aba, um título; um dono do histórico.** Só `BaseView.setTitle` escreve o título (`oneTabTitle.test.js`); só o roteador escreve o histórico do navegador, fora da lista que só encolhe (`historyOwnedByRouter.test.js`; F63); uma tela deixada não ouve mais store nenhuma (`viewLifecycle.test.js`; F73).
4. **O celular não toca o computador.** Toda regra das folhas do celular fica dentro de `@media (max-width: 767px)`, a mesma consulta de `PHONE_QUERY` (`phoneStylesStayOnThePhone.test.js`; F76, REQ-12).
5. **Pronto é quando o MJRP diz que está pronto.** Fonte: `PRINCIPLES.md` §I.10. Confere: o aceite dele na UAT (`docs/specs/uat.md`).

### II. As partes do produto e a pilha de cada uma

| Parte | Onde | Pilha | Fonte |
|---|---|---|---|
| Site | `public/` | JavaScript em ES Modules com JSDoc, SPA com rotas pela History API, Vite, variáveis CSS e Tailwind compilado com o site; Firebase Hosting | `tech-stack.md`; `tailwindBuiltWithSite.test.js`; ADR-0021 (Proposed) |
| Núcleo | `shared/` | JavaScript em ES Modules com JSDoc, sem dependência de motor; usado pelo site e pelo servidor, e pelo app quando ele existir | `albumIdentityRule.test.js`, `trackIdentityRule.test.js`; ADR-0022 (Proposed) |
| Servidor | `server/` | Node 24, CommonJS, Express, contêiner sem estado no Cloud Run; valida com AJV todo dado de fora | ADR-0020; `server/lib/schema.js` |
| App | `app/` | React Native com Expo, TypeScript, `package.json` próprio; Firebase pelo pacote nativo; Swift e Kotlin só onde a plataforma exige (a começar pelo token do usuário do Apple Music) | ADR-0022 (Proposed); MJRP, 2026-11-20 14:04 |

1. Cada parte usa a pilha da sua linha. Trocar, somar ou tirar uma tecnologia é um ADR primeiro, depois a linha de `tech-stack.md` (nota CM-0071 do harness).
2. **Vale quando `app/` existir:** o app não traz uma segunda pilha de interface para o site, e o site não adota a do app sem ADR.

### III. A regra de dependência e onde moram as regras do produto

1. **No site, a tela chega aos dados só pelo serviço:** View → Controller → Service → Repository; nenhuma view, componente ou controller importa repositório ou Firebase; nada importa `app.js` (`layerBoundaries.test.js`; ADR-0016).
2. **A store só guarda estado:** não importa serviço, repositório, cache, API nem Firebase (`layerBoundaries.test.js`; ADR-0017).
3. **Um Firebase, e o Firestore só atrás dos repositórios:** o SDK vem do pacote, nunca de um endereço, e só os repositórios e `firebase-init.js` o importam (`firestoreBehindRepositories.test.js`; `PRINCIPLES.md` §I.3).
4. **Uma regra, um lugar.** «É o mesmo álbum» e «é a mesma faixa» são regras puras em `shared/`, que o site e o servidor perguntam (`albumIdentityRule.test.js`, F55; `trackIdentityRule.test.js`, F74). A carga de álbuns tem um dono, que toda tela pergunta (`screensLoadThroughTheService.test.js`, `albumLoadBoundaries.test.js`; ADR-0019, Proposed). Um classificador, um caminho de busca do artista, um seletor de álbuns (`oneAlbumPicker.test.js`, F57). Um caminho pergunta a popularidade ao Spotify (`spotifyPopularityOnePath.test.js`, F69). O ranking próprio e as playlists guardadas têm as suas fronteiras (`ownRankingBoundaries.test.js`, `savedPlaylistsBoundaries.test.js`, F61). A medição tem uma porta, e só o adaptador conhece a biblioteca (`usageBehindThePort.test.js`, F77).
5. **Nada morto.** Todo módulo de `public/js`, `shared/` e `server/` é alcançável de um ponto de entrada; o que só os testes importam está morto (`noDeadModules.test.js`; F65).
6. **Onde mora uma regra: núcleo ou servidor.** Precisa de segredo, raspa um site, custa por chamada ou precisa de limite por pessoa → servidor. Funciona sem rede, responde ao toque, ou é a mesma decisão nos dois lados → núcleo. Na dúvida, núcleo (proposta da F78, § 4.3). Princípio: conferido na revisão do plano, não por teste.
7. **Vale quando `app/` existir — tudo aponta para o núcleo, e o núcleo não aponta para ninguém** (ADR-0022; proposta, § 4.3 e § 11):
   - `shared/` não importa navegador, React, React Native, Expo, Firebase, `fetch` nem PostHog; fora de `shared/platform/`, não usa `crypto.`, `Intl.`, `toLocale`, `localeCompare`, `.normalize(`, `URLSearchParams` nem `structuredClone`; nenhum `import` de `shared/` sai de `shared/`. Teste: `coreStaysPortable.test.js`, sem lista de exceções.
   - Os caminhos e o formato dos documentos moram em `shared/data/`, que recebe as funções do Firestore de fora; `shared/models`, `algorithms` e `ranking` não importam `shared/data/`. Teste: `coreStaysPortable.test.js`.
   - `app/` não importa `public/`, e `public/` não importa `app/`. Teste: `appAndSiteApart.test.js`.
   - As regras do produto moram em `shared/`, nunca em `app/`: `app/` não tem pasta `models`, `algorithms`, `ranking` nem `repositories`; fora das telas, nenhum arquivo de `app/` passa do limite de complexidade; nenhum trecho de mais de 30 linhas copiado de `shared/`. Teste: `appAndSiteApart.test.js` e o detector de cópia (proposta, § 11). Limite dito: nenhum deles pega uma regra reescrita com outras palavras; isso é da revisão.
   - O site ainda guarda regras em `public/js/models`, `algorithms` e `ranking`; elas passam para `shared/` uma pasta por vez, na ordem em que o app precisa, e uma regra que chegou a `shared/` não ganha cópia em `public/` (proposta, § 4.4).

### IV. Testes

1. **Vitest** para o código de `public/js`, `shared/` e `server/` (`vitest.config.js`).
2. **Os testes de arquitetura e de segurança são portões.** Os de `test/architecture/` e `test/security/` rodam com a suíte; uma lista de exceções num deles só encolhe, e uma linha que deixou de ser verdade falha também. A suíte roda na CI (`.github/workflows/ci.yml`: `npx eslint . --quiet` e `npx vitest run`) e nos scripts de publicação, que não publicam com ela vermelha (`docs/manual/00_Deployment_and_Setup.md` § 2.2).
3. **Tela criada ou mudada é vista num navegador de verdade** antes de ser dada como pronta (`PRINCIPLES.md` §I.12; `AGENTS.md`, passo 4). Ponta a ponta automático do site: ainda não existe; é o NFR-01 (Backlog).
4. **Vale quando `app/` existir:** os testes do núcleo rodam uma segunda vez em ambiente `node`, sem `jsdom` (100% passam); o ponta a ponta do app é com **Maestro**, no simulador do iPhone e no emulador do Android; e o **corpo dourado** (o núcleo dá no app a mesma saída, byte a byte, que no site, sobre a mesma amostra) roda antes de cada versão do app, e o roteiro de publicação do app recusa publicar sem ele (proposta, § 11; ADR-0022).

### V. Entrega

1. **Site e servidor saem da `main` local, como está commitada**, por um caminho só: `npm run deploy:site` e `npm run deploy:server`; não há outro, e a automação do GitHub não publica (`docs/manual/00_Deployment_and_Setup.md` § 2; F64).
2. **Cada feature pronta e testada vai para produção sozinha** (MJRP, 2026-11-19 15:03: «cada Feature feita deveria ser testar e ir pra prod»). Publicar o servidor ou as regras do banco, o agente confirma com o MJRP (mesma entrada do log).
3. **Quando o contrato entre site e servidor muda, o servidor sai primeiro** (`arch.md`, «Uma regra só para dizer que é a mesma faixa», ordem de publicação; plano da F68).
4. **Voltar atrás:** o site pelo histórico do Hosting; o servidor pela revisão anterior do Cloud Run, que o script mostra antes de publicar (`docs/manual/00_Deployment_and_Setup.md` § 2.3).
5. **`firestore.rules` é do MJRP:** nenhum pipeline o publica (`arch.md`, *Infrastructure*).
6. **Vale quando `app/` existir — o app sai pelas lojas e não se desfaz** (ADR-0022; proposta, § 6.2; MJRP, decisão 9, 2026-11-20 13:45):
   - as respostas de `/api` só crescem: a versão anterior do app continua aceitando;
   - os documentos do Firestore só crescem: quem grava, grava só os campos que mudaram e devolve como veio o campo que não conhece; `_schemaVersion` nunca desce; quem lê um número maior abre só para leitura;
   - tirar ou renomear um campo: primeiro sobe a versão mínima, depois se tira;
   - o servidor diz a versão mínima do app por plataforma (`GET /api/app-config`, pública); abaixo dela o app pede a atualização.
   Testes: `oldWriterKeepsNewFields.test.js` e o teste de contrato que guarda as respostas de `/api` e os documentos de cada versão publicada do app (proposta, § 11). A regra de gravar só os campos que mudaram vale também para o site, a partir da fatia Ref-A (hoje o `BaseRepository` regrava o documento num caminho).

### VI. Dados e privacidade

1. **Os dados de uma pessoa são só dela:** as regras do Firestore fecham cada dado pessoal no seu dono (`test/security/firestoreRules.test.js`, que lê o arquivo). `albums/` e `spotify_enrichment/` fecham antes de qualquer conta de fora (MJRP, decisão 12, 2026-11-20 13:45).
2. **O preço do Discogs nunca vai ao Firestore** e o servidor não o guarda depois do pedido; o navegador o guarda até seis horas (termos do Discogs; F75). Teste: `test/repositories/InventoryRepository.value.test.js` (o repositório não tem porta para o preço).
3. **Os eventos de uso não levam dado pessoal nem texto da pessoa:** cada propriedade é uma contagem ou um valor de conjunto fechado, na lista de `shared/usageEvents.js`; a porta recusa o resto (F77, REQ-03). Teste: `test/shared/usageEvents.test.js`.
4. **Vale quando `app/` existir:** o token do usuário do Apple Music fica no cofre do sistema do aparelho e nunca vai ao Firestore nem ao servidor (proposta, § 6). Verificação: revisão do adaptador de Apple Music do app; nenhum teste nomeado ainda.

### VII. Segurança e segredos

1. **Segredo só no Secret Manager** (no servidor; `server/.env` em desenvolvimento), **nunca no repositório**: `test/security/noSecretsInRepo.test.js` lê todo arquivo que o git guarda (F65; `PRINCIPLES.md` §I.14).
2. **Agente não lê nem imprime segredo** (o `discogs-token` e os demais; `MEMORY.md`, Do Not Forget, F75). Princípio quanto ao agente: conferido pelo que o log de cada sessão diz, não por teste.
3. **Texto de fora é texto; endereço de fora é conferido:** só por `escapeHtml` numa string de HTML, e só por `safeUrl` num link (`outsideTextEscaped.test.js`, `outsideUrlChecked.test.js`, `test/security/outsideTextIsText.test.js`, `outsideUrlIsChecked.test.js`; F59, UAT-199).
4. **O site publicado não entrega o código-fonte** (sem source maps; `test/security/buildHandsOutNoSource.test.js`; o script de publicação recusa um `.map` em `dist/`).
5. **As rotas que custam respondem só a quem entrou, e até um limite por pessoa;** as rotas de depuração ficam desligadas até alguém as ligar pelo nome (`test/server/authGuard.test.js`, `test/server/debugGate.test.js`; F59).
6. **Vale quando `app/` existir:** nada secreto no pacote do app: `app/` e a sua configuração não citam as chaves do servidor, e o build procura padrões de chave no pacote. Teste: `noSecretsInTheApp.test.js`. App Check no Firestore e nas rotas que custam (MJRP, decisão 7, 2026-11-20 13:45); teste: `/api/enrich-album` sem atestado recebe recusa.

### VIII. Portões de qualidade

1. **Antes do commit:** os hooks do repositório (`mjrp-scripts/hooks/pre-commit`, `commit-msg`) recusam o que o commit acrescenta fora da natureza da pasta, o grafo de requisitos incoerente, o nome de ramo fora da convenção e a mensagem sem a entrada do log; o agente nunca os pula (`human_valves_guard.py`). `python3 mjrp-scripts/doctor.py .` roda antes de commitar, e o commit não acrescenta erro (`AGENTS.md`, passo 7).
2. **Antes de juntar na `main`:** a reconferência visual da tela mudada (`pre-merge-commit`, `sensors.visual`).
3. **Antes de publicar:** os portões do artigo IV, pelos scripts do artigo V.

### IX. Como esta constituição muda

1. Só por decisão do MJRP, registrada com as palavras e a data dele numa entrada de decisão do `docs/log.md`. O agente propõe; não aceita.
2. Cada mudança sobe a versão: MAJOR quando um artigo perde ou muda de sentido; MINOR quando se acrescenta uma regra; PATCH quando só a redação muda.
3. O texto substituído fica guardado inteiro, com a data e o motivo na primeira linha.
4. Uma regra marcada «vale quando `app/` existir» passa a valer, sem mudar a versão, no commit que cria `app/`; esse commit traz o teste que ela nomeia.
5. Encolher uma lista de exceções de um teste não muda a constituição; acrescentar uma linha a ela pede o motivo na própria linha.

**Version**: 2.0.0 | **Proposta**: 2026-11-20 | **Aceita**: [pendente: MJRP] | **Substitui**: 1.0.0 (2025-12-10)

## O que NÃO vai aqui

Stack (qual framework/linguagem) e quem-faz-o-quê vivem no contrato de instância (`.mjrp-project.yml` -> `stack:`, `tools:`, `models:`); a lista de tecnologias com versão, em `docs/specs/tech-stack.md`; a estrutura, em `docs/specs/arch.md`; o porquê de cada escolha, nos ADRs.

---

## O que ficou de fora do v1.0.0, e por quê

- **Art. I, «premium, dynamic, polished», «curated color palettes, micro-animations», «no generic styles»:** aspiração que nada confere. O que se confere ficou: o design system portado da referência e a paridade visual (stack), o celular que não toca o computador (I.4).
- **Art. II, «Vanilla Javascript … Tailwind only if requested»:** substituído pela tabela do artigo II (TypeScript permitido, decisão de 2026-11-20 14:04; Tailwind compilado com o site, ADR-0021).
- **Art. III inteiro** (`DEBUG_LOG.md` para todo conserto, `implementation_plan.md` aprovado, «Known Issues» só no DEBUG_LOG, os três manuais como fonte única): o processo passou ao harness (`PRINCIPLES.md` §I.10: spec → plan → tasks; as issues em `docs/specs/uat.md`). Mantê-lo daria duas fontes para a mesma regra.
- **Art. IV, «Spec-First (See `.specify/templates/`)», «Manual Verification plans», «E2E Tests (Puppeteer)»:** o ciclo SDD é do harness; a verificação em navegador ficou (IV.3); Puppeteer nunca entrou no repositório, e o ponta a ponta do site é o NFR-01.
- **Art. V, «Zero-downtime deployments via CI/CD»:** não descreve o projeto: a publicação sai da máquina do MJRP e a CI só testa (V.1). «Logs must be meaningful and accessible»: princípio sem verificação; a parte conferível é I.1.
- **Technology Standards, «Mobile-first responsiveness»:** substituído pela camada do celular da F76 (I.4).
- **Governance, «All Pull Requests and Design Docs must align»:** substituído pelos portões do artigo VIII e pelo artigo IX.

## Uma pergunta aberta ao MJRP

**O núcleo (`shared/`) passa a TypeScript agora, ou fica em JavaScript com JSDoc até o primeiro marco do app?** Agora: tipos compartilhados pelo site, pelo app e pelo servidor desde o primeiro dia; custo: o caminho de build do servidor (CommonJS, que recebe `shared/` copiado sem compilar) tem de mudar antes, e isso não foi medido. **Recomendação:** ficar em JavaScript com JSDoc até os spikes da F78 (S1 e S2) terminarem, e então decidir por um ADR com o caminho do servidor medido.

## O que muda no dia em que for aceita

Nada disto foi feito: é a lista para quem aplicar o aceite.

**1. A constituição.** `docs/specs/constitution.md` passa a ter o texto entre as duas linhas acima, com a data do aceite na «Origem» e no rodapé. O espelho gerado `.specify/memory/constitution.md` é regenerado da fonte (o doctor, I5, recusa uma cópia divergente; o cabeçalho «GERADO de docs/specs/constitution.md» fica).

**2. Onde guardar a v1.0.0.** Guardar a história dentro do arquivo (`## History`) não serve aqui: o sensor do grafo leria os títulos «I.», «IV.», «V.» antigos como artigos vigentes. Convenção proposta: a dos ADRs, que ficam inteiros e marcados como substituídos, num arquivo à parte. O texto inteiro vai para `_archive/<data do aceite>-constitution-v1/docs/specs/constitution.md`, no molde de `_archive/2026-10-30-october-reconstruction/docs/` (a regra de estrutura do harness diz: «o aposentado vai para _archive/», e `docs/archive/` é pasta aposentada, `structure_rules.json`, `retired_folders`), com a primeira linha «Substituída em [data] pela v2.0.0 (`docs/specs/constitution.md`): o MJRP a julgou envelhecida, «Sobre a constitution pode ser superseded já envelheceu»». A cópia ainda mais antiga, `docs/CONSTITUTION.md` (o v1.0.0 original, em inglês, de antes do harness), **não se move nem ganha linha**: `VISION.md:5`, `ROADMAP.md:11` e `docs/specs/prd.md:5` a citam como fonte, pelo número da linha («CONSTITUIÇÃO:NN»), e uma linha nova no topo deslocaria todas as citações. Ela já está fora da natureza de `docs/` (aviso W9 do doctor desde 2026-10-28); onde ela mora é uma decisão à parte. A «Origem» da v2 aponta para a pasta guardada.

**3. Os sensores que leem a constituição, e o que cada um precisa.**
- `canonical_catalog.json` (item `constitution`): o título `# Constitution` no começo de uma linha. A v2 o tem.
- `_doctor_docs.py` (I5): a herança do `PRINCIPLES.md`, em `AGENTS.md` ou na constituição. Os dois a têm.
- `_doctor_kernel.py` (I5): o espelho `.specify/memory/constitution.md` gerado e igual à fonte. Regenerar no mesmo commit.
- `requirements_graph_check.py` (`constitution_article_exists`): resolve `violates:: [[constitution#N]]` pelo título que começa com `N`. Citam artigos: `docs/specs/features/F52-server-album-generation-back/spec.md:28` (`#I`), `F64-one-tested-way-to-production/spec.md:32` (`#V`), `F65-remove-what-nothing-uses/spec.md:32` (`#IV`). A v2 mantém os títulos I, IV e V com o mesmo assunto (a experiência sem falha calada, a entrega, os testes), então o sensor continua verde e o sentido se mantém; as três specs são história e não mudam.
- Nenhum script lê o número da versão nem a linha «Version».

**4. As citações vivas dos artigos antigos** (regra em uso; a trocar pela citação da v2):
- `docs/specs/tech-stack.md:14` «a decisão de não usar framework é do Art. II» → artigo II e «Decidido não usar»; `:46` (Framework de UI, «Art. II … é preferência») → «no site», com o ADR-0022 (ver item 5); `:49` «JavaScript puro em ES Modules, Vite e variáveis CSS; Tailwind só se pedido — Constituição, Art. II» → a regra de tipagem e o artigo II; `:52` e `:53` («*Technology Standards*») → artigo II; `:54` «Constituição, Art. V» (segredos) → artigo VII. E as linhas do app (Expo, React Native, TypeScript, React Native Firebase, Maestro), com [[ADR-0022]].
- `docs/specs/arch.md:4` (o Art. III, «Known Issues») → retirar a citação: o artigo saiu; `:77` («constituição, *Padrões com endereço*») → continua valendo (a seção ficou); `:97` (Art. V, dados abertos) → artigo VI; `:105` (Art. V, segredos) → artigo VII; `:107` (Art. V, estabilidade) → artigo VII; `:110`, `:111`, `:112` («*Technology Standards*», «*Backend*») → artigo II; `:132` («JavaScript puro, sem framework (constituição, Art. II)») é seção de proposta já construída: história, fica.
- `docs/specs/features/F78-album-blender-app-for-iphone-and-android/plan.md:34` (Constitution Check: «contraria o Art. II, o IV e o V») → «cumpre a constituição v2.0.0»; e `tasks.md:55` («o texto da emenda que o MJRP aceitar») → feito pelo próprio aceite.
- `docs/specs/requirements/nfr/NFR-01-…md:13` e `:21` («Origem: … `constitution.md` Art. IV»): origem histórica; fica.

**5. Os ADRs** (não se reescreve ADR aceito; os propostos mudam antes do aceite):
- **ADR-0022** (Proposed): a decisão tem de dizer que o app é escrito em TypeScript (já acrescentado em 2026-11-20, depois da decisão das 14:04), e a consequência «The constitution (Art. II, IV and V) does not allow this as written … amendment» passa a «Accepted together with constitution v2.0.0». A linha de `tech-stack.md` «Framework de UI — decidido não usar» passa a «no site».
- **ADR-0021** (Proposed) cita «Art. II … "only if requested"» (`:16`, `:32`): o artigo deixa de existir; a citação fica como o contexto em que ele foi escrito, e o aceite dele passa a se apoiar no artigo II da v2.
- ADR-0015, 0016, 0017, 0020 (aceitos) não citam artigo: nada muda.

**6. O resto.** `design/proposals/f78-app-architecture/constitution-amendment.md` fica como o registro de por que a emenda virou substituição. `AGENTS.md` não muda (aponta para `docs/specs/constitution.md`). `.mjrp-project.yml` (`constitution@2: 2026-10-28`) é a versão do modelo do harness, não a desta constituição: não muda.

## A frase que o aceite pede

- Para esta constituição: «Aceito a constituição v2.0.0 como está em `design/proposals/f78-app-architecture/constitution-v2.md`» (ou o que mudar nela).
- Para o ADR-0022: «Aceito o ADR-0022» (ou o que mudar nele).
