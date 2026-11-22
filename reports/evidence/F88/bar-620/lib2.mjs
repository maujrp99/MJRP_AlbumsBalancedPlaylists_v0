// Independent judge's CDP helper for the F80+F88 recheck. Chrome on 9494, Vite on 5498 (branch feat/f88-top-menu-build, 481ec94).
// Seams: a stand-in account (IndexedDB record + the auth lookup/refresh answered locally), MusicKit stand-in + /api/musickit-token
// answered locally, Spotify token in localStorage + /v1/me answered locally. Firestore and every other outside host are failed.
// Nothing leaves the machine except Google Fonts; nothing is written anywhere but this local browser profile.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const here = path.dirname(fileURLToPath(import.meta.url))
export const CAP = '/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/.claude/worktrees/agent-a8a3762f6158bf0b1/reports/evidence/F88/bar-620'
export const SITE = 'http://127.0.0.1:5498'
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b64 = (s) => Buffer.from(typeof s === 'string' ? s : JSON.stringify(s)).toString('base64')
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')

export const state = { apple: 'connected', appleDelay: 0, errors: [], allowAll: false, signedIn: false }
const now = Math.floor(Date.now() / 1000)
export const ID_TOKEN = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({ iss: 'https://securetoken.google.com/x', aud: 'x', auth_time: now, user_id: 'judge-uid-f88', sub: 'judge-uid-f88', iat: now, exp: now + 3600 * 24 * 30, email: 'judge@example.invalid', email_verified: true, firebase: { identities: {}, sign_in_provider: 'password' } })}.c2ln`

export async function connect() {
  const target = await (await fetch('http://127.0.0.1:9494/json/new?about:blank', { method: 'PUT' })).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  let seq = 0
  const waiting = new Map()
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++seq; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (waiting.has(i)) { waiting.delete(i); j(new Error('no answer to ' + method)) } }, 45000) })
  const cors = [{ name: 'access-control-allow-origin', value: SITE }, { name: 'access-control-allow-credentials', value: 'true' }, { name: 'access-control-allow-headers', value: '*' }, { name: 'access-control-allow-methods', value: 'GET,POST,OPTIONS' }, { name: 'content-type', value: 'application/json' }]
  const json = (id, code, body) => send('Fetch.fulfillRequest', { requestId: id, responseCode: code, body: b64(body), responseHeaders: cors })
  ws.addEventListener('message', async (m) => {
    const d = JSON.parse(m.data)
    if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); return }
    if (d.method === 'Runtime.exceptionThrown') state.errors.push('exception: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 300))
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') state.errors.push('console.error: ' + d.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300))
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') state.errors.push('log: ' + d.params.entry.text.slice(0, 200) + ' ' + (d.params.entry.url || '').slice(0, 120))
    if (d.method === 'Fetch.requestPaused') {
      const id = d.params.requestId
      const url = d.params.request.url
      const method = d.params.request.method
      try {
        if (state.allowAll || url.startsWith(SITE) || url.startsWith('data:') || url.startsWith('file:') || /fonts\.(googleapis|gstatic)\.com/.test(url)) {
          if (url.includes('/api/musickit-token')) {
            if (state.apple === 'failed') return void json(id, 500, { error: 'no token (judge harness)' })
            if (state.appleDelay) await sleep(state.appleDelay)
            return void json(id, 200, { token: 'judge-harness-token' })
          }
          return void send('Fetch.continueRequest', { requestId: id })
        }
        if (method === 'OPTIONS') return void send('Fetch.fulfillRequest', { requestId: id, responseCode: 204, responseHeaders: cors })
        if (state.signedIn && url.includes('identitytoolkit.googleapis.com') && url.includes('accounts:lookup')) {
          return void json(id, 200, { kind: 'identitytoolkit#GetAccountInfoResponse', users: [{ localId: 'judge-uid-f88', email: 'judge@example.invalid', displayName: 'Test Account', emailVerified: true, providerUserInfo: [{ providerId: 'password', email: 'judge@example.invalid', federatedId: 'judge@example.invalid', rawId: 'judge@example.invalid' }], validSince: String(now - 100), lastLoginAt: String(Date.now()), createdAt: String(Date.now()) }] })
        }
        if (state.signedIn && url.includes('securetoken.googleapis.com')) {
          return void json(id, 200, { access_token: ID_TOKEN, expires_in: '3600', token_type: 'Bearer', refresh_token: 'judge-refresh', id_token: ID_TOKEN, user_id: 'judge-uid-f88', project_id: 'x' })
        }
        if (url.includes('api.spotify.com/v1/me')) return void json(id, 200, { display_name: 'Test Listener', id: 'judge' })
        return void send('Fetch.failRequest', { requestId: id, errorReason: 'BlockedByClient' })
      } catch (e) { /* page left */ }
    }
  })
  const run = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) throw new Error(expression.slice(0, 80) + ' ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300))
    return r.result?.result?.value
  }
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable')
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
  return { ws, send, run }
}

export function helpers({ send, run }) {
  const size = async (w, h, mobile) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile })
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile })
  }
  const shot = async (name, clip) => {
    const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })
    fs.writeFileSync(path.join(CAP, name + '.png'), Buffer.from(r.result.data, 'base64'))
  }
  const go = async (url, ready = 'document.readyState === "complete"', extra = 600) => {
    await send('Page.navigate', { url: url.startsWith('http') || url.startsWith('file') ? url : SITE + url })
    for (let i = 0; i < 80; i++) { await sleep(200); if (await run(`!!(${ready})`).catch(() => false)) break }
    await sleep(extra)
  }
  const hideToasts = () => run(`(() => { const st = document.createElement('style'); st.textContent = '#toast-container{display:none!important}'; document.head.appendChild(st) })()`).catch(() => {})
  const clear = async () => {
    await send('Page.navigate', { url: 'about:blank' }); await sleep(500)
    await send('Storage.clearDataForOrigin', { origin: SITE, storageTypes: 'all' })
  }
  const writeAccount = () => run(`(async () => {
    const apiKey = (window.__firebase_config && window.__firebase_config.apiKey) || (window.firebase?.app?.().options?.apiKey)
    const exp = Date.now() + 36e5 * 24 * 30
    const user = { uid: 'judge-uid-f88', email: 'judge@example.invalid', emailVerified: true, displayName: 'Test Account', isAnonymous: false, photoURL: null, providerData: [{ providerId: 'password', uid: 'judge@example.invalid', displayName: 'Test Account', email: 'judge@example.invalid', phoneNumber: null, photoURL: null }], apiKey, appName: '[DEFAULT]', stsTokenManager: { refreshToken: 'judge-refresh', accessToken: ${JSON.stringify(ID_TOKEN)}, expirationTime: exp }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()) }
    const db = await new Promise((res, rej) => { const q = indexedDB.open('firebaseLocalStorageDb', 1); q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('firebaseLocalStorage')) q.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }) }; q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) })
    await new Promise((res, rej) => { const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: 'firebase:authUser:' + apiKey + ':[DEFAULT]', value: user }); tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
    db.close(); return !!apiKey
  })()`)
  return { size, shot, go, hideToasts, clear, writeAccount }
}

export const MUSICKIT_STUB = (authorized) => `(() => { let auth = ${authorized}; const inst = { get isAuthorized() { return auth }, authorize: async () => { auth = true; return 'judge-user-token' }, unauthorize: async () => { auth = false }, storefrontId: 'us', api: { music: async () => ({ data: { data: [] } }) } }; window.MusicKit = { configure: async () => inst, getInstance: () => inst } })()`

export const R = `(e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10] }`
export const CONTRAST = `(() => { const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) }; return (fg, bg) => { const a = lum(fg), b = lum(bg); return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 10) / 10 } })()`
export const save = (name, obj) => fs.writeFileSync(path.join(here, name), JSON.stringify(obj, null, 1))
