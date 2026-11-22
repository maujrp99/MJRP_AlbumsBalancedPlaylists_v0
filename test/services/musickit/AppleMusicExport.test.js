/**
 * F62 (UAT-200) - exporting to Apple Music: a failure is told with what was and what was not
 * created, and exporting again does not create a second copy.
 *
 * MusicKit is a double that keeps the library it was asked to build. The export service and the
 * session ledger are the real ones; the screen side (one export at a time, what the person is
 * told) is tested through handleExportToAppleMusic with the same double.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const kit = vi.hoisted(() => ({ service: null }))
vi.mock('../../../public/js/services/MusicKitService.js', () => ({ get musicKitService() { return kit.service } }))
vi.mock('../../../public/js/stores/toasts.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import { AppleMusicExportService, appleExportMessages } from '../../../public/js/services/AppleMusicExportService.js'
import { exportLedger } from '../../../public/js/services/export/exportLedger.js'
import { handleExportToAppleMusic } from '../../../public/js/controllers/playlistExports.js'
import { playlistsStore } from '../../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'
import toast from '../../../public/js/stores/toasts.js'

/** A double of MusicKit: the library it built, and switches to make it fail. */
function fakeMusicKit() {
    const fake = {
        library: [],            // [{ id, name, trackIds, folderId }]
        catalog: { One: '101', Two: '102', Three: '103', Four: '104' },
        failCreate: [],         // names whose creation fails (taken once each)
        folderId: 'folder-1',
        authorizeError: null,
        init: vi.fn(async () => { }),
        authorize: vi.fn(async () => { if (fake.authorizeError) throw fake.authorizeError }),
        createOrGetFolder: vi.fn(async () => fake.folderId),
        findTrackFromAlbum: vi.fn(async (title) => (fake.catalog[title] ? { id: fake.catalog[title] } : null)),
        createPlaylistInFolder: vi.fn(async (name, trackIds, folderId) => {
            const at = fake.failCreate.indexOf(name)
            if (at !== -1) {
                fake.failCreate.splice(at, 1)
                throw new Error('Apple Music said no')
            }
            const playlist = { id: `p.${fake.library.length + 1}`, name, trackIds, folderId }
            fake.library.push(playlist)
            return playlist
        })
    }
    return fake
}

const track = (title, extra = {}) => ({ title, artist: 'Artist', album: 'Album', ...extra })
const PLAYLISTS = [
    { name: 'Greatest Hits', title: 'Greatest Hits', tracks: [track('One'), track('Two')] },
    { name: 'Deep Cuts', title: 'Deep Cuts', tracks: [track('Three'), track('Four')] }
]
const NAMES = ['1. Mix - Greatest Hits', '2. Mix - Deep Cuts']

describe('exporting to Apple Music (F62)', () => {
    let musicKit
    const run = (playlists = PLAYLISTS) =>
        AppleMusicExportService.exportPlaylists(playlists, { seriesName: 'Road trip', batchName: 'Mix' }, { musicKit })

    beforeEach(() => {
        vi.clearAllMocks()
        exportLedger.clear()
        musicKit = fakeMusicKit()
        kit.service = musicKit
        vi.spyOn(AppleMusicExportService, 'pause').mockResolvedValue()
        vi.spyOn(console, 'error').mockImplementation(() => { })
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    describe('the report of an export', () => {
        it('names every playlist created, in the folder of the series', async () => {
            const report = await run()

            expect(report.failure).toBeNull()
            expect(report.folder).toEqual({ name: 'Road trip', created: true })
            expect(report.created).toEqual([
                { name: NAMES[0], tracks: 2, total: 2, alreadyThere: false },
                { name: NAMES[1], tracks: 2, total: 2, alreadyThere: false }
            ])
            expect(musicKit.library.map(p => [p.name, p.trackIds, p.folderId])).toEqual([
                [NAMES[0], ['101', '102'], 'folder-1'], [NAMES[1], ['103', '104'], 'folder-1']
            ])
        })

        it('says which playlist Apple Music did not create and why, and goes on to the others', async () => {
            musicKit.failCreate.push(NAMES[0])

            const report = await run()

            expect(report.failed).toEqual([{ name: NAMES[0], message: 'Apple Music said no' }])
            expect(report.created.map(p => p.name)).toEqual([NAMES[1]])
        })

        it('says which tracks were not found, and does not create a playlist with none', async () => {
            const playlists = [
                { name: 'Half', tracks: [track('One'), track('Nowhere')] },
                { name: 'Ghosts', tracks: [track('Nowhere')] }
            ]

            const report = await run(playlists)

            expect(report.created).toEqual([{ name: '1. Mix - Half', tracks: 1, total: 2, alreadyThere: false }])
            expect(report.notFound).toEqual(['Artist - Nowhere', 'Artist - Nowhere'])
            expect(report.empty).toEqual(['2. Mix - Ghosts'])
            expect(musicKit.library).toHaveLength(1)
        })

        it('uses the Apple Music id a track carries, and searches when the id is not one of the catalog', async () => {
            const playlists = [{ name: 'Mix', tracks: [track('Kept', { appleMusicId: '999' }), track('One', { appleMusicId: 'track-3' })] }]

            await run(playlists)

            expect(musicKit.library[0].trackIds).toEqual(['999', '101'])
            expect(musicKit.findTrackFromAlbum).toHaveBeenCalledTimes(1)
        })

        it('says when the folder could not be made: the playlists go to the top of the library', async () => {
            musicKit.folderId = null

            const report = await run()

            expect(report.folder).toEqual({ name: 'Road trip', created: false })
            expect(report.created).toHaveLength(2)
            expect(musicKit.library.every(p => p.folderId === null)).toBe(true)
        })

        it('stops before creating anything when the person does not authorize, and says so', async () => {
            musicKit.authorizeError = new Error('Authorization was cancelled')

            const report = await run()

            expect(report.failure).toEqual({ kind: 'authorization', message: 'Authorization was cancelled' })
            expect(report.notCreated).toEqual(NAMES)
            expect(musicKit.library).toEqual([])
        })

        it('refuses an export with nothing to export', async () => {
            await expect(run([])).rejects.toThrow('No playlists to export')
        })
    })

    describe('exporting again in the same session', () => {
        it('does not create a second copy of what was created', async () => {
            await run()

            const again = await run()

            expect(musicKit.library).toHaveLength(2)
            expect(again.created.map(p => p.alreadyThere)).toEqual([true, true])
        })

        it('after a failure creates only what was missing', async () => {
            musicKit.failCreate.push(NAMES[1])
            await run()

            const again = await run()

            expect(musicKit.library.map(p => p.name)).toEqual(NAMES)
            expect(again.created.map(p => p.alreadyThere)).toEqual([true, false])
            expect(again.failed).toEqual([])
        })

        it('creates a new playlist when its tracks changed', async () => {
            await run()

            await run([{ ...PLAYLISTS[0], tracks: [track('One')] }, PLAYLISTS[1]])

            expect(musicKit.library).toHaveLength(3)
        })
    })

    describe('what the person is told', () => {
        const told = (report) => appleExportMessages(report).map(m => `${m.type}: ${m.text}`)

        it('a clean export', async () => {
            expect(told(await run())).toEqual(['success: 2 playlists exported to Apple Music, in the folder "Road trip".'])
        })

        it('a failure in the middle: what was not created and why, and what was', async () => {
            musicKit.failCreate.push(NAMES[1])

            expect(told(await run())).toEqual([
                'error: Apple Music did not create 1 of 2 playlists: "2. Mix - Deep Cuts" (Apple Music said no). Export again to create what is missing: what was created is not created twice.',
                'success: 1 playlist exported to Apple Music, in the folder "Road trip": "1. Mix - Greatest Hits".'
            ])
        })

        it('a second export of the same playlists', async () => {
            await run()

            expect(told(await run())).toEqual(['info: 2 playlists were already exported in this session and were not created again.'])
        })

        it('tracks not found, a playlist with none and a folder that could not be made', async () => {
            musicKit.folderId = null
            const report = await run([{ name: 'Half', tracks: [track('One'), track('Nowhere')] }, { name: 'Ghosts', tracks: [track('Nowhere')] }])

            expect(told(report)).toEqual([
                'success: 1 playlist exported to Apple Music.',
                'warning: The folder "Road trip" could not be created in Apple Music: the playlists are at the top of your library.',
                'warning: No track was found in Apple Music for "2. Mix - Ghosts": not created.',
                'warning: 2 tracks were not found in Apple Music and were left out: Artist - Nowhere, Artist - Nowhere.'
            ])
        })

        it('nothing created at all', async () => {
            musicKit.authorizeError = new Error('Authorization was cancelled')
            expect(told(await run())).toEqual(['warning: Apple Music was not authorized: nothing was exported.'])

            musicKit.authorizeError = new Error('MusicKit not configured')
            expect(told(await run())).toEqual(['error: Apple Music is not set up for this site: nothing was exported.'])

            musicKit.authorizeError = new Error('network down')
            expect(told(await run())).toEqual(['error: The export to Apple Music failed before anything was created: network down.'])
        })
    })

    describe('the export button of the screen', () => {
        beforeEach(() => {
            playlistsStore.reset()
            playlistsStore.setPlaylists(PLAYLISTS, 'sA')
            playlistsStore.setBatchName('Mix')
            albumSeriesStore.setSeries([{ id: 'sA', name: 'Road trip' }])
            albumSeriesStore.setActiveSeries('sA')
        })

        it('pressed twice exports once: the second press is told the export is running', async () => {
            const first = handleExportToAppleMusic()
            const second = handleExportToAppleMusic()
            await Promise.all([first, second])

            expect(musicKit.library.map(p => p.name)).toEqual(NAMES)
            expect(toast.info).toHaveBeenCalledWith('The export to Apple Music is already running.')
        })

        it('pressed again after it ended creates nothing more and says so', async () => {
            await handleExportToAppleMusic()
            await handleExportToAppleMusic()

            expect(musicKit.library).toHaveLength(2)
            expect(toast.info).toHaveBeenCalledWith('2 playlists were already exported in this session and were not created again.', expect.any(Number))
        })

        it('tells a failure of Apple Music instead of ending in silence', async () => {
            musicKit.failCreate.push(...NAMES)

            await handleExportToAppleMusic()

            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Apple Music did not create 2 of 2 playlists'), expect.any(Number))
            expect(toast.success).not.toHaveBeenCalled()
        })
    })
})

describe('the folder given by its id (F90)', () => {
    it('is used as it is: the folder is not looked up again by its name', async () => {
        exportLedger.clear()
        vi.spyOn(AppleMusicExportService, 'pause').mockResolvedValue()
        const musicKit = fakeMusicKit()
        const report = await AppleMusicExportService.exportPlaylists(PLAYLISTS.slice(0, 1), { seriesName: 'S', batchName: 'Mix', folderName: 'Picked', folderId: 'f-42' }, { musicKit })

        expect(musicKit.createOrGetFolder).not.toHaveBeenCalled()
        expect(musicKit.library[0].folderId).toBe('f-42')
        expect(report.folder).toEqual({ name: 'Picked', created: true })
    })
})
