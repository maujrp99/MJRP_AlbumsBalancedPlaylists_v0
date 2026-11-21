/**
 * F59 slice E (UAT-199) and F83 wave 2: text that comes from outside the code is shown as text. Taken over from the track row and playlist
 * card tests of test/security/outsideTextIsText.test.js: the same data, the same assertions; the row and the card are drawn in React
 * (which writes text as text), and so are the chips and the sheet of the phone.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { PlaylistCards } from '../../../public/js/screens/playlists/PlaylistCards'
import { PhonePlaylists } from '../../../public/js/screens/playlists/PhoneParts'
import { TrackRow } from '../../../public/js/ui/TrackRow'
import { renderScreen } from '../../support/renderScreen'

/** Text that would run as HTML if written into the page as it is. */
const TEXT = '<img src=x onerror="window.__xss=1">'
const QUOTED = '"><img src=x onerror="window.__xss=1"> \'x'
const AMPERSAND = 'Fire & Ice'

const none = () => {}
const actions = { removeTrack: none, deletePlaylist: none, renamePlaylist: none }
const track = { id: QUOTED, title: TEXT, artist: TEXT, album: TEXT, duration: 185, rank: 2, spotifyRank: 3 }

const nothingRan = (app: HTMLElement) => {
    expect(app.querySelectorAll('img[src="x"]')).toHaveLength(0)
    expect(app.querySelectorAll('[onerror*="__xss"]')).toHaveLength(0)
    expect((window as { __xss?: unknown }).__xss).toBeUndefined()
}

afterEach(() => { document.body.innerHTML = '' })

describe('the track row', () => {
    it('writes the title, the id and the places as text and as attribute values, never as markup', async () => {
        const screen = await renderScreen(() => <TrackRow track={track} index={1} playlistIndex={0} trackIndex={0} draggable />, {})
        nothingRan(screen.app)
        expect(screen.app.textContent).toContain(TEXT)
        expect(screen.app.querySelector<HTMLElement>('.track-row')!.dataset.id).toBe(QUOTED)
        await screen.leave()
    })

    it('keeps a title with & as it is', async () => {
        const screen = await renderScreen(() => <TrackRow track={{ ...track, title: AMPERSAND }} index={1} />, {})
        expect(screen.app.textContent).toContain(AMPERSAND)
        expect(screen.app.textContent).not.toContain('&amp;')
        await screen.leave()
    })
})

describe('the card of a playlist', () => {
    it('shows the playlist name as text, in the field to type over too, and in the label that names the delete button', async () => {
        const screen = await renderScreen(() => <PlaylistCards playlists={[{ name: TEXT, tracks: [{ title: TEXT, artist: TEXT, duration: 60 }] }]} batchName={TEXT} actions={actions} />, {})
        nothingRan(screen.app)
        expect(screen.app.querySelector('.playlist-name')!.textContent).toBe(TEXT)
        expect(screen.app.querySelector('.playlist-title-prefix')!.textContent).toBe(`1. ${TEXT} - `)
        expect(screen.app.querySelector('[data-action="delete-playlist"]')!.getAttribute('aria-label')).toBe(`Delete playlist ${TEXT}`)
        await screen.leave()
    })
})

describe('the phone', () => {
    it('writes the chips, the title, the rows and their buttons as text', async () => {
        const phone = { active: 0, lit: null, actions, onShow: none, onTrackOptions: none, onPlaylistOptions: none }
        const screen = await renderScreen(() => <PhonePlaylists playlists={[{ name: TEXT, tracks: [{ title: TEXT, artist: TEXT, album: TEXT, duration: 60 }] }]} {...phone} />, {})
        nothingRan(screen.app)
        expect(screen.app.querySelector('.phone-pl-chip__name')!.textContent).toBe(`1 · ${TEXT}`)
        expect(screen.app.querySelector('.phone-track__title')!.textContent).toBe(TEXT)
        expect(screen.app.querySelector('.phone-track .phone-more')!.getAttribute('aria-label')).toBe(`Actions for ${TEXT}`)
        await screen.leave()
    })
})
