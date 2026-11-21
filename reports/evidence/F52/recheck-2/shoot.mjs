#!/usr/bin/env node
/**
 * Independent visual recheck, UAT-244 (F52) / UAT-245 (F69): captures and measures of the album window
 * with a failed source, 1280 x 800 and 393 x 852 (touch, scale 2), before, while asking and after «Try again».
 *   vite --port 5412 --strictPort --host 127.0.0.1 .   (worktree root)
 *   PROFILE_DIR=<scratch dir> node reports/evidence/F52/recheck/shoot.mjs [port] [debugPort]
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = process.env.OUT_DIR
const port = process.argv[2] || '5412'
const DEBUG_PORT = Number(process.argv[3] || 9412)
const PROFILE = process.env.PROFILE_DIR
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PAGE = `http://127.0.0.1:${port}/reports/evidence/F52/recheck/harness/recheck.html`
const SIZES = [{ name: '1280', width: 1280, height: 800, mobile: false }, { name: '393', width: 393, height: 852, mobile: true }]
const CASES = [
    { id: 'ratings', q: 'fail=ratings', notice: '.ratings-notice', click: true },
    { id: 'popularity', q: 'fail=popularity', notice: '.popularity-notice', click: true },
    { id: 'both', q: 'fail=both', notice: '.ratings-notice', click: false },
    { id: 'ratings-fails-again', q: 'fail=ratings&retry=failed', notice: '.ratings-notice', click: true },
    { id: 'popularity-with-spotifyid', q: 'fail=popularity&spotify=1', notice: '.popularity-notice', click: false }
]
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function connect(wsUrl, log) {
    const ws = new WebSocket(wsUrl)
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
    let id = 0; const waiting = new Map()
    ws.onmessage = (e) => {
        const m = JSON.parse(e.data)
        if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); return }
        if (m.method === 'Runtime.exceptionThrown') log.push('EXCEPTION ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text))
        if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) log.push(m.params.type + ' ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200))
    }
    const send = (method, params = {}) => new Promise((res, rej) => { const mine = ++id; waiting.set(mine, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id: mine, method, params })) })
    return { send }
}

const MEASURE = (sel) => `(() => {
  const n = document.querySelector(${JSON.stringify(sel)}); if (!n) return { present: false, ratings: !!document.querySelector('.ratings-notice'), popularity: !!document.querySelector('.popularity-notice') }
  const r = n.getBoundingClientRect(); const b = n.querySelector('button'); const br = b && b.getBoundingClientRect(); const s = n.querySelector('span')
  const cs = (el) => { const c = getComputedStyle(el); return { color: c.color, bg: c.backgroundColor, font: c.fontSize + ' ' + c.fontWeight + ' ' + c.fontFamily.split(',')[0] } }
  // background under the notice: walk up to the first opaque background
  let up = n.parentElement, under = null; while (up) { const bg = getComputedStyle(up).backgroundColor; if (bg && bg !== 'rgba(0, 0, 0, 0)') { under = bg; break } up = up.parentElement }
  const scroller = (() => { let e = n.parentElement; while (e) { const o = getComputedStyle(e).overflowY; if ((o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight) return e; e = e.parentElement } return null })()
  return { present: true, text: n.textContent.trim().replace(/\\s+/g, ' '),
    box: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) },
    inViewport: r.top >= 0 && r.bottom <= innerHeight, innerWidth, innerHeight, scrollWidth: document.documentElement.scrollWidth,
    notice: cs(n), text_: s && cs(s), under, button: b && { label: b.textContent, w: Math.round(br.width), h: Math.round(br.height), right: Math.round(br.right), ...cs(b) },
    spanClipped: s ? s.scrollWidth > s.clientWidth + 1 : null, scrollerTop: scroller ? scroller.scrollTop : null,
    ratings: !!document.querySelector('.ratings-notice'), popularity: !!document.querySelector('.popularity-notice'),
    trackRows: document.querySelectorAll('tr, .tracks-tabs li, [data-track]').length, listTop: Math.round(([...document.querySelectorAll('.tracks-tabs-container, .tracks-table-container')].find(e => e.offsetParent) || { getBoundingClientRect: () => ({ top: -1 }) }).getBoundingClientRect().top) }
})()`

async function main() {
    fs.mkdirSync(PROFILE, { recursive: true })
    const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${DEBUG_PORT}`, 'about:blank'], { stdio: 'ignore' })
    const out = {}; const log = []
    try {
        let target
        for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json()).find(t => t.type === 'page') } catch {} }
        const page = await connect(target.webSocketDebuggerUrl, log)
        await page.send('Page.enable'); await page.send('Runtime.enable')
        const ev = async (expression) => (await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value
        const shot = async (file, full = false) => { const s = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full }); fs.writeFileSync(path.join(here, file), Buffer.from(s.data, 'base64')) }
        for (const size of SIZES) {
            await page.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
            await page.send('Emulation.setTouchEmulationEnabled', { enabled: size.mobile })
            for (const c of CASES) {
                const key = `${c.id}-${size.name}`
                await page.send('Page.navigate', { url: `${PAGE}?${c.q}` })
                for (let i = 0; i < 60 && !(await ev('window.harnessReady === true')); i++) await sleep(250)
                await sleep(1200)
                const rec = { before: await ev(MEASURE(c.notice)) }
                await shot(`${key}.png`)
                if (c.click && rec.before.present) {
                    const at = await ev(`(() => { const r = document.querySelector(${JSON.stringify(c.notice + ' button')}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
                    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await page.send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', clickCount: 1 })
                    await sleep(150)
                    rec.asking = { state: await ev('window.harnessState'), m: await ev(MEASURE(c.notice)) }
                    await shot(`${key}-asking.png`)
                    await sleep(2000)
                    rec.after = { state: await ev('window.harnessState'), m: await ev(MEASURE(c.notice)) }
                    await shot(`${key}-after.png`)
                }
                out[key] = rec
            }
        }
        out._console = log
        fs.writeFileSync(path.join(here, 'measures.json'), JSON.stringify(out, null, 1))
        console.log('done', Object.keys(out).length)
    } finally { chrome.kill() }
}
main().catch(e => { console.error(e); process.exit(1) })
