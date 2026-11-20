/**
 * BEAEnrichmentHelper
 *
 * Writes the answer of the ratings source (BestEverAlbums) into an album.
 * It asks no source: the album load asks (services/albums/adapters/enrichers.js, through its
 * queue) and hands the answer here. The call that asked on its own left with F56.
 *
 * The answer has one row per track that was asked for. Which row is of which track of the album
 * is the one track rule's to say (models/sameTrack.js, F74): each row goes to one track, so a
 * track with a note («I Talk to the Wind (Duo Version)») never takes the rating of the plain one.
 * The row is the whole word of the source on the track: a row with no rating takes away a rating
 * an older answer left there.
 */

import { entryOfEachTrack } from '../models/sameTrack.js'

const isRated = (row) => row?.rating !== null && row?.rating !== undefined
const listsOf = (album) => [album.tracks, album.tracksOriginalOrder].filter(Array.isArray)

/** The page of the album at the source. */
function applyPage(album, info) {
    if (info?.url) album.bestEverUrl = info.url
    if (info?.albumId) album.bestEverAlbumId = info.albumId
}

/** The evidence of a track: what its row lists, and nothing when its row lists nothing. */
function applyEvidence(track, row) {
    const evidence = Array.isArray(row?.evidence) ? row.evidence : []
    if (evidence.length > 0) track.ranking = { ...track.ranking, evidence }
    else if (track.ranking?.evidence) track.ranking.evidence = []
}

/** Each track of the list with the rating and the evidence of its own row. */
function applyRows(tracks, data) {
    const ratings = entryOfEachTrack(tracks, data.trackRatings)
    const evidence = entryOfEachTrack(tracks, data.trackEvidence)
    tracks.forEach((track, index) => {
        if (!ratings[index]) return
        track.rating = isRated(ratings[index]) ? ratings[index].rating : null
        applyEvidence(track, evidence[index])
    })
}

const ratingOf = (track) => (typeof track.rating === 'number' ? track.rating : -1)
const placeOf = (track) => track.trackNumber || track.position || 0

/** The acclaim order: by rating, highest first; then by the place on the album. Each track gets its rank. */
function rankByRating(tracks) {
    tracks.sort((a, b) => (ratingOf(b) - ratingOf(a)) || (placeOf(a) - placeOf(b)))
    tracks.forEach((track, index) => {
        track.rank = index + 1
        if (track.ranking) track.ranking.rank = index + 1
    })
}

/**
 * Apply BEA data to album object.
 * @param {Album} album - changed in place: give a copy
 * @param {Object} enrichmentData - the `data` of the server's answer:
 *        { bestEverInfo: { url, albumId } | null, trackRatings: [{ title, rating }], trackEvidence: [{ title, evidence }] }
 */
export function applyBEAData(album, enrichmentData) {
    applyPage(album, enrichmentData.bestEverInfo)
    if (!Array.isArray(enrichmentData.trackRatings)) return

    listsOf(album).forEach(tracks => applyRows(tracks, enrichmentData))
    if (enrichmentData.trackRatings.some(isRated)) {
        album.acclaim = { ...album.acclaim, hasRatings: true, source: 'best-ever-albums', enrichedAt: new Date().toISOString() }
    }
    if (album.tracks) rankByRating(album.tracks)
}
