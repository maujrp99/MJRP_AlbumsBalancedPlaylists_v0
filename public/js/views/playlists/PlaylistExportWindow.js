/**
 * PlaylistExportWindow - the one window of the export (F90).
 *
 * The edit screen and the saved playlists screen open the same window: the three ways out, in the
 * order Apple Music, Spotify, the JSON file. Each one calls the export the edit screen always
 * called (PlaylistsExport.js, components/SpotifyExportModal.js): this module only chooses and
 * hands over what to export. It writes nothing of the batch.
 *
 * Apple Music asks first in which folder the playlists go (AppleFolderStep) and writes its
 * progress on the step's «Export» button; the window stays to show it. Spotify has its own window
 * and the file is handed to the browser, so the window gives way to them.
 *
 * What to export is given: the playlists, the series (the default Apple Music folder), the batch
 * and the position each playlist has in it (so one playlist is named as the export of the whole
 * batch would name it). With none given, the playlists on the edit screen are exported, as always.
 *
 * On the phone the window is a sheet from the bottom; on the computer, a small window.
 */
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../../components/Icons.js'
import { openSheet } from '../../components/ui/Sheet.js'
import { BaseModal } from '../../components/ui/BaseModal.js'
import { isPhone } from '../../utils/isPhone.js'
import { handleExportJson, handleExportToAppleMusic, seriesNameOf } from './PlaylistsExport.js'
import { renderFolderStep } from './AppleFolderStep.js'

const WINDOW_ID = 'playlist-export-window'

/** The destinations, in the order they are offered. */
export const DESTINATIONS = Object.freeze([
    { id: 'apple', icon: 'Apple', text: 'Export to Apple Music' },
    { id: 'spotify', icon: 'Spotify', text: 'Export to Spotify' },
    { id: 'json', icon: 'Download', text: 'Download JSON' }
])

/** What Spotify and the file do with what they are given (Apple Music is the folder step). */
const RUNNERS = {
    spotify: async (job) => {
        const { showSpotifyExportModal } = await import('../../components/SpotifyExportModal.js')
        showSpotifyExportModal(job.playlists ? { playlists: job.playlists, seriesName: job.seriesName } : undefined)
    },
    json: (job) => handleExportJson(job.playlists, { batchName: job.batchName })
}

/** The folders of the person's Apple Music library (the first read asks the person to connect, as the export does). */
async function loadFolders() {
    const { musicKitService } = await import('../../services/MusicKitService.js')
    return musicKitService.listFolders()
}

/** One row of the window: on the phone a row of a sheet, on the computer a button. */
function rowOf(destination, phone) {
    const data = { dataset: { export: destination.id } }
    if (!phone) {
        const kind = destination.id === 'apple' ? 'btn-primary' : 'btn-secondary'
        return SafeDOM.button({ type: 'button', className: `btn ${kind} w-full flex items-center justify-center gap-2`, ...data },
            [SafeDOM.fromHTML(getIcon(destination.icon, 'w-5 h-5')), SafeDOM.span({}, destination.text)])
    }
    return SafeDOM.button({ type: 'button', className: 'albums-sheet__row', ...data },
        [SafeDOM.fromHTML(getIcon(destination.icon, 'albums-sheet__icon')), SafeDOM.span({ className: 'albums-sheet__label' }, destination.text)])
}

/** The rows, each wired to what it runs; `close` gives the window back before a destination that has its own. */
function rowsOf(job, phone, { close, openAppleStep }) {
    return DESTINATIONS.map(destination => {
        const row = rowOf(destination, phone)
        row.addEventListener('click', () => {
            if (destination.id === 'apple') return openAppleStep()
            close()
            return RUNNERS[destination.id](job, row)
        })
        return row
    })
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'

/** Tab and Shift+Tab go round inside the window, never out to the page behind it. */
function keepFocusInside(event, panel) {
    const inside = [...panel.querySelectorAll(FOCUSABLE)]
    if (inside.length === 0) return
    const first = inside[0]
    const last = inside[inside.length - 1]
    const outside = !panel.contains(document.activeElement)
    if (event.shiftKey && (document.activeElement === first || outside)) {
        event.preventDefault()
        last.focus({ preventScroll: true })
    } else if (!event.shiftKey && (document.activeElement === last || outside)) {
        event.preventDefault()
        first.focus({ preventScroll: true })
    }
}

/** Give the focus back to what opened the window, if it is still on the page. */
function giveFocusBack(opener) {
    if (opener?.focus && document.contains(opener)) opener.focus({ preventScroll: true })
}

/** The window of the computer: Escape and the backdrop close it, Tab stays inside, and the focus goes back where it came from. */
function openDialog({ title, body, focusFirst, opener }) {
    const cameFrom = opener || document.activeElement
    const close = () => {
        document.removeEventListener('keydown', onKey, true)
        BaseModal.unmount(WINDOW_ID)
        giveFocusBack(cameFrom)
    }
    const onKey = (event) => {
        if (event.key === 'Tab') return keepFocusInside(event, modal)
        if (event.key !== 'Escape') return
        event.stopPropagation()
        close()
    }
    const modal = BaseModal.render({ id: WINDOW_ID, title, content: body, size: 'sm', onClose: close })
    modal.addEventListener('click', (event) => { if (event.target === modal) close() })
    BaseModal.unmount(WINDOW_ID)
    BaseModal.mount(modal)
    document.addEventListener('keydown', onKey, true)
    focusFirst()
    return { close, setTitle: (text) => { const heading = modal.querySelector('.app-modal__title'); if (heading) heading.textContent = text } }
}

/** The window of the phone: a sheet from the bottom; it gives the focus back to the «⋯» that opened it (the sheet that held the «⋯» is gone by then). */
function openBottomSheet({ title, body, opener }) {
    const sheet = openSheet({ variant: 'bottom', title, content: body, id: WINDOW_ID, onClose: () => giveFocusBack(opener) })
    sheet.element.classList.add('albums-sheet', 'saved-phone-sheet')
    return sheet
}

/**
 * Open the export window.
 * @param {Object} [job] - what to export; none given: the playlists on the edit screen
 * @param {Array} [job.playlists] - the playlists
 * @param {string} [job.seriesName] - the series (the default Apple Music folder)
 * @param {string} [job.batchName] - the batch
 * @param {number[]} [job.positions] - the position of each playlist in its batch (1-based)
 * @param {string} [job.title] - what the window is called
 * @param {'apple'} [job.start] - open straight on the Apple Music folder step
 * @param {HTMLElement} [job.opener] - what gets the focus back on close (none given: what had it when the window opened)
 * @returns {{ close: () => void }}
 */
export function openPlaylistExport(job = {}) {
    const { title = 'Export playlists', start, opener, ...what } = job
    const rowsTitle = start === 'apple' ? 'Export playlists' : title // the title says what the window shows
    const phone = isPhone()
    const body = SafeDOM.div({})
    const control = { close: () => { }, setTitle: () => { } }
    const settle = (className) => { SafeDOM.clear(body); body.className = className }
    const firstControl = () => body.querySelector('[data-export="apple"], input[type="radio"]:checked, button')?.focus({ preventScroll: true })

    const showRows = () => {
        settle(phone ? 'albums-sheet__list' : 'flex flex-col gap-3')
        control.setTitle(rowsTitle)
        rowsOf(what, phone, { close: () => control.close(), openAppleStep: showStep }).forEach(row => body.appendChild(row))
        firstControl()
    }
    function showStep() {
        settle('flex flex-col gap-3')
        control.setTitle(title)
        body.appendChild(renderFolderStep({
            seriesName: seriesNameOf(what.seriesName),
            loadFolders,
            onBack: showRows,
            onExport: (folder, button) => handleExportToAppleMusic({ ...what, ...folder, btn: button })
        }))
        firstControl()
    }

    if (start === 'apple') showStep()
    else showRows()
    const from = opener || document.activeElement
    const opened = phone ? openBottomSheet({ title, body, opener: from }) : openDialog({ title, body, focusFirst: firstControl, opener: from })
    control.close = opened.close
    control.setTitle = opened.setTitle
    return opened
}
