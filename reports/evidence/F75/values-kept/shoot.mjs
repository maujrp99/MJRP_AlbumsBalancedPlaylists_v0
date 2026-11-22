#!/usr/bin/env node
/**
 * F75 (REQ-14, REQ-16) evidence: the REAL inventory screen and album window in a browser profile with
 * NOTHING held, the readings coming only from the items (a stubbed database), at 1280 and 393 px.
 * Firebase, Firestore, the server and Discogs are not reachable: every host but localhost is refused,
 * and the harness replaces firebase-init. Writes the captures next to this file and measures.json.
 *   PLAYWRIGHT_MODULE=<path to playwright/index.mjs> node reports/evidence/F75/values-kept/shoot.mjs [port]
 */
import { createServer } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.argv[2] || 5291)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const server = await createServer({ configFile: path.join(here, 'harness/vite.inventory.config.mjs'), server: { port, strictPort: true, host: '127.0.0.1' }, logLevel: 'error' })
await server.listen()
const base = `http://127.0.0.1:${port}/reports/evidence/F75/values-kept/harness/inventory.html`
const browser = await chromium.launch()
const measures = []

async function shoot({ size, width, height, scenario, name, clip }) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 })
    const page = await context.newPage()
    await page.route('**/*', route => (['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort()))
    const errors = []
    page.on('pageerror', error => errors.push(String(error)))
    await page.goto(`${base}?s=${scenario}`)
    await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 30000 })
    const facts = await page.evaluate(() => {
        const text = (node) => (node ? node.textContent.replace(/\s+/g, ' ').trim() : null)
        return {
            waitingNotice: text(document.getElementById('valuesWaitingNotice')),
            cardOrigin: text(document.querySelector('.inventory-card-wrapper[data-album-id="a"] [data-line="2"]')),
            rowValue: text(document.querySelector('.inv-row [data-role="value"]')),
            windowText: text(document.querySelector('.modal-overlay')),
            overflowX: document.documentElement.scrollWidth > window.innerWidth
        }
    })
    const target = clip ? await page.$(clip) : null
    const file = path.join(here, `${name}-${size}.png`)
    if (target) await target.screenshot({ path: file })
    else await page.screenshot({ path: file })
    measures.push({ name, size, errors, facts: { ...facts, windowText: facts.windowText ? facts.windowText.slice(0, 600) : null } })
    await context.close()
}

const SIZES = [{ size: '1280', width: 1280, height: 900 }, { size: '393', width: 393, height: 852 }]
for (const s of SIZES) {
    await shoot({ ...s, scenario: 'cards', name: 'card-kept-value', clip: s.size === '1280' ? '.inventory-card-wrapper[data-album-id="a"]' : '.inv-row' })
    await shoot({ ...s, scenario: 'cards', name: 'screen-no-waiting-notice-but-one' })
    await shoot({ ...s, scenario: 'window', name: 'album-window-kept-value' })
    await shoot({ ...s, scenario: 'window-lowest', name: 'album-window-lowest-for-sale' })
    if (s.size === '1280') await shoot({ ...s, scenario: 'cards', name: 'card-lowest-for-sale', clip: '.inventory-card-wrapper[data-album-id="c"]' })
    else await shoot({ ...s, scenario: 'cards', name: 'rows-kept-values', clip: '.inv-row' })
    // five albums with a kept reading and one that never had one: the notice counts that one only
    await shoot({ ...s, scenario: 'notice', name: 'only-the-never-read-is-waiting' })
}
fs.writeFileSync(path.join(here, 'measures.json'), JSON.stringify(measures, null, 2))
await browser.close()
await server.close()
console.log(JSON.stringify(measures.map(m => ({ name: m.name, size: m.size, errors: m.errors.length, overflowX: m.facts.overflowX, card: m.facts.cardOrigin, row: m.facts.rowValue, notice: m.facts.waitingNotice })), null, 1))
