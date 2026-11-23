/**
 * F80 (REQ-06) - the covers of the entry page live in ONE data file, with two sets: the real ones
 * of the approved prototype (Apple Music artwork, credited and linked) and the fictional ones of
 * the v1 (original art). One build-time switch chooses; anything but "real" is fictional.
 */
import { describe, it, expect } from 'vitest'
import {
    COVER_SETS, COVER_SWITCH, chooseCoverSet, albumsOf, coverSrc, fictionalCoverSvg,
    coverImagesHtml, captionHtml, creditHtml, stageTagHtml
} from '../../public/splash/covers.js'

describe('the switch', () => {
    it('is read from VITE_SPLASH_COVERS', () => {
        expect(COVER_SWITCH).toBe('VITE_SPLASH_COVERS')
    })

    it('is fictional unless the build says real', () => {
        expect(chooseCoverSet(undefined)).toBe('fictional')
        expect(chooseCoverSet('')).toBe('fictional')
        expect(chooseCoverSet('fictional')).toBe('fictional')
        expect(chooseCoverSet('yes')).toBe('fictional')
        expect(chooseCoverSet('real')).toBe('real')
        expect(chooseCoverSet(' REAL ')).toBe('real')
    })
})

describe('the two sets', () => {
    it('the real set has 15 records (eight on side A, seven on side B), the fictional 14', () => {
        expect(Object.keys(COVER_SETS).sort()).toEqual(['fictional', 'real'])
        expect(COVER_SETS.real).toHaveLength(15)
        expect(COVER_SETS.fictional).toHaveLength(14)
    })

    it('the real set opens with the banana cover, then King Crimson (the owner, 2026-11-21), each with an Apple Music link', () => {
        const real = albumsOf('real')
        expect(real.map(a => a.k)).toEqual(['vu-nico', 'crimson', 'dsotm', 'low', 'pcl', 'dummy', 'illmatic', 'harvest',
            'edge', 'homogenic', 'mezzanine', 'aeroplane', 'pitty', 'desire', 'tpab'])
        expect(real[0]).toMatchObject({ t: 'The Velvet Underground & Nico', a: 'The Velvet Underground & Nico', y: 1967 })
        expect(real[0].href).toBe('https://music.apple.com/us/album/the-velvet-underground-nico-45th-anniversary-edition/1440851613')
        expect(real[1]).toMatchObject({ t: 'In the Court of the Crimson King', a: 'King Crimson', y: 1969 })
        expect(real[14]).toMatchObject({ t: 'To Pimp a Butterfly', a: 'Kendrick Lamar', y: 2015 })
        real.forEach(a => expect(a.href).toMatch(/^https:\/\/music\.apple\.com\/us\//))
    })

    it('every real record points to the album itself, never to a search: music.apple.com/us/album/<name>/<id>', () => {
        const real = albumsOf('real')
        real.forEach(a => expect(a.href, a.t).toMatch(/^https:\/\/music\.apple\.com\/us\/album\/[A-Za-z0-9%-]+\/\d+$/))
        expect(new Set(real.map(a => a.href)).size).toBe(real.length)
        const byKey = Object.fromEntries(real.map(a => [a.k, a.href]))
        expect(byKey.dsotm).toBe('https://music.apple.com/us/album/the-dark-side-of-the-moon/1065973699')
        expect(byKey.homogenic).toBe('https://music.apple.com/us/album/homogenic/20833577')
    })

    it('a real cover comes from Apple\'s image CDN at 360 px, never from the repository', () => {
        const src = coverSrc(COVER_SETS.real[0])
        expect(src).toMatch(/^https:\/\/is1-ssl\.mzstatic\.com\/image\/thumb\/.+\/360x360bb\.webp$/)
    })

    it('the fictional set is made of invented albums, with no link out', () => {
        const fictional = albumsOf('fictional')
        expect(fictional[0]).toMatchObject({ t: 'Copper Year', a: 'North Atlas' })
        expect(new Set(fictional.map(a => a.t)).size).toBe(14)
        fictional.forEach(a => expect(a.href).toBe(''))
        const realTitles = new Set(albumsOf('real').map(a => a.t))
        fictional.forEach(a => expect(realTitles.has(a.t)).toBe(false))
    })

    it('a fictional cover is drawn as an SVG of 360 px, with its title, its artist and the fictional tag', () => {
        const svg = fictionalCoverSvg(COVER_SETS.fictional[1])
        expect(svg).toMatch(/^<svg [^>]*width="360" height="360"/)
        expect(svg).toContain('Night Ferry')
        expect(svg).toContain('ILSE &amp; THE HARBOUR')
        expect(svg).toContain('FICTIONAL')
        expect(coverSrc(COVER_SETS.fictional[1])).toMatch(/^data:image\/svg\+xml,/)
        expect(coverSrc(COVER_SETS.fictional[1])).not.toMatch(/[&"<>#]/)
    })

    it('every fictional cover, as the page receives it, is a well-formed SVG (a broken one shows as alt text)', () => {
        COVER_SETS.fictional.forEach((album) => {
            const svg = decodeURIComponent(coverSrc(album).replace('data:image/svg+xml,', ''))
            const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
            expect(doc.getElementsByTagName('parsererror'), album.t).toHaveLength(0)
            expect(doc.documentElement.getAttribute('width')).toBe('360')
        })
    })
})

describe('what the page receives', () => {
    it('one <img> per record, with the data the page reads and the alt text', () => {
        const html = coverImagesHtml('real')
        const imgs = html.match(/<img [^>]+>/g)
        expect(imgs).toHaveLength(15)
        expect(imgs[4]).toContain('class="sl s4"')
        expect(imgs[4]).toContain('style="--p:4"')
        expect(imgs[4]).toContain('data-t="Power, Corruption &amp; Lies"')
        expect(imgs[4]).toContain('alt="Power, Corruption &amp; Lies by New Order (1983), album cover"')
        expect(imgs[4]).toContain('crossorigin="anonymous"')
        expect(imgs[4]).toContain('width="360" height="360"')
        expect(coverImagesHtml('fictional')).toContain('alt="Copper Year by North Atlas, a fictional album with original artwork"')
    })

    it('the caption names the front record: real with the credit and the link, fictional with the tag', () => {
        const real = captionHtml('real')
        expect(real).toContain('<b>The Velvet Underground &amp; Nico</b>The Velvet Underground &amp; Nico · 1967')
        expect(real).toContain('data-i18n="c.src"')
        expect(real).toContain('href="https://music.apple.com/us/album/the-velvet-underground-nico-45th-anniversary-edition/1440851613"')
        expect(real).toContain('data-i18n="c.listen"')
        const fictional = captionHtml('fictional')
        expect(fictional).toContain('<b>Copper Year</b>North Atlas · álbum fictício')
        expect(fictional).toContain('data-i18n="c.src.fict"')
        expect(fictional).not.toContain('Apple Music')
    })

    it('the footer credit says what the covers are, and names Apple only for the real ones', () => {
        expect(creditHtml('real')).toBe('<p data-i18n="credit.real"></p>')
        expect(creditHtml('fictional')).toBe('<p data-i18n="credit.fict"></p>')
    })

    it('the stage says "Fictional albums · original art" only over invented covers', () => {
        expect(stageTagHtml('fictional')).toContain('data-i18n="tag.fict"')
        expect(stageTagHtml('real')).toBe('')
    })
})
