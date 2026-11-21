// Shared helpers: DevTools-protocol client (Node's own WebSocket), the measures, the screenshot.
// Chrome is started by hand with --remote-debugging-port=9404; nothing here installs or deploys anything.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const here = path.dirname(fileURLToPath(import.meta.url))
export const PORT = 9404
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
export const SIZES = [
  { tag: '1280', width: 1280, height: 800, mobile: false },
  { tag: '393', width: 393, height: 852, mobile: true }
]

export async function openPage() {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  let id = 0; const wait = new Map(); const errors = []
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data)
    if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); return }
    if (d.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 300))
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error: ' + d.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300))
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errors.push('log: ' + d.params.entry.text.slice(0, 200) + ' ' + (d.params.entry.url || ''))
  })
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
  const run = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${JSON.stringify(r.result.exceptionDetails).slice(0, 300)}`)
    return r.result?.result?.value
  }
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable')
  const setSize = async (s) => {
    await send('Emulation.setDeviceMetricsOverride', { width: s.width, height: s.height, deviceScaleFactor: s.mobile ? 2 : 1, mobile: s.mobile })
    await send('Emulation.setTouchEmulationEnabled', { enabled: s.mobile })
  }
  return { send, run, errors, setSize, close: () => ws.close() }
}

export const MEASURE = (phone) => `(() => {
  const phone = ${phone};
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).split(' ').slice(0, 2).join('.')) + ' «' + (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 24) + '»'
  const all = [...document.querySelectorAll('body *')].filter(visible)
  const past = all.filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
  const inter = all.filter((el) => el.matches('a, button, input, select, [role=button]') && !(el.tagName === 'INPUT' && /^(hidden)$/.test(el.type)))
  const small = inter.filter((el) => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44 })
  const smallText = all.filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12)
  const fields = all.filter((el) => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !/^(checkbox|radio|range|hidden)$/.test(el.type))
  const small16 = fields.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
  const h1 = document.querySelector('h1'); const p = document.querySelector('p')
  return {
    url: location.href, innerWidth, scrollWidth: document.documentElement.scrollWidth, title: document.title,
    pastRightEdge: { count: past.length, samples: past.slice(0, 5).map((el) => name(el) + ' right=' + Math.round(el.getBoundingClientRect().right)) },
    targetsBelow44: phone ? { of: inter.length, count: small.length, samples: small.slice(0, 10).map((el) => { const r = el.getBoundingClientRect(); return name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) }) } : 'phone only',
    textBelow12px: { count: smallText.length, samples: smallText.slice(0, 6).map((el) => name(el) + ' ' + getComputedStyle(el).fontSize) },
    inputsBelow16px: phone ? { of: fields.length, count: small16.length, samples: small16.slice(0, 6).map((el) => name(el) + ' ' + getComputedStyle(el).fontSize) } : 'phone only',
    fontFamily: { h1: h1 ? getComputedStyle(h1).fontFamily : null, body: getComputedStyle(document.body).fontFamily, firstP: p ? getComputedStyle(p).fontFamily : null }
  }
})()`

const FREEZE = `(() => { document.querySelectorAll('.last-update').forEach((el) => { el.textContent = 'Last updated: (frozen)' }); if (!document.getElementById('__freeze')) document.head.insertAdjacentHTML('beforeend', '<style id="__freeze">*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; transition: none !important; caret-color: transparent !important }</style>') })()`

export const outDir = here
export const measures = {}
export async function capture(page, size, name, extra = {}) {
  await page.run(FREEZE)
  await sleep(300)
  const m = await page.run(MEASURE(size.mobile))
  m.consoleErrors = [...new Set(page.errors)]
  Object.assign(m, extra)
  const file = `${name}-${size.tag}.png`
  measures[file] = m
  const shot = await page.send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(outDir, file), Buffer.from(shot.result.data, 'base64'))
  console.log(file, '->', m.url, 'sw=' + m.scrollWidth, 'errs=' + m.consoleErrors.length)
}
export const saveMeasures = (file) => fs.writeFileSync(path.join(outDir, file), JSON.stringify(measures, null, 1))
