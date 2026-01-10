/**
 * PlaylistHistoryService.js
 * Manages Undo/Redo state snapshots for playlists.
 */
export class PlaylistHistoryService {
    constructor(maxHistory = 50) {
        this.versions = [];
        this.currentVersionIndex = -1;
        this.maxHistory = maxHistory;
    }

    /**
     * Create a new snapshot of the playlist state
     * @param {Array} playlists 
     * @param {string} seriesId 
     * @param {string} description 
     */
    createSnapshot(playlists, seriesId, description = 'Update') {
        // Deep copy to prevent reference mutation issues
        const snapshot = JSON.parse(JSON.stringify(playlists));

        // If we are not at the end, discard future history (fork behavior)
        if (this.currentVersionIndex < this.versions.length - 1) {
            this.versions = this.versions.slice(0, this.currentVersionIndex + 1);
        }

        this.versions.push({
            timestamp: Date.now(),
            data: snapshot,
            seriesId: seriesId,
            description: description
        });

        // Cap history size
        if (this.versions.length > this.maxHistory) {
            this.versions.shift();
        } else {
            this.currentVersionIndex++;
        }

        console.debug(`[History] Snapshot created: ${description} (Size: ${this.versions.length})`);
    }

    /**
     * Perform Undo
     * @returns {Object|null} { playlists, seriesId } or null if cannot undo
     */
    undo() {
        if (this.currentVersionIndex > 0) {
            this.currentVersionIndex--;
            const version = this.versions[this.currentVersionIndex];
            console.debug(`[History] Undid to: ${version.description}`);
            return {
                playlists: JSON.parse(JSON.stringify(version.data)), // Return copy
                seriesId: version.seriesId
            };
        }
        return null;
    }

    /**
     * Perform Redo
     * @returns {Object|null} { playlists, seriesId } or null if cannot redo
     */
    redo() {
        if (this.currentVersionIndex < this.versions.length - 1) {
            this.currentVersionIndex++;
            const version = this.versions[this.currentVersionIndex];
            console.debug(`[History] Redid to: ${version.description}`);
            return {
                playlists: JSON.parse(JSON.stringify(version.data)), // Return copy
                seriesId: version.seriesId
            };
        }
        return null;
    }

    /**
     * Get current undo/redo availability
     * @returns {Object} { canUndo, canRedo }
     */
    getStats() {
        return {
            canUndo: this.currentVersionIndex > 0,
            canRedo: this.currentVersionIndex < this.versions.length - 1,
            count: this.versions.length,
            index: this.currentVersionIndex
        };
    }

    /**
     * Clear history (e.g. on new series load)
     */
    clear() {
        this.versions = [];
        this.currentVersionIndex = -1;
    }
}
