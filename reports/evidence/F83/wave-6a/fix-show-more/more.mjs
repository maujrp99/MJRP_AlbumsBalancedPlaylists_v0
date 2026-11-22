// «Show 50 more» on the phone, Discogs values ON (the app's own server stubbed), parent vs branch, list and gallery, 60 and 130 items.
// The page is scrolled to the very bottom (the button is the last thing above the notice) and the button is tapped: the scroll before and after is recorded.
import { chromium, webkit, devices, serve, DIST, prepareContext, ITEMS, S } from './common.mjs'
import fs from 'node:fs'
const readAt = new Date(Date.now() - 2 * 3600e3).toISOString()
const withValues = (n) => Array.from({ length: n }, (_, i) => {
  const it = { ...ITEMS[i % ITEMS.length], id: `m-${String(i).padStart(3, '0')}`, title: `Album ${String(i).padStart(3, '0')}` }
  const k = i % 6
  if (k === 0) return { ...it, discogsReading: { kind: 'found', release: { id: 100 + i, title: it.title, url: 'https://www.discogs.com/release/' + (100 + i) }, conditions: { mint: 20 + i, nearMint: 15 + i, veryGoodPlus: 10 + i }, currency: 'USD', readAt } }
  if (k === 1) return { ...it, discogsReading: { kind: 'found', basis: 'lowest_for_sale', lowest: { value: 7.5 + i, currency: 'USD' }, forSale: 3, release: { id: 200 + i, title: it.title, url: null }, readAt } }
  if (k === 2) return { ...it, value: { amount: 12.34 + i, currency: 'USD', at: readAt } }
  return it
})
async function stubValues(ctx) {
  await ctx.route(/\/api\/value-sources/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { discogs: 'on' }, outcome: 'found' }) }))
  await ctx.route(/\/api\/exchange-rates/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { base: 'USD', date: '2026-11-21', rates: { USD: 1, EUR: 0.92, GBP: 0.79, BRL: 5.31 } }, outcome: 'found' }) }))
  await ctx.route(/\/api\/album-value/, async r => { await new Promise(z => setTimeout(z, 300)); r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { release: { id: 9001, title: 'x', url: null }, conditions: { mint: 30, nearMint: 20, veryGoodPlus: 10 }, currency: 'USD', readAt: new Date().toISOString() }, outcome: 'found' }) }) })
}
const out = []
const only = process.env.ENG
for (const [engName, eng] of [['chromium', chromium], ['webkit', webkit]].filter(([n]) => !only || n === only)) {
  const widths = (engName === 'webkit' ? (process.env.WWIDTHS || '393') : (process.env.WIDTHS || '393,820,899')).split(',').map(Number)
  for (const width of widths) for (const n of (process.env.NS || '60,130').split(',').map(Number)) for (const gallery of [false, true]) for (const mode of ['bottom', 'button']) {
    const rec = { engine: engName, width, n, view: gallery ? 'gallery' : 'list', mode }
    for (const side of ['parent', 'branch']) {
      const { server, base } = await serve(DIST[side])
      const b = await eng.launch(); const ctx = await b.newContext({ ...devices['iPhone 14'], viewport: { width, height: 852 }, reducedMotion: 'reduce' })
      await prepareContext(ctx); await stubValues(ctx)
      if (gallery) await ctx.addInitScript(() => localStorage.setItem('mjrp_inventory_view_mode', 'grid'))
      const p = await ctx.newPage(); await p.goto(base + '/inventory'); await p.waitForFunction(() => window.__inv, null, { timeout: 20000 }); await p.waitForTimeout(500)
      await p.evaluate(it => window.__inv.setAlbums(it), withValues(n)); await p.waitForSelector('.inv-row, .inv-tile'); await p.waitForTimeout(900)
      const notice = await p.evaluate(() => !!document.querySelector('.inv-discogs-notice'))
      const btn = p.locator('[data-phone-action="more-rows"]')
      if (mode === 'bottom') await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); else await btn.scrollIntoViewIfNeeded()
      await p.waitForTimeout(400)
      const before = await p.evaluate(() => Math.round(scrollY))
      await btn.tap(); await p.waitForTimeout(900)
      const after = await p.evaluate(() => { const a = document.activeElement; const r = a?.closest('.inv-row, .inv-tile')?.getBoundingClientRect(); return { scrollY: Math.round(scrollY), focusedTop: r ? Math.round(r.top) : null, inView: r ? r.bottom > 0 && r.top < innerHeight : null, rows: document.querySelectorAll('.inv-row, .inv-tile').length } })
      rec[side] = { before, ...after, notice }
      await b.close(); server.close()
    }
    rec.equal = rec.parent.scrollY === rec.branch.scrollY && rec.parent.inView === rec.branch.inView && rec.parent.rows === rec.branch.rows && rec.parent.notice && rec.branch.notice
    out.push(rec); console.log(JSON.stringify(rec))
  }
}
fs.writeFileSync(`${S}/more-${process.env.TAG || 'all'}.json`, JSON.stringify(out, null, 1))
console.log('all equal:', out.every(r => r.equal), 'of', out.length)
