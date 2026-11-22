import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..')
const here = path.join(repo, 'reports/evidence/F76/inventory-gallery-phone')
const out = path.join(here, 'fixes')
fs.mkdirSync(out, { recursive: true })
const { webkit, devices } = await import(path.join(repo, 'node_modules/playwright/index.mjs'))
const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-fix-'))
execFileSync('npx', ['vite', 'build', '--config', path.join(here, 'harness/vite.build.config.mjs')], { cwd: repo, stdio: 'ignore', env: { ...process.env, OUT: dist } })
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((q, r) => {
  const f = path.join(dist, decodeURIComponent(q.url.split('?')[0]))
  if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r)
})
await new Promise((res) => server.listen(0, '127.0.0.1', res))
const url = (q) => `http://127.0.0.1:${server.address().port}/reports/evidence/F76/inventory-gallery-phone/harness/inventory.html?${q}`
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const browser = await webkit.launch()
const result = {}
for (const [name, device] of [['iphone14', devices['iPhone 14']], ['iphoneSE', devices['iPhone SE']]]) {
  const ctx = await browser.newContext({ ...device })
  await ctx.route(BLOCKED, (r) => r.abort())
  const page = await ctx.newPage()
  const open = async (q) => {
    await page.goto(url(q), { waitUntil: 'load' }); await page.waitForSelector('body[data-ready="true"]', { timeout: 15000 })
    await page.addStyleTag({ content: '#toast-container{display:none!important}*{animation:none!important;transition:none!important}' }); await page.waitForTimeout(250)
  }
  const shot = (file, clip) => page.screenshot({ path: path.join(out, `${name}-${file}.jpg`), type: 'jpeg', quality: 70, scale: 'css', ...(clip ? { clip } : {}) })
  const box = async (sel, nth = 0) => (await page.locator(sel).nth(nth).boundingBox())
  // 1 + 2 + 4: the top of the gallery: corners, the reason of the dash, the arrow on the pills
  await open('n=60&view=grid')
  const vp = page.viewportSize()
  await page.evaluate(() => window.scrollTo(0, 0))
  const noValue = page.locator('.inv-tile:has(.inv-tile__value[data-origin="none"])').first()
  await noValue.scrollIntoViewIfNeeded()
  const nb = await noValue.boundingBox()
  await shot('fix2-reason-wraps-and-fix1-corner', { x: 0, y: Math.max(0, nb.y - 8), width: vp.width, height: Math.min(nb.height + 16, vp.height - Math.max(0, nb.y - 8)) })
  result[name] = { reason: await noValue.locator('.inv-tile__origin').evaluate((e) => ({ text: e.textContent, lines: Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)), cut: e.scrollWidth > e.clientWidth + 1 })),
    radius: await page.locator('.inv-tile__cover').first().evaluate((e) => getComputedStyle(e).borderTopLeftRadius) }
  const notOwned = page.locator('.inv-tile[data-status="notowned"], .inv-tile[data-status="not-owned"], .inv-tile[data-status="not_owned"]').first()
  const statuses = await page.locator('.inv-tile').evaluateAll((els) => [...new Set(els.map((e) => e.dataset.status))])
  result[name].statuses = statuses
  const longest = await page.locator('.inv-tile__pill').evaluateAll((els) => { let b = null; els.forEach((e) => { if (!b || e.scrollWidth > b.scrollWidth) b = e }); b.scrollIntoView({ block: 'center' }); const r = b.closest('.inv-tile').getBoundingClientRect(); return { cut: els.filter((e) => e.querySelector('.inv-tile__pill-text').scrollWidth > e.querySelector('.inv-tile__pill-text').clientWidth + 1).length, text: b.textContent, y: r.top, h: r.height } })
  result[name].pills = longest
  await page.waitForTimeout(150)
  await shot('fix4-pill-arrow', { x: 0, y: Math.max(0, longest.y - 4), width: vp.width, height: Math.min(longest.h + 8, vp.height - Math.max(0, longest.y - 4)) })
  // 3: the end of the gallery and of the list, with the back-to-top button showing
  for (const [kind, q] of [['gallery', 'n=60&view=grid'], ['list', 'n=60']]) {
    await open(q)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(300)
    const m = await page.evaluate(() => { const n = document.querySelector('.inv-discogs-notice').getBoundingClientRect(); const b = document.querySelector('.phone-to-top'); const t = b && !b.hidden ? b.getBoundingClientRect() : null; return { noticeBottom: n.bottom, noticeRight: n.right, noticeLeft: n.left, button: t && { top: t.top, left: t.left }, tabbarTop: document.querySelector('.phone-tabbar')?.getBoundingClientRect().top, overlap: !!t && !(t.bottom <= n.top || t.top >= n.bottom || t.right <= n.left || t.left >= n.right) } })
    result[name]['end-' + kind] = m
    await shot('fix3-end-' + kind + '-back-to-top', { x: 0, y: vp.height - 230, width: vp.width, height: 230 })
  }
  // 5: a card reached with the keyboard stays above the bottom menu
  await open('n=60&view=grid')
  const last = await page.evaluate(async () => {
    const tiles = [...document.querySelectorAll('.inv-tile')]; const bar = document.querySelector('.phone-tabbar').getBoundingClientRect().top
    const t = tiles.find((x) => x.getBoundingClientRect().top > innerHeight - 40) || tiles[tiles.length - 1]
    t.querySelector('.inv-tile__open').focus(); await new Promise((r) => setTimeout(r, 400))
    const r = t.getBoundingClientRect(); return { tileBottom: r.bottom, tabbarTop: bar, visible: r.bottom <= bar }
  })
  result[name].keyboard = last
  await shot('fix5-focused-card-above-menu', { x: 0, y: vp.height - 360, width: vp.width, height: 360 })
  await ctx.close()
}
await browser.close(); server.close(); fs.rmSync(dist, { recursive: true, force: true })
fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify(result, null, 1))
console.log(JSON.stringify(result, null, 1))
