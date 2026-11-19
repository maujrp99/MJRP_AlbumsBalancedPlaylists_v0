/**
 * The one formatter of a track or playlist duration.
 *
 * Durations are kept in SECONDS everywhere (models/Track.js; the catalog adapter converts Apple's
 * milliseconds when the album is read). Screens used to format on their own, some of them reading
 * the value as milliseconds, which showed "0:00" or "--:--" for every track (UAT-188).
 * Pure: a number in, a text out.
 */

/** What is shown when there is no duration. */
export const NO_DURATION = '--:--'

/**
 * @param {number|string|null|undefined} seconds
 * @returns {string} "m:ss", "h:mm:ss" from one hour on, or NO_DURATION
 */
export function formatDuration(seconds) {
    const total = Math.floor(Number(seconds))
    if (!Number.isFinite(total) || total <= 0) return NO_DURATION

    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const rest = String(total % 60).padStart(2, '0')

    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}`
        : `${minutes}:${rest}`
}
