/**
 * batchNames - the name of a saved batch as the phone shows it (F76 polish, recheck N5).
 *
 * A batch saved without a typed name is named by the machine: «TheAlbumBlender Playlist
 * 2026-11-20 23:21» (BlendingController), or a playlist title with codes and a stamp, «1. Bob
 * Dylan… SPFY Top 3 Bal.Intv.2026-11-20 23:21». The phone shows a readable form - the stamp goes
 * (the row says the date), the codes are spelt out - and keeps the real name for the «⋯» sheet,
 * where it can be read whole. A name typed by a person is shown as typed.
 *
 * Pure: strings in, strings out.
 */

const STAMP = /\s*\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?\s*$/
const APP_PREFIX = /^TheAlbumBlender Playlist\b\s*/i
const CODES = [
    [/\bSPFY\b/g, 'Spotify'],
    [/\bBEA\b/g, 'BestEverAlbums'],
    [/\bBal\.\s*Intv\.?/gi, 'balanced'],
    [/\bIntv\.?/gi, 'interleaved']
]

/** «20 Nov 2026, 23:21» from the stamp at the end of a name; '' when it has none. */
function stampText(name) {
    const match = String(name).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
    if (!match) return ''
    const [, year, month, day, hours, minutes] = match
    const monthName = new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
    return `${Number(day)} ${monthName} ${year}, ${hours}:${minutes}`
}

/**
 * @param {string} name - the batch name as saved
 * @returns {{ text: string, machine: boolean }} what the row shows, and whether it differs from the saved name
 */
export function readableBatchName(name) {
    const raw = String(name ?? '').trim()
    const stamped = STAMP.test(raw)
    const prefixed = APP_PREFIX.test(raw)
    if (!stamped && !prefixed) return { text: raw, machine: false }

    let text = raw.replace(STAMP, '').replace(APP_PREFIX, '')
    CODES.forEach(([code, word]) => { text = text.replace(code, word) })
    text = text.replace(/\s{2,}/g, ' ').trim()
    if (!text) text = stampText(raw) ? `Saved ${stampText(raw)}` : 'Untitled batch'
    return { text, machine: true }
}

/** «20 Nov 2026»: the one date format of the saved playlists on the phone. */
export function shortDate(millis) {
    if (!millis) return ''
    return new Date(millis).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
