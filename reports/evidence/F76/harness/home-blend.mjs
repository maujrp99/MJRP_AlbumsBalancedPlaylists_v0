#!/usr/bin/env node
/**
 * F76 TASK-05/06 evidence: the Home, the edit-series window and the Blend with data, in the real app.
 *   node reports/evidence/F76/harness/home-blend.mjs <label> [port]
 * Nobody can sign in in a headless Chrome, so the screens are filled from the page itself: the
 * Home's own picker is given a stand-in catalog (18 albums, long titles, covers as inline SVG), the
 * Blend's own selector is given 50 series, and the edit window is opened on a series of 15 albums.
 * Every component drawn is the real one (HomeView, HomeController, HomePhoneChosen, SeriesEditModal,
 * BlendingMenuView, BlendSeriesSelector, BlendSeriesPhonePicker). Writes
 * reports/evidence/F76/home-blend/<label>/<scene>-<size>.png and measures.json.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const label = process.argv[2] || 'after'
const port = process.argv[3] || '5183'
const out = path.join(here, '..', 'home-blend', label)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = Number(process.env.DEBUG_PORT || 9334)
const SIZES = [
    { name: '393x852', width: 393, height: 852, mobile: true },
    { name: '1280x800', width: 1280, height: 800, mobile: false }
]
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/** The fixtures, defined in the page. */
const FIXTURES = `(() => {
    const hues = [12, 38, 200, 260, 320, 150, 90, 180, 280, 10, 60, 220, 300, 130, 340, 30, 240, 170]
    const cover = (i) => 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hues[i % 18] + ',70%,55%)"/><stop offset="1" stop-color="hsl(' + ((hues[i % 18] + 60) % 360) + ',60%,25%)"/></linearGradient></defs><rect width="10" height="10" fill="url(#g)"/><circle cx="5" cy="5" r="2.4" fill="rgba(0,0,0,.35)"/></svg>')
    const titles = ['The Piper at the Gates of Dawn', 'A Saucerful of Secrets', 'More', 'Ummagumma', 'Atom Heart Mother', 'Meddle', 'Obscured by Clouds', 'The Dark Side of the Moon', 'Wish You Were Here', 'Animals', 'The Wall', 'The Final Cut', 'A Momentary Lapse of Reason', 'The Division Bell', 'The Endless River', 'Delicate Sound of Thunder (Live)', 'Pulse (Live at Earls Court 1994)', 'Relics: A Bizarre Collection of Antiques & Curios']
    const types = ['Album','Album','Album','Album','Album','Album','Album','Album','Album','Album','Album','Album','Album','Album','Album','Live','Live','Compilation']
    window.__albums = titles.map((title, i) => ({ id: 'pf' + i, title, artist: 'Pink Floyd', year: String(1967 + i * 2), releaseDate: (1967 + i * 2) + '-03-01', type: types[i], coverUrl: cover(i) }))
    window.__cover = cover
    const names = ['Prog Rock 70s', 'Pink Floyd — the complete studio albums and a few live records', 'Brazilian Jazz', 'Sunday Morning', 'Rush &amp; Friends', 'Krautrock Essentials']
    window.__series = Array.from({ length: 50 }, (_, i) => ({ id: 's' + i, name: names[i] || ('Series number ' + i + (i % 7 === 0 ? ' with a rather long name to wrap' : '')), albumQueries: Array.from({ length: 4 + (i * 7) % 20 }, (_, k) => 'Artist ' + k + ' - Album ' + k) }))
    window.__editSeries = { id: 'edit1', name: 'Pink Floyd — studio years', albumQueries: titles.slice(0, 15).map(t => 'Pink Floyd - ' + t) }
    return true
})()`

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
    const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    const scrollers = all.filter(el => { const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 4 && !el.closest('.sheet__body, .app-modal__body') && !el.matches('.sheet__body, .app-modal__body') }).map(name)
    return {
        innerWidth, innerHeight, clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
        phone: matchMedia('(max-width: 767px)').matches,
        textBelow12: smallText.length, textBelow12Sample: smallText.slice(0, 6).map(name),
        fieldsBelow16: fields.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).map(name),
        targets: targets.length, targetsBelow44: small.length, targetsBelow44Sample: small.slice(0, 14).map(el => name(el) + ' ' + Math.round(hit(el).w) + 'x' + Math.round(hit(el).h)),
        innerScrollers: scrollers,
        stackAt: document.elementsFromPoint(100, 445).slice(0, 5).map(el => name(el) + ' ' + getComputedStyle(el).opacity + ' ' + getComputedStyle(el).backgroundColor),
        probe: (() => { const h = document.querySelector('[data-action="pick-album"] h3'); if (!h) return null; const cs = getComputedStyle(h); let o = 1, el = h; while (el) { o *= parseFloat(getComputedStyle(el).opacity); el = el.parentElement } return { color: cs.color, font: cs.fontFamily.slice(0, 40), opacity: o, bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 40) } })(),
        boxes: { bar: box('.phone-action-bar'), firstCard: box('[data-action="pick-album"]'), filters: box('#home-toolbar'), pick: box('#blend-series-pick'), stepper: box('.blend-stepper'), sheetBody: box('.sheet__body') }
    }
})()`

/** Each scene: where it starts and what is done in the page before the picture. */
const SCENES = [
    { name: 'home-empty', route: 'home', steps: [] },
    { name: 'home-results', route: 'home', steps: [
        `window.controller.picker.service = { scanArtist: async () => ({ albums: window.__albums, reclassified: null }) }; document.querySelector('#seriesNameInput').value = 'Pink Floyd studio'; document.querySelector('#artistScanInput').value = 'Pink Floyd'; window.controller.picker.searchArtist('Pink Floyd')`
    ] },
    { name: 'home-chosen', route: 'home', steps: [
        `window.controller.picker.service = { scanArtist: async () => ({ albums: window.__albums, reclassified: null }) }; window.controller.picker.searchArtist('Pink Floyd')`,
        `['pf13','pf10','pf8','pf7'].forEach(id => document.querySelector('[data-action="pick-album"][data-id="' + id + '"]').click()); document.querySelector('#home-toolbar').scrollIntoView(); window.scrollBy(0, -60)`
    ] },
    { name: 'home-sheet', route: 'home', phoneOnly: true, steps: [
        `window.controller.picker.service = { scanArtist: async () => ({ albums: window.__albums, reclassified: null }) }; window.controller.picker.searchArtist('Pink Floyd')`,
        `['pf13','pf10','pf8','pf7','pf5'].forEach(id => document.querySelector('[data-action="pick-album"][data-id="' + id + '"]').click()); document.querySelector('.home-chosen-count').click()`
    ] },
    { name: 'home-bulk', route: 'home', steps: [`document.querySelector('#btnModeBulk').click()`] },
    { name: 'edit-series', route: 'albums', steps: [
        `window.albumSeriesStore.setSeries([window.__editSeries])`,
        `import('/js/components/series/SeriesEditModal.js').then(m => m.SeriesEditModal.open('edit1', () => {}))`
    ] },
    { name: 'blend-start', route: 'blend', steps: [
        `(() => { const sel = window.router.currentView.seriesSelector; window.__series.forEach((s, i) => sel.thumbnailCache.set(s.id, [0, 1, 2].map(k => window.__cover(i + k)))); sel.series = window.__series; sel.isLoading = false; sel.render() })()`
    ] },
    { name: 'blend-sheet', route: 'blend', phoneOnly: true, steps: [
        `(() => { const sel = window.router.currentView.seriesSelector; window.__series.forEach((s, i) => sel.thumbnailCache.set(s.id, [0, 1, 2].map(k => window.__cover(i + k)))); sel.series = window.__series; sel.isLoading = false; sel.render() })()`,
        `document.querySelector('#blend-series-pick').click()`,
        `(() => { const f = document.querySelector('.blend-sheet__search'); f.value = 'series number 2'; f.dispatchEvent(new Event('input')) })()`
    ] },
    { name: 'blend-recipes', route: 'blend', steps: [
        `(() => { const sel = window.router.currentView.seriesSelector; window.__series.forEach((s, i) => sel.thumbnailCache.set(s.id, [0, 1, 2].map(k => window.__cover(i + k)))); sel.series = window.__series; sel.isLoading = false; sel.render() })()`,
        `(() => { const v = window.router.currentView; const s0 = v.seriesSelector; s0.selectedSeries = window.__series[1]; s0.onSeriesSelect(window.__series[1]) })()`,
        `(() => { const v = window.router.currentView; const s = v.seriesSelector; window.__series.forEach((x, i) => s.thumbnailCache.set(x.id, [0, 1, 2].map(k => window.__cover(i + k)))); s.series = window.__series; s.render(); document.querySelector('#blend-recipe-cards').scrollIntoView(); window.scrollBy(0, -120) })()`
    ] },
    { name: 'blend-ready', route: 'blend', steps: [
        `(() => { const sel = window.router.currentView.seriesSelector; window.__series.forEach((s, i) => sel.thumbnailCache.set(s.id, [0, 1, 2].map(k => window.__cover(i + k)))); sel.series = window.__series; sel.isLoading = false; sel.render() })()`,
        `(() => { const s0 = window.router.currentView.seriesSelector; s0.selectedSeries = window.__series[1]; s0.onSeriesSelect(window.__series[1]) })()`,
        `(() => { document.querySelector('.blend-recipe-card').click() })()`,
        `(() => { document.querySelector('#blend-ingredients-panel').scrollIntoView(); window.scrollBy(0, -100) })()`
    ] }
]

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

const run = (page, expression) => page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })

async function shoot(page, size, scene, measures) {
    await page.send('Page.navigate', { url: `http://127.0.0.1:${port}/${scene.route}` })
    await sleep(Number(process.env.SETTLE_MS || 3500))
    await run(page, FIXTURES)
    for (const step of scene.steps) {
        const { exceptionDetails } = await run(page, `(() => { ${step}; return true })()`)
        if (exceptionDetails) console.error(scene.name, size.name, exceptionDetails.exception?.description || exceptionDetails.text)
        await sleep(700)
    }
    await run(page, `document.querySelectorAll('.last-update').forEach(el => { el.textContent = 'Last updated: (frozen for the comparison)' }); document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; transition: none !important; caret-color: transparent !important }</style>')`)
    await sleep(300)
    const { result } = await run(page, MEASURE)
    measures[`${scene.name}-${size.name}`] = result.value
    const shot = await page.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(out, `${scene.name}-${size.name}.png`), Buffer.from(shot.data, 'base64'))
    if (process.env.FULL_PAGE && size.mobile) {
        const clip = { x: 0, y: 0, width: result.value.scrollWidth, height: Math.min(result.value.scrollHeight, 6000), scale: 1 }
        const full = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip })
        fs.writeFileSync(path.join(out, `${scene.name}-${size.name}-full.png`), Buffer.from(full.data, 'base64'))
    }
}

async function main() {
    fs.mkdirSync(out, { recursive: true })
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'f76hb-'))
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
        const only = process.env.SCENES ? process.env.SCENES.split(',') : null
        for (const size of SIZES) {
            await page.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
            await page.send('Emulation.setTouchEmulationEnabled', { enabled: size.mobile })
            for (const scene of SCENES) {
                if (scene.phoneOnly && !size.mobile) continue
                if (only && !only.includes(scene.name)) continue
                await shoot(page, size, scene, measures)
            }
        }
        fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify(measures, null, 1))
        page.close()
    } finally {
        chrome.kill()
    }
}

main().catch(error => { console.error(error); process.exit(1) })
