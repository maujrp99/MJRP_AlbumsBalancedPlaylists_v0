/**
 * F80 · the home with the menu as the bar, v2 (UAT-241, UAT-240), 2026-11-21: «A barra é o menu», the owner's name
 * for direction B and his choice for this round; every text in Portuguese first, with an English switch; the
 * ranking story optional and partial, a real album on its card; the flip as a short band.
 *
 * Builds the previews from the REAL entry page: public/splash.html filled by the same function the
 * Vite plugin uses (scripts/entryPage.mjs, real cover set), its modules inlined, the covers and the
 * logo as data: URLs (the published comparator may not load images from another host). Then each
 * preview changes only what its axis changes — where the menu and the slider meet — on top of the
 * story re-cut around the menu (shared by the three, one model).
 *
 * Usage: node design/proposals/f80-splash/home-menu/build_v2.mjs <covers dir with <key>.webp>
 * Writes: design/inception/splash-menu-bar-v2.html (never over an existing file).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fillEntryPage } from '../../../../scripts/entryPage.mjs'
import { COVER_SETS } from '../../../../public/splash/covers.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../../../..')
const COVERS = process.argv[2]
if (!COVERS) throw new Error('usage: build.mjs <covers dir>')
const PROD = 'https://mjrp-playlist-generator.web.app'
const read = (p) => fs.readFileSync(path.join(REPO, p), 'utf8')

// ---------------------------------------------------------------- the page as built
function builtPage() {
    let html = fillEntryPage(read('public/splash.html'), { set: 'real', gateSource: read('public/splash/gate.js') })
    // the gate (the root decision) and the site's CSP do not apply to a page shown in the comparator
    html = html.replace(/<script>\(function\(\)\{[\s\S]*?runGate\(window\)\}\)\(\);<\/script>/, '')
    html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n?/, '')
    html = html.replace(/<link rel="(icon|apple-touch-icon)"[^>]*>\n?/g, '')
    // covers and logo inline
    for (const album of COVER_SETS.real) {
        const file = path.join(COVERS, album.k + '.webp')
        const data = 'data:image/webp;base64,' + fs.readFileSync(file).toString('base64')
        const url = `https://is1-ssl.mzstatic.com/image/thumb/${album.art}/360x360bb.webp`
        if (!html.includes(url)) throw new Error('cover not on the page: ' + album.k)
        html = html.split(url).join(data)
    }
    const logo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(REPO, 'public/splash/wordmark.jpg')).toString('base64')
    html = html.replace('src="/splash/wordmark.jpg"', `src="${logo}"`)
    return html
}

/** The page's modules as one inline module: framing, the 3D crate and splash, imports and exports dropped. */
function bundle(patchSplash = (s) => s) {
    const strip = (s) => s.replace(/^import .*$/gm, '').replace(/^export /gm, '')
    let splash = strip(read('public/splash/splash.js'))
    splash = splash.replace("import('./crate3d.js')", 'Promise.resolve({ startCrate3d })')
    splash = patchSplash(splash)
    return [strip(read('public/splash/framing.js')), strip(read('public/splash/crate3d.js')), splash].join('\n')
}

/** Every link into the app goes to the site in production, in a new tab (the comparator cannot host the app). */
const prodLinks = (html) => html.replace(/href="\/(start|albums|blend|saved-playlists|inventory)([^"]*)"/g,
    (m, p, q) => `href="${PROD}/${p}${q}" target="_blank" rel="noopener"`)

// ---------------------------------------------------------------- today (the reference)
function today() {
    let html = builtPage()
    html = html.replace('<script type="module" src="/splash/main.js"></script>',
        `<script type="module">\n${bundle()}\nstartSplash(window)\n</script>`)
    return prodLinks(html)
}

// ---------------------------------------------------------------- the story, re-cut around the menu (shared)
// ---------------------------------------------------------------- v2: the copy, in Portuguese first (proposal, not final)
// The owner, 2026-11-21: «sugiro rever o prototipo já com texto tudo me portugues pls». One dictionary, two languages;
// the page is written in Portuguese (it reads without JavaScript) and the switch swaps every text for the English.
// Kept in English in both: the product's name (The Album Blender, the Blender), «Blend» (the product's word, copy doc
// D-01), «Playlists» (the word Brazilian listeners use), Apple Music and Spotify (brands).
const T = {
    // the menu: the labels of the site's copy document (nav.*), «Inicie» by the owner's decision (F85)
    'm.start': ['Inicie', 'Start'], 'm.albums': ['Álbuns', 'Albums'], 'm.blend': ['Blend', 'Blend'],
    'm.playlists': ['Playlists', 'Playlists'], 'm.inventory': ['Inventário', 'Inventory'],
    'menu.aria': ['Menu: cada item leva à história dele nesta página', 'Menu: each item takes you to its story on this page'],
    'flip.aria': ['Virar o disco', 'Flip the record'],
    'signin': ['Entrar', 'Sign in'], 'openapp': ['Abrir o app', 'Open the app'],
    'skip': ['Pular para o conteúdo', 'Skip to content'], 'home.aria': ['The Album Blender, topo da página', 'The Album Blender, top of the page'],
    'pause': ['Pausar o movimento', 'Pause motion'], 'play': ['Retomar o movimento', 'Play motion'],
    // the first screen, without an account
    'h.kick': ['The Album Blender · um app web para quem ouve álbuns inteiros', 'The Album Blender · a web app for whole-album listeners'],
    'h.title': ['Mergulhe nos álbuns que você ama. <em>Cada faixa conta.</em>', 'Dig through the albums you love. <em>Every track counts.</em>'],
    'h.what': ['Reúna álbuns em séries, ponha as faixas na ordem que quiser e misture playlists em que nenhum disco fica de fora.',
        'Gather albums into series, put the tracks in the order you want, and blend playlists where no record is left out.'],
    // the first screen, with an account: the home of whoever comes back
    'hi.kick': ['De volta ao caixote', 'Back to the crate'],
    'hi.title': ['Sua próxima série <em>começa aqui.</em>', 'Your next series <em>starts here.</em>'],
    'hi.what': ['Comece por um artista ou por uma lista de álbuns, ou retome o que você guardou: suas playlists e seu inventário.',
        'Start from an artist or a list of albums, or pick up what you kept: your playlists and your inventory.'],
    'hi.playlists': ['Suas playlists', 'Your playlists'],
    // the stories, one per item of the menu
    'k.start': ['Lado A · 1 — Inicie', 'Side A · 1 — Start'], 'k.albums': ['Lado A · 2 — Álbuns', 'Side A · 2 — Albums'],
    'k.blend': ['Lado A · 3 — Blend', 'Side A · 3 — Blend'], 'k.playlists': ['Lado B · 1 — Playlists', 'Side B · 1 — Playlists'],
    'k.inventory': ['Lado B · 2 — Inventário', 'Side B · 2 — Inventory'],
    't.start': ['Comece por um artista ou por uma lista.', 'Begin with one artist, or a list.'],
    'p.start': ['Digite um artista ou cole os álbuns que você tem em mente. O Blender junta tudo numa série.',
        'Type an artist, or paste the albums you have in mind. The Blender gathers them into a series.'],
    // the owner: «o user nao deve rank every track, ele ranqueia o que ele quer» → optional and partial
    't.albums': ['Ponha no topo as faixas que você quiser.', 'Rank your tracks, your way.'],
    'p.albums': ['Uma só ou várias. As outras ficam como estão, e o Blend pode seguir a sua ordem.',
        'Just one, or a few. The rest stay as they are, and the Blend can follow your order.'],
    // the card: a real album, its real titles; the order is an example of «your ranking» (no third-party ratings)
    'r.tag': ['Seu ranking · exemplo', 'Your ranking · example'],
    'r.up': ['você subiu', 'you moved it up'],
    'r.more': ['+ 7 faixas', '+ 7 tracks'],
    'r.note': ['Exemplo: uma faixa subiu para o topo.', 'Example: one track moved to the top.'],
    'r.aria': ['Exemplo de ranking das faixas de The Velvet Underground & Nico', 'Example ranking of the tracks of The Velvet Underground & Nico'],
    't.blend': ['Misture a série numa playlist só.', 'Blend the series into one playlist.'],
    'p.blend': ['Escolha uma receita. O Blender tira faixas de cada álbum, e nenhum disco abafa os outros.',
        'Pick a recipe. The Blender draws from every album, so no record drowns out the rest.'],
    // the flip: a short band; the owner on the old screen: «faz sentido isso aqui ?»
    'f.title': ['Vire o disco', 'Flip the record'],
    'f.line': ['No lado B fica o que você guarda: suas playlists e seu inventário.', 'Side B holds what you keep: your playlists and your inventory.'],
    't.playlists': ['Guarde os Blends que você curtiu.', 'Keep the blends you love.'],
    'p.playlists': ['Toda playlist salva fica aqui, para ouvir de novo, refazer ou exportar para o Spotify.',
        'Every playlist you save waits here, to play again, regenerate or export to Spotify.'],
    't.inventory': ['Conte os discos da sua estante.', 'Keep count of the records you own.'],
    'p.inventory': ['Marque os álbuns da sua estante e veja uma estimativa de quanto vale a coleção.',
        'Mark the albums on your shelf and see an estimate of what the collection is worth.'],
    'd.start': ['Começar uma série', 'Start a series'], 'd.albums': ['Ver seus álbuns', 'See your albums'], 'd.blend': ['Fazer um Blend', 'Make a blend'],
    'd.playlists': ['Ver suas playlists', 'See your playlists'], 'd.inventory': ['Abrir o inventário', 'Open your inventory'],
    'footer.aria': ['Rodapé', 'Footer'],
    // the close
    'e.title': ['Ponha a agulha na sua primeira série.', 'Drop the needle on your first series.'],
    'e.what': ['Abra o app e comece uma série com um álbum que você ama. Entre para guardá-la.', 'Open the app and start a series with one album you love. Sign in to keep it.'],
    'ei.title': ['Ponha a agulha numa série nova.', 'Drop the needle on a new series.'],
    // the credits (Apple's identity: «Ouça no Apple Music» is its Portuguese badge)
    'c.src': ['Capa do Apple Music', 'Artwork from Apple Music'], 'c.listen': ['Ouça no Apple Music', 'Listen on Apple Music'],
    'c.newtab': [' (abre numa nova aba)', ' (opens in a new tab)'],
    'credit': ['As capas vêm do Apple Music e são dos artistas e das gravadoras; todo disco mostrado inteiro nesta página tem link para a página dele no Apple Music. Apple e Apple Music são marcas da Apple Inc., registradas nos EUA e em outros países.',
        'Album artwork comes from Apple Music and belongs to the artists and labels; every record shown whole on this page links to its page on Apple Music. Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries.'],
    'stage.aria': ['Uma caixa de discos; a página puxa um disco para a frente a cada parte', 'A crate of albums; the page pulls one record forward for each part'],
    'proto': ['Protótipo ·', 'Prototype ·'], 'proto.out': ['Sem conta', 'Signed out'], 'proto.in': ['Com conta', 'Signed in'],
    'proto.note': ['— texto proposto, não final', '— proposal text, not final'],
    'title': ['The Album Blender — para quem ouve álbuns inteiros', 'The Album Blender — for people who listen to whole albums']
}
const pt = (k) => { if (!T[k]) throw new Error('no text: ' + k); return T[k][0] }
const tx = (tag, k, attrs = '') => `<${tag}${attrs} data-i18n="${k}">${pt(k)}</${tag}>`

const MENU = [
    // id, text key, the app's address
    ['start', 'm.start', '/start'], ['albums', 'm.albums', '/albums'], ['blend', 'm.blend', '/blend'],
    ['playlists', 'm.playlists', '/saved-playlists'], ['inventory', 'm.inventory', '/inventory']
]
const eqi = '<span class="eqi" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'
const door = (id) => { const m = MENU.find(x => x[0] === id); return `<a class="door only-in" href="${m[2]}"><span data-i18n="d.${id}">${pt('d.' + id)}</span> <span aria-hidden="true">→</span></a>` }

// the real track list: iTunes lookup of the album in public/splash/covers.js (id 1440851613), disc 1, read 2026-11-21
const VU = ["Sunday Morning", "I'm Waiting for the Man", "Femme Fatale", "Venus In Furs", "Run Run Run", "All Tomorrow's Parties",
    'Heroin', 'There She Goes Again', "I'll Be Your Mirror", "The Black Angel's Death Song", 'European Son']
const RANK = [VU[3], VU[0], VU[1], VU[2]] // the example: «Venus In Furs» moved to the top, the others as they were

const STORY = `
  <section class="hero" id="a1" data-track="a1" aria-labelledby="h1">
    <div class="only-out">
      ${tx('p', 'h.kick', ' class="kicker"')}
      ${tx('h1', 'h.title', ' id="h1"')}
      ${tx('p', 'h.what', ' class="what"')}
      <div class="ctas" id="hero-ctas"><a class="btn btn-primary" href="/start" id="app"><span data-i18n="openapp">${pt('openapp')}</span> ${eqi}</a><a class="btn btn-ghost" href="/start?signin" id="signin" data-i18n="signin">${pt('signin')}</a></div>
    </div>
    <div class="only-in">
      ${tx('p', 'hi.kick', ' class="kicker"')}
      ${tx('h1', 'hi.title', ' id="h1in"')}
      ${tx('p', 'hi.what', ' class="what"')}
      <div class="ctas"><a class="btn btn-primary" href="/start"><span data-i18n="m.start">${pt('m.start')}</span> ${eqi}</a><a class="btn btn-ghost" href="/saved-playlists" data-i18n="hi.playlists">${pt('hi.playlists')}</a></div>
    </div>
  </section>

  <section id="start" data-track="start" aria-labelledby="t-start">
    <div class="slot pre" data-pull="2" aria-hidden="true"></div>
    ${tx('p', 'k.start', ' class="kicker"')}
    ${tx('h2', 't.start', ' class="t" id="t-start"')}
    ${tx('p', 'p.start')}
    ${door('start')}
  </section>

  <section id="albums" data-track="albums" aria-labelledby="t-albums">
    <div class="slot pre" data-pull="0" aria-hidden="true"></div>
    ${tx('p', 'k.albums', ' class="kicker"')}
    ${tx('h2', 't.albums', ' class="t" id="t-albums"')}
    ${tx('p', 'p.albums')}
    <div class="ranked rank-real" role="group" aria-label="${pt('r.aria')}" data-i18n-aria="r.aria">
      <div class="tag">${tx('span', 'r.tag')}<b>The Velvet Underground &amp; Nico · 1967</b></div>
      <ol>
        ${RANK.map((t, i) => `<li${i === 0 ? ' class="up"' : ''}><span>${i + 1}</span><span class="tt">${t.replace(/&/g, '&amp;')}</span>${i === 0 ? `<span class="mv"><span aria-hidden="true">↑</span> <span data-i18n="r.up">${pt('r.up')}</span></span>` : '<span></span>'}</li>`).join('\n        ')}
      </ol>
      ${tx('p', 'r.more', ' class="more-tracks"')}
      ${tx('p', 'r.note', ' class="note"')}
    </div>
    ${door('albums')}
  </section>

  <section id="blend" data-track="blend" aria-labelledby="t-blend">
    <div class="slot pre" data-pull="5" aria-hidden="true"></div>
    ${tx('p', 'k.blend', ' class="kicker"')}
    ${tx('h2', 't.blend', ' class="t" id="t-blend"')}
    ${tx('p', 'p.blend')}
    ${door('blend')}
  </section>

  <section class="flip flip-band" id="flip" data-track="flip" aria-labelledby="tf">
    <h2 class="fb-title" id="tf"><span aria-hidden="true">⟲</span> <span data-i18n="f.title">${pt('f.title')}</span></h2>
    ${tx('p', 'f.line', ' class="fb-line"')}
  </section>

  <section id="playlists" data-track="playlists" aria-labelledby="t-playlists">
    <div class="slot pre" data-pull="10" aria-hidden="true"></div>
    ${tx('p', 'k.playlists', ' class="kicker"')}
    ${tx('h2', 't.playlists', ' class="t" id="t-playlists"')}
    ${tx('p', 'p.playlists')}
    ${door('playlists')}
  </section>

  <section id="inventory" data-track="inventory" aria-labelledby="t-inventory">
    <div class="slot pre" data-pull="12" aria-hidden="true"></div>
    ${tx('p', 'k.inventory', ' class="kicker"')}
    ${tx('h2', 't.inventory', ' class="t" id="t-inventory"')}
    ${tx('p', 'p.inventory')}
    ${door('inventory')}
  </section>

  <section class="final" id="end" data-track="end" aria-labelledby="t-end">
    <div class="only-out">
      ${tx('h2', 'e.title', ' class="t" id="t-end"')}
      ${tx('p', 'e.what')}
      <div class="ctas"><a class="btn btn-primary" href="/start"><span data-i18n="openapp">${pt('openapp')}</span> ${eqi}</a><a class="btn btn-ghost" href="/start?signin" data-i18n="signin">${pt('signin')}</a></div>
    </div>
    <div class="only-in">
      ${tx('h2', 'ei.title', ' class="t"')}
      <div class="ctas"><a class="btn btn-primary" href="/start"><span data-i18n="m.start">${pt('m.start')}</span> ${eqi}</a></div>
    </div>
    <div class="b2-fire" aria-hidden="true"><div class="glow"></div><canvas id="embers-b2"></canvas></div>
  </section>
`

/** The tracks: the flip is now a band, so it pulls nothing and the crate turns while it passes. */
const TRACKS_JS = `const ORDER = Object.freeze(['a1', 'start', 'albums', 'blend', 'flip', 'playlists', 'inventory', 'end'])
const TRACKS = Object.freeze({
    a1: { side: 'A', pull: -1, face: 0, fire: FIRE.peak, label: '' },
    start: { side: 'A', pull: 2, fire: FIRE.low, label: '' },
    albums: { side: 'A', pull: 0, fire: FIRE.low, label: '' },
    blend: { side: 'A', pull: 5, fire: FIRE.low, label: '' },
    flip: { side: 'A', pull: -1, face: 0, fire: (FIRE.low + FIRE.peak) / 2, label: '' },
    playlists: { side: 'B', pull: 10, fire: FIRE.low, label: '' },
    inventory: { side: 'B', pull: 12, fire: FIRE.low, label: '' },
    end: { side: 'B', pull: -1, face: 13, fire: FIRE.peak, label: '' }
})
`

function patchSplash(s) {
    const re = /const ORDER = [\s\S]*?\n\}\)\n/
    if (!re.test(s)) throw new Error('splash.js: ORDER/TRACKS not found')
    s = s.replace(re, TRACKS_JS)
    const swap = (a, b) => { if (!s.includes(a)) throw new Error('splash.js: not found: ' + a); s = s.replace(a, b) }
    swap("D.getElementById('now-track').textContent = s.label", "{ const nt = D.getElementById('now-track'); if (nt) nt.textContent = s.label }")
    swap("if (phone) { D.getElementById('hero-ctas').appendChild(mb); mb.classList.add('inline') }", '')
    swap("mb.textContent = paused ? 'Play motion' : 'Pause motion'", "{ const l = win.__t(paused ? 'play' : 'pause'); mb.setAttribute('aria-label', l); mb.title = l }")
    swap("am.setAttribute('aria-label', `Listen to ${album.t} by ${album.a} on Apple Music (opens in a new tab)`)",
        "am.setAttribute('aria-label', `${win.__t('c.listen')}: ${album.t}, ${album.a}${win.__t('c.newtab')}`)")
    swap("credit.textContent = `${album.t} · ${album.a} — Listen on Apple Music`",
        "credit.textContent = `${album.t} · ${album.a} — ${win.__t('c.listen')}`; credit.dataset.album = `${album.t} · ${album.a}`")
    return s
}

const SLIDER = `<nav class="ms" id="ms" aria-label="${pt('menu.aria')}" data-i18n-aria="menu.aria">
      ${MENU.map(([id, k]) => `<a class="stop" href="#${id}" data-for="${id}"><span class="lb" data-i18n="${k}">${pt(k)}</span></a>`).join('\n      ')}
      <a class="flipmark" href="#flip" aria-label="${pt('flip.aria')}" data-i18n-aria="flip.aria"><span aria-hidden="true">⟲</span></a>
      <div class="eqbar" id="eqbar" aria-hidden="true"></div>
      <span class="needle" aria-hidden="true"></span>
    </nav>`

const PAUSE = `<button class="motion-icon" id="motion" type="button" aria-pressed="false" aria-label="${pt('pause')}" title="${pt('pause')}" hidden>
          <svg class="i-pause" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>
          <svg class="i-play" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.2-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5z"/></svg>
        </button>`

const accountOut = `<a class="btn btn-ghost btn-sm only-out" href="/start?signin" data-i18n="signin">${pt('signin')}</a><a class="btn btn-primary btn-sm only-out" href="/start" data-i18n="openapp">${pt('openapp')}</a>`
const accountIn = `<a class="btn btn-primary btn-sm btn-start only-in" href="/start"><span data-i18n="m.start">${pt('m.start')}</span> ${eqi}</a>`
const SHARED_CSS = `
/* ===== F80 · home menu preview (UAT-241, UAT-240): shared ===== */
html:not(.in) .only-in{display:none!important}
html.in .only-out{display:none!important}
.proto{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:6px var(--gutter);background:#1a1206;color:#fde7c8;font:600 13px/1.2 var(--body)}
.proto button{min-height:32px;padding:0 12px;border-radius:16px;border:1px solid rgba(253,231,200,.4);background:transparent;color:#fde7c8;font:600 13px/1 var(--body);cursor:pointer}
.proto button[aria-pressed="true"]{background:#fde7c8;color:#1a1206}
html.embed .proto{display:none}
.hero .h1{font:800 clamp(38px,3.6vw,48px)/1.04 var(--display);letter-spacing:-.02em;margin:0;text-wrap:balance}
.hero .h1 em{font-style:normal;color:var(--orange)}
.door{display:inline-flex;align-items:center;gap:8px;min-height:44px;color:var(--orange-text);font:700 16px/1 var(--body);text-decoration:none;margin-top:6px}
.door:hover{text-decoration:underline}
.top .wrap{gap:20px}
.top .acct{display:flex;gap:8px;align-items:center;flex:0 0 auto}
/* the slider-menu: five stops on ONE continuous row of bars (Elevar's thread), the fire fills it as you read */
nav.ms,.top nav.ms{position:relative;display:grid;gap:0;grid-template-columns:repeat(5,minmax(0,1fr));width:100%;min-width:0}
.ms .stop{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;min-height:44px;text-decoration:none;color:var(--muted);font:600 14px/1 var(--body);border-radius:6px;white-space:nowrap}
.ms .stop:hover{color:#fff}
.ms .stop.on{color:#fff}
.ms .stop.cur{color:var(--orange-text)}
.ms .flipmark{position:absolute;z-index:2;left:60%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;width:24px;height:24px;color:var(--faint);text-decoration:none;font-size:14px;border-radius:6px}
.ms .flipmark.on{color:var(--orange-text)}
.eqbar{position:absolute;left:0;right:0;display:flex;align-items:flex-end;gap:2px;pointer-events:none}
.eqbar i{flex:1 1 0;min-width:1px;border-radius:1px 1px 0 0;background:rgba(255,255,255,.2);height:var(--h);transform-origin:center bottom}
.eqbar i.on{background:linear-gradient(0deg,#dc2626,#f97316 60%,#fbbf24)}
html.moving:not(.paused) .eqbar i.cur{animation:eqb var(--d) ease-in-out var(--o) infinite alternate}
.needle{display:none}
/* the pause: a discreet icon in the stage's corner, where the motion is */
.motion-icon{position:absolute;z-index:6;top:8px;right:8px;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:22px;border:1px solid rgba(255,255,255,.28);background:rgba(10,10,12,.6);color:#d6d6dc;cursor:pointer;padding:0}
.motion-icon:hover{color:#fff;border-color:rgba(255,255,255,.6)}
.motion-icon svg{fill:currentColor}
.motion-icon .i-play{display:none}
html.paused .motion-icon .i-play{display:block}
html.paused .motion-icon .i-pause{display:none}
@media (max-width:899px){
  .motion-icon{width:44px;height:44px;border-radius:22px;top:6px;right:var(--gutter)}
  html.in .top .btn-start{display:inline-flex}
  .top .acct .btn-primary.only-out{display:none}
  .ms .flipmark{display:none}
  .thread .wrap{padding-top:4px}
}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`

const VARIANTS = {
    // A · the thread under the header, continuous, its stops labelled with the menu's items
    stops: {
        title: 'The Album Blender — preview A, the thread with stops',
        header: `${accountOut}${accountIn}`,
        place: { desk: 'thread', phone: 'thread' },
        css: `
:root{--thread:56px}
.thread .wrap{height:var(--thread)}
.thread .now-track{min-width:12.5em}
.ms .stop{justify-content:flex-end;padding-bottom:3px;font:700 12px/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.ms .flipmark{top:0}
.eqbar{top:4px;height:18px}
@media (max-width:899px){
  .thread .wrap{height:64px}
  .ms .stop{font-size:12px;letter-spacing:0;text-transform:none;font-weight:600;padding-bottom:6px;min-height:52px}
  .eqbar{top:6px;height:16px}
  .ms .flipmark{top:4px;font-size:0}
}`
    },
    // B · the menu itself is the slider: the items in the header's row, each over its part of the bars
    bar: {
        title: 'The Album Blender — preview B, the menu is the bar',
        header: `<div class="ms-desk" id="slot-header">${'%%SLIDER%%'}</div><div class="acct">${accountOut}${accountIn}</div>`,
        place: { desk: 'header', phone: 'thread' },
        css: `
:root{--top:72px;--thread:0px}
.thread{display:none}
.ms-desk{flex:1 1 auto;min-width:0;max-width:620px;margin:0 auto}
.ms .stop{justify-content:flex-start;padding-top:8px;min-height:52px}
.ms .flipmark{top:4px}
.eqbar{bottom:6px;height:16px}
@media (max-width:899px){
  :root{--top:56px}
  .ms-desk{display:none}
  .thread{display:block}
  .thread .wrap{height:64px}
  .ms .stop{justify-content:flex-end;padding:0 0 8px;font-size:12px;min-height:56px}
  .eqbar{top:8px;bottom:auto;height:18px}
  .ms .flipmark{top:4px;font-size:0}
}`
    },
    // C · the deck: one transport bar at the bottom, the same on the computer and the phone, a needle on the bars
    deck: {
        title: 'The Album Blender — preview C, the deck at the bottom',
        header: `${accountOut}${accountIn}`,
        place: { desk: 'thread', phone: 'thread' },
        css: `
:root{--thread:0px;--deck:68px}
body{padding-bottom:calc(var(--deck) + env(safe-area-inset-bottom))}
.thread{position:fixed;top:auto;bottom:0;left:0;right:0;border-bottom:0;border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
.thread .wrap{height:var(--deck)}
.thread .now-track{min-width:12.5em}
.stage{height:calc(100dvh - var(--top) - var(--deck) - 8px)}
.ms .stop{justify-content:flex-end;padding-bottom:4px;font:700 12px/1 var(--body);letter-spacing:.08em;text-transform:uppercase;min-height:56px}
.ms .flipmark{top:0}
.eqbar{top:8px;height:22px}
.needle{display:block;position:absolute;z-index:3;top:2px;height:34px;width:2px;margin-left:-1px;left:var(--p,0%);background:#fde7c8;border-radius:1px;box-shadow:0 0 8px rgba(251,191,36,.8);pointer-events:none}
.needle::before{content:"";position:absolute;left:-4px;top:-2px;width:10px;height:10px;border-radius:5px;background:#fde7c8}
@media (max-width:899px){
  .thread .wrap{height:64px}
  .thread .now-track{display:none}
  .ms .stop{min-height:56px;font-size:12px;letter-spacing:0;text-transform:none;font-weight:600;padding-bottom:8px}
  .eqbar{top:8px;height:20px}
  .needle{top:2px;height:30px}
  .ms .flipmark{top:-6px;font-size:0}
}`
    }
}

const SLIDER_JS = (variant) => `
// ===== the slider-menu (preview ${variant.key}): placement, the signed-in switch, the continuous fill =====
{
  const D = document, H = D.documentElement
  const qs = new URLSearchParams(location.search)
  if (qs.has('embed')) H.classList.add('embed')
  const setIn = (on) => {
    H.classList.toggle('in', on)
    D.querySelectorAll('.proto [data-state]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.state === 'in') === on)))
  }
  setIn(qs.get('in') === '1')
  D.querySelectorAll('.proto [data-state]').forEach(b => b.addEventListener('click', () => setIn(b.dataset.state === 'in')))

  const ms = D.getElementById('ms'), slots = { header: D.getElementById('slot-header'), thread: D.getElementById('slot-thread') }
  const PLACE = ${JSON.stringify(variant.place)}
  const mq = matchMedia('(max-width:899px)')
  const place = () => { const s = slots[mq.matches ? PLACE.phone : PLACE.desk]; if (s && ms.parentNode !== s) s.appendChild(ms) }
  place(); mq.addEventListener('change', () => { place(); build() })

  // where each section sits on the bar: the five items share it; the opening and the close are its two ends
  const SLOTS = { a1: [0, 0], start: [0, .2], albums: [.2, .4], blend: [.4, .6], flip: [.6, .6], playlists: [.6, .8], inventory: [.8, 1], end: [1, 1] }
  const IDS = Object.keys(SLOTS), secs = IDS.map(id => D.getElementById(id))
  const bar = D.getElementById('eqbar'), stops = [...ms.querySelectorAll('.stop')], flipmark = ms.querySelector('.flipmark')
  let bars = []
  const style = (k) => { const h = 38 + Math.round(58 * Math.abs(Math.sin(k * 1.93 + .4))); const d = (.55 + ((k * 37) % 9) / 10).toFixed(2); const o = (((k * 53) % 7) / 10).toFixed(1); return '--h:' + h + '%;--d:' + d + 's;--o:-' + o + 's' }
  function build () {
    const w = bar.getBoundingClientRect().width || 600
    const n = Math.max(30, Math.round(w / 6))
    let s = ''; for (let k = 0; k < n; k++) s += '<i style="' + style(k) + '"></i>'
    bar.innerHTML = s; bars = [...bar.children]; paint(true)
  }
  let last = -1
  function progress () {
    const mark = innerHeight * .55
    if (innerHeight + scrollY >= D.documentElement.scrollHeight - 2) return 1
    let p = 0
    secs.forEach((el, i) => { const r = el.getBoundingClientRect(); if (r.top < mark) { const f = Math.max(0, Math.min(1, (mark - r.top) / r.height)); const [a, b] = SLOTS[IDS[i]]; p = a + (b - a) * f } })
    return p
  }
  function paint (force) {
    const p = progress()
    if (!force && Math.abs(p - last) < .002) return
    last = p
    const n = bars.length, on = Math.round(p * n)
    bars.forEach((b, k) => { b.classList.toggle('on', k < on); b.classList.toggle('cur', k < on && k >= on - 4) })
    const cur = p <= 0 || p >= 1 ? -1 : Math.min(4, Math.floor(p * 5 + 1e-6))
    stops.forEach((s, i) => {
      s.classList.toggle('on', p > i * .2 + 1e-6); s.classList.toggle('cur', i === cur)
      if (i === cur) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current')
    })
    flipmark.classList.toggle('on', p >= .6)
    ms.style.setProperty('--p', (p * 100).toFixed(2) + '%')
  }
  addEventListener('scroll', () => paint(false), { passive: true })
  addEventListener('resize', build)
  build()
}
`


const V2_CSS = `
/* ===== v2: Portuguese first, the real ranking card, the flip as a band ===== */
.proto .sep{opacity:.5}
.rank-real .tag{flex-direction:column;gap:4px}
.rank-real li{grid-template-columns:20px 1fr auto}
.rank-real li.up .tt{color:#fff;font-weight:600}
.rank-real .mv{font:700 12px/1.2 var(--body);color:var(--orange-text);white-space:nowrap}
.rank-real .more-tracks{font-size:14px;color:var(--muted);margin:8px 0 0}
/* the flip: a short band, not a screen; the crate still turns while it passes */
.story > section.flip-band{min-height:0;padding:28px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin:24px 0}
.flip-band .fb-title{font:800 22px/1.2 var(--display);margin:0 0 6px;color:var(--orange-text);letter-spacing:-.01em}
.flip-band .fb-line{margin:0;color:var(--muted)}
/* Portuguese runs longer: the menu's labels stay on one line */
.ms .lb{white-space:nowrap}
@media (max-width:899px){
  .story > section.flip-band{padding:8px 0;margin:0;border-bottom:0;display:flex;flex-wrap:wrap;align-items:baseline;column-gap:8px}
  .flip-band .fb-title{font-size:14px;margin:0}
  .flip-band .fb-line{font-size:13px;line-height:1.35}
  .ms .stop{font-size:12px}
}
`

const I18N_JS = `
// ===== the language: Portuguese first; ?lang=en or the prototype's switch shows the same page in English =====
{
  const T = ${JSON.stringify(T)}
  const D = document, H = D.documentElement
  let lang = new URLSearchParams(location.search).get('lang') === 'en' ? 1 : 0
  window.__t = (k) => (T[k] || ['', ''])[lang]
  window.__setLang = (i) => {
    lang = i
    H.lang = i ? 'en' : 'pt-BR'
    D.title = T.title[i]
    D.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = T[el.dataset.i18n][i] })
    D.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', T[el.dataset.i18nAria][i]))
    const mb = D.getElementById('motion'); if (mb) { const l = T[H.classList.contains('paused') ? 'play' : 'pause'][i]; mb.setAttribute('aria-label', l); mb.title = l }
    D.querySelectorAll('.slot-am').forEach(a => { if (a.dataset.album) a.textContent = a.dataset.album + ' — ' + T['c.listen'][i] })
    const am = D.getElementById('am'); if (am && am.getAttribute('aria-label')) am.setAttribute('aria-label', am.getAttribute('aria-label').replace(/^[^:]+:/, T['c.listen'][i] + ':').replace(/ \\((abre numa nova aba|opens in a new tab)\\)$/, T['c.newtab'][i]))
    D.querySelectorAll('.proto [data-lang]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.lang) === i)))
  }
  D.querySelectorAll('.proto [data-lang]').forEach(b => b.addEventListener('click', () => window.__setLang(Number(b.dataset.lang))))
  if (lang) window.__setLang(1)
}
`

function pageV2() {
    const v = { ...VARIANTS.bar, key: 'bar', title: pt('title') }
    let html = builtPage()
    html = html.replace('<html lang="en"', '<html lang="pt-BR"')
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${v.title}</title>`)
    html = html.replace('<a class="skip" href="#main">Skip to content</a>', `<a class="skip" href="#main" data-i18n="skip">${pt('skip')}</a>`)
    const header = `<div class="proto" role="group" aria-label="Protótipo"><span data-i18n="proto">${pt('proto')}</span> <button type="button" data-state="out" aria-pressed="true" data-i18n="proto.out">${pt('proto.out')}</button><button type="button" data-state="in" aria-pressed="false" data-i18n="proto.in">${pt('proto.in')}</button><span class="sep" aria-hidden="true">·</span><button type="button" data-lang="0" aria-pressed="true" lang="pt-BR">PT</button><button type="button" data-lang="1" aria-pressed="false" lang="en">EN</button><span data-i18n="proto.note">${pt('proto.note')}</span></div>
<header class="top"><div class="wrap">
  <a class="home" href="#a1" aria-label="${pt('home.aria')}" data-i18n-aria="home.aria"><img class="logo" alt="The Album Blender" src="%%LOGO%%" width="900" height="149"></a>
  <div class="ms-desk" id="slot-header">${SLIDER}</div><div class="acct">${accountOut}${accountIn}</div>
</div></header>

<div class="thread"><div class="wrap">
  <div class="ms-slot" id="slot-thread" style="flex:1;min-width:0"></div>
</div></div>`
    const logo = html.match(/class="logo" alt="The Album Blender" src="([^"]+)"/)[1]
    html = html.replace(/<header class="top">[\s\S]*?<\/header>\n\n<nav class="thread"[\s\S]*?<\/div><\/nav>/, () => header.replace('%%LOGO%%', logo))
    if (!html.includes('class="proto"')) throw new Error('header not replaced')
    html = html.replace(/<section class="hero"[\s\S]*?(\n  <div class="stage-col">)/, (m, tail) => STORY + tail)
    if (!html.includes('id="t-inventory"')) throw new Error('story not replaced')
    html = html.replace('<canvas class="embers" id="embers" aria-hidden="true"></canvas>', '<canvas class="embers" id="embers" aria-hidden="true"></canvas>\n        ' + PAUSE)
    // the stage, the caption and the credits speak the page's language
    const sw = (a, b) => { if (!html.includes(a)) throw new Error('not on the page: ' + a.slice(0, 60)); html = html.replace(a, b) }
    sw('aria-label="A crate of albums; the page pulls one record forward for each part"', `aria-label="${pt('stage.aria')}" data-i18n-aria="stage.aria"`)
    sw('<span class="src">Artwork from Apple Music</span>', `<span class="src" data-i18n="c.src">${pt('c.src')}</span>`)
    sw('Listen on Apple Music<span class="sr"> (opens in a new tab)</span>', `<span data-i18n="c.listen">${pt('c.listen')}</span><span class="sr" data-i18n="c.newtab">${pt('c.newtab')}</span>`)
    html = html.replace(/<p>Album artwork comes from Apple Music[\s\S]*?<\/p>/, () => `<p data-i18n="credit">${pt('credit')}</p>`)
    if (!html.includes('data-i18n="credit"')) throw new Error('credit not replaced')
    html = html.replace(/<nav aria-label="Footer">[\s\S]*?<\/nav>/, () => `<nav aria-label="${pt('footer.aria')}" data-i18n-aria="footer.aria"><a class="only-out" href="/start" data-i18n="openapp">${pt('openapp')}</a><a class="only-out" href="/start?signin" data-i18n="signin">${pt('signin')}</a>${MENU.map(([, k, href]) => `<a class="only-in" href="${href}" data-i18n="${k}">${pt(k)}</a>`).join('')}</nav>`)
    html = html.replace('</style>\n</head>', SHARED_CSS + v.css + V2_CSS + '\n</style>\n</head>')
    html = html.replace('<script type="module" src="/splash/main.js"></script>',
        `<script type="module">\n${I18N_JS}\n${bundle(patchSplash)}\n${SLIDER_JS(v)}\nstartSplash(window)\n</script>`)
    return prodLinks(html)
}

const out = (rel, html) => {
    const p = path.join(REPO, rel)
    if (fs.existsSync(p) && !process.env.V2_REBUILD) throw new Error('exists, never overwrite a version he has seen: ' + rel + ' (V2_REBUILD=1 only before it is shown)')
    fs.writeFileSync(p, html); console.log(rel, Math.round(Buffer.byteLength(html) / 1024) + ' KB')
}
out('design/inception/splash-menu-bar-v2.html', pageV2())
