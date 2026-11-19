/**
 * F55, slice 1 - counting what is wrong today, read-only: for each album a series asks for, is the
 * album the app has for it the album asked for? The count writes nothing: not to the series, not
 * to the cache, not to the store.
 */
import { describe, it, expect, vi } from 'vitest'
import { auditAlbumIdentity, AuditVerdict } from '../../../public/js/services/albums/albumIdentityAudit.js'
import { AlbumCacheAdapter, ALBUM_RECORD_PREFIX } from '../../../public/js/services/albums/adapters/AlbumCacheAdapter.js'
import { CacheManager } from '../../../public/js/cache/CacheManager.js'

const STP = 'Stone Temple Pilots'
const series = () => [
    {
        id: 's1',
        name: 'Grunge Rock - Classics',
        albumQueries: [
            { artist: STP, title: 'Core', year: 1992, appleMusicId: 'apple-shangri' },
            { artist: 'Pearl Jam', title: 'Ten', appleMusicId: 'apple-ten' },
            'Nirvana - Nevermind',
            'Soundgarden - Superunknown'
        ]
    },
    { id: 's2', name: 'Empty', albumQueries: [] },
    { id: 's3', name: 'No list' }
]
const SHOWN = {
    'Stone Temple Pilots - Core': { artist: STP, title: 'Shangri-La Dee Da', year: 2001 },
    'Pearl Jam - Ten': { artist: 'Pearl Jam', title: 'Ten (Deluxe Edition)', year: 2009 },
    'Nirvana - Nevermind': { artist: 'Nirvana', title: 'Nevermind', year: 1991 }
}
const labelOf = (query) => (typeof query === 'string' ? query : `${query.artist} - ${query.title}`)
const shownFor = async (query) => SHOWN[labelOf(query)] || null

describe('auditAlbumIdentity', () => {
    it('gives one row per album asked for: series, asked, shown, verdict', async () => {
        const { rows } = await auditAlbumIdentity({ series: series(), shownFor })

        expect(rows).toEqual([
            { series: 'Grunge Rock - Classics', asked: 'Stone Temple Pilots - Core', shown: 'Stone Temple Pilots - Shangri-La Dee Da', verdict: AuditVerdict.DIFFERENT, reason: 'title-mismatch', storedAppleId: 'apple-shangri' },
            { series: 'Grunge Rock - Classics', asked: 'Pearl Jam - Ten', shown: 'Pearl Jam - Ten (Deluxe Edition)', verdict: AuditVerdict.SAME, reason: 'edition-of-title', storedAppleId: 'apple-ten' },
            { series: 'Grunge Rock - Classics', asked: 'Nirvana - Nevermind', shown: 'Nirvana - Nevermind', verdict: AuditVerdict.SAME, reason: 'exact-title', storedAppleId: null },
            { series: 'Grunge Rock - Classics', asked: 'Soundgarden - Superunknown', shown: null, verdict: AuditVerdict.NOT_LOADED, reason: 'nothing-kept-for-this-album', storedAppleId: null }
        ])
    })

    it('counts: how many are asked for, the same, different, and with nothing kept to compare', async () => {
        const { summary } = await auditAlbumIdentity({ series: series(), shownFor })

        expect(summary).toEqual({ series: 3, asked: 4, same: 2, different: 1, notLoaded: 1 })
    })

    it('hands each query and its series to the reader, and survives a reader that fails for one album', async () => {
        const reader = vi.fn(async (query) => { if (query === 'Nirvana - Nevermind') throw new Error('IndexedDB closed'); return shownFor(query) })
        const list = series()

        const { rows, summary } = await auditAlbumIdentity({ series: list, shownFor: reader })

        expect(reader).toHaveBeenCalledWith(list[0].albumQueries[0], list[0])
        expect(rows[2]).toMatchObject({ verdict: AuditVerdict.NOT_LOADED, reason: 'could-not-be-read: IndexedDB closed' })
        expect(summary).toMatchObject({ same: 1, different: 1, notLoaded: 2 })
    })

    it('writes nothing: the series and their queries leave as they came', async () => {
        const list = series()
        const frozen = JSON.parse(JSON.stringify(list))
        list.forEach(one => { Object.freeze(one); Object.freeze(one.albumQueries); (one.albumQueries || []).forEach(Object.freeze) })

        await auditAlbumIdentity({ series: list, shownFor })

        expect(JSON.parse(JSON.stringify(list))).toEqual(frozen)
    })

    it('no series: an empty table', async () => {
        expect(await auditAlbumIdentity({ series: null, shownFor })).toEqual({ rows: [], summary: { series: 0, asked: 0, same: 0, different: 0, notLoaded: 0 } })
    })
})

describe('reading the kept album without touching it', () => {
    const record = { album: { title: 'Shangri-La Dee Da', artist: STP, year: 2001, tracks: [] }, enrichment: {} }

    it('AlbumCacheAdapter.peek reads the record of the query through cache.peek only', async () => {
        const cache = { peek: vi.fn(async () => record), get: vi.fn(), set: vi.fn(), invalidate: vi.fn() }
        const adapter = new AlbumCacheAdapter({ cache, createAlbum: vi.fn() })

        expect(await adapter.peek({ artist: STP, title: 'Core' })).toEqual({ artist: STP, title: 'Shangri-La Dee Da', year: 2001 })
        expect(cache.peek).toHaveBeenCalledWith(`${ALBUM_RECORD_PREFIX}stone temple pilots - core`)
        expect(cache.get).not.toHaveBeenCalled()
        expect(cache.set).not.toHaveBeenCalled()
        expect(cache.invalidate).not.toHaveBeenCalled()
        expect(adapter.createAlbum).not.toHaveBeenCalled()
    })

    it('AlbumCacheAdapter.peek answers null when nothing is kept', async () => {
        const adapter = new AlbumCacheAdapter({ cache: { peek: vi.fn(async () => null) }, createAlbum: vi.fn() })

        expect(await adapter.peek('Artist - Album')).toBeNull()
    })

    it('CacheManager.peek reads memory, then IndexedDB, and copies nothing from one to the other', async () => {
        const manager = new CacheManager()
        manager.initPromise = Promise.resolve()
        manager.l2Available = true
        manager.l2 = { peek: vi.fn(async (key) => (key === 'on-disk' ? { n: 2 } : null)), get: vi.fn(), set: vi.fn(), invalidate: vi.fn() }
        await manager.l1.set('in-memory', { n: 1 })
        const l1Set = vi.spyOn(manager.l1, 'set')

        expect(await manager.peek('in-memory')).toEqual({ n: 1 })
        expect(await manager.peek('on-disk')).toEqual({ n: 2 })
        expect(await manager.peek('nowhere')).toBeNull()
        expect(l1Set).not.toHaveBeenCalled()
        expect(manager.l2.get).not.toHaveBeenCalled()
        expect(manager.l2.set).not.toHaveBeenCalled()
        expect(manager.l2.invalidate).not.toHaveBeenCalled()
    })

    it('MemoryCache.peek does not remove an entry that has expired', async () => {
        const manager = new CacheManager()
        await manager.l1.set('old', { n: 1 }, -1)

        expect(await manager.l1.peek('old')).toBeNull()
        expect(manager.l1.store.has('old')).toBe(true)
    })
})
