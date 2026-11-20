#!/usr/bin/env node
/**
 * F76 TASK-04 evidence: the playlists harness (reports/evidence/F76/harness/playlists) in headless
 * Chrome, at 393x852 (phone: touch, scale 2) and 1280x800 (computer). Writes <label>/<case>-<size>.png
 * and <label>/measures.json: width, height, text below 12 px, fields below 16 px, targets below
 * 44 px, scroll boxes inside the page, what the first screen shows.
 *   node reports/evidence/F76/playlists/shoot.mjs <label> [port]      (harness served on port, 5187 by default)
 * Same protocol as ../shoot.mjs (Node's own WebSocket, no dependency).
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const label = process.argv[2] || 'after'
const port = process.argv[3] || '5187'
const out = path.join(here, label)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = Number(process.env.DEBUG_PORT || 9341)
const tap = (selector) => `document.querySelector(${JSON.stringify(selector)}).click()`
const tapText = (text) => `[...document.querySelectorAll('.sheet button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}).click()`
const CASES = {
    generated: '?screen=generated',
    'generated-p4': '?screen=generated&active=3',
    saved: '?screen=saved',
    'saved-open': '?screen=saved&open=1&batch=1',
    // what a tap does (phone only)
    'track-sheet': { query: '?screen=generated', phoneOnly: true, run: [tap('.phone-track [data-phone-action="track-options"]')] },
    'removed-undo': { query: '?screen=generated', phoneOnly: true, run: [tap('.phone-track [data-phone-action="track-options"]'), tapText('Remove from this playlist')] },
    'scrolled-notice': { query: '?screen=generated', phoneOnly: true, run: ['window.scrollTo(0, 900)', "window.__toast.info('Your unsaved playlists were restored', 60000)"] },
    'playlist-sheet': { query: '?screen=generated', phoneOnly: true, run: [tap('[data-phone-action="playlist-options"]')] },
    'delete-confirm': { query: '?screen=generated', phoneOnly: true, run: [tap('[data-phone-action="playlist-options"]'), tapText('Delete this playlist')] },
    // F76 polish (recheck N3): the closed reconfigure row left the page; the «⋯» of the playlist opens it
    reconfigure: { query: '?screen=generated', phoneOnly: true, run: [tap('[data-phone-action="playlist-options"]'), tapText('Reconfigure and regenerate')] },
    // F76 polish (recheck N5): the saved playlists' sheets
    'saved-filters': { query: '?screen=saved', phoneOnly: true, run: [tap('.filters-phone-button')] },
    'saved-series-sheet': { query: '?screen=saved', phoneOnly: true, run: [tap('.saved-phone-series .phone-more')] },
    'saved-batch-sheet': { query: '?screen=saved&open=1', phoneOnly: true, run: [tap('.saved-phone-batch .phone-more')] },
    'saved-delete-confirm': { query: '?screen=saved&open=1', phoneOnly: true, run: [tap('.saved-phone-batch .phone-more'), "[...document.querySelectorAll('.sheet .albums-sheet__row')].find(b => b.textContent.trim() === 'Delete batch').click()"] },
    'export-sheet': { query: '?screen=generated', phoneOnly: true, run: [tap('[data-phone-action="export"]')] },
    'spotify-window': { query: '?screen=generated', phoneOnly: true, run: [tap('[data-phone-action="export"]'), tapText('Export to Spotify')] }
}
const SIZES = [
    { name: '393x852', width: 393, height: 852, mobile: true },
    // what Safari leaves on an iPhone 15 Pro with its bars shown (F76 polish, recheck N3)
    { name: '393x660', width: 393, height: 660, mobile: true },
    { name: '1280x800', width: 1280, height: 800, mobile: false }
]
// ONLY=generated,saved shoots those cases only
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null

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
    const scrollBoxes = all.filter(el => { const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2 && el !== document.documentElement && el !== document.body })
    const firstTrack = document.querySelector('.phone-track, .track-row')
    const tracksInView = [...document.querySelectorAll('.phone-track')].filter(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight - 56 - 64 }).length
    return {
        innerWidth, innerHeight, clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
        phone: matchMedia('(max-width: 767px)').matches,
        textBelow12: smallText.length, textBelow12Sample: smallText.slice(0, 6).map(name),
        fieldsBelow16: fields.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).map(name),
        targets: targets.length, targetsBelow44: small.length, targetsBelow44Sample: small.slice(0, 14).map(el => name(el) + ' ' + Math.round(hit(el).w) + 'x' + Math.round(hit(el).h)),
        verticalScrollBoxes: scrollBoxes.map(name),
        firstTrackTop: firstTrack ? Math.round(firstTrack.getBoundingClientRect().top) : null,
        phoneTracksFullyInFirstScreen: tracksInView,
        wider: all.filter(el => el.getBoundingClientRect().right > innerWidth + 1 && !el.closest('.phone-pl-chips__row')).slice(0, 6).map(name)
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

async function shoot(page, size, name, spec, measures) {
    const { query, run = [], phoneOnly = false } = typeof spec === 'string' ? { query: spec } : spec
    if (phoneOnly && !size.mobile) return
    await page.send('Page.navigate', { url: `http://127.0.0.1:${port}/${query}` })
    await sleep(Number(process.env.SETTLE_MS || 2500))
    for (const expression of run) {
        await page.send('Runtime.evaluate', { expression, awaitPromise: true })
        await sleep(700)
    }
    await page.send('Runtime.evaluate', { expression: `document.querySelectorAll('.last-update').forEach(el => { el.textContent = 'Last updated: (frozen)' }); document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; transition: none !important; caret-color: transparent !important }</style>')` })
    const { result } = await page.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true })
    measures[`${name}-${size.name}`] = result.value
    const shot = await page.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(out, `${name}-${size.name}.png`), Buffer.from(shot.data, 'base64'))
    if (run.length) return
    const clip = { x: 0, y: 0, width: result.value.innerWidth, height: Math.min(result.value.scrollHeight, 5000), scale: 1 }
    const full = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip })
    fs.writeFileSync(path.join(out, `${name}-${size.name}-full.png`), Buffer.from(full.data, 'base64'))
}

async function main() {
    fs.mkdirSync(out, { recursive: true })
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'f76-pl-'))
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
            for (const [name, spec] of Object.entries(CASES).filter(([name]) => !ONLY || ONLY.includes(name))) await shoot(page, size, name, spec, measures)
        }
        fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify(measures, null, 1))
        page.close()
    } finally {
        chrome.kill()
    }
}

main().catch(error => { console.error(error); process.exit(1) })
