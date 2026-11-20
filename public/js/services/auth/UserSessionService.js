/**
 * UserSessionService
 *
 * Keeps the user store saying who is on the app (ADR-0017; F58, UAT-18: the store used to listen
 * to the login itself). It listens to the login service and writes UserStore, and it is the door
 * for asking the login to sign in or out with the store showing the wait and the error.
 *
 * The login service and the store are given, so this file imports no Firebase.
 */
export class UserSessionService {
    /**
     * @param {Object} deps
     * @param {Object} deps.auth - { onAuthStateChange, signInWithGoogle, signInWithApple, logout }
     * @param {UserStore} deps.store
     */
    constructor({ auth, store }) {
        this.auth = auth
        this.store = store
        this._stopListening = null
    }

    /** Start listening to the login. Called once, when the app starts; a second call does nothing. */
    start() {
        if (this._stopListening) return
        this._stopListening = this.auth.onAuthStateChange(user => this.store.setUser(user))
    }

    /** Sign in with Google. Who arrived is told by the login, through start(). */
    async loginWithGoogle() {
        await this._ask(() => this.auth.signInWithGoogle(), { clearError: true })
    }

    /** Sign in with Apple. */
    async loginWithApple() {
        await this._ask(() => this.auth.signInWithApple(), { clearError: true })
    }

    /** Sign out. */
    async logout() {
        await this._ask(() => this.auth.logout())
    }

    /** Ask the login for something: the store shows the wait, and the error if it fails. */
    async _ask(action, { clearError = false } = {}) {
        this.store.setLoading({ clearError })
        try {
            await action()
        } catch (error) {
            this.store.setError(error.message)
        }
    }
}
