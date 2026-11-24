/**
 * F82 TASK-04 (REQ-03, REQ-11) and F95 (TASK-02, TASK-04): the entry page reads the crate the owner published, after it has
 * loaded, and swaps it in, in the crate of the computer and in the phone's row; the fixed set stays when nothing is
 * published, when the read fails or is late, and when what was published does not pass the check. Every value goes through
 * the core's validator and is written as text; a cover is always on Apple's image server; the page's content policy is
 * opened only for the database read. And the crate on the computer carries its name, «Na caixa do The Album Blender».
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
    BATCH_GET_URL, CRATE_DOCUMENT, FIRESTORE_PROJECT, READ_TIMEOUT_MS, crateOfAnswer, plainOf, readPublishedCrate, shelfItemOf, sleeveOf, showsRealAlbums
} from '../../public/splash/publishedCrate.js'
import { cssCrateLayout, captionIndex, startSplash } from '../../public/splash/splash.js'
import { COVER_SETS, coverImagesHtml, captionHtml, shelfHtml, stageTagHtml } from '../../public/splash/covers.js'
import { COPY } from '../../public/splash/copy.js'
import { CRATE_LIMITS, encodeAlbum } from '../../shared/content/crate.js'
import { fillCopy, fillEntryPage } from '../../scripts/entryPage.mjs'

const PAGE = readFileSync(resolve(process.cwd(), 'public/splash.html'), 'utf8')

const album = (id, over = {}) => ({
    id: String(id), title: `Album ${id}`, artist: `Artist ${id}`, year: 1990, art: `Music1/v4/${id}/cover.jpg`, href: `https://music.apple.com/us/album/a/${id}`, ...over
})
const side = (from, count) => Array.from({ length: count }, (_, i) => album(from + i))

/** A value as Firestore's REST answer writes it. */
const wire = (value) => {
    if (typeof value === 'string') return { stringValue: value }
    if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
    if (typeof value === 'boolean') return { booleanValue: value }
    if (Array.isArray(value)) return { arrayValue: { values: value.map(wire) } }
    if (value === null) return { nullValue: null }
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, wire(v)])) } }
}
const found = (data) => [{ found: { name: CRATE_DOCUMENT, fields: wire(data).mapValue.fields, createTime: 'x', updateTime: 'x' }, readTime: 'x' }]
const missing = () => [{ missing: CRATE_DOCUMENT, readTime: 'x' }]
/** The document as the Painel saves it: one line of text an album (shared/content/crate.js). */
const published = (sideA = side(1, 6), sideB = side(20, 4)) => ({ _schemaVersion: 1, rev: 3, sideA: sideA.map(encodeAlbum), sideB: sideB.map(encodeAlbum) })

describe('where the crate is read from', () => {
    it('the site\'s own Firebase project, by the database\'s public address: one document', () => {
        const config = readFileSync(resolve(process.cwd(), 'public/js/firebase-config.js'), 'utf8')
        expect(config).toContain(`projectId: '${FIRESTORE_PROJECT}'`)
        expect(CRATE_DOCUMENT).toBe(`projects/${FIRESTORE_PROJECT}/databases/(default)/documents/published/crate`)
        expect(BATCH_GET_URL).toBe(`https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents:batchGet`)
    })

    it('the page\'s content policy is opened for the database read and for nothing else: images stay on Apple\'s one server', () => {
        const policy = PAGE.match(/Content-Security-Policy" content="([^"]+)"/)[1]
        const directive = (name) => policy.split(';').map(part => part.trim()).find(part => part.startsWith(`${name} `)).split(/\s+/).slice(1)
        expect(directive('connect-src')).toEqual(["'self'", 'https://cdn.jsdelivr.net', 'https://firestore.googleapis.com'])
        expect(directive('img-src')).toEqual(["'self'", 'data:', 'https://is1-ssl.mzstatic.com'])
        expect(directive('default-src')).toEqual(["'self'"])
    })

    it('the entry page carries no Firebase SDK: the read is the browser\'s own fetch', () => {
        const source = readFileSync(resolve(process.cwd(), 'public/splash/publishedCrate.js'), 'utf8')
        expect(source).not.toMatch(/from 'firebase|firebase-init|innerHTML|insertAdjacentHTML|outerHTML/)
    })
})

describe('what the database answered', () => {
    it('Firestore\'s typed values become plain data', () => {
        expect(plainOf(wire({ a: 'x', n: 3, list: [{ y: 1967 }], b: true, nothing: null }))).toEqual({ a: 'x', n: 3, list: [{ y: 1967 }], b: true, nothing: null })
        expect(plainOf({ referenceValue: 'x' })).toBeNull()
        expect(plainOf('x')).toBeNull()
    })

    it('a published crate that passes the check: its two sides', () => {
        expect(crateOfAnswer(found(published()))).toEqual({ state: 'published', sides: { a: side(1, 6), b: side(20, 4) }, rejected: 0 })
    })

    it('nothing published is «none», not an error', () => {
        expect(crateOfAnswer(missing())).toEqual({ state: 'none' })
    })

    it('a hostile album is left out alone: markup in a title, a cover from another server, a link that is not Apple Music\'s', () => {
        const sideA = [
            album(1, { title: '<img src=x onerror=alert(1)>' }), album(2, { art: 'https://evil.example/cover.jpg' }), album(3, { href: 'javascript:alert(1)' }),
            ...side(4, 7)
        ]
        const answer = crateOfAnswer(found(published(sideA)))
        expect(answer.state).toBe('published')
        expect(answer.sides.a.map(a => a.id)).toEqual(['4', '5', '6', '7', '8', '9', '10'])
        expect(answer.rejected).toBe(3)
    })

    it('a crate that falls outside the limits, or that is not a crate, is refused whole: the fixed set stays', () => {
        expect(crateOfAnswer(found(published(side(1, CRATE_LIMITS.a.min - 1))))).toEqual({ state: 'refused', reason: 'side_a_count' })
        expect(crateOfAnswer(found({ rev: 1, sideA: 'x', sideB: [] }))).toEqual({ state: 'refused', reason: 'not_a_crate' })
        // albums stored as anything but lines (a map, a number) are not albums: none is left, so the crate is refused
        expect(crateOfAnswer(found({ rev: 1, sideA: side(1, 6), sideB: [1, 2, 3, 4] }))).toEqual({ state: 'refused', reason: 'side_a_count' })
        expect(crateOfAnswer({ error: { code: 403 } })).toEqual({ state: 'refused', reason: 'bad_answer' })
        expect(crateOfAnswer(null)).toEqual({ state: 'refused', reason: 'bad_answer' })
    })
})

const answering = (body, { ok = true } = {}) => vi.fn(async () => ({ ok, json: async () => body }))
const readerWindow = (fetch) => ({ fetch, AbortController, setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (t) => clearTimeout(t) })

describe('the read', () => {
    it('is one POST of the one document, with no credentials', async () => {
        const fetch = answering(found(published()))
        const result = await readPublishedCrate(readerWindow(fetch))
        expect(result.state).toBe('published')
        expect(fetch).toHaveBeenCalledTimes(1)
        const [url, options] = fetch.mock.calls[0]
        expect(url).toBe(BATCH_GET_URL)
        expect(options.method).toBe('POST')
        expect(JSON.parse(options.body)).toEqual({ documents: [CRATE_DOCUMENT] })
        expect(options.credentials).toBe('omit')
    })

    it('a refusal of the server, a network failure and an answer that is not JSON are «failed»: it never throws', async () => {
        expect(await readPublishedCrate(readerWindow(answering({}, { ok: false })))).toEqual({ state: 'failed' })
        expect(await readPublishedCrate(readerWindow(vi.fn(async () => { throw new TypeError('Failed to fetch') })))).toEqual({ state: 'failed' })
        expect(await readPublishedCrate(readerWindow(vi.fn(async () => ({ ok: true, json: async () => { throw new SyntaxError('x') } }))))).toEqual({ state: 'failed' })
    })

    it('after 3 seconds with no answer it gives up («timeout») and cancels the request', async () => {
        vi.useFakeTimers()
        try {
            expect(READ_TIMEOUT_MS).toBe(3000)
            let signal
            const fetch = vi.fn((url, options) => new Promise((_, reject) => { signal = options.signal; signal.addEventListener('abort', () => reject(new Error('aborted'))) }))
            const pending = readPublishedCrate(readerWindow(fetch))
            await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS)
            expect(await pending).toEqual({ state: 'timeout' })
            expect(signal.aborted).toBe(true)
        } finally { vi.useRealTimers() }
    })
})

describe('what is written on the page', () => {
    it('a sleeve is an image on Apple\'s image server, with the album\'s data as attributes, never markup', () => {
        const img = sleeveOf(document, album(7, { title: 'A "quoted" & odd title' }), 2)
        expect(img.tagName).toBe('IMG')
        expect(img.className).toBe('sl s2')
        expect(img.getAttribute('src')).toBe('https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/7/cover.jpg/360x360bb.webp')
        expect(img.getAttribute('crossorigin')).toBe('anonymous')
        expect(img.dataset.t).toBe('A "quoted" & odd title')
        expect(img.dataset.y).toBe('1990')
        expect(img.dataset.href).toBe('https://music.apple.com/us/album/a/7')
        expect(img.style.getPropertyValue('--p')).toBe('2')
    })

    it('an album of the phone\'s row has the same parts the build writes, its texts as text', () => {
        const li = shelfItemOf(document, album(7), 'pt')
        const built = document.createElement('ol')
        built.innerHTML = fillCopy(shelfHtml('real'), 'pt')
        const shape = (item) => [...item.querySelectorAll('*')].map(el => `${el.tagName}.${el.className}[${el.getAttribute('data-i18n') ?? ''}]`)
        expect(shape(li)).toEqual(shape(built.firstElementChild))
        expect(li.querySelector('b').textContent).toBe('Album 7')
        const link = li.querySelector('a.am')
        expect(link.getAttribute('href')).toBe('https://music.apple.com/us/album/a/7')
        expect(link.target).toBe('_blank')
        expect(link.rel).toBe('noopener')
        expect(link.textContent).toBe(`♫${COPY.pt['c.listen']}: Album 7, Artist 7${COPY.pt['c.newtab']}`)
        expect(shelfItemOf(document, album(7), 'en').querySelector('a.am').textContent).toContain(COPY.en['c.listen'])
    })

    it('only a page of real albums takes a published crate (the fictional set says «fictional» all over the page)', () => {
        const box = document.createElement('div')
        box.innerHTML = coverImagesHtml('real')
        expect(showsRealAlbums([...box.children])).toBe(true)
        box.innerHTML = coverImagesHtml('fictional')
        expect(showsRealAlbums([...box.children])).toBe(false)
        expect(showsRealAlbums([])).toBe(false)
    })
})

describe('the crate with another count on side B', () => {
    it('a crate of 6 and 4 shows six records on side A and the last four on side B, the last in front', () => {
        const a = cssCrateLayout('a1', 10, 4)
        expect(a.map(p => p.visible)).toEqual([true, true, true, true, true, true, false, false, false, false])
        const b = cssCrateLayout('end', 10, 4)
        expect(b.map(p => p.visible)).toEqual([false, false, false, false, false, false, true, true, true, true])
        expect(b[9].transform).toBe('translate3d(0,0%,0px) rotateX(-6deg)')
    })

    it('every record a track pulls or names exists on its side at the smallest crate, and at the largest', () => {
        for (const [a, b] of [[CRATE_LIMITS.a.min, CRATE_LIMITS.b.min], [CRATE_LIMITS.a.max, CRATE_LIMITS.b.max]]) {
            const count = a + b
            for (const track of ['start', 'albums', 'blend']) expect(captionIndex(track, count), `${track} ${count}`).toBeLessThan(a)
            for (const track of ['playlists', 'inventory', 'end']) {
                expect(captionIndex(track, count), `${track} ${count}`).toBeGreaterThanOrEqual(a)
                expect(captionIndex(track, count)).toBeLessThan(count)
            }
            for (const track of ['blend', 'playlists']) expect(cssCrateLayout(track, count, b).filter(p => p.zIndex === '30')).toHaveLength(1)
        }
    })
})

/** The page's body with the real covers, in this jsdom document (as test/splash/splash.test.js does). */
function loadPage() {
    const served = fillEntryPage(PAGE, { set: 'real' })
    document.body.innerHTML = served.slice(served.indexOf('<body>') + 6, served.indexOf('</body>'))
    document.documentElement.className = ''
    document.documentElement.lang = 'pt-BR'
}

function fakeWindow({ fetch, phone = false, store = undefined } = {}) {
    const listeners = {}
    class Observer { observe() {} unobserve() {} disconnect() {} }
    return {
        document, fetch, AbortController,
        location: { search: '?nogl' },
        innerHeight: 0, devicePixelRatio: 1, Event, CustomEvent,
        IntersectionObserver: Observer, ResizeObserver: Observer,
        matchMedia: (q) => ({ matches: q.includes('max-width') && phone, addEventListener() {} }),
        navigator: { languages: ['pt-BR'] },
        localStorage: store,
        getComputedStyle: () => ({ getPropertyValue: () => '0.72' }),
        requestAnimationFrame: () => 1,
        setTimeout: (fn, ms) => setTimeout(fn, ms),
        clearTimeout: (t) => clearTimeout(t),
        addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn) },
        listeners
    }
}

const sleeves = () => [...document.querySelectorAll('#box .sl')]
const shelf = () => [...document.querySelectorAll('#shelf .shelf .al')]
const fixedIds = COVER_SETS.real.map(record => record.k)

describe('the page with a published crate', () => {
    beforeEach(() => { loadPage() })
    afterEach(() => { document.body.innerHTML = '' })

    it('before the read answers, and so at first paint, the page is the fixed set, whole', async () => {
        let answer
        const fetch = vi.fn(() => new Promise(resolve => { answer = resolve }))
        const page = startSplash(fakeWindow({ fetch }))
        expect(sleeves().map(img => img.dataset.k)).toEqual(fixedIds)
        expect(shelf()).toHaveLength(fixedIds.length)
        answer({ ok: true, json: async () => found(published()) })
        expect(await page.published).toBe('swapped')
    })

    it('the published crate takes the place of the fixed set: the sleeves, the caption (album and year) and the phone\'s row', async () => {
        const changes = vi.fn()
        document.addEventListener('cratechange', changes)
        const page = startSplash(fakeWindow({ fetch: answering(found(published())) }))
        expect(await page.published).toBe('swapped')
        document.removeEventListener('cratechange', changes)
        // one row: side A from the front, then side B from the back
        expect(sleeves().map(img => img.dataset.k)).toEqual(['1', '2', '3', '4', '5', '6', '23', '22', '21', '20'])
        expect(sleeves().every(img => img.getAttribute('src').startsWith('https://is1-ssl.mzstatic.com/image/thumb/'))).toBe(true)
        expect(sleeves().filter(img => img.classList.contains('vis')).map(img => img.dataset.k)).toEqual(['1', '2', '3', '4', '5', '6'])
        expect(document.getElementById('who').textContent).toBe('Album 11990')
        expect(document.getElementById('who').querySelector('b').textContent).toBe('Album 1')
        expect(document.getElementById('am').getAttribute('href')).toBe('https://music.apple.com/us/album/a/1')
        expect(shelf().map(li => li.querySelector('b').textContent)).toEqual(['Album 1', 'Album 2', 'Album 3', 'Album 4', 'Album 5', 'Album 6', 'Album 23', 'Album 22', 'Album 21', 'Album 20'])
        expect(page.albums).toHaveLength(10)
        expect(changes).toHaveBeenCalledTimes(1)
        // the caption keeps the room it had, so the page under it does not move
        const caption = document.getElementById('caption')
        expect(caption.classList.contains('held')).toBe(true)
        expect(caption.style.minHeight).toMatch(/px$/)
        expect(caption.style.getPropertyValue('--name-lines')).toBe('1')
    })

    it('on the phone too: the crate and the row carry the published albums', async () => {
        const page = startSplash(fakeWindow({ fetch: answering(found(published())), phone: true }))
        expect(await page.published).toBe('swapped')
        expect(sleeves()).toHaveLength(10)
        expect(shelf()).toHaveLength(10)
        expect(shelf()[0].querySelector('a.am').getAttribute('href')).toBe('https://music.apple.com/us/album/a/1')
    })

    it('the row follows the language chosen after the swap', async () => {
        const page = startSplash(fakeWindow({ fetch: answering(found(published())) }))
        await page.published
        document.querySelector('[data-lang="en"]').click()
        expect(shelf()[0].querySelector('a.am').textContent).toBe(`♫${COPY.en['c.listen']}: Album 1, Artist 1${COPY.en['c.newtab']}`)
    })

    it('nothing published, a read that fails and a crate that does not pass the check all leave the fixed set, untouched', async () => {
        for (const [fetch, state] of [
            [answering(missing()), 'none'], [answering({}, { ok: false }), 'failed'], [vi.fn(async () => { throw new TypeError('offline') }), 'failed'],
            [answering(found(published(side(1, 2)))), 'refused']
        ]) {
            loadPage()
            const before = sleeves()
            const page = startSplash(fakeWindow({ fetch }))
            expect(await page.published).toBe(state)
            expect(sleeves()).toEqual(before) // the very same elements
            expect(sleeves().map(img => img.dataset.k)).toEqual(fixedIds)
            expect(shelf()).toHaveLength(fixedIds.length)
        }
    })

    it('a hostile published value never becomes an element, and a cover from another server never shows', async () => {
        const sideA = [album(1, { title: '<img src=x onerror=alert(1)>' }), album(2, { art: 'https://evil.example/cover.jpg' }), ...side(3, 6)]
        const sideB = [album(20, { artist: '<script>alert(1)</script>' }), ...side(21, 5)]
        const page = startSplash(fakeWindow({ fetch: answering(found(published(sideA, sideB))) }))
        expect(await page.published).toBe('swapped')
        expect(sleeves().map(img => img.dataset.k)).toEqual(['3', '4', '5', '6', '7', '8', '25', '24', '23', '22', '21'])
        expect(document.querySelectorAll('img[src*="evil.example"], main script, img[onerror], img[src="x"]')).toHaveLength(0)
        expect(document.querySelectorAll('script')).toHaveLength(1) // the page's own
        expect(document.body.innerHTML).not.toContain('evil.example')
        expect([...document.images].every(img => /^(https:\/\/is1-ssl\.mzstatic\.com\/|data:|\/)/.test(img.getAttribute('src')))).toBe(true)
    })

    it('a published crate equal to the fixed set changes nothing on the page', async () => {
        const real = COVER_SETS.real.map(r => ({ id: r.k, title: r.t, artist: r.a, year: r.y, art: r.art, href: r.href }))
        const first = sleeves()[0]
        const page = startSplash(fakeWindow({ fetch: answering(found(published(real.slice(0, 8), real.slice(8).reverse()))) }))
        expect(await page.published).toBe('same')
        expect(sleeves()[0]).toBe(first)
    })

    it('the page of fictional albums does not ask the database at all', async () => {
        const served = fillEntryPage(PAGE, { set: 'fictional' })
        document.body.innerHTML = served.slice(served.indexOf('<body>') + 6, served.indexOf('</body>'))
        const fetch = answering(found(published()))
        const page = startSplash(fakeWindow({ fetch }))
        expect(await page.published).toBe('not_real')
        expect(fetch).not.toHaveBeenCalled()
    })
})

describe('the name of the crate on the computer (F95)', () => {
    it('with the real albums the stage carries «Na caixa do The Album Blender», the same name as the phone\'s row, in the two languages', () => {
        const tag = stageTagHtml('real')
        expect(tag).toContain('class="credit-tag crate-tag"')
        expect(tag).toContain('data-i18n="shelf.title"')
        expect(COPY.pt['shelf.title']).toBe('Na caixa do The Album Blender')
        expect(COPY.en['shelf.title']).toBe("In The Album Blender's crate")
        const served = fillEntryPage(PAGE, { set: 'real' })
        expect(served).toMatch(/<span class="credit-tag crate-tag">.*<span data-i18n="shelf\.title">Na caixa do The Album Blender<\/span><\/span>/)
        expect(served).not.toContain('data-i18n="tag.fict"')
    })

    it('with the fictional albums the stage says «fictional» and never the name of the crate: the two are never together', () => {
        expect(stageTagHtml('fictional')).toContain('data-i18n="tag.fict"')
        expect(stageTagHtml('fictional')).not.toContain('crate-tag')
    })

    it('the label sits by the crate on the computer; on the phone the row carries the name, so the label is not shown there', () => {
        const phone = PAGE.slice(PAGE.lastIndexOf('@media (max-width:899px)'))
        expect(PAGE).toMatch(/\.crate-tag\{[^}]*text-transform:uppercase/)
        expect(PAGE).toMatch(/@media \(max-width:899px\)\{[^@]*\.crate-tag\{display:none\}/)
        expect(PAGE).toMatch(/\.caption\.held \.who b\{[^}]*-webkit-line-clamp:var\(--name-lines,3\)/)
        expect(phone.length).toBeGreaterThan(0)
    })
})
