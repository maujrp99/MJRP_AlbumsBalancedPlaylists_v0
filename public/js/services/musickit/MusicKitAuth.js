/**
 * MusicKitAuth.js
 * Handles initialization, authorization, and storefront detection.
 */

class MusicKitAuth {
    constructor() {
        this.music = null;
        this.isInitialized = false;
        this.isAuthorized = false;
        this.initPromise = null;
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
     * Initialize MusicKit with developer token from backend
     * @returns {Promise<MusicKit.MusicKitInstance>}
     */
    async init() {
        // Return existing promise if initialization is in progress
        if (this.initPromise) {
            return this.initPromise;
        }

        // Return immediately if already initialized
        if (this.isInitialized && this.music) {
            return this.music;
        }

        this.initPromise = this._doInit();
        return this.initPromise;
    }

    async _doInit() {
        try {
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

            this.music = window.MusicKit.getInstance();

            // 4. Use browser locale storefront (lazy authorize - no popup on init)
            this._storefront = this.getBrowserStorefront();
            console.log(`[MusicKit] Using browser locale storefront: ${this._storefront}`);

            this.isInitialized = true;
            console.log('[MusicKit] Initialized successfully');

            return this.music;
        } catch (error) {
            console.error('[MusicKit] Initialization failed:', error);
            this.initPromise = null; // Allow retry
            throw error;
        }
    }

    /**
     * Ensure MusicKit JS library is loaded
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
                document.addEventListener('musickitloaded', () => resolve(), { once: true });
            };
            script.onerror = () => reject(new Error('Failed to load MusicKit JS'));

            document.head.appendChild(script);

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!window.MusicKit) {
                    reject(new Error('MusicKit JS load timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.isInitialized && this.music !== null;
    }

    /**
     * Authorize user for library access
     * @returns {Promise<string>} User token
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
            return userToken;
        } catch (error) {
            console.error('[MusicKit] Authorization failed:', error);
            throw error;
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
