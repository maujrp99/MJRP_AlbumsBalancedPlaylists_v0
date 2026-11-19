/**
 * F58 (UAT-18) - who is on the app reaches the user store through a service: it listens to the
 * login and writes the store; the store listens to nobody. These cases were the store's own
 * before the split.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserSessionService } from '../../../public/js/services/auth/UserSessionService.js'
import { UserStore } from '../../../public/js/stores/UserStore.js'

describe('UserSessionService', () => {
    let auth, store, session
    const user = { uid: '123', email: 'test@example.com' }

    beforeEach(() => {
        auth = {
            signInWithGoogle: vi.fn(async () => user),
            signInWithApple: vi.fn(async () => user),
            logout: vi.fn(async () => { }),
            onAuthStateChange: vi.fn(() => () => { })
        }
        store = new UserStore()
        session = new UserSessionService({ auth, store })
    })

    it('listens to nothing until it is started, and then to the login, once', () => {
        expect(auth.onAuthStateChange).not.toHaveBeenCalled()

        session.start()
        session.start()

        expect(auth.onAuthStateChange).toHaveBeenCalledTimes(1)
    })

    it('puts in the store whoever the login says is there, and nobody at sign-out', () => {
        session.start()
        const tell = auth.onAuthStateChange.mock.calls[0][0]

        tell(user)
        expect(store.getState()).toEqual({ currentUser: user, isAuthenticated: true, loading: false, error: null })

        tell(null)
        expect(store.getState()).toEqual({ currentUser: null, isAuthenticated: false, loading: false, error: null })
    })

    it('asks the login to sign in with Google; the store shows loading until the login answers', async () => {
        store.setUser(null)

        await session.loginWithGoogle()

        expect(auth.signInWithGoogle).toHaveBeenCalledTimes(1)
        expect(store.getState()).toMatchObject({ loading: true, error: null }) // the login tells who arrived
    })

    it('a sign-in that fails is an error in the store, not a throw', async () => {
        auth.signInWithGoogle.mockRejectedValue(new Error('Login failed'))
        auth.signInWithApple.mockRejectedValue(new Error('Apple refused'))

        await expect(session.loginWithGoogle()).resolves.toBeUndefined()
        expect(store.getState()).toMatchObject({ loading: false, error: 'Login failed' })

        await expect(session.loginWithApple()).resolves.toBeUndefined()
        expect(auth.signInWithApple).toHaveBeenCalledTimes(1)
        expect(store.getState()).toMatchObject({ loading: false, error: 'Apple refused' })
    })

    it('asks the login to sign out; a failure is an error in the store', async () => {
        await session.logout()
        expect(auth.logout).toHaveBeenCalledTimes(1)

        auth.logout.mockRejectedValue(new Error('offline'))
        await session.logout()
        expect(store.getState()).toMatchObject({ loading: false, error: 'offline' })
    })
})
