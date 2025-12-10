import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../../shared/services/AuthService.js'
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    OAuthProvider: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn()
}))

describe('AuthService', () => {
    let authService
    let mockAuthInstance

    beforeEach(() => {
        vi.clearAllMocks()
        mockAuthInstance = { currentUser: null }
        getAuth.mockReturnValue(mockAuthInstance)

        // Setup Provider mocks
        GoogleAuthProvider.mockImplementation(() => ({ providerId: 'google.com' }))
        OAuthProvider.mockImplementation((id) => ({ providerId: id }))

        authService = new AuthService()
    })

    describe('initialization', () => {
        it('should get auth instance on creation', () => {
            expect(getAuth).toHaveBeenCalled()
            expect(authService.auth).toBe(mockAuthInstance)
        })
    })

    describe('signInWithGoogle', () => {
        it('should call signInWithPopup with GoogleAuthProvider', async () => {
            const mockUser = { uid: '123', email: 'test@gmail.com' }
            signInWithPopup.mockResolvedValue({ user: mockUser })

            const result = await authService.signInWithGoogle()

            expect(GoogleAuthProvider).toHaveBeenCalled()
            expect(signInWithPopup).toHaveBeenCalledWith(mockAuthInstance, expect.any(Object))
            expect(result).toEqual(mockUser)
        })

        it('should throw error if sign in fails', async () => {
            const error = new Error('Popup closed')
            signInWithPopup.mockRejectedValue(error)

            await expect(authService.signInWithGoogle()).rejects.toThrow('Popup closed')
        })
    })

    describe('signInWithApple', () => {
        it('should call signInWithPopup with OAuthProvider(apple.com)', async () => {
            const mockUser = { uid: '456', email: 'test@apple.com' }
            signInWithPopup.mockResolvedValue({ user: mockUser })

            const result = await authService.signInWithApple()

            expect(OAuthProvider).toHaveBeenCalledWith('apple.com')
            expect(signInWithPopup).toHaveBeenCalledWith(mockAuthInstance, expect.any(Object))
            expect(result).toEqual(mockUser)
        })
    })

    describe('logout', () => {
        it('should call signOut', async () => {
            await authService.logout()
            expect(signOut).toHaveBeenCalledWith(mockAuthInstance)
        })
    })

    describe('onAuthStateChange', () => {
        it('should subscribe to auth state changes', () => {
            const callback = vi.fn()
            onAuthStateChanged.mockReturnValue(() => { }) // Unsubscribe fn

            const unsubscribe = authService.onAuthStateChange(callback)

            expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuthInstance, callback)
            expect(typeof unsubscribe).toBe('function')
        })
    })
})
