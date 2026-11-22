// F88 evidence: (1) the phone's bottom bar of the home and of the app, measured at 393; (2) the passage at 800 px (between the app's
// 768 and the home's 899): the home keeps its bottom bar up to 899 px, the app shows its top bar from 768 px. Same Chrome and Vite as shoot.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const SITE = 'http://127.0.0.1:5488'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const target = await (await fetch('http://127.0.0.1:9488/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const waiting = new Map()
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id) } })
const send = (method, params = {}) => new Promise((r, j) => { const i = ++seq; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (waiting.has(i)) { waiting.delete(i); j(new Error('no answer to ' + method)) } }, 30000) })
const run = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
await send('Network.setBlockedURLs', { urls: ['*firestore.googleapis.com*', '*identitytoolkit.googleapis.com*', '*securetoken.googleapis.com*'] })
const shot = async (name, clip) => { const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); fs.writeFileSync(path.join(here, name + '.png'), Buffer.from(r.result.data, 'base64')) }
const go = async (url) => { await send('Page.navigate', { url: SITE + url }); await sleep(4500); await run(`(() => { const st = document.createElement('style'); st.textContent = '#toast-container{display:none!important}'; document.head.appendChild(st) })()`) }
const R = `(e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10] }`
const out = {}

await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true })
await go('/home')
out.home393 = await run(`(${R})(document.querySelector('.thread'))`)
await go('/start')
out.app393 = { tabbar: await run(`(${R})(document.querySelector('#phone-tabbar'))`), topbar: await run(`(${R})(document.querySelector('#phone-topbar'))`), bodyPaddingBottom: await run(`getComputedStyle(document.body).paddingBottom`) }

await send('Emulation.setDeviceMetricsOverride', { width: 800, height: 900, deviceScaleFactor: 1, mobile: false })
await go('/home')
out.home800 = { bar: await run(`(${R})(document.querySelector('nav.ms'))`), thread: await run(`(${R})(document.querySelector('.thread'))`), header: await run(`(${R})(document.querySelector('header.top'))`) }
await shot('home-out-800-top', { x: 0, y: 0, width: 800, height: 190 })
await shot('home-out-800-bottom', { x: 0, y: 760, width: 800, height: 140 })
await go('/start')
out.app800 = { bar: await run(`(${R})(document.querySelector('nav.ms'))`), header: await run(`(${R})(document.querySelector('.top-menu__row'))`) }
await shot('bar-out-start-800', { x: 0, y: 0, width: 800, height: 190 })
fs.writeFileSync(path.join(here, 'heights.json'), JSON.stringify(out, null, 1))

const uri = (n) => 'data:image/png;base64,' + fs.readFileSync(path.join(here, n + '.png')).toString('base64')
const html = `<style>body{margin:0;background:#222;color:#fff;font:600 14px system-ui}figcaption{padding:6px 10px;background:#000}figure{margin:0 0 6px}img{display:block}</style><figure><figcaption>The home, 800 px: top of the page (no bar in the header) and its bottom bar</figcaption><img src="${uri('home-out-800-top')}"><img src="${uri('home-out-800-bottom')}"></figure><figure><figcaption>The app, /start, 800 px: the bar is in the header</figcaption><img src="${uri('bar-out-start-800')}"></figure>`
await send('Emulation.setDeviceMetricsOverride', { width: 800, height: 600, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) })
await sleep(1200)
await shot('passage-out-800')
console.log(JSON.stringify(out))
ws.close()
