#!/usr/bin/env node
/**
 * Visual recheck batch 2026-11-21, albums: screenshots + measures.json through the harness copies in ./harness.
 *   npx vite --port 5401 --strictPort --host 127.0.0.1 .      (from the worktree root)
 *   node reports/evidence/visual-recheck-batch/2026-11-21/albums/shoot.mjs [port=5401] [debugPort=9401]
 * Headless Chrome over the DevTools protocol (no dependency), after reports/evidence/F76/albums/shoot-albums.mjs.
 * Clicks and keys are real Input.dispatch* events.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const port = process.argv[2] || '5401'
const DEBUG_PORT = Number(process.argv[3] || 9401)
const PROFILE = '/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/chrome-albums-profile'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = `http://127.0.0.1:${port}/reports/evidence/visual-recheck-batch/2026-11-21/albums/harness`
const PHONE = { name: '393', width: 393, height: 852, mobile: true }
const DESK = { name: '1280', width: 1280, height: 800, mobile: false }
const BOTH = [DESK, PHONE]

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const MEASURE = (phone) => `(() => {
    const phone = ${phone}
    const root = document.getElementById('app') || document.body
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const all = [...document.querySelectorAll('body *')].filter(visible)
    const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).split(' ').slice(0, 2).join('.')) + ' «' + (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 24) + '»'
    const past = [...root.querySelectorAll('*')].filter(el => visible(el) && el.getBoundingClientRect().right > innerWidth + 1 && !(getComputedStyle(el.parentElement).overflow === 'hidden' && el.parentElement.getBoundingClientRect().right <= innerWidth + 1))
    const targets = all.filter(el => el.matches('a, button, input, select, [role="button"]'))
    const small = targets.filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44 })
    const smallText = all.filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12)
    const smallInputs = all.filter(el => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !/^(checkbox|radio|range|hidden)$/.test(el.type) && parseFloat(getComputedStyle(el).fontSize) < 16)
    const fam = (sel) => { const el = [...document.querySelectorAll(sel)].find(visible); return el ? getComputedStyle(el).fontFamily : null }
    const sz = (el) => { const r = el.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) }
    return {
        innerWidth, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
        pastRightEdge: { count: past.length, samples: past.slice(0, 5).map(name) },
        interactiveTotal: targets.length,
        smallTargets44: phone ? { count: small.length, samples: small.slice(0, 10).map(el => name(el) + ' ' + sz(el)) } : 'n/a (desktop)',
        textUnder12px: { count: smallText.length, samples: smallText.slice(0, 8).map(el => name(el) + ' ' + getComputedStyle(el).fontSize) },
        inputsUnder16px: phone ? { count: smallInputs.length, samples: smallInputs.slice(0, 6).map(el => name(el) + ' ' + getComputedStyle(el).fontSize) } : 'n/a (desktop)',
        fontFamily: { h1: fam('h1'), h2: fam('h2'), body: getComputedStyle(document.body).fontFamily },
        bodyBackground: getComputedStyle(document.body).backgroundColor
    }
})()`

async function connect(wsUrl, consoleLog) {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
    let id = 0
    const waiting = new Map()
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.id && waiting.has(message.id)) { waiting.get(message.id)(message); waiting.delete(message.id); return }
        if (message.method === 'Runtime.exceptionThrown') consoleLog.push('EXCEPTION ' + (message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text))
        if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) consoleLog.push(message.params.type.toUpperCase() + ' ' + message.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300))
        if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) consoleLog.push('LOG-' + message.params.entry.level + ' ' + message.params.entry.text + ' ' + (message.params.entry.url || ''))
    }
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const mine = ++id
        waiting.set(mine, (message) => message.error ? reject(new Error(method + ': ' + message.error.message)) : resolve(message.result))
        ws.send(JSON.stringify({ id: mine, method, params }))
    })
    return { send, close: () => ws.close() }
}

let page, out, measures, consoleLog, current

const evaluate = async (expression) => (await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value

async function realClick(selector) {
    const at = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
    if (!at) throw new Error('nothing to click: ' + selector)
    await sleep(250)
    const again = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: again.x, y: again.y })
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: again.x, y: again.y, button: 'left', clickCount: 1 })
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: again.x, y: again.y, button: 'left', clickCount: 1 })
}

async function typeWord(word) {
    const steps = []
    for (const ch of word) {
        await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch })
        await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch })
        await sleep(60)
        steps.push(await evaluate(`({ activeIsSearch: document.activeElement && document.activeElement.id === 'genericSearch', active: document.activeElement ? document.activeElement.tagName + '#' + document.activeElement.id : null, value: (document.getElementById('genericSearch') || {}).value })`))
    }
    return steps
}

async function freeze() {
    await evaluate(`document.querySelectorAll('.last-update').forEach(el => { el.textContent = 'Last updated: (frozen)' }); document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; transition: none !important; caret-color: transparent !important }</style>')`)
}

const coversLoaded = () => evaluate(`Promise.all([...document.images].map(img => img.complete ? 1 : new Promise(r => { img.onload = img.onerror = r }))).then(() => document.images.length)`)

async function capture(size, name, { full = false, clip = null } = {}) {
    await freeze()
    await evaluate(`document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager' })`)
    await sleep(400)
    await coversLoaded()
    const m = await evaluate(MEASURE(size.mobile))
    measures[`${name}-${size.name}`] = m
    const shot = await page.send('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: 1 } } : { format: 'png' })
    fs.writeFileSync(path.join(out, `${name}-${size.name}.png`), Buffer.from(shot.data, 'base64'))
    if (full) {
        const clipAll = { x: 0, y: 0, width: m.innerWidth, height: Math.min(m.scrollHeight, 5000), scale: 1 }
        const f = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: clipAll })
        fs.writeFileSync(path.join(out, `${name}-${size.name}-full.png`), Buffer.from(f.data, 'base64'))
    }
    return m
}

async function open(file, query = '') {
    await page.send('Page.navigate', { url: `${BASE}/${file}?${query}` })
    for (let i = 0; i < 60; i++) {
        await sleep(300)
        const ready = await evaluate(file === 'albums.html' ? `document.body.dataset.harnessReady === 'true'` : `window.harnessReady === true`).catch(() => false)
        if (ready) break
    }
    await sleep(900)
}

const addExtra = (key, value) => { (measures._extra ||= {})[key] = value }

// [name, sizes, run(size)]
const SCENARIOS = [
    ['grid-all', BOTH, async (size) => { await open('albums.html'); await capture(size, 'grid-all', { full: !size.mobile }) }],
    ['list-all', BOTH, async (size) => { await open('albums.html', 'view=list'); await capture(size, 'list-all', { full: !size.mobile }) }],
    ['loading', BOTH, async (size) => { await open('albums.html', 'state=loading'); await capture(size, 'loading') }],
    ['series-states', BOTH, async (size) => {
        await open('albums.html', 'states=mix')
        addExtra(`series-states-${size.name}`, await evaluate(`({ states: Object.fromEntries(Object.entries(window.harnessController.getSeriesStates()).filter(([id]) => ['s1','s4','s5','s6','s8'].includes(id)).map(([id, s]) => [id, s.status + ' found=' + s.found + ' failed=' + s.failed + ' inFlight=' + s.inFlight])), drawnGroups: [...document.querySelectorAll('[data-series-id]')].filter(el => /series-group/.test(el.className)).map(el => el.dataset.seriesId + (el.classList.contains('series-group-skeleton') ? ' (skeleton)' : '')), failureNotices: [...document.querySelectorAll('.series-load-failure')].map(el => el.textContent.trim().replace(/\\s+/g, ' ')), emptySeriesS4InDom: !!document.querySelector('[data-series-id="s4"]') })`))
        await capture(size, 'series-states', { full: false })
    }],
    ['single', BOTH, async (size) => {
        await open('albums.html', 'scope=single&seriesId=s5')
        addExtra(`single-${size.name}`, await evaluate(`({ pagerTopText: document.querySelector('#series-pager-top-mount')?.textContent.trim(), pagerBottomText: document.querySelector('#series-pager-mount')?.textContent.trim(), h1: document.querySelector('h1')?.textContent.trim(), groupHeaderCount: document.querySelector('.series-group-header__count')?.textContent.trim() })`))
        await capture(size, 'single')
    }],
    ['filtered', BOTH, async (size) => {
        await open('albums.html')
        await realClick('#genericSearch')
        const steps = await typeWord('discipline')
        await sleep(500)
        addExtra(`typing-discipline-${size.name}`, {
            afterEachKey: steps,
            finalActiveElementIsSearchInput: steps.at(-1)?.activeIsSearch,
            finalInputValue: steps.at(-1)?.value,
            everyKeyKeptFocus: steps.every(s => s.activeIsSearch),
            everyKeyKeptTypedText: steps.every((s, i) => s.value === 'discipline'.slice(0, i + 1)),
            clickedOnlyOnce: 'the field was clicked once before the first key; no click between keys',
            standInRedraws: 'the stand-in redraws once per tick (microtask), like SeriesController.renderFromStore; the real controller was not run and has no timer-based debounce in handleSearch (read, not executed)',
            pagerCountText: await evaluate(`document.querySelector('#series-pager-top-mount .series-pager-count')?.textContent.trim().replace(/\\s+/g, ' ')`)
        })
        await evaluate(`window.scrollTo(0, 0)`)
        await capture(size, 'filtered')
    }],
    ['load-more', BOTH, async (size) => {
        await open('albums.html')
        const before = await evaluate(`({ shown: document.querySelectorAll('[data-series-id="s2"] [data-id]').length, button: document.querySelector('[data-series-id="s2"] .load-more-btn')?.textContent.trim().replace(/\\s+/g, ' ') || null })`)
        await evaluate(`document.querySelector('[data-series-id="s2"].series-group').scrollIntoView({ block: 'start' })`)
        await capture(size, 'load-more')
        await realClick('[data-series-id="s2"] .load-more-btn')
        await sleep(700)
        const after = await evaluate(`({ shown: document.querySelectorAll('.series-group[data-series-id="s2"] [data-id]').length, buttonStillThere: !!document.querySelector('.series-group[data-series-id="s2"] .load-more-btn'), headerCount: document.querySelector('.series-group[data-series-id="s2"] .series-group-header__count')?.textContent.trim() })`)
        addExtra(`load-more-${size.name}`, { before, after })
        await capture(size, 'load-more-open')
    }],
    ['album-notices', BOTH, async (size) => {
        await open('albums.html', 'notices=1')
        addExtra(`album-notices-${size.name}`, await evaluate(`({ identityNotes: [...document.querySelectorAll('[data-identity-note]')].map(el => el.textContent.trim()), failureNotices: [...document.querySelectorAll('.series-load-failure')].map(el => el.textContent.trim().replace(/\\s+/g, ' ')) })`))
        await capture(size, 'album-notices')
        await open('albums.html', 'notices=1&view=list')
        await capture(size, 'album-notices-list')
    }],
    ['ranking-window', BOTH, async (size) => {
        await open('album-window.html', 'screen=album')
        await sleep(800)
        addExtra(`album-window-${size.name}`, await evaluate(`({ closeButtons: [...document.querySelectorAll('button')].filter(b => /^close$/i.test((b.getAttribute('aria-label') || b.textContent).trim())).map(b => ({ label: b.getAttribute('aria-label') || ('text: ' + b.textContent.trim()), visible: b.getBoundingClientRect().width > 0, size: Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height) })), times: [...document.querySelectorAll('.font-mono, [class*="tabular"]')].map(e => e.textContent.trim()).filter(t => /^\\d+:\\d\\d$|--:--/.test(t)).slice(0, 20), rowsText: document.body.innerText.split('\\n').filter(t => /Epitaph|Schizoid|Wind|Moonchild|Court/.test(t)).slice(0, 20) })`))
        await capture(size, 'ranking-window')
        const closeAt = await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^close$/i.test((b.getAttribute('aria-label') || b.textContent).trim()) && b.getBoundingClientRect().width > 0); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: Math.max(0, r.left - 60), y: Math.max(0, r.top - 20), width: Math.min(innerWidth, r.width + 120), height: r.height + 40 } })()`)
        if (closeAt) await capture(size, 'album-close-button', { clip: closeAt })
        await open('album-window.html', 'screen=rank')
        await sleep(800)
        await capture(size, 'ranking-window-rank')
    }],
    ['footer', BOTH, async (size) => {
        await open('albums.html')
        if (!size.mobile) {
            await evaluate(`window.scrollTo(0, document.documentElement.scrollHeight)`)
            await sleep(300)
            addExtra(`footer-${size.name}`, await evaluate(`({ clearCacheButton: document.getElementById('footerClearCache')?.textContent.trim() || null, visible: !!document.getElementById('footerClearCache') && document.getElementById('footerClearCache').getBoundingClientRect().width > 0 })`))
            await capture(size, 'footer')
        } else {
            addExtra(`footer-${size.name}-inline`, await evaluate(`({ footerClearCacheButtonInDom: !!document.getElementById('footerClearCache'), visible: !!document.getElementById('footerClearCache') && document.getElementById('footerClearCache').getBoundingClientRect().width > 0, siteFooterDisplay: document.querySelector('.site-footer') ? getComputedStyle(document.querySelector('.site-footer')).display : null })`))
            await realClick('#phoneMenuBtn')
            await sleep(900)
            addExtra(`footer-${size.name}-menu`, await evaluate(`({ menuTexts: [...document.querySelectorAll('.sheet button, [role="dialog"] button')].map(b => b.textContent.trim().replace(/\\s+/g, ' ')).filter(Boolean) })`))
            await capture(size, 'footer')
        }
    }]
]

async function main() {
    out = here
    measures = {}
    consoleLog = []
    fs.mkdirSync(PROFILE, { recursive: true })
    const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${DEBUG_PORT}`, 'about:blank'], { stdio: 'ignore' })
    try {
        let target
        for (let i = 0; i < 40 && !target; i++) {
            await sleep(250)
            try { target = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json()).find(t => t.type === 'page') } catch { /* not up yet */ }
        }
        page = await connect(target.webSocketDebuggerUrl, consoleLog)
        await page.send('Page.enable'); await page.send('Runtime.enable'); await page.send('Log.enable')
        for (const size of BOTH) {
            await page.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
            await page.send('Emulation.setTouchEmulationEnabled', { enabled: size.mobile })
            for (const [name, sizes, run] of SCENARIOS) {
                if (!sizes.includes(size)) continue
                current = name
                consoleLog.push(`--- ${name} ${size.name}`)
                try { await run(size) } catch (error) { measures[`${name}-${size.name}`] = { error: String(error) }; console.error(name, size.name, error.message) }
            }
        }
        measures._console = consoleLog
        fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify(measures, null, 1))
        page.close()
    } finally {
        chrome.kill()
    }
}

main().catch(error => { console.error(error); process.exit(1) })
