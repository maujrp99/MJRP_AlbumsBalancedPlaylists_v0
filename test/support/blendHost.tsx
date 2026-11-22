/**
 * blendHost - plays a scenario of test/support/blendScenarios.js on the Blend screen and gives what it wrote down. The same file ran on the
 * hand-made screen (to capture the old pages) and runs on the React one (to compare): what changes between the two is the view the caller hands in
 * (`makeView`), never this file. The world outside is test/support/blendStandIns.js, mocked by the caller (`vi.mock` is hoisted per file).
 */
import { act } from 'react'
import { vi } from 'vitest'
import { router } from '../../public/js/router.js'
import { asPhone } from './playlistsScenarios.js'
import { normalize, focusMark } from './blendScenarios.js'
import { world, reset } from './blendStandIns.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const flush = () => new Promise(resolve => setTimeout(resolve, 30))

interface View { render: (params: object) => Promise<unknown>; mount: (params: object) => unknown; destroy: () => void }
type Scenario = { name: string; phone?: boolean; world?: object; query?: Record<string, string>; run: (h: never) => Promise<void> }
type Field = HTMLElement & HTMLInputElement & HTMLSelectElement

/** Plays a scenario with the view `makeView` makes, and gives what it wrote down. */
export async function play(scenario: Scenario, makeView: () => View): Promise<Record<string, string | null>> {
    const phone = asPhone(Boolean(scenario.phone))
    reset(scenario.world ?? {})
    const scrolls: string[] = []
    Element.prototype.scrollIntoView = function (this: Element) { scrolls.push(this.getAttribute('data-series-id') || this.id || this.className) }
    const navigate = vi.spyOn(router, 'navigate').mockImplementation((path: string) => { world.calls.push(`navigate ${path}`) })
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    let app: HTMLElement
    let view: View
    const params = { query: scenario.query ?? {} }
    const open = async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = makeView()
        await act(async () => {
            const drawn = await view.render(params)
            // the hand-made view gives the page and the router puts it in `#app`; the React view draws into `#app` itself
            if (drawn instanceof Node) app.appendChild(drawn)
            view.mount(params)
            await flush()
        })
    }
    const leave = async () => { await act(async () => { view.destroy(); await flush() }); app.remove() }
    await open()

    const snaps: Record<string, string | null> = {}
    const field = (selector: string) => document.querySelector(selector) as Field
    const h = {
        snap: (label: string, selector = '#app') => { snaps[label] = normalize(document.querySelector(selector)) },
        note: (label: string, text: string) => { snaps[label] = text },
        focus: focusMark,
        focusOn: (selector: string) => { field(selector).focus() },
        click: async (selector: string) => { await act(async () => { field(selector).click(); await flush() }) },
        key: async (selector: string, key: string) => {
            await act(async () => { field(selector).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); await flush() })
        },
        slide: async (selector: string, value: number) => {
            await act(async () => { const slider = field(selector); slider.value = String(value); slider.dispatchEvent(new Event('input', { bubbles: true })); await flush() })
        },
        search: async (text: string) => {
            await act(async () => { const input = field('.blend-sheet__search'); input.value = text; input.dispatchEvent(new Event('input', { bubbles: true })); await flush() })
        },
        settle: async () => { await act(async () => { await flush(); await flush() }) },
        loaded: () => { world.loaded() },
        /** Every cover that waited arrives, and the next one of its series (a series asks for its covers one after the other). */
        arrive: async () => { for (let i = 0; i < 4; i++) { await act(async () => { world.arrive(); await flush() }) } },
        release: () => { world.release?.() },
        /** What the screen asked of the world since the last time, one line each (the covers asked for in a sorted list: their order between two series is not a behaviour). */
        calls: (label: string) => {
            const taken = world.calls.splice(0)
            const covers = taken.filter(call => call.startsWith('findAlbum')).sort()
            snaps[label] = [...taken.filter(call => !call.startsWith('findAlbum')), ...(covers.length ? [`${covers.length} covers asked: ${covers.join(' | ')}`] : [])].join('\n')
        },
        scrolled: () => JSON.stringify(scrolls.splice(0)),
        leave,
        reopen: open,
        turn: async (to: boolean) => { await act(async () => { phone.turn(to); await flush() }) }
    }
    try {
        await scenario.run(h as never)
    } finally {
        await act(async () => { try { view.destroy() } catch { /* already left */ } })
        world.release?.()
        app!.remove()
        document.querySelectorAll('.sheet, .sheet-backdrop').forEach(node => node.remove())
        navigate.mockRestore()
        vi.restoreAllMocks()
    }
    return snaps
}
