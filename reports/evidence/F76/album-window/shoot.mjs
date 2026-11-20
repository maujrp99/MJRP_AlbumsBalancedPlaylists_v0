#!/usr/bin/env node
/**
 * F76 TASK-03 evidence: the album window and «my ranking», drawn by the real components in the
 * harness (../harness/album-window.html), shot and measured in headless Chrome.
 *   node reports/evidence/F76/album-window/shoot.mjs <label> [port] [sizes]
 * <label>: a folder next to this file (e.g. after, before). Sizes: 393x852 and 393x660 (the window
 * Safari leaves on an iPhone 15 Pro), 667x375 (a small phone lying down), 1280x800 (the computer).
 * Writes <label>/<screen>-<size>.png and <label>/measures.json.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../..')
const label = process.argv[2] || 'after'
const port = process.argv[3] || '5263'
const out = path.join(here, label)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = Number(process.env.DEBUG_PORT || 9600 + Math.floor(Math.random() * 300)) // its own: other agents run Chrome too
const HARNESS = `http://127.0.0.1:${port}/@fs${root}/reports/evidence/F76/harness/album-window.html`
const ALL_SIZES = [
    { name: '393x852', width: 393, height: 852, mobile: true },
    { name: '393x660', width: 393, height: 660, mobile: true },
    { name: '667x375', width: 667, height: 375, mobile: true },
    { name: '1280x800', width: 1280, height: 800, mobile: false }
]
const wanted = process.argv[4] ? process.argv[4].split(',') : null
const SIZES = wanted ? ALL_SIZES.filter(s => wanted.includes(s.name)) : ALL_SIZES
const SCREENS = (process.env.SCREENS || 'album,inventory,rank,rank-picked,rank-moveto,rank-reset').split(',')

const MEASURE = `(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight }
    const scope = [...document.querySelectorAll('.album-window, .rank-window, .sheet, .rank-toast')]
    const all = scope.flatMap(s => [s, ...s.querySelectorAll('*')]).filter(visible)
    const smallText = all.filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12)
    const fields = all.filter(el => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName))
    const targets = all.filter(el => el.matches('a[href], button:not([disabled]), select, input, textarea, [role="button"]'))
    const name = (el) => el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 2).join('.') + ' «' + (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 24) + '»'
    const small = targets.filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44 })
    const fullyIn = (sel) => [...document.querySelectorAll(sel)].filter(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.height > 0 && getComputedStyle(el).display !== 'none' }).length
    const scrollers = all.filter(el => { const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1 }).map(name)
    const sideways = all.filter(el => el.scrollWidth > el.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowX)).map(name)
    const titles = [...document.querySelectorAll('.tracks-tabs__title, .rank-row__title')].filter(visible)
    const narrowest = titles.length ? Math.min(...titles.map(t => t.getBoundingClientRect().width)) : null
    const cut = titles.filter(t => t.scrollWidth > t.clientWidth + 1 || getComputedStyle(t).textOverflow === 'ellipsis').length
    const heading = document.querySelector('.album-window .modal-header h2')
    const box = (sel) => { const el = document.querySelector(sel); if (!el || !visible(el)) return null; const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    return {
        innerWidth, innerHeight, docScrollWidth: document.documentElement.scrollWidth,
        phone: matchMedia('(max-width: 767px)').matches,
        textBelow12: smallText.map(name).slice(0, 8),
        fieldsBelow16: fields.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).map(name),
        targets: targets.length, targetsBelow44: small.map(el => name(el) + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height)).slice(0, 12),
        tracksFullyVisible: fullyIn('.tracks-tabs__row') + fullyIn('.rank-row') + fullyIn('.album-window .tracks-table-container tbody tr'),
        scrollingBoxes: scrollers, sidewaysScroll: sideways,
        narrowestTitlePx: narrowest && Math.round(narrowest), titlesCut: cut,
        albumTitle: heading ? { text: heading.textContent, width: Math.round(heading.getBoundingClientRect().width), height: Math.round(heading.getBoundingClientRect().height), cut: heading.scrollWidth > heading.clientWidth + 1 } : null,
        boxes: { bar: box('.album-window__bar') || box('.rank-phone__bar'), header: box('.album-window .modal-header'), segmented: box('.tracks-tabs__bar'), save: box('.rank-phone__save') || box('.rank-window button.bg-sky-500'), toast: box('.rank-toast'), mover: box('.rank-phone__mover') }
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

async function shoot(page, size, screen, measures) {
    await page.send('Page.navigate', { url: `${HARNESS}?screen=${screen}` })
    // ready: the harness says so and the tracks (or the line in their place) are drawn
    for (let i = 0; i < 40; i++) {
        await sleep(250)
        const { result: ready } = await page.send('Runtime.evaluate', { expression: `Boolean(window.harnessReady && document.querySelector('.tracks-tabs__row, .album-window tbody tr, .rank-row, [data-track-id]'))`, returnByValue: true })
        if (ready.value) break
    }
    await sleep(Number(process.env.SETTLE_MS || 900))
    await page.send('Runtime.evaluate', { expression: `document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; transition: none !important; caret-color: transparent !important }</style>')` })
    await sleep(300)
    const { result } = await page.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true })
    measures[`${screen}-${size.name}`] = result.value
    const shot = await page.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(out, `${screen}-${size.name}.png`), Buffer.from(shot.data, 'base64'))
    if (process.env.SCROLLED && size.mobile) {
        await page.send('Runtime.evaluate', { expression: `(document.querySelector('.album-window .modal-container') || document.querySelector('.rank-phone__body') || {}).scrollTop = 520` })
        await sleep(400)
        const scrolled = await page.send('Page.captureScreenshot', { format: 'png' })
        fs.writeFileSync(path.join(out, `${screen}-${size.name}-scrolled.png`), Buffer.from(scrolled.data, 'base64'))
    }
}

async function main() {
    fs.mkdirSync(out, { recursive: true })
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'f76-aw-'))
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
        for (const size of SIZES) {
            await page.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
            await page.send('Emulation.setTouchEmulationEnabled', { enabled: size.mobile })
            for (const screen of SCREENS) await shoot(page, size, screen, measures)
        }
        fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify(measures, null, 1))
        page.close()
    } finally {
        chrome.kill()
    }
}

main().catch(error => { console.error(error); process.exit(1) })
