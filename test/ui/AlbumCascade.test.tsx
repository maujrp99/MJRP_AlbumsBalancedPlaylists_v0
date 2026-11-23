/**
 * F83 wave 1 (REQ-05), kept by wave 7b: the cascade of covers and the cover image of ui/ draw what the hand-made pieces drew (components/common/AlbumCascade.js,
 * components/ui/coverImage.js, which left in wave 8b). The hand-made cascade left with the Blend screen (wave 7b); the picture it drew for none, one, two, three and four covers,
 * with and without an address, was kept in test/fixtures/albumCascadeBeforeF83.json (reports/evidence/F83/wave-7b/capture-cascade-before.test.tsx) and the
 * React one draws the same elements, classes, attributes and styles.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { act, type ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { AlbumCascade } from '../../public/js/ui/AlbumCascade'
import { CoverImage } from '../../public/js/ui/CoverImage'
import before from '../fixtures/albumCascadeBeforeF83.json'
import { COVER_STAND_IN } from '../../public/js/ui/coverStandIn'
import { normalize } from '../support/savedPlaylistsScenarios.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function draw(element: ReactElement): Promise<HTMLElement> {
    const host = document.createElement('div')
    document.body.appendChild(host)
    await act(async () => { createRoot(host).render(element) })
    return host
}

const SETS: (string | null)[][] = [[], ['https://c/a.jpg'], ['https://c/a.jpg', null], ['https://c/a.jpg', '', 'https://c/c.jpg'], ['a', 'b', 'c', 'd']]

describe('AlbumCascade', () => {
    afterEach(() => { document.body.innerHTML = '' })

    for (const thumbnails of SETS) {
        it(`${thumbnails.length} cover(s): the same as the hand-made cascade was`, async () => {
            const host = await draw(<AlbumCascade thumbnails={thumbnails} />)
            expect(normalize(host)).toBe((before as Record<string, string>)[JSON.stringify(thumbnails)])
        })
    }

    it('a cover with no address shows the stand-in, and one that fails to load is given it, once', async () => {
        const host = await draw(<CoverImage src={null} alt="x" />)
        const img = host.querySelector('img')!
        expect(img.getAttribute('src')).toBe(COVER_STAND_IN)
        expect(img.dataset.coverStandIn).toBe('true')

        const loaded = await draw(<CoverImage src="https://c/broken.jpg" alt="x" />)
        const broken = loaded.querySelector('img')!
        broken.dispatchEvent(new Event('error')) // an error does not bubble; the old module hears it on the way down
        expect(broken.getAttribute('src')).toBe(COVER_STAND_IN)
        expect(broken.dataset.coverStandIn).toBe('true')
    })

    it('a cover whose address changes is a new image, not one that already shows the stand-in', async () => {
        const host = document.createElement('div')
        document.body.appendChild(host)
        const root = createRoot(host)
        await act(async () => { root.render(<CoverImage src="https://c/one.jpg" alt="x" />) })
        host.querySelector('img')!.dispatchEvent(new Event('error'))
        expect(host.querySelector('img')!.dataset.coverStandIn).toBe('true')

        await act(async () => { root.render(<CoverImage src="https://c/two.jpg" alt="x" />) })
        expect(host.querySelector('img')!.getAttribute('src')).toBe('https://c/two.jpg')
        expect(host.querySelector('img')!.dataset.coverStandIn).toBeUndefined()
    })
})
