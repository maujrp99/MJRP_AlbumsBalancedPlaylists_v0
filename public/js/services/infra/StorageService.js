/**
 * StorageService.js
 * Centralized infrastructure for LocalStorage operations with error handling.
 */
export class StorageService {
    constructor(prefix = 'mjrp_') {
        this.prefix = prefix;
    }

    /**
     * Save data to localStorage
     * @param {string} key 
     * @param {any} data 
     * @returns {boolean} success
     */
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (err) {
            console.error(`[StorageService] Failed to save ${key}:`, err);
            return false;
        }
    }

    /**
     * Load data from localStorage
     * @param {string} key 
     * @param {any} defaultValue 
     * @returns {any} parsed data or default
     */
    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(this.prefix + key);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (err) {
            console.error(`[StorageService] Failed to load ${key}:`, err);
            return defaultValue;
        }
    }

    /**
     * Remove data from localStorage
     * @param {string} key 
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (err) {
            console.error(`[StorageService] Failed to remove ${key}:`, err);
        }
    }
}
