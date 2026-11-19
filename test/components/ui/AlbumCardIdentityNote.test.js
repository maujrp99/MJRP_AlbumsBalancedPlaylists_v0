/**
 * F55, slice 2 - an album accepted by the second tier of the identity rule (the catalog only has
 * the title asked for with a subtitle) says so on its card, in one line; every other album says
 * nothing.
 */
import { describe, it, expect } from 'vitest'
import { AlbumCardRenderer } from '../../../public/js/components/ui/AlbumCardRenderer.js'
import { Album } from '../../../public/js/models/Album.js'
import { identityNotice, Reason } from '../../../public/js/models/askedAlbum.js'

const NOTICE = 'Asked for by its short title: the catalog only has this one, with a subtitle.'
const album = (identityReason) => new Album({
    id: 'a1',
    title: 'No Quarter: Jimmy Page & Robert Plant Unledded',
    artist: 'Jimmy Page & Robert Plant',
    year: 1994,
    coverUrl: 'https://cover/600',
    tracks: [{ id: 't1', title: 'Nobody\'s Fault but Mine', rank: 1, duration: 200 }],
    metadata: { source: 'Apple Music', sourceId: 'apple-unledded', ...(identityReason ? { identityReason } : {}) }
})
const drawn = (html) => {
    const host = document.createElement('div')
    host.innerHTML = html
    return host
}

describe('identityNotice', () => {
    it('is one line for an album accepted by the second tier, and nothing for any other', () => {
        expect(identityNotice(album(Reason.TITLE_BEFORE_SUBTITLE))).toBe(NOTICE)
        expect(identityNotice(album(Reason.EXACT_TITLE))).toBeNull()
        expect(identityNotice(album(Reason.EDITION_OF_TITLE))).toBeNull()
        expect(identityNotice(album())).toBeNull()
        expect(identityNotice(null)).toBeNull()
    })
})

describe('the album card', () => {
    it('shows the line in the grid card and in the list card', () => {
        const loose = album(Reason.TITLE_BEFORE_SUBTITLE)

        const compact = drawn(AlbumCardRenderer.renderCompact(loose)).querySelector('[data-identity-note]')
        const expanded = drawn(AlbumCardRenderer.renderExpanded(loose, 0)).querySelector('[data-identity-note]')

        expect(compact.textContent).toBe(NOTICE)
        expect(expanded.textContent).toBe(NOTICE)
    })

    it('shows nothing for an album accepted by its own title', () => {
        const exact = album(Reason.EXACT_TITLE)

        expect(drawn(AlbumCardRenderer.renderCompact(exact)).querySelector('[data-identity-note]')).toBeNull()
        expect(drawn(AlbumCardRenderer.renderExpanded(exact, 0)).querySelector('[data-identity-note]')).toBeNull()
    })
})
