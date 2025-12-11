import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserStore } from '../../public/js/stores/UserStore.js'
import { authService } from '../../shared/services/AuthService.js'

// Mock AuthService
vi.mock('../../shared/services/AuthService.js', () => ({
    authService: {
        signInWithGoogle: vi.fn(),
        signInWithApple: vi.fn(),
        logout: vi.fn(),
        onAuthStateChange: vi.fn()
    }
}))

describe('UserStore', () => {
    let store
    let mockUser

    beforeEach(() => {
        vi.clearAllMocks()
        store = new UserStore()
        mockUser = { uid: '123', email: 'test@example.com', displayName: 'Test User' }
    })

    describe('initialization', () => {
        it('should have initial state', () => {
            const state = store.getState()
            expect(state.currentUser).toBeNull()
            expect(state.isAuthenticated).toBe(false)
            expect(state.loading).toBe(true) // Should start loading until auth check completes
            expect(state.error).toBeNull()
        })

        it('should subscribe to AuthService on init', () => {
            expect(authService.onAuthStateChange).toHaveBeenCalled()
        })
    })

    describe('auth state changes', () => {
        it('should update state when user logs in', () => {
            // Get the callback passed to onAuthStateChange
            const callback = authService.onAuthStateChange.mock.calls[0][0]

            // Simulate login
            callback(mockUser)

            const state = store.getState()
            expect(state.currentUser).toEqual(mockUser)
            expect(state.isAuthenticated).toBe(true)
            expect(state.loading).toBe(false)
        })

        it('should update state when user logs out', () => {
            const callback = authService.onAuthStateChange.mock.calls[0][0]

            // Simulate logout
            callback(null)

            const state = store.getState()
            expect(state.currentUser).toBeNull()
            expect(state.isAuthenticated).toBe(false)
            expect(state.loading).toBe(false)
        })
    })

    describe('login actions', () => {
        it('should call signInWithGoogle', async () => {
            await store.loginWithGoogle()
            expect(authService.signInWithGoogle).toHaveBeenCalled()
        })

        it('should handle login errors', async () => {
            const error = new Error('Login failed')
            authService.signInWithGoogle.mockRejectedValue(error)

            await store.loginWithGoogle() // Should not throw, but set error

            expect(store.getState().error).toBe('Login failed')
        })
    })

    describe('logout action', () => {
        it('should call logout', async () => {
            await store.logout()
            expect(authService.logout).toHaveBeenCalled()
        })
    })
})
