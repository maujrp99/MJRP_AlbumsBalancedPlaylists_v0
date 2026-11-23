<!-- GERADO de docs/specs/constitution.md — não edite aqui: a fonte escrita é docs/specs/constitution.md (PRINCIPLES.md, Parte III). Regenerado em 2026-11-20 (v2.0.0); a v1.0.0 ficou em _archive/2026-11-20-constitution-v1/docs/specs/constitution.md. -->

# Constitution - MJRP_AlbumsBalancedPlaylists_v0

Este projeto segue o `PRINCIPLES.md` do MJRP Harness, versão 1.0 - cópia carimbada na raiz deste projeto (`PRINCIPLES.md`).

> **Origem.** v2.0.0, ratificada pelo MJRP em 2026-11-20, **para esta iteração**: ao item «1. Ler e aceitar a constituição v2.0.0 e o ADR-0022», ele respondeu «1.aceito pra essa iteração» (`docs/log.md`, 2026-11-20 15:16); revisável na próxima iteração. Substitui a v1.0.0 (ratificada em 2025-12-10), que ele julgou envelhecida: «Sobre a constitution pode ser superseded já envelheceu» (2026-11-20). Escrita do que o produto é em 2026-11-20 (site, núcleo, servidor) e do app para iPhone e Android do ADR-0022. A v1.0.0 fica guardada inteira em `_archive/2026-11-20-constitution-v1/docs/specs/constitution.md`; a proposta, com o que ficou de fora do v1.0.0 e por quê, em `design/proposals/f78-app-architecture/constitution-v2.md`.
>
> **Emenda de 2026-11-21 (artigo VI, item 1), decisão do MJRP** («quero os dados persistidos sim e o botão serviria para atualizar valores»; `docs/log.md`, 2026-11-21 21:54): o item mudou de sentido, então a versão sobe para **v3.0.0** (MAJOR, artigo VIII.2); o texto trocado fica guardado inteiro no próprio item (VIII.3). **Não há carimbo de aceite do MJRP sobre a v3.0.0 inteira:** ele decidiu a regra, não ratificou o documento de novo; isso fica para ele.

## O que é da stack deste projeto

- **Tipagem:** TypeScript é permitido no produto, e o app (`app/`) é escrito em TypeScript: decisão do MJRP, 2026-11-20 14:04 («Ignora o sem typescript, podemos ter typescript, creio que devemos inclusive»). O núcleo (`shared/`), o site (`public/`) e o servidor (`server/`) são JavaScript em ES Modules com JSDoc hoje (o servidor em CommonJS). A condição para eles passarem a TypeScript é **recomendação do agente, ainda não confirmada pelo MJRP** (log de 2026-11-20 14:04): por partes, cada passo por um ADR que mostre o caminho de build funcionando: o site constrói com o Vite; o servidor é CommonJS e recebe `shared/` copiado na publicação, sem passo de compilação, então um núcleo em `.ts` precisa antes de uma resposta medida para o servidor. Confere: nenhum `.ts` em `shared/`, `public/` ou `server/` sem o ADR que o permite (revisão; nenhum teste ainda).
- **Tamanho de arquivo:** acima de 200 linhas acende o alarme (sinal, não regra). A store pura fica abaixo de 150 linhas, e as três que passam hoje estão numa lista que só encolhe (`test/architecture/layerBoundaries.test.js`; ADR-0017).
- **Complexidade:** nenhuma função passa de complexidade ciclomática 10, medida pela regra `complexity` do ESLint. Na carga de álbuns e no caminho de `POST /api/generate`, sem exceção; no resto de `public/js`, `server/` e `shared/`, as que passam hoje estão numa lista com o número de cada uma, e a lista só encolhe (`test/architecture/complexityLimit.test.js`, `complexityAllowlist.js`; limite do MJRP, F58, UAT-194).
- **Nomes:** o algoritmo de geração é uma **Recipe**; «Flavor» não se usa (ADR-0015). Princípio, sem teste: os contextos de curadoria terminam em `Series` (`AlbumSeries`, `ArtistSeries`), herdado do v1.0.0.
- **Padrões com endereço** (catálogo `design-patterns`): Store/Observer (`DP-05`) em `public/js/stores/`, só estado (ADR-0017); Repository (`DP-01`) em `public/js/repositories/`, o único adaptador do Firestore; Service Layer (`DP-12`) em `public/js/services/` e `server/lib/services/`, com rota e componente finos (ADR-0016); Strategy (`DP-04`) em `public/js/ranking/` e `public/js/algorithms/`; Facade (`DP-11`) em `server/lib/fetchRanking.js`; Factory por injeção (`DP-02`) em `server/routes/albums.js` (`initAlbumRoutes`, `:23`: a rota recebe os serviços prontos, o que permite trocá-los nos testes); porta e adaptador para a medição (`public/js/services/usage/`, F77). Padrão novo entra aqui com endereço e motivo.
- **Proibições:** framework de interface no site sem ADR (`tech-stack.md`, «Decidido não usar»); código carregado de outro host quando há pacote (`firestoreBehindRepositories.test.js`, `tailwindBuiltWithSite.test.js`); `--no-verify` e qualquer desvio dos hooks pelo agente (válvula do MJRP, `human_valves_guard.py`).
- **Tela e design system:** o CSS, os tokens, as fontes e os componentes compartilhados do design system (`docs/specs/design-system.md`) são portados da referência visual aprovada (o protótipo, ou as exportações do Figma), não reescritos; cortar ou trocar qualquer um deles exige decisão registrada (ADR), nunca um corte calado no tema. A tela se compara com a referência pelo sensor de paridade visual (`sensors.visual`), na tela nova ou alterada depois da adoção do harness (regra do MJRP de 2026-10-18).
- **Requisitos em pt-BR e em inglês:** cada nó em `docs/specs/requirements/` com as seções `## pt-BR` e `## en` (padrão do harness; outra lista de línguas vai no contrato, `mjrp_harness.requirements.languages`).

## Artigos

Os números citados hoje guardam o assunto que tinham no v1.0.0, porque specs e issues os citam por `violates:: [[constitution#N]]` e o sensor do grafo os resolve pelo título. As citações existentes (lidas em 2026-11-20 nos nós de requisito, nas specs e no `uat.md`): `#I` (F52; UAT-23, UAT-24: falha calada), `#II` (UAT-25: Tailwind de outro host), `#IV` (F65; UAT-21: testes), `#V` (F64; UAT-15, UAT-16, UAT-17, UAT-22: publicação, segurança e segredos). Nenhuma cita `#III`. O mapa v1.0.0 → v2.0.0: I → I (o que quem usa vê); II → II (as partes e a pilha); III (documentação, que saiu) → III passa a ser a regra de dependência; IV → IV (testes); V (*Operational Excellence*: publicação e segredos) → V (entrega, operação e segurança, juntas como no v1.0.0); VI a VIII são novos.

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
| Núcleo | `shared/` | JavaScript em ES Modules com JSDoc, sem dependência de motor; usado pelo site e pelo servidor, e pelo app quando ele existir | `albumIdentityRule.test.js`, `trackIdentityRule.test.js`; ADR-0022 |
| Servidor | `server/` | Node 24, CommonJS, Express, contêiner sem estado no Cloud Run; valida com AJV todo dado de fora | ADR-0020; `server/lib/schema.js` |
| App | `app/` | React Native com Expo, TypeScript, `package.json` próprio; Firebase pelo pacote nativo; Swift e Kotlin só onde a plataforma exige (a começar pelo token do usuário do Apple Music) | ADR-0022; MJRP, 2026-11-20 14:04 |

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

### V. Entrega, operação e segurança

**Entrega**


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

**Segurança e segredos**

7. **Segredo só no Secret Manager** (no servidor; `server/.env` em desenvolvimento), **nunca no repositório**: `test/security/noSecretsInRepo.test.js` lê todo arquivo versionado (F65; `PRINCIPLES.md` §I.14).
8. **Agente não lê nem imprime segredo** (o `discogs-token` e os demais; `MEMORY.md`, Do Not Forget, F75). Princípio quanto ao agente: conferido pelo que o log de cada sessão diz, não por teste.
9. **Texto de fora é texto; endereço de fora é conferido:** só por `escapeHtml` numa string de HTML, e só por `safeUrl` num link (`outsideTextEscaped.test.js`, `outsideUrlChecked.test.js`, `test/security/outsideTextIsText.test.js`, `outsideUrlIsChecked.test.js`; F59, UAT-199).
10. **O site publicado não entrega o código-fonte** (sem source maps; `test/security/buildHandsOutNoSource.test.js`; o script de publicação recusa um `.map` em `dist/`).
11. **As rotas que custam respondem só a quem entrou, e até um limite por pessoa;** as rotas de depuração ficam desligadas até alguém as ligar pelo nome (`server/index.js:121`, `server/lib/auth/guards`; `test/server/authGuard.test.js`, `test/server/debugGate.test.js`; F59).
12. **Os dados de uma pessoa são só dela:** as regras do Firestore fecham cada dado pessoal sob o `uid` no seu dono (`test/security/firestoreRules.test.js`, que lê o arquivo).
13. **Vale antes de qualquer conta de fora:** `albums/` e `spotify_enrichment/` fecham (MJRP, decisão 12, 2026-11-20 13:45). **Hoje não é verdade:** `firestore.rules` deixa qualquer pessoa com login, até visitante, ler e gravar nos dois (`arch.md`, *Infrastructure*), e nenhum teste confere isso ainda; o que vai conferir é um caso novo em `firestoreRules.test.js`.
14. **Vale quando `app/` existir:** nada secreto no pacote do app: `app/` e a sua configuração não citam as chaves do servidor, e o build procura padrões de chave no pacote. Teste: `noSecretsInTheApp.test.js`. App Check no Firestore e nas rotas que custam (MJRP, decisão 7, 2026-11-20 13:45); teste: `/api/enrich-album` sem atestado recebe recusa.

### VI. Dados e privacidade

1. **A leitura do Discogs de um álbum é guardada no Firestore, por pessoa e por item,** no documento do item do inventário (o dono lê e grava; artigo V, item 12), **com a data da leitura, a edição usada (id, título e link) e a origem «Discogs»; a atribuição «Data provided by Discogs.», com o link da edição, aparece no computador no cartão (o link «Discogs» da edição, e o aviso da faixa dos totais) e na janela do álbum, e no celular na linha «Data provided by Discogs.» do topo da lista e na folha e na janela do álbum (a linha do celular traz só «Discogs · 18 Nov», sem link, para não apertá-la).** O servidor continua sem guardar o preço depois do pedido; o navegador guarda a leitura até seis horas só como guarda contra perguntar duas vezes seguidas. O que a pessoa escreveu nunca se mistura com a leitura. Decisão do MJRP, 2026-11-21 («quero os dados persistidos sim e o botão serviria para atualizar valores»; «1.a»; F75, REQ-14), **tomada sabendo que os termos do Discogs só puderam ser lidos de segunda mão** (`reports/research/2026-11-21-discogs-terms-on-storing-prices.md`: guardar para uso só dele é incerto; as seis horas são regra de frescor ao mostrar). **Aberto, não resolvido:** um produto com outros usuários precisa da autorização escrita do Discogs antes de guardar e mostrar o preço. Teste: `test/repositories/InventoryRepository.value.test.js` (o repositório grava a leitura, por item, sem tocar no valor escrito). *Regra anterior, trocada em 2026-11-21 por esta decisão (motivo: os termos do Discogs, lidos em 2026-11-20, pareciam não deixar guardar além do necessário nem mostrar com mais de seis horas):* «O preço do Discogs nunca vai ao Firestore e o servidor não o guarda depois do pedido; o navegador o guarda até seis horas (termos do Discogs; F75). Teste: o repositório não tem porta para o preço.»
2. **Os eventos de uso não levam dado pessoal nem texto da pessoa:** cada propriedade é uma contagem ou um valor de conjunto fechado, na lista de `shared/usageEvents.js`; a porta recusa o resto (F77, REQ-03). Teste: `test/shared/usageEvents.test.js`.
3. **Vale quando `app/` existir:** o token do usuário do Apple Music fica no cofre do sistema do aparelho e nunca vai ao Firestore nem ao servidor (proposta, § 6). Verificação: revisão do adaptador de Apple Music do app; nenhum teste nomeado ainda.
4. Quem pode ler e gravar cada dado no Firestore é segurança: artigo V, itens 12 e 13.

### VII. Portões de qualidade

1. **O que um hook recusa** (o agente nunca os pula: `human_valves_guard.py`), entre outras coisas: o `pre-commit` recusa o que o commit acrescenta fora da natureza da pasta, o grafo de requisitos incoerente e o nome de ramo fora da convenção; o `commit-msg` recusa o commit que não traz uma entrada nova em `docs/log.md` (confere o arquivo, não a mensagem); o `pre-merge-commit` cobra a reconferência visual da tela mudada antes de juntar na `main` (`sensors.visual`). Outros portões dos mesmos hooks e sensores (o molde dos arquivos do SDD, a feature «Priorizada», o passo retroativo da via rápida) estão em `mjrp-scripts/hooks/` e `mjrp-scripts/process_sensors.json`.
2. **O que é procedimento, não hook:** rodar `python3 mjrp-scripts/doctor.py .` antes de commitar, sem acrescentar erro (`AGENTS.md`, passo 7). Nenhum hook roda o doctor.
3. **Antes de publicar:** os portões do artigo IV, pelos scripts do artigo V.

### VIII. Como esta constituição muda

1. Só por decisão do MJRP, registrada com as palavras e a data dele numa entrada de decisão do `docs/log.md`. O agente propõe; não aceita.
2. Cada mudança sobe a versão: MAJOR quando um artigo perde ou muda de sentido; MINOR quando se acrescenta uma regra; PATCH quando só a redação muda.
3. O texto substituído fica guardado inteiro, com a data e o motivo na primeira linha.
4. Uma regra marcada «vale quando `app/` existir» passa a valer, sem mudar a versão, no commit que cria `app/`; esse commit traz o teste que ela nomeia.
5. Encolher uma lista de exceções de um teste não muda a constituição; acrescentar uma linha a ela pede o motivo na própria linha.

**Version**: 2.0.0 | **Proposta**: 2026-11-20 | **Ratificada**: 2026-11-20, MJRP, para esta iteração («1.aceito pra essa iteração») | **Substitui**: 1.0.0 (2025-12-10)

## O que NÃO vai aqui

Stack (qual framework/linguagem) e quem-faz-o-quê vivem no contrato de instância (`.mjrp-project.yml` -> `stack:`, `tools:`, `models:`); a lista de tecnologias com versão, em `docs/specs/tech-stack.md`; a estrutura, em `docs/specs/arch.md`; o porquê de cada escolha, nos ADRs.
