
const axios = require('axios');
const querystring = require('querystring');
const { upstreamErrorFrom } = require('../outcome');
require('dotenv').config();

// Spotify API Config
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
/** How many tracks Spotify gives in one request of full tracks. */
const TRACKS_PER_REQUEST = 50;

let accessToken = null;
let tokenExpiresAt = 0;

/**
 * What this module answers (F69, under the answer contract of F52, lib/outcome.js):
 *   found           Spotify has the album asked for; with the popularity of its tracks
 *   not_found       Spotify answered: it has no such album (or the album lists no track)
 *   not_configured  this server has no Spotify credentials: Spotify was not asked
 * A call that failed (network, 4xx/5xx, "wait", too slow) is THROWN as an UpstreamError. Before,
 * the three and every failure came back as `{ error }`, and "it failed" read as "there is none".
 */
const SPOTIFY_OUTCOMES = Object.freeze({ FOUND: 'found', NOT_FOUND: 'not_found', NOT_CONFIGURED: 'not_configured' });
const SOURCE = 'Spotify';

/**
 * A valid Spotify access token (Client Credentials Flow), or null when this server has no
 * credentials. Asking for one and being refused, or not being answered, is thrown.
 * @param {Object} [http] - { post(url, body, config) }, axios by default
 * @returns {Promise<string|null>}
 */
async function getAccessToken(http = axios) {
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

    console.log('[Spotify] Requesting new access token...');
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await http.post(SPOTIFY_TOKEN_URL,
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
}

const { loadAlbumIdentity } = require('../albumIdentity');

/** A Spotify album as the identity rule reads it. */
const spotifyCandidate = (item) => ({
    artist: (item?.artists || []).map(a => a?.name).filter(Boolean).join(' & '),
    title: item?.name,
    year: item?.release_date
});

/**
 * The Spotify album that is the album asked for, or null.
 * Three searches, from the narrowest to the widest (title and artist, the title without its edition
 * notes and artist, the albums of the artist). The title without edition notes is the rule's own. The searches only LIST candidates; which one is accepted is decided by
 * the one identity rule (shared/albumIdentity.js, F55). There is no "first result".
 * @param {{ title: string, artist: string }} asked
 * @param {string} token
 * @param {Object} [http] - { get(url, config) }, axios by default
 */
async function findSpotifyAlbum(asked, token, http = axios) {
    const { pickAlbum, titleWithoutEditionNotes } = await loadAlbumIdentity();
    const cleanT = titleWithoutEditionNotes(asked.title);
    const searches = [
        { q: `album:${asked.title} artist:${asked.artist}`, limit: 5 },
        ...(cleanT !== asked.title ? [{ q: `album:${cleanT} artist:${asked.artist}`, limit: 5 }] : []),
        { q: `artist:${asked.artist}`, limit: 20 }
    ];

    for (const { q, limit } of searches) {
        console.log(`[Spotify] Searching: ${q}`);
        const res = await http.get(SPOTIFY_SEARCH_URL, {
            params: { q, type: 'album', limit },
            headers: { Authorization: `Bearer ${token}` }
        });
        const picked = pickAlbum(asked, res.data?.albums?.items || [], spotifyCandidate);
        if (picked.found) return picked.candidate;
    }
    return null;
}

/**
 * The full tracks of an album, which carry the popularity (the album itself lists them without it).
 * @returns {Promise<Array>}
 */
async function readTracksWithPopularity(albumId, token, http) {
    const headers = { Authorization: `Bearer ${token}` };
    const details = await http.get(`${SPOTIFY_API_URL}/albums/${albumId}`, { headers });
    const trackIds = (details.data?.tracks?.items || []).map(t => t.id).filter(Boolean);

    const tracks = [];
    for (let i = 0; i < trackIds.length; i += TRACKS_PER_REQUEST) {
        const ids = trackIds.slice(i, i + TRACKS_PER_REQUEST).join(',');
        const res = await http.get(`${SPOTIFY_API_URL}/tracks`, { params: { ids }, headers });
        tracks.push(...(res.data?.tracks || []).filter(Boolean));
    }
    return tracks;
}

/** The popularity (0-100) of each track as ranking evidence, the most popular first. */
const evidenceOf = (tracks) => tracks
    .map(t => ({ trackTitle: t.name, rating: t.popularity, position: t.track_number, durationMs: t.duration_ms }))
    .sort((a, b) => b.rating - a.rating);

/** Ask Spotify. Everything here that fails is a failure of the source. */
async function askSpotify(asked, { http, getToken }) {
    const token = await getToken();
    if (!token) return { outcome: SPOTIFY_OUTCOMES.NOT_CONFIGURED };

    const album = await findSpotifyAlbum(asked, token, http);
    if (!album) {
        console.log('[Spotify] No album of Spotify is the album asked for.');
        return { outcome: SPOTIFY_OUTCOMES.NOT_FOUND };
    }

    const tracks = await readTracksWithPopularity(album.id, token, http);
    if (tracks.length === 0) return { outcome: SPOTIFY_OUTCOMES.NOT_FOUND };

    console.log(`[Spotify] Retrieved popularity for ${tracks.length} tracks of ${album.id}.`);
    return {
        outcome: SPOTIFY_OUTCOMES.FOUND,
        provider: SOURCE,
        providerType: 'popularity', // Backend flag for frontend label
        referenceUrl: album.external_urls?.spotify || null,
        evidence: evidenceOf(tracks)
    };
}

/**
 * The popularity of the tracks of an album, as pseudo-ranking evidence (0-100).
 * @param {string} albumTitle
 * @param {string} artistName
 * @param {Object} [deps] - { http, getToken }, axios and the client-credentials token by default
 * @returns {Promise<{ outcome: 'found', provider, providerType, referenceUrl, evidence: Array }
 *          | { outcome: 'not_found' } | { outcome: 'not_configured' }>}
 * @throws {UpstreamError} when Spotify could not be asked; the caller decides what a failure
 *         means, and never reads it as "Spotify has none"
 */
async function getSpotifyPopularityRanking(albumTitle, artistName, { http = axios, getToken = () => getAccessToken(http) } = {}) {
    try {
        return await askSpotify({ title: albumTitle, artist: artistName }, { http, getToken });
    } catch (error) {
        const failure = upstreamErrorFrom(error, SOURCE);
        console.error(`[Spotify] could not be asked: ${failure.message} (${failure.code})`);
        throw failure;
    }
}

module.exports = { getSpotifyPopularityRanking, findSpotifyAlbum, SPOTIFY_OUTCOMES };
