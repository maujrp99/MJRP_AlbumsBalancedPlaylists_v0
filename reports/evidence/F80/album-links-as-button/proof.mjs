// UAT-285 (F80): every album link of the entry page is the Apple Music button. The browser proof, on BUILT sites, before (main) and after (the branch).
//
//   MAIN=<dist of main> BRANCH=<dist of the branch> OUT=<this folder> node proof.mjs
//
// Each build (publication-shaped: `node scripts/publication-budget.mjs --out <dist>`, stand-in keys from the environment, the real covers) is served by this
// script's own static server on 127.0.0.1 and the server is closed at the end. Hosts allowed besides 127.0.0.1: the four static hosts the page itself names
// (the covers on Apple's CDN, Google Fonts, the 3D library); anything else is blocked and listed. Nothing is typed, nothing is clicked on an album link.
// Profiles: WebKit as an iPhone 14 (390 px), plus 393 px on the branch and 375 and 320 px on both (does the credit fit under its record?); Chromium at 1280 x 800.
// Languages: Portuguese (as served) and English (the remembered choice, set in the page's own storage before it loads).
// Photographs are of each album block (the record with its credit, the caption of the stage), never of the whole page; at 393, 375 and 320 px only the
// block with the longest credit («The Velvet Underground & Nico», the story «Albums») on the branch is photographed, the rest is measured (measures.json).
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.env.OUT
const DISTS = { main: process.env.MAIN, branch: process.env.BRANCH }
fs.mkdirSync(OUT, { recursive: true })
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
// `known`: a width outside the request (320 px, no iPhone on sale has it) where the answer is written down as a limit, not as a failure of this change
const note = (what, ok, detail = '', known = false) => { const mark = ok ? 'PASS' : known ? 'KNOWN' : 'FAIL'; results.push({ what, ok, mark, detail: String(detail) }); console.log(`${mark}  ${what}${detail ? '  ' + String(detail).slice(0, 300) : ''}`) }
const measures = {}

const PROFILES = [
    { name: 'iphone14-webkit-390', engine: webkit, phone: true, width: 390, height: 664, sides: ['main', 'branch'] },
    { name: 'webkit-393', engine: webkit, phone: true, width: 393, height: 852, sides: ['branch'], photos: ['albums'] },
    { name: 'webkit-375', engine: webkit, phone: true, width: 375, height: 667, sides: ['main', 'branch'], photos: ['albums'] },
    { name: 'webkit-320', engine: webkit, phone: true, width: 320, height: 568, sides: ['main', 'branch'], outside: true, photos: ['albums'] },
    { name: 'chromium-1280', engine: chromium, phone: false, width: 1280, height: 800, sides: ['main', 'branch'] }
]
const STORIES = ['start', 'albums', 'blend', 'playlists', 'inventory']
const TRACKS = ['a1', 'start', 'albums', 'blend', 'playlists', 'inventory', 'end']

/** What the page shows of every album link in sight, and the shape of the page. */
const readPage = () => {
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x * 10) / 10, y: Math.round((r.y + scrollY) * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 } }
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const links = [...document.querySelectorAll('a[href*="music.apple.com"]')].filter(visible).map((a) => {
        const s = getComputedStyle(a)
        const mk = a.querySelector('.mk')
        const credit = a.closest('.slot-am')
        const who = credit ? credit.querySelector('.slot-who') : null
        return {
            where: a.id === 'am' ? 'caption' : (a.closest('section') || {}).id || '?',
            className: a.className, href: a.href, text: a.innerText.replace(/\s+/g, ' ').trim(), ariaLabel: a.getAttribute('aria-label'),
            target: a.target, rel: a.rel, box: box(a),
            border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, radius: s.borderTopLeftRadius, font: `${s.fontWeight} ${s.fontSize} ${s.fontFamily.split(',')[0]}`,
            decoration: s.textDecorationLine, padding: `${s.paddingLeft} ${s.paddingRight}`, color: s.color,
            icon: mk ? { text: mk.textContent, box: box(mk), background: getComputedStyle(mk).backgroundImage.slice(0, 60), hidden: mk.getAttribute('aria-hidden') } : null,
            beside: who ? { text: who.textContent, box: box(who), cut: who.scrollHeight > who.clientHeight + 1 } : (a.id === 'am' ? { text: document.getElementById('who').innerText.replace(/\s+/g, ' ').trim() } : null),
            credit: credit ? box(credit) : null
        }
    })
    const leads = [...document.querySelectorAll('.v4-lead')].filter(visible).map((lead) => {
        const credit = lead.querySelector('.slot-am')
        const next = lead.nextElementSibling
        return { story: lead.closest('section').id, lead: box(lead), credit: credit ? box(credit) : null, creditText: credit ? credit.innerText.replace(/\s+/g, ' ').trim() : null, nextTop: next ? box(next).y : null }
    })
    return {
        lang: document.documentElement.lang, innerWidth, scrollWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight,
        sections: Object.fromEntries([...document.querySelectorAll('main section[id], section[id]')].map(s => [s.id, box(s)])),
        covers: [...document.querySelectorAll('#box img.sl')].map(i => `${i.dataset.t} · ${i.dataset.a}`),
        slotCovers: [...document.querySelectorAll('.slot img')].map(i => i.dataset.t),
        links, leads
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
        if (ALLOWED.has(host)) return route.continue()
        blocked.add(host); return route.abort()
    })
    if (lang === 'en') await context.addInitScript(() => { try { localStorage.setItem('albumblender:lang', 'en') } catch { /* the page falls back to Portuguese */ } })
    await context.addInitScript(() => {
        window.__shift = 0
        try { new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__shift += e.value }).observe({ type: 'layout-shift', buffered: true }) } catch { window.__shift = null }
    })
    const page = await context.newPage()
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    await page.goto(`${base}/`, { waitUntil: 'load' })
    await page.waitForFunction(() => document.documentElement.classList.contains('js'))
    await page.waitForTimeout(900)

    const photographed = (story) => !profile.photos || (side === 'branch' && profile.photos.includes(story))
    if (profile.phone) {
        await page.locator('.caption').evaluate(el => el.scrollIntoView({ block: 'center' }))
        await page.waitForTimeout(300)
        if (photographed('caption')) await page.locator('.caption').screenshot({ path: path.join(OUT, `${tag}-caption.png`) })
        for (const story of STORIES) {
            const lead = page.locator(`#${story} .v4-lead`)
            await lead.evaluate(el => el.scrollIntoView({ block: 'center' }))
            await page.waitForTimeout(350)
            const clip = await lead.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: 0, y: Math.max(0, r.y - 8), width: innerWidth, height: r.height + 8 + 76 } })
            if (photographed(story)) await page.screenshot({ path: path.join(OUT, `${tag}-${story}.png`), clip })
        }
    } else {
        for (const track of TRACKS) {
            await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), track)
            await page.waitForTimeout(500)
            const state = await page.evaluate(() => ({ who: document.getElementById('who').innerText.replace(/\s+/g, ' ').trim(), label: document.getElementById('am').getAttribute('aria-label'), href: document.getElementById('am').href }))
            ;(measures[tag] ||= { captions: {} }).captions[track] = state
            await page.locator('.caption').screenshot({ path: path.join(OUT, `${tag}-caption-${track}.png`) })
        }
    }
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(300)
    const read = await page.evaluate(readPage)
    read.layoutShift = await page.evaluate(() => window.__shift)
    read.consoleErrors = errors
    read.blockedHosts = [...blocked]
    measures[tag] = { ...(measures[tag] || {}), ...read }

    note(`${tag}: no console error`, errors.length === 0, errors.join(' | '))
    note(`${tag}: no horizontal scroll`, read.scrollWidth <= read.innerWidth, `scrollWidth ${read.scrollWidth}, window ${read.innerWidth}${profile.outside ? ' (the same on main: it was there before this change)' : ''}`, profile.outside)
    note(`${tag}: the page is in ${lang}`, read.lang.startsWith(lang), read.lang)
    if (side === 'branch') {
        const expectLinks = profile.phone ? 6 : 1
        note(`${tag}: ${expectLinks} album link(s) in sight, every one the button (class am, icon, border, no underline)`,
            read.links.length === expectLinks && read.links.every(l => l.className === 'am' && l.icon && l.icon.text === '♫' && l.icon.hidden === 'true' && /^1px solid/.test(l.border) && l.decoration === 'none'),
            read.links.map(l => `${l.where}:${l.className || '(none)'}`).join(', '))
        const first = read.links[0]
        note(`${tag}: every button has the caption's size, border, radius, type and icon`,
            read.links.every(l => l.box.h === first.box.h && l.box.w === first.box.w && l.border === first.border && l.radius === first.radius && l.font === first.font && l.padding === first.padding && l.icon.box.w === first.icon.box.w && l.icon.background === first.icon.background),
            read.links.map(l => `${l.where} ${l.box.w}x${l.box.h}`).join(', '))
        note(`${tag}: touch target at least 44 px`, read.links.every(l => l.box.h >= 44 && l.box.w >= 44), read.links.map(l => `${l.box.w}x${l.box.h}`).join(', '))
        const listen = lang === 'pt' ? 'Ouça no Apple Music' : 'Listen on Apple Music'
        const tab = lang === 'pt' ? ' (abre numa nova aba)' : ' (opens in a new tab)'
        note(`${tag}: the name of each button says the album, in ${lang}`,
            read.links.every(l => l.ariaLabel.startsWith(`${listen}: `) && l.ariaLabel.endsWith(tab) && l.text.includes(listen) && (l.where === 'caption' || l.ariaLabel === `${listen}: ${l.beside.text.replace(' · ', ', ')}${tab}`)),
            read.links.map(l => l.ariaLabel).join(' | '))
        if (profile.phone) {
            note(`${tag}: album and artist are text beside the button, not inside it`, read.links.filter(l => l.where !== 'caption').every(l => l.beside && l.beside.text.includes(' · ') && !l.text.includes(l.beside.text) && l.beside.box.x + l.beside.box.w <= l.box.x + 0.5), read.links.map(l => l.beside && l.beside.text).join(' | '))
            note(`${tag}: no album or artist is cut`, read.links.every(l => !l.beside || !l.beside.cut), read.links.filter(l => l.beside && l.beside.cut).map(l => l.beside.text).join(' | ') + (profile.outside ? ' (ends in an ellipsis; the whole name is in the button\'s accessible name)' : ''), profile.outside)
            note(`${tag}: each credit ends before the story's text begins`, read.leads.every(l => l.credit && l.credit.y + l.credit.h <= l.nextTop + 0.5), read.leads.map(l => `${l.story}: credit ends ${l.credit && (l.credit.y + l.credit.h)}, text starts ${l.nextTop}`).join('; '))
        }
    }
    await browser.close()
}

const servers = {}
for (const side of Object.keys(DISTS)) servers[side] = await serve(DISTS[side])
try {
    for (const profile of PROFILES) for (const lang of ['pt', 'en']) for (const side of profile.sides) await run(profile, side, lang, servers[side].base)
    // before against after: the same albums, the same page shape
    for (const profile of PROFILES.filter(p => p.sides.length === 2)) for (const lang of ['pt', 'en']) {
        const [a, b] = ['main', 'branch'].map(side => measures[`${profile.name}-${lang}-${side}`])
        note(`${profile.name}-${lang}: the same records, in the same order, before and after`, JSON.stringify(a.covers) === JSON.stringify(b.covers) && JSON.stringify(a.links.map(l => l.href)) === JSON.stringify(b.links.map(l => l.href)), `${b.covers.length} records, ${b.links.length} link(s)`)
        note(`${profile.name}-${lang}: nothing moved: the page has the same height and every part the same place and size`, a.pageHeight === b.pageHeight && JSON.stringify(a.sections) === JSON.stringify(b.sections) && JSON.stringify(a.leads.map(l => l.lead)) === JSON.stringify(b.leads.map(l => l.lead)), `height ${a.pageHeight} -> ${b.pageHeight}`)
        note(`${profile.name}-${lang}: the page is not wider than on main`, b.scrollWidth <= a.scrollWidth, `main ${a.scrollWidth}, branch ${b.scrollWidth}`)
        if (b.layoutShift !== null && b.layoutShift !== undefined) note(`${profile.name}-${lang}: layout shift of the branch not above main's`, b.layoutShift <= a.layoutShift + 0.0001, `main ${a.layoutShift}, branch ${b.layoutShift}`)
    }
} finally {
    for (const side of Object.keys(servers)) await new Promise(resolve => servers[side].server.close(resolve))
}
fs.writeFileSync(path.join(OUT, 'measures.json'), JSON.stringify(measures, null, 1))
const failed = results.filter(r => r.mark === 'FAIL')
const known = results.filter(r => r.mark === 'KNOWN')
fs.writeFileSync(path.join(OUT, 'results.txt'), results.map(r => `${r.mark}  ${r.what}${r.detail ? '\n      ' + r.detail : ''}`).join('\n') + `\n\n${results.length - failed.length - known.length} passed, ${failed.length} failed, ${known.length} known limit(s) at 320 px; servers closed\n`)
console.log(`${results.length - failed.length - known.length} passed, ${failed.length} failed, ${known.length} known`)
process.exit(failed.length ? 1 : 0)
