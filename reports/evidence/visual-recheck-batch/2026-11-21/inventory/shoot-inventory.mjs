#!/usr/bin/env node
// Visual recheck 2026-11-21: shoots the inventory harness (./harness/inventory.html) at 1280x800 and 393x852
// (phone: touch, scale 2). Writes <state>-1280.png / <state>-393.png, measures.json, console-errors.json.
//   node reports/evidence/visual-recheck-batch/2026-11-21/inventory/shoot-inventory.mjs [vitePort=5402] [debugPort=9402]
// ONLY=list,edit limits the states.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DESKTOP, FREEZE, MEASURE, PHONE, evaluate, screenshot, setSize, sleep, startChrome } from '../cdp-lib-inventory-playlists.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const port = process.argv[2] || '5402'
const debugPort = Number(process.argv[3] || 9402)
const only = process.env.ONLY ? process.env.ONLY.split(',') : null
const PAGE = `http://127.0.0.1:${port}/reports/evidence/visual-recheck-batch/2026-11-21/inventory/harness/inventory.html`

// state -> the harness scenario that reaches it, and what is read from the page after (extras)
const STATES = {
    list: { s: 'list', extra: `(() => ({ items: window.inventoryView.controller.state.albums.length, shown: window.inventoryView.controller.state.filteredAlbums.length }))()` },
    // F71: the status filter. NOT a dropdown in this build: the three counts of the title row are the filter (press again = All).
    filters: { s: 'filters', extra: `(() => ({ statusControls: [...document.querySelectorAll('[data-status-count]')].map(b => ({ status: b.dataset.statusCount, text: b.textContent.trim(), pressed: b.getAttribute('aria-pressed') })), statusSelectPresent: Boolean(document.querySelector('select#statusFilter, select[id*="status" i], .status-filter')), formatOptions: [...document.querySelectorAll('#formatFilter option')].map(o => o.textContent), sortOptions: [...document.querySelectorAll('#inventorySort option')].map(o => o.textContent), openSheetTitle: document.querySelector('.sheet .sheet__title')?.textContent || null }))()` },
    'filtered-notowned': { s: 'filtered-notowned', extra: `(() => ({ pressed: [...document.querySelectorAll('[data-status-count]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.statusCount), shown: window.inventoryView.controller.state.filteredAlbums.length, allNotOwned: window.inventoryView.controller.state.filteredAlbums.every(i => i.owned === null || i.owned === undefined) }))()` },
    'sort-avg': { s: 'sort-avg', extra: `(() => { const s = window.inventoryView.controller.state; return { sorting: s.sorting, viewMode: s.viewMode, firstFive: s.filteredAlbums.slice(0, 5).map(i => [i.title, i.averages?.rating, i.averages?.popularity]), averagesLines: [...document.querySelectorAll('[data-role="averages"]')].slice(0, 3).map(e => e.textContent.trim()) } })()` },
    'sort-pop': { s: 'sort-pop', extra: `(() => { const s = window.inventoryView.controller.state; return { sorting: s.sorting, firstFive: s.filteredAlbums.slice(0, 5).map(i => [i.title, i.averages?.rating, i.averages?.popularity]), averagesLines: [...document.querySelectorAll('[data-role="averages"]')].slice(0, 3).map(e => e.textContent.trim()) } })()` },
    'series-button': { s: 'series-button', extra: `(() => ({ button: document.getElementById('addSeriesAlbumsBtn')?.textContent.trim() || null, disabled: document.getElementById('addSeriesAlbumsBtn')?.disabled ?? null, noteText: document.querySelector('.inv-sheet')?.textContent.trim().slice(0, 200) || null }))()` },
    'series-confirm': { s: 'series-confirm', extra: `(() => ({ dialogTitle: [...document.querySelectorAll('body h2, body h3')].filter(h => !document.getElementById('app').contains(h) && h.getClientRects().length).map(h => h.textContent.trim())[0], dialogText: [...document.querySelectorAll('body > *:not(#app):not(#header-container):not(#footer-container)')].map(e => e.textContent.replace(/\\s+/g, ' ').trim()).join(' | ').slice(0, 400), buttons: [...document.querySelectorAll('body button')].filter(b => !document.getElementById('app').contains(b) && !b.closest('#header-container, #footer-container, nav') && b.getClientRects().length).map(b => b.textContent.trim() || b.getAttribute('aria-label')), written: window.__writes || 0, inventoryCount: window.__memory.length }))()` },
    'series-result': { s: 'series-result', extra: `(() => ({ before: window.__before, after: window.__memory.length, written: window.__writes || 0, toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.trim()), listCount: window.inventoryView.controller.state.albums.length, notOwnedCount: window.inventoryView.controller.state.stats.notOwnedCount }))()` },
    'series-nothing': { s: 'series-nothing', extra: `(() => ({ toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.trim()), written: window.__writes || 0 }))()` },
    'delete-confirm': { s: 'delete-confirm', extra: `(() => ({ dialogText: [...document.querySelectorAll('body > *:not(#app):not(#header-container):not(#footer-container)')].map(e => e.textContent.replace(/\\s+/g, ' ').trim()).join(' | ').slice(0, 300), buttons: [...document.querySelectorAll('body button')].filter(b => !document.getElementById('app').contains(b) && !b.closest('#header-container, #footer-container, nav') && b.getClientRects().length).map(b => b.textContent.trim() || b.getAttribute('aria-label')), inventoryCount: window.__memory.length, removed: window.__removed || [] }))()` },
    'delete-after': { s: 'delete-after', extra: `(() => ({ before: window.__before, after: window.__memory.length, removed: window.__removed || [], itemStillOnScreen: Boolean(document.querySelector('[data-album-id="inv-1"]')), itemStillInState: window.inventoryView.controller.state.albums.some(i => i.id === 'inv-1'), toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.trim()) }))()` },
    'item-window': { s: 'item-window', extra: `(() => { const root = document.querySelector('.modal-container') || document; const text = root.textContent; const durations = [...root.querySelectorAll('*')].filter(e => e.children.length === 0 && /^\\d+:\\d\\d$/.test(e.textContent.trim())).map(e => e.textContent.trim()); return { durationsFound: durations.length, durationSample: durations.slice(0, 10), noDashDash: !text.includes('--:--'), closeButtons: [...root.querySelectorAll('button')].filter(b => /close|^x$/i.test((b.textContent + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.dataset.action || '')).trim()) || b.dataset.action === 'close' || b.classList.contains('album-window__close')).map(b => ({ text: b.textContent.trim(), ariaLabel: b.getAttribute('aria-label'), action: b.dataset.action || null, visible: b.getClientRects().length > 0 })), title: root.querySelector('h2')?.textContent.trim() } })()` },
    edit: { s: 'edit', extra: `(() => ({ dialogTitle: [...document.querySelectorAll('body h2, body h3')].filter(h => !document.getElementById('app').contains(h) && h.getClientRects().length).map(h => h.textContent.trim())[0], fields: [...document.querySelectorAll('body input, body select, body textarea')].filter(f => !document.getElementById('app').contains(f) && f.getClientRects().length).map(f => f.id || f.name || f.type), buttons: [...document.querySelectorAll('body button')].filter(b => !document.getElementById('app').contains(b) && !b.closest('#header-container, #footer-container, nav') && b.getClientRects().length).map(b => b.textContent.trim() || b.getAttribute('aria-label')) }))()` }
}

async function load(page, scenario) {
    await page.send('Page.navigate', { url: `${PAGE}?s=${scenario}` })
    for (let i = 0; i < 80; i++) {
        await sleep(200)
        if (await evaluate(page, 'document.body?.dataset.ready || ""')) break
    }
    await sleep(700)
    await evaluate(page, FREEZE)
    await sleep(150)
}

async function main() {
    const { page, errors, stop } = await startChrome(debugPort)
    const measures = {}
    const perState = {}
    try {
        for (const size of [DESKTOP, PHONE]) {
            await setSize(page, size)
            for (const [state, spec] of Object.entries(STATES)) {
                if (only && !only.includes(state)) continue
                const before = errors.length
                await load(page, spec.s)
                const key = `${state}-${size.name}`
                const ready = await evaluate(page, 'document.body.dataset.ready')
                measures[key] = { ready, ...(await evaluate(page, MEASURE)), extra: await evaluate(page, spec.extra).catch(e => ({ error: String(e) })) }
                await screenshot(page, path.join(here, `${key}.png`))
                perState[key] = errors.slice(before)
            }
        }
        fs.writeFileSync(path.join(here, 'measures.json'), JSON.stringify(measures, null, 1))
        fs.writeFileSync(path.join(here, 'console-errors.json'), JSON.stringify({ all: errors, perState }, null, 1))
        console.log('states:', Object.keys(measures).length, 'console/network errors:', errors.length)
    } finally {
        stop()
    }
}

main().catch(error => { console.error(error); process.exit(1) })
