/**
 * F76 (REQ-03) - the one menu of the phone: the account, the places the tab bar does not reach,
 * sign out, and «Clear album cache», which asks before it clears (finding 20 of the UX audit).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const login = vi.hoisted(() => ({ showLoginModal: vi.fn() }))
const auth = vi.hoisted(() => ({ signOut: vi.fn(), isSignedIn: (user) => Boolean(user && !user.guest) }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('../../../public/js/components/LoginModal.js', () => login)
vi.mock('../../../public/js/components/navigation/AuthNav.js', () => auth)
vi.mock('../../../public/js/components/Toast.js', () => ({ default: toast }))
vi.mock('../../../public/js/components/SpotifyConnectButton.js', () => ({ SpotifyConnectButton: class { } }))

import { openPhoneMenu, askToClearCache, accountInitial } from '../../../public/js/components/navigation/PhoneMenu.js'
import { pageScrollLocks } from '../../../public/js/utils/pageScrollLock.js'

const rowNamed = (label) => [...document.querySelectorAll('.phone-menu__row')].find(row => row.textContent.includes(label))

describe('PhoneMenu', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        document.body.innerHTML = ''
        document.body.removeAttribute('style')
        window.scrollTo = () => { }
        for (const fn of [login.showLoginModal, auth.signOut, toast.success, toast.error]) fn.mockClear()
    })

    afterEach(() => {
        vi.runAllTimers()
        vi.useRealTimers()
        expect(pageScrollLocks()).toBe(0)
    })

    it('is a bottom sheet that reaches what the tab bar does not', () => {
        const sheet = openPhoneMenu({ user: null, clearCaches: vi.fn() })

        expect(sheet.element.classList.contains('sheet--bottom')).toBe(true)
        const places = [...document.querySelectorAll('a.phone-menu__row')].map(row => row.getAttribute('href'))
        expect(places).toEqual(['/playlists', '/artists', '/genres', '/tracks'])
        expect(document.querySelectorAll('a.phone-menu__row[data-link]').length).toBe(4)
        sheet.close()
    })

    it('«Playlists» is written once: the tab bar has it, the menu does not repeat it (finding 18)', () => {
        const sheet = openPhoneMenu({ user: null, clearCaches: vi.fn() })
        const labels = [...document.querySelectorAll('.phone-menu__label')].map(label => label.textContent)

        expect(labels.filter(label => label === 'Playlists')).toEqual([])
        sheet.close()
    })

    it('offers to sign in to who is not signed in, and has no sign out', () => {
        const sheet = openPhoneMenu({ user: { guest: true }, clearCaches: vi.fn() })

        expect(rowNamed('Sign Out')).toBeUndefined()
        document.querySelector('.phone-menu__sign-in').click()

        expect(login.showLoginModal).toHaveBeenCalledTimes(1)
        expect(sheet.isOpen()).toBe(false)
    })

    it('shows who is signed in, as text, and signs out', () => {
        const sheet = openPhoneMenu({ user: { displayName: '<i>Mau</i>' }, clearCaches: vi.fn() })

        expect(document.querySelector('.phone-menu__label--name').textContent).toBe('<i>Mau</i>')
        expect(document.querySelector('.phone-menu__account i')).toBeNull()

        rowNamed('Sign Out').click()
        expect(auth.signOut).toHaveBeenCalledTimes(1)
        expect(sheet.isOpen()).toBe(false)
    })

    it('leaves the screen when a place is chosen', () => {
        const sheet = openPhoneMenu({ user: null, clearCaches: vi.fn() })
        document.querySelector('a.phone-menu__row').addEventListener('click', event => event.preventDefault())

        document.querySelector('a.phone-menu__row').click()

        expect(sheet.isOpen()).toBe(false)
    })

    it('«Clear album cache» asks first: nothing is cleared by the first tap', () => {
        const clearCaches = vi.fn(async () => { })
        openPhoneMenu({ user: null, clearCaches })

        rowNamed('Clear album cache').click()

        expect(clearCaches).not.toHaveBeenCalled()
        expect(document.querySelector('#phone-clear-cache .sheet__title').textContent).toBe('Clear the album cache?')
        document.querySelector('#phone-clear-cache .btn-secondary').click()
        expect(clearCaches).not.toHaveBeenCalled()
    })

    it('clears after the yes, says so and loads the app again', async () => {
        const clearCaches = vi.fn(async () => { })
        const reload = vi.fn()
        const sheet = askToClearCache({ clearCaches, reload, reloadDelayMs: 1000 })

        document.querySelector('[data-action="clear-cache"]').click()
        await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Cache cleared'))

        expect(clearCaches).toHaveBeenCalledTimes(1)
        expect(sheet.isOpen()).toBe(false)
        expect(reload).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1000)
        expect(reload).toHaveBeenCalledTimes(1)
    })

    it('says when the cache could not be cleared, and does not load the app again', async () => {
        const reload = vi.fn()
        const quiet = vi.spyOn(console, 'error').mockImplementation(() => { })
        const sheet = askToClearCache({ clearCaches: vi.fn(async () => { throw new Error('blocked') }), reload })

        document.querySelector('[data-action="clear-cache"]').click()
        await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not clear the cache'))

        expect(sheet.isOpen()).toBe(true)
        expect(document.querySelector('[data-action="clear-cache"]').disabled).toBe(false)
        vi.advanceTimersByTime(5000)
        expect(reload).not.toHaveBeenCalled()
        sheet.close()
        quiet.mockRestore()
    })

    it('the account button shows the first letter of the name, or of the e-mail', () => {
        expect(accountInitial({ displayName: 'mau' })).toBe('M')
        expect(accountInitial({ email: 'someone@example.com' })).toBe('S')
        expect(accountInitial({})).toBe('U')
    })
})
