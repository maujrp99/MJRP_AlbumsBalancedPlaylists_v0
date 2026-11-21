/**
 * F80 · the home with the menu as the slider (UAT-239, UAT-240), 2026-11-21.
 *
 * Builds the previews from the REAL entry page: public/splash.html filled by the same function the
 * Vite plugin uses (scripts/entryPage.mjs, real cover set), its modules inlined, the covers and the
 * logo as data: URLs (the published comparator may not load images from another host). Then each
 * preview changes only what its axis changes — where the menu and the slider meet — on top of the
 * story re-cut around the menu (shared by the three, one model).
 *
 * Usage: node design/proposals/f80-splash/home-menu/build.mjs <covers dir with <key>.webp>
 * Writes: design/proposals/f80-splash/home-menu/today.html (the page as built, the reference) and
 *         design/inception/splash-menu-{stops,bar,deck}-v1.html.
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
const MENU = [
    // id, label (the app's own: navigation/phoneTabs.js), the app's address, the side of the record
    ['start', 'Start', '/start', 'A', 1],
    ['albums', 'Albums', '/albums', 'A', 2],
    ['blend', 'Blend', '/blend', 'A', 3],
    ['playlists', 'Playlists', '/saved-playlists', 'B', 1],
    ['inventory', 'Inventory', '/inventory', 'B', 2]
]
const eqi = '<span class="eqi" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'
const door = (id) => { const m = MENU.find(x => x[0] === id); return `<a class="door only-in" href="${m[2]}">Open ${m[1]} <span aria-hidden="true">→</span></a>` }
const kick = (id) => { const m = MENU.find(x => x[0] === id); return `<p class="kicker">Side ${m[3]} · ${m[4]} — ${m[1]}</p>` }

const STORY = `
  <section class="hero" id="a1" data-track="a1" aria-labelledby="h1">
    <div class="only-out">
      <p class="kicker">For whole-album listeners</p>
      <h1 id="h1">Dig through the albums you love. <em>Keep every track.</em></h1>
      <p class="what"><strong>The Album Blender is a web app for people who listen to whole albums.</strong> Gather albums into series, rank every track, and blend them into playlists that keep every record in the mix — then keep count of the ones on your shelf.</p>
      <div class="ctas" id="hero-ctas"><a class="btn btn-primary" href="/start" id="app">Open the app ${eqi}</a><a class="btn btn-ghost" href="/start?signin" id="signin">Sign in</a></div>
    </div>
    <div class="only-in">
      <p class="kicker">Welcome back</p>
      <h1 id="h1in">Back to the crate. <em>Start a new series.</em></h1>
      <p class="what">Start from an artist or a list of albums, or pick up what you kept: your playlists and your shelf.</p>
      <div class="ctas"><a class="btn btn-primary" href="/start">Start ${eqi}</a><a class="btn btn-ghost" href="/saved-playlists">Your playlists</a></div>
    </div>
  </section>

  <section id="start" data-track="start" aria-labelledby="t-start">
    <div class="slot pre" data-pull="2" aria-hidden="true"></div>
    ${kick('start')}
    <h2 class="t" id="t-start">Begin with one artist, or a list.</h2>
    <p>Type an artist, or paste the albums you have in mind. The Blender gathers them into a series.</p>
    ${door('start')}
  </section>

  <section id="albums" data-track="albums" aria-labelledby="t-albums">
    <div class="slot pre" data-pull="3" aria-hidden="true"></div>
    ${kick('albums')}
    <h2 class="t" id="t-albums">Rank every track of every album.</h2>
    <p>Your series, album by album. Order each one's tracks by how often they are played, or by your own ear.</p>
    <div class="ranked" role="group" aria-label="Illustrative example of one album's tracks ranked">
      <div class="tag"><span>Illustrative · fictional album</span><b>Copper Year</b></div>
      <ol>
        <li><span>1</span><span>Low Sun Overture</span><span class="bar" style="--w:92%"></span></li>
        <li><span>2</span><span>Pier at Dusk</span><span class="bar" style="--w:78%"></span></li>
        <li><span>3</span><span>Second Side Waltz</span><span class="bar" style="--w:64%"></span></li>
        <li><span>4</span><span>The Long Player</span><span class="bar" style="--w:51%"></span></li>
      </ol>
      <p class="note">Bar length = the track's place in the ranking you choose. Example data, not real scores.</p>
    </div>
    ${door('albums')}
  </section>

  <section id="blend" data-track="blend" aria-labelledby="t-blend">
    <div class="slot pre" data-pull="5" aria-hidden="true"></div>
    ${kick('blend')}
    <h2 class="t" id="t-blend">Blend the series into one playlist.</h2>
    <p>Pick a recipe. The Blender draws from every album, so no record drowns out the rest.</p>
    ${door('blend')}
  </section>

  <section class="flip" id="flip" data-track="flip" aria-labelledby="tf">
    <div class="slot pre" data-pull="13" aria-hidden="true"></div>
    <p class="kicker">End of Side A</p>
    <h2 class="t" id="tf">Flip the record.</h2>
    <p>Side B keeps what you made.</p>
  </section>

  <section id="playlists" data-track="playlists" aria-labelledby="t-playlists">
    <div class="slot pre" data-pull="10" aria-hidden="true"></div>
    ${kick('playlists')}
    <h2 class="t" id="t-playlists">Keep the blends you love.</h2>
    <p>Every playlist you save waits here, to play again, regenerate or export to Spotify.</p>
    ${door('playlists')}
  </section>

  <section id="inventory" data-track="inventory" aria-labelledby="t-inventory">
    <div class="slot pre" data-pull="12" aria-hidden="true"></div>
    ${kick('inventory')}
    <h2 class="t" id="t-inventory">Keep count of the records you own.</h2>
    <p>Mark the albums on your shelf and see an estimate of what the collection is worth.</p>
    ${door('inventory')}
  </section>

  <section class="final" id="end" data-track="end" aria-labelledby="t-end">
    <div class="only-out">
      <h2 class="t" id="t-end">Drop the needle on your first series.</h2>
      <p>Open the app and start a series with one album you love. Sign in to keep it with you.</p>
      <div class="ctas"><a class="btn btn-primary" href="/start">Open the app ${eqi}</a><a class="btn btn-ghost" href="/start?signin">Sign in</a></div>
    </div>
    <div class="only-in">
      <h2 class="t">Drop the needle on a new series.</h2>
      <div class="ctas"><a class="btn btn-primary" href="/start">Start ${eqi}</a></div>
    </div>
    <div class="b2-fire" aria-hidden="true"><div class="glow"></div><canvas id="embers-b2"></canvas></div>
  </section>
`

/** The tracks of the record, now the menu's stories: Side A makes (Start, Albums, Blend), Side B keeps (Playlists, Inventory). */
const TRACKS_JS = `const ORDER = Object.freeze(['a1', 'start', 'albums', 'blend', 'flip', 'playlists', 'inventory', 'end'])
const TRACKS = Object.freeze({
    a1: { side: 'A', pull: -1, face: 0, fire: FIRE.peak, label: '' },
    start: { side: 'A', pull: 2, fire: FIRE.low, label: 'Side A · 1 — Start' },
    albums: { side: 'A', pull: 3, fire: FIRE.low, label: 'Side A · 2 — Albums' },
    blend: { side: 'A', pull: 5, fire: FIRE.low, label: 'Side A · 3 — Blend' },
    flip: { side: 'A', pull: -1, face: 0, fire: (FIRE.low + FIRE.peak) / 2, label: 'Flip the record' },
    playlists: { side: 'B', pull: 10, fire: FIRE.low, label: 'Side B · 1 — Playlists' },
    inventory: { side: 'B', pull: 12, fire: FIRE.low, label: 'Side B · 2 — Inventory' },
    end: { side: 'B', pull: -1, face: 13, fire: FIRE.peak, label: 'Side B · end' }
})
`

function patchSplash(s) {
    const re = /const ORDER = [\s\S]*?\n\}\)\n/
    if (!re.test(s)) throw new Error('splash.js: ORDER/TRACKS not found')
    s = s.replace(re, TRACKS_JS)
    const swap = (a, b) => { if (!s.includes(a)) throw new Error('splash.js: not found: ' + a); s = s.replace(a, b) }
    // the label of the thread may be absent (the bar variant has none)
    swap("D.getElementById('now-track').textContent = s.label", "{ const nt = D.getElementById('now-track'); if (nt) nt.textContent = s.label }")
    // «Pause motion» is a discreet icon in the stage's corner (the owner, 2026-11-21: «coloque um icone discreto entao»)
    swap("if (phone) { D.getElementById('hero-ctas').appendChild(mb); mb.classList.add('inline') }", '')
    swap("mb.textContent = paused ? 'Play motion' : 'Pause motion'", "mb.setAttribute('aria-label', paused ? 'Play motion' : 'Pause motion'); mb.title = paused ? 'Play motion' : 'Pause motion'")
    return s
}

// ---------------------------------------------------------------- the slider-menu, one markup, three places
const SLIDER = `<nav class="ms" id="ms" aria-label="Menu: each item takes you to its story on this page">
      ${MENU.map(([id, label]) => `<a class="stop" href="#${id}" data-for="${id}"><span class="lb">${label}</span></a>`).join('\n      ')}
      <a class="flipmark" href="#flip" aria-label="Flip the record" title="Flip the record"><span aria-hidden="true">⟲</span></a>
      <div class="eqbar" id="eqbar" aria-hidden="true"></div>
      <span class="needle" aria-hidden="true"></span>
    </nav>`

const PAUSE = `<button class="motion-icon" id="motion" type="button" aria-pressed="false" aria-label="Pause motion" title="Pause motion" hidden>
          <svg class="i-pause" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>
          <svg class="i-play" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.2-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5z"/></svg>
        </button>`

const accountOut = '<a class="btn btn-ghost btn-sm only-out" href="/start?signin">Sign in</a><a class="btn btn-primary btn-sm only-out" href="/start">Open the app</a>'
const accountIn = `<a class="btn btn-primary btn-sm btn-start only-in" href="/start">Start ${eqi}</a>`

const SHARED_CSS = `
/* ===== F80 · home menu preview (UAT-239, UAT-240): shared ===== */
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
    D.querySelectorAll('.proto button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.state === 'in') === on)))
  }
  setIn(qs.get('in') === '1')
  D.querySelectorAll('.proto button').forEach(b => b.addEventListener('click', () => setIn(b.dataset.state === 'in')))

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

function variantPage(key) {
    const v = { ...VARIANTS[key], key }
    let html = builtPage()
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${v.title}</title>`)
    // the header: the logo, and the account side by state (signed out: Sign in, Open the app; signed in: Start)
    const header = `<div class="proto" role="group" aria-label="Prototype: who is looking">Prototype · <button type="button" data-state="out" aria-pressed="true">Signed out</button><button type="button" data-state="in" aria-pressed="false">Signed in</button><span>— proposal text, not final</span></div>
<header class="top"><div class="wrap">
  <a class="home" href="#a1" aria-label="The Album Blender, top of the page"><img class="logo" alt="The Album Blender" src="%%LOGO%%" width="900" height="149"></a>
  ${key === 'bar' ? v.header.replace('%%SLIDER%%', SLIDER) : `<div class="acct">${v.header}</div>`}
</div></header>

<div class="thread"><div class="wrap">
  ${key === 'bar' ? '' : '<span class="now-track" id="now-track"></span>'}
  <div class="ms-slot" id="slot-thread" style="flex:1;min-width:0">${key === 'bar' ? '' : SLIDER}</div>
</div></div>`
    const logo = html.match(/class="logo" alt="The Album Blender" src="([^"]+)"/)[1]
    html = html.replace(/<header class="top">[\s\S]*?<\/header>\n\n<nav class="thread"[\s\S]*?<\/div><\/nav>/, () => header.replace('%%LOGO%%', logo))
    if (!html.includes('class="proto"')) throw new Error('header not replaced')
    // the story, re-cut around the menu
    html = html.replace(/<section class="hero"[\s\S]*?(\n  <div class="stage-col">)/, (m, tail) => STORY + tail)
    if (!html.includes('id="t-inventory"')) throw new Error('story not replaced')
    // the pause, a discreet icon in the stage's corner
    html = html.replace('<canvas class="embers" id="embers" aria-hidden="true"></canvas>', '<canvas class="embers" id="embers" aria-hidden="true"></canvas>\n        ' + PAUSE)
    // the footer: the menu when signed in
    html = html.replace(/<nav aria-label="Footer">[\s\S]*?<\/nav>/, `<nav aria-label="Footer"><a class="only-out" href="/start">Open the app</a><a class="only-out" href="/start?signin">Sign in</a>${MENU.map(([, l, href]) => `<a class="only-in" href="${href}">${l}</a>`).join('')}</nav>`)
    // CSS and script
    html = html.replace('</style>\n</head>', SHARED_CSS + v.css + '\n</style>\n</head>')
    html = html.replace('<script type="module" src="/splash/main.js"></script>',
        `<script type="module">\n${bundle(patchSplash)}\n${SLIDER_JS(v)}\nstartSplash(window)\n</script>`)
    return prodLinks(html)
}

const out = (rel, html) => { fs.writeFileSync(path.join(REPO, rel), html); console.log(rel, Math.round(Buffer.byteLength(html) / 1024) + ' KB') }
out('design/proposals/f80-splash/home-menu/today.html', today())
out('design/inception/splash-menu-stops-v1.html', variantPage('stops'))
out('design/inception/splash-menu-bar-v1.html', variantPage('bar'))
out('design/inception/splash-menu-deck-v1.html', variantPage('deck'))
