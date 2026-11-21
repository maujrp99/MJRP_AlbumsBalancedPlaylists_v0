#!/usr/bin/env node
/**
 * UAT-244 (F52) and UAT-245 (F69): screenshots of the album window with a failed source, 1280 and 393.
 *   npx vite --port 5411 --strictPort --host 127.0.0.1 .      (from the worktree root)
 *   node reports/evidence/F52/shoot.mjs [port=5411] [debugPort=9411]
 * Headless Chrome over the DevTools protocol, after reports/evidence/visual-recheck-batch/2026-11-21/albums/shoot.mjs.
 * Writes F52/ratings-failed-*.png and F69/popularity-failed-*.png, and notes.json beside each.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const port = process.argv[2] || '5411'
const DEBUG_PORT = Number(process.argv[3] || 9411)
const PROFILE = '/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/chrome-failed-sources-profile'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PAGE = `http://127.0.0.1:${port}/reports/evidence/F52/harness/failed-sources.html`
const SIZES = [{ name: '1280', width: 1280, height: 800, mobile: false }, { name: '393', width: 393, height: 852, mobile: true }]
const CASES = [{ fail: 'ratings', dir: 'F52', file: 'ratings-failed', notice: '.ratings-notice' }, { fail: 'popularity', dir: 'F69', file: 'popularity-failed', notice: '.popularity-notice' }]
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function connect(wsUrl, log) {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
    let id = 0
    const waiting = new Map()
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.id && waiting.has(message.id)) { waiting.get(message.id)(message); waiting.delete(message.id); return }
        if (message.method === 'Runtime.exceptionThrown') log.push('EXCEPTION ' + (message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text))
        if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) log.push(message.params.type.toUpperCase() + ' ' + message.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300))
    }
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const mine = ++id
        waiting.set(mine, (message) => message.error ? reject(new Error(method + ': ' + message.error.message)) : resolve(message.result))
        ws.send(JSON.stringify({ id: mine, method, params }))
    })
    return { send }
}

async function main() {
    fs.mkdirSync(PROFILE, { recursive: true })
    const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${DEBUG_PORT}`, 'about:blank'], { stdio: 'ignore' })
    const notes = {}
    const log = []
    try {
        let target
        for (let i = 0; i < 40 && !target; i++) {
            await sleep(250)
            try { target = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json()).find(t => t.type === 'page') } catch { /* not up yet */ }
        }
        const page = await connect(target.webSocketDebuggerUrl, log)
        await page.send('Page.enable'); await page.send('Runtime.enable')
        const evaluate = async (expression) => (await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value
        for (const size of SIZES) {
            await page.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
            await page.send('Emulation.setTouchEmulationEnabled', { enabled: size.mobile })
            for (const one of CASES) {
                await page.send('Page.navigate', { url: `${PAGE}?fail=${one.fail}` })
                for (let i = 0; i < 60 && !(await evaluate('window.harnessReady === true')); i++) await sleep(250)
                await sleep(1200) // the comparison draws on a timer
                await evaluate(`document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important }</style>')`)
                await sleep(300)
                const read = `(() => { const n = document.querySelector(${JSON.stringify(one.notice)}); const r = n && n.getBoundingClientRect(); return n ? { text: n.textContent.trim().replace(/\\s+/g, ' '), button: n.querySelector('button')?.textContent, width: Math.round(r.width), right: Math.round(r.right), innerWidth, scrollWidth: document.documentElement.scrollWidth, otherNotice: !!document.querySelector(${JSON.stringify(one.notice === '.ratings-notice' ? '.popularity-notice' : '.ratings-notice')}) } : null })()`
                const before = await evaluate(read)
                const shot = await page.send('Page.captureScreenshot', { format: 'png' })
                fs.writeFileSync(path.join(here, '..', one.dir, `${one.file}-${size.name}.png`), Buffer.from(shot.data, 'base64'))
                const at = await evaluate(`(() => { const b = document.querySelector(${JSON.stringify(one.notice + ' button')}); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
                for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await page.send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', clickCount: 1 })
                await sleep(1500)
                const after = await evaluate(`!!document.querySelector(${JSON.stringify(one.notice)})`)
                notes[`${one.file}-${size.name}`] = { before, noticeStillThereAfterTryAgain: after }
            }
        }
        notes._console = log
        for (const dir of ['F52', 'F69']) {
            const own = Object.fromEntries(Object.entries(notes).filter(([key]) => key.startsWith(dir === 'F52' ? 'ratings' : 'popularity')))
            fs.writeFileSync(path.join(here, '..', dir, 'notes.json'), JSON.stringify({ ...own, _console: log }, null, 1))
        }
        console.log(JSON.stringify(notes, null, 1))
    } finally {
        chrome.kill()
    }
}
main().catch(error => { console.error(error); process.exit(1) })
