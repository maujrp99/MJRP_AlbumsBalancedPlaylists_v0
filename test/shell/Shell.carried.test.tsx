/**
 * F83 wave 3 (TASK-19): the tests of the hand-made shell, carried to the shell in React. The scaffold changes (the shell is started with
 * `startOn`, and read with `querySelector` as before); the assertions are the old ones. Each describe says which file it came from:
 * components/Footer.test.js, AuthNav.menu.test.js, AuthNav.signout.test.js, LoginModal.guestNotice.test.js, TopBarNames.test.js,
 * navigation/PhoneShell.test.js, navigation/PhoneMenu.test.js and the menu and phone parts of navigation/startRoute.test.js.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { inflateSync } from 'node:zlib'

vi.mock('../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../support/shellScenarios.js')).stand.login }))
vi.mock('../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../support/shellScenarios.js')).stand.musicKit }))
vi.mock('../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../support/shellScenarios.js')).stand.spotify }))
vi.mock('../../public/js/stores/toasts.js', async (importOriginal) => ({ ...(await importOriginal<object>()), default: (await import('../support/shellScenarios.js')).stand.toast }))
vi.mock('../../public/js/ui/dialogs/dialogs', async () => ({ dialogService: (await import('../support/shellScenarios.js')).stand.dialog }))
vi.mock('../../public/js/services/usage/track.js', async () => ({ track: (await import('../support/shellScenarios.js')).stand.track }))
vi.mock('../../public/js/utils/reloadApp.js', async () => ({ reloadApp: (await import('../support/shellScenarios.js')).stand.reloadApp }))

import { loginWindowStore } from '../../public/js/stores/loginWindow.js'
import { screenNameStore, nameThisScreen } from '../../public/js/stores/screenName.js'
import { pageScrollLocks } from '../../public/js/utils/pageScrollLock.js'
import { PHONE_TABS, currentTab, screenName } from '../../public/js/shell/phoneTabs'
import { accountInitial } from '../../public/js/shell/accountNames'
import { NAME_IN_THE_BAR } from '../../public/js/shell/barName'
import { START_PATH, HOME_PATH } from '../../public/js/utils/startRoute.js'
import { albumsTrail } from '../../public/js/ui/Breadcrumb'
import { startOn } from '../support/renderShell'
import { world, scopedIdLookup, user } from '../support/shellScenarios.js'

const flush = () => new Promise(resolve => setTimeout(resolve, 25))
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!
const $$ = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)]
const text = (selector: string) => $(selector).textContent ?? ''

type Shell = Awaited<ReturnType<typeof startOn>>
const tap = (shell: Shell, element: HTMLElement) => shell.act(async () => { element.click(); await flush() })
const press = (shell: Shell, key: string, target: Element | Document = document) => shell.act(async () => { target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); await flush() })

const ANA = { isAnonymous: false, displayName: 'Ana', email: 'ana@example.test', photoURL: '/a.png' }
const NAME = 'Maurício Pedroso da Silva'

let shell: Shell | null = null
const on = async (...args: Parameters<typeof startOn>) => { shell = await startOn(...args); return shell }

beforeEach(() => { world.reset(); scopedIdLookup(); loginWindowStore.close(); screenNameStore.clear() })
afterEach(() => {
    shell?.stop()
    shell = null
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
    vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------------------------------------------------------------
// components/Footer.test.js
describe('Footer "Clear Cache" (F48, UAT-177)', () => {
    let storage: { clear: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn> }

    beforeEach(() => {
        const data = new Map([['spotify_access_token', 'token']])
        storage = {
            getItem: (key: string) => data.get(key) ?? null,
            setItem: (key: string, value: string) => { data.set(key, value) },
            removeItem: vi.fn((key: string) => { data.delete(key) }),
            clear: vi.fn(() => { data.clear() })
        } as never
        vi.stubGlobal('localStorage', storage)
    })
    afterEach(() => { vi.unstubAllGlobals() })

    it('clears the album caches, says so and reloads the page', async () => {
        const clearCaches = vi.fn(async () => ({ legacyEntriesRemoved: 0 }))
        const reload = vi.fn()
        const s = await on('/start', { clearCaches, reload })

        await tap(s, $('#footerClearCache'))

        expect(clearCaches).toHaveBeenCalledTimes(1)
        expect($('#cacheClearedMsg').classList.contains('hidden')).toBe(false)
        expect($('#cacheClearedMsg').textContent).toBe('Cache Cleared!')
        await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1), { timeout: 2500 })
    })

    it('does not wipe localStorage: the Spotify login stays', async () => {
        const s = await on('/start', { clearCaches: vi.fn(async () => ({})), reload: vi.fn() })

        await tap(s, $('#footerClearCache'))

        expect(storage.clear).not.toHaveBeenCalled()
        expect(storage.removeItem).not.toHaveBeenCalled()
        expect(localStorage.getItem('spotify_access_token')).toBe('token')
    })

    it('says it could not clear, and does not reload, when the clearing fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const reload = vi.fn()
        const s = await on('/start', { clearCaches: vi.fn(async () => { throw new Error('blocked') }), reload })

        await tap(s, $('#footerClearCache'))

        expect($('#cacheClearedMsg').classList.contains('hidden')).toBe(false)
        expect($('#cacheClearedMsg').textContent).toMatch(/could not/i)
        expect(reload).not.toHaveBeenCalled()
        expect(($('#footerClearCache') as HTMLButtonElement).disabled).toBe(false)
    })
})

// ---------------------------------------------------------------------------------------------------------------------------------
// components/AuthNav.menu.test.js
describe('the account panel (F63, UAT-13, F88)', () => {
    const trigger = () => $('#userMenuBtn')
    const menu = () => $('#userMenu')
    const isOpen = () => !menu().classList.contains('invisible')
    const signedIn = () => on('/start', { user: ANA })

    it('is drawn closed, and no longer depends on the mouse being over it: one panel, a dialog (F88)', async () => {
        await signedIn()
        expect(isOpen()).toBe(false)
        expect(trigger().getAttribute('aria-expanded')).toBe('false')
        expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
        expect(trigger().getAttribute('aria-controls')).toBe('userMenu')
        expect(menu().getAttribute('role')).toBe('dialog')
        expect(document.body.innerHTML).not.toContain('group-hover:visible')
    })

    it('a tap on the avatar opens it, another tap closes it', async () => {
        const s = await signedIn()
        await tap(s, trigger())
        expect(isOpen()).toBe(true)
        expect(trigger().getAttribute('aria-expanded')).toBe('true')

        await tap(s, trigger())
        expect(isOpen()).toBe(false)
        expect(trigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('a click outside closes it; a click inside does not', async () => {
        const s = await signedIn()
        await tap(s, trigger())

        await tap(s, menu().querySelector('p')!)
        expect(isOpen()).toBe(true)

        await tap(s, $('#app'))
        expect(isOpen()).toBe(false)
    })

    it('a click in a window the panel opened (the «Disconnect from…?» question) does not close the panel (judge P2-5)', async () => {
        const s = await signedIn()
        await tap(s, trigger())
        document.body.insertAdjacentHTML('beforeend', '<div class="app-modal"><div role="dialog"><button id="confirmDisconnect">Disconnect</button></div></div>')
        await tap(s, $('#confirmDisconnect'))
        expect(isOpen()).toBe(true)
        document.querySelector('.app-modal')!.remove()
    })

    it('Escape closes it and gives the focus back to the avatar', async () => {
        const s = await signedIn()
        await tap(s, trigger())
        $('#logoutBtn').focus()

        await press(s, 'Escape')

        expect(isOpen()).toBe(false)
        expect(document.activeElement).toBe(trigger())
    })

    it('Arrow Down on the avatar opens it with the focus on the first control inside', async () => {
        const s = await signedIn()
        trigger().focus()

        await press(s, 'ArrowDown', trigger())

        expect(isOpen()).toBe(true)
        // the first control there is when the panel opens (Apple Music is still being asked: its row has no button yet)
        expect(menu().contains(document.activeElement)).toBe(true)
        expect(document.activeElement!.matches('button, a')).toBe(true)
    })

    it('holds the connections of Apple Music and Spotify, in that order, and says who is signed in, with Sign Out inside', async () => {
        await signedIn()
        expect($$('#accountConnections [data-connection]').map(row => row.dataset.connection)).toEqual(['apple', 'spotify'])
        expect(menu().textContent).toContain('Ana')
        expect(menu().querySelector('#logoutBtn')).not.toBeNull()
    })

    it('asks Apple Music for its true state when the panel opens, not before (nothing heavier at load)', async () => {
        const s = await signedIn()
        expect(world.calls.filter(call => call[0] === 'apple check').length).toBe(0)
        await tap(s, trigger())
        expect(world.calls.filter(call => call[0] === 'apple check').length).toBe(1)
        await tap(s, trigger())
        await tap(s, trigger())
        // the answer is known now: opening again does not ask again
        expect(world.calls.filter(call => call[0] === 'apple check').length).toBe(1)
    })

    it('drawn again (the session changed), it still answers once per tap', async () => {
        const { userStore } = await import('../../public/js/stores/UserStore.js')
        const s = await signedIn()
        await s.act(async () => { userStore.setUser(ANA); userStore.setUser(ANA); await flush() })

        await tap(s, trigger())
        expect(isOpen()).toBe(true)

        await tap(s, $('#app'))
        expect(isOpen()).toBe(false)
    })

    it('with nobody signed in the panel is still there for the connections: no Sign Out, a way to sign in', async () => {
        const s = await on('/start')

        expect(trigger().getAttribute('aria-label')).toMatch(/^Connections/)
        expect(document.getElementById('loginBtn')).not.toBeNull()
        expect(menu().querySelector('#logoutBtn')).toBeNull()
        expect(document.getElementById('accountConnections')).not.toBeNull()
        await tap(s, trigger())
        expect(isOpen()).toBe(true)
        await tap(s, $('#app'))
        await press(s, 'Escape')
        expect(isOpen()).toBe(false)
    })
})

// ---------------------------------------------------------------------------------------------------------------------------------
// components/AuthNav.signout.test.js
describe('sign-out (F59)', () => {
    it('ends the Spotify session together with the account session', async () => {
        const s = await on('/start', { user: ANA })
        await tap(s, $('#logoutBtn'))

        await vi.waitFor(() => expect(world.calls).toContainEqual(['toast success', 'Signed out successfully']))
        expect(world.calls.filter(call => call[0] === 'firebase sign out')).toHaveLength(1)
        expect(world.calls.filter(call => call[0] === 'spotify logout')).toHaveLength(1)
    })

    it('reloads the app after signing out, so nothing of the person who left stays on screen (decision of 2026-11-19)', async () => {
        const s = await on('/start', { user: ANA })
        await tap(s, $('#logoutBtn'))

        await vi.waitFor(() => expect(world.calls.filter(call => call[0] === 'reload app')).toHaveLength(1))
        expect(world.calls.filter(call => call[0] === 'firebase sign out')).toHaveLength(1)
    })

    it('keeps the Spotify session when signing out of the account fails', async () => {
        world.failLogout = true
        const s = await on('/start', { user: ANA })
        await tap(s, $('#logoutBtn'))

        await vi.waitFor(() => expect(world.calls).toContainEqual(['toast error', 'Sign out failed']))
        expect(world.calls.filter(call => call[0] === 'spotify logout')).toHaveLength(0)
        expect(world.calls.filter(call => call[0] === 'reload app')).toHaveLength(0)
    })
})

// ---------------------------------------------------------------------------------------------------------------------------------
// components/LoginModal.guestNotice.test.js
describe('the window to sign in: the guest notice (UAT-12)', () => {
    it('says, before signing in, that what was done as a guest is not carried to the account', async () => {
        const s = await on('/start')
        await s.act(async () => { loginWindowStore.open(); await flush() })
        const notice = $('[data-guest-notice]')
        expect(notice).not.toBeNull()
        expect(notice.textContent).toMatch(/guest/i)
        expect(notice.textContent).toMatch(/not (be )?(copied|carried|moved)/i)
    })

    it('still offers the three ways in', async () => {
        const s = await on('/start')
        await s.act(async () => { loginWindowStore.open(); await flush() })
        expect(document.querySelector('#googleLoginBtn')).not.toBeNull()
        expect(document.querySelector('#appleLoginBtn')).not.toBeNull()
        expect(document.querySelector('[data-action="cancel"]')).not.toBeNull()
    })
})

// ---------------------------------------------------------------------------------------------------------------------------------
// components/TopBarNames.test.js
describe('top bar: names are not cut at 80 px (UAT-211)', () => {
    it('the rule: as wide as the name up to a limit, giving way when the bar has no room, the tail cut with "…"', () => {
        expect(NAME_IN_THE_BAR).toContain('truncate')
        expect(NAME_IN_THE_BAR).toContain('min-w-0')
        expect(NAME_IN_THE_BAR).toContain('max-w-[220px]')
        expect(NAME_IN_THE_BAR).not.toMatch(/(^| )max-w-\[80px\]( |$)/)
    })

    it('the account name uses the rule and says the whole name on hover', async () => {
        await on('/start', { user: { ...ANA, displayName: NAME } })
        const name = $('[data-account-name]')
        expect(name.textContent).toBe(NAME)
        expect(name.getAttribute('title')).toBe(NAME)
        NAME_IN_THE_BAR.split(' ').forEach(cls => expect(name.classList.contains(cls)).toBe(true))
    })

    it('the Spotify name uses the same rule and says the whole name on hover', async () => {
        world.spotify = { connected: true, profile: { display_name: NAME } }
        const shell = await on('/start')
        await tap(shell, $('#userMenuBtn'))
        const name = $('#accountConnections [data-spotify-name]')
        expect(name.textContent).toBe(`Connected as ${NAME}`)
        expect(name.getAttribute('title')).toBe(NAME)
        NAME_IN_THE_BAR.split(' ').forEach(cls => expect(name.classList.contains(cls)).toBe(true))
    })
})

describe('top bar: the title picture has no box behind it (UAT-211)', () => {
    it('the first pixel of the PNG is transparent (it used to be solid black)', () => {
        const png = readFileSync(resolve(process.cwd(), 'public/assets/images/TheAlbumBlender.png'))
        expect(png[25]).toBe(6) // colour type RGBA
        // every IDAT chunk, inflated: the first row starts with its filter byte, then R, G, B, A
        const data: Buffer[] = []
        for (let at = 8; at < png.length;) {
            const size = png.readUInt32BE(at)
            if (png.toString('latin1', at + 4, at + 8) === 'IDAT') data.push(png.subarray(at + 8, at + 8 + size))
            at += 12 + size
        }
        const firstRow = inflateSync(Buffer.concat(data))
        expect(firstRow[4]).toBe(0)
    })
})

describe('top bar: it never passes the width of the screen (UAT-218, F88)', () => {
    it('every box between a name and the bar lets the name shrink; the initial never does', async () => {
        await on('/start', { user: { ...ANA, displayName: NAME } })
        for (let box: HTMLElement | null = $('[data-account-name]'); box && box.id !== 'header-container'; box = box.parentElement) {
            if (box.classList.contains('top-menu__acct')) break
            const lets = box.classList.contains('min-w-0') || box.classList.contains('max-w-full')
            expect(lets, box.outerHTML.slice(0, 80)).toBe(true)
        }
        expect($('#userMenuBtn .top-acct__initial').classList.contains('shrink-0')).toBe(true)
    })

    it('the bar is one row that is centred on the page, never wider than it, and the account sits at its edge', async () => {
        await on('/start')
        const row = $('.top-menu__row')
        expect($('#top-menu-bar').parentElement).toBe(row)
        expect($('.top-menu__acct').parentElement).toBe(row)
        expect(document.getElementById('header-container')!.innerHTML).not.toMatch(/mobileMenu|lg:flex/)
    })

    it('the name of the account is hidden below the wide screen, with the whole name on hover', async () => {
        await on('/start', { user: { ...ANA, displayName: 'Mau' } })
        expect($('[data-account-name]').className).toMatch(/^hidden xl:block /)
        expect($('[data-account-name]').getAttribute('title')).toBe('Mau')
    })
})

// ---------------------------------------------------------------------------------------------------------------------------------
// components/navigation/PhoneShell.test.js
describe('the tabs of the phone', () => {
    it('are the five destinations, in the order of the work', () => {
        expect(PHONE_TABS.map(tab => tab.id)).toEqual(['home', 'albums', 'blend', 'playlists', 'inventory'])
    })

    it.each([
        ['/start', 'home'],
        ['/albums', 'albums'],
        ['/albums/abc123', 'albums'],
        ['/blend', 'blend'],
        ['/saved-playlists', 'playlists'],
        ['/playlists', 'playlists'],
        ['/playlists/edit', 'playlists'],
        ['/inventory', 'inventory']
    ])('%s belongs to the tab %s', (path, id) => {
        expect(currentTab(path)!.id).toBe(id)
    })

    it('a screen no tab stands for marks none, and a name that only begins alike is not a match', () => {
        expect(currentTab('/homework')).toBeNull()
        expect(currentTab('/albumsmore')).toBeNull()
    })

    it('the other kinds of series light Albums, the stop of today\'s «Music Series» (F88, judge P2-6)', () => {
        for (const path of ['/artists', '/genres', '/tracks']) expect(currentTab(path)!.id).toBe('albums')
    })

    it('marks the current tab for the eye and for the screen reader, and only that one', async () => {
        await on('/albums/abc123', { phone: true })
        const current = $$('#phone-tabbar [aria-current="page"]')

        expect($$('#phone-tabbar a[data-link]').length).toBe(5)
        expect($$('#phone-tabbar a[data-tab]').map(tab => tab.textContent!.trim())).toEqual(['Create', 'Albums', 'Blend', 'Playlists', 'Inventory'])
        expect(current.map(tab => tab.textContent!.trim())).toEqual(['Albums'])
        expect(current[0].classList.contains('cur')).toBe(true)
        expect($$('#phone-tabbar a.cur').length).toBe(1)
        expect($('#phone-tabbar nav').getAttribute('aria-label')).toBe('Main')
        expect($('#phone-tabbar').classList.contains('pbar')).toBe(true)
    })

    it('every tab has an icon and a label', async () => {
        await on('/start', { phone: true })
        for (const tab of $$('#phone-tabbar a[data-tab]')) {
            expect(tab.querySelector('svg')).not.toBeNull()
            expect(tab.querySelector('.lb')!.textContent!.trim()).not.toBe('')
        }
    })

    it('names each screen for the top bar', () => {
        expect(screenName('/start')).toBe('Create')
        expect(screenName('/albums/abc123')).toBe('Albums')
        expect(screenName('/playlists')).toBe('New Playlists')
        expect(screenName('/playlists/edit')).toBe('Edit Playlists')
        expect(screenName('/saved-playlists')).toBe('Playlists')
        expect(screenName('/somewhere-else')).toBe('Album Blender')
    })
})

describe('the shell of the phone', () => {
    const go = (s: Shell, path: string) => s.act(async () => { window.history.pushState({}, '', path); s.navigated(path); await flush() })

    it('puts nothing on the page of a computer', async () => {
        await on('/albums')

        expect(document.getElementById('phone-topbar')).toBeNull()
        expect(document.getElementById('phone-tabbar')).toBeNull()
        expect(document.querySelector('.phone-to-top')).toBeNull()
        expect([...document.body.children].filter(child => child.id !== 'globalProgress').map(child => child.id)).toEqual(['header-container', 'app', 'footer-container'])
    })

    it('on the phone, shows the top bar with the name of the screen and the tab bar with the current tab', async () => {
        await on('/albums', { phone: true })

        expect(text('#phone-topbar [data-screen-name]')).toBe('Albums')
        expect($('#phone-tabbar [aria-current="page"]').dataset.tab).toBe('albums')
    })

    it('follows the screen: the name and the current tab change, and the new screen starts at its top', async () => {
        const s = await on('/albums', { phone: true })

        await go(s, '/inventory')

        expect(text('[data-screen-name]')).toBe('Inventory')
        expect($('[aria-current="page"]').dataset.tab).toBe('inventory')
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    })

    it('the same screen drawn again keeps its place on the page', async () => {
        const s = await on('/albums', { phone: true })
        await go(s, '/albums')
        expect(window.scrollTo).not.toHaveBeenCalled()
    })

    it('comes and goes when the screen becomes a phone or stops being one', async () => {
        const s = await on('/albums')

        await s.act(async () => { s.phone.turn(true); await flush() })
        expect(document.getElementById('phone-tabbar')).not.toBeNull()

        await s.act(async () => { s.phone.turn(false); await flush() })
        expect(document.getElementById('phone-tabbar')).toBeNull()
        expect(document.getElementById('phone-topbar')).toBeNull()
    })

    it('shows the person signed in by the first letter of the name, written as text', async () => {
        await on('/albums', { phone: true, user: user({ displayName: '<b>mau</b>' }) })

        expect(text('#phoneMenuBtn [data-account-initial]')).toBe('<')
        expect(document.querySelector('#phoneMenuBtn b')).toBeNull()
    })

    it('shows a menu button to who is not signed in, and draws the person in when they sign in', async () => {
        const { userStore } = await import('../../public/js/stores/UserStore.js')
        const s = await on('/albums', { phone: true })
        expect(document.querySelector('#phoneMenuBtn [data-account-initial]')).toBeNull()
        expect($('#phoneMenuBtn').getAttribute('aria-label')).toBe('Menu and account')

        await s.act(async () => { userStore.setUser(user({ displayName: 'Mau' })); await flush() })

        expect(text('#phoneMenuBtn [data-account-initial]')).toBe('M')
    })

    it('a tap on the current tab goes to the top of the screen and does not leave it', async () => {
        const s = await on('/albums', { phone: true })
        const media = window.matchMedia
        window.matchMedia = ((query: string) => (query.includes('reduce') ? { matches: false } : media(query))) as typeof window.matchMedia
        const event = new MouseEvent('click', { bubbles: true, cancelable: true })

        await s.act(async () => { $('#phone-tabbar [data-tab="albums"]').dispatchEvent(event); await flush() })

        expect(event.defaultPrevented).toBe(true)
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('«back to top» shows after two screens of scroll, and not before', async () => {
        const s = await on('/albums', { phone: true })
        const toTop = () => $('.phone-to-top') as HTMLButtonElement
        expect(toTop().hidden).toBe(true)
        expect(toTop().getAttribute('aria-label')).toBe('Back to top')

        await s.act(async () => { (window as { scrollY: number }).scrollY = 1599; window.dispatchEvent(new Event('scroll')); await flush() })
        expect(toTop().hidden).toBe(true)

        await s.act(async () => { (window as { scrollY: number }).scrollY = 1600; window.dispatchEvent(new Event('scroll')); await flush() })
        expect(toTop().hidden).toBe(false)
    })

    it('«back to top» goes to the top and lets go of the focus first (React would put the scroll back when the button hides itself on the way up)', async () => {
        const s = await on('/albums', { phone: true })
        await s.act(async () => { (window as { scrollY: number }).scrollY = 2000; window.dispatchEvent(new Event('scroll')); await flush() })
        $('.phone-to-top').focus()
        expect(document.activeElement).toBe($('.phone-to-top'))

        await tap(s, $('.phone-to-top'))

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: expect.any(String) })
        expect(document.activeElement).toBe(document.body)
    })

    it('a screen can name itself in the top bar, until the next screen', async () => {
        const s = await on('/albums', { phone: true })

        await s.act(async () => { nameThisScreen('Prog Rock <70s>'); await flush() })
        expect(text('[data-screen-name]')).toBe('Prog Rock <70s>')

        await go(s, '/blend')
        expect(text('[data-screen-name]')).toBe('Blend')
    })
})

// ---------------------------------------------------------------------------------------------------------------------------------
// components/navigation/PhoneMenu.test.js
describe('the menu of the phone', () => {
    const rowNamed = (label: string) => $$('.phone-menu__row').find(row => row.textContent!.includes(label))
    const openMenu = async (options: Parameters<typeof startOn>[1] = {}) => {
        const s = await on('/albums', { phone: true, ...options })
        await tap(s, $('#phoneMenuBtn'))
        return s
    }
    const sheetOpen = (id: string) => { const sheet = document.getElementById(id); return Boolean(sheet && !sheet.classList.contains('sheet--closing')) }

    beforeEach(() => { window.scrollTo = () => {} })
    afterEach(() => {
        // the shell goes first (its sheets give the page back as they leave), then the page is asked
        loginWindowStore.close()
        shell?.stop()
        shell = null
        expect(pageScrollLocks()).toBe(0)
    })

    it('is a bottom sheet that reaches what the tab bar does not', async () => {
        await openMenu()

        expect($('#phone-menu').classList.contains('sheet--bottom')).toBe(true)
        const places = $$('a.phone-menu__row').map(row => row.getAttribute('href'))
        expect(places).toEqual(['/playlists', '/artists', '/genres', '/tracks'])
        expect($$('a.phone-menu__row[data-link]').length).toBe(4)
    })

    it('«Playlists» is written once: the tab bar has it, the menu does not repeat it (finding 18)', async () => {
        await openMenu()
        const labels = $$('.phone-menu__label').map(label => label.textContent)

        expect(labels.filter(label => label === 'Playlists')).toEqual([])
    })

    it('offers to sign in to who is not signed in, and has no sign out', async () => {
        const s = await openMenu({ user: user({ isAnonymous: true }) })

        expect(rowNamed('Sign Out')).toBeUndefined()
        await tap(s, $('.phone-menu__sign-in'))

        expect(loginWindowStore.isOpen).toBe(true)
        expect(sheetOpen('phone-menu')).toBe(false)
    })

    it('shows who is signed in, as text, and signs out', async () => {
        const s = await openMenu({ user: user({ displayName: '<i>Mau</i>' }) })

        expect(text('.phone-menu__label--name')).toBe('<i>Mau</i>')
        expect(document.querySelector('.phone-menu__account i')).toBeNull()

        await tap(s, rowNamed('Sign Out')!)
        await vi.waitFor(() => expect(world.calls.filter(call => call[0] === 'firebase sign out')).toHaveLength(1))
        expect(sheetOpen('phone-menu')).toBe(false)
    })

    it('leaves the screen when a place is chosen', async () => {
        const s = await openMenu()
        $('a.phone-menu__row').addEventListener('click', event => event.preventDefault())

        await tap(s, $('a.phone-menu__row'))

        expect(sheetOpen('phone-menu')).toBe(false)
    })

    it('«Clear album cache» asks first: nothing is cleared by the first tap', async () => {
        const clearCaches = vi.fn(async () => {})
        const s = await openMenu({ clearCaches })

        await tap(s, rowNamed('Clear album cache')!)

        expect(clearCaches).not.toHaveBeenCalled()
        expect(text('#phone-clear-cache .sheet__title')).toBe('Clear the album cache?')
        await tap(s, $('#phone-clear-cache .btn-secondary'))
        expect(clearCaches).not.toHaveBeenCalled()
    })

    it('clears after the yes, says so and loads the app again', async () => {
        const clearCaches = vi.fn(async () => {})
        const reload = vi.fn()
        const s = await openMenu({ clearCaches, reload })
        await tap(s, rowNamed('Clear album cache')!)

        await tap(s, $('[data-action="clear-cache"]'))
        await vi.waitFor(() => expect(world.calls).toContainEqual(['toast success', 'Cache cleared']))

        expect(clearCaches).toHaveBeenCalledTimes(1)
        expect(sheetOpen('phone-clear-cache')).toBe(false)
        expect(reload).not.toHaveBeenCalled()
        await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1), { timeout: 2500 })
    })

    it('says when the cache could not be cleared, and does not load the app again', async () => {
        const reload = vi.fn()
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const s = await openMenu({ clearCaches: vi.fn(async () => { throw new Error('blocked') }), reload })
        await tap(s, rowNamed('Clear album cache')!)

        await tap(s, $('[data-action="clear-cache"]'))
        await vi.waitFor(() => expect(world.calls).toContainEqual(['toast error', 'Could not clear the cache']))

        expect(sheetOpen('phone-clear-cache')).toBe(true)
        expect(($('[data-action="clear-cache"]') as HTMLButtonElement).disabled).toBe(false)
        await new Promise(resolve => setTimeout(resolve, 1200))
        expect(reload).not.toHaveBeenCalled()
        await tap(s, $('#phone-clear-cache .sheet__close'))
    })

    it('the account button shows the first letter of the name, or of the e-mail', () => {
        expect(accountInitial({ displayName: 'mau' })).toBe('M')
        expect(accountInitial({ email: 'someone@example.com' })).toBe('S')
        expect(accountInitial({})).toBe('U')
    })
})

// ---------------------------------------------------------------------------------------------------------------------------------
// components/navigation/startRoute.test.js (what is about the menu, the footer and the top bar of the phone)
describe('the menu of the computer (F85)', () => {
    it('says «Create» and goes to /start; nothing says Home', async () => {
        await on('/albums')
        const body = document.getElementById('header-container')!
        const links = [...body.querySelectorAll('a[href="/start"]')].map(a => a.textContent!.trim())
        expect(links.length).toBeGreaterThanOrEqual(1) // the bar (the drawer is gone, F88)
        links.forEach(label => expect(label).toBe('Create'))
        expect(body.querySelectorAll('a[href="/home"]:not(.top-menu__home)').length).toBe(0) // only the logo leads to /home
        expect(body.textContent).not.toMatch(/\bHome\b/)
        expect(START_PATH).toBe('/start')
        expect(HOME_PATH).toBe('/home')
    })

    it('the logo leads to /home (the entry page), by a full page load (no data-link)', async () => {
        await on('/albums')
        const logo = $('a.top-menu__home')
        expect(logo.getAttribute('href')).toBe('/home')
        expect(logo.hasAttribute('data-full-page')).toBe(true)
    })

    it('the footer and the breadcrumb say Create', async () => {
        await on('/albums')
        expect(document.querySelector('#footer-container a[href="/start"]')!.textContent!.trim()).toBe('Create')
        expect(albumsTrail()[0]).toEqual({ label: 'Create', path: '/start' })
    })
})

describe('the top bar of the phone (F85)', () => {
    it('the logo is a link to the entry page, by a full page load', async () => {
        await on('/albums', { phone: true })

        const link = $('a.phone-topbar__logo-link')
        expect(link.getAttribute('href')).toBe('/home')
        expect(link.hasAttribute('data-full-page')).toBe(true)
        expect(link.getAttribute('aria-label')).toMatch(/entry page/)
        expect(link.querySelector('img.phone-topbar__logo')).not.toBeNull()
        expect($('a[data-tab="home"]').textContent!.trim()).toBe('Create')
    })
})
