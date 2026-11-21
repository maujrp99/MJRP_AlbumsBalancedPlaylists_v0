/**
 * F83 wave 3 (TASK-19): what the shell in React does that the page of a step does not say. The page after each step is proved against the
 * hand-made shell in Shell.sameAsBefore.test.tsx; here: it lets go of everything when it stops, a link moves the router once, the bar follows
 * the address (the hand-made one did not), the name a screen gave itself goes at the end of a navigation, the chevron of the drawer turns, and
 * the window to sign in is one however many times it is asked for.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'

vi.mock('../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../support/shellScenarios.js')).stand.login }))
vi.mock('../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../support/shellScenarios.js')).stand.spotify }))
vi.mock('../../public/js/components/Toast.js', async () => ({ default: (await import('../support/shellScenarios.js')).stand.toast }))
vi.mock('../../public/js/services/DialogService.js', async () => ({ dialogService: (await import('../support/shellScenarios.js')).stand.dialog }))
vi.mock('../../public/js/services/usage/track.js', async () => ({ track: (await import('../support/shellScenarios.js')).stand.track }))
vi.mock('../../public/js/utils/reloadApp.js', async () => ({ reloadApp: (await import('../support/shellScenarios.js')).stand.reloadApp }))

import { router } from '../../public/js/router.js'
import { screenNameStore, nameThisScreen } from '../../public/js/stores/screenName.js'
import { loginWindowStore, openLoginWindow } from '../../public/js/stores/loginWindow.js'
import { showDiscogsNotice } from '../../public/js/stores/discogsNotice.js'
import { startOn, itLeavesNoListeners } from '../support/renderShell'
import { world, scopedIdLookup, user } from '../support/shellScenarios.js'

const flush = () => new Promise(resolve => setTimeout(resolve, 25))

const startOnPage = (path: string, { phone = false, signedIn = false } = {}) => startOn(path, { phone, user: signedIn ? user() : null })

describe('the shell in React', () => {
    beforeEach(() => { world.reset(); scopedIdLookup(); loginWindowStore.close(); screenNameStore.clear(); showDiscogsNotice(false) })
    afterEach(() => { document.body.innerHTML = ''; document.body.removeAttribute('style'); vi.restoreAllMocks() })

    itLeavesNoListeners('the shell', user())

    it('a link of the bar moves the router once: the click is the router\'s, the bar does not move it too', async () => {
        const navigate = vi.spyOn(router, 'navigate').mockImplementation(() => {})
        const adapter = await startOnPage('/start')
        await adapter.act(async () => { document.querySelector<HTMLElement>('a[href="/blend"]')!.click(); await flush() })
        expect(navigate.mock.calls).toEqual([['/blend']])
        navigate.mockClear()
        await adapter.act(async () => { document.querySelector<HTMLElement>('#seriesDropdownBtn')!.click(); await flush() })
        await adapter.act(async () => { document.querySelector<HTMLElement>('#seriesDropdownMenu a[href="/albums"]')!.click(); await flush() })
        expect(navigate.mock.calls).toEqual([['/albums']])
        adapter.stop()
    })

    it('a link of the drawer and a tab of the phone move the router once, and the drawer closes', async () => {
        const navigate = vi.spyOn(router, 'navigate').mockImplementation(() => {})
        const adapter = await startOnPage('/start')
        await adapter.act(async () => { document.getElementById('mobileMenuBtn')!.click(); await flush() })
        await adapter.act(async () => { document.querySelector<HTMLElement>('#mobileMenu a[href="/inventory"]')!.click(); await flush() })
        expect(navigate.mock.calls).toEqual([['/inventory']])
        expect(document.getElementById('mobileMenu')!.classList.contains('-translate-x-full')).toBe(true)
        adapter.stop()

        navigate.mockClear()
        const phone = await startOnPage('/start', { phone: true })
        await phone.act(async () => { document.querySelector<HTMLElement>('[data-tab="blend"]')!.click(); await flush() })
        expect(navigate.mock.calls).toEqual([['/blend']])
        phone.stop()
    })

    it('the bar follows the address: the current link and the label of the menu of series move at the end of a navigation (the hand-made bar stayed where it first was drawn)', async () => {
        const adapter = await startOnPage('/start')
        const current = () => [...document.querySelectorAll('#header-container nav > div.hidden > a')].filter(a => a.classList.contains('text-accent-primary')).map(a => a.getAttribute('href'))
        expect(current()).toEqual(['/start'])
        await adapter.act(async () => { window.history.pushState({}, '', '/inventory'); adapter.navigated('/inventory'); await flush() })
        expect(current()).toEqual(['/inventory'])
        await adapter.act(async () => { window.history.pushState({}, '', '/albums/abc'); adapter.navigated('/albums/abc'); await flush() })
        expect(current()).toEqual([])
        expect(document.getElementById('seriesDropdownBtn')!.textContent!.trim()).toBe('By Album')
        adapter.stop()
    })

    it('the name a screen gave itself goes at the end of the next navigation, on the computer too', async () => {
        const adapter = await startOnPage('/albums')
        await adapter.act(async () => { nameThisScreen('Prog Rock'); await flush() })
        expect(screenNameStore.getName()).toBe('Prog Rock')
        await adapter.act(async () => { adapter.navigated('/blend'); await flush() })
        expect(screenNameStore.getName()).toBeNull()
        adapter.stop()
    })

    it('the drawer turns the chevron of «Music Series», not the music note', async () => {
        const adapter = await startOnPage('/start')
        const icons = () => [...document.querySelectorAll('#mobileSeriesToggle svg')].map(svg => svg.getAttribute('class') ?? '')
        expect(icons().some(classes => classes.includes('rotate-180'))).toBe(false)
        await adapter.act(async () => { document.getElementById('mobileSeriesToggle')!.click(); await flush() })
        const [note, chevron] = icons()
        expect(note).not.toContain('rotate-180')
        expect(chevron).toContain('rotate-180')
        adapter.stop()
    })

    it('the window to sign in is one however many times it is asked for, and the page is held while it is open', async () => {
        const adapter = await startOnPage('/start', { phone: true })
        await adapter.act(async () => { openLoginWindow(); openLoginWindow(); await flush() })
        expect(document.querySelectorAll('.modal-overlay').length).toBe(1)
        await adapter.act(async () => { document.querySelector<HTMLElement>('[data-action="cancel"]')!.click(); await flush() })
        expect(document.querySelectorAll('.modal-overlay').length).toBe(0)
        adapter.stop()
    })

    it('the sentence about Discogs is on the page, hidden, until a screen turns it on', async () => {
        const adapter = await startOnPage('/inventory')
        const notice = () => document.getElementById('discogsApiNotice')!
        expect(notice().hidden).toBe(true)
        await adapter.act(async () => { showDiscogsNotice(true); await flush() })
        expect(notice().hidden).toBe(false)
        await adapter.act(async () => { showDiscogsNotice(false); await flush() })
        expect(notice().hidden).toBe(true)
        adapter.stop()
    })

    it('in Portuguese (the owner\'s preview) the shell speaks Portuguese, and an English reserve covers what is missing', async () => {
        const { registerTexts, setLocale, PREVIEW_KEY } = await import('../../public/js/i18n/t.js')
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        const { pt } = await import('../../public/js/i18n/pt/index.js')
        registerTexts('pt', pt)
        const adapter = await startOnPage('/start')
        try {
            await adapter.act(async () => { await setLocale('pt'); await flush() })
            expect(document.getElementById('loginBtn')!.textContent!.trim()).toBe('Entrar')
            expect(document.getElementById('footerClearCache')!.textContent).toBe('Limpar o cache')
            expect(document.querySelector('#header-container nav > div.hidden > a')!.textContent!.trim()).toBe('Início')
        } finally {
            window.localStorage.removeItem(PREVIEW_KEY)
            await act(async () => { await setLocale('en') })
            adapter.stop()
        }
    })
})
