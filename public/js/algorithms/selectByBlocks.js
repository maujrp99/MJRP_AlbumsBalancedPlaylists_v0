/**
 * selectByBlocks - which tracks of one album a recipe takes, by its blocks (F92, REQ-04, REQ-05, REQ-06): the heart of the one engine
 * (TopNAlgorithm.generate calls it for every album, for the «Top N» recipes and for the recipes made of blocks alike).
 *
 * Two fixed behaviours, chosen by `countsTracksWithoutData`:
 *   - true (the three «Top N» recipes, today's behaviour kept): the order of the ranking strategy, every track counts, `slice(skip, skip + take)`;
 *   - false (a recipe made of blocks): a track with no data of the source never counts, a track shorter than `minSeconds` is left out, the
 *     tracks are ordered by the source from the top or from the bottom, a tie broken by the order of the track on the album; then skip and take.
 *
 * @module algorithms/selectByBlocks
 */
import { entryOfEachTrack } from '../models/sameTrack.js'

const isNumber = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))

/** Whether a track has the data of a source (a rating taken from the popularity is not a rating). */
const HAS_DATA = Object.freeze({
    spotify: (track) => isNumber(track.spotifyPopularity),
    bea: (track) => (isNumber(track.rating) && !track.ratingIsPopularity) || isNumber(track.acclaimRank) || isNumber(track.canonicalRank),
    user: (track) => isNumber(track.userRank) && Number(track.userRank) < 999,
    combined: (track) => HAS_DATA.spotify(track) || HAS_DATA.bea(track)
})

/**
 * The strength of each ranked track by the source (higher: nearer the top). The popularity of Spotify is a value, and two tracks may tie;
 * the other sources are the place the strategy gave (no tie).
 */
const strengthOf = (source, track, place) => (source === 'spotify' ? Number(track.spotifyPopularity) : -place)

/** The place of each ranked track on the album (0 is the first track): by the album order, else its position, else where the ranking found it. */
function albumPlaces(ranked, album) {
    const inOrder = album?.tracksOriginalOrder?.length ? album.tracksOriginalOrder : (album?.tracks || [])
    const entries = entryOfEachTrack(ranked, inOrder.map((track, index) => ({ ...track, _albumPlace: index })))
    return ranked.map((track, index) => entries[index]?._albumPlace ?? (isNumber(track.position) ? Number(track.position) - 1 : (track.origIndex ?? index)))
}

/** A recipe made of blocks: only the tracks with data and long enough, ordered by the source, the tie by the album order. */
function orderedByBlocks(ranked, album, { source = 'spotify', direction, minSeconds }) {
    const places = albumPlaces(ranked, album)
    const hasData = HAS_DATA[source] || HAS_DATA.spotify
    const sign = direction === 'bottom' ? -1 : 1
    return ranked
        .map((track, index) => ({ track, strength: strengthOf(source, track, index), place: places[index] }))
        .filter(({ track }) => hasData(track) && !(minSeconds > 0 && Number(track.duration || 0) < minSeconds))
        .sort((a, b) => sign * (b.strength - a.strength) || a.place - b.place)
        .map(({ track }) => track)
}

/**
 * @param {Array<Object>} ranked - the tracks of the album, as the ranking strategy ordered them
 * @param {Object} album
 * @param {{ source?: string, direction: string, skip: number, take: number, minSeconds: number, countsTracksWithoutData: boolean }} blocks
 * @returns {Array<Object>} the tracks taken, in the order of the recipe
 */
export function selectByBlocks(ranked, album, blocks) {
    const ordered = blocks.countsTracksWithoutData ? ranked : orderedByBlocks(ranked, album, blocks)
    return ordered.slice(blocks.skip, blocks.skip + blocks.take)
}
