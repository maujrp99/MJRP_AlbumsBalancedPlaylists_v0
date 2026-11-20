/**
 * The demo mode's data (F78 skeleton): three series of public catalog albums, the same albums the
 * repository's fixtures use (test/fixtures/trackIdentity/measuredAlbums.json, public catalog pages;
 * no data of any person). Stored at the path the shared SeriesRepository reads, in the shape the
 * site writes (docs/specs/data-model.md, Series: `name`, `albumQueries`, `createdAt`).
 *
 * The fixtures keep no cover, so the demo shows the list's cover placeholder; a series whose queries
 * keep `coverUrl` (as the site writes since F55) shows its covers.
 */
import type { MemoryStore } from '../data/memoryStore'
import { timestampOf } from '../data/memoryStore'

export const DEMO_USER_ID = 'demo-user'

const DAY = 24 * 60 * 60 * 1000
const BASE = Date.UTC(2026, 10, 1) // 2026-11-01

export const DEMO_SERIES = [
    {
        id: 'demo-prog',
        name: 'Prog and art rock',
        createdAt: BASE,
        albumQueries: [
            { artist: 'King Crimson', title: 'In the Court of the Crimson King (Expanded Edition)' },
            { artist: 'King Crimson', title: "Larks' Tongues In Aspic (Expanded Edition)" }
        ]
    },
    {
        id: 'demo-live',
        name: 'Live records',
        createdAt: BASE + 10 * DAY,
        albumQueries: ['James Brown - Live At The Apollo (1962)', 'Free - Free Live!', 'The Who - Who\'s Next (Bonus Track Version)']
    },
    {
        id: 'demo-manchester',
        name: 'Manchester',
        createdAt: BASE + 15 * DAY,
        albumQueries: [
            { artist: 'Joy Division', title: 'Substance 1977-1980' },
            { artist: 'New Order', title: 'Substance' }
        ]
    }
] as const

/** The path of a person's series, as shared/data/SeriesRepository.js builds it. */
export const seriesPathOf = (userId: string) => `artifacts/mjrp-albums/users/${userId}/curator/data/series`

export function seedDemo(store: MemoryStore, userId: string = DEMO_USER_ID): void {
    for (const { id, createdAt, ...series } of DEMO_SERIES) {
        store.seed(`${seriesPathOf(userId)}/${id}`, { ...series, albumQueries: [...series.albumQueries], createdAt: timestampOf(createdAt), _schemaVersion: 1 })
    }
}
