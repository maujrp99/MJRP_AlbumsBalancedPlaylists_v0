/**
 * F83 wave 8b - written once, on the hand-made engines (components/Toast.js, components/GlobalProgress.js, services/DialogService.js with
 * components/ui/BaseModal.js, modals/ConfirmModal.js and InputModal.js): it plays every scenario of test/support/engineScenarios.js and writes what
 * stood in the page to test/fixtures/enginesBeforeF83.json, and the shell of the window in every size to test/fixtures/windowShellBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/). It ran as test/engines/capture.test.js on the tree of f4eae56 (the
 * parent of the wave), before the engines were rewritten, and was removed.
 */
import { describe, it, vi } from 'vitest'
import fs from 'node:fs'
import { play } from '../support/engineWorld.js'
import { TOAST_SCENARIOS, PROGRESS_SCENARIOS, DIALOG_SCENARIOS, SHELL_CASES, keyOf } from '../support/engineScenarios.js'
import { normalize } from '../support/savedPlaylistsScenarios.js'

const captured = { toast: {}, progress: {}, dialogs: {} }

const handMade = {
    toast: async () => {
        const { toast, showToast } = await import('../../public/js/components/Toast.js')
        return { toast, showToast }
    },
    progress: async () => {
        const { globalProgress } = await import('../../public/js/components/GlobalProgress.js')
        return { progress: globalProgress }
    },
    dialogs: async () => {
        const { dialogService } = await import('../../public/js/services/DialogService.js')
        return { dialogs: dialogService, screenLeft: () => { }, teardown: () => dialogService.close() }
    }
}

describe('capture of the hand-made engines', () => {
    for (const [group, scenarios] of [['toast', TOAST_SCENARIOS], ['progress', PROGRESS_SCENARIOS], ['dialogs', DIALOG_SCENARIOS]]) {
        for (const scenario of scenarios) {
            it(keyOf(scenario), async () => {
                vi.resetModules()
                captured[group][keyOf(scenario)] = await play(scenario, handMade[group])
            })
        }
    }

    it('the shell of the window, in every size', async () => {
        const { BaseModal } = await import('../../public/js/components/ui/BaseModal.js')
        const shells = {}
        for (const { size, sheet, withFooter } of SHELL_CASES) {
            const body = document.createElement('p')
            body.textContent = 'inside'
            const footer = document.createElement('button')
            footer.textContent = 'OK'
            shells[`${size} ${sheet} ${withFooter ? 'footer' : 'no footer'}`] = normalize(BaseModal.render({ id: 'w', title: 'A window', content: body, footer: withFooter ? footer : undefined, size, sheet, onClose: () => { } }))
        }
        fs.writeFileSync('test/fixtures/windowShellBeforeF83.json', `${JSON.stringify(shells, null, 1)}\n`)
        fs.writeFileSync('test/fixtures/enginesBeforeF83.json', `${JSON.stringify(captured, null, 1)}\n`)
    })
})
