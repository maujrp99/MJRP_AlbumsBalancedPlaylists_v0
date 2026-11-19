/**
 * F62 - the playlists screen hears the edit actions drawn on it: undo and redo (UAT-02), delete a
 * playlist (UAT-03) and the title of a playlist typed over (UAT-04). The listeners are attached
 * once, to the container, so they survive every redraw of what is inside it.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { attachPlaylistEditActions } from '../../public/js/views/playlists/playlistEditActions.js'
import { PlaylistGrid } from '../../public/js/components/playlists/PlaylistGrid.js'
import { PlaylistsGridRenderer } from '../../public/js/components/playlists/PlaylistsGridRenderer.js'

const playlists = [
    { name: 'Greatest Hits', title: 'Greatest Hits', tracks: [] },
    { name: 'Deep Cuts', title: 'Deep Cuts', tracks: [] }
]

describe('the edit actions of the playlists screen', () => {
    let container, controller, actions, onEditEnd

    const drawScreen = () => {
        container.innerHTML =
            PlaylistsGridRenderer.renderExportSection(playlists, { canUndo: true, canRedo: true }) +
            PlaylistGrid.render({ playlists, batchName: 'Road trip' })
    }
    const titleOf = (index) => container.querySelector(`.playlist-name[data-playlist-index="${index}"]`)
    const type = (field, text) => {
        field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
        field.textContent = text
    }
    const leave = (field) => field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    const press = (field, key) => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
        field.dispatchEvent(event)
        return event
    }

    beforeEach(() => {
        document.body.innerHTML = ''
        container = document.createElement('div')
        document.body.appendChild(container)
        controller = { undo: vi.fn(), redo: vi.fn(), deletePlaylist: vi.fn(), renamePlaylist: vi.fn() }
        onEditEnd = vi.fn()
        drawScreen()
        actions = attachPlaylistEditActions(container, { controller, onEditEnd })
    })

    it('undo and redo go to the controller', () => {
        container.querySelector('[data-action="undo-edit"]').click()
        container.querySelector('[data-action="redo-edit"]').click()

        expect(controller.undo).toHaveBeenCalledTimes(1)
        expect(controller.redo).toHaveBeenCalledTimes(1)
    })

    it('the delete button of a card deletes that playlist', () => {
        container.querySelectorAll('[data-action="delete-playlist"]')[1].click()

        expect(controller.deletePlaylist).toHaveBeenCalledWith(1)
    })

    it('the title typed over goes to the controller when the field loses the focus', () => {
        const field = titleOf(1)
        type(field, '  Night drive ')
        leave(field)

        expect(controller.renamePlaylist).toHaveBeenCalledWith(1, 'Night drive')
        expect(onEditEnd).toHaveBeenCalledTimes(1)
    })

    it('Enter ends the edit and keeps the title; it does not break the line', () => {
        const field = titleOf(0)
        field.blur = () => leave(field) // what the browser does on blur
        type(field, 'Morning')

        const event = press(field, 'Enter')

        expect(event.defaultPrevented).toBe(true)
        expect(controller.renamePlaylist).toHaveBeenCalledWith(0, 'Morning')
    })

    it('Escape puts the title back as it was and changes nothing', () => {
        const field = titleOf(0)
        field.blur = () => leave(field)
        type(field, 'Oops')

        press(field, 'Escape')

        expect(field.textContent).toBe('Greatest Hits')
        expect(controller.renamePlaylist).not.toHaveBeenCalled()
    })

    it('an empty title or the same title changes nothing, and the field shows the title again', () => {
        const field = titleOf(0)
        type(field, '   ')
        leave(field)
        type(field, 'Greatest Hits')
        leave(field)

        expect(controller.renamePlaylist).not.toHaveBeenCalled()
        expect(field.textContent).toBe('Greatest Hits')
    })

    it('says a title is being typed from the focus to the end of the edit, so the screen is not redrawn under it', () => {
        const field = titleOf(0)
        expect(actions.isEditingTitle()).toBe(false)

        type(field, 'Half typed')
        expect(actions.isEditingTitle()).toBe(true)

        leave(field)
        expect(actions.isEditingTitle()).toBe(false)
    })

    it('keeps hearing after the screen is drawn again', () => {
        drawScreen()

        container.querySelector('[data-action="undo-edit"]').click()
        const field = titleOf(0)
        type(field, 'Again')
        leave(field)

        expect(controller.undo).toHaveBeenCalledTimes(1)
        expect(controller.renamePlaylist).toHaveBeenCalledWith(0, 'Again')
    })

    it('stops hearing when detached', () => {
        actions.detach()

        container.querySelector('[data-action="undo-edit"]').click()

        expect(controller.undo).not.toHaveBeenCalled()
    })
})
