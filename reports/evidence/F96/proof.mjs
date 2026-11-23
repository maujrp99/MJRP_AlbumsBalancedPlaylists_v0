// F96 - the entry page on the phone, redesigned: the browser proof, on BUILT sites served by `vite preview`.
//
//   AFTER=http://127.0.0.1:<port> BEFORE=http://127.0.0.1:<port> OUT=<this folder> node proof.mjs
//     AFTER   the branch, built with VITE_SPLASH_COVERS=real;   BEFORE   main (7369dd8), built the same way (for the computer and the weight)
//
// What runs: Chromium AND WebKit as a phone at 390x844 and 360x740, visitor and signed in, Portuguese and English (16 runs); each engine once
// without script and once with less motion asked (390, visitor, Portuguese); Chromium at 1280x800 before against after (the computer did not change).
//
// SAFETY. Every context ABORTS at the network layer: music.apple.com, itunes.apple.com, geo.music.apple.com, open.spotify.com,
// accounts.spotify.com, every scheme that is not http(s)/data/blob/about (music://, itms://, spotify:), and every host that is not this
// machine's preview or one of the three static hosts the page itself names (Apple's image CDN for the covers, Google Fonts) - which blocks
// production Firebase and the 3D library's CDN too. NO LINK IS EVER CLICKED OR OPENED: links are judged by their href, target, rel and name.
// The only clicks are on the page's own <button>s (the shelf's two arrows, the language switch is set through storage). The app (/start) is
// never opened. The signed-in opening is a stand-in record in the page's own storage (the key gate.js reads): no password, no account.
import { chromium, webkit, devices } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'

const OUT = process.env.OUT, AFTER = process.env.AFTER, BEFORE = process.env.BEFORE
fs.mkdirSync(OUT, { recursive: true })
const NEVER = ['music.apple.com', 'itunes.apple.com', 'geo.music.apple.com', 'open.spotify.com', 'accounts.spotify.com']
const ALLOWED = new Set(['127.0.0.1', 'is1-ssl.mzstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'])
const OK_SCHEMES = new Set(['http:', 'https:', 'data:', 'blob:', 'about:'])
const ENGINES = { chromium, webkit }
const r1 = (n) => Math.round(n * 10) / 10

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok: Boolean(ok), detail: String(detail) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 300) : ''}`) }
const measures = {}

async function open({ engine, width, height, lang = 'pt', signedIn = false, base = AFTER, script = true, reduce = false, phone = true }) {
    const browser = await ENGINES[engine].launch()
    const device = phone ? (engine === 'webkit' ? devices['iPhone 14'] : devices['Pixel 7']) : {}
    const context = await browser.newContext({ ...device, viewport: { width, height }, javaScriptEnabled: script, reducedMotion: reduce ? 'reduce' : 'no-preference' })
    const net = { aborted: new Set(), bytes: 0, three: false }
    await context.route('**/*', (route) => {
        const u = new URL(route.request().url())
        if (/three/.test(u.pathname) || u.hostname === 'cdn.jsdelivr.net') net.three = true
        if (!OK_SCHEMES.has(u.protocol) || NEVER.includes(u.hostname) || (/^https?:$/.test(u.protocol) && !ALLOWED.has(u.hostname))) { net.aborted.add(u.hostname || u.protocol); return route.abort() }
        return route.continue()
    })
    if (lang === 'en') await context.addInitScript(() => { try { localStorage.setItem('albumblender:lang', 'en') } catch { /* Portuguese */ } })
    if (signedIn) await context.addInitScript(() => { try { localStorage.setItem('firebase:authUser:AIzaStandIn:[DEFAULT]', JSON.stringify({ uid: 'stand-in', isAnonymous: false })) } catch { /* visitor */ } })
    const page = await context.newPage()
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('response', (res) => { res.body().then(b => { net.bytes += b.length }).catch(() => {}) })
    await page.goto(`${base}/`, { waitUntil: 'load' })
    if (script) {
        await page.waitForFunction(() => document.documentElement.classList.contains('js'))
        await page.waitForTimeout(1100) // the account answers within 600 ms
    } else await page.waitForTimeout(500)
    return { browser, page, errors, net }
}

/** Everything read from the page in one go (no clicks). */
const readPhone = () => {
    const r1 = (n) => Math.round(n * 10) / 10
    const shown = (el) => { if (!el) return false; const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' }
    const top = (el) => r1(el.getBoundingClientRect().top + scrollY)
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: r1(r.x), y: r1(r.y + scrollY), w: r1(r.width), h: r1(r.height) } }
    const text = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()
    const name = (el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim()
    const orange = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number); return m[0] > 200 && m[1] > 80 && m[1] < 175 && m[2] < 100 && (m[3] === undefined || m[3] > 0.2) }
    const D = document, W = innerWidth
    const STEPS = ['start', 'albums', 'blend', 'playlists', 'inventory']
    const hero = D.querySelector('section.hero')
    const edu = D.getElementById('edu'), shelfSec = D.getElementById('crate-shelf'), row = D.getElementById('shelf')
    // the stretch that teaches: from the title to the shelf; its texts, outside the illustrations
    const stretch = [edu, ...STEPS.map(id => D.getElementById(id)), D.getElementById('flip')]
    const orangeTexts = []
    for (const part of stretch) {
        const els = part === edu ? [edu] : [...part.querySelectorAll('*')]
        for (const el of els) {
            if (el.closest('.v4-motif, .ranked') || !shown(el)) continue
            const own = [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())
            if (own && orange(getComputedStyle(el).color)) orangeTexts.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${el.className}: ${text(el).slice(0, 30)}`)
        }
    }
    const steps = STEPS.map((id) => {
        const s = D.getElementById(id)
        const label = s.querySelector('.kicker'), title = s.querySelector('h3.t'), para = s.querySelector(`[data-i18n="p.${id}"]`)
        const pictures = [...s.querySelectorAll('.v4-motif, .ranked')].filter(shown)
        const before = getComputedStyle(s, '::before')
        return {
            id, top: top(s), label: text(label), labelColor: getComputedStyle(label).color, numberColor: label.querySelector('.n') ? getComputedStyle(label.querySelector('.n')).color : null,
            door: (() => { const d = s.querySelector('.door'); return d && shown(d) ? { text: text(d), color: getComputedStyle(d).color, underline: getComputedStyle(d).textDecorationLine.includes('underline'), href: d.getAttribute('href') } : null })(),
            number: label.querySelector('.n') ? getComputedStyle(label.querySelector('.n')).fontSize : null,
            order: [top(label), top(title), top(para), ...pictures.map(top)], pictures: pictures.map(p => ({ cls: p.className, ...box(p) })),
            covers: s.querySelectorAll('img').length, music: s.querySelectorAll('a.am').length, title: text(title), titleTag: title.tagName,
            line: before.borderTopWidth, band: before.backgroundColor, width: box(s).w
        }
    })
    const cards = [...row.querySelectorAll('.al')]
    const links = cards.map(c => c.querySelector('a.am')).filter(Boolean)
    const crate = D.getElementById('crate-css')
    const am = D.getElementById('am')
    const topbar = [...D.querySelectorAll('header.top .wrap > *, header.top .acct > *')].filter(shown).map(el => ({ what: (el.className || el.tagName).toString().slice(0, 28), ...box(el) }))
    return {
        W, scrollWidth: D.documentElement.scrollWidth, bodyScrollWidth: D.body.scrollWidth, pageHeight: D.documentElement.scrollHeight,
        signedIn: D.documentElement.classList.contains('in'), lang: D.documentElement.lang,
        heroButtons: [...hero.querySelectorAll('.ctas a')].filter(shown).map(text),
        h1: text([...hero.querySelectorAll('h1')].find(shown)),
        yaw: getComputedStyle(crate).getPropertyValue('--yaw').trim(), boxTransform: getComputedStyle(D.getElementById('box')).transform.slice(0, 40),
        canvas3d: Boolean(D.querySelector('canvas.gl')), sleevesShown: D.querySelectorAll('#box .sl.vis').length,
        caption: text(D.getElementById('who')), captionButton: am && shown(am) ? { text: text(am), href: am.getAttribute('href'), target: am.target, rel: am.rel, ...box(am) } : null,
        tops: { hero: top(hero), scene: top(D.getElementById('scene')), caption: top(D.getElementById('caption')), edu: top(edu), ...Object.fromEntries(STEPS.map(id => [id, top(D.getElementById(id))])), flip: top(D.getElementById('flip')), shelf: top(shelfSec), end: top(D.getElementById('end')), footer: top(D.querySelector('footer')) },
        edu: { text: text(edu), color: getComputedStyle(edu).color, shown: shown(edu), tag: edu.tagName, size: getComputedStyle(edu).fontSize },
        orangeTexts, steps, mark: D.getElementById('main').getAttribute('data-step-mark'),
        shelf: {
            title: text(D.getElementById('t-shelf')), rowName: row.getAttribute('aria-label'), cards: cards.length, shownCards: cards.filter(shown).length,
            rowBox: box(row), rowScrollWidth: row.scrollWidth, rowClientWidth: row.clientWidth, scrollLeft: row.scrollLeft,
            peeking: cards.filter(c => { const r = c.getBoundingClientRect(); return r.left < W - 8 && r.right > W + 8 }).length,
            names: cards.slice(0, 3).map(c => text(c.querySelector('b'))),
            links: links.map(a => ({ href: a.getAttribute('href'), target: a.target, rel: a.rel, name: name(a), fits: a.scrollWidth <= a.clientWidth + 1, h: r1(a.getBoundingClientRect().height) })),
            arrows: ['shelf-prev', 'shelf-next'].map(id => { const b = D.getElementById(id); return { name: b.getAttribute('aria-label'), off: b.getAttribute('aria-disabled'), shown: shown(b), ...box(b) } })
        },
        top: topbar, topRight: Math.max(...topbar.map(b => b.x + b.w)),
        topButtons: [...D.querySelectorAll('header.top a.btn')].filter(shown).map(a => ({ text: text(a), href: a.getAttribute('href') })),
        bar: [...D.querySelectorAll('.pbar a.stop')].filter(shown).map(a => ({ text: text(a), href: a.getAttribute('href') })),
        barShown: shown(D.querySelector('.pbar')),
        moving: D.documentElement.classList.contains('moving'), pauseHidden: D.getElementById('motion').hidden
    }
}

const ascending = (list) => list.every((v, i) => i === 0 || v > list[i - 1])
const T = {
    pt: { edu: 'Como funciona', shelf: 'Na caixa do The Album Blender', row: 'Álbuns da caixa do The Album Blender', prev: 'Álbum anterior', next: 'Próximo álbum', listen: 'Ouça no Apple Music', newtab: '(abre numa nova aba)', signin: 'Entrar', create: 'Criar', open: 'Abrir o app', labels: ['Lado A · 1 — Criar', 'Lado A · 2 — Álbuns', 'Lado A · 3 — Blend', 'Lado B · 1 — Playlists', 'Lado B · 2 — Inventário'], bar: ['Criar', 'Álbuns', 'Blend', 'Playlists', 'Inventário'], catalogue: 'Catalogue as mídias físicas da sua estante.' },
    en: { edu: 'How it works', shelf: 'In The Album Blender\'s crate', row: 'Albums in The Album Blender\'s crate', prev: 'Previous album', next: 'Next album', listen: 'Listen on Apple Music', newtab: '(opens in a new tab)', signin: 'Sign in', create: 'Create', open: 'Open the app', labels: ['Side A · 1 — Create', 'Side A · 2 — Albums', 'Side A · 3 — Blend', 'Side B · 1 — Playlists', 'Side B · 2 — Inventory'], bar: ['Create', 'Albums', 'Blend', 'Playlists', 'Inventory'], catalogue: 'Catalogue the physical media on your shelf.' }
}

async function phoneRun({ engine, width, height, lang, signedIn }) {
    const tag = `${engine}-${width}-${lang}-${signedIn ? 'in' : 'out'}`
    const { browser, page, errors, net } = await open({ engine, width, height, lang, signedIn })
    const t = T[lang]
    try {
        const m = await page.evaluate(readPhone)
        measures[tag] = m
        await page.screenshot({ path: path.join(OUT, `${tag}-1-landing.jpg`), type: 'jpeg', quality: 72 })
        note(`${tag}: no console error`, errors.length === 0, errors.join(' | '))
        note(`${tag}: no request for a music service, a foreign scheme, Firebase or the 3D library`, net.aborted.size === 0 && !net.three, `aborted: ${[...net.aborted].join(', ') || 'none'}`)
        note(`${tag}: the page shows the ${signedIn ? 'signed-in' : 'visitor'} opening, in ${lang}`, m.signedIn === signedIn && m.lang.startsWith(lang))
        // no sideways scroll
        const pushed = await page.evaluate(async () => { scrollTo(300, 0); await new Promise(r => setTimeout(r, 150)); const x = scrollX; scrollTo(0, 0); return x })
        note(`${tag}: the page is exactly as wide as the screen and does not scroll sideways`, m.scrollWidth === m.W && m.bodyScrollWidth <= m.W && pushed === 0, `screen ${m.W}, page ${m.scrollWidth}, body ${m.bodyScrollWidth}, after a push sideways x=${pushed}`)
        note(`${tag}: the top bar ends inside the screen`, m.topRight <= m.W - 15.5, `right edge of the bar's last item ${r1(m.topRight)} of ${m.W}: ${m.top.map(b => `${b.what} ${b.x}+${b.w}`).join('; ')}`)
        // the landing
        note(`${tag}: the opening has no big button`, m.heroButtons.length === 0, m.heroButtons.join(', '))
        note(`${tag}: the crate is the CSS crate, turned 30 degrees, and no 3D canvas exists`, m.yaw === '-30deg' && m.boxTransform.startsWith('matrix3d(0.866') && !m.canvas3d && m.sleevesShown === 8, `--yaw ${m.yaw}, ${m.boxTransform}, sleeves ${m.sleevesShown}`)
        note(`${tag}: the caption names the album and the year, with «${t.listen}» (a link, not opened)`, m.caption.replace(/\s/g, '') === 'TheVelvetUnderground&Nico1967' && m.captionButton && m.captionButton.text.includes(t.listen) && /^https:\/\/music\.apple\.com\/us\/album\//.test(m.captionButton.href) && m.captionButton.target === '_blank' && m.captionButton.rel === 'noopener', JSON.stringify(m.captionButton))
        // the order of the page
        const o = m.tops
        note(`${tag}: opening, crate, caption, «${t.edu}», the five steps, the shelf, the invitation, the footer, in this order`, ascending([o.hero, o.scene, o.caption, o.edu, o.start, o.albums, o.blend, o.flip, o.playlists, o.inventory, o.shelf, o.end, o.footer]), JSON.stringify(o))
        // the part that teaches
        note(`${tag}: the part's title is «${t.edu}», shown, in the fire's orange`, m.edu.text === t.edu && m.edu.shown && m.edu.color === 'rgb(249, 115, 22)' && m.edu.tag === 'H2', `${m.edu.text} ${m.edu.color} ${m.edu.size}`)
        // the owner, on his iPhone, 2026-11-23: «os textos do Lado a! criar e o link começar uma séries, eu usaria um tom de laranja... (em todas as etapas)»
        const TONE = 'rgb(251, 146, 60)' // --orange-text, one tone lighter than the title's --orange
        note(`${tag}: the five labels and their numbers are in the lighter orange, the number standing out`, m.steps.every((s, i) => s.label.toUpperCase() === t.labels[i].toUpperCase() && s.labelColor === TONE && s.numberColor === TONE && s.number === '30px'), m.steps.map(s => `${s.label} ${s.labelColor} ${s.number} ${s.numberColor}`).join(' | '))
        note(`${tag}: the orange texts of the stretch are the title, the labels with their numbers${signedIn ? ' and the five links' : ''}, and nothing else (the flip band is neutral)`, m.orangeTexts.length === (signedIn ? 21 : 11) && m.orangeTexts.every(o => /^(h2#edu|p\.kicker|span\.n:|span\.:)/.test(o)), m.orangeTexts.map(o => o.split(':')[0]).join(' | '))
        if (signedIn) note(`${tag}: each step's link is in the lighter orange, underlined, with its arrow`, m.steps.every(s => s.door && s.door.color === TONE && s.door.underline && s.door.text.endsWith('→')), m.steps.map(s => JSON.stringify(s.door)).join(' '))
        note(`${tag}: in each step the label, the title and the text come before its one illustration`, m.steps.every(s => ascending(s.order) && s.pictures.length === 1 && s.titleTag === 'H3'), m.steps.map(s => `${s.id}: ${s.order.join(' < ')}`).join(' | '))
        note(`${tag}: no step holds a cover or an Apple Music button`, m.steps.every(s => s.covers === 0 && s.music === 0))
        const colWidth = m.W - 32
        note(`${tag}: each panel has the computer's measure (the column, 420 px at most, by 200)`, m.steps.filter(s => s.id !== 'albums').every(s => s.pictures[0].w === Math.min(colWidth, 420) && s.pictures[0].h === 200), m.steps.map(s => `${s.id} ${s.pictures[0].w}x${s.pictures[0].h}`).join(', '))
        // the owner, 2026-11-23: «Troca de passo: opção 3, as duas juntas» - the label, the thin line AND alternating bands
        const BAND = 'rgb(28, 28, 34)', NONE = 'rgba(0, 0, 0, 0)'
        note(`${tag}: the step mark is both: the thin line above every step but the first, and the 2nd and 4th steps on the lighter band (page, band, page, band, page)`, m.mark === 'line bands' && m.steps.every(s => s.line === (s.id === 'start' ? '0px' : '1px') && s.width === colWidth && s.band === (s.id === 'albums' || s.id === 'playlists' ? BAND : NONE)), m.steps.map(s => `${s.id} line ${s.line} band ${s.band}`).join(', '))
        const band = await page.evaluate(() => {
            const lum = (c) => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
            const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return Math.round((x + 0.05) / (y + 0.05) * 100) / 100 }
            const BAND = 'rgb(28, 28, 34)', PAGE = 'rgb(10, 10, 12)'
            const out = { texts: [], edges: [], pageToBand: ratio(BAND, PAGE), panels: [] }
            for (const id of ['albums', 'playlists']) {
                const s = document.getElementById(id), box = s.getBoundingClientRect()
                // the band is the step's ::before: from the step's left edge minus the gutter to its right edge plus the gutter
                const before = getComputedStyle(s, '::before')
                out.edges.push([Math.round(box.left + parseFloat(before.left)), Math.round(box.right - parseFloat(before.right)), innerWidth])
                for (const el of s.querySelectorAll('.kicker, .kicker .n, h3.t, p, .door, .ranked .tag span, .ranked li span')) {
                    const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
                    if (r.width < 1 || cs.display === 'none' || !el.textContent.trim()) continue
                    // a text inside the ranking card stands on the card, the others on the band
                    const ground = el.closest('.ranked') ? getComputedStyle(el.closest('.ranked')).backgroundColor : BAND
                    out.texts.push([`${id} ${el.className || el.tagName.toLowerCase()}`, ratio(cs.color, ground)])
                }
                const panel = s.querySelector('.ranked, .v4-motif'), pcs = getComputedStyle(panel)
                out.panels.push([id, pcs.borderTopColor, pcs.backgroundColor])
            }
            return out
        })
        const worst = band.texts.reduce((a, b) => (b[1] < a[1] ? b : a))
        note(`${tag}: the band runs from edge to edge of the screen`, band.edges.every(([l, r, w]) => l === 0 && r === w), JSON.stringify(band.edges))
        note(`${tag}: every text of a step on the band has a contrast of 4.5 to 1 or more`, band.texts.length >= 10 && band.texts.every(([, c]) => c >= 4.5), `${band.texts.length} texts; the lowest: ${worst[0]} ${worst[1]}:1; the band against the page: ${band.pageToBand}:1`)
        note(`${tag}: an illustration on the band keeps its reinforced outline`, band.panels.every(([, border]) => border === 'rgba(255, 255, 255, 0.24)'), JSON.stringify(band.panels))
        note(`${tag}: the inventory step says «Catalogue»`, m.steps[4].title === t.catalogue, m.steps[4].title)
        // the one switch: each word alone still works
        const alone = await page.evaluate(() => {
            const main = document.getElementById('main'), was = main.getAttribute('data-step-mark')
            const read = () => ['start', 'albums', 'blend', 'playlists', 'inventory'].map(id => { const s = getComputedStyle(document.getElementById(id), '::before'); return `${s.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'page' : 'band'}/${s.borderTopWidth}` }).join(' ')
            main.setAttribute('data-step-mark', 'line'); const line = read()
            main.setAttribute('data-step-mark', 'bands'); const bands = read()
            main.setAttribute('data-step-mark', was); return { line, bands }
        })
        note(`${tag}: the switch still gives each mark alone (tried and put back): «line» and «bands»`, alone.line === 'page/0px page/1px page/1px page/1px page/1px' && alone.bands === 'page/0px band/0px page/0px band/0px page/0px', JSON.stringify(alone))
        // the shelf
        const s = m.shelf
        note(`${tag}: the shelf is «${t.shelf}», 15 albums, its row named for a screen reader`, s.title === t.shelf && s.cards === 15 && s.shownCards === 15 && s.rowName === t.row, `${s.title}; ${s.cards} cards; row «${s.rowName}»; first: ${s.names.join(', ')}`)
        note(`${tag}: the row is wider than the screen and stays inside it; the next album's edge is in sight`, s.rowScrollWidth > s.rowClientWidth * 5 && s.rowBox.w === m.W && s.peeking === 1, `row ${s.rowClientWidth} of ${s.rowScrollWidth}; albums cut by the right edge: ${s.peeking}`)
        note(`${tag}: every album's button goes to the album's own Apple Music page, in a new tab, named with the album and the artist, 44 px high, its text inside it`, s.links.length === 15 && s.links.every(a => /^https:\/\/music\.apple\.com\/us\/album\/[^/]+\/\d+$/.test(a.href) && a.target === '_blank' && a.rel === 'noopener' && a.name.includes(t.listen) && a.name.endsWith(t.newtab) && /: .+, .+ \(/.test(a.name) && a.fits && a.h >= 44), `${s.links[5].name}; not fitting: ${s.links.filter(a => !a.fits).length}`)
        note(`${tag}: two arrows to tap, 44 px, named; at the start «${t.prev}» is off`, s.arrows.every(a => a.shown && a.w >= 44 && a.h >= 44) && s.arrows[0].name === t.prev && s.arrows[1].name === t.next && s.arrows[0].off === 'true' && s.arrows[1].off === 'false', JSON.stringify(s.arrows))
        // the shelf moves only when asked
        await page.locator('#crate-shelf').scrollIntoViewIfNeeded()
        await page.waitForTimeout(2600)
        const idle = await page.evaluate(() => document.getElementById('shelf').scrollLeft)
        note(`${tag}: nothing moves by itself (2.6 s in view, the row did not move)`, idle === 0, `scrollLeft ${idle}`)
        await page.screenshot({ path: path.join(OUT, `${tag}-3-shelf.jpg`), type: 'jpeg', quality: 72 })
        await page.locator('#shelf-next').click() // a <button> of the page, not a link
        await page.waitForTimeout(900)
        const one = await page.evaluate(() => ({ x: document.getElementById('shelf').scrollLeft, prev: document.getElementById('shelf-prev').getAttribute('aria-disabled'), y: scrollY }))
        await page.locator('#shelf-next').click()
        await page.waitForTimeout(900)
        const two = await page.evaluate(() => document.getElementById('shelf').scrollLeft)
        await page.locator('#shelf-prev').click()
        await page.waitForTimeout(900)
        const back = await page.evaluate(() => document.getElementById('shelf').scrollLeft)
        note(`${tag}: a tap on «${t.next}» moves the row one album (164 px), «${t.prev}» brings it back`, one.x === 164 && two === 328 && back === 164 && one.prev === 'false', `${one.x}, ${two}, back to ${back}`)
        await page.locator('#shelf').focus()
        await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900)
        const key = await page.evaluate(() => document.getElementById('shelf').scrollLeft)
        note(`${tag}: the row takes the keyboard: the right arrow moves it one album`, key === 328, `scrollLeft ${key}`)
        const end = await page.evaluate(async () => { const row = document.getElementById('shelf'); row.scrollTo({ left: 99999, behavior: 'instant' }); await new Promise(r => setTimeout(r, 400)); return { x: row.scrollLeft, max: row.scrollWidth - row.clientWidth, next: document.getElementById('shelf-next').getAttribute('aria-disabled'), page: document.documentElement.scrollWidth } })
        note(`${tag}: at the end of the row «${t.next}» is off and the page is still as wide as the screen`, Math.abs(end.x - end.max) <= 2 && end.next === 'true' && end.page === m.W, JSON.stringify(end))
        // who opens the app
        if (signedIn) {
            note(`${tag}: signed in, the top has «${t.create}» to the app, and the bar's five items go to their screens`, m.topButtons.length === 1 && m.topButtons[0].text === t.create && m.topButtons[0].href === '/start' && JSON.stringify(m.bar.map(b => b.href)) === JSON.stringify(['/start', '/albums', '/blend', '/saved-playlists', '/inventory']), `top: ${m.topButtons.map(b => `${b.text} -> ${b.href}`).join(', ')}; bar: ${m.bar.map(b => `${b.text} -> ${b.href}`).join(', ')}`)
        } else {
            note(`${tag}: the visitor has «${t.signin}» at the top and the bar's «${t.create}» opens the app (href judged, not opened); the other four lead to their steps`, m.topButtons.length === 1 && m.topButtons[0].text === t.signin && m.topButtons[0].href === '/start?signin' && m.barShown && JSON.stringify(m.bar.map(b => b.href)) === JSON.stringify(['/start', '#albums', '#blend', '#playlists', '#inventory']) && JSON.stringify(m.bar.map(b => b.text)) === JSON.stringify(t.bar), `top: ${m.topButtons.map(b => `${b.text} -> ${b.href}`).join(', ')}; bar: ${m.bar.map(b => `${b.text} -> ${b.href}`).join(', ')}`)
        }
        // pictures of the part that teaches
        await page.evaluate(() => scrollTo(0, document.getElementById('edu').getBoundingClientRect().top + scrollY - 70))
        await page.waitForTimeout(700)
        await page.screenshot({ path: path.join(OUT, `${tag}-2-how-it-works.jpg`), type: 'jpeg', quality: 72 })
        if (width === 390 && lang === 'pt') {
            await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300)
            await page.screenshot({ path: path.join(OUT, `${tag}-whole-page.jpg`), type: 'jpeg', quality: 60, fullPage: true })
        }
        const wide = await page.evaluate(async () => { scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 300)); return document.documentElement.scrollWidth })
        note(`${tag}: at the bottom of the page it is still as wide as the screen`, wide === m.W, `page ${wide}`)
    } finally { await browser.close() }
}

async function withoutScript(engine) {
    const tag = `${engine}-390-pt-out-noscript`
    const { browser, page, net } = await open({ engine, width: 390, height: 844, script: false })
    try {
        const m = await page.evaluate(() => {
            const shown = (el) => { if (!el) return false; const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' }
            const text = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim()
            return {
                W: innerWidth, page: document.documentElement.scrollWidth,
                steps: ['start', 'albums', 'blend', 'playlists', 'inventory'].map(id => { const s = document.getElementById(id); return shown(s.querySelector('.kicker')) && shown(s.querySelector('h3.t')) && shown(s.querySelector(`[data-i18n="p.${id}"]`)) && text(s.querySelector('h3.t')).length > 10 }),
                edu: shown(document.getElementById('edu')) && text(document.getElementById('edu')),
                cards: [...document.querySelectorAll('#shelf .al')].filter(shown).length, links: document.querySelectorAll('#shelf .al a.am[href^="https://music.apple.com/us/album/"]').length,
                rowScrolls: document.getElementById('shelf').scrollWidth > document.getElementById('shelf').clientWidth * 5,
                arrows: [...document.querySelectorAll('.sw-ctl button')].filter(shown).length,
                heroButtons: [...document.querySelectorAll('section.hero .ctas a')].filter(shown).map(a => `${text(a)} -> ${a.getAttribute('href')}`),
                signin: [...document.querySelectorAll('header.top a.btn')].filter(shown).map(a => text(a))
            }
        })
        measures[tag] = m
        await page.screenshot({ path: path.join(OUT, `${tag}-landing.jpg`), type: 'jpeg', quality: 72 })
        note(`${tag}: without script the title and the five steps read whole`, m.edu === 'Como funciona' && m.steps.every(Boolean), JSON.stringify(m.steps))
        note(`${tag}: without script the shelf shows its 15 albums with their links and scrolls by itself; the arrows, which need the script, are not shown`, m.cards === 15 && m.links === 15 && m.rowScrolls && m.arrows === 0, `cards ${m.cards}, links ${m.links}, arrows ${m.arrows}`)
        note(`${tag}: without script (no bottom bar) the visitor keeps «Abrir o app» in the opening, and «Entrar» at the top`, m.heroButtons.length === 1 && m.heroButtons[0] === 'Abrir o app -> /start' && m.signin.includes('Entrar'), `${m.heroButtons.join(', ')}; top: ${m.signin.join(', ')}`)
        note(`${tag}: without script the page is as wide as the screen`, m.page === m.W, `page ${m.page}`)
        note(`${tag}: no request for a music service`, net.aborted.size === 0, [...net.aborted].join(', '))
    } finally { await browser.close() }
}

async function lessMotion(engine) {
    const tag = `${engine}-390-pt-out-less-motion`
    const { browser, page, errors, net } = await open({ engine, width: 390, height: 844, reduce: true })
    try {
        const m = await page.evaluate(readPhone)
        note(`${tag}: with less motion asked nothing moves by itself and the pause icon is hidden`, !m.moving && m.pauseHidden && !m.canvas3d && !net.three, `moving ${m.moving}, pause hidden ${m.pauseHidden}`)
        await page.locator('#crate-shelf').scrollIntoViewIfNeeded()
        await page.locator('#shelf-next').click()
        const at = await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(document.getElementById('shelf').scrollLeft)))))
        note(`${tag}: the arrow moves the row at once, without gliding`, at === 164, `two frames after the tap: ${at}`)
        note(`${tag}: no console error`, errors.length === 0, errors.join(' | '))
    } finally { await browser.close() }
}

/** The computer: every visible box of the page, before against after. */
const readComputer = () => {
    const r1 = (n) => Math.round(n * 10) / 10
    const rows = []
    for (const el of document.querySelectorAll('body *')) {
        if (el.closest('.edu-t, .shelf-sec, .slot, .m-albums, script, noscript')) continue
        if (el.matches('.kicker .n')) continue // the step's number, set apart inside its label for the phone: judged below (it must look like the label around it)
        const r = el.getBoundingClientRect(), s = getComputedStyle(el)
        if (r.width < 1.5 || r.height < 1.5 || s.display === 'none') continue
        const tag = el.tagName === 'H3' && el.classList.contains('t') ? 'H2' : el.tagName
        const cls = String(el.className.baseVal ?? el.className).replace(/\bstep\b/, '').trim()
        rows.push([tag, cls, el.id, r1(r.x), r1(r.y + scrollY), r1(r.width), r1(r.height), s.color, s.fontSize, s.fontWeight, s.visibility, el.tagName === 'A' ? el.getAttribute('href') : ''].join('|'))
    }
    const edu = document.getElementById('edu'), shelf = document.getElementById('crate-shelf')
    return {
        rows, pageHeight: document.documentElement.scrollHeight, scrollWidth: document.documentElement.scrollWidth,
        edu: edu ? (() => { const r = edu.getBoundingClientRect(); return `${r.width}x${r.height}` })() : 'absent',
        shelf: shelf ? getComputedStyle(shelf).display : 'absent',
        heroButtons: [...document.querySelectorAll('section.hero .ctas a')].filter(a => a.getBoundingClientRect().width > 1).map(a => a.textContent.replace(/\s+/g, ' ').trim()),
        menu: [...document.querySelectorAll('.ms-desk a.stop')].map(a => a.getAttribute('href')),
        yaw: getComputedStyle(document.getElementById('crate-css')).getPropertyValue('--yaw').trim(),
        numbers: [...document.querySelectorAll('.kicker .n')].map(n => { const a = getComputedStyle(n), b = getComputedStyle(n.parentElement); return a.color === b.color && a.fontSize === b.fontSize && a.fontWeight === b.fontWeight && a.fontFamily === b.fontFamily && a.letterSpacing === b.letterSpacing && a.marginLeft === '0px' && a.verticalAlign === 'baseline' })
    }
}

async function computer(lang, signedIn) {
    const tag = `chromium-1280-${lang}-${signedIn ? 'in' : 'out'}`
    const read = {}
    for (const [side, base] of [['before', BEFORE], ['after', AFTER]]) {
        // less motion asked: the fire and the vignettes stand still, so the two pages can be compared box by box
        const { browser, page, errors } = await open({ engine: 'chromium', width: 1280, height: 800, lang, signedIn, base, reduce: true, phone: false })
        read[side] = await page.evaluate(readComputer)
        read[side].errors = errors
        if (lang === 'pt') await page.screenshot({ path: path.join(OUT, `${tag}-${side}.jpg`), type: 'jpeg', quality: 72 })
        await browser.close()
    }
    const a = read.before, b = read.after
    const gone = a.rows.filter(row => !b.rows.includes(row)), came = b.rows.filter(row => !a.rows.includes(row))
    measures[tag] = { boxes: [a.rows.length, b.rows.length], gone, came, pageHeight: [a.pageHeight, b.pageHeight], after: { edu: b.edu, shelf: b.shelf, heroButtons: b.heroButtons, menu: b.menu, yaw: b.yaw } }
    note(`${tag}: the computer did not change: every visible box, its place, size, colour, type and link are the same before and after`, gone.length === 0 && came.length === 0 && a.pageHeight === b.pageHeight && a.rows.length > 150, `${a.rows.length} boxes before, ${b.rows.length} after; gone ${gone.length}, new ${came.length}; page ${a.pageHeight} -> ${b.pageHeight}${gone[0] ? '; first gone: ' + gone[0] : ''}${came[0] ? '; first new: ' + came[0] : ''}`)
    note(`${tag}: on the computer the new title is read, not shown (1 px), the shelf is not shown, the opening keeps its buttons, the crate keeps its 15 degrees`, b.edu === '1x1' && b.shelf === 'none' && b.heroButtons.length >= 1 && b.yaw === '-15deg' && JSON.stringify(a.heroButtons) === JSON.stringify(b.heroButtons), `title ${b.edu}, shelf ${b.shelf}, buttons ${b.heroButtons.join(', ')}, yaw ${b.yaw}`)
    note(`${tag}: the five step numbers, now a span inside their label, look exactly like the label (colour, size, weight, face, spacing)`, b.numbers.length === 5 && b.numbers.every(Boolean), JSON.stringify(b.numbers))
    note(`${tag}: the computer's menu leads where it led`, JSON.stringify(a.menu) === JSON.stringify(b.menu), b.menu.join(', '))
    note(`${tag}: no console error`, b.errors.length === 0, b.errors.join(' | '))
}

async function weight() {
    const sizes = {}
    for (const [side, base] of [['before', BEFORE], ['after', AFTER]]) {
        const { browser, page, net } = await open({ engine: 'webkit', width: 390, height: 844, base })
        await page.waitForTimeout(1500)
        const html = Buffer.from(await (await fetch(`${base}/`)).arrayBuffer())
        sizes[side] = { bytes: net.bytes, three: net.three, html: html.length, htmlGzip: zlib.gzipSync(html).length }
        await browser.close()
    }
    measures.weight = sizes
    const kb = (n) => Math.round(n / 1024)
    // what grows is the page itself (the 15 albums of the shelf are written in it); a host serves it compressed, so the wire grows by the gzip difference
    note('the first visit on the phone: the 3D library is not fetched, and the page on the wire (gzip) grows by less than 3 KB', !sizes.after.three && sizes.after.htmlGzip - sizes.before.htmlGzip < 3 * 1024 && sizes.after.bytes - sizes.before.bytes < 16 * 1024, `the page: ${sizes.before.html} B -> ${sizes.after.html} B as written, ${sizes.before.htmlGzip} B -> ${sizes.after.htmlGzip} B in gzip (+${sizes.after.htmlGzip - sizes.before.htmlGzip} B); every body received, uncompressed as the preview serves them, covers included: before ${kb(sizes.before.bytes)} KB, after ${kb(sizes.after.bytes)} KB`)
}

const PHONES = [{ width: 390, height: 844 }, { width: 360, height: 740 }]
for (const engine of ['chromium', 'webkit']) for (const size of PHONES) for (const lang of ['pt', 'en']) for (const signedIn of [false, true]) await phoneRun({ engine, ...size, lang, signedIn })
for (const engine of ['chromium', 'webkit']) { await withoutScript(engine); await lessMotion(engine) }
for (const lang of ['pt', 'en']) for (const signedIn of [false, true]) await computer(lang, signedIn)
await weight()

fs.writeFileSync(path.join(OUT, 'measures.json'), JSON.stringify(measures, null, 1))
const failed = results.filter(r => !r.ok)
const header = `F96 - the entry page on the phone: browser proof on the BUILT site (vite build with the real covers, vite preview)\nafter: the branch feat/f96-entry-page-on-the-phone; before: main 7369dd8\nChromium and WebKit (Playwright) as a phone at 390x844 and 360x740, visitor and signed in (a stand-in record in the page's storage), pt and en;\neach engine once without script and once with less motion asked; Chromium at 1280x800, before against after.\nNothing but the page's own two arrow buttons was clicked; no link was opened; music hosts, foreign schemes, Firebase and every other host aborted.\n\n`
fs.writeFileSync(path.join(OUT, 'results.txt'), header + results.map(r => `${r.ok ? 'PASS' : 'FAIL'}  ${r.what}${r.detail ? '\n      ' + r.detail : ''}`).join('\n') + `\n\n${results.length - failed.length} passed, ${failed.length} failed\n`)
console.log(`${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
