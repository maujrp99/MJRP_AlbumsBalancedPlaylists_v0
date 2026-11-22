#!/usr/bin/env node
/**
 * F75 evidence (judge's P2-3): the phone's «⋯» sheet of an album with a lowest asking price (Hejira)
 * and with a suggestion (Harvest), at 393 px, in the REAL inventory screen of the harness.
 *   PLAYWRIGHT_MODULE=<path to playwright/index.mjs> node reports/evidence/F75/values-kept/shoot-phone-sheet.mjs [port]
 */
import { createServer } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.argv[2] || 5295)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const server = await createServer({ configFile: path.join(here, 'harness/vite.inventory.config.mjs'), server: { port, strictPort: true, host: '127.0.0.1' }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()
for (const [id, name] of [['c', 'lowest'], ['a', 'suggested']]) {
    const context = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
    const page = await context.newPage()
    await page.route('**/*', route => (['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort()))
    await page.goto(`http://127.0.0.1:${port}/reports/evidence/F75/values-kept/harness/inventory.html?s=cards`)
    await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 30000 })
    await page.evaluate((albumId) => document.querySelector(`.inv-row[data-album-id="${albumId}"] [data-phone-action="more"]`)?.click(), id)
    await page.waitForSelector('#inventoryItemSheet')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(here, `phone-sheet-${name}-393.png`) })
    console.log(name, (await page.textContent('#inventoryItemSheet')).replace(/\s+/g, ' ').match(/(Lowest asking|Mean of)[^.]*\./)?.[0])
    await context.close()
}
await browser.close()
await server.close()
