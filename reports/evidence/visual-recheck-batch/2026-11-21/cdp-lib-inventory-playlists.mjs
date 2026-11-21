// Shared helpers of the inventory and playlists shoot scripts (visual recheck 2026-11-21):
// headless Google Chrome over the DevTools protocol (Node's own WebSocket, no dependency), the
// measures of measures.json, the freezing of animations and the console collector.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export const PHONE = { name: '393', width: 393, height: 852, mobile: true }
export const DESKTOP = { name: '1280', width: 1280, height: 800, mobile: false }
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export async function connect(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
    let id = 0
    const waiting = new Map()
    const listeners = []
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.id && waiting.has(message.id)) { waiting.get(message.id)(message); waiting.delete(message.id) } else if (message.method) listeners.forEach(fn => fn(message))
    }
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const mine = ++id
        waiting.set(mine, (message) => message.error ? reject(new Error(method + ': ' + message.error.message)) : resolve(message.result))
        ws.send(JSON.stringify({ id: mine, method, params }))
    })
    return { send, on: (fn) => listeners.push(fn), close: () => ws.close() }
}

/** Starts Chrome, returns { page, stop, errors } ; errors collects console errors, page exceptions and failed requests. */
export async function startChrome(debugPort, scratch) {
    const profile = fs.mkdtempSync(path.join(scratch || os.tmpdir(), 'recheck-chrome-'))
    const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, `--remote-debugging-port=${debugPort}`, 'about:blank'], { stdio: 'ignore' })
    let target
    for (let i = 0; i < 60 && !target; i++) {
        await sleep(250)
        try { target = (await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()).find(t => t.type === 'page') } catch { /* not up yet */ }
    }
    const page = await connect(target.webSocketDebuggerUrl)
    const errors = []
    page.on((m) => {
        if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push({ kind: 'console.error', text: m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300) })
        if (m.method === 'Runtime.exceptionThrown') errors.push({ kind: 'exception', text: (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').slice(0, 300) })
        if (m.method === 'Network.loadingFailed') errors.push({ kind: 'network', text: `${m.params.errorText} ${m.params.canceled ? '(canceled)' : ''}`.slice(0, 200), id: m.params.requestId })
        if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push({ kind: 'log', text: `${m.params.entry.text} ${m.params.entry.url || ''}`.slice(0, 300) })
    })
    for (const domain of ['Page', 'Runtime', 'Network', 'Log']) await page.send(domain + '.enable')
    return { page, errors, stop: () => { try { page.close() } catch { /* closed */ } chrome.kill() } }
}

export async function setSize(page, size) {
    await page.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: size.mobile })
}

export const evaluate = async (page, expression) => {
    const r = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error('evaluate: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
    return r.result.value
}

export const FREEZE = `document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; transition: none !important; caret-color: transparent !important }</style>'); document.querySelectorAll('.last-update').forEach(el => { el.textContent = 'Last updated: (frozen)' }); true`

export async function screenshot(page, file) {
    const shot = await page.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'))
}

/** The measures of one capture. Whole body for targets, text and fields (dialogs and sheets sit outside #app); #app for the right edge. */
export const MEASURE = `(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const all = [...document.querySelectorAll('body *')].filter(visible)
    const app = document.getElementById('app')
    const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).split(' ').filter(Boolean).slice(0, 2).join('.')) + ' «' + (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 28) + '»'
    const size = (el) => { const r = el.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) }
    const pastEdge = (list) => list.filter(el => el.getBoundingClientRect().right > innerWidth + 1)
    const inApp = all.filter(el => app && app.contains(el) && !el.closest('.sr-only'))
    const passApp = pastEdge(inApp)
    const passBody = pastEdge(all.filter(el => !el.closest('.sr-only') && !(app && app.contains(el))))
    const interactive = all.filter(el => el.matches('a[href], a, button, input, select, textarea, [role="button"]') && !el.closest('.sr-only') && !(el.tagName === 'INPUT' && el.type === 'hidden'))
    const pseudo = (el, side) => { const a = getComputedStyle(el, '::after'); return a.content !== 'none' && a.position === 'absolute' ? parseFloat(a[side]) || 0 : 0 }
    const hit = (el) => { const r = el.getBoundingClientRect(); return { w: Math.max(r.width, pseudo(el, 'width')), h: Math.max(r.height, pseudo(el, 'height')) } }
    const rawSmall = interactive.filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44 })
    const hitSmall = interactive.filter(el => { const { w, h } = hit(el); return w < 44 || h < 44 })
    const smallText = all.filter(el => !el.closest('.sr-only') && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12)
    const fields = all.filter(el => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !/^(checkbox|radio|range|hidden|button|submit)$/.test(el.type))
    const fam = (el) => el ? getComputedStyle(el).fontFamily : null
    const firstText = document.querySelector('#app p, #app .inv-row__title, #app td, .modal-container p, .sheet p') || document.querySelector('#app span')
    return {
        innerWidth, innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
        phoneMedia: matchMedia('(max-width: 767px)').matches,
        pastRightEdgeInApp: { count: passApp.length, samples: passApp.slice(0, 5).map(el => name(el) + ' right=' + Math.round(el.getBoundingClientRect().right)) },
        pastRightEdgeOutsideApp: { count: passBody.length, samples: passBody.slice(0, 5).map(el => name(el) + ' right=' + Math.round(el.getBoundingClientRect().right)) },
        interactive: interactive.length,
        interactiveBelow44: { count: rawSmall.length, samples: rawSmall.slice(0, 10).map(el => name(el) + ' ' + size(el)) },
        interactiveBelow44WithHitArea: { note: 'counts an ::after hit area as F76 did', count: hitSmall.length, samples: hitSmall.slice(0, 10).map(el => name(el) + ' ' + Math.round(hit(el).w) + 'x' + Math.round(hit(el).h)) },
        textBelow12px: { count: smallText.length, samples: smallText.slice(0, 8).map(el => name(el) + ' ' + getComputedStyle(el).fontSize) },
        inputsBelow16px: { count: fields.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).length, samples: fields.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).slice(0, 6).map(el => name(el) + ' ' + getComputedStyle(el).fontSize) },
        fonts: { h1: fam(document.querySelector('h1')), h2: fam(document.querySelector('h2')), body: fam(document.body), bodyText: fam(firstText), bodyTextSample: firstText ? name(firstText) : null }
    }
})()`
