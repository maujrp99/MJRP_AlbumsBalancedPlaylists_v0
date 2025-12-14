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
        this._storefront = null; // Cache user's storefront
    }

    /**
     * Get user's storefront (region) for catalog searches
     * Falls back to 'us' if not available
     * @returns {string} Storefront code (e.g., 'us', 'br', 'gb')
     */
    _getStorefront() {
        if (this._storefront) {
            return this._storefront;
        }
        // Try to get from MusicKit instance
        if (this.music?.storefrontId) {
            this._storefront = this.music.storefrontId;
            console.log(`[MusicKit] Using storefront: ${this._storefront}`);
            return this._storefront;
        }
        // Fallback to US
        return 'us';
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
            const result = await this.music.api.music(`/v1/catalog/${this._getStorefront()}/search`, {
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
            const artistSearch = await this.music.api.music(`/v1/catalog/${this._getStorefront()}/search`, {
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
                `/v1/catalog/${this._getStorefront()}/artists/${artistId}/albums`,
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
                            description: "Created by MJRP's The Album Playlist Synthesizer"
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
     * Create or find a playlist folder by name
     * @param {string} folderName - Folder name (Series name)
     * @returns {Promise<string|null>} Folder ID or null
     */
    async createOrGetFolder(folderName) {
        await this.authorize();

        try {
            // First, try to find existing folder
            const foldersResult = await this.music.api.music('/v1/me/library/playlist-folders');
            const folders = foldersResult.data?.data || [];

            const existingFolder = folders.find(f =>
                f.attributes?.name?.toLowerCase() === folderName.toLowerCase()
            );

            if (existingFolder) {
                console.log('[MusicKit] Found existing folder:', folderName);
                return existingFolder.id;
            }

            // Create new folder
            const newFolder = await this.music.api.music('/v1/me/library/playlist-folders', null, {
                fetchOptions: {
                    method: 'POST',
                    body: JSON.stringify({
                        attributes: {
                            name: folderName
                        }
                    })
                }
            });

            console.log('[MusicKit] Created folder:', folderName);
            return newFolder.data?.data?.[0]?.id || null;
        } catch (error) {
            console.error('[MusicKit] Folder operation failed:', error);
            return null; // Continue without folder
        }
    }

    /**
     * Create playlist inside a folder
     * @param {string} name - Playlist name
     * @param {Array<string>} trackIds - Track IDs
     * @param {string|null} folderId - Parent folder ID
     */
    async createPlaylistInFolder(name, trackIds, folderId = null) {
        await this.authorize();

        const playlistData = {
            attributes: {
                name: name,
                description: "Created by MJRP's The Album Playlist Synthesizer"
            },
            relationships: {
                tracks: {
                    data: trackIds.map(id => ({
                        id: id,
                        type: 'songs'
                    }))
                }
            }
        };

        // Add parent folder relationship if provided
        if (folderId) {
            playlistData.relationships.parent = {
                data: [{
                    id: folderId,
                    type: 'library-playlist-folders'
                }]
            };
        }

        // DEBUG: Log the payload being sent
        console.log('[MusicKit] Creating playlist:', name, 'with', trackIds.length, 'tracks');
        console.log('[MusicKit] Track IDs:', trackIds);
        console.log('[MusicKit] Payload:', JSON.stringify(playlistData, null, 2));

        try {
            const playlist = await this.music.api.music('/v1/me/library/playlists', null, {
                fetchOptions: {
                    method: 'POST',
                    body: JSON.stringify(playlistData)
                }
            });

            // DEBUG: Log the response
            console.log('[MusicKit] Playlist creation response:', playlist);
            console.log('[MusicKit] Playlist created in folder:', name);
            return playlist.data?.data?.[0];
        } catch (error) {
            console.error('[MusicKit] Create playlist in folder failed:', error);
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
            const result = await this.music.api.music(`/v1/catalog/${this._getStorefront()}/search`, {
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
     * Search for a track from a specific album (improved matching)
     * Prefers Hi-Res Lossless, allows remasters, excludes live versions
     * @param {string} title - Track title
     * @param {string} artist - Artist name
     * @param {string} albumName - Album name for filtering
     * @param {boolean} isLiveAlbum - Whether the source album is a live album
     * @returns {Promise<Object|null>} Best matching track
     */
    async findTrackFromAlbum(title, artist, albumName, isLiveAlbum = false) {
        await this.init();

        console.log(`[MusicKit] Searching: "${title}" by ${artist} from "${albumName}"`);

        try {
            // Search with album name for better precision
            const result = await this.music.api.music(`/v1/catalog/${this._getStorefront()}/search`, {
                term: `${title} ${artist} ${albumName}`,
                types: 'songs',
                limit: 20
            });

            const tracks = result.data?.results?.songs?.data || [];
            console.log(`[MusicKit] Found ${tracks.length} candidates for "${title}"`);

            if (tracks.length === 0) {
                // Fallback to simpler search
                console.log(`[MusicKit] No results, trying simple search...`);
                return this.findTrack(title, artist);
            }

            // Filter and rank tracks (improved fuzzy matching)
            const ranked = tracks
                .filter(track => {
                    const trackName = (track.attributes?.name || '').toLowerCase();
                    const trackAlbum = (track.attributes?.albumName || '').toLowerCase();
                    const searchTitle = title.toLowerCase();

                    // 1. Live Filter (Strict)
                    if (!isLiveAlbum) {
                        const isLiveTrack = trackAlbum.includes('live') ||
                            trackName.includes('(live)') ||
                            trackName.includes('[live]') ||
                            trackName.includes(' - live');
                        if (isLiveTrack) return false;
                    }

                    // 2. Fuzzy Match Title
                    // Calculate similarity score (0-1)
                    const similarity = this._calculateSimilarity(searchTitle, trackName);

                    // Allow match if similarity > 0.6 OR partial inclusion for long titles
                    const includes = trackName.includes(searchTitle) || searchTitle.includes(trackName);

                    if (similarity > 0.6 || includes) {
                        track.similarity = similarity; // Store for scoring
                        return true;
                    }

                    return false;
                })
                .map(track => ({
                    track,
                    score: this._scoreTrack(track, albumName) + ((track.similarity || 0) * 10) // Boost by similarity
                }))
                .sort((a, b) => b.score - a.score);

            // If no ranked tracks, fallback to first result
            if (ranked.length === 0 && tracks.length > 0) {
                console.log(`[MusicKit] No ranked matches, using first result: "${tracks[0].attributes?.name}"`);
                return tracks[0];
            }

            const selected = ranked[0]?.track;
            if (selected) {
                console.log(`[MusicKit] Selected: "${selected.attributes?.name}" from "${selected.attributes?.albumName}" (score: ${ranked[0].score})`);
            }

            return selected || null;
        } catch (error) {
            console.error('[MusicKit] Track search failed:', error);
            return null;
        }
    }

    /**
     * Score a track for quality preference
     * Higher score = better match
     * @private
     */
    _scoreTrack(track, targetAlbum) {
        let score = 0;
        const attrs = track.attributes || {};
        const albumName = (attrs.albumName || '').toLowerCase();
        const targetLower = targetAlbum.toLowerCase();

        // Exact album match (+50)
        if (albumName === targetLower) score += 50;
        else if (albumName.includes(targetLower) || targetLower.includes(albumName)) score += 30;

        // Hi-Res Lossless preference (+20)
        if (attrs.audioTraits?.includes('hi-res-lossless')) score += 20;
        else if (attrs.audioTraits?.includes('lossless')) score += 10;

        // Remaster bonus (+5) - user prefers remastered
        if (albumName.includes('remaster')) score += 5;

        // Spatial audio bonus (+3)
        if (attrs.audioTraits?.includes('spatial')) score += 3;

        return score;
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.isInitialized && this.music !== null;
    }

    /**
     * Calculate string similarity (0-1) using Levenshtein distance
     * @private
     */
    _calculateSimilarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;
        if (longerLength === 0) return 1.0;

        const costs = new Array();
        for (let i = 0; i <= longer.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= shorter.length; j++) {
                if (i == 0) costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (longer.charAt(i - 1) != shorter.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[shorter.length] = lastValue;
        }

        return (longerLength - costs[shorter.length]) / parseFloat(longerLength);
    }
}


// Singleton instance
export const musicKitService = new MusicKitService();
