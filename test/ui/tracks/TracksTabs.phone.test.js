/**
 * F76, REQ-06 (audit finding 3): the tracks of the album window on the phone. TracksTabs is drawn
 * only below 768 px (a `md:hidden` box): the three sources are one segmented control with short
 * labels, and a track's title has a line of its own, its references and duration below it.
 *
 * Taken over from test/components/ranking/TracksTabs.phone.test.js (F83 wave 6b): the tabs are React now, so the scaffold changes (a piece is drawn
 * into a box of the page, a press goes through `act`; the names of the orders are dictionary keys now), never the assertion.
 */
import { createElement } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { TracksTabs, TRACK_ORDERS } from '../../../public/js/ui/tracks/TracksTabs'
import { t } from '../../../public/js/i18n/t.js'
import { draw as drawPiece, undraw, press } from '../../support/windowHost'

const tracks = [
    { position: 1, title: 'So Far Away', rank: 4, rating: 87.4, spotifyPopularity: 61, duration: 312 },
    { position: 2, title: 'Money for Nothing', rank: 1, rating: 92, spotifyPopularity: 80, duration: 506, artist: 'Dire Straits feat. Sting' },
    { position: 3, title: 'Walk of Life', rank: 999, spotifyPopularity: -1, duration: 0, artist: 'Dire Straits' }
]

const draw = (props = {}) => drawPiece(createElement(TracksTabs, { tracks, activeTab: 'original', onTabChange: vi.fn(), albumArtist: 'Dire Straits', ...props }))

describe('TracksTabs on the phone (F76)', () => {
    afterEach(undraw)

    it('gives the three sources as one group of three buttons with short labels and whole names', async () => {
        const host = await draw({ activeTab: 'acclaim' })
        const group = host.querySelector('.tracks-tabs__bar')
        expect(group.getAttribute('role')).toBe('group')
        const segments = [...group.querySelectorAll('button.tracks-tabs__segment')]
        expect(segments.map(b => b.textContent)).toEqual(['Track Listing', 'BEA', 'Spotify'])
        expect(segments.map(b => b.getAttribute('aria-label'))).toEqual(TRACK_ORDERS.map(o => t(o.name)))
        expect(segments.map(b => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false'])
        expect(segments.map(b => b.dataset.tab)).toEqual(['original', 'acclaim', 'spotify'])
    })

    it('asks for another order with the id of the segment touched', async () => {
        const onTabChange = vi.fn()
        const host = await draw({ onTabChange })
        await press(host.querySelector('[data-tab="spotify"]'))
        expect(onTabChange).toHaveBeenCalledWith('spotify')
    })

    it('puts the title alone on its line, and the references and the duration below it', async () => {
        const rows = [...(await draw()).querySelectorAll('.tracks-tabs__row')]
        expect(rows).toHaveLength(3)
        const [first, , third] = rows
        expect(first.querySelector('.tracks-tabs__title').textContent).toBe('So Far Away')
        expect(first.querySelector('.tracks-tabs__refs').textContent).toBe('BEA ★ 87Spotify 61%')
        expect(first.querySelector('.tracks-tabs__time').textContent).toBe('5:12')
        expect(first.querySelector('.tracks-tabs__number').textContent).toBe('1')
        // what is not known is said as such, never as a number
        expect(third.querySelector('.tracks-tabs__refs').textContent).toBe('BEA —Spotify —')
        expect(third.querySelector('.tracks-tabs__time').textContent).toBe('--:--')
    })

    it('lights the reference of the order on, and shows a track artist only when it is not the album artist', async () => {
        const host = await draw({ activeTab: 'spotify' })
        const lit = [...host.querySelectorAll('.tracks-tabs__ref.is-on')].map(r => r.textContent)
        expect(lit).toEqual(['Spotify 61%', 'Spotify 80%', 'Spotify —'])
        expect([...host.querySelectorAll('.tracks-tabs__artist')].map(a => a.textContent)).toEqual(['Dire Straits feat. Sting'])
    })

    it('says the BEA rating of the track, not its position, and marks each source with its own colour (UAT-228)', async () => {
        const host = await draw()
        const first = host.querySelector('.tracks-tabs__row')
        const bea = first.querySelector('.tracks-tabs__ref--bea')
        const spotify = first.querySelector('.tracks-tabs__ref--spotify')
        expect(bea.textContent).toBe('BEA ★ 87')
        expect(bea.getAttribute('aria-label')).toBe('BestEverAlbums rating 87')
        expect(spotify.textContent).toBe('Spotify 61%')
        expect(spotify.getAttribute('aria-label')).toBe('Spotify popularity 61%')
        // a track with a BEA position but no rating says it has no rating
        const noRating = await draw({ tracks: [{ position: 1, title: 'X', rank: 3, spotifyPopularity: 10, duration: 60 }] })
        expect(noRating.querySelector('.tracks-tabs__ref--bea').textContent).toBe('BEA —')
    })

    it('writes a title as text, never as HTML', async () => {
        const host = await draw({ tracks: [{ position: 1, title: '<b>Bold</b> & Co', rank: 2, spotifyPopularity: 3, duration: 60 }] })
        expect(host.querySelector('.tracks-tabs__title').textContent).toBe('<b>Bold</b> & Co')
        expect(host.querySelector('b')).toBe(null)
    })
})
