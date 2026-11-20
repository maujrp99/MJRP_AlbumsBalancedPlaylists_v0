
/**
 * SpotifyAuthService
 * Handles Authorization Code Flow with PKCE for Spotify Web API
 * 
 * PKCE (Proof Key for Code Exchange) is the secure way to authenticate
 * public clients (like Single Page Apps) without exposing a client secret.
 */

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID

/**
 * Dynamic redirect URI based on current host
 * - Spotify requires 127.0.0.1 (blocked localhost in 2024)
 * - We detect the current host and use matching redirect URI
 */
const getRedirectUri = () => {
    // If explicitly set in env, use that
    if (import.meta.env.VITE_SPOTIFY_REDIRECT_URI) {
        return import.meta.env.VITE_SPOTIFY_REDIRECT_URI
    }
    // Otherwise, use current origin dynamically
    return `${window.location.origin}/callback`
}

const REDIRECT_URI = getRedirectUri()

const SCOPES = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read'
].join(' ')

export const SpotifyAuthService = {

    /**
     * Generates a random string for the code verifier
     * @param {number} length 
     */
    generateRandomString(length) {
        // From the browser's cryptographic generator: this text is the secret of the handshake (F59).
        // Bytes that would favour some characters are thrown away, so every character is as likely.
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const limit = 256 - (256 % possible.length)
        let text = ''
        while (text.length < length) {
            const bytes = new Uint8Array(length)
            globalThis.crypto.getRandomValues(bytes)
            for (const byte of bytes) {
                if (byte < limit && text.length < length) text += possible[byte % possible.length]
            }
        }
        return text
    },

    /**
     * Generates the code challenge from the verifier (SHA-256)
     * @param {string} codeVerifier 
     */
    async generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder()
        const data = encoder.encode(codeVerifier)
        const digest = await window.crypto.subtle.digest('SHA-256', data)

        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')
    },

    /**
     * Initiates the login flow
     * Redirects user to Spotify Authorization Page
     */
    async login() {
        if (!CLIENT_ID) {
            console.error('[SpotifyAuth] Missing VITE_SPOTIFY_CLIENT_ID in .env')
            const { default: toast } = await import('../components/Toast.js')
            toast.error('Spotify is not set up for this site: its client id is missing.')
            return
        }

        const codeVerifier = this.generateRandomString(128)
        const codeChallenge = await this.generateCodeChallenge(codeVerifier)
        const state = this.generateRandomString(16)

        // Store verifier and state handling separately for security
        localStorage.setItem('spotify_code_verifier', codeVerifier)
        localStorage.setItem('spotify_auth_state', state)

        const args = new URLSearchParams({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: SCOPES,
            redirect_uri: REDIRECT_URI,
            state: state,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge
        })

        window.location.href = 'https://accounts.spotify.com/authorize?' + args
    },

    /**
     * Handles the callback from Spotify
     * Exchanges the auth code for an access token
     * @returns {Promise<boolean>} success
     */
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        const state = urlParams.get('state')

        // Clear URL params immediately for cleanliness
        window.history.replaceState({}, document.title, '/')

        if (error) {
            console.error('[SpotifyAuth] Auth error:', error)
            return false
        }

        // Verify State
        const storedState = localStorage.getItem('spotify_auth_state')
        if (state === null || state !== storedState) {
            // A return that does not carry the state this browser sent did not start here: refuse it
            // before asking Spotify for anything, and leave no secret of the handshake behind (F59).
            console.error('[SpotifyAuth] State mismatch: the return from Spotify was refused')
            localStorage.removeItem('spotify_code_verifier')
            localStorage.removeItem('spotify_auth_state')
            return false
        }

        if (!code) return false

        // Exchange code for token
        const codeVerifier = localStorage.getItem('spotify_code_verifier')

        try {
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                code_verifier: codeVerifier
            })

            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error_description || 'Failed to exchange token')
            }

            const data = await response.json()
            this.setSession(data)

            // Cleanup
            localStorage.removeItem('spotify_code_verifier')
            localStorage.removeItem('spotify_auth_state')

            // Dispatch auth success event (for background enrichment trigger)
            console.log('[SpotifyAuth] Auth successful, dispatching event')
            window.dispatchEvent(new CustomEvent('spotify-auth-success'))

            return true

        } catch (err) {
            console.error('[SpotifyAuth] Token exchange failed:', err)
            return false
        }
    },

    /**
     * Stores the session data in localStorage
     * @param {object} data 
     */
    setSession(data) {
        const now = new Date().getTime()
        // data.expires_in is usually 3600 seconds (1 hour)
        const expiresAt = now + (data.expires_in * 1000)

        localStorage.setItem('spotify_access_token', data.access_token)
        localStorage.setItem('spotify_expires_at', expiresAt)
        if (data.refresh_token) {
            localStorage.setItem('spotify_refresh_token', data.refresh_token)
        }

        // One signal for "the Spotify session changed", on connect, on token refresh and on logout,
        // so whoever draws the session never depends on a page reload (UAT-182).
        window.dispatchEvent(new Event('spotify-auth-change'))
    },

    /**
     * Checks if the user is authenticated and token is valid
     * @returns {boolean}
     */
    isAuthenticated() {
        const accessToken = localStorage.getItem('spotify_access_token')
        const expiresAt = localStorage.getItem('spotify_expires_at')

        if (!accessToken || !expiresAt) return false

        return new Date().getTime() < parseInt(expiresAt)
    },

    /**
     * True when Spotify can be asked without the person: the access is in its time, or it has
     * passed and can still be renewed. False is "not connected" (F69): nobody is asked.
     * @returns {boolean}
     */
    hasSession() {
        return this.isAuthenticated() || Boolean(localStorage.getItem('spotify_refresh_token'))
    },

    /**
     * Get the valid access token. Tries to refresh if expired.
     * @returns {Promise<string|null>}
     */
    async getAccessToken() {
        if (this.isAuthenticated()) {
            return localStorage.getItem('spotify_access_token')
        }

        // Token expired, try refresh
        const refreshToken = localStorage.getItem('spotify_refresh_token')
        if (refreshToken) {
            return await this.refreshAccessToken(refreshToken)
        }

        return null
    },

    /**
     * Renew the access now, whatever its expiry time says: Spotify refused it (F62).
     * @returns {Promise<string|null>} the new access token, or null when it cannot be renewed
     *          without the person (no refresh token, or Spotify refused the renewal)
     */
    async renewAccess() {
        const refreshToken = localStorage.getItem('spotify_refresh_token')
        return refreshToken ? this.refreshAccessToken(refreshToken) : null
    },

    /**
     * Refreshes the access token. One renewal at a time: calls made while one is on its way
     * share its answer (a refresh token is used once; a second request with it would be refused).
     * @param {string} refreshToken
     * @returns {Promise<string|null>}
     */
    refreshAccessToken(refreshToken) {
        if (!this._renewing) {
            this._renewing = this._requestNewAccess(refreshToken).finally(() => { this._renewing = null })
        }
        return this._renewing
    },

    /** @private */
    async _requestNewAccess(refreshToken) {
        try {
            const body = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: CLIENT_ID
            })

            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
            })

            if (!response.ok) throw new Error('Refresh failed')

            const data = await response.json()
            this.setSession(data)

            return data.access_token

        } catch (err) {
            console.error('[SpotifyAuth] Failed to refresh token:', err)
            this.logout()
            return null
        }
    },

    /**
     * Gets user profile to verify connection/display name
     */
    async getUserProfile() {
        const token = await this.getAccessToken()
        if (!token) return null

        try {
            const res = await fetch('https://api.spotify.com/v1/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) return null
            return await res.json()
        } catch (err) {
            console.error(err)
            return null
        }
    },

    /**
     * Clears session
     */
    logout() {
        localStorage.removeItem('spotify_access_token')
        localStorage.removeItem('spotify_refresh_token')
        localStorage.removeItem('spotify_expires_at')
        localStorage.removeItem('spotify_code_verifier')
        localStorage.removeItem('spotify_auth_state')

        // Dispatch event so UI can update
        window.dispatchEvent(new Event('spotify-auth-change'))
    }
}
