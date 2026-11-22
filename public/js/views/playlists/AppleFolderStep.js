/**
 * AppleFolderStep - the step before an export to Apple Music: in which folder do the playlists go (F90).
 *
 * The series' name is selected (the folder the export always used), so accepting it is one tap on
 * «Export». The person can pick a folder the library already has, type a new name, or choose no
 * folder. The list of folders is read when the step opens; while it is read, when there is none
 * and when it could not be read, the step says so and the other choices stay.
 * What was picked is remembered for the series (appleFolderChoice.js).
 */
import { SafeDOM } from '../../utils/SafeDOM.js'
import { FOLDER_KEY_PREFIX, readChoice, saveChoice, findFolder, initialPick, folderForExport } from './appleFolderChoice.js'

const ROW_CLASS = 'flex items-center gap-3 px-3 rounded-xl bg-white/5 cursor-pointer'

/** The words said about the list of folders, by what became of it. */
const STATUS_TEXT = {
    loading: 'Reading your Apple Music folders...',
    empty: 'You have no folders in Apple Music yet. Export creates the folder you pick.',
    failed: 'Your Apple Music folders could not be read. You can still export to the folder below, or type a folder name.'
}

export { FOLDER_KEY_PREFIX }

/** What has the focus inside the list: the input of a choice (by its mode and value) or the typed name. */
function focusMark(list, typed) {
    const active = document.activeElement
    if (!active || !list.contains(active)) return null
    return active === typed ? { typed: true } : { mode: active.dataset.mode, value: active.value }
}

/** Give the focus back after the list was drawn again. */
function restoreFocus(list, typed, mark) {
    if (!mark) return
    if (mark.typed) { typed.focus({ preventScroll: true }); return }
    const inputs = [...list.querySelectorAll('input[type="radio"]')]
    const same = inputs.find(input => input.dataset.mode === mark.mode && input.value === mark.value)
    ;(same || inputs.find(input => input.checked) || inputs[0])?.focus({ preventScroll: true })
}

function radioRow({ mode, value, label, note, checked, onPick, extra }) {
    const input = SafeDOM.create('input', { type: 'radio', name: 'apple-folder', className: 'accent-orange-500' })
    input.dataset.mode = mode
    input.value = value
    input.checked = checked
    input.addEventListener('change', () => onPick(mode, value))
    const text = SafeDOM.span({ className: 'min-w-0 flex-1 text-white' }, [label, note ? SafeDOM.span({ className: 'text-white/50 text-sm' }, ` ${note}`) : null].filter(Boolean))
    const row = SafeDOM.create('label', { className: ROW_CLASS, style: { minHeight: '44px' } }, [input, text, extra].filter(Boolean))
    return { row, input }
}

/**
 * @param {Object} options
 * @param {string} options.seriesName - the default folder
 * @param {() => Promise<Array<{ id: string, name: string }>>} options.loadFolders - reads the folders of the library
 * @param {(folder: { folderName?: string, folderId?: string, noFolder?: boolean }, button: HTMLElement) => void} options.onExport
 * @param {() => void} options.onBack
 * @param {Storage} [options.storage]
 * @returns {HTMLElement}
 */
export function renderFolderStep({ seriesName, loadFolders, onExport, onBack, storage }) {
    const remembered = readChoice(seriesName, storage)
    const state = { status: 'loading', folders: [], pick: initialPick({ seriesName, folders: [], remembered }), touched: false, typedByHand: false }
    const status = SafeDOM.p({ className: 'text-sm text-white/60', role: 'status' })
    const list = SafeDOM.create('div', { className: 'flex flex-col gap-2 overflow-y-auto', style: { maxHeight: '40vh' }, role: 'radiogroup', 'aria-label': 'Folder in Apple Music' })
    const alert = SafeDOM.p({ className: 'text-sm text-red-400', role: 'alert' })
    const typed = SafeDOM.create('input', { type: 'text', className: 'flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-500', placeholder: 'New folder', 'aria-label': 'New folder name', autocomplete: 'off' })
    typed.dataset.folderName = 'true'

    const pickRow = (mode, name) => { state.touched = true; state.pick = { mode, name }; alert.textContent = '' }
    const draw = () => {
        const mark = focusMark(list, typed) // before the rows are built: building them moves the typed field
        status.textContent = STATUS_TEXT[state.status] || ''
        const rows = [radioRow({ mode: 'series', value: seriesName, label: seriesName, note: '(default)', checked: state.pick.mode === 'series', onPick: pickRow })]
        state.folders.filter(folder => folder.name.trim().toLowerCase() !== seriesName.trim().toLowerCase()).forEach(folder => {
            rows.push(radioRow({ mode: 'existing', value: folder.name, label: folder.name, checked: state.pick.mode === 'existing' && state.pick.name === folder.name, onPick: pickRow }))
        })
        // the field is the person's own text, or the remembered new name: never an old folder's name
        typed.value = state.pick.mode === 'new' ? state.pick.name : (state.typedByHand ? typed.value : '')
        const fresh = radioRow({ mode: 'new', value: '', label: 'New folder', checked: state.pick.mode === 'new', onPick: () => pickRow('new', typed.value), extra: typed })
        rows.push(fresh, radioRow({ mode: 'none', value: '', label: 'No folder', note: '(top of the library)', checked: state.pick.mode === 'none', onPick: pickRow }))
        SafeDOM.clear(list)
        rows.forEach(({ row }) => list.appendChild(row))
        restoreFocus(list, typed, mark)
        typed.oninput = () => { state.typedByHand = true; fresh.input.checked = true; pickRow('new', typed.value) }
    }

    const exportButton = SafeDOM.button({ type: 'button', className: 'btn btn-primary w-full justify-center', dataset: { appleExport: 'true' } }, 'Export')
    exportButton.addEventListener('click', () => {
        const folder = folderForExport(state.pick)
        if (!folder.ok) { alert.textContent = folder.message; typed.focus(); return }
        const known = state.pick.mode === 'new' ? null : findFolder(state.folders, folder.folderName)
        if (known) folder.folderId = known.id // picked from the list: the export uses the id, it does not look the name up again
        saveChoice(seriesName, folder.noFolder ? { none: true } : { name: folder.folderName }, storage)
        onExport(folder, exportButton)
    })
    const backButton = SafeDOM.button({ type: 'button', className: 'btn btn-ghost w-full justify-center', dataset: { folderBack: 'true' } }, 'Back')
    backButton.addEventListener('click', onBack)

    draw()
    Promise.resolve().then(loadFolders).then((folders) => {
        state.folders = folders
        state.status = folders.length === 0 ? 'empty' : 'ready'
    }, () => { state.status = 'failed' }).then(() => {
        if (!state.touched) state.pick = initialPick({ seriesName, folders: state.folders, remembered })
        if (state.pick.mode === 'existing' && !findFolder(state.folders, state.pick.name)) state.pick = { mode: 'series', name: seriesName }
        draw()
    })

    return SafeDOM.div({ className: 'flex flex-col gap-3', dataset: { appleFolderStep: 'true' } }, [
        SafeDOM.h3({ className: 'text-lg font-bold text-white' }, 'Folder in Apple Music'),
        status, list, alert, exportButton, backButton
    ])
}
