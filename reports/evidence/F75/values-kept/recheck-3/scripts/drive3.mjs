// Third recheck on 765dd4a: computer cards (Chromium, dev 5716), phone gallery and list (WebKit, built 5717).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const shots = path.join(here, 'shots3'); fs.mkdirSync(shots, { recursive: true })
const DEV = `http://127.0.0.1:5716/@fs${here}/harness/inventory.html`
const BUILT = 'http://127.0.0.1:5717/judge/inventory.html'
const R = { external: 0, errors: [] }
const cr = await chromium.launch()
const wk = await webkit.launch()

async function open(browser, url, { seed = 'long', mode = 'ok', ctxOpts, currency = null, view = null }) {
    const ctx = await browser.newContext(ctxOpts)
    const page = await ctx.newPage()
    await page.clock.install({ time: new Date('2026-11-21T15:00:00.000Z') })
    await page.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1') || u.startsWith('data:')) return r.continue(); R.external++; return r.abort() })
    page.on('pageerror', e => R.errors.push(e.message))
    await page.addInitScript(([s, m]) => { window.__SEED = s; window.__MODE = m }, [seed, mode])
    await page.goto(url)
    await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 30000 })
    if (view) { await page.evaluate((v) => window.__h.view.controller.handleViewModeChange(v), view); await page.waitForTimeout(300) }
    if (currency) { await page.getByRole('button', { name: currency, exact: true }).first().click(); await page.waitForTimeout(300) }
    await page.waitForTimeout(300)
    return { ctx, page }
}

// ---- helpers run in the page
const MEASURE = () => {
    const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) }
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; const a = b.match(/[\d.]+/g); if (a && (a.length < 4 || Number(a[3]) > 0.5)) return b } return 'rgb(0,0,0)' }
    window.__contrast = (el) => { const L1 = lum(getComputedStyle(el).color), L2 = lum(bgOf(el)); return Math.round(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)) * 100) / 100 }
    window.__clipped = (root) => [...root.querySelectorAll('*')].filter(el => !el.classList.contains('sr-only') && el.clientWidth > 2 && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible').map(el => ({ t: (el.innerText || '').slice(0, 50), sw: el.scrollWidth, cw: el.clientWidth, cls: String(el.className).slice(0, 60) }))
    window.__overlap = (a, b) => { const r = a.getBoundingClientRect(), s = b.getBoundingClientRect(); return !(r.right <= s.left || s.right <= r.left || r.bottom <= s.top || s.bottom <= r.top) }
    window.__lines = (node) => { const rects = [...node.getClientRects()]; return new Set(rects.map(x => Math.round(x.top))).size }
}

// 1. computer cards
R.desk = {}
for (const width of [900, 1280, 1440, 1920]) for (const currency of ['USD', 'EUR', 'GBP', 'BRL']) {
    const { ctx, page } = await open(cr, DEV, { ctxOpts: { viewport: { width, height: 1000 } }, currency: currency === 'USD' ? null : currency })
    await page.evaluate(MEASURE)
    R.desk[`${width}-${currency}`] = await page.evaluate(() => [...document.querySelectorAll('[data-line="2"]')].map(line => {
        const card = line.closest('[data-album-id]') || line.closest('article') || line.parentElement.parentElement.parentElement
        const origin = line.firstElementChild, amount = line.querySelector('[data-role="amount"]')
        const cr_ = card.getBoundingClientRect()
        const lines = [...card.querySelectorAll('[data-line]')].map(l => Math.round(l.getBoundingClientRect().top - cr_.top))
        const src = origin.querySelector('[data-role="origin-source"]'), kind = origin.querySelector('[data-role="origin-kind"]')
        return {
            name: card.querySelector('h3, h2')?.innerText || card.innerText.split('\n').find(t => /Harvest|Hejira|OK Computer|Grey|Animals|Birds/.test(t)),
            origin: origin.innerText.replace(/\n/g, ' / '), amount: amount?.innerText, title: origin.title,
            clipped: window.__clipped(line), overlap: amount ? window.__overlap(origin, amount) : null,
            fontPx: getComputedStyle(src || origin).fontSize, contrast: window.__contrast(src || origin), contrastKind: kind ? window.__contrast(kind) : null,
            cardH: Math.round(cr_.height), cardX: Math.round(cr_.left), cardY: Math.round(cr_.top), lineTops: lines
        }
    }))
    if ((width === 1280 && (currency === 'USD' || currency === 'BRL')) || (width === 900 && currency === 'BRL')) {
        const boxes = await page.evaluate(() => [...document.querySelectorAll('[data-line="2"]')].slice(0, 4).map(l => { const b = l.parentElement.getBoundingClientRect(); return [b.x, b.y + scrollY, b.width, b.height] }))
        const x0 = Math.min(...boxes.map(b => b[0])), y0 = Math.min(...boxes.map(b => b[1])), x1 = Math.max(...boxes.map(b => b[0] + b[2])), y1 = Math.max(...boxes.map(b => b[1] + b[3]))
        await page.screenshot({ path: path.join(shots, `desk-${width}-${currency}.png`), clip: { x: x0 - 4, y: y0 - 4, width: x1 - x0 + 8, height: y1 - y0 + 8 }, fullPage: true })
    }
    await ctx.close()
}
// also the ordinary amounts, for alignment and the strip
{
    const { ctx, page } = await open(cr, DEV, { seed: 'allKept', ctxOpts: { viewport: { width: 1280, height: 1000 } } })
    R.deskNormal = await page.evaluate(() => [...document.querySelectorAll('[data-line="2"]')].map(l => ({ origin: l.firstElementChild.innerText.replace(/\n/g, ' / '), title: l.firstElementChild.title, h: Math.round((l.closest('[data-album-id]') || l.parentElement.parentElement.parentElement).getBoundingClientRect().height) })))
    await page.screenshot({ path: path.join(shots, 'desk-1280-normal-top.png'), clip: { x: 0, y: 380, width: 1280, height: 560 }, fullPage: true })
    // the window of both kinds, and the single unsaved notice
    for (const id of ['a', 'c']) {
        await page.evaluate((id) => window.__h.view.handleViewWithModal(id), id); await page.waitForTimeout(800)
        R[`window-${id}`] = await page.evaluate(() => [...document.querySelectorAll('*')].filter(el => /Estimated value/i.test(el.innerText || '') && /Read on/.test(el.innerText || '')).sort((a, b) => a.innerText.length - b.innerText.length)[0]?.innerText.replace(/\n+/g, ' | '))
        if (id === 'c') {
            await page.evaluate(() => { window.__h.failCommit = true })
            await page.evaluate(() => window.__h.view.controller.values.readOne(window.__h.inventoryService.store.getAlbums().find(x => x.id === 'c')))
            await page.waitForTimeout(800)
            R.singleRefused = await page.evaluate(() => [...document.querySelectorAll('[role="status"], [role="alert"], .toast, [class*="toast"]')].map(t => t.innerText.trim()).filter(Boolean))
            await page.evaluate(() => { window.__h.failCommit = false })
        }
        await page.keyboard.press('Escape'); await page.waitForTimeout(300)
    }
    await ctx.close()
}
// run notices: refused batch, invalid reading
for (const [mode, refuse] of [['ok', true], ['invalid1', false]]) {
    const { ctx, page } = await open(cr, DEV, { seed: 'kept', mode, ctxOpts: { viewport: { width: 1280, height: 900 } } })
    if (refuse) await page.evaluate(() => { window.__h.failCommit = true })
    await page.getByRole('button', { name: 'Read them now' }).first().click()
    await page.waitForTimeout(2500)
    R[`run-${mode}${refuse ? '-refused' : ''}`] = {
        toasts: await page.evaluate(() => [...document.querySelectorAll('[role="status"], [role="alert"], .toast, [class*="toast"]')].map(t => t.innerText.trim()).filter(Boolean)),
        writes: await page.evaluate(() => window.__h.writes.map(w => w.path.split('/').pop())),
        fShown: await page.evaluate(() => window.__h.view.controller.values.valueOf(window.__h.inventoryService.store.getAlbums().find(x => x.id === 'f')).origin)
    }
    await page.screenshot({ path: path.join(shots, `notice-${mode}${refuse ? '-refused' : ''}.png`), clip: { x: 540, y: 0, width: 740, height: 110 } })
    await ctx.close()
}

// 2. phone: gallery and list, WebKit built
const PHONES = [['iphone14', { ...devices['iPhone 14'] }], ['iphoneSE', { ...devices['iPhone SE'] }], ['w820', { ...devices['iPhone 14'], viewport: { width: 820, height: 1000 } }]]
for (const [pname, opts] of PHONES) for (const view of ['grid', 'list']) for (const currency of ['USD', 'BRL']) for (const seed of ['long', 'allKept']) {
    const { ctx, page } = await open(wk, BUILT, { seed, ctxOpts: opts, currency: currency === 'USD' ? null : currency, view })
    await page.evaluate(MEASURE)
    const key = `${pname}-${view}-${currency}-${seed}`
    R[key] = await page.evaluate((view) => {
        const sel = view === 'grid' ? '.inv-tile:not(.inv-tile--ghost)' : '.inv-row'
        const cells = [...document.querySelectorAll(sel)]
        const out = cells.map(c => {
            const r = c.getBoundingClientRect()
            const amount = c.querySelector('[data-role="amount"], .inv-row__amount, .inv-row__value strong')
            const origin = c.querySelector('.inv-tile__origin, .inv-row__origin') || [...c.querySelectorAll('*')].find(e => /Discogs ·|Yours|Waiting|No CD/.test(e.innerText || '') && e.children.length === 0)
            let dateLines = null
            if (origin) { const tn = [...origin.childNodes].find(n => n.nodeType === 3 && /\d{1,2} \w{3}/.test(n.data)); if (tn) { const i = tn.data.search(/\d{1,2} \w{3}/); const rg = document.createRange(); rg.setStart(tn, i); rg.setEnd(tn, i + tn.data.slice(i).match(/\d{1,2} \w{3}/)[0].length); dateLines = window.__lines(rg) } }
            const kids = [...c.querySelectorAll('.inv-tile__cover, .inv-tile__text, .inv-tile__value, .inv-tile__scores, .inv-tile__bar')]
            const overlaps = []
            for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) if (window.__overlap(kids[i], kids[j])) overlaps.push(`${kids[i].className}×${kids[j].className}`)
            const bar = c.querySelector('.inv-tile__bar')
            return { title: (c.querySelector('.inv-tile__title, .inv-row__title') || c).innerText.split('\n')[0], amount: amount?.innerText, origin: origin?.innerText, dateLines, clipped: window.__clipped(c), overlaps, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), barY: bar ? Math.round(bar.getBoundingClientRect().top - r.top) : null, valueY: c.querySelector('.inv-tile__value') ? Math.round(c.querySelector('.inv-tile__value').getBoundingClientRect().top - r.top) : null }
        })
        return { cells: out, scrollX: document.documentElement.scrollWidth - innerWidth, cols: new Set(out.map(o => o.x)).size }
    }, view)
    if (seed === 'long') await page.screenshot({ path: path.join(shots, `${key}.png`), fullPage: false })
    if (pname === 'iphone14' && view === 'grid' && currency === 'USD' && seed === 'allKept') {
        await page.locator('.inv-tile', { hasText: 'Hejira' }).locator('[data-phone-action="more"]').click(); await page.waitForTimeout(700)
        R.sheetHejira = await page.evaluate(() => { const s = [...document.querySelectorAll('[role="dialog"]')].filter(d => d.getBoundingClientRect().height > 50).pop(); return s ? s.innerText.replace(/\n+/g, ' | ').slice(0, 400) : null })
        await page.screenshot({ path: path.join(shots, 'sheet-hejira-iphone14.png') })
    }
    await ctx.close()
}
fs.writeFileSync(path.join(here, 'results3.json'), JSON.stringify(R, null, 2))
await cr.close(); await wk.close()
console.log('done', R.external, R.errors.length)
