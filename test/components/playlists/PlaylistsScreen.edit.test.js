/**
 * F62 - what the playlists screen draws for editing: the two buttons of undo and redo (UAT-02),
 * the button that deletes a playlist of the set (UAT-03), the title of a playlist as a field of
 * its own (UAT-04), the header and the batch name (UAT-190), and the recipe the "reconfigure"
 * panel shows (UAT-200).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { PlaylistsGridRenderer } from '../../../public/js/components/playlists/PlaylistsGridRenderer.js'
import { PlaylistGrid } from '../../../public/js/components/playlists/PlaylistGrid.js'
import { RegeneratePanel } from '../../../public/js/components/playlists/RegeneratePanel.js'
import { Breadcrumb } from '../../../public/js/components/Breadcrumb.js'

const draw = (html) => {
    const host = document.createElement('div')
    host.innerHTML = html
    return host
}
const playlists = [
    { name: 'Greatest Hits', title: 'Greatest Hits', tracks: [{ title: 'A', duration: 60 }] },
    { name: 'Deep Cuts Vol. 1', title: 'Deep Cuts Vol. 1', tracks: [] }
]

describe('the buttons of undo and redo (UAT-02)', () => {
    const buttons = (state) => {
        const host = draw(PlaylistsGridRenderer.renderExportSection(playlists, state))
        return { undo: host.querySelector('[data-action="undo-edit"]'), redo: host.querySelector('[data-action="redo-edit"]') }
    }

    it('are drawn in the actions of the screen, each saying what it does', () => {
        const { undo, redo } = buttons({ canUndo: true, canRedo: true })

        expect(undo.textContent).toContain('Undo')
        expect(redo.textContent).toContain('Redo')
        expect(undo.getAttribute('aria-label')).toBe('Undo the last change')
        expect(redo.getAttribute('aria-label')).toBe('Redo the change that was undone')
    })

    it('are disabled when there is nothing to undo or to redo, from the state they are given', () => {
        expect(buttons({ canUndo: false, canRedo: false })).toMatchObject({ undo: { disabled: true }, redo: { disabled: true } })
        expect(buttons({ canUndo: true, canRedo: false })).toMatchObject({ undo: { disabled: false }, redo: { disabled: true } })
        expect(buttons({ canUndo: false, canRedo: true })).toMatchObject({ undo: { disabled: true }, redo: { disabled: false } })
        expect(buttons(undefined)).toMatchObject({ undo: { disabled: true }, redo: { disabled: true } })
    })
})

describe('the card of a playlist', () => {
    const cards = (options = {}) => draw(PlaylistGrid.render({ playlists, batchName: 'Road trip', ...options }))
        .querySelectorAll('.playlist-card')

    it('has a button that deletes that playlist of the set (UAT-03)', () => {
        const [first, second] = cards()

        const button = first.querySelector('[data-action="delete-playlist"]')
        expect(button.dataset.playlistIndex).toBe('0')
        expect(button.getAttribute('aria-label')).toBe('Delete playlist Greatest Hits')
        expect(second.querySelector('[data-action="delete-playlist"]').dataset.playlistIndex).toBe('1')
    })

    it('shows the position and the batch name beside the title, and only the title can be typed over (UAT-04)', () => {
        const [first] = cards()

        const title = first.querySelector('.playlist-name')
        expect(title.textContent).toBe('Greatest Hits')
        expect(title.getAttribute('contenteditable')).toBe('true')
        expect(title.dataset.playlistIndex).toBe('0')
        expect(title.getAttribute('aria-label')).toBe('Title of playlist 1')
        expect(first.querySelector('.playlist-title-prefix').textContent).toBe('1. Road trip - ')
        expect(first.querySelector('.playlist-title-prefix').hasAttribute('contenteditable')).toBe(false)
    })

    it('has neither the delete button nor a title to type over when the grid is only shown', () => {
        const [first] = cards({ editable: false })

        expect(first.querySelector('[data-action="delete-playlist"]')).toBeNull()
        expect(first.querySelector('[contenteditable]')).toBeNull()
        expect(first.textContent).toContain('1. Road trip - Greatest Hits')
    })
})

describe('the top of the screen (UAT-190)', () => {
    it('names the batch being edited', () => {
        const host = draw(PlaylistsGridRenderer.renderHeader({ isEditMode: true, editedBatchName: 'Road trip' }))

        expect(host.textContent).toContain('Editing: Road trip')
        expect(host.textContent).not.toContain('...')
    })

    it('shows the path of this screen: from the blend when creating, from the saved playlists when editing', () => {
        const creating = draw(PlaylistsGridRenderer.renderHeader({ isEditMode: false }))
        const editing = draw(PlaylistsGridRenderer.renderHeader({ isEditMode: true, editedBatchName: 'Road trip' }))
        const path = (host) => host.querySelector('.breadcrumb').textContent.replace(/\s+/g, ' ').trim()

        expect(path(creating)).toBe('Home › Blend › Playlists')
        expect(path(editing)).toBe('Home › Saved Playlists › Edit Batch')
        expect(creating.querySelector('.breadcrumb-link[data-path="/blend"]')).not.toBeNull()
        expect(editing.querySelector('.breadcrumb-link[data-path="/saved-playlists"]')).not.toBeNull()
    })

    it('keeps the path of the saved playlists screen itself as it was', () => {
        expect(Breadcrumb.getCrumbs('/saved-playlists', {}).map(c => c.label)).toEqual(['Home'])
    })

    it('labels the batch name once, tied to its field', () => {
        const host = draw(PlaylistsGridRenderer.renderBatchNameInput('Road trip', true))

        const labels = host.querySelectorAll('label')
        expect(labels).toHaveLength(1)
        expect(labels[0].textContent).toBe('Batch Name')
        expect(labels[0].getAttribute('for')).toBe('batchNameInput')
    })
})

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
        redraw(PlaylistsGridRenderer.generatedWith([{ name: 'x', tracks: [], _meta: GENERATED }]))

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
        redraw(PlaylistsGridRenderer.generatedWith([{ name: 'old', tracks: [] }]))

        expect(RegeneratePanel.getConfig().algorithmId).toBe('mjrp-balanced-cascade')
    })
})
