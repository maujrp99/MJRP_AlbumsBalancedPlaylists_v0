/**
 * What the playlists screen says of a playlist, in words (F83 wave 2): pure, data in and text out; every word is a key of the
 * dictionary (area `playlists`). The names of the old helpers (components/playlists/PhonePlaylists.js) are kept, with the same
 * results in English.
 */
import { t, tPlural } from '../../i18n/t.js'
import { minutes } from '../saved-playlists/listText'
import type { Playlist } from './types'

/** The name a playlist is shown by. */
export const playlistNameOf = (playlist: Playlist | undefined, index: number): string => playlist?.title || playlist?.name || `Playlist ${index + 1}`

const secondsOf = (tracks: Playlist['tracks'] = []): number => tracks.reduce((sum, track) => sum + (track?.duration || 0), 0)

/** «14 tracks · 58 min» */
export function playlistSummary(playlist: Playlist | undefined): string {
    const tracks = playlist?.tracks || []
    return t('playlists.summary.line', { tracks: tPlural('playlists.summary.tracks', tracks.length, { count: tracks.length }), duration: minutes(secondsOf(tracks)) })
}

/** The open playlist on the phone: the one asked for, kept inside the set. */
export const activeIndexOf = (count: number, asked: number): number => Math.min(Math.max(Number(asked) || 0, 0), Math.max(count - 1, 0))

/** The recipe the playlists on screen were generated with: each generated playlist carries it (and it is saved with the batch). */
export function generatedWithOf(playlists: Playlist[]): Playlist['_meta'] | null {
    const meta = playlists.find(playlist => playlist?._meta?.algorithmId)?._meta
    return meta ? { ...meta } : null
}
