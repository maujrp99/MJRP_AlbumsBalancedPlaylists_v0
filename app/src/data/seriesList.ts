/**
 * The list of a person's series for the Albums tab (F78, REQ-12 in part): the shared
 * SeriesRepository, built with the store this side hands it, reads the series; the shared rules
 * order them (newest first, shared/seriesOrder.js, the site's default) and summarize each one
 * (shared/seriesSummary.js). Nothing here decides anything of the product: it composes the core.
 *
 * Not yet here (tasks.md, TASK-17 and TASK-20): the core's SeriesService (Ref-B), the saved copy
 * for no network («Saved earlier») and the 10-second deadline.
 */
import { SeriesRepository } from '@album-blender/shared/data/SeriesRepository.js'
import { newestFirst } from '@album-blender/shared/seriesOrder.js'
import { summarizeSeries } from '@album-blender/shared/seriesSummary.js'
import { noCache } from './noCache'
import type { AppStore } from './store'

export interface SeriesRow {
    id: string
    name: string
    albumCount: number
    covers: string[]
}

export async function listSeries(store: AppStore, userId: string): Promise<SeriesRow[]> {
    const repository = new SeriesRepository(store, noCache, userId)
    const documents = (await repository.findAll()) as { id: string; createdAt?: unknown }[]
    return newestFirst(documents).map(summarizeSeries)
}
