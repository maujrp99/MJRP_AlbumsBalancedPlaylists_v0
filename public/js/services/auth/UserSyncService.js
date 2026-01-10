/**
 * UserSyncService.js
 * Handles user authentication events and data migration between guest/user states.
 */
import { dataSyncService } from '../DataSyncService.js';

export class UserSyncService {
    constructor() {
        // No internal state needed, acts as coordinator
    }

    /**
     * Handle user login/logout switch
     * @param {Object} newUser 
     * @param {string} currentUserId 
     * @param {Function} onMigrateCallback - executed if migration is needed
     */
    async handleUserChange(newUser, currentUserId, onMigrateCallback) {
        if (newUser && newUser.id !== currentUserId) {
            // Guest -> User Migration check
            // logic could be expanded here
            if (currentUserId === 'guest') {
                console.log('[UserSync] Detecting Guest -> User transition');
                if (onMigrateCallback) await onMigrateCallback();
            }
        }
    }

    /**
     * Migrate a series to the new user context
     * @param {Object} series 
     * @returns {Promise<boolean>}
     */
    async migrateSeries(series) {
        if (!series) return false;

        console.log('[UserSync] Migrating series:', series.id);
        const success = await dataSyncService.saveSeries(series);
        if (success) {
            console.log('[UserSync] Migration successful');
        } else {
            console.error('[UserSync] Migration failed');
        }
        return success;
    }
}
