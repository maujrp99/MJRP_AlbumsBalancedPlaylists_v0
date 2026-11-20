/**
 * albumAverages - the two averages of an album (F71, S-56), as pure rules.
 *
 *   «Avg Rating»  the mean of the BestEverAlbums rating of its tracks (rating above zero)
 *   «Avg Pop»     the mean of the Spotify popularity of its tracks (zero or more)
 *
 * One decimal, kept as a number. An average nothing feeds is `null`: never zero, so that "no
 * data" is not read as "bad". The track comparison of an album and the inventory both read the
 * averages here, so the number on one screen is the number on the other.
 *
 * The mean of the rank positions that the comparison used to show ("Avg Rank") is gone: it only
 * measured how many tracks an album has (the owner, 2026-11-19).
 */

const NONE = '—'

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)
const oneDecimal = (value) => Math.round(value * 10) / 10

/** @returns {number|null} the mean of the numbers, one decimal; null for none */
function mean(values) {
    if (values.length === 0) return null
    return oneDecimal(values.reduce((sum, value) => sum + value, 0) / values.length)
}

/**
 * @param {Array<{ rating?: number|null, spotifyPopularity?: number|null }>} tracks
 * @returns {{ rating: number|null, popularity: number|null, ratedTracks: number, popTracks: number }}
 */
export function averagesOf(tracks) {
    const list = Array.isArray(tracks) ? tracks : []
    const ratings = list.map(track => track?.rating).filter(value => isNumber(value) && value > 0)
    const popularities = list.map(track => track?.spotifyPopularity).filter(value => isNumber(value) && value >= 0)
    return { rating: mean(ratings), popularity: mean(popularities), ratedTracks: ratings.length, popTracks: popularities.length }
}

const normalized = (text) => text?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || ''

const popularityOf = (value) => (value !== undefined && value !== null ? Number(value) : null)

/** The first value that is truthy, or the fallback: what `a || b || fallback` says. */
const firstOr = (fallback, ...values) => values.find(Boolean) ?? fallback

/** One track of the original order with what the acclaim order knows of the same title. */
function mergeTrack(track, enriched, index) {
    const known = enriched || {}
    return {
        ...track,
        rank: firstOr(999, known.rank, track.rank),
        rating: firstOr(null, known.rating, track.rating),
        spotifyPopularity: popularityOf(known.spotifyPopularity) ?? popularityOf(track.spotifyPopularity) ?? -1,
        spotifyId: firstOr(undefined, known.spotifyId, track.spotifyId),
        position: Number(track.position) || (index + 1),
        duration: firstOr(0, known.duration, track.duration)
    }
}

/**
 * The tracks of an album as the track comparison shows them: every track of the original order,
 * with what the acclaim order knows of the same title (rank, rating, popularity, Spotify id,
 * duration) merged in, and a default for what is missing (rank 999, popularity -1).
 * @param {{ getTracks: Function }} album
 * @returns {Array<Object>}
 */
export function mergedTracksOf(album) {
    const enrichedByTitle = new Map(album.getTracks('acclaim').map(track => [normalized(track.title), track]))
    return album.getTracks('original').map((track, index) => mergeTrack(track, enrichedByTitle.get(normalized(track.title)), index))
}

/** The averages of a loaded album: its tracks merged as the comparison shows them, then averaged. */
export function averagesOfAlbum(album) {
    return averagesOf(typeof album?.getTracks === 'function' ? mergedTracksOf(album) : album?.tracks)
}

// ---- What is said of them -------------------------------------------------------------------------

/** @param {{ rating?: number|null }|null} [averages] */
export const ratingValue = (averages) => (isNumber(averages?.rating) ? String(averages.rating) : NONE)

/** @param {{ popularity?: number|null }|null} [averages] */
export const popularityValue = (averages) => (isNumber(averages?.popularity) ? `${averages.popularity}%` : NONE)

export const ratingText = (averages) => `Avg Rating: ${ratingValue(averages)}`
export const popularityText = (averages) => `Avg Pop: ${popularityValue(averages)}`

/**
 * The small line of a card: the averages the item has, and nothing (an empty text) when it has none.
 * @param {{ rating?: number|null, popularity?: number|null }|null} [averages]
 */
export function averagesLine(averages) {
    const parts = []
    if (isNumber(averages?.rating)) parts.push(ratingText(averages))
    if (isNumber(averages?.popularity)) parts.push(popularityText(averages))
    return parts.join(' · ')
}
