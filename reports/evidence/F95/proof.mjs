// F95 / F82 TASK-04 - the crate of the entry page managed in the Painel: the browser proof, on the BUILT site served by `vite preview`.
//
//   SITE=http://127.0.0.1:<port> SOURCE=<repo> OUT=<this folder> DIST=<the built site> node proof.mjs
//     the site is built publication-shaped, with the real covers (scripts/publication-budget.mjs --out <dist>)
//
// What runs, in Chromium AND WebKit, at 1280x800 (computer) and 390x844 (phone):
//   the entry page   with nothing published, with a published crate, with a hostile published crate, with the read failing and with
//                    the read slow; without script; in English; what is asked of the network and when
//   the Painel       the «Caixa» section as the administrator: the fixed set, reorder by the keyboard, to the other side, remove, the limits,
//                    the search (a word, a link, each failure), add, save, the conflict, the refusal of today's database rules; and the
//                    entry page showing what the Painel saved; a visitor sees «Page not found»
//   NOT here: the Painel in Portuguese. The built app has no way to be put in Portuguese yet (nothing calls setLocale: F81); the section's
//   Portuguese is proven by its component test (test/screens/admin/CratePanel.test.tsx).
//
// SAFETY. Every context ABORTS at the network layer: music.apple.com, itunes.apple.com, geo.music.apple.com, api.music.apple.com,
// open.spotify.com, accounts.spotify.com, every scheme that is not http(s)/data/blob/about (music://, itms://, spotify:), and every host
// that is not this machine's preview or a static host the pages themselves name (Apple's image server for the covers, Google Fonts).
// Production Firebase is never reached: firestore.googleapis.com, identitytoolkit and securetoken are ANSWERED HERE by stand-ins, and the
// server's search route (/api/admin/apple-albums) is answered here from fixtures - the real Apple API is never called. NO LINK THAT LEAVES
// THE SITE IS EVER CLICKED OR OPENED: «Ouça no Apple Music» is judged by its href, target and rel. No app of this Mac is opened or
// controlled. The administrator is a stand-in record in the page's own storage: no password is typed, no real account is used.
import { chromium, webkit } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { firestoreStub } from './firestoreStub.mjs'

const { SITE, SOURCE, OUT, DIST } = process.env
fs.mkdirSync(OUT, { recursive: true })
const ENGINES = { chromium, webkit }
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null
const NEVER = ['music.apple.com', 'itunes.apple.com', 'geo.music.apple.com', 'api.music.apple.com', 'open.spotify.com', 'accounts.spotify.com']
const STATIC = new Set(['is1-ssl.mzstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'])
const OK_SCHEMES = new Set(['http:', 'https:', 'data:', 'blob:', 'about:'])
const site = new URL(SITE)

const results = []
const say = (name, ok, detail = '') => { results.push({ name, ok: Boolean(ok), detail: String(detail) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + String(detail).slice(0, 400) : ''}`) }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// ---------------------------------------------------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------------------------------------------------
/** The fixed set, read from the built entry page itself (the sleeves the build wrote). */
const builtPage = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const FIXED = [...builtPage.matchAll(/<img\s+class="sl s\d+"[^>]*>/g)].map((tag) => {
  const attr = (name) => (new RegExp(`${name}="([^"]*)"`).exec(tag[0]) ?? [])[1]?.replace(/&amp;/g, '&') ?? ''
  return { id: attr('data-k'), title: attr('data-t'), artist: attr('data-a'), year: Number(attr('data-y')), art: attr('src').replace(/^.*\/image\/thumb\//, '').replace(/\/[^/]+$/, ''), href: attr('data-href') }
})
const FIXED_IDS = FIXED.map((album) => album.id)
/** A published crate: 7 on side A and 5 on side B, other albums in front than the fixed set has (their covers are real, so they load). */
const PUBLISHED = { sideA: [FIXED[5], FIXED[3], FIXED[0], FIXED[1], FIXED[2], FIXED[4], FIXED[6]], sideB: [FIXED[10], FIXED[14], FIXED[13], FIXED[12], FIXED[11]] }
const flat = (crate) => [...crate.sideA, ...[...crate.sideB].reverse()]
const crateDoc = (crate, rev = 1) => ({ _schemaVersion: 1, rev, sideA: crate.sideA, sideB: crate.sideB, previous: { sideA: null, sideB: null } })
/** Hostile values in what is published: markup in a title and in an artist, a cover from another server, a link that runs code. */
const HOSTILE = {
  sideA: [
    { ...FIXED[0], id: 'h-markup', title: '<img src=x onerror="window.__pwned=1">' }, { ...FIXED[1], id: 'h-cover', art: 'https://evil.example/cover.jpg' },
    { ...FIXED[2], id: 'h-link', href: 'javascript:window.__pwned=2' }, { ...FIXED[3], id: 'h-artist', artist: '<script>window.__pwned=3</script>' },
    FIXED[4], FIXED[5], FIXED[6], FIXED[7], FIXED[8], FIXED[9],
  ],
  sideB: [FIXED[14], FIXED[13], FIXED[12], FIXED[11], FIXED[10]],
}
const HOSTILE_GOOD = [FIXED[4], FIXED[5], FIXED[6], FIXED[7], FIXED[8], FIXED[9], FIXED[10], FIXED[11], FIXED[12], FIXED[13], FIXED[14]].map((album) => album.id)
/** What the server's search answers, as its route does: albums ready for the crate. */
const FOUND = [
  { id: '1440851613', title: 'Rumours', artist: 'Fleetwood Mac', year: 1977, art: FIXED[7].art, href: 'https://music.apple.com/us/album/rumours/1440851613' },
  { id: '1065973699', title: 'Blue', artist: 'Joni Mitchell', year: 1971, art: FIXED[8].art, href: 'https://music.apple.com/us/album/blue/1065973699' },
]
const LINKED = [{ id: '1015739190', title: 'Harvest Moon', artist: 'Neil Young', year: 1992, art: FIXED[9].art, href: 'https://music.apple.com/us/album/harvest-moon/1015739190' }]
const SEARCH_FAILURES = [
  [503, 'search-not-configured', /no working Apple Music key/], [503, 'service-unavailable', /Apple Music did not answer/], [429, 'too-many-requests', /too many searches/],
  [400, 'not-an-album-link', /not an album of Apple Music/], [401, 'session-expired', /session is over/], [403, 'not-an-administrator', /not an administrator/], [400, 'invalid-request', /did not accept this search/],
]

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const now = Math.floor(Date.now() / 1000)
const tokenOf = (uid, provider) => `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({ iss: 'https://securetoken.google.com/x', aud: 'x', auth_time: now, user_id: uid, sub: uid, iat: now, exp: now + 86400, firebase: { sign_in_provider: provider } })}.sig`
const ID_TOKEN = tokenOf('preview-uid', 'password')
const ANON_TOKEN = tokenOf('guest-uid', 'anonymous')

const assets = fs.readdirSync(path.join(DIST, 'assets'))
const adminFiles = assets.filter((name) => /\.(js|css)$/.test(name) && /cms-rail|ak-rt-bar/.test(fs.readFileSync(path.join(DIST, 'assets', name), 'utf8')))

// ---------------------------------------------------------------------------------------------------------------------------------
// One browser context, with the network held
// ---------------------------------------------------------------------------------------------------------------------------------
/**
 * @param {object} options
 *   documents   what the stand-in database holds at the start (short path -> data)
 *   database    'answers' | 'fails' (the request is aborted) | a number (milliseconds each answer takes)
 *   account     the stand-in administrator account is signed in
 *   script      false: the page runs with no script
 */
async function open(engine, viewport, { documents = {}, database = 'answers', account = false, script = true, lang = null } = {}) {
  const browser = await ENGINES[engine].launch()
  const ctx = await browser.newContext({ viewport, javaScriptEnabled: script, reducedMotion: 'reduce', deviceScaleFactor: 1 })
  const stub = firestoreStub(documents)
  const net = { requests: [], aborted: [], firstDatabaseRead: null, three: null }
  const state = { search: null, searches: [], dialog: 'dismiss', dialogs: [] }
  const errors = []
  await ctx.addInitScript(() => { window.MusicKit = { configure: async () => {}, getInstance: () => ({ isAuthorized: false, api: { music: async () => ({ data: { data: [] } }) } }) } })
  if (lang) await ctx.addInitScript((value) => { try { localStorage.setItem('albumblender:lang', value) } catch { /* Portuguese */ } }, lang)
  await ctx.route('**/*', async (route) => {
    const request = route.request()
    const url = request.url()
    const u = new URL(url)
    net.requests.push({ url, at: Date.now(), method: request.method() })
    if (!OK_SCHEMES.has(u.protocol) || NEVER.includes(u.hostname)) { net.aborted.push(u.hostname || u.protocol); return route.abort('blockedbyclient') }
    if (u.origin === site.origin) {
      if (u.pathname === '/api/admin/apple-albums') {
        const body = JSON.parse(request.postData() ?? '{}')
        state.searches.push({ query: body.query, authorized: /^Bearer \S+/.test(request.headers().authorization ?? '') })
        if (state.search) return route.fulfill({ status: state.search[0], contentType: 'application/json', body: JSON.stringify({ error: { code: 'x', retryable: false, reason: state.search[1] } }) })
        const albums = /^https:/.test(body.query) ? LINKED : /zzzz/.test(body.query) ? [] : FOUND
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { albums }, outcome: albums.length ? 'found' : 'not_found' }) })
      }
      if (u.pathname.startsWith('/api/')) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"fixture"}' })
      // the build made for the budget does not carry public/assets/data (the publication copies it): it comes from the source
      if (u.pathname.startsWith('/assets/data/')) return route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync(path.join(SOURCE, 'public', u.pathname)) })
      return route.continue()
    }
    if (u.hostname === 'firestore.googleapis.com') {
      if (net.firstDatabaseRead === null) net.firstDatabaseRead = Date.now()
      if (database === 'fails') return route.abort('failed')
      if (typeof database === 'number') await new Promise((resolve) => setTimeout(resolve, database))
      return stub.handle(route).catch(() => {})
    }
    if (u.hostname === 'identitytoolkit.googleapis.com' && url.includes('accounts:signUp')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ idToken: ANON_TOKEN, refreshToken: 'fixture', expiresIn: '3600', localId: 'guest-uid' }) })
    if (u.hostname === 'identitytoolkit.googleapis.com' && url.includes('accounts:lookup')) {
      const user = account
        ? { localId: 'preview-uid', email: 'preview@example.invalid', displayName: 'Admin', emailVerified: true, providerUserInfo: [{ providerId: 'password', federatedId: 'preview@example.invalid', email: 'preview@example.invalid' }] }
        : { localId: 'guest-uid' }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: [{ ...user, lastLoginAt: String(Date.now()), createdAt: String(Date.now()) }] }) })
    }
    if (u.hostname === 'securetoken.googleapis.com') {
      const token = account ? ID_TOKEN : ANON_TOKEN
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: token, id_token: token, expires_in: '3600', token_type: 'Bearer', refresh_token: 'fixture', user_id: account ? 'preview-uid' : 'guest-uid', project_id: 'x' }) })
    }
    if (u.hostname === 'cdn.jsdelivr.net' && net.three === null) net.three = Date.now()
    if (STATIC.has(u.hostname)) return route.continue()
    net.aborted.push(u.hostname)
    return route.abort('blockedbyclient')
  })
  const page = await ctx.newPage()
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push('pageerror: ' + error.message))
  page.on('dialog', (dialog) => { state.dialogs.push(dialog.message()); return state.dialog === 'accept' ? dialog.accept() : dialog.dismiss() })
  if (account) {
    // the app signs a guest in by itself: let that end, then write the stand-in account where Firebase keeps a sign-in
    const guest = page.waitForResponse((response) => response.url().includes('accounts:signUp'), { timeout: 8000 }).catch(() => {})
    await page.goto(SITE + '/start', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__firebase_config)
    await guest
    await page.waitForTimeout(500)
    await page.evaluate(async () => {
      const apiKey = window.__firebase_config.apiKey
      const exp = Date.now() + 36e5 * 24 * 30
      const user = {
        uid: 'preview-uid', email: 'preview@example.invalid', emailVerified: true, displayName: 'Admin', isAnonymous: false, photoURL: null,
        providerData: [{ providerId: 'password', uid: 'preview@example.invalid', displayName: 'Admin', email: 'preview@example.invalid', phoneNumber: null, photoURL: null }],
        stsTokenManager: { refreshToken: 'fixture', accessToken: 'fixture', expirationTime: exp }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]',
      }
      const db = await new Promise((res, rej) => { const q = indexedDB.open('firebaseLocalStorageDb', 1); q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('firebaseLocalStorage')) q.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }) }; q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) })
      await new Promise((res, rej) => { const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: 'firebase:authUser:' + apiKey + ':[DEFAULT]', value: user }); tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
      db.close()
    })
  }
  return { browser, ctx, page, stub, net, state, errors }
}

/** The console errors that are not the blocked outside hosts themselves (the proof aborts them on purpose). */
const real = (errors) => errors.filter((text) => !/ERR_BLOCKED_BY_CLIENT|Failed to load resource|ERR_FAILED|net::ERR|due to access control checks|blockedbyclient|cdn\.jsdelivr\.net/i.test(text))
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
const view = (page, name) => page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 70 })
const shot = (page, selector, name) => page.locator(selector).first().screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 75 })

// ---------------------------------------------------------------------------------------------------------------------------------
// The entry page
// ---------------------------------------------------------------------------------------------------------------------------------
/** Everything read from the entry page in one go (no clicks). */
const readEntry = () => {
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + window.scrollY), Math.round(r.width), Math.round(r.height)] }
  const shown = (el) => Boolean(el) && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0
  const sleeves = [...document.querySelectorAll('#box .sl')]
  const shelf = [...document.querySelectorAll('#shelf .shelf .al')]
  const am = document.getElementById('am')
  const tag = document.querySelector('.crate-tag')
  return {
    sleeves: sleeves.map((img) => img.dataset.k),
    front: sleeves.filter((img) => img.classList.contains('vis')).map((img) => img.dataset.k),
    covers: [...document.images].map((img) => img.getAttribute('src')).filter((src) => /^https?:/.test(src)),
    coversLoaded: sleeves.filter((img) => img.complete && img.naturalWidth > 0).length,
    who: document.getElementById('who')?.innerText.replace(/\s+/g, ' ').trim(),
    caption: { title: document.querySelector('#who b')?.textContent, line: document.getElementById('who')?.lastChild?.textContent },
    listen: am ? { href: am.getAttribute('href'), target: am.target, rel: am.rel, name: am.getAttribute('aria-label') || am.innerText.replace(/\s+/g, ' ').trim() } : null,
    shelf: shelf.map((li) => ({ title: li.querySelector('b')?.textContent, href: li.querySelector('a.am')?.getAttribute('href'), target: li.querySelector('a.am')?.target, rel: li.querySelector('a.am')?.rel, name: li.querySelector('a.am')?.textContent.replace(/\s+/g, ' ').trim() })),
    shelfShown: shown(document.getElementById('crate-shelf')),
    shelfTitle: document.getElementById('t-shelf')?.textContent,
    tag: tag ? { text: tag.innerText.trim(), shown: shown(tag), box: box(tag), font: getComputedStyle(tag).fontFamily.split(',')[0], size: getComputedStyle(tag).fontSize, weight: getComputedStyle(tag).fontWeight, upper: getComputedStyle(tag).textTransform } : null,
    fictionalTag: Boolean(document.querySelector('[data-i18n="tag.fict"]')),
    layout: { height: document.documentElement.scrollHeight, stage: box(document.getElementById('stage')), scene: box(document.getElementById('scene')), caption: box(document.getElementById('caption')), shelf: box(document.getElementById('crate-shelf')), end: box(document.getElementById('end')), footer: box(document.querySelector('footer')) },
    injected: { pwned: window.__pwned ?? null, scripts: document.querySelectorAll('main script, footer script').length, handlers: document.querySelectorAll('[onerror],[onload],[onclick]').length },
    lang: document.documentElement.lang,
    scrollWidth: document.documentElement.scrollWidth, width: window.innerWidth,
  }
}

/** Layout shifts the browser recorded since the page started (Chromium only; WebKit has no such entry). */
const watchShifts = () => {
  window.__shifts = []
  window.__swapAt = null
  document.addEventListener('cratechange', () => { window.__swapAt = performance.now() })
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__shifts.push({ at: Math.round(entry.startTime), value: Math.round(entry.value * 10000) / 10000, nodes: (entry.sources ?? []).map((source) => source.node?.id || source.node?.className || source.node?.nodeName || '?') })
    }).observe({ type: 'layout-shift', buffered: true })
  } catch { window.__shifts = null }
}

async function openEntry(engine, viewport, options) {
  const run = await open(engine, viewport, options)
  if (options.script !== false) await run.ctx.addInitScript(watchShifts)
  const started = Date.now()
  await run.page.goto(SITE + '/', { waitUntil: 'load' })
  run.loadAt = Date.now()
  run.started = started
  if (options.script !== false) {
    await run.page.waitForFunction(() => document.documentElement.classList.contains('js'))
    run.published = await run.page.evaluate(() => Promise.race([window.__splash.published, new Promise((resolve) => setTimeout(() => resolve('still-reading'), 9000))]))
    await run.page.waitForTimeout(700)
  } else await run.page.waitForTimeout(500)
  return run
}

async function entryPage(engine, width, height) {
  const tag = `entry ${engine} ${width}`
  const file = `entry-${engine}-${width}`
  const viewport = { width, height }
  const phone = width < 900

  // 1. nothing published
  {
    const run = await openEntry(engine, viewport, {})
    const page = await run.page.evaluate(readEntry)
    say(`${tag} nothing published: the page says so to itself («none») and keeps the fixed set, whole`, run.published === 'none' && same(page.sleeves, FIXED_IDS), `${run.published} · ${page.sleeves.length} sleeves`)
    say(`${tag} nothing published: the caption is the front album and its year`, page.caption.title === FIXED[0].title && page.caption.line === String(FIXED[0].year), JSON.stringify(page.caption))
    if (phone) {
      say(`${tag} on the phone the row of albums carries the name, and the label over the crate is not shown`, page.shelfShown && page.shelfTitle === 'Na caixa do The Album Blender' && page.tag && !page.tag.shown, `${page.shelfTitle} · label shown: ${page.tag?.shown}`)
    } else {
      say(`${tag} the crate carries its name on the computer: «Na caixa do The Album Blender», a small label by the crate`, page.tag?.shown && page.tag.text.toUpperCase() === 'NA CAIXA DO THE ALBUM BLENDER' && !page.fictionalTag, JSON.stringify(page.tag))
      say(`${tag} the label is in the page's own style: 12 px, bold, capitals, inside the stage and clear of the pause icon`, page.tag.size === '12px' && page.tag.weight === '700' && page.tag.upper === 'uppercase' && page.tag.box[0] >= page.layout.scene[0] && page.tag.box[0] + page.tag.box[2] <= page.layout.scene[0] + page.layout.scene[2] - 52, JSON.stringify({ tag: page.tag.box, scene: page.layout.scene }))
      await shot(run.page, '#stage', `${file}-1-nothing-published-stage.jpg`)
    }
    say(`${tag} nothing published: the database was asked ONCE, after the page had loaded`, run.net.requests.filter((r) => r.url.includes('firestore.googleapis.com') && r.method === 'POST').length === 1 && run.net.firstDatabaseRead >= run.loadAt - 50, `read ${run.net.firstDatabaseRead - run.started} ms after the start, load at ${run.loadAt - run.started} ms`)
    const without = await run.page.evaluate(() => { const label = document.querySelector('.crate-tag'); const was = label.style.display; label.style.display = 'none'; const width = document.documentElement.scrollWidth; label.style.display = was; return width })
    say(`${tag} nothing published: no console error, and the label adds no sideways scroll`, real(run.errors).length === 0 && page.scrollWidth === without, `${real(run.errors).slice(0, 2).join(' ¦ ')} page ${page.scrollWidth} px wide in a window of ${page.width} px, ${without} px without the label`)
    entryPage.pageWidth = page.scrollWidth
    await view(run.page, `${file}-1-nothing-published.jpg`)
    run.fixedLayout = page.layout
    entryPage.fixedLayout = page.layout
    await run.browser.close()
  }

  // 2. a published crate
  {
    const run = await openEntry(engine, viewport, { documents: { 'published/crate': crateDoc(PUBLISHED, 3) } })
    const page = await run.page.evaluate(readEntry)
    const row = flat(PUBLISHED)
    say(`${tag} published: the crate is swapped in, in the owner's order (side A from the front, side B behind it)`, run.published === 'swapped' && same(page.sleeves, row.map((a) => a.id)), `${run.published} · ${page.sleeves.join(' ')}`)
    say(`${tag} published: side A faces the visitor, its ${PUBLISHED.sideA.length} albums and no other`, same(page.front, PUBLISHED.sideA.map((a) => a.id)), page.front.join(' '))
    say(`${tag} published: the caption stays album and year, of the new front album`, page.caption.title === row[0].title && page.caption.line === String(row[0].year), JSON.stringify(page.caption))
    say(`${tag} published: every cover comes from Apple's image server and has arrived`, page.covers.every((src) => src.startsWith('https://is1-ssl.mzstatic.com/image/thumb/')) && page.coversLoaded === row.length, `${page.coversLoaded} of ${row.length} loaded`)
    if (!phone) say(`${tag} published: «Ouça no Apple Music» leads to the front album's page, in a new tab (judged by its address, never opened)`, page.listen.href === row[0].href && page.listen.target === '_blank' && /noopener/.test(page.listen.rel) && page.listen.name.includes(row[0].title), JSON.stringify(page.listen))
    if (phone) {
      say(`${tag} published: the phone's row has the same ${row.length} albums in the same order, each with its own Apple Music address`, same(page.shelf.map((a) => a.title), row.map((a) => a.title)) && same(page.shelf.map((a) => a.href), row.map((a) => a.href)) && page.shelf.every((a) => a.target === '_blank' && /noopener/.test(a.rel)), page.shelf.map((a) => a.title).join(' · '))
      say(`${tag} published: each button of the row says what it does, the album and the artist`, page.shelf.every((a, i) => a.name.includes('Ouça no Apple Music') && a.name.includes(row[i].title) && a.name.includes(row[i].artist)), page.shelf[0].name)
    }
    const fixedLayout = entryPage.fixedLayout
    const moved = Object.keys(page.layout).filter((key) => key !== 'shelf' && !same(page.layout[key], fixedLayout[key]))
    const shelfSame = !page.layout.shelf || !fixedLayout.shelf || (page.layout.shelf[1] === fixedLayout.shelf[1] && page.layout.shelf[3] === fixedLayout.shelf[3])
    say(`${tag} published: nothing on the page moved or changed size with the swap (the height of the page, the stage, the caption, the row, the close, the footer)`, moved.length === 0 && shelfSame, moved.length ? JSON.stringify({ moved, now: page.layout, before: fixedLayout }) : `page ${page.layout.height} px`)
    // the swap itself: the shifts the browser recorded from the moment the crate changed (what the fonts move while the page loads is not the swap's)
    const shifts = await run.page.evaluate(() => (Array.isArray(window.__shifts) && window.__swapAt !== null ? window.__shifts.filter((entry) => entry.at >= window.__swapAt - 20) : null))
    if (engine === 'chromium') say(`${tag} published: the browser recorded no layout shift at the swap`, Array.isArray(shifts) && shifts.reduce((sum, entry) => sum + entry.value, 0) < 0.001, JSON.stringify(shifts))
    say(`${tag} published: no console error, and the page is as wide as with the fixed set`, real(run.errors).length === 0 && page.scrollWidth === entryPage.pageWidth, `${real(run.errors).slice(0, 2).join(' ¦ ')} ${page.scrollWidth} px`)
    if (!phone) {
      // the stories on the computer: each track names a record that exists on its side
      const named = []
      for (const id of ['start', 'albums', 'blend', 'playlists', 'inventory', 'end']) {
        await run.page.evaluate((section) => document.getElementById(section).scrollIntoView({ block: 'start' }), id)
        await run.page.waitForTimeout(350)
        named.push(await run.page.evaluate(() => document.querySelector('#who b')?.textContent))
      }
      const wanted = [row[2], row[0], row[5], row[row.length - 4], row[row.length - 2], row[row.length - 1]].map((a) => a.title)
      say(`${tag} published: scrolling the stories, the caption names the pulled record of the new crate (3rd, 1st and 6th of side A; 4th, 2nd and 1st of side B)`, same(named, wanted), named.join(' · '))
      await run.page.evaluate(() => window.scrollTo(0, 0))
      await run.page.waitForTimeout(300)
      await shot(run.page, '#stage', `${file}-2-published-stage.jpg`)
    } else {
      await run.page.evaluate(() => document.getElementById('crate-shelf').scrollIntoView({ block: 'center' }))
      await run.page.waitForTimeout(400)
      await view(run.page, `${file}-2-published-row.jpg`)
      await run.page.evaluate(() => window.scrollTo(0, 0))
    }
    await view(run.page, `${file}-2-published.jpg`)
    await run.browser.close()
  }

  // 3. a hostile published crate
  {
    const run = await openEntry(engine, viewport, { documents: { 'published/crate': crateDoc(HOSTILE, 9) } })
    const page = await run.page.evaluate(readEntry)
    say(`${tag} hostile: the four bad albums are left out (markup in a title, markup in an artist, a cover from another server, a link that runs code) and the others go on`, run.published === 'swapped' && same(page.sleeves, HOSTILE_GOOD), `${run.published} · ${page.sleeves.join(' ')}`)
    say(`${tag} hostile: nothing became an element and nothing ran`, page.injected.pwned === null && page.injected.scripts === 0 && page.injected.handlers === 0, JSON.stringify(page.injected))
    const outside = run.net.requests.filter((r) => /evil\.example/.test(r.url))
    say(`${tag} hostile: the other server was never asked for anything, and every image is Apple's or the page's own`, outside.length === 0 && page.covers.every((src) => src.startsWith('https://is1-ssl.mzstatic.com/')), `${outside.length} requests to the other server`)
    say(`${tag} hostile: every link to listen is an Apple Music page`, [page.listen?.href, ...page.shelf.map((a) => a.href)].filter(Boolean).every((href) => href.startsWith('https://music.apple.com/')))
    say(`${tag} hostile: no console error`, real(run.errors).length === 0, real(run.errors).slice(0, 2).join(' ¦ '))
    await view(run.page, `${file}-3-hostile.jpg`)
    await run.browser.close()
  }

  // 4. a hostile crate that falls under the limits: refused whole
  {
    const tooFew = { sideA: HOSTILE.sideA.slice(0, 8), sideB: HOSTILE.sideB }
    const run = await openEntry(engine, viewport, { documents: { 'published/crate': crateDoc(tooFew, 2) } })
    const page = await run.page.evaluate(readEntry)
    say(`${tag} a published crate that falls under the limits once its bad albums are out is refused whole: the fixed set stays`, run.published === 'refused' && same(page.sleeves, FIXED_IDS), run.published)
    await run.browser.close()
  }

  // 5. the read fails; 6. the read is slow
  {
    const failing = await openEntry(engine, viewport, { database: 'fails' })
    const page = await failing.page.evaluate(readEntry)
    say(`${tag} the read fails: the fixed set stays, whole, and nothing breaks`, failing.published === 'failed' && same(page.sleeves, FIXED_IDS) && real(failing.errors).length === 0, `${failing.published} ${real(failing.errors).slice(0, 2).join(' ¦ ')}`)
    await failing.browser.close()

    const slow = await open(engine, viewport, { documents: { 'published/crate': crateDoc(PUBLISHED, 3) }, database: 6000 })
    const started = Date.now()
    await slow.page.goto(SITE + '/', { waitUntil: 'load' })
    const loaded = Date.now() - started
    const paint = await slow.page.evaluate(() => performance.getEntriesByType('paint').find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? null)
    const published = await slow.page.evaluate(() => window.__splash.published)
    const waited = Date.now() - started - loaded
    const after = await slow.page.evaluate(readEntry)
    say(`${tag} the read is slow (6 s): the page gives up 3 s after it loaded («timeout»), long before the answer, and keeps the fixed set`, published === 'timeout' && same(after.sleeves, FIXED_IDS) && waited < 4000, `${published} ${waited} ms after the load`)
    say(`${tag} the read is slow: the page had loaded and painted long before the database could answer at 6 s (it never waits for it)`, loaded < 5000 && (paint === null || paint < 3000), `load ${loaded} ms · first paint ${paint === null ? 'not reported by this engine' : Math.round(paint) + ' ms'}`)
    await slow.browser.close()
  }

  // 7. without script
  {
    const run = await openEntry(engine, viewport, { documents: { 'published/crate': crateDoc(PUBLISHED, 3) }, script: false })
    const page = await run.page.evaluate(readEntry)
    say(`${tag} without script: the page reads whole with the fixed set, and the database is never asked`, same(page.sleeves, FIXED_IDS) && run.net.firstDatabaseRead === null && (phone ? page.shelf.length === FIXED_IDS.length : page.tag?.text.length > 0), `${page.sleeves.length} sleeves`)
    await run.browser.close()
  }

  // 8. in English
  {
    const run = await openEntry(engine, viewport, { documents: { 'published/crate': crateDoc(PUBLISHED, 3) }, lang: 'en' })
    const page = await run.page.evaluate(readEntry)
    const name = phone ? page.shelfTitle : page.tag?.text
    say(`${tag} in English the crate is «In The Album Blender's crate», and the albums and artists keep their names`, page.lang === 'en' && name.toUpperCase() === "IN THE ALBUM BLENDER'S CRATE" && page.caption.title === flat(PUBLISHED)[0].title, name)
    if (phone) say(`${tag} in English the row's buttons say «Listen on Apple Music»`, page.shelf.every((a) => a.name.includes('Listen on Apple Music')), page.shelf[0].name)
    if (!phone) await shot(run.page, '#stage', `${file}-4-english-stage.jpg`)
    await run.browser.close()
  }
}

/** Chromium, the computer: the 3D crate is asked for only after the owner's crate has been decided, so it is built once. */
async function threeAfterTheCrate() {
  const run = await open('chromium', { width: 1280, height: 800 }, { documents: { 'published/crate': crateDoc(PUBLISHED, 3) }, database: 1200 })
  await run.ctx.addInitScript(() => { Object.defineProperty(window, 'matchMedia', { value: (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) }) })
  await run.page.goto(SITE + '/', { waitUntil: 'load' })
  const published = await run.page.evaluate(() => window.__splash.published)
  await run.page.waitForTimeout(2500)
  const answered = run.net.firstDatabaseRead + 1200
  if (run.net.three === null) say('entry chromium 1280 the 3D crate: this browser has no WebGL here, so it was not asked for at all (the CSS crate stays)', true, published)
  else say('entry chromium 1280 the 3D crate is asked for only after the database answered about the owner\'s crate', published === 'swapped' && run.net.three >= answered - 30, `database answered at +${answered - run.net.firstDatabaseRead} ms, 3D asked at +${run.net.three - run.net.firstDatabaseRead} ms`)
  await run.browser.close()
}

// ---------------------------------------------------------------------------------------------------------------------------------
// The Painel
// ---------------------------------------------------------------------------------------------------------------------------------
const BASE_DOCS = {
  'cmsAdmins/preview-uid': { role: 'super' },
  'published/texts_en': { _schemaVersion: 1, rev: 2, texts: {} },
  'published/texts_pt': { _schemaVersion: 1, rev: 4, texts: {} },
  'published/site': { _schemaVersion: 1, rev: 1, switches: { discogsValues: true } },
}
const ids = (page, side) => page.locator(`[data-side="${side}"] [data-album]`).evaluateAll((rows) => rows.map((row) => row.getAttribute('data-album')))
const barText = (page) => page.locator('.cms-bar-info b').innerText()
const focused = (page) => page.evaluate(() => { const el = document.activeElement; return el ? `${el.closest('[data-album]')?.getAttribute('data-album') ?? ''}:${el.getAttribute('data-act') ?? el.tagName}` : '' })
const openCrate = async (page) => {
  await page.goto(SITE + '/admin/crate', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-side="a"] [data-album]', { timeout: 20000 })
}

async function painel(engine, width, height) {
  const tag = `painel ${engine} ${width}`
  const file = `painel-${engine}-${width}`
  const { browser, page, stub, net, state, errors } = await open(engine, { width, height }, { documents: BASE_DOCS, account: true })
  try {
    // the menu, and the way in
    await page.goto(SITE + '/admin', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.cms-rail', { timeout: 20000 })
    await page.waitForSelector('.cms-row', { timeout: 20000 }).catch(async (error) => { console.log('DEBUG the Painel did not show its texts:', (await page.locator('#app').innerText()).replace(/\n+/g, ' | ').slice(0, 600), '· errors:', errors.slice(-4).join(' ¦ ').slice(0, 600), '· aborted:', [...new Set(net.aborted)].join(', ')); throw error })
    const rail = await page.locator('.cms-rail .cms-navb').evaluateAll((buttons) => buttons.map((button) => `${button.textContent}${button.disabled ? ' (off)' : ''}`))
    say(`${tag} the menu has «Crate» beside «Texts», and keeps «Switches · later» and «Blend recipes · later» turned off`, same(rail, ['Texts', 'Crate', 'Switches · later (off)', 'Blend recipes · later (off)']), rail.join(' | '))
    const historyBefore = await page.evaluate(() => history.length)
    await page.locator('[data-section="crate"]').click()
    await page.waitForSelector('[data-side="a"] [data-album]')
    say(`${tag} «Crate» opens the section at its own address, without adding a step to «back»`, new URL(page.url()).pathname === '/admin/crate' && await page.evaluate(() => history.length) === historyBefore && await page.locator('h1').innerText() === "The Album Blender's crate", page.url())

    // what is shown with nothing published: the fixed set, read from the entry page
    const fixedA = await ids(page, 'a'), fixedB = await ids(page, 'b')
    say(`${tag} with nothing published it shows the fixed set of the entry page: side A (8) and side B (7), each from its front`, same(fixedA, FIXED_IDS.slice(0, 8)) && same(fixedB, FIXED_IDS.slice(8).reverse()), `A ${fixedA.join(' ')} | B ${fixedB.join(' ')}`)
    say(`${tag} it says what the entry page shows, and the limits of each side`, /fixed set of the code/.test(await page.locator('[data-crate-source]').innerText()) && await page.locator('[data-side="a"] [data-count-tag]').innerText() === '8 albums · from 6 to 10' && await page.locator('[data-side="b"] [data-count-tag]').innerText() === '7 albums · from 4 to 10', (await page.locator('[data-crate-source]').innerText()).replace(/\n/g, ' '))
    await page.waitForFunction(() => { const img = document.querySelector('[data-side="a"] [data-album] img'); return img.complete && img.naturalWidth > 0 }, null, { timeout: 10000 }).catch(() => {})
    const first = await page.locator('[data-side="a"] [data-album]').first().evaluate((row) => ({ title: row.querySelector('b').textContent, by: row.querySelector('small').textContent, cover: row.querySelector('img').getAttribute('src'), loaded: row.querySelector('img').complete && row.querySelector('img').naturalWidth > 0 }))
    say(`${tag} each album shows its cover (Apple's image server), its name, its artist and its year`, first.title === FIXED[0].title && first.by === `${FIXED[0].artist} · ${FIXED[0].year}` && first.cover.startsWith('https://is1-ssl.mzstatic.com/image/thumb/') && first.loaded, JSON.stringify(first))
    say(`${tag} nothing to save yet: «All saved», Save and Discard off`, await barText(page) === 'All saved' && await page.locator('[data-act="save"]').isDisabled() && await page.locator('[data-act="discard"]').isDisabled())
    await view(page, `${file}-01-crate-fixed-set.jpg`)

    // reorder with the keyboard alone
    const second = FIXED_IDS[1]
    await page.locator(`[data-album="${second}"] [data-act="up"]`).focus()
    await page.keyboard.press('Enter')
    say(`${tag} keyboard: Enter on «Move up» moves the album one place up`, same((await ids(page, 'a')).slice(0, 2), [FIXED_IDS[1], FIXED_IDS[0]]), (await ids(page, 'a')).join(' '))
    say(`${tag} keyboard: the focus stays on the album that moved (at the front «up» is off, so on its «down»)`, await focused(page) === `${second}:down`, await focused(page))
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
    say(`${tag} keyboard: Enter twice on «Move down» takes it to the third place, the focus still on it`, same((await ids(page, 'a')).slice(0, 3), [FIXED_IDS[0], FIXED_IDS[2], FIXED_IDS[1]]) && await focused(page) === `${second}:down`, `${(await ids(page, 'a')).slice(0, 3).join(' ')} · focus ${await focused(page)}`)
    const tabOrder = []
    await page.locator(`[data-album="${second}"] [data-act="up"]`).focus()
    // WebKit, as Safari on a Mac, walks buttons with Option+Tab (plain Tab stops at fields only, unless the person turned full keyboard access on)
    for (let i = 0; i < 4; i++) { tabOrder.push(await focused(page)); await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab') }
    say(`${tag} keyboard: Tab walks the four buttons of an album in order (up, down, to the other side, remove)`, same(tabOrder, [`${second}:up`, `${second}:down`, `${second}:across`, `${second}:remove`]), tabOrder.join(' → '))
    say(`${tag} the bar says the crate has changes not saved`, await barText(page) === 'The crate has changes not saved' && await page.locator('[data-act="save"]').isEnabled())

    // to the other side, remove, the limits
    await page.locator(`[data-album="${FIXED_IDS[7]}"] [data-act="across"]`).click()
    say(`${tag} «To side B» sends the album to the back of the other side`, (await ids(page, 'b')).at(-1) === FIXED_IDS[7] && (await ids(page, 'a')).length === 7 && (await ids(page, 'b')).length === 8, `B ${(await ids(page, 'b')).join(' ')}`)
    await page.locator(`[data-album="${FIXED_IDS[6]}"] [data-act="remove"]`).click()
    say(`${tag} «Remove» takes the album out`, !(await ids(page, 'a')).includes(FIXED_IDS[6]) && (await ids(page, 'a')).length === 6)
    await page.locator(`[data-album="${FIXED_IDS[5]}"] [data-act="remove"]`).click()
    const few = await page.locator('[data-side="a"] [data-count-problem="few"]').innerText()
    say(`${tag} a side under its minimum says so in words, and Save is off until it is fixed`, /Side A needs at least 6 albums \(up to 10\)/.test(few) && await page.locator('[data-act="save"]').isDisabled() && /outside its limits/.test(await page.locator('.cms-bar-info span').innerText()), few)
    await shot(page, '[data-side="a"]', `${file}-02-side-under-its-minimum.jpg`)

    // the search
    await page.locator('#cms-crate-q').fill('fleetwood mac')
    await page.locator('#cms-crate-q').press('Enter')
    await page.waitForSelector('[data-search="found"]')
    const asked = state.searches.at(-1)
    say(`${tag} the search asks THE SERVER's route, with the administrator's session, and never Apple from the browser`, asked.query === 'fleetwood mac' && asked.authorized && !net.requests.some((r) => /api\.music\.apple\.com|music\.apple\.com/.test(r.url)), JSON.stringify(asked))
    const result = await page.locator('[data-result]').first().evaluate((row) => ({ title: row.querySelector('b').textContent, by: row.querySelector('small').textContent, cover: row.querySelector('img').getAttribute('src'), buttons: [...row.querySelectorAll('button')].map((button) => button.textContent) }))
    say(`${tag} a result shows cover, album, artist and year, and «add» for each side`, result.title === 'Rumours' && result.by === 'Fleetwood Mac · 1977' && result.cover.startsWith('https://is1-ssl.mzstatic.com/image/thumb/') && same(result.buttons, ['Add to side A', 'Add to side B']), JSON.stringify(result))
    await shot(page, '.cms-add', `${file}-03-search-results.jpg`)
    await page.locator('[data-result="1440851613"] [data-act="add-a"]').click()
    say(`${tag} «Add to side A» puts it at the back of side A, and the result then says «already in the crate»`, (await ids(page, 'a')).at(-1) === '1440851613' && await page.locator('[data-result="1440851613"] [data-in-crate]').innerText() === 'already in the crate' && await page.locator('[data-result="1440851613"] button').count() === 0)
    say(`${tag} with six on side A again the problem is gone and Save is on`, await page.locator('[data-count-problem]').count() === 0 && await page.locator('[data-act="save"]').isEnabled())
    await page.locator('#cms-crate-q').fill('https://music.apple.com/us/album/harvest-moon/1015739190')
    await page.locator('[data-act="search"]').click()
    await page.waitForSelector('[data-result="1015739190"]')
    say(`${tag} a pasted Apple Music album link goes to the server as it is, and brings that album`, state.searches.at(-1).query === 'https://music.apple.com/us/album/harvest-moon/1015739190' && await page.locator('[data-result]').count() === 1)
    await page.locator('[data-result="1015739190"] [data-act="add-b"]').click()
    await page.locator('#cms-crate-q').fill('zzzz')
    await page.locator('#cms-crate-q').press('Enter')
    await page.waitForSelector('[data-search="none"]')
    say(`${tag} nothing found is said in words`, /No album found/.test(await page.locator('[data-search="none"]').innerText()))
    const said = []
    for (const failure of SEARCH_FAILURES) {
      state.search = failure
      await page.locator('#cms-crate-q').fill(`again ${failure[1]}`)
      await page.locator('#cms-crate-q').press('Enter')
      await page.waitForFunction((words) => document.querySelector('[data-search="failed"]')?.textContent.includes(words), failure[2].source.replace(/\\/g, ''), { timeout: 5000 }).catch(() => {})
      const words = await page.locator('[data-search="failed"]').innerText().catch(() => '(nothing said)')
      said.push(failure[2].test(words) ? 'ok' : `${failure[1]}: «${words}»`)
      if (failure[1] === 'search-not-configured') await shot(page, '.cms-add', `${file}-04-search-not-configured.jpg`)
    }
    state.search = null
    say(`${tag} each of the seven failure names of the search is said in plain words, and the crate does not change`, said.every((item) => item === 'ok'), said.filter((item) => item !== 'ok').join(' ¦ ') || SEARCH_FAILURES.map((failure) => failure[1]).join(', '))

    // the save, refused by today's rules first
    const wantedA = await ids(page, 'a'), wantedB = await ids(page, 'b')
    stub.refuseWrites((written) => written === 'published/crate') // the rules as they are published today do not list this document
    await page.locator('[data-act="save"]').click()
    await page.waitForSelector('[data-state="confirm"]')
    const confirm = (await page.locator('[data-state="confirm"]').innerText()).replace(/\n+/g, ' | ')
    say(`${tag} Save asks first and says what goes live: the count of each side, who comes in, who goes out, and that the order changes`, /The crate goes live now: 6 albums on side A, 9 albums on side B\./.test(confirm) && /2 albums come in: Rumours · Harvest Moon/.test(confirm) && /2 albums go out/.test(confirm) && /The order or the side of the albums that stay changes/.test(confirm), confirm)
    say(`${tag} nothing was written before the confirmation`, stub.get('published/crate') === undefined)
    await shot(page, '.cms-bar', `${file}-05-confirm-what-goes-live.jpg`)
    await page.locator('[data-act="save-confirm"]').click()
    await page.waitForSelector('[data-state="failed"]', { timeout: 15000 })
    const refused = await page.locator('[data-state="failed"] span').innerText()
    say(`${tag} THE DATABASE RULES AS PUBLISHED TODAY refuse the crate: the Painel says so in words, writes nothing and keeps the changes`, /its rules do not accept this save yet/.test(refused) && stub.get('published/crate') === undefined && same(await ids(page, 'a'), wantedA), refused)
    await shot(page, '.cms-bar', `${file}-06-refused-by-the-rules.jpg`)

    // the save, once the rules accept the crate
    stub.refuseWrites(null) // the owner published the lines for the crate
    await page.locator('[data-act="save-retry"]').click()
    await page.waitForSelector('[data-state="saved"]', { timeout: 15000 })
    const live = stub.get('published/crate')
    say(`${tag} once the rules accept it, «Try again» saves: rev 1, the two sides in the order on the screen`, live?.rev === 1 && live._schemaVersion === 1 && same(live.sideA.map((a) => a.id), wantedA) && same(live.sideB.map((a) => a.id), wantedB), JSON.stringify({ rev: live?.rev, a: live?.sideA.map((a) => a.id), b: live?.sideB.map((a) => a.id) }))
    say(`${tag} what is stored of an album is exactly what the entry page needs: id, title, artist, year, artwork path, Apple Music address`, [...live.sideA, ...live.sideB].every((a) => same(Object.keys(a).sort(), ['art', 'artist', 'href', 'id', 'title', 'year']) && !/^https?:/.test(a.art) && a.href.startsWith('https://music.apple.com/')), JSON.stringify(live.sideA.at(-1)))
    say(`${tag} who saved is kept in the work area, never in the public document`, stub.get('cmsWork/save_crate')?.updatedBy === 'preview-uid' && !JSON.stringify(live).includes('preview-uid'))
    say(`${tag} the Painel says «saved and live» and that the entry page shows the published crate`, /Saved and live: the crate of the entry page/.test(await page.locator('[data-state="saved"]').innerText()) && /the crate published here/.test(await page.locator('[data-crate-source]').innerText()) && await barText(page) === 'All saved')
    await view(page, `${file}-07-saved-and-live.jpg`)

    // the entry page shows what the Painel saved (same stand-in database)
    {
      const entry = await page.context().newPage()
      await entry.goto(SITE + '/', { waitUntil: 'load' })
      await entry.waitForFunction(() => document.documentElement.classList.contains('js'))
      const outcome = await entry.evaluate(() => window.__splash.published)
      const sleeves = await entry.evaluate(() => [...document.querySelectorAll('#box .sl')].map((img) => img.dataset.k))
      say(`${tag} THE ENTRY PAGE then shows the crate the Painel saved: side A from the front, side B behind it`, outcome === 'swapped' && same(sleeves, [...wantedA, ...[...wantedB].reverse()]), `${outcome} · ${sleeves.join(' ')}`)
      await entry.waitForTimeout(500)
      await entry.screenshot({ path: path.join(OUT, `${file}-08-entry-page-shows-what-was-saved.jpg`), type: 'jpeg', quality: 70 })
      await entry.close()
    }

    // opened again: the published crate
    await openCrate(page)
    say(`${tag} opened again, the Painel shows the published crate`, same(await ids(page, 'a'), wantedA) && same(await ids(page, 'b'), wantedB) && /the crate published here/.test(await page.locator('[data-crate-source]').innerText()))

    // the conflict with another device
    await page.locator(`[data-album="${wantedA[1]}"] [data-act="up"]`).click()
    const mine = await ids(page, 'a')
    const theirs = { ...live, rev: 2, sideA: [...live.sideA].reverse() }
    stub.beforeNextRead('published/crate', (other) => other.set('published/crate', theirs))
    await page.locator('[data-act="save"]').click()
    await page.locator('[data-act="save-confirm"]').click()
    await page.waitForSelector('[data-state="conflict"]', { timeout: 15000 })
    say(`${tag} the crate changed on another device: the Painel says so and writes nothing over it`, /changed on another device/.test(await page.locator('[data-state="conflict"] b').innerText()) && stub.get('published/crate').rev === 2 && same(stub.get('published/crate').sideA.map((a) => a.id), theirs.sideA.map((a) => a.id)), (await page.locator('[data-state="conflict"]').innerText()).replace(/\n+/g, ' | '))
    await shot(page, '.cms-bar', `${file}-09-conflict.jpg`)
    await page.locator('[data-act="conflict-mine"]').click()
    await page.waitForSelector('[data-state="saved"]', { timeout: 15000 })
    say(`${tag} «Save mine» saves this device's crate on top of the other's: rev 3, the other's side kept as the earlier value`, stub.get('published/crate').rev === 3 && same(stub.get('published/crate').sideA.map((a) => a.id), mine) && same(stub.get('published/crate').previous?.sideA?.map((a) => a.id), theirs.sideA.map((a) => a.id)), `rev ${stub.get('published/crate').rev}`)
    await page.locator(`[data-album="${mine[2]}"] [data-act="up"]`).click()
    const theirsAgain = { ...stub.get('published/crate'), rev: 4, sideB: [...stub.get('published/crate').sideB].reverse() }
    stub.beforeNextRead('published/crate', (other) => other.set('published/crate', theirsAgain))
    await page.locator('[data-act="save"]').click()
    await page.locator('[data-act="save-confirm"]').click()
    await page.waitForSelector('[data-state="conflict"]', { timeout: 15000 })
    await page.locator('[data-act="conflict-theirs"]').click()
    await page.waitForFunction(() => !document.querySelector('[data-state="conflict"]') && document.querySelector('[data-side="b"] [data-album]'))
    say(`${tag} «Keep the other» drops this device's change and shows what is live`, same(await ids(page, 'b'), theirsAgain.sideB.map((a) => a.id)) && stub.get('published/crate').rev === 4 && await barText(page) === 'All saved')

    // leaving with a change not saved; the sections keep their changes
    await page.locator(`[data-album="${(await ids(page, 'a'))[1]}"] [data-act="up"]`).click()
    const changed = await ids(page, 'a')
    await page.locator('[data-section="texts"]').click()
    await page.waitForSelector('.cms-row')
    await page.locator('[data-section="crate"]').click()
    await page.waitForSelector('[data-side="a"] [data-album]')
    say(`${tag} a change of the crate not saved is kept while the owner looks at the texts`, same(await ids(page, 'a'), changed) && await barText(page) === 'The crate has changes not saved')
    state.dialogs.length = 0
    await page.evaluate(() => window.router.navigate('/albums'))
    await page.waitForTimeout(300)
    say(`${tag} leaving the Painel with the crate not saved asks first, and «cancel» keeps the person and the change`, state.dialogs.length === 1 && new URL(page.url()).pathname === '/admin/crate' && same(await ids(page, 'a'), changed), state.dialogs[0] ?? 'no question')
    await page.locator('[data-act="discard"]').click()
    say(`${tag} «Discard» puts the crate back as it was read`, await barText(page) === 'All saved')

    // the frame
    say(`${tag} no sideways scroll`, await noScroll(page))
    const targets = await page.locator('.cms-album button, .cms-add button, .cms-bar button').evaluateAll((buttons) => buttons.filter((button) => button.getBoundingClientRect().width > 0).map((button) => { const r = button.getBoundingClientRect(); return Math.min(r.width, r.height) }))
    if (width < 900) say(`${tag} on the phone every button of the section is at least 44 px`, targets.every((size) => size >= 43.5), `smallest ${Math.min(...targets)} px of ${targets.length}`)
    await page.evaluate(() => window.scrollTo(0, 0))
    await view(page, `${file}-10-crate-published.jpg`)
    say(`${tag} no console error`, real(errors).length === 0, real(errors).slice(0, 3).join(' ¦ '))
    const unhandled = stub.log.filter((entry) => entry.unhandled)
    say(`${tag} every database request was answered by the stand-in`, unhandled.length === 0, JSON.stringify(unhandled.slice(0, 3)))
    say(`${tag} nothing outside was reached: only this machine, the stand-ins, Apple's image server and the fonts`, net.aborted.every((host) => !NEVER.includes(host)) && !net.requests.some((r) => NEVER.includes(new URL(r.url).hostname)), `aborted on purpose: ${[...new Set(net.aborted)].join(', ') || 'nothing'}`)
  } finally {
    await browser.close()
  }
}

async function visitor(engine, width, height) {
  const tag = `painel ${engine} ${width}`
  const { browser, page, net, errors } = await open(engine, { width, height }, { documents: BASE_DOCS })
  try {
    await page.goto(SITE + '/admin/crate', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-screen="not-found"]', { timeout: 20000 })
    await page.waitForTimeout(1000)
    say(`${tag} a visitor at /admin/crate sees «Page not found», and the Painel's files are never requested`, /Page not found/.test(await page.locator('[data-screen="not-found"]').innerText()) && adminFiles.length > 0 && !net.requests.some((r) => adminFiles.some((name) => r.url.endsWith(name))) && real(errors).length === 0, real(errors).slice(0, 2).join(' ¦ '))
  } finally {
    await browser.close()
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------
const wanted = (name) => !ONLY || ONLY.includes(name)
say('the built entry page carries the real set (15 albums) and the address of the database in its content policy, and no other new host',
  FIXED.length === 15 && /connect-src 'self' https:\/\/cdn\.jsdelivr\.net https:\/\/firestore\.googleapis\.com;/.test(builtPage) && /img-src 'self' data: https:\/\/is1-ssl\.mzstatic\.com;/.test(builtPage), `${FIXED.length} albums`)
const entryScript = (/src="(\/assets\/splash-[^"]+\.js)"/.exec(builtPage) ?? [])[1]
const entrySource = entryScript ? fs.readFileSync(path.join(DIST, entryScript), 'utf8') : ''
// the phone bar's module (menu-*.js) is the one file the entry page and the app already shared before this (F96): nothing joins it
const entryImports = [...entrySource.matchAll(/from"\.\/([^"]+)"/g)].map((match) => match[1])
say('the entry page is still its own script: its copy of the crate\'s validator is inside it, it takes no new file shared with the app, and no Firebase SDK',
  Boolean(entryScript) && entryImports.every((name) => /^menu-/.test(name)) && /side_a_count/.test(entrySource) && !/firebase\/|initializeApp/.test(entrySource), `${entryScript} · ${entrySource.length} B · imports: ${entryImports.join(', ') || 'nothing'}`)
const appHtml = fs.readFileSync(path.join(DIST, 'app.html'), 'utf8')
say('the Painel (with the crate section) is not in the app\'s preload', adminFiles.length > 0 && adminFiles.every((name) => !appHtml.includes(name)), adminFiles.join(', '))

try {
  for (const engine of ['chromium', 'webkit']) {
    for (const [width, height] of [[1280, 800], [390, 844]]) {
      if (wanted('entry')) await entryPage(engine, width, height)
      if (wanted('painel')) {
        await painel(engine, width, height)
        await visitor(engine, width, height)
      }
    }
  }
  if (wanted('entry')) await threeAfterTheCrate()
} catch (error) {
  say('the proof ran to its end', false, String(error?.stack ?? error).slice(0, 900))
}

const failed = results.filter((result) => !result.ok)
const lines = results.map((result) => `${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.detail ? ' — ' + result.detail : ''}`)
if (!ONLY) fs.writeFileSync(path.join(OUT, 'browser-proof.txt'), lines.join('\n') + `\n\n${results.length - failed.length} of ${results.length} passed\n`)
console.log(`${results.length - failed.length} of ${results.length} passed`)
process.exit(failed.length ? 1 : 0)
