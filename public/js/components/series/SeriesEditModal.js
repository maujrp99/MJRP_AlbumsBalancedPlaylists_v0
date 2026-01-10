import { BaseModal } from '../ui/BaseModal.js'
import { SafeDOM } from '../../utils/SafeDOM.js'
import { ArtistScanner } from './ArtistScanner.js'
import { getIcon } from '../Icons.js'
import { toast } from '../Toast.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { getSeriesService } from '../../services/SeriesService.js'

export class SeriesEditModal {
    static async open(seriesId, onUpdated) {
        // Fetch series data
        const series = albumSeriesStore.getSeries().find(s => s.id === seriesId)
        if (!series) {
            toast.error('Series not found')
            return
        }

        let editingAlbumQueries = [...(series.albumQueries || [])]
        let currentName = series.name

        // DOM References
        let albumsListContainer = null
        let countBadge = null

        // --- Render Helpers ---

        const renderAlbumsList = () => {
            if (!albumsListContainer) return

            albumsListContainer.innerHTML = ''
            if (countBadge) countBadge.textContent = `${editingAlbumQueries.length} albums`

            if (editingAlbumQueries.length === 0) {
                albumsListContainer.appendChild(
                    SafeDOM.p({ className: 'text-gray-500 text-sm italic' }, 'No albums yet.')
                )
                return
            }

            editingAlbumQueries.forEach((query, index) => {
                let text = query
                if (typeof query === 'object' && query !== null) {
                    text = `${query.artist} - ${query.title || query.album}`
                }

                const removeBtn = SafeDOM.button({
                    className: 'btn btn-ghost btn-sm text-red-400 hover:text-red-300',
                    onClick: () => {
                        editingAlbumQueries.splice(index, 1)
                        renderAlbumsList()
                    }
                }, 'x') // Simple icon

                const row = SafeDOM.div({
                    className: 'flex items-center justify-between p-2 bg-white/5 rounded-lg mb-1'
                }, [
                    SafeDOM.span({ className: 'text-sm truncate flex-1' }, text),
                    removeBtn
                ])
                albumsListContainer.appendChild(row)
            })
        }

        const handleAddAlbum = (album) => {
            const entry = {
                artist: album.artist,
                title: album.title,
                album: album.title,
                appleMusicId: album.id || album.appleMusicId,
                year: album.year || null,
                coverUrl: album.coverUrl || null
            }

            // Check duplicates
            const isDuplicate = editingAlbumQueries.some(q => {
                if (typeof q === 'object' && q !== null) {
                    if (entry.appleMusicId && q.appleMusicId) {
                        return q.appleMusicId === entry.appleMusicId
                    }
                    return q.artist === entry.artist && (q.title === entry.title || q.album === entry.title)
                }
                return q === `${entry.artist} - ${entry.title}`
            })

            if (isDuplicate) {
                toast.warning('Album already in list')
                return
            }

            editingAlbumQueries.push(entry)
            renderAlbumsList()
            toast.success(`Added: ${entry.title}`)
        }


        // --- Component Construction ---

        // 1. Name Input
        const nameInput = SafeDOM.input({
            type: 'text',
            className: 'form-control w-full mb-6',
            value: currentName,
            placeholder: 'Series Name',
            onInput: (e) => currentName = e.target.value
        })

        // 2. Albums List Header
        countBadge = SafeDOM.span({ className: 'badge badge-neutral text-xs' }, '0 albums')
        const listHeader = SafeDOM.div({ className: 'flex justify-between items-center mb-2' }, [
            SafeDOM.label({ className: 'text-sm font-medium' }, 'Albums in Series'),
            countBadge
        ])

        // 3. Albums List Container
        albumsListContainer = SafeDOM.div({
            className: 'space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar mb-4 bg-black/20 rounded-lg p-3'
        })

        // 4. Artist Scanner
        const scanner = new ArtistScanner({
            onAlbumSelected: handleAddAlbum
        })

        // Assemble Content
        const content = SafeDOM.div({}, [
            SafeDOM.label({ className: 'block text-sm font-medium mb-2' }, 'Series Name'),
            nameInput,
            listHeader,
            albumsListContainer,
            scanner.render()
        ])

        // Initial render of list
        renderAlbumsList()

        // --- Create Modal ---

        const closeModal = () => {
            BaseModal.unmount('edit-series-modal')
        }

        const handleSave = async () => {
            if (!currentName.trim()) {
                toast.error('Series name is required')
                return
            }

            try {
                const db = albumSeriesStore.getDb()
                if (!db) {
                    toast.error('Database not initialized')
                    return
                }
                const service = getSeriesService(db, null, albumSeriesStore.getUserId())
                await service.updateSeries(seriesId, {
                    name: currentName,
                    albumQueries: editingAlbumQueries
                })
                toast.success('Series updated')
                onUpdated(seriesId)
                closeModal()
            } catch (err) {
                console.error('Update failed', err)
                toast.error('Failed to update series')
            }
        }

        const footer = BaseModal.createFooterButtons({
            confirmText: 'Save Changes',
            onCancel: closeModal,
            onConfirm: handleSave
        })

        const modal = BaseModal.render({
            title: 'Edit Series',
            content,
            footer,
            size: 'lg',
            id: 'edit-series-modal',
            onClose: closeModal
        })

        BaseModal.mount(modal)
    }
}
