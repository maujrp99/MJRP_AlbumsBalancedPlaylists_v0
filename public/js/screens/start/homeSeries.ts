/**
 * homeSeries
 *
 * The rules of the Start screen that explains itself (F79; moved here and given the dictionary in F83 wave 4; it was models/homeSeries.js,
 * and a rule of models/ may not speak): the name suggested from the artists of the series (D1), the count of the series, which button
 * carries the fire (D8, one at a time), the labels of the discography, what the empty dock says and what the equalizer means (D6).
 * No DOM. Every word is a key of the dictionary (area `start`); the English is what it was.
 */
import { t, tPlural } from '../../i18n/t.js'
import { PICKER_FILTERS } from '../../models/albumPicker.js'
import { ScanStatus } from '../../models/scanState.js'
import { decodeEntities } from '../../models/text.js'

/** Where the name of the series came from. */
export const NameState = Object.freeze({
    NONE: 'none',           // no album yet: no name
    SUGGESTED: 'suggested', // written by the screen from the artists; it follows the series
    EDITED: 'edited'        // typed by the person: it stays as typed, even empty
})

export type NameStateValue = (typeof NameState)[keyof typeof NameState]

/** What the rules and the screen read of an album of the catalog. */
export interface SeriesAlbum {
    id: string
    title?: string
    artist?: string
    year?: string | number
    type?: string
    coverUrl?: string | null
    artworkTemplate?: string | null
    [field: string]: unknown
}

export type Filters = Record<string, boolean>

/** The artists of the albums, each once, in the order they came in. */
function artistsOf(albums: SeriesAlbum[] = []): string[] {
    const seen: string[] = []
    albums.forEach(album => {
        const artist = decodeEntities(String(album?.artist || '')).trim()
        if (artist && !seen.includes(artist)) seen.push(artist)
    })
    return seen
}

/**
 * @param albums - the series, in its order
 * @returns «Pink Floyd selection», «Joni Mitchell and Yes», «Joni Mitchell, Yes and more», or ''
 */
export function suggestName(albums: SeriesAlbum[]): string {
    const [first, second, ...rest] = artistsOf(albums)
    if (!first) return ''
    if (!second) return t('start.name.selection', { artist: first })
    return rest.length ? t('start.name.andMore', { first, second }) : t('start.name.two', { first, second })
}

/**
 * The name after the series changed: a suggestion follows the series, a name the person typed stays.
 */
export function nameAfterChange(current: { name: string; state: NameStateValue }, albums: SeriesAlbum[]): { name: string; state: NameStateValue } {
    if (current.state === NameState.EDITED) return current
    const name = suggestName(albums)
    return { name, state: name ? NameState.SUGGESTED : NameState.NONE }
}

/** «4 albums from 1 artist · the order counts» */
export function seriesCountLine(albums: SeriesAlbum[]): string {
    const artists = Math.max(1, artistsOf(albums).length)
    return t('start.dock.count', { albums: tPlural('start.dock.albums', albums.length, { count: albums.length }), artists: tPlural('start.dock.artists', artists, { count: artists }) })
}

/**
 * The one button filled with the fire (HI-05): the next thing to do.
 */
export function flameOf({ chosen, results, created }: { chosen: number; results: boolean; created: boolean }): 'search' | 'create' | 'blend' | 'none' {
    if (created) return 'blend'
    if (chosen > 0) return 'create'
    return results ? 'none' : 'search'
}

/** The words for the albums of the filters that are on: the type's own when one is on, «album(s)» otherwise. */
function nounOf(filters: Filters, n: number): string {
    const on = PICKER_FILTERS.filter(filter => filters?.[filter.key])
    const key = on.length === 1 ? on[0].key : 'any'
    return tPlural(`start.noun.${key}`, n)
}

/**
 * The button that puts what the filters show in the series (D3).
 * @param visible - the albums on screen
 * @param chosenIds - the ids already in the series
 * @returns '' when every album on screen is already in the series
 */
export function addAllLabel(visible: SeriesAlbum[], chosenIds: string[], filters: Filters): string {
    const left = visible.filter(album => !chosenIds.includes(album.id)).length
    if (left === 0) return ''
    if (left < visible.length) return t('start.addAll.rest', { count: left })
    return left === 1 ? t('start.addAll.one', { noun: nounOf(filters, 1) }) : t('start.addAll.all', { count: left, noun: nounOf(filters, left) })
}

/** The line under the artist: «17 studio albums · newest first». */
export function typesLine(filters: Filters, n: number, classifying: boolean): string {
    return t(classifying ? 'start.types.classifying' : 'start.types.line', { count: n, noun: nounOf(filters, n) })
}

/** What the empty dock says: the next gesture, never covers that are not on screen. */
export function dockEmptyNote({ phone, covers }: { phone: boolean; covers: boolean }): { title: string; note: string } {
    const where = phone ? 'phone' : 'computer'
    return { title: t(`start.dock.empty.${where}.title`), note: t(`start.dock.empty.${where}.${covers ? 'covers' : 'noCovers'}`) }
}

/** The equalizer under the field: moving while the catalog is asked, flat when it did not answer. */
export function equalizerState(scanStatus: string): 'live' | 'flat' | 'still' {
    if (scanStatus === ScanStatus.SCANNING) return 'live'
    return scanStatus === ScanStatus.FAILED ? 'flat' : 'still'
}

/**
 * The big title and the sentence of the series, only before anything is found. A pasted list keeps
 * them on the computer, until its report; on the phone the list takes their place.
 */
export function stageIsBig({ scan, paste, report, phone }: { scan: string; paste: boolean; report: boolean; phone: boolean }): boolean {
    if (paste) return !report && !phone
    return scan === ScanStatus.IDLE || scan === ScanStatus.EMPTY
}

/**
 * The series bar (UAT-281; the computer too, F79 2026-11-22): only once the first cover is chosen, or when the series is saved (the bar then says
 * so and carries the way on). Before that the screen has the menu.
 */
export function barShows({ chosen = 0, created = false }: { chosen?: number; created?: boolean } = {}): boolean {
    return chosen > 0 || Boolean(created)
}

/** The «You're not signed in» notice (UAT-281): only when there is a series to lose. */
export function guestNoticeShows({ guest = false, chosen = 0 }: { guest?: boolean; chosen?: number } = {}): boolean {
    return Boolean(guest) && chosen > 0
}

/**
 * The one link under the field (UAT-281; the computer too): `'paste'` («or paste a list»), `'artist'` («Search an artist instead», in the paste
 * state) or `null` (the «not found» message already has «Paste a list»).
 */
export function hintLink({ paste = false, notFound = false }: { paste?: boolean; notFound?: boolean } = {}): 'paste' | 'artist' | null {
    if (paste) return 'artist'
    return notFound ? null : 'paste'
}
