/**
 * What the saved playlists screen says about a batch, a series and a playlist, in words (F83 wave 1). Pure: data in, text out;
 * every word is a key of the dictionary (area `savedPlaylists`), every number a placeholder, and the dates follow the language.
 * The names of the old screen's helpers (components/playlists/batchNames.js, the facts of SavedPlaylistsPhone.js and
 * SavedSeriesGroup.js) are kept, with the same results in English.
 */
import { getLocale, t, tPlural } from '../../i18n/t.js'
import { batchTotals, toMillis } from '../../models/savedPlaylists.js'
import { spellOutCodes } from '../../models/batchNaming.js'
import type { Batch, SavedPlaylist } from './types'

const STAMP = /\s*\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?\s*$/
const STAMP_PARTS = /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/
const APP_PREFIX = /^TheAlbumBlender Playlist\b\s*/i
const NO_BREAK_SPACE = ' '

/** The language tag the dates are written in: English as the site writes it (day, month, year), Brazilian Portuguese. */
const dateTag = (): string => (getLocale() === 'pt' ? 'pt-BR' : 'en-GB')

/** 58 min, or 1 h 12 min */
export function minutes(seconds: number): string {
    const total = Math.round((seconds || 0) / 60)
    if (total < 60) return t('savedPlaylists.duration.minutes', { count: total })
    const hours = Math.floor(total / 60)
    const rest = total % 60
    return rest ? t('savedPlaylists.duration.hoursMinutes', { hours, minutes: rest }) : t('savedPlaylists.duration.hours', { hours })
}

/** «20 Nov 2026»: the one date format of the saved playlists on the phone. */
export function shortDate(millis: number): string {
    if (!millis) return ''
    return new Date(millis).toLocaleDateString(dateTag(), { day: 'numeric', month: 'short', year: 'numeric' })
}

/** «20 Nov 2026, 23:21» from the stamp at the end of a name; '' when it has none. */
function stampText(name: string): string {
    const match = STAMP_PARTS.exec(name)
    if (!match) return ''
    const [, year, month, day, hours, mins] = match
    const monthName = new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString(dateTag(), { month: 'short', timeZone: 'UTC' })
    return `${Number(day)} ${monthName} ${year}, ${hours}:${mins}`
}

/**
 * The name of a saved batch as the phone shows it: a name the machine made («TheAlbumBlender Playlist 2026-11-20 23:21», or a
 * title with codes and a stamp) is shown readable and the real name goes to the sheet; a name a person typed is shown as typed.
 * @returns what the row shows, and whether it differs from the saved name
 */
export function readableBatchName(name: string | undefined): { text: string; machine: boolean } {
    const raw = String(name ?? '').trim()
    if (!STAMP.test(raw) && !APP_PREFIX.test(raw)) return { text: raw, machine: false }
    const text = spellOutCodes(raw.replace(STAMP, '').replace(APP_PREFIX, ''))
    if (text) return { text, machine: true }
    const stamp = stampText(raw)
    return { text: stamp ? t('savedPlaylists.batchName.saved', { stamp }) : t('savedPlaylists.batchName.untitled'), machine: true }
}

const count = (key: string, n: number): string => tPlural(key, n, { count: n })

/** «3 batches · 18 playlists»: what a closed series holds, said on the phone. */
export function seriesSummary(batches: Batch[] = []): string {
    const playlists = batches.reduce((sum, batch) => sum + batchTotals(batch).playlists, 0)
    return `${count('savedPlaylists.phone.batches', batches.length)} · ${count('savedPlaylists.phone.playlists', playlists)}`
}

/** «6 playlists · 84 tracks · 5 h 12 min · 20 Nov 2026» */
export function batchFacts(batch: Batch): string {
    const totals = batchTotals(batch)
    return [
        count('savedPlaylists.phone.playlists', totals.playlists),
        count('savedPlaylists.phone.tracks', totals.tracks),
        minutes(totals.durationSeconds),
        shortDate(toMillis(batch.savedAt)).replace(/ /g, NO_BREAK_SPACE) // a date never breaks across two lines
    ].filter(Boolean).join(' · ')
}

/** «14 tracks · 58 min» of one playlist on the phone. */
export function playlistMeta(playlist: SavedPlaylist): string {
    const totals = batchTotals({ playlists: [playlist] })
    return `${count('savedPlaylists.phone.tracks', totals.tracks)} · ${minutes(totals.durationSeconds)}`
}
