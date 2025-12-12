/**
 * MusicKitService
 * 
 * Frontend service for Apple MusicKit integration.
 * Handles initialization, album search, artwork URLs, and discography fetching.
 * 
 * @see https://developer.apple.com/documentation/musickitjs
 */

class MusicKitService {
    constructor() {
        this.music = null;
        this.isInitialized = false;
        this.isAuthorized = false;
        this.initPromise = null;
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
                    name: 'Album Playlist Synthesizer',
                    build: '2.0.0'
                }
            });

            this.music = window.MusicKit.getInstance();
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
     * Search for albums in Apple Music catalog
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @param {number} limit - Max results
     * @returns {Promise<Array>} Album results
     */
    async searchAlbums(artist, album, limit = 10) {
        await this.init();

        const query = album ? `${artist} ${album}` : artist;

        try {
            const result = await this.music.api.music(`/v1/catalog/us/search`, {
                term: query,
                types: 'albums',
                limit: limit
            });

            return result.data?.results?.albums?.data || [];
        } catch (error) {
            console.error('[MusicKit] Search failed:', error);
            throw error;
        }
    }

    /**
     * Get artist's albums (official discography)
     * @param {string} artistName - Artist name to search
     * @returns {Promise<Array>} Albums with type classification
     */
    async getArtistAlbums(artistName) {
        await this.init();

        try {
            // First, find the artist
            const artistSearch = await this.music.api.music(`/v1/catalog/us/search`, {
                term: artistName,
                types: 'artists',
                limit: 1
            });

            const artists = artistSearch.data?.results?.artists?.data;
            if (!artists || artists.length === 0) {
                console.warn(`[MusicKit] Artist not found: ${artistName}`);
                return [];
            }

            const artistId = artists[0].id;

            // Then get their albums
            const albumsResult = await this.music.api.music(
                `/v1/catalog/us/artists/${artistId}/albums`,
                { limit: 100 }
            );

            const albums = albumsResult.data?.data || [];

            // Map to our format with album type classification
            return albums.map(album => ({
                appleMusicId: album.id,
                title: album.attributes.name,
                artist: album.attributes.artistName,
                year: album.attributes.releaseDate?.split('-')[0] || null,
                albumType: this._classifyAlbumType(album.attributes),
                artworkTemplate: this._extractArtworkTemplate(album.attributes.artwork),
                trackCount: album.attributes.trackCount,
                isLive: album.attributes.name.toLowerCase().includes('live'),
                isSingle: album.attributes.isSingle || false,
                isCompilation: album.attributes.isCompilation || false
            }));
        } catch (error) {
            console.error('[MusicKit] Get artist albums failed:', error);
            throw error;
        }
    }

    /**
     * Classify album type based on attributes
     * @private
     */
    _classifyAlbumType(attributes) {
        const name = (attributes.name || '').toLowerCase();

        if (attributes.isSingle) return 'Single';
        if (attributes.isCompilation) return 'Compilation';
        if (name.includes('live') || name.includes('unplugged') || name.includes('in concert')) {
            return 'Live';
        }
        if (name.includes(' ep') || name.endsWith(' ep')) return 'EP';

        return 'Album'; // Default: studio album
    }

    /**
     * Extract artwork template URL from Apple Music artwork object
     * @param {Object} artwork - Apple Music artwork object
     * @returns {string|null} Template URL with {w}x{h} placeholders
     */
    _extractArtworkTemplate(artwork) {
        if (!artwork || !artwork.url) return null;

        // Apple Music artwork URLs come with {w} and {h} placeholders
        // Example: https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/.../source/{w}x{h}bb.jpg
        return artwork.url;
    }

    /**
     * Get artwork URL for a specific size
     * @param {string} template - Artwork template URL with {w}x{h}
     * @param {number} size - Desired size in pixels
     * @returns {string} Constructed URL
     */
    getArtworkUrl(template, size = 500) {
        if (!template) return null;
        return template.replace('{w}', size).replace('{h}', size);
    }

    /**
     * Authorize user for library access (needed for playlist export)
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
     * Create a playlist in user's library
     * @param {string} name - Playlist name
     * @param {Array<string>} trackIds - Apple Music track IDs
     * @returns {Promise<Object>} Created playlist
     */
    async createPlaylist(name, trackIds) {
        await this.authorize();

        try {
            const playlist = await this.music.api.music('/v1/me/library/playlists', null, {
                fetchOptions: {
                    method: 'POST',
                    body: JSON.stringify({
                        attributes: {
                            name: name,
                            description: 'Created by Album Playlist Synthesizer'
                        },
                        relationships: {
                            tracks: {
                                data: trackIds.map(id => ({
                                    id: id,
                                    type: 'songs'
                                }))
                            }
                        }
                    })
                }
            });

            console.log('[MusicKit] Playlist created:', name);
            return playlist.data?.data?.[0];
        } catch (error) {
            console.error('[MusicKit] Create playlist failed:', error);
            throw error;
        }
    }

    /**
     * Search for a track by title and artist
     * @param {string} title - Track title
     * @param {string} artist - Artist name
     * @returns {Promise<Object|null>} Track or null if not found
     */
    async findTrack(title, artist) {
        await this.init();

        try {
            const result = await this.music.api.music(`/v1/catalog/us/search`, {
                term: `${title} ${artist}`,
                types: 'songs',
                limit: 5
            });

            const tracks = result.data?.results?.songs?.data || [];

            // Return first match (could add fuzzy matching here)
            return tracks[0] || null;
        } catch (error) {
            console.error('[MusicKit] Track search failed:', error);
            return null;
        }
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.isInitialized && this.music !== null;
    }
}

// Singleton instance
export const musicKitService = new MusicKitService();
