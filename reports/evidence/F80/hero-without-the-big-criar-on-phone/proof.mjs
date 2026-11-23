// UAT-294 (F80): on the phone, signed in, the hero has no big «Criar» button (the top bar already has it); the visitor's «Abrir o app» stays; the
// computer is unchanged in both openings. The browser proof, on BUILT sites, before against after.
//
//   BEFORE=<dist> AFTER=<dist> OUT=<this folder> node proof.mjs
//
// SAFETY: nothing is clicked and no album address is opened. music.apple.com, itunes.apple.com, geo.music.apple.com and open.spotify.com are ABORTED at the
// network layer in every context, and so is every host that is not 127.0.0.1 or one of the four static hosts the page itself names. Each build is served by
// this script's own static server on 127.0.0.1, closed at the end. WebKit as an iPhone at 390 and 375 px, Chromium at 1280 x 800; Portuguese and English.
// The signed-in opening is shown by a stand-in account record in the page's own storage (the key gate.js reads), written before the page loads.
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.env.OUT
const DISTS = { before: process.env.BEFORE, after: process.env.AFTER }
fs.mkdirSync(OUT, { recursive: true })
const NEVER = ['music.apple.com', 'itunes.apple.com', 'geo.music.apple.com', 'open.spotify.com']
const ALLOWED = new Set(['127.0.0.1', 'is1-ssl.mzstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'])
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const r1 = (n) => Math.round(n * 10) / 10

function serve(dist) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (url.pathname === '/' || url.pathname === '/home') file = path.join(dist, 'index.html')
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 600) : ''}`) }
const measures = {}
const PROFILES = [
    { name: 'webkit-390', engine: webkit, phone: true, width: 390, height: 664 },
    { name: 'webkit-375', engine: webkit, phone: true, width: 375, height: 667 },
    { name: 'chromium-1280', engine: chromium, phone: false, width: 1280, height: 800 }
]

const readPage = () => {
    const r1 = (n) => Math.round(n * 10) / 10
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: r1(r.x), y: r1(r.y + scrollY), w: r1(r.width), h: r1(r.height) } }
    const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const hero = document.querySelector('section.hero')
    const heroButtons = [...hero.querySelectorAll('.ctas a')].filter(visible).map(a => ({ text: a.innerText.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href'), box: box(a) }))
    const topButtons = [...document.querySelectorAll('.top a.btn')].filter(visible).map(a => ({ text: a.innerText.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href'), box: box(a) }))
    const bottom = [...document.querySelectorAll('.pbar a, .thread a')].filter(visible).map(a => ({ text: a.innerText.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href') }))
    const focusables = [...document.querySelectorAll('a[href],button')].filter(visible).filter(el => el.closest('.top, section.hero')).map(el => ({ text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 30), y: box(el).y }))
    const sub = [...hero.querySelectorAll('.h-sub')].filter(visible)[0]
    return {
        signedInClass: document.documentElement.classList.contains('in'), innerWidth, scrollWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight,
        hero: box(hero), heroButtons, topButtons, bottom, focusables, subEnds: sub ? r1(box(sub).y + box(sub).h) : null,
        stage: box(document.querySelector('.stage-col')), crate: box(document.getElementById('scene')), caption: box(document.querySelector('.caption')),
        sections: Object.fromEntries([...document.querySelectorAll('section[id]')].map(s => [s.id, box(s)]))
    }
}

async function run(profile, side, lang, base, signedIn) {
    const tag = `${profile.name}-${lang}-${signedIn ? 'in' : 'out'}-${side}`
    const browser = await profile.engine.launch()
    const options = profile.phone
        ? { ...devices['iPhone 14'], viewport: { width: profile.width, height: profile.height }, reducedMotion: 'reduce' }
        : { viewport: { width: profile.width, height: profile.height }, reducedMotion: 'reduce' }
    const context = await browser.newContext(options)
    const blocked = new Set()
    await context.route('**/*', (route) => {
        const host = new URL(route.request().url()).hostname
        if (NEVER.includes(host) || !ALLOWED.has(host)) { blocked.add(host); return route.abort() }
        return route.continue()
    })
    if (lang === 'en') await context.addInitScript(() => { try { localStorage.setItem('albumblender:lang', 'en') } catch { /* Portuguese */ } })
    if (signedIn) await context.addInitScript(() => { try { localStorage.setItem('firebase:authUser:AIzaStandIn:[DEFAULT]', JSON.stringify({ uid: 'stand-in', isAnonymous: false })) } catch { /* visitor */ } })
    const page = await context.newPage()
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    await page.goto(`${base}/?stay`, { waitUntil: 'load' })
    await page.waitForFunction(() => document.documentElement.classList.contains('js'))
    await page.waitForTimeout(900)
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300)
    if (lang === 'pt' && (profile.width === 390 || !profile.phone)) await page.screenshot({ path: path.join(OUT, `${tag}-first-screen.png`) }) // the first screen as the window shows it, not the whole page
    const read = await page.evaluate(readPage)
    read.errors = errors; read.blocked = [...blocked]
    measures[tag] = read
    note(`${tag}: no console error`, errors.length === 0, errors.join(' | '))
    note(`${tag}: no request left for Apple Music or Spotify`, !read.blocked.some(h => NEVER.includes(h)), `aborted: ${read.blocked.join(', ') || 'none'}`)
    note(`${tag}: the page shows the ${signedIn ? 'signed-in' : 'visitor'} opening`, read.signedInClass === signedIn)
    await browser.close()
}

const servers = {}
for (const side of Object.keys(DISTS)) servers[side] = await serve(DISTS[side])
const lines = []
try {
    for (const profile of PROFILES) for (const lang of ['pt', 'en']) for (const signedIn of [true, false]) for (const side of ['before', 'after']) await run(profile, side, lang, servers[side].base, signedIn)
    for (const profile of PROFILES) for (const lang of ['pt', 'en']) for (const signedIn of [true, false]) {
        const tag = `${profile.name}-${lang}-${signedIn ? 'in' : 'out'}`
        const [a, b] = ['before', 'after'].map(side => measures[`${tag}-${side}`])
        const create = lang === 'pt' ? 'Criar' : 'Create'
        const same = JSON.stringify([a.hero, a.heroButtons, a.topButtons, a.stage, a.crate, a.caption, a.sections, a.pageHeight]) === JSON.stringify([b.hero, b.heroButtons, b.topButtons, b.stage, b.crate, b.caption, b.sections, b.pageHeight])
        if (profile.phone && signedIn) {
            note(`${tag}: the hero had the big «${create}» and has no button now`, a.heroButtons.length === 1 && a.heroButtons[0].text === create && b.heroButtons.length === 0, `before: ${a.heroButtons.map(x => `${x.text} ${x.box.w}x${x.box.h}`).join(', ')}`)
            note(`${tag}: the top bar still has «${create}», to the app`, b.topButtons.some(x => x.text === create && x.href === '/start'), b.topButtons.map(x => `${x.text} -> ${x.href}`).join(', '))
            const up = r1(a.crate.y - b.crate.y)
            const below = [...new Set(Object.keys(b.sections).filter(k => k !== 'a1').map(k => r1(a.sections[k].y - b.sections[k].y)))]
            note(`${tag}: the crate comes up and no empty band is left`, up > 40 && b.crate.y - b.subEnds <= a.crate.y - (a.heroButtons[0].box.y + a.heroButtons[0].box.h) + 20 && below.length === 1 && below[0] === up, `crate ${a.crate.y} -> ${b.crate.y} (up ${up} px); from the end of the orange line to the crate: ${r1(b.crate.y - b.subEnds)} px (before, from the button to the crate: ${r1(a.crate.y - a.heroButtons[0].box.y - a.heroButtons[0].box.h)} px); everything below up ${below.join(', ')} px; page ${a.pageHeight} -> ${b.pageHeight}`)
            note(`${tag}: the keyboard goes down the page in order (top bar, then nothing left in the hero)`, b.focusables.every((f, i, arr) => i === 0 || f.y >= arr[i - 1].y - 60), b.focusables.map(f => f.text || '(icon)').join(' > '))
            note(`${tag}: the page is not wider than before`, b.scrollWidth <= a.scrollWidth, `before ${a.scrollWidth}, after ${b.scrollWidth}, screen ${b.innerWidth}`)
            lines.push(`${tag}: crate up ${up} px (${a.crate.y} -> ${b.crate.y}); hero ${a.hero.h} -> ${b.hero.h}; page ${a.pageHeight} -> ${b.pageHeight}; gap title-line to crate ${r1(b.crate.y - b.subEnds)} px`)
        } else if (profile.phone) {
            const open = lang === 'pt' ? 'Abrir o app' : 'Open the app'
            note(`${tag}: the visitor keeps «${open}» in the hero, and nothing moved`, same && b.heroButtons.length === 1 && b.heroButtons[0].text === open && b.heroButtons[0].href === '/start', `hero: ${b.heroButtons.map(x => x.text).join(', ')}; top bar: ${b.topButtons.map(x => x.text).join(', ')}; bottom bar: ${b.bottom.map(x => `${x.text} -> ${x.href}`).join(', ')}`)
            lines.push(`${tag}: unchanged; hero button «${b.heroButtons[0].text}»`)
        } else {
            note(`${tag}: the computer did not change (hero, its buttons, the top bar, the crate, every section)`, same && b.heroButtons.length >= 1, `hero: ${b.heroButtons.map(x => x.text).join(', ')}; top bar: ${b.topButtons.map(x => x.text).join(', ')}`)
            lines.push(`${tag}: unchanged; hero buttons ${b.heroButtons.map(x => `«${x.text}»`).join(', ')}`)
        }
    }
    const img = (name) => `data:image/png;base64,${fs.readFileSync(path.join(OUT, name)).toString('base64')}`
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1200, height: 700 }, deviceScaleFactor: 1 })
    const cell = (title, name) => `<figure><figcaption>${title}</figcaption><img src="${img(name)}"></figure>`
    await page.setContent(`<style>body{margin:0;padding:16px;background:#1b1b20;font:600 14px system-ui;color:#fff}div{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:start}figure{margin:0}figcaption{margin:0 0 6px}img{width:100%;display:block;border-radius:6px}</style>
      <div>${cell('Com conta · antes', 'webkit-390-pt-in-before-first-screen.png')}${cell('Com conta · depois', 'webkit-390-pt-in-after-first-screen.png')}${cell('Sem conta · antes', 'webkit-390-pt-out-before-first-screen.png')}${cell('Sem conta · depois (igual)', 'webkit-390-pt-out-after-first-screen.png')}</div>`)
    await page.waitForTimeout(300)
    await page.locator('body').screenshot({ path: path.join(OUT, 'before-after-phone.png') })
    await browser.close()
} finally {
    for (const side of Object.keys(servers)) await new Promise(resolve => servers[side].server.close(resolve))
}
fs.writeFileSync(path.join(OUT, 'measures.json'), JSON.stringify(measures, null, 1))
fs.writeFileSync(path.join(OUT, 'numbers.txt'), lines.join('\n') + '\n')
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(OUT, 'results.txt'), results.map(r => `${r.ok ? 'PASS' : 'FAIL'}  ${r.what}${r.detail ? '\n      ' + r.detail : ''}`).join('\n') + `\n\n${results.length - failed.length} passed, ${failed.length} failed; nothing clicked, no album address opened; servers closed\n`)
console.log(`${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
