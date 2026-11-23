/**
 * F83 wave 8b: the notices, the loading bar and the question windows in React draw what the hand-made engines (components/Toast.js,
 * components/GlobalProgress.js, services/DialogService.js with BaseModal, ConfirmModal and InputModal) drew, and act the same.
 *
 * The proof: for every scenario of test/support/engineScenarios.js (every kind of notice and its clock to the millisecond, the stacking, the close
 * button, the loading bar's count and its 200 ms, every question window: its pieces, focus, Escape, backdrop, Enter, the one-at-a-time rule) the page after
 * each step, the focus and what the caller was answered equal what the hand-made engine gave at the same step. The pictures are in
 * test/fixtures/enginesBeforeF83.json and windowShellBeforeF83.json, written once by the hand-made engines (reports/evidence/F83/wave-8b/capture-before.test.js).
 *
 * KNOWN_DIFFERENCES is empty: there is nothing these engines do differently. The last tests prove the check is not blind: a word, a class and a delay
 * of one millisecond, changed on purpose, are accused.
 */
import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { play } from '../support/engineWorld.js'
import { TOAST_SCENARIOS, PROGRESS_SCENARIOS, DIALOG_SCENARIOS, SHELL_CASES, keyOf } from '../support/engineScenarios.js'
import { normalize } from '../support/savedPlaylistsScenarios.js'
import { createToasts } from '../../public/js/stores/toasts.js'
import { createProgress } from '../../public/js/stores/progress.js'
import { Toasts } from '../../public/js/shell/Toasts'
import { GlobalProgress } from '../../public/js/shell/GlobalProgress'
import { ModalShell } from '../../public/js/ui/ModalShell'
import before from '../fixtures/enginesBeforeF83.json'
import shells from '../fixtures/windowShellBeforeF83.json'

const captured = before as Record<string, Record<string, Record<string, string>>>

/** Puts a React layer on the page the way the shell does: a root with no place of its own, drawing through a portal into `body`. */
async function mounted(layer: React.ReactNode) {
    const root = createRoot(document.createElement('div'))
    act(() => { root.render(layer) })
    return () => { act(() => { root.unmount() }) }
}

const engines = {
    toast: async () => {
        const store = createToasts()
        const teardown = await mounted(<Toasts store={store} />)
        return { toast: store.toast, showToast: store.showToast, teardown }
    },
    progress: async () => {
        const store = createProgress()
        const teardown = await mounted(<GlobalProgress store={store} />)
        return { progress: store, teardown }
    },
    dialogs: async () => {
        const { DialogService } = await import('../../public/js/ui/dialogs/dialogs')
        const { closeAllWindows } = await import('../../public/js/ui/windowLayer')
        const service = new DialogService()
        return {
            dialogs: service,
            screenLeft: () => { act(() => { closeAllWindows() }) },
            teardown: async () => { act(() => { service.close() }); await Promise.resolve() }
        }
    }
} as const

const groups = [['toast', TOAST_SCENARIOS], ['progress', PROGRESS_SCENARIOS], ['dialogs', DIALOG_SCENARIOS]] as const

describe('the engines in React draw what the hand-made ones drew', () => {
    for (const [group, scenarios] of groups) {
        describe(group, () => {
            it('the file of the old pages is the whole list of scenarios', () => {
                expect(Object.keys(captured[group]).sort()).toEqual(scenarios.map(keyOf).sort())
            })

            for (const scenario of scenarios) {
                const key = keyOf(scenario)
                it(key, async () => {
                    const snaps = await play(scenario, engines[group])
                    expect(Object.keys(snaps)).toEqual(Object.keys(captured[group][key]))
                    for (const [label, page] of Object.entries(snaps)) {
                        expect(page, `${key} · ${label}`).toBe(captured[group][key][label])
                    }
                })
            }
        })
    }

    it('the shell of a window, in every size, is the one the hand-made shell drew', async () => {
        const kept = shells as Record<string, string>
        expect(Object.keys(kept).length).toBe(SHELL_CASES.length)
        for (const { size, sheet, withFooter } of SHELL_CASES) {
            const host = document.body.appendChild(document.createElement('div'))
            const root = createRoot(host)
            act(() => {
                root.render(
                    <ModalShell id="w" title="A window" size={size as 'sm'} sheet={sheet as 'full' | 'bottom' | undefined} onClose={() => { }} footer={withFooter ? <button>OK</button> : undefined}><p>inside</p></ModalShell>
                )
            })
            const label = `${size} ${sheet} ${withFooter ? 'footer' : 'no footer'}`
            expect(normalize(document.getElementById('w')), label).toBe(kept[label])
            act(() => { root.unmount() })
            host.remove()
        }
    })

    describe('the check is not blind', () => {
        const run = (scenario: (typeof TOAST_SCENARIOS)[number], change: (page: string) => string) => play(scenario, engines.toast, change)
        const first = TOAST_SCENARIOS[0]

        it('a word changed on purpose is accused', async () => {
            const snaps = await run(first, (page) => page.replace('notice', 'notise'))
            expect(snaps['just called']).not.toBe(captured.toast[keyOf(first)]['just called'])
        })

        it('a class changed on purpose is accused', async () => {
            const snaps = await run(first, (page) => page.replace('translate-x-full', 'translate-x-0'))
            expect(snaps['just called']).not.toBe(captured.toast[keyOf(first)]['just called'])
        })

        it('a clock one millisecond off is accused', async () => {
            const early = { name: first.name, run: async (w: Parameters<typeof first.run>[0]) => {
                w.toast.success('A success notice')
                await w.advance(16)
                await w.advance(3983)
                await w.snap('4000 ms, one early')
            } }
            const snaps = await play(early, engines.toast)
            expect(snaps['4000 ms, one early']).not.toBe(captured.toast[keyOf(first)]['4000 ms'])
        })
    })
})
