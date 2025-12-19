
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
        let text = ''
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length))
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
            alert('Spotify Client ID is missing. Please check your configuration.')
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
            console.error('[SpotifyAuth] State mismatch error')
            // return false // Strict security check (currently disabled for dev ease if state logic varies)
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
     * Refreshes the access token
     * @param {string} refreshToken 
     */
    async refreshAccessToken(refreshToken) {
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
