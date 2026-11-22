// F79 · the Create screen on the COMPUTER, «Hoje»: captures the real /start of `main` (Vite dev server on 5582,
// headless Chrome on 9582) at 1440 x 900 in each state, as markup + the CSS the page really loaded.
// Reused from design/proposals/f79-start-lean/build/capture.mjs (the phone's preview), same seams; only the size,
// the ports and where the raw dump goes change. The raw dump (snaps.json, a few MB) goes to $F79C_RAW (outside git).
// Seams (the same as reports/evidence/visual-recheck-batch/2026-11-21/shell): the raw catalog call
// (musicKitService.getArtistAlbums) answers a fixture; the signed-in account is a stand-in written in IndexedDB,
// its auth lookup/refresh answered locally. Firebase Auth, Firestore, installations and every other outside host
// are failed (identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations). Nothing leaves the machine
// except Google Fonts.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const SITE = 'http://127.0.0.1:5582'
const OUT = process.env.F79C_RAW || path.join(here, '..', 'raw')
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b64 = (s) => Buffer.from(typeof s === 'string' ? s : JSON.stringify(s)).toString('base64')
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const now = Math.floor(Date.now() / 1000)
const ID_TOKEN = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({ iss: 'https://securetoken.google.com/x', aud: 'x', auth_time: now, user_id: 'preview-uid', sub: 'preview-uid', iat: now, exp: now + 3600 * 24 * 30, email: 'preview@example.invalid', email_verified: true, firebase: { identities: {}, sign_in_provider: 'password' } })}.c2ln`
const state = { signedIn: false, errors: [], blocked: new Set() }

const t = await (await fetch('http://127.0.0.1:9582/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0; const waiting = new Map()
const send = (method, params = {}) => new Promise((r) => { const i = ++seq; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const cors = [{ name: 'access-control-allow-origin', value: SITE }, { name: 'access-control-allow-credentials', value: 'true' }, { name: 'access-control-allow-headers', value: '*' }, { name: 'access-control-allow-methods', value: 'GET,POST,OPTIONS' }, { name: 'content-type', value: 'application/json' }]
const json = (id, code, body) => send('Fetch.fulfillRequest', { requestId: id, responseCode: code, body: b64(body), responseHeaders: cors })
ws.addEventListener('message', async (m) => {
  const d = JSON.parse(m.data)
  if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); return }
  if (d.method === 'Runtime.exceptionThrown') state.errors.push('exception: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 200))
  if (d.method === 'Fetch.requestPaused') {
    const id = d.params.requestId; const url = d.params.request.url; const method = d.params.request.method
    try {
      if (url.startsWith(SITE) || url.startsWith('data:') || /fonts\.(googleapis|gstatic)\.com/.test(url)) return void send('Fetch.continueRequest', { requestId: id })
      if (method === 'OPTIONS') return void send('Fetch.fulfillRequest', { requestId: id, responseCode: 204, responseHeaders: cors })
      if (state.signedIn && url.includes('identitytoolkit.googleapis.com') && url.includes('accounts:lookup')) {
        return void json(id, 200, { kind: 'identitytoolkit#GetAccountInfoResponse', users: [{ localId: 'preview-uid', email: 'preview@example.invalid', displayName: 'Mauricio', emailVerified: true, providerUserInfo: [{ providerId: 'password', email: 'preview@example.invalid', federatedId: 'preview@example.invalid', rawId: 'preview@example.invalid' }], validSince: String(now - 100), lastLoginAt: String(Date.now()), createdAt: String(Date.now()) }] })
      }
      if (state.signedIn && url.includes('securetoken.googleapis.com')) return void json(id, 200, { access_token: ID_TOKEN, expires_in: '3600', token_type: 'Bearer', refresh_token: 'preview-refresh', id_token: ID_TOKEN, user_id: 'preview-uid', project_id: 'x' })
      state.blocked.add(new URL(url).host)
      return void send('Fetch.failRequest', { requestId: id, errorReason: 'BlockedByClient' })
    } catch (e) { /* page left */ }
  }
})
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(expression.slice(0, 80) + ' ' + JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value }
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

const go = async (url) => { await send('Page.navigate', { url: SITE + url }); for (let i = 0; i < 60; i++) { await sleep(200); if (await run('!!document.querySelector("#artistScanInput")').catch(() => false)) break } await sleep(1500) }
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64')) }

const RAW = `(() => {
  const tile = (label, hue) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',45%,30%)"/><stop offset="1" stop-color="hsl(' + ((hue + 40) % 360) + ',40%,12%)"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/><circle cx="150" cy="150" r="70" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/><text x="150" y="262" fill="rgba(255,255,255,.75)" font-family="sans-serif" font-size="20" text-anchor="middle">' + label + '</text></svg>')
  let n = 0
  const mk = (title, date, tracks, o = {}) => { n++; const attributes = { name: title, artistName: 'Radiohead', genreNames: ['Alternative', 'Music'], releaseDate: date, trackCount: tracks, isSingle: !!o.single, isCompilation: !!o.comp, contentTraits: o.live ? ['live'] : [] }
    return { appleMusicId: 'fx-' + n, title, artist: 'Radiohead', year: date.slice(0, 4), artworkTemplate: tile(title.slice(0, 18), (n * 47) % 360), trackCount: tracks, isSingle: !!o.single, isCompilation: !!o.comp, resultUrl: '', releaseDate: date, raw: { id: 'fx-' + n, attributes } } }
  return [
    mk('A Moon Shaped Pool', '2016-05-08', 11), mk('The King of Limbs', '2011-02-18', 8), mk('In Rainbows', '2007-10-10', 10),
    mk('Hail to the Thief', '2003-06-09', 14), mk('Amnesiac', '2001-06-05', 11), mk('Kid A', '2000-10-02', 10),
    mk('OK Computer', '1997-05-21', 12), mk('The Bends', '1995-03-13', 12), mk('Pablo Honey', '1993-02-22', 12),
    mk('Creep - Single', '1992-09-21', 1, { single: true }), mk('I Might Be Wrong (Live)', '2001-11-12', 8, { live: true })
  ]
})()`
const STUB = `(async () => {
  const m = await import(location.origin + '/js/services/MusicKitService.js')
  const raw = ${RAW}
  window.__mode = 'results'
  m.musicKitService.getArtistAlbums = async () => {
    if (window.__mode === 'never') return new Promise(() => {})
    if (window.__mode === 'none') return []
    if (window.__mode === 'fail') throw new Error('catalog unavailable (fixture)')
    return raw
  }
  return 'stubbed'
})()`

// the snapshot: the body as markup (scripts out, field values written in), the CSS the page holds, the scroll
// The CSS is taken as its source text (a <style> as written, a <link> fetched), never re-serialized from the CSSOM:
// Chrome serializes a shorthand with var() as empty longhands («background-image: ;»), which drops the title's fire.
const SNAP = `(async () => {
  const sheets = await Promise.all([...document.styleSheets].map(async (s) => {
    const node = s.ownerNode
    if (node && node.tagName === 'STYLE') return node.textContent
    if (s.href && s.href.startsWith(location.origin)) return (await fetch(s.href)).text()
    return '/* ' + (s.href || '') + ' not inlined */'
  }))
  document.querySelectorAll('input,textarea').forEach((i) => { i.setAttribute('value', i.value); if (i.tagName === 'TEXTAREA') i.textContent = i.value })
  const clone = document.body.cloneNode(true)
  clone.querySelectorAll('script,noscript').forEach((s) => s.remove())
  return { css: sheets.join('\\n'), body: clone.outerHTML, html: document.documentElement.getAttribute('class') || '', bodyStyle: document.body.getAttribute('style') || '', scrollY: window.scrollY, text: document.body.innerText }
})()`
const snaps = {}
const snap = async (name, label) => { await sleep(500); await shot(name); snaps[name] = { label, ...(await run(SNAP)) }; console.log('captured', name) }
const searchFor = (mode, q) => `(() => { window.__mode = '${mode}'; const i = document.querySelector('#artistScanInput'); i.value = '${q}'; i.dispatchEvent(new Event('input', { bubbles: true })); i.blur(); document.querySelector('#btnScanArtist').click() })()`

async function states(who) {
  await run(STUB)
  await snap(`${who}-empty`, 'first visit')
  await run(`(() => { const i = document.querySelector('#artistScanInput'); i.focus(); i.value = 'Radiohead'; i.dispatchEvent(new Event('input', { bubbles: true })) })()`)
  await snap(`${who}-typing`, 'typing')
  await run(searchFor('never', 'Radiohead'))
  await sleep(600)
  await snap(`${who}-searching`, 'searching')
  await go('/start'); await run(STUB)
  await run(searchFor('results', 'Radiohead'))
  await sleep(2500)
  await snap(`${who}-results`, 'the discography')
  await run(`(async () => { const c = [...document.querySelectorAll('#discographyGrid [data-action="pick-album"]')]; for (const i of [6, 5, 2]) { c[i]?.click(); await new Promise((r) => setTimeout(r, 250)) } })()`)
  await sleep(1200)
  await run('window.scrollTo(0, 0)')
  await snap(`${who}-chosen`, 'albums chosen')
  await go('/start'); await run(STUB)
  await run(`document.querySelector('[data-home-mode="paste"]').click()`)
  await sleep(500)
  await snap(`${who}-paste`, 'pasting a list')
  await go('/start'); await run(STUB)
  await run(searchFor('fail', 'Radiohead'))
  await sleep(1500)
  await snap(`${who}-failed`, 'the catalog not answering')
  await go('/start'); await run(STUB)
  await run(searchFor('none', 'Radiohed'))
  await sleep(1500)
  await snap(`${who}-notfound`, 'artist not found')
}

// signed out
await send('Storage.clearDataForOrigin', { origin: SITE, storageTypes: 'all' })
await go('/start')
await states('out')
// signed in
state.signedIn = true
await go('/start')
await run(`(async () => {
  const apiKey = window.__firebase_config.apiKey
  const user = { uid: 'preview-uid', email: 'preview@example.invalid', emailVerified: true, displayName: 'Mauricio', isAnonymous: false, photoURL: null, providerData: [{ providerId: 'password', uid: 'preview@example.invalid', displayName: 'Mauricio', email: 'preview@example.invalid', phoneNumber: null, photoURL: null }], apiKey, appName: '[DEFAULT]', stsTokenManager: { refreshToken: 'preview-refresh', accessToken: ${JSON.stringify(ID_TOKEN)}, expirationTime: Date.now() + 36e5 * 24 * 30 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()) }
  const db = await new Promise((res, rej) => { const q = indexedDB.open('firebaseLocalStorageDb', 1); q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('firebaseLocalStorage')) q.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }) }; q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) })
  await new Promise((res, rej) => { const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: 'firebase:authUser:' + apiKey + ':[DEFAULT]', value: user }); tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
  db.close(); return 1 })()`)
await go('/start'); await sleep(1500)
await states('in')

fs.writeFileSync(path.join(OUT, 'snaps.json'), JSON.stringify(snaps))
fs.writeFileSync(path.join(OUT, 'capture-notes.json'), JSON.stringify({ when: new Date().toISOString(), blockedHosts: [...state.blocked], errors: state.errors.slice(0, 30) }, null, 1))
console.log('blocked', [...state.blocked], 'errors', state.errors.length)
ws.close()
