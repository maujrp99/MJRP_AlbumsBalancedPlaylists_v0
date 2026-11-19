/**
 * The user store holds who is on the app. Since F58 (UAT-18) it only holds state: listening to
 * the login and asking it to sign in or out are UserSessionService's
 * (test/services/auth/UserSessionService.test.js).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserStore } from '../../public/js/stores/UserStore.js'

describe('UserStore', () => {
    let store
    const user = { uid: '123', email: 'test@example.com', displayName: 'Test User' }

    beforeEach(() => {
        store = new UserStore()
    })

    it('starts with nobody, loading until the login says who is there', () => {
        expect(store.getState()).toEqual({ currentUser: null, isAuthenticated: false, loading: true, error: null })
    })

    it('setUser holds the person who signed in and ends the loading', () => {
        store.setError('Login failed')

        store.setUser(user)

        expect(store.getState()).toEqual({ currentUser: user, isAuthenticated: true, loading: false, error: null })
    })

    it('setUser(null) is a sign-out', () => {
        store.setUser(user)

        store.setUser(null)

        expect(store.getState()).toEqual({ currentUser: null, isAuthenticated: false, loading: false, error: null })
    })

    it('setLoading says an ask to the login started; clearing the error is asked for', () => {
        store.setError('Login failed')

        store.setLoading()
        expect(store.getState()).toMatchObject({ loading: true, error: 'Login failed' })

        store.setLoading({ clearError: true })
        expect(store.getState()).toMatchObject({ loading: true, error: null })
    })

    it('setError holds the message and ends the loading', () => {
        store.setLoading()

        store.setError('Login failed')

        expect(store.getState()).toMatchObject({ loading: false, error: 'Login failed' })
    })

    it('every setter tells whoever subscribed with the new state; an unsubscribed listener hears nothing', () => {
        const listener = vi.fn()
        const unsubscribe = store.subscribe(listener)

        store.setUser(user)
        expect(listener).toHaveBeenLastCalledWith(store.getState())
        store.setLoading()
        store.setError('x')
        expect(listener).toHaveBeenCalledTimes(3)

        unsubscribe()
        store.setUser(null)
        expect(listener).toHaveBeenCalledTimes(3)
    })
})
