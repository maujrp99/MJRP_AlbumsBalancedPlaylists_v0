/**
 * F55, slice 1 - the local dataset (the cover of an album that came without one) answers only
 * with the album asked for (UAT-184): no "first result" when nothing matches.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../public/js/workers/search.worker.js?worker', () => ({ default: class { postMessage() { } } }))

import { optimizedAlbumLoader } from '../../public/js/services/OptimizedAlbumLoader.js'

const STP = 'Stone Temple Pilots'
const row = (album, year, artist = STP) => ({ artist, album, year, id: `${album}-${year}`, artworkTemplate: `https://img/${album}/{w}x{h}.jpg` })

describe('OptimizedAlbumLoader.findAlbum', () => {
    let search

    beforeEach(() => {
        search = vi.spyOn(optimizedAlbumLoader, 'search')
    })

    it('«Core» asked for and the dataset lists only other albums of the artist: nothing, never the first row', async () => {
        search.mockResolvedValue([row('Shangri-La Dee Da', '2001'), row('Purple', '1994')])

        expect(await optimizedAlbumLoader.findAlbum(STP, 'Core')).toBeNull()
    })

    it('«Core» is not «Core Memories», and not «Core» by another artist', async () => {
        search.mockResolvedValue([row('Core Memories', '2020'), row('Core', '2012', 'Persefone')])

        expect(await optimizedAlbumLoader.findAlbum(STP, 'Core')).toBeNull()
    })

    it('finds the album asked for wherever it is in the rows, whatever the case of the names', async () => {
        search.mockResolvedValue([row('Purple', '1994'), row('CORE', '1992', 'STONE TEMPLE PILOTS')])

        expect(await optimizedAlbumLoader.findAlbum(STP, 'Core')).toMatchObject({ album: 'CORE', year: '1992' })
    })

    it('an edition asked for takes the cover of the album: «Core (Deluxe Edition)» is «Core»', async () => {
        search.mockResolvedValue([row('Core', '1992')])

        expect(await optimizedAlbumLoader.findAlbum(STP, 'Core (Deluxe Edition)')).toMatchObject({ album: 'Core' })
    })

    it('without artist or title there is nothing to look for', async () => {
        expect(await optimizedAlbumLoader.findAlbum('', 'Core')).toBeNull()
        expect(await optimizedAlbumLoader.findAlbum(STP, '')).toBeNull()
        expect(search).not.toHaveBeenCalled()
    })
})
