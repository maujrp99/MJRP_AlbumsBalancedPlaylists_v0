#!/usr/bin/env node
/**
 * F76 evidence: screenshots and measures of what can be reached without signing in.
 *   node reports/evidence/F76/shoot.mjs <before|after> [port]
 * Headless Chrome driven over the DevTools protocol (no dependency: Node's own WebSocket), a fresh
 * profile (nobody signed in), the viewport emulated at each size (393x852 and 852x393 as a phone:
 * touch, device scale 2; 1280x800 as a computer). Writes <label>/<route>-<size>.png and
 * <label>/measures.json (layout width and height, text below 12 px, fields below 16 px, targets
 * below 44 px, what is fixed on the screen, the boxes of the page's main parts).
 * FULL_PAGE=1 also writes <route>-<size>-full.png (the whole page, up to 6000 px).
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const label = process.argv[2] || 'after'
const port = process.argv[3] || '5183'
const out = path.join(here, label)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9333
const ROUTES = ['home', 'albums', 'blend', 'playlists', 'saved-playlists', 'inventory', 'artists']
const SIZES = [
    { name: '393x852', width: 393, height: 852, mobile: true },
    { name: '852x393', width: 852, height: 393, mobile: true },
    { name: '1280x800', width: 1280, height: 800, mobile: false }
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
    return {
        innerWidth, innerHeight, clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
        phone: matchMedia('(max-width: 767px)').matches,
        textBelow12: smallText.length, textBelow12Sample: smallText.slice(0, 6).map(name),
        fieldsBelow16: fields.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).map(name),
        targets: targets.length, targetsBelow44: small.length, targetsBelow44Sample: small.slice(0, 14).map(el => name(el) + ' ' + Math.round(hit(el).w) + 'x' + Math.round(hit(el).h)),
        fixed: all.filter(el => getComputedStyle(el).position === 'fixed').map(name).slice(0, 8),
        layout: [...document.querySelectorAll('#header-container, #header-container nav, #app, #app > *, #app > * > *, #footer-container')].map(el => { const r = el.getBoundingClientRect(); return [name(el).slice(0, 30), Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)] })
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

async function shoot(page, size, route, measures) {
    await page.send('Page.navigate', { url: `http://127.0.0.1:${port}/${route}` })
    await sleep(Number(process.env.SETTLE_MS || 3500))
    // The footer prints the time of the load: frozen, so two runs can be compared pixel by pixel
    await page.send('Runtime.evaluate', { expression: `document.querySelectorAll('.last-update').forEach(el => { el.textContent = 'Last updated: (frozen for the comparison)' }); document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; caret-color: transparent !important }</style>')` })
    const { result } = await page.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true })
    measures[`${route}-${size.name}`] = result.value
    const shot = await page.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(out, `${route}-${size.name}.png`), Buffer.from(shot.data, 'base64'))
    if (!process.env.FULL_PAGE) return
    const clip = { x: 0, y: 0, width: result.value.scrollWidth, height: Math.min(result.value.scrollHeight, 6000), scale: 1 }
    const full = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip })
    fs.writeFileSync(path.join(out, `${route}-${size.name}-full.png`), Buffer.from(full.data, 'base64'))
}

async function main() {
    fs.mkdirSync(out, { recursive: true })
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'f76-'))
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
            for (const route of ROUTES) await shoot(page, size, route, measures)
        }
        fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify(measures, null, 1))
        page.close()
    } finally {
        chrome.kill()
        // the profile is a temporary folder of the system: left for the system to clean
    }
}

main().catch(error => { console.error(error); process.exit(1) })
