/**
 * The "Clear Cache" button of the footer (F48, UAT-177): it asks for the album caches to be cleared
 * and leaves localStorage alone (it used to wipe it all: the Spotify login and the screen choices).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Footer } from '../../public/js/components/Footer.js'

const mount = (deps) => {
    const footer = new Footer(deps)
    document.body.innerHTML = footer.render()
    footer.attachListeners()
    return {
        button: document.getElementById('footerClearCache'),
        message: document.getElementById('cacheClearedMsg')
    }
}
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

describe('Footer "Clear Cache" (F48, UAT-177)', () => {
    let storage

    beforeEach(() => {
        const data = new Map([['spotify_access_token', 'token']])
        storage = {
            getItem: (key) => data.get(key) ?? null,
            setItem: (key, value) => { data.set(key, value) },
            removeItem: vi.fn((key) => { data.delete(key) }),
            clear: vi.fn(() => { data.clear() })
        }
        vi.stubGlobal('localStorage', storage)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('clears the album caches, says so and reloads the page', async () => {
        const clearCaches = vi.fn(async () => ({ legacyEntriesRemoved: 0 }))
        const reload = vi.fn()
        const { button, message } = mount({ clearCaches, reload, reloadDelayMs: 0 })

        button.click()
        await settle()
        await settle()

        expect(clearCaches).toHaveBeenCalledTimes(1)
        expect(message.classList.contains('hidden')).toBe(false)
        expect(message.textContent).toBe('Cache Cleared!')
        expect(reload).toHaveBeenCalledTimes(1)
    })

    it('does not wipe localStorage: the Spotify login stays', async () => {
        const { button } = mount({ clearCaches: vi.fn(async () => ({})), reload: vi.fn(), reloadDelayMs: 0 })

        button.click()
        await settle()

        expect(storage.clear).not.toHaveBeenCalled()
        expect(storage.removeItem).not.toHaveBeenCalled()
        expect(localStorage.getItem('spotify_access_token')).toBe('token')
    })

    it('says it could not clear, and does not reload, when the clearing fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const reload = vi.fn()
        const { button, message } = mount({ clearCaches: vi.fn(async () => { throw new Error('blocked') }), reload, reloadDelayMs: 0 })

        button.click()
        await settle()
        await settle()

        expect(message.classList.contains('hidden')).toBe(false)
        expect(message.textContent).toMatch(/could not/i)
        expect(reload).not.toHaveBeenCalled()
        expect(button.disabled).toBe(false)
    })
})
