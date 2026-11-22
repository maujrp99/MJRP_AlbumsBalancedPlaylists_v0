/**
 * F83 wave 4 (REQ-02, REQ-05; TASK-21, TASK-30): the Start screen in React draws what the hand-made Home drew.
 *
 * The proof: for every scenario of test/support/startScenarios.js (the first visit, typing, searching, the discography and its
 * filters, covers chosen and taken out with Undo, the order panel, the name, creating, a series not saved, nothing found, the list
 * and its report, a visitor; on the phone the bar, the sheet, creating from the sheet, turning into a computer) the page after each
 * step equals what the old screen drew at the same step, and the focus is where the old screen left it. The old screen's pages are
 * kept in test/fixtures/startFromMainLean.json: written by the hand-made screen of `main` at b8947e0, the lean Start on the phone
 * (F79, UAT-281; reports/evidence/F83/sync-3/capture-start-from-main.test.js; before the sync it was startBeforeF83.json, written by
 * the hand-made screen before it was deleted, wave 4), compared element by element, attribute by attribute (as in waves 1 to 3).
 * What the screen asked of the world outside (the catalog, the writing of the series, the move to another screen, the window to sign
 * in) is compared too.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', async () => (await import('../../support/startScenarios.js')).catalogStandIn)
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/startScenarios.js')).seriesStandIn)
vi.mock('../../../public/js/stores/toasts.js', () => ({ default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() } }))

import { act } from 'react'
import { Start } from '../../../public/js/screens/start/Start'
import { StartController } from '../../../public/js/screens/start/StartController'
import { renderScreen } from '../../support/renderScreen'
import { userStore } from '../../../public/js/stores/UserStore.js'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'
import { registerTexts } from '../../../public/js/i18n/t.js'
import { SCENARIOS, keyOf, normalize, focusOf, asPhone, quiet, control, outside } from '../../support/startScenarios.js'
import before from '../../fixtures/startFromMainLean.json'

const captured = before as Record<string, Record<string, string | null>>
const tick = () => new Promise(resolve => setImmediate(resolve))
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type Scenario = (typeof SCENARIOS)[number]

/** Plays a scenario on the new screen and gives what it wrote down. */
export async function play(scenario: Scenario): Promise<Record<string, string | null>> {
    const phone = asPhone(Boolean((scenario as { phone?: boolean }).phone))
    quiet()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(albumSeriesStore, 'getDb').mockReturnValue({})
    vi.spyOn(albumSeriesStore, 'getUserId').mockReturnValue('u1')
    control.reset()
    userStore.setUser((scenario as { guest?: boolean }).guest ? { uid: 'g', isAnonymous: true } : { uid: 'u1', isAnonymous: false })
    if ((scenario as { timers?: boolean }).timers) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const controller = new StartController()
    const rendered = await renderScreen(Start, { controller }, {
        screen: 'start',
        view: { prepare: async () => { controller.initialize() }, dispose: () => controller.dispose() }
    })
    const flush = () => rendered.act(async () => { for (let i = 0; i < 4; i++) await tick() })
    await flush()

    const snaps: Record<string, string | null> = {}
    const at = (selector: string, index = 0) => document.querySelectorAll<HTMLElement>(selector)[index]
    const input = (element: HTMLElement, value: string) => {
        // the way a browser writes into a field React owns, and tells it
        const field = element as HTMLInputElement
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value)
        field.dispatchEvent(new Event('input', { bubbles: true }))
    }
    const key = (element: HTMLElement, name: string) => element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))
    const paste = (element: HTMLElement, text: string) => {
        const event = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData?: unknown }
        event.clipboardData = { getData: () => text }
        element.dispatchEvent(event)
    }
    const h = {
        ...control,
        snap: (label: string, selector?: string) => { snaps[label] = normalize(selector ? document.querySelector(selector) : rendered.app) },
        note: (label: string, text?: string) => { snaps[label] = text ?? JSON.stringify(outside.splice(0)) },
        focus: (label: string) => { snaps[`focus · ${label}`] = focusOf() },
        settle: async (ms?: number) => { if (ms) await rendered.act(async () => { await sleep(ms) }); else await flush() },
        click: async (selector: string) => { await rendered.act(async () => { at(selector).focus(); at(selector).click(); for (let i = 0; i < 4; i++) await tick() }) },
        type: async (selector: string, value: string) => { await rendered.act(async () => { input(at(selector), value); for (let i = 0; i < 4; i++) await tick() }) },
        typeIn: async (selector: string, index: number, value: string) => { await rendered.act(async () => { input(at(selector, index), value); for (let i = 0; i < 4; i++) await tick() }) },
        key: async (selector: string, name: string) => { await rendered.act(async () => { key(at(selector), name); for (let i = 0; i < 4; i++) await tick() }) },
        keyIn: async (selector: string, index: number, name: string) => { await rendered.act(async () => { key(at(selector, index), name); for (let i = 0; i < 4; i++) await tick() }) },
        paste: async (selector: string, text: string) => { await rendered.act(async () => { paste(at(selector), text); for (let i = 0; i < 4; i++) await tick() }) },
        caret: async (selector: string, index: number, position: number) => { (at(selector, index) as HTMLInputElement).setSelectionRange(position, position) },
        focusIn: async (selector: string) => { await rendered.act(async () => { at(selector).focus() }) },
        focusOut: async (selector: string) => { await rendered.act(async () => { at(selector).blur() }) },
        advance: async (ms: number) => { await rendered.act(async () => { vi.advanceTimersByTime(ms); for (let i = 0; i < 4; i++) await tick() }) },
        turn: async (to: boolean) => { await rendered.act(async () => { phone.turn(to); for (let i = 0; i < 4; i++) await tick() }) },
        signIn: () => { void act(() => { userStore.setUser({ uid: 'u1', isAnonymous: false }) }) }
    }
    await scenario.run(h)
    await rendered.leave()
    return snaps
}

describe('the Start screen in React draws what the hand-made one drew', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks() })

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
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks() })

    it('a changed word in the page is a failed scenario (the test is not a rubber stamp)', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'first visit')!
        registerTexts('en', { 'start.stage.title.first': 'Choose the albums.' })
        try {
            const snaps = await play(scenario)
            expect(snaps['the stage, the steps, the empty dock']).not.toBe(captured[keyOf(scenario)]['the stage, the steps, the empty dock'])
            expect(snaps['the stage, the steps, the empty dock']).toContain('Choose the albums.')
        } finally {
            registerTexts('en', { 'start.stage.title.first': 'Pick the albums.' })
        }
    })

    it('a changed class in the page is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'first visit')!
        const snaps = await play(scenario)
        expect(snaps['the stage, the steps, the empty dock']!.replace('home-stage', 'home-stage-changed')).not.toBe(captured[keyOf(scenario)]['the stage, the steps, the empty dock'])
    })

    it('a focus left on the wrong control is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'choosing covers')!
        const snaps = await play(scenario)
        expect(snaps['focus · after a cover']!.replace('home-card', 'home-other')).not.toBe(captured[keyOf(scenario)]['focus · after a cover'])
    })
})
