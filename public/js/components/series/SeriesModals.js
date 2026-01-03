/**
 * SeriesModals.js
 * 
 * V3 Architecture Component - Refactored Sprint 16
 * 
 * Responsibility: Orchestrator for Series interactions.
 * - Delegate 'Delete' to DialogService
 * - Delegate 'Edit' to specialized SeriesEditModal component
 * - ZERO innerHTML (SafeDOM only via delegates)
 */

import { dialogService } from '../../services/DialogService.js'
import { SeriesEditModal } from './SeriesEditModal.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { toast } from '../Toast.js'

export default class SeriesModals {
    constructor(options = {}) {
        // We don't need container anymore as DialogService mounts to body
        // But we keep constructor signature compatible if needed
        this.onSeriesUpdated = options.onSeriesUpdated || (() => { })
        this.onSeriesDeleted = options.onSeriesDeleted || (() => { })
    }

    /**
     * Render - No-op in V3 Refactor
     * Legacy views might call this expecting HTML string.
     * We return empty string to satisfy contract without rendering anything.
     */
    render() {
        return ''
    }

    /**
     * Mount - No-op
     */
    mount(container) {
        // No persistent DOM to mount
        this.container = container
    }

    /**
     * Open Edit Series Modal
     * Delegates to SeriesEditModal (SafeDOM)
     */
    openEdit(seriesId) {
        SeriesEditModal.open(seriesId, (id) => this.onSeriesUpdated(id))
    }

    /**
     * Open Delete Series Modal
     * Delegates to DialogService (SafeDOM)
     */
    async openDelete(seriesId) {
        const series = albumSeriesStore.getSeries().find(s => s.id === seriesId)
        if (!series) {
            toast.error('Series not found')
            return
        }

        const confirmed = await dialogService.confirm({
            title: 'Delete Series?',
            message: `Are you sure you want to delete "${series.name}"? Albums will NOT be deleted from inventory.`,
            confirmText: 'Delete Series',
            variant: 'danger'
        })

        if (confirmed) {
            try {
                await albumSeriesStore.deleteSeries(seriesId)
                toast.success('Series deleted successfully')
                this.onSeriesDeleted(seriesId)
            } catch (err) {
                console.error('Delete series failed:', err)
                toast.error('Failed to delete series')
            }
        }
    }

    /**
     * Unmount
     */
    unmount() {
        // Nothing to clean up
    }
}
