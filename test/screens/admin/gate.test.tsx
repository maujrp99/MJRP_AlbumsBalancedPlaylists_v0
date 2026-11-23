/**
 * F82 TASK-01 (REQ-01, REQ-10): what everybody but the administrator sees at /admin: «Page not found», with the way back
 * and nothing of the Painel. It follows the texts like every screen (the judge of 2026-11-23, P2-3): a published text that
 * arrives or goes away is drawn at once, as text, never as markup.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { NotFound } from '../../../public/js/ui/NotFound'
import { registerPublishedTexts } from '../../../public/js/i18n/t.js'
import { renderScreen, itLeavesNoListeners, type RenderedScreen } from '../../support/renderScreen'

let open: RenderedScreen | null = null
afterEach(async () => {
    await open?.leave()
    open = null
    registerPublishedTexts('en', {})
})

describe('«Page not found»', () => {
    it('says so, with the way back to the app, and nothing of the Painel', async () => {
        open = await renderScreen(NotFound, {}, { screen: 'admin' })
        expect(open.app.querySelector('[data-screen="not-found"] .text-xl')?.textContent).toBe('Page not found')
        expect(open.app.querySelector('p')?.textContent).toBe('There is nothing at this address.')
        expect(open.app.querySelector('a')?.getAttribute('href')).toBe('/start')
        expect(open.app.textContent).not.toMatch(/admin|Painel/i)
    })

    it('draws again when a published text arrives or goes away, as text, never as markup', async () => {
        open = await renderScreen(NotFound, {}, { screen: 'admin' })
        const app = open.app
        await open.act(() => registerPublishedTexts('en', { 'notices.router.notFoundBody': 'Nothing <b>here</b>.' }))
        expect(app.querySelector('p')?.textContent).toBe('Nothing <b>here</b>.')
        expect(app.querySelector('p b')).toBeNull()
        await open.act(() => registerPublishedTexts('en', {}))
        expect(app.querySelector('p')?.textContent).toBe('There is nothing at this address.')
    })
})

itLeavesNoListeners('NotFound', NotFound, {}, { screen: 'admin' })
