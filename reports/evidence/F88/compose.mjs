// F88 evidence: the home and the app side by side (computer: stacked bars at 1280, one over the other; phone: two
// screens next to each other), made from the captures of shoot.mjs. Same Chrome as shoot.mjs (port 9488).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const PORT = 9488
const uri = (name) => 'data:image/png;base64,' + fs.readFileSync(path.join(here, name + '.png')).toString('base64')
const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const waiting = new Map()
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id) } })
const send = (method, params = {}) => new Promise((r) => { const i = ++seq; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })

async function page(name, html, width, height) {
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) })
  await new Promise((r) => setTimeout(r, 1200))
  const r = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(here, name + '.png'), Buffer.from(r.result.data, 'base64'))
}

const style = '<style>body{margin:0;background:#222;color:#fff;font:600 14px system-ui}figure{margin:0 0 6px}figcaption{padding:6px 10px;background:#000}img{display:block}.row{display:flex;gap:16px;align-items:flex-start;padding:0}</style>'
for (const acct of ['out', 'in']) {
  await page(`passage-${acct}-1280`,
    `${style}<figure><figcaption>The home (${acct === 'out' ? 'signed out' : 'signed in'}), 1280 px</figcaption><img src="${uri('home-' + acct + '-1280')}"></figure><figure><figcaption>The app, /start, same width</figcaption><img src="${uri('bar-' + acct + '-start-1280')}"></figure>`, 1280, 440)
  await page(`passage-${acct}-393`,
    `${style}<div class="row"><figure><figcaption>The home</figcaption><img width="393" src="${uri('home-' + acct + '-393')}"></figure><figure><figcaption>The app, /start</figcaption><img width="393" src="${uri('phone-' + acct + '-start-393')}"></figure></div>`, 820, 880)
}
ws.close()
console.log('composed')
