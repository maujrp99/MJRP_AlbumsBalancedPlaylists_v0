/**
 * F83 wave 8a: the Spotify export window in React draws what the hand-made one (components/SpotifyExportModal.js, 461 lines) drew, and acts the same.
 *
 * The proof: for every scenario of test/support/spotifyExportScenarios.js (the playlists on the edit screen, one playlist given, the mode and the name, the
 * progress, the report with its links, partial, connect again, failure and try again, nothing to export, two presses, every way of closing, text and not
 * markup) the page after each step (every element, its attributes, the state of its fields and every text node as it is written), the focus and what the window
 * asked of the world equal what the hand-made window gave at the same step. The pages are kept in test/fixtures/spotifyExportBeforeF83.json, written once
 * by the hand-made window (reports/evidence/F83/wave-8a/capture-spotify-before.test.js).
 *
 * F97 (the judge's P2): one track not found is said in the singular now («1 track not found»; the hand-made window said «1 tracks not found»). The
 * four places of the fixture that held the old plural were rewritten by hand to the new text; nothing else of it changed.
 *
 * F98 (UAT-307, UAT-308): the end of an export is no longer what the hand-made window drew, on purpose, and the scenarios hand the progress
 * as the service does now (a stage and names, not a sentence). 16 of the 52 pages of the fixture were written again by the React window
 * (once, compared one by one to what was kept: reports/evidence/F98/raw/golden-spotify-window.txt), and only for this:
 *   - the top of the report is a status region and its heading takes the focus (`role`, `aria-live`, `tabindex`, `data-export-heading`,
 *     the class that takes the focus ring off a heading; the focus written down is the heading, not the page);
 *   - a failure is said by the window: «The export stopped: Server error» (it was the bare text), the rate limit without «(Rate Limited)»;
 *   - a report with something left out and no failure is headed «Exported, with something left out», with the amber sign (the hand-made
 *     window said «Export Complete! 🎉» over a playlist with no track found);
 *   - the line under the stage is the window's: «Searching: <the title>».
 * Everything else of the fixture is the hand-made window's, untouched.
 *
 * KNOWN_DIFFERENCES is empty: there is nothing else the window does differently. The last two tests prove the check is not blind: a word, a class, an
 * attribute and a space inside a text, changed on purpose, are accused.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'

vi.mock('../../public/js/services/SpotifyExportService.js', async () => ({ SpotifyExportService: (await import('../support/spotifyExportStandIns.js')).SpotifyExportService }))
vi.mock('../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../support/spotifyExportStandIns.js')).SpotifyAuthService }))
vi.mock('../../public/js/stores/toasts.js', async () => {
    const { toast } = await import('../support/spotifyExportStandIns.js')
    return { default: toast, toast }
})

import { openSpotifyWindow, closeWindows, press, choose, typeInto, settle } from '../support/spotifyWindowHost.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { stand, resetStands } from '../support/spotifyExportStandIns.js'
import { SCENARIOS, keyOf, snapOf } from '../support/spotifyExportScenarios.js'
import before from '../fixtures/spotifyExportBeforeF83.json'

const captured = before as Record<string, Record<string, string | null>>

/** Plays a scenario on the React window and gives what it wrote down (`change` alters each page, to prove the check sees it). */
async function play(scenario: (typeof SCENARIOS)[number], change?: (page: string | null) => string | null): Promise<Record<string, string | null>> {
    const snaps: Record<string, string | null> = {}
    const h = {
        screen: ({ playlists, seriesName }: { playlists: unknown[]; seriesName: string | null }) => {
            playlistsStore.reset(); (playlistsStore as unknown as { setPlaylists: (list: unknown[], id: string) => void }).setPlaylists(playlists, 'sA')
            albumSeriesStore.reset()
            if (seriesName) { albumSeriesStore.setSeries([{ id: 'sA', name: seriesName }]); albumSeriesStore.setActiveSeries('sA') }
        },
        open: async (given?: { playlists: unknown[]; seriesName?: string }) => { await openSpotifyWindow(given) },
        click: async (selector: string) => { press(document.querySelector(selector)) },
        clickLast: async (selector: string) => { press([...document.querySelectorAll(selector)].pop() as Element) },
        backdrop: async () => { const backdrop = document.querySelector('.modal-backdrop'); if (backdrop) press(backdrop) },
        key: async (key: string) => { act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) }) },
        choose: async (mode: string) => { choose(mode) },
        type: async (value: string) => { typeInto(document.querySelector('#playlistNameInput') as HTMLInputElement, value) },
        progress: (...args: unknown[]) => { act(() => { stand.handlers?.onProgress(...args) }) },
        notFound: (item: unknown) => { act(() => { stand.handlers?.onNotFound(item) }) },
        finish: (report: unknown) => { act(() => { stand.finish?.(report as object) }) },
        fail: (error: unknown) => { act(() => { stand.fail?.(error) }) },
        settle: async () => { await settle(30) },
        snap: (label: string, selector?: string) => { const page = snapOf(selector); snaps[label] = change ? change(page) : page },
        note: (label: string, value: unknown) => { snaps[label] = JSON.stringify(value) }
    }
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => { })
    await scenario.run(h)
    quiet.mockRestore()
    return snaps
}

describe('the Spotify export window in React draws what the hand-made one drew', () => {
    beforeEach(async () => { resetStands(); await closeWindows(); document.body.innerHTML = ''; delete (window as { __xss?: number }).__xss })
    afterEach(async () => { await closeWindows(); document.body.innerHTML = '' })

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

    it('a word changed on purpose is accused (the check is not blind)', async () => {
        const scenario = SCENARIOS.find(item => keyOf(item) === 'done, everything created, with the links') as (typeof SCENARIOS)[number]
        const snaps = await play(scenario, (page) => (page ? page.replace('Export Complete!', 'Export Completed!') : page))
        expect(snaps.done).not.toBe(captured[keyOf(scenario)].done)
    })

    it('a class, an attribute and a space inside a text are accused too', async () => {
        const scenario = SCENARIOS.find(item => keyOf(item) === 'idle, the playlists on the edit screen') as (typeof SCENARIOS)[number]
        const original = captured[keyOf(scenario)].idle as string
        for (const [from, to] of [['text-white/60', 'text-white/50'], ['id="startExportBtn"', 'id="startExportBtn2"'], ['Export to Spotify\\n', ' Export to Spotify\\n']]) {
            const snaps = await play(scenario, (page) => (page ? page.replace(from, to) : page))
            expect(original.includes(from), from).toBe(true)
            expect(snaps.idle, from).not.toBe(original)
        }
    })
})
