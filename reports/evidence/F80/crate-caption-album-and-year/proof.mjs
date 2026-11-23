// UAT-290 (F80): the caption under the crate says the album's name and the year, without the artist. The browser proof, on BUILT sites, before (main)
// and after (the branch).
//
//   MAIN=<dist of main> BRANCH=<dist of the branch> OUT=<this folder> node proof.mjs
//
// SAFETY: nothing is clicked and no album address is opened. music.apple.com, itunes.apple.com, geo.music.apple.com and open.spotify.com are ABORTED at the
// network layer in every context, and so is every host that is not 127.0.0.1 or one of the four static hosts the page itself names (the covers on Apple's
// image CDN, Google Fonts, the 3D library). The button is judged by href, target, rel, accessible name, box and style only.
// Profiles: WebKit as an iPhone at 390 and 375 px, Chromium at 1280 x 800; Portuguese and English; main and branch.
// On the computer the caption changes with the track: each part of the page is scrolled to and its caption read. On the phone the caption stays on the
// front record. Then, on both, the caption is written for EVERY record of the crate the way the page writes it (the name in bold, the line under it), from
// the records' own data, and measured: that part is a rehearsal of the layout with real names, not the page's own scroll.
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.env.OUT
const DISTS = { main: process.env.MAIN, branch: process.env.BRANCH }
fs.mkdirSync(OUT, { recursive: true })
const NEVER = ['music.apple.com', 'itunes.apple.com', 'geo.music.apple.com', 'open.spotify.com']
const ALLOWED = new Set(['127.0.0.1', 'is1-ssl.mzstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'])
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' }

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
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 500) : ''}`) }
const measures = {}
const PROFILES = [
    { name: 'webkit-390', engine: webkit, phone: true, width: 390, height: 664 },
    { name: 'webkit-375', engine: webkit, phone: true, width: 375, height: 667 },
    { name: 'chromium-1280', engine: chromium, phone: false, width: 1280, height: 800 }
]
const TRACKS = ['a1', 'start', 'albums', 'blend', 'playlists', 'inventory', 'end']

const readCaption = () => {
    const r1 = (n) => Math.round(n * 10) / 10
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: r1(r.x), y: r1(r.y + scrollY), w: r1(r.width), h: r1(r.height) } }
    const cap = document.querySelector('.caption'); const who = document.getElementById('who'); const b = who.querySelector('b'); const am = document.getElementById('am'); const src = document.querySelector('.caption .src')
    const line = [...who.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('')
    const range = document.createRange(); range.selectNodeContents(who); const text = range.getBoundingClientRect()
    const capBox = cap.getBoundingClientRect(); const amBox = am.getBoundingClientRect()
    return {
        title: b.textContent, line, src: src.textContent, caption: box(cap), button: box(am), label: am.getAttribute('aria-label'), href: am.href, target: am.target, rel: am.rel,
        titleEllipsis: b.scrollWidth > b.clientWidth + 0.5, titleLines: Math.round(b.getBoundingClientRect().height / parseFloat(getComputedStyle(b).lineHeight)),
        inside: text.top >= capBox.top - 0.5 && text.bottom <= capBox.bottom + 0.5 && src.getBoundingClientRect().bottom <= capBox.bottom + 0.5,
        clearOfButton: text.right <= amBox.left + 0.5 || amBox.width === 0
    }
}

async function run(profile, side, lang, base) {
    const tag = `${profile.name}-${lang}-${side}`
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
    const page = await context.newPage()
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    await page.goto(`${base}/`, { waitUntil: 'load' })
    await page.waitForFunction(() => document.documentElement.classList.contains('js'))
    await page.waitForTimeout(900)
    const m = measures[tag] = { tracks: {}, every: [] }
    m.page = await page.evaluate(() => {
        const r1 = (n) => Math.round(n * 10) / 10
        return { height: document.documentElement.scrollHeight, scrollWidth: document.documentElement.scrollWidth, innerWidth,
            sections: Object.fromEntries([...document.querySelectorAll('section[id]')].map(s => { const r = s.getBoundingClientRect(); return [s.id, { y: r1(r.y + scrollY), h: r1(r.height) }] })) }
    })
    for (const track of (profile.phone ? ['a1'] : TRACKS)) {
        if (!profile.phone) { await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), track); await page.waitForTimeout(500) }
        else { await page.locator('.caption').evaluate(el => el.scrollIntoView({ block: 'center' })); await page.waitForTimeout(300) }
        m.tracks[track] = await page.evaluate(readCaption)
        await page.locator('.caption').screenshot({ path: path.join(OUT, `${tag}-caption-${track}.png`) })
    }
    // every record of the crate, written into the caption the way the page writes it
    const records = await page.evaluate(() => [...document.querySelectorAll('#box img.sl')].map(i => ({ t: i.dataset.t, a: i.dataset.a, y: i.dataset.y })))
    for (const rec of records) {
        await page.evaluate(({ rec, withArtist }) => {
            const b = document.createElement('b'); b.textContent = rec.t
            document.getElementById('who').replaceChildren(b, document.createTextNode(withArtist ? `${rec.a} · ${rec.y}` : `${rec.y}`))
        }, { rec, withArtist: side === 'main' })
        m.every.push(await page.evaluate(readCaption))
    }
    m.errors = errors; m.blocked = [...blocked]
    note(`${tag}: no console error`, errors.length === 0, errors.join(' | '))
    note(`${tag}: no horizontal scroll`, m.page.scrollWidth <= m.page.innerWidth, `${m.page.scrollWidth} / ${m.page.innerWidth}`)
    note(`${tag}: no request left for Apple Music or Spotify`, !m.blocked.some(h => NEVER.includes(h)), `aborted: ${m.blocked.join(', ') || 'none'}`)
    if (side === 'branch') {
        const listen = lang === 'pt' ? 'Ouça no Apple Music' : 'Listen on Apple Music'
        const shown = Object.entries(m.tracks)
        note(`${tag}: the caption says the album and the year, no artist; the cover credit stays`, shown.every(([, c]) => /^\d{4}$/.test(c.line) && c.src === (lang === 'pt' ? 'Capa do Apple Music' : 'Artwork from Apple Music')), shown.map(([t, c]) => `${t}: ${c.title} / ${c.line}`).join('; '))
        note(`${tag}: the button's name still says album and artist; new tab; Apple Music's address`, shown.every(([, c]) => c.label.startsWith(`${listen}: ${c.title}, `) && c.label.length > `${listen}: ${c.title}, `.length + 10 && c.target === '_blank' && c.rel === 'noopener' && c.href.startsWith('https://music.apple.com/us/album/')), shown.map(([, c]) => c.label).join(' | '))
        note(`${tag}: every record of the crate (${m.every.length}): the text stays inside the caption and clear of the button`, m.every.every(c => c.inside && c.clearOfButton), m.every.map(c => `${c.title}: ${c.caption.h} px${c.titleEllipsis ? ' (name ends in an ellipsis)' : ''}`).join('; '))
    }
    await browser.close()
}

const servers = {}
for (const side of Object.keys(DISTS)) servers[side] = await serve(DISTS[side])
const heights = []
try {
    for (const profile of PROFILES) for (const lang of ['pt', 'en']) for (const side of ['main', 'branch']) await run(profile, side, lang, servers[side].base)
    for (const profile of PROFILES) for (const lang of ['pt', 'en']) {
        const [a, b] = ['main', 'branch'].map(side => measures[`${profile.name}-${lang}-${side}`])
        const tag = `${profile.name}-${lang}`
        const tr = Object.keys(b.tracks)
        const d = tr.map(t => `${t}: ${a.tracks[t].caption.h} -> ${b.tracks[t].caption.h}`)
        const same = tr.every(t => a.tracks[t].caption.h === b.tracks[t].caption.h)
        heights.push(`${tag}  shown: ${d.join('; ')}  | page ${a.page.height} -> ${b.page.height}`)
        heights.push(`${tag}  every record (main -> branch): ${b.every.map((c, i) => `${c.title} ${a.every[i].caption.h} -> ${c.caption.h}`).join('; ')}`)
        if (profile.phone) note(`${tag}: the caption's height (it changes on the phone: the artist's line wrapped)`, true, `${d.join('; ')}; page ${a.page.height} -> ${b.page.height} (${b.page.height - a.page.height} px)`)
        else {
            note(`${tag}: the caption has the same height on every part, and with every record`, same && b.every.every((c, i) => c.caption.h === a.every[i].caption.h), d.join('; '))
            note(`${tag}: nothing moved: same page height and sections`, a.page.height === b.page.height && JSON.stringify(a.page.sections) === JSON.stringify(b.page.sections), `${a.page.height} -> ${b.page.height}`)
        }
        note(`${tag}: the button has the same size and the same right edge`, tr.every(t => a.tracks[t].button.w === b.tracks[t].button.w && a.tracks[t].button.h === b.tracks[t].button.h && a.tracks[t].button.x === b.tracks[t].button.x), tr.map(t => `${b.tracks[t].button.w}x${b.tracks[t].button.h} at ${b.tracks[t].button.x}`).join('; '))
        note(`${tag}: the title's ellipsis is as on main (no name cut that was whole before)`, b.every.every((c, i) => c.titleEllipsis === a.every[i].titleEllipsis), b.every.filter(c => c.titleEllipsis).map(c => c.title).join(' | ') || 'no name cut')
    }
    const img = (name) => `data:image/png;base64,${fs.readFileSync(path.join(OUT, name)).toString('base64')}`
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 })
    const cell = (title, name) => `<figure><figcaption>${title}</figcaption><img src="${img(name)}"></figure>`
    await page.setContent(`<style>body{margin:0;padding:16px;background:#1b1b20;font:600 14px system-ui;color:#fff}div{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}figure{margin:0}figcaption{margin:0 0 6px}img{width:100%;display:block;border-radius:6px}</style>
      <div>${cell('Antes (main) · celular 390 px', 'webkit-390-pt-main-caption-a1.png')}${cell('Depois (ramo) · celular 390 px', 'webkit-390-pt-branch-caption-a1.png')}${cell('Antes (main) · celular 375 px · EN', 'webkit-375-en-main-caption-a1.png')}${cell('Depois (ramo) · celular 375 px · EN', 'webkit-375-en-branch-caption-a1.png')}${cell('Antes (main) · computador 1280', 'chromium-1280-pt-main-caption-a1.png')}${cell('Depois (ramo) · computador 1280', 'chromium-1280-pt-branch-caption-a1.png')}${cell('Antes (main) · computador · Playlists', 'chromium-1280-pt-main-caption-playlists.png')}${cell('Depois (ramo) · computador · Playlists', 'chromium-1280-pt-branch-caption-playlists.png')}</div>`)
    await page.waitForTimeout(300)
    await page.locator('body').screenshot({ path: path.join(OUT, 'before-after.png') })
    await browser.close()
} finally {
    for (const side of Object.keys(servers)) await new Promise(resolve => servers[side].server.close(resolve))
}
fs.writeFileSync(path.join(OUT, 'measures.json'), JSON.stringify(measures, null, 1))
fs.writeFileSync(path.join(OUT, 'heights.txt'), heights.join('\n') + '\n')
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(OUT, 'results.txt'), results.map(r => `${r.ok ? 'PASS' : 'FAIL'}  ${r.what}${r.detail ? '\n      ' + r.detail : ''}`).join('\n') + `\n\n${results.length - failed.length} passed, ${failed.length} failed; nothing clicked, no album address opened; servers closed\n`)
console.log(`${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
