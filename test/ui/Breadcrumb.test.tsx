/**
 * F83 wave 2 (judge's recheck, P1): a click on a step of the trail moves once. The router listens to every link of the page; the
 * step must not be told to it a second time, or the question before leaving with unsaved work is asked twice on Cancel.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Breadcrumb } from '../../public/js/ui/Breadcrumb'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Breadcrumb', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('a step is followed once: the click does not reach the router\'s listener on the document', async () => {
        const host = document.body.appendChild(document.createElement('div'))
        const onNavigate = vi.fn()
        const routerListener = vi.fn()
        document.addEventListener('click', routerListener)
        try {
            await act(async () => { createRoot(host).render(<Breadcrumb crumbs={[{ label: 'Start', path: '/start' }, { label: 'Playlists', path: '/playlists' }]} onNavigate={onNavigate} />) })
            await act(async () => { host.querySelector<HTMLElement>('.breadcrumb-link')!.click() })
            expect(onNavigate).toHaveBeenCalledTimes(1)
            expect(onNavigate).toHaveBeenCalledWith('/start')
            expect(routerListener).not.toHaveBeenCalled()
        } finally {
            document.removeEventListener('click', routerListener)
        }
    })
})
