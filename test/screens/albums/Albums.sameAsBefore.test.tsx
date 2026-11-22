/**
 * F83 wave 5a (REQ-02, REQ-05; TASK-23, TASK-30): the albums screen in React draws what the hand-made one drew.
 *
 * The proof: for every scenario of test/support/albumsScenarios.js (waiting for the first load, series arriving, the grid and the list with
 * the track tables sorted by each column, one series alone, searching, every filter and every order, the pages and the size of the page and
 * scrolling, «Load N more», a series that failed in whole or in part, nothing in the library, the buttons of the header, the actions on a
 * series and on an album, removing an album by its three ways, a series that changes under the screen; on the phone the tiles and the rows,
 * the sheet of the filters and its chips, the phone pager, the sheets of an album and of a series, turning into a computer and back) the
 * page after each step equals what the old screen drew at the same step, and the focus is where the old screen left it. The old pages are
 * kept in test/fixtures/albumsBeforeF83.json: written once by the hand-made screen before it was deleted
 * (reports/evidence/F83/wave-5a/capture-before.test.js), compared element by element, attribute by attribute (as in waves 1 to 4). What the
 * screen asked of the world outside (the load, the windows that stay hand-made, the dialogs, the notices, the address, the scroll) is compared too.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/firebase-init.js', () => ({ app: {}, auth: { currentUser: null }, db: {} }))
vi.mock('../../../public/js/services/albums/albumLoading.js', async () => (await import('../../support/albumsScenarios.js')).loadModule)
vi.mock('../../../public/js/services/ranking/ownRanking.js', async () => (await import('../../support/albumsScenarios.js')).rankingModule)
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/albumsScenarios.js')).seriesServiceModule)
vi.mock('../../../public/js/services/DialogService.js', async () => (await import('../../support/albumsScenarios.js')).dialogModule)
vi.mock('../../../public/js/components/Toast.js', async () => (await import('../../support/albumsScenarios.js')).toastModule)
vi.mock('../../../public/js/components/ViewAlbumModal.js', async () => (await import('../../support/albumsScenarios.js')).albumWindowModule)
vi.mock('../../../public/js/components/InventoryAddModal.js', async () => (await import('../../support/albumsScenarios.js')).inventoryModule)
vi.mock('../../../public/js/screens/albums/useAlbumWindows', async () => (await import('../../support/albumsScenarios.js')).windowsModule)

import { act } from 'react'
import SeriesController from '../../../public/js/controllers/SeriesController.js'
import { albumsView } from '../../../public/js/screens/albums/index'
import { SCENARIOS, keyOf, normalize, focusOf, asPhone, quiet, outside, prepare, answer, world, dialogs, behaviour } from '../../support/albumsScenarios.js'
import before from '../../fixtures/albumsBeforeF83.json'

const captured = before as Record<string, Record<string, string | null>>
const tick = () => new Promise(resolve => setImmediate(resolve))

type Scenario = (typeof SCENARIOS)[number]

/**
 * What the screen asked of the world outside, as the old screen asked it, minus two differences that are decisions and not drawings:
 * the old grid watched a block for every series that was off screen (it never worked with the list cut to a page, so the new screen does
 * not have it), and the strict mode of React starts an effect twice (the pager's watcher of the scroll form is asked for twice and let
 * go of once between).
 */
/** The notes are compared as the old screen would have written them (see below). */
const sameNote = (text: string | null): string | null => {
    if (!text?.startsWith('[[')) return text
    return JSON.stringify(asHandMadeSaw(JSON.parse(text)))
}

const asHandMadeSaw = (asked: unknown[][]): unknown[][] => asked
    .filter(entry => !(entry[0] === 'watches' && entry[1] === 'series-group-skeleton'))
    .filter((entry, i, all) => !(entry[0] === 'watches' && i > 0 && all[i - 1][0] === 'watches' && all[i - 1][1] === entry[1]))

/** Plays a scenario on the new screen and gives what it wrote down. */
export async function play(scenario: Scenario): Promise<Record<string, string | null>> {
    const phone = asPhone(Boolean((scenario as { phone?: boolean }).phone))
    quiet()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    prepare(scenario)
    const app = document.createElement('div')
    app.id = 'app'
    document.body.appendChild(app)
    const params = (scenario as { params?: Record<string, string> }).params ?? {}
    const view = albumsView(new SeriesController() as never)
    await act(async () => {
        await view.render(params)
        view.mount(params)
    })
    const flush = () => act(async () => { for (let i = 0; i < 5; i++) await tick() })
    await flush()

    const snaps: Record<string, string | null> = {}
    const at = (selector: string, index = 0) => document.querySelectorAll<HTMLElement>(selector)[index]
    const h = {
        dialogs, behaviour, world,
        snap: (label: string, selector?: string) => { snaps[label] = normalize(selector ? document.querySelector(selector) : app) },
        note: (label: string) => { snaps[label] = JSON.stringify(asHandMadeSaw(outside.splice(0))) },
        focus: (label: string) => { snaps[`focus · ${label}`] = focusOf() },
        click: async (selector: string) => { await act(async () => { at(selector).focus(); at(selector).click(); for (let i = 0; i < 5; i++) await tick() }) },
        type: async (selector: string, value: string) => {
            await act(async () => {
                const field = at(selector) as HTMLInputElement
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value) // the way a browser writes into a field React owns
                field.dispatchEvent(new Event('input', { bubbles: true }))
                for (let i = 0; i < 5; i++) await tick()
            })
        },
        select: async (selector: string, value: string) => {
            await act(async () => {
                const list = at(selector) as HTMLSelectElement
                list.focus()
                Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(list, value)
                list.dispatchEvent(new Event('change', { bubbles: true }))
                for (let i = 0; i < 5; i++) await tick()
            })
        },
        turn: async (to: boolean) => { await act(async () => { phone.turn(to); for (let i = 0; i < 5; i++) await tick() }) },
        arrive: async (id: string, state = 'found') => { await act(async () => { (world.state as Record<string, string>)[id] = state; answer(); for (let i = 0; i < 5; i++) await tick() }) },
        change: async (work: () => void) => { await act(async () => { work(); for (let i = 0; i < 5; i++) await tick() }) }
    }
    await scenario.run(h as never)
    await act(async () => { view.destroy() })
    app.remove()
    return snaps
}

describe('the albums screen in React draws what the hand-made one drew', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

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
                expect(sameNote(page), `${key} · ${label}`).toBe(sameNote(captured[key][label]))
            }
        })
    }
})

describe('the proof catches a difference', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

    it('a changed word in the page is a failed scenario (the test is not a rubber stamp)', async () => {
        const { registerTexts } = await import('../../../public/js/i18n/t.js')
        const scenario = SCENARIOS.find(s => s.name === 'all loaded, grid' && !(s as { phone?: boolean }).phone)!
        registerTexts('en', { 'albums.blend': 'Mix your Albums' })
        try {
            const snaps = await play(scenario)
            expect(snaps['three series, nine albums']).not.toBe(captured[keyOf(scenario)]['three series, nine albums'])
            expect(snaps['three series, nine albums']).toContain('Mix your Albums')
        } finally {
            registerTexts('en', { 'albums.blend': 'Blend your Albums' })
        }
    })

    it('a changed class in the page is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'all loaded, grid' && !(s as { phone?: boolean }).phone)!
        const snaps = await play(scenario)
        expect(snaps['three series, nine albums']!.replace('albums-grid', 'albums-grid-changed')).not.toBe(captured[keyOf(scenario)]['three series, nine albums'])
    })

    it('a focus left on the wrong control is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'switching between grid and list')!
        const snaps = await play(scenario)
        expect(snaps['focus · after the list button']).toBe(captured[keyOf(scenario)]['focus · after the list button'])
        expect('button#viewModeList').not.toBe(captured[keyOf(scenario)]['focus · after the list button'])
    })
})

describe('a decided difference', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

    // The old bar took its «Filters» button out of the page at once when the phone turned into a computer, so the sheet, closing by itself,
    // could not give the focus back to it and the focus stayed in the sheet while it slid away (250 ms). Here the page is drawn after every
    // listener of the turn has run, so the sheet gives the focus back to the button, which then goes: the focus is on the page. After the
    // slide both are the same (the sheet is gone and the focus is on the page); only those 250 ms differ.
    it('turning into a computer with the sheet open: the focus ends on the page', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'turning with the sheet open')!
        let where = ''
        await play({ ...scenario, run: async (h: never) => { await scenario.run(h); where = focusOf() } } as Scenario)
        expect(where).toBe('the page')
    })
})
