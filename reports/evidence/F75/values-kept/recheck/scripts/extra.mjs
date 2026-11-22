import path from 'node:path'
import fs from 'node:fs'
import { chromium } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
const shots = '/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f75-kept-recheck/work/shots'
const b = await chromium.launch(); const out = {}
for (const port of [5711, 5712]) for (const cur of ['USD', 'BRL']) for (const width of [1280, 1440, 1024]) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } }); const p = await ctx.newPage()
  await p.clock.install({ time: new Date('2026-11-21T15:00:00.000Z') })
  await p.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') || r.request().url().startsWith('data:') ? r.continue() : r.abort())
  await p.addInitScript(([c]) => { window.__SEED = 'allKept'; localStorage.setItem('inventoryCurrency', c) }, [cur])
  await p.goto('http://127.0.0.1:' + port + '/@fs/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f75-kept-recheck/work/harness/inventory.html'); await p.waitForFunction(() => document.body.dataset.ready)
  if (cur === 'BRL') { await p.getByRole('button', { name: 'BRL', exact: true }).first().click().catch(()=>{}); await p.waitForTimeout(400) }
  out[port + '-' + cur + '-' + width] = await p.evaluate(() => [...document.querySelectorAll('*')].filter(el => /^CD · /.test(el.innerText || '') && el.children.length <= 2).map(el => ({ t: el.innerText, sw: el.scrollWidth, cw: el.clientWidth, clipped: el.scrollWidth > el.clientWidth + 1 })))
  await ctx.close()
}
// the album window
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage()
await p.clock.install({ time: new Date('2026-11-21T15:00:00.000Z') })
await p.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') || r.request().url().startsWith('data:') ? r.continue() : r.abort())
await p.goto('http://127.0.0.1:5712/@fs/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f75-kept-recheck/work/harness/inventory.html'); await p.waitForFunction(() => document.body.dataset.ready)
for (const id of ['a', 'c']) {
  await p.evaluate((id) => window.__h.view.handleViewWithModal(id), id); await p.waitForTimeout(900)
  const info = await p.evaluate(() => { const all = [...document.querySelectorAll('*')].filter(el => /Estimated value/i.test(el.innerText || '') && /Read on|read/i.test(el.innerText || '') && el.getBoundingClientRect().height > 30).sort((a, b) => a.innerText.length - b.innerText.length); const el = all[0]; if (!el) return { body: document.body.innerText.slice(-1500) }; const r = el.getBoundingClientRect(); return { text: el.innerText.replace(/\n+/g, ' | '), links: [...el.querySelectorAll('a')].map(a => a.innerText + ' -> ' + a.href), rect: [r.x, r.y, r.width, r.height] } })
  out['window-' + id] = info
  if (info.rect) await p.screenshot({ path: path.join(shots, 'b1280-window-' + id + '.png'), clip: { x: info.rect[0] - 6, y: info.rect[1] - 6, width: info.rect[2] + 12, height: info.rect[3] + 12 } })
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
}
fs.writeFileSync('/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f75-kept-recheck/work/extra.json', JSON.stringify(out, null, 2)); await b.close(); console.log('ok')
