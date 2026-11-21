import { createRequire } from 'module'
const require = createRequire('/Users/maujrp/mjrp/projects/MJRPpersonal/package.json')
const { chromium } = require('playwright')
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p.goto('http://127.0.0.1:5191/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
const links = await p.$$eval('#groups a, .thread a, header a[href^="#"]', as => as.map(a => a.getAttribute('href') + '|' + (a.getAttribute('aria-label') || a.textContent.trim())))
console.log('links', links)
for (const h of ['#a3', '#flip', '#b1', '#a2']) {
  await p.click(`[aria-label^="Side"][href="${h}"], a.turn[href="${h}"]`); await p.waitForTimeout(2500)
  console.log(h, JSON.stringify(await p.evaluate(() => [window.__splash.state.track, window.__splash.state.flip.toFixed(2), document.getElementById('now-track').textContent, document.getElementById('who').innerText.replace(/\n/g," | ")])))
  if (h === '#flip') await p.screenshot({ path: 'out/thread-1440-flip-click.png' })
}
await p.click('#motion'); await p.waitForTimeout(300)
console.log('pause', await p.evaluate(() => [document.getElementById('motion').getAttribute('aria-pressed'), document.documentElement.className]))
await b.close()
