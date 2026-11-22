/**
 * F62 (UAT-200; taken from test/components/playlists/PlaylistsScreen.edit.test.js in F83 wave 2, and from test/components/playlists/RegeneratePanel.recipe.test.js in
 * wave 7a: 6 cases, the same assertions): the panel «Reconfigure your Music Playlist Blend» shows the recipe the playlists were generated with and keeps what the
 * person changed through a redraw. The panel is React now (screens/playlists/RegeneratePanel.tsx on ui/recipe/); what the screen draws around it is in
 * the other tests of this folder. What changes is the scaffold: the panel is drawn into the page, `getConfig()` is what a press of «Regenerate Playlists»
 * hands to the controller, `reset()` is `forgetWhatWasChanged()`, and a «redraw of the screen» is the panel made again: here by a new name of the batch (what
 * the panel is made from).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { RegeneratePanel } from '../../../public/js/screens/playlists/RegeneratePanel'
import { forgetWhatWasChanged } from '../../../public/js/screens/playlists/regenerateMemory'
import { generatedWithOf } from '../../../public/js/screens/playlists/text'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('the «reconfigure» panel shows the recipe the playlists were generated with (UAT-200)', () => {
    const GENERATED = {
        algorithmId: 'top-n-user', rankingId: 'user', trackCount: 5, outputMode: 'multiple',
        groupingStrategy: 'artist_rank', targetDuration: 45 * 60
    }
    let root: Root
    let regenerate: ReturnType<typeof vi.fn>
    let drawn = 0

    /** The panel drawn again from what the screen gives it (any change of what it is made from draws it anew). */
    const redraw = async (generatedWith: object | null) => {
        drawn += 1
        await act(async () => { root.render(<RegeneratePanel seriesId="sA" batchName={`Road trip ${drawn}`} ids={['a', 'b']} count={2} generatedWith={generatedWith} asked={0} onRegenerate={regenerate} />) })
    }
    const click = (selector: string) => act(async () => { document.querySelector<HTMLElement>(selector)!.click() })
    /** What a press of «Regenerate Playlists» hands over. */
    const getConfig = async () => {
        await click('[data-action="regenerate-playlists"]')
        return regenerate.mock.calls.at(-1)![0]
    }

    beforeEach(() => {
        document.body.innerHTML = ''
        root = createRoot(document.body.appendChild(document.createElement('div')))
        regenerate = vi.fn()
        drawn = 0
        forgetWhatWasChanged()
    })

    afterEach(async () => {
        await act(async () => { root.unmount() })
    })

    it('opens on that recipe and its options, not on the default one', async () => {
        await redraw(GENERATED)

        expect(await getConfig()).toEqual({
            algorithmId: 'top-n-user', rankingId: 'balanced', trackCount: 5, outputMode: 'multiple',
            groupingStrategy: 'artist_rank', targetDuration: 45 * 60
        })
        expect(document.querySelector('.blend-track-count-btn[data-count="5"]')!.className).toContain('border-orange-400')
    })

    it('opens the playlists passed through the generation service on the same recipe', async () => {
        await redraw(generatedWithOf([{ name: 'x', tracks: [], _meta: GENERATED } as never]) ?? null)

        expect((await getConfig()).algorithmId).toBe('top-n-user')
        expect((await getConfig()).trackCount).toBe(5)
    })

    it('keeps what the person changed in it through a redraw of the screen', async () => {
        await redraw(GENERATED)
        await click('.blend-track-count-btn[data-count="8"]')
        await click('.blend-output-btn[data-output="single"]')

        await redraw(GENERATED) // any change of the screen (a track removed, an album arriving) draws the panel again

        expect(await getConfig()).toMatchObject({ algorithmId: 'top-n-user', trackCount: 8, outputMode: 'single', groupingStrategy: 'artist_rank' })
    })

    it('keeps the ranking source and the duration chosen for the balanced recipe through a redraw', async () => {
        await redraw({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced', targetDuration: 60 * 60 })
        await click('.blend-ranking-btn[data-ranking="spotify"]')
        const slider = document.querySelector<HTMLInputElement>('#blend-duration-slider')!
        await act(async () => {
            slider.value = '90'
            slider.dispatchEvent(new Event('input'))
        })

        await redraw({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced', targetDuration: 60 * 60 })

        expect(await getConfig()).toMatchObject({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'spotify', targetDuration: 90 * 60 })
    })

    it('follows the playlists again once they were generated again', async () => {
        await redraw(GENERATED)
        await click('.blend-track-count-btn[data-count="8"]')

        forgetWhatWasChanged() // the screen does this after a generation
        await redraw({ ...GENERATED, trackCount: 8, outputMode: 'single' })

        expect(await getConfig()).toMatchObject({ trackCount: 8, outputMode: 'single' })
    })

    it('opens on the recommended recipe when the playlists do not say how they were generated (saved before F62)', async () => {
        await redraw(generatedWithOf([{ name: 'old', tracks: [] } as never]) ?? null)

        expect((await getConfig()).algorithmId).toBe('mjrp-balanced-cascade')
    })
})
