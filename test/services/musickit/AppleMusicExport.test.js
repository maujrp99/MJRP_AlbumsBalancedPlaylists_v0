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

import { AppleMusicExportService } from '../../../public/js/services/AppleMusicExportService.js'
import { AppleMusicRefusedError, AppleMusicAuthorizationError } from '../../../public/js/services/musickit/musicKitErrors.js'
import { appleSummaryNotice } from '../../../public/js/i18n/exportTexts.js'
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
        searchFails: {},        // title -> the error its search throws (F98)
        folderError: null,
        init: vi.fn(async () => { }),
        authorize: vi.fn(async () => { if (fake.authorizeError) throw fake.authorizeError }),
        createOrGetFolder: vi.fn(async () => { if (fake.folderError) throw fake.folderError; return fake.folderId }),
        findTrackFromAlbum: vi.fn(async (title) => {
            if (fake.searchFails[title]) throw fake.searchFails[title]
            return fake.catalog[title] ? { id: fake.catalog[title] } : null
        }),
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

            expect(report.failed).toEqual([{ name: NAMES[0], detail: 'Apple Music said no' }])
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

            expect(report.failure).toEqual({ kind: 'authorization' })
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

    describe('a search that failed is not a track that was not found (F98, UAT-307, REQ-01)', () => {
        const down = () => Object.assign(new Error('Search unavailable'), { status: 500 })

        it('a 500 of the search: the track is counted as not checked, apart, and the rest is exported', async () => {
            musicKit.searchFails.Two = down()

            const report = await run()

            expect(report.unchecked).toBe(1)
            expect(report.uncheckedTracks).toEqual(['Artist - Two'])
            expect(report.notFound).toEqual([])
            expect(report.created.map(p => [p.name, p.tracks, p.total])).toEqual([[NAMES[0], 1, 2], [NAMES[1], 2, 2]])
            expect(report.failure).toBeNull()
        })

        it('the network down on one search: not checked, never not found', async () => {
            musicKit.searchFails.Three = new TypeError('Failed to fetch')

            const report = await run()

            expect(report.uncheckedTracks).toEqual(['Artist - Three'])
            expect(report.notFound).toEqual([])
        })

        it('a track is «not found» only when Apple Music answered and had none', async () => {
            const report = await run([{ name: 'Half', tracks: [track('One'), track('Nowhere')] }])

            expect(report.notFound).toEqual(['Artist - Nowhere'])
            expect(report.unchecked).toBe(0)
            expect(report.uncheckedTracks).toEqual([])
        })

        it('a playlist none of whose tracks could be checked is «not created», never «no track found»', async () => {
            musicKit.searchFails.Three = down()
            musicKit.searchFails.Four = down()

            const report = await run()

            expect(report.empty).toEqual([])
            expect(report.notCreated).toEqual([NAMES[1]])
            expect(report.created.map(p => p.name)).toEqual([NAMES[0]])
            expect(report.failure).toBeNull()
        })

        it('when nothing could be checked the export says that, not that nothing was found (REQ-03)', async () => {
            for (const title of ['One', 'Two', 'Three', 'Four']) musicKit.searchFails[title] = down()

            const report = await run()

            expect(report.failure).toEqual({ kind: 'unchecked' })
            expect(report.unchecked).toBe(4)
            expect(report.notFound).toEqual([])
            expect(report.empty).toEqual([])
            expect(report.notCreated).toEqual(NAMES)
            expect(musicKit.library).toEqual([])
        })

        it('when Apple Music answered every search and had none, that is «not found», with its own kind', async () => {
            const report = await run([{ name: 'Ghosts', tracks: [track('Nowhere'), track('Nobody')] }])

            expect(report.failure).toEqual({ kind: 'not-found' })
            expect(report.notFound).toEqual(['Artist - Nowhere', 'Artist - Nobody'])
            expect(report.empty).toEqual(['1. Mix - Ghosts'])
            expect(report.unchecked).toBe(0)
        })
    })

    describe('when Apple Music refuses the person (F98, REQ-02)', () => {
        const refusal = () => Object.assign(new Error('Forbidden'), { status: 403 })

        it('a 403 on a search stops the export and is a refusal: never «not found»', async () => {
            musicKit.searchFails.One = refusal()

            const report = await run()

            expect(report.failure).toEqual({ kind: 'refused' })
            expect(report.notFound).toEqual([])
            expect(report.empty).toEqual([])
            expect(report.notCreated).toEqual(NAMES)
            expect(musicKit.findTrackFromAlbum).toHaveBeenCalledTimes(1)
            expect(musicKit.library).toEqual([])
        })

        it('the refusal with its name, thrown by the catalogue, is the same refusal', async () => {
            musicKit.searchFails.Three = new AppleMusicRefusedError('Forbidden')

            const report = await run()

            expect(report.failure).toEqual({ kind: 'refused' })
            expect(report.created.map(p => p.name)).toEqual([NAMES[0]])
            expect(report.notCreated).toEqual([NAMES[1]])
        })

        it('a 403 when the playlist is created (no subscription) stops the export: the others are not tried', async () => {
            musicKit.createPlaylistInFolder.mockRejectedValue(refusal())

            const report = await run()

            expect(report.failure).toEqual({ kind: 'refused' })
            expect(report.failed).toEqual([])
            expect(report.notCreated).toEqual(NAMES)
            expect(musicKit.createPlaylistInFolder).toHaveBeenCalledTimes(1)
        })

        it('a refusal while the folder is read stops it before any search', async () => {
            musicKit.folderError = new AppleMusicRefusedError('Forbidden')

            const report = await run()

            expect(report.failure).toEqual({ kind: 'refused' })
            expect(report.notCreated).toEqual(NAMES)
            expect(musicKit.findTrackFromAlbum).not.toHaveBeenCalled()
        })

        it('the authorization not given has its own kind, whatever words the error has', async () => {
            musicKit.authorizeError = new AppleMusicAuthorizationError('anything')

            expect((await run()).failure).toEqual({ kind: 'authorization' })
        })

        it('the other ways of not starting: not set up, not reached, and what Apple Music said', async () => {
            musicKit.authorizeError = new Error('MusicKit not configured')
            expect((await run()).failure).toEqual({ kind: 'not-configured' })

            musicKit.authorizeError = Object.assign(new Error('MusicKit took too long'), { name: 'DeadlineError' })
            expect((await run()).failure).toEqual({ kind: 'unreachable' })

            musicKit.authorizeError = new Error('network down')
            expect((await run()).failure).toEqual({ kind: 'error', detail: 'network down' })
        })
    })

    describe('the export writes no sentence of its own (F98, UAT-308, REQ-06)', () => {
        it('the progress is told in steps and names, for the screen to say in its language', async () => {
            const steps = []
            await AppleMusicExportService.exportPlaylists(PLAYLISTS, { seriesName: 'Road trip', batchName: 'Mix' }, { musicKit, onProgress: (step) => steps.push(step) })

            expect(steps).toEqual([
                { step: 'connecting' }, { step: 'authorizing' }, { step: 'folder' },
                { step: 'exporting', name: NAMES[0] }, { step: 'exporting', name: NAMES[1] }
            ])
        })

        it('a playlist Apple Music did not create keeps what Apple Music said, or nothing: never words of the app', async () => {
            musicKit.createPlaylistInFolder.mockRejectedValueOnce({})

            const report = await run()

            expect(report.failed).toEqual([{ name: NAMES[0], detail: null }])
        })
    })

    describe('what the person is told when no window is there to show the report', () => {
        const told = async (report) => { const notice = appleSummaryNotice(await report); return `${notice.type}: ${notice.text}` }

        it('a clean export', async () => {
            expect(await told(run())).toBe('success: 2 playlists exported to Apple Music.')
        })

        it('something left out: how many were created, as a warning', async () => {
            musicKit.failCreate.push(NAMES[1])
            expect(await told(run())).toBe('warning: The export to Apple Music ended with something left out: 1 of 2 playlists created.')
        })

        it('nothing created: why', async () => {
            musicKit.authorizeError = new Error('Authorization was cancelled')
            expect(await told(run())).toBe('warning: Apple Music was not authorized, so nothing was exported. Try again and allow the access in the Apple Music window.')

            musicKit.authorizeError = null
            musicKit.searchFails.One = Object.assign(new Error('Forbidden'), { status: 403 })
            expect(await told(run())).toMatch(/^error: Apple Music did not allow this for your account\. This is not about your tracks\. Check that your Apple Music subscription is active\./)
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

            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Apple Music did not create the playlists'), expect.any(Number))
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
