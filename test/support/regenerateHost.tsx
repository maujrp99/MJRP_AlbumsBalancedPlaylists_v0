/**
 * regenerateHost - plays a scenario of test/support/regenerateScenarios.js on the playlists screen, through the route the app uses
 * (`playlistsView()` of screens/playlists/index.ts), and gives what it wrote down. The same file ran on the hand-made panel (to capture
 * the old pages) and runs on the React one (to compare): what changes between the two is the tree it runs on, never this file.
 *
 * The caller mocks the world outside (the service of the playlists, the dialogs, the Spotify window, the exports, MusicKit), as
 * test/screens/playlists/Playlists.sameAsBefore.test.tsx does: `vi.mock` is hoisted per file, so it cannot live here.
 * The controller does not generate: `handleGenerate` is a stand-in that writes down the configuration it was given (the keys in
 * alphabetical order) and answers as the scenario says.
 */
import { act } from 'react'
import { vi } from 'vitest'
import { playlistsView } from '../../public/js/screens/playlists/index'
import { PlaylistsController } from '../../public/js/controllers/PlaylistsController.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { asPhone, quiet, fakeService, generated } from './playlistsScenarios.js'
import { normalize, type SCENARIOS } from './regenerateScenarios.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const flush = () => new Promise(resolve => setTimeout(resolve, 30))
type Scenario = (typeof SCENARIOS)[number]
type Field = HTMLElement & HTMLInputElement

const sorted = (config: object) => JSON.stringify(Object.fromEntries(Object.entries(config).sort(([a], [b]) => a.localeCompare(b))))

/** Plays a scenario and gives what it wrote down. */
export async function play(scenario: Scenario): Promise<Record<string, string | null>> {
    const phone = asPhone(Boolean(scenario.phone))
    quiet()
    // what scrolled into view, and which element asked (the phone's «Reconfigure and regenerate» brings the panel to the top)
    const scrolls: unknown[] = []
    Element.prototype.scrollIntoView = function (this: Element, ...args: unknown[]) { scrolls.push([this.id || this.classList[0], args]) }
    window.history.replaceState({}, '', '/playlists')
    fakeService.batches = {}
    fakeService.begin((scenario as { playlists?: object[] }).playlists ?? generated())
    const answer = (scenario as { answer?: string }).answer ?? 'ok'
    const asked: string[] = []
    const spy = vi.spyOn(PlaylistsController.prototype, 'handleGenerate').mockImplementation(async (config: object) => {
        asked.push(sorted(config))
        if (answer === 'fails') return null
        // the new playlists remember the recipe they were made with (here with Top 1, so that a panel that follows them shows it)
        if (answer === 'follows') playlistsStore.setPlaylists(generated().map((p: object) => ({ ...p, _meta: { ...config, trackCount: 1 } })))
        return { playlists: [{}] }
    })

    let app: HTMLElement
    let view: ReturnType<typeof playlistsView>
    const open = async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        view = playlistsView()
        await act(async () => {
            await view.render({})
            view.mount({})
            await flush()
        })
    }
    const close = async () => {
        await act(async () => { view.destroy() })
        app.remove()
    }
    await open()

    const snaps: Record<string, string | null> = {}
    const field = (selector: string) => document.querySelector(selector) as Field
    const click = async (selector: string) => { await act(async () => { field(selector).click(); await flush() }) }
    const h = {
        snap: (label: string, selector = '#regeneratePanelMount') => { snaps[label] = normalize(document.querySelector(selector)) },
        note: (label: string, text: string) => { snaps[label] = text },
        click,
        clickWhere: async (selector: string, text: string) => { await act(async () => { ([...document.querySelectorAll<HTMLElement>(selector)].find(e => e.textContent?.includes(text)) as HTMLElement).click(); await flush() }) },
        /** «Regenerate Playlists»: what the panel handed to the controller. */
        config: async (label: string) => {
            const before = asked.length
            await click('[data-action="regenerate-playlists"]')
            snaps[label] = asked.length > before ? asked[asked.length - 1] : 'nothing was asked'
        },
        /** A letter in the name of the batch: the screen draws again, the panel is made again from what it remembers. */
        type: async (selector: string, value: string) => {
            await act(async () => {
                const input = field(selector)
                // the way a browser writes into a field React owns
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
                input.dispatchEvent(new Event('input', { bubbles: true }))
                await flush()
            })
        },
        /** The slider moves by a script: only the event `input` says so (React's `onChange` does not hear a value written this way). */
        slide: async (selector: string, value: number) => {
            await act(async () => {
                const slider = field(selector)
                slider.value = String(value)
                slider.dispatchEvent(new Event('input', { bubbles: true }))
                await flush()
            })
        },
        /** The batch gets a name inside the playlists (a save, a rename): what the panel is made from changes, so it is made again. */
        nameBatch: async (name: string) => { await act(async () => { playlistsStore.setPlaylists(playlistsStore.getPlaylists().map((p: object) => ({ ...p, batchName: name }))); await flush() }) },
        reopen: async () => { await close(); await open() },
        scrolled: () => JSON.stringify(scrolls.splice(0)),
        turn: async (to: boolean) => { await act(async () => { phone.turn(to); await flush() }) }
    }
    try {
        await scenario.run(h as never)
    } finally {
        await close()
        spy.mockRestore()
    }
    return snaps
}
