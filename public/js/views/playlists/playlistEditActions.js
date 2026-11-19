/**
 * playlistEditActions
 *
 * The edit actions the playlists screen draws, heard in one place (F62): undo and redo, delete a
 * playlist, and the title of a playlist typed over. The listeners are attached once to the
 * container of the screen (delegation), so they survive every redraw of what is inside it. What an
 * action does is the controller's business; nothing is decided here.
 *
 * The title: the field shows the title of the playlist alone. What was typed is taken when the
 * field loses the focus (Enter ends the edit, Escape gives it up). While a title is being typed
 * the screen must not be redrawn, or the typed text is lost: `isEditingTitle()` says so and
 * `onEditEnd` tells the screen it may draw again.
 */

const TITLE = '.playlist-name[contenteditable="true"]'

const CLICK_ACTIONS = Object.freeze({
    'undo-edit': (controller) => controller.undo(),
    'redo-edit': (controller) => controller.redo(),
    'delete-playlist': (controller, button) => {
        const index = parseInt(button.dataset.playlistIndex, 10)
        if (!Number.isNaN(index)) controller.deletePlaylist(index)
    }
})

/**
 * @param {HTMLElement} container - the container of the screen
 * @param {Object} options
 * @param {Object} options.controller - { undo(), redo(), deletePlaylist(index), renamePlaylist(index, title) }
 * @param {Function} [options.onEditEnd] - called when the edit of a title ends
 * @returns {{ isEditingTitle: () => boolean, detach: () => void }}
 */
export function attachPlaylistEditActions(container, { controller, onEditEnd = () => { } }) {
    let editing = null // { field, original } while a title is being typed

    const onClick = (event) => {
        const button = event.target.closest('[data-action]')
        const act = button && !button.disabled ? CLICK_ACTIONS[button.dataset.action] : null
        if (act) act(controller, button)
    }

    const onFocusIn = (event) => {
        const field = event.target.closest?.(TITLE)
        if (field) editing = { field, original: field.textContent }
    }

    const onFocusOut = (event) => {
        const field = event.target.closest?.(TITLE)
        if (!field || editing?.field !== field) return

        const { original } = editing
        editing = null
        const typed = field.textContent.trim()
        if (typed && typed !== original.trim()) {
            controller.renamePlaylist(parseInt(field.dataset.playlistIndex, 10), typed)
        } else {
            field.textContent = original // nothing to keep: the field shows the title again
        }
        onEditEnd()
    }

    const onKeyDown = (event) => {
        const field = event.target.closest?.(TITLE)
        if (!field) return
        if (event.key === 'Enter') {
            event.preventDefault() // a title has one line
            field.blur()
        } else if (event.key === 'Escape') {
            if (editing?.field === field) field.textContent = editing.original
            field.blur()
        }
    }

    const listeners = [['click', onClick], ['focusin', onFocusIn], ['focusout', onFocusOut], ['keydown', onKeyDown]]
    listeners.forEach(([type, listener]) => container.addEventListener(type, listener))

    return {
        isEditingTitle: () => editing !== null,
        detach: () => listeners.forEach(([type, listener]) => container.removeEventListener(type, listener))
    }
}
