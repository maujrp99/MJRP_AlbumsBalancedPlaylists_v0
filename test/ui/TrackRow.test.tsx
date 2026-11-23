/**
 * The row of a track, ported once to ui/ in F83 wave 2 (it was components/ui/TrackRow.js). The first four are the tests of F63 (UAT-13) taken
 * over as they were (the scaffold changes, never the assertion): the actions of a track are reachable without a mouse. The rest
 * is what the old row did and no test said: the order and the content of the badges, the medals, the length.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { TrackRow, formatTrackDuration, type TrackRowProps } from '../../public/js/ui/TrackRow'
import { PlaylistCards } from '../../public/js/screens/playlists/PlaylistCards'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const track = { id: 't1', title: 'Dogs', artist: 'Pink Floyd', duration: 1024 }
const classesOf = (element: Element) => element.className.split(/\s+/)
const host = document.createElement('div')
const root = createRoot(host)

async function draw(props: TrackRowProps): Promise<HTMLElement> {
    await act(async () => { root.render(<TrackRow {...props} />) })
    return host.firstElementChild as HTMLElement
}

afterEach(async () => { await act(async () => { root.render(null) }) })

describe('TrackRow actions on touch (F63, UAT-13)', () => {
    const row = () => draw({ track, index: 1, playlistIndex: 0, trackIndex: 0, actions: [{ icon: 'X', label: 'Remove Track', action: 'remove-track' }] })
    const actions = (element: Element) => (element.querySelector('[data-action="remove-track"]') as HTMLElement).parentElement as HTMLElement

    it('the actions are not hidden for everybody: only where there is a mouse to hover with', async () => {
        const classes = classesOf(actions(await row()))
        expect(classes).not.toContain('opacity-0')
        expect(classes).not.toContain('group-hover:opacity-100')
        expect(classes).toContain('[@media(hover:hover)]:opacity-0')
        expect(classes).toContain('[@media(hover:hover)]:group-hover:opacity-100')
    })

    it('they show when the keyboard focus is on one of them', async () => {
        expect(classesOf(actions(await row()))).toContain('focus-within:opacity-100')
    })

    it('the button has a name for who does not see the icon', async () => {
        const button = (await row()).querySelector('[data-action="remove-track"]') as HTMLElement
        expect(button.getAttribute('aria-label')).toBe('Remove Track')
        expect(button.getAttribute('type')).toBe('button')
    })

    it('the X of a generated playlist is not hidden a second time by its own classes', async () => {
        const none = () => {}
        await act(async () => { root.render(<PlaylistCards playlists={[{ title: 'P1', tracks: [track] }]} batchName="" actions={{ removeTrack: none, deletePlaylist: none, renamePlaylist: none }} />) })
        const button = host.querySelector('[data-action="remove-track"]') as HTMLElement
        expect(button).not.toBeNull()
        expect(classesOf(button)).not.toContain('opacity-0')
    })

    it('a press on the action tells the caller, and only that action', async () => {
        let removed = 0
        const element = await draw({ track, index: 1, actions: [{ icon: 'X', label: 'Remove Track', action: 'remove-track', onSelect: () => { removed += 1 } }] })
        await act(async () => { (element.querySelector('[data-action="remove-track"]') as HTMLElement).click() })
        expect(removed).toBe(1)
    })
})

describe('the badges of a row', () => {
    const badges = async (props: Partial<TrackRowProps> & { track: TrackRowProps['track'] }) => [...(await draw({ index: 2, ...props })).querySelectorAll('[title]')].map(el => `${el.getAttribute('title')}:${el.textContent}`).slice(1)

    it('are yours first, then the ranking the playlist is read by, then the other', async () => {
        const full = { title: 'T', userRank: 1, rank: 4, rating: 90, spotifyRank: 2 }
        expect(await badges({ track: full, primaryRanking: 'acclaim' })).toEqual(['Your Rank:#1', 'BestEverAlbums Rank:#4', 'BestEverAlbums Rating:★90', 'Spotify Rank:#2'])
        expect(await badges({ track: full, primaryRanking: 'spotify' })).toEqual(['Your Rank:#1', 'Spotify Rank:#2', 'BestEverAlbums Rank:#4', 'BestEverAlbums Rating:★90'])
    })

    it('say the popularity of Spotify when there is no rank, and leave out what is not known or is 999', async () => {
        expect(await badges({ track: { title: 'T', spotifyPopularity: 71 } })).toEqual(['Spotify Popularity:71%'])
        expect(await badges({ track: { title: 'T', rank: 999, userRank: 999, spotifyPopularity: -1 } })).toEqual([])
    })

    it('a ranked list gives the medals to the first three and numbers to the rest', async () => {
        expect((await draw({ track, index: 1, variant: 'ranking' })).textContent).toContain('🥇')
        expect((await draw({ track, index: 4, variant: 'ranking' })).textContent).toContain('4')
    })
})

describe('the length of a track', () => {
    it('is minutes and padded seconds; a track with no length is 0:00', () => {
        expect(formatTrackDuration(190)).toBe('3:10')
        expect(formatTrackDuration(61)).toBe('1:01')
        expect(formatTrackDuration(0)).toBe('0:00')
        expect(formatTrackDuration(undefined)).toBe('0:00')
    })
})
