import { authService } from '@shared/services/AuthService.js'

/**
 * User Store
 * Manages authentication state and current user profile
 */
export class UserStore {
    constructor() {
        this.currentUser = null
        this.isAuthenticated = false
        this.loading = true
        this.error = null
        this.listeners = new Set()

        // Subscribe to AuthService changes immediately
        this.unsubscribeAuth = authService.onAuthStateChange(this.handleAuthChange.bind(this))
    }

    /**
     * Handle auth state change from service
     * @param {Object|null} user - Firebase user object
     */
    handleAuthChange(user) {
        this.currentUser = user
        this.isAuthenticated = !!user
        this.loading = false
        this.error = null
        this.notify()
    }

    /**
     * Login with Google
     */
    async loginWithGoogle() {
        this.loading = true
        this.error = null
        this.notify()

        try {
            await authService.signInWithGoogle()
            // State update happens in handleAuthChange callback
        } catch (error) {
            this.error = error.message
            this.loading = false
            this.notify()
        }
    }

    /**
     * Login with Apple
     */
    async loginWithApple() {
        this.loading = true
        this.error = null
        this.notify()

        try {
            await authService.signInWithApple()
        } catch (error) {
            this.error = error.message
            this.loading = false
            this.notify()
        }
    }

    /**
     * Logout
     */
    async logout() {
        this.loading = true
        this.notify()

        try {
            await authService.logout()
        } catch (error) {
            this.error = error.message
            this.loading = false
            this.notify()
        }
    }

    // ========== SUBSCRIPTIONS ==========

    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    notify() {
        const state = this.getState()
        this.listeners.forEach(listener => listener(state))
    }

    getState() {
        return {
            currentUser: this.currentUser,
            isAuthenticated: this.isAuthenticated,
            loading: this.loading,
            error: this.error
        }
    }
}

// Singleton instance
export const userStore = new UserStore()
