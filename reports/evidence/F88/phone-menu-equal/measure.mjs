// F88 evidence: the phone's bottom menu is the same in the home and in the app, measured on the BUILT site in WebKit.
//   node reports/evidence/F88/phone-menu-equal/measure.mjs        (run from the project root; writes next to this file)
// Builds the site into a temp folder, serves it on 127.0.0.1, aborts every request to Firebase Auth / Firestore / installations
// (hosts matching identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations), Apple and Spotify. Per profile (iPhone 14,
// iPhone SE): the bottom 200 px of the home (PT and EN, signed out; signed in = the page's own `html.in` class) and of each app screen,
// the measures of the bar, and one side-by-side image of the home's bottom and the app's bottom. Read-only.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const { webkit, devices } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const out = path.dirname(new URL(import.meta.url).pathname)
const shots = path.join(out, 'shots')
fs.mkdirSync(shots, { recursive: true })
const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'phone-menu-equal-'))
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
  const r2 = (n) => Math.round(n * 100) / 100
  const bar = document.querySelector('.pbar'), bb = bar.getBoundingClientRect()
  const box = (e) => { const b = e.getBoundingClientRect(); return { x: r2(b.left), y: r2(b.top - bb.top), w: r2(b.width), h: r2(b.height) } }
  const stops = [...bar.querySelectorAll('.ms .stop')]
  const font = (e) => { const c = getComputedStyle(e); return c.fontFamily + ' / ' + c.fontSize + ' / ' + c.fontWeight }
  const cur = bar.querySelector('.stop.cur')
  return {
    barHeight: r2(bb.height), barToScreenBottom: r2(innerHeight - bb.bottom),
    barsRow: box(bar.querySelector('.eqbar')), barsCount: bar.querySelectorAll('.eqbar i').length,
    iconBox: box(stops[0].querySelector('.ic')), labelBox: box(stops[0].querySelector('.lb')), labelFont: font(stops[0].querySelector('.lb')),
    iconTops: stops.map(s => box(s.querySelector('.ic')).y), labelTops: stops.map(s => box(s.querySelector('.lb')).y),
    stopHeights: stops.map(s => r2(s.getBoundingClientRect().height)),
    currentColour: cur ? getComputedStyle(cur).color : null, otherColour: getComputedStyle(stops.find(s => s !== cur)).color,
    labels: stops.map(s => s.querySelector('.lb').textContent.trim()),
    bodyPaddingBottom: getComputedStyle(document.body).paddingBottom
  }
})()`
// the text of a label (PT / EN) sets its width; everything else must be the same to the hundredth of a pixel
const pick = (m) => JSON.stringify({ ...m, labels: undefined, barsCount: undefined, currentColour: undefined, otherColour: undefined, labelBox: { y: m.labelBox.y, h: m.labelBox.h } })

const browser = await webkit.launch()
const results = {}
const sideBySide = []
for (const name of ['iPhone 14', 'iPhone SE']) {
    const ctx = await browser.newContext({ ...devices[name] })
    await ctx.route(/identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations|js-cdn\.music\.apple|api\.spotify/, (r) => r.abort())
    const page = await ctx.newPage()
    const profile = name.replace(/ /g, '')
    const pages = [['home-pt-out', '/home', { lang: 'pt' }], ['home-en-out', '/home', { lang: 'en' }], ['home-en-in', '/home', { lang: 'en', signedIn: true }],
        ['app-start', '/start'], ['app-albums', '/albums'], ['app-blend', '/blend'], ['app-saved-playlists', '/saved-playlists'], ['app-inventory', '/inventory']]
    for (const [key, route, opts = {}] of pages) {
        await page.goto(site + route, { waitUntil: 'load' }).catch(() => {})
        await page.waitForTimeout(1800)
        if (opts.lang) await page.evaluate((l) => document.querySelector(`[data-lang="${l}"]`)?.click(), opts.lang)
        if (opts.signedIn) await page.evaluate(() => document.documentElement.classList.add('in'))
        await page.addStyleTag({ content: '#toast-container{display:none!important}' })
        await page.waitForTimeout(400)
        results[`${profile}-${key}`] = await page.evaluate(MEASURE)
        const vp = page.viewportSize()
        await page.screenshot({ path: path.join(shots, `${profile}-${key}-bottom200.png`), clip: { x: 0, y: vp.height - 200, width: vp.width, height: 200 } })
        if (['home-en-out', 'app-start', 'app-inventory'].includes(key)) await page.screenshot({ path: path.join(shots, `${profile}-${key}-first-screen.png`) })
    }
    sideBySide.push(profile)
    await ctx.close()
}

// the numbers must be equal: every page of a profile against the first (the home, PT); only the label texts differ
const verdict = {}
for (const profile of sideBySide) {
    const keys = Object.keys(results).filter(k => k.startsWith(profile + '-'))
    const ref = pick(results[keys[0]])
    verdict[profile] = { reference: keys[0], equal: keys.every(k => pick(results[k]) === ref), differing: keys.filter(k => pick(results[k]) !== ref) }
}
fs.writeFileSync(path.join(out, 'measures.json'), JSON.stringify({ verdict, results }, null, 2))

// the side-by-side image: the home's bottom and the app's bottom, per profile, at the device's own pixel size, and the five icons large
const png = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(shots, f)).toString('base64')
const rows = sideBySide.map(p => `<h3>${p}: home (left) and app Start (right), bottom 200 px</h3><div class="pair"><img src="${png(`${p}-home-en-out-bottom200.png`)}"><img src="${png(`${p}-app-start-bottom200.png`)}"></div>
  <div class="pair"><img src="${png(`${p}-home-pt-out-bottom200.png`)}"><img src="${png(`${p}-app-albums-bottom200.png`)}"></div><p class="s">home PT (left) and app Albums (right)</p>`).join('')
const html = `<!doctype html><meta charset="utf-8"><style>body{background:#222;color:#ddd;font:14px sans-serif;margin:16px}.pair{display:flex;gap:16px;margin-bottom:8px}img{display:block;border:1px solid #444}</style>${rows}`
const ctx = await browser.newContext({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 2 })
const sheet = await ctx.newPage()
await sheet.setContent(html)
await sheet.screenshot({ path: path.join(out, 'home-and-app-bottoms-side-by-side.png'), fullPage: true })
await ctx.close()

// the five icons side by side (the app's bar, Start current, and the home's bar: the same pictures), and the owner's own screenshot before / after
const bar = (f) => `<div style="width:1170px;height:228px;overflow:hidden;border:1px solid #444"><img src="${png(f)}" style="margin-top:-372px;display:block"></div>`
const before = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(out, 'before', f)).toString('base64')
const pair = `<!doctype html><meta charset="utf-8"><style>body{background:#222;color:#ddd;font:20px sans-serif;margin:16px;width:1200px}p{margin:14px 0 6px}</style>
<p>BEFORE · the owner's iPhone, 2026-11-21 · app (house icon on Start, thin row of bars)</p><img src="${before('owner-iphone-app-bottom-before.png')}" style="width:1170px;display:block">
<p>BEFORE · the owner's iPhone · home (taller row of bars, no icons)</p><img src="${before('owner-iphone-home-bottom-before.png')}" style="width:1170px;display:block">
<p>AFTER · iPhone 14, WebKit, built site · app, Start current</p>${bar('iPhone14-app-start-bottom200.png')}
<p>AFTER · iPhone 14, WebKit, built site · home (the same bar; the lit stretch follows the story read)</p>${bar('iPhone14-home-en-out-bottom200.png')}
<p>AFTER · the five icons: Go · Albums · Blend · Playlists · Inventory (app, Albums current)</p>${bar('iPhone14-app-albums-bottom200.png')}`
const ctx2 = await browser.newContext({ viewport: { width: 1240, height: 900 }, deviceScaleFactor: 1 })
const pg2 = await ctx2.newPage()
await pg2.setContent(pair)
await pg2.screenshot({ path: path.join(out, 'before-after-and-five-icons.png'), fullPage: true })
await ctx2.close()
await browser.close(); server.close(); fs.rmSync(dist, { recursive: true, force: true })
console.log(JSON.stringify(verdict, null, 2))
console.log(JSON.stringify(results['iPhone14-home-en-out'], null, 1))
console.log(JSON.stringify(results['iPhone14-app-start'], null, 1))
process.exit(Object.values(verdict).every(v => v.equal) ? 0 : 1)
