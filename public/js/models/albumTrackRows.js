/**
 * albumTrackRows - the rows of the track table of an album card (F83 wave 5a; the rule the card renderer kept in
 * components/ui/AlbumCardRenderer.js, with no drawing in it).
 *
 * The original tracks of the album, each with what the acclaim list (BestEverAlbums) says of the track with the same title (its rank,
 * rating, duration), what the album kept of the popularity, and the rank the person gave it, sorted by a column.
 */

const normalizeTitle = (text) => text?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || ''

const present = (value) => value !== undefined && value !== null

/** The rating: the acclaim list's when it has one, else the track's own, else none. */
function ratingOf(track, enriched) {
    if (present(enriched?.rating)) return enriched.rating
    return track.rating !== undefined ? track.rating : null
}

function popularityOf(track, enriched) {
    return present(enriched?.spotifyPopularity) ? Number(enriched.spotifyPopularity) : (track.spotifyPopularity || -1)
}

function mergedTracks(album) {
    const enrichedByTitle = new Map()
    album.getTracks('acclaim').forEach(track => enrichedByTitle.set(normalizeTitle(track.title), track))
    return album.getTracks('original').map((track, index) => {
        const enriched = enrichedByTitle.get(normalizeTitle(track.title))
        return {
            ...track,
            rank: enriched?.rank || track.rank || 999,
            userRank: track.userRank, // injected by the controller
            rating: ratingOf(track, enriched),
            spotifyPopularity: popularityOf(track, enriched),
            position: Number(track.position) || (index + 1),
            duration: enriched?.duration || track.duration || 0
        }
    })
}

function sortKey(track, field) {
    switch (field) {
        case 'rank':
        case 'userRank':
            return (track[field] && track[field] < 999) ? Number(track[field]) : 999999
        case 'rating':
        case 'spotifyPopularity':
        case 'duration':
            return Number(track[field]) || -1
        default:
            return track[field] || ''
    }
}

/**
 * @param {Object} album - a loaded album (`getTracks('original' | 'acclaim')`)
 * @param {{ sortField?: string, sortDirection?: 'asc'|'desc' }} [options]
 * @returns {Array<Object>} the rows, sorted; empty when the album has no tracks
 */
export function trackRowsOf(album, { sortField = 'rank', sortDirection = 'asc' } = {}) {
    const tracks = mergedTracks(album)
    tracks.sort((a, b) => {
        const first = sortKey(a, sortField)
        const second = sortKey(b, sortField)
        if (first < second) return sortDirection === 'asc' ? -1 : 1
        if (first > second) return sortDirection === 'asc' ? 1 : -1
        return 0
    })
    return tracks
}
