import { createRequire } from 'module'
const require = createRequire('/Users/maujrp/mjrp/projects/MJRPpersonal/package.json')
const { chromium } = require('playwright')
const b = await chromium.launch()
for (const [tag, url] of [['real', 'http://127.0.0.1:5191/'], ['main', 'http://127.0.0.1:5193/'], ['fict', 'http://127.0.0.1:5192/']]) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' })
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  await p.evaluate(() => document.getElementById('caption').scrollIntoView({ block: 'center' })); await p.waitForTimeout(800)
  await p.screenshot({ path: `out/phone-${tag}-stage.png` })
  const m = await p.evaluate(() => { const c = document.getElementById('caption'), w = document.getElementById('who'); const btn = c.querySelector('a,button'); return { cap: c.getBoundingClientRect().toJSON(), who: w.getBoundingClientRect().toJSON(), btn: btn?.getBoundingClientRect().toJSON(), html: w.innerHTML.slice(0, 300), sw: document.documentElement.scrollWidth, slots: [...document.querySelectorAll('.slot img')].length } })
  console.log(tag, JSON.stringify(m))
  await ctx.close()
}
await b.close()
