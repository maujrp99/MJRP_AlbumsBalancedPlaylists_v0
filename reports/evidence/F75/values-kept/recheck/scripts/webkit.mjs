// The phone layout on the BUILT harness (vite build of the branch tree), Playwright WebKit with an iPhone profile.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const shots = path.join(here, 'shots')
const browser = await webkit.launch()
const out = { version: browser.version(), device: 'iPhone 15 Pro' }
let external = 0
for (const width of [393, 320]) {
    const ctx = await browser.newContext({ ...devices['iPhone 15 Pro'], viewport: { width, height: 760 } })
    const page = await ctx.newPage()
    await page.clock.install({ time: new Date('2026-11-21T15:00:00.000Z') })
    await page.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || u.startsWith('data:')) return r.continue(); external++; return r.abort() })
    page.on('pageerror', e => console.log('PAGEERROR', e.message))
    await page.goto('http://127.0.0.1:5713/judge/inventory.html')
    await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 30000 })
    await page.waitForTimeout(500)
    const rows = await page.evaluate(() => [...document.querySelectorAll('.inv-row')].map(r => ({
        text: r.innerText.replace(/\n+/g, ' | '),
        clipped: [...r.querySelectorAll('*')].filter(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible' && el.innerText).map(el => ({ t: el.innerText.slice(0, 60), sw: el.scrollWidth, cw: el.clientWidth }))
    })))
    out[`w${width}`] = { ua: await page.evaluate(() => navigator.userAgent), rows, pageScrollX: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), notice: await page.evaluate(() => (document.body.innerText.match(/\d+ albums? (is|are) waiting[^.]*\./) || [])[0]) }
    await page.screenshot({ path: path.join(shots, `wk${width}-rows.png`) })
    await page.locator('.inv-row', { hasText: 'Harvest' }).locator('[data-phone-action="more"]').click()
    await page.waitForTimeout(700)
    out[`w${width}`].sheet = await page.evaluate(() => { const s = [...document.querySelectorAll('[role="dialog"]')].filter(d => d.getBoundingClientRect().height > 50).pop(); return s ? { text: s.innerText.replace(/\n+/g, ' | ').slice(0, 600), links: [...s.querySelectorAll('a')].map(a => a.innerText) } : null })
    await page.screenshot({ path: path.join(shots, `wk${width}-sheet.png`) })
    await ctx.close()
}
out.external = external
fs.writeFileSync(path.join(here, 'webkit.json'), JSON.stringify(out, null, 2))
await browser.close()
console.log('webkit done')
