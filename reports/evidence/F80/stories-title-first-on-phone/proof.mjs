// Entry page (F80), two changes proved with the same script, on BUILT sites, before against after:
//   PART=stories  UAT-291: on the phone each story opens with its label, title and text; the illustrations (cover, panel, album's name, button) come below.
//   PART=kicker   UAT-292: the small orange line that opened the hero is gone, phone and computer, both openings of the page.
//
//   PART=stories|kicker BEFORE=<dist> AFTER=<dist> OUT=<folder> node proof.mjs
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
const PART = process.env.PART
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
const STORIES = ['start', 'albums', 'blend', 'playlists', 'inventory']

const readPage = () => {
    const r1 = (n) => Math.round(n * 10) / 10
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: r1(r.x), y: r1(r.y + scrollY), w: r1(r.width), h: r1(r.height) } }
    const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const all = [...document.querySelectorAll('*')]
    const stories = ['start', 'albums', 'blend', 'playlists', 'inventory'].map((id) => {
        const sec = document.getElementById(id)
        const parts = { label: sec.querySelector('.kicker'), title: sec.querySelector('h2'), text: sec.querySelector(`[data-i18n="p.${id}"]`), lead: sec.querySelector('.v4-lead'), record: sec.querySelector('.slot'), visual: sec.querySelector('.v4-motif'), name: sec.querySelector('.slot-who'), button: sec.querySelector('.slot-am a') }
        const out = { id, section: box(sec), dom: {}, box: {} }
        for (const [k, el] of Object.entries(parts)) if (visible(el)) { out.box[k] = box(el); out.dom[k] = all.indexOf(el) }
        return out
    })
    const hero = document.querySelector('section.hero')
    const kickers = [...hero.querySelectorAll('.kicker')]
    const h1s = [...document.querySelectorAll('h1')].filter(visible)
    const focusables = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(visible).filter(el => el.closest('main, .story') && !el.closest('.stage-col'))
    return {
        innerWidth, scrollWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight, title: document.title, lang: document.documentElement.lang,
        sections: Object.fromEntries([...document.querySelectorAll('section[id]')].map(s => [s.id, box(s)])),
        hero: box(hero), heroText: hero.innerText.replace(/\s+/g, ' ').trim(), heroKickers: kickers.length, heroKickerVisible: kickers.filter(visible).map(k => ({ text: k.textContent, box: box(k) })),
        h1: h1s.map(h => ({ text: h.textContent, box: box(h) })), h1Count: h1s.length, firstInHero: [...hero.querySelectorAll('.only-out > *, .only-in > *')].filter(visible).slice(0, 1).map(e => e.tagName)[0],
        heroParts: [...hero.querySelectorAll('h1, .h-sub, .what, .ctas')].filter(visible).map(e => ({ cls: e.className || e.tagName, box: box(e) })),
        caption: box(document.querySelector('.caption')), stage: box(document.querySelector('.stage-col')),
        logoAlt: (document.querySelector('.logo') || {}).alt, metaDescription: (document.querySelector('meta[name="description"]') || {}).content, ogTitle: (document.querySelector('meta[property="og:title"]') || {}).content,
        bodySaysWebApp: /app web|web app/i.test(document.body.innerText),
        focusOrderMatchesSight: focusables.map(el => box(el).y).every((y, i, a) => i === 0 || y >= a[i - 1] - 60),
        stories
    }
}

async function run(profile, side, lang, base, signedIn = false) {
    const tag = `${profile.name}-${lang}${signedIn ? '-in' : ''}-${side}`
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
    if (PART === 'stories' && profile.phone && profile.width === 390 && lang === 'pt') {
        for (const id of ['start', 'albums']) {
            const sec = page.locator(`#${id}`)
            await sec.evaluate(el => el.scrollIntoView({ block: 'center' }))
            await page.waitForTimeout(400)
            await sec.screenshot({ path: path.join(OUT, `${tag}-${id}.png`) })
        }
    }
    if (PART === 'kicker' && (profile.width === 390 || !profile.phone) && lang === 'pt') {
        await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300)
        await page.locator('section.hero').screenshot({ path: path.join(OUT, `${tag}-hero.png`) })
    }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300)
    const read = await page.evaluate(readPage)
    read.errors = errors; read.blocked = [...blocked]; read.signedIn = signedIn
    measures[tag] = read
    note(`${tag}: no console error`, errors.length === 0, errors.join(' | '))
    note(`${tag}: no horizontal scroll`, read.scrollWidth <= read.innerWidth, `${read.scrollWidth} / ${read.innerWidth}`)
    note(`${tag}: no request left for Apple Music or Spotify`, !read.blocked.some(h => NEVER.includes(h)), `aborted: ${read.blocked.join(', ') || 'none'}`)
    await browser.close()
    return read
}

const servers = {}
for (const side of Object.keys(DISTS)) servers[side] = await serve(DISTS[side])
const lines = []
try {
    const openings = PART === 'kicker' ? [false, true] : [false]
    for (const profile of PROFILES) for (const lang of ['pt', 'en']) for (const signedIn of openings) for (const side of ['before', 'after']) await run(profile, side, lang, servers[side].base, signedIn)
    for (const profile of PROFILES) for (const lang of ['pt', 'en']) for (const signedIn of openings) {
        const tag = `${profile.name}-${lang}${signedIn ? '-in' : ''}`
        const [a, b] = ['before', 'after'].map(side => measures[`${tag}-${side}`])
        if (PART === 'stories') {
            if (profile.phone) {
                const seq = ['label', 'title', 'text', 'lead']
                note(`${tag}: in every story the label, the title and the text are seen first, the illustrations below them`, b.stories.every(s => seq.every((k, i) => i === 0 || s.box[k].y >= s.box[seq[i - 1]].y + s.box[seq[i - 1]].h - 0.5)), b.stories.map(s => `${s.id}: ${seq.map(k => `${k} ${s.box[k].y}`).join(' < ')}`).join('; '))
                note(`${tag}: the order in the page is the order seen: label, title, text, record, album's name, button (the panel beside the record is decorative, hidden from the screen reader)`, b.stories.every(s => ['label', 'title', 'text', 'lead', 'record', 'name', 'button'].every((k, i, arr) => i === 0 || s.dom[k] > s.dom[arr[i - 1]])) && b.focusOrderMatchesSight)
                note(`${tag}: the first story's label comes right after the crate's caption`, b.stories[0].box.label.y - (b.caption.y + b.caption.h) < 80 && b.stories[0].box.label.y > b.caption.y, `caption ends ${r1(b.caption.y + b.caption.h)}, label at ${b.stories[0].box.label.y} (before: record at ${a.stories[0].box.record.y}, label at ${a.stories[0].box.label.y})`)
                const gaps = b.stories.slice(0, -1).map((s, i) => { const next = measures[`${tag}-after`].sections; const order = ['start', 'albums', 'blend', 'flip', 'playlists', 'inventory']; const nextSec = Object.entries(next).filter(([, v]) => v.y > s.box.button.y).sort((x, y) => x[1].y - y[1].y)[0]; return `${s.id}: button ends ${r1(s.box.button.y + s.box.button.h)}, next part (${nextSec[0]}) starts ${nextSec[1].y}: ${r1(nextSec[1].y - s.box.button.y - s.box.button.h)} px` })
                note(`${tag}: each story's button stays clear of the next part (at least 24 px, and the line between them)`, b.stories.slice(0, -1).every((s) => { const nextSec = Object.values(b.sections).filter(v => v.y > s.box.button.y).sort((x, y) => x.y - y.y)[0]; return nextSec.y - (s.box.button.y + s.box.button.h) >= 24 }), gaps.join('; '))
                note(`${tag}: the button still has the box of the visual above it`, b.stories.every(s => Math.abs(s.box.button.x - s.box.visual.x) <= 1 && Math.abs(s.box.button.w - s.box.visual.w) <= 1 && s.box.button.h >= 44))
                note(`${tag}: the page's height`, true, `${a.pageHeight} -> ${b.pageHeight} (${b.pageHeight - a.pageHeight >= 0 ? '+' : ''}${b.pageHeight - a.pageHeight} px)`)
                lines.push(`${tag}: page ${a.pageHeight} -> ${b.pageHeight} (${b.pageHeight - a.pageHeight} px); first label ${a.stories[0].box.label.y} -> ${b.stories[0].box.label.y}; caption ends ${r1(b.caption.y + b.caption.h)}`)
            } else {
                note(`${tag}: the computer did not change: same page height, sections and every part of every story in the same box`, a.pageHeight === b.pageHeight && JSON.stringify(a.sections) === JSON.stringify(b.sections) && JSON.stringify(a.stories.map(s => s.box)) === JSON.stringify(b.stories.map(s => s.box)), `height ${a.pageHeight} -> ${b.pageHeight}`)
                lines.push(`${tag}: page ${a.pageHeight} -> ${b.pageHeight}; unchanged boxes`)
            }
        }
        if (PART === 'kicker') {
            const was = a.heroKickerVisible[0]
            note(`${tag}: the orange line is gone from the hero (it was «${was ? was.text : '?'}»)`, a.heroKickerVisible.length === 1 && b.heroKickers === 0 && !b.heroText.includes(was.text), `hero now opens with ${b.firstInHero}: «${b.h1[0].text}»`)
            note(`${tag}: one h1, the title, first in the hero; no empty band above it`, b.h1Count === 1 && b.firstInHero === 'H1' && b.h1[0].text === a.h1[0].text && Math.abs((b.h1[0].box.y - b.hero.y) - (was.box.y - a.hero.y)) <= 1, `title ${a.h1[0].box.y} -> ${b.h1[0].box.y}; the line began at ${was.box.y}`)
            const shift = a.h1[0].box.y - b.h1[0].box.y
            const heroDelta = a.hero.h - b.hero.h
            const moved = Object.keys(b.sections).filter(k => k !== 'a1').map(k => r1(a.sections[k].y - b.sections[k].y))
            note(`${tag}: what is below moved up by the same amount everywhere, or not at all`, new Set(moved).size === 1, `title up ${r1(shift)} px; hero ${a.hero.h} -> ${b.hero.h} (${r1(-heroDelta)} px); sections below up ${[...new Set(moved)].join(', ')} px; page ${a.pageHeight} -> ${b.pageHeight}`)
            note(`${tag}: the product's name is still in the page's title and on the logo`, /Album Blender/.test(b.title) && /Album Blender/.test(b.logoAlt || ''), `title «${b.title}»; logo «${b.logoAlt}»`)
            lines.push(`${tag}: title up ${r1(shift)} px; hero ${a.hero.h} -> ${b.hero.h}; sections below up ${[...new Set(moved)].join(', ')} px; page ${a.pageHeight} -> ${b.pageHeight}; «app web» in the page's text before ${a.bodySaysWebApp}, after ${b.bodySaysWebApp}; description «${b.metaDescription}»`)
        }
    }
    const img = (name) => `data:image/png;base64,${fs.readFileSync(path.join(OUT, name)).toString('base64')}`
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 })
    const cell = (title, name) => `<figure><figcaption>${title}</figcaption><img src="${img(name)}"></figure>`
    const cells = PART === 'stories'
        ? [['Antes · Criar · 390 px', 'webkit-390-pt-before-start.png'], ['Depois · Criar · 390 px', 'webkit-390-pt-after-start.png'], ['Antes · Álbuns · 390 px', 'webkit-390-pt-before-albums.png'], ['Depois · Álbuns · 390 px', 'webkit-390-pt-after-albums.png']]
        : [['Antes · celular 390 px', 'webkit-390-pt-before-hero.png'], ['Depois · celular 390 px', 'webkit-390-pt-after-hero.png'], ['Antes · celular, com conta', 'webkit-390-pt-in-before-hero.png'], ['Depois · celular, com conta', 'webkit-390-pt-in-after-hero.png'], ['Antes · computador 1280', 'chromium-1280-pt-before-hero.png'], ['Depois · computador 1280', 'chromium-1280-pt-after-hero.png']]
    await page.setContent(`<style>body{margin:0;padding:16px;background:#1b1b20;font:600 14px system-ui;color:#fff}div{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}figure{margin:0}figcaption{margin:0 0 6px}img{width:100%;display:block;border-radius:6px}</style><div>${cells.map(c => cell(...c)).join('')}</div>`)
    await page.waitForTimeout(300)
    await page.locator('body').screenshot({ path: path.join(OUT, PART === 'stories' ? 'before-after-phone.png' : 'before-after.png') })
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
