/**
 * F83 sync 2 (F90, TASK-08): the export window in React draws what the hand-made one on `main` drew, and acts the same.
 *
 * The proof: for every scenario of test/support/exportWindowScenarios.js (the three destinations, the folder step reading, with folders,
 * with none, unreadable, a new folder, the remembered choice, the progress of the export, Back, Spotify and the file, Escape, the backdrop,
 * Tab, and on the phone the sheet) the page after each step, the focus, what the services were asked and what was remembered equal what
 * the hand-made window gave at the same step. The pages are kept in test/fixtures/exportWindowFromMain.json, written once by the
 * hand-made window on `main` (reports/evidence/F83/sync-2/capture-export-from-main.test.js). They are compared element by element,
 * attribute by attribute; a field is compared by its state (checked, typed), not by how each side wrote its attribute.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'

const state = vi.hoisted(() => ({ phone: false }))
vi.mock('../../public/js/utils/isPhone.js', () => ({ isPhone: () => state.phone, onPhoneChange: () => () => { } }))
vi.mock('../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../support/exportStandIns.js')).musicKitService }))
vi.mock('../../public/js/services/AppleMusicExportService.js', async () => ({ AppleMusicExportService: (await import('../support/exportStandIns.js')).appleExportService, appleExportMessages: () => [] }))
vi.mock('../../public/js/components/SpotifyExportModal.js', async () => {
    const m = await import('../support/exportStandIns.js')
    return { showSpotifyExportModal: (arg: { playlists: Array<{ name: string }>; seriesName: string } | undefined) => m.stand.calls.push(['spotifyWindow', arg ? arg.playlists.map(item => item.name) : null, arg?.seriesName ?? null]) }
})
vi.mock('../../public/js/controllers/playlistExports.js', async (importOriginal) => {
    const original = await importOriginal<object>()
    const m = await import('../support/exportStandIns.js')
    return { ...original, handleExportJson: (playlists: Array<{ name: string }>, options?: { batchName?: string }) => m.stand.calls.push(['json', playlists.map(item => item.name), options?.batchName ?? null]) }
})
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import { openPlaylistExport, unmountAll } from '../support/exportWindowHost'
import { stand, resetStands } from '../support/exportStandIns.js'
import { SCENARIOS, keyOf, snapOf, onWindow } from '../support/exportWindowScenarios.js'
import before from '../fixtures/exportWindowFromMain.json'

const captured = before as Record<string, Record<string, string | null>>
const wait = (ms: number) => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) })

/** Plays a scenario on the React window and gives what it wrote down. */
async function play(scenario: (typeof SCENARIOS)[number]): Promise<Record<string, string | null>> {
    state.phone = Boolean(scenario.phone)
    const snaps: Record<string, string | null> = {}
    const h = {
        open: async (job: object) => { openPlaylistExport(job) },
        click: async (selector: string) => { act(() => { (document.querySelector(selector) as HTMLElement).click() }) },
        pick: async (mode: string, value?: string) => { act(() => { ([...document.querySelectorAll<HTMLInputElement>('input[name="apple-folder"]')].find(r => r.dataset.mode === mode && (value === undefined || r.value === value)) as HTMLElement).click() }) },
        type: async (value: string) => {
            const field = document.querySelector('[data-folder-name]') as HTMLInputElement
            const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
            act(() => { set?.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })) })
        },
        key: async (key: string) => { act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) }) },
        settle: async () => { await wait(30) },
        finish: () => { act(() => { stand.finish?.() }) },
        snap: (label: string, selector?: string) => { snaps[label] = snapOf(selector || onWindow(state.phone)) },
        note: (label: string, value: unknown) => { snaps[label] = JSON.stringify(value) }
    }
    await scenario.run(h)
    return snaps
}

describe('the export window in React draws what the hand-made one drew', () => {
    beforeEach(() => { resetStands(); localStorage.clear(); unmountAll(); document.body.innerHTML = '' })
    afterEach(() => { unmountAll(); document.body.innerHTML = '' })

    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SCENARIOS.map(keyOf).sort())
    })

    for (const scenario of SCENARIOS) {
        const key = keyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario)
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                expect(page, `${key} · ${label}`).toBe(captured[key][label])
            }
        })
    }
})
