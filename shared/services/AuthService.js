import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'

/**
 * Service to handle Authentication with Firebase
 */
export class AuthService {
    constructor() {
        // Auth initialized lazily to ensure Firebase app is ready
    }

    get auth() {
        return getAuth()
    }

    /**
     * Sign in with Google
     * @returns {Promise<User>} Firebase User
     */
    async signInWithGoogle() {
        const provider = new GoogleAuthProvider()
        try {
            const result = await signInWithPopup(this.auth, provider)
            return result.user
        } catch (error) {
            console.error('Error signing in with Google:', error)
            throw error
        }
    }

    /**
     * Sign in with Apple
     * @returns {Promise<User>} Firebase User
     */
    async signInWithApple() {
        const provider = new OAuthProvider('apple.com')
        try {
            const result = await signInWithPopup(this.auth, provider)
            return result.user
        } catch (error) {
            console.error('Error signing in with Apple:', error)
            throw error
        }
    }

    /**
     * Sign out current user
     */
    async logout() {
        try {
            await signOut(this.auth)
        } catch (error) {
            console.error('Error signing out:', error)
            throw error
        }
    }

    /**
     * Subscribe to auth state changes
     * @param {Function} callback - Called with (user|null)
     * @returns {Function} Unsubscribe function
     */
    onAuthStateChange(callback) {
        return onAuthStateChanged(this.auth, callback)
    }
}

// Singleton instance
export const authService = new AuthService()
