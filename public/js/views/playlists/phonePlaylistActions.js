/**
 * phonePlaylistActions - what a tap does on the phone's playlists (F76, TASK-04, REQ-08).
 *
 * Heard once on the container of the screen (delegation): the chips switch the open playlist,
 * the «⋯» of a track and of a playlist open a bottom sheet of named actions, Export opens the export
 * window (views/playlists/PlaylistExportWindow.js), Save saves. Every action calls what the computer's buttons call - the
 * controller (save, remove, delete, undo), the service (move a track, as the drag does) and the
 * export modules - so nothing about the playlists is decided here.
 */
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../../components/Icons.js'
import { openSheet } from '../../components/ui/Sheet.js'
import { dialogService } from '../../services/DialogService.js'
import { getPlaylistsService } from '../../services/playlists/playlistsWiring.js'
import { playlistsStore } from '../../stores/playlists.js'
import { showUndoNotice, dismissUndoNotice } from '../../components/playlists/PhoneUndoNotice.js'
import { playlistNameOf } from '../../components/playlists/PhonePlaylists.js'
import { openPlaylistExport } from './PlaylistExportWindow.js'

/** One row of a sheet of actions: an icon, a name, a tap. 56 px tall (playlists.css). */
function actionRow({ icon, text, onTap, danger = false, disabled = false }) {
    const row = SafeDOM.button({
        type: 'button',
        className: `phone-sheet-action${danger ? ' phone-sheet-action--danger' : ''}`,
        disabled
    }, [SafeDOM.fromHTML(getIcon(icon, 'phone-sheet-action__icon')), SafeDOM.span({}, text)])
    row.addEventListener('click', () => onTap(row))
    return row
}

const heading = (text) => SafeDOM.p({ className: 'phone-sheet-heading' }, text)
const indexOf = (button, key) => parseInt(button.dataset[key], 10)
const list = (rows) => SafeDOM.div({ className: 'phone-sheet-actions' }, rows)

/** Move a track as the drag does (the service records the step, so Undo takes it back). */
const moveTrack = (from, to, oldIndex, newIndex) => getPlaylistsService().moveTrack(from, to, oldIndex, newIndex)

/** The row a track landed on, lit for a moment (recheck N20); only the open playlist is drawn. */
function lightUp(playlistIndex, trackIndex) {
    setTimeout(() => {
        const row = document.querySelector(`.phone-track[data-playlist-index="${playlistIndex}"][data-track-index="${trackIndex}"]`)
        if (!row) return
        row.classList.add('is-moved')
        setTimeout(() => row.classList.remove('is-moved'), 1200)
    }, 60)
}

/** The moves of a track inside its own playlist. */
function moveRows(sheetRef, { playlistIndex, trackIndex, count, onMoved }) {
    const last = count - 1
    const move = (to) => () => { sheetRef.close(); moveTrack(playlistIndex, playlistIndex, trackIndex, to); onMoved(playlistIndex, to) }
    return [
        actionRow({ icon: 'ArrowUp', text: 'Move up', onTap: move(trackIndex - 1), disabled: trackIndex === 0 }),
        actionRow({ icon: 'ChevronDown', text: 'Move down', onTap: move(trackIndex + 1), disabled: trackIndex === last }),
        actionRow({ icon: 'ArrowUp', text: 'Move to the top', onTap: move(0), disabled: trackIndex === 0 }),
        actionRow({ icon: 'ChevronDown', text: 'Move to the end', onTap: move(last), disabled: trackIndex === last })
    ]
}

/** «Move to …» one row per other playlist: the track goes to its end. */
function otherPlaylistRows(sheetRef, { playlists, playlistIndex, trackIndex, onMoved }) {
    return playlists.map((playlist, index) => index === playlistIndex ? null : actionRow({
        icon: 'ListMusic',
        text: `${index + 1} · ${playlistNameOf(playlist, index)}`,
        onTap: () => {
            sheetRef.close()
            moveTrack(playlistIndex, index, trackIndex, (playlist.tracks || []).length)
            onMoved(index, (playlist.tracks || []).length)
        }
    })).filter(Boolean)
}

/**
 * The «⋯» of a track: move it (up, down, top, end, to another playlist) or remove it, with Undo.
 * @param {Object} controller - { deleteTrack(p, t), undo() }
 */
export function openTrackSheet({ controller, playlistIndex, trackIndex }) {
    const playlists = playlistsStore.getPlaylists()
    const track = playlists[playlistIndex]?.tracks?.[trackIndex]
    if (!track) return null
    const sheetRef = { close: () => { } }
    const remove = () => {
        sheetRef.close()
        controller.deleteTrack(playlistIndex, trackIndex)
        showUndoNotice({ text: `Removed "${track.title}"`, onUndo: () => controller.undo() })
    }
    // A move by the sheet says where the track went, with Undo, and lights the row (recheck N20)
    const onMoved = (toPlaylist, toIndex) => {
        const where = toPlaylist === playlistIndex ? `number ${toIndex + 1}` : `playlist ${toPlaylist + 1}`
        showUndoNotice({ text: `Moved "${track.title}" to ${where}`, onUndo: () => controller.undo() })
        lightUp(toPlaylist, toIndex)
    }
    const others = otherPlaylistRows(sheetRef, { playlists, playlistIndex, trackIndex, onMoved })
    const content = [
        list(moveRows(sheetRef, { playlistIndex, trackIndex, count: playlists[playlistIndex].tracks.length, onMoved })),
        others.length ? heading('Move to another playlist') : null,
        others.length ? list(others) : null,
        list([actionRow({ icon: 'Trash2', text: 'Remove from this playlist', onTap: remove, danger: true })])
    ].filter(Boolean)
    const sheet = openSheet({ variant: 'bottom', title: track.title || 'Track', content })
    sheetRef.close = () => sheet.close()
    return sheet
}

/** Open the reconfigure panel of the page and bring it into view. */
function showRegeneratePanel(container) {
    const panel = container.querySelector('.regenerate-panel')
    if (!panel) return
    if (panel.querySelector('.regenerate-content')?.classList.contains('hidden')) {
        panel.querySelector('[data-action="toggle-regenerate-panel"]')?.click()
    }
    panel.scrollIntoView({ block: 'start' })
}

/** Put the cursor in the title of a playlist, its text chosen, to type over it. */
function focusTitle(container, playlistIndex) {
    const field = container.querySelector(`.phone-pl .playlist-name[data-playlist-index="${playlistIndex}"]`)
    if (!field) return
    field.focus()
    const range = document.createRange()
    range.selectNodeContents(field)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
}

/** Deleting a whole playlist is asked first (the computer deletes on one click; here it is a sheet away). */
async function confirmDeletePlaylist(controller, playlistIndex, name) {
    const confirmed = await dialogService.confirm({
        title: 'Delete playlist?',
        message: `"${name}" and its tracks leave this set. You can undo it until you save.`,
        confirmText: 'Delete playlist',
        variant: 'danger'
    })
    if (confirmed) await controller.deletePlaylist(playlistIndex)
}

/** The «⋯» of a playlist: rename, regenerate, delete (asked first). */
export function openPlaylistSheet({ controller, container, playlistIndex }) {
    const playlist = playlistsStore.getPlaylists()[playlistIndex]
    if (!playlist) return null
    const name = playlistNameOf(playlist, playlistIndex)
    let sheet = null
    const after = (act) => () => { sheet.close(); act() }
    const content = [
        list([
            actionRow({ icon: 'Edit', text: 'Rename', onTap: after(() => focusTitle(container, playlistIndex)) }),
            actionRow({ icon: 'RefreshCw', text: 'Reconfigure and regenerate', onTap: after(() => showRegeneratePanel(container)) })
        ]),
        list([actionRow({ icon: 'Trash2', text: 'Delete this playlist', danger: true, onTap: after(() => confirmDeletePlaylist(controller, playlistIndex, name)) })])
    ]
    sheet = openSheet({ variant: 'bottom', title: name, content })
    return sheet
}

/** Export: the window the saved playlists screen opens too (F90), for the playlists on this screen. */
export function openExportSheet() {
    return openPlaylistExport()
}

/**
 * @param {HTMLElement} container - the container of the screen
 * @param {Object} options
 * @param {Object} options.controller - PlaylistsController
 * @param {Function} options.showPlaylist - (index) => void: the view opens that playlist
 * @returns {{ detach: () => void }}
 */
export function attachPhonePlaylistActions(container, { controller, showPlaylist }) {
    const ACTIONS = {
        'show-playlist': (button) => showPlaylist(indexOf(button, 'playlistIndex')),
        'track-options': (button) => openTrackSheet({ controller, playlistIndex: indexOf(button, 'playlistIndex'), trackIndex: indexOf(button, 'trackIndex') }),
        'playlist-options': (button) => openPlaylistSheet({ controller, container, playlistIndex: indexOf(button, 'playlistIndex') }),
        'export': () => openExportSheet(),
        'save': () => controller.handleSave(container.querySelector('#batchNameInput')?.value)
    }
    const onClick = (event) => {
        const button = event.target.closest('[data-phone-action]')
        const act = button && !button.disabled ? ACTIONS[button.dataset.phoneAction] : null
        if (act) act(button)
    }
    container.addEventListener('click', onClick)
    return {
        detach: () => {
            container.removeEventListener('click', onClick)
            dismissUndoNotice()
        }
    }
}
