/**
 * F96 - the entry page on the PHONE, redesigned (the owner, 2026-11-23: «escolho a do especialista, mas com essa landing aqui, muito melhor»).
 *
 *   the landing    the crate on the diagonal (the light CSS crate turned, never the 3D library), no big button, for the visitor too;
 *   the body       vertical: the part that teaches the app under its own title («Como funciona», the only orange of that stretch), each
 *                  step label, title, text and THEN its one illustration; the albums leave the steps;
 *   the crate      «Na caixa do The Album Blender», the page's only sideways swipe, at the end: the browser's own scroll, arrows to tap,
 *                  nothing moves by itself, and it reads without script;
 *   the visitor    «Entrar» at the top; the bottom bar's «Criar» opens the app;
 *   the top bar    never wider than the screen, signed in, in English, at 390 and 360 px.
 * The computer is not this feature's: every rule here lives inside the phone's block or is hidden on a computer.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { COPY, stepLabelHtml } from '../../public/splash/copy.js'
import { COVER_SETS, shelfHtml, coverImagesHtml, captionHtml } from '../../public/splash/covers.js'
import { MENU, menuHref, applyAccount } from '../../public/splash/menu.js'
import { applyLanguage } from '../../public/splash/lang.js'
import { stepTarget, startShelf } from '../../public/splash/shelf.js'
import { shouldLoad3d, startSplash } from '../../public/splash/splash.js'
import { PLACES, fillEntryPage, fillCopy } from '../../scripts/entryPage.mjs'

const ROOT = process.cwd()
const source = readFileSync(resolve(ROOT, 'public/splash.html'), 'utf8')
const built = (set) => fillEntryPage(source, { set })
const STEPS = ['start', 'albums', 'blend', 'playlists', 'inventory']
const sectionOf = (html, id) => {
    const from = html.search(new RegExp(`<section[^>]*\\sid="${id}"`))
    return from < 0 ? '' : html.slice(from, html.indexOf('</section>', from))
}
// the feature's own style: one block, the last of the page's style
const f96 = source.includes('/* ===== F96') ? source.slice(source.indexOf('/* ===== F96'), source.indexOf('</style>')) : ''
const phone = f96.slice(Math.max(0, f96.indexOf('@media (max-width:899px){')))
const computer = f96.slice(0, Math.max(0, f96.indexOf('@media (max-width:899px){')))

describe('the texts (TASK-07)', () => {
    it('the part that teaches is «Como funciona» / «How it works»', () => {
        expect(COPY.pt['edu.title']).toBe('Como funciona')
        expect(COPY.en['edu.title']).toBe('How it works')
    })

    it('the crate is «Na caixa do The Album Blender» / «In The Album Blender\'s crate», the product named in full', () => {
        expect(COPY.pt['shelf.title']).toBe('Na caixa do The Album Blender')
        expect(COPY.en['shelf.title']).toBe('In The Album Blender\'s crate')
        expect(COPY.pt['shelf.aria']).toBe('Álbuns da caixa do The Album Blender')
        expect(COPY.en['shelf.aria']).toBe('Albums in The Album Blender\'s crate')
    })

    it('the arrows have a name for the screen reader, and say «álbum»', () => {
        expect([COPY.pt['shelf.prev'], COPY.pt['shelf.next']]).toEqual(['Álbum anterior', 'Próximo álbum'])
        expect([COPY.en['shelf.prev'], COPY.en['shelf.next']]).toEqual(['Previous album', 'Next album'])
    })

    it('the inventory step keeps «Catalogue»', () => {
        expect(COPY.en['t.inventory']).toMatch(/^Catalogue /)
        expect(COPY.pt['t.inventory']).toMatch(/^Catalogue /)
    })
})

describe('the part that teaches the app (TASK-03)', () => {
    it('has its own title, written in the page, right before the first step', () => {
        const title = '<h2 class="edu-t" id="edu" data-i18n="edu.title"></h2>'
        expect(source).toContain(title)
        expect(source.slice(source.indexOf(title) + title.length).trimStart().startsWith('<section class="step" id="start"')).toBe(true)
        expect(built('real')).toContain('<h2 class="edu-t" id="edu" data-i18n="edu.title">Como funciona</h2>')
    })

    it('on the phone the title is in the fire\'s orange (the design system\'s `--orange`), and is the stretch\'s only orange text: the labels, the flip and the doors go neutral', () => {
        expect(phone).toMatch(/\.story > \.edu-t\{[^}]*color:var\(--orange\)/)
        expect(phone).toMatch(/\.step \.kicker\{[^}]*color:var\(--muted\)/)
        expect(phone).toMatch(/\.flip-band \.fb-title\{[^}]*color:#d6d6dc/)
        expect(phone).toMatch(/\.step \.door\{[^}]*color:#fff/)
        const others = phone.replace(/\.story > \.edu-t\{[^}]*\}/, '')
        expect(others).not.toMatch(/color:var\(--orange(-text)?\)/)
    })

    it('on a computer the title is read, not shown: the page there looks as it did', () => {
        expect(computer).toMatch(/\.edu-t\{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect\(0 0 0 0\);white-space:nowrap\}/)
    })

    it('each of the five steps: its label, its title (one level under the part\'s), its text, and only then its illustration', () => {
        for (const id of STEPS) {
            const step = sectionOf(source, id)
            expect(step.startsWith(`<section class="step" id="${id}"`), id).toBe(true)
            const at = ['class="kicker"', `<h3 class="t" id="t-${id}"`, `data-i18n="p.${id}"`, id === 'albums' ? 'class="ranked rank-real"' : 'class="v4-motif'].map(mark => step.indexOf(mark))
            at.forEach(i => expect(i, id).toBeGreaterThan(-1))
            expect([...at].sort((x, y) => x - y), id).toEqual(at)
        }
        expect(source).not.toMatch(/<h2 class="t" id="t-(start|albums|blend|playlists|inventory)"/)
    })

    it('the five steps are read by scrolling the page: none of them is inside a sideways row, and the page has one row only', () => {
        expect(source.match(/class="sw"/g)).toHaveLength(1)
        const row = source.slice(source.indexOf('<div class="sw"'), source.indexOf('</section>', source.indexOf('<div class="sw"')))
        for (const id of STEPS) expect(row).not.toContain(`id="${id}"`)
    })

    it('the step\'s number stands out inside its label, in the build and when the language changes', () => {
        expect(stepLabelHtml('Lado A · 1 — Criar')).toBe('Lado A · <span class="n">1</span> — Criar')
        expect(stepLabelHtml('Vire o lado')).toBe('Vire o lado')
        expect(fillCopy('<p class="kicker" data-i18n="k.blend" data-num></p>')).toBe('<p class="kicker" data-i18n="k.blend" data-num>Lado A · <span class="n">3</span> — Blend</p>')
        expect(fillCopy('<p class="kicker" data-i18n="k.blend"></p>')).toBe('<p class="kicker" data-i18n="k.blend">Lado A · 3 — Blend</p>')
        for (const id of STEPS) expect(sectionOf(source, id)).toContain(`<p class="kicker" data-i18n="k.${id}" data-num></p>`)
        document.body.innerHTML = '<p class="kicker" data-i18n="k.inventory" data-num></p><p id="x" data-i18n="k.start"></p>'
        applyLanguage(document, 'en')
        expect(document.querySelector('.kicker').innerHTML).toBe('Side B · <span class="n">2</span> — Inventory')
        expect(document.getElementById('x').innerHTML).toBe('Side A · 1 — Create')
    })

    // The owner, 2026-11-23, on the preview: «Troca de passo: opção 3, as duas juntas» - the label AND the thin line AND alternating bands.
    it('the mark between two steps is ONE switch on the page, a list of words: «line bands» today (the owner\'s «as duas juntas»), each still there alone', () => {
        expect(source).toMatch(/<main id="main" class="wrap story" data-step-mark="line bands">/)
        expect(phone).toMatch(/\[data-step-mark~="line"\] > \.step::before,\[data-step-mark~="line"\] > \.flip-band::before\{border-top:1px solid var\(--line\)\}/)
        expect(phone).toMatch(/\[data-step-mark~="bands"\] > #albums::before,\[data-step-mark~="bands"\] > #playlists::before\{background:var\(--step-band\)\}/)
    })

    it('the band is the design system\'s «superfície» (#1c1c22), the declared surface nearest to the sketch he saw; the steps go page, band, page, band, page', () => {
        expect(phone).toMatch(/\.story\{--step-band:#1c1c22\}/)
        expect(phone).not.toMatch(/#17171a|#0c0c0d/)
        expect(phone).not.toMatch(/\[data-step-mark~="bands"\] > #(start|blend|inventory)::before/)
    })

    it('the band runs from edge to edge of the screen, and an illustration on it keeps a visible outline', () => {
        expect(phone).toMatch(/\.story > \.step::before,\.story > \.flip-band::before\{[^}]*left:calc\(-1 \* var\(--gutter\)\);right:calc\(-1 \* var\(--gutter\)\)/)
        expect(phone).toMatch(/\[data-step-mark~="bands"\] > #albums \.ranked,\[data-step-mark~="bands"\] > #playlists \.v4-motif\{border-color:rgba\(255,255,255,\.24\)\}/)
    })
})

describe('the albums leave the steps (TASK-04)', () => {
    it('no step carries a cover any more: one illustration each, the ranking card being the one of «Álbuns»', () => {
        expect(source).not.toMatch(/class="slot/)
        for (const id of STEPS) {
            const step = sectionOf(source, id)
            expect(step, id).not.toBe('')
            expect(step.match(/class="v4-motif/g) || [], id).toHaveLength(id === 'albums' ? 0 : 1)
            expect(step.match(/class="ranked rank-real"/g) || [], id).toHaveLength(id === 'albums' ? 1 : 0)
        }
    })

    it('the page\'s script no longer copies a record into each step, and no rule of the page styles one', () => {
        const script = readFileSync(resolve(ROOT, 'public/splash/splash.js'), 'utf8')
        expect(script).not.toMatch(/phoneSlots|\.slot\b|slot-am/)
        expect(source).not.toMatch(/\.slot\b|slot-am|slot-who/)
    })

    it('on the phone the illustration has the measure the computer gives it (420 x 200 at most), alone on its line', () => {
        expect(phone).toMatch(/\.v4-lead\{display:block;margin:20px 0 0\}/)
        expect(phone).toMatch(/\.v4-motif\{width:min\(100%,420px\);height:200px;margin:0\}/)
    })
})

describe('the crate «Na caixa do The Album Blender» (TASK-05)', () => {
    const real = () => built('real')
    const shelf = () => sectionOf(real(), 'crate-shelf')

    it('is written by the build, in a place of its own, after the last step and before the invitation', () => {
        expect(PLACES).toContain('shelf')
        expect(source).toContain('<!--splash:shelf-->')
        const at = ['id="inventory"', 'id="crate-shelf"', 'id="end"'].map(mark => source.indexOf(mark))
        at.forEach(i => expect(i).toBeGreaterThan(-1))
        expect([...at].sort((x, y) => x - y)).toEqual(at)
        expect(shelf()).toContain('<h2 class="shelf-t" id="t-shelf" data-i18n="shelf.title">Na caixa do The Album Blender</h2>')
    })

    it('every album of the crate is there, in the crate\'s order: the cover, the name and «Ouça no Apple Music» to the album\'s own page', () => {
        const cards = shelfHtml('real').match(/<li class="al">[\s\S]*?<\/li>/g)
        expect(cards).toHaveLength(15)
        cards.forEach((card, i) => {
            const album = COVER_SETS.real[i]
            expect(card).toContain(`<b>${album.t.replace(/&/g, '&amp;')}</b>`)
            expect(card).toMatch(/<img [^>]*alt="" width="150" height="150" loading="lazy"/)
            expect(card).toContain(`<a class="am" href="${album.href}" target="_blank" rel="noopener">`)
            expect(card).toContain('<span data-i18n="c.listen"></span>')
        })
        expect(shelf().match(/<li class="al">/g)).toHaveLength(15)
    })

    it('a cover of the shelf is the crate\'s own image: the same address, nothing more on the wire', () => {
        const crate = coverImagesHtml('real').match(/src="[^"]+"/g)
        const cards = shelfHtml('real').match(/src="[^"]+"/g)
        expect(cards).toEqual(crate)
        expect(shelfHtml('real')).toContain('crossorigin="anonymous"')
    })

    it('a button\'s name says what it does, the album and the artist, and that it opens a new tab, in the page\'s language, without script', () => {
        document.body.innerHTML = `<ol>${fillCopy(shelfHtml('real'), 'pt')}</ol>`
        const dummy = [...document.querySelectorAll('.al')][5].querySelector('a')
        expect(dummy.textContent.replace(/\s+/g, ' ').trim()).toBe('♫Ouça no Apple Music: Dummy, Portishead (abre numa nova aba)')
        expect(dummy.hasAttribute('aria-label')).toBe(false)
        applyLanguage(document, 'en')
        expect(dummy.textContent.replace(/\s+/g, ' ').trim()).toBe('♫Listen on Apple Music: Dummy, Portishead (opens in a new tab)')
        expect(dummy.querySelector('.mk').getAttribute('aria-hidden')).toBe('true')
    })

    it('fictional albums carry their name, their artist and the word «fictício», and no link out', () => {
        const fictional = shelfHtml('fictional')
        expect(fictional.match(/<li class="al">/g)).toHaveLength(14)
        expect(fictional).not.toMatch(/<a /)
        expect(fictional).toContain('<b>Lantern Hymnal</b><span class="al-by">The Hollow Lanterns · <span data-i18n="c.fictional"></span></span>')
        expect(built('fictional')).not.toContain('music.apple.com')
    })

    it('the row scrolls by the browser itself and may be reached by the keyboard; it has a name', () => {
        expect(shelf()).toMatch(/<div class="sw" id="shelf" tabindex="0" role="group" aria-label="Álbuns da caixa do The Album Blender" data-i18n-aria="shelf\.aria">\s*<ol class="shelf">/)
        expect(phone).toMatch(/\.sw\{[^}]*overflow-x:auto[^}]*scroll-snap-type:x mandatory/)
        // the next album's edge is in sight: two cards and their gaps leave room on a 360 px screen
        const card = Number(phone.match(/\.shelf\{[^}]*grid-auto-columns:(\d+)px/)[1]), gap = Number(phone.match(/\.shelf\{[^}]*gap:(\d+)px/)[1])
        expect(16 + 2 * (card + gap)).toBeLessThan(360 - 12)
    })

    it('two arrows to tap, 44 px, each with its name; without script they are not shown (the row still scrolls)', () => {
        expect(shelf()).toMatch(/<button type="button" id="shelf-prev" aria-label="Álbum anterior" data-i18n-aria="shelf\.prev">/)
        expect(shelf()).toMatch(/<button type="button" id="shelf-next" aria-label="Próximo álbum" data-i18n-aria="shelf\.next">/)
        expect(phone).toMatch(/\.sw-ctl button\{[^}]*width:44px;height:44px/)
        expect(phone).toMatch(/html:not\(\.js\) \.sw-ctl\{display:none\}/)
    })

    it('on a computer the shelf is not shown (the computer\'s curation is another feature\'s)', () => {
        // as specific as the page's rule for a story, or that rule shows it (the proof caught it: the computer's page grew 3061 px)
        expect(computer).toMatch(/\n\.story > \.shelf-sec\{display:none\}/)
        expect(phone).toMatch(/\.story > \.shelf-sec\{display:block/)
    })

    it('an arrow takes the row to the next album that starts past the left edge, or back to the one before it', () => {
        const starts = [0, 164, 328, 492, 656]
        expect(stepTarget(starts, 0, 1, 400)).toBe(164)
        expect(stepTarget(starts, 164, 1, 400)).toBe(328)
        expect(stepTarget(starts, 170, 1, 400)).toBe(328)
        expect(stepTarget(starts, 328, 1, 400)).toBe(400) // never past the end of the row
        expect(stepTarget(starts, 400, -1, 400)).toBe(328)
        expect(stepTarget(starts, 164, -1, 400)).toBe(0)
        expect(stepTarget(starts, 0, -1, 400)).toBe(0)
    })

    describe('wired', () => {
        const win = (reduce = false) => ({ document, matchMedia: () => ({ matches: reduce }), addEventListener() {} })
        const layOut = () => {
            const row = document.getElementById('shelf')
            const cards = [...row.querySelectorAll('.al')]
            cards.forEach((li, i) => Object.defineProperty(li, 'offsetLeft', { value: 16 + i * 164 }))
            Object.defineProperty(row, 'scrollWidth', { value: 16 + cards.length * 164 })
            Object.defineProperty(row, 'clientWidth', { value: 390 })
            return row
        }
        beforeEach(() => {
            const page = built('real')
            document.body.innerHTML = page.slice(page.indexOf('<body>') + 6, page.indexOf('</body>'))
        })

        it('at the start «anterior» is off and «próximo» is on; a tap on «próximo» moves the row by one album', () => {
            const row = layOut()
            startShelf(win())
            const prev = document.getElementById('shelf-prev'), next = document.getElementById('shelf-next')
            expect(prev.getAttribute('aria-disabled')).toBe('true')
            expect(next.getAttribute('aria-disabled')).toBe('false')
            next.click()
            expect(row.scrollLeft).toBe(164)
            row.dispatchEvent(new Event('scroll'))
            expect(prev.getAttribute('aria-disabled')).toBe('false')
            prev.click()
            expect(row.scrollLeft).toBe(0)
        })

        it('the arrows are judged again when the row gets its width (in WebKit the script runs before the row is laid out)', () => {
            const row = document.getElementById('shelf')
            const listeners = {}
            const seen = []
            class Observer { constructor(fn) { this.fn = fn } observe(el) { seen.push([el, this.fn]) } }
            startShelf({ ...win(), ResizeObserver: Observer, addEventListener: (name, fn) => { listeners[name] = fn } })
            const next = document.getElementById('shelf-next')
            expect(next.getAttribute('aria-disabled')).toBe('true') // no width yet: nowhere to go
            layOut()
            listeners.load()
            expect(next.getAttribute('aria-disabled')).toBe('false')
            expect(seen).toHaveLength(1)
            expect(seen[0][0]).toBe(row.querySelector('ol'))
        })

        it('the arrow keys do the same on the row', () => {
            const row = layOut()
            startShelf(win())
            row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
            row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
            expect(row.scrollLeft).toBe(328)
            row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
            expect(row.scrollLeft).toBe(164)
        })

        it('with less motion asked the row jumps instead of gliding', () => {
            const row = layOut()
            const calls = []
            row.scrollTo = (o) => { calls.push(o.behavior); row.scrollLeft = o.left }
            startShelf(win(true))
            document.getElementById('shelf-next').click()
            expect(calls).toEqual(['auto'])
        })
    })

    it('nothing moves by itself: the shelf\'s script has no timer and no animation frame', () => {
        const script = readFileSync(resolve(ROOT, 'public/splash/shelf.js'), 'utf8')
        expect(script).not.toMatch(/setInterval|setTimeout|requestAnimationFrame|autoplay/)
    })
})

describe('the landing (TASK-02)', () => {
    it('on the phone the opening has no big button, with or without an account', () => {
        expect(phone).toMatch(/\.hero \.ctas\{display:none\}/)
        // the computer keeps its buttons: the rule exists once, inside the phone's block
        expect(source.match(/\.hero \.ctas\{display:none\}/g)).toHaveLength(1)
        expect(computer).not.toMatch(/\.ctas/)
    })

    it('without script the bottom bar is not there, so the visitor\'s button stays in the opening', () => {
        const noscript = source.match(/<noscript><style>([\s\S]*?)<\/style><\/noscript>/)[1]
        expect(noscript).toMatch(/@media \(max-width:899px\)\{\.hero \.only-out \.ctas\{display:flex\}\}/)
    })

    it('the crate stands on the diagonal: the light CSS crate, turned in the style (the covers do not move when the script arrives)', () => {
        expect(phone).toMatch(/\.crate-css\{--yaw:-30deg\}/)
        expect(source).toContain('@media (min-width:900px){.crate-css{--yaw:-15deg}}') // the computer's, untouched
    })

    it('the 3D library never comes to the phone', () => {
        expect(shouldLoad3d({ reduce: false, phone: true, webgl: true, nogl: false })).toBe(false)
    })

    it('the caption under the crate still names the album and the year and carries «Ouça no Apple Music»', () => {
        const caption = captionHtml('real')
        expect(caption).toContain('<b>The Velvet Underground &amp; Nico</b>1967<')
        expect(caption).toContain('data-i18n="c.listen"')
    })
})

describe('the visitor opens the app (TASK-06)', () => {
    const start = MENU[0]

    it('on the phone, without an account, «Criar» opens the app; the other four still lead to their steps', () => {
        expect(menuHref(start, false, true)).toBe('/start')
        expect(MENU.slice(1).map(m => menuHref(m, false, true))).toEqual(['#albums', '#blend', '#playlists', '#inventory'])
    })

    it('on a computer nothing changes: «Criar» scrolls to its story', () => {
        expect(menuHref(start, false, false)).toBe('#start')
        expect(menuHref(start, false)).toBe('#start')
    })

    it('with an account every item goes to its screen, on both', () => {
        expect(MENU.map(m => menuHref(m, true, true))).toEqual(MENU.map(m => menuHref(m, true, false)))
        expect(menuHref(start, true, true)).toBe('/start')
    })

    it('applyAccount writes it on the bar', () => {
        document.documentElement.className = ''
        document.body.innerHTML = MENU.map(m => `<a class="stop" href="#${m.id}" data-for="${m.id}"></a>`).join('')
        applyAccount(document, false, true)
        expect([...document.querySelectorAll('.stop')].map(a => a.getAttribute('href'))).toEqual(['/start', '#albums', '#blend', '#playlists', '#inventory'])
    })

    it('«Entrar» stays at the top for the visitor', () => {
        expect(source).toMatch(/<a class="btn btn-ghost btn-sm only-out" href="\/start\?signin" data-i18n="signin"><\/a>/)
    })

    describe('the page wired', () => {
        const fakeWindow = ({ phone }) => {
            class Observer { observe() {} unobserve() {} disconnect() {} }
            return {
                document, location: { search: '' }, innerHeight: 0, devicePixelRatio: 1, Event, CustomEvent,
                IntersectionObserver: Observer, ResizeObserver: Observer,
                matchMedia: (q) => ({ matches: q.includes('max-width') && phone, addEventListener() {} }),
                navigator: { languages: ['pt-BR'] }, localStorage: undefined,
                getComputedStyle: () => ({ getPropertyValue: () => '0.72' }),
                requestAnimationFrame: () => 1, setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (t) => clearTimeout(t),
                addEventListener() {}
            }
        }
        beforeEach(() => {
            vi.useFakeTimers()
            const page = built('real')
            document.body.innerHTML = page.slice(page.indexOf('<body>') + 6, page.indexOf('</body>'))
            document.documentElement.className = ''
        })
        afterEach(() => { vi.useRealTimers() })

        it('on the phone the bar\'s «Criar» leads to the app from the first moment, before the account is even known', async () => {
            startSplash(fakeWindow({ phone: true }))
            expect(document.querySelector('.stop[data-for="start"]').getAttribute('href')).toBe('/start')
            await vi.advanceTimersByTimeAsync(700)
            expect(document.documentElement.classList.contains('in')).toBe(false)
            expect(document.querySelector('.stop[data-for="start"]').getAttribute('href')).toBe('/start')
            expect(document.querySelector('.stop[data-for="albums"]').getAttribute('href')).toBe('#albums')
        })

        it('on a computer the bar\'s «Criar» still scrolls to its story', async () => {
            startSplash(fakeWindow({ phone: false }))
            await vi.advanceTimersByTimeAsync(700)
            expect(document.querySelector('.stop[data-for="start"]').getAttribute('href')).toBe('#start')
        })

        it('no step of the wired phone page holds a link to Apple Music: the albums are in the crate only', () => {
            startSplash(fakeWindow({ phone: true }))
            for (const id of STEPS) expect(document.querySelectorAll(`#${id} a.am`), id).toHaveLength(0)
            expect(document.querySelectorAll('#crate-shelf a.am')).toHaveLength(15)
        })
    })
})

describe('the top bar fits the phone (the signed-in «Create» made the page 406 px wide on 390)', () => {
    it('on the phone the mark gives way: it may shrink, the account side never does', () => {
        expect(phone).toMatch(/\.top \.wrap\{gap:10px\}/)
        expect(phone).toMatch(/\.top \.home\{flex:0 1 133px;min-width:0\}/)
        expect(phone).toMatch(/\.top \.logo\{width:100%;height:auto\}/)
        expect(phone).toMatch(/\.top \.btn-sm\{padding:0 12px;gap:8px\}/)
    })

    it('the page itself never scrolls sideways on the phone: only the shelf does', () => {
        expect(phone).toMatch(/\.sw\{[^}]*margin:0 calc\(-1 \* var\(--gutter\)\)/)
        expect(phone).toMatch(/\.shelf-sec\{[^}]*min-width:0/)
    })
})
