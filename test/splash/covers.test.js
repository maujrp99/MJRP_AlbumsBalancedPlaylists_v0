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
    it('each has 14 records, seven for each side of the crate', () => {
        expect(Object.keys(COVER_SETS).sort()).toEqual(['fictional', 'real'])
        expect(COVER_SETS.real).toHaveLength(14)
        expect(COVER_SETS.fictional).toHaveLength(14)
    })

    it('the real set is the prototype\'s, in its order, each with an Apple Music link', () => {
        const real = albumsOf('real')
        expect(real.map(a => a.k)).toEqual(['crimson', 'harvest', 'dsotm', 'low', 'pcl', 'dummy', 'illmatic',
            'edge', 'homogenic', 'mezzanine', 'aeroplane', 'pitty', 'desire', 'tpab'])
        expect(real[0]).toMatchObject({ t: 'In the Court of the Crimson King', a: 'King Crimson', y: 1969 })
        expect(real[13]).toMatchObject({ t: 'To Pimp a Butterfly', a: 'Kendrick Lamar', y: 2015 })
        real.forEach(a => expect(a.href).toMatch(/^https:\/\/music\.apple\.com\/us\//))
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
        expect(imgs).toHaveLength(14)
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
        expect(real).toContain('<b>In the Court of the Crimson King</b>King Crimson · 1969')
        expect(real).toContain('Artwork from Apple Music')
        expect(real).toContain('href="https://music.apple.com/us/album/in-the-court-of-the-crimson-king-expanded-edition/918534711"')
        expect(real).toContain('Listen on Apple Music')
        const fictional = captionHtml('fictional')
        expect(fictional).toContain('<b>Copper Year</b>North Atlas · fictional album')
        expect(fictional).toContain('Fictional album · original art')
        expect(fictional).not.toContain('Apple Music')
    })

    it('the footer credit says what the covers are, and names Apple only for the real ones', () => {
        expect(creditHtml('real')).toContain('Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries.')
        expect(creditHtml('fictional')).toContain('fictional')
        expect(creditHtml('fictional')).not.toContain('Apple')
    })

    it('the stage says "Fictional albums · original art" only over invented covers', () => {
        expect(stageTagHtml('fictional')).toContain('Fictional albums · original art')
        expect(stageTagHtml('real')).toBe('')
    })
})
