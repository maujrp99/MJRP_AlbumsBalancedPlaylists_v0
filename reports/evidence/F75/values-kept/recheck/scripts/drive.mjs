// Judge drive: Chromium against the branch (5712) and the base (5711) harness. Writes results.json and full captures.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const shots = path.join(here, 'shots'); fs.mkdirSync(shots, { recursive: true })
const URL = (port) => `http://127.0.0.1:${port}/@fs${here}/harness/inventory.html`
const NOW = new Date('2026-11-21T15:00:00.000Z')
const R = {}
const browser = await chromium.launch()
let external = 0

async function open(port, { seed = 'kept', mode = 'ok', width = 1280, height = 900, phone = false } = {}) {
    const ctx = await browser.newContext({ viewport: { width, height }, ...(phone && { deviceScaleFactor: 2, hasTouch: true, isMobile: true }) })
    const page = await ctx.newPage()
    await page.clock.install({ time: NOW })
    await page.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || u.startsWith('data:')) return r.continue(); external++; return r.abort() })
    page.on('pageerror', e => console.log('PAGEERROR', e.message))
    await page.addInitScript(([s, m]) => { window.__SEED = s; window.__MODE = m }, [seed, mode])
    await page.goto(URL(port))
    await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 30000 })
    await page.waitForTimeout(300)
    return { ctx, page }
}
const wait = (page, ms) => page.waitForTimeout(ms)
const docOf = (page, id) => page.evaluate((id) => { const d = window.__h.dump(); const k = Object.keys(d).find(k => k.endsWith(`/anonymous-user/inventory/${id}`)); return d[k] }, id)
const state = (page) => page.evaluate(() => ({ asks: window.__h.asks, writes: window.__h.writes, failed: window.__h.failed }))
const text = (page, sel) => page.evaluate((sel) => document.querySelector(sel)?.innerText ?? null, sel)
const cardOf = (page, title) => page.evaluateHandle((title) => [...document.querySelectorAll('[data-album-id], article, .inv-card, li')].filter(el => el.innerText?.includes(title)).sort((a, b) => a.innerText.length - b.innerText.length)[0], title)
async function originInfo(page, title) {
    return page.evaluate((title) => {
        const cards = [...document.querySelectorAll('*')].filter(el => el.children.length < 40 && el.innerText?.includes(title) && el.getBoundingClientRect().height > 60 && el.getBoundingClientRect().height < 700)
        const card = cards.sort((a, b) => a.innerText.length - b.innerText.length)[0]
        if (!card) return null
        const els = [...card.querySelectorAll('*')].filter(el => /Discogs|Yours|Waiting|No CD|lowest/.test(el.innerText || '') && el.children.length <= 3)
        const leaf = els.sort((a, b) => a.innerText.length - b.innerText.length)[0]
        const r = card.getBoundingClientRect()
        const clipped = [...card.querySelectorAll('*')].filter(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible' && (el.innerText || '').length > 0).map(el => ({ text: el.innerText.slice(0, 80), sw: el.scrollWidth, cw: el.clientWidth }))
        const links = [...card.querySelectorAll('a')].map(a => ({ text: a.innerText, href: a.href, title: a.title }))
        return { cardText: card.innerText.replace(/\n+/g, ' | ').slice(0, 400), origin: leaf?.innerText, originTitle: leaf?.closest('[title]')?.title || null, clipped, links, rect: [r.x, r.y, r.width, r.height] }
    }, title)
}
async function shotCard(page, title, file) {
    const info = await originInfo(page, title)
    if (!info) return null
    const [x, y, w, h] = info.rect
    await page.screenshot({ path: path.join(shots, file), clip: { x: Math.max(0, x - 4), y: Math.max(0, y - 4), width: w + 8, height: h + 8 }, fullPage: true })
    return info
}

// ---------- 1. Branch, 1280: kept values with their date, the waiting notice, a written value beside a kept reading
{
    const { ctx, page } = await open(5712)
    const notice = await page.evaluate(() => [...document.querySelectorAll('*')].find(el => /albums? (is|are) waiting/.test(el.innerText || '') && el.children.length < 4)?.innerText)
    R.desk = {
        notice,
        harvest: await shotCard(page, 'Harvest', 'b1280-card-kept.png'),
        hejira: await shotCard(page, 'Hejira', 'b1280-card-lowest.png'),
        fragile: await shotCard(page, 'Fragile', 'b1280-card-notfound.png'),
        okc: await shotCard(page, 'OK Computer', 'b1280-card-written.png'),
        grey: await shotCard(page, 'Grey and Pink', 'b1280-card-waiting.png'),
        header: await text(page, '[data-role="discogs-credit"]')
    }
    await page.screenshot({ path: path.join(shots, 'b1280-full-kept.png'), fullPage: true })
    // album window of a kept value
    await page.evaluate(() => window.__h.view.handleViewWithModal('a'))
    await wait(page, 600)
    R.desk.window = await page.evaluate(() => {
        const m = [...document.querySelectorAll('[role="dialog"], .modal, dialog')].find(el => el.getBoundingClientRect().height > 100)
        const sec = m && [...m.querySelectorAll('*')].filter(el => /Read on/.test(el.innerText || '')).sort((a, b) => a.innerText.length - b.innerText.length)[0]
        const box = sec?.closest('section, div')
        const val = m && [...m.querySelectorAll('section, div')].filter(el => /Estimated value/i.test(el.innerText || '') && /Read on/.test(el.innerText || '')).sort((a, b) => a.innerText.length - b.innerText.length)[0]
        const r = (val || box)?.getBoundingClientRect()
        return { readOn: sec?.innerText, valueText: val?.innerText.replace(/\n+/g, ' | ').slice(0, 500), links: val ? [...val.querySelectorAll('a')].map(a => ({ text: a.innerText, href: a.href })) : [], rect: r ? [r.x, r.y, r.width, r.height] : null }
    })
    if (R.desk.window.rect) { const [x, y, w, h] = R.desk.window.rect; await page.screenshot({ path: path.join(shots, 'b1280-window-kept.png'), clip: { x: x - 6, y: y - 6, width: w + 12, height: h + 12 } }) }
    await ctx.close()
}

// ---------- 2. «Read them now»: reads only the never-read (f, g); what it writes
{
    const { ctx, page } = await open(5712)
    const before = { a: await docOf(page, 'a'), e: await docOf(page, 'e') }
    await page.getByRole('button', { name: 'Read them now' }).first().click()
    await wait(page, 200)
    await page.screenshot({ path: path.join(shots, 'b1280-readnow-running.png'), clip: { x: 0, y: 0, width: 1280, height: 520 } })
    await page.waitForFunction(() => !document.body.innerText.includes('Stop') || window.__h.asks >= 2, null, { timeout: 15000 })
    await wait(page, 1200)
    const s = await state(page)
    R.readNow = {
        asks: s.asks, writes: s.writes,
        f: await docOf(page, 'f'), aSame: JSON.stringify(before.a) === JSON.stringify(await docOf(page, 'a')), eSame: JSON.stringify(before.e) === JSON.stringify(await docOf(page, 'e')),
        noticeAfter: await page.evaluate(() => /waiting for a value\./.test(document.body.innerText)),
        grey: await shotCard(page, 'Grey and Pink', 'b1280-card-after-readnow.png')
    }
    await page.screenshot({ path: path.join(shots, 'b1280-after-readnow.png'), clip: { x: 0, y: 0, width: 1280, height: 520 } })
    // the six-hour guard: the two just read are not asked again by «Read them now» nor «Update values» for them
    await page.getByRole('button', { name: 'Update values' }).first().click()
    await page.waitForFunction(() => !window.__h.inventoryValues || true)
    await wait(page, 4000)
    const s2 = await state(page)
    const asked = await page.evaluate(() => window.__h.asks)
    R.guard = { asksAfterUpdate: asked, newAsks: asked - s.asks, expect: 'a,b,c,d (older than 6 h) = 4; f,g fresh; e written' , writesTail: s2.writes.slice(s.writes.length) }
    // again at once: nothing to ask
    const asks0 = asked
    await page.getByRole('button', { name: 'Update values' }).first().click()
    await wait(page, 800)
    R.guard.secondPressAsks = (await page.evaluate(() => window.__h.asks)) - asks0
    R.guard.toast = await page.evaluate(() => [...document.querySelectorAll('[role="status"], [role="alert"], .toast, [class*="toast"]')].map(t => t.innerText).filter(Boolean).slice(-2))
    await ctx.close()
}

// ---------- 3. «Update values» slow, then Stop
{
    const { ctx, page } = await open(5712, { mode: 'slow' })
    await page.getByRole('button', { name: 'Update values' }).first().click()
    await wait(page, 800)
    await page.screenshot({ path: path.join(shots, 'b1280-update-running.png'), clip: { x: 0, y: 0, width: 1280, height: 520 } })
    R.stop = { runningText: await page.evaluate(() => [...document.querySelectorAll('*')].find(el => /Reading|album \d+ of|of \d+ albums/i.test(el.innerText || '') && el.children.length < 3)?.innerText) }
    await page.waitForFunction(() => window.__h.asks >= 2, null, { timeout: 10000 })
    await page.getByRole('button', { name: 'Stop' }).first().click()
    await wait(page, 2500)
    const s = await state(page)
    R.stop = { ...R.stop, asks: s.asks, writes: s.writes, a: (await docOf(page, 'a')).discogsReading?.readAt, b: (await docOf(page, 'b')).discogsReading?.readAt, c: (await docOf(page, 'c')).discogsReading?.readAt }
    await page.screenshot({ path: path.join(shots, 'b1280-update-stopped.png'), clip: { x: 0, y: 0, width: 1280, height: 520 } })
    await ctx.close()
}

// ---------- 4. Failures: every album fails; token refused after one; the database refuses the write
for (const mode of ['fail', 'tokenAfter1']) {
    const { ctx, page } = await open(5712, { mode })
    await page.getByRole('button', { name: 'Update values' }).first().click()
    await wait(page, 5000)
    const s = await state(page)
    R[`failure_${mode}`] = {
        asks: s.asks, writes: s.writes,
        aReadAt: (await docOf(page, 'a')).discogsReading?.readAt,
        harvest: (await originInfo(page, 'Harvest'))?.cardText,
        animals: (await originInfo(page, 'Animals'))?.cardText,
        body: await page.evaluate(() => [...document.querySelectorAll('[role="status"], [role="alert"], .toast, [class*="toast"]')].map(t => t.innerText).filter(Boolean).slice(-2))
    }
    await page.screenshot({ path: path.join(shots, `b1280-failed-${mode}.png`), clip: { x: 0, y: 0, width: 1280, height: 700 } })
    await ctx.close()
}
{
    const { ctx, page } = await open(5712)
    await page.evaluate(() => { window.__h.failCommit = true })
    await page.getByRole('button', { name: 'Read them now' }).first().click()
    await wait(page, 2500)
    const s = await state(page)
    const shownAfterRefusal = (await originInfo(page, 'Grey and Pink'))?.cardText
    const fBefore = await docOf(page, 'f')
    // the next run keeps what only the browser holds, with no new question
    await page.evaluate(() => { window.__h.failCommit = false })
    const asks0 = s.asks
    await page.getByRole('button', { name: 'Update values' }).first().click()
    await wait(page, 5000)
    R.commitRefused = { failedBatches: s.failed, writesWhileRefused: s.writes.length, shownAfterRefusal, fHadReading: Boolean(fBefore.discogsReading), fAfterNextRun: (await docOf(page, 'f')).discogsReading?.readAt, newAsks: (await page.evaluate(() => window.__h.asks)) - asks0 }
    await ctx.close()
}

// ---------- 5. Concurrent: the person writes a value on an album while the run is writing
{
    const { ctx, page } = await open(5712, { mode: 'slow' })
    await page.getByRole('button', { name: 'Update values' }).first().click()
    await wait(page, 300)
    await page.evaluate(() => window.__h.inventoryService.updateAlbum('a', { value: { amount: 40, currency: 'USD' }, notes: 'edited during the run' }))
    await page.evaluate(() => { window.__h.commitDelay = 800 })
    await page.waitForFunction(() => !document.body.innerText.match(/\bStop\b/), null, { timeout: 30000 }).catch(() => { })
    await wait(page, 1500)
    const a = await docOf(page, 'a')
    R.concurrent = { a: { value: a.value, notes: a.notes, reading: a.discogsReading?.readAt, owned: a.owned, averages: Boolean(a.averages) }, asks: (await state(page)).asks, harvest: (await originInfo(page, 'Harvest'))?.cardText, storeA: await page.evaluate(() => { const it = window.__h.inventoryService.store.getAlbums().find(x => x.id === 'a'); return { value: it.value, notes: it.notes, reading: it.discogsReading?.readAt } }) }
    await ctx.close()
}

// ---------- 6. The person changes mid-run (anonymous -> signed in) and signs out
{
    const { ctx, page } = await open(5712, { mode: 'slow' })
    await page.getByRole('button', { name: 'Update values' }).first().click()
    await page.waitForFunction(() => window.__h.asks >= 2, null, { timeout: 10000 })
    await page.evaluate(() => window.__h.inventoryService.handleUserChange({ currentUser: { uid: 'person-2' } }))
    await page.evaluate(() => window.__h.view.controller.values.inventoryChanged?.())
    await wait(page, 4000)
    const s = await state(page)
    R.switch = {
        writes: s.writes, asks: s.asks,
        docsOfPerson2: await page.evaluate(() => Object.keys(window.__h.dump()).filter(k => k.includes('/person-2/'))),
        screenHasDiscogs: await page.evaluate(() => /Discogs|\$\d/.test(document.getElementById('app').innerText)),
        appText: await page.evaluate(() => document.getElementById('app').innerText.slice(0, 300).replace(/\n+/g, ' | ')),
        readingsInMemory: await page.evaluate(() => window.__h.view.controller.values.readings.size),
        storeItems: await page.evaluate(() => window.__h.inventoryService.store.getAlbums().length)
    }
    await page.evaluate(() => window.__h.inventoryService.handleUserChange({ currentUser: null }))
    await wait(page, 500)
    R.switch.afterSignOut = { storeItems: await page.evaluate(() => window.__h.inventoryService.store.getAlbums().length), readingsInMemory: await page.evaluate(() => window.__h.view.controller.values.readings.size), screenHasDiscogs: await page.evaluate(() => /Discogs ·|\$\d/.test(document.getElementById('app').innerText)) }
    await ctx.close()
}

// ---------- 7. A fresh profile where every unwritten album has a kept reading: values at once, no notice
{
    const { ctx, page } = await open(5712, { seed: 'allKept' })
    R.allKept = { notice: await page.evaluate(() => /waiting for a value/.test(document.body.innerText)), asks: (await state(page)).asks, writes: (await state(page)).writes.length, grey: (await originInfo(page, 'Grey and Pink'))?.cardText }
    await page.screenshot({ path: path.join(shots, 'b1280-allkept-top.png'), clip: { x: 0, y: 0, width: 1280, height: 700 } })
    await ctx.close()
}

// ---------- 8. Old code (base) against documents that have the field: draws, and its run keeps the field
{
    const { ctx, page } = await open(5711, { seed: 'kept' })
    const before = await docOf(page, 'a')
    R.oldTab = { notice: await page.evaluate(() => (document.body.innerText.match(/\d+ albums? (is|are) waiting[^.]*\./) || [])[0]), harvest: (await originInfo(page, 'Harvest'))?.cardText }
    await page.getByRole('button', { name: 'Update values' }).first().click()
    await wait(page, 5000)
    const s = await state(page)
    const after = await docOf(page, 'a')
    R.oldTab = { ...R.oldTab, asks: s.asks, writes: s.writes, readingKept: JSON.stringify(after.discogsReading) === JSON.stringify(before.discogsReading), discogsAfter: after.discogs, notes: after.notes }
    await ctx.close()
}

// ---------- 9. Phone 393 and 320 on the branch: rows, the ⋯ sheet, the album window
for (const width of [393, 320]) {
    const { ctx, page } = await open(5712, { width, height: 852, phone: true })
    const rows = await page.evaluate(() => [...document.querySelectorAll('.inv-row')].map(r => {
        const clipped = [...r.querySelectorAll('*')].filter(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible' && el.innerText).map(el => ({ t: el.innerText.slice(0, 60), sw: el.scrollWidth, cw: el.clientWidth, cls: el.className }))
        return { text: r.innerText.replace(/\n+/g, ' | '), clipped, links: [...r.querySelectorAll('a')].map(a => a.innerText) }
    }))
    R[`phone${width}`] = { rows, pageScrollX: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), notice: await page.evaluate(() => (document.body.innerText.match(/\d+ albums? (is|are) waiting[^.]*\./) || [])[0]) }
    await page.screenshot({ path: path.join(shots, `b${width}-rows.png`) })
    await page.locator('.inv-row', { hasText: 'Harvest' }).locator('[data-phone-action="more"]').click()
    await wait(page, 600)
    R[`phone${width}`].sheet = await page.evaluate(() => { const s = [...document.querySelectorAll('[role="dialog"]')].filter(d => d.getBoundingClientRect().height > 50).pop(); return s ? { text: s.innerText.replace(/\n+/g, ' | ').slice(0, 600), links: [...s.querySelectorAll('a')].map(a => a.innerText) } : null })
    await page.screenshot({ path: path.join(shots, `b${width}-sheet.png`) })
    await ctx.close()
}

fs.writeFileSync(path.join(here, 'results.json'), JSON.stringify({ external, ...R }, null, 2))
await browser.close()
console.log('done, external', external)
