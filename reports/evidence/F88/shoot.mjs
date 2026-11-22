// F88 evidence: the top menu in a real Chrome (headless, DevTools protocol), at 1280 and 393, signed out and
// signed in (the harness seam of reports/evidence/visual-recheck-batch/2026-11-21: a hand-written stand-in
// account in the page's own IndexedDB, Firestore and the auth hosts blocked; no real login, nothing written).
//   Chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu
//           --hide-scrollbars --remote-debugging-port=9488 --user-data-dir=<scratch> about:blank
//   Vite:   npx vite --host 127.0.0.1 --port 5488 --strictPort
//   node reports/evidence/F88/shoot.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const PORT = 9488
const SITE = 'http://127.0.0.1:5488'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const SIZES = [{ tag: '1280', width: 1280, height: 800, mobile: false }, { tag: '393', width: 393, height: 852, mobile: true }]
const ROUTES = ['/start', '/albums', '/blend', '/saved-playlists', '/inventory', '/playlists', '/playlist-series']

const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const waiting = new Map()
let errors = []
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data)
  if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); return }
  if (d.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 240))
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error: ' + d.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 240))
})
const send = (method, params = {}) => new Promise((r, j) => { const i = ++seq; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (waiting.has(i)) { waiting.delete(i); j(new Error('no answer to ' + method)) } }, 30000) })
const run = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.result?.exceptionDetails) throw new Error(expression.slice(0, 80) + ' ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300))
  return r.result?.result?.value
}
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
await send('Network.setBlockedURLs', { urls: ['*firestore.googleapis.com*', '*identitytoolkit.googleapis.com*', '*securetoken.googleapis.com*'] })
const setSize = async (s) => {
  await send('Emulation.setDeviceMetricsOverride', { width: s.width, height: s.height, deviceScaleFactor: s.mobile ? 2 : 1, mobile: s.mobile })
  await send('Emulation.setTouchEmulationEnabled', { enabled: s.mobile })
}
const shot = async (name, clip) => {
  const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })
  fs.writeFileSync(path.join(here, name + '.png'), Buffer.from(r.result.data, 'base64'))
}
const go = async (url, ready) => {
  await send('Page.navigate', { url: SITE + url })
  for (let i = 0; i < 60; i++) { await sleep(250); if (await run(`!!(${ready})`).catch(() => false)) break }
  // the harness has no network to the auth hosts: the app's own toast «Authentication issue» would cover the account button
  await run(`(() => { const st = document.createElement('style'); st.textContent = '#toast-container{display:none!important}'; document.head.appendChild(st) })()`).catch(() => {})
  await sleep(500)
}
const WRITE_ACCOUNT = `(async () => {
  const apiKey = (window.__firebase_config && window.__firebase_config.apiKey) || 'API_KEY_PLACEHOLDER' // the page's own web config; never printed
  const exp = Date.now() + 36e5 * 24 * 365
  const user = { uid: 'test-uid-f88', email: 'tester@example.invalid', emailVerified: true, displayName: 'Test Account', isAnonymous: false, photoURL: null, providerData: [], apiKey, appName: '[DEFAULT]', stsTokenManager: { refreshToken: 'fake-refresh', accessToken: 'fake.access.token', expirationTime: exp }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()) }
  const db = await new Promise((res, rej) => { const q = indexedDB.open('firebaseLocalStorageDb', 1); q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('firebaseLocalStorage')) q.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }) }; q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) })
  await new Promise((res, rej) => { const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: 'firebase:authUser:' + apiKey + ':[DEFAULT]', value: user }); tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
  db.close()
})()`
const CLEAR_ACCOUNT = `(async () => { await new Promise((res) => { const q = indexedDB.deleteDatabase('firebaseLocalStorageDb'); q.onsuccess = res; q.onerror = res; q.onblocked = res }) })()`

const MEASURE = `(() => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10] }
  const vis = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const first = (sel) => [...document.querySelectorAll(sel)].find(vis) || null
  const bar = first('.top-menu__row, #phone-topbar')
  const inter = [...document.querySelectorAll('.top-menu a, .top-menu button, #phone-topbar a, #phone-topbar button, #phone-tabbar a')].filter(vis)
  const small = inter.filter((e) => { const b = e.getBoundingClientRect(); return b.width < 44 || b.height < 44 }).map((e) => (e.id || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height))
  return {
    url: location.pathname, iw: innerWidth, sw: document.documentElement.scrollWidth,
    current: [...document.querySelectorAll('.top-menu [aria-current], #phone-tabbar [aria-current]')].filter(vis).map((e) => e.textContent.trim()),
    title: document.querySelector('[data-screen-name]')?.textContent || null,
    header: r(bar), logo: r(first('.top-menu__logo, .phone-topbar__logo')), ms: r(first('nav.ms')),
    tabbar: r(document.querySelector('#phone-tabbar')), topbar: r(document.querySelector('#phone-topbar')),
    targetsBelow44: small, hasTopMenu: !!document.querySelector('.top-menu') && vis(document.querySelector('.top-menu')), hasPhoneShell: !!document.querySelector('#phone-topbar')
  }
})()`

const measures = {}
const record = async (key) => { measures[key] = { ...(await run(MEASURE)), errors: [...errors] } }

async function pass(size, acct) {
  await setSize(size)
  // leave the page first: its open connection to the auth database would hold the next write behind the last delete
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(800)
  await send('Storage.clearDataForOrigin', { origin: SITE, storageTypes: 'indexeddb,local_storage,session_storage' })
  await go('/start', 'document.querySelector("#userMenuBtn, #phoneMenuBtn")')
  if (acct === 'in') await run(WRITE_ACCOUNT)
  const desk = !size.mobile
  const who = acct === 'in' ? (desk ? ' && document.querySelector("[data-account-name]")' : ' && document.querySelector(".phone-avatar")') : ''
  const ready = (desk ? 'document.querySelector("#userMenuBtn")' : 'document.querySelector("#phoneMenuBtn")') + who
  // the panel / the phone's menu, open
  errors = []
  // the stand-in account does not outlive the first seconds of a page (the auth hosts are blocked): open the panel the moment it shows
  await send('Page.navigate', { url: SITE + '/albums' })
  await sleep(400)
  const trigger = desk ? '#userMenuBtn' : '#phoneMenuBtn'
  const shown = acct === 'in' ? (desk ? '[data-account-name]' : '.phone-avatar') : trigger
  await run(`new Promise((res) => { const t = setInterval(() => { if (document.querySelector('${shown}') && document.querySelector('${trigger}')) { clearInterval(t); document.querySelector('${trigger}').click(); res(true) } }, 25); setTimeout(() => { clearInterval(t); res(false) }, 20000) })`)
  await run(`(() => { const st = document.createElement('style'); st.textContent = '#toast-container{display:none!important}'; document.head.appendChild(st) })()`)
  if (desk) {
    await sleep(500)
    await shot(`panel-${acct}-1280`, { x: 640, y: 0, width: 640, height: 520 })
    measures[`panel-${acct}-1280`] = { ...(await run(`(() => { const p = document.querySelector('#userMenu'); const b = p.getBoundingClientRect(); return { open: !p.classList.contains('invisible'), rect: [b.left, b.top, b.width, b.height].map(Math.round), rows: [...p.querySelectorAll('[data-connection]')].map((c) => c.dataset.connection + ': ' + c.querySelector('[data-status]').textContent), buttons: [...p.querySelectorAll('button')].map((x) => x.textContent.trim() + ' ' + Math.round(x.getBoundingClientRect().height)), sw: document.documentElement.scrollWidth } })()`)), errors: [...errors] }
    await run('document.querySelector("#userMenuBtn").click()')
  } else {
    await sleep(700)
    await shot(`phone-menu-${acct}-393`)
    measures[`phone-menu-${acct}-393`] = { ...(await run(`(() => { const s = document.querySelector('#phone-menu'); return { open: !!s, rows: [...s.querySelectorAll('[data-connection]')].map((c) => c.dataset.connection + ': ' + c.querySelector('[data-status]').textContent), targetsBelow44: [...s.querySelectorAll('button, a')].filter((e) => { const b = e.getBoundingClientRect(); return b.width < 44 || b.height < 44 }).map((e) => e.textContent.trim() + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)), sw: document.documentElement.scrollWidth } })()`)), errors: [...errors] }
  }
  for (const route of ROUTES) {
    errors = []
    await go(route, ready)
    const tag = `${acct}-${route.slice(1)}-${size.tag}`
    await record(tag)
    if (desk) await shot('bar-' + tag, { x: 0, y: 0, width: 1280, height: 190 })
    else await shot('phone-' + tag)
  }
}

// the home next to the app: the same bar, measured
async function home(size, acct) {
  await setSize(size)
  await go('/home', 'document.querySelector("#eqbar i")')
  if (acct === 'in') await run('document.documentElement.classList.add("in")')
  await sleep(300)
  const m = await run(`(() => { const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10] }; return { header: r(document.querySelector('header.top .wrap')), logo: r(document.querySelector('.logo')), ms: r(document.querySelector('nav.ms')), thread: r(document.querySelector('.thread')), sw: document.documentElement.scrollWidth, iw: innerWidth } })()`)
  measures[`home-${acct}-${size.tag}`] = m
  await shot(`home-${acct}-${size.tag}`, size.mobile ? undefined : { x: 0, y: 0, width: 1280, height: 190 })
}

if (process.argv[2] === 'panel-in') {
  // the computer's panel, signed in: the stand-in account is dropped within a second of a page (the auth hosts are blocked),
  // so the panel is opened and captured at once, and the page's own state at that moment is recorded
  Object.assign(measures, JSON.parse(fs.readFileSync(path.join(here, 'measures.json'), 'utf8')))
  await setSize(SIZES[0])
  await send('Page.navigate', { url: 'about:blank' }); await sleep(800)
  await send('Storage.clearDataForOrigin', { origin: SITE, storageTypes: 'indexeddb,local_storage,session_storage' })
  await go('/start', 'document.querySelector("#userMenuBtn")')
  await run(WRITE_ACCOUNT)
  await send('Page.navigate', { url: SITE + '/start' })
  await sleep(300)
  const ok = await run(`new Promise((res) => { const t = setInterval(() => { if (document.querySelector('[data-account-name]') && document.querySelector('#userMenuBtn')) { clearInterval(t); document.querySelector('#toast-container') && (document.querySelector('#toast-container').style.display = 'none'); document.querySelector('#userMenuBtn').click(); res(true) } }, 10); setTimeout(() => { clearInterval(t); res(false) }, 20000) })`)
  await sleep(230)
  await shot('panel-in-1280', { x: 640, y: 0, width: 640, height: 520 })
  measures['panel-in-1280'] = { signedInAtClick: ok, ...(await run(`(() => { const p = document.querySelector('#userMenu'); const b = p.getBoundingClientRect(); return { open: !p.classList.contains('invisible'), signedInNow: !!document.querySelector('[data-account-name]'), rect: [b.left, b.top, b.width, b.height].map(Math.round), who: p.querySelector('.top-panel__who').innerText.replace(/\\s+/g, ' '), rows: [...p.querySelectorAll('[data-connection]')].map((c) => c.dataset.connection + ': ' + c.querySelector('[data-status]').textContent), buttons: [...p.querySelectorAll('button')].map((x) => x.textContent.trim() + ' ' + Math.round(x.getBoundingClientRect().height)) } })()`).catch((e) => ({ error: String(e).slice(0, 120) }))) }
  fs.writeFileSync(path.join(here, 'measures.json'), JSON.stringify(measures, null, 1))
  await send('Storage.clearDataForOrigin', { origin: SITE, storageTypes: 'indexeddb,local_storage,session_storage' }).catch(() => { })
  console.log('panel-in done', ok)
  process.exit(0)
}
for (const size of SIZES) for (const acct of ['out', 'in']) await pass(size, acct)
for (const size of SIZES) for (const acct of ['out', 'in']) await home(size, acct)
await send('Storage.clearDataForOrigin', { origin: SITE, storageTypes: 'indexeddb,local_storage,session_storage' }).catch(() => { })
fs.writeFileSync(path.join(here, 'measures.json'), JSON.stringify(measures, null, 1))
console.log('done', Object.keys(measures).length, 'measures')
ws.close()
