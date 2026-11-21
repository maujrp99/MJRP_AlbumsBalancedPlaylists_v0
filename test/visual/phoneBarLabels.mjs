// F88 sensor: on the BUILT site, in WebKit (Safari's engine) with iPhone profiles, the labels of the phone's bottom bar and the
// row of equalizer bars never share pixels, on the home's bar and on the app's bar, and the two bars are the same height.
// Found by the owner on his iPhone (2026-11-21): the built page orders the stylesheets differently from the dev server.
//   node test/visual/phoneBarLabels.mjs [outDir]      (needs `playwright` resolvable, or PLAYWRIGHT_MODULE=<path to playwright/index.mjs>;
//                                                      WebKit by `npx playwright install webkit`). Read-only: the site is served from a build
//                                                      in a temp folder on 127.0.0.1; every request to the auth hosts, Firestore, Apple and Spotify is aborted.
// Exit code 1 if a label meets a bar, if a gap is under 6 px, or if the two bars differ in height.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const { webkit, devices } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const out = process.argv[2]
const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'phone-bars-'))
execFileSync('npx', ['vite', 'build', '--outDir', dist, '--emptyOutDir'], { stdio: 'ignore' })
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
const server = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0])
    let f = path.join(dist, u)
    if (u === '/home') f = path.join(dist, 'index.html')
    else if (u.startsWith('/api/')) { r.writeHead(500); return r.end('{}') }
    else if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, path.extname(u) ? u : 'app.html')
    if (!fs.existsSync(f)) { r.writeHead(404); return r.end() }
    r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' })
    fs.createReadStream(f).pipe(r)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const site = `http://127.0.0.1:${server.address().port}`

const MEASURE = `(() => {
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 }
  const box = (e) => { const g = document.createRange(); g.selectNodeContents(e); const b = g.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom } }
  const labels = [...document.querySelectorAll('.phone-tabbar__label, .thread .stop .lb')].filter(vis).map(box)
  const bars = [...document.querySelectorAll('.phone-tabbar__bars i, .thread .eqbar i')].filter(vis).map(e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom } })
  const hits = labels.flatMap(l => bars.filter(b => l.l < b.r && l.r > b.l && l.t < b.b && l.b > b.t)).length
  const gap = Math.min(...labels.map(l => l.t)) - Math.max(...bars.map(b => b.b))
  const bar = document.querySelector('.phone-tabbar, .thread').getBoundingClientRect()
  const stops = [...document.querySelectorAll('.phone-tabbar__tab, .thread .stop')].filter(vis).map(e => e.getBoundingClientRect().height)
  return { hits, gap, height: bar.height, bottom: bar.bottom, ih: innerHeight, minTarget: Math.min(...stops), labels: labels.length }
})()`
const STRESS = '.phone-tabbar__label,.thread .ms .stop{font-size:15.6px!important;line-height:18px!important}' // iOS larger text, 130 %
const browser = await webkit.launch()
const failures = []
const heights = {}
for (const name of ['iPhone 14', 'iPhone SE']) for (const stress of [false, true]) {
    const ctx = await browser.newContext({ ...devices[name] })
    await ctx.route(/identitytoolkit|securetoken|firestore\.googleapis|js-cdn\.music\.apple|api\.spotify/, (r) => r.abort())
    const page = await ctx.newPage()
    for (const [route, lang] of [['/home', 'pt'], ['/home', 'en'], ['/start'], ['/albums'], ['/playlists'], ['/inventory']]) {
        await page.goto(site + route, { waitUntil: 'load' }).catch(() => {})
        await page.waitForTimeout(1500)
        if (lang) await page.evaluate((l) => document.querySelector(`[data-lang="${l}"]`)?.click(), lang)
        await page.addStyleTag({ content: '#toast-container{display:none!important}' + (stress ? STRESS : '') })
        await page.waitForTimeout(300)
        const m = await page.evaluate(MEASURE)
        const key = `${name.replace(/ /g, '')}${stress ? '-text130' : ''}${route.replace('/', '-')}${lang ? '-' + lang : ''}`
        if (m.hits > 0 || !(m.gap >= 6) || m.minTarget < 44 || m.labels === 0) failures.push(`${key}: ${JSON.stringify(m)}`)
        if (!stress) (heights[name] ||= {})[route.startsWith('/home') ? 'home' : 'app'] = Math.round(m.height)
        if (out) {
            fs.mkdirSync(out, { recursive: true })
            const vp = page.viewportSize()
            await page.screenshot({ path: path.join(out, `${key}-bottom.png`), clip: { x: 0, y: vp.height - 160, width: vp.width, height: 160 } })
        }
    }
    await ctx.close()
}
await browser.close(); server.close(); fs.rmSync(dist, { recursive: true, force: true })
for (const [name, h] of Object.entries(heights)) if (h.home !== h.app) failures.push(`${name}: the home's bar is ${h.home} px and the app's is ${h.app} px`)
console.log('bar heights (home / app):', JSON.stringify(heights))
if (failures.length) { console.error('FAIL\n' + failures.join('\n')); process.exit(1) }
console.log('OK: no label meets a bar; gaps >= 6 px; targets >= 44 px; both bars the same height')
