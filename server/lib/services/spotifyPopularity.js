
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

// Spotify API Config
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';

let accessToken = null;
let tokenExpiresAt = 0;

/**
 * Get valid Spotify Access Token (Client Credentials Flow)
 */
async function getAccessToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.warn('[Spotify] Missing Credentials in .env');
        return null;
    }

    // Return cached token if still valid (with 60s buffer)
    if (accessToken && Date.now() < tokenExpiresAt - 60000) {
        return accessToken;
    }

    try {
        console.log('[Spotify] Requesting new access token...');
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const res = await axios.post(SPOTIFY_TOKEN_URL,
            querystring.stringify({ grant_type: 'client_credentials' }), {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        accessToken = res.data.access_token;
        tokenExpiresAt = Date.now() + (res.data.expires_in * 1000);
        console.log('[Spotify] Token refreshed successfully.');
        return accessToken;

    } catch (error) {
        console.error('[Spotify] Auth Failed:', error.message);
        return null;
    }
}

/**
 * Get track popularity for an album
 * Returns pseudo-ranking evidence based on popularity score (0-100)
 */
async function getSpotifyPopularityRanking(albumTitle, artistName) {
    try {
        const token = await getAccessToken();
        if (!token) return { error: 'Spotify credentials missing or invalid' };

        // 1. Search for the album
        const query = `album:${albumTitle} artist:${artistName}`;
        console.log(`[Spotify] Searching: ${query}`);

        const searchRes = await axios.get(SPOTIFY_SEARCH_URL, {
            params: { q: query, type: 'album', limit: 1 },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const album = searchRes.data.albums.items[0];
        if (!album) {
            console.log('[Spotify] Album not found.');
            return { error: 'Album not found on Spotify' };
        }

        console.log(`[Spotify] Found Album: ${album.name} (ID: ${album.id})`);

        // 2. Get tracks with popularity
        // Note: The 'Get Album Tracks' endpoint acts weirdly with popularity (sometimes missing),
        // so we might need to fetch tracks then get detailed track info, or just use the tracks from the album object if it's a 'simple' object.
        // Actually, 'Get Album' endpoint returns tracks but distinct track objects often lack popularity.
        // We need to fetch tracks IDs then batch request 'Get Several Tracks' to get popularity.

        // First, get album details to get track list paging
        const albumDetailsRes = await axios.get(`https://api.spotify.com/v1/albums/${album.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const tracksSimple = albumDetailsRes.data.tracks.items;
        const trackIds = tracksSimple.map(t => t.id).filter(id => id);

        if (trackIds.length === 0) return { error: 'No tracks found' };

        // 3. Get detailed track info (for popularity) - Max 50 IDs per call
        const chunks = [];
        for (let i = 0; i < trackIds.length; i += 50) {
            chunks.push(trackIds.slice(i, i + 50));
        }

        let allTracksFull = [];
        for (const chunk of chunks) {
            const tracksRes = await axios.get(`https://api.spotify.com/v1/tracks`, {
                params: { ids: chunk.join(',') },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            allTracksFull = allTracksFull.concat(tracksRes.data.tracks);
        }

        // 4. Transform to Rankings
        // Using Popularity (0-100) directly as "rating"
        const evidence = allTracksFull.map((t, idx) => ({
            trackTitle: t.name,
            rating: t.popularity,
            position: t.track_number,
            durationMs: t.duration_ms
        }));

        // Sort by Popularity Descending
        evidence.sort((a, b) => b.rating - a.rating);

        console.log(`[Spotify] Retrieved popularity for ${evidence.length} tracks.`);

        return {
            provider: 'Spotify',
            providerType: 'popularity', // Backend flag for frontend label
            referenceUrl: album.external_urls.spotify,
            evidence
        };

    } catch (error) {
        console.error('[Spotify] Error:', error.response?.data || error.message);
        return { error: error.message };
    }
}

module.exports = { getSpotifyPopularityRanking };
