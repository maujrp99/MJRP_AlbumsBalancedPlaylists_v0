/**
 * F83 wave 8a - the recording of EVERY call the Apple Music export makes to MusicKit (and what it tells the person), the golden the
 * move of the export modules has to leave identical.
 *
 * The real chain runs: the exports (controllers/playlistExportEntries.js, then controllers/playlistExports.js), AppleMusicExportService,
 * MusicKitService, MusicKitAuth/Catalog/Library and the session ledger. Only the SDK is a stand-in (test/support/musicKitRecorder.js:
 * `window.MusicKit` and the token `fetch`), plus the toast and the pause between two creations. Every call becomes one line of ONE
 * ordered log: the token request, `configure`, `getInstance`, `authorize`, each `api.music(method, path, params, body)`, each pause,
 * each progress text, each toast, each file handed to the browser.
 *
 * The golden (test/fixtures/exportMusicKitRecording.json) was recorded ONCE, before the modules moved (RECORD_EXPORT=1), and is never
 * recorded again: after the move this test compares to it. The one line that changes with the move is `loadExports`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { installMusicKitRecorder } from '../../support/musicKitRecorder.js'
import { exportRecordingScenarios, playlistsOf } from '../../support/exportRecordingScenarios.js'

const GOLDEN = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../fixtures/exportMusicKitRecording.json')
const RECORDING = process.env.RECORD_EXPORT === '1'

/** THE seam the move changes: where the export functions are asked for. */
const loadExports = () => import('../../../public/js/controllers/playlistExportEntries.js')

const log = vi.hoisted(() => ({ events: [] }))
vi.mock('../../../public/js/components/Toast.js', () => {
    const say = (type) => (text, ms) => log.events.push(['toast', type, text, ms === undefined ? null : ms])
    const toast = { info: say('info'), success: say('success'), error: say('error'), warning: say('warning') }
    return { default: toast, toast }
})

const FROM_SCREEN = playlistsOf([{ title: 'Greatest Hits', tracks: ['One', 'Two'] }, { title: 'Deep Cuts', tracks: ['Three', 'Four'] }])

/** The file the browser was handed: its name, and the text it holds. */
function captureDownloads() {
    const blobs = new Map()
    let n = 0
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    const originalClick = HTMLAnchorElement.prototype.click
    URL.createObjectURL = (blob) => { const url = `blob:stand-in/${++n}`; blobs.set(url, blob); return url }
    URL.revokeObjectURL = () => { }
    HTMLAnchorElement.prototype.click = function () {
        const blob = blobs.get(this.href)
        const reader = new FileReader()
        const index = log.events.push(['download', this.download, 'pending']) - 1
        reader.onload = () => { log.events[index] = ['download', log.events[index][1], String(reader.result)] }
        reader.readAsText(blob)
        log.reading = new Promise(resolve => { reader.onloadend = resolve })
    }
    return () => { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; HTMLAnchorElement.prototype.click = originalClick }
}

async function play(scenario) {
    log.events.length = 0
    log.reading = null
    vi.resetModules()
    const realFetch = window.fetch
    installMusicKitRecorder(window, log.events, scenario.behavior)
    const restoreDownloads = captureDownloads()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-22T12:00:00Z'))
    try {
        const exportsModule = await loadExports()
        const { AppleMusicExportService } = await import('../../../public/js/services/AppleMusicExportService.js')
        const { playlistsStore } = await import('../../../public/js/stores/playlists.js')
        const { albumSeriesStore } = await import('../../../public/js/stores/albumSeries.js')
        AppleMusicExportService.pause = async (ms) => { log.events.push(['pause', ms]) }

        const optionsOf = (given) => {
            if (!given.fromScreen) return { ...given, playlists: playlistsOf(given.playlists) }
            playlistsStore.reset()
            playlistsStore.setPlaylists(FROM_SCREEN, 'sA')
            playlistsStore.setBatchName('Mix')
            albumSeriesStore.setSeries([{ id: 'sA', name: 'Road trip' }])
            albumSeriesStore.setActiveSeries('sA')
            return {}
        }
        const progress = (text) => log.events.push(['progress', text])
        let last = null

        for (const [index, step] of scenario.steps.entries()) {
            log.events.push(['step', index + 1])
            if (step.apple) { last = step.apple; await exportsModule.exportToAppleMusic(progress, optionsOf(step.apple)) }
            else if (step.again) await exportsModule.exportToAppleMusic(progress, optionsOf(last))
            else if (step.twice) { const options = optionsOf(step.twice); await Promise.all([exportsModule.exportToAppleMusic(progress, options), exportsModule.exportToAppleMusic(progress, options)]) }
            else if (step.folders) {
                try { log.events.push(['folders', await exportsModule.listAppleFolders()]) } catch (error) { log.events.push(['folders failed', error.message]) }
            } else if (step.json) {
                await exportsModule.exportJson(step.json.fromScreen ? (optionsOf(step.json), {}) : { ...step.json, playlists: playlistsOf(step.json.playlists) })
                await log.reading
            }
        }
        return JSON.parse(JSON.stringify(log.events))
    } finally {
        vi.useRealTimers()
        restoreDownloads()
        window.fetch = realFetch
        delete window.MusicKit
    }
}

const golden = RECORDING ? {} : JSON.parse(fs.readFileSync(GOLDEN, 'utf8'))

describe('the MusicKit calls of the exports, in order (the golden of the move)', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'error').mockImplementation(() => { })
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })
    afterEach(() => vi.restoreAllMocks())

    for (const scenario of exportRecordingScenarios) {
        it(scenario.name, async () => {
            const events = await play(scenario)
            if (RECORDING) { golden[scenario.name] = events; return }
            expect(events).toEqual(golden[scenario.name])
        })
    }

    it('every scenario has a recording and none is left over', () => {
        if (RECORDING) return
        expect(Object.keys(golden).sort()).toEqual(exportRecordingScenarios.map(scenario => scenario.name).sort())
    })

    it.skipIf(!RECORDING)('writes the golden (RECORD_EXPORT=1)', () => {
        fs.writeFileSync(GOLDEN, `${JSON.stringify(golden, null, 1)}\n`)
    })
})
