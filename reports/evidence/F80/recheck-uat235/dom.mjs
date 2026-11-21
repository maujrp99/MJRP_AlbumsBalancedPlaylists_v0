import { createRequire } from 'module'
const require = createRequire('/Users/maujrp/mjrp/projects/MJRPpersonal/package.json')
const { chromium } = require('playwright')
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const w = Number(process.argv[2])
const out = {}
for (const [tag, url] of [['real', 'http://127.0.0.1:5191/'], ['main', 'http://127.0.0.1:5193/']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 600 ? 852 : 900 }, isMobile: w < 600, hasTouch: w < 600, colorScheme: 'dark' })
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500)
  out[tag] = await p.evaluate(() => [...document.querySelectorAll('header *, main *:not(#stage *):not(.slot *), footer *')].filter(e => !e.closest('#stage') && e.children.length === 0 && e.getBoundingClientRect().width).map(e => { const r = e.getBoundingClientRect(); return `${e.tagName}#${e.id}.${e.className} ${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)}x${Math.round(r.height)} ${getComputedStyle(e).fontFamily.slice(0,20)}` }))
  await ctx.close()
}
await b.close()
const d = out.real.map((x, i) => x === out.main[i] ? null : [x, out.main[i]]).filter(Boolean)
console.log('elements', out.real.length, out.main.length, 'diffs', d.length); d.slice(0, 15).forEach(x => console.log(' real:', x[0], '\n main:', x[1]))
