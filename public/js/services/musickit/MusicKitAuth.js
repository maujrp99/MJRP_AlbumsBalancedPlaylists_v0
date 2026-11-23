/**
 * MusicKitAuth.js
 * Handles initialization, authorization, and storefront detection.
 */

import { withDeadline } from '../../utils/deadline.js';
import { AppleMusicAuthorizationError } from './musicKitErrors.js';

/** How long the start of MusicKit may take: token route, script and `configure` together (F67). */
export const MUSICKIT_INIT_DEADLINE_MS = 10000;

/** One signal for «the Apple Music connection changed», as Spotify has `spotify-auth-change`. */
function announceConnection() {
    window.dispatchEvent(new Event('applemusic-auth-change'));
}

export class MusicKitAuth {
    constructor() {
        this.music = null;
        this.isInitialized = false;
        this.isAuthorized = false;
        this.initPromise = null;
        this._initAttempt = 0; // identity of the start in course: a start that was left marks nothing
        this._storefront = null; // Cache user's storefront
    }

    /**
     * Get user's storefront (region) for catalog searches
     * Uses browser locale as fallback when not authorized
     * @returns {string} Storefront code (e.g., 'us', 'br', 'gb')
     */
    getStorefront() {
        if (this._storefront) {
            return this._storefront;
        }
        // Try to get from MusicKit instance (authorized user)
        if (this.music?.storefrontId) {
            this._storefront = this.music.storefrontId;
            console.log(`[MusicKit] Using authorized storefront: ${this._storefront}`);
            return this._storefront;
        }
        // Fallback to browser locale
        return this.getBrowserStorefront();
    }

    /**
     * Get storefront from browser locale
     * @returns {string} Storefront code based on navigator.language
     */
    getBrowserStorefront() {
        try {
            const locale = navigator.language || 'en-US';
            // Parse "pt-BR" -> "br", "en-US" -> "us", "en-GB" -> "gb"
            const parts = locale.split('-');
            const country = parts[1]?.toLowerCase() || 'us';
            return country;
        } catch {
            return 'us';
        }
    }

    /**
     * Initialize MusicKit with developer token from backend.
     * The whole start has a deadline (MUSICKIT_INIT_DEADLINE_MS): past it, it fails with
     * DeadlineError and the next ask starts again from zero.
     * @returns {Promise<MusicKit.MusicKitInstance>}
     */
    async init({ quiet = false } = {}) {
        // Return existing promise if initialization is in progress
        if (this.initPromise) {
            return this.initPromise;
        }

        // Return immediately if already initialized
        if (this.isInitialized && this.music) {
            return this.music;
        }

        const attempt = ++this._initAttempt;
        this.initPromise = withDeadline(this._doInit(attempt), MUSICKIT_INIT_DEADLINE_MS, 'MusicKit')
            .catch(error => {
                if (!quiet) console.error('[MusicKit] Initialization failed:', error);
                if (this._initAttempt === attempt) {
                    this._initAttempt++; // what is left of this start marks nothing when it ends late
                    this.initPromise = null; // Allow retry
                }
                throw error;
            });
        return this.initPromise;
    }

    async _doInit(attempt) {
        // 1. Fetch developer token from backend
        console.log('[MusicKit] Fetching developer token...');
        const tokenResponse = await fetch('/api/musickit-token');

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json();
            throw new Error(`Token fetch failed: ${error.error || tokenResponse.status}`);
        }

        const { token } = await tokenResponse.json();
        console.log('[MusicKit] Token received');

        // 2. Wait for MusicKit JS to load
        await this._ensureMusicKitLoaded();

        // 3. Configure MusicKit
        console.log('[MusicKit] Configuring...');
        await window.MusicKit.configure({
            developerToken: token,
            app: {
                name: 'The Album Blender',
                build: '2.0.0'
            }
        });

        if (attempt !== this._initAttempt) throw new Error('MusicKit start left behind by its deadline');

        this.music = window.MusicKit.getInstance();

        // 4. Use browser locale storefront (lazy authorize - no popup on init)
        this._storefront = this.getBrowserStorefront();
        console.log(`[MusicKit] Using browser locale storefront: ${this._storefront}`);

        this.isInitialized = true;
        console.log('[MusicKit] Initialized successfully');

        return this.music;
    }

    /**
     * Ensure MusicKit JS library is loaded.
     * No timer of its own: the deadline of init() covers it.
     */
    async _ensureMusicKitLoaded() {
        if (window.MusicKit) {
            return;
        }

        // Load MusicKit JS dynamically
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
            script.async = true;
            script.crossOrigin = 'anonymous';

            script.onload = () => {
                // The script may already have announced itself before this handler ran: then
                // MusicKit is there and waiting for the event would wait for ever.
                if (window.MusicKit) return resolve();
                document.addEventListener('musickitloaded', () => resolve(), { once: true });
            };
            script.onerror = () => reject(new Error('Failed to load MusicKit JS'));

            document.head.appendChild(script);
        });
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.isInitialized && this.music !== null;
    }

    /** Whether the person has authorized Apple Music in this session (the menu shows it, F88). */
    isConnected() {
        return this.isAuthorized;
    }

    /**
     * Whether the person authorized Apple Music on this or an EARLIER visit: MusicKit keeps the
     * authorization in the browser and says so once it is started. Starting it loads the MusicKit
     * script, so only the menu asks, and only when it opens (F88).
     * @returns {Promise<boolean>}
     */
    async checkConnection() {
        const music = await this.init({ quiet: true }); // a blocked script is a state of the menu, not a line in the console
        const authorized = Boolean(music?.isAuthorized);
        const changed = authorized !== this.isAuthorized;
        this.isAuthorized = authorized;
        if (changed) announceConnection();
        return authorized;
    }

    /**
     * Disconnect: MusicKit forgets the person. With MusicKit never started there is nothing to forget.
     */
    async unauthorize() {
        if (!this.music) return;
        await this.music.unauthorize();
        this.isAuthorized = false;
        announceConnection();
    }

    /**
     * Authorize user for library access
     * @returns {Promise<string>} User token
     * @throws {AppleMusicAuthorizationError} when the person did not authorize (F98): a name the export can act on
     */
    async authorize() {
        await this.init();

        if (this.isAuthorized) {
            return this.music.musicUserToken;
        }

        try {
            const userToken = await this.music.authorize();
            this.isAuthorized = true;
            console.log('[MusicKit] User authorized');
            announceConnection();
            return userToken;
        } catch (error) {
            console.error('[MusicKit] Authorization failed:', error);
            throw new AppleMusicAuthorizationError(error?.message || null);
        }
    }

    /**
     * Authorize and validate storefront (Phase 6)
     */
    async authorizeAndValidate() {
        const browserStorefront = this.getBrowserStorefront();

        try {
            await this.authorize();

            // After auth, MusicKit should have the real storefront
            const accountStorefront = this.music?.storefrontId || browserStorefront;
            const storefrontMismatch = browserStorefront !== accountStorefront;

            if (storefrontMismatch) {
                console.warn(`[MusicKit] Storefront mismatch! Browser: ${browserStorefront}, Account: ${accountStorefront}`);
                this._storefront = accountStorefront;
            }

            return {
                authorized: true,
                storefrontMismatch,
                browserStorefront,
                accountStorefront
            };
        } catch (error) {
            console.error('[MusicKit] Authorization failed:', error);
            return {
                authorized: false,
                storefrontMismatch: false,
                browserStorefront,
                accountStorefront: browserStorefront
            };
        }
    }
}

// Singleton instance
export const musicKitAuth = new MusicKitAuth();
