import { webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
const b = await webkit.launch()
for (const [n, o] of [['iphoneSE', devices['iPhone SE']], ['iphone14', devices['iPhone 14']], ['w820', { ...devices['iPhone 14'], viewport: { width: 820, height: 1000 } }]]) for (const view of ['grid', 'list']) {
  const ctx = await b.newContext(o); const p = await ctx.newPage()
  await p.clock.install({ time: new Date('2026-11-21T15:00:00.000Z') })
  await p.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') || r.request().url().startsWith('data:') ? r.continue() : r.abort())
  await p.addInitScript(() => { window.__SEED = 'long' })
  await p.goto('http://127.0.0.1:5717/judge/inventory.html'); await p.waitForFunction(() => document.body.dataset.ready)
  await p.evaluate((v) => window.__h.view.controller.handleViewModeChange(v), view); await p.waitForTimeout(300)
  await p.getByRole('button', { name: 'BRL', exact: true }).first().click(); await p.waitForTimeout(400)
  const box = await p.evaluate((v) => { const l = document.querySelector(v === 'grid' ? '.inv-tiles' : '.inv-row')?.closest('ul') || document.querySelector('.inv-row').parentElement; const r = l.getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, Math.min(r.height, 900)] }, view)
  await p.screenshot({ path: '/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f75-kept-recheck/work/shots3/' + n + '-' + view + '-BRL-long-tiles.png', clip: { x: box[0], y: box[1], width: box[2], height: box[3] }, fullPage: true })
  await ctx.close()
}
await b.close(); console.log('ok')
