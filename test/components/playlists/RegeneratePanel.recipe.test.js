/**
 * F62 (UAT-200; taken from test/components/playlists/PlaylistsScreen.edit.test.js in F83 wave 2): the panel «Reconfigure your Music Playlist
 * Blend» shows the recipe the playlists were generated with and keeps what the person changed through a redraw. The panel is still the
 * hand-made one (the Blend controller uses it, wave 7); what the screen draws around it is in test/screens/playlists.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { RegeneratePanel } from '../../../public/js/components/playlists/RegeneratePanel.js'
import { generatedWithOf } from '../../../public/js/screens/playlists/text'

describe('the «reconfigure» panel shows the recipe the playlists were generated with (UAT-200)', () => {
    const GENERATED = {
        algorithmId: 'top-n-user', rankingId: 'user', trackCount: 5, outputMode: 'multiple',
        groupingStrategy: 'artist_rank', targetDuration: 45 * 60
    }
    const redraw = (generatedWith) => {
        document.body.innerHTML = RegeneratePanel.render({ seriesId: 'sA', batchName: 'Road trip', count: 2, generatedWith, expanded: true })
        RegeneratePanel.mount()
    }

    beforeEach(() => RegeneratePanel.reset())

    it('opens on that recipe and its options, not on the default one', () => {
        redraw(GENERATED)

        expect(RegeneratePanel.getConfig()).toEqual({
            algorithmId: 'top-n-user', rankingId: 'balanced', trackCount: 5, outputMode: 'multiple',
            groupingStrategy: 'artist_rank', targetDuration: 45 * 60
        })
        expect(document.querySelector('.blend-track-count-btn[data-count="5"]').className).toContain('border-orange-400')
    })

    it('opens the playlists passed through the generation service on the same recipe', () => {
        redraw(generatedWithOf([{ name: 'x', tracks: [], _meta: GENERATED }]))

        expect(RegeneratePanel.getConfig().algorithmId).toBe('top-n-user')
        expect(RegeneratePanel.getConfig().trackCount).toBe(5)
    })

    it('keeps what the person changed in it through a redraw of the screen', () => {
        redraw(GENERATED)
        document.querySelector('.blend-track-count-btn[data-count="8"]').click()
        document.querySelector('.blend-output-btn[data-output="single"]').click()

        redraw(GENERATED) // any change of the screen (a track removed, an album arriving) draws the panel again

        expect(RegeneratePanel.getConfig()).toMatchObject({ algorithmId: 'top-n-user', trackCount: 8, outputMode: 'single', groupingStrategy: 'artist_rank' })
    })

    it('keeps the ranking source and the duration chosen for the balanced recipe through a redraw', () => {
        redraw({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced', targetDuration: 60 * 60 })
        document.querySelector('.blend-ranking-btn[data-ranking="spotify"]').click()
        const slider = document.querySelector('#blend-duration-slider')
        slider.value = '90'
        slider.dispatchEvent(new Event('input'))

        redraw({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced', targetDuration: 60 * 60 })

        expect(RegeneratePanel.getConfig()).toMatchObject({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'spotify', targetDuration: 90 * 60 })
    })

    it('follows the playlists again once they were generated again', () => {
        redraw(GENERATED)
        document.querySelector('.blend-track-count-btn[data-count="8"]').click()

        RegeneratePanel.reset() // the screen does this after a generation
        redraw({ ...GENERATED, trackCount: 8, outputMode: 'single' })

        expect(RegeneratePanel.getConfig()).toMatchObject({ trackCount: 8, outputMode: 'single' })
    })

    it('opens on the recommended recipe when the playlists do not say how they were generated (saved before F62)', () => {
        redraw(generatedWithOf([{ name: 'old', tracks: [] }]))

        expect(RegeneratePanel.getConfig().algorithmId).toBe('mjrp-balanced-cascade')
    })
})
