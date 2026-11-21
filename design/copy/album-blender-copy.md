# Documento de copy: The Album Blender (site inteiro, inglês → português do Brasil)

> **Gerado por script** (`scripts/i18n/scan-copy.cjs` + `scripts/i18n/build-deck.py`); não editar à mão: rode de novo. Fonte: o código em `public/` e `server/` no commit do ramo.
> **A coluna PT é proposta do agente (Sonnet), nunca final.** Nenhuma linha foi aprovada pelo MJRP; a coluna «Marca» diz o que precisa dele. A ordem das telas segue o menu do site.
> **Limite:** a revisão muda o texto de uma linha; não tira, não põe e não move item de tela.

## Página base (index.html) (1)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `idx.loading` | `index.html:38` | Carregando/andamento | Loading... | Carregando... | traduzir |

## Página de entrada (67)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `ent.sign-in` | `components/home/HomeDock.js:53`, `splash.html:203` +3 · também em: Home (montar a série) | Texto | Sign in | Entrar | traduzir |
| `ent.the-album-blender` | `components/TopNav.js:40`, `services/musickit/MusicKitAuth.js:107` +2 · também em: Conta e conexões (login, Spotify, Apple Music); Menu, rodapé e aplicação | Texto alternativo | The Album Blender | The Album Blender | fica — nome da marca |
| `ent.the-album-blender-for-people` | `splash.html:12`, `splash.html:17` | Texto | The Album Blender — for people who listen to whole albums | The Album Blender — para quem ouve álbuns inteiros | traduzir |
| `ent.the-album-blender-is-a` | `splash.html:13` | Texto | The Album Blender is a web app for people who listen to whole albums: gather albums into series, rank every track, blend them into balanced playlists, and keep count of the records you own. | The Album Blender é um app web para quem ouve álbuns inteiros: reúna álbuns em séries, classifique cada faixa, misture em playlists equilibradas e mantenha a conta dos discos que você tem. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ent.gather-albums-into-series-rank` | `splash.html:18` | Texto | Gather albums into series, rank every track, blend them into balanced playlists, and keep count of the records you own. | Reúna álbuns em séries, classifique cada faixa, misture em playlists equilibradas e mantenha a conta dos discos que você tem. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ent.skip-to-content` | `splash.html:199` | Texto | Skip to content | Pular para o conteúdo | traduzir |
| `ent.the-album-blender-top-of` | `splash.html:202` | Leitor de tela | The Album Blender, top of the page | The Album Blender, topo da página | traduzir |
| `ent.account` | `splash.html:203` | Leitor de tela | Account | Conta | traduzir |
| `ent.open-the-app` | `splash.html:203`, `splash.html:218` +3 | Texto | Open the app | Abrir o app | traduzir |
| `ent.tracks-of-this-page` | `splash.html:206` | Leitor de tela | Tracks of this page | Faixas desta página | traduzir |
| `ent.side-a-1-the-blender` | `splash.html:207`, `splash/splash.js:22` | Texto | Side A · 1 — The Blender | Lado A · 1 — O Blender | traduzir + MJRP decide — «The Blender» é a marca do produto; aqui virou «O Blender»; decidir se mantém o nome em inglês. |
| `ent.side-a-track-1-the` | `splash.html:209` | Leitor de tela | Side A, track 1: The Album Blender | Lado A, faixa 1: The Album Blender | traduzir |
| `ent.side-a-track-2-series` | `splash.html:210` | Leitor de tela | Side A, track 2: Series | Lado A, faixa 2: Séries | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ent.side-a-track-3-rank` | `splash.html:211` | Leitor de tela | Side A, track 3: Rank every track | Lado A, faixa 3: Classifique cada faixa | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `ent.side-a-track-4-blend` | `splash.html:212` | Leitor de tela | Side A, track 4: Blend | Lado A, faixa 4: Blend | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `ent.side-a-track-5-your` | `splash.html:213` | Leitor de tela | Side A, track 5: Your shelf | Lado A, faixa 5: Sua estante | traduzir |
| `ent.flip` | `splash.html:214` | Texto | FLIP | VIRAR | traduzir |
| `ent.flip-the-record` | `splash.html:214`, `splash/splash.js:27` | Leitor de tela | Flip the record | Vire o disco | traduzir |
| `ent.side-b-track-1-why` | `splash.html:215` | Leitor de tela | Side B, track 1: Why whole albums | Lado B, faixa 1: Por que álbuns inteiros | traduzir |
| `ent.side-b-track-2-start` | `splash.html:216` | Leitor de tela | Side B, track 2: Start | Lado B, faixa 2: Comece | traduzir |
| `ent.pause-motion` | `splash.html:219`, `splash/splash.js:212` | Texto | Pause motion | Pausar movimento | traduzir |
| `ent.for-whole-album-listeners` | `splash.html:224` | Texto | For whole-album listeners | Para quem ouve álbuns inteiros | traduzir |
| `ent.dig-through-the-albums-you` | `splash.html:225` | Texto | Dig through the albums you love. | Mergulhe nos álbuns que você ama. | traduzir |
| `ent.keep-every-track` | `splash.html:225` | Texto | Keep every track. | Guarde cada faixa. | traduzir |
| `ent.gather-albums-into-series-rank-2` | `splash.html:226` | Texto | Gather albums into series, rank every track, and blend them into playlists that keep every record in the mix — then keep count of the ones on your shelf. | Reúna álbuns em séries, classifique cada faixa e misture em playlists que mantêm cada disco no mix — depois mantenha a conta dos que estão na sua estante. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ent.the-album-blender-is-a-2` | `splash.html:226` | Texto | The Album Blender is a web app for people who listen to whole albums. | The Album Blender é um app web para quem ouve álbuns inteiros. | traduzir |
| `ent.side-a-2-series` | `splash.html:232`, `splash/splash.js:23` | Texto | Side A · 2 — Series | Lado A · 2 — Séries | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ent.gather-the-albums-that-belong` | `splash.html:233` | Texto | Gather the albums that belong together. | Reúna os álbuns que combinam. | traduzir |
| `ent.an-artist-s-run-a` | `splash.html:234` | Texto | An artist's run, a decade, a mood: a series is a shelf of whole albums you choose. Every blend starts there. | A fase de um artista, uma década, um clima: uma série é uma estante de álbuns inteiros que você escolhe. Todo Blend começa aí. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ent.side-a-3-ranking` | `splash.html:239`, `splash/splash.js:24` | Texto | Side A · 3 — Ranking | Lado A · 3 — Ranking | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `ent.rank-every-track-not-just` | `splash.html:240` | Texto | Rank every track, not just the singles. | Classifique cada faixa, não só os singles. | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `ent.order-each-album-s-tracks` | `splash.html:241` | Texto | Order each album's tracks by how often they are played, by published rankings where the app has them, or by your own ear. The deep cuts get a place in line. | Ordene as faixas de cada álbum por quantas vezes são tocadas, por rankings publicados onde o app os tem, ou pelo seu ouvido. As deep cuts ganham seu lugar na fila. | traduzir |
| `ent.illustrative-example-of-one-album` | `splash.html:242` | Leitor de tela | Illustrative example of one album's tracks ranked | Exemplo ilustrativo das faixas de um álbum classificadas | traduzir |
| `ent.copper-year` | `splash.html:243` | Texto | Copper Year | Copper Year | fica — Nome de álbum fictício; não se traduz. |
| `ent.illustrative-fictional-album` | `splash.html:243` | Texto | Illustrative · fictional album | Ilustrativo · álbum fictício | traduzir |
| `ent.low-sun-overture` | `splash.html:245` | Texto | Low Sun Overture | Low Sun Overture | fica — Nome de faixa fictícia. |
| `ent.pier-at-dusk` | `splash.html:246` | Texto | Pier at Dusk | Pier at Dusk | fica — Nome de faixa fictícia. |
| `ent.second-side-waltz` | `splash.html:247` | Texto | Second Side Waltz | Second Side Waltz | fica — Nome de faixa fictícia. |
| `ent.the-long-player` | `splash.html:248` | Texto | The Long Player | The Long Player | fica — Nome de faixa fictícia. |
| `ent.bar-length-the-track-s` | `splash.html:250` | Texto | Bar length = the track's place in the ranking you choose. Example data, not real scores. | Comprimento da barra = posição da faixa no ranking que você escolher. Dados de exemplo, não notas reais. | traduzir |
| `ent.side-a-4-blend` | `splash.html:256`, `splash/splash.js:25` | Texto | Side A · 4 — Blend | Lado A · 4 — Blend | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `ent.blend-the-series-into-one` | `splash.html:257` | Texto | Blend the series into one playlist. | Misture a série em uma só playlist. | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo; D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ent.pick-a-recipe-and-the` | `splash.html:258` | Texto | Pick a recipe and the Blender draws tracks from every album in the series, so no record drowns out the rest. You choose how long it runs and what leads. | Escolha uma receita e o Blender tira faixas de cada álbum da série, para que nenhum disco abafe os outros. Você decide a duração e quem abre. | traduzir + MJRP decide — «Blender» (o produto) fica; «recipe» virou «receita» pelo glossário. |
| `ent.side-a-5-your-shelf` | `splash.html:263`, `splash/splash.js:26` | Texto | Side A · 5 — Your shelf | Lado A · 5 — Sua estante | traduzir |
| `ent.keep-count-of-the-records` | `splash.html:264` | Texto | Keep count of the records you own. | Mantenha a conta dos discos que você tem. | traduzir |
| `ent.mark-the-albums-on-your` | `splash.html:265` | Texto | Mark the albums on your shelf, see an estimate of what the collection is worth, and what the missing ones would cost. | Marque os álbuns da sua estante, veja uma estimativa de quanto vale a coleção e quanto custariam os que faltam. | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `ent.end-of-side-a` | `splash.html:270` | Texto | End of Side A | Fim do Lado A | traduzir |
| `ent.flip-the-record-2` | `splash.html:271` | Texto | Flip the record. | Vire o disco. | traduzir |
| `ent.side-b-is-the-why` | `splash.html:272` | Texto | Side B is the why, and the way in. | O Lado B é o porquê, e a entrada. | traduzir |
| `ent.side-b-1-why-whole` | `splash.html:277`, `splash/splash.js:28` | Texto | Side B · 1 — Why whole albums | Lado B · 1 — Por que álbuns inteiros | traduzir |
| `ent.shuffle-keeps-the-hits-and` | `splash.html:278` | Texto | Shuffle keeps the hits and loses the record. | O aleatório guarda os hits e perde o disco. | traduzir |
| `ent.the-blender-starts-from-the` | `splash.html:278` | Texto | The Blender starts from the record. | O Blender parte do disco. | traduzir |
| `ent.an-album-has-an-order` | `splash.html:279` | Texto | An album has an order: an opening, a turn, a closer. Ranking brings the deep cuts back; blending keeps every playlist rooted in albums you chose, whole. | Um álbum tem uma ordem: uma abertura, uma virada, um final. O ranking traz as deep cuts de volta; o Blend mantém cada playlist enraizada em álbuns que você escolheu, inteiros. | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `ent.side-b-2-start` | `splash.html:283`, `splash/splash.js:29` | Texto | Side B · 2 — Start | Lado B · 2 — Comece | traduzir |
| `ent.drop-the-needle-on-your` | `splash.html:284` | Texto | Drop the needle on your first series. | Ponha a agulha na sua primeira série. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ent.open-the-app-and-start` | `splash.html:285` | Texto | Open the app and start a series with one album you love. Sign in to keep your series, rankings and shelf with you. | Abra o app e comece uma série com um álbum que você ama. Entre para manter suas séries, rankings e estante com você. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ent.a-crate-of-albums-the` | `splash.html:291` | Leitor de tela | A crate of albums; the page pulls one record forward for each part | Uma caixa de álbuns; a página puxa um disco para a frente a cada parte | traduzir |
| `ent.footer` | `splash.html:311` | Leitor de tela | Footer | Rodapé | traduzir |
| `ent.firebase-authuser` | `splash/gate.js:26` | Texto | firebase:authUser: | firebase:authUser: | técnico + provável — Chave de armazenamento do Firebase. |
| `ent.translate3d-0-46-npx-rotatex` | `splash/splash.js:68` | Texto | translate3d(0,-46%,{}px) rotateX(3deg) | translate3d(0,-46%,{}px) rotateX(3deg) | técnico + provável — CSS. |
| `ent.translate3d-0-n-npx-rotatex` | `splash/splash.js:71` | Texto | translate3d(0,{}%,{}px) rotateX(-38deg) | translate3d(0,{}%,{}px) rotateX(-38deg) | técnico + provável — CSS. |
| `ent.translate3d-0-n-npx-rotatex-2` | `splash/splash.js:73` | Texto | translate3d(0,{}%,{}px) rotateX(-6deg) | translate3d(0,{}%,{}px) rotateX(-6deg) | técnico + provável — CSS. |
| `ent.n-fictional-album` | `splash/splash.js:97` | Texto | {} · fictional album | {} · álbum fictício | traduzir + montado + provável — {} é o nome do álbum |
| `ent.play-motion` | `splash/splash.js:212` | Texto | Play motion | Retomar movimento | traduzir + provável |
| `ent.listen-to-n-by-n` | `splash/splash.js:236` | Leitor de tela | Listen to {} by {} on Apple Music (opens in a new tab) | Ouvir {} de {} no Apple Music (abre em nova aba) | traduzir + montado — {} são álbum e artista |
| `ent.n-n-listen-on-apple` | `splash/splash.js:252` | Texto | {} · {} — Listen on Apple Music | {} · {} — Ouvir no Apple Music | traduzir + montado — {} são álbum e artista |
| `ent.n-n-fictional-album` | `splash/splash.js:254` | Texto | {} · {} — fictional album | {} · {} — álbum fictício | traduzir + montado — {} são álbum e artista |

## Menu, rodapé e aplicação (58)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `nav.by-album` | `algorithms/TopNAlgorithm.js:238`, `components/blend/BlendIngredientsPanel.js:115` +2 · também em: Algoritmos e receitas do Blend; Blend | Texto | By Album | Por álbum | traduzir |
| `nav.by-artist` | `algorithms/TopNAlgorithm.js:240`, `components/navigation/SeriesDropdown.js:23` +1 · também em: Algoritmos e receitas do Blend | Texto | By Artist | Por artista | traduzir |
| `nav.authentication-issue-some-features-may` | `app.js:88` | Aviso (toast) | Authentication issue. Some features may be limited. | Problema de autenticação. Alguns recursos podem ficar limitados. | traduzir |
| `nav.connected-to-spotify` | `app.js:144` | Aviso (toast) | Connected to Spotify! | Conectado ao Spotify! | traduzir |
| `nav.failed-to-connect-to-spotify` | `app.js:146` | Aviso (toast) | Failed to connect to Spotify | Não foi possível conectar ao Spotify | traduzir |
| `nav.albums` | `components/blend/BlendSeriesSelector.js:42`, `components/Breadcrumb.js:39` +6 · também em: Blend; Inventário; Outros; Séries e álbuns | Texto | Albums | Álbuns | traduzir |
| `nav.playlists` | `components/Breadcrumb.js:47`, `components/Footer.js:34` +9 · também em: Outros; Playlists | Texto | Playlists | Playlists | traduzir |
| `nav.cache-cleared` | `components/Footer.js:1` | Texto | Cache Cleared! | Cache limpo! | traduzir + provável |
| `nav.could-not-clear-the-cache` | `components/Footer.js:2`, `components/navigation/PhoneMenu.js:75` | Erro/aviso | Could not clear the cache | Não foi possível limpar o cache | traduzir |
| `nav.this-application-uses-discogs-api` | `components/Footer.js:10` | Texto | This application uses Discogs' API but is not affiliated with, sponsored or endorsed by Discogs. 'Discogs' is a trademark of Zink Media, LLC. | Este aplicativo usa a API do Discogs, mas não é afiliado, patrocinado nem endossado pelo Discogs. 'Discogs' é uma marca registrada da Zink Media, LLC. | traduzir + provável |
| `nav.clear-cache` | `components/Footer.js:34` | Texto | Clear Cache | Limpar cache | traduzir |
| `nav.home` | `components/Footer.js:34` | Texto | Home | Início | traduzir + MJRP decide — D-07 «Home»/«Start»: F85 decidiu «Start» / «Inicie»; resta os textos que ainda dizem «Home» |
| `nav.last-updated-n` | `components/Footer.js:34`, `views/PlaylistsView.js:301` +1 · também em: Playlists; Séries e álbuns | Texto | Last updated: {} | Última atualização: {} | traduzir + montado — {} é uma data/hora |
| `nav.mjrp-software` | `components/Footer.js:34` | Texto | MJRP Software | MJRP Software | fica |
| `nav.powered-by` | `components/Footer.js:34` | Texto | Powered by | Com tecnologia de | traduzir |
| `nav.signed-out-successfully` | `components/navigation/AuthNav.js:30` | Aviso (toast) | Signed out successfully | Você saiu com sucesso | traduzir |
| `nav.sign-out-failed` | `components/navigation/AuthNav.js:34` | Aviso (toast) | Sign out failed | Não foi possível sair | traduzir |
| `nav.n-sign-out` | `components/navigation/AuthNav.js:63` | Texto | {} Sign Out | {} Sair | traduzir + montado — {} = ícone/emoji |
| `nav.account-menu` | `components/navigation/AuthNav.js:63` | Leitor de tela | Account menu | Menu da conta | traduzir |
| `nav.signed-in-as` | `components/navigation/AuthNav.js:63`, `components/navigation/PhoneMenu.js:54` | Texto | Signed in as | Você entrou como | traduzir |
| `nav.sign-in` | `components/navigation/AuthNav.js:83`, `components/navigation/PhoneMenu.js:48` | Texto | Sign In | Entrar | traduzir |
| `nav.sign-out` | `components/navigation/AuthNav.js:93`, `components/navigation/PhoneMenu.js:119` | Texto | Sign Out | Sair | traduzir |
| `nav.sign-in-to-sync` | `components/navigation/AuthNav.js:103` | Texto | Sign In to Sync | Entrar para sincronizar | traduzir |
| `nav.new-playlists` | `components/navigation/PhoneMenu.js:19` | Rótulo/opção | New playlists | Novas playlists | traduzir |
| `nav.the-playlists-of-your-last` | `components/navigation/PhoneMenu.js:19` | Descrição | The playlists of your last blend | As playlists do seu último Blend | traduzir |
| `nav.series-by-artist` | `components/navigation/PhoneMenu.js:20` | Rótulo/opção | Series by artist | Séries por artista | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `nav.series-by-genre` | `components/navigation/PhoneMenu.js:21` | Rótulo/opção | Series by genre | Séries por gênero | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `nav.series-by-track` | `components/navigation/PhoneMenu.js:22` | Rótulo/opção | Series by track | Séries por faixa | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `nav.soon` | `components/navigation/PhoneMenu.js:37`, `components/navigation/SeriesDropdown.js:111` | Texto | Soon | Em breve | traduzir |
| `nav.cache-cleared-2` | `components/navigation/PhoneMenu.js:80` | Aviso (toast) | Cache cleared | Cache limpo | traduzir |
| `nav.clear-cache-2` | `components/navigation/PhoneMenu.js:84` | Texto | Clear cache | Limpar cache | traduzir + provável |
| `nav.clear-the-album-cache` | `components/navigation/PhoneMenu.js:88` | Dica (tooltip)/título | Clear the album cache? | Limpar o cache de álbuns? | traduzir |
| `nav.the-albums-are-loaded-again` | `components/navigation/PhoneMenu.js:89` | Texto | The albums are loaded again from their sources the next time you open them. Your series, rankings, playlists and inventory are kept. | Os álbuns são carregados de novo das fontes na próxima vez que você os abrir. Suas séries, rankings, playlists e inventário são mantidos. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» + provável |
| `nav.clear-album-cache` | `components/navigation/PhoneMenu.js:118` | Rótulo/opção | Clear album cache | Limpar cache de álbuns | traduzir |
| `nav.menu` | `components/navigation/PhoneMenu.js:124`, `components/TopNav.js:40` | Dica (tooltip)/título | Menu | Menu | fica |
| `nav.back-to-top` | `components/navigation/PhoneShell.js:71` | Leitor de tela | Back to top | Voltar ao topo | traduzir |
| `nav.menu-and-account` | `components/navigation/PhoneShell.js:127` | Leitor de tela | Menu and account | Menu e conta | traduzir |
| `nav.inventory` | `components/navigation/phoneTabs.js:18`, `components/navigation/phoneTabs.js:30` +2 | Texto | Inventory | Inventário | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `nav.edit-playlists` | `components/navigation/phoneTabs.js:26` | Texto | Edit Playlists | Editar playlists | traduzir + provável |
| `nav.new-playlists-2` | `components/navigation/phoneTabs.js:27` | Texto | New Playlists | Novas playlists | traduzir + provável |
| `nav.series-by-artist-2` | `components/navigation/phoneTabs.js:31` | Texto | Series by Artist | Séries por artista | traduzir + MJRP decide + provável — Em inglês está em Title Case; em português fica igual ao rótulo minúsculo |
| `nav.series-by-genre-2` | `components/navigation/phoneTabs.js:32` | Texto | Series by Genre | Séries por gênero | traduzir + MJRP decide + provável — Idem |
| `nav.series-by-track-2` | `components/navigation/phoneTabs.js:33` | Texto | Series by Track | Séries por faixa | traduzir + MJRP decide + provável — Idem |
| `nav.album-blender` | `components/navigation/phoneTabs.js:36` | Texto | Album Blender | Album Blender | MJRP decide + provável — Parte do nome da marca (The Album Blender): manter ou traduzir? |
| `nav.main` | `components/navigation/phoneTabs.js:66` | Leitor de tela | Main | Principal | traduzir |
| `nav.by-genre` | `components/navigation/SeriesDropdown.js:24`, `components/TopNav.js:112` | Rótulo/opção | By Genre | Por gênero | traduzir |
| `nav.by-track` | `components/navigation/SeriesDropdown.js:25`, `components/TopNav.js:113` | Rótulo/opção | By Track | Por faixa | traduzir |
| `nav.music-series` | `components/navigation/SeriesDropdown.js:44`, `components/TopNav.js:40` | Texto | Music Series | Séries musicais | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `nav.mjrp-logo` | `components/TopNav.js:40` | Texto alternativo | MJRP Logo | Logotipo MJRP | traduzir |
| `nav.the-blending-menu` | `components/TopNav.js:64`, `components/TopNav.js:119` +2 · também em: Blend; Em breve | Texto | The Blending Menu | O Menu do Blend | MJRP decide — nome próprio do menu: traduzir «Blending Menu» ou manter em inglês? |
| `nav.go-back` | `router.js:237` | Texto | Go Back | Voltar | traduzir |
| `nav.view-error` | `router.js:237` | Texto | View Error | Ver o erro | traduzir |
| `nav.a-new-version-of-the` | `router.js:246` | Carregando/andamento | A new version of the app was published. Loading it… | Uma nova versão do app foi publicada. Carregando… | traduzir |
| `nav.load-the-new-version` | `router.js:248` | Texto | Load the new version | Carregar a nova versão | traduzir |
| `nav.the-app-was-updated-and` | `router.js:248` | Texto | The app was updated and this tab still has the previous version. | O app foi atualizado e esta aba ainda está com a versão anterior. | traduzir |
| `nav.this-screen-could-not-be` | `router.js:248` | Erro/aviso | This screen could not be loaded | Não foi possível carregar esta tela | traduzir |
| `nav.just-now` | `views/BaseView.js:111` | Texto | Just now | Agora há pouco | traduzir + provável |
| `nav.yesterday` | `views/BaseView.js:113` | Texto | Yesterday | Ontem | traduzir + provável |

## Conta e conexões (login, Spotify, Apple Music) (27)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `acct.by-signing-in-you-agree` | `components/LoginModal.js:13` | Texto | By signing in, you agree to our Terms and Privacy Policy. | Ao entrar, você concorda com os Termos e a Política de Privacidade. | traduzir — Termos e Política podem ser links |
| `acct.continue-as-guest` | `components/LoginModal.js:13` | Texto | Continue as Guest | Continuar como visitante | traduzir |
| `acct.google` | `components/LoginModal.js:13`, `components/LoginModal.js:108` | Texto alternativo | Google | Google | fica |
| `acct.or-continue-as-guest` | `components/LoginModal.js:13` | Texto | or continue as guest | ou continue como visitante | traduzir |
| `acct.series-playlists-and-inventory-made` | `components/LoginModal.js:13` | Texto | Series, playlists and inventory made as a guest stay with the guest session. They are not copied to your account when you sign in. | Séries, playlists e inventário feitos como visitante ficam na sessão de visitante. Eles não são copiados para a sua conta quando você entra. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `acct.sign-in-to-sync-your` | `components/LoginModal.js:13` | Texto | Sign in to sync your playlists across devices | Entre para sincronizar suas playlists entre dispositivos | traduzir |
| `acct.sign-in-with-apple` | `components/LoginModal.js:13`, `components/LoginModal.js:110` | Texto | Sign in with Apple | Entrar com Apple | traduzir |
| `acct.sign-in-with-google` | `components/LoginModal.js:13`, `components/LoginModal.js:108` | Texto | Sign in with Google | Entrar com Google | traduzir |
| `acct.welcome-back` | `components/LoginModal.js:13` | Texto | Welcome Back | Que bom ver você de novo | traduzir — Evita gênero de «bem-vindo/a» |
| `acct.successfully-signed-in` | `components/LoginModal.js:85` | Aviso (toast) | Successfully signed in! | Você entrou com sucesso! | traduzir |
| `acct.login-failed-n` | `components/LoginModal.js:93` | Erro/aviso | Login failed: {} | Falha ao entrar: {} | traduzir + montado + provável — {} = motivo do erro |
| `acct.login-provider-not-enabled-please` | `components/LoginModal.js:95` | Texto | Login provider not enabled. Please enable Google/Apple Sign-In in Firebase Console. | Provedor de login não ativado. Ative o login com Google/Apple no Firebase Console. | traduzir + provável — Mensagem de desenvolvedor, mas visível; traduzida |
| `acct.sign-in-cancelled` | `components/LoginModal.js:97` | Texto | Sign-in cancelled | Login cancelado | traduzir + provável |
| `acct.connected` | `components/SpotifyConnectButton.js:63` | Texto | Connected | Conectado | traduzir |
| `acct.disconnect` | `components/SpotifyConnectButton.js:63`, `components/SpotifyConnectButton.js:107` | Dica (tooltip)/título | Disconnect | Desconectar | traduzir |
| `acct.spotify-connected-n` | `components/SpotifyConnectButton.js:63` | Dica (tooltip)/título | Spotify connected: {} | Spotify conectado: {} | montado — muda a conta |
| `acct.connect` | `components/SpotifyConnectButton.js:81` | Texto | Connect | Conectar | traduzir |
| `acct.disconnect-from-spotify` | `components/SpotifyConnectButton.js:105` | Dica (tooltip)/título | Disconnect from Spotify? | Desconectar do Spotify? | traduzir |
| `acct.you-can-connect-again-at` | `components/SpotifyConnectButton.js:106` | Mensagem | You can connect again at any time. | Você pode conectar de novo quando quiser. | traduzir |
| `acct.disconnected-from-spotify` | `components/SpotifyConnectButton.js:111` | Aviso (toast) | Disconnected from Spotify | Desconectado do Spotify | traduzir |
| `acct.token-fetch-failed-n` | `services/musickit/MusicKitAuth.js:93` | Erro (pode chegar à tela) | Token fetch failed: {} | Falha ao buscar o token: {} | traduzir + montado — {} é o motivo do erro |
| `acct.musickit-start-left-behind-by` | `services/musickit/MusicKitAuth.js:112` | Erro (pode chegar à tela) | MusicKit start left behind by its deadline | A inicialização do MusicKit passou do prazo | traduzir |
| `acct.failed-to-load-musickit-js` | `services/musickit/MusicKitAuth.js:148` | Erro (pode chegar à tela) | Failed to load MusicKit JS | Não foi possível carregar o MusicKit JS | traduzir |
| `acct.created-by-mjrp-s-the` | `services/musickit/MusicKitLibrary.js:23`, `services/musickit/MusicKitLibrary.js:88` | Descrição | Created by MJRP's The Album Blender | Criada pelo The Album Blender do MJRP | traduzir |
| `acct.spotify-is-not-set-up` | `services/SpotifyAuthService.js:81` | Aviso (toast) | Spotify is not set up for this site: its client id is missing. | O Spotify não está configurado neste site: falta o client id. | traduzir |
| `acct.failed-to-exchange-token` | `services/SpotifyAuthService.js:160` | Erro/aviso | Failed to exchange token | Falha ao trocar o token | traduzir + provável |
| `acct.refresh-failed` | `services/SpotifyAuthService.js:282` | Erro (pode chegar à tela) | Refresh failed | Falha ao renovar | traduzir |

## Home (montar a série) (80)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `home.mjrp-the-album-blender-playlist` | `index.html:19`, `views/HomeView.js:46` · também em: Página base (index.html) | Texto | MJRP The Album Blender - Playlist Generator | MJRP The Album Blender - Gerador de Playlists | traduzir |
| `home.enter` | `components/album-picker/AlbumPickerPanel.js:68`, `components/blend/BlendSeriesSelector.js:322` +6 · também em: Blend; Componentes comuns (modais, filtros, paginação, avisos); Inventário; Playlists; Séries e álbuns | Texto | Enter | Entrar | MJRP decide + provável — Colide com «Sign in» (Entrar); decidir se a página de entrada usa «Entrar» ou «Começar». |
| `home.next-the-blend-turns-the` | `components/home/HomeDock.js:23` | Texto | Next: the Blend turns the series into playlists. | Em seguida: o Blend transforma a série em playlists. | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo; D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `home.the-order-counts-the-blend` | `components/home/HomeDock.js:24` | Texto | The order counts: the Blend reads the albums in this order when it spreads their tracks over the playlists. Use ↑ ↓ to change it. | A ordem importa: o Blend lê os álbuns nesta ordem ao distribuir as faixas pelas playlists. Use ↑ ↓ para mudar. | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo + provável |
| `home.you-re-not-signed-in` | `components/home/HomeDock.js:25` | Texto | You're not signed in: the series is saved to this browser only. | Você não entrou: a série fica salva só neste navegador. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `home.added-n` | `components/home/HomeDock.js:44`, `models/bulkPaste.js:84` +1 · também em: Outros | Texto | Added {}. | Adicionado: {}. | traduzir + montado + provável — {} é o nome do álbum; escrito para evitar concordância de gênero |
| `home.removed-n` | `components/home/HomeDock.js:44` | Texto | Removed «{}». | Removido: «{}». | traduzir + montado + provável — {} é o nome do álbum; escrito para evitar concordância de gênero |
| `home.your-series` | `components/home/HomeDock.js:131`, `components/home/HomeDock.js:235` +2 | Leitor de tela | Your series | Sua série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `home.find-it-any-time-in` | `components/home/HomeDock.js:152` | Texto | find it any time in Music Series | encontre quando quiser em Séries musicais | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `home.n-is-saved` | `components/home/HomeDock.js:161`, `components/home/HomeDock.js:295` | Texto | «{}» is saved | «{}» está salva | traduzir + montado — {} é o nome da série; «salva» concorda com série (feminino) |
| `home.series-name` | `components/home/HomeDock.js:168` | Rótulo/opção | Series name | Nome da série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `home.suggested-edit-it` | `components/home/HomeDock.js:169` | Texto | suggested · edit it | sugerido · edite | traduzir |
| `home.give-the-series-a-name` | `components/home/HomeDock.js:177` | Texto | Give the series a name first. | Dê um nome à série primeiro. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `home.use-n` | `components/home/HomeDock.js:178` | Botão | Use «{}» | Use «{}» | traduzir + montado + provável — {} é o nome sugerido |
| `home.saving-your-series` | `components/home/HomeDock.js:187` | Carregando/andamento | Saving your series… | Salvando sua série… | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `home.creating` | `components/home/HomeDock.js:196` | Carregando/andamento | Creating… | Criando… | traduzir + provável |
| `home.create-series` | `components/home/HomeDock.js:200` | Texto | Create series | Criar série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `home.blend-it-now` | `components/home/HomeDock.js:208` | Botão | Blend it now | Faça o Blend agora | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo + provável |
| `home.open-the-series` | `components/home/HomeDock.js:211` | Botão | Open the series | Abra a série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `home.add-one-album-to-create` | `components/home/HomeDock.js:219` | Texto | Add one album to create the series | Adicione um álbum para criar a série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `home.done` | `components/home/HomeDock.js:221`, `components/home/HomeDock.js:236` +2 · também em: Ranking e faixas | Texto | Done | Pronto | traduzir |
| `home.edit-order` | `components/home/HomeDock.js:221` | Texto | Edit order | Editar ordem | traduzir + provável |
| `home.start-another-series` | `components/home/HomeDock.js:227` | Botão | Start another series | Comece outra série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `home.your-series-in-order` | `components/home/HomeDock.js:233` | Leitor de tela | Your series, in order | Sua série, em ordem | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `home.moved-n` | `components/home/HomeDock.js:247` | Texto | · moved {} | · movido {} | traduzir + montado + provável — não sei o que {} traz (ex.: posição ou sentido); revisar a concordância |
| `home.move-n-up` | `components/home/HomeDock.js:253` | Texto | Move «{}» up | Mover «{}» para cima | traduzir + montado + provável — {} é o nome do álbum |
| `home.move-n-down` | `components/home/HomeDock.js:254` | Texto | Move «{}» down | Mover «{}» para baixo | traduzir + montado + provável — {} é o nome do álbum |
| `home.remove-n-from-the-series` | `components/home/HomeDock.js:255` | Texto | Remove «{}» from the series | Remover «{}» da série | traduzir + montado + MJRP decide + provável — {} é o nome do álbum |
| `home.not-saved` | `components/home/HomeDock.js:302` | Texto | Not saved | Não salva | traduzir + provável — concorda com série (feminino) |
| `home.not-saved-the-connection-dropped` | `components/home/HomeDock.js:302` | Texto | Not saved: the connection dropped | Não salva: a conexão caiu | traduzir + provável |
| `home.your-series-n-n-tap` | `components/home/HomeDock.js:307` | Leitor de tela | Your series: {}, {}. Tap to edit or reorder | Sua série: {}, {}. Toque para editar ou reordenar | traduzir + montado + MJRP decide — {} nome e quantidade de álbuns (provável); plural: 1 álbum / n álbuns |
| `home.no-name-yet` | `components/home/HomeDock.js:308` | Estado vazio | No name yet | Sem nome ainda | traduzir |
| `home.tap-to-edit-or-reorder` | `components/home/HomeDock.js:308` | Texto | Tap to edit or reorder | Toque para editar ou reordenar | traduzir |
| `home.your-list` | `components/home/HomePasteList.js:29` | Leitor de tela | Your list | Sua lista | traduzir |
| `home.add-albums` | `components/home/HomePasteList.js:31`, `components/home/HomePasteList.js:136` +2 | Texto | Add albums | Adicionar álbuns | traduzir |
| `home.your-list-one-album-per` | `components/home/HomePasteList.js:38` | Texto | Your list · one album per line, as Artist - Album | Sua lista · um álbum por linha, no formato Artista - Álbum | traduzir |
| `home.artist-album` | `components/home/HomePasteList.js:72` | Campo (placeholder) | Artist - Album | Artista - Álbum | traduzir |
| `home.line-nn` | `components/home/HomePasteList.js:113` | Leitor de tela | Line {}{} | Linha {}{} | traduzir + montado — {} número da linha e possível sufixo |
| `home.adding` | `components/home/HomePasteList.js:155` | Carregando/andamento | Adding… | Adicionando… | traduzir |
| `home.the-series-was-not-saved` | `controllers/HomeController.js:31` | Erro/aviso | The series was not saved: the connection dropped. Your albums are still here. | A série não foi salva: a conexão caiu. Seus álbuns continuam aqui. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `home.the-series-was-not-saved-2` | `controllers/HomeController.js:32` | Erro/aviso | The series was not saved. Your albums are still here. | A série não foi salva. Seus álbuns continuam aqui. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `home.add-between-artist-and-album` | `models/homePaste.js:15`, `models/homePaste.js:21` | Texto | add « - » between artist and album | coloque « - » entre o artista e o álbum | traduzir + provável |
| `home.add-the-album-name-after` | `models/homePaste.js:16`, `models/homePaste.js:22` | Texto | add the album name after « - » | coloque o nome do álbum depois de « - » | traduzir + provável |
| `home.n-n-ready-n-to` | `models/homePaste.js:49` | Texto | {}: {} ready, {} to fix. Lines to fix are skipped; the rest go in. | {}: {} prontas, {} para corrigir. As linhas para corrigir são ignoradas; as outras entram. | traduzir + montado — {} = nome, contagens; gênero/plural de «pronta(s)» (linhas): 1 pronta / n prontas |
| `home.add-this-line` | `models/homePaste.js:78` | Texto | Add this line | Adicionar esta linha | traduzir + provável |
| `home.add-these-n-lines` | `models/homePaste.js:79` | Texto | Add these {} lines | Adicionar estas {} linhas | traduzir + montado + provável — {} = número; plural |
| `home.n-from-n-the-order` | `models/homeSeries.js:60` | Texto | {} from {} · the order counts | {} de {} · a ordem conta | traduzir + montado + provável — {} = contagens/rótulos |
| `home.add-the-other-n` | `models/homeSeries.js:101` | Texto | Add the other {} | Adicionar os outros {} | traduzir + montado + provável — {} = número; «os outros» concorda com álbuns (masculino plural) |
| `home.add-all-n-n` | `models/homeSeries.js:102` | Texto | Add all {} {} | Adicionar todos os {} {} | traduzir + montado + provável — {} = número e «álbum/álbuns»; plural |
| `home.add-the-1-n` | `models/homeSeries.js:102` | Texto | Add the 1 {} | Adicionar o 1 {} | traduzir + montado + provável — {} = «álbum»; singular, gênero masculino |
| `home.n-n-newest-first` | `models/homeSeries.js:107` | Texto | {} {} · newest first | {} {} · mais recentes primeiro | traduzir + montado + provável — {} = número e «álbum/álbuns»; plural |
| `home.n-confirming-album-types` | `models/homeSeries.js:108` | Carregando/andamento | {} · confirming album types… | {} · confirmando os tipos de álbum… | traduzir + montado + provável — {} = texto anterior |
| `home.no-albums-yet` | `models/homeSeries.js:113`, `views/albums/AlbumsGridRenderer.js:39` · também em: Séries e álbuns | Dica (tooltip)/título | No albums yet | Nenhum álbum ainda | traduzir |
| `home.search-then-tap-a-cover` | `models/homeSeries.js:113` | Texto | Search, then tap a cover | Busque e toque numa capa | traduzir + provável |
| `home.tap-a-cover-to-add` | `models/homeSeries.js:113` | Texto | Tap a cover to add it | Toque numa capa para adicionar | traduzir + provável |
| `home.click-a-cover-to-add` | `models/homeSeries.js:114` | Texto | Click a cover to add it. | Clique numa capa para adicioná-la. | traduzir + provável |
| `home.search-an-artist-then-click` | `models/homeSeries.js:114` | Texto | Search an artist, then click a cover to add it. | Busque um artista e clique numa capa para adicioná-la. | traduzir + provável |
| `home.n-you-name-the-series` | `models/homeSeries.js:115` | Texto | {} You name the series at the end. | {} Você dá nome à série no final. | traduzir + montado + MJRP decide — {} = frase anterior |
| `home.your-series-is-empty` | `models/homeSeries.js:115` | Dica (tooltip)/título | Your series is empty | Sua série está vazia | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `home.click` | `views/HomeView.js:22` | Texto | Click | Clique em | traduzir + provável |
| `home.tap` | `views/HomeView.js:22` | Texto | Tap | Toque em | traduzir + provável |
| `home.an-artist-or-paste-a` | `views/HomeView.js:63` | Campo (placeholder) | An artist, or paste a list of albums | Um artista, ou cole uma lista de álbuns | traduzir |
| `home.search-an-artist-or-paste` | `views/HomeView.js:64` | Leitor de tela | Search an artist, or paste a list of albums | Busque um artista, ou cole uma lista de álbuns | traduzir |
| `home.pick-the-albums` | `views/HomeView.js:73` | Texto | Pick the albums. | Escolha os álbuns. | traduzir |
| `home.we-blend-the-playlists` | `views/HomeView.js:73` | Texto | We blend the playlists. | A gente faz o Blend das playlists. | traduzir — «Blend» como verbo: «fazer o Blend». |
| `home.a-series-is-the-set` | `views/HomeView.js:74` | Texto | A series is the set of albums you want to hear together, from one artist or many: the Blend turns it into balanced playlists. | Uma série é o conjunto de álbuns que você quer ouvir juntos, de um artista ou de vários: o Blend a transforma em playlists equilibradas. | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo; D-02 «Series»: proposta: traduzir por «Série(s)» |
| `home.find` | `views/HomeView.js:97` | Texto | Find | Encontrar | traduzir + provável |
| `home.create` | `views/HomeView.js:99` | Texto | Create | Criar | traduzir + provável |
| `home.album-types` | `views/HomeView.js:108` | Leitor de tela | Album types | Tipos de álbum | traduzir |
| `home.searching` | `views/HomeView.js:175` | Carregando/andamento | Searching… | Buscando… | traduzir + provável |
| `home.paste-or-type-one-album` | `views/HomeView.js:191` | Texto | Paste or type one album per line. | Cole ou digite um álbum por linha. | traduzir + provável |
| `home.search-an-artist-instead` | `views/HomeView.js:191` | Texto | Search an artist instead | Buscar um artista | traduzir + provável |
| `home.press-enter-or-search-to` | `views/HomeView.js:193` | Texto | Press Enter or Search to see their albums. A list with one album per line works too. | Pressione Enter ou Buscar para ver os álbuns. Uma lista com um álbum por linha também funciona. | traduzir + provável |
| `home.type-an-artist-to-see` | `views/HomeView.js:195` | Texto | Type an artist to see their albums, or | Digite um artista para ver os álbuns dele, ou | traduzir + provável |
| `home.looking-for-n-in-the` | `views/HomeView.js:230` | Texto | Looking for «{}» in the catalog… the covers appear as soon as it answers. | Procurando «{}» no catálogo… as capas aparecem assim que ele responder. | traduzir + montado — {} é o termo buscado |
| `home.check-the-spelling-or-paste` | `views/HomeView.js:245` | Texto | Check the spelling, or paste the albums as a list: one per line, Artist - Album. | Confira a grafia ou cole os álbuns como lista: um por linha, Artista - Álbum. | traduzir |
| `home.paste-a-list` | `views/HomeView.js:246` | Botão | Paste a list | Colar uma lista | traduzir |
| `home.nothing-was-changed-try-again` | `views/HomeView.js:249` | Estado vazio | Nothing was changed. Try again in a moment. | Nada foi alterado. Tente de novo daqui a pouco. | traduzir + provável |
| `home.your-series-still-has-its` | `views/HomeView.js:249` | Erro/aviso | Your series still has its {} album{}. Try again in a moment. | Sua série continua com {} álbum{}. Tente de novo daqui a pouco. | traduzir + montado + MJRP decide + provável — plural: 1 álbum / n álbuns; o segundo {} é o sufixo («ns»/vazio) — em pt «álbum»→«álbuns» não é só «s», o código precisa tratar |
| `home.n-is-saved-and-won` | `views/HomeView.js:309` | Texto | «{}» is saved and won't change here. {} a cover to start another series. | «{}» está salva e não vai mudar aqui. {} uma capa para começar outra série. | traduzir + montado + MJRP decide + provável — {} nome da série; o segundo {} é «Clique em»/«Toque em» (home.click / home.tap) |

## Séries e álbuns (144)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `ser.type-an-artist-name-first` | `components/album-picker/AlbumPickerController.js:58` | Aviso (toast) | Type an artist name first. | Digite primeiro o nome de um artista. | traduzir |
| `ser.enter-artist-name-e-g` | `components/album-picker/AlbumPickerPanel.js:32` | Campo (placeholder) | Enter artist name (e.g., Pink Floyd, T-Rex) | Digite o nome do artista (ex.: Pink Floyd, T-Rex) | traduzir |
| `ser.artist-name` | `components/album-picker/AlbumPickerPanel.js:33` | Leitor de tela | Artist name | Nome do artista | traduzir |
| `ser.search` | `components/album-picker/pickerParts.js:12`, `views/HomeView.js:58` · também em: Home (montar a série) | Texto | Search | Buscar | traduzir |
| `ser.try-again` | `components/album-picker/pickerParts.js:86`, `components/home/HomeDock.js:200` +6 · também em: Home (montar a série); Inventário; Playlists | Erro/aviso | Try again | Tente de novo | traduzir |
| `ser.series` | `components/blend/BlendSeriesSelector.js:199`, `components/playlists/SavedPlaylistsPhone.js:92` +2 · também em: Blend; Playlists | Texto | Series | Séries | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.album-cover` | `components/common/AlbumCascade.js:63` | Texto | Album cover | Capa do álbum | traduzir |
| `ser.popularity` | `components/ranking/TracksTable.js:27`, `views/helpers/SeriesComponentFactory.js:70` +1 · também em: Ranking e faixas | Rótulo/opção | Popularity | Popularidade | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `ser.series-not-found` | `components/series/SeriesEditModal.js:33`, `components/series/SeriesModals.js:58` +2 | Aviso (toast) | Series not found | Série não encontrada | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.series-name` | `components/series/SeriesEditModal.js:57`, `components/series/SeriesEditModal.js:71` | Campo (placeholder) | Series Name | Nome da série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.albums-in-series` | `components/series/SeriesEditModal.js:74` | Rótulo/opção | Albums in Series | Álbuns na série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.edit-series` | `components/series/SeriesEditModal.js:85`, `views/albums/AlbumsScopedRenderer.js:108` | Dica (tooltip)/título | Edit Series | Editar série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.album-already-in-list` | `components/series/SeriesEditModal.js:103` | Aviso (toast) | Album already in list | O álbum já está na lista | traduzir |
| `ser.added-n` | `components/series/SeriesEditModal.js:108` | Aviso (toast) | Added: {} | Adicionado: {} | montado — muda o nome do álbum |
| `ser.n-albums` | `components/series/SeriesEditModal.js:131`, `components/series/SeriesGridRenderer.js:148` +2 | Texto | {} albums | {} álbuns | traduzir + montado — plural: 1 álbum / n álbuns |
| `ser.no-albums-yet` | `components/series/SeriesEditModal.js:134` | Estado vazio | No albums yet. | Nenhum álbum ainda. | traduzir |
| `ser.remove-album` | `components/series/SeriesEditModal.js:145` | Dica (tooltip)/título | Remove album | Remover álbum | traduzir |
| `ser.remove-n` | `components/series/SeriesEditModal.js:146` | Leitor de tela | Remove {} | Remover {} | montado — muda o nome do álbum |
| `ser.x` | `components/series/SeriesEditModal.js:149` | Botão | x | x | fica |
| `ser.series-updated` | `components/series/SeriesEditModal.js:223` | Aviso (toast) | Series updated | Série atualizada | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.no-albums-in-library` | `components/series/SeriesEmptyState.js:12`, `views/helpers/SeriesViewUpdater.js:85` | Estado vazio | No albums in library | Nenhum álbum na biblioteca | traduzir |
| `ser.create-a-series-from-the` | `components/series/SeriesEmptyState.js:13`, `views/helpers/SeriesViewUpdater.js:86` | Texto | Create a series from the home page to get started | Crie uma série na página inicial para começar | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `ser.go-to-home` | `components/series/SeriesEmptyState.js:14`, `views/helpers/SeriesViewUpdater.js:87` | Texto | Go to Home | Ir para o Início | traduzir + MJRP decide — D-07 «Home»/«Start»: F85 decidiu «Start» / «Inicie»; resta os textos que ainda dizem «Home» + provável |
| `ser.remove-album-2` | `components/series/SeriesEventHandler.js:231` | Dica (tooltip)/título | Remove Album? | Remover álbum? | traduzir |
| `ser.are-you-sure-you-want` | `components/series/SeriesEventHandler.js:232` | Mensagem | Are you sure you want to remove "{} - {}" from this series? | Tem certeza de que quer remover "{} - {}" desta série? | montado + MJRP decide — muda artista e álbum |
| `ser.remove` | `components/series/SeriesEventHandler.js:233`, `components/ui/Card.js:68` +1 · também em: Componentes comuns (modais, filtros, paginação, avisos); Inventário | Confirmação/aviso do navegador | Remove | Remover | traduzir |
| `ser.album-removed-from-series` | `components/series/SeriesEventHandler.js:259` | Aviso (toast) | Album removed from series | Álbum removido da série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.could-not-find-album-query` | `components/series/SeriesEventHandler.js:268` | Erro/aviso | Could not find album query in series | Não foi possível encontrar a consulta do álbum na série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `ser.manual-removal-required` | `components/series/SeriesEventHandler.js:296` | Dica (tooltip)/título | Manual Removal Required | Remoção manual necessária | traduzir |
| `ser.we-couldn-t-automatically-match` | `components/series/SeriesEventHandler.js:297` | Mensagem | We couldn't automatically match this album to a record in your series. Please type the exact name/query to remove from the list below: {}{} | Não conseguimos associar este álbum automaticamente a um registro da sua série. Digite o nome/consulta exato para remover na lista abaixo: {}{} | montado + MJRP decide — os dois {} são pedaços montados pelo código (provavelmente HTML); ordem mantida |
| `ser.remove-query` | `components/series/SeriesEventHandler.js:299` | Confirmação/aviso do navegador | Remove Query | Remover consulta | traduzir |
| `ser.album-removed-manually` | `components/series/SeriesEventHandler.js:313` | Aviso (toast) | Album removed manually | Álbum removido manualmente | traduzir |
| `ser.manual-removal-failed-n` | `components/series/SeriesEventHandler.js:319` | Aviso (toast) | Manual removal failed: {} | Falha na remoção manual: {} | montado — muda a mensagem de erro |
| `ser.failed-to-remove-album-n` | `components/series/SeriesEventHandler.js:326` | Aviso (toast) | Failed to remove album: {} | Não foi possível remover o álbum: {} | montado — muda a mensagem de erro |
| `ser.rankings-saved-for-n` | `components/series/SeriesEventHandler.js:341` | Aviso (toast) | Rankings saved for "{}" | Rankings salvos para "{}" | montado — muda o nome do álbum |
| `ser.uncategorized` | `components/series/SeriesGridRenderer.js:148`, `models/albumType.js:27` +1 · também em: Outros | Texto | Uncategorized | Sem categoria | traduzir |
| `ser.all-albums-series` | `components/series/SeriesHeader.js:24`, `controllers/SeriesController.js:546` +4 · também em: Playlists | Texto | All Albums Series | Série de todos os álbuns | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.blend-your-albums` | `components/series/SeriesHeader.js:59` | Botão | Blend your Albums | Faça o Blend dos seus álbuns | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `ser.actions-for-the-series-n` | `components/series/SeriesHeader.js:74`, `views/albums/AlbumsScopedRenderer.js:108` | Leitor de tela | Actions for the series {} | Ações da série {} | montado + MJRP decide — muda o nome da série |
| `ser.database-not-initialized` | `components/series/SeriesModals.js:64`, `controllers/HomeController.js:353` · também em: Home (montar a série) | Aviso (toast) | Database not initialized | Banco de dados não inicializado | traduzir |
| `ser.could-not-check-the-saved` | `components/series/SeriesModals.js:75` | Aviso (toast) | Could not check the saved playlists of this series. Nothing was deleted. | Não foi possível verificar as playlists salvas desta série. Nada foi excluído. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.delete-series` | `components/series/SeriesModals.js:80` | Dica (tooltip)/título | Delete Series? | Excluir série? | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.are-you-sure-you-want-2` | `components/series/SeriesModals.js:81` | Mensagem | Are you sure you want to delete "{}"? {}Albums will NOT be deleted from inventory. | Tem certeza de que quer excluir "{}"? {}Os álbuns NÃO serão excluídos do inventário. | montado + MJRP decide — o primeiro {} é o nome da série; o segundo é um aviso opcional montado pelo código |
| `ser.delete-series-2` | `components/series/SeriesModals.js:82`, `views/albums/AlbumsScopedRenderer.js:108` | Confirmação/aviso do navegador | Delete Series | Excluir série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.series-deleted-successfully` | `components/series/SeriesModals.js:89` | Aviso (toast) | Series deleted successfully | Série excluída com sucesso | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.failed-to-delete-series` | `components/series/SeriesModals.js:93` | Aviso (toast) | Failed to delete series | Não foi possível excluir a série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.its-n-n-will-be` | `components/series/SeriesModals.js:106` | Texto | Its {} ({}) will be deleted too. | Seus {} ({}) também serão excluídos. | montado + provável — plural/gênero: «Sua playlist (1)» / «Suas playlists (n)»; o código deve concordar |
| `ser.open-in-spotify` | `components/series/SeriesPhoneSheets.js:43` | Rótulo/opção | Open in Spotify | Abrir no Spotify | traduzir |
| `ser.see-on-besteveralbums` | `components/series/SeriesPhoneSheets.js:46` | Rótulo/opção | See on BestEverAlbums | Ver no BestEverAlbums | traduzir |
| `ser.view-album-and-tracks` | `components/series/SeriesPhoneSheets.js:66` | Rótulo/opção | View album and tracks | Ver álbum e faixas | traduzir |
| `ser.edit-my-ranking` | `components/series/SeriesPhoneSheets.js:67` | Texto | Edit my ranking | Editar meu ranking | traduzir + provável |
| `ser.rank-the-tracks` | `components/series/SeriesPhoneSheets.js:67` | Texto | Rank the tracks | Classificar as faixas | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» + provável |
| `ser.add-to-inventory` | `components/series/SeriesPhoneSheets.js:68` | Rótulo/opção | Add to inventory | Adicionar ao inventário | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `ser.fetch-the-details-again` | `components/series/SeriesPhoneSheets.js:69` | Rótulo/opção | Fetch the details again | Buscar os detalhes de novo | traduzir |
| `ser.remove-from-this-series` | `components/series/SeriesPhoneSheets.js:72` | Rótulo/opção | Remove from this series | Remover desta série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.album` | `components/series/SeriesPhoneSheets.js:75`, `models/albumType.js:22` +1 · também em: Blend; Outros | Texto | Album | Álbum | traduzir + provável |
| `ser.edit-series-2` | `components/series/SeriesPhoneSheets.js:93` | Rótulo/opção | Edit series | Editar série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.delete-series-3` | `components/series/SeriesPhoneSheets.js:94` | Rótulo/opção | Delete series | Excluir série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.rank` | `components/ui/AlbumCardRenderer.js:69` | Texto | Rank | Classificar | traduzir + MJRP decide + provável — verbo, ação de classificar as faixas |
| `ser.ranked` | `components/ui/AlbumCardRenderer.js:69` | Texto | Ranked | Classificado | traduzir + provável — estado: já classificado |
| `ser.add` | `components/ui/AlbumCardRenderer.js:70`, `components/ui/Card.js:67` +1 · também em: Componentes comuns (modais, filtros, paginação, avisos); Home (montar a série) | Rótulo/opção | Add | Adicionar | traduzir |
| `ser.del` | `components/ui/AlbumCardRenderer.js:71` | Rótulo/opção | Del | Excl. | traduzir — abreviação de Excluir |
| `ser.refetch` | `components/ui/AlbumCardRenderer.js:72` | Rótulo/opção | Refetch | Buscar de novo | traduzir |
| `ser.no-tracks-available` | `components/ui/AlbumCardRenderer.js:242` | Estado vazio | No tracks available | Nenhuma faixa disponível | traduzir |
| `ser.open-n` | `components/ui/AlbumPhoneCard.js:73` | Leitor de tela | Open {} | Abrir {} | montado — muda o nome do álbum |
| `ser.loading-the-tracks-of-this` | `components/ViewAlbumModal.js:27` | Carregando/andamento | Loading the tracks of this album… | Carregando as faixas deste álbum… | traduzir + provável |
| `ser.the-tracks-of-this-album` | `components/ViewAlbumModal.js:28` | Erro/aviso | The tracks of this album could not be loaded. Close this window and open it again to try once more. | Não foi possível carregar as faixas deste álbum. Feche esta janela e abra de novo para tentar mais uma vez. | traduzir + provável |
| `ser.no-tracks-are-kept-for` | `components/ViewAlbumModal.js:29` | Estado vazio | No tracks are kept for this album. | Não há faixas guardadas para este álbum. | traduzir + provável |
| `ser.notes` | `components/ViewAlbumModal.js:74` | Texto | Notes | Notas | traduzir + provável |
| `ser.paid` | `components/ViewAlbumModal.js:324` | Texto | Paid: | Pago: | traduzir + provável |
| `ser.cond` | `components/ViewAlbumModal.js:327` | Texto | Cond: | Cond.: | traduzir + provável — abreviação de Condição (estado do disco) |
| `ser.failed-to-load-series-data` | `controllers/SeriesController.js:163` | Aviso (toast) | Failed to load series data | Não foi possível carregar os dados da série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ser.loading-n-again` | `controllers/SeriesController.js:370` | Aviso (toast) | Loading "{}" again... | Carregando "{}" de novo… | traduzir + montado — {} = nome do álbum |
| `ser.n-is-not-loaded-on` | `controllers/SeriesController.js:371` | Aviso (toast) | "{}" is not loaded on this screen | "{}" não está carregado nesta tela | traduzir + montado — {} = nome; «carregado» pode variar com o gênero do item |
| `ser.acclaim-ratings` | `models/albumAsk.js:43` | Texto | Acclaim ratings | Notas da crítica | MJRP decide — «Acclaim» é a nota agregada da crítica; escolhi «Notas da crítica», mas «Aclamação» também serve. |
| `ser.your-own-ranking` | `models/albumAsk.js:45` | Texto | Your own ranking | Seu próprio ranking | traduzir |
| `ser.because-spotify-is-not-connected` | `models/albumAsk.js:52` | Texto | because Spotify is not connected | porque o Spotify não está conectado | traduzir + provável |
| `ser.the-server-paused-the-load` | `models/albumAsk.js:94` | Mensagem | The server paused the load before this album was found | O servidor pausou o carregamento antes de este álbum ser encontrado | traduzir |
| `ser.its` | `models/albumAsk.js:176` | Texto | Its | Sua | traduzir + montado + provável — concorda em gênero com o item seguinte (Sua/Seu); EN «Its» é ambíguo |
| `ser.their` | `models/albumAsk.js:176` | Texto | Their | Sua | traduzir + montado + provável — concorda em gênero/número com o item seguinte (Sua/Seu/Suas/Seus); EN «Their» é ambíguo |
| `ser.this-series-has-no-albums` | `models/albumAsk.js:204` | Texto | This series has no albums. | Esta série não tem álbuns. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `ser.none-of-the-n-n` | `models/albumAsk.js:205` | Texto | None of the {} {} could be loaded: {}. | Nenhum dos {} {} pôde ser carregado: {}. | traduzir + montado + provável — {} = número, «álbum/álbuns» e motivo; plural: 1 álbum / n álbuns |
| `ser.loading-albums-n-of-n` | `models/albumAsk.js:211` | Carregando/andamento | Loading albums: {} of {}... | Carregando álbuns: {} de {}… | traduzir + montado + provável — {} = contagens |
| `ser.waiting-for-the-ratings-of` | `models/albumAsk.js:212` | Carregando/andamento | Waiting for the ratings of {} of {} {}... | Aguardando as notas de {} de {} {}… | traduzir + montado + provável — {} = contagens e «álbum/álbuns»; plural |
| `ser.your-sign-in-could-not` | `models/albumLoadState.js:54` | Erro/aviso | Your sign-in could not be confirmed. Sign in again to keep loading ratings. | Não foi possível confirmar sua entrada. Entre de novo para continuar carregando as notas. | traduzir |
| `ser.it-resumes-by-itself-at` | `models/albumLoadState.js:56` | Texto | It resumes by itself at {}. | Ela continua sozinha às {}. | traduzir + montado + provável — {} = horário; «ela» se refere à carga (feminino) |
| `ser.the-ratings-source-asked-to` | `models/albumLoadState.js:58` | Mensagem | The ratings source asked to slow down. Loading ratings is paused.{} | A fonte das notas pediu para ir mais devagar. O carregamento das notas está pausado.{} | traduzir + montado — {} = frase opcional (ex.: «Ela continua sozinha às …») |
| `ser.spotify-asked-to-slow-down` | `models/albumLoadState.js:61` | Mensagem | Spotify asked to slow down. Loading popularity is paused.{} | O Spotify pediu para ir mais devagar. O carregamento da popularidade está pausado.{} | traduzir + montado — {} = frase opcional |
| `ser.the-server-asked-to-slow` | `models/albumLoadState.js:63` | Mensagem | The server asked to slow down. Loading is paused.{} | O servidor pediu para ir mais devagar. O carregamento está pausado.{} | traduzir + montado — {} = frase opcional |
| `ser.asked-for-by-its-short` | `models/askedAlbum.js:98` | Texto | Asked for by its short title: the catalog only has this one, with a subtitle. | Pedido pelo título curto: o catálogo só tem este, com um subtítulo. | traduzir + provável |
| `ser.asked-for-by-its-short-2` | `models/askedAlbum.js:99` | Texto | Asked for by its short title: the catalog only has this one, with more in parentheses. | Pedido pelo título curto: o catálogo só tem este, com mais coisa entre parênteses. | traduzir + provável |
| `ser.asked-for-by-the-name` | `models/askedAlbum.js:100` | Texto | Asked for by the name the catalog writes in parentheses. | Pedido pelo nome que o catálogo escreve entre parênteses. | traduzir + provável |
| `ser.asked-for-by-its-title` | `models/askedAlbum.js:101` | Texto | Asked for by its title: the catalog writes the artist's name in front of it. | Pedido pelo título: o catálogo escreve o nome do artista na frente. | traduzir + provável |
| `ser.asked-for-in-another-spelling` | `models/askedAlbum.js:102` | Texto | Asked for in another spelling: the catalog writes the title this way. | Pedido com outra grafia: o catálogo escreve o título assim. | traduzir + provável |
| `ser.asking-spotify-for-popularity` | `models/popularityState.js:10` | Carregando/andamento | Asking Spotify for popularity… | Perguntando ao Spotify pela popularidade… | traduzir |
| `ser.connect-spotify-to-see-popularity` | `models/popularityState.js:14` | Texto | Connect Spotify to see popularity. | Conecte o Spotify para ver a popularidade. | traduzir |
| `ser.spotify-did-not-answer` | `models/popularityState.js:15` | Erro/aviso | Spotify did not answer. | O Spotify não respondeu. | traduzir |
| `ser.ask-again` | `models/popularityState.js:16` | Texto | Ask again | Perguntar de novo | traduzir + provável |
| `ser.spotify-has-no-popularity-for` | `models/popularityState.js:16` | Texto | Spotify has no popularity for this album. | O Spotify não tem popularidade para este álbum. | traduzir |
| `ser.the-catalog-did-not-answer` | `models/scanState.js:86` | Erro/aviso | The catalog did not answer in {} seconds. | O catálogo não respondeu em {} segundos. | traduzir + montado + provável — {} = número; plural: 1 segundo / n segundos |
| `ser.the-search-could-not-be` | `models/scanState.js:87` | Erro/aviso | The search could not be completed. | Não foi possível concluir a busca. | traduzir + provável |
| `ser.search-for-an-artist-to` | `models/scanState.js:92` | Dica (tooltip)/título | Search for an artist to begin scanning. | Busque um artista para começar a escanear. | traduzir |
| `ser.searching-the-catalog-for-n` | `models/scanState.js:93` | Dica (tooltip)/título | Searching the catalog for «{}»… | Buscando «{}» no catálogo… | traduzir + montado — {} = nome do artista |
| `ser.the-albums-appear-as-soon` | `models/scanState.js:93` | Texto | The albums appear as soon as the catalog answers. | Os álbuns aparecem assim que o catálogo responder. | traduzir |
| `ser.check-the-spelling-or-try` | `models/scanState.js:95` | Texto | Check the spelling or try another name. | Confira a grafia ou tente outro nome. | traduzir |
| `ser.no-albums-found-for-n` | `models/scanState.js:95`, `views/HomeView.js:244` · também em: Home (montar a série) | Dica (tooltip)/título | No albums found for «{}». | Nenhum álbum encontrado para «{}». | traduzir + montado — {} = nome do artista |
| `ser.nothing-was-changed-you-can` | `models/scanState.js:96` | Estado vazio | Nothing was changed. You can ask again. | Nada foi alterado. Você pode perguntar de novo. | traduzir |
| `ser.scanning` | `models/scanState.js:101`, `models/scanState.js:115` | Carregando/andamento | Scanning… | Escaneando… | traduzir + provável |
| `ser.confirming-album-types` | `models/scanState.js:102` | Carregando/andamento | · confirming album types… | · confirmando os tipos de álbum… | traduzir + provável |
| `ser.not-found` | `models/scanState.js:103` | Texto | → Not found | → Não encontrado | traduzir + provável |
| `ser.search-failed` | `models/scanState.js:104` | Erro/aviso | → Search failed | → Falha na busca | traduzir + provável |
| `ser.scan` | `models/scanState.js:115` | Texto | Scan | Escanear | MJRP decide + provável — «Scan» é verbo de botão da busca no catálogo; «Escanear» ou «Varrer» (e «Varrendo…» na linha 175)? Usei Escanear. |
| `ser.give-the-series-a-name` | `models/seriesDraft.js:24` | Texto | Give the series a name before saving. | Dê um nome à série antes de salvar. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `ser.the-database-is-not-ready` | `models/seriesDraft.js:25` | Texto | The database is not ready yet. Nothing was saved; your changes are still here. | O banco de dados ainda não está pronto. Nada foi salvo; suas alterações continuam aqui. | traduzir + provável |
| `ser.the-series-could-not-be` | `models/seriesDraft.js:26` | Erro/aviso | The series could not be saved. Your changes are still here: you can try again. | Não foi possível salvar a série. Suas alterações continuam aqui: você pode tentar de novo. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `ser.saving` | `models/seriesDraft.js:55` | Carregando/andamento | Saving… | Salvando… | traduzir + provável |
| `ser.my-ranking` | `ranking/UserRankingStrategy.js:21`, `views/helpers/SeriesComponentFactory.js:67` +1 · também em: Ranking e faixas | Rótulo/opção | My Ranking | Meu ranking | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `ser.the-ai-list` | `services/album-search/AlbumSearchService.js:123` | Texto | the AI list | a lista da IA | traduzir + provável |
| `ser.http-n-n` | `services/album-search/AlbumSearchService.js:186` | Texto | HTTP {} {} | HTTP {} {} | técnico + montado + provável — dois {}: código e texto do HTTP |
| `ser.robert-plant-jimmy-page` | `services/album-search/ArtistNormalizer.js:11`, `services/album-search/ArtistNormalizer.js:12` +1 | Texto | robert plant & jimmy page | robert plant & jimmy page | fica + provável — Nome de artista, não se traduz. |
| `ser.page-plant` | `services/album-search/ArtistNormalizer.js:12` | Texto | page & plant | page & plant | fica + provável — Nome de artista, não se traduz. |
| `ser.simon-garfunkel` | `services/album-search/ArtistNormalizer.js:20` | Texto | simon & garfunkel | simon & garfunkel | fica + provável — Nome de artista, não se traduz. |
| `ser.crosby-stills-nash-young` | `services/album-search/ArtistNormalizer.js:21`, `services/album-search/ArtistNormalizer.js:22` | Texto | crosby, stills, nash & young | crosby, stills, nash & young | fica + provável — Nome de artista, não se traduz. |
| `ser.emerson-lake-palmer` | `services/album-search/ArtistNormalizer.js:23` | Texto | emerson, lake & palmer | emerson, lake & palmer | fica + provável — Nome de artista, não se traduz. |
| `ser.failed-to-load-albums-data` | `services/AlbumLoader.js:43` | Erro (pode chegar à tela) | Failed to load albums data | Não foi possível carregar os dados dos álbuns | traduzir |
| `ser.n-passed-n-ms` | `services/albums/adapters/CatalogAdapter.js:31` | Erro (pode chegar à tela) | {} passed {} ms | {} passou de {} ms | traduzir + montado — primeiro {} é o nome da fonte, segundo é o prazo em ms |
| `ser.no-catalog-has-n` | `services/albums/adapters/CatalogAdapter.js:62` | Erro (pode chegar à tela) | No catalog has "{}" | Nenhum catálogo tem "{}" | traduzir + montado — {} é o nome buscado |
| `ser.apple-music-search` | `services/albums/adapters/CatalogAdapter.js:136` | Texto | Apple Music search | Busca no Apple Music | traduzir + provável |
| `ser.the-ratings-request-failed` | `services/albums/adapters/enrichers.js:63` | Erro (pode chegar à tela) | The ratings request failed | O pedido das notas falhou | traduzir |
| `ser.album-not-found` | `services/albums/AlbumLoadService.js:43` | Texto | Album not found | Álbum não encontrado | traduzir + provável |
| `ser.untitled-series` | `services/SeriesService.js:82` | Texto | Untitled Series | Série sem título | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `ser.could-not-find-album-n` | `services/SeriesService.js:209` | Erro (pode chegar à tela) | Could not find album "{}" in series | Não foi possível encontrar o álbum "{}" na série | traduzir + montado + MJRP decide — {} é o nome do álbum |
| `ser.loading-albums` | `views/albums/AlbumsGridRenderer.js:20` | Carregando/andamento | Loading albums... | Carregando álbuns… | traduzir |
| `ser.add-albums-from-the-home` | `views/albums/AlbumsGridRenderer.js:39` | Texto | Add albums from the Home page to get started | Adicione álbuns pela página Início para começar | traduzir |
| `ser.no-albums-match-your-filters` | `views/albums/AlbumsGridRenderer.js:52` | Estado vazio | No albums match your filters | Nenhum álbum corresponde aos seus filtros | traduzir |
| `ser.try-adjusting-your-search-or` | `views/albums/AlbumsGridRenderer.js:52` | Texto | Try adjusting your search or filters | Tente ajustar a busca ou os filtros | traduzir |
| `ser.all-years` | `views/helpers/SeriesComponentFactory.js:57`, `views/helpers/SeriesComponentFactory.js:118` +2 | Rótulo/opção | All Years | Todos os anos | traduzir |
| `ser.all-sources` | `views/helpers/SeriesComponentFactory.js:66`, `views/helpers/SeriesComponentFactory.js:126` +2 | Rótulo/opção | All Sources | Todas as fontes | traduzir |
| `ser.pending` | `views/helpers/SeriesComponentFactory.js:68`, `views/helpers/SeriesViewUpdater.js:119` | Rótulo/opção | Pending | Pendente | traduzir |
| `ser.ai-enriched` | `views/helpers/SeriesComponentFactory.js:71`, `views/helpers/SeriesViewUpdater.js:122` | Rótulo/opção | AI Enriched | Enriquecido por IA | traduzir |
| `ser.name-a-z` | `views/helpers/SeriesComponentFactory.js:77`, `views/SavedPlaylistsView.js:223` · também em: Playlists | Rótulo/opção | Name (A-Z) | Nome (A-Z) | traduzir |
| `ser.name-z-a` | `views/helpers/SeriesComponentFactory.js:78`, `views/SavedPlaylistsView.js:224` · também em: Playlists | Rótulo/opção | Name (Z-A) | Nome (Z-A) | traduzir |
| `ser.all-artists` | `views/helpers/SeriesComponentFactory.js:110`, `views/helpers/SeriesViewUpdater.js:148` | Rótulo/opção | All Artists | Todos os artistas | traduzir |
| `ser.all-series` | `views/helpers/SeriesViewUpdater.js:135` | Rótulo/opção | All Series | Todas as séries | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |

## Ranking e faixas (62)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `rank.spotify-popularity` | `components/blend/BlendIngredientsPanel.js:106`, `components/ui/TrackRow.js:212` +1 · também em: Blend | Rótulo/opção | Spotify Popularity | Popularidade no Spotify | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `rank.escape` | `components/navigation/AuthNav.js:173`, `components/ranking/UserRankModal.js:92` +5 · também em: Componentes comuns (modais, filtros, paginação, avisos); Menu, rodapé e aplicação; Outros; Playlists; Séries e álbuns | Texto | Escape | Escape | fica + provável — Nome da tecla; pode virar «Esc» |
| `rank.my-ranking` | `components/ranking/rankWindowPhone.js:21`, `components/ui/AlbumPhoneCard.js:25` · também em: Séries e álbuns | Dica (tooltip)/título | My ranking | Meu ranking | traduzir |
| `rank.tap-a-track-to-move` | `components/ranking/rankWindowPhone.js:22` | Descrição | Tap a track to move it with the buttons below, or drag it by its handle. | Toque em uma faixa para movê-la com os botões abaixo, ou arraste-a pela alça. | traduzir |
| `rank.bea-and-spotify-ranks-are` | `components/ranking/rankWindowPhone.js:23` | Texto | BEA and Spotify ranks are shown for reference. Your ranking is used by the "Top Tracks by My Own Ranking" recipe. | Os rankings do BEA e do Spotify aparecem só como referência. Seu ranking é usado pela receita "Principais faixas pelo meu próprio ranking". | MJRP decide — Nome da receita entre aspas: traduzir ou manter o inglês, igual ao nome na tela das receitas? |
| `rank.back-to-the-order-of` | `components/ranking/rankWindowPhone.js:24` | Texto | Back to the order of the album. | Volta à ordem do álbum. | traduzir + provável |
| `rank.discard-changes` | `components/ranking/rankWindowPhone.js:26` | Texto | Discard changes? | Descartar alterações? | traduzir + provável |
| `rank.your-new-order-has-not` | `components/ranking/rankWindowPhone.js:27` | Texto | Your new order has not been saved. | Sua nova ordem não foi salva. | traduzir + provável |
| `rank.keep-editing` | `components/ranking/rankWindowPhone.js:28` | Texto | Keep editing | Continuar editando | traduzir + provável |
| `rank.discard` | `components/ranking/rankWindowPhone.js:29` | Texto | Discard | Descartar | traduzir + provável |
| `rank.bea-n` | `components/ranking/rankWindowPhone.js:44` | Texto | BEA #{} | BEA #{} | fica + montado + provável — {} = posição |
| `rank.spotify-n` | `components/ranking/rankWindowPhone.js:45` | Texto | Spotify #{} | Spotify #{} | fica + montado + provável — {} = posição |
| `rank.back` | `components/ranking/rankWindowPhone.js:70`, `components/ranking/UserRankModal.js:275` | Botão | Back | Voltar | traduzir |
| `rank.reset` | `components/ranking/rankWindowPhone.js:72`, `components/ranking/UserRankModal.js:283` | Botão | Reset | Redefinir | traduzir |
| `rank.move-the-track` | `components/ranking/rankWindowPhone.js:91` | Leitor de tela | Move the track | Mover a faixa | traduzir |
| `rank.move-up` | `components/ranking/rankWindowPhone.js:92`, `components/series/SeriesEditModal.js:173` +1 · também em: Playlists; Séries e álbuns | Texto | Move up | Mover para cima | traduzir |
| `rank.down` | `components/ranking/rankWindowPhone.js:93` | Texto | Down | Para baixo | traduzir + provável |
| `rank.move-down` | `components/ranking/rankWindowPhone.js:93`, `components/series/SeriesEditModal.js:173` +1 · também em: Playlists; Séries e álbuns | Texto | Move down | Mover para baixo | traduzir |
| `rank.move-to` | `components/ranking/rankWindowPhone.js:94` | Carregando/andamento | Move to… | Mover para… | traduzir |
| `rank.save-ranking` | `components/ranking/rankWindowPhone.js:97` | Botão | Save ranking | Salvar ranking | traduzir |
| `rank.n-is-now-number-n` | `components/ranking/rankWindowPhone.js:150` | Texto | {} is now number {} | {} agora é o número {} | montado — muda o nome da faixa e o número |
| `rank.number-n` | `components/ranking/rankWindowPhone.js:165` | Texto | Number {} | Número {} | montado + provável — muda o número |
| `rank.number-n-where-it-is` | `components/ranking/rankWindowPhone.js:165` | Texto | Number {}, where it is | Número {}, onde está | montado + provável — muda o número |
| `rank.move-n-to` | `components/ranking/rankWindowPhone.js:174` | Dica (tooltip)/título | Move "{}" to | Mover "{}" para | montado — muda o nome da faixa |
| `rank.asking` | `components/ranking/TracksRankingComparison.js:188` | Carregando/andamento | Asking… | Perguntando… | traduzir |
| `rank.track-name` | `components/ranking/TracksTable.js:24` | Rótulo/opção | Track Name | Nome da faixa | traduzir |
| `rank.my-rank` | `components/ranking/TracksTable.js:25` | Rótulo/opção | My Rank | Meu ranking | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `rank.time` | `components/ranking/TracksTable.js:28` | Rótulo/opção | Time | Tempo | traduzir |
| `rank.your-rank` | `components/ranking/TracksTable.js:96`, `components/ui/TrackRow.js:179` | Dica (tooltip)/título | Your Rank | Seu ranking | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `rank.aggregated-rating` | `components/ranking/TracksTable.js:118` | Texto | Aggregated Rating | Nota agregada | traduzir + provável |
| `rank.score` | `components/ranking/TracksTable.js:154` | Texto | Score | Pontuação | traduzir |
| `rank.not-linked` | `components/ranking/TracksTable.js:176` | Texto | Not linked | Não vinculado | traduzir |
| `rank.my-avg` | `components/ranking/TracksTable.js:280` | Texto | My Avg: | Minha média: | traduzir + provável |
| `rank.avg-rating` | `components/ranking/TracksTable.js:288` | Texto | Avg Rating: | Nota média: | traduzir + provável |
| `rank.avg-pop` | `components/ranking/TracksTable.js:296` | Texto | Avg Pop: | Pop. média: | traduzir + provável — abreviação de popularidade |
| `rank.the-order-of-the-album` | `components/ranking/TracksTabs.js:16` | Texto | The order of the album | A ordem do álbum | traduzir |
| `rank.track-listing` | `components/ranking/TracksTabs.js:16` | Rótulo/opção | Track Listing | Lista de faixas | traduzir |
| `rank.the-besteveralbums-rank` | `components/ranking/TracksTabs.js:17` | Texto | The BestEverAlbums rank | O ranking do BestEverAlbums | traduzir |
| `rank.the-spotify-popularity` | `components/ranking/TracksTabs.js:18` | Texto | The Spotify popularity | A popularidade no Spotify | traduzir |
| `rank.besteveralbums-rating` | `components/ranking/TracksTabs.js:69` | Texto | BestEverAlbums rating | Nota no BestEverAlbums | traduzir |
| `rank.spotify-popularity-2` | `components/ranking/TracksTabs.js:73`, `models/albumAsk.js:44` · também em: Séries e álbuns | Texto | Spotify popularity | Popularidade no Spotify | traduzir |
| `rank.order-the-tracks-by` | `components/ranking/TracksTabs.js:93` | Leitor de tela | Order the tracks by | Ordene as faixas por | traduzir |
| `rank.ranking-saved` | `components/ranking/UserRankModal.js:219` | Aviso (toast) | Ranking saved! | Ranking salvo! | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» + provável |
| `rank.failed-to-save-please-try` | `components/ranking/UserRankModal.js:229` | Aviso (toast) | Failed to save. Please try again. | Não foi possível salvar. Tente de novo. | traduzir + provável |
| `rank.rank-your-album` | `components/ranking/UserRankModal.js:299` | Texto | Rank Your Album | Classifique seu álbum | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `rank.drag-tracks-to-set-your` | `components/ranking/UserRankModal.js:308` | Texto | Drag tracks to set your personal ranking: | Arraste as faixas para definir seu ranking pessoal: | traduzir |
| `rank.bea-and-spotify-ranks-shown` | `components/ranking/UserRankModal.js:326` | Texto | BEA and Spotify ranks shown for reference. Your ranking will be used in "Top Tracks by My Own Ranking" recipe. | Os rankings do BEA e do Spotify aparecem como referência. Seu ranking será usado na receita "Top Tracks by My Own Ranking". | traduzir + MJRP decide + provável — O nome da receita entre aspas ficou em inglês; traduzir ou manter depende do nome na lista de receitas. |
| `rank.besteveralbums-rank` | `components/ranking/UserRankModal.js:383`, `components/ui/TrackRow.js:188` | Dica (tooltip)/título | BestEverAlbums Rank | Ranking do BestEverAlbums | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `rank.n-bea` | `components/ranking/UserRankModal.js:384` | Texto | #{} BEA | #{} BEA | fica + montado — muda o número |
| `rank.spotify-rank` | `components/ranking/UserRankModal.js:390`, `components/ui/TrackRow.js:207` | Dica (tooltip)/título | Spotify Rank | Ranking do Spotify | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `rank.n-spfy` | `components/ranking/UserRankModal.js:391` | Texto | #{} SPFY | #{} SPFY | fica + montado — muda o número |
| `rank.media-hover-hover-opacity-0` | `components/ui/TrackRow.js:33` | Texto | [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100 | [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100 | técnico + provável |
| `rank.besteveralbums-rating-2` | `components/ui/TrackRow.js:194` | Dica (tooltip)/título | BestEverAlbums Rating | Nota do BestEverAlbums | traduzir |
| `rank.balanced-default` | `ranking/BalancedRankingStrategy.js:21` | Texto | Balanced (Default) | Equilibrado (padrão) | traduzir |
| `rank.prioritizes-acclaim-rank-then-rating` | `ranking/BalancedRankingStrategy.js:22` | Descrição | Prioritizes Acclaim Rank, then Rating, then Score. | Dá prioridade ao ranking de aclamação, depois à nota e depois à pontuação. | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `rank.track-n` | `ranking/BalancedRankingStrategy.js:45`, `ranking/BalancedRankingStrategy.js:71` | Texto | Track {} | Faixa {} | traduzir + montado + provável — {} é o número da faixa |
| `rank.bea-rating` | `ranking/BEARankingStrategy.js:28` | Texto | BEA Rating | Nota BEA | traduzir |
| `rank.prioritizes-besteveralbums-ratings` | `ranking/BEARankingStrategy.js:29` | Descrição | Prioritizes BestEverAlbums Ratings. | Dá prioridade às notas do BestEverAlbums. | traduzir |
| `rank.abstract-strategy` | `ranking/RankingStrategy.js:13` | Texto | Abstract Strategy | Estratégia abstrata | traduzir |
| `rank.base-class` | `ranking/RankingStrategy.js:14` | Descrição | Base class | Classe base | traduzir |
| `rank.prioritizes-spotify-popularity-0-100` | `ranking/SpotifyRankingStrategy.js:17` | Descrição | Prioritizes Spotify Popularity (0-100). | Dá prioridade à popularidade no Spotify (0-100). | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `rank.your-personal-track-order-based` | `ranking/UserRankingStrategy.js:22` | Descrição | Your personal track order based on your preferences. | Sua ordem pessoal de faixas, baseada nas suas preferências. | traduzir |

## Blend (79)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `blend.one-playlist-with-all-tracks` | `components/blend/BlendIngredientsPanel.js:97` | Descrição | One playlist with all tracks | Uma playlist com todas as faixas | traduzir |
| `blend.single-playlist` | `components/blend/BlendIngredientsPanel.js:97` | Rótulo/opção | Single Playlist | Playlist única | traduzir |
| `blend.multiple-playlists` | `components/blend/BlendIngredientsPanel.js:98` | Rótulo/opção | Multiple Playlists | Várias playlists | traduzir |
| `blend.split-by-duration-limits` | `components/blend/BlendIngredientsPanel.js:98` | Descrição | Split by duration limits | Dividida pelos limites de duração | traduzir |
| `blend.auto` | `components/blend/BlendIngredientsPanel.js:99` | Rótulo/opção | Auto | Auto | fica |
| `blend.one-playlist-split-when-over` | `components/blend/BlendIngredientsPanel.js:99` | Descrição | One playlist, split when over the target | Uma playlist, dividida quando passa da meta | traduzir |
| `blend.based-on-play-counts` | `components/blend/BlendIngredientsPanel.js:106` | Descrição | Based on play counts | Com base no número de reproduções | traduzir |
| `blend.based-on-bea-rankings` | `components/blend/BlendIngredientsPanel.js:107` | Descrição | Based on BEA rankings | Com base nos rankings do BEA | traduzir |
| `blend.critics-choice` | `components/blend/BlendIngredientsPanel.js:107` | Rótulo/opção | Critics Choice | Escolha da crítica | traduzir |
| `blend.acclaim-first-popularity-where-unrated` | `components/blend/BlendIngredientsPanel.js:108` | Descrição | Acclaim first, popularity where unrated | Aclamação primeiro, popularidade onde não há nota | traduzir |
| `blend.combined` | `components/blend/BlendIngredientsPanel.js:108` | Rótulo/opção | Combined | Combinado | traduzir |
| `blend.keep-album-sequence` | `components/blend/BlendIngredientsPanel.js:115` | Descrição | Keep Album Sequence | Mantém a sequência do álbum | traduzir |
| `blend.by-ranking` | `components/blend/BlendIngredientsPanel.js:116` | Rótulo/opção | By Ranking | Por ranking | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `blend.every-1-then-every-2` | `components/blend/BlendIngredientsPanel.js:116` | Carregando/andamento | Every #1, then every #2... | Todos os #1, depois todos os #2... | traduzir |
| `blend.by-artist-then-by-rank` | `components/blend/BlendIngredientsPanel.js:117` | Rótulo/opção | By Artist then By Rank | Por artista e depois por ranking | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `blend.cluster-by-artist` | `components/blend/BlendIngredientsPanel.js:117` | Descrição | Cluster by Artist | Agrupa por artista | traduzir |
| `blend.balanced-interleave` | `components/blend/BlendIngredientsPanel.js:118` | Rótulo/opção | Balanced Interleave | Intercalação equilibrada | traduzir |
| `blend.round-robin-by-rank` | `components/blend/BlendIngredientsPanel.js:118` | Descrição | Round Robin by Rank | Rodízio por ranking | traduzir + MJRP decide — D-08 receita/ingredientes: metáfora de cozinha; proposta: traduzir; D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `blend.surprise-me` | `components/blend/BlendIngredientsPanel.js:119` | Descrição | Surprise Me | Surpreenda-me | traduzir |
| `blend.nchoose-your-top` | `components/blend/BlendIngredientsPanel.js:200` | Texto | {}Choose your Top # | {}Escolha seu Top # | traduzir + montado — {} vem colado antes (número do passo ou ícone); manter a ordem |
| `blend.select-how-many-top-tracks` | `components/blend/BlendIngredientsPanel.js:200` | Texto | Select how many top tracks to pick from each album. | Escolha quantas faixas do topo pegar de cada álbum. | traduzir |
| `blend.top-n` | `components/blend/BlendIngredientsPanel.js:206` | Texto | Top {} | Top {} | traduzir + montado — {} é o N |
| `blend.ntarget-duration-minutes` | `components/blend/BlendIngredientsPanel.js:229` | Texto | {}Target Duration (minutes) | {}Duração desejada (minutos) | traduzir + montado — {} vem colado antes (número do passo ou ícone) |
| `blend.how-long-should-each-volume` | `components/blend/BlendIngredientsPanel.js:229` | Texto | How long should each volume be? | Qual deve ser a duração de cada volume? | traduzir |
| `blend.nplaylist-structure` | `components/blend/BlendIngredientsPanel.js:252` | Texto | {}Playlist Structure | {}Estrutura da playlist | traduzir + montado — {} vem colado antes (número do passo ou ícone) |
| `blend.nranking-source` | `components/blend/BlendIngredientsPanel.js:286` | Texto | {}Ranking Source | {}Fonte do ranking | traduzir + montado + MJRP decide — {} vem colado antes (número do passo ou ícone) |
| `blend.ngrouping-tracks` | `components/blend/BlendIngredientsPanel.js:320` | Texto | {}Grouping Tracks | {}Agrupamento das faixas | traduzir + montado — {} vem colado antes (número do passo ou ícone) |
| `blend.top-3` | `components/blend/BlendRecipeCard.js:93` | Texto | TOP 3 | TOP 3 | fica + provável |
| `blend.top-5` | `components/blend/BlendRecipeCard.js:95` | Texto | TOP 5 | TOP 5 | fica + provável |
| `blend.recommended` | `components/blend/BlendRecipeCard.js:109` | Texto | ★ RECOMMENDED | ★ RECOMENDADO | traduzir |
| `blend.untitled-series` | `components/blend/BlendSeriesPhonePicker.js:19` | Texto | Untitled series | Série sem título | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `blend.choose-a-series` | `components/blend/BlendSeriesPhonePicker.js:49`, `components/blend/BlendSeriesPhonePicker.js:82` | Texto | Choose a series | Escolha uma série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `blend.change` | `components/blend/BlendSeriesPhonePicker.js:52` | Texto | Change | Alterar | traduzir |
| `blend.choose` | `components/blend/BlendSeriesPhonePicker.js:52` | Texto | Choose | Escolher | traduzir |
| `blend.loading-your-series` | `components/blend/BlendSeriesPhonePicker.js:59` | Carregando/andamento | Loading your series… | Carregando suas séries… | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `blend.no-series-yet-create-one` | `components/blend/BlendSeriesPhonePicker.js:60` | Estado vazio | No series yet: create one on Home | Nenhuma série ainda: crie uma em Início | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `blend.search-series` | `components/blend/BlendSeriesPhonePicker.js:70`, `components/blend/BlendSeriesPhonePicker.js:71` | Campo (placeholder) | Search series | Buscar séries | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `blend.no-series-with-that-name` | `components/blend/BlendSeriesPhonePicker.js:108` | Estado vazio | No series with that name. | Nenhuma série com esse nome. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `blend.artists` | `components/blend/BlendSeriesSelector.js:43` | Rótulo/opção | Artists | Artistas | traduzir |
| `blend.genres` | `components/blend/BlendSeriesSelector.js:44` | Rótulo/opção | Genres | Gêneros | traduzir |
| `blend.tracks` | `components/blend/BlendSeriesSelector.js:45` | Rótulo/opção | Tracks | Faixas | traduzir |
| `blend.coming-soon` | `components/blend/BlendSeriesSelector.js:157`, `components/blend/BlendSeriesSelector.js:196` | Texto | (Coming Soon) | (Em breve) | traduzir + provável |
| `blend.no-series-found-for-this` | `components/blend/BlendSeriesSelector.js:166` | Estado vazio | No series found for this entity type | Nenhuma série encontrada para este tipo de item | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `blend.blend-your-music-by` | `components/blend/BlendSeriesSelector.js:169`, `components/blend/BlendSeriesSelector.js:199` | Texto | Blend your Music by | Faça o Blend da sua música por | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `blend.select-series` | `components/blend/BlendSeriesSelector.js:169` | Texto | Select Series | Selecione a série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `blend.n-albumn` | `components/blend/BlendSeriesSelector.js:253` | Texto | {} album{} | {} álbum{} | montado + traduzir — plural: 1 álbum / n álbuns; o sufixo «s» do EN não serve em pt (álbum→álbuns), o código deve escolher a forma |
| `blend.the-blend-was-cancelled` | `controllers/BlendingController.js:47` | Texto | The blend was cancelled | O Blend foi cancelado | traduzir + provável |
| `blend.series-not-found-n` | `controllers/BlendingController.js:75` | Erro (pode chegar à tela) | Series not found: {} | Série não encontrada: {} | traduzir + montado + MJRP decide — {} = nome da série |
| `blend.generating-playlists-with-n` | `controllers/BlendingController.js:79` | Carregando/andamento | Generating playlists with {}... | Gerando playlists com {}… | traduzir + montado + provável — {} = nome/origem; usei «…» no lugar de «...» |
| `blend.no-series-to-take-the` | `controllers/BlendingController.js:136` | Erro (pode chegar à tela) | No series to take the albums from. Open the series first. | Nenhuma série de onde tirar os álbuns. Abra a série primeiro. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `blend.your-music-your-recipe` | `views/BlendingMenuView.js:65` | Texto | "Your Music, Your Recipe" | "Sua música, sua receita" | traduzir + MJRP decide — D-08 receita/ingredientes: metáfora de cozinha; proposta: traduzir |
| `blend.choose-your-mix` | `views/BlendingMenuView.js:78` | Título | Choose Your Mix | Escolha sua mistura | traduzir |
| `blend.step-1` | `views/BlendingMenuView.js:79` | Texto | Step 1 | Passo 1 | traduzir |
| `blend.choose-your-recipe` | `views/BlendingMenuView.js:90`, `views/BlendingMenuView.js:99` | Título | Choose Your Recipe | Escolha sua receita | traduzir + MJRP decide — D-08 receita/ingredientes: metáfora de cozinha; proposta: traduzir |
| `blend.step-2` | `views/BlendingMenuView.js:91`, `views/BlendingMenuView.js:100` | Texto | Step 2 | Passo 2 | traduzir |
| `blend.complete-step-1-to-unlock` | `views/BlendingMenuView.js:102` | Texto | Complete Step 1 to unlock | Conclua o passo 1 para liberar | traduzir |
| `blend.pick-your-ingredients` | `views/BlendingMenuView.js:111` | Título | Pick Your Ingredients | Escolha seus ingredientes | traduzir + MJRP decide — D-08 receita/ingredientes: metáfora de cozinha; proposta: traduzir |
| `blend.step-3` | `views/BlendingMenuView.js:112`, `views/BlendingMenuView.js:124` +1 | Texto | Step 3 | Passo 3 | traduzir |
| `blend.blend-it` | `views/BlendingMenuView.js:123`, `views/BlendingMenuView.js:134` | Título | Blend It! | Faça o Blend! | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `blend.step-4` | `views/BlendingMenuView.js:124`, `views/BlendingMenuView.js:135` | Texto | Step 4 | Passo 4 | traduzir |
| `blend.complete-previous-steps-to-unlock` | `views/BlendingMenuView.js:137` | Texto | Complete previous steps to unlock | Conclua os passos anteriores para liberar | traduzir |
| `blend.mix` | `views/BlendingMenuView.js:153` | Rótulo/opção | Mix | Mistura | traduzir |
| `blend.recipe` | `views/BlendingMenuView.js:154` | Rótulo/opção | Recipe | Receita | traduzir + MJRP decide — D-08 receita/ingredientes: metáfora de cozinha; proposta: traduzir |
| `blend.ingredients` | `views/BlendingMenuView.js:155` | Rótulo/opção | Ingredients | Ingredientes | traduzir + MJRP decide — D-08 receita/ingredientes: metáfora de cozinha; proposta: traduzir |
| `blend.blend-it-ready` | `views/BlendingMenuView.js:156` | Rótulo/opção | Blend it! Ready! | Faça o Blend! Pronto! | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `blend.blend-it-2` | `views/BlendingMenuView.js:210` | Botão | Blend it! | Faça o Blend! | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `blend.blending` | `views/BlendingMenuView.js:210` | Carregando/andamento | Blending… | Misturando… | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `blend.step-1-of-4-choose` | `views/BlendingMenuView.js:222` | Texto | Step 1 of 4: choose a series | Passo 1 de 4: escolha uma série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `blend.step-2-of-4-choose` | `views/BlendingMenuView.js:223` | Texto | Step 2 of 4: choose a recipe | Passo 2 de 4: escolha uma receita | traduzir + provável |
| `blend.n-n-min` | `views/BlendingMenuView.js:224` | Texto | {} · {} min | {} · {} min | traduzir + montado + provável — nome da receita e duração em minutos |
| `blend.select-a-series` | `views/BlendingMenuView.js:247` | Texto | 👈 Select a series | 👈 Selecione uma série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `blend.select-a-recipe` | `views/BlendingMenuView.js:248` | Texto | 👈 Select a recipe | 👈 Selecione uma receita | traduzir + provável |
| `blend.blending-2` | `views/BlendingMenuView.js:256` | Carregando/andamento | Blending... | Misturando… | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `blend.nblend-your-n-playlistn` | `views/BlendingMenuView.js:260` | Texto | {}Blend your {} Playlist{}! | {}Faça o Blend de {} playlist{}! | traduzir + montado + MJRP decide + provável — plural: 1 playlist / n playlists (o último {} é o «s»); o primeiro {} é um prefixo (emoji) |
| `blend.n-min-n-mode` | `views/BlendingMenuView.js:264` | Texto | ({} min, {} mode) | ({} min, modo {}) | traduzir + montado — minutos e nome do modo, na mesma ordem do EN |
| `blend.on` | `views/BlendingMenuView.js:264` | Texto | on | em | traduzir |
| `blend.using` | `views/BlendingMenuView.js:264` | Texto | Using | Usando | traduzir |
| `blend.generated-n-playlist-s` | `views/BlendingMenuView.js:420` | Aviso (toast) | Generated {} playlist(s)! | {} playlist(s) gerada(s)! | traduzir + montado — plural: 1 playlist gerada / n playlists geradas |
| `blend.generation-failed` | `views/BlendingMenuView.js:426` | Erro/aviso | Generation failed | Falha ao gerar | traduzir + provável |

## Algoritmos e receitas do Blend (44)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `alg.abstract-base-class-do-not` | `algorithms/BaseAlgorithm.js:35` | Descrição | Abstract base class - do not use directly | Abstract base class - do not use directly | técnico |
| `alg.orphan-tracks` | `algorithms/mixins/DurationTrimmingMixin.js:36`, `algorithms/mixins/DurationTrimmingMixin.js:49` +2 | Texto | Orphan Tracks | Faixas órfãs | traduzir |
| `alg.trimmed-due-to-duration-limits` | `algorithms/mixins/DurationTrimmingMixin.js:50` | Texto | Trimmed due to duration limits | Cortado pelos limites de duração | traduzir |
| `alg.trimmed-to-orphan-tracks` | `algorithms/mixins/DurationTrimmingMixin.js:59` | Texto | Trimmed to Orphan Tracks | Cortado para Faixas órfãs | traduzir + provável |
| `alg.swap-moved-to-n` | `algorithms/mixins/PlaylistBalancingMixin.js:73`, `algorithms/mixins/PlaylistBalancingMixin.js:74` | Texto | Swap: moved to {} | Troca: movida para {} | traduzir + montado + provável — {} é o destino (playlist); «movida» concorda com faixa |
| `alg.mjrp-z-s-balanced-playlists` | `algorithms/MJRPBalancedCascadeAlgorithm.js:29` | Texto | [MJRP] Zé's Balanced Playlists | [MJRP] Playlists equilibradas do Zé | traduzir |
| `alg.builds-balanced-playlists-by-blending` | `algorithms/MJRPBalancedCascadeAlgorithm.js:31` | Descrição | Builds balanced playlists by blending the best tracks of each album. Short playlists are merged automatically. | Monta playlists equilibradas misturando as melhores faixas de cada álbum. Playlists curtas são unidas automaticamente. | traduzir |
| `alg.mjrp-z-s-full-balanced` | `algorithms/MJRPBalancedCascadeAlgorithm.js:43` | Texto | MJRP Zé's Full Balanced Playlists | MJRP Playlists equilibradas completas do Zé | traduzir |
| `alg.mjrp-balanced-cascade-curation` | `algorithms/MJRPBalancedCascadeAlgorithm.js:45` | Descrição | MJRP Balanced Cascade curation | Curadoria MJRP Cascata Equilibrada | MJRP decide — Nome de receita: traduzir «Balanced Cascade» ou manter em inglês. |
| `alg.greatest-hit-1` | `algorithms/MJRPBalancedCascadeAlgorithm.js:111` | Texto | Greatest Hit #1 | Maior sucesso #1 | traduzir + MJRP decide — D-04 «Greatest Hits»: proposta: «Maiores sucessos»; é também nome de playlist gravado + provável |
| `alg.greatest-hit-2` | `algorithms/MJRPBalancedCascadeAlgorithm.js:119` | Texto | Greatest Hit #2 | Maior sucesso #2 | traduzir + MJRP decide — D-04 «Greatest Hits»: proposta: «Maiores sucessos»; é também nome de playlist gravado + provável |
| `alg.greatest-hits` | `algorithms/MJRPBalancedCascadeAlgorithm.js:150`, `algorithms/MJRPBalancedCascadeAlgorithm.js:311` +1 | Texto | Greatest Hits | Maiores sucessos | traduzir + MJRP decide — D-04 «Greatest Hits»: proposta: «Maiores sucessos»; é também nome de playlist gravado |
| `alg.rank-1-and-2-from` | `algorithms/MJRPBalancedCascadeAlgorithm.js:151` | Texto | Rank #1 and #2 from each album | Ranking #1 e #2 de cada álbum | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `alg.greatest-hits-vol-1` | `algorithms/MJRPBalancedCascadeAlgorithm.js:157` | Dica (tooltip)/título | Greatest Hits Vol. 1 | Maiores sucessos Vol. 1 | traduzir + MJRP decide — D-04 «Greatest Hits»: proposta: «Maiores sucessos»; é também nome de playlist gravado |
| `alg.rank-1-from-each-album` | `algorithms/MJRPBalancedCascadeAlgorithm.js:158` | Texto | Rank #1 from each album | Ranking #1 de cada álbum | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `alg.greatest-hits-vol-2` | `algorithms/MJRPBalancedCascadeAlgorithm.js:163` | Dica (tooltip)/título | Greatest Hits Vol. 2 | Maiores sucessos Vol. 2 | traduzir + MJRP decide — D-04 «Greatest Hits»: proposta: «Maiores sucessos»; é também nome de playlist gravado |
| `alg.rank-2-from-each-album` | `algorithms/MJRPBalancedCascadeAlgorithm.js:164` | Texto | Rank #2 from each album | Ranking #2 de cada álbum | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `alg.deep-cuts-vol-n` | `algorithms/MJRPBalancedCascadeAlgorithm.js:183`, `algorithms/MJRPBalancedCascadeAlgorithm.js:355` | Dica (tooltip)/título | Deep Cuts Vol. {} | Deep Cuts Vol. {} | fica + montado + MJRP decide — {} é o número do volume |
| `alg.mjrp-balanced-cascade` | `algorithms/MJRPBalancedCascadeAlgorithm.js:184` | Texto | MJRP Balanced Cascade | MJRP Cascata Equilibrada | MJRP decide — Nome de receita: traduzir «Balanced Cascade» ou manter em inglês. |
| `alg.serpentine-odd-dcn` | `algorithms/MJRPBalancedCascadeAlgorithm.js:203` | Texto | Serpentine odd: DC{} | Serpentina ímpar: DC{} | traduzir + montado + provável — {} é o número do Deep Cuts; DC mantido como sigla |
| `alg.serpentine-even-dcn` | `algorithms/MJRPBalancedCascadeAlgorithm.js:225` | Texto | Serpentine even: DC{} | Serpentina par: DC{} | traduzir + montado + provável — {} é o número do Deep Cuts; DC mantido como sigla |
| `alg.cascade-n-dcn` | `algorithms/MJRPBalancedCascadeAlgorithm.js:263` | Texto | Cascade #{}: DC{} | Cascata #{}: DC{} | traduzir + montado + provável — {} números da cascata e do Deep Cuts |
| `alg.merged-from-n` | `algorithms/MJRPBalancedCascadeAlgorithm.js:329` | Texto | Merged from {} | Mesclado de {} | traduzir + montado + provável — {} é a origem (playlists); gênero masculino fixo |
| `alg.deep-cuts-vol-n-n` | `algorithms/MJRPBalancedCascadeAlgorithm.js:339` | Dica (tooltip)/título | Deep Cuts Vol. {}-{} | Deep Cuts Vol. {}-{} | fica + montado + MJRP decide — {} números dos volumes (faixa de volumes) |
| `alg.deep-cuts` | `algorithms/MJRPBalancedCascadeAlgorithm.js:354` | Texto | Deep Cuts | Deep Cuts | fica + MJRP decide — D-04 «Deep Cuts»: proposta: fica (termo de quem coleciona) + provável |
| `alg.vol-n` | `algorithms/MJRPBalancedCascadeAlgorithm.js:359` | Texto | Vol. {}- | Vol. {}- | fica + montado + provável — {} número do volume; hífen final como no original |
| `alg.top-acclaimed-tracks-on-besteveralbums` | `algorithms/TopNAcclaimedAlgorithm.js:8` | Texto | Top Acclaimed Tracks on BestEverAlbums | Top faixas aclamadas no BestEverAlbums | traduzir |
| `alg.pick-the-critically-acclaimed-tracks` | `algorithms/TopNAcclaimedAlgorithm.js:10` | Descrição | Pick the critically acclaimed tracks, based on BestEverAlbums. | Escolha as faixas mais aclamadas pela crítica, com base no BestEverAlbums. | traduzir |
| `alg.bea-top-nn` | `algorithms/TopNAcclaimedAlgorithm.js:30` | Texto | BEA Top {}{} | BEA Top {}{} | fica + montado + provável — as duas {} são número e sufixo; verificar se o sufixo do EN (plural) precisa de tratamento |
| `alg.top-n-algorithm` | `algorithms/TopNAlgorithm.js:18`, `algorithms/TopNAlgorithm.js:39` | Texto | Top N Algorithm | Algoritmo Top N | traduzir |
| `alg.base-class-for-top-n` | `algorithms/TopNAlgorithm.js:20` | Descrição | Base class for Top N selection - do not use directly | Base class for Top N selection - do not use directly | técnico |
| `alg.top-n-selection` | `algorithms/TopNAlgorithm.js:41` | Descrição | Top {} selection | Seleção Top {} | traduzir + montado — {} é o N |
| `alg.top-n-of-n` | `algorithms/TopNAlgorithm.js:85` | Texto | Top {} of {} | Top {} de {} | traduzir + montado + provável — {} N e total |
| `alg.top-n-from-each-album` | `algorithms/TopNAlgorithm.js:105`, `algorithms/TopNAlgorithm.js:116` | Texto | Top {} from each album | Top {} de cada álbum | traduzir + montado — {} é o N |
| `alg.n-vol-n` | `algorithms/TopNAlgorithm.js:115` | Dica (tooltip)/título | {} Vol. {} | {} Vol. {} | fica + montado — {} nome da receita e número do volume |
| `alg.by-rank` | `algorithms/TopNAlgorithm.js:239` | Texto | By Rank | Por ranking | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» + provável |
| `alg.bal-intv` | `algorithms/TopNAlgorithm.js:241` | Texto | Bal.Intv. | Interc. equil. | MJRP decide + provável — Abreviação de «Balanced Interleave»; escolher sigla curta em pt. |
| `alg.top-nn` | `algorithms/TopNAlgorithm.js:254` | Texto | Top {}{} | Top {}{} | fica + montado + provável — {} número e sufixo |
| `alg.top-tracks-by-spotify-popularity` | `algorithms/TopNPopularAlgorithm.js:8` | Texto | Top Tracks by Spotify Popularity | Top faixas por popularidade no Spotify | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `alg.pick-your-favorite-tracks-based` | `algorithms/TopNPopularAlgorithm.js:10` | Descrição | Pick your favorite tracks, based on Spotify popularity. | Escolha suas faixas favoritas, com base na popularidade no Spotify. | traduzir |
| `alg.spfy-top-nn` | `algorithms/TopNPopularAlgorithm.js:30` | Texto | SPFY Top {}{} | SPFY Top {}{} | fica + montado + provável — {} número e sufixo |
| `alg.top-tracks-by-my-own` | `algorithms/TopNUserAlgorithm.js:20` | Texto | Top Tracks by My Own Ranking | Top faixas pelo meu próprio ranking | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `alg.create-playlists-from-your-personal` | `algorithms/TopNUserAlgorithm.js:23` | Descrição | Create playlists from your personal track rankings. | Crie playlists a partir dos seus rankings pessoais de faixas. | traduzir |
| `alg.ugr-top-nn` | `algorithms/TopNUserAlgorithm.js:41` | Texto | UGR Top {}{} | UGR Top {}{} | fica + montado + provável — sigla UGR mantida; {} número e sufixo |

## Playlists (205)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `pl.saved-n` | `components/playlists/batchNames.js:39` | Texto | Saved {} | Salvo em {} | traduzir + montado + provável — {} = data; acrescentei «em» |
| `pl.untitled-batch` | `components/playlists/batchNames.js:39` | Texto | Untitled batch | Lote sem título | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» + provável |
| `pl.playlist-n` | `components/playlists/PhonePlaylists.js:39`, `components/playlists/PlaylistGrid.js:53` | Texto | Playlist {} | Playlist {} | traduzir + montado + provável — {} = número |
| `pl.actions-for-playlist-n` | `components/playlists/PhonePlaylists.js:106` | Leitor de tela | Actions for playlist {} | Ações da playlist {} | traduzir + montado — {} = número |
| `pl.playlist-n-of-the-set` | `components/playlists/PhonePlaylists.js:106` | Texto | Playlist {} of the set · {} | Playlist {} do conjunto · {} | traduzir + montado — {} = número e nome/total |
| `pl.title-of-playlist-n` | `components/playlists/PhonePlaylists.js:106`, `components/playlists/PlaylistGrid.js:170` | Leitor de tela | Title of playlist {} | Título da playlist {} | traduzir + montado — {} = número |
| `pl.no-tracks-in-this-playlist` | `components/playlists/PhonePlaylists.js:119` | Estado vazio | No tracks in this playlist | Nenhuma faixa nesta playlist | traduzir |
| `pl.untitled` | `components/playlists/PhonePlaylists.js:127` | Texto | Untitled | Sem título | traduzir + provável |
| `pl.actions-for-n` | `components/playlists/PhonePlaylists.js:129`, `components/ui/AlbumPhoneCard.js:36` +1 · também em: Inventário; Séries e álbuns | Leitor de tela | Actions for {} | Ações de {} | traduzir + montado — {} = nome; «de» pode virar «da/do» conforme o nome |
| `pl.n-saving` | `components/playlists/PhonePlaylists.js:152`, `components/playlists/PlaylistsGridRenderer.js:102` | Carregando/andamento | {} Saving... | {} Salvando... | traduzir + montado — {} = ícone |
| `pl.n-save` | `components/playlists/PhonePlaylists.js:153` | Texto | {} Save | {} Salvar | traduzir + montado — {} = ícone |
| `pl.n-export` | `components/playlists/PhonePlaylists.js:154` | Texto | {} Export | {} Exportar | traduzir + montado — {} = ícone |
| `pl.batch-name` | `components/playlists/PhonePlaylists.js:175` | Texto | Batch name | Nome do lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.name-this-batch` | `components/playlists/PhonePlaylists.js:175` | Campo (placeholder) | Name this batch | Dê um nome a este lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.undo-the-last-change` | `components/playlists/PhonePlaylists.js:181`, `components/playlists/PlaylistsGridRenderer.js:98` | Botão | Undo the last change | Desfazer a última alteração | traduzir |
| `pl.redo-the-change-that-was` | `components/playlists/PhonePlaylists.js:182`, `components/playlists/PlaylistsGridRenderer.js:99` | Botão | Redo the change that was undone | Refazer a alteração desfeita | traduzir |
| `pl.undo` | `components/playlists/PhoneUndoNotice.js:33` | Botão | Undo | Desfazer | traduzir |
| `pl.tracks` | `components/playlists/PlaylistDetailsModal.js:25` | Texto | tracks | faixas | traduzir |
| `pl.duration` | `components/playlists/PlaylistDetailsModal.js:26` | Texto | duration | duração | traduzir |
| `pl.close` | `components/playlists/PlaylistDetailsModal.js:54`, `components/SpotifyExportModal.js:194` +6 · também em: Componentes comuns (modais, filtros, paginação, avisos); Séries e álbuns | Texto | Close | Fechar | traduzir |
| `pl.no-playlists-generated-yet` | `components/playlists/PlaylistGrid.js:37` | Estado vazio | No playlists generated yet. | Nenhuma playlist gerada ainda. | traduzir |
| `pl.use-the-settings-above-to` | `components/playlists/PlaylistGrid.js:37` | Texto | Use the settings above to generate playlists. | Use as configurações acima para gerar playlists. | traduzir |
| `pl.remove-track` | `components/playlists/PlaylistGrid.js:104` | Rótulo/opção | Remove Track | Remover faixa | traduzir |
| `pl.delete-playlist-n` | `components/playlists/PlaylistGrid.js:124` | Leitor de tela | Delete playlist {} | Excluir playlist {} | traduzir + montado — {} = número |
| `pl.delete-this-playlist` | `components/playlists/PlaylistGrid.js:124`, `views/playlists/phonePlaylistActions.js:149` | Dica (tooltip)/título | Delete this playlist | Excluir esta playlist | traduzir |
| `pl.no-tracks` | `components/playlists/PlaylistGrid.js:153`, `components/playlists/SavedPlaylistRow.js:82` | Estado vazio | No tracks | Nenhuma faixa | traduzir |
| `pl.new-batch` | `components/playlists/PlaylistsGridRenderer.js:27` | Texto | New Batch | Novo lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» + provável |
| `pl.edit-playlist-batch` | `components/playlists/PlaylistsGridRenderer.js:60` | Texto | Edit Playlist Batch | Editar lote de playlists | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» + provável |
| `pl.playlist-management` | `components/playlists/PlaylistsGridRenderer.js:60` | Texto | Playlist Management | Gerenciar playlists | traduzir + provável |
| `pl.editing-n` | `components/playlists/PlaylistsGridRenderer.js:62` | Texto | Editing: {} | Editando: {} | traduzir + montado — {} = nome do lote |
| `pl.n-save-to-series-history` | `components/playlists/PlaylistsGridRenderer.js:105` | Texto | {} Save to Series History | {} Salvar no histórico da série | traduzir + montado + MJRP decide — {} = ícone |
| `pl.n-actions-export` | `components/playlists/PlaylistsGridRenderer.js:109` | Texto | {} Actions & Export | {} Ações e exportação | traduzir + montado — {} = ícone |
| `pl.n-download-json` | `components/playlists/PlaylistsGridRenderer.js:109` | Texto | {} Download JSON | {} Baixar JSON | traduzir + montado — {} = ícone |
| `pl.n-export-to-apple-music` | `components/playlists/PlaylistsGridRenderer.js:109` | Texto | {} Export to Apple Music | {} Exportar para Apple Music | traduzir + montado — {} = ícone |
| `pl.n-export-to-spotify` | `components/playlists/PlaylistsGridRenderer.js:109`, `components/SpotifyExportModal.js:222` | Texto | {} Export to Spotify | {} Exportar para Spotify | traduzir + montado — {} = ícone |
| `pl.batch-name-2` | `components/playlists/PlaylistsGridRenderer.js:158` | Texto | Batch Name | Nome do lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.enter-batch-name-e-g` | `components/playlists/PlaylistsGridRenderer.js:158` | Campo (placeholder) | Enter batch name (e.g., 'My Beatles Mix') | Digite o nome do lote (ex.: 'Meu mix dos Beatles') | traduzir + MJRP decide — Beatles é nome de artista e fica |
| `pl.n-no-playlists-here-yet` | `components/playlists/PlaylistsGridRenderer.js:174` | Texto | {} No playlists here yet | {} Ainda não há playlists aqui | traduzir + montado — {} = ícone |
| `pl.go-to-the-blending-menu` | `components/playlists/PlaylistsGridRenderer.js:174` | Texto | Go to The Blending Menu | Vá para The Blending Menu | MJRP decide — Nome de tela do produto: manter «The Blending Menu» ou traduzir? |
| `pl.playlists-are-made-in-the` | `components/playlists/PlaylistsGridRenderer.js:174` | Texto | Playlists are made in The Blending Menu: pick a series and a recipe, and they open here. | As playlists são feitas em The Blending Menu: escolha uma série e uma receita, e elas abrem aqui. | MJRP decide — Contém o nome «The Blending Menu»: manter ou traduzir? |
| `pl.n-playlistn` | `components/playlists/RegeneratePanel.js:73` | Texto | ({} playlist{}) | ({} playlist{}) | traduzir + montado — plural: 1 playlist / n playlists |
| `pl.reconfigure-your-music-playlist-blend` | `components/playlists/RegeneratePanel.js:73` | Texto | Reconfigure your Music Playlist Blend | Reconfigure o Blend das suas playlists | traduzir + MJRP decide — D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo |
| `pl.regenerate-playlists` | `components/playlists/RegeneratePanel.js:73` | Texto | Regenerate Playlists | Gerar as playlists de novo | traduzir |
| `pl.edit-this-batch` | `components/playlists/SavedPlaylistActions.js:26` | Dica (tooltip)/título | Edit this batch | Editar este lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.edit-batch-n` | `components/playlists/SavedPlaylistActions.js:27` | Leitor de tela | Edit batch {} | Editar lote {} | traduzir + montado + MJRP decide — {} = nome |
| `pl.delete-entire-batch` | `components/playlists/SavedPlaylistActions.js:35` | Dica (tooltip)/título | Delete entire batch | Excluir o lote inteiro | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.delete-batch-n` | `components/playlists/SavedPlaylistActions.js:36` | Leitor de tela | Delete batch {} | Excluir lote {} | traduzir + montado + MJRP decide — {} = nome |
| `pl.add-playlists` | `components/playlists/SavedPlaylistActions.js:65`, `components/playlists/SavedSeriesGroup.js:106` | Botão | Add Playlists | Adicionar playlists | traduzir |
| `pl.open-albums-series` | `components/playlists/SavedPlaylistActions.js:71`, `components/playlists/SavedSeriesGroup.js:112` | Botão | Open Albums Series | Abrir série de álbuns | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.delete-all-playlists-in-this` | `components/playlists/SavedPlaylistActions.js:76`, `components/playlists/SavedSeriesGroup.js:117` | Dica (tooltip)/título | Delete all playlists in this series | Excluir todas as playlists desta série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.view-details` | `components/playlists/SavedPlaylistActions.js:96`, `components/playlists/SavedPlaylistRow.js:44` | Dica (tooltip)/título | View Details | Ver detalhes | traduzir |
| `pl.calendar` | `components/playlists/SavedPlaylistCard.js:88` | Texto | Calendar | Calendário | traduzir + provável |
| `pl.no-playlists-in-this-batch` | `components/playlists/SavedPlaylistCard.js:100`, `components/playlists/SavedPlaylistsPhone.js:141` | Estado vazio | No playlists in this batch | Nenhuma playlist neste lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.n-tracks-n` | `components/playlists/SavedPlaylistRow.js:30` | Texto | {} tracks • {} | {} faixas • {} | traduzir + montado — plural: 1 faixa / n faixas |
| `pl.view-the-tracks-of-n` | `components/playlists/SavedPlaylistRow.js:45` | Leitor de tela | View the tracks of {} | Ver as faixas de {} | traduzir + montado — {} = nome da playlist |
| `pl.deleted-batch-n` | `components/playlists/SavedPlaylistsController.js:116` | Aviso (toast) | Deleted batch: {} | Lote excluído: {} | traduzir + montado + MJRP decide — {} = nome do lote |
| `pl.failed-to-delete-batch` | `components/playlists/SavedPlaylistsController.js:119` | Aviso (toast) | Failed to delete batch | Não foi possível excluir o lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.deleted-playlists-for-n` | `components/playlists/SavedPlaylistsController.js:129` | Aviso (toast) | Deleted playlists for {} | Playlists excluídas de {} | traduzir + montado — {} = nome da série |
| `pl.failed-to-delete-playlists` | `components/playlists/SavedPlaylistsController.js:132` | Aviso (toast) | Failed to delete playlists | Não foi possível excluir as playlists | traduzir |
| `pl.add-playlists-2` | `components/playlists/SavedPlaylistsPhone.js:95` | Rótulo/opção | Add playlists | Adicionar playlists | traduzir |
| `pl.open-the-album-series` | `components/playlists/SavedPlaylistsPhone.js:96` | Rótulo/opção | Open the album series | Abrir a série de álbuns | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.delete-all-playlists-of-this` | `components/playlists/SavedPlaylistsPhone.js:98` | Rótulo/opção | Delete all playlists of this series | Excluir todas as playlists desta série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.saved-as-n` | `components/playlists/SavedPlaylistsPhone.js:108` | Texto | Saved as “{}” | Salvo como “{}” | traduzir + montado + provável — {} = nome do lote |
| `pl.edit-batch` | `components/playlists/SavedPlaylistsPhone.js:109` | Rótulo/opção | Edit batch | Editar lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.delete-batch` | `components/playlists/SavedPlaylistsPhone.js:110` | Rótulo/opção | Delete batch | Excluir lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.open-the-tracks-of-n` | `components/playlists/SavedPlaylistsPhone.js:121` | Leitor de tela | Open the tracks of {} | Abrir as faixas de {} | traduzir + montado — {} = nome da playlist |
| `pl.playlist` | `components/playlists/SavedPlaylistsPhone.js:124` | Texto | Playlist | Playlist | traduzir |
| `pl.actions-for-batch-n` | `components/playlists/SavedPlaylistsPhone.js:151` | Texto | Actions for batch {} | Ações do lote {} | traduzir + montado + MJRP decide + provável — {} = nome |
| `pl.actions-for-series-n` | `components/playlists/SavedPlaylistsPhone.js:172` | Texto | Actions for series {} | Ações da série {} | traduzir + montado + MJRP decide + provável — {} = nome |
| `pl.n-n-n-playlistn` | `components/playlists/SavedSeriesGroup.js:19` | Texto | {} {} · {} playlist{} | {} {} · {} playlist{} | traduzir + montado + provável — plural: 1 playlist / n playlists |
| `pl.id-n` | `components/playlists/SavedSeriesGroup.js:96` | Carregando/andamento | ID: {}... | ID: {}... | fica + montado — {} = identificador |
| `pl.delete-all-playlists-in-n` | `components/playlists/SavedSeriesGroup.js:118` | Leitor de tela | Delete all playlists in {} | Excluir todas as playlists de {} | traduzir + montado — {} = nome da série |
| `pl.the-playlists-of-this-series` | `components/playlists/SavedSeriesGroup.js:131` | Erro/aviso | The playlists of this series could not be updated. What you see may be out of date. | Não foi possível atualizar as playlists desta série. O que você vê pode estar desatualizado. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `pl.the-playlists-of-this-series-2` | `components/playlists/SavedSeriesGroup.js:132` | Erro/aviso | The playlists of this series could not be read. | Não foi possível ler as playlists desta série. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `pl.all-playlists-will-be-merged` | `components/SpotifyExportModal.js:31` | Texto | All playlists will be merged into a single Spotify playlist | Todas as playlists serão reunidas em uma única playlist do Spotify | traduzir + provável |
| `pl.each-playlist-becomes-its-own` | `components/SpotifyExportModal.js:32` | Texto | Each playlist becomes its own Spotify playlist, named after this name and its title | Cada playlist vira uma playlist própria no Spotify, com este nome e o título dela | traduzir + provável |
| `pl.export-failed` | `components/SpotifyExportModal.js:38` | Erro/aviso | Export failed | Falha na exportação | traduzir + provável |
| `pl.mjrp-playlist` | `components/SpotifyExportModal.js:64` | Texto | MJRP Playlist | Playlist MJRP | traduzir + provável — MJRP é marca e fica |
| `pl.no-playlists-to-export` | `components/SpotifyExportModal.js:139`, `services/AppleMusicExportService.js:68` +2 | Aviso (toast) | No playlists to export | Nenhuma playlist para exportar | traduzir |
| `pl.export-to-spotify` | `components/SpotifyExportModal.js:186`, `views/playlists/phonePlaylistActions.js:171` | Texto | Export to Spotify | Exportar para o Spotify | traduzir |
| `pl.enter-playlist-name` | `components/SpotifyExportModal.js:222` | Campo (placeholder) | Enter playlist name... | Digite o nome da playlist… | traduzir |
| `pl.export-mode` | `components/SpotifyExportModal.js:222` | Texto | Export Mode | Modo de exportação | traduzir |
| `pl.merge-all` | `components/SpotifyExportModal.js:222` | Texto | Merge All | Reunir tudo | traduzir |
| `pl.playlist-name` | `components/SpotifyExportModal.js:222` | Texto | Playlist Name | Nome da playlist | traduzir |
| `pl.separate-playlists` | `components/SpotifyExportModal.js:222` | Texto | Separate Playlists | Playlists separadas | traduzir |
| `pl.total-tracks` | `components/SpotifyExportModal.js:222` | Texto | Total tracks | Total de faixas | traduzir |
| `pl.searching-tracks` | `components/SpotifyExportModal.js:280` | Carregando/andamento | Searching tracks... | Buscando faixas… | traduzir + provável |
| `pl.creating-playlist` | `components/SpotifyExportModal.js:281` | Carregando/andamento | Creating playlist... | Criando a playlist… | traduzir + provável |
| `pl.adding-tracks` | `components/SpotifyExportModal.js:282` | Carregando/andamento | Adding tracks... | Adicionando faixas… | traduzir + provável |
| `pl.export-complete` | `components/SpotifyExportModal.js:322` | Texto | Export Complete! 🎉 | Exportação concluída! 🎉 | traduzir + provável |
| `pl.export-failed-2` | `components/SpotifyExportModal.js:322` | Erro/aviso | Export Failed | Falha na exportação | traduzir + provável |
| `pl.export-stopped-part-of-the` | `components/SpotifyExportModal.js:322` | Texto | Export stopped part of the way | A exportação parou no meio do caminho | traduzir + provável |
| `pl.created-without-all-their-tracks` | `components/SpotifyExportModal.js:336` | Texto | Created without all their tracks | Criadas sem todas as faixas | traduzir + provável — título de grupo no plural |
| `pl.not-created` | `components/SpotifyExportModal.js:337` | Texto | Not created | Não criadas | traduzir + provável — título de grupo no plural |
| `pl.no-track-found` | `components/SpotifyExportModal.js:338` | Estado vazio | No track found | Nenhuma faixa encontrada | traduzir + provável |
| `pl.n-open-in-spotify` | `components/SpotifyExportModal.js:351` | Texto | {} Open in Spotify | {} Abrir no Spotify | montado — {} é um ícone/símbolo montado pelo código |
| `pl.n-tracks` | `components/SpotifyExportModal.js:353` | Texto | · {} tracks | · {} faixas | montado — plural: 1 faixa / n faixas |
| `pl.already-exported-in-this-session` | `components/SpotifyExportModal.js:357` | Texto | (already exported in this session, not created again) | (já exportada nesta sessão, não foi criada de novo) | traduzir |
| `pl.created-n` | `components/SpotifyExportModal.js:361` | Texto | Created ({}) | Criadas ({}) | montado — título de grupo; se for 1: «Criada (1)» |
| `pl.tracks-matched` | `components/SpotifyExportModal.js:384` | Texto | Tracks matched | Faixas encontradas | traduzir |
| `pl.n-n-tracks-not-found` | `components/SpotifyExportModal.js:390` | Texto | {} {} tracks not found | {} {} faixas não encontradas | montado — plural: 1 faixa não encontrada / n faixas não encontradas; o primeiro {} é ícone |
| `pl.style-background-linear-gradient-135deg` | `components/SpotifyExportModal.js:411` | Texto | style="background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);" | style="background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);" | técnico + provável |
| `pl.n-connect-to-spotify-again` | `components/SpotifyExportModal.js:414` | Texto | {} Connect to Spotify again | {} Conectar ao Spotify de novo | montado — {} é um ícone/símbolo |
| `pl.you-will-leave-this-page` | `components/SpotifyExportModal.js:414` | Texto | You will leave this page to sign in to Spotify. Export again when you are back: what was created is not created twice in the same visit, but it is after the page reloads. | Você vai sair desta página para entrar no Spotify. Exporte de novo quando voltar: o que foi criado não é criado duas vezes na mesma visita, mas é depois que a página recarrega. | traduzir |
| `pl.n-try-again` | `components/SpotifyExportModal.js:417` | Erro/aviso | {} Try again | {} Tentar de novo | montado — {} é um ícone/símbolo |
| `pl.what-was-already-created-is` | `components/SpotifyExportModal.js:417` | Texto | What was already created is not created again. | O que já foi criado não é criado de novo. | traduzir |
| `pl.your-unsaved-playlists-were-restored` | `controllers/PlaylistsController.js:59` | Aviso (toast) | Your unsaved playlists were restored | Suas playlists não salvas foram restauradas | traduzir |
| `pl.no-series-context-found` | `controllers/PlaylistsController.js:88` | Aviso (toast) | No series context found | Nenhum contexto de série encontrado | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.no-playlists-found-for-batch` | `controllers/PlaylistsController.js:97` | Aviso (toast) | No playlists found for batch "{}" | Nenhuma playlist encontrada para o lote "{}" | traduzir + montado + MJRP decide — {} = nome do lote |
| `pl.failed-to-load-playlists` | `controllers/PlaylistsController.js:109` | Aviso (toast) | Failed to load playlists | Não foi possível carregar as playlists | traduzir |
| `pl.this-series-has-no-albums` | `controllers/PlaylistsController.js:123` | Aviso (toast) | This series has no albums to generate playlists from. | Esta série não tem álbuns para gerar playlists. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.could-not-load-albums-for` | `controllers/PlaylistsController.js:140` | Aviso (toast) | Could not load albums for reconfiguration | Não foi possível carregar os álbuns para reconfigurar | traduzir |
| `pl.playlist-n-removed` | `controllers/PlaylistsController.js:174` | Aviso (toast) | Playlist "{}" removed | Playlist "{}" removida | traduzir + montado — {} = nome; «removida» concorda com «Playlist» (feminino) |
| `pl.nothing-to-undo` | `controllers/PlaylistsController.js:191` | Aviso (toast) | Nothing to undo | Nada para desfazer | traduzir |
| `pl.nothing-to-redo` | `controllers/PlaylistsController.js:196` | Aviso (toast) | Nothing to redo | Nada para refazer | traduzir |
| `pl.generated-n-playlists` | `controllers/PlaylistsController.js:214` | Aviso (toast) | Generated {} playlists | {} playlists geradas | traduzir + montado — plural: 1 playlist gerada / n playlists geradas |
| `pl.batch-name-required` | `controllers/PlaylistsController.js:242`, `services/PlaylistsService.js:434` | Aviso (toast) | Batch name required | Nome do lote obrigatório | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.saved-n-successfully` | `controllers/PlaylistsController.js:248` | Aviso (toast) | Saved "{}" successfully! | "{}" salva com sucesso! | traduzir + montado — {} = nome; gênero: «salva» (playlist); para lote seria «salvo» |
| `pl.save-failed-n-nothing-was` | `controllers/PlaylistsController.js:251` | Aviso (toast) | Save failed: {}. Nothing was changed: what was saved before is still there. | Falha ao salvar: {}. Nada foi alterado: o que foi salvo antes continua lá. | traduzir + montado — {} = motivo da falha |
| `pl.thealbumblender-playlist-n-n-n` | `models/batchNaming.js:36` | Texto | TheAlbumBlender Playlist {} {}:{} | TheAlbumBlender Playlist {} {}:{} | MJRP decide + montado + provável — Nome gerado de playlist, com 3 {}. Manter «TheAlbumBlender Playlist» em inglês (marca) ou traduzir é escolha do produto. |
| `pl.apple-music-did-not-answer` | `services/AppleMusicExportService.js:43`, `services/AppleMusicExportService.js:124` | Erro/aviso | Apple Music did not answer | O Apple Music não respondeu | traduzir + provável |
| `pl.connecting` | `services/AppleMusicExportService.js:82`, `views/playlists/PlaylistsExport.js:96` | Carregando/andamento | Connecting... | Conectando… | traduzir + provável |
| `pl.authorizing` | `services/AppleMusicExportService.js:84` | Carregando/andamento | Authorizing... | Autorizando… | traduzir + provável |
| `pl.creating-folder` | `services/AppleMusicExportService.js:86` | Carregando/andamento | Creating folder... | Criando a pasta… | traduzir + provável |
| `pl.exporting-n` | `services/AppleMusicExportService.js:97` | Carregando/andamento | Exporting {}... | Exportando {}… | traduzir + montado + provável — {} é o nome da playlist |
| `pl.apple-music-is-not-set` | `services/AppleMusicExportService.js:157` | Texto | Apple Music is not set up for this site: nothing was exported. | O Apple Music não está configurado neste site: nada foi exportado. | traduzir |
| `pl.apple-music-was-not-authorized` | `services/AppleMusicExportService.js:158` | Texto | Apple Music was not authorized: nothing was exported. | O Apple Music não foi autorizado: nada foi exportado. | traduzir |
| `pl.the-export-to-apple-music` | `services/AppleMusicExportService.js:159` | Erro/aviso | The export to Apple Music failed before anything was created: {}. | A exportação para o Apple Music falhou antes de criar qualquer coisa: {}. | traduzir + montado — {} é o motivo do erro |
| `pl.apple-music-did-not-create` | `services/AppleMusicExportService.js:166` | Erro/aviso | Apple Music did not create {} of {}: {}. Export again to create what is missing: what was created is not created twice. | O Apple Music não criou {} de {}: {}. Exporte de novo para criar o que falta: o que já foi criado não é criado duas vezes. | traduzir + montado — {} = quantidade, total e motivo; «playlist(s)» não aparece, sem plural a tratar |
| `pl.export-again-to-create-what` | `services/AppleMusicExportService.js:167` | Texto | Export again to create what is missing: what was created is not created twice. | Exporte de novo para criar o que falta: o que já foi criado não é criado duas vezes. | traduzir + provável |
| `pl.n-exported-to-apple-musicnn` | `services/AppleMusicExportService.js:174` | Texto | {} exported to Apple Music{}{}. | {} exportada(s) para o Apple Music{}{}. | traduzir + montado — concordância: 1 exportada / n exportadas (o código monta o que vem antes, e os dois últimos {} são sufixos) |
| `pl.the-folder-n-could-not` | `services/AppleMusicExportService.js:185` | Erro/aviso | The folder "{}" could not be created in Apple Music: the playlists are at the top of your library. | A pasta "{}" não pôde ser criada no Apple Music: as playlists ficam no topo da sua biblioteca. | traduzir + montado — {} é o nome da pasta |
| `pl.no-track-was-found-in` | `services/AppleMusicExportService.js:188` | Estado vazio | No track was found in Apple Music for {}: not created. | Nenhuma faixa foi encontrada no Apple Music para {}: não criada. | traduzir + montado — gênero: «não criada» concorda com a playlist; {} é o nome dela |
| `pl.n-n-not-found-in` | `services/AppleMusicExportService.js:192` | Texto | {} {} not found in Apple Music and {} left out: {}. | {} {} não encontrada(s) no Apple Music e {} de fora: {}. | traduzir + montado — plural/gênero: 1 faixa / n faixas; o código monta número e palavra, e a concordância de «de fora» |
| `pl.update` | `services/playlists/PlaylistHistoryService.js:18` | Texto | Update | Atualização | traduzir + provável |
| `pl.moved-track-from-n-to` | `services/PlaylistsService.js:81` | Texto | Moved track from {} to {} | Faixa movida de {} para {} | traduzir + montado + provável — {} são posições ou playlists |
| `pl.reordered-track-in-n` | `services/PlaylistsService.js:92` | Texto | Reordered track in {} | Faixa reordenada em {} | traduzir + montado + provável — {} é a playlist |
| `pl.removed-n-from-n` | `services/PlaylistsService.js:102` | Texto | Removed "{}" from {} | "{}" removida de {} | traduzir + montado + provável — gênero: «removida» concorda com «faixa»; {} faixa e playlist |
| `pl.removed-playlist-n` | `services/PlaylistsService.js:114` | Texto | Removed playlist {} | Playlist {} removida | traduzir + montado + provável — {} é o nome da playlist |
| `pl.renamed-n-to-n` | `services/PlaylistsService.js:131` | Texto | Renamed {} to {} | {} renomeada para {} | traduzir + montado + provável — gênero: «renomeada» concorda com a playlist |
| `pl.untitled-playlist` | `services/PlaylistsService.js:182` | Texto | Untitled Playlist | Playlist sem título | traduzir + provável |
| `pl.generated-by-album-blender` | `services/PlaylistsService.js:183` | Texto | Generated by Album Blender | Gerada pelo Album Blender | traduzir + provável |
| `pl.as-it-came-to-the` | `services/PlaylistsService.js:249` | Texto | As it came to the screen | Como chegou à tela | traduzir + provável |
| `pl.restored-after-reload` | `services/PlaylistsService.js:366` | Texto | Restored after reload | Restaurada após recarregar | traduzir + provável |
| `pl.there-are-no-playlists-to` | `services/PlaylistsService.js:436` | Erro (pode chegar à tela) | There are no playlists to save | Não há playlists para salvar | traduzir |
| `pl.cannot-save-missing-database-or` | `services/PlaylistsService.js:449` | Erro (pode chegar à tela) | Cannot save: Missing database or Series ID | Não foi possível salvar: faltam o banco de dados ou o ID da série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.cannot-save-the-playlists-on` | `services/PlaylistsService.js:454` | Erro (pode chegar à tela) | Cannot save: the playlists on screen are not from the series of the batch being edited | Não foi possível salvar: as playlists na tela não são da série do lote que está sendo editado | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-05 «Batch»: proposta: «Lote» |
| `pl.the-series-of-these-playlists` | `services/PlaylistsService.js:473` | Erro (pode chegar à tela) | the series of these playlists no longer exists | a série destas playlists não existe mais | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.saved` | `services/PlaylistsService.js:495` | Texto | Saved | Salvo | traduzir + provável |
| `pl.cannot-delete-missing-database-or` | `services/PlaylistsService.js:535` | Erro (pode chegar à tela) | Cannot delete: Missing database or Series ID | Não foi possível excluir: faltam o banco de dados ou o ID da série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.initial-generation` | `services/PlaylistsService.js:553` | Texto | Initial generation | Geração inicial | traduzir + provável |
| `pl.spotify-did-not-answer` | `services/SpotifyExportService.js:38` | Erro/aviso | Spotify did not answer | O Spotify não respondeu | traduzir + provável |
| `pl.part-of-n` | `services/SpotifyExportService.js:98` | Descrição | Part of {} | Parte de {} | traduzir + montado — {} é o nome da série ou do lote |
| `pl.searching-n` | `services/SpotifyExportService.js:114` | Texto | Searching: {} | Buscando: {} | traduzir + montado + provável — {} é o termo buscado |
| `pl.no-tracks-found-on-spotify` | `services/SpotifyExportService.js:149` | Estado vazio | No tracks found on Spotify | Nenhuma faixa encontrada no Spotify | traduzir |
| `pl.creating-n` | `services/SpotifyExportService.js:154` | Carregando/andamento | Creating "{}"... | Criando "{}"… | traduzir + montado + provável — {} é o nome da playlist |
| `pl.generated-by-mjrp-album-blender` | `services/SpotifyExportService.js:177` | Texto | Generated by MJRP Album Blender • {}/{} tracks | Gerada pelo MJRP Album Blender • {}/{} faixas | traduzir + montado + provável — {}/{} = encontradas/total; «faixas» fica no plural |
| `pl.adding-n-tracks-to-n` | `services/SpotifyExportService.js:183` | Carregando/andamento | Adding {} tracks to "{}"... | Adicionando {} faixas a "{}"… | traduzir + montado + provável — plural: 1 faixa / n faixas |
| `pl.move-to-the-top` | `views/playlists/phonePlaylistActions.js:54` | Texto | Move to the top | Mover para o topo | traduzir |
| `pl.move-to-the-end` | `views/playlists/phonePlaylistActions.js:55` | Texto | Move to the end | Mover para o fim | traduzir |
| `pl.removed-n` | `views/playlists/phonePlaylistActions.js:84` | Texto | Removed "{}" | "{}" removida | traduzir + montado — {} é o nome de uma faixa; gênero: «faixa» é feminino, «removida»; se for outro item, o código trata |
| `pl.moved-n-to-n` | `views/playlists/phonePlaylistActions.js:89` | Texto | Moved "{}" to {} | "{}" movida para {} | traduzir + montado — {} é faixa e depois a playlist de destino; «movida» concorda com faixa (feminino) |
| `pl.move-to-another-playlist` | `views/playlists/phonePlaylistActions.js:95` | Título | Move to another playlist | Mover para outra playlist | traduzir + provável |
| `pl.remove-from-this-playlist` | `views/playlists/phonePlaylistActions.js:97` | Texto | Remove from this playlist | Remover desta playlist | traduzir |
| `pl.track` | `views/playlists/phonePlaylistActions.js:99` | Texto | Track | Faixa | traduzir + provável |
| `pl.delete-playlist` | `views/playlists/phonePlaylistActions.js:129` | Dica (tooltip)/título | Delete playlist? | Excluir playlist? | traduzir |
| `pl.n-and-its-tracks-leave` | `views/playlists/phonePlaylistActions.js:130` | Mensagem | "{}" and its tracks leave this set. You can undo it until you save. | "{}" e as faixas dela saem deste conjunto. Você pode desfazer até salvar. | traduzir + montado — {} é o nome da playlist; «dela» concorda com playlist (feminino) |
| `pl.delete-playlist-2` | `views/playlists/phonePlaylistActions.js:131` | Confirmação/aviso do navegador | Delete playlist | Excluir playlist | traduzir |
| `pl.rename` | `views/playlists/phonePlaylistActions.js:146` | Texto | Rename | Renomear | traduzir |
| `pl.reconfigure-and-regenerate` | `views/playlists/phonePlaylistActions.js:147` | Texto | Reconfigure and regenerate | Reconfigurar e gerar de novo | traduzir |
| `pl.export-playlists` | `views/playlists/phonePlaylistActions.js:169` | Dica (tooltip)/título | Export playlists | Exportar playlists | traduzir |
| `pl.export-to-apple-music` | `views/playlists/phonePlaylistActions.js:172`, `views/playlists/PlaylistsExport.js:113` | Texto | Export to Apple Music | Exportar para o Apple Music | traduzir |
| `pl.download-json` | `views/playlists/phonePlaylistActions.js:173` | Texto | Download JSON | Baixar JSON | traduzir |
| `pl.unsaved-batch` | `views/playlists/PlaylistsExport.js:26` | Texto | Unsaved Batch | Lote não salvo | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» + provável |
| `pl.the-export-to-apple-music-2` | `views/playlists/PlaylistsExport.js:80` | Aviso (toast) | The export to Apple Music is already running. | A exportação para o Apple Music já está em andamento. | traduzir |
| `pl.mjrp-playlists` | `views/playlists/PlaylistsExport.js:102` | Texto | MJRP Playlists | MJRP Playlists | fica + provável — Nome de playlist criada no Apple Music; marca, fica igual. |
| `pl.the-export-to-apple-music-3` | `views/playlists/PlaylistsExport.js:108` | Aviso (toast) | The export to Apple Music failed: {} | A exportação para o Apple Music falhou: {} | traduzir + montado — {} é a mensagem de erro |
| `pl.you-have-changes-to-these` | `views/playlists/unsavedChangesGuard.js:11` | Erro/aviso | You have changes to these playlists that are not saved. Leave without saving? | Você tem alterações nestas playlists que não foram salvas. Sair sem salvar? | traduzir + provável |
| `pl.batch-not-found` | `views/PlaylistsView.js:338` | Texto | Batch Not Found | Lote não encontrado | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.could-not-load-playlists-for` | `views/PlaylistsView.js:338` | Erro/aviso | Could not load playlists for batch "{}". | Não foi possível carregar as playlists do lote "{}". | traduzir + montado + MJRP decide — {} é o nome do lote |
| `pl.return-to-saved-playlists` | `views/PlaylistsView.js:338` | Texto | Return to Saved Playlists | Voltar para as Playlists salvas | traduzir |
| `pl.the-batch-may-have-been` | `views/PlaylistsView.js:338` | Texto | The batch may have been deleted or the name/series attributes are mismatched. | O lote pode ter sido excluído ou o nome e os atributos da série não conferem. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-05 «Batch»: proposta: «Lote» |
| `pl.generating-balanced-playlists` | `views/PlaylistsView.js:362` | Carregando/andamento | Generating balanced playlists... | Gerando playlists equilibradas... | traduzir |
| `pl.your-playlists-series` | `views/SavedPlaylistsView.js:113` | Título | Your Playlists Series | Suas Séries de Playlists | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.recently-updated` | `views/SavedPlaylistsView.js:222` | Rótulo/opção | Recently Updated | Atualizadas recentemente | traduzir |
| `pl.read-the-saved-playlists-again` | `views/SavedPlaylistsView.js:232` | Texto | Read the saved playlists again | Ler as playlists salvas de novo | traduzir + provável |
| `pl.show-series` | `views/SavedPlaylistsView.js:232` | Texto | Show series | Mostrar séries | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `pl.album-series` | `views/SavedPlaylistsView.js:237` | Dica (tooltip)/título | Album series | Séries de álbuns | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.batch` | `views/SavedPlaylistsView.js:246` | Dica (tooltip)/título | Batch | Lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.all-playlist-series` | `views/SavedPlaylistsView.js:247` | Rótulo/opção | All Playlist Series | Todas as Séries de Playlists | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.updating` | `views/SavedPlaylistsView.js:284` | Carregando/andamento | Updating... | Atualizando... | traduzir + provável |
| `pl.reading-your-series` | `views/SavedPlaylistsView.js:285` | Carregando/andamento | Reading your series... | Lendo suas séries... | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `pl.reading-playlists-n-of-n` | `views/SavedPlaylistsView.js:286` | Carregando/andamento | Reading playlists: {} of {} series | Lendo playlists: {} de {} séries | traduzir + montado + MJRP decide + provável — plural: 1 série / n séries |
| `pl.the-list-could-not-be` | `views/SavedPlaylistsView.js:296` | Erro/aviso | The list could not be updated. What you see may be out of date. | Não foi possível atualizar a lista. O que você vê pode estar desatualizado. | traduzir + provável |
| `pl.your-series-could-not-be` | `views/SavedPlaylistsView.js:297` | Erro/aviso | Your series could not be read. | Não foi possível ler suas séries. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `pl.no-matches-found` | `views/SavedPlaylistsView.js:308` | Estado vazio | No matches found. | Nada encontrado. | traduzir |
| `pl.no-playlists-found` | `views/SavedPlaylistsView.js:317` | Estado vazio | No Playlists Found | Nenhuma playlist encontrada | traduzir |
| `pl.generate-and-save-playlists-in` | `views/SavedPlaylistsView.js:318` | Texto | Generate and save playlists in your series to see them here. | Gere e salve playlists nas suas séries para vê-las aqui. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.create-series` | `views/SavedPlaylistsView.js:322` | Botão | Create Series | Criar série | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `pl.delete-batch-2` | `views/SavedPlaylistsView.js:330` | Dica (tooltip)/título | Delete Batch? | Excluir lote? | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.are-you-sure-you-want` | `views/SavedPlaylistsView.js:331` | Mensagem | Are you sure you want to delete batch "{}"? Contains {} playlists. | Tem certeza de que quer excluir o lote "{}"? Contém {} playlists. | traduzir + montado + MJRP decide — {} nome do lote; quantidade com plural: 1 playlist / n playlists |
| `pl.delete-batch-3` | `views/SavedPlaylistsView.js:332` | Confirmação/aviso do navegador | Delete Batch | Excluir lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `pl.delete-all-playlists` | `views/SavedPlaylistsView.js:341` | Dica (tooltip)/título | Delete All Playlists? | Excluir todas as playlists? | traduzir |
| `pl.this-will-permanently-delete-all` | `views/SavedPlaylistsView.js:342` | Mensagem | This will permanently delete all playlists in "{}". The series and its albums will remain. | Isso vai excluir para sempre todas as playlists de "{}". A série e seus álbuns permanecem. | traduzir + montado + MJRP decide — {} é o nome da série |
| `pl.delete-all-playlists-2` | `views/SavedPlaylistsView.js:343` | Confirmação/aviso do navegador | Delete All Playlists | Excluir todas as playlists | traduzir |

## Inventário (238)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `inv.unknown-artist` | `algorithms/BaseAlgorithm.js:154`, `algorithms/TopNAlgorithm.js:229` +9 · também em: Algoritmos e receitas do Blend; Outros; Séries e álbuns | Texto | Unknown Artist | Artista desconhecido | traduzir |
| `inv.unknown-title` | `components/InventoryAddModal.js:23`, `components/InventoryEditModal.js:39` +3 | Texto | Unknown Title | Título desconhecido | traduzir |
| `inv.cd` | `components/InventoryAddModal.js:35`, `views/InventoryView.js:535` | Rótulo/opção | CD | CD | fica |
| `inv.vinyl` | `components/InventoryAddModal.js:36`, `components/InventoryEditModal.js:6` +4 | Texto | Vinyl | Vinil | traduzir |
| `inv.cassette` | `components/InventoryAddModal.js:37`, `components/InventoryEditModal.js:6` | Rótulo/opção | Cassette | Fita cassete | traduzir |
| `inv.dvd` | `components/InventoryAddModal.js:38` | Rótulo/opção | DVD | DVD | fica |
| `inv.blu-ray` | `components/InventoryAddModal.js:39`, `components/InventoryEditModal.js:6` | Rótulo/opção | Blu-ray | Blu-ray | fica |
| `inv.digital` | `components/InventoryAddModal.js:40`, `components/InventoryEditModal.js:6` +3 | Texto | Digital | Digital | fica |
| `inv.format` | `components/InventoryAddModal.js:45`, `components/InventoryEditModal.js:51` | Rótulo/opção | Format: | Formato: | traduzir |
| `inv.currency` | `components/InventoryAddModal.js:71`, `components/InventoryEditModal.js:71` | Rótulo/opção | Currency: | Moeda: | traduzir |
| `inv.r` | `components/InventoryAddModal.js:79` | Texto | R$ | R$ | fica |
| `inv.purchase-price` | `components/InventoryAddModal.js:95`, `components/InventoryEditModal.js:90` | Rótulo/opção | Purchase Price: | Preço de compra: | traduzir |
| `inv.e-g-mint-condition-japanese` | `components/InventoryAddModal.js:106` | Campo (placeholder) | e.g. Mint condition, Japanese import... | ex.: Estado de novo, importado do Japão... | traduzir |
| `inv.condition-notes` | `components/InventoryAddModal.js:111` | Rótulo/opção | Condition / Notes: | Estado / Observações: | traduzir |
| `inv.album-added-to-inventory` | `components/InventoryAddModal.js:147` | Aviso (toast) | Album added to inventory! | Álbum adicionado ao Inventário! | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.album-is-already-in-your` | `components/InventoryAddModal.js:155` | Aviso (toast) | Album is already in your inventory | O álbum já está no seu Inventário | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.failed-to-add-n` | `components/InventoryAddModal.js:158` | Aviso (toast) | Failed to add: {} | Não foi possível adicionar: {} | traduzir + montado — {} é a mensagem de erro |
| `inv.add-to-inventory` | `components/InventoryAddModal.js:164`, `components/InventoryAddModal.js:171` | Confirmação/aviso do navegador | Add to Inventory | Adicionar ao Inventário | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.not-set` | `components/InventoryEditModal.js:15` | Rótulo/opção | Not set | Não definido | traduzir |
| `inv.condition-edition-etc` | `components/InventoryEditModal.js:98` | Campo (placeholder) | Condition, edition, etc. | Estado, edição etc. | traduzir |
| `inv.notes` | `components/InventoryEditModal.js:104` | Rótulo/opção | Notes: | Observações: | traduzir |
| `inv.inventory-item-updated` | `components/InventoryEditModal.js:133` | Aviso (toast) | Inventory item updated | Item do Inventário atualizado | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.failed-to-update-item-n` | `components/InventoryEditModal.js:136` | Aviso (toast) | Failed to update item: {} | Não foi possível atualizar o item: {} | traduzir + montado — {} é a mensagem de erro |
| `inv.unknown-error` | `components/InventoryEditModal.js:136` | Erro/aviso | Unknown error | Erro desconhecido | traduzir + provável |
| `inv.save-changes` | `components/InventoryEditModal.js:141`, `models/seriesDraft.js:55` · também em: Séries e álbuns | Confirmação/aviso do navegador | Save Changes | Salvar alterações | traduzir |
| `inv.edit-inventory-item` | `components/InventoryEditModal.js:148` | Dica (tooltip)/título | Edit Inventory Item | Editar item do inventário | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.written-in-n-and-kept` | `components/InventoryValueSection.js:53` | Texto | Written in {} and kept in USD, at today's rate. | Escrito em {} e guardado em USD, na cotação de hoje. | traduzir + montado — {} = moeda |
| `inv.save` | `components/InventoryValueSection.js:54` | Texto | Save | Salvar | traduzir |
| `inv.disabled-title-update-values-is` | `components/InventoryValueSection.js:61` | Texto | disabled title="Update values is running: this album is read in its turn" | disabled title="Update values is running: this album is read in its turn" | técnico + provável — Parece fragmento de código (atributo disabled title); confirmar se o texto chega ao usuário. |
| `inv.remove-my-value` | `components/InventoryValueSection.js:70` | Texto | Remove my value | Remover meu valor | traduzir + provável |
| `inv.use-the-discogs-value-instead` | `components/InventoryValueSection.js:70` | Texto | Use the Discogs value instead | Usar o valor do Discogs | traduzir + provável |
| `inv.reading-values-from-discogs-never` | `components/InventoryValueSection.js:72` | Carregando/andamento | Reading values from Discogs never changes it. | Ler os valores do Discogs nunca altera o seu valor. | traduzir + provável |
| `inv.written-by-youn-n` | `components/InventoryValueSection.js:72` | Texto | Written by you{}. {} | Escrito por você{}. {} | traduzir + montado — {} são pedaços montados pelo código (data/complemento) |
| `inv.you-wrote-this-value-n` | `components/InventoryValueSection.js:72` | Texto | You wrote this value.{} | Você escreveu este valor.{} | traduzir + montado + provável — {} é complemento montado pelo código |
| `inv.yours` | `components/InventoryValueSection.js:72`, `components/InventoryValueSection.js:265` +1 | Texto | Yours | Seu | traduzir — Concorda com «valor» (masculino) |
| `inv.change-it` | `components/InventoryValueSection.js:74` | Rótulo/opção | Change it | Alterar | traduzir + provável |
| `inv.n-cd-the` | `components/InventoryValueSection.js:83` | Texto | {} (CD), the | {} (CD), a | traduzir + montado + provável — Fragmento: o artigo «a» concorda com «edição»; frase é montada com a próxima |
| `inv.the` | `components/InventoryValueSection.js:83` | Texto | The | A | traduzir + provável — Fragmento: artigo concorda com «edição»; depende da frase montada |
| `inv.edition-n-most-common-cd` | `components/InventoryValueSection.js:84` | Texto | Edition: {} most common CD edition on Discogs. {} | Edição: {} edição de CD mais comum no Discogs. {} | traduzir + montado + provável — {} provavelmente é «a»/«A» (ver inv.the); a ordem pode precisar de ajuste |
| `inv.see-it-on-discogs` | `components/InventoryValueSection.js:84` | Texto | See it on Discogs | Ver no Discogs | traduzir + provável |
| `inv.read-on-nn-n` | `components/InventoryValueSection.js:90`, `components/InventoryValueSection.js:102` | Texto | Read on {}{}. {} | Lido em {}{}. {} | traduzir + montado — {} são data e complementos montados pelo código |
| `inv.what-this-cd-sells-for` | `components/InventoryValueSection.js:90` | Texto | What this CD sells for on Discogs, by the condition of the disc. The value of the album is the mean of the three. | Por quanto este CD é vendido no Discogs, conforme o estado do disco. O valor do álbum é a média dos três. | traduzir + provável |
| `inv.mean-of-the-three` | `components/InventoryValueSection.js:91` | Texto | Mean of the three | Média dos três | traduzir + provável |
| `inv.mint` | `components/InventoryValueSection.js:91` | Texto | Mint | Mint | MJRP decide + provável — Grau de conservação do Discogs; lá aparece em inglês. Manter ou traduzir (Novo)? |
| `inv.near-mint` | `components/InventoryValueSection.js:91` | Texto | Near Mint | Near Mint | MJRP decide + provável — Grau de conservação do Discogs; lá aparece em inglês. Manter ou traduzir (Quase novo)? |
| `inv.very-good-plus` | `components/InventoryValueSection.js:91` | Texto | Very Good Plus | Very Good Plus | MJRP decide + provável — Grau de conservação do Discogs; lá aparece em inglês. Manter ou traduzir (Muito bom+)? |
| `inv.read-again` | `components/InventoryValueSection.js:93`, `components/InventoryValueSection.js:105` | Botão | Read again | Ler de novo | traduzir + provável |
| `inv.write-your-own-value` | `components/InventoryValueSection.js:95`, `components/InventoryValueSection.js:108` | Rótulo/opção | Write your own value | Escrever seu próprio valor | traduzir + provável |
| `inv.n-for-sale` | `components/InventoryValueSection.js:101` | Texto | ({} for sale) | ({} à venda) | traduzir + montado — {} = quantidade |
| `inv.lowest-price-for-sale-on` | `components/InventoryValueSection.js:102` | Texto | Lowest price for sale on Discogs: | Menor preço à venda no Discogs: | traduzir |
| `inv.the-lowest-price-this-cd` | `components/InventoryValueSection.js:102` | Texto | The lowest price this CD is for sale at on Discogs now. It is an asking price, not what the disc usually sells for. | O menor preço pelo qual este CD está à venda no Discogs agora. É um preço pedido, não o valor pelo qual o disco costuma ser vendido. | traduzir + provável |
| `inv.discogs-gives-a-suggestion-by` | `components/InventoryValueSection.js:111` | Texto | Discogs gives a suggestion by the condition of the disc (Mint, Near Mint, Very Good Plus) only to accounts with seller settings filled in. | O Discogs só dá uma sugestão por estado do disco (Mint, Near Mint, Very Good Plus) a contas com as configurações de vendedor preenchidas. | traduzir + provável — Os graus entre parênteses seguem inv.mint etc. |
| `inv.nobody-sells-this-cd-edition` | `components/InventoryValueSection.js:114` | Texto | Nobody sells this CD edition on Discogs now, so there is no price to read. | Ninguém vende esta edição de CD no Discogs agora, então não há preço para ler. | traduzir + provável |
| `inv.none-for-sale-on-discogs` | `components/InventoryValueSection.js:114`, `models/inventoryValue.js:296` | Texto | None for sale on Discogs now | Nenhum à venda no Discogs agora | traduzir |
| `inv.write-the-value-yourself` | `components/InventoryValueSection.js:118`, `components/InventoryValueSection.js:127` +2 | Rótulo/opção | Write the value yourself | Escreva você mesmo o valor | traduzir + provável |
| `inv.look-again` | `components/InventoryValueSection.js:122` | Botão | Look again | Procurar de novo | traduzir + provável |
| `inv.looked-for-on-n-n` | `components/InventoryValueSection.js:122` | Texto | Looked for on {}. {} | Procurado em {}. {} | traduzir + montado — {} são data e complemento montados pelo código |
| `inv.discogs-has-no-cd-edition` | `components/InventoryValueSection.js:125` | Texto | Discogs has no CD edition under this artist and title, so there is no value to read. | O Discogs não tem edição de CD com este artista e título, então não há valor para ler. | traduzir + provável |
| `inv.no-cd-edition-found-on` | `components/InventoryValueSection.js:125` | Estado vazio | No CD edition found on Discogs | Nenhuma edição de CD encontrada no Discogs | traduzir |
| `inv.discogs-has-this-cd-edition` | `components/InventoryValueSection.js:132` | Texto | Discogs has this CD edition and suggests no price for it, so there is no value to read. | O Discogs tem esta edição de CD, mas não sugere preço para ela, então não há valor para ler. | traduzir + provável |
| `inv.no-price-suggested-on-discogs` | `components/InventoryValueSection.js:132`, `models/inventoryValue.js:295` | Estado vazio | No price suggested on Discogs | Nenhum preço sugerido no Discogs | traduzir |
| `inv.no-value-was-read-for` | `components/InventoryValueSection.js:141` | Estado vazio | No value was read for this album yet. | Nenhum valor foi lido para este álbum ainda. | traduzir + provável |
| `inv.read-the-value-now` | `components/InventoryValueSection.js:142` | Botão | Read the value now | Ler o valor agora | traduzir + provável |
| `inv.or-write-it-yourself` | `components/InventoryValueSection.js:143`, `components/InventoryValueSection.js:149` +1 | Rótulo/opção | Or write it yourself | Ou escreva você mesmo | traduzir + provável |
| `inv.reading-the-value-from-discogs` | `components/InventoryValueSection.js:147` | Carregando/andamento | Reading the value from Discogs… | Lendo o valor do Discogs… | traduzir + provável |
| `inv.reading` | `components/InventoryValueSection.js:147` | Carregando/andamento | Reading… | Lendo… | traduzir |
| `inv.n-the-value-was-not` | `components/InventoryValueSection.js:153`, `models/inventoryValueRun.js:206` | Texto | {}. The value was not read. | {}. O valor não foi lido. | traduzir + montado + provável — {} = motivo montado pelo código |
| `inv.no-value-was-written-for` | `components/InventoryValueSection.js:159` | Estado vazio | No value was written for this album yet. | Nenhum valor foi escrito para este álbum ainda. | traduzir + provável |
| `inv.estimated-value` | `components/InventoryValueSection.js:181`, `components/InventoryValueSection.js:293` | Título | Estimated value | Valor estimado | traduzir |
| `inv.where-to-buy` | `components/InventoryValueSection.js:250`, `components/InventoryValueSection.js:312` +3 | Texto | Where to buy | Onde comprar | traduzir |
| `inv.discogs` | `components/InventoryValueSection.js:265`, `models/buyLinks.js:19` +3 · também em: Outros | Texto | Discogs | Discogs | fica |
| `inv.delete` | `components/playlists/SavedPlaylistActions.js:44`, `views/renderers/InventoryGridRenderer.js:136` +1 · também em: Playlists | Rótulo/opção | Delete | Excluir | traduzir |
| `inv.add-the-albums-of-your` | `controllers/InventoryController.js:48` | Dica (tooltip)/título | Add the albums of your series? | Adicionar os álbuns das suas séries? | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `inv.add-n` | `controllers/InventoryController.js:50`, `models/homePaste.js:51` · também em: Home (montar a série) | Confirmação/aviso do navegador | Add {} | Adicionar {} | traduzir + montado — {} = quantidade e/ou rótulo; vem pronto do código |
| `inv.failed-to-load-inventory` | `controllers/InventoryController.js:156` | Aviso (toast) | Failed to load inventory | Não foi possível carregar o inventário | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.failed-to-update-status` | `controllers/InventoryController.js:351` | Aviso (toast) | Failed to update status | Não foi possível atualizar o status | traduzir |
| `inv.reading-your-series` | `controllers/InventoryController.js:378` | Carregando/andamento | Reading your series… | Lendo suas séries… | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `inv.could-not-read-your-series` | `controllers/InventoryController.js:384` | Aviso (toast) | Could not read your series and your inventory. Nothing was added. | Não foi possível ler suas séries e seu inventário. Nada foi adicionado. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.your-inventory-has-no-albums` | `controllers/InventoryController.js:426` | Aviso (toast) | Your inventory has no albums yet. There are no ratings to read. | Seu inventário ainda não tem álbuns. Não há notas para ler. | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.reading-ratings` | `controllers/InventoryController.js:430`, `views/renderers/InventoryPhoneRow.js:148` | Carregando/andamento | Reading ratings… | Lendo as notas… | traduzir |
| `inv.could-not-update-the-ratings` | `controllers/InventoryController.js:449` | Aviso (toast) | Could not update the ratings. Your inventory was not changed. | Não foi possível atualizar as notas. Seu inventário não foi alterado. | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.price-updated` | `controllers/InventoryController.js:473` | Aviso (toast) | Price updated | Preço atualizado | traduzir |
| `inv.failed-to-update-price` | `controllers/InventoryController.js:476` | Aviso (toast) | Failed to update price | Não foi possível atualizar o preço | traduzir |
| `inv.album-updated` | `controllers/InventoryController.js:486` | Aviso (toast) | Album updated | Álbum atualizado | traduzir |
| `inv.failed-to-update-album` | `controllers/InventoryController.js:490` | Aviso (toast) | Failed to update album | Não foi possível atualizar o álbum | traduzir |
| `inv.failed-to-delete-album` | `controllers/InventoryController.js:500` | Aviso (toast) | Failed to delete album | Não foi possível excluir o álbum | traduzir |
| `inv.album-removed-from-inventory` | `controllers/InventoryController.js:503` | Aviso (toast) | Album removed from inventory | Álbum removido do inventário | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.every-album-already-has-a` | `controllers/InventoryValues.js:180` | Texto | Every album already has a value written by you or read in the last six hours. | Todos os álbuns já têm um valor escrito por você ou lido nas últimas seis horas. | traduzir + provável |
| `inv.write-the-value-as-a` | `controllers/InventoryValues.js:238` | Texto | Write the value as a number above zero, for example 12.50. | Escreva o valor como um número maior que zero, por exemplo 12,50. | traduzir + provável — Exemplo com vírgula decimal em pt-BR; o código pode precisar aceitar vírgula. |
| `inv.value-saved` | `controllers/InventoryValues.js:241` | Texto | Value saved | Valor salvo | traduzir + provável |
| `inv.your-value-was-removed` | `controllers/InventoryValues.js:248` | Texto | Your value was removed | Seu valor foi removido | traduzir + provável |
| `inv.the-value-could-not-be` | `controllers/InventoryValues.js:258` | Erro/aviso | The value could not be saved. Your inventory is as it was. | Não foi possível salvar o valor. Seu inventário está como estava. | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» + provável |
| `inv.discogs-values-are-turned-off` | `controllers/InventoryValues.js:278` | Texto | Discogs values are turned off on the server. | Os valores do Discogs estão desligados no servidor. | traduzir + provável |
| `inv.apple-music` | `models/inventoryFromSeries.js:31`, `services/albums/adapters/CatalogAdapter.js:184` · também em: Séries e álbuns | Texto | Apple Music | Apple Music | fica + provável |
| `inv.n-from-your-n-series` | `models/inventoryFromSeries.js:195` | Texto | {} from your {} series will be added as Not Owned. | {} das suas {} séries serão adicionados como Não tenho. | traduzir + montado + MJRP decide + provável — {} = número e rótulo; plural: 1 álbum / n álbuns, e «série(s)» |
| `inv.every-album-of-your-series` | `models/inventoryFromSeries.js:211` | Texto | Every album of your series is already in your inventory. Nothing was added. | Todos os álbuns das suas séries já estão no seu inventário. Nada foi adicionado. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» + provável |
| `inv.your-series-have-no-albums` | `models/inventoryFromSeries.js:212` | Texto | Your series have no albums to add. Nothing was added. | Suas séries não têm álbuns para adicionar. Nada foi adicionado. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `inv.adding-n` | `models/inventoryFromSeries.js:217` | Carregando/andamento | Adding {}… | Adicionando {}… | traduzir + montado + provável — {} = número/rótulo |
| `inv.adding-albums-n-of-n` | `models/inventoryFromSeries.js:217` | Carregando/andamento | Adding albums… {} of {} | Adicionando álbuns… {} de {} | traduzir + montado + provável — {} = contagens |
| `inv.reload-the-page-to-see` | `models/inventoryFromSeries.js:227` | Texto | Reload the page to see them. | Recarregue a página para vê-los. | traduzir + provável |
| `inv.added-n-as-not-owned` | `models/inventoryFromSeries.js:228` | Texto | Added {} as Not Owned.{} | {} adicionados como Não tenho.{} | traduzir + montado + MJRP decide — {} = número e rótulo (plural: 1 adicionado / n adicionados), segundo {} = frase opcional |
| `inv.no-album-was-added-the` | `models/inventoryFromSeries.js:231` | Estado vazio | No album was added: the write failed and your inventory is as it was. Try again. | Nenhum álbum foi adicionado: a gravação falhou e seu inventário está como estava. Tente de novo. | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.added-n-of-n-as` | `models/inventoryFromSeries.js:235` | Erro/aviso | Added {} of {} as Not Owned, then a write failed. {} {} not added: run the action again to add the rest. | {} de {} adicionados como Não tenho, e depois uma gravação falhou. {} {} não adicionados: execute a ação de novo para adicionar o resto. | traduzir + montado + MJRP decide — plural/gênero: 1 não adicionado / n não adicionados; {} = contagens e rótulo |
| `inv.update-ratings` | `models/inventoryRatings.js:129` | Dica (tooltip)/título | Update ratings? | Atualizar notas? | traduzir |
| `inv.read-the-ratings-of-n` | `models/inventoryRatings.js:130` | Mensagem | Read the ratings of {}? This can take a few minutes. | Ler as notas de {}? Isso pode levar alguns minutos. | traduzir + montado — {} = número e rótulo; plural |
| `inv.read-ratings` | `models/inventoryRatings.js:131` | Confirmação/aviso do navegador | Read ratings | Ler notas | traduzir |
| `inv.reading-ratings-n-of-n` | `models/inventoryRatings.js:136` | Carregando/andamento | Reading ratings… {} of {} | Lendo notas… {} de {} | traduzir + montado + provável — {} = contagens |
| `inv.saving-ratings` | `models/inventoryRatings.js:136` | Carregando/andamento | Saving ratings… | Salvando notas… | traduzir + provável |
| `inv.spotify-is-not-connected-popularity` | `models/inventoryRatings.js:144` | Texto | Spotify is not connected: popularity was not read for {}. | O Spotify não está conectado: a popularidade não foi lida para {}. | traduzir + montado + provável — {} = nome/quantidade |
| `inv.a-source-did-not-answer` | `models/inventoryRatings.js:145` | Erro/aviso | A source did not answer for {}: the numbers {} had before were kept. | Uma fonte não respondeu para {}: os números que {} tinha antes foram mantidos. | traduzir + montado + provável — {} = álbum(ns); o segundo {} = «ele/eles» — pode precisar de concordância (ele tinha / eles tinham) |
| `inv.ratings-updated-for-n-of` | `models/inventoryRatings.js:157` | Texto | Ratings updated for {} of {}. | Notas atualizadas para {} de {}. | traduzir + montado + provável — {} = contagens |
| `inv.no-ratings-were-saved-the` | `models/inventoryRatings.js:158` | Estado vazio | No ratings were saved: the write failed and your inventory is as it was. Try again. | Nenhuma nota foi salva: a gravação falhou e seu inventário está como estava. Tente de novo. | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.saved-ratings-for-n-of` | `models/inventoryRatings.js:159` | Erro/aviso | Saved ratings for {} of {}, then a write failed. Run Update ratings again to save the rest. | Notas salvas para {} de {}, e depois uma gravação falhou. Execute Atualizar notas de novo para salvar o resto. | traduzir + montado — {} = contagens; «Atualizar notas» repete o rótulo do botão |
| `inv.artist-a-z` | `models/inventorySort.js:52` | Rótulo/opção | Artist (A-Z) | Artista (A-Z) | traduzir |
| `inv.artist-z-a` | `models/inventorySort.js:53` | Rótulo/opção | Artist (Z-A) | Artista (Z-A) | traduzir |
| `inv.avg-rating` | `models/inventorySort.js:54` | Rótulo/opção | Avg Rating (↓) | Nota média (↓) | traduzir |
| `inv.avg-rating-2` | `models/inventorySort.js:55` | Rótulo/opção | Avg Rating (↑) | Nota média (↑) | traduzir |
| `inv.avg-pop` | `models/inventorySort.js:56` | Rótulo/opção | Avg Pop (↓) | Pop. média (↓) | traduzir — «Pop.» abrevia Popularidade |
| `inv.avg-pop-2` | `models/inventorySort.js:57` | Rótulo/opção | Avg Pop (↑) | Pop. média (↑) | traduzir — «Pop.» abrevia Popularidade |
| `inv.value` | `models/inventorySort.js:58` | Rótulo/opção | Value (↓) | Valor (↓) | traduzir |
| `inv.value-2` | `models/inventorySort.js:59` | Rótulo/opção | Value (↑) | Valor (↑) | traduzir |
| `inv.newest` | `models/inventorySort.js:60`, `views/helpers/SeriesComponentFactory.js:79` · também em: Séries e álbuns | Rótulo/opção | Newest | Mais recentes | traduzir |
| `inv.oldest` | `models/inventorySort.js:61`, `views/helpers/SeriesComponentFactory.js:80` · também em: Séries e álbuns | Rótulo/opção | Oldest | Mais antigos | traduzir |
| `inv.not-owned` | `models/inventoryStatus.js:29` | Texto | Not Owned | Não tenho | traduzir + MJRP decide — D-06 «Owned»: proposta: «Tenho» / «Não tenho» + provável |
| `inv.moved-to-collection` | `models/inventoryStatus.js:40` | Texto | Moved to Collection | Movido para a Coleção | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» + provável |
| `inv.marked-as-not-owned` | `models/inventoryStatus.js:41` | Texto | Marked as Not Owned | Marcado como Não tenho | traduzir + MJRP decide — D-06 «Owned»: proposta: «Tenho» / «Não tenho» + provável |
| `inv.moved-to-wishlist` | `models/inventoryStatus.js:42` | Texto | Moved to Wishlist | Movido para a Lista de desejos | traduzir + provável — Wishlist não está no glossário: usei «Lista de desejos». |
| `inv.all` | `models/inventoryStatus.js:77`, `views/InventoryPhoneSheets.js:28` | Rótulo/opção | All | Todos | traduzir |
| `inv.discogs-did-not-answer` | `models/inventoryValue.js:282` | Erro/aviso | Discogs did not answer | O Discogs não respondeu | traduzir + provável |
| `inv.discogs-limit-reached` | `models/inventoryValue.js:283` | Texto | Discogs limit reached | Limite do Discogs atingido | traduzir + provável |
| `inv.discogs-refused-the-token` | `models/inventoryValue.js:284` | Texto | Discogs refused the token | O Discogs recusou o token | traduzir + provável — «token» fica; é palavra técnica comum. |
| `inv.sign-in-to-read-values` | `models/inventoryValue.js:285` | Texto | Sign in to read values | Entre para ler os valores | traduzir + provável |
| `inv.the-value-could-not-be-2` | `models/inventoryValue.js:286` | Erro/aviso | The value could not be read | Não foi possível ler o valor | traduzir + provável |
| `inv.no-value-yet` | `models/inventoryValue.js:290`, `models/inventoryValue.js:291` | Estado vazio | No value yet | Ainda sem valor | traduzir + provável |
| `inv.waiting-for-a-value` | `models/inventoryValue.js:292` | Texto | Waiting for a value | Aguardando um valor | traduzir + provável |
| `inv.no-cd-edition-found` | `models/inventoryValue.js:294` | Estado vazio | No CD edition found | Nenhuma edição em CD encontrada | traduzir + provável |
| `inv.in-my-collection-worth` | `models/inventoryValue.js:305` | Texto | In my collection · worth | Na minha coleção · vale | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» + provável |
| `inv.not-mine-yet-costs` | `models/inventoryValue.js:305` | Texto | Not mine yet · costs | Ainda não é meu · custa | traduzir + provável |
| `inv.mean-of-mint-near-mint` | `models/inventoryValue.js:307` | Texto | Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition | Média de Mint, Near Mint e Very Good Plus no Discogs, para a edição em CD mais comum | traduzir + provável — Graus de conservação (Mint etc.) ficam em inglês, como no Discogs. |
| `inv.data-provided-by-discogs` | `models/inventoryValue.js:308` | Texto | Data provided by Discogs. | Dados fornecidos pelo Discogs. | traduzir + provável |
| `inv.lowest-price-this-cd-edition` | `models/inventoryValue.js:309` | Texto | Lowest price this CD edition is for sale at on Discogs now | Menor preço pelo qual esta edição em CD está à venda no Discogs agora | traduzir + provável |
| `inv.discogs-values-are-lowest-asking` | `models/inventoryValue.js:310` | Texto | Discogs values are lowest asking prices for now. | Os valores do Discogs são, por ora, os menores preços pedidos. | traduzir + provável |
| `inv.exchange-rates-are-not-available` | `models/inventoryValue.js:311` | Texto | Exchange rates are not available: values are shown in USD. | As taxas de câmbio não estão disponíveis: os valores aparecem em USD. | traduzir + provável |
| `inv.converted-from-usd-at-today` | `models/inventoryValue.js:319` | Texto | Converted from USD at today's rate (1 USD = {} {}). | Convertido de USD pela taxa de hoje (1 USD = {} {}). | traduzir + montado + provável — {} = valor e moeda |
| `inv.reading-values-n-of-n` | `models/inventoryValueRun.js:148` | Carregando/andamento | Reading values… {} of {} | Lendo valores… {} de {} | traduzir + montado + provável — {} = contagens |
| `inv.you-can-keep-using-the` | `models/inventoryValueRun.js:153` | Texto | You can keep using the inventory. This takes {} for {}. | Você pode continuar usando o inventário. Isso leva {} para {}. | traduzir + montado + MJRP decide + provável — {} = tempo e quantidade/rótulo |
| `inv.reading-n-takes-n` | `models/inventoryValueRun.js:160` | Carregando/andamento | Reading {} takes {}. | Ler {} leva {}. | traduzir + montado + provável — {} = o que se lê e tempo |
| `inv.read-it-now` | `models/inventoryValueRun.js:161` | Texto | Read it now | Ler agora | traduzir + provável — Mesmo texto de «Read them now»: em pt-BR serve para singular e plural |
| `inv.read-them-now` | `models/inventoryValueRun.js:161` | Texto | Read them now | Ler agora | traduzir + provável — Mesmo texto de «Read it now»: em pt-BR serve para singular e plural |
| `inv.discogs-refused-the-token-of` | `models/inventoryValueRun.js:165` | Texto | Discogs refused the token of the app, so the reading stopped. The token on the server has to be replaced. | O Discogs recusou o token do app, então a leitura parou. O token no servidor precisa ser trocado. | traduzir + provável |
| `inv.reading-values-needs-you-signed` | `models/inventoryValueRun.js:166` | Carregando/andamento | Reading values needs you signed in with an account, so the reading stopped. | Ler os valores exige que você esteja conectado com uma conta, então a leitura parou. | traduzir + provável |
| `inv.the-limit-of-requests-was` | `models/inventoryValueRun.js:167` | Erro/aviso | The limit of requests was reached and asks for a long wait, so the reading stopped. Try again later. | O limite de requisições foi atingido e pede uma espera longa, então a leitura parou. Tente de novo mais tarde. | traduzir + provável |
| `inv.discogs-values-were-turned-off` | `models/inventoryValueRun.js:168` | Texto | Discogs values were turned off on the server, so the reading stopped. | Os valores do Discogs foram desligados no servidor, então a leitura parou. | traduzir + provável |
| `inv.values-read-for-n-of` | `models/inventoryValueRun.js:184` | Texto | Values read for {} of {}. | Valores lidos para {} de {}. | traduzir + montado + provável — {} = contagens |
| `inv.n-n-no-cd-edition` | `models/inventoryValueRun.js:185` | Texto | {} {} no CD edition on Discogs. | {} {} sem edição em CD no Discogs. | traduzir + montado + provável — {} = número e «álbum/álbuns»; plural: 1 está / n estão (o código escolhe o verbo) |
| `inv.discogs-suggests-no-price-for` | `models/inventoryValueRun.js:186` | Texto | Discogs suggests no price for {}. | O Discogs não sugere preço para {}. | traduzir + montado + provável — {} = álbum(ns) |
| `inv.stopped-by-you-after-n` | `models/inventoryValueRun.js:189` | Texto | Stopped by you after {} of {}. | Interrompido por você após {} de {}. | traduzir + montado + provável — {} = contagens |
| `inv.album-already-in-inventory` | `services/inventory/InventoryService.js:111` | Erro (pode chegar à tela) | Album already in inventory | O álbum já está no inventário | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.price-cannot-be-negative` | `services/inventory/InventoryService.js:343` | Erro (pode chegar à tela) | Price cannot be negative | O preço não pode ser negativo | traduzir |
| `inv.the-series-and-the-inventory` | `services/inventory/inventoryWiring.js:44` | Erro (pode chegar à tela) | The series and the inventory are not of the same person yet | A série e o inventário ainda não são da mesma pessoa | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.status` | `views/InventoryPhoneSheets.js:62`, `views/InventoryPhoneSheets.js:63` +1 | Leitor de tela | Status | Status | fica |
| `inv.written-by-you` | `views/InventoryPhoneSheets.js:77` | Texto | Written by you. | Escrito por você. | traduzir + provável |
| `inv.this-edition-on-discogs` | `views/InventoryPhoneSheets.js:82` | Texto | This edition on Discogs ↗ | Esta edição no Discogs ↗ | traduzir |
| `inv.sell` | `views/InventoryPhoneSheets.js:96`, `views/renderers/InventoryCardValue.js:86` | Texto | Sell | Vender | traduzir + provável |
| `inv.sell-or-trade` | `views/InventoryPhoneSheets.js:96` | Título | Sell or trade | Vender ou trocar | traduzir + provável |
| `inv.trade` | `views/InventoryPhoneSheets.js:96`, `views/renderers/InventoryCardValue.js:86` | Texto | Trade | Trocar | traduzir + provável |
| `inv.open-album` | `views/InventoryPhoneSheets.js:111` | Rótulo/opção | Open album | Abrir álbum | traduzir |
| `inv.remove-from-inventory` | `views/InventoryPhoneSheets.js:117` | Rótulo/opção | Remove from inventory | Remover do inventário | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.format-2` | `views/InventoryPhoneSheets.js:124`, `views/InventoryPhoneSheets.js:155` | Leitor de tela | Format | Formato | traduzir |
| `inv.sort-by` | `views/InventoryPhoneSheets.js:133`, `views/InventoryPhoneSheets.js:156` +1 | Leitor de tela | Sort by | Ordenar por | traduzir |
| `inv.show-n-n` | `views/InventoryPhoneSheets.js:148` | Texto | Show {} {} | Mostrar {} {} | traduzir + montado + provável — quantidade e palavra (ex.: 1 álbum / n álbuns); o código trata o plural |
| `inv.filters-and-order` | `views/InventoryPhoneSheets.js:151`, `views/InventoryView.js:155` | Dica (tooltip)/título | Filters and order | Filtros e ordem | traduzir |
| `inv.collection-actions` | `views/InventoryPhoneSheets.js:176`, `views/InventoryView.js:157` | Dica (tooltip)/título | Collection actions | Ações da coleção | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.jump-to-a-position` | `views/InventoryPhoneSheets.js:190`, `views/InventoryView.js:154` | Texto | Jump to a position | Ir para uma posição | traduzir + provável |
| `inv.jump-to-an-artist` | `views/InventoryPhoneSheets.js:190`, `views/InventoryView.js:154` | Texto | Jump to an artist | Ir para um artista | traduzir + provável |
| `inv.about-the-values` | `views/InventoryPhoneSheets.js:224`, `views/renderers/InventoryValueHeader.js:105` | Texto | About the values | Sobre os valores | traduzir + provável |
| `inv.why-lowest-asking-prices` | `views/InventoryPhoneSheets.js:224` | Texto | Why lowest asking prices? | Por que os menores preços pedidos? | traduzir + provável |
| `inv.add-the-albums-of-my` | `views/InventoryView.js:22`, `views/renderers/InventoryPhoneRow.js:133` | Texto | Add the albums of my series | Adicione os álbuns das minhas séries | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `inv.update-ratings-2` | `views/InventoryView.js:26` | Texto | Update ratings | Atualizar notas | traduzir + provável |
| `inv.update-values` | `views/InventoryView.js:30` | Texto | Update values | Atualizar valores | traduzir + provável |
| `inv.puts-every-album-of-your` | `views/InventoryView.js:43` | Texto | Puts every album of your series in the inventory, as Not Owned. You see how many and confirm first. | Coloca todos os álbuns das suas séries no inventário, como Não tenho. Você vê quantos são e confirma antes. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção»; D-06 «Owned»: proposta: «Tenho» / «Não tenho» + provável |
| `inv.reads-the-besteveralbums-rating-and` | `views/InventoryView.js:44` | Texto | Reads the BestEverAlbums rating and the Spotify popularity of every album, to order the inventory by them. | Lê a nota do BestEverAlbums e a popularidade no Spotify de cada álbum, para ordenar o inventário por elas. | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» + provável |
| `inv.reads-the-estimated-value-of` | `views/InventoryView.js:45` | Texto | Reads the estimated value of every album from Discogs. You can stop it, and the inventory stays usable. | Lê do Discogs o valor estimado de cada álbum. Você pode interromper, e o inventário continua utilizável. | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» + provável |
| `inv.search-collection` | `views/InventoryView.js:151` | Campo (placeholder) | Search collection | Buscar na coleção | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.1-n` | `views/InventoryView.js:154` | Botão | 1–N | 1–N | fica |
| `inv.a-z` | `views/InventoryView.js:154` | Botão | A–Z | A–Z | fica |
| `inv.filters-and-order-n-on` | `views/InventoryView.js:155` | Texto | Filters and order, {} on | Filtros e ordem, {} ativos | traduzir + montado + provável — {} é a quantidade de filtros ativos; «ativos» concorda em plural (1 ativo / n ativos); o código deve tratar |
| `inv.stop` | `views/InventoryView.js:170` | Botão | Stop | Parar | traduzir |
| `inv.my-collection` | `views/InventoryView.js:316` | Texto | My Collection | Minha Coleção | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» + provável |
| `inv.filter-by-status` | `views/InventoryView.js:338` | Leitor de tela | Filter by status | Filtrar por status | traduzir |
| `inv.show-only-these-albums-press` | `views/InventoryView.js:344` | Dica (tooltip)/título | Show only these albums; press again to show all | Mostrar só estes álbuns; toque de novo para mostrar todos | traduzir |
| `inv.put-every-album-of-your` | `views/InventoryView.js:391` | Texto | Put every album of your series in the inventory, as Not Owned | Colocar todos os álbuns das suas séries no inventário, como Não tenho | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção»; D-06 «Owned»: proposta: «Tenho» / «Não tenho» |
| `inv.read-the-besteveralbums-rating-and` | `views/InventoryView.js:403` | Texto | Read the BestEverAlbums rating and the Spotify popularity of every album, to order the inventory by them | Ler a nota do BestEverAlbums e a popularidade no Spotify de cada álbum, para ordenar o inventário por elas | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.read-the-estimated-value-of` | `views/InventoryView.js:432` | Dica (tooltip)/título | Read the estimated value of every album from Discogs | Ler do Discogs o valor estimado de cada álbum | traduzir |
| `inv.search-collection-2` | `views/InventoryView.js:525` | Campo (placeholder) | Search collection... | Buscar na coleção... | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.all-formats` | `views/InventoryView.js:534` | Rótulo/opção | All Formats | Todos os formatos | traduzir |
| `inv.toggle-grid-list-view` | `views/InventoryView.js:557` | Dica (tooltip)/título | Toggle grid/list view | Alternar entre grade e lista | traduzir |
| `inv.remove-from-inventory-2` | `views/InventoryView.js:656` | Dica (tooltip)/título | Remove from Inventory? | Remover do Inventário? | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.are-you-sure-you-want` | `views/InventoryView.js:657` | Mensagem | Are you sure you want to remove "{}" from your collection? | Tem certeza de que quer remover "{}" da sua coleção? | traduzir + montado + MJRP decide — {} é o nome do álbum |
| `inv.n-open-this-edition-on` | `views/renderers/InventoryCardValue.js:43` | Dica (tooltip)/título | {} Open this edition on Discogs | {} Abrir esta edição no Discogs | traduzir + montado — {} é um valor (preço) colocado antes |
| `inv.cd-n-lowest-for-sale` | `views/renderers/InventoryCardValue.js:46` | Texto | CD · {} · lowest for sale | CD · {} · menor preço à venda | traduzir + montado + provável — {} é o valor |
| `inv.cd-n` | `views/renderers/InventoryCardValue.js:47` | Texto | CD · {} | CD · {} | fica + montado + provável — {} é o valor |
| `inv.n-written-by-you` | `views/renderers/InventoryCardValue.js:53` | Texto | {} · written by you | {} · escrito por você | traduzir + montado + provável — {} é o valor |
| `inv.avg-rating-3` | `views/renderers/InventoryCardValue.js:67`, `views/renderers/InventoryPhoneRow.js:58` | Texto | Avg Rating | Nota média | traduzir + provável |
| `inv.mean-besteveralbums-rating-of-the` | `views/renderers/InventoryCardValue.js:67` | Texto | Mean BestEverAlbums rating of the tracks; in brackets, how many tracks of the album it was made of | Média das notas do BestEverAlbums das faixas; entre parênteses, de quantas faixas do álbum ela foi feita | traduzir + provável |
| `inv.avg-pop-3` | `views/renderers/InventoryCardValue.js:71`, `views/renderers/InventoryPhoneRow.js:59` | Texto | Avg Pop | Pop. média | traduzir + provável — Abreviação de popularidade média; rótulo curto. |
| `inv.mean-spotify-popularity-of-the` | `views/renderers/InventoryCardValue.js:71` | Texto | Mean Spotify popularity of the tracks; in brackets, how many tracks of the album it was made of | Média da popularidade no Spotify das faixas; entre parênteses, de quantas faixas do álbum ela foi feita | traduzir + provável |
| `inv.sell-trade-or-buy` | `views/renderers/InventoryCardValue.js:111` | Texto | Sell, trade or buy | Vender, trocar ou comprar | traduzir + provável |
| `inv.background-15151a-border-1px-solid` | `views/renderers/InventoryGridRenderer.js:31` | Texto | background:#15151a;border:1px solid rgba(255,255,255,.08) | background:#15151a;border:1px solid rgba(255,255,255,.08) | técnico + provável — CSS, não é texto para pessoas. |
| `inv.loading-inventory` | `views/renderers/InventoryGridRenderer.js:182`, `views/renderers/InventoryPhoneRow.js:119` | Carregando/andamento | Loading inventory... | Carregando inventário... | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.no-albums-found-matching-your` | `views/renderers/InventoryGridRenderer.js:186` | Estado vazio | No albums found matching your filters. | Nenhum álbum encontrado com esses filtros. | traduzir |
| `inv.mean-of-the-besteveralbums-rating` | `views/renderers/InventoryGridRenderer.js:197` | Dica (tooltip)/título | Mean of the BestEverAlbums rating and of the Spotify popularity of the tracks; in brackets, how many tracks of the album each mean was made of | Média da nota do BestEverAlbums e da popularidade no Spotify das faixas; entre parênteses, de quantas faixas do álbum cada média foi feita | traduzir |
| `inv.open-n-n` | `views/renderers/InventoryPhoneRow.js:83` | Leitor de tela | Open {}, {} | Abrir {}, {} | traduzir + montado — {} são título e artista |
| `inv.status-n-change-it` | `views/renderers/InventoryPhoneRow.js:83` | Leitor de tela | Status: {}. Change it | Status: {}. Alterar | traduzir + montado — {} é o status (Tenho / Não tenho) |
| `inv.all-n-albums` | `views/renderers/InventoryPhoneRow.js:98` | Texto | All {} albums | Todos os {} álbuns | traduzir + montado + provável — plural: 1 álbum / n álbuns; com 1, «O álbum» |
| `inv.showing-n-of-n` | `views/renderers/InventoryPhoneRow.js:100` | Texto | Showing {} of {} | Mostrando {} de {} | traduzir + montado — duas quantidades |
| `inv.show-n-more` | `views/renderers/InventoryPhoneRow.js:101` | Texto | Show {} more | Mostrar mais {} | traduzir + montado — {} é a quantidade |
| `inv.clear-search-and-filters` | `views/renderers/InventoryPhoneRow.js:128` | Texto | Clear search and filters | Limpar busca e filtros | traduzir |
| `inv.no-albums-match` | `views/renderers/InventoryPhoneRow.js:128` | Estado vazio | No albums match | Nenhum álbum corresponde | traduzir |
| `inv.nothing-in-your-collection-matches` | `views/renderers/InventoryPhoneRow.js:128` | Estado vazio | Nothing in your collection matches the search and the filters. | Nada na sua coleção corresponde à busca e aos filtros. | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.albums-you-add-from-the` | `views/renderers/InventoryPhoneRow.js:133` | Texto | Albums you add from the Albums screen show here. You can also put every album of your series here at once, as Not Owned. | Os álbuns que você adiciona pela tela Álbuns aparecem aqui. Você também pode colocar todos os álbuns das suas séries aqui de uma vez, como Não tenho. | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)»; D-06 «Owned»: proposta: «Tenho» / «Não tenho» |
| `inv.your-collection-is-empty` | `views/renderers/InventoryPhoneRow.js:133` | Estado vazio | Your collection is empty | Sua coleção está vazia | traduzir + MJRP decide — D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção» |
| `inv.adding-the-albums-of-your` | `views/renderers/InventoryPhoneRow.js:147` | Carregando/andamento | Adding the albums of your series… | Adicionando os álbuns das suas séries… | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `inv.reading-values` | `views/renderers/InventoryPhoneRow.js:149` | Carregando/andamento | Reading values… | Lendo valores… | traduzir + provável |
| `inv.currency-2` | `views/renderers/InventoryValueHeader.js:44`, `views/renderers/InventoryValueHeader.js:115` | Leitor de tela | Currency | Moeda | traduzir |
| `inv.each-value-links-to-its` | `views/renderers/InventoryValueHeader.js:54` | Texto | Each value links to its edition on Discogs.{} | Cada valor leva à sua edição no Discogs.{} | traduzir + montado — {} é um trecho opcional que segue a frase (ex.: aviso adicional) |
| `inv.estimated-value-of-what-i` | `views/renderers/InventoryValueHeader.js:66` | Texto | Estimated value of what I own: | Valor estimado do que tenho: | traduzir + provável |
| `inv.to-buy-the-rest` | `views/renderers/InventoryValueHeader.js:67` | Texto | To buy the rest: | Para comprar o resto: | traduzir + provável |
| `inv.the-suggestions-are-tried-again` | `views/renderers/InventoryValueHeader.js:95` | Texto | : the suggestions are tried again the next time values are read. | : as sugestões são tentadas de novo na próxima vez que os valores forem lidos. | traduzir — Texto vem logo após um link; manter os dois-pontos iniciais. |
| `inv.discogs-suggests-prices-only-to` | `views/renderers/InventoryValueHeader.js:95`, `views/renderers/InventoryValueHeader.js:156` | Texto | Discogs suggests prices only to accounts with seller settings filled in. | O Discogs só sugere preços a contas com as configurações de vendedor preenchidas. | traduzir |
| `inv.discogs-com-settings-seller` | `views/renderers/InventoryValueHeader.js:95` | Texto | discogs.com/settings/seller | discogs.com/settings/seller | fica — Endereço de site. |
| `inv.until-then-the-values-here` | `views/renderers/InventoryValueHeader.js:95`, `views/renderers/InventoryValueHeader.js:157` | Texto | Until then, the values here are the lowest price each CD is for sale at. Fill the settings in at | Até lá, os valores aqui são o menor preço pelo qual cada CD está à venda. Preencha as configurações em | traduzir — Texto vem logo antes de um link. |
| `inv.owned` | `views/renderers/InventoryValueHeader.js:102` | Texto | Owned | Tenho | traduzir + MJRP decide — D-06 «Owned»: proposta: «Tenho» / «Não tenho» + provável |
| `inv.to-buy` | `views/renderers/InventoryValueHeader.js:103` | Texto | To buy | Para comprar | traduzir + provável |
| `inv.lowest-asking-prices-why` | `views/renderers/InventoryValueHeader.js:104` | Texto | Lowest asking prices · Why? | Menores preços pedidos · Por quê? | traduzir + provável |
| `inv.estimated-value-of-what-i-2` | `views/renderers/InventoryValueHeader.js:144` | Rótulo/opção | Estimated value of what I own | Valor estimado do que tenho | traduzir |
| `inv.to-buy-the-rest-2` | `views/renderers/InventoryValueHeader.js:145` | Rótulo/opção | To buy the rest | Para comprar o resto | traduzir |
| `inv.each-value-links-to-its-2` | `views/renderers/InventoryValueHeader.js:148` | Texto | Each value links to its edition on Discogs. | Cada valor leva à sua edição no Discogs. | traduzir + provável |

## Componentes comuns (modais, filtros, paginação, avisos) (42)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `ui.cancel` | `components/navigation/PhoneMenu.js:83`, `components/series/SeriesEditModal.js:66` +3 · também em: Menu, rodapé e aplicação; Séries e álbuns | Texto | Cancel | Cancelar | traduzir |
| `ui.confirm` | `components/ui/BaseModal.js:156`, `components/ui/modals/ConfirmModal.js:29` | Texto | Confirm | Confirmar | traduzir + provável |
| `ui.your-personal-ranking` | `components/ui/Card.js:272` | Dica (tooltip)/título | Your Personal Ranking | Seu ranking pessoal | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `ui.my-ranking` | `components/ui/Card.js:275` | Texto | MY RANKING | MEU RANKING | traduzir + provável |
| `ui.ranking-by-besteveralbums` | `components/ui/Card.js:285` | Dica (tooltip)/título | Ranking by BestEverAlbums | Ranking do BestEverAlbums | traduzir + MJRP decide — D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade» |
| `ui.spotify` | `components/ui/Card.js:301` | Dica (tooltip)/título | Spotify | Spotify | fica |
| `ui.no-cover` | `components/ui/coverImage.js:21` | Leitor de tela | No cover | Sem capa | traduzir |
| `ui.view` | `components/ui/FilterSheet.js:68`, `components/ui/FilterSheet.js:78` +1 · também em: Inventário | Leitor de tela | View | Ver | traduzir |
| `ui.sort-series-by` | `components/ui/FilterSheet.js:80` | Texto | Sort series by | Ordenar séries por | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `ui.reload-albums-from-the-sources` | `components/ui/FilterSheet.js:90` | Texto | Reload albums from the sources | Recarregar os álbuns das fontes | traduzir |
| `ui.filters` | `components/ui/FilterSheet.js:98`, `components/ui/FilterToolbar.js:106` +1 | Texto | Filters | Filtros | traduzir |
| `ui.filters-n-on` | `components/ui/FilterSheet.js:98` | Texto | Filters · {} on | Filtros · {} ativos | traduzir + montado + provável — plural: 1 ativo / n ativos |
| `ui.clear-filters` | `components/ui/FilterSheet.js:109` | Botão | Clear filters | Limpar filtros | traduzir |
| `ui.show-albums` | `components/ui/FilterSheet.js:110` | Botão | Show albums | Mostrar álbuns | traduzir |
| `ui.search` | `components/ui/FilterToolbar.js:48` | Campo (placeholder) | Search... | Buscar… | traduzir |
| `ui.filters-n-on-2` | `components/ui/FilterToolbar.js:109` | Texto | Filters, {} on | Filtros, {} ativos | traduzir + montado + provável — plural: 1 ativo / n ativos |
| `ui.remove-the-filter-n-n` | `components/ui/FilterToolbar.js:119` | Leitor de tela | Remove the filter {}: {} | Remover o filtro {}: {} | montado — muda o nome do filtro e o valor |
| `ui.clear-all` | `components/ui/FilterToolbar.js:127` | Botão | Clear all | Limpar tudo | traduzir |
| `ui.dynamic-filter-groups-n-sort` | `components/ui/FilterToolbar.js:171` | Texto | <!-- Dynamic Filter Groups --> {} <!-- Sort Dropdown (if options provided) --> {} <!-- Refresh Action --> {} <!-- View Mode Toggles --> {} | <!-- Dynamic Filter Groups --> {} <!-- Sort Dropdown (if options provided) --> {} <!-- Refresh Action --> {} <!-- View Mode Toggles --> {} | técnico |
| `ui.n-refresh` | `components/ui/FilterToolbar.js:179` | Texto | {} Refresh | {} Atualizar | montado — {} é um ícone/símbolo |
| `ui.reload` | `components/ui/FilterToolbar.js:179` | Dica (tooltip)/título | Reload | Recarregar | traduzir |
| `ui.grid-view` | `components/ui/FilterToolbar.js:226` | Dica (tooltip)/título | Grid View | Visualização em grade | traduzir |
| `ui.list-view` | `components/ui/FilterToolbar.js:226` | Dica (tooltip)/título | List View | Visualização em lista | traduzir |
| `ui.load-n-more-albums` | `components/ui/LoadMoreButton.js:14` | Texto | Load {} more albums | Carregar mais {} álbuns | traduzir + montado + provável — plural: 1 álbum / n álbuns (há texto próprio para 1) |
| `ui.load-1-more-album` | `components/ui/LoadMoreButton.js:14` | Texto | Load 1 more album | Carregar mais 1 álbum | traduzir + provável |
| `ui.showing` | `components/ui/Pager.js:69` | Texto | Showing | Mostrando | traduzir + provável |
| `ui.no-series-matches-these-filters` | `components/ui/Pager.js:72` | Estado vazio | No series matches these filters | Nenhuma série corresponde a esses filtros | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» + provável |
| `ui.of` | `components/ui/Pager.js:73` | Texto | of | de | traduzir |
| `ui.pages` | `components/ui/Pager.js:81`, `components/ui/Pager.js:120` +2 | Texto | Pages | Páginas | traduzir |
| `ui.paging-form` | `components/ui/Pager.js:81`, `components/ui/Pager.js:120` | Leitor de tela | Paging form | Formulário de paginação | traduzir |
| `ui.scroll` | `components/ui/Pager.js:81`, `components/ui/Pager.js:120` | Texto | Scroll | Rolagem | traduzir |
| `ui.series-per-page` | `components/ui/Pager.js:81`, `components/ui/Pager.js:120` | Leitor de tela | Series per page | Séries por página | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `ui.class-series-pager-step-series` | `components/ui/Pager.js:144` | Texto | class="series-pager-step series-pager-step--back" aria-label="Previous page" | class="series-pager-step series-pager-step--back" aria-label="Página anterior" | traduzir + MJRP decide + provável — só o valor de aria-label muda; o resto é código |
| `ui.class-series-pager-step-aria` | `components/ui/Pager.js:145` | Texto | class="series-pager-step" aria-label="Next page" | class="series-pager-step" aria-label="Próxima página" | traduzir + MJRP decide + provável — só o valor de aria-label muda; o resto é código |
| `ui.page-n-of-n` | `components/ui/Pager.js:152` | Texto | Page {} of {} | Página {} de {} | montado — muda página atual e total |
| `ui.go-to-page` | `components/ui/Pager.js:153` | Leitor de tela | Go to page | Ir para a página | traduzir |
| `ui.n-not-been-checked-against` | `components/ui/Pager.js:173` | Texto | {} not been checked against the sources yet, so this filter may miss {}. An album is checked the first time its series loads. | {} ainda não foi verificado nas fontes, então este filtro pode deixar de fora {}. Um álbum é verificado na primeira vez que a série dele é carregada. | montado + MJRP decide — singular/plural e gênero: «1 álbum ainda não foi verificado… deixar de fora ele» / «n álbuns ainda não foram verificados… deixar de fora eles»; o código deve fornecer a concordância |
| `ui.previous` | `components/ui/Pager.js:187` | Botão | Previous | Anterior | traduzir + provável |
| `ui.next` | `components/ui/Pager.js:189` | Botão | Next | Próxima | traduzir + provável |
| `ui.all-n-series-are-on` | `components/ui/Pager.js:207` | Texto | All {} series are on screen. | Todas as {} séries estão na tela. | traduzir + montado + MJRP decide — plural: 1 série / n séries |
| `ui.load-n-more` | `components/ui/Pager.js:210` | Texto | Load {} more | Carregar mais {} | montado — muda o número |
| `ui.tab` | `components/ui/Sheet.js:129` | Texto | Tab | Aba | traduzir + provável |

## Em breve (12)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `soon.this-feature` | `views/ComingSoonView.js:14`, `views/ComingSoonView.js:27` | Texto | This Feature | Este recurso | traduzir |
| `soon.artist-series` | `views/ComingSoonView.js:21` | Texto | Artist Series | Séries por artista | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `soon.organize-your-music-by-artists` | `views/ComingSoonView.js:21` | Descrição | Organize your music by artists | Organize sua música por artista | traduzir |
| `soon.categorize-music-by-genres` | `views/ComingSoonView.js:22` | Descrição | Categorize music by genres | Classifique a música por gênero | traduzir |
| `soon.genre-series` | `views/ComingSoonView.js:22` | Texto | Genre Series | Séries por gênero | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `soon.create-collections-of-individual-tracks` | `views/ComingSoonView.js:23` | Descrição | Create collections of individual tracks | Crie coleções de faixas avulsas | traduzir |
| `soon.track-series` | `views/ComingSoonView.js:23` | Texto | Track Series | Séries de faixas | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `soon.mix-and-blend-your-series` | `views/ComingSoonView.js:24` | Descrição | Mix and blend your series into perfect playlists | Misture suas séries em playlists perfeitas | traduzir + MJRP decide — D-02 «Series»: proposta: traduzir por «Série(s)» |
| `soon.coming-soon` | `views/ComingSoonView.js:27` | Descrição | Coming soon | Em breve | traduzir |
| `soon.n-back-to-albums` | `views/ComingSoonView.js:29` | Texto | {} Back to Albums | {} Voltar aos álbuns | traduzir + montado — {} é um ícone |
| `soon.coming-soon-2` | `views/ComingSoonView.js:29` | Texto | Coming Soon | Em breve | traduzir |
| `soon.we-re-working-hard-to` | `views/ComingSoonView.js:29` | Texto | We're working hard to bring you this feature. Stay tuned! | Estamos trabalhando para trazer este recurso. Fique ligado! | traduzir |

## Servidor (5)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `srv.ai-api-key-not-configured` | `server/routes/debug.js:36`, `server/routes/debug.js:55` | Mensagem do servidor | AI API key not configured on server | AI API key not configured on server | técnico |
| `srv.missing-albumquery-in-request-body` | `server/routes/debug.js:57` | Mensagem do servidor | Missing albumQuery in request body | Missing albumQuery in request body | técnico |
| `srv.ai-api-key-not-configured-2` | `server/routes/debug.js:100`, `server/routes/debug.js:130` | Mensagem do servidor | AI API key not configured | AI API key not configured | técnico |
| `srv.musickit-not-configured` | `server/routes/musickit.js:32` | Mensagem do servidor | MusicKit not configured | MusicKit not configured | técnico |
| `srv.failed-to-generate-musickit-token` | `server/routes/musickit.js:51` | Mensagem do servidor | Failed to generate MusicKit token | Failed to generate MusicKit token | técnico |

## Outros (42)

| ID | Onde aparece | Tipo | EN (hoje) | PT (proposta do agente) | Marca |
|---|---|---|---|---|---|
| `misc.unknown-album` | `algorithms/BaseAlgorithm.js:153`, `models/Album.js:15` +3 · também em: Algoritmos e receitas do Blend; Séries e álbuns | Texto | Unknown Album | Álbum desconhecido | traduzir + provável |
| `misc.post-n` | `api/client.js:92` | Texto | POST {} | POST {} | técnico + provável |
| `misc.n-answered-http-n-n` | `api/serverResult.js:160` | Texto | {} answered HTTP {} ({}) | {} answered HTTP {} ({}) | técnico + provável |
| `misc.component-requires-a-container-element` | `components/base/Component.js:9` | Erro (pode chegar à tela) | Component requires a container element. | Component requires a container element. | técnico |
| `misc.breadcrumb` | `components/Breadcrumb.js:15` | Leitor de tela | Breadcrumb | Trilha de navegação | traduzir |
| `misc.saved-playlists` | `components/Breadcrumb.js:45`, `models/savedPlaylists.js:26` +1 · também em: Playlists; Séries e álbuns | Texto | Saved Playlists | Playlists salvas | traduzir |
| `misc.edit-batch` | `components/Breadcrumb.js:47`, `components/playlists/SavedPlaylistActions.js:32` · também em: Playlists | Texto | Edit Batch | Editar lote | traduzir + MJRP decide — D-05 «Batch»: proposta: «Lote» |
| `misc.unknown` | `components/InventoryAddModal.js:158`, `services/album-search/AlbumSearchService.js:235` +5 · também em: Inventário; Menu, rodapé e aplicação; Playlists; Séries e álbuns | Texto | Unknown | Desconhecido | traduzir + provável |
| `misc.avg-rating-n` | `models/albumAverages.js:87` | Texto | Avg Rating: {} | Nota média: {} | traduzir + montado + provável — {} = valor |
| `misc.avg-pop-n` | `models/albumAverages.js:88` | Texto | Avg Pop: {} | Pop. média: {} | traduzir + montado + provável — {} = valor; «Pop.» abrevia Popularidade |
| `misc.studio` | `models/albumPicker.js:14` | Rótulo/opção | Studio | Estúdio | traduzir |
| `misc.singles` | `models/albumPicker.js:16` | Rótulo/opção | Singles | Singles | fica — «Singles» é usado como está no meio musical em pt-BR |
| `misc.live` | `models/albumPicker.js:17`, `models/albumType.js:25` | Rótulo/opção | Live | Ao vivo | traduzir |
| `misc.compendiums` | `models/albumPicker.js:18` | Rótulo/opção | Compendiums | Coletâneas | traduzir + MJRP decide — D-03 «Compendiums»: proposta: «Coletâneas» |
| `misc.other` | `models/albumPicker.js:19` | Rótulo/opção | Other | Outros | traduzir |
| `misc.deluxe` | `models/albumPicker.js:72` | Texto | Deluxe | Deluxe | fica + provável |
| `misc.remaster` | `models/albumPicker.js:73` | Texto | Remaster | Remaster | fica + provável |
| `misc.single` | `models/albumType.js:24` | Texto | Single | Single | fica + provável |
| `misc.compilation` | `models/albumType.js:26` | Texto | Compilation | Coletânea | traduzir + provável |
| `misc.no-album-was-added` | `models/bulkPaste.js:84`, `models/homePaste.js:56` · também em: Home (montar a série) | Estado vazio | No album was added. | Nenhum álbum foi adicionado. | traduzir + provável |
| `misc.amazon` | `models/buyLinks.js:24` | Texto | Amazon | Amazon | fica |
| `misc.n-n-cd` | `models/buyLinks.js:25`, `models/buyLinks.js:30` | Texto | {} {} CD | {} {} CD | traduzir + montado + provável — {} = artista e álbum; fica «CD» |
| `misc.each-link-opens-the-store` | `models/buyLinks.js:71` | Texto | Each link opens the store on this album, on CD. The app earns nothing from these links today. | Cada link abre a loja neste álbum, em CD. O app não ganha nada com esses links hoje. | traduzir + provável |
| `misc.selling-and-trading-between-collectors` | `models/buyLinks.js:73` | Texto | Selling and trading between collectors: not in the app yet | Venda e troca entre colecionadores: ainda não está no app | traduzir + provável |
| `misc.by-spotify-popularity-where-there` | `models/recipeSources.js:47` | Texto | by Spotify popularity where there is one, otherwise in album order | pela popularidade do Spotify, onde houver, e senão na ordem do álbum | traduzir + provável |
| `misc.unknown-track` | `models/Track.js:41`, `models/Track.js:76` | Texto | Unknown Track | Faixa desconhecida | traduzir + provável |
| `misc.ok` | `services/DialogService.js:127` | Confirmação/aviso do navegador | OK | OK | fica |
| `misc.invalid-config-n` | `services/PlaylistGenerationService.js:73` | Erro (pode chegar à tela) | Invalid config: {} | Configuração inválida: {} | traduzir + montado — {} é o motivo |
| `misc.unknown-algorithm-n` | `services/PlaylistGenerationService.js:79` | Erro (pode chegar à tela) | Unknown algorithm: {} | Algoritmo desconhecido: {} | traduzir + montado — {} é o id do algoritmo |
| `misc.algorithm-id-is-required` | `services/PlaylistGenerationService.js:162` | Texto | Algorithm ID is required | O ID do algoritmo é obrigatório | traduzir + provável |
| `misc.target-duration-must-be-positive` | `services/PlaylistGenerationService.js:166` | Texto | Target duration must be positive | A duração desejada deve ser positiva | traduzir + provável |
| `misc.spotify-needs-you-to-connect` | `services/spotify/spotifyErrors.js:8` | Texto | Spotify needs you to connect again. | O Spotify precisa que você conecte de novo. | traduzir + provável |
| `misc.spotify-asked-to-wait-n` | `services/spotify/spotifyErrors.js:20` | Texto | Spotify asked to wait {} seconds before the next request (Rate Limited). | O Spotify pediu para esperar {} segundos antes do próximo pedido (limite de requisições). | traduzir + montado + provável — plural: 1 segundo / n segundos (o código trata) |
| `misc.spotify-asked-to-wait-before` | `services/spotify/spotifyErrors.js:21` | Texto | Spotify asked to wait before the next request (Rate Limited). | O Spotify pediu para esperar antes do próximo pedido (limite de requisições). | traduzir + provável |
| `misc.spotify-api-error-n` | `services/SpotifyService.js:102` | Texto | Spotify API Error: {} | Erro da API do Spotify: {} | traduzir + montado + provável — {} é a mensagem do erro |
| `misc.could-not-get-user-profile` | `services/SpotifyService.js:280` | Erro (pode chegar à tela) | Could not get user profile | Não foi possível obter o perfil do usuário | traduzir |
| `misc.created-by-mjrp-album-blender` | `services/SpotifyService.js:286` | Texto | Created by MJRP Album Blender | Criada pelo MJRP Album Blender | traduzir + provável |
| `misc.task-passed-its-deadline-of` | `utils/TaskQueue.js:17` | Texto | Task passed its deadline of {} ms | A tarefa passou do prazo de {} ms | traduzir + montado + provável — {} é o prazo em ms |
| `misc.task-cancelled` | `utils/TaskQueue.js:26` | Texto | Task cancelled | Tarefa cancelada | traduzir + provável |
| `misc.no-albums-of-the-selected` | `views/renderers/DiscographyRenderer.js:33` | Estado vazio | No albums of the selected types. | Nenhum álbum dos tipos selecionados. | traduzir |
| `misc.n-n-click-to-add` | `views/renderers/DiscographyRenderer.js:53` | Leitor de tela | {}, {}. Click to add it | {}, {}. Clique para adicionar | traduzir + montado — {} são título e artista |
| `misc.network-error` | `workers/search.worker.js:27` | Erro (pode chegar à tela) | Network error | Erro de rede | traduzir |

## Fora deste mapa

- **Nomes de álbuns, artistas e faixas** vindos dos catálogos (Apple Music, Spotify, Discogs, BestEverAlbums): nunca se traduzem.
- **Capas e álbuns fictícios da página de entrada** (`public/splash/covers.js`): dado de demonstração, não texto de interface; o texto em volta (`{} · fictional album`) está no mapa.
- **Destinos de links internos:** não são copy.
- **Candidatos descartados pelo script (87):** técnicos, sem letras, ou do servidor (log, configuração, prompt de IA). Lista em `design/copy/album-blender-excluded.md`.
