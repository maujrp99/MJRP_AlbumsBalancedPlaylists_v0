// UAT-295: does «The Album Blender» fit the phone header of the app on an address with no screen name (/homework)? On BUILT sites, before against after,
// WebKit as an iPhone at 390 and 375 px. Nothing is clicked. Every host that is not 127.0.0.1 or Google Fonts is aborted (so Firebase, Apple Music and
// Spotify too: nobody is signed in or made anonymous); server closed at the end.
//   BEFORE=<dist> AFTER=<dist> OUT=<folder> node header.mjs
import { webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const OUT = process.env.OUT
const ALLOWED = new Set(['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'])
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const serve = (dist) => new Promise((resolve) => {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x'); let file = path.join(dist, decodeURIComponent(url.pathname))
        if (url.pathname.startsWith('/api/')) { res.writeHead(404); res.end('{}'); return }
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = url.pathname.startsWith('/assets') ? '' : path.join(dist, 'app.html')
        if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res)
    })
    server.listen(0, '127.0.0.1', () => resolve(server))
})
const lines = []
let failed = 0
for (const [side, dist] of [['before', process.env.BEFORE], ['after', process.env.AFTER]]) {
    const server = await serve(dist)
    try {
        for (const width of [390, 375]) {
            const browser = await webkit.launch()
            const context = await browser.newContext({ ...devices['iPhone 14'], viewport: { width, height: 664 }, reducedMotion: 'reduce' })
            const blocked = new Set()
            await context.route('**/*', (route) => { const host = new URL(route.request().url()).hostname; if (!ALLOWED.has(host)) { blocked.add(host); return route.abort() } return route.continue() })
            const page = await context.newPage()
            await page.goto(`http://127.0.0.1:${server.address().port}/homework`, { waitUntil: 'load' })
            await page.waitForSelector('.phone-topbar__title', { timeout: 20000 })
            await page.waitForTimeout(1200)
            const read = await page.evaluate(() => {
                const r1 = (n) => Math.round(n * 10) / 10
                const title = document.querySelector('.phone-topbar__title')
                const bar = title.closest('.phone-topbar') || title.parentElement
                const box = (el) => { const r = el.getBoundingClientRect(); return { x: r1(r.x), right: r1(r.right), y: r1(r.y), w: r1(r.width), h: r1(r.height) } }
                const range = document.createRange(); range.selectNodeContents(title); const ink = range.getBoundingClientRect()
                const s = getComputedStyle(title)
                const others = [...bar.children].filter(el => el !== title && el.getBoundingClientRect().width > 0).map(el => ({ what: (el.getAttribute('aria-label') || el.className || el.tagName).toString().slice(0, 40), ...box(el) }))
                return { text: title.textContent, title: box(title), ink: { x: r1(ink.x), right: r1(ink.right), w: r1(ink.width), lines: title.getClientRects().length }, clipped: title.scrollWidth > title.clientWidth + 0.5, overflow: s.overflow, textOverflow: s.textOverflow, whiteSpace: s.whiteSpace, font: `${s.fontWeight} ${s.fontSize}`, bar: box(bar), others, scrollWidth: document.documentElement.scrollWidth, innerWidth }
            })
            // The built app sends an unknown address to its first screen, so the header shows that screen's name and the fallback name is not on screen.
            // Rehearsal: the two names are written into the very title element, in its own type and box, and measured (the app's code is not changed).
            read.rehearsal = await page.evaluate(() => ['Album Blender', 'The Album Blender'].map((name) => {
                const title = document.querySelector('.phone-topbar__title'); const keep = title.textContent
                title.textContent = name
                const range = document.createRange(); range.selectNodeContents(title); const ink = range.getBoundingClientRect(); const box = title.getBoundingClientRect()
                const menu = [...title.parentElement.children].filter(el => el !== title).map(el => el.getBoundingClientRect()).filter(r => r.width > 0 && r.x > box.x)[0]
                const out = { name, text: Math.round(ink.width * 10) / 10, box: Math.round(box.width * 10) / 10, clipped: title.scrollWidth > title.clientWidth + 0.5, lines: title.getClientRects().length, gapToMenu: menu ? Math.round((menu.x - ink.right) * 10) / 10 : null, menuAt: menu ? Math.round(menu.x * 10) / 10 : null, pageWidth: document.documentElement.scrollWidth }
                title.textContent = keep
                return out
            }))
            if (side === 'after') {
                await page.evaluate(() => { document.querySelector('.phone-topbar__title').textContent = 'The Album Blender' })
                await (await page.$('.phone-topbar__title')).evaluateHandle(el => el.closest('.phone-topbar') || el.parentElement).then(h => h.asElement().screenshot({ path: path.join(OUT, `phone-header-rehearsal-the-album-blender-${width}.png`) }))
            }
            const t = read.title
            const overlaps = read.others.filter(o => !(o.right <= read.ink.x + 0.5 || o.x >= read.ink.right - 0.5))
            const insideBar = read.others.every(o => o.x >= read.bar.x - 0.5 && o.right <= read.bar.right + 0.5)
            const ok = !read.clipped && overlaps.length === 0 && insideBar && read.scrollWidth <= read.innerWidth && Math.round(read.ink.w) <= Math.round(t.w) + 1
            const long = read.rehearsal[1]
            if (side === 'after' && (!ok || long.clipped || long.lines !== 1 || long.gapToMenu < 0 || long.pageWidth > read.innerWidth)) failed++
            lines.push(`${side} ${width}: «${read.text}» ${read.font}; title box ${t.x}..${t.right} (${t.w} px), text ${read.ink.x}..${read.ink.right} (${read.ink.w} px); clipped ${read.clipped}; over a neighbour: ${overlaps.map(o => o.what).join(', ') || 'no'}; neighbours ${read.others.map(o => `${o.what} ${o.x}..${o.right}`).join(' | ')}; page ${read.scrollWidth}/${read.innerWidth}; ${side === 'after' ? (ok ? 'FITS' : 'DOES NOT FIT') : ''}`)
            await (await page.$('.phone-topbar__title')).evaluateHandle(el => el.closest('.phone-topbar') || el.parentElement).then(h => h.asElement().screenshot({ path: path.join(OUT, `phone-header-homework-${side}-${width}.png`) }))
            lines.push(`   rehearsal in the same element: ${read.rehearsal.map(r => `«${r.name}» ${r.text} px of text in a box of ${r.box} px, clipped ${r.clipped}, lines ${r.lines}, ${r.gapToMenu} px before the menu button`).join('; ')}`)
            lines.push(`   hosts aborted: ${[...blocked].join(', ') || 'none'}`)
            await browser.close()
        }
    } finally { await new Promise(r => server.close(r)) }
}
fs.writeFileSync(path.join(OUT, 'phone-header-homework.txt'), lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exit(failed ? 1 : 0)
