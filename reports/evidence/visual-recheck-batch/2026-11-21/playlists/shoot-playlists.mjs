#!/usr/bin/env node
// Visual recheck 2026-11-21: shoots the playlists harness (./harness, served by vite on 5403) at 1280x800 and
// 393x852 (phone: touch, scale 2). Writes <state>-1280.png / <state>-393.png, measures.json, console-errors.json.
//   node reports/evidence/visual-recheck-batch/2026-11-21/playlists/shoot-playlists.mjs [vitePort=5403] [debugPort=9402]
// ONLY=empty,blend limits the states. Includes the Batch Name typing test (F73) on the «generated» page.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DESKTOP, FREEZE, MEASURE, PHONE, evaluate, screenshot, setSize, sleep, startChrome } from '../cdp-lib-inventory-playlists.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const port = process.argv[2] || '5403'
const debugPort = Number(process.argv[3] || 9402)
const only = process.env.ONLY ? process.env.ONLY.split(',') : null
const BASE = `http://127.0.0.1:${port}/`

const SAVED_EXTRA = `(() => ({
    status: document.querySelector('.saved-playlists-status')?.textContent.trim() || null,
    listFailed: document.querySelector('.list-failed')?.textContent.trim() || null,
    groups: [...document.querySelectorAll('.series-group, .saved-phone-series')].map(g => ({ id: g.dataset.seriesId || null, status: g.dataset.status || null, text: g.textContent.replace(/\\s+/g, ' ').trim().slice(0, 90) })),
    tryAgainButtons: [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Try again' && b.getClientRects().length).length,
    placeholder: document.querySelector('.saved-playlists-placeholder')?.textContent.replace(/\\s+/g, ' ').trim() || null,
    seriesStatuses: window.__store ? window.__store.getEntries().map(e => e.series.name.slice(0, 24) + ' = ' + e.status) : null
}))()`

const STATES = {
    generated: { q: 'screen=generated', extra: `(() => ({ batchNameLabel: document.querySelector('label[for="batchNameInput"]')?.textContent.trim(), batchNameValue: document.getElementById('batchNameInput')?.value, exportButtons: [...document.querySelectorAll('#exportSpotifyBtn, #exportJsonBtn, #exportAppleMusicBtn, #saveToHistoryBtn')].filter(b => b.getClientRects().length).map(b => b.textContent.trim()), playlists: document.querySelectorAll('[data-playlist-index], .phone-track, .playlist-card').length }))()` },
    'generated-export': { q: 'screen=generated', phoneOnly: true, run: `document.querySelector('[data-phone-action="export"]').click()`, extra: `(() => ({ sheet: document.querySelector('.sheet .sheet__title')?.textContent, buttons: [...document.querySelectorAll('.sheet button')].map(b => b.textContent.trim()).filter(Boolean) }))()` },
    empty: { q: 'screen=empty', extra: `(() => ({ emptyState: document.querySelector('[data-playlists-empty]')?.textContent.replace(/\\s+/g, ' ').trim() || null, linkToBlend: document.querySelector('[data-playlists-empty] a')?.getAttribute('href') || null, batchNameFieldPresent: Boolean(document.getElementById('batchNameInput')), exportButtons: document.querySelectorAll('#exportSpotifyBtn, #exportJsonBtn').length }))()` },
    'saved-loading': { q: 'screen=saved&mode=loading', extra: SAVED_EXTRA },
    'saved-loading-list': { q: 'screen=saved&mode=loading-list', extra: SAVED_EXTRA },
    'saved-mixed': { q: 'screen=saved&mode=mixed', extra: SAVED_EXTRA },
    'saved-ready': { q: 'screen=saved&mode=ready', extra: SAVED_EXTRA },
    'saved-empty': { q: 'screen=saved&mode=empty', extra: SAVED_EXTRA },
    'saved-failed': { q: 'screen=saved&mode=failed', extra: SAVED_EXTRA },
    'saved-failed-list': { q: 'screen=saved&mode=failed-list', extra: SAVED_EXTRA },
    'saved-retried': { q: 'screen=saved&mode=retried', extra: SAVED_EXTRA },
    'saved-open': { q: 'screen=saved&mode=ready&open=1&batch=1', extra: SAVED_EXTRA },
    blend: { q: 'screen=blend', extra: `(() => ({ title: document.querySelector('h1')?.textContent.trim(), steps: [...document.querySelectorAll('h2')].map(h => h.textContent.trim()), seriesListed: document.querySelectorAll('#blend-series-selector [data-series-id], #blend-series-pick').length }))()` },
    'blend-recipe': { q: 'screen=blend&step=recipe', extra: `(() => ({ steps: [...document.querySelectorAll('h2')].map(h => h.textContent.trim()), recipeCards: document.querySelectorAll('.blend-recipe-card').length }))()` }
}

async function load(page, query) {
    await page.send('Page.navigate', { url: `${BASE}?${query}` })
    for (let i = 0; i < 80; i++) {
        await sleep(200)
        if (await evaluate(page, 'document.body?.dataset.harnessReady || ""')) break
    }
    await sleep(900)
    await evaluate(page, FREEZE)
    await sleep(150)
}

const key = (page, ch) => page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch, code: 'Key' + ch.toUpperCase() })
    .then(() => page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch, code: 'Key' + ch.toUpperCase() }))

/** F73: type 12 letters, one real key event each, while the screen is drawn again (albumsStore notices) and record focus and value. */
async function typingTest(page, size) {
    await load(page, 'screen=generated')
    await evaluate(page, `(() => { const i = document.getElementById('batchNameInput'); window.__node = i; i.focus(); i.select(); return true })()`)
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
    const word = 'albumblender'
    const steps = []
    for (let i = 0; i < word.length; i++) {
        await key(page, word[i])
        // the albums «arrive»: the stores notify and the real view draws itself again, mid-typing
        if ([2, 5, 8, 10].includes(i)) await evaluate(page, `window.__stores.albumsStore.notify(); window.__stores.albumSeriesStore.notify(); true`)
        await sleep(120)
        steps.push(await evaluate(page, `({ focused: document.activeElement?.id || document.activeElement?.tagName, value: document.getElementById('batchNameInput')?.value, sameNode: document.getElementById('batchNameInput') === window.__node })`))
    }
    await sleep(300)
    await evaluate(page, FREEZE)
    await screenshot(page, path.join(here, `generated-typed-${size.name}.png`))
    const final = steps.at(-1)
    return {
        typed: word, length: word.length,
        redrawsTriggered: 4, nodeReplacedByRedraw: steps.some(s => !s.sameNode),
        focusKeptAfterEveryKey: steps.every(s => s.focused === 'batchNameInput'),
        finalValue: final.value, finalValueIsAllTwelveLetters: final.value === word,
        stepsFocusAndValue: steps.map(s => `${s.focused}:${s.value}`)
    }
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
                if (spec.phoneOnly && !size.mobile) continue
                const before = errors.length
                await load(page, spec.q)
                if (spec.run) { await evaluate(page, spec.run); await sleep(700); await evaluate(page, FREEZE) }
                const k = `${state}-${size.name}`
                measures[k] = { ready: await evaluate(page, 'document.body.dataset.harnessReady'), ...(await evaluate(page, MEASURE)), extra: await evaluate(page, spec.extra).catch(e => ({ error: String(e) })) }
                await screenshot(page, path.join(here, `${k}.png`))
                perState[k] = errors.slice(before)
            }
            if (!only || only.includes('typing')) {
                const before = errors.length
                const result = await typingTest(page, size)
                measures[`generated-typing-${size.name}`] = result
                perState[`generated-typing-${size.name}`] = errors.slice(before)
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
