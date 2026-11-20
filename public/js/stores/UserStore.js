/**
 * User Store
 *
 * Who is on the app: the signed-in person, whether the login is still being asked, and its last
 * error. Pure state (ADR-0017; F58, UAT-18): setters, getters and subscribe. It listens to no
 * login and asks for none: UserSessionService (services/auth/) does, and is its only writer.
 */
export class UserStore {
    constructor() {
        this.currentUser = null
        this.isAuthenticated = false
        this.loading = true // until the login says who is there
        this.error = null
        this.listeners = new Set()
    }

    // ========== SETTERS ==========

    /**
     * The login said who is on the app.
     * @param {Object|null} user - Firebase user object, or null when nobody is signed in
     */
    setUser(user) {
        this.currentUser = user
        this.isAuthenticated = !!user
        this.loading = false
        this.error = null
        this.notify()
    }

    /** The login was asked something (sign in, sign out) and has not answered yet. */
    setLoading({ clearError = false } = {}) {
        this.loading = true
        if (clearError) this.error = null
        this.notify()
    }

    /** What was asked of the login failed. */
    setError(message) {
        this.error = message
        this.loading = false
        this.notify()
    }

    // ========== GETTERS ==========

    getState() {
        return {
            currentUser: this.currentUser,
            isAuthenticated: this.isAuthenticated,
            loading: this.loading,
            error: this.error
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
}

// Singleton instance
export const userStore = new UserStore()
