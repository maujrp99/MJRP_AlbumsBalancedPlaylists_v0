// F88 evidence: the Apple Music row in each state, the real app code, with ONE seam: the MusicKit library of Apple is a stand-in
// (window.MusicKit with the `isAuthorized` MusicKit keeps from an earlier visit) and the app's own token route (/api/musickit-token)
// is answered by the harness (quickly, late, or with an error). Nothing leaves the machine; no real Apple account.
//   node reports/evidence/F88/apple.mjs     (Chrome on 9488 and Vite on 5488, as shoot.mjs)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const PORT = 9488
const SITE = 'http://127.0.0.1:5488'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const waiting = new Map()
let mode = 'connected'
ws.addEventListener('message', async (m) => {
  const d = JSON.parse(m.data)
  if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); return }
  if (d.method === 'Fetch.requestPaused') {
    const id = d.params.requestId
    if (mode === 'failed') return void send('Fetch.fulfillRequest', { requestId: id, responseCode: 500, body: btoa(JSON.stringify({ error: 'no token' })), responseHeaders: [{ name: 'content-type', value: 'application/json' }] })
    if (mode === 'checking') await sleep(8000)
    send('Fetch.fulfillRequest', { requestId: id, responseCode: 200, body: btoa(JSON.stringify({ token: 'harness-token' })), responseHeaders: [{ name: 'content-type', value: 'application/json' }] })
  }
})
const send = (method, params = {}) => new Promise((r, j) => { const i = ++seq; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (waiting.has(i)) { waiting.delete(i); j(new Error('no answer to ' + method)) } }, 30000) })
const run = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Fetch.enable', { patterns: [{ urlPattern: '*musickit-token*' }] })
await send('Network.setBlockedURLs', { urls: ['*firestore.googleapis.com*', '*identitytoolkit.googleapis.com*', '*securetoken.googleapis.com*'] })

const STUB = (authorized) => `window.MusicKit = { configure: async () => {}, getInstance: () => ({ isAuthorized: ${authorized}, authorize: async () => 'stand-in', unauthorize: async () => {}, storefrontId: 'us' }) }`
const measures = {}
async function state(name, size, authorized) {
  await send('Emulation.setDeviceMetricsOverride', { width: size.w, height: size.h, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
  const added = await send('Page.addScriptToEvaluateOnNewDocument', { source: STUB(authorized) })
  await send('Page.navigate', { url: SITE + '/albums' })
  await sleep(4500)
  await run(`(() => { const st = document.createElement('style'); st.textContent = '#toast-container{display:none!important}'; document.head.appendChild(st) })()`)
  await run(size.mobile ? 'document.querySelector("#phoneMenuBtn").click()' : 'document.querySelector("#userMenuBtn").click()')
  await sleep(name === 'checking' ? 700 : 1500)
  const r = await send('Page.captureScreenshot', { format: 'png', ...(size.mobile ? {} : { clip: { x: 640, y: 0, width: 640, height: 420, scale: 1 } }) })
  fs.writeFileSync(path.join(here, `apple-${name}-${size.tag}.png`), Buffer.from(r.result.data, 'base64'))
  measures[`${name}-${size.tag}`] = await run(`[...document.querySelectorAll('[data-connection]')].map((c) => c.dataset.connection + ': ' + c.querySelector('[data-status]').textContent + ' | ' + [...c.querySelectorAll('button')].map((b) => b.getAttribute('aria-label')).join(','))`)
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: added.result.identifier })
}
for (const [name, m, authorized] of [['authorized-earlier', 'connected', true], ['not-authorized', 'connected', false], ['checking', 'checking', true], ['failed', 'failed', false]]) {
  mode = m
  for (const size of [{ tag: '1280', w: 1280, h: 800, mobile: false }, { tag: '393', w: 393, h: 852, mobile: true }]) await state(name, size, authorized)
}
fs.writeFileSync(path.join(here, 'apple-measures.json'), JSON.stringify(measures, null, 1))
console.log('apple done')
ws.close()
