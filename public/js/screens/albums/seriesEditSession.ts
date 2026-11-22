/**
 * The state and the rules of the window to edit a series (F83 wave 5b; it was components/series/SeriesEditModal.js): the name, the albums
 * of the series, and the save. What this window does with an album picked is the only thing that is its own: the album joins the list of
 * the series being edited, and nothing is written until «Save Changes».
 *
 * Saving has one state (models/seriesDraft.js): busy while the write is on its way, a message when it failed, and the list as the person
 * left it. One write at a time. The write is the series service's `updateSeries` with `{ name, albumQueries }`, as it always was: the album
 * load reconciles the series afterwards (an album added is found and enriched through the queue, an album removed leaves, the rest stays, F56).
 */
import { toast } from '../../components/Toast.js'
import { t } from '../../i18n/t.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { getSeriesService } from '../../services/SeriesService.js'
import { toAlbumQuery } from '../../models/albumQuery.js'
import { decodeEntities } from '../../models/text.js'
import { isPhone } from '../../utils/isPhone.js'
import { SaveProblem, SaveStatus, canSave, hasAlbumQuery, idleSave, problemBeforeSave, saveFailed, saveStarted } from '../../models/seriesDraft.js'
import type { PickerAlbum } from '../../ui/albumPicker/pickerController'

/** An album query as a series stores it: «Artist - Title», or an object. */
export type AlbumQuery = string | { artist?: string; title?: string; album?: string; appleMusicId?: string | null; [more: string]: unknown }

export interface SeriesRecord {
    id: string
    name?: string
    albumQueries?: AlbumQuery[]
}

export interface SaveState {
    status: string
    problem: string | null
}

/** The key of the dictionary that says why a save did not happen. */
export const PROBLEM_TEXT: Record<string, string> = {
    [SaveProblem.NO_NAME]: 'albums.edit.problem.noName',
    [SaveProblem.NO_DATABASE]: 'albums.edit.problem.noDatabase',
    [SaveProblem.WRITE_FAILED]: 'albums.edit.problem.writeFailed'
}

interface Events {
    /** Called after the series was saved. */
    onUpdated: (seriesId: string) => void
    /** Takes the window off the page. */
    close: () => void
}

export class SeriesEditSession {
    readonly seriesId: string
    name: string
    albumQueries: AlbumQuery[]
    save: SaveState = idleSave()
    /** Whether the screen was a phone at the last drawing of the list: the rows of the phone have buttons to move them (F76). */
    phone = isPhone()
    /** A new number at each drawing of the list: the rows are made again, as the hand-made list was. */
    draws = 0
    private version = 0
    private readonly listeners = new Set<() => void>()
    private readonly events: Events

    constructor(series: SeriesRecord, events: Events) {
        this.seriesId = series.id
        this.events = events
        // A name stored with HTML entities (UAT-180) is shown plain, and saved plain on the next edit
        this.name = decodeEntities(series.name || '')
        this.albumQueries = [...(series.albumQueries || [])]
    }

    /** The series to edit, as the store has it now; undefined when it is not there. */
    static find(seriesId: string): SeriesRecord | undefined {
        return (albumSeriesStore.getSeries() as SeriesRecord[]).find(series => series.id === seriesId)
    }

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    getVersion = (): number => this.version

    private touch(): void {
        this.version += 1
        this.listeners.forEach(listener => listener())
    }

    /** The list was changed: it is drawn again, and the phone is asked once more. */
    private listChanged(): void {
        this.phone = isPhone()
        this.draws += 1
        this.touch()
    }

    close(): void {
        this.events.close()
    }

    /** A picked album joins the list of this series. */
    addAlbum(album: PickerAlbum): void {
        const entry = toAlbumQuery(album)
        if (hasAlbumQuery(this.albumQueries, entry)) {
            toast.warning(t('albums.edit.alreadyIn'))
            return
        }
        this.albumQueries.push(entry)
        this.listChanged()
        toast.success(t('albums.edit.added', { title: entry.title }))
    }

    removeAlbumAt(index: number): void {
        this.albumQueries.splice(index, 1)
        this.listChanged()
    }

    /** Moves an album of the series one place up (-1) or down (+1), without dragging (F76, the phone). Nothing is written until «Save Changes». */
    moveAlbumAt(index: number, delta: number): void {
        const to = index + delta
        if (to < 0 || to >= this.albumQueries.length) return
        const [query] = this.albumQueries.splice(index, 1)
        this.albumQueries.splice(to, 0, query)
        this.listChanged()
    }

    /** The one way the save's state changes: keep it, then draw from it. */
    private setSave(next: SaveState): void {
        this.save = next
        this.touch()
    }

    isSaving(): boolean {
        return this.save.status === SaveStatus.SAVING
    }

    /** «Save Changes». One write at a time: while one is on its way, another press asks nothing. A failure keeps the window open with the name and the list as the person left them. */
    async saveChanges(): Promise<void> {
        if (!canSave(this.save)) return

        const db = albumSeriesStore.getDb()
        const problem = problemBeforeSave({ name: this.name, hasDatabase: Boolean(db) })
        if (problem) {
            this.setSave(saveFailed(problem))
            return
        }

        this.setSave(saveStarted())
        try {
            await getSeriesService(db, null, albumSeriesStore.getUserId()).updateSeries(this.seriesId, {
                name: decodeEntities(this.name).trim(),
                albumQueries: this.albumQueries
            })
        } catch (error) {
            console.error('[SeriesEditModal] Update failed', error)
            this.setSave(saveFailed())
            return
        }

        toast.success(t('albums.edit.updated'))
        this.close()
        this.events.onUpdated(this.seriesId)
    }
}
