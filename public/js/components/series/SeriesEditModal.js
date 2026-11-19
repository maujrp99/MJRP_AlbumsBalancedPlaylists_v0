import { BaseModal } from '../ui/BaseModal.js'
import { SafeDOM } from '../../utils/SafeDOM.js'
import { AlbumPickerPanel } from '../album-picker/AlbumPickerPanel.js'
import { toast } from '../Toast.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { getSeriesService } from '../../services/SeriesService.js'
import { parseAlbumQuery, toAlbumQuery } from '../../models/albumQuery.js'
import { decodeEntities } from '../../models/text.js'
import {
    idleSave, canSave, saveStarted, saveFailed, describeSave, problemBeforeSave, hasAlbumQuery
} from '../../models/seriesDraft.js'

const MODAL_ID = 'edit-series-modal'

/**
 * The "Edit Series" modal: the name, the albums of the series, and the one album picker (F57) to
 * add more. What this modal does with a pick is the only thing that is its own: the album joins
 * the list of the series being edited, and nothing is written until "Save Changes".
 *
 * Saving has one state (models/seriesDraft.js) and the footer and the message are drawn from it:
 * busy while the write is on its way, a message when it failed, and the list as the person left it.
 */
export class SeriesEditModal {
    /**
     * @param {string} seriesId
     * @param {(seriesId: string) => void} onUpdated - called after the series was saved
     */
    static open(seriesId, onUpdated) {
        const series = albumSeriesStore.getSeries().find(s => s.id === seriesId)
        if (!series) {
            toast.error('Series not found')
            return null
        }
        const modal = new SeriesEditModal(series, onUpdated)
        modal.mount()
        return modal
    }

    constructor(series, onUpdated) {
        this.seriesId = series.id
        this.onUpdated = onUpdated || (() => {})
        // A name stored with HTML entities (UAT-180) is shown plain, and saved plain on the next edit
        this.name = decodeEntities(series.name || '')
        this.albumQueries = [...(series.albumQueries || [])]
        this.save = idleSave()
        this.picker = new AlbumPickerPanel({ onPick: (album) => this.addAlbum(album) })
        this.elements = {}
    }

    mount() {
        const nameInput = SafeDOM.input({
            type: 'text',
            className: 'form-control w-full mb-6',
            value: this.name,
            placeholder: 'Series Name',
            onInput: (e) => { this.name = e.target.value }
        })
        const count = SafeDOM.span({ className: 'badge badge-neutral text-xs', dataset: { seriesCount: 'true' } })
        const list = SafeDOM.div({
            className: 'space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar mb-4 bg-black/20 rounded-lg p-3',
            dataset: { seriesAlbums: 'true' }
        })
        const message = SafeDOM.p({ className: 'text-sm text-red-400 mt-3 hidden', role: 'alert' })
        const cancelButton = SafeDOM.button({ type: 'button', className: 'btn btn-ghost', dataset: { action: 'close-modal' }, onClick: () => this.close() }, 'Cancel')
        const saveButton = SafeDOM.button({ type: 'button', className: 'btn btn-primary', dataset: { action: 'save-series' }, onClick: () => this.saveChanges() })
        this.elements = { count, list, message, saveButton }

        const content = SafeDOM.div({}, [
            SafeDOM.label({ className: 'block text-sm font-medium mb-2' }, 'Series Name'),
            nameInput,
            SafeDOM.div({ className: 'flex justify-between items-center mb-2' }, [
                SafeDOM.label({ className: 'text-sm font-medium' }, 'Albums in Series'),
                count
            ]),
            list,
            this.picker.render(),
            message
        ])

        this.drawAlbums()
        this.drawSave()
        BaseModal.mount(BaseModal.render({
            title: 'Edit Series',
            content,
            footer: SafeDOM.fragment([cancelButton, saveButton]),
            size: 'lg',
            id: MODAL_ID,
            onClose: () => this.close()
        }))
    }

    close() {
        this.picker.dispose()
        BaseModal.unmount(MODAL_ID)
    }

    /** The seam of the album picker: a picked album joins the list of this series. */
    addAlbum(album) {
        const entry = toAlbumQuery(album)
        if (hasAlbumQuery(this.albumQueries, entry)) {
            toast.warning('Album already in list')
            return
        }
        this.albumQueries.push(entry)
        this.drawAlbums()
        toast.success(`Added: ${entry.title}`)
    }

    removeAlbumAt(index) {
        this.albumQueries.splice(index, 1)
        this.drawAlbums()
    }

    drawAlbums() {
        const { list, count } = this.elements
        SafeDOM.clear(list)
        count.textContent = `${this.albumQueries.length} albums`

        if (this.albumQueries.length === 0) {
            list.appendChild(SafeDOM.p({ className: 'text-gray-500 text-sm italic' }, 'No albums yet.'))
            return
        }
        this.albumQueries.forEach((query, index) => list.appendChild(this.createAlbumRow(query, index)))
    }

    createAlbumRow(query, index) {
        const { artist, title } = parseAlbumQuery(query)
        const removeButton = SafeDOM.button({
            type: 'button',
            className: 'btn btn-ghost btn-sm text-red-400 hover:text-red-300',
            title: 'Remove album',
            dataset: { action: 'remove-album' },
            onClick: () => this.removeAlbumAt(index)
        }, 'x')

        return SafeDOM.div({ className: 'flex items-center justify-between p-2 bg-white/5 rounded-lg mb-1', dataset: { albumRow: 'true' } }, [
            SafeDOM.span({ className: 'text-sm truncate flex-1' }, artist ? `${artist} - ${title}` : title),
            removeButton
        ])
    }

    /** The one way the save's state changes: keep it, then draw from it. */
    setSave(next) {
        this.save = next
        this.drawSave()
    }

    drawSave() {
        const { saveButton, message } = this.elements
        const shown = describeSave(this.save)

        saveButton.textContent = shown.confirmLabel
        saveButton.disabled = shown.busy
        if (shown.busy) saveButton.setAttribute('aria-busy', 'true')
        else saveButton.removeAttribute('aria-busy')

        message.textContent = shown.message
        message.classList.toggle('hidden', !shown.message)
    }

    /**
     * "Save Changes". One write at a time: while one is on its way, another click asks nothing.
     * A failure keeps the modal open with the name and the list as the person left them.
     */
    async saveChanges() {
        if (!canSave(this.save)) return

        const db = albumSeriesStore.getDb()
        const problem = problemBeforeSave({ name: this.name, hasDatabase: Boolean(db) })
        if (problem) {
            this.setSave(saveFailed(problem))
            return
        }

        this.setSave(saveStarted())
        try {
            // Saving changes the series. The album load reconciles it: an album added is found
            // and enriched through the queue, an album removed leaves, the rest stays (F56).
            await getSeriesService(db, null, albumSeriesStore.getUserId()).updateSeries(this.seriesId, {
                name: decodeEntities(this.name).trim(),
                albumQueries: this.albumQueries
            })
        } catch (error) {
            console.error('[SeriesEditModal] Update failed', error)
            this.setSave(saveFailed())
            return
        }

        toast.success('Series updated')
        this.close()
        this.onUpdated(this.seriesId)
    }
}
