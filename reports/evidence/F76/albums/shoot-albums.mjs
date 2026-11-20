#!/usr/bin/env node
/**
 * F76 TASK-02 evidence: the albums screen through its harness (harness/albums.html), at 393x852 as
 * a phone and at 1280x800 as a computer. Screenshots and measures per scenario, sheets included.
 *   node reports/evidence/F76/albums/shoot-albums.mjs <label> [port] [debugPort]
 * Writes <label>/<scenario>-<size>.png and <label>/measures.json. Headless Chrome over the DevTools
 * protocol, as ../shoot.mjs (no dependency).
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const label = process.argv[2] || 'after'
const port = process.argv[3] || '5241'
const DEBUG_PORT = Number(process.argv[4] || 9471)
const out = path.join(here, label)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PHONE = { name: '393x852', width: 393, height: 852, mobile: true }
const COMPUTER = { name: '1280x800', width: 1280, height: 800, mobile: false }

// [name, query, what to do after load (in the page), sizes]
const SCENARIOS = [
    ['grid-all', '', '', [PHONE, COMPUTER]],
    ['list-all', 'view=list', '', [PHONE, COMPUTER]],
    ['single', 'scope=single', '', [PHONE, COMPUTER]],
    ['filters-on', 'filters=1', '', [PHONE, COMPUTER]],
    ['scroll-mode', 'paging=scroll', '', [PHONE, COMPUTER]],
    ['loading', 'state=loading', '', [PHONE, COMPUTER]],
    ['empty', 'state=empty', '', [PHONE, COMPUTER]],
    ['pager-bottom', '', 'window.scrollTo(0, document.documentElement.scrollHeight)', [PHONE]],
    ['sheet-filters', 'filters=1', 'document.querySelector(".filters-phone-button").click()', [PHONE]],
    ['sheet-album', '', 'document.querySelector(".album-more").click()', [PHONE]],
    ['sheet-series', '', 'document.querySelector(".series-group-header .series-more").click()', [PHONE]],
    ['sheet-single', 'scope=single', 'document.querySelector(".series-page-header .series-more").click()', [PHONE]]
]

const MEASURE = `(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const all = [...document.querySelectorAll('body *')].filter(visible)
    const smallText = all.filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12)
    const fields = all.filter(el => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !/^(checkbox|radio|range|hidden)$/.test(el.type))
    const targets = all.filter(el => el.matches('a[href], button, select, input, textarea, [role="button"], summary'))
    const pseudo = (el, side) => { const a = getComputedStyle(el, '::after'); return a.content !== 'none' && a.position === 'absolute' ? parseFloat(a[side]) || 0 : 0 }
    const hit = (el) => { const r = el.getBoundingClientRect(); return { w: Math.max(r.width, pseudo(el, 'width')), h: Math.max(r.height, pseudo(el, 'height')) } }
    const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 2).join('.')) + ' «' + (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 24) + '»'
    const small = targets.filter(el => { const { w, h } = hit(el); return w < 44 || h < 44 })
    const first = document.querySelector('.album-tile, .album-row, .albums-grid > [data-id], .expanded-album-card')
    const box = first ? first.getBoundingClientRect() : null
    const unlabelled = targets.filter(el => el.tagName === 'BUTTON' && !(el.textContent || '').trim() && !el.getAttribute('aria-label'))
    return {
        innerWidth, innerHeight, clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
        firstAlbum: box ? { top: Math.round(box.top + scrollY), coverBottom: Math.round(box.top + scrollY + (first.querySelector('.album-tile__cover, .album-row__cover')?.getBoundingClientRect().height || 0)), height: Math.round(box.height) } : null,
        textBelow12: smallText.length, textBelow12Sample: smallText.slice(0, 6).map(name),
        fieldsBelow16: fields.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).map(name),
        targets: targets.length, targetsBelow44: small.length, targetsBelow44Sample: small.slice(0, 10).map(el => name(el) + ' ' + Math.round(hit(el).w) + 'x' + Math.round(hit(el).h)),
        iconButtonsWithoutName: unlabelled.map(name).slice(0, 6),
        sheetOpen: !!document.querySelector('.sheet'),
        // html clips sideways overflow on the phone (the base's safety net), so scrollWidth alone
        // proves nothing: count what reaches past the right edge of the screen
        pastTheEdge: all.filter(el => el.closest('#app, .sheet') && el.getBoundingClientRect().right > innerWidth + 1 && !(getComputedStyle(el.parentElement).overflow === 'hidden' && el.parentElement.getBoundingClientRect().right <= innerWidth + 1)).map(name).slice(0, 6)
    }
})()`

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function connect(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
    let id = 0
    const waiting = new Map()
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.id && waiting.has(message.id)) { waiting.get(message.id)(message); waiting.delete(message.id) }
    }
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const mine = ++id
        waiting.set(mine, (message) => message.error ? reject(new Error(method + ': ' + message.error.message)) : resolve(message.result))
        ws.send(JSON.stringify({ id: mine, method, params }))
    })
    return { send, close: () => ws.close() }
}

async function shoot(page, size, [name, query, action], measures) {
    await page.send('Page.navigate', { url: `http://127.0.0.1:${port}/reports/evidence/F76/harness/albums.html?${query}` })
    await sleep(2200)
    await page.send('Runtime.evaluate', { expression: `document.querySelectorAll('.last-update').forEach(el => { el.textContent = 'Last updated: (frozen)' }); document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; transition: none !important; caret-color: transparent !important }</style>')` })
    if (action) {
        await page.send('Runtime.evaluate', { expression: action })
        await sleep(600)
    }
    const { result } = await page.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true })
    measures[`${name}-${size.name}`] = result.value
    const shot = await page.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(out, `${name}-${size.name}.png`), Buffer.from(shot.data, 'base64'))
    if (process.env.FULL_PAGE && !action) {
        // every cover drawn before the whole page is taken (lazy images make two runs differ)
        await page.send('Runtime.evaluate', { expression: `document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager' })` })
        await sleep(1200)
        const clip = { x: 0, y: 0, width: result.value.scrollWidth, height: Math.min(result.value.scrollHeight, 5000), scale: 1 }
        const full = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip })
        fs.writeFileSync(path.join(out, `${name}-${size.name}-full.png`), Buffer.from(full.data, 'base64'))
    }
}

async function main() {
    fs.mkdirSync(out, { recursive: true })
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'f76-albums-'))
    const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, `--remote-debugging-port=${DEBUG_PORT}`, 'about:blank'], { stdio: 'ignore' })
    try {
        let target
        for (let i = 0; i < 40 && !target; i++) {
            await sleep(250)
            try { target = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json()).find(t => t.type === 'page') } catch { /* not up yet */ }
        }
        const page = await connect(target.webSocketDebuggerUrl)
        await page.send('Page.enable')
        const measures = {}
        for (const size of [PHONE, COMPUTER]) {
            await page.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
            await page.send('Emulation.setTouchEmulationEnabled', { enabled: size.mobile })
            for (const scenario of SCENARIOS.filter(item => item[3].includes(size))) await shoot(page, size, scenario, measures)
        }
        fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify(measures, null, 1))
        page.close()
    } finally {
        chrome.kill()
    }
}

main().catch(error => { console.error(error); process.exit(1) })
