#!/usr/bin/env node
/**
 * F76 TASK-07 evidence: the inventory harness (../harness/inventory.html, the real screen with 211
 * fixture items) in headless Chrome, at 393x852 as a phone (touch, scale 2) and 1280x800 as a
 * computer. Writes <label>/<scenario>-<size>.png and <label>/measures.json.
 *   node reports/evidence/F76/inventory/shoot-inventory.mjs <label> [port] [phone|computer|both]
 * The measures are those of ../shoot.mjs (sideways scroll, text < 12, fields < 16, targets < 44),
 * plus the inventory's own: the height of a row, what is above the fold, the gestures to the 150th.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const label = process.argv[2] || 'after'
const port = process.argv[3] || "5291"
const which = process.argv[4] || 'both'
const out = path.join(here, label)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9377
const PHONE = { name: '393x852', width: 393, height: 852, mobile: true }
const COMPUTER = { name: '1280x800', width: 1280, height: 800, mobile: false }
const PHONE_SCENARIOS = ['list', 'empty', 'filtered', 'loading', 'reading', 'pressed', 'brl', 'status', 'item', 'filters', 'actions', 'jump', 'edit']
const COMPUTER_SCENARIOS = ['list', 'empty', 'filtered', 'reading', 'pressed', 'brl', 'edit']

const MEASURE = `(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const all = [...document.querySelectorAll('body *')].filter(visible)
    const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight }
    const smallText = all.filter(el => !el.closest('.sr-only') && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12)
    const fields = all.filter(el => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !/^(checkbox|radio|range|hidden)$/.test(el.type))
    const targets = all.filter(el => el.matches('a[href], button, select, input, textarea, [role="button"], summary') && !el.closest('.sr-only'))
    const pseudo = (el, side) => { const a = getComputedStyle(el, '::after'); return a.content !== 'none' && a.position === 'absolute' ? parseFloat(a[side]) || 0 : 0 }
    const hit = (el) => { const r = el.getBoundingClientRect(); return { w: Math.max(r.width, pseudo(el, 'width')), h: Math.max(r.height, pseudo(el, 'height')) } }
    const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 2).join('.')) + ' «' + (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 24) + '»'
    const small = targets.filter(el => { const { w, h } = hit(el); return w < 44 || h < 44 })
    const rows = [...document.querySelectorAll('.inv-row:not(.inv-row--ghost)')]
    const firstRow = rows[0]?.getBoundingClientRect()
    return {
        phone: matchMedia('(max-width: 767px)').matches,
        clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
        textBelow12: smallText.length, textBelow12Sample: smallText.slice(0, 6).map(name),
        fieldsBelow16: fields.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).map(name),
        targets: targets.length, targetsBelow44: small.length, targetsBelow44Sample: small.slice(0, 14).map(el => name(el) + ' ' + Math.round(hit(el).w) + 'x' + Math.round(hit(el).h)),
        rowsDrawn: rows.length, rowHeights: [...new Set(rows.slice(0, 50).map(r => Math.round(r.getBoundingClientRect().height)))].sort((a, b) => a - b),
        firstRowTop: firstRow ? Math.round(firstRow.top) : null,
        rowsAboveFold: rows.filter(r => r.getBoundingClientRect().bottom <= innerHeight - 56).length,
        stickyBarTop: document.getElementById('inventoryPhoneBar') ? Math.round(document.getElementById('inventoryPhoneBar').getBoundingClientRect().top) : null,
        openSheet: document.querySelector('.sheet .sheet__title')?.textContent || null,
        visibleText: all.filter(onScreen).length
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

const evaluate = async (page, expression) => (await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value

async function load(page, scenario) {
    await page.send('Page.navigate', { url: `http://127.0.0.1:${port}/reports/evidence/F76/harness/inventory.html?s=${scenario}` })
    for (let i = 0; i < 60; i++) {
        await sleep(200)
        if (await evaluate(page, 'document.body?.dataset.ready || ""')) break
    }
    await sleep(600)
    await evaluate(page, `document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; caret-color: transparent !important }</style>')`)
}

async function capture(page, file, full = false) {
    const params = { format: 'png' }
    if (full) {
        const height = await evaluate(page, 'Math.min(document.documentElement.scrollHeight, 6000)')
        Object.assign(params, { captureBeyondViewport: true, clip: { x: 0, y: 0, width: await evaluate(page, 'document.documentElement.clientWidth'), height, scale: 1 } })
    }
    const shot = await page.send('Page.captureScreenshot', params)
    fs.writeFileSync(path.join(out, file), Buffer.from(shot.data, 'base64'))
}

/** The 150th album: «A–Z», a letter, one flick. Counts the gestures and checks it is on screen. */
async function toThe150th(page, measures) {
    await load(page, 'list')
    const plan = await evaluate(page, `(() => {
        const items = window.inventoryView.controller.state.filteredAlbums
        const target = items[149]
        return { title: target.title, artist: target.artist, id: target.id }
    })()`)
    await evaluate(page, `document.querySelector('[data-phone-action="jump"]').click()`)
    await sleep(400)
    const letter = plan.artist.trim().charAt(0).toUpperCase()
    await capture(page, 'to150-1-jump-sheet-393x852.png')
    await evaluate(page, `[...document.querySelectorAll('.inv-jump__target')].find(b => b.textContent === '${letter}').click()`)
    await sleep(500)
    await capture(page, 'to150-2-after-letter-393x852.png')
    const visibleNow = await evaluate(page, `(() => { const row = document.querySelector('.inv-row[data-album-id="${plan.id}"]'); if (!row) return 'not drawn'; const r = row.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight - 56 ? 'on screen' : 'distance ' + Math.round(r.top - innerHeight) })()`)
    let gestures = 2
    if (visibleNow !== 'on screen') {
        gestures += 1
        await evaluate(page, `document.querySelector('.inv-row[data-album-id="${plan.id}"]').scrollIntoView({ block: 'center' })`)
        await sleep(300)
    }
    await capture(page, 'to150-3-on-screen-393x852.png')
    measures.to150th = { album: plan, letter, afterLetter: visibleNow, gestures }
}

async function main() {
    fs.mkdirSync(out, { recursive: true })
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'f76-inv-'))
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
        const runs = [[PHONE, PHONE_SCENARIOS], [COMPUTER, COMPUTER_SCENARIOS]].filter(([size]) => which === 'both' || (which === 'phone') === size.mobile)
        for (const [size, scenarios] of runs) {
            await page.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
            await page.send('Emulation.setTouchEmulationEnabled', { enabled: size.mobile })
            for (const scenario of scenarios.filter(s => !process.env.ONLY || process.env.ONLY.split(",").includes(s))) {
                await load(page, scenario)
                measures[`${scenario}-${size.name}`] = await evaluate(page, MEASURE)
                await capture(page, `${scenario}-${size.name}.png`)
            }
            if (size.mobile && !process.env.ONLY) {
                await load(page, 'list')
                await capture(page, `list-${size.name}-full.png`, true)
                await toThe150th(page, measures)
            }
        }
        fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify(measures, null, 1))
        page.close()
    } finally {
        chrome.kill()
    }
}

main().catch(error => { console.error(error); process.exit(1) })
