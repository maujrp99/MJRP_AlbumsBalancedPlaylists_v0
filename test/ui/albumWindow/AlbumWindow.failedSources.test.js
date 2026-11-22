/**
 * UAT-244 (F52) and UAT-245 (F69): the album window says when the ratings or the Spotify
 * popularity of the album failed, and asks again through the album load when the person presses
 * «Try again». The window talks to the load only through `sources` (read, ask, watch).
 *
 * Taken over from test/components/ViewAlbumModal.failedSources.test.js (F83 wave 6b): the window is React now, so the scaffold changes (every
 * change goes through `act`), never the assertion.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { show, press, run, closeWindows } from '../../support/windowHost'
import { describeRatings } from '../../../public/js/models/ratingsState.js'

const album = {
    id: 'dire-straits_brothers-in-arms', title: 'Brothers In Arms', artist: 'Dire Straits', year: 1985,
    tracks: [{ title: 'So Far Away', position: 1 }, { title: 'Money for Nothing', position: 2 }]
}

/** A stand-in for the album load, as the series screen gives it to the window. */
const loadWith = (first) => {
    const listeners = new Set()
    let now = first
    return {
        read: vi.fn(() => now),
        ask: vi.fn(),
        watch: vi.fn((listener) => { listeners.add(listener); return () => listeners.delete(listener) }),
        listeners,
        change(next) { now = next; listeners.forEach(listener => listener()) }
    }
}

const open = async (status) => {
    const sources = loadWith(status)
    const { overlay } = await show(album, { sources })
    return { overlay, sources }
}

describe('describeRatings: one line per state of the ratings of an album', () => {
    it('failed says so and offers «Try again»; done and unknown say nothing', () => {
        expect(describeRatings('failed')).toEqual({ text: 'BestEverAlbums did not answer.', action: 'Try again', quiet: false })
        expect(describeRatings('loading')).toEqual({ text: 'Asking BestEverAlbums for ratings…', action: null, quiet: true })
        expect(describeRatings('pending')).toEqual(describeRatings('loading'))
        expect(describeRatings('done')).toBeNull()
        expect(describeRatings(undefined)).toBeNull()
    })
})

describe('the album window and the sources that failed', () => {
    afterEach(closeWindows)

    it('UAT-244: the ratings that failed show «did not answer» and «Try again» asks for the acclaim again', async () => {
        const { overlay, sources } = await open({ ratings: 'failed', popularity: 'done' })
        const notice = overlay.querySelector('.ratings-notice')

        expect(notice.textContent).toContain('BestEverAlbums did not answer.')
        const button = notice.querySelector('button')
        expect(button.textContent).toBe('Try again')
        await press(button)
        expect(sources.ask).toHaveBeenCalledWith(album.id, 'acclaim')
        expect(overlay.querySelector('.popularity-notice')).toBeNull()
    })

    it('UAT-245: the Spotify popularity that failed shows «did not answer» and «Try again» asks for it again', async () => {
        const { overlay, sources } = await open({ ratings: 'done', popularity: 'failed' })
        const notice = overlay.querySelector('.popularity-notice')

        expect(notice.textContent).toContain('Spotify did not answer.')
        await press(notice.querySelector('button'))
        expect(sources.ask).toHaveBeenCalledWith(album.id, 'popularity')
        expect(overlay.querySelector('.ratings-notice')).toBeNull()
    })

    it('«Try again» is a 44 px touch target on the phone, and keeps the size of today on the computer', async () => {
        const { overlay } = await open({ ratings: 'failed', popularity: 'failed' })
        const buttons = [...overlay.querySelectorAll('.ratings-notice button, .popularity-notice button')]

        expect(buttons).toHaveLength(2)
        buttons.forEach(button => {
            expect(button.className).toContain('min-h-[44px]')
            expect(button.className).toContain('md:min-h-0')
        })
    })

    it('while the ratings are asked again the window says so, instead of dropping the line', async () => {
        const { overlay, sources } = await open({ ratings: 'failed', popularity: 'done' })
        await run(() => sources.change({ ratings: 'loading', popularity: 'done' }))
        const notice = overlay.querySelector('.ratings-notice')

        expect(notice.textContent).toContain('Asking BestEverAlbums for ratings…')
        expect(notice.querySelector('button')).toBeNull()
    })

    it('when the load changes the state the window draws it again, and stops watching when it closes', async () => {
        const { overlay, sources } = await open({ ratings: 'failed', popularity: 'done' })
        await run(() => sources.change({ ratings: 'done', popularity: 'done' }))
        expect(overlay.querySelector('.ratings-notice')).toBeNull()

        await run(() => sources.change({ ratings: 'done', popularity: 'failed' }))
        expect(overlay.querySelector('.popularity-notice')).not.toBeNull()

        await press(overlay.querySelector('.modal-footer button'))
        expect(sources.listeners.size).toBe(0)
    })

    it('a window with no load behind it (no sources) shows no line', async () => {
        const { overlay } = await show(album)
        expect(overlay.querySelector('.ratings-notice, .popularity-notice')).toBeNull()
    })
})
