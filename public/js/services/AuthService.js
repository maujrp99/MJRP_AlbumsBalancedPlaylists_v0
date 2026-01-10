/**
 * AuthService.js
 * 
 * Centralized Authentication Service.
 * Provides a synchronization point for the app to wait for auth readiness.
 * 
 * Usage:
 *   import { AuthService } from './services/AuthService.js';
 *   await AuthService.waitForAuth();
 *   // Now safe to access auth.currentUser, initialize stores, etc.
 */

import { auth, db } from '../firebase-init.js';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { albumSeriesStore } from '../stores/albumSeries.js';
import { getSeriesService } from './SeriesService.js';

class AuthServiceClass {
    constructor() {
        this._ready = false;
        this._user = null;
        this._readyPromise = null;
        this._resolveReady = null;
    }

    /**
     * Initialize the auth listener.
     * Should be called once at app startup.
     */
    init() {
        if (this._readyPromise) {
            console.warn('[AuthService] Already initialized.');
            return this._readyPromise;
        }

        this._readyPromise = new Promise((resolve) => {
            this._resolveReady = resolve;
        });

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('✅ [AuthService] Authenticated as:', user.uid);
                this._user = user;
                this._ready = true;

                // Initialize stores and services that depend on user ID
                albumSeriesStore.setDb(db);
                albumSeriesStore.setUserId(user.uid);

                // Initialize SeriesService (it will also update store context)
                getSeriesService(db, null, user.uid);

                document.body.classList.add('authenticated');
                this._resolveReady(user);
            } else {
                console.log('⚠️ [AuthService] Not authenticated, signing in anonymously...');
                try {
                    await signInAnonymously(auth);
                    // The onAuthStateChanged will fire again with the new user
                } catch (error) {
                    console.error('[AuthService] Anonymous sign-in failed:', error);
                    // Resolve anyway to unblock the app, but with null user
                    this._ready = true;
                    this._resolveReady(null);
                }
            }
        });

        return this._readyPromise;
    }

    /**
     * Wait for authentication to be ready.
     * Resolves with the User object (or null if auth failed).
     * @returns {Promise<User|null>}
     */
    waitForAuth() {
        if (!this._readyPromise) {
            // If init() wasn't called, call it now
            return this.init();
        }
        return this._readyPromise;
    }

    /**
     * Check if auth is ready (synchronous).
     * @returns {boolean}
     */
    isReady() {
        return this._ready;
    }

    /**
     * Get the current user (synchronous, may be null).
     * @returns {User|null}
     */
    getCurrentUser() {
        return this._user;
    }
}

// Singleton export
export const AuthService = new AuthServiceClass();
