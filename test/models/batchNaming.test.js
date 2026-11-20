/**
 * UAT-229 - the default name of a new batch says what it is: the series, then the playlist (when
 * the set is one playlist) or the recipe (when it is several), with the codes of the titles spelt
 * out. With no series to name it, the old stamped name stays.
 */
import { describe, it, expect } from 'vitest'
import { defaultBatchName, spellOutCodes } from '../../public/js/models/batchNaming.js'

const at = new Date(2026, 10, 19, 23, 21)

describe('the default batch name (UAT-229)', () => {
    it('one playlist: the series and the playlist, codes spelt out', () => {
        expect(defaultBatchName({ seriesName: 'Trip Hop Vol.1', playlists: [{ name: 'SPFY Top 3 Bal.Intv.' }], recipeName: 'Top Tracks by Spotify Popularity', now: at }))
            .toBe('Trip Hop Vol.1 · Spotify Top 3 balanced')
    })

    it('several playlists: the series and the recipe, without its bracket tag', () => {
        expect(defaultBatchName({ seriesName: 'Trip Hop Vol.1', playlists: [{ name: 'Greatest Hits' }, { name: 'Deep Cuts Vol. 1' }], recipeName: "[MJRP] Zé's Balanced Playlists", now: at }))
            .toBe("Trip Hop Vol.1 · Zé's Balanced Playlists")
    })

    it('reads a series name kept with HTML entities as text', () => {
        expect(defaultBatchName({ seriesName: 'Gilmour &amp; Plant', playlists: [{ name: 'BEA Top 5' }], now: at }))
            .toBe('Gilmour & Plant · BestEverAlbums Top 5')
    })

    it('with nothing to say after the series, the series alone', () => {
        expect(defaultBatchName({ seriesName: 'Rush', playlists: [], now: at })).toBe('Rush')
    })

    it('with no series, the stamped name of the local clock', () => {
        expect(defaultBatchName({ seriesName: '', playlists: [{ name: 'Top 3' }], now: at })).toBe('TheAlbumBlender Playlist 2026-11-19 23:21')
    })

    it('spells out the codes the recipes write in their titles', () => {
        expect(spellOutCodes('SPFY Top 5 Intv.')).toBe('Spotify Top 5 interleaved')
    })
})
