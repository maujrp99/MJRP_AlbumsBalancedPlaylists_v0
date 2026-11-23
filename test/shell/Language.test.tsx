/**
 * F81 TASK-03 (REQ-04): the language selector of the app, in the account panel of the computer and in the menu of the phone. It shows the
 * language spoken now, changes the whole shell with no reload, sets the page's `lang`, keeps the choice on the device (the key of the entry
 * page) and leaves the focus on the language picked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../support/shellScenarios.js')).stand.login }))
vi.mock('../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../support/shellScenarios.js')).stand.musicKit }))
vi.mock('../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../support/shellScenarios.js')).stand.spotify }))
vi.mock('../../public/js/stores/toasts.js', async (importOriginal) => ({ ...(await importOriginal<object>()), default: (await import('../support/shellScenarios.js')).stand.toast }))
vi.mock('../../public/js/ui/dialogs/dialogs', async () => ({ dialogService: (await import('../support/shellScenarios.js')).stand.dialog }))
vi.mock('../../public/js/services/usage/track.js', async () => ({ track: (await import('../support/shellScenarios.js')).stand.track }))
vi.mock('../../public/js/utils/reloadApp.js', async () => ({ reloadApp: (await import('../support/shellScenarios.js')).stand.reloadApp }))

import { loginWindowStore } from '../../public/js/stores/loginWindow.js'
import { screenNameStore } from '../../public/js/stores/screenName.js'
import { getLocale, setLocale } from '../../public/js/i18n/t.js'
import { LANG_KEY, startLanguage } from '../../public/js/i18n/language.js'
import { startOn } from '../support/renderShell'
import { world, scopedIdLookup } from '../support/shellScenarios.js'

const flush = () => new Promise(resolve => setTimeout(resolve, 25))
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!
const $$ = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)]
type Shell = Awaited<ReturnType<typeof startOn>>
const tap = (shell: Shell, element: HTMLElement) => shell.act(async () => { element.click(); await flush() })

const ANA = { isAnonymous: false, displayName: 'Ana', email: 'ana@example.test', photoURL: '/a.png' }
const abroad = async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ country: '' }) })

let shell: Shell | null = null
const on = async (...args: Parameters<typeof startOn>) => { shell = await startOn(...args); return shell }

beforeEach(async () => {
    world.reset(); scopedIdLookup(); loginWindowStore.close(); screenNameStore.clear()
    window.localStorage.removeItem(LANG_KEY)
    await startLanguage({ fetch: abroad as unknown as typeof fetch })
})
afterEach(async () => {
    shell?.stop()
    shell = null
    await setLocale('en')
    window.localStorage.removeItem(LANG_KEY)
    document.documentElement.lang = 'en'
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
    vi.restoreAllMocks()
})

const rows = (inside: string) => $$(`${inside} [data-language-picker] button[data-lang]`)
const pressed = (inside: string) => rows(inside).filter(row => row.getAttribute('aria-pressed') === 'true').map(row => row.dataset.lang)

describe('the language selector in the account panel of the computer (F81)', () => {
    it.each([['a visitor', null], ['who is signed in', ANA]])('%s finds it in the panel: a named group with the two languages, each written in its own language, and the one spoken now marked', async (_who, user) => {
        const s = await on('/start', { user: user as never })
        await tap(s, $('#userMenuBtn'))

        const group = $('#userMenu [data-language-picker]')
        expect(group.getAttribute('role')).toBe('group')
        expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent).toBe('Language')
        expect(rows('#userMenu').map(row => row.dataset.lang)).toEqual(['pt', 'en'])
        expect(rows('#userMenu').map(row => row.querySelector('.lang-row__name')!.textContent)).toEqual(['Português', 'English'])
        expect(rows('#userMenu').map(row => row.querySelector('.lang-row__code')!.textContent)).toEqual(['PT', 'EN'])
        expect(rows('#userMenu').map(row => row.getAttribute('lang'))).toEqual(['pt-BR', 'en'])
        rows('#userMenu').forEach(row => { expect(row.tagName).toBe('BUTTON'); expect(row.classList.contains('top-panel__row')).toBe(true) })
        expect(pressed('#userMenu')).toEqual(['en'])
    })

    it('picking Portuguese changes the whole shell with no reload, the lang of the page and what the device keeps; the panel stays open and the focus is on the language picked', async () => {
        const s = await on('/start', { user: ANA as never })
        await tap(s, $('#userMenuBtn'))
        expect($('#logoutBtn').textContent!.trim()).toBe('Sign Out')

        await tap(s, rows('#userMenu')[0])

        expect(getLocale()).toBe('pt')
        expect(document.documentElement.lang).toBe('pt-BR')
        expect(window.localStorage.getItem(LANG_KEY)).toBe('pt')
        expect(pressed('#userMenu')).toEqual(['pt'])
        expect($('#logoutBtn').textContent!.trim()).toBe('Sair')
        expect(document.querySelector('#top-menu-bar a[href="/start"]')!.textContent!.trim()).toBe('Criar')
        expect(document.getElementById($('#userMenu [data-language-picker]').getAttribute('aria-labelledby')!)!.textContent).toBe('Idioma')
        expect($('#userMenu').classList.contains('invisible')).toBe(false)
        expect(document.activeElement).toBe(rows('#userMenu')[0])

        await tap(s, rows('#userMenu')[1])
        expect(getLocale()).toBe('en')
        expect(document.documentElement.lang).toBe('en')
        expect(window.localStorage.getItem(LANG_KEY)).toBe('en')
        expect($('#logoutBtn').textContent!.trim()).toBe('Sign Out')
        expect(document.activeElement).toBe(rows('#userMenu')[1])
    })
})

describe('the language selector in the menu of the phone (F81)', () => {
    beforeEach(() => { window.scrollTo = () => {} })

    it('is in the sheet, under its own title, with the rows of the menu', async () => {
        const s = await on('/albums', { phone: true })
        await tap(s, $('#phoneMenuBtn'))

        const group = $('#phone-menu [data-language-picker]')
        expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.classList.contains('phone-menu__section')).toBe(true)
        expect(rows('#phone-menu').map(row => row.querySelector('.lang-row__name')!.textContent)).toEqual(['Português', 'English'])
        rows('#phone-menu').forEach(row => expect(row.classList.contains('phone-menu__row')).toBe(true))
        expect(pressed('#phone-menu')).toEqual(['en'])
    })

    it('picking Portuguese changes the sheet where it is, the tab bar under it and the label of its close button; the focus is on the language picked', async () => {
        const s = await on('/albums', { phone: true })
        await tap(s, $('#phoneMenuBtn'))

        await tap(s, rows('#phone-menu')[0])

        expect(getLocale()).toBe('pt')
        expect(document.documentElement.lang).toBe('pt-BR')
        expect(window.localStorage.getItem(LANG_KEY)).toBe('pt')
        expect(pressed('#phone-menu')).toEqual(['pt'])
        expect($('#phone-menu').classList.contains('sheet--closing')).toBe(false)
        expect($$('#phone-menu .phone-menu__label').map(label => label.textContent)).toContain('Novas playlists')
        expect($('#phone-menu .sheet__close').getAttribute('aria-label')).toBe('Fechar')
        expect($('#phone-tabbar').textContent).toContain('Acervo')
        expect(document.activeElement).toBe(rows('#phone-menu')[0])
    })
})
