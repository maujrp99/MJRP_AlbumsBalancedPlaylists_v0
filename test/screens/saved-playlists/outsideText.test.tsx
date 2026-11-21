/**
 * F59 slice E (UAT-199) and F83 wave 1: text that comes from outside the code is shown as text. Taken over from the saved
 * playlists card test of test/security/outsideTextIsText.test.js: the same data, the same assertions; the card is drawn in React
 * (which writes text as text) and in the window of a playlist (the rows of tracks of the hand-made piece, the window of the app).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { BatchCard } from '../../../public/js/screens/saved-playlists/BatchCard'
import type { Handlers } from '../../../public/js/screens/saved-playlists/types'
import { renderScreen } from '../../support/renderScreen'

/** Text that would run as HTML if written into the page as it is. */
const TEXT = '<img src=x onerror="window.__xss=1">'
/** Text that would leave a quoted attribute value and then run. */
const QUOTED = '"><img src=x onerror="window.__xss=1"> \'x'

const handlers: Handlers = { onNavigate: () => {}, onOpenSeries: () => {}, onDeleteAll: () => {}, onEditBatch: () => {}, onDeleteBatch: () => {}, onOpenPlaylist: () => {}, onRetry: () => {} }
const batch = { name: TEXT, savedAt: '2026-11-19T12:00:00Z', playlists: [{ id: QUOTED, name: TEXT, tracks: [{ title: TEXT, artist: TEXT }] }] }

const Host = () => <BatchCard batch={batch} seriesId={QUOTED} thumbnails={[QUOTED]} handlers={handlers} />

afterEach(() => { document.body.innerHTML = '' })

describe('saved playlists card: batch name and playlist names', () => {
    it('nothing was created from the text, nothing ran, and each text is on screen as it was given', async () => {
        const rendered = await renderScreen(Host, {})
        await rendered.act(() => { rendered.app.querySelector<HTMLElement>('.batch-header')!.click() })
        await rendered.act(() => { rendered.app.querySelector<HTMLElement>('.playlist-row')!.click() })

        // the img of the text itself; a cover drawn by the code (which carries its own fallback) is not one
        expect(rendered.app.querySelectorAll('img[src="x"]').length).toBe(0)
        expect(rendered.app.querySelectorAll('[onerror*="__xss"]').length).toBe(0)
        expect((window as { __xss?: unknown }).__xss).toBeUndefined()
        expect(rendered.app.textContent).toContain(TEXT)
        expect(rendered.app.querySelector('h3')!.textContent).toBe(TEXT)
        expect(rendered.app.querySelector('.track-row')).not.toBeNull() // the track of the playlist was drawn, as text
        await rendered.leave()
    })

    it('an address that came from outside is an attribute value, never markup', async () => {
        const rendered = await renderScreen(Host, {})
        const card = rendered.app.querySelector<HTMLElement>('.batch-group-card')!
        expect(card.dataset.seriesId).toBe(QUOTED)
        expect(card.dataset.batchName).toBe(TEXT)
        await rendered.leave()
    })
})
