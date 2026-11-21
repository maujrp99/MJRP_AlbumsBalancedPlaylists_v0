import { createRequire } from 'module'
const require = createRequire('/Users/maujrp/mjrp/projects/MJRPpersonal/package.json')
const { chromium } = require('playwright')
const fs = require('fs')
const [,, base, tag, outDir, widthsArg, opts = ''] = process.argv
const widths = widthsArg.split(',').map(Number)
const reduce = opts.includes('reduce'), nogl = opts.includes('nogl'), poses = opts.includes('few') ? ['a1','a3','flip50','b1'] : ['a1','a2','a3','a4','a5','flip25','flip50','flip75','b1','b2']
fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const facts = []
for (const w of widths) {
  const h = w >= 1920 ? 1080 : w >= 1440 ? 900 : w >= 1280 ? 800 : w < 600 ? 852 : 768
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: reduce ? 'reduce' : 'no-preference', isMobile: w < 600, hasTouch: w < 600, locale: 'en-US', colorScheme: 'dark' })
  const page = await ctx.newPage()
  const errs = []; page.on('pageerror', e => errs.push(String(e)))
  await page.goto(base + (nogl ? '?nogl' : ''), { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const info = await page.evaluate(() => ({ albums: (window.__splash?.albums || []).map(a => JSON.stringify(a).slice(0,90)), live: document.querySelector('#stage')?.classList.contains('live'), html: document.documentElement.className }))
  for (const p of poses) {
    await page.evaluate((p) => {
      const vh = innerHeight
      if (p.startsWith('flip')) {
        const f = Number(p.slice(4)) / 100, el = document.getElementById('flip')
        const top = 0.75 * vh - f * (el.offsetHeight + 0.25 * vh)
        scrollTo(0, el.getBoundingClientRect().top + scrollY - top)
      } else document.getElementById(p).scrollIntoView({ block: 'start' })
      dispatchEvent(new Event('scroll'))
    }, p)
    await page.waitForTimeout(2200)
    const m = await page.evaluate(() => {
      const st = document.getElementById('stage').getBoundingClientRect(), sc = document.getElementById('scene').getBoundingClientRect()
      const cap = document.getElementById('who')
      const capb = document.getElementById('caption').getBoundingClientRect()
      return { track: window.__splash?.state?.track, flip: window.__splash?.state?.flip, now: document.getElementById('now-track')?.textContent,
        stage: [Math.round(st.left), Math.round(st.top), Math.round(st.right), Math.round(st.bottom)], scene: [Math.round(sc.left), Math.round(sc.top), Math.round(sc.right), Math.round(sc.bottom)],
        caption: cap?.innerText.replace(/\n/g, ' | '), capH: Math.round(capb.height), capLines: cap ? Math.round(cap.getBoundingClientRect().height / parseFloat(getComputedStyle(cap).lineHeight)) : null,
        sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, live: document.getElementById('stage').classList.contains('live') }
    })
    const file = `${outDir}/${tag}-${w}-${p}.png`
    await page.screenshot({ path: file })
    facts.push({ w, h, p, ...m })
  }
  facts.push({ w, info, errs })
  await ctx.close()
}
await browser.close()
fs.writeFileSync(`${outDir}/${tag}-facts.json`, JSON.stringify(facts, null, 1))
console.log('ok', facts.length)
