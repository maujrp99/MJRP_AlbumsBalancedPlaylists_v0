// UAT-286 (F80): on the phone the credit under each record is the album's name only, and the button «Ouça no Apple Music» has the box of the story's
// visual above it (same left edge, same width). The browser proof, on BUILT sites, before (main) and after (the branch).
//
//   MAIN=<dist of main> BRANCH=<dist of the branch> OUT=<this folder> node proof.mjs
//
// SAFETY: nothing is clicked and no album address is opened. The hosts of Apple Music and Spotify are ABORTED at the network layer in every context
// (music.apple.com, itunes.apple.com, geo.music.apple.com, open.spotify.com), and so is every host that is not 127.0.0.1 or one of the four static hosts
// the page itself names (the covers on Apple's image CDN, Google Fonts, the 3D library). The buttons are judged by href, target, rel, accessible name,
// box and style only. Each build is served by this script's own static server on 127.0.0.1, closed at the end.
// Profiles: WebKit as an iPhone at 390, 393 and 375 px (main and branch); Chromium at 1280 x 800 (the computer must not change). Portuguese and English.
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
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 400) : ''}`) }
const measures = {}
const boxes = []

const PROFILES = [
    { name: 'webkit-390', engine: webkit, phone: true, width: 390, height: 664, photos: true },
    { name: 'webkit-393', engine: webkit, phone: true, width: 393, height: 852, photos: false },
    { name: 'webkit-375', engine: webkit, phone: true, width: 375, height: 667, photos: true },
    { name: 'chromium-1280', engine: chromium, phone: false, width: 1280, height: 800, photos: false }
]
const STORIES = ['start', 'albums', 'blend', 'playlists', 'inventory']

const readPage = () => {
    const r1 = (n) => Math.round(n * 10) / 10
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: r1(r.x), y: r1(r.y + scrollY), w: r1(r.width), h: r1(r.height) } }
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const stories = [...document.querySelectorAll('.v4-lead')].filter(visible).map((lead) => {
        const a = lead.querySelector('.slot-am a')
        const who = lead.querySelector('.slot-who')
        const credit = lead.querySelector('.slot-am')
        const motif = lead.querySelector('.v4-motif')
        const slot = lead.querySelector('.slot')
        const next = lead.nextElementSibling
        if (!credit || !visible(credit)) return { story: lead.closest('section').id, lead: box(lead), visual: box(motif) }
        const s = a ? getComputedStyle(a) : null
        const label = a ? a.querySelector('[data-i18n="c.listen"]') : null
        return {
            story: lead.closest('section').id, lead: box(lead), record: box(slot), visual: box(motif), credit: box(credit), nextTop: next ? box(next).y : null,
            creditText: credit.innerText.replace(/\s+/g, ' ').trim(),
            who: who ? { text: who.textContent, box: box(who), cut: who.scrollHeight > who.clientHeight + 1, font: getComputedStyle(who).fontSize } : null,
            button: a ? {
                tag: a.tagName, className: a.className, href: a.href, target: a.target, rel: a.rel, ariaLabel: a.getAttribute('aria-label'), text: a.innerText.replace(/\s+/g, ' ').trim(),
                box: box(a), fontSize: s.fontSize, border: `${s.borderTopWidth} ${s.borderTopStyle}`, radius: s.borderTopLeftRadius, whiteSpace: s.whiteSpace, decoration: s.textDecorationLine,
                overflows: a.scrollWidth > a.clientWidth + 0.5, labelBox: label ? box(label) : null, labelLines: label ? label.getClientRects().length : null,
                icon: a.querySelector('.mk') ? { text: a.querySelector('.mk').textContent, box: box(a.querySelector('.mk')) } : null
            } : null
        }
    })
    const am = document.getElementById('am')
    return {
        lang: document.documentElement.lang, innerWidth, scrollWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight,
        sections: Object.fromEntries([...document.querySelectorAll('section[id]')].map(s => [s.id, box(s)])),
        caption: { box: box(document.querySelector('.caption')), button: box(am), font: getComputedStyle(am).fontSize, label: am.getAttribute('aria-label'), who: document.getElementById('who').innerText.replace(/\s+/g, ' ').trim() },
        covers: [...document.querySelectorAll('#box img.sl')].map(i => `${i.dataset.t} · ${i.dataset.a}`),
        stories
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

    if (profile.phone && profile.photos) {
        for (const story of STORIES) {
            const lead = page.locator(`#${story} .v4-lead`)
            await lead.evaluate(el => el.scrollIntoView({ block: 'center' }))
            await page.waitForTimeout(350)
            const clip = await lead.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: 0, y: Math.max(0, r.y - 8), width: innerWidth, height: r.height + 8 + 76 } })
            await page.screenshot({ path: path.join(OUT, `${tag}-${story}.png`), clip, type: 'png' })
        }
    }
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(300)
    const read = await page.evaluate(readPage)
    read.consoleErrors = errors
    read.blockedHosts = [...blocked]
    measures[tag] = read

    note(`${tag}: no console error`, errors.length === 0, errors.join(' | '))
    note(`${tag}: no horizontal scroll`, read.scrollWidth <= read.innerWidth, `scrollWidth ${read.scrollWidth}, window ${read.innerWidth}`)
    note(`${tag}: no request left for Apple Music or Spotify`, !read.blockedHosts.some(h => NEVER.includes(h)), `hosts aborted: ${read.blockedHosts.join(', ') || 'none'}`)
    if (side === 'branch' && profile.phone) {
        const listen = lang === 'pt' ? 'Ouça no Apple Music' : 'Listen on Apple Music'
        const tab = lang === 'pt' ? ' (abre numa nova aba)' : ' (opens in a new tab)'
        const st = read.stories
        for (const s of st) boxes.push({ profile: profile.name, lang, story: s.story, visualX: s.visual.x, visualW: s.visual.w, buttonX: s.button.box.x, buttonW: s.button.box.w, buttonH: s.button.box.h, font: s.button.fontSize, label: s.button.labelBox.w, album: s.who.text })
        note(`${tag}: five stories, each with its button`, st.length === 5 && st.every(s => s.button && s.button.tag === 'A' && s.button.className === 'am'))
        note(`${tag}: the button has the box of the visual above it (left edge and width within 1 px)`,
            st.every(s => Math.abs(s.button.box.x - s.visual.x) <= 1 && Math.abs(s.button.box.w - s.visual.w) <= 1),
            st.map(s => `${s.story}: visual x ${s.visual.x} w ${s.visual.w}, button x ${s.button.box.x} w ${s.button.box.w}`).join('; '))
        note(`${tag}: the button is 44 px high, its text ${st[0].button.fontSize} (at least 12 px), on one line, not clipped`,
            st.every(s => s.button.box.h >= 44 && parseFloat(s.button.fontSize) >= 12 && s.button.labelLines === 1 && !s.button.overflows && s.button.icon.box.x >= s.button.box.x + 1 && s.button.labelBox.x + s.button.labelBox.w <= s.button.box.x + s.button.box.w - 1),
            st.map(s => `${s.story}: ${s.button.box.w}x${s.button.box.h}, icon from ${s.button.icon.box.x}, label ${s.button.labelBox.w} wide to ${r1(s.button.labelBox.x + s.button.labelBox.w)} of ${r1(s.button.box.x + s.button.box.w)}`).join('; '))
        note(`${tag}: the text of the credit is the album's name only, under the record, whole`,
            st.every(s => !s.who.text.includes(' · ') && !s.who.cut && s.who.box.x + s.who.box.w <= s.record.x + s.record.w + 0.5 && s.creditText.startsWith(s.who.text)),
            st.map(s => s.who.text).join(' | '))
        note(`${tag}: the button's name says the album and the artist, in ${lang}; it opens a new tab; the address is Apple Music's`,
            st.every(s => s.button.ariaLabel.startsWith(`${listen}: ${s.who.text}, `) && s.button.ariaLabel.endsWith(tab) && s.button.ariaLabel.length > `${listen}: ${s.who.text}, ${tab}`.length && s.button.text.includes(listen) && s.button.target === '_blank' && s.button.rel === 'noopener' && s.button.href.startsWith('https://music.apple.com/')),
            st.map(s => s.button.ariaLabel).join(' | '))
        note(`${tag}: each credit ends before the story's text begins`, st.every(s => s.credit.y + s.credit.h <= s.nextTop + 0.5), st.map(s => `${s.story}: ${r1(s.credit.y + s.credit.h)} <= ${s.nextTop}`).join('; '))
    }
    await browser.close()
}

const servers = {}
for (const side of Object.keys(DISTS)) servers[side] = await serve(DISTS[side])
try {
    for (const profile of PROFILES) for (const lang of ['pt', 'en']) for (const side of ['main', 'branch']) await run(profile, side, lang, servers[side].base)
    for (const profile of PROFILES) for (const lang of ['pt', 'en']) {
        const [a, b] = ['main', 'branch'].map(side => measures[`${profile.name}-${lang}-${side}`])
        note(`${profile.name}-${lang}: nothing moved: the same page height, every section and every story's record and visual in the same place`,
            a.pageHeight === b.pageHeight && JSON.stringify(a.sections) === JSON.stringify(b.sections) && JSON.stringify(a.stories.map(s => [s.lead, s.record, s.visual])) === JSON.stringify(b.stories.map(s => [s.lead, s.record, s.visual])), `height ${a.pageHeight} -> ${b.pageHeight}`)
        note(`${profile.name}-${lang}: the crate's caption and its button are unchanged`, JSON.stringify(a.caption) === JSON.stringify(b.caption), `button ${b.caption.button.w}x${b.caption.button.h}, ${b.caption.font}`)
        note(`${profile.name}-${lang}: the same records in the crate`, JSON.stringify(a.covers) === JSON.stringify(b.covers), `${b.covers.length} records`)
    }
    // the side-by-side: «Criar» and «Álbuns» at 390 px in Portuguese, «Create» at 375 px in English; before and after
    const img = (name) => `data:image/png;base64,${fs.readFileSync(path.join(OUT, name)).toString('base64')}`
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 860, height: 700 }, deviceScaleFactor: 2 })
    const cell = (title, name) => `<figure><figcaption>${title}</figcaption><img src="${img(name)}"></figure>`
    await page.setContent(`<style>body{margin:0;padding:16px;background:#1b1b20;font:600 14px system-ui;color:#fff}div{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}figcaption{margin:0 0 6px}img{width:100%;display:block;border-radius:6px}</style>
      <div id="g">${cell('Antes (main) · Criar · 390 px', 'webkit-390-pt-main-start.png')}${cell('Depois (ramo) · Criar · 390 px', 'webkit-390-pt-branch-start.png')}${cell('Antes (main) · Álbuns · 390 px', 'webkit-390-pt-main-albums.png')}${cell('Depois (ramo) · Álbuns · 390 px', 'webkit-390-pt-branch-albums.png')}${cell('Antes (main) · Create · 375 px · EN', 'webkit-375-en-main-start.png')}${cell('Depois (ramo) · Create · 375 px · EN', 'webkit-375-en-branch-start.png')}</div>`)
    await page.waitForTimeout(300)
    await page.locator('body').screenshot({ path: path.join(OUT, 'before-after-phone.png') })
    await browser.close()
} finally {
    for (const side of Object.keys(servers)) await new Promise(resolve => servers[side].server.close(resolve))
}
fs.writeFileSync(path.join(OUT, 'measures.json'), JSON.stringify(measures, null, 1))
fs.writeFileSync(path.join(OUT, 'boxes.txt'), boxes.map(b => `${b.profile} ${b.lang} ${b.story.padEnd(9)} visual x ${b.visualX} w ${b.visualW} | button x ${b.buttonX} w ${b.buttonW} h ${b.buttonH} font ${b.font} label ${b.label} | ${b.album}`).join('\n') + '\n')
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(OUT, 'results.txt'), results.map(r => `${r.ok ? 'PASS' : 'FAIL'}  ${r.what}${r.detail ? '\n      ' + r.detail : ''}`).join('\n') + `\n\n${results.length - failed.length} passed, ${failed.length} failed; nothing clicked, no album address opened; servers closed\n`)
console.log(`${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
