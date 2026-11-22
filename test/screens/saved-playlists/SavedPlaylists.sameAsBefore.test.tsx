/**
 * F83 wave 1 (REQ-02, REQ-05; TASK-13, TASK-30): the saved playlists screen in React draws what the hand-made one drew.
 *
 * F83 sync 2: the pages are the ones of `main` after F90 (the export on each playlist and on the batch, the phone's «Export» and the window it
 * opens), kept in test/fixtures/savedPlaylistsFromMain.json, written by reports/evidence/F83/sync-2/capture-saved-playlists-from-main.test.js.
 *
 * The proof: for every scenario of test/support/savedPlaylistsScenarios.js (the screen waiting, failed, arriving, closed and
 * opened on the computer, searched and filtered, the window of a playlist, and on the phone the list, the sheets and the filter
 * sheet) the page after each step equals what the old screen drew at the same step. The old screen's pages are kept in
 * test/fixtures/savedPlaylistsBeforeF83.json: written once by the hand-made screen before it was deleted
 * (reports/evidence/F83/wave-1/capture-before.test.js). They are compared element by element, attribute by attribute (the
 * classes as a set, the style as the browser writes it, an icon by the fingerprint of its shapes, text with white space
 * collapsed): only the white space between tags that no browser draws is not compared, as in wave 0.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/services/playlists/savedPlaylistsReading.js', () => ({ savedPlaylistsReader: {}, savedPlaylistsStore: {} }))
vi.mock('../../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../../support/exportStandIns.js')).musicKitService }))
vi.mock('../../../public/js/services/DialogService.js', () => ({ dialogService: { confirm: vi.fn(() => Promise.resolve(false)) } }))

import { SavedPlaylists } from '../../../public/js/screens/saved-playlists/SavedPlaylists'
import { SavedPlaylistsController } from '../../../public/js/controllers/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../../public/js/stores/savedPlaylists.js'
import { renderScreen } from '../../support/renderScreen'
import { SCENARIOS, normalize, asPhone, quietTheRouter } from '../../support/savedPlaylistsScenarios.js'
import before from '../../fixtures/savedPlaylistsFromMain.json'

const captured = before as Record<string, Record<string, string | null>>

type Field = HTMLInputElement | HTMLSelectElement
const field = (selector: string): Field => document.querySelector(selector) as Field

/** Plays a scenario on the new screen and gives what it wrote down. */
async function play(scenario: (typeof SCENARIOS)[number]): Promise<Record<string, string | null>> {
    asPhone(Boolean(scenario.phone))
    quietTheRouter()
    const store = new SavedPlaylistsStore()
    const reader = { load: vi.fn(() => new Promise(() => {})), refreshSeries: vi.fn(() => Promise.resolve()), removeBatch: vi.fn(), removeAll: vi.fn() }
    const controller = new SavedPlaylistsController({ reader, store })
    const rendered = await renderScreen(SavedPlaylists, { controller }, { screen: 'saved_playlists' })
    const snaps: Record<string, string | null> = {}
    const h = {
        app: rendered.app,
        store,
        snap: (label: string, selector?: string) => { snaps[label] = normalize(selector ? document.querySelector(selector) : rendered.app) },
        publish: (change: () => void) => rendered.act(() => { change(); store.flush() }),
        click: (selector: string) => rendered.act(() => { (document.querySelector(selector) as HTMLElement).click() }),
        key: (key: string) => rendered.act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) }),
        note: (label: string, value: unknown) => { snaps[label] = JSON.stringify(value) },
        type: (selector: string, value: string) => rendered.act(() => {
            field(selector).value = value
            field(selector).dispatchEvent(new Event('input', { bubbles: true }))
        }),
        change: (selector: string, value: string) => rendered.act(() => {
            field(selector).value = value
            field(selector).dispatchEvent(new Event('change', { bubbles: true }))
        })
    }
    await scenario.run(h)
    await rendered.leave()
    return snaps
}

describe('the saved playlists screen in React draws what the hand-made one drew', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SCENARIOS.map(s => `${s.phone ? 'phone' : 'computer'} · ${s.name}`).sort())
    })

    for (const scenario of SCENARIOS) {
        const key = `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`
        it(key, async () => {
            const snaps = await play(scenario)
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                expect(page, `${key} · ${label}`).toBe(captured[key][label])
            }
        })
    }
})
