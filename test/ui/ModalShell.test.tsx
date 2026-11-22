/**
 * ModalShell is the window of the app, written as React (F83 wave 5b; it was the twin of the hand-made components/ui/BaseModal.js until wave 8b). That the
 * shell draws the same panel, header, close button and classes as the hand-made one did, for each width, with and without a footer, and as the whole
 * screen or a sheet on the phone, is kept in test/ui/engines.sameAsBefore.test.tsx against the picture of the hand-made shell
 * (test/fixtures/windowShellBeforeF83.json); what is here is what the shell does.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { ModalShell } from '../../public/js/ui/ModalShell'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function open(element: React.ReactElement) {
    const host = document.body.appendChild(document.createElement('div'))
    await act(async () => { createRoot(host).render(element) })
}

describe('ModalShell', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('the close button asks for what the window gave', async () => {
        const onClose = vi.fn()
        await open(<ModalShell id="w" title="T" onClose={onClose}><p>x</p></ModalShell>)

        await act(async () => { document.querySelector<HTMLElement>('.app-modal__close')!.click() })

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('a click on the backdrop closes the window only when the window asks for it, and a click on the panel never does', async () => {
        const quiet = vi.fn()
        await open(<ModalShell id="quiet" title="T" onClose={quiet}><p>x</p></ModalShell>)
        await act(async () => { document.getElementById('quiet')!.click() })
        expect(quiet).not.toHaveBeenCalled()

        const asking = vi.fn()
        await open(<ModalShell id="asking" title="T" onClose={asking} closeOnBackdrop><p>x</p></ModalShell>)
        await act(async () => { document.querySelector<HTMLElement>('#asking .app-modal__panel')!.click() })
        expect(asking).not.toHaveBeenCalled()
        await act(async () => { document.getElementById('asking')!.click() })
        expect(asking).toHaveBeenCalledTimes(1)
    })

    it('the form on the phone is a class: the whole screen by default, a sheet from the bottom when asked', async () => {
        await open(<ModalShell id="a" title="T" onClose={() => { }}><p>x</p></ModalShell>)
        await open(<ModalShell id="b" title="T" sheet="bottom" onClose={() => { }}><p>x</p></ModalShell>)

        expect(document.getElementById('a')!.classList.contains('app-modal--full')).toBe(true)
        expect(document.getElementById('b')!.classList.contains('app-modal--bottom')).toBe(true)
        expect(document.getElementById('b')!.classList.contains('app-modal--full')).toBe(false)
    })
})
