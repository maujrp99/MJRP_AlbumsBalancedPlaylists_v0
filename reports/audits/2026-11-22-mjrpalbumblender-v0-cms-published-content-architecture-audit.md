---
type: architecture-audit
subject: "proposta de arquitetura · o conteúdo publicado do CMS (F82, F92, F93) — reports/proposals/2026-11-22-mjrpalbumblender-v0-cms-published-content-architecture.md @ wip/cms-architecture-proposal 893fbd2"
project: MJRP_AlbumsBalancedPlaylists_v0
feature: [F82, F92, F93]
moment: decision
judged: "2026-11-22 20:43"
who_judged: separate-agent
verdict: can-go
p0: 0
p1: 9
p2: 9
hygiene_notes: 7
human_decisions: 3
status: open
supersedes: "none"
---

# Architecture audit — o conteúdo publicado do CMS · 2026-11-22 20:43

> Momento: decisão (proposta de arquitetura, antes de qualquer ADR).
> Objeto: a proposta (§ 1–17) em `wip/cms-architecture-proposal` @ 893fbd2. Contexto conferido no código: `firestore.rules` (main = linha do React, idênticos), `server/` (main), `server/lib/valueSources/valueSwitch.js`, e na linha do React (`integrate/staging-2026-11-21` @ c4daddf, por `git show`): `public/js/i18n/t.js`, `public/js/react-bridge/useLocale.ts`, `public/js/app.js`, `public/js/utils/prefetchScreens.js`, `vite.config.js`, `scripts/bundle-budget.json`, `public/js/algorithms/`, `public/splash/copy.js`, `public/splash/lang.js`, `public/splash.html`, `public/index.html` (as políticas de conteúdo); `test/security/firestoreRules.test.js`, `test/architecture/noDeadModules.test.js`, `test/architecture/coreStaysPortable.test.js`, `shared/`; `docs/specs/constitution.md`, `docs/specs/tech-stack.md`.
> Critérios: as regras técnicas de `docs/wiki/harness/architecture-review.md` (IDs com nome), `engineering-canon`, `PRINCIPLES.md`, `constitution.md`.
> Quem julgou: agente separado — só a skill `mjrp-critiquing-architecture`, o cânone e os artefatos; não escreveu a proposta.
> Não conferido: `VISION.md`, `docs/specs/prd.md`, `info-arch.md`, `arch.md`, `data-model.md` e o enquadramento `2026-11-22-...-cms-framing.md` não foram lidos por inteiro (cobertura das necessidades de tela, AD-02, julgada só sobre o i18n e as receitas); `scripts/publication-budget.mjs` não foi executado (o peso do leitor é estimativa).
> Auditoria anterior: nenhuma sobre este objeto. Sem código; camadas e dependências são as declaradas.
> As decisões do dono (Painel primeiro; salvar publica sem rascunho nem desfazer; só a conta dele é admin; chaves a começar pelo Discogs; receitas no CMS com «Deep cuts» e «As menos ouvidas» por blocos; começar já o que não depende do kit) **não foram reabertas**: julga-se se a proposta as honra e o que custam.

## Veredito

**Pode ir ao humano para a aprovação (P0: 0), mas não como está:** nove P1, em quatro temas, mudam o que ele está decidindo e devem ser corrigidos antes de levar a proposta a ele — sobretudo os dois primeiros temas, que tocam a decisão 1 (quem grava) e a decisão 3 (o que uma chave faz sem leitura).
- **Segurança sem sensor que prove:** 2, 3 — a página de entrada (fatia 2) é um quarto leitor sem barreira e com `innerHTML`, e a política de conteúdo dela bloqueia a leitura; o teste das regras lê o arquivo como texto e não pode provar «só o dono grava».
- **Cache e falha calada:** 1, 7, 9 — a cópia guardada não tem idade máxima nem é apagada quando o documento some, então as chaves «fechadas sem leitura» ficam, na prática, na última posição lida (inclusive ligadas), o «voltar atrás apagando o documento» não chega a quem já visitou, e um texto publicado recusado pelo leitor de cada visitante (por exemplo, depois de uma publicação que muda a reserva) volta ao código sem que o dono saiba.
- **Contratos e duplicação:** 4, 5 — o `t()` não tem uma camada «publicado» (a ordem de chegada decide quem vence, e o aviso de «textos mudaram» não redesenha as telas em React); o intérprete de blocos em `shared/recipes` seria um segundo motor de «Top N» ao lado de `public/js/algorithms` e `ranking`.
- **Escopo e evolução:** 6, 8 — a fatia 0 põe na `main` módulos que nenhum ponto de entrada importa (o portão `noDeadModules` recusa) e o intérprete sem usuário até a fatia 4; as leituras sem login (servidor, página de entrada) colidem com o App Check no Firestore já escrito na constituição (V.14).

O aceite é do humano (proposta) e, depois, do aceitante da rota do ADR.

## Vetos

| Veto | Resposta | Evidência (uma linha) |
|---|---|---|
| VT-01 banco compartilhado | passa | `published/*`, `cmsAdmins/*`, `cmsWork/*` são coleções novas com um só escritor (o repositório do conteúdo, pelo Painel); nenhuma coleção existente ganha escritor novo (§ 6.1, § 8) |
| VT-02 cadeia síncrona sem timeout | passa | leitura do site fora do caminho síncrono da primeira tela, prazo 3 s, reserva = código; servidor 1,5 s e cópia de 60 s (§ 5, § 7) |
| VT-03 mensageria sem DLQ | não se aplica | não há fila nem mensagem |
| VT-04 sem traces | não se aplica | um servidor só; o salto novo é servidor → Firestore (armazenamento gerenciado, fora do caminho de cada pedido por 60 s), não um segundo serviço próprio — o mesmo critério das auditorias de 2026-10-28, F78 e F83. Gatilho: um segundo serviço próprio no fluxo |
| VT-05 mutação destrutiva de schema | passa | `_schemaVersion` que não desce (regra `keepsSchemaVersion()` já existe em `firestore.rules`), leitor que ignora o desconhecido, campo tirado por *expand and contract* (§ 6.1). O custo de coordenação com as regras está no achado 12 |
| VT-06 SDK de terceiro no domínio | passa | `shared/content` e `shared/recipes` sem Firebase (F-9); o SDK e a leitura REST no repositório. Ressalva no achado 15: `shared/` também proíbe `fetch` |

## Achados

| # | Regra | Sev | O achado, em uma linha | Dono |
|---|---|---|---|---|
| 1 | RS-03 Comportamento de caches | P1 | a cópia guardada não tem idade máxima nem regra para «documento não existe»: chave declarada «fechada sem leitura» fica ligada se a última cópia dizia ligada; apagar `published/*` não chega a quem já visitou | mjrp-designing-architecture · corrigir agora |
| 2 | MA-05 Modelagem de ameaças | P1 | a página de entrada (fatia 2) é um quarto leitor: `lang.js` escreve com `innerHTML`, as capas são endereços vindos do banco, a proposta não diz que esse script valida nem usa `safeUrl`, e a política de conteúdo de `splash.html` bloqueia `firestore.googleapis.com` | mjrp-designing-architecture · corrigir agora |
| 3 | GV-03 Guias são caros, sensores são baratos | P1 | F-4 promete «0 gravações aceitas», mas `firestoreRules.test.js` lê o arquivo como texto: não prova `get(cmsAdmins)`, `sign_in_provider`, `hasOnly`, tamanhos nem `rev` | mjrp-designing-architecture · corrigir agora |
| 4 | AD-02 Contratos e fronteiras | P1 | `registerTexts` é mescla «quem chega por último vence»: o dicionário português, que chega depois, apaga os textos publicados em português; e `useLocale` só redesenha quando o idioma muda | mjrp-designing-architecture · corrigir agora |
| 5 | IV-05 ETC e DRY | P1 | o intérprete de blocos em `shared/recipes` reescreve a seleção «Top N» que já mora em `public/js/algorithms` e `ranking` (o núcleo não pode importá-los), com regra diferente para faixa sem dado | mjrp-designing-architecture · corrigir agora |
| 6 | MA-01 Simplicidade e prontidão | P1 | a fatia 0 põe na `main` módulos puros sem importador (intérprete, catálogo, registro, adaptador): `noDeadModules.test.js` falha e o script de publicação recusa; o intérprete fica sem usuário até a fatia 4, condicionada à decisão 4 | mjrp-designing-architecture · corrigir agora |
| 7 | IV-08 Sem falha silenciosa | P1 | texto publicado recusado pelo leitor de cada visitante só aparece no console do visitante; e o servidor responde Discogs «off» igual para «desligado» e «não consegui ler a chave» (constituição I.1) | mjrp-designing-architecture · corrigir agora |
| 8 | MA-03 Evolução e reversibilidade | P1 | as leituras sem login (servidor por REST, página de entrada) param quando o App Check do Firestore for ligado (constituição V.14, decisão 7 do dono) — colisão não nomeada, sem gatilho | mjrp-designing-architecture · corrigir agora |
| 9 | AD-05 Escrutínio das consequências | P1 | a chave `usageMeasurement` fechada sem leitura faz a primeira tela de todo visitante novo deixar de ser medida — o contrário do que a F77 garante hoje (`app.js`: «started before the first route, so the first screen is measured») | humano · decisão do humano (dentro da decisão 3) |
| 10 | DD-02 Concorrência e conflitos | P2 | o conflito por `rev` vive só na transação do cliente; as regras não exigem `rev == anterior + 1` | mjrp-designing-architecture · corrigir agora |
| 11 | MA-05 Modelagem de ameaças | P2 | `updatedBy` publica o uid do admin num documento que o mundo lê (o argumento que derrubou a opção A); nomes de chaves revelam features ainda fechadas | mjrp-designing-architecture · corrigir agora |
| 12 | CM-03 Evolução de schemas | P2 | com `keys().hasOnly` nas regras, todo campo novo exige que o dono publique as regras antes do Painel gravá-lo — a ordem não está escrita | mjrp-designing-architecture · corrigir agora |
| 13 | MA-04 FinOps e economia unitária | P2 | a seção de custo foi tirada; a conta de leituras por visita contra a cota gratuita é curta e não está | mjrp-designing-architecture · corrigir agora |
| 14 | MA-07 Complexidade estrutural sem ciclos | P2 | F-3 não cobre a lista de pré-carga de `app.js`; o registro das features é um ponto de que todas as telas dependem — precisa ficar só dado | mjrp-designing-architecture · vigiar |
| 15 | IV-03 Dependency Rule e DIP | P2 | `shared/` proíbe `fetch` (`coreStaysPortable`): a leitura REST tem de ser recebida de fora pelo repositório em `shared/data`; a proposta não diz | mjrp-designing-architecture · corrigir agora |
| 16 | AD-04 Ciclo de vida do dado | P2 | `previous` guarda só a última gravação e ninguém o lê na v1: a volta é edição manual no console — dizer isso na decisão 2 | mjrp-designing-architecture · corrigir agora |
| 17 | GV-03 Guias são caros, sensores são baratos | P2 | «decisão 4 antes da fatia 4» é promessa sem sensor; o caso novo de `firestoreRules.test.js` previsto em V.13 é o sensor natural | mjrp-designing-architecture · corrigir agora |
| 18 | RS-04 Runtime e conexões | P2 | numa instância nova do Cloud Run a chave «nunca lida» = desligada: o Discogs some para o dono a cada partida a frio até a primeira leitura | mjrp-designing-architecture · corrigir agora |

### 1 · RS-03 Comportamento de caches · P1
- **Âncora:** § 5 (sequência e «Sem rede: o guardado, ou o código»), § 6.4 (coluna «Se o conteúdo não pode ser lido»), § 7 (primeira linha), § 14 («Voltar atrás: … apagando o documento»).
- **Evidência:** o leitor aplica a cópia guardada antes da primeira tela e, se a leitura falha, «fica com o guardado». Não há idade máxima da cópia, nem distinção entre «falhou» e «o documento não existe». A tabela de § 6.4 declara Discogs, medição e português «fechadas» quando o conteúdo não pode ser lido — mas com uma cópia antiga que dizia «ligada», a chave fica ligada indefinidamente (um visitante com rede bloqueada, ou que volta depois de semanas, abre já com a feature carregada). O cenário de qualidade de § 2 mede só «visitante novo»; o visitante que volta vê a feature desligada pelo menos na primeira abertura depois do desligamento (o `import()` já correu antes da leitura nova chegar). E o «voltar atrás» de § 14 (apagar o documento) deixa cada visitante antigo com o texto e as chaves da última cópia.
- **Critério:** também IV-08 Sem falha silenciosa (o estado «guardado há N dias» não é distinguido de «publicado agora»).
- **Custo se ficar:** a promessa do dono, «facilmente tirar features de prod», só vale para quem nunca visitou; a primeira vez que ele desligar algo por um problema, os visitantes recorrentes continuam com o problema. Barato agora (uma regra no leitor); caro depois que a forma da cópia guardada estiver em milhares de navegadores.
- **Check de aceite:** Um visitante cuja cópia guardada tem uma chave ligada, e cuja leitura falha ou volta «não existe», termina com essa chave no padrão declarado dentro de uma idade máxima escrita, e uma chave que a cópia diz desligada nunca é ligada antes da leitura nova — com teste? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (a decisão entre «a cópia só pode desligar» e «as chaves esperam a leitura nova» é do designer; apresentar ao dono dentro da decisão 3).

### 2 · MA-05 Modelagem de ameaças · P1
- **Âncora:** § 6.2 (fatia 2, «um script pequeno, depois do load… troca os textos e as capas»), § 9 (política de conteúdo), § 6.3 (as três barreiras).
- **Evidência:** a página de entrada escreve os textos com `el.innerHTML = t(key, lang)` (`public/splash/lang.js:52`, linha do React), e o comentário de `copy.js` diz «text or HTML». As três barreiras de § 6.3 não cobrem esse script: as regras não conferem o conteúdo de cada texto (a própria proposta diz isso), e a barreira 3 é «o leitor de cada visitante» do app; o script novo da página é um quarto leitor e a proposta não diz que ele roda o validador do núcleo, que escreve por `textContent`, nem que as capas (endereços vindos do banco) passam por `safeUrl` (constituição V.9). Além disso, a política de `public/splash.html` tem `connect-src 'self' https://cdn.jsdelivr.net` e `img-src 'self' data: https://is1-ssl.mzstatic.com`: a leitura de `firestore.googleapis.com` é bloqueada, e capas de outro endereço também (a afirmação de § 9 vale só para `index.html`).
- **Critério:** constituição V.9 «Texto de fora é texto; endereço de fora é conferido».
- **Custo se ficar:** um texto salvo com marcação (erro do dono, ou a conta dele comprometida) vira código rodando na página pública mais vista, sem nenhuma barreira; e a fatia 2, como escrita, não funciona (bloqueada pela política).
- **Check de aceite:** O script da página de entrada valida cada texto com o mesmo validador do núcleo, escreve só por `textContent`, confere cada endereço por `safeUrl`, e `splash.html` libera só o endereço da leitura — com um teste que injeta `<img onerror>` num texto publicado e prova que nada vira elemento? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (ou tirar as capas da fatia 2).

### 3 · GV-03 Guias são caros, sensores são baratos · P1
- **Âncora:** § 11, linha F-4; § 8 (a regra recomendada); § 2, cenário «Só o dono grava».
- **Evidência:** `test/security/firestoreRules.test.js` diz no cabeçalho «This reads the file as text; it does not run the rules». Um teste de texto não prova que convidado, outra conta e admin anônimo são recusados, que `get(/cmsAdmins/$(uid)).data.role == 'super'` é avaliado, que `request.auth.token.firebase.sign_in_provider != 'anonymous'` existe, nem que `hasOnly`/tamanhos/tipos recusam — e R3 é o único risco de impacto «muito alto». O projeto não tem o emulador das regras (`@firebase/rules-unit-testing`); acrescentá-lo é tecnologia nova (constituição II.1: ADR e linha de `tech-stack.md`).
- **Critério:** a regra (só o dono grava) é a decisão 1 do dono; sem sensor ela é guia.
- **Custo se ficar:** a primeira publicação de regras com um erro de lógica (um `||` no lugar de `&&`, um `match /{document=**}` mais largo) abre o conteúdo que vai ao ar para todos, e só se descobre em produção. As regras são publicadas à mão por ele (V.5), sem portão.
- **Check de aceite:** Existe um teste que roda as regras (emulador) e prova recusados: convidado anônimo, outra conta Google, a conta dele com login anônimo, gravação em `cmsAdmins/*` por qualquer um, campo fora da lista, `_schemaVersion` descendo — e aceito só o admin? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (o emulador como dependência de desenvolvimento entra no ADR e em `tech-stack.md`).

### 4 · AD-02 Contratos e fronteiras · P1
- **Âncora:** § 5, último item («A peça que falta na linha do React… uma mudança pequena num arquivo»); § 9 «Muda».
- **Evidência:** `registerTexts(locale, entries)` faz `texts[locale] = { ...texts[locale], ...entries }`; `loadDictionary('pt')` chama `registerTexts('pt', pt)` quando o português chega (assíncrono). Se o leitor aplica a cópia guardada do português «antes da primeira tela» (§ 5), o dicionário do código, que chega depois, sobrescreve os textos publicados. E `useLocale` é `useSyncExternalStore(subscribe, getLocale)`: o instantâneo é a string do idioma, então avisar «os textos mudaram» com o mesmo idioma não redesenha nenhuma tela em React. A mudança é em dois arquivos (`t.js` e `useLocale.ts`) e no modelo: falta uma camada «publicado» que vença o código independentemente da ordem de chegada, e uma versão dos textos no instantâneo.
- **Custo se ficar:** o português publicado some para quem fala português, de forma intermitente (depende da corrida); o texto novo não aparece até mudar de tela — o «piscar» medido na fatia 1 seria outro.
- **Check de aceite:** O contrato do `t()` tem camadas com precedência fixa (publicado > código, por idioma) que não dependem da ordem de chegada, e um texto publicado que chega com a tela aberta redesenha as telas em React e as feitas à mão — com teste dos dois? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (cabe na fatia 1; a proposta deve descrever o contrato, não «um aviso»).

### 5 · IV-05 ETC e DRY · P1
- **Âncora:** § 6.5 (quadro «É dado / Fica código»: «um motor de seleção por ranking (a família Top N generalizada)»; «O intérprete é uma função pura no núcleo (`shared/recipes/`)»).
- **Evidência:** a seleção «Top N» vive hoje em `public/js/algorithms/TopNAlgorithm.js` (+ Popular, Acclaimed, User) com as estratégias de `public/js/ranking/`. A constituição III.7 proíbe `shared/` de importar fora de `shared/`, então o intérprete em `shared/recipes` reimplementa ordenar, cortar e agrupar. As regras já divergem: o bloco diz «faixa sem dado sempre fora» e «desempate pela ordem no álbum»; o `TopNAlgorithm` usa `rankingStrategy.rank(album)` e `slice(0, N)`, com o comportamento da estratégia para faixa sem dado. «Top 3 Popular» do código e a mesma receita feita por blocos dariam faixas diferentes, e nenhum teste da proposta compara os dois.
- **Critério:** constituição III.4 «Uma regra, um lugar» e III.7 («uma regra que chegou a `shared/` não ganha cópia em `public/`»).
- **Custo se ficar:** dois motores que se separam a cada conserto; o custo de mover `TopN*` e `ranking` para `shared/` (a ordem que III.7 já prevê) não está contado na fatia 0.
- **Check de aceite:** Existe uma só implementação da seleção por ranking, e cada receita «Top N» do código é a mesma que a sua expressão em blocos, com um teste de equivalência na amostra fixa? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (escolher: mover o motor para `shared/` e reescrever as receitas do código como blocos fixos, ou o intérprete chamar o motor existente; contar o custo).

### 6 · MA-01 Simplicidade e prontidão · P1
- **Âncora:** § 14, fatia 0; § 6.6 «Antes do kit».
- **Evidência:** a fatia 0 entrega «`shared/content`, `shared/recipes` (validador e intérprete), o repositório, o catálogo e o registro como modelos puros, o adaptador» e diz «não precisa da migração». Na `main`, nada importa o catálogo, o registro, o adaptador nem o intérprete (as telas que os usam são da linha do React e do kit). `test/architecture/noDeadModules.test.js` («a module only the tests import is dead… do not commit it yet»; «KEPT_ON_PURPOSE… never for code to be wired later») falha, e o portão IV.2 impede publicar. O intérprete só ganha usuário na fatia 4, que depende da decisão 4.
- **Critério:** constituição III.5 «Nada morto». A decisão do dono «começar já o que não depende do kit» é honrada se a fatia 0 se limitar ao que entra ligado.
- **Custo se ficar:** a fatia 0 não chega à `main`, ou chega com uma exceção que a regra proíbe; o formato do intérprete fica fixado antes do construtor de blocos ser visto pelo dono.
- **Check de aceite:** Todo módulo que a fatia 0 leva à `main` tem um importador a partir de um ponto de entrada (o servidor para a leitura da chave e o validador; nada mais), e o intérprete e o catálogo entram com a fatia que os usa? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (recortar a fatia 0: regras + teste no emulador + `shared/content` usado pelo servidor + a leitura da chave do Discogs).

### 7 · IV-08 Sem falha silenciosa · P1
- **Âncora:** § 6.3 (barreira 3), § 7 (linhas «leitura do site» e «leitura do servidor»), § 6.4 (Discogs: «nunca lida = desligada»).
- **Evidência:** (a) quando a barreira 3 troca um texto publicado pela reserva (por exemplo, uma publicação do site acrescentou `{count}` à reserva inglesa), o motivo fica no log do navegador de cada visitante; o dono, que é quem precisa saber, não vê — a proposta diz que o Painel mostra «órfão» para chave renomeada, mas não «recusado pela reserva atual». (b) O servidor: com a chave do CMS desconhecida, `discogsSwitch` devolve `off` e `GET /api/value-sources` responde `{ discogs: 'off' }` — a mesma resposta de «desligado»; só o log distingue. A constituição I.1 pede que «o que não pôde ser sabido nunca é respondido como não tem».
- **Custo se ficar:** uma publicação de código desfaz, sem aviso, textos que o dono publicou; o dono vê o valor do Discogs sumir sem saber se foi a chave ou a leitura.
- **Check de aceite:** O dono vê (no Painel, ou no script de publicação que valida os `published/texts_*` vivos contra a reserva do build) cada texto publicado que a versão atual recusa, e o servidor responde um estado distinto para «chave desconhecida»? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 8 · MA-03 Evolução e reversibilidade · P1
- **Âncora:** § 6.4 («O servidor lê o documento público pela leitura REST do Firestore, sem login nem credencial nova… Não ganha o Admin SDK»), § 6.2, § 12 (a leitura simples serve aos três).
- **Evidência:** a constituição V.14 (decisão 7 do dono, «vale quando `app/` existir») pede App Check no Firestore. Com o App Check imposto no Firestore, pedidos sem atestado são recusados — o servidor (REST sem credencial) e o script da página de entrada param de ler, e o site precisa mandar o atestado na leitura REST. A proposta não nomeia essa colisão nem o gatilho. Há um caminho sem credencial nova que sobrevive a ela (a conta de serviço do Cloud Run com credenciais padrão), não comparado.
- **Custo se ficar:** a chave do Discogs vira «nunca lida = desligada» para sempre no dia em que o App Check for ligado, e a página de entrada volta ao texto do build — descoberto em produção.
- **Check de aceite:** A proposta nomeia o App Check como gatilho, diz o que cada um dos três leitores faz quando ele for imposto, e o ADR registra isso? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (nomear e escolher; a troca pode ficar adiada com gatilho).

### 9 · AD-05 Escrutínio das consequências · P1
- **Âncora:** § 6.4, linha `usageMeasurement` («fechada (privacidade)»); § 13, decisão 3.
- **Evidência:** hoje a medição começa antes da primeira rota (`app.js`, linha da linha do React: «Started before the first route, so the first screen is measured»). Com a chave fechada quando desconhecida, o visitante novo (sem cópia guardada) não é medido até a leitura chegar; a primeira tela de toda primeira visita sai da medição. A decisão 3 diz o custo do Discogs («some do inventário até voltar»), não este.
- **Custo se ficar:** o funil de aquisição perde o seu primeiro passo, sem que o dono tenha escolhido isso.
- **Check de aceite:** A decisão 3 diz ao dono que, com a medição fechada sem leitura, a primeira tela de todo visitante novo não é medida, e ele escolheu? S/N
- **Dono · recomendação:** humano · decisão do humano — «medição sem leitura: fechada (perde a primeira tela de quem chega) ou segue a variável do build (como hoje)».

### 10 · DD-02 Concorrência e conflitos · P2
- **Âncora:** § 6.3 (fluxo e «Dois aparelhos»).
- **Evidência:** a revisão é conferida só na transação do Painel; as regras (barreira 2) não exigem `request.resource.data.rev == resource.data.rev + 1`, que elas podem conferir.
- **Custo se ficar:** um segundo caminho de gravação (o console, uma versão antiga do Painel) apaga sem conflito.
- **Check de aceite:** As regras recusam uma gravação de `published/*` cujo `rev` não é o anterior + 1, com teste no emulador? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 11 · MA-05 Modelagem de ameaças · P2
- **Âncora:** § 6.3 (`updatedBy`), § 6.1 (`published/site` lido por todos), § 8 opção A.
- **Evidência:** `updatedBy` grava o uid do admin num documento que qualquer pessoa lê sem login — o mesmo dado que, na opção A, era contra («o uid fica no repositório»). As chaves `portugueseForAll` etc. dizem a quem lê o que ainda não abriu; `previous` mostra o texto anterior.
- **Custo se ficar:** pouco (o uid sozinho não grava nada), mas contradiz o argumento da decisão 1.
- **Check de aceite:** O documento público não carrega identificador de pessoa (o `updatedBy` vai a `cmsWork/*`), e a proposta diz o que um leitor anônimo aprende de `published/*`? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 12 · CM-03 Evolução de schemas · P2
- **Âncora:** § 6.1 (expand and contract), § 6.3 («as regras: … os campos permitidos»), § 9 (`firestore.rules` publicado por ele).
- **Evidência:** regras com a lista fechada de campos tornam cada campo novo uma mudança em dois tempos com uma etapa manual dele (V.5): regras primeiro, Painel depois. A proposta não escreve a ordem.
- **Check de aceite:** A ordem «regras publicadas antes do Painel que grava o campo novo» está escrita, e o Painel diz «as regras ainda não aceitam este campo» em vez de falhar calado? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 13 · MA-04 FinOps e economia unitária · P2
- **Âncora:** cabeçalho («Fora: 10 custo com número»).
- **Evidência:** a conta cabe numa linha e não está: 2 leituras por abertura (`published/site` + `texts_<idioma>`, mesmo num pedido só), +1 ao abrir o Blend, +1 por conferência de admin, +1 `get()` por gravação nas regras, servidor ≤ 1.440 por dia por instância. A cota gratuita é 50.000 leituras por dia, dividida com o uso atual.
- **Check de aceite:** A proposta diz as leituras por visita e a partir de quantas visitas por dia a cota gratuita acaba? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 14 · MA-07 Complexidade estrutural sem ciclos · P2
- **Âncora:** § 11, F-3 e F-5; § 4 (registro das features).
- **Evidência:** a pré-carga em segundo plano (`prefetchScreensAfterTheFirstScreen(router, [loadStart, …])` em `app.js`) baixa os importadores da lista; F-3 confere que só `app.js` importa o admin, não que ele fique fora dessa lista; F-6 marca «suíte», mas pedidos de rede de um build só se veem no navegador. O registro é um ponto central: estável só se guardar dados (id, padrão, importador).
- **Check de aceite:** F-3 confere que o importador do admin e os das features com chave não estão na lista de pré-carga, e o registro não tem lógica de feature? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · vigiar.

### 15 · IV-03 Dependency Rule e DIP · P2
- **Âncora:** § 4 («Repositório do conteúdo (`shared/data/PublishedContentRepository` …) lê por uma chamada de leitura simples»).
- **Evidência:** `coreStaysPortable.test.js` proíbe `fetch` em todo `shared/`; III.7 diz que `shared/data` recebe as funções do Firestore de fora.
- **Check de aceite:** O repositório em `shared/data` recebe a função de leitura (REST ou SDK) de fora, e `coreStaysPortable` passa sem exceção? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (uma frase).

### 16 · AD-04 Ciclo de vida do dado · P2
- **Âncora:** § 6.3 («A rede mínima»), § 13 decisão 2.
- **Evidência:** `previous` guarda o anterior só das chaves da última gravação; na v1 ninguém o lê; voltar é abrir o console e copiar valores de um mapa. Com duas gravações seguidas, o primeiro erro já não tem volta. É coerente com «sem histórico» do dono, mas a decisão 2 vende «o anterior na mesma gravação» como rede sem dizer quanto ela cobre.
- **Check de aceite:** A decisão 2 diz que o `previous` cobre só a última gravação e que a volta é manual no console? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 17 · GV-03 Guias são caros, sensores são baratos · P2
- **Âncora:** § 13 decisão 4; § 14 fatia 4 («decisão 4 antes»); R11.
- **Evidência:** a condição é texto; a constituição V.13 já prevê o caso novo em `firestoreRules.test.js` que confere `spotify_enrichment/` fechado.
- **Check de aceite:** Um teste das regras falha enquanto convidado puder gravar em `spotify_enrichment/`, e a fatia 4 não sai com ele vermelho? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 18 · RS-04 Runtime e conexões · P2
- **Âncora:** § 6.4, § 7 (leitura do servidor).
- **Evidência:** `discogsSwitch(env, user)` é síncrona; com a chave do CMS lida a cada 60 s por instância e «nunca lida = desligada», cada instância nova responde «off» até a primeira leitura terminar, se o pedido não esperar por ela.
- **Check de aceite:** Numa instância nova, o primeiro pedido espera a leitura da chave até 1,5 s antes de responder? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

Não se aplica: VT-03, VT-04 (acima); DD-01 Transacionalidade entre limites (uma gravação toca um documento); DD-03 Volume e particionamento (leituras por id, sem consulta); CM-01 Idempotência e RS-02 Retries (sem fila; a leitura não repete); RS-01 Contrapressão (sem produtor contínuo); AD-03 SPOFs mapeados como achado próprio (nenhum processo novo: o mesmo servidor; o Firestore já era ponto único e tem a reserva do código).

## O que está bom, manter
- O código continua a reserva completa e o documento guarda só o que difere: a leitura falhar nunca deixa tela sem texto, e a chave órfã é inofensiva.
- Validação chave por chave no leitor, contra a reserva do código: um texto ruim não derruba o documento; uma versão antiga do cliente, com a reserva antiga, recusa o texto que não casa (o «validador antigo em cache» degrada para o código, não para a chave crua).
- Ler sem esperar (F-1 com medida), fora do caminho síncrono; a opção D (servidor entrega) bem recusada pela partida a frio.
- O Discogs com o servidor como autoridade (o site pergunta ao servidor, a rota de valores recusa quando desligado), a variável como corte de emergência e «para quem» fora do documento público.
- `cmsAdmins/{uid}` criado no console, com `role`: sem uid no repositório, sem credencial nova, vira papéis sem reescrita. Hoje as regras não têm curinga na raiz nem `match /{path=**}`: o padrão é recusar, então nenhuma conta grava `published/*` ou `cmsAdmins/*` por outro caminho — manter assim e usar sempre caminho absoluto no `get()`/`exists()`.
- O login não anônimo é exigível nas regras (`request.auth.token.firebase.sign_in_provider`).
- O vocabulário fechado dos blocos, com limites, sem `shuffle`, desempate fixo e «sem dado sempre fora»: superfície pequena e determinística; ids nunca reaproveitados.
- O peso: +2.000 B gzip no script principal para leitor + validador de textos + lista de chaves + decodificador REST é plausível (a margem hoje é 150 B; a linha do orçamento precisa subir declarada, como a proposta diz).
- Os vetos respondidos antes da crítica e as funções de aptidão F-1…F-11 com limite e lugar.

## Análise estrutural

| Componente | Camada (declarada) | Observação / achado |
|---|---|---|
| `shared/content` (formatos, validadores) | Entidades | portátil (F-9); 15 |
| `shared/recipes` (intérprete) | Entidades | segundo motor: 5; sem usuário na fatia 0: 6 |
| repositório do conteúdo (`shared/data` + `public/js/repositories`) | Adaptadores | `fetch` recebido de fora: 15; App Check: 8 |
| leitor do conteúdo (`services/content`) | Casos de uso | cache: 1; silêncio: 7; contrato do `t()`: 4 |
| registro das features | Casos de uso | 14 |
| catálogo de receitas | Casos de uso | 5, 6 |
| Painel `/admin` | Interface | 14 |
| script da página de entrada | Interface (fora do app) | 2 |
| leitura da chave no servidor | Adaptador do servidor | 7, 8, 18 |
| `firestore.rules` | Infraestrutura | 3, 10, 12 |

Direção das dependências: nada aponta para fora no declarado; o risco é o intérprete precisar do que mora em `public/` (achado 5).

| Tecnologia | Detalhe ou núcleo? | Custo de trocar | Vazou? |
|---|---|---|---|
| Firestore REST (leitura sem login) | detalhe | baixo agora, alto depois do App Check | 8 |
| emulador das regras (falta) | ferramenta de teste | — | 3 |

## Recomendações
1. Corrigir agora, antes de levar ao dono: 1, 2, 3 (decisões 1 e 3 dependem deles), depois 4, 5, 6, 7, 8.
2. Corrigir agora, junto: 10, 11, 12, 13, 15, 16, 17, 18.
3. Vigiar: 14.

## Higiene da decisão
- AD-06 Premissas verdadeiras: § 9 «connect-src já libera `*.googleapis.com`» vale para `index.html`, não para `splash.html` (achado 2). § 5 «uma mudança pequena num arquivo» — são dois (`t.js`, `useLocale.ts`) e um modelo de camadas (achado 4). — o designer.
- AD-06: § 2 «o servidor não acessa o Firestore hoje» é verdade (`tech-stack.md` linha 28), e a proposta muda isso; § 16 não diz. — o designer.
- AD-13 Arquivos impactados: faltam `public/splash.html` (política), `public/splash/lang.js`, `public/js/react-bridge/useLocale.ts`, `docs/specs/tech-stack.md` (servidor lê o Firestore; o emulador), `package.json` (emulador), `test/architecture/noDeadModules.test.js` (ou o recorte da fatia 0). — o designer.
- AD-14 Restrições respeitadas: III.5 «Nada morto», III.7 (`shared/` sem `fetch`; nenhuma cópia de regra em `public/`), I.1 (estado distinto no servidor) e V.14 (App Check) não são nomeados; o conteúdo técnico está nos achados 6, 15, 5, 7, 8. — o designer.
- AD-10 Premissa mais arriscada: «uma leitura sem login de `published/*` continuará possível para os três leitores» sustenta § 12 e não tem teste cedo nem gatilho (achado 8). — o designer.
- AD-12 Nada aplicado antes do aceite: a proposta diz «Estado: proposta, sem ADR»; nada aplicado encontrado na `main`. Passa.
- GV-05 Critério de saída: F-1…F-11 e «a primeira tela no mesmo tempo com a leitura bloqueada» são binários; passa — F-4 e F-6 precisam do instrumento certo (achados 3 e 14).

## Decisões do humano
- Decisão 3, acrescida: a medição sem leitura — fechada (perde a primeira tela de quem chega) ou segue a variável do build como hoje (achado 9).
- Decisão 3, reformulada depois do achado 1: «a cópia guardada só pode desligar» (desligar vale já na primeira abertura; ligar espera a leitura) — a proposta deve levar essa opção a ele.
- Aprovar a proposta (depois das correções) e, então, o ADR pela rota dele (segurança).
