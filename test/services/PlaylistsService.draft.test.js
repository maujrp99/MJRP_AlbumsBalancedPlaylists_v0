/**
 * F60 (UAT-05) - playlists generated and not saved yet survive a reload of the page: the set on
 * screen is kept in the browser as a draft of the person who made it, and comes back when the
 * playlists screen of that series opens with nothing in memory.
 *
 * The browser storage is the real StorageService over the test localStorage; "reloading" is
 * emptying the store and building a new service, as a new page does.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlaylistsService } from '../../public/js/services/PlaylistsService.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { PlaylistHistoryService } from '../../public/js/services/playlists/PlaylistHistoryService.js'

const history = () => new PlaylistHistoryService()
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('PlaylistsService draft of the playlists not saved yet (UAT-05)', () => {
    let person, repository, stopWatching

    const openPage = () => {
        stopWatching?.()
        const service = new PlaylistsService({}, {}, undefined, history(), {
            playlistRepositoryFor: () => repository,
            currentUserId: () => person
        })
        stopWatching = service.watchStore()
        return service
    }
    const reload = () => {
        playlistsStore.reset() // a new page starts with nothing in memory
        return openPage()
    }
    /** What the blend screen does when it generates: it writes straight into the store. */
    const generate = (seriesId = 'sA') => {
        playlistsStore.setPlaylists([
            { name: 'Mix 1', tracks: [{ title: 'T1' }, { title: 'T2' }] },
            { name: 'Mix 2', tracks: [{ title: 'T3' }] }
        ], seriesId)
        playlistsStore.setDefaultBatchName('TheAlbumBlender Playlist 2026-11-19 16:00')
    }

    beforeEach(() => {
        person = 'owner-1'
        repository = {
            findAll: vi.fn(async () => []),
            replaceBatch: vi.fn(async (playlists) => playlists.map((p, order) => ({ ...p, order, id: `id-${order}` })))
        }
        playlistsStore.reset()
        openPage()
    })

    it('brings the generated playlists back after a reload', async () => {
        generate()
        await flush()

        const service = reload()
        const restored = service.restoreDraft({ seriesId: 'sA' })

        expect(restored).toBe(true)
        expect(playlistsStore.getPlaylists().map(p => p.name)).toEqual(['Mix 1', 'Mix 2'])
        expect(playlistsStore.getSeriesId()).toBe('sA')
        expect(playlistsStore.getState()).toMatchObject({
            mode: 'CREATING', defaultBatchName: 'TheAlbumBlender Playlist 2026-11-19 16:00', isSynchronized: false
        })
    })

    it('brings back the edits made to them too, still counted as not saved', async () => {
        generate()
        const service = openPage()
        service.removeTrack(0, 0)
        await flush()

        const afterReload = reload()
        afterReload.restoreDraft({ seriesId: 'sA' })

        expect(playlistsStore.getPlaylists()[0].tracks.map(t => t.title)).toEqual(['T2'])
        expect(afterReload.hasUnsavedChanges()).toBe(true)
    })

    it('restores when the address does not say which series', async () => {
        generate()
        await flush()

        expect(reload().restoreDraft({ seriesId: null })).toBe(true)
        expect(playlistsStore.getSeriesId()).toBe('sA')
    })

    it('does not bring the draft of one series into the screen of another', async () => {
        generate('sA')
        await flush()

        expect(reload().restoreDraft({ seriesId: 'sB' })).toBe(false)
        expect(playlistsStore.getPlaylists()).toEqual([])
    })

    it('never shows the draft of one person to another', async () => {
        generate()
        await flush()

        person = 'anon-2' // signed out: the anonymous account that follows
        expect(reload().restoreDraft({ seriesId: 'sA' })).toBe(false)
        expect(playlistsStore.getPlaylists()).toEqual([])

        person = 'owner-1' // the owner signs in again: the draft is still theirs
        expect(reload().restoreDraft({ seriesId: 'sA' })).toBe(true)
    })

    it('has no draft once the playlists are saved: they are in the database now', async () => {
        generate()
        await flush()
        const service = openPage()

        await service.saveCurrentBatch({ userId: 'owner-1', batchName: 'Mix' })
        await flush()

        expect(reload().restoreDraft({ seriesId: 'sA' })).toBe(false)
    })

    it('keeps one draft: a saved batch opened for editing takes its place and is not a draft itself', async () => {
        generate()
        await flush()
        const service = openPage()

        service.setEditMode('Rock', 'sA', null)
        playlistsStore.setPlaylists([{ id: 'p1', name: 'Rock 1', batchName: 'Rock', tracks: [] }], 'sA')
        await flush()

        expect(reload().restoreDraft({ seriesId: 'sA' })).toBe(false)
    })

    it('does not replace what is already on screen', async () => {
        generate()
        await flush()
        const service = reload()
        playlistsStore.setPlaylists([{ name: 'On screen', tracks: [] }], 'sA')

        expect(service.restoreDraft({ seriesId: 'sA' })).toBe(false)
        expect(playlistsStore.getPlaylists().map(p => p.name)).toEqual(['On screen'])
    })

    it('ignores what an older version of the app left in the browser (no owner written in it)', () => {
        localStorage.setItem('mjrp_current_playlists', JSON.stringify({
            playlists: [{ name: 'Old', tracks: [] }], seriesId: 'sA', mode: 'CREATING'
        }))

        expect(reload().restoreDraft({ seriesId: 'sA' })).toBe(false)
    })

    it('an empty screen does not erase the draft (the page starts empty before the draft is read)', async () => {
        generate()
        await flush()

        const service = reload()
        service.setCreateMode() // what the screen does on opening
        await flush()

        expect(service.restoreDraft({ seriesId: 'sA' })).toBe(true)
    })
})
