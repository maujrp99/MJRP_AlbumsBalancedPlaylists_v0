/**
 * What the Start screen says that is not a rule of homeSeries.ts or homePaste.ts: small pieces of words, every one a key of the
 * dictionary (area `start`). The names of albums and artists come from the catalog and are passed as {placeholders}.
 */
import { t } from '../../i18n/t.js'
import { CATALOG_DEADLINE_SECONDS, ScanFailure } from '../../models/scanState.js'
import { badgeCodesOf } from '../../models/albumPicker.js'
import type { Scan } from './StartController'
import type { SeriesAlbum } from './homeSeries'

/** «Click» on the computer, «Tap» on the phone. */
export const gestureWord = (phone: boolean): string => t(phone ? 'start.gesture.tap' : 'start.gesture.click')

/** The badges of an album cover, in words: the edition, then the type. */
export const badgeWords = (album: SeriesAlbum): string[] => badgeCodesOf(album).map((code: string) => t(`start.badge.${code.toLowerCase()}`))

/** The year of an album as the card says it. */
export const yearOf = (album: SeriesAlbum): string => (album.year ? String(album.year) : t('start.card.yearUnknown'))

/** The title of the message when the search did not finish: the deadline, or any other failure. */
export const failureTitle = (scan: Scan): string =>
    scan.failure === ScanFailure.TIMEOUT ? t('start.failed.timeout', { seconds: CATALOG_DEADLINE_SECONDS }) : t('start.failed.error')

/** The cover address a card or a row asks for, at a size. */
export function coverOf(album: SeriesAlbum, size: string): string | null {
    const template = album.artworkTemplate || album.coverUrl
    return template ? template.replace('{w}', size).replace('{h}', size) : null
}
