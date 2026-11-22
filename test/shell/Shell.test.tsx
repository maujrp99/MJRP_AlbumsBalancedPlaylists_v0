/**
 * F83 wave 3 (TASK-19): what the shell in React does that the page of a step does not say. The page after each step is proved against the
 * hand-made shell in Shell.sameAsBefore.test.tsx; here: it lets go of everything when it stops, a link moves the router once, the bar follows
 * the address, the name a screen gave itself goes at the end of a navigation, and
 * the window to sign in is one however many times it is asked for.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'

vi.mock('../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../support/shellScenarios.js')).stand.login }))
vi.mock('../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../support/shellScenarios.js')).stand.musicKit }))
vi.mock('../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../support/shellScenarios.js')).stand.spotify }))
vi.mock('../../public/js/stores/toasts.js', async (importOriginal) => ({ ...(await importOriginal<object>()), default: (await import('../support/shellScenarios.js')).stand.toast }))
vi.mock('../../public/js/ui/dialogs/dialogs', async () => ({ dialogService: (await import('../support/shellScenarios.js')).stand.dialog }))
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

    it('a link of the bar and of the line under it moves the router once: the click is the router\'s, the bar does not move it too', async () => {
        const navigate = vi.spyOn(router, 'navigate').mockImplementation(() => {})
        const adapter = await startOnPage('/saved-playlists')
        await adapter.act(async () => { document.querySelector<HTMLElement>('#top-menu-bar a[href="/blend"]')!.click(); await flush() })
        expect(navigate.mock.calls).toEqual([['/blend']])
        navigate.mockClear()
        await adapter.act(async () => { document.querySelector<HTMLElement>('#top-menu-sub a[href="/playlists"]')!.click(); await flush() })
        expect(navigate.mock.calls).toEqual([['/playlists']])
        adapter.stop()
    })

    it('a tab of the phone moves the router once', async () => {
        const navigate = vi.spyOn(router, 'navigate').mockImplementation(() => {})
        const phone = await startOnPage('/start', { phone: true })
        await phone.act(async () => { document.querySelector<HTMLElement>('#phone-tabbar [data-tab="blend"]')!.click(); await flush() })
        expect(navigate.mock.calls).toEqual([['/blend']])
        phone.stop()
    })

    it('the bar follows the address: the current stop and the line under it move at the end of a navigation', async () => {
        const adapter = await startOnPage('/start')
        const current = () => [...document.querySelectorAll('#top-menu-bar a[aria-current="page"]')].map(a => a.getAttribute('href'))
        expect(current()).toEqual(['/start'])
        await adapter.act(async () => { window.history.pushState({}, '', '/inventory'); adapter.navigated('/inventory'); await flush() })
        expect(current()).toEqual(['/inventory'])
        await adapter.act(async () => { window.history.pushState({}, '', '/albums/abc'); adapter.navigated('/albums/abc'); await flush() })
        expect(current()).toEqual(['/albums'])
        expect(document.querySelector('#top-menu-sub a[aria-current="page"]')!.textContent).toBe('By Album')
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
            expect(document.querySelector('#top-menu-bar a[href="/start"]')!.textContent!.trim()).toBe('Início')
        } finally {
            window.localStorage.removeItem(PREVIEW_KEY)
            await act(async () => { await setLocale('en') })
            adapter.stop()
        }
    })
})
