/**
 * F55, slice 2 - an album accepted by the second tier of the identity rule (the catalog only has
 * the title asked for with a subtitle) says so on its card, in one line; every other album says
 * nothing.
 */
import { describe, it, expect } from 'vitest'
import { AlbumCardRenderer } from '../../../public/js/components/ui/AlbumCardRenderer.js'
import { Album } from '../../../public/js/models/Album.js'
import { identityNotice, Reason } from '../../../public/js/models/askedAlbum.js'
import { SECOND_TIER_RULES } from '../../../shared/albumIdentity.js'

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

    // F68: the second tier is a list of rules, and the line says which one accepted the album
    it('has a true line for EVERY rule of the second tier, each its own', () => {
        const lines = SECOND_TIER_RULES.map(rule => identityNotice(album(rule.reason)))

        lines.forEach((line, i) => expect(line, SECOND_TIER_RULES[i].reason).toMatch(/^Asked for .+\.$/))
        expect(new Set(lines).size).toBe(SECOND_TIER_RULES.length)
        expect(identityNotice(album(Reason.TITLE_WITHOUT_PARENTHESES))).toBe('Asked for by its short title: the catalog only has this one, with more in parentheses.')
        expect(identityNotice(album(Reason.TITLE_IN_PARENTHESES))).toBe('Asked for by the name the catalog writes in parentheses.')
        expect(identityNotice(album(Reason.TITLE_WITH_ARTIST_NAME))).toBe('Asked for by its title: the catalog writes the artist\'s name in front of it.')
        expect(identityNotice(album(Reason.TITLE_WRITTEN_OTHERWISE))).toBe('Asked for in another spelling: the catalog writes the title this way.')
    })

    it('a reason it does not know says nothing', () => {
        expect(identityNotice(album('a-reason-of-tomorrow'))).toBeNull()
        expect(identityNotice(album(Reason.TITLE_MISMATCH))).toBeNull()
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
