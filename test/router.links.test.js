/**
 * F63 (UAT-201), F88 - the "Soon" items of the line under the top bar (before F88, the Music Series menu) go nowhere. Before, each was a link
 * with an address: its own listener refused the click, and the router, which listens to every link
 * of the app, navigated all the same.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../public/js/services/auth/signIn.js', async () => ({ authService: (await import('./support/shellScenarios.js')).stand.login }))
vi.mock('../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('./support/shellScenarios.js')).stand.musicKit }))
vi.mock('../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('./support/shellScenarios.js')).stand.spotify }))
vi.mock('../public/js/stores/toasts.js', async () => ({ default: (await import('./support/shellScenarios.js')).stand.toast }))
vi.mock('../public/js/ui/dialogs/dialogs', async () => ({ dialogService: (await import('./support/shellScenarios.js')).stand.dialog }))

import { Router } from '../public/js/router.js'
import { startOn } from './support/renderShell'

const settle = () => new Promise(resolve => setTimeout(resolve, 10))
const address = () => window.location.pathname + window.location.search

describe('Router: links (F63)', () => {
    let router, app, holder

    beforeEach(() => {
        app = document.createElement('div')
        app.id = 'app'
        holder = document.createElement('div')
        document.body.append(app, holder)
        window.history.replaceState({}, '', '/home')
        vi.spyOn(console, 'log').mockImplementation(() => {})
        router = new Router()
        ;['/home', '/albums', '/artists', '/genres', '/tracks'].forEach(route =>
            router.register(route, () => ({ render: () => `<div>${route}</div>`, mount: vi.fn() }))
        )
    })

    afterEach(() => {
        app.remove()
        holder.remove()
        vi.restoreAllMocks()
    })

    it('a link marked data-full-page is left to the browser (F85: the logo leads out of the app)', async () => {
        holder.innerHTML = '<a href="/home" id="out" data-full-page>Logo</a>'
        const click = new MouseEvent('click', { bubbles: true, cancelable: true })
        holder.querySelector('#out').dispatchEvent(click)
        await settle()
        expect(click.defaultPrevented).toBe(false)
    })

    it('a plain link of the app navigates', async () => {
        holder.innerHTML = '<a href="/albums" id="go">Albums</a>'

        holder.querySelector('#go').click()
        await settle()

        expect(address()).toBe('/albums')
    })

    it('the "Soon" items of the line under the bar do not navigate; "By Album" does', async () => {
        // the line under the top bar, in React (F83 wave 3, F88), on the page next to the router: its links are the router's to follow
        const shell = await startOn('/albums')
        window.history.replaceState({}, '', '/home') // the page is drawn; the address is the test's again
        const row = document.querySelector('#top-menu-sub nav')
        const soon = [...row.querySelectorAll('[aria-disabled="true"]')]

        expect(soon.map(item => item.textContent.replace(/\s+/g, ' ').trim())).toEqual(['By Artist Soon', 'By Genre Soon', 'By Track Soon'])
        expect(row.querySelector('a[href="/artists"], a[href="/genres"], a[href="/tracks"]')).toBeNull()
        for (const item of soon) {
            item.click()
            await settle()
            expect(address()).toBe('/home')
        }

        row.querySelector('a[href="/albums"]').click()
        await settle()
        expect(address()).toBe('/albums')
        shell.stop()
    })
})
