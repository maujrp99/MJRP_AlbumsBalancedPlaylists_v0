/**
 * F69 (UAT-206) - the track comparison of an album says where its Spotify popularity is, in one
 * line, and asks for it through whoever mounted it. It never talks to Spotify itself.
 *
 * Taken over from test/components/ranking/TracksRankingComparison.popularity.test.js (F83 wave 6b): the comparison is React now, so the scaffold
 * changes (a piece is drawn into a box of the page, a press goes through `act`), never the assertion.
 */
import { createElement } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { Album } from '../../../public/js/models/Album.js'
import { TracksComparison } from '../../../public/js/ui/tracks/TracksComparison'
import { describePopularity } from '../../../public/js/models/popularityState.js'
import { draw, undraw, press } from '../../support/windowHost'

const makeAlbum = (extra = {}) => new Album({
    id: 'artist_album', title: 'Album', artist: 'Artist',
    tracks: [{ id: 't1', title: 'One', position: 1 }], ...extra
})
const mounted = (props) => draw(createElement(TracksComparison, props))
const noticeOf = (container) => container.querySelector('.popularity-notice')

describe('describePopularity: one line per state', () => {
    it('not connected is a quiet invitation with nothing to press', () => {
        expect(describePopularity('not-connected')).toEqual({ text: 'Connect Spotify to see popularity.', action: null, quiet: true })
    })

    it('failed offers "Try again"; "Spotify has none" may be asked again; asking shows it is on its way', () => {
        expect(describePopularity('failed')).toEqual({ text: 'Spotify did not answer.', action: 'Try again', quiet: false })
        expect(describePopularity('empty')).toEqual({ text: 'Spotify has no popularity for this album.', action: 'Ask again', quiet: true })
        expect(describePopularity('loading')).toEqual({ text: 'Asking Spotify for popularity…', action: null, quiet: true })
        expect(describePopularity('pending')).toEqual(describePopularity('loading'))
    })

    it('done, or a state nobody told, says nothing', () => {
        expect(describePopularity('done')).toBeNull()
        expect(describePopularity(undefined)).toBeNull()
    })
})

describe('TracksComparison and the popularity', () => {
    afterEach(undraw)

    it('not connected: one quiet line, no button, no alarm colour', async () => {
        const notice = noticeOf(await mounted({ album: makeAlbum(), popularity: { status: 'not-connected', onAsk: vi.fn() } }))

        expect(notice.textContent).toBe('Connect Spotify to see popularity.')
        expect(notice.querySelector('button')).toBeNull()
        expect(notice.className).not.toMatch(/red|amber/)
    })

    it('failed: says so and "Try again" asks through the one who mounted it, for this album', async () => {
        const onAsk = vi.fn()
        const notice = noticeOf(await mounted({ album: makeAlbum(), popularity: { status: 'failed', onAsk } }))

        expect(notice.textContent).toContain('Spotify did not answer.')
        const button = notice.querySelector('button')
        expect(button.textContent).toBe('Try again')
        await press(button)

        expect(onAsk).toHaveBeenCalledWith('artist_album')
        expect(button.disabled).toBe(true)
    })

    it('an album with its Spotify data, or mounted with no state (the album window), shows no line', async () => {
        expect(noticeOf(await mounted({ album: makeAlbum({ spotifyId: 'sp1' }), popularity: { status: 'done', onAsk: vi.fn() } }))).toBeNull()
        expect(noticeOf(await mounted({ album: makeAlbum() }))).toBeNull()
    })
})
