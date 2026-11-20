/**
 * SpotifyEnrichmentHelper
 *
 * Writes what Spotify said about an album into an album object: its Spotify id, address and
 * popularity, and the popularity of each track, matched by title.
 *
 * It only writes. It asks nobody and reads no store: since F69 the one path that asks for the
 * popularity of an album is the popularity source of the album load
 * (services/albums/adapters/spotifyPopularitySource.js), and PopularityEnricher calls this on the
 * copy of the album it publishes. No screen calls it.
 */

import { TrackTransformer } from '../transformers/TrackTransformer.js'

/** A title as the loose match reads it: lower case, letters, digits and single spaces. */
const looseTitle = (text) => text?.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim() || ''

/** The popularity of each track Spotify listed, by its title in lower case. */
function tracksByTitle(trackPopularity = []) {
    const byTitle = new Map()
    trackPopularity.forEach(track => {
        const title = track.name?.toLowerCase().trim()
        if (!title) return
        byTitle.set(title, { popularity: track.popularity, spotifyId: track.spotifyId, spotifyUri: track.spotifyUri })
    })
    return byTitle
}

/** What Spotify has for a track title: the same title, or one that contains the other. */
function matchFor(trackTitle, byTitle) {
    const exact = byTitle.get(String(trackTitle || '').toLowerCase().trim())
    if (exact) return exact

    const wanted = looseTitle(trackTitle)
    for (const [title, data] of byTitle) {
        const listed = looseTitle(title)
        if (listed === wanted || listed.includes(wanted) || wanted.includes(listed)) return data
    }
    return null
}

/** Write the popularity into each track of the list that Spotify has, then rank the list by it. */
function applyToTracks(tracks, byTitle) {
    if (!tracks || tracks.length === 0) return
    tracks.forEach(track => {
        const match = matchFor(track.title, byTitle)
        if (!match) return
        const merged = TrackTransformer.mergeSpotifyData(track, match)
        Object.assign(track, {
            spotifyPopularity: merged.spotifyPopularity,
            spotifyId: merged.spotifyId,
            spotifyUri: merged.spotifyUri
        })
    })
    TrackTransformer.calculateSpotifyRanks(tracks)
}

/**
 * Write the Spotify data of an album into the album given (it is changed in place: give a copy).
 * @param {Album} album
 * @param {Object} data - { spotifyId, spotifyUrl, spotifyPopularity, spotifyArtwork, trackPopularity: [{ name, popularity, spotifyId, spotifyUri }] }
 */
export function applySpotifyData(album, data) {
    album.spotifyId = data.spotifyId
    album.spotifyUrl = data.spotifyUrl
    album.spotifyPopularity = data.spotifyPopularity
    if (data.spotifyArtwork && !album.coverUrl) album.coverUrl = data.spotifyArtwork

    const byTitle = tracksByTitle(data.trackPopularity)
    if (byTitle.size === 0) return
    applyToTracks(album.tracks, byTitle)
    applyToTracks(album.tracksOriginalOrder, byTitle)
}
