/**
 * F60 (UAT-197) - leaving the playlists screen with work that was not saved asks first: by a
 * link or a button of the app, by the browser's back button, and by closing or reloading the tab.
 * The router is the real one.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Every Router listens to the window for as long as the page lives, the app's own included (it is
// created when the module is read). They are recorded here and taken off before each test, so
// only the router of the test answers the back button.
const windowListeners = vi.hoisted(() => {
    const recorded = []
    const addToWindow = window.addEventListener.bind(window)
    window.addEventListener = (type, listener, options) => {
        recorded.push([type, listener])
        addToWindow(type, listener, options)
    }
    return recorded
})

import { Router } from '../../../public/js/router.js'
import { installUnsavedChangesGuard } from '../../../public/js/screens/playlists/unsavedChangesGuard'

const settle = () => new Promise(resolve => setTimeout(resolve, 20))
const address = () => window.location.pathname + window.location.search

describe('unsaved changes guard', () => {
    let router, app, unsaved, confirmLeave, uninstall, rendered

    beforeEach(async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        window.history.pushState({}, '', '/')

        rendered = []
        windowListeners.splice(0).forEach(([type, listener]) => window.removeEventListener(type, listener))
        router = new Router()
        for (const path of ['/playlists', '/albums', '/home']) {
            router.register(path, () => ({ render: () => { rendered.push(path); return `<div>${path}</div>` } }))
        }
        router.navigate('/albums')
        router.navigate('/playlists?seriesId=s1')
        await settle()

        unsaved = true
        confirmLeave = vi.fn(() => false)
        uninstall = installUnsavedChangesGuard({ router, hasUnsavedChanges: () => unsaved, confirmLeave })
    })

    afterEach(() => {
        uninstall()
        document.body.removeChild(app)
    })

    it('asks before leaving by a navigation of the app, and stays when the person says no', async () => {
        router.navigate('/home')
        await settle()

        expect(confirmLeave).toHaveBeenCalledTimes(1)
        expect(address()).toBe('/playlists?seriesId=s1')
        expect(rendered.at(-1)).toBe('/playlists')
    })

    it('leaves when the person confirms', async () => {
        confirmLeave.mockReturnValue(true)

        router.navigate('/home')
        await settle()

        expect(address()).toBe('/home')
        expect(rendered.at(-1)).toBe('/home')
    })

    it('does not ask when everything is saved', async () => {
        unsaved = false

        router.navigate('/home')
        await settle()

        expect(confirmLeave).not.toHaveBeenCalled()
        expect(address()).toBe('/home')
    })

    it('asks on the back button of the browser too, and keeps the screen and its address on a no', async () => {
        window.history.back()
        await settle()

        expect(confirmLeave).toHaveBeenCalledTimes(1)
        expect(address()).toBe('/playlists?seriesId=s1')
        expect(rendered.at(-1)).toBe('/playlists')
    })

    it('goes back when the person confirms on the back button', async () => {
        confirmLeave.mockReturnValue(true)

        window.history.back()
        await settle()

        expect(address()).toBe('/albums')
        expect(rendered.at(-1)).toBe('/albums')
    })

    it('makes the browser ask before closing or reloading the tab, only while there is unsaved work', () => {
        const closing = new Event('beforeunload', { cancelable: true })
        window.dispatchEvent(closing)
        expect(closing.defaultPrevented).toBe(true)

        unsaved = false
        const closingSaved = new Event('beforeunload', { cancelable: true })
        window.dispatchEvent(closingSaved)
        expect(closingSaved.defaultPrevented).toBe(false)
    })

    it('stops asking once the screen is gone', async () => {
        uninstall()

        router.navigate('/home')
        await settle()
        const closing = new Event('beforeunload', { cancelable: true })
        window.dispatchEvent(closing)

        expect(confirmLeave).not.toHaveBeenCalled()
        expect(address()).toBe('/home')
        expect(closing.defaultPrevented).toBe(false)
    })
})
