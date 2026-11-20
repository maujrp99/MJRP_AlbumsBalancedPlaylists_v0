---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-201", "UAT-10", "UAT-11", "UAT-13", "UAT-26", "UAT-27", "UAT-192", "UAT-07", "UAT-211"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F63: Home e navegação que respondem
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** A Home funciona ao voltar do Spotify; colar uma lista aceita hífen no nome e pula a linha ruim avisando; o botão voltar volta; o menu da conta abre no toque; as receitas e as telas falam um idioma só.

**Por quê:** São os defeitos de Home e navegação dos relatórios anteriores e da regressão de 2026-11-19.

**Como saber que funcionou:** Cada item reproduzido no navegador antes e conferido depois.

## Problem Statement
Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`, seção C) e a regressão no navegador (`reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md`, seção 6).

Cada issue foi conferida no código da `main` em `d210f35` (2026-11-19, depois da F67, da F50, da F60 e da F61) antes de qualquer mudança. O que ainda existia e o que já estava consertado:

| Issue | Parte | Ainda existia? | Onde (linhas da `main` em `d210f35`) |
|---|---|---|---|
| UAT-201 | Home morta depois da volta do Spotify | **Não.** Consertada pela F67 (o roteador monta a tela de destino de uma rota que redireciona) e pela F50 (o botão vira «Connected» pelo sinal `spotify-auth-change`) | `router.js` `renderView`; prova: `test/router.overlap.test.js`, `test/services/spotify/SpotifyAuthSignal.test.js` |
| UAT-201 | Botão voltar preso depois de criar uma série | **Sim.** A Home abre `/albums/<id>`; a tela de álbuns acrescentava por conta própria uma entrada `/albums?seriesId=<id>`; voltar caía em `/albums/<id>`, que acrescentava a entrada de novo | `controllers/SeriesController.js:126-129` (`history.pushState`), `controllers/HomeController.js:264` |
| UAT-201 | Botão voltar preso nas rotas que só mandam adiante | **Sim** (achado ao ler). `/callback`, `/album-series`, `/series`, o endereço sem tela e o `/` empilhavam o destino por cima de si mesmos: voltar caía neles e era mandado para a frente de novo. Na volta do Spotify, `/callback` vira `/` (`SpotifyAuthService.js:117`) e depois `/home` era empilhado | `app.js:106,146,156,168`, `router.js:134` |
| UAT-201 | Colar lista: nome quebra no primeiro hífen | **Sim.** «Jay-Z - The Blueprint» virava artista «Jay», álbum «Z - The Blueprint» | `controllers/HomeController.js:163-175` (`line.split('-')`) |
| UAT-201 | Colar lista: uma linha ruim aborta o resto | **Em parte.** Linha sem hífen já era pulada, mas só o console dizia qual; uma busca que quebrava numa linha abortava todas as seguintes | `controllers/HomeController.js:164-170,178,210-212` |
| UAT-201 | Itens «Soon» do menu navegam | **Sim.** O item recusava o clique e o roteador navegava do mesmo jeito | `components/navigation/SeriesDropdown.js:89-104,126-133`, `router.js:23-53` |
| UAT-201 | Diálogo fechado com Esc deixa a ação pendurada | **Sim.** O Esc tirava o diálogo e a promessa nunca era resolvida | `services/DialogService.js:31-38` |
| UAT-26 | «Process List» com a caixa vazia não avisa | **Não.** Consertada pela F67 (`4b6aa73`: `toast.warn` trocado por `toast.warning`); não tinha teste | `controllers/HomeController.js:139`; prova nova: `test/controllers/HomeController.bulk.test.js` |
| UAT-13 | Menu da conta só abre com o mouse em cima | **Sim** | `components/navigation/AuthNav.js:39-44` (`group-hover`) |
| UAT-13 | ✕ da faixa só aparece com o mouse em cima | **Sim**, escondido duas vezes | `components/ui/TrackRow.js:119-121`, `components/playlists/PlaylistGrid.js:114` |
| UAT-13 | Olho de detalhes das playlists guardadas | **Sim** | `components/playlists/SavedPlaylistRow.js:51`, `components/playlists/SavedPlaylistActions.js:86` |
| UAT-07, UAT-192 | Série de origem não vem escolhida no blend | **Sim.** `mount()` não lia o `seriesId` do endereço | `views/BlendingMenuView.js:237-268` |
| UAT-192 | Descrições das receitas em português | **Sim.** 28 textos | `algorithms/*.js` (lista em Open Questions) |
| UAT-192 | Título da aba alterna | **Não.** Consertado pela F54 (`791da82`): um título só; não tinha teste | `views/HomeView.js:17`, `public/index.html:10`; prova nova: `test/architecture/oneTabTitle.test.js` |
| UAT-10 | Telas de ranking só por endereço | **Sim** | `app.js:178-179`; nenhum link em `public/js` |
| UAT-11 | Tela de migração sem caminho | **Sim** | `components/TopNav.js:206-213` (`renderDataSyncLink` nunca é chamado) |
| UAT-27 | «Create Series» do estado vazio não navega | **Sim** | `views/SavedPlaylistsView.js:292` (`window.location.hash = '/home'`) |

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] O botão voltar do navegador sempre volta: entrar numa tela não acrescenta entrada além da própria navegação, e um endereço que só manda a pessoa adiante (volta do Spotify, endereço antigo, endereço sem tela, `/`) toma o lugar da própria entrada. O histórico do navegador é escrito só pelo roteador. · fixes UAT-201
  verified_by:: `test/router.history.test.js`, `test/controllers/SeriesController.address.test.js`, `test/architecture/historyOwnedByRouter.test.js`
- [REQ-02] Uma linha colada é «Artista - Álbum» e só o primeiro « - » separa: o hífen dentro de um nome fica no nome. Há um leitor só para a linha colada, construído sobre o leitor de consulta de álbum que já existe; um hífen sem espaço de nenhum lado não é adivinhado. · fixes UAT-201
  verified_by:: `test/models/bulkPaste.test.js` (tabela de 31 casos), `test/controllers/HomeController.bulk.test.js`
- [REQ-03] A linha que não entra (não é lida, não está no catálogo, a busca falhou, o álbum já está escolhido) é pulada e aparece na tela com o número, o texto e o motivo; as outras linhas seguem; as que dá para corrigir ficam na caixa. Nada disso usa a caixa de alerta do navegador. · fixes UAT-201
  verified_by:: `test/controllers/HomeController.bulk.test.js`, `test/models/bulkPaste.test.js`
- [REQ-04] Depois da volta do Spotify a Home responde (os botões funcionam) e o botão do Spotify mostra «Connected». **Já consertado:** F67 (a tela de destino de uma rota que redireciona é montada) e F50 (sinal da sessão do Spotify). · fixes UAT-201
  verified_by:: `test/router.overlap.test.js` (F67), `test/services/spotify/SpotifyAuthSignal.test.js` (F50), `test/router.history.test.js` («a route that redirects (as /callback) adds one entry, not two»)
- [REQ-05] Um item do menu marcado «Soon» não leva a lugar nenhum. · fixes UAT-201
  verified_by:: `test/router.links.test.js`
- [REQ-06] Um diálogo fechado com Esc responde como «cancelar»: a ação que perguntou termina. · fixes UAT-201
  verified_by:: `test/services/DialogService.dismiss.test.js`
- [REQ-07] «Process List» com a caixa vazia avisa o que falta e não busca nada. **Já consertado** pela F67 (`4b6aa73`); este ramo acrescenta o teste. · fixes UAT-26
  verified_by:: `test/controllers/HomeController.bulk.test.js` («an empty box says what is missing and searches nothing»)
- [REQ-08] O menu da conta abre com toque ou clique e com o teclado, fecha com clique fora e com Esc e diz o próprio estado (`aria-expanded`); as ações de uma faixa (o ✕) ficam à vista em tela de toque e aparecem com o foco do teclado. **Parte não entregue:** o olho de detalhes das playlists guardadas (ver Out of Scope). · fixes UAT-13
  verified_by:: `test/components/AuthNav.menu.test.js`, `test/components/ui/TrackRow.touch.test.js`
- [REQ-09] Aberto a partir de uma série, o menu de mistura vem com essa série escolhida e o passo da receita liberado. · fixes UAT-07
  verified_by:: `test/views/BlendingMenuView.fromSeries.test.js`
- [REQ-10] A interface fala um idioma só, o inglês: as descrições das receitas e os subtítulos das playlists geradas estão em inglês, e um teste recusa texto em português nas strings do app. A série de origem escolhida é o REQ-09. O título único da aba **já estava consertado** pela F54 (`791da82`); este ramo acrescenta o teste. · fixes UAT-192
  verified_by:: `test/architecture/interfaceInEnglish.test.js`, `test/architecture/oneTabTitle.test.js`, `test/views/BlendingMenuView.fromSeries.test.js`
- [REQ-11] A pessoa chega às telas de ranking do álbum e de todas as faixas da série por um link do app. **Não entregue neste ramo** (ver Open Questions). · fixes UAT-10
  verified_by:: pendente — nada foi construído; a issue segue aberta
- [REQ-12] A pessoa com dados antigos no navegador encontra o caminho para a tela de migração. **Não entregue neste ramo** (ver Open Questions). · fixes UAT-11
  verified_by:: pendente — nada foi construído; a issue segue aberta
- [REQ-13] O botão «Create Series» do estado vazio das playlists guardadas leva à Home. **Não entregue neste ramo** (fora do escopo dado ao implementador; ver Out of Scope). · fixes UAT-27
  verified_by:: pendente — nada foi construído; a issue segue aberta
- [REQ-14] Na barra do topo, o título aparece sem caixa atrás e os nomes da conta e do Spotify aparecem inteiros quando há espaço; cortados, dizem o nome inteiro ao passar o mouse. · fixes UAT-211
  verified_by:: `test/components/TopBarNames.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nenhum requisito (conserto de issues). Estados do `docs/specs/behavior.md` reescritos para o que o código faz agora: `^home-bulk-format-hint`, `^home-bulk-processed`, `^home-bulk-nothing-found`, `^home-bulk-failed`, `^home-series-created`, `^blend-series-choice`, `^blend-recipe-choice`, `^playlists-track-row`, `^auth-user-menu`, `^app-confirm-dialogs`, `^app-route-redirects`, `^app-main-menu`. Estados novos: `^home-bulk-skipped`, `^home-bulk-empty`, `^blend-series-from-address`, `^app-back-goes-back`.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada. O que muda à vista: na Home, modo «Bulk Paste», uma caixa laranja sob a caixa de texto com as linhas puladas («Skipped lines (N)»), o botão «Process List» ocupado com «Processing…», e a caixa de texto que fica só com as linhas a corrigir; no topo, o menu da conta abre no clique e não mais ao passar o mouse; no menu «Music Series», os itens «Soon» não são mais links; nas playlists geradas, o ✕ da faixa fica à vista em tela de toque; no menu de mistura, a série de origem vem marcada; os textos das receitas em inglês.
- Transversal layer touched: `router.js` (`redirect`, `setAddress`: o histórico tem um dono), `services/DialogService.js` (o Esc responde), `components/ui/TrackRow.js` (as ações da linha de faixa, usada em playlists geradas, playlists guardadas e ranking), `models/albumQuery.js` (função nova; as que existiam não mudaram).
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`; a lista das linhas puladas usa as cores laranja que a borda da caixa já usava.

## Success Criteria
- Criar uma série na Home e apertar voltar uma vez leva à Home (antes: a tela de álbuns voltava para si mesma). Teste: `SeriesController.address.test.js`.
- Na volta do Spotify, o histórico ganha uma entrada (`/home`), não duas; voltar não cai em `/` nem em `/callback`.
- «Jay-Z - The Blueprint», «Alt-J - An Awesome Wave», «Blink-182 - Enema of the State», «AC/DC - Back in Black» e «Artist - Album - Deluxe» são buscados com o artista e o álbum certos (tabela de 31 casos).
- Com uma linha ruim no meio da lista, as outras entram, a ruim aparece em «Skipped lines» com número, texto e motivo, e fica na caixa.
- Nenhum `alert(` em `controllers/HomeController.js`, `views/HomeView.js`, `models/bulkPaste.js`, `models/albumQuery.js`.
- `handleBulkProcess` com complexidade ciclomática 4 (era 15); nenhuma função nova acima de 10.
- O menu da conta abre e fecha com clique, fecha com Esc e clique fora, `aria-expanded` acompanha.
- `/blend?seriesId=<id>` abre com a série marcada e o passo 2 liberado.
- Nenhuma string de `public/js` em português (teste de arquitetura; 28 achados antes).
- Suíte: 1233 testes passando (1143 antes da feature); `npx vite build` compila.

## Out of Scope
- **UAT-27 e o olho de detalhes da UAT-13** (`views/SavedPlaylistsView.js:292`, `components/playlists/SavedPlaylistRow.js:51`, `components/playlists/SavedPlaylistActions.js:86`): o código das playlists guardadas ficou fora do escopo dado ao implementador. Os consertos são de uma linha cada: `router.navigate('/home')` no lugar de `window.location.hash = '/home'` (o teste `historyOwnedByRouter.test.js` lista essa exceção e passa a exigir a remoção dela da lista), e trocar `opacity-0 group-hover:opacity-100` pelas classes que o `TrackRow` usa agora.
- `controllers/BlendingController.js` e `controllers/PlaylistsController.js`: não tocados (a F56 os reescreve). `PlaylistsController.js:70` ainda chama `history.replaceState` por conta própria: exceção listada no teste de arquitetura.
- `shared/curation.js` (três subtítulos em português: `:260`, `:261`, `:355`) e as páginas `public/debug-*.html`: fora de `public/js`, não tocados.
- `services/SpotifyAuthService.js:80` ainda usa `alert` quando falta a identificação do Spotify, e `views/BlendingMenuView.js:418` tem um `alert` num método que ninguém chama (`showResults`): não estão nos fluxos mexidos.
- A gaveta do celular continua com os links By Artist, By Genre e By Track, que abrem a tela «Coming Soon».
- A busca de uma linha colada continua pegando o primeiro resultado do catálogo (`search(artist, title, { limit: 1 })`): a regra de identidade do álbum é da F55 e da F68.
- Playlists já guardadas mantêm o subtítulo antigo em português: é dado gravado.
- Quando um «voltar» é recusado pela guarda de mudanças não salvas (F60), o roteador repõe o endereço acrescentando uma entrada (`handleHistoryMove`): comportamento da F60, não mexido.

## Open Questions
<!-- ALL resolved before Plan. -->
- **UAT-10 (telas de ranking sem link) — decisão do MJRP pedida, nada construído.** As duas telas leem os álbuns que estiverem na memória, sem carregar nada: abertas por endereço ou depois de recarregar, a de álbum diz «não encontrado» e a de série mostra as faixas de tudo o que estiver carregado (o «misturando faixas» do achado A-13); a de série lê `params.id`, que a rota `/consolidated-ranking` não tem. Pôr links para elas hoje seria apontar para telas que não se sustentam sozinhas. Duas saídas: (a) ligá-las ao serviço de carga, como a F56 faz com o blend e as playlists, e só então pôr os links (no cartão do álbum e no cabeçalho da série, que são telas julgadas: pedem desenho); (b) aposentá-las, já que o cartão do álbum abre a janela de detalhes e a de ranking. Recomendação do implementador: (b), ou (a) dentro da F56.
- **UAT-11 (tela de migração sem caminho) — decisão do MJRP pedida, nada construído.** A tela migra chaves do `localStorage` (`album_*`, `series_*`, `playlist_*`, `albumCache`, `seriesCache`) que nenhuma versão atual do app grava; ela importa um segundo Firebase de uma CDN (`views/SaveAllView.js:5-6`, UAT-14, da F58) e chama `getFirestore()` desse segundo SDK, que não tem app iniciado: é provável que quebre ao abrir (não verificado: sem navegador). E a decisão de 2026-11-19 («visitante não leva dados», UAT-12) mudou a premissa da issue. Recomendação: fechar a UAT-11 removendo a tela e o botão que nunca é desenhado (F65, «remover o que nada usa»), ou reescrevê-la na F58 antes de ligá-la ao menu.
- **Os textos novos e traduzidos, em inglês — propostos pelo agente, a julgar pelo MJRP.** Traduzidos (antes → depois), em `public/js/algorithms/`:
  - `LegacyRoundRobinAlgorithm.js`: «Modo simples: distribui faixas em rodízio. Estável e testado, bom para comparação.» → «Simple mode: deals the tracks out in rotation. Stable and tested, good for comparison.»
  - `LegacyRoundRobinAlgorithm.js`: «Curadoria híbrida de faixas» → «Hybrid track curation»
  - `LegacyRoundRobinAlgorithm.js`: «S-Draft Balanceado» → «S-Draft Balanced»
  - `MJRPBalancedCascadeAlgorithm.js`: «Cria playlists balanceadas mesclando as melhores faixas de cada álbum. Playlists curtas são combinadas automaticamente.» → «Builds balanced playlists by blending the best tracks of each album. Short playlists are merged automatically.»
  - `MJRPBalancedCascadeAlgorithm.js`: «Curadoria MJRP Balanced Cascade» → «MJRP Balanced Cascade curation»
  - `MJRPBalancedCascadeV0Algorithm.js`: «Versão original sem merge: cada Deep Cut fica separada, mesmo as curtas.» → «Original version, no merging: each Deep Cuts playlist stays separate, even the short ones.»
  - `MJRPBalancedCascadeV0Algorithm.js`: «Curadoria MJRP Cascade v0 (sem merge)» → «MJRP Cascade v0 curation (no merging)»
  - `SDraftBalancedAlgorithm.js`: «Curadoria MJRP Balanced revisada» → «Revised MJRP Balanced curation»
  - `SDraftOriginalAlgorithm.js`: «Algoritmo clássico: distribui faixas em zigue-zague entre as playlists para máxima variedade.» → «Classic algorithm: deals the tracks out in a zigzag across the playlists for maximum variety.»
  - `SDraftOriginalAlgorithm.js`: «Curadoria S-Draft com Serpentine completo» → «S-Draft curation with full Serpentine»
  - `Top3PopularAlgorithm.js`: «As 3 faixas mais populares de cada álbum - o que as pessoas realmente ouvem.» → «The 3 most popular tracks of each album - what people actually listen to.»
  - `TopNAcclaimedAlgorithm.js`: «Selecione as faixas aclamadas pela crítica baseadas no BestEverAlbums.» → «Pick the critically acclaimed tracks, based on BestEverAlbums.»
  - `TopNPopularAlgorithm.js`: «Selecione suas faixas favoritas baseadas na popularidade do Spotify.» → «Pick your favorite tracks, based on Spotify popularity.»
  - `TopNAlgorithm.js` (2 vezes): «Top N de cada álbum» → «Top N from each album»
  - `LegacyRoundRobin`, `MJRPBalancedCascade`, `MJRPBalancedCascadeV0`, `SDraftBalanced`, `SDraftOriginal` (5 vezes cada): «Rank #1 de cada álbum» → «Rank #1 from each album»; «Rank #2 de cada álbum» → «Rank #2 from each album»
  - `MJRPBalancedCascade`, `MJRPBalancedCascadeV0`, `SDraftBalanced` (3 vezes): «Rank #1 e #2 de cada álbum» → «Rank #1 and #2 from each album»
- **Textos novos da colagem em lote:** «Processing…», «Added N album(s).», «No album was added.», «N line(s) was/were skipped: see the list under the box.», «Skipped lines (N)», «Line N: «texto» — motivo», e os motivos «no " - " between the artist and the album», «the album name is missing», «not found in the catalog», «the catalog search failed: try this line again», «already in the selection». Do menu da conta: o rótulo «Account menu» (para leitor de tela).
- **Mudanças de comportamento a julgar pelo MJRP:** (1) o menu da conta não abre mais só por passar o mouse: pede clique; (2) a caixa de colagem não é mais esvaziada quando sobram linhas puladas: ficam as que dá para corrigir; (3) um álbum colado que já está escolhido é dito como pulado («already in the selection»); (4) trocar de série pelo seletor da tela de álbuns continua acrescentando uma entrada ao histórico (voltar retorna à série anterior), e entrar numa série não acrescenta.
