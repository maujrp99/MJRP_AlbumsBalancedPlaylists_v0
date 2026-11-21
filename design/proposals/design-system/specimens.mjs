/**
 * F86 — the live pieces of the design-system page, drawn by the site's own code where it can be called.
 *
 * Each family of docs/specs/design-system.md § Componentes has one entry here, by its `Família` name: what
 * the page puts in the computer frame and in the phone frame (390 px). Where the site has a function that
 * draws the piece (the tab bar, the dock of the series, the phone tile, the sheet, the toast, the
 * equalizer), it is called through jsdom and its HTML is taken as it is; where the site writes the piece
 * inline in a view, the markup below copies that view's classes (the file is named in the document).
 * Covers: fictional art in the site's colours (no real cover leaves the site).
 *
 * Read by build-design-system.mjs; never published alone.
 */
import { JSDOM } from 'jsdom'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'

/** Fictional covers: square art in the fire and the night of the site, never a real record. */
const COVER_ART = [
  ['#f97316', '#dc2626', 'ring'], ['#1c1c22', '#f97316', 'band'], ['#fbbf24', '#dc2626', 'fan'],
  ['#2a2a30', '#dc2626', 'ring'], ['#dc2626', '#101014', 'band'], ['#f97316', '#2a2a30', 'fan'], ['#4b5563', '#f97316', 'ring']
]
export function fictionalCover(i) {
  const [a, b, kind] = COVER_ART[i % COVER_ART.length]
  const shape = kind === 'ring'
    ? `<circle cx="48" cy="48" r="26" fill="none" stroke="${b}" stroke-width="10"/><circle cx="48" cy="48" r="6" fill="${b}"/>`
    : kind === 'band'
      ? `<rect y="38" width="96" height="20" fill="${b}"/><rect y="64" width="96" height="6" fill="${b}" opacity=".6"/>`
      : `<path d="M48 96 L0 30 A70 70 0 0 1 96 30 Z" fill="${b}" opacity=".85"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${a}"/>${shape}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

let ready = null
/** jsdom as the window the site's code expects; the site's modules imported once. */
async function site(root) {
  if (ready) return ready
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true })
  for (const key of Object.getOwnPropertyNames(dom.window)) {
    if (!(key in globalThis)) { try { globalThis[key] = dom.window[key] } catch { /* read-only global */ } }
  }
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  dom.window.matchMedia = dom.window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
  globalThis.matchMedia = dom.window.matchMedia
  // the site's alias of vite.config.js: `@shared/…` is the folder `shared/`
  registerHooks({ resolve: (spec, ctx, next) => next(spec.startsWith('@shared/') ? pathToFileURL(path.join(root, 'shared', spec.slice(8))).href : spec, ctx) })
  const load = (p) => import(pathToFileURL(path.join(root, p)).href)
  ready = {
    document: dom.window.document,
    tabs: await load('public/js/components/navigation/phoneTabs.js'),
    icons: await load('public/js/components/Icons.js'),
    dock: await load('public/js/components/home/HomeDock.js'),
    eq: await load('public/js/components/home/HomeEqualizer.js'),
    tile: await load('public/js/components/ui/AlbumPhoneCard.js'),
    sheet: await load('public/js/components/ui/Sheet.js'),
    toast: await load('public/js/components/Toast.js'),
    trackRow: await load('public/js/components/ui/TrackRow.js'),
    albumCard: await load('public/js/components/ui/AlbumCardRenderer.js'),
    empty: await load('public/js/components/series/SeriesEmptyState.js'),
    paste: await load('public/js/components/home/HomePasteList.js'),
    seriesGrid: await load('public/js/components/series/SeriesGridRenderer.js')
  }
  return ready
}

/** The HTML of an element as the browser would keep it: a field's value written as its attribute; stand-in covers turned fictional. */
function html(el) {
  el.querySelectorAll('input').forEach((input) => { if (input.value) input.setAttribute('value', input.value) })
  let n = 0
  el.querySelectorAll('img[data-cover]').forEach((img) => { img.setAttribute('src', fictionalCover(n++)) })
  return el.outerHTML
}

const ALBUMS = [
  { id: 'a1', title: 'Night Engine', artist: 'The Ember Choir', year: 1977, tracks: [] },
  { id: 'a2', title: 'Slow Burn Avenue', artist: 'The Ember Choir', year: 1971, tracks: [] },
  { id: 'a3', title: 'Coal & Copper', artist: 'The Ember Choir', year: 1975, tracks: [] },
  { id: 'a4', title: 'Afterglow', artist: 'The Ember Choir', year: 1979, tracks: [] }
]
const DOCK = (albums, extra = {}) => ({
  albums, name: 'The Ember Choir selection', nameState: 'suggested', suggestion: 'The Ember Choir selection', create: 'idle', created: null,
  failure: '', open: false, moved: null, undo: null, guest: false, flame: 'create', coversOnScreen: true, ...extra
})

function dockHTML(s, phone, model) {
  const host = s.document.createElement('div')
  s.document.body.appendChild(host)
  const dock = new s.dock.HomeDock({ on: {}, phone: () => phone })
  dock.mount(host)
  dock.draw(model)
  const out = html(host.firstElementChild)
  dock.unmount()
  host.remove()
  return out
}

function eqHTML(s, bars, state, extra = '') {
  const el = s.eq.createEqualizer(bars, extra)
  s.eq.setEqualizerState(el, state)
  return html(el)
}

function sheetHTML(s) {
  const body = s.document.createElement('div')
  body.innerHTML = '<p style="margin:0 0 12px">Delete «Night Engine» from your series?</p>'
  const footer = s.document.createElement('div')
  footer.innerHTML = '<button type="button" class="btn btn-secondary">Cancel</button><button type="button" class="btn btn-danger">Delete</button>'
  const sheet = s.sheet.openSheet({ variant: 'bottom', title: 'Delete album', content: body, footer })
  const out = html(sheet.element)
  sheet.element.remove()
  return out
}

function toastHTML(s) {
  // as the site shows them once its own animation has run in (Toast.js: the classes it swaps in requestAnimationFrame)
  const toasts = [['Series saved', 'success'], ['The catalog did not answer', 'error'], ['Cache cleared', 'info']]
    .map(([text, kind]) => s.toast.showToast(text, kind, 1e9))
  toasts.forEach((t) => { clearTimeout(t._timeoutId); t.classList.remove('translate-x-full', 'opacity-0'); t.classList.add('translate-x-0', 'opacity-100') })
  const container = s.document.getElementById('toast-container')
  const out = html(container)
  container.remove()
  return out
}

const icon = (s, name, cls) => s.icons.getIcon(name, cls)
const phoneShell = (s, title, inner, tab = '/home') => `
<div class="phone-topbar"><img class="phone-topbar__logo" src="{{LOGO}}" alt=""><span class="phone-topbar__title">${title}</span><button type="button" class="phone-topbar__menu" aria-label="Menu and account">${icon(s, 'Menu', 'phone-topbar__menu-icon')}</button></div>
<div id="app" style="padding-top:64px">${inner}</div>
<div class="phone-tabbar">${s.tabs.renderTabBar(tab)}</div>`

/**
 * The families, by the name in design-system.md § Componentes.
 * Each: { css: 'app' | 'splash', desktop?: html, phone?: html, dh?: height of the computer frame, ph?: of the phone frame }.
 */
export async function specimens(root) {
  const s = await site(root)
  const cards = ALBUMS.map((a, i) => `
    <button type="button" class="home-card${i === 1 ? ' is-in' : ''}" aria-pressed="${i === 1}">
      <span class="home-card__cover"><img class="home-card__img" alt="" src="${fictionalCover(i)}"><span class="home-card__mark">${i === 1 ? '1' : icon(s, 'Plus', 'home-card__plus')}</span></span>
      <span class="home-card__title">${a.title}</span> <span class="home-card__year">${a.year}</span>
    </button>`).join('')
  const tiles = ALBUMS.slice(0, 2).map((a) => s.tile.renderPhoneTile(a)).join('')
  const fixCovers = (str) => { let n = 0; return str.replace(/(<img[^>]*data-cover[^>]*src=")[^"]*"/g, (_, a) => `${a}${fictionalCover(n++)}"`) }

  const buttons = `
    <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding:28px">
      <button type="button" class="home-btn is-flame is-big">Create series ${icon(s, 'ArrowRight', 'home-ico home-ico--arrow')}</button>
      <button type="button" class="home-btn">Edit order</button>
      <button type="button" class="home-btn is-ghost">Start over</button>
      <button type="button" class="btn btn-primary">Generate playlists</button>
      <button type="button" class="btn btn-secondary">Cancel</button>
      <button type="button" class="btn btn-danger">Delete</button>
    </div>`
  const fields = `
    <div style="padding:28px;display:grid;gap:20px">
      <label class="home-field"><span class="home-field__ico">${icon(s, 'Search', 'home-field__ico')}</span><input type="text" placeholder="An artist, or paste a list" aria-label="Find albums"><button type="button" class="home-btn is-flame">Search</button></label>
      <input class="form-control" type="text" value="Road trip mix" aria-label="Playlist name" style="max-width:420px">
      <div class="phone-segmented" role="group" aria-label="View"><button type="button" class="phone-segmented__option is-on" aria-pressed="true">Grid</button><button type="button" class="phone-segmented__option" aria-pressed="false">List</button></div>
    </div>`
  const chips = `
    <div style="padding:28px;display:grid;gap:18px">
      <div class="home-chips" style="margin:0"><button type="button" class="home-chip is-on">Studio · 14</button><button type="button" class="home-chip">Live · 3</button><button type="button" class="home-chip">Compilations · 5</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="badge badge-success">Ranked</span><span class="badge badge-warning">No ranking</span></div>
    </div>`

  const bars = ['.55', '1', '.7', '.4', '.8'].map((h) => `<i style="--h:${Number(h) * 100}%"></i>`).join('')
  const para = 'Gather albums into series, rank every track, and blend them into playlists that keep every record in the mix.'
  const ranked = fs.readFileSync(path.join(root, 'public/splash.html'), 'utf8').match(/<div class="ranked"[\s\S]*?<p class="note">[\s\S]*?<\/p>\s*<\/div>/)[0]
  /**
   * The three questions of § Pendentes, by the `Mostra` key. Each option is the SAME piece, changed only
   * where the question is (critique of 2026-11-21, findings 1 and 2); `rec` is the agent's recommendation,
   * shown without opening anything (finding 3): what he gains and what he pays.
   */
  const eqSame = (grad) => `<div class="home-page" style="padding:40px 20px"><div class="home-stage" style="padding:0">${eqHTML(s, 24, 'still').replace('class="home-eq is-still"', `class="home-eq is-still" style="opacity:1;height:84px;--home-eq-grad:${grad}"`)}</div></div>`
  const variants = {
    'texto-no-fogo': {
      rec: 'Recomendo B, texto preto nos dois: passa como texto grande nas duas pontas do fogo (7,0:1 e 4,1:1); o branco não passa na ponta laranja (2,8:1). Custa mudar o botão do app.',
      options: [
        { css: 'app', w: 420, h: 170, label: 'A · branco, como no app', html: '<div style="padding:56px 20px;text-align:center"><button type="button" class="home-btn is-flame is-big">Create series</button></div>' },
        { css: 'splash', w: 420, h: 170, label: 'B · preto, como na página de entrada', html: '<div style="padding:60px 20px;background:#000;text-align:center"><a class="btn btn-primary" href="#">Open the app <span class="eqi" aria-hidden="true"><i></i><i></i><i></i><i></i></span></a></div>' }
      ]
    },
    'ponta-amarela': {
      rec: 'Recomendo A, duas cores nas duas telas: fica só com cores já declaradas. Custa tirar o amarelo da página de entrada.',
      options: [
        { css: 'app', w: 420, h: 170, label: 'A · duas cores, como na Home', html: eqSame('linear-gradient(to top, #dc2626, #f97316)') },
        { css: 'app', w: 420, h: 170, label: 'B · com a ponta amarela, como na página de entrada', html: eqSame('linear-gradient(to top, #dc2626, #f97316, #fbbf24)') }
      ]
    },
    'fonte-do-corpo': {
      rec: 'Recomendo B, a fonte do sistema no texto corrido: lê melhor a 14–16 px. Custa a Syne sair do corpo no computador.',
      inline: [
        { label: 'A · Syne, como o app no computador', font: "'Syne', sans-serif" },
        { label: 'B · texto do sistema, como a página de entrada e o celular', font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }
      ],
      para
    }
  }

  // ── pieces the document's component table does not list (shown live, flagged as a finding) ──
  const failNotice = (() => {
    const host = s.document.createElement('div')
    const g = new s.seriesGrid.default({ container: host, props: { seriesStates: { s1: { status: 'done', failed: 2, found: 5 } } } })
    return g._renderFailureNotice({ id: 's1' })
  })()
  // the markup HomeView.drawMessage() builds (SafeDOM, not callable without the view): same classes, same words
  const homeMsg = (kind) => kind === 'failed'
    ? '<div class="home-msg is-error" role="alert"><strong>The catalog did not answer.</strong><span>Nothing was changed. Try again in a moment.</span><button type="button" class="home-btn">Try again</button></div>'
    : '<div class="home-msg" role="status"><strong>No albums found for «Ember Choir».</strong><span>Check the spelling, or paste the albums as a list: one per line, Artist - Album.</span><button type="button" class="home-btn">Paste a list</button></div>'
  const emptySeries = html(new s.empty.SeriesEmptyState().render())
  const trackRows = [
    { id: 't1', title: 'Low Sun Overture', duration: 312, rank: 1, rating: 92, spotifyRank: 2, spotifyPopularity: 64 },
    { id: 't2', title: 'Pier at Dusk', duration: 254, rank: 2, rating: 88, spotifyRank: 1, spotifyPopularity: 71 },
    { id: 't3', title: 'Second Side Waltz', duration: 287, rank: 3, rating: 81, spotifyRank: 4, spotifyPopularity: 40 }
  ].map((track, i) => html(s.trackRow.TrackRow.render({ track, index: i + 1, variant: 'ranking' }))).join('')
  const albumCards = ALBUMS.slice(0, 4).map((a, i) => s.albumCard.AlbumCardRenderer.renderCompact({ ...a, coverUrl: fictionalCover(i) })).join('')
  const dockFailed = dockHTML(s, false, DOCK(ALBUMS.slice(0, 3), { create: 'failed', failure: 'Not saved: the connection dropped.' }))
  const pasted = (() => {
    const list = new s.paste.HomePasteList({ onAdd() {} })
    const el = list.render()
    list.setText('Pink Floyd - Animals\nYes\nJoni Mitchell - Blue')
    return html(el)
  })()
  const extras = [
    { name: 'Avisos com «Try again»', file: '`HomeView.js`, `HomeDock.js`, `SeriesGridRenderer.js`', line: 'A falha diz o que houve e oferece «Try again» ali mesmo.',
      spec: { css: 'app', desktop: `<div class="home-page" style="padding:8px 28px 28px">${homeMsg('failed')}<div style="margin-top:22px">${failNotice}</div></div><div class="home-dockwrap" style="bottom:12px">${dockFailed}</div>`, dh: 500 } },
    { name: 'Estados vazios', file: '`HomeView.js`, `SeriesEmptyState.js`', line: 'O vazio diz por quê e qual é o próximo passo.',
      spec: { css: 'app', desktop: `<div class="home-page" style="padding:8px 28px 28px;display:grid;gap:22px">${homeMsg('empty')}${emptySeries}</div>`, phone: `<div class="home-page" style="padding:8px 16px">${homeMsg('empty')}</div>`, dh: 720, ph: 300 } },
    { name: 'Álbum no computador', file: '`AlbumCardRenderer.js`', line: 'O cartão de álbum das telas de séries e de álbuns.',
      spec: { css: 'app', desktop: `<div style="padding:28px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px">${albumCards}</div>`, dh: 360 } },
    { name: 'Faixas', file: '`TrackRow.js`', line: 'A linha de faixa do ranking e das playlists.',
      spec: { css: 'app', desktop: `<div style="padding:20px 28px;max-width:560px">${trackRows}</div>`, phone: `<div style="padding:16px">${trackRows}</div>`, dh: 300, ph: 340 } }
  ]

  /** Samples of the pending lines (by the `Padrão` cell) that the site's own code draws. */
  const pendingSamples = {
    'A lista colada, editável': { css: 'app', w: 760, h: 250, html: `<div class="home-page" style="padding:20px 28px">${pasted}</div>` },
    'O fechar da folha da série': { css: 'app', w: 390, h: 300, html: (() => { const body = s.document.createElement('div'); body.innerHTML = '<p style="margin:0">3 albums, in this order.</p>'; const sh = s.sheet.openSheet({ variant: 'full', title: 'Your series', content: body }); const out = html(sh.element); sh.element.remove(); return out })() },
    'Os números na fonte de texto': { css: 'app', w: 760, h: 140, html: `<div class="home-dockwrap" style="bottom:12px">${dockHTML(s, false, DOCK(ALBUMS.slice(0, 4)))}</div>` },
    'Exemplo ilustrativo': { css: 'splash', w: 600, h: 300, html: `<div style="padding:20px 28px">${ranked}</div>` },
    'Pausar o movimento': { css: 'splash', w: 420, h: 110, html: '<div style="padding:30px 28px;position:relative;height:110px"><button class="motion-toggle" type="button" aria-pressed="false" style="position:static">Pause motion</button></div>' }
  }
  return {
    variants,
    extras,
    pendingSamples,
    'Botões': { css: 'app', desktop: buttons, phone: buttons, dh: 210, ph: 300 },
    'Campos': { css: 'app', desktop: fields, phone: fields, dh: 260, ph: 300 },
    'Fichas': { css: 'app', desktop: chips, phone: chips, dh: 150, ph: 200 },
    'Cartões': {
      css: 'app',
      desktop: `<div style="padding:28px"><div class="home-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">${cards}</div></div>`,
      phone: phoneShell(s, 'Albums', `<div class="albums-grid-phone" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px">${fixCovers(tiles)}</div>`, '/albums'),
      dh: 330, ph: 470
    },
    'Base da série': {
      css: 'app',
      desktop: dockHTML(s, false, DOCK(ALBUMS.slice(0, 3))),
      phone: phoneShell(s, 'Home', '<div style="height:40px"></div>', '/home') + dockHTML(s, true, DOCK(ALBUMS.slice(0, 3))),
      dh: 150, ph: 300
    },
    'Barras do celular': {
      css: 'app',
      phone: phoneShell(s, 'Albums', `<div style="padding:16px;color:rgba(255,255,255,.6);font-size:14px">&nbsp;</div><button type="button" class="phone-to-top" aria-label="Back to top" style="bottom:136px">${icon(s, 'ArrowUp', 'phone-to-top__icon')}</button><div class="phone-action-bar"><span class="phone-action-bar__note">3 albums chosen</span><button type="button" class="btn btn-primary">Blend</button></div>`, '/albums'),
      ph: 330
    },
    'Folhas': { css: 'app', phone: phoneShell(s, 'Albums', '', '/albums') + sheetHTML(s), ph: 380 },
    'Avisos': {
      css: 'app',
      desktop: `<div style="height:250px"></div>${toastHTML(s)}<div class="home-dockwrap" style="bottom:18px">${html(s.dock.undoStrip({ kind: 'remove', album: { title: 'Afterglow' } }))}</div>`,
      phone: phoneShell(s, 'Home', '', '/home') + toastHTML(s),
      dh: 270, ph: 420
    },
    'Fogo e equalizador': {
      css: 'app',
      desktop: `<div class="home-page" style="padding:8px 28px 24px"><div class="home-stage is-small" style="padding:0">
        ${eqHTML(s, 48, 'still')}${eqHTML(s, 48, 'live')}${eqHTML(s, 48, 'flat')}</div>
        <div style="display:flex;gap:18px;align-items:center;justify-content:center;margin-top:26px"><span class="home-busy">${eqHTML(s, 5, 'live', 'home-eq--mini')} Saving your series…</span><span class="phone-avatar" style="display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#f97316 0%,#dc2626 100%);font-weight:800">M</span></div>
      </div>`,
      phone: `<div class="home-page" style="padding:8px 16px 16px"><div class="home-stage" style="padding:0">${eqHTML(s, 32, 'still')}${eqHTML(s, 32, 'live')}${eqHTML(s, 32, 'flat')}</div></div>`,
      dh: 230, ph: 230
    },
    'Página de entrada': {
      css: 'splash',
      desktop: `{{SPLASH}}`,
      phone: `{{SPLASH}}`,
      dh: 470, ph: 620
    }
  }
}
