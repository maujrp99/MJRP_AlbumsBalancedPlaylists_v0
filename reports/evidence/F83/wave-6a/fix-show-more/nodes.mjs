// the text nodes of each list row of the computer, parent vs branch: where do the two sides write the text in a different number of pieces?
import { chromium, serve, DIST, prepareContext, ITEMS } from './common.mjs'
const readAt = new Date(Date.now() - 2 * 3600e3).toISOString()
const items = ITEMS.map((it, i) => {
  const k = i % 6
  if (k === 0) return { ...it, discogsReading: { kind: 'found', release: { id: 100 + i, title: it.title, url: 'https://www.discogs.com/release/' + (100 + i) }, conditions: { mint: 20 + i, nearMint: 15 + i, veryGoodPlus: 10 + i }, currency: 'USD', readAt } }
  if (k === 1) return { ...it, discogsReading: { kind: 'found', basis: 'lowest_for_sale', lowest: { value: 7.5 + i, currency: 'USD' }, forSale: 3, release: { id: 200 + i, title: it.title, url: null }, readAt } }
  if (k === 2) return { ...it, value: { amount: 12.34 + i, currency: 'USD', at: readAt } }
  if (k === 3) return { ...it, discogsReading: { kind: 'not_found', readAt } }
  return it
})
const dump = {}
for (const side of ['parent', 'branch']) {
  const { server, base } = await serve(DIST[side])
  const b = await chromium.launch(); const ctx = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } }); await prepareContext(ctx)
  await ctx.route(/\/api\/value-sources/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { discogs: 'on' }, outcome: 'found' }) }))
  await ctx.addInitScript(() => localStorage.setItem('mjrp_inventory_view_mode', 'list'))
  const p = await ctx.newPage(); await p.goto(base + '/inventory'); await p.waitForFunction(() => window.__inv, null, { timeout: 20000 }); await p.waitForTimeout(600)
  await p.evaluate(it => window.__inv.setAlbums(it), items); await p.waitForSelector('.inventory-row-wrapper'); await p.waitForTimeout(900)
  dump[side] = await p.evaluate(() => [...document.querySelectorAll('.inventory-row-wrapper')].slice(0, 12).map(row => {
    const pieces = []
    const walk = (n, d) => { for (const c of n.childNodes) { if (c.nodeType === 3) { if (c.textContent.trim()) pieces.push(`${d}"${c.textContent}"`) } else if (c.nodeType === 1) { pieces.push(`${d}<${c.tagName.toLowerCase()}>`); walk(c, d + ' ') } } }
    walk(row, '')
    return pieces.join('|')
  }))
  await b.close(); server.close()
}
dump.parent.forEach((a, i) => { if (a !== dump.branch[i]) { const x = a.split('|'), y = dump.branch[i].split('|'); const d = x.map((v, j) => (v !== y[j] ? `${v}  VS  ${y[j]}` : null)).filter(Boolean); console.log('row', i, 'differs; first diffs:', JSON.stringify(d.slice(0, 4)), 'lens', x.length, y.length) } else console.log('row', i, 'same') })
