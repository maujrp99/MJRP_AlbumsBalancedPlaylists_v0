/**
 * MusicKitService (Facade)
 * 
 * Facade for Apple MusicKit integration.
 * Delegates to modular services (Sprint 17 Refactor).
 * Internal Logic moved to /musickit/ modules.
 * 
 * @see https://developer.apple.com/documentation/musickitjs
 */

import { musicKitAuth } from './musickit/MusicKitAuth.js';
import { musicKitCatalog } from './musickit/MusicKitCatalog.js';
import { musicKitLibrary } from './musickit/MusicKitLibrary.js';

class MusicKitService {
    // =========================================
    // AUTHENTICATION & INITIALIZATION
    // =========================================

    async init() {
        return musicKitAuth.init();
    }

    getBrowserStorefront() {
        return musicKitAuth.getBrowserStorefront();
    }

    _getStorefront() {
        return musicKitAuth.getStorefront();
    }

    async authorize() {
        return musicKitAuth.authorize();
    }

    async authorizeAndValidate() {
        return musicKitAuth.authorizeAndValidate();
    }

    isReady() {
        return musicKitAuth.isReady();
    }

    // =========================================
    // CATALOG SEARCH & DETAILS
    // =========================================

    async searchAlbums(artist, album, limit) {
        return musicKitCatalog.searchAlbums(artist, album, limit);
    }

    async getAlbumDetails(appleAlbumId) {
        return musicKitCatalog.getAlbumDetails(appleAlbumId);
    }

    async getArtistAlbums(artistName) {
        return musicKitCatalog.getArtistAlbums(artistName);
    }

    async findTrack(title, artist) {
        return musicKitCatalog.findTrack(title, artist);
    }

    async findTrackFromAlbum(title, artist, albumName, isLiveAlbum) {
        return musicKitCatalog.findTrackFromAlbum(title, artist, albumName, isLiveAlbum);
    }

    extractArtworkTemplate(artwork) {
        return musicKitCatalog.extractArtworkTemplate(artwork);
    }

    getArtworkUrl(template, size) {
        return musicKitCatalog.getArtworkUrl(template, size);
    }

    // =========================================
    // LIBRARY MANAGEMENT
    // =========================================

    async createPlaylist(name, trackIds) {
        return musicKitLibrary.createPlaylist(name, trackIds);
    }

    async createOrGetFolder(folderName) {
        return musicKitLibrary.createOrGetFolder(folderName);
    }

    async createPlaylistInFolder(name, trackIds, folderId) {
        return musicKitLibrary.createPlaylistInFolder(name, trackIds, folderId);
    }
}

// Singleton instance
export const musicKitService = new MusicKitService();
