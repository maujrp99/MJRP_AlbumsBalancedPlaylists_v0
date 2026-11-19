/**
 * F63 (UAT-201) - the "Soon" items of the Music Series menu go nowhere. Before, each was a link
 * with an address: its own listener refused the click, and the router, which listens to every link
 * of the app, navigated all the same.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../public/js/components/Icons.js', () => ({ getIcon: () => '' }))

import { Router } from '../public/js/router.js'
import { SeriesDropdown } from '../public/js/components/navigation/SeriesDropdown.js'

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

    it('a plain link of the app navigates', async () => {
        holder.innerHTML = '<a href="/albums" id="go">Albums</a>'

        holder.querySelector('#go').click()
        await settle()

        expect(address()).toBe('/albums')
    })

    it('the "Soon" items of the Music Series menu do not navigate; "By Album" does', async () => {
        const dropdown = new SeriesDropdown({ currentPath: '/home' })
        holder.innerHTML = dropdown.render()
        dropdown.attachListeners()
        const menu = holder.querySelector('#seriesDropdownMenu')
        const soon = [...menu.querySelectorAll('[aria-disabled="true"]')]

        expect(soon.map(item => item.textContent.replace(/\s+/g, ' ').trim())).toEqual(['By Artist Soon', 'By Genre Soon', 'By Track Soon'])
        expect(menu.querySelector('a[href="/artists"], a[href="/genres"], a[href="/tracks"]')).toBeNull()
        for (const item of soon) {
            item.click()
            await settle()
            expect(address()).toBe('/home')
        }

        menu.querySelector('a[href="/albums"]').click()
        await settle()
        expect(address()).toBe('/albums')
        document.removeEventListener('click', dropdown.handleOutsideClick)
    })
})
