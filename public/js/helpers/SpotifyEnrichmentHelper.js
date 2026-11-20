/**
 * SpotifyEnrichmentHelper
 *
 * Writes what Spotify said about an album into an album object: its Spotify id, address and
 * popularity, and the popularity of each track.
 *
 * It only writes. It asks nobody and reads no store: since F69 the one path that asks for the
 * popularity of an album is the popularity source of the album load
 * (services/albums/adapters/spotifyPopularitySource.js), and PopularityEnricher calls this on the
 * copy of the album it publishes. No screen calls it.
 */

import { TrackTransformer } from '../transformers/TrackTransformer.js'
import { entryOfEachTrack } from '../models/sameTrack.js'

/**
 * Write the popularity into each track of the list that Spotify has, then rank the list by it.
 * Which track of Spotify is which track of the album is the one track rule's to say
 * (models/sameTrack.js, F74): one track of Spotify goes to one track of the album. It used to be
 * "the same title, or one that contains the other", which gave the popularity of the original to
 * every extra version of it.
 */
function applyToTracks(tracks, trackPopularity) {
    if (!tracks || tracks.length === 0) return
    entryOfEachTrack(tracks, trackPopularity).forEach((listed, index) => {
        if (!listed) return
        const merged = TrackTransformer.mergeSpotifyData(tracks[index], { popularity: listed.popularity, spotifyId: listed.spotifyId, spotifyUri: listed.spotifyUri })
        Object.assign(tracks[index], {
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

    const listed = (data.trackPopularity || []).filter(track => track?.name)
    if (listed.length === 0) return
    applyToTracks(album.tracks, listed)
    applyToTracks(album.tracksOriginalOrder, listed)
}
