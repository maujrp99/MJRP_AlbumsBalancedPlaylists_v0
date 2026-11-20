---
type: architecture-critique
subject: "F78 · proposta de arquitetura guiada por risco do app para iPhone e Android (design/proposals/f78-app-architecture/architecture-proposal.md, ramo feat/f78-app-architecture-proposal @ 99a0327) · sem ADR"
project: MJRP_AlbumsBalancedPlaylists_v0
feature: F78
moment: decision
judged: "2026-11-20 13:26"
who_judged: separate-agent
verdict: blocked
p0: 2
p1: 7
p2: 2
hygiene_notes: 8
human_decisions: 10
status: open
supersedes: none
---

# Crítica de arquitetura — F78, o app para iPhone e Android · 2026-11-20 13:26

> Momento: decisão (proposta de troca de pilha, antes do ADR)
> Objeto: `design/proposals/f78-app-architecture/architecture-proposal.md` e os arquivos que ela toca no ramo (`docs/specs/arch.md` § Propostas em avaliação, `plan.md` da F78). Contexto lido: `spec.md` e `tasks.md` da F78, `constitution.md`, ADRs 0015–0021 (só os títulos e o que a proposta cita), `data-model.md` (trechos), `firestore.rules`, `server/lib/auth/`, `server/lib/rateLimit.js`, `scripts/deploy-server.sh`, `public/js/` e `shared/` (por script e leitura), o estudo de viabilidade de 2026-11-20.
> Critérios: as regras técnicas de `docs/wiki/harness/architecture-review.md` (IDs com nome), `engineering-canon`, `constitution.md`.
> Quem julgou: agente separado — só a skill `mjrp-critiquing-architecture`, o cânone e os artefatos; não li a conversa que produziu a proposta.
> Não conferido: `VISION.md`, `PRINCIPLES.md`, `info-arch.md` e `design-system.md` (não lidos nesta passada de 50 min); a página publicada da proposta (o arquivo é a fonte); o `firestore.rules` em produção (nenhum pipeline o publica); nada foi executado no Hermes — as conclusões sobre o motor vêm da documentação do Hermes e de leitura do código.
> Auditoria anterior: nenhuma sobre a F78.
> Sem código do app; camadas e dependências são as declaradas na proposta. O `adr_header_check.py` não se aplica (não há ADR).

## Veredito

**Não pode ir ao MJRP como está (P0: 2).** A recomendação de pilha (React Native + Expo com núcleo JS em `shared/`) é defensável e o documento é honesto na maior parte, mas dois buracos de desenho são baratos de fechar e caros de descobrir depois: **(1)** a gravação no Firestore não tem prazo nem estado «não confirmado» — com o Firebase JS no app, «só grava com rede» não é aplicável e uma gravação pode ficar pendente na memória e sumir quando o app é fechado (VT-02, com IV-08); **(2)** a proposta trata a compatibilidade entre versões só para `/api`, não para os **documentos do Firestore**, que app antigo instalado e site novo vão gravar ao mesmo tempo — e o modelo de hoje regrava o array inteiro da série (VT-05). Caminho dos dois: correção do designer (`mjrp-designing-architecture`), uma seção cada.

**Os sete P1, por tema, em ordem de custo de mudança:**
- **A costura do núcleo não está desenhada** (1, 3): os casos de uso que o app precisa para gravar séries e playlists (`SeriesService`, `PlaylistsService`, 820 linhas) estão sujos, e «reaproveitar os repositórios do site» contradiz as próprias funções de aptidão. O app ganha uma segunda cópia, ou o site ganha uma refatoração não custeada. A escolha do Firebase JS se apoia nesse reaproveitamento, que não existe.
- **Sensores que não falham quando o desenho quebra** (2): a lista proibida de `coreStaysPortable` não pega o que de fato quebra no Hermes (`crypto.randomUUID`, `Intl`), e o spike S1 testa uma amostra que pode passar sem tocar o caminho que quebra.
- **Segurança e custo de um app público** (4, 5): o limite «por pessoa» do servidor está na memória de cada instância do Cloud Run, e o projeto Firebase aceita login anônimo de qualquer pessoa que leia a configuração do app. Nenhum teto global, nenhum App Check.
- **O trabalho central do produto, e a carga de quem mantém** (6, 7): na versão pública a receita fica sem a sua entrada principal (nota do BestEverAlbums, popularidade do Spotify), e a carga de três alvos não tem nem ordem de grandeza.

**Antes de ir ao MJRP, mudar:** os dois P0; desenhar a costura (achado 1) e refazer a comparação Firebase JS × React Native Firebase (achado 3); trocar o texto «34% portável» pela medida corrigida (seção «A remedição»); pôr as perguntas baratas que matam a opção (horas por mês, vida do site, Android quando, resposta do BestEverAlbums) **antes** dos spikes de um dia. O aceite da pilha é do MJRP.

## Vetos

| Veto | Resposta | Evidência (uma linha) |
|---|---|---|
| VT-01 banco compartilhado | não se aplica | um domínio só com dois clientes (site e app), não serviços de domínios distintos; o conflito de dois escritores é DD-02 (achado 1 e P0 1) |
| VT-02 cadeia síncrona sem timeout e fallback | **viola** | § 7 dá prazo para leitura, servidor e Apple, mas **gravar com rede** não tem linha: a promessa de gravação do Firestore só resolve com a confirmação do servidor e pode ficar pendente sem fim com sinal ruim (achado P0-1) |
| VT-03 mensageria sem DLQ | não se aplica | não há fila nem mensageria; a fila de gravação do Firestore e a do PostHog são do SDK |
| VT-04 sem traces | não se aplica | um servidor só; o app é cliente (gatilho: um segundo serviço no fluxo) |
| VT-05 mutação destrutiva de schema | **viola** | § 9 exige compatibilidade para trás só em `/api`; os documentos do Firestore (séries com `albumQueries` regravado inteiro, `data-model.md` Series) passam a ter consumidores em versões antigas que não se desfazem (achado P0-2) |
| VT-06 SDK de terceiro no domínio | passa | o núcleo declarado (`shared/`) proíbe `firebase`, `react-native`, `expo*`, `posthog*` (§ 11); a ressalva é que os casos de uso sujos ficam **fora** do núcleo (achado 1) |

## Achados

| # | Regra | Sev | O achado, em uma linha | Dono |
|---|---|---|---|---|
| P0-1 | VT-02 Cadeia síncrona sem timeout e fallback | P0 | gravar no Firestore não tem prazo nem estado «pendente/não confirmado»; com Firebase JS a gravação fica na memória e se perde ao fechar o app | mjrp-designing-architecture · corrigir agora |
| P0-2 | VT-05 Mutação destrutiva de schema | P0 | nenhuma regra de coexistência para os documentos do Firestore entre site novo e app antigo; o app antigo regrava a série e apaga campo que não conhece | mjrp-designing-architecture · corrigir agora |
| 1 | IV-03 Dependency Rule e DIP | P1 | a costura entre núcleo e ligações não está desenhada: casos de uso de séries e playlists sujos; repositórios «reaproveitados» não cabem em nenhum lugar permitido | mjrp-designing-architecture · corrigir agora |
| 2 | GV-03 Guias são caros, sensores são baratos | P1 | `coreStaysPortable` não proíbe o que quebra no Hermes; `oneRuleOnePlace` não pega cópia renomeada; o teste no aparelho não tem quem o rode | mjrp-designing-architecture · corrigir agora |
| 3 | RS-04 Runtime e conexões | P1 | Firebase JS no app: sem cache em disco do Firestore, login fora do cofre, e a vantagem alegada (reaproveitar repositórios) não existe; o custo do RN Firebase (build próprio) já está pago | mjrp-designing-architecture · corrigir agora |
| 4 | MA-04 FinOps e economia unitária | P1 | o limite por pessoa está na memória de cada instância do Cloud Run, sem `--max-instances`; não há teto global; R7 diz «custo de desfazer baixo» | mjrp-designing-architecture · corrigir agora |
| 5 | MA-05 Modelagem de ameaças | P1 | app público leva a configuração do Firebase; o projeto aceita login anônimo; sem App Check, qualquer um cria contas e grava `albums/`, `spotify_enrichment/` e chama rotas de raspagem | decisão do humano (segurança) + designer |
| 6 | AD-02 Contratos e fronteiras (cobertura) | P1 | na versão pública a receita não tem fonte declarada para a nota por faixa (BestEverAlbums pendente, Spotify fora); o resultado central do produto fica sem porta | decisão do humano + mjrp-designing-architecture |
| 7 | AD-05 Escrutínio das consequências | P1 | o custo operacional de três alvos não tem nem ordem de grandeza; «iPhone primeiro, Android depois» adia justamente o pedaço mais arriscado (R3) | mjrp-designing-architecture · corrigir agora; números do humano |
| 8 | IV-03 Dependency Rule e DIP | P2 | o «núcleo de regras» leva textos de tela formatados com `Intl` (`inventoryValue.js`, `albumLoadState.js`), cuja saída muda entre iOS e Android | mjrp-designing-architecture · vigiar |
| 9 | IV-04 Padrões com endereço | P2 | as stores são instâncias únicas de módulo; com `workspaces` e dois empacotadores, uma resolução dupla de `shared/` dá duas stores sem erro | mjrp-designing-architecture · vigiar |

### P0-1 · VT-02 Cadeia síncrona sem timeout e fallback · P0
- **Âncora:** proposta § 7 (tabela de prazos), § 5.1 (fim da sequência), § 4.4 (Firebase JS, «nenhuma fila de gravação sem rede»).
- **Evidência:** a tabela tem «Ler séries: 10 s» e «Gravar sem rede: — / Precisa de rede», mas nenhuma linha para **gravar com rede**. No Firebase JS a gravação é aplicada no cache local na hora (o usuário vê como feita) e a promessa só resolve quando o servidor confirma; com o cache em memória (o único que o SDK JS tem no React Native, fonte da própria proposta: firebase-js-sdk #7947) a fila de pendentes morre quando o sistema fecha o app. «Só grava com rede» depende de saber que há rede — e «há rede» do aparelho não é «o Firestore respondeu».
- **Critério:** também IV-08 Sem falha silenciosa (uma gravação perdida aparece como feita) e DD-02 Concorrência e conflitos.
- **Custo se ficar:** a primeira vez que o MJRP grava um ranking no metrô e fecha o app, o ranking some sem aviso; num app público, vira avaliação de uma estrela. Corrigir depois exige mexer em toda tela que grava.
- **Check de aceite:** a § 7 tem uma linha «gravar com rede» com prazo, o estado que a tela mostra enquanto a gravação não foi confirmada e o que acontece com uma gravação pendente quando o app é fechado — e um teste que corta a rede no meio de uma gravação e prova que a tela não diz «gravado»? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora. É uma linha de tabela e um estado de tela; a escolha do SDK (achado 3) muda a resposta.

### P0-2 · VT-05 Mutação destrutiva de schema · P0
- **Âncora:** proposta § 9 («toda mudança em `/api` passa a ser compatível para trás»), § 6 («o app não cria entidade nova… nos mesmos caminhos»); `docs/specs/data-model.md` Series: «O array inteiro é regravado a cada inclusão… o último a gravar vence».
- **Evidência:** a proposta vê que uma versão do app não se desfaz, mas só protege `/api`. Os documentos do Firestore são o contrato mais mexido do projeto (`facts` em v4.0, `appleMusicId` na F55, `owned` na F71). Um app instalado da versão N, ao gravar uma série, regrava `albumQueries` com os objetos que conhece e apaga o campo que o site da versão N+1 acrescentou. Não há versão do documento, nem regra «preserve o que não conhece», nem versão mínima do app, nem atualização forçada.
- **Critério:** também CM-03 Evolução de schemas e SN-04 Compatibilidade de schemas (o teste de contrato da § 11 só olha `/api`).
- **Custo se ficar:** perda de dado do usuário a cada mudança de modelo feita no site depois do lançamento; a correção exige uma versão nova do app que nem todos instalam.
- **Check de aceite:** a proposta declara, para os documentos do Firestore que site e app gravam, a regra de coexistência (gravação parcial que preserva campos desconhecidos, ou versão do documento com recusa explícita), a versão mínima do app com aviso de atualização, e um teste que grava com o formato da versão anterior e prova que nenhum campo novo se perde? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (uma subseção em § 6 e uma linha em § 11).

### 1 · IV-03 Dependency Rule e DIP · P1
- **Âncora:** proposta § 4.3 (contêineres: «Casos de uso · serviços limpos, stores» no núcleo), § 4.4 (Firebase JS: «os repositórios do site servem quase iguais»), § 11 (`coreStaysPortable`: o núcleo não importa `firebase`; `appAndSiteApart`: `app/` não importa `public/`).
- **Evidência:** refiz a varredura (116 arquivos limpos, como a proposta). Os casos de uso que o app precisa nas fatias 2, 4 e 5 estão **sujos e não são ligações**: `public/js/services/SeriesService.js` (262 linhas) importa `SeriesRepository` e o cria por dentro (`:28`, `:43`), chama o componente de tela `globalProgress` (`:15`, `:77`…) e usa `StorageService` (localStorage) e `cacheManager` (IndexedDB); `public/js/services/PlaylistsService.js` (558) faz o mesmo com `PlaylistRepository` e `StorageService`. `albums/albumLoading.js` (175), chamado de «ligação», carrega orquestração (`import('../../components/Toast.js')` em `:94`, `storage: localStorage` em `:139`). E os repositórios não têm casa: em `shared/` o sensor proíbe `firebase`; em `public/` o app não pode importá-los. Logo «reaproveitar os repositórios» é copiá-los, ou criar um terceiro pacote que a proposta não desenha.
- **Critério:** também IV-05 ETC e DRY. A frase da § 4.1 «os sujos são, na maioria, os arquivos que ligam o serviço ao Firebase» é falsa para os dois maiores (nota AD-07 da higiene).
- **Custo se ficar:** ou o app nasce com uma segunda cópia da gravação de séries e playlists (R2 vira o desenho, como a proposta diz do Flutter), ou a fatia 2 descobre uma refatoração de 820+ linhas do site no meio do caminho.
- **Check de aceite:** a proposta lista, por fatia, cada caso de uso que o app chama, diz se ele está no núcleo hoje, e, para `SeriesService`, `PlaylistsService` e `albumLoading`, a refatoração (portas injetadas, sem `globalProgress`, sem `StorageService` direto) como fatia própria, antes da fatia que a usa — e diz onde moram os repositórios do Firestore usados pelos dois lados? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 2 · GV-03 Guias são caros, sensores são baratos · P1
- **Âncora:** proposta § 11 (funções de aptidão), § 15 spike S1.
- **Evidência:** (a) a lista proibida de `coreStaysPortable` (`document`, `window`, `navigator`, `localStorage`, `indexedDB`, `fetch(`, `MusicKit`, `import.meta`) passa verde com `crypto.randomUUID()` em `models/Track.js:38` e `transformers/TrackTransformer.js:60`, que o Hermes não tem sem polyfill e que **18 arquivos limpos alcançam** (todas as receitas e estratégias de ranking, `Album.js`, `PlaylistGenerationService.js`); (b) `oneRuleOnePlace` compara nomes exportados: uma cópia da regra com outro nome passa; (c) «testes de fumaça no aparelho a cada build» não tem executor (Detox, Maestro ou equivalente) nem custo — para uma pessoa, vira passo manual que não roda; (d) o S1 importa identidade e «uma receita»: se as faixas do teste já trazem `id`, o `|| crypto.randomUUID()` nunca é chamado e o S1 passa sem tocar o caminho que quebra.
- **Critério:** também SN-01 Dependency Rule automatizada.
- **Custo se ficar:** o sensor dá verde enquanto o app quebra na primeira playlist gerada com faixa sem `id`; o R1 fica marcado «reduzido» sem estar.
- **Check de aceite:** `coreStaysPortable` também proíbe (ou exige porta para) `crypto.`, `toLocale*`, `localeCompare`, `Intl.` e `URLSearchParams` no núcleo; o S1 roda **todos** os 954 casos que exercitam código limpo dentro do Hermes num aparelho; e o teste no aparelho tem executor nomeado que roda sem intervenção? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 3 · RS-04 Runtime e conexões · P1
- **Âncora:** proposta § 4.4 (tabela Firebase JS × React Native Firebase e a «recomendação provisória»), § 15 S2.
- **Evidência:** a proposta escolhe o Firebase JS por «reaproveitar os repositórios» (achado 1: não reaproveita) e porque a primeira versão não grava sem rede (P0-1: o SDK JS não deixa isso aplicável). O custo do RN Firebase na tabela («configuração nativa… build próprio») **já está pago**: o app precisa de build de desenvolvimento de qualquer jeito, pelo módulo do token do Apple Music e pelo login com a Apple (§ 4.4 «Build»). Com o JS, a leitura sem rede depende de uma «Guarda local» feita à mão, entidade por entidade, que o SDK nativo dá pronta; o login fica no AsyncStorage, fora do cofre do sistema; e o `getReactNativePersistence` tem histórico de quebrar entre versões (firebase-js-sdk #9316, Firebase 12.4 com Expo 53). O S2 só testa o Firebase JS: não decide entre os dois.
- **Critério:** também MA-03 Evolução e reversibilidade («trocar depois custa um conjunto de ligações» — o conjunto é todos os repositórios do app mais a guarda local).
- **Custo se ficar:** escrever e manter um cache local por entidade que depois se joga fora; trocar de SDK com o app publicado.
- **Check de aceite:** a comparação refeita, com o reaproveitamento real (achado 1) e o build próprio já pago, e um spike que roda os dois SDKs lado a lado com «ler as séries sem rede depois de fechar o app» e «onde o login fica guardado» como perguntas de sim ou não? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora.

### 4 · MA-04 FinOps e economia unitária · P1
- **Âncora:** proposta R7 («custo de desfazer baixo (há limite por pessoa no servidor)»), § 8 (60 e 900 por hora por pessoa), § 10; `server/lib/rateLimit.js:13` (`const seen = new Map()`), `scripts/deploy-server.sh:211` (`gcloud run deploy … --allow-unauthenticated`, sem `--max-instances`).
- **Evidência:** o limite vive na memória de cada instância; com o Cloud Run escalando, «60 chamadas pagas por hora por pessoa» vale por instância e zera a cada reinício. Não há teto global de chamadas pagas nem interruptor; criar outra conta do Google é grátis. O alerta de orçamento da § 10 avisa, não para.
- **Check de aceite:** a proposta declara um teto global de chamadas pagas por dia (guardado fora da instância, ou com `--max-instances` e limite somado), o que o usuário vê quando o teto é atingido, e o custo marginal por álbum novo com número (depois do S6)? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora; o valor do teto é a decisão 6 do MJRP.

### 5 · MA-05 Modelagem de ameaças · P1
- **Âncora:** proposta § 8 («O que vai no app… configuração do Firebase»; «Rotas custosas: qualquer pessoa com login»), § 6 («No app, proposta: sem visitante»); `server/lib/auth/requireUser.js:32` (anônimo aceito onde `allowAnonymous`); `firestore.rules:44-53`.
- **Evidência:** «sem visitante» no app não fecha nada: o projeto Firebase continua aceitando login anônimo (o site depende dele), e a configuração que vai no pacote basta para entrar como anônimo pela API REST. Com isso: gravar em `albums/` e `spotify_enrichment/` (R12, nomeado) e chamar a raspagem a 900 por hora por instância (não nomeado). A proposta não fala de App Check (App Attest no iPhone, Play Integrity no Android), que é a peça do Firebase para «só o meu app chama».
- **Critério:** também IV-11 Segredo zero no código (a fronteira está certa — nada secreto vai no app; o problema é o que o não-segredo destrava).
- **Custo se ficar:** no dia em que o app aparece na loja, o cache compartilhado e a cota de raspagem ficam abertos a script; o BestEverAlbums, cuja autorização é o item que decide o produto, vê a carga.
- **Check de aceite:** a § 8 diz se o projeto passa a exigir App Check nas rotas do servidor e no Firestore, o que acontece com o login anônimo do site, e quem pode chamar a raspagem — e há um teste que chama `/api/enrich-album` sem atestado e recebe recusa? S/N
- **Dono · recomendação:** decisão do humano (segurança: App Check e o fim do anônimo mexem no site) — opções: (a) App Check + anônimo só no site, com limite menor; (b) App Check + sem anônimo em lugar nenhum; (c) nada antes do TestFlight externo, com data. Depois, o designer.

### 6 · AD-02 Contratos e fronteiras (cobertura) · P1
- **Âncora:** proposta § 15 «O que esta proposta não decide» («De onde vem a popularidade nas receitas…»), R11; `public/js/ranking/BalancedRankingStrategy.js:5-8` (ordem: aclamação, nota, … popularidade do Spotify); estudo de viabilidade, critérios 1 e 4.
- **Evidência:** a estratégia de ranking que alimenta as receitas lê primeiro a aclamação (BestEverAlbums, sem autorização ainda) e por último a popularidade do Spotify (fora da versão pública). Exportar fica só no iPhone se o S4 falhar. A proposta desenha telas, conta e dados, mas a entrada do trabalho central — «faixas ranqueadas → playlist equilibrada → no player» — não tem fonte declarada no cenário público, nem porta («fonte de ranking») que diga o que entra no lugar (IA paga por álbum? só o ranking próprio?).
- **Custo se ficar:** constrói-se o app inteiro e descobre-se na fatia 5 que, sem o BestEverAlbums, a receita gera playlists sem critério, ou pela IA a um custo por álbum que o R7 não contou.
- **Check de aceite:** a proposta diz, para a versão pública, de onde vem a nota por faixa em cada um dos três desfechos do BestEverAlbums (sim, não, sem resposta), com a porta e o custo de cada um, e o que a receita faz com um álbum sem nenhuma fonte? S/N
- **Dono · recomendação:** decisão do humano (o produto público sem o BestEverAlbums vale a pena?) e depois `mjrp-designing-architecture` para a porta.

### 7 · AD-05 Escrutínio das consequências · P1
- **Âncora:** proposta R8, § 12 (coluna «Custo de manter»), § 13 decisões 2 e 7.
- **Evidência:** «custo de manter» é qualitativo («atualizações do Expo várias vezes por ano»). Faltam, ao menos em ordem de grandeza: subir o Expo/React Native (o projeto segue o SDK; o SDK 58 saiu em 2026-10), mirar o Android novo todo ano, revisão da Apple a cada versão, `/api` e Firestore compatíveis para trás (P0-2), duas convenções de língua (TypeScript no app), os testes no aparelho (achado 2), o caminho de publicação do app fora do CI (constituição Art. V). E «iPhone primeiro, Android depois pelo mesmo caminho» economiza a loja do Google (12 testadores por 14 dias) mas **adia o R3**, o pedaço que pode tirar a exportação do Android; a parte de código não é economia porque a recomendação já é «provada no emulador a cada fatia».
- **Custo se ficar:** o MJRP responde a decisão 7 sem número para comparar, e a pilha é escolhida antes de saber se cabe no tempo dele.
- **Check de aceite:** a proposta dá, por alvo (site, iPhone, Android), as horas por mês estimadas de manutenção sem feature nova, com as premissas, e diz o que o adiamento do Android adia de risco? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · corrigir agora (a estimativa); o teto é do MJRP.

### 8 · IV-03 Dependency Rule e DIP · P2
- **Âncora:** `public/js/models/inventoryValue.js:196, 311, 318`, `models/albumLoadState.js:52`.
- **Evidência:** funções de modelo devolvem texto de tela formatado (`toLocaleString('en-US', …)`, `toLocaleDateString('en-GB', …)`, `toLocaleTimeString([], …)`). O Hermes tem `Intl` nas duas plataformas, mas com implementações diferentes (ICU no Android, a do sistema no iOS; ver fontes), então «uma regra, um resultado» não vale para esses textos.
- **Check de aceite:** a formatação de data, hora e dinheiro do núcleo está atrás de uma porta (ou fora do núcleo) e o teste no aparelho compara a saída nas duas plataformas? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · vigiar.

### 9 · IV-04 Padrões com endereço · P2
- **Âncora:** `public/js/stores/*.js` (`export const albumLoadStore = new AlbumLoadStore()` etc.), proposta § 4.4 (`workspaces`).
- **Evidência:** as stores são instâncias únicas por módulo; se o Metro resolver `shared/` por dois caminhos (link simbólico e caminho real), nascem duas stores e as telas param de se ver, sem erro.
- **Check de aceite:** o S1 confere que `shared/` é resolvido por um caminho só no Metro e no Vite? S/N
- **Dono · recomendação:** `mjrp-designing-architecture` · vigiar.

Não se aplica: VT-01, VT-03, VT-04 (acima); DD-01 Transacionalidade entre limites (nenhuma operação escreve em dois serviços na primeira versão; vira aplicável se «apagar a conta pelo servidor» for escolhido — R13); CM-01 Idempotência e RS-02 Retries (a proposta já recusa repetir a criação de playlist e usa o livro de exportações); DD-03 Volume e particionamento (sem consulta nova); AD-03 SPOFs (o servidor único e o Firebase são os de hoje, a proposta não muda).

## A remedição dos dez arquivos (ponto 1)

**Como:** a varredura da proposta foi refeita por script (mesma regra: um arquivo é limpo se nem ele nem o que importa, em cadeia, toca DOM, armazenamento do navegador, Firebase, `fetch(`, MusicKit, `import.meta`). Deu **116 arquivos limpos, 12.733 linhas** (a proposta: 116, 12.849; a diferença é de contagem de linhas). Depois procurei, nos limpos, o que o motor do app pode não ter, e li dez arquivos espalhados pelas pastas.

| # | Arquivo «limpo» | O que achei | No Hermes | Resultado |
|---|---|---|---|---|
| 1 | `models/Track.js` | `crypto.randomUUID()` (`:38`) | não existe sem polyfill (Hermes não tem Web Crypto; `expo-crypto` dá `randomUUID` como função, não como global) | **quebra** com faixa sem `id` |
| 2 | `transformers/TrackTransformer.js` | `crypto.randomUUID()` (`:60`) | idem | **quebra** com faixa sem `id` |
| 3 | `algorithms/MJRPBalancedCascadeAlgorithm.js` | nada direto; importa `Track` em cadeia; `console.log` no caminho quente | herda o 1 | **quebra** pelo 1 |
| 4 | `models/inventoryValue.js` | `toLocaleString('en-US', {min/maxFractionDigits})`, `toLocaleDateString('en-GB', …)`, `toLocaleTimeString` | suportado nas duas plataformas, implementações diferentes | roda; saída a conferir no aparelho |
| 5 | `models/savedPlaylists.js` | `localeCompare(…, undefined, { numeric: true })` (`:49`) | `localeCompare` suportado; a opção `numeric` não aparece na documentação do Hermes | roda; ordem a conferir |
| 6 | `models/albumType.js` | `new RegExp` montado em tempo de execução com lookbehind `(?<!…)`, `\p{L}\p{N}` e flags `iu` (`:56-60`) | lookbehind e escapes de propriedade Unicode suportados (doc RegExp do Hermes); como a expressão é montada em tempo de execução, o Babel não a transforma: depende do motor | roda pela documentação; não executado |
| 7 | `models/albumQuery.js` | lookbehind `(?<=\S)` em literal (`:46`) | suportado | roda pela documentação |
| 8 | `models/buyLinks.js` | `new URLSearchParams(…).toString()` (`:34`) | o `URLSearchParams` do React Native antigo era incompleto; o Expo troca por uma implementação completa no nativo | roda **com Expo**; quebraria em React Native puro antigo |
| 9 | `stores/albumLoad.js` | instância única de módulo (`:214`), `queueMicrotask` (`:196`) | `queueMicrotask` é global no React Native moderno (não conferido na web nesta passada) | roda; ver achado 9 |
| 10 | `shared/albumIdentity.js` (núcleo já hoje) | `\p{L}\p{N}` com `u`, `.normalize('NFD')` (`:123`, `:128`) | `\p{}` suportado; `normalize` **não confirmado** na documentação do Hermes | provável; é o caso mais importante a rodar no S1 |

Nenhum dos dez usa `window`, `document`, `localStorage`, `navigator`, `fetch`, `structuredClone`, `import()` dinâmico, especificador sem caminho nem `/js/…` absoluto: os imports são relativos ou `@shared/…` (o apelido precisa de configuração no Metro).

**Quanto confiar nos 34%.** Como medida de «não toca o navegador», os 34% se reproduzem: confie. Como «roda igual no app», é um **teto, não uma medida**:
- **certamente quebra sem conserto:** 2 arquivos, alcançados por **18 arquivos / 2.124 linhas** (17% do limpo) — todas as receitas e estratégias de ranking. O conserto é barato (polyfill no início do app ou porta para gerar id), mas o S1 como escrito pode não ver;
- **roda, mas a igualdade com o site tem de ser provada por teste no aparelho:** **61 de 116 arquivos (8.213 linhas, 64% do limpo)** tocam, direto ou por import, `Intl`/`toLocale*`/`localeCompare`, `normalize`, `\p{}`/lookbehind, `crypto` ou `URLSearchParams`;
- **provado no motor do app:** 0%, nada foi executado no Hermes (nem pela proposta, nem por esta crítica).
- **reaproveitado pelo app sem refatorar o site:** menos que os 34%, porque os casos de uso de séries e playlists estão fora (achado 1).

**O meu número:** ~34% do `public/js` é portável **depois** de um polyfill de `crypto.randomUUID` e da confirmação de `normalize` no Hermes; ~28% (34% menos os 2.124 linhas que alcançam `crypto`) roda hoje sem nenhuma mudança, pela documentação; 0% está provado. A proposta deveria dizer «34% não tocam o navegador; quanto roda no app é o S1», como já diz no «Limite da medida» — mas o `arch.md` e o `plan.md` repetem o número sem a ressalva.

## O que está bom, manter
- A proposta mede antes de afirmar (§ 4.1) e corrige a própria resposta da sessão («mais de 3000 testes» → 954 que exercitam só código limpo). A medida se reproduz.
- A regra «onde mora cada regra: núcleo ou servidor», em cinco passos com ordem (§ 4.3).
- Nada secreto no app; a fronteira de confiança está certa (§ 8); a chave da IA, da Apple e do Discogs ficam no servidor.
- Apple Music pelo caminho da API, com só o token do usuário nativo (§ 4.5): pequeno, isolável, testável no S3.
- Exportar não se repete sozinho e o livro de exportações evita o dobro (§ 5.2, § 7).
- «Organização do repositório: não mover `public/`» (§ 4.4): barato e reversível.
- Os riscos estão escritos como cenários de falha, com estado aberto/reduzido, e a seção «O que mudaria a recomendação» dá os gatilhos (§ 12).
- As decisões que são do MJRP estão separadas e não foram respondidas por ele.

## Análise estrutural

| Componente | Camada (declarada) | Observação / achado |
|---|---|---|
| `shared/` regras (models, algorithms, ranking, identidade) | Entidades | limpo do navegador; sensível ao motor (achados 2, 8; remedição) |
| `shared/` casos de uso (serviços limpos, stores) | Casos de uso | incompleto: `SeriesService`, `PlaylistsService`, `albumLoading` ficam fora (achado 1) |
| `shared/ports/` | Casos de uso (portas) | bem posto; falta porta de «fonte de ranking» (achado 6) e de formatação (achado 8) |
| `app/` ligações (Firebase, guarda local, token, PostHog) | Adaptadores | o lugar dos repositórios do Firestore não está definido (achado 1); escolha do SDK (achado 3) |
| `app/` telas | Frameworks & Drivers | ok; desenho depende da F76 ainda não julgada (a proposta nomeia) |
| `server/` | Adaptadores + Entidades compartilhadas | limite por instância (achado 4); anônimo aceito (achado 5) |
| Firestore (documentos) | Frameworks & Drivers | dois escritores em versões diferentes (P0-1, P0-2) |

Direção das dependências: no declarado, nada aponta para fora do núcleo; a violação é **de omissão** — os casos de uso que o app precisa ainda dependem de repositório e de componente de tela (achado 1).

Tecnologias (só as escolhidas):

| Tecnologia | Detalhe ou núcleo? | Custo de trocar | Vazou? |
|---|---|---|---|
| React Native + Expo | detalhe (telas) | médio: as telas | não, pelo desenho |
| Hermes | detalhe que o núcleo sente | — | sim, por `crypto` e `Intl` (achado 2, remedição) |
| Firebase JS no app | detalhe | maior do que o dito (achado 3) | não no núcleo |
| TypeScript em `app/` | convenção | baixo | não |

## Respostas aos nove pontos do pedido

1. **«Limpo» = portável?** Não. Ver a remedição: 2 quebras certas (alcançam 18 arquivos), 61 arquivos sensíveis ao motor, 0 provado. Lookbehind e `\p{}` são suportados pelo Hermes; `crypto` não; `Intl` sim, com saída diferente por plataforma; `normalize` não confirmado.
2. **Firebase JS × RN Firebase.** Para «ler sem rede, gravar só com rede», o RN Firebase serve melhor: cache em disco do Firestore pronto, login no cofre, gravação pendente que sobrevive ao fechar o app (e que pode ser **mostrada** como pendente). O JS só ganharia se reaproveitasse repositórios, e não reaproveita (achados 1 e 3). O custo da escolha da proposta, depois: um cache local por entidade escrito à mão, depois jogado fora, mais a troca de SDK com o app publicado.
3. **«Só grava com rede».** Resolve o conflito de dois escritores só para o caso raro (o mesmo documento editado em dois aparelhos); não resolve o caso comum, que é **um** escritor sem sinal. O usuário perde: o inventário na loja de discos sem sinal (o uso que mais precisa do celular), o ranking no avião, e qualquer edição com sinal ruim (P0-1). Item novo do inventário é documento próprio com id automático (`data-model.md` InventoryItem): gravar sem rede nele não tem conflito. A proposta trata «gravar sem rede» como um bloco só, quando a parte mais útil é a mais barata.
4. **Uma cópia das regras?** As regras puras, sim. Os casos de uso que guardam estado e gravam (séries, playlists), não: estão sujos e a proposta não desenha a costura (achado 1). Sem essa fatia, o app ganha uma segunda cópia.
5. **Constituição.** A proposta é honesta sobre o Art. II (diz que precisa de emenda e que sem ela não se constrói). Não nomeia que o Art. IV (E2E com Puppeteer) e o Art. V (publicação por CI/CD sem parada) também não cabem num app publicado do Mac do MJRP (nota AD-14). A opção que respeita a constituição existe e não foi oferecida como tal: **não ter app de loja** — o site da F76 instalado na tela de início (PWA), ou o Capacitor só no TestFlight interno. A proposta descarta essas como produto de loja, com razão, mas deveria apresentá-las ao MJRP como «a opção sem emenda», com o que ela perde.
6. **A comparação foi justa?** Com o Flutter, sim no essencial (a razão contra é o site que continua, e ela diz quando empataria). Com Swift, menos: a opção (f) foi descartada «não medida» e só a recomendada ganhou spikes; o JavaScriptCore do iOS é o motor do Safari, mais perto do navegador que o Hermes, então o R1 seria **menor** ali (nota AD-08). O que viraria a decisão: o S1 falhar (obtível, se o S1 rodar todos os casos), o S3 falhar (obtível), «Android só daqui a um ano» e «poucas horas por mês» (respostas do MJRP, não spikes). Falta um spike de meio dia que rode o núcleo no JavaScriptCore de um app SwiftUI vazio.
7. **O trabalho central na primeira versão pública.** Em risco: a receita perde a nota (BestEverAlbums pendente) e a popularidade (Spotify fora); exportar no Android depende do S4. A proposta desenha o app, mas não o resultado central nesse cenário (achado 6). Recomendo separar «app para o MJRP» (pode sair já, TestFlight interno, com tudo) de «app público» (só depois dos três desfechos de fora).
8. **Carga de uma pessoa.** Não está custeada (achado 7). «iPhone primeiro» economiza a loja do Google e adia o risco do Android; no código, a economia é pequena porque a base é a mesma e a proposta já pede o emulador a cada fatia.
9. **Spikes.** S3 e S4 são sim/não bons. S1 é sim/não, mas a amostra pode passar sem tocar o que quebra (achado 2). S2 não decide a escolha que diz decidir (achado 3). S5 não é binário («rola lisa» precisa de número e de um Android barato). S6 é medida, não sim/não, e precisa do teto da decisão 6. **Ordem:** as respostas do MJRP (decisões 7, 8 e 2) e o S6 custam horas e podem mudar a pilha: vêm antes dos spikes de um dia; entre estes, o S3 (o resultado central no iPhone) junto com o S1. **Faltam:** os dois SDKs do Firebase lado a lado (achado 3); login com a Apple → Firebase → apagar a conta (R13, bloqueia a loja); os 954 casos no Hermes, não uma amostra; o núcleo no JavaScriptCore (opção f); e uma receita rodada sem nota do BestEverAlbums nem do Spotify (achado 6).

## Recomendações
1. **Corrigir agora:** P0-1 e P0-2 (uma linha de tabela, um estado de tela, uma subseção de compatibilidade dos documentos); a costura do núcleo e o lugar dos repositórios, com a refatoração de `SeriesService`, `PlaylistsService` e `albumLoading` como fatia própria (1); a comparação dos SDKs do Firebase refeita (3); as funções de aptidão que falham de verdade e o S1 com todos os casos (2); o teto global de custo (4); a estimativa de manutenção por alvo (7).
2. **Vigiar:** formatação com `Intl` no núcleo (8); a instância única das stores com `workspaces` (9).
3. **Adiar:** nada técnico; a fonte de ranking do app público (6) espera a resposta do BestEverAlbums, mas a porta pode ser desenhada já.

## Higiene da decisão
- **AD-06 Premissas verdadeiras:** a § 4.1 está certa nos números. O `data-model.md` diz que `users/{uid}/albumRankings` está aberta a qualquer pessoa; o `firestore.rules` do repositório já a fecha (F59). Não muda a proposta (o R12 nomeia só `albums/` e `spotify_enrichment/`, o que está certo) — é para `mjrp-auditing-docs`. O cabeçalho da proposta diz «written: 13:40»; o log a registra às 13:19 e esta crítica começou antes das 13:40 — o designer.
- **AD-07 Evidência bem aplicada:** «os sujos são, na maioria, os arquivos que ligam» foi tirado de contagem; os dois maiores sujos são casos de uso, não ligações (achado 1). E «R1 reduzido (medido)» conclui sobre o motor a partir de busca de texto — o designer.
- **AD-08 Alternativas genuínas:** só a opção recomendada ganhou spikes; a (f) foi descartada «não medida», embora o JavaScriptCore torne o R1 menor nela — o designer.
- **AD-10 Premissa mais arriscada:** está nomeada (R1, S1), mas o teste escolhido pode não exercitá-la (achado 2); e as perguntas mais baratas que derrubam a opção (horas por mês, vida do site) não vêm primeiro — o designer.
- **AD-12 Nada aplicado antes do aceite:** o ramo `feat/f78-app-architecture-proposal` existe, mas o `tasks.md` da F78 diz «a feature priorizada pelo MJRP; só então o ramo», e a memória do projeto diz que um ramo `feat/fNN-` antes da «Priorizada» trava o cartão no quadro. O `plan.md` já descreve a recomendação. É ponteiro, não código — o humano diz se vale.
- **AD-13 Arquivos impactados:** a § 9 não lista `public/js/services/SeriesService.js`, `PlaylistsService.js`, `albums/albumLoading.js` (achado 1), `firestore.rules` (R12), `server/lib/rateLimit.js` e o deploy do servidor (achado 4), a configuração de login do projeto Firebase (achado 5), `constitution.md`, `.mjrp-project.yml` — o designer.
- **AD-14 Restrições respeitadas:** o Art. II está nomeado; o Art. IV (E2E com Puppeteer) e o Art. V (publicação por CI/CD sem parada) não — o app não cabe em nenhum dos dois como estão — o designer, e a emenda é do humano.
- **Ancoragem:** a resposta da sessão (React Native com Expo e TypeScript, log de 2026-11-20 12:47) veio antes da proposta, e a proposta a «mediu» em vez de partir do zero. Ela corrigiu parte (os testes), o que é bom sinal; o que ficou sem medir é justamente o que favoreceria outra opção (AD-08) — o designer.

## Decisões do humano
1. **A emenda da constituição:** Art. II só para `app/` (com ou sem TypeScript), **e também** Art. IV e Art. V para o app? Ou a opção sem emenda (PWA ou Capacitor só no TestFlight interno)?
2. **Separar «app para mim» de «app público»?** (a) TestFlight interno primeiro, com tudo o que o site tem, Spotify e Discogs incluídos; o público depois dos desfechos de fora. (b) Um caminho só, já para o público.
3. **Se o BestEverAlbums disser não (ou não responder), o app público ainda vale?** De onde vem a nota por faixa: IA paga por álbum, só o ranking próprio, ou outra fonte?
4. **Gravar sem rede só no inventário (item novo, sem conflito)** na primeira versão, ou nada sem rede?
5. **App Check e o login anônimo:** exigir App Check no servidor e no Firestore; manter o anônimo só no site (com limite menor), ou acabar com ele?
6. **Teto global de gasto pago por dia**, que para as chamadas quando atingido (além do alerta): qual valor?
7. **Quantas horas por mês** de manutenção, com a estimativa por alvo na mão (achado 7) — e, com ela, Android junto ou depois?
8. **Versão mínima do app e atualização forçada:** aceita obrigar quem tem versão velha a atualizar quando o formato dos dados mudar?
9. **Quanto tempo o site continua?** (já perguntado na proposta; repetido porque a recomendação inteira depende dele.)
10. **A crítica recomenda um spike a mais na opção (f)** (núcleo no JavaScriptCore de um app SwiftUI vazio, meio dia) antes de fechar a pilha: aceita?

## Fontes (consultadas em 2026-11-20)
- Hermes, RegExp suportada (lookbehind, escapes de propriedade Unicode, grupos com nome): https://raw.githubusercontent.com/facebook/hermes/main/doc/RegExp.md
- Hermes, APIs de Intl por plataforma (Collator, NumberFormat, DateTimeFormat; diferenças iOS × Android): https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md
- Hermes, recursos suportados e excluídos: https://raw.githubusercontent.com/facebook/hermes/main/doc/Features.md
- `crypto` ausente no Hermes; polyfills: https://github.com/LinusU/react-native-random-uuid · https://github.com/vonovak/react-native-get-random-values · https://docs.expo.dev/versions/v54.0.0/sdk/crypto/
- `URLSearchParams` no React Native e no Expo: https://github.com/facebook/react-native/issues/23922 · https://docs.expo.dev/versions/latest/sdk/url
- Firebase JS no React Native: persistência do login no AsyncStorage e quebra do `getReactNativePersistence`: https://github.com/expo/fyi/blob/main/firebase-js-auth-setup.md · https://github.com/firebase/firebase-js-sdk/issues/9316 · Firestore sem cache em disco: https://github.com/firebase/firebase-js-sdk/issues/7947
- React Native Firebase, plataformas: https://rnfirebase.io/platforms

Não verificado nesta passada: `String.prototype.normalize` e a opção `numeric` do `localeCompare` no Hermes (nenhuma fonte achada); `queueMicrotask` e `Object.hasOwn` no Hermes (de memória); nada foi executado em aparelho ou no Hermes.
