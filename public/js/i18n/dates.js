/**
 * dates - how a date and a time are written on the screen: by the language chosen in the app, never by the language of the browser
 * (F81; the judge's P2-4 of 2026-11-23: the Portuguese app said «11/23/2026, 6:29:43 PM» in a browser set to English).
 *
 * Portuguese is Brazilian Portuguese. English keeps the English of the browser when the browser speaks one (the habits of the United
 * States or of the United Kingdom); in a browser that speaks another language it is the site's own way, day before month (`en-GB`,
 * as the saved playlists already write their dates).
 *
 * The models keep their own fixed formats (models/inventoryValue.js): nothing under models/ imports the dictionary.
 */
import { getLocale } from './t.js'

const SITE_ENGLISH = 'en-GB'

function browserEnglish() {
    const browser = globalThis.navigator
    const first = browser?.languages?.[0] ?? browser?.language ?? ''
    return /^en\b/i.test(String(first)) ? String(first) : SITE_ENGLISH
}

/** The language tag dates and times are written in now. */
export const dateTag = () => (getLocale() === 'pt' ? 'pt-BR' : browserEnglish())

const asDate = (when) => (when instanceof Date ? when : new Date(when))
const written = (when, write) => {
    const date = asDate(when)
    return Number.isNaN(date.getTime()) ? '' : write(date)
}

/** «23/11/2026» */
export const dateText = (when) => written(when, date => date.toLocaleDateString(dateTag()))
/** «18:29:43» */
export const timeText = (when) => written(when, date => date.toLocaleTimeString(dateTag()))
/** «23/11/2026, 18:29:43» */
export const dateTimeText = (when) => written(when, date => date.toLocaleString(dateTag()))
/** «18:29»: the hour and the minute */
export const clockText = (when) => written(when, date => date.toLocaleTimeString(dateTag(), { hour: '2-digit', minute: '2-digit' }))
