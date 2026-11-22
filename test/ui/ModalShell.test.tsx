/**
 * ModalShell is the window of the app (components/ui/BaseModal.js) written as React (F83 wave 5b): the same panel, header, close button and
 * classes. Until the hand-made shell goes (wave 8) the two are kept equal here: the shell of BaseModal.render and the shell of ModalShell are
 * compared element by element, attribute by attribute (the classes as a set), for each width and with and without a footer.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { BaseModal } from '../../public/js/components/ui/BaseModal.js'
import { normalize } from '../support/savedPlaylistsScenarios.js'
import { ModalShell } from '../../public/js/ui/ModalShell'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('ModalShell is the shell of BaseModal', () => {
    afterEach(() => { document.body.innerHTML = '' })

    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
        for (const withFooter of [true, false]) {
            it(`size ${size}, ${withFooter ? 'with' : 'without'} a footer`, async () => {
                const body = document.createElement('p')
                body.textContent = 'inside'
                const footer = document.createElement('button')
                footer.textContent = 'OK'
                const hand = BaseModal.render({ id: 'w', title: 'A window', content: body, footer: withFooter ? footer : undefined, size, onClose: () => {} })

                const host = document.body.appendChild(document.createElement('div'))
                await act(async () => {
                    createRoot(host).render(
                        <ModalShell id="w" title="A window" size={size} onClose={() => {}} footer={withFooter ? <button>OK</button> : undefined}><p>inside</p></ModalShell>
                    )
                })
                const react = document.getElementById('w')!

                // the hand-made `button` has type="button" from SafeDOM; the footer's one here is only a stand-in for what the window puts in
                const pageOf = (element: Element) => normalize(element).replace(/ type="button"/g, '')
                expect(pageOf(react)).toBe(pageOf(hand))
            })
        }
    }

    it('the close button asks for what the window gave', async () => {
        const onClose = vi.fn()
        const host = document.body.appendChild(document.createElement('div'))
        await act(async () => { createRoot(host).render(<ModalShell id="w" title="T" onClose={onClose}><p>x</p></ModalShell>) })

        await act(async () => { document.querySelector<HTMLElement>('.app-modal__close')!.click() })

        expect(onClose).toHaveBeenCalledTimes(1)
    })
})
