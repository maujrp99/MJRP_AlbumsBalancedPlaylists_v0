#!/usr/bin/env node
/**
 * F75 evidence (judge's P1, second recheck): does the origin line of the computer's card fit? The REAL
 * inventory screen of the harness at 900, 1280, 1440 and 1920 px, in USD, EUR, GBP and BRL, with the
 * LONGEST amount (99,999.99 in the currency) in every card. For each card: the text of the origin line,
 * whether anything of it is cut (scrollWidth > clientWidth of the line or of its parts), the card height.
 * Writes origin-line-measures.json and, for 1280 and 1440 in BRL and USD, a capture of each kind.
 *   PLAYWRIGHT_MODULE=<path to playwright/index.mjs> node reports/evidence/F75/values-kept/measure-origin-line.mjs [port]
 */
import { createServer } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.argv[2] || 5293)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const server = await createServer({ configFile: path.join(here, 'harness/vite.inventory.config.mjs'), server: { port, strictPort: true, host: '127.0.0.1' }, logLevel: 'error' })
await server.listen()
const base = `http://127.0.0.1:${port}/reports/evidence/F75/values-kept/harness/inventory.html?s=cards`
const browser = await chromium.launch()
const results = []
const KIND = { a: 'suggested', c: 'lowest' }
const SHOTS = new Set(['1280-BRL', '1280-USD', '1440-BRL', '1440-USD'])

for (const width of [900, 1280, 1440, 1920]) {
    for (const currency of ['USD', 'EUR', 'GBP', 'BRL']) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 })
        const page = await context.newPage()
        await page.route('**/*', route => (['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort()))
        await page.goto(base)
        await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 30000 })
        if (currency !== 'USD') { await page.getByRole('button', { name: currency, exact: true }).first().click(); await page.waitForTimeout(300) }
        const cards = await page.evaluate(() => [...document.querySelectorAll('.inventory-card-wrapper')].map(card => {
            const line = card.querySelector('[data-line="2"]')
            const amount = line.querySelector('[data-role="amount"]')
            if (amount.textContent.trim() !== '—') amount.textContent = amount.textContent.replace(/[\d.,]+$/, '99,999.99') // the longest the inventory can show
            const origin = line.firstElementChild
            const parts = [origin, ...origin.querySelectorAll('*')]
            return {
                id: card.dataset.albumId, origin: origin.textContent.replace(/\s+/g, ' ').trim(), amount: amount.textContent.trim(),
                cut: parts.some(node => node.scrollWidth > node.clientWidth + 0.5), room: Math.round(origin.getBoundingClientRect().width), need: Math.max(...parts.map(node => node.scrollWidth)), height: Math.round(card.getBoundingClientRect().height)
            }
        }))
        results.push({ width, currency, cards })
        if (SHOTS.has(`${width}-${currency}`)) {
            for (const [id, kind] of Object.entries(KIND)) {
                const target = await page.$(`.inventory-card-wrapper[data-album-id="${id}"]`)
                await target.screenshot({ path: path.join(here, `origin-line-${kind}-${width}-${currency}.png`) })
            }
        }
        await context.close()
    }
}
await browser.close()
await server.close()
fs.writeFileSync(path.join(here, 'origin-line-measures.json'), JSON.stringify(results, null, 2))
for (const r of results) for (const c of r.cards.filter(c => KIND[c.id])) console.log(r.width, r.currency, c.id, c.cut ? 'CUT' : 'fits', `room ${c.room}px need ${c.need}px`, `h ${c.height}`, `«${c.origin}»`, c.amount)
