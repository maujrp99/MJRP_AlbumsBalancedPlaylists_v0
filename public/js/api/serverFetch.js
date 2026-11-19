/**
 * The one way the app calls its own server (F59, slice C).
 *
 * The server answers the paid and the costly routes only to a signed-in person, so every call
 * carries the person's login (`Authorization: Bearer <Firebase ID token>`). The login is asked
 * for on every call: Firebase renews it by itself. With nobody signed in, or when the login
 * cannot be read, the call goes without it and the server answers 401.
 *
 * `createServerFetch` is pure (what it needs is given to it); `serverFetch` is the one wired to
 * the app's Firebase login.
 */
import { auth } from '../firebase-init.js'

/**
 * @param {Object} deps
 * @param {Function} deps.getIdToken - () => Promise<string|null>
 * @param {Function} [deps.fetchImpl] - fetch
 * @returns {Function} (url, init) => Promise<Response>
 */
export function createServerFetch({ getIdToken, fetchImpl = (...args) => fetch(...args) }) {
    return async function serverFetch(url, init = {}) {
        let token = null
        try {
            token = await getIdToken()
        } catch (error) {
            console.warn('[serverFetch] could not read the login:', error?.message || error)
        }
        const headers = { ...(init.headers || {}) }
        if (token) headers.Authorization = `Bearer ${token}`
        return fetchImpl(url, { ...init, headers })
    }
}

export const serverFetch = createServerFetch({
    getIdToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : null)
})
