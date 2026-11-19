/**
 * F59 slice E (UAT-199): an address that comes from a provider becomes a link only when it is a
 * web address. An address such as `javascript:...` never reaches href.
 */
import { describe, it, expect, vi } from 'vitest'

import { Card } from '../../public/js/components/ui/Card.js'
import { ConsolidatedRankingView } from '../../public/js/views/ConsolidatedRankingView.js'

vi.mock('../../public/js/stores/albums.js', () => ({
    albumsStore: { getAlbums: vi.fn(() => []), subscribe: vi.fn(() => vi.fn()) }
}))
vi.mock('../../public/js/stores/albumSeries.js', () => ({
    albumSeriesStore: { getById: vi.fn(), subscribe: vi.fn(() => vi.fn()) }
}))

const CODE = 'javascript:window.__xss=1'

const linksOf = (node) => {
    const host = document.createElement('div')
    host.appendChild(node)
    return [...host.querySelectorAll('a')]
}

describe('the Spotify badge of a card (Card.renderRankingBadge)', () => {
    const spotifyLink = (entity) => linksOf(Card.renderRankingBadge(entity)).find(link => link.title === 'Spotify')

    it('links to the stored address when it is a web address', () => {
        const link = spotifyLink({ spotifyId: 'abc123', spotifyUrl: 'https://open.spotify.com/album/stored' })
        expect(link.getAttribute('href')).toBe('https://open.spotify.com/album/stored')
    })

    it('falls back to the address made from the Spotify id when the stored one is not a web address', () => {
        const link = spotifyLink({ spotifyId: 'abc123', spotifyUrl: CODE })
        expect(link.getAttribute('href')).toBe('https://open.spotify.com/album/abc123')
    })

    it('keeps an id from leaving the path of the Spotify address', () => {
        const link = spotifyLink({ spotifyId: '../x?y=1#z' })
        expect(link.getAttribute('href')).toBe('https://open.spotify.com/album/..%2Fx%3Fy%3D1%23z')
    })
})

describe('the source link of a ranked track (ConsolidatedRankingView.renderTrackRow)', () => {
    const track = (url) => ({ rank: 1, title: 'Black Dog', albumTitle: 'IV', rating: 90, score: 1, duration: 296, url })
    const sourceCell = (url) => new ConsolidatedRankingView().renderTrackRow(track(url)).querySelector('.source-cell')

    it('is a link, opened apart from the app, when the address is a web address', () => {
        const link = sourceCell('https://www.besteveralbums.com/thechart.php?a=13').querySelector('a')
        expect(link.getAttribute('href')).toBe('https://www.besteveralbums.com/thechart.php?a=13')
        expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    })

    it('is a dash, with no link, when the address is not a web address', () => {
        const cell = sourceCell(CODE)
        expect(cell.querySelector('a')).toBeNull()
        expect(cell.textContent).toBe('-')
    })
})
