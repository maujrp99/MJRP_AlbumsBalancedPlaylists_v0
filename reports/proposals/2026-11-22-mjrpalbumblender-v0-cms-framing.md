# O começo do CMS do Album Blender: o que existe, o que propor, o que decidir

**Data:** 2026-11-22 · **Ramo:** `wip/cms-framing` · **Tipo:** enquadramento (só documentação e análise; nada de código, nada de protótipo)
**Pergunta do MJRP:** «como estamos com a migração agora? podemos começar a criar o CMS?»
**Features que isto enquadra:** o admin com o kit do CMS ([F82](../../docs/specs/features/F82-admin-with-the-cms-kit/spec.md)), as receitas de mistura geridas no CMS ([F92](../../docs/specs/features/F92-blend-algorithms-managed-in-the-cms/spec.md)), as chaves de ligar e desligar features ([F93](../../docs/specs/features/F93-feature-toggles-in-the-cms/spec.md)).

> A linha do React citada aqui é o ramo `integrate/staging-2026-11-21` (ponta `bfcfd7f`), lido com `git show`, sem checkout.

## Resposta curta

- **A migração:** a tela de mistura (onda 7) está na linha do React e na prévia; as exportações (onda 8a) foram julgadas e falta juntar; 8b em construção; depois vêm a limpeza das peças antigas e a decisão do roteador. A decisão que adota o React (ADR-0023) ainda está «Proposta», sem o aceite dele.
- **Começar o CMS:** a parte de **desenho e de arquitetura** pode começar agora. A **construção** espera duas coisas: o fim da migração e o kit do CMS chegar pelo harness. A feature do harness que leva o kit aos projetos (F332) **está só no molde, sem nenhum conteúdo**: é o bloqueio mais escondido.

## 1. O que existe hoje, por trabalho

### 1a. Os textos do site

| | Hoje |
|---|---|
| **Onde moram** | No código. Na linha do React, em dicionários por idioma e área: `public/js/i18n/en/*.js` e `pt/*.js`, **cerca de 1.144 chaves em cada idioma** (o inventário tem 308, os álbuns 187, a página inicial 155). A chave tem a forma `area.peca.nome` e o próprio código diz que ela «é o endereço que o CMS vai editar» (`public/js/i18n/t.js`). A página de entrada tem um dicionário à parte, `public/splash/copy.js` (pt e en), que o build escreve dentro do HTML. |
| **Como o idioma funciona** | O inglês vai no arquivo principal e é a reserva; o português é um arquivo baixado só por quem usa. O português está **fechado ao público** (`openLocales.js` só tem `en`); o dono o vê no próprio navegador com a marca `mjrp.lang.preview = pt`. O `t.js` já tem `registerTexts`, pensado «para o conteúdo publicado pelo CMS». |
| **Quem muda** | Só um agente, editando o arquivo. |
| **Quanto custa uma mudança** | Edição, testes, build e publicação do site (`npm run deploy:site`, só da `main` local). Os textos em português propostos pelos agentes na migração (as centenas de chaves de `pt/*.js`) esperam a revisão dele. |
| **O que ainda está escrito à mão, fora dos dicionários** | Uma busca grosseira acha frases candidatas em cerca de 30 arquivos. As principais: a janela de exportação para o Spotify (`components/SpotifyExportModal.js`, ~16 frases, ainda da onda 8); avisos curtos em controladores (`PlaylistsController.js`, 8); e **frases montadas em inglês dentro de regras** (`models/albumAsk.js`: «This series has no albums.», «Waiting for the ratings of…»), que a tela mostra. O teste dos dicionários (`test/architecture/dictionariesAgree.test.js`) diz com honestidade que não prova que todo texto visível está num dicionário. |

### 1b. As receitas de mistura (o que ele chama de algoritmos)

| | Hoje |
|---|---|
| **Onde moram** | Classes de código em `public/js/algorithms/`, registradas num mapa em `algorithms/index.js`; **a ordem na tela é a ordem do registro**. Quatro receitas: a equilibrada do MJRP e três «Top N» (popularidade no Spotify, aclamação no BestEverAlbums, o ranking da própria pessoa). |
| **Como a tela as desenha** | O nome, a descrição e o selo vêm do dicionário (`blend.recipes.<id>.*`): **já seriam editáveis pelo CMS de textos**. O ícone e as cores vêm de uma tabela fixa por id (`models/recipeLooks.js`); uma receita desconhecida fica cinza com uma nota musical. Quais ingredientes cada receita mostra também é uma tabela por id (`models/recipeIngredients.js`), com os valores de partida (`DEFAULT_CHOICES`: 60 minutos, «auto», por álbum, ranking combinado, Top 3). |
| **Onde roda** | No navegador (o controlador de mistura chama a receita). Nada no servidor. |
| **Um achado útil** | A família «Top N» (`TopNAlgorithm.js`) já é «ordena por uma fonte de ranking, corta as N primeiras, agrupa». «As menos ouvidas» é cortar do fim em vez do começo; «deep cuts» é pular as K primeiras e pegar as seguintes. A popularidade do Spotify por faixa (0 a 100) já existe no modelo da faixa. |
| **Quem muda / custo** | Só código: nova classe, registro, tabela de aparência, tabela de ingredientes, chaves nos dois dicionários, testes, publicação. |

### 1c. As chaves de ligar e desligar

| | Hoje |
|---|---|
| **Discogs** | Interruptor no servidor (`server/lib/valueSources/valueSwitch.js`): ligado só com o token e sem `DISCOGS_VALUES=off`, lido a cada pedido; `DISCOGS_VALUES_FOR` limita a pessoas nomeadas; visitante nunca. O app pergunta em `GET /api/value-sources` e, desligado, não mostra nada do Discogs. **Desligar já não pede publicação de código**, só trocar uma variável do serviço no Cloud Run (que gera uma revisão nova). Mas o código do Discogs no app está espalhado por ~8 arquivos do inventário: some da tela, não do pacote. |
| **Medição de uso (PostHog)** | Interruptor no build (`VITE_USAGE_MEASUREMENT`) e por navegador (`localStorage mjrp.usage`). **É o modelo pronto do que ele pede**: atrás de uma porta única, a biblioteca só é carregada por `import()` com a medição ligada, e um teste segura isso (`usageBehindThePort.test.js`). Hoje ligar exige build. |
| **Quem muda / custo** | Discogs: uma variável do serviço. Medição: um build e uma publicação. |

### 1d. Entrar, papéis e regras do banco

- **Não existe noção de admin.** O servidor só distingue «pessoa com conta» de «visitante» (o login anônimo que o app abre sozinho): `server/lib/auth/verifyIdToken.js` devolve `{ uid, anonymous }`. Não há papel, lista de donos nem atributo no login.
- O servidor **não tem acesso ao Firestore** (não usa o Admin SDK; confere o login à mão).
- As regras do banco (`firestore.rules`) fecham os dados de cada pessoa no dono, mas deixam `albums/` e `spotify_enrichment/` abertos a **qualquer login, visitante incluído** (a constituição, artigo V item 13, já registra isso como «hoje não é verdade»). Coleção sem regra fica fechada por padrão.
- O arquivo de regras é do MJRP: nenhum pipeline o publica (constituição, artigo V item 5).

## 2. O que é o CMS, em um parágrafo

O CMS é **uma área do próprio site, só do dono**, onde ele muda o que o site diz e mostra **sem pedir a um agente nem publicar código**: os textos em português e inglês, quais features estão ligadas, e quais receitas aparecem na mistura e como. Tudo que ele muda é guardado como **conteúdo publicado**, com rascunho, prévia, versão e desfazer; o site lê esse conteúdo ao abrir e, se não conseguir, usa o que veio no código (nunca fica vazio). **Não é, na primeira versão:** um editor de telas ou de layout; um lugar para escrever código; gestão de usuários ou de vários editores; edição das imagens e capas; tradução automática (o kit traz, mas pede um serviço pago no servidor); nem o app de celular.

## 3. A primeira versão e a ordem das seguintes

A hipótese (textos → chaves → receitas → receitas novas) **se sustenta no essencial**, com três ajustes que os fatos pedem:

| Versão | O que entrega | Por quê nesta posição |
|---|---|---|
| **v1 · Textos** | Editar e publicar os textos do app em pt e en, por tela e por área, com prévia no navegador dele, publicar, e desfazer para a versão anterior. A revisão das centenas de frases em português acontece aqui, antes de o português abrir ao público. | O app já está pronto para isto (as chaves são o endereço, `registerTexts` existe, o português já tem prévia só dele). É o trabalho que ele já adiou «pq eu sei que depois posso revisar tudo via cms». **Ajuste 1:** os **nomes e descrições das receitas entram aqui de graça** (já são chaves). **Ajuste 2:** a página de entrada (escrita no HTML pelo build) fica para a v2, porque pede uma leitura própria. |
| **v2 · Chaves e a página de entrada** | A seção de chaves, com duas primeiras: **a medição de uso** (pedido da F82, já modular: desligada, não carrega código) e **o Discogs** (some da tela; deixar de carregar o código vem num conserto próprio). Junto, os textos e os álbuns da página de entrada (o pedido da F82 sobre os álbuns da home). | **Ajuste 3:** a hipótese punha o Discogs primeiro; o fato é que o Discogs **já desliga sem publicar código**, e separá-lo do inventário mexe em ~8 arquivos de uma tela recém-migrada. A medição é o caso pronto da regra «desligada não carrega código». A chave é barata; a modularização é o custo, e vem por feature. |
| **v3 · Receitas: aparecer e configurar** | Ligar e desligar cada receita, a ordem, qual é a recomendada, a aparência (de uma lista fechada de ícones e cores) e os ingredientes de partida. | Pede trocar três tabelas fixas por id (registro, aparência, ingredientes) por configuração lida, com o código atual como reserva. Os textos delas já vieram na v1. |
| **v4 · Receitas novas por blocos** | Criar uma receita escolhendo parâmetros de um motor fixo e testado: fonte do ranking, **do topo ou do fim**, **pular as K primeiras**, quantas por álbum, agrupamento, estrutura. «Deep cuts» e «menos ouvidas» são as duas primeiras. | Depende de ele definir as duas com exemplos. É menor do que parece (o «Top N» já é quase isso), então v3 e v4 podem virar uma entrega só se ele quiser as receitas novas logo. |

## 4. As perguntas de arquitetura que decidem o custo

Cenários de falha que guiam as escolhas: **(R1)** a leitura do conteúdo falha e o site abre sem texto; **(R2)** o site espera o conteúdo e a primeira tela demora; **(R3)** um visitante, que entra anônimo, grava no conteúdo; **(R4)** o dono publica um erro e não sabe voltar; **(R5)** uma feature desligada continua no pacote ou deixa um buraco na tela; **(R6)** uma receita criada no CMS executa algo que ninguém testou; **(R7)** o código do admin vaza para o pacote de todo mundo; **(R8)** duas fontes da verdade para o mesmo texto ou chave discordam.

**4.1 Onde mora o conteúdo editável.**
- **A. Documentos do Firestore lidos ao abrir, com o que vem no código como reserva.** Custo médio; R1 resolvido pela reserva; R2 resolvido se a leitura **nunca segura a primeira tela** (o site abre com o texto do código, aplica o publicado quando chega e o guarda no navegador para a próxima visita). Risco: um piscar de texto na primeira visita depois de uma publicação.
- **B. Arquivos gerados no build.** Zero custo na abertura, mas cada publicação vira build e publicação do site, e **a constituição proíbe isso vindo de fora**: o site só sai da `main` local, por `npm run deploy:site`, e a automação do GitHub não publica (artigo V, item 1). É o modelo dos sites do MJRPpersonal (gravar vira commit, que vira build) e **não serve aqui sem mudar a constituição**.
- **C. Firebase Remote Config.** Feito para chaves, não para 2.300 textos; guarda no navegador por horas por padrão; uma segunda pilha e uma ADR.
- **Recomendação: A**, com um documento público de leitura simples (sem precisar do SDK inteiro, o que também serve à página de entrada) e o servidor lendo as chaves desse mesmo documento, com cache curto. Uma fonte só para textos, chaves e receitas (R8).

**4.2 Quem é admin, e como as regras garantem.**
- **A. O identificador da conta dele fixado nas regras e no servidor** (Google ou Apple, nunca anônimo). Barato; muda pouco. **B. Um atributo de papel no login** (custom claim), que pede o Admin SDK e uma credencial de serviço. **C. Uma lista de admins num documento.** Flexível, mas a lista também precisa de dono.
- **Recomendação: A agora**, com a regra «quem grava no conteúdo tem a conta do dono e não é anônimo» (R3), escrita num teste de segurança como as outras, e **publicada por ele** (a válvula é dele). A lista (C) quando houver um segundo editor.

**4.3 O modelo de publicação.**
- **A. Gravar já publica** (como o kit faz no MJRPpersonal). Simples; R4 alto.
- **B. Rascunho → publicar, com versões.** Ele edita o rascunho e o vê no próprio navegador (como já vê o português hoje); «publicar» copia o rascunho para o publicado e guarda a versão; «desfazer» republica a anterior.
- **Recomendação: B**, com as últimas versões guardadas e a validação na hora de publicar das mesmas regras que o teste dos dicionários aplica no build (mesmos `{marcadores}`, nada vazio, nada de HTML). Pede ao kit um passo «publicar» que ele não tem (o kit publica por build); pela regra dele, a peça nasce no kit.

**4.4 Feature desligada não carrega código.** O site já carrega cada tela sob demanda (`app.js`, `import()` por tela) e a medição já carrega a biblioteca só ligada. **Recomendação:** cada feature com chave vira um módulo atrás de uma porta única, carregado por `import()` só com a chave ligada, e um teste por feature como o da medição (R5). Isso é a proposta de regra «feature desligada não deixa rastro» (NFR-03), ainda pendente dele. Custo por feature, não do CMS; o Discogs é o caro.

**4.5 O que «criar uma receita» pode querer dizer com segurança.**
- **A. Blocos com parâmetros**, interpretados por um motor fixo e testado. **B. Um módulo de código** que um agente escreve e o CMS só liga e configura. **C. Fórmula ou código digitado no CMS.**
- **Recomendação: A, com B como saída** para o que os blocos não cobrirem. **C não**: rodar no navegador de todos um código vindo de um formulário é o R6, e a política de segurança do site já não deixa. O que faltar: faixa sem popularidade é «sem dado», nunca «a menos ouvida» (constituição, artigo I, item 1).

**4.6 O admin: rota do mesmo app ou site à parte.**
- **A. Uma rota `/admin` do mesmo app**, carregada sob demanda, só para o dono. **B. Um site separado**, com hospedagem, login e publicação próprios.
- **Recomendação: A** (é também o que o MJRPpersonal fez: um admin por site, no mesmo deploy), com um teste de que o pacote principal não traz o código do admin (R7). **Atenção:** a constituição diz que a interface fala inglês e reprova português em `public/js` (artigo I, item 2); as telas do admin em português precisam dos textos no dicionário `pt`, como todo o resto, e o kit traz textos padrão em português que o teste vai pegar se o kit ficar dentro de `public/js`.

**4.7 O que precisa existir antes.**
1. **O fim da migração** (ondas 8a e 8b, a limpeza das peças antigas, o roteador) e **o aceite da decisão do React** (ADR-0023, ainda «Proposta»).
2. **Os textos ainda escritos à mão** (seção 1a) levados para os dicionários, incluindo as frases que as regras montam em inglês. Sem isso, a v1 edita quase tudo, mas não tudo.
3. **O kit do CMS chegando pelo harness** (F332, hoje vazia). O kit (`MJRPpersonal/src/admin-kit/`) é React 19 como a linha nova; ele pede ao projeto um esquema, a pele e as portas «ler / gravar tudo de uma vez / imagem / traduzir / publicação». O formato dos textos é diferente (o kit espera pares `{pt, en}` ou chaves soltas por idioma; o V0 tem um arquivo por idioma), então o projeto precisa de um adaptador. O kit pede também **um copy deck** para nascer o esquema, e o V0 não tem um para o app.
4. **Para as receitas:** a tela de mistura migrada na `main` (a onda 7 ainda espera a junção).

## 5. O que só o dono decide (cinco perguntas)

1. **Esperar o kit ou começar sem ele?** Começar já a parte do conteúdo (onde ele mora, quem é admin, publicar e desfazer), que não depende do kit, e esperar o kit só para as telas.
   *Ganha:* a v1 sai assim que o kit chegar, sem retrabalho. *Paga:* precisa pedir ao harness que priorize a extração do kit (F332), que hoje não tem conteúdo; senão o V0 fica parado. **Recomendo:** começar a parte do conteúdo e pedir a F332 ao harness.
2. **Gravar já publica, ou rascunho e depois publicar?**
   *Ganha com rascunho:* revisa as centenas de frases em português sem que ninguém as veja pela metade, e desfaz em um clique. *Paga:* um passo a mais ao publicar, e uma peça nova no kit. **Recomendo:** rascunho → publicar, com desfazer.
3. **Quem é admin?** Só a conta dele (Google ou Apple), fixada nas regras e no servidor.
   *Ganha:* o mais seguro e o mais barato. *Paga:* um segundo editor, um dia, pede trocar a regra. Ele mesmo publica as regras do banco (é a válvula dele). **Recomendo:** só a conta dele agora.
4. **Receitas: só por blocos, e iguais para todos?** Ele cria receitas escolhendo parâmetros; nada de código digitado; todo mundo vê as receitas que ele publicou.
   *Ganha:* nenhum risco de código solto; «deep cuts» e «menos ouvidas» cabem nos blocos. *Paga:* uma ideia que os blocos não cobrem volta a ser código (um agente escreve e o CMS liga). E ele precisa definir as duas com exemplos. **Recomendo:** blocos, para todos.
5. **Chaves: a do Discogs com duas travas, e a regra «feature desligada não carrega código»?** O Discogs só liga se a chave do CMS **e** a variável do serviço estiverem ligadas (a variável fica como corte de emergência); e aceitar a regra proposta (NFR-03).
   *Ganha:* tirar uma feature de produção em segundos, e um site que não carrega o que está desligado. *Paga:* cada feature com chave pede um trabalho de separação; o Discogs é o mais caro (~8 arquivos). **Recomendo:** as duas travas, e aceitar a regra.

## 6. O próximo passo

**Primeiro, a proposta de arquitetura** (`mjrp-designing-architecture`, com a crítica separada): **«o conteúdo publicado»** — onde mora, quem grava, rascunho e versões, como o site e o servidor leem, a reserva do código — cobrindo as decisões 4.1 a 4.3 e 4.6, com os cenários R1 a R8. Ela vale para as três features e decide o custo de todas. Daí saem as ADRs.

**Em paralelo, a rodada de desenho das telas do admin** (comparador num artefato, dentro do design system), dois níveis de ambição:
- **Consolidar:** o kit como ele é — uma lista de áreas, cada uma com os campos em pt e en lado a lado, marcados «falta revisar», e a faixa de publicar e desfazer.
- **Transformar:** editar vendo a tela — escolher a tela do site, clicar no texto e editá-lo ali, com a prévia ao lado.
Ela parte da lista de chaves (o copy deck do app, gerado dos dicionários), não só do protótipo.

**Pode começar agora, sem tocar os arquivos da migração:** a proposta de arquitetura; a rodada de desenho; o copy deck do app (só leitura dos dicionários); a conversa com o harness sobre a F332; a conversa sobre «deep cuts» e «menos ouvidas», com exemplos; as respostas às cinco perguntas.

**Precisa esperar a migração:** qualquer mudança em `t.js`, `app.js`, no roteador, nas telas, em `algorithms/` e na tela de mistura; levar os textos escritos à mão para os dicionários (são os arquivos das ondas 8a e 8b); separar o Discogs do inventário; e as regras do banco (que ele publica).

### Mudanças que proponho nas três specs (não editadas aqui)
- **F82:** o primeiro requisito vira «editar e publicar os textos do app em pt e en sem publicar código, com prévia e desfazer»; a página de entrada e seus álbuns, numa segunda entrega; a dependência da F332 do harness marcada como bloqueio.
- **F92:** separar «aparecer e configurar» (v3) de «criar por blocos» (v4); os nomes e descrições saem dela, porque já vêm com os textos.
- **F93:** a primeira chave é a da medição de uso, a segunda a do Discogs; a regra das duas travas para o Discogs.
