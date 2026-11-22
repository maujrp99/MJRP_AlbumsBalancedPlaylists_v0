// Second recheck on 2885efb: Chromium on the dev harness (5714), WebKit iPhone on the built harness (5715).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const shots = path.join(here, 'shots2'); fs.mkdirSync(shots, { recursive: true })
const DEV = `http://127.0.0.1:5714/@fs${here}/harness/inventory.html`
const BUILT = 'http://127.0.0.1:5715/judge/inventory.html'
const R = { external: 0 }
const cr = await chromium.launch()
const wk = await webkit.launch()

async function open(browser, url, { seed = 'allKept', mode = 'ok', width = 1280, height = 900, phone = false, currency = null, ctxOpts = null } = {}) {
    const ctx = await browser.newContext(ctxOpts || { viewport: { width, height }, ...(phone && { deviceScaleFactor: 2, hasTouch: true, isMobile: true }) })
    const page = await ctx.newPage()
    await page.clock.install({ time: new Date('2026-11-21T15:00:00.000Z') })
    await page.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || u.startsWith('data:')) return r.continue(); R.external++; return r.abort() })
    page.on('pageerror', e => console.log('PAGEERROR', e.message))
    await page.addInitScript(([s, m]) => { window.__SEED = s; window.__MODE = m }, [seed, mode])
    await page.goto(url)
    await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 30000 })
    if (currency) { await page.getByRole('button', { name: currency, exact: true }).first().click(); await page.waitForTimeout(300) }
    await page.waitForTimeout(300)
    return { ctx, page }
}
// every card's origin line: what is cut, what shows
const cardLines = (page) => page.evaluate(() => [...document.querySelectorAll('[data-line="2"]')].map(line => {
    const origin = line.firstElementChild
    const cut = origin.querySelector('.truncate')
    const tail = origin.querySelector('.shrink-0')
    const card = line.closest('[data-album-id]') || line.parentElement
    const title = [...document.querySelectorAll('h3, h2, [class*="font-bold"]')].find(h => card.contains(h))?.innerText
    return { full: origin.innerText, title: origin.title, cutText: cut?.innerText, cutShown: cut ? cut.clientWidth : null, cutNeeds: cut ? cut.scrollWidth : null, cutIsCut: cut ? cut.scrollWidth > cut.clientWidth + 1 : false, tail: tail?.innerText, lineW: line.clientWidth, card: card.innerText.split('\n')[0] }
}))
const toasts = (page) => page.evaluate(() => [...document.querySelectorAll('[role="status"], [role="alert"], .toast, [class*="toast"]')].map(t => t.innerText.trim()).filter(Boolean))

// 1. cards at the computer's widths, both kinds, USD and BRL
R.cards = {}
for (const width of [1440, 1280, 1024, 900]) for (const currency of [null, 'BRL']) {
    const { ctx, page } = await open(cr, DEV, { width, currency })
    const key = `${width}-${currency || 'USD'}`
    R.cards[key] = { lines: await cardLines(page), strip: await page.evaluate(() => document.querySelector('[data-role="discogs-credit"]')?.innerText) }
    for (const name of ['Hejira', 'Harvest']) {
        const box = await page.evaluate((name) => { const h = [...document.querySelectorAll('[data-line="2"]')].find(l => (l.closest('[data-album-id]') || l.parentElement.parentElement.parentElement).innerText.includes(name)); const b = h?.parentElement.getBoundingClientRect(); return b ? [b.x, b.y, b.width, b.height] : null }, name)
        if (box && (width === 1280 || width === 900)) await page.screenshot({ path: path.join(shots, `card-${name.toLowerCase()}-${key}.png`), clip: { x: box[0] - 4, y: Math.max(0, box[1] - 4), width: box[2] + 8, height: box[3] + 8 }, fullPage: true }).catch(e => console.log("shot", e.message))
    }
    await ctx.close()
}

// 2. phone rows: the date on one line (Chromium dev and WebKit built)
const dateOnOneLine = (page) => page.evaluate(() => [...document.querySelectorAll('.inv-row')].map(r => {
    const walker = document.createTreeWalker(r, NodeFilter.SHOW_TEXT)
    let node, out = null
    while ((node = walker.nextNode())) {
        const i = node.data.search(/\d{1,2}[  ](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/)
        if (i >= 0) { const m = node.data.slice(i).match(/\d{1,2}[  ]\w{3}/)[0]; const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + m.length); const tops = new Set([...range.getClientRects()].map(x => Math.round(x.top))); out = { text: node.data, nbsp: m.includes(' '), lines: tops.size } }
    }
    return { row: r.innerText.split('\n').slice(0, 1)[0], date: out }
}))
for (const width of [393, 320]) {
    let { ctx, page } = await open(cr, DEV, { width, height: 852, phone: true })
    R[`phoneCr${width}`] = { rows: await dateOnOneLine(page), scrollX: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), top: await page.evaluate(() => [...document.querySelectorAll('a')].find(a => a.innerText.includes('Data provided by Discogs'))?.innerText) }
    await page.screenshot({ path: path.join(shots, `phone-cr-${width}.png`) })
    await ctx.close();
    ({ ctx, page } = await open(wk, BUILT, { ctxOpts: { ...devices['iPhone 15 Pro'], viewport: { width, height: 760 } } }))
    R[`phoneWk${width}`] = { rows: await dateOnOneLine(page), scrollX: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) }
    await page.screenshot({ path: path.join(shots, `phone-wk-${width}.png`) })
    await page.locator('.inv-row', { hasText: 'Hejira' }).locator('[data-phone-action="more"]').click()
    await page.waitForTimeout(700)
    R[`phoneWk${width}`].sheet = await page.evaluate(() => { const s = [...document.querySelectorAll('[role="dialog"]')].filter(d => d.getBoundingClientRect().height > 50).pop(); return s ? { text: s.innerText.replace(/\n+/g, ' | ').slice(0, 500), links: [...s.querySelectorAll('a')].map(a => a.innerText) } : null })
    await page.screenshot({ path: path.join(shots, `phone-wk-${width}-sheet.png`) })
    await ctx.close()
}

// 3. the window of both kinds: exact words
{
    const { ctx, page } = await open(cr, DEV)
    for (const id of ['a', 'c']) {
        await page.evaluate((id) => window.__h.view.handleViewWithModal(id), id); await page.waitForTimeout(900)
        const info = await page.evaluate(() => { const el = [...document.querySelectorAll('*')].filter(el => /Estimated value/i.test(el.innerText || '') && /Read on/.test(el.innerText || '') && el.getBoundingClientRect().height > 30).sort((a, b) => a.innerText.length - b.innerText.length)[0]; const r = el.getBoundingClientRect(); return { text: el.innerText.replace(/\n+/g, ' | '), links: [...el.querySelectorAll('a')].map(a => a.innerText), rect: [r.x, r.y, r.width, r.height] } })
        R[`window-${id}`] = info
        await page.screenshot({ path: path.join(shots, `window-${id}.png`), clip: { x: info.rect[0] - 6, y: info.rect[1] - 6, width: info.rect[2] + 12, height: info.rect[3] + 12 }, fullPage: true })
        // single read with the database refusing: the toast, and the value still shows
        if (id === 'c') {
            await page.evaluate(() => { window.__h.failCommit = true })
            await page.evaluate(() => window.__h.view.controller.values.readOne(window.__h.inventoryService.store.getAlbums().find(x => x.id === 'c')))
            await page.waitForTimeout(800)
            R.singleRefused = { toasts: await toasts(page), docC: await page.evaluate(() => window.__h.dump()['artifacts/mjrp-albums/users/anonymous-user/inventory/c'].discogsReading.readAt), shown: await page.evaluate(() => window.__h.view.controller.values.valueOf(window.__h.inventoryService.store.getAlbums().find(x => x.id === 'c'))) }
            await page.screenshot({ path: path.join(shots, 'single-refused.png'), clip: { x: 0, y: 0, width: 1280, height: 200 } })
            await page.evaluate(() => { window.__h.failCommit = false })
        }
        await page.keyboard.press('Escape'); await page.waitForTimeout(400)
    }
    await ctx.close()
}

// 4. a run whose batch is refused, and a run with one invalid reading
{
    let { ctx, page } = await open(cr, DEV, { seed: 'kept' })
    await page.evaluate(() => { window.__h.failCommit = true })
    await page.getByRole('button', { name: 'Read them now' }).first().click()
    await page.waitForTimeout(2500)
    R.runRefused = { toasts: await toasts(page), writes: (await page.evaluate(() => window.__h.writes)).length, grey: await page.evaluate(() => { const it = window.__h.inventoryService.store.getAlbums().find(x => x.id === 'f'); return window.__h.view.controller.values.valueOf(it) }) }
    await page.screenshot({ path: path.join(shots, 'run-refused.png'), clip: { x: 0, y: 0, width: 1280, height: 200 } })
    await ctx.close();
    ({ ctx, page } = await open(cr, DEV, { seed: 'kept', mode: 'invalid1' }))
    await page.getByRole('button', { name: 'Read them now' }).first().click()
    await page.waitForTimeout(2500)
    R.invalid = {
        toasts: await toasts(page),
        writes: await page.evaluate(() => window.__h.writes.map(w => [w.path.split('/').pop(), w.keys])),
        fDoc: await page.evaluate(() => Boolean(window.__h.dump()['artifacts/mjrp-albums/users/anonymous-user/inventory/f'].discogsReading)),
        gDoc: await page.evaluate(() => Boolean(window.__h.dump()['artifacts/mjrp-albums/users/anonymous-user/inventory/g'].discogsReading)),
        fShown: await page.evaluate(() => window.__h.view.controller.values.valueOf(window.__h.inventoryService.store.getAlbums().find(x => x.id === 'f')))
    }
    await page.screenshot({ path: path.join(shots, 'run-invalid.png'), clip: { x: 0, y: 0, width: 1280, height: 200 } })
    await ctx.close()
}
// 5. a lowest-for-sale run on a fresh read: the card says it
{
    const { ctx, page } = await open(cr, DEV, { seed: 'kept', mode: 'lowest', width: 900 })
    await page.getByRole('button', { name: 'Read them now' }).first().click()
    await page.waitForTimeout(2000)
    R.lowestFresh900 = await cardLines(page)
    await ctx.close()
}
fs.writeFileSync(path.join(here, 'results2.json'), JSON.stringify(R, null, 2))
await cr.close(); await wk.close()
console.log('done', R.external)
