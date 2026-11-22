/**
 * F83 wave 2 (REQ-02, REQ-05; TASK-16, TASK-30): the playlists screen in React draws what the hand-made one drew.
 *
 * F83 sync 2: the pages are the ones of `main` after F90 (Apple Music opens the export window, on its folder step; the phone's «Export»
 * opens the same window), kept in test/fixtures/playlistsFromMain.json (reports/evidence/F83/sync-2/capture-playlists-from-main.test.js).
 *
 * The proof: for every scenario of test/support/playlistsScenarios.js (nothing here, a saved batch not found, the set from the blend,
 * its name typed, the panel to generate again, a track moved, removed, a playlist deleted, undo and redo, a title typed over, generating,
 * saving, a saved batch being edited, the exports; on the phone the chips, the sheets, the notice, turning into a computer) the page
 * after each step equals what the old screen drew at the same step. The old screen's pages are kept in
 * test/fixtures/playlistsBeforeF83.json: written once by the hand-made screen before it was deleted
 * (reports/evidence/F83/wave-2/capture-before.test.js), compared element by element, attribute by attribute (as in wave 1; the time
 * in the foot and the moment of light of a moved row are not compared). What the screen asked of the world outside (the service,
 * the exports, the Spotify window, the question before deleting) is compared too.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/services/playlists/playlistsWiring.js', async () => (await import('../../support/playlistsScenarios.js')).wiring())
vi.mock('../../../public/js/services/DialogService.js', async () => ({ dialogService: { confirm: vi.fn(async (o: { title: string; message: string }) => { (await import('../../support/playlistsScenarios.js')).outside.push(['confirm', o.title, o.message]); return true }) } }))
vi.mock('../../../public/js/components/SpotifyExportModal.js', async () => ({ showSpotifyExportModal: () => import('../../support/playlistsScenarios.js').then(m => m.outside.push(['spotifyWindow'])) }))
vi.mock('../../../public/js/controllers/playlistExports.js', async () => {
    const m = await import('../../support/playlistsScenarios.js')
    const asked = (options?: object) => JSON.stringify(Object.fromEntries(Object.entries(options ?? {}).filter(([key]) => key !== 'btn' && key !== 'onStatus' && key !== 'ok')))
    return { seriesNameOf: (given?: string) => given || 'MJRP Playlists', handleExportJson: () => m.outside.push(['exportJson']), handleExportToAppleMusic: (options?: object) => m.outside.push(['exportApple', asked(options)]) }
})
vi.mock('../../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../../support/exportStandIns.js')).musicKitService }))

import { Playlists, GeneratingFlag } from '../../../public/js/screens/playlists/Playlists'
import { PlaylistsController } from '../../../public/js/controllers/PlaylistsController.js'
import { renderScreen } from '../../support/renderScreen'
import { registerTexts } from '../../../public/js/i18n/t.js'
import { SCENARIOS, generated, keyOf, normalize, asPhone, quiet, fakeService, outside } from '../../support/playlistsScenarios.js'
import before from '../../fixtures/playlistsFromMain.json'

const captured = before as Record<string, Record<string, string | null>>
const flush = () => new Promise(resolve => setTimeout(resolve, 30))

type Field = HTMLInputElement | HTMLElement

/** Plays a scenario on the new screen and gives what it wrote down. */
export async function play(scenario: (typeof SCENARIOS)[number]): Promise<Record<string, string | null>> {
    const phone = asPhone(Boolean(scenario.phone))
    quiet()
    window.history.replaceState({}, '', scenario.url)
    fakeService.batches = scenario.batches || {}
    fakeService.begin(scenario.playlists || [], { defaultName: scenario.defaultName })
    const generating = new GeneratingFlag()
    const controller = new PlaylistsController(generating)
    const rendered = await renderScreen(Playlists, { controller, generating }, {
        screen: 'playlists',
        view: { prepare: (params) => controller.initialize(params), dispose: () => controller.destroy() }
    })
    const snaps: Record<string, string | null> = {}
    const field = (selector: string) => document.querySelector(selector) as Field
    const settle = () => rendered.act(async () => { await flush() })
    const h = {
        snap: (label: string, selector?: string) => { snaps[label] = normalize(selector ? document.querySelector(selector) : rendered.app) },
        note: (label: string, text?: string) => { snaps[label] = text ?? JSON.stringify(outside.splice(0)) },
        publish: async (change: () => void) => { await rendered.act(async () => { change(); await flush() }) },
        click: async (selector: string) => { await rendered.act(async () => { field(selector).click(); await flush() }) },
        clickWhere: async (selector: string, text: string) => { await rendered.act(async () => { ([...document.querySelectorAll<HTMLElement>(selector)].find(e => e.textContent?.includes(text)) as HTMLElement).click(); await flush() }) },
        type: async (selector: string, value: string) => {
            await rendered.act(async () => {
                const input = field(selector) as HTMLInputElement
                // the way a browser writes into a field React owns
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
                input.dispatchEvent(new Event('input', { bubbles: true }))
                await flush()
            })
        },
        typeTitle: async (selector: string, value: string) => { field(selector).textContent = value },
        focusIn: async (selector: string) => { await rendered.act(async () => { field(selector).dispatchEvent(new FocusEvent('focusin', { bubbles: true })) }) },
        focusOut: async (selector: string) => { await rendered.act(async () => { field(selector).dispatchEvent(new FocusEvent('focusout', { bubbles: true })); await flush() }) },
        key: async (key: string) => { await rendered.act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); await flush() }) },
        generating: async (on: boolean) => { await rendered.act(async () => { generating.isGenerating = on; generating.update(); await flush() }) },
        clock: (value: string) => { (globalThis as { __clock?: string }).__clock = value },
        turn: async (to: boolean) => { await rendered.act(async () => { phone.turn(to); await flush() }) }
    }
    await settle()
    await scenario.run(h)
    await rendered.leave()
    return snaps
}

describe('the playlists screen in React draws what the hand-made one drew', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SCENARIOS.map(keyOf).sort())
    })

    for (const scenario of SCENARIOS.filter(s => !process.env.F83_ONLY || s.name === process.env.F83_ONLY)) {
        const key = keyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario)
            if (process.env.F83_DUMP) (await import('node:fs')).writeFileSync(`${process.env.F83_DUMP}/${key.replace(/\W+/g, '_')}.json`, JSON.stringify(snaps))
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                expect(page, `${key} · ${label}`).toBe(captured[key][label])
            }
        })
    }
})

describe('the proof catches a difference', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('a changed word in the page is a failed scenario (the test is not a rubber stamp)', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'playlists from the blend')!
        registerTexts('en', { 'playlists.history.undo': 'Take it back' })
        try {
            const snaps = await play(scenario)
            expect(snaps.generated).not.toBe(captured[keyOf(scenario)].generated)
            expect(snaps.generated).toContain('Take it back')
        } finally {
            registerTexts('en', { 'playlists.history.undo': 'Undo' })
        }
    })

    it('a changed class in the page is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'nothing here yet')!
        const snaps = await play(scenario)
        expect(snaps['empty state']!.replace('glass-panel', 'glass-panel-changed')).not.toBe(captured[keyOf(scenario)]['empty state'])
    })
})

describe('what a redraw took away from the page: the focus', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('a track removed by its X leaves the focus on the page, not on the next track\'s X (the hand-made screen drew anew)', async () => {
        const seen: Array<string | undefined> = []
        await play({
            name: 'focus after a removal', url: '/playlists', playlists: generated(),
            run: async (h: { click: (selector: string) => Promise<void> }) => {
                const button = document.querySelector<HTMLElement>('button[data-action="remove-track"][data-playlist-index="0"][data-track-index="0"]')!
                button.focus()
                seen.push(document.activeElement?.getAttribute('data-action') ?? undefined)
                await h.click('button[data-action="remove-track"][data-playlist-index="0"][data-track-index="0"]')
                seen.push(document.activeElement === document.body ? 'body' : document.activeElement?.getAttribute('data-action') ?? undefined)
            }
        } as unknown as (typeof SCENARIOS)[number])
        expect(seen).toEqual(['remove-track', 'body'])
    })
})

describe('the focus after a draw: the page, as when the hand-made screen drew anew (judge\'s recheck, P2)', () => {
    afterEach(() => { document.body.innerHTML = '' })

    const focusAfter = async (scenario: { phone?: boolean; run: (h: any) => Promise<void> }) => {
        const seen: string[] = []
        await play({ name: 'focus', url: '/playlists', playlists: generated(), ...scenario, run: async (h: any) => { await scenario.run({ ...h, seen }) } } as unknown as (typeof SCENARIOS)[number])
        return seen
    }
    const now = () => (document.activeElement === document.body ? 'body' : document.activeElement?.getAttribute('data-action') || document.activeElement?.getAttribute('data-phone-action') || document.activeElement?.tagName)
    const startsAtTop = () => document.getSelection()?.anchorNode === document.getElementById('app')

    it('on the computer, undo by the keyboard (focus on the button) leaves the focus on the page and the next Tab at the top', async () => {
        const seen = await focusAfter({ run: async (h) => {
            await h.publish(() => fakeService.moveTrack(0, 1, 0, 2))
            await h.publish(() => fakeService.moveTrack(0, 0, 0, 1)) // two steps back: undo stays on after the click
            const undo = document.querySelector<HTMLElement>('[data-action="undo-edit"]')!
            undo.focus()
            await h.click('[data-action="undo-edit"]')
            h.seen.push(now() as string, String(startsAtTop()))
        } })
        expect(seen).toEqual(['body', 'true'])
    })

    it('on the phone, a move and a remove from the sheet of a track leave the focus on the page, not on another track\'s ⋯', async () => {
        const seen = await focusAfter({ phone: true, run: async (h) => {
            for (const text of ['Move down', 'Remove from this playlist']) {
                const opener = document.querySelector<HTMLElement>('[data-phone-action="track-options"][data-track-index="1"]')!
                opener.focus()
                await h.click('[data-phone-action="track-options"][data-track-index="1"]')
                await h.clickWhere('.phone-sheet-action', text)
                h.seen.push(now() as string)
            }
        } })
        expect(seen).toEqual(['body', 'body'])
    })
})
