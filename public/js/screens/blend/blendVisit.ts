/**
 * blendVisit - one visit to the Blend screen: the person's series, the covers of each, and the generation that may be running (F83 wave 7b; what the
 * hand-made selector kept in itself: `series`, `isLoading`, `thumbnailCache`, and what the view kept: the controller of the leaving).
 *
 * It is made by the route and started in `prepare`, never in an effect of the screen: the strict mode runs an effect twice, and this asks the network
 * (the series of the person, once; up to three covers of each series) and listens to nothing. The read is NOT waited for by the route: the screen
 * draws at once and shows «loading» until it is done, as the hand-made screen did. The screen listens to the visit (`useSyncExternalStore`) and reads
 * the rest from it when it draws; a cover that arrives tells the screen to draw again, and nothing else.
 *
 * The series are a photo taken after the read: a series made elsewhere during the visit shows in the next visit (kept as it was).
 */
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { getSeriesService } from '../../services/SeriesService.js'
import { optimizedAlbumLoader } from '../../services/OptimizedAlbumLoader.js'
import { COVERS_SHOWN, coverAskOf, queriesShown } from '../../models/seriesCovers.js'
import type { Series } from './types'

export class BlendVisit {
    series: Series[] = []
    loading = false
    /** The series of the address (`?seriesId=`), found when the read ends: it comes chosen. */
    fromAddress: Series | null = null
    /** The list scrolls: a series chosen by the address may be below what shows. Once. */
    reveal = false
    private entity = 'albums'
    private readonly covers = new Map<string, Array<string | null>>()
    private readonly listeners = new Set<() => void>()
    private version = 0
    private left = false
    private generation: AbortController | null = null

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    getVersion = (): number => this.version

    private tell(): void {
        if (this.left) return
        this.version += 1
        this.listeners.forEach(listener => listener())
    }

    /** Begins the read of the series (the route does not wait for it). */
    start(seriesId?: string): void {
        void this.read().then(() => {
            if (this.left) return
            const wanted = seriesId ? this.series.find(series => series.id === seriesId) : null
            if (wanted) {
                this.fromAddress = wanted
                this.reveal = true
                this.tell()
            }
        })
    }

    /** A kind of thing to blend was chosen (only «albums» can be today): the series are read again. */
    setEntity(entity: string): void {
        this.entity = entity
        void this.read()
    }

    private async read(): Promise<void> {
        this.loading = true
        this.tell()
        try {
            if (this.entity === 'albums') {
                const db = albumSeriesStore.getDb()
                if (db) await getSeriesService(db, null, albumSeriesStore.getUserId()).loadFromFirestore()
                this.series = albumSeriesStore.getSeries()
            } else {
                this.series = [] // the other kinds are not made yet
            }
        } catch (error) {
            console.error('[Blend] Error loading series:', error)
            this.series = []
        }
        this.loading = false
        this.tell()
        this.preloadCovers() // asked without waiting: the screen draws each series as its covers come
    }

    private preloadCovers(): void {
        for (const series of this.series) {
            if (!this.covers.has(series.id)) void this.loadCovers(series).then(() => this.tell())
        }
    }

    /** The covers of one series, as the list asks them (the first ones that come, one after the other). */
    private async loadCovers(series: Series): Promise<void> {
        const urls: Array<string | null> = []
        for (const query of queriesShown(series)) {
            const ask = coverAskOf(query)
            let url = ask.url
            if (!url && ask.find) {
                try {
                    const found = await optimizedAlbumLoader.findAlbum(ask.find.artist, ask.find.album)
                    if (found) url = optimizedAlbumLoader.getArtworkUrl(found, 100)
                } catch {
                    console.debug(`[Blend] Could not find cover for: ${ask.find.artist} - ${ask.find.album}`)
                }
            }
            urls.push(url)
        }
        this.covers.set(series.id, urls)
    }

    /** Up to `max` covers of a series: the ones that came, or a place for each (null) while they are on the way. */
    coversOf(series: Series, max = COVERS_SHOWN): Array<string | null> {
        const known = this.covers.get(series.id)
        if (known) return known.slice(0, max)
        return new Array<string | null>(Math.min((series.albumQueries || []).length, max)).fill(null)
    }

    /** A generation begins: the controller of the leaving is a new one, so that leaving drops the albums it waits for. */
    beginGeneration(): AbortSignal {
        this.generation = new AbortController()
        return this.generation.signal
    }

    /** Leaving the screen drops the albums it was waiting for, and nothing is drawn any more. */
    dispose(): void {
        this.left = true
        this.generation?.abort()
        this.listeners.clear()
    }
}
