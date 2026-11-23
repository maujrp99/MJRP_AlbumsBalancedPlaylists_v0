/**
 * t - the site's texts by language (F83 wave 0; the contract of the architecture proposal, § 5.2, that F81 fills in).
 *
 * Plain JavaScript, no framework: a hand-made screen calls `t()` as a React screen does (which also listens with `useLocale`
 * of the bridge). A dictionary is one object per language and area (`en/<area>.js`, `pt/<area>.js`); a key is
 * `area.piece.name`, stable (it is the address the CMS will edit); a value is plain text with {placeholders} and never HTML.
 * English is the default and the reserve: a key missing in the language shows the English text, and one missing in both shows
 * the key itself (a test keeps that from reaching `main`). Portuguese is a file of its own, downloaded only by whoever uses it.
 *
 * Which languages are open to the public is `OPEN_LOCALES` (openLocales.js, written by the build): while it holds only `en`,
 * the site speaks English to everybody. The owner sees Portuguese in his own browser with a mark (localStorage
 * `mjrp.lang.preview` = `pt`), to review each wave before it opens.
 *
 * Nothing under shared/, models/, algorithms/ or ranking/ imports this: a rule gives a code or a datum, and the screen says it.
 */
import { OPEN_LOCALES } from './openLocales.js'
import { en } from './en/index.js'

/** The languages of the site: `en` and `pt` (Brazilian Portuguese). The tags for the browser (`lang`, `hreflang`) are `en` and `pt-BR`. */
export const LOCALES = Object.freeze(['en', 'pt'])
export const DEFAULT_LOCALE = 'en'

/** The mark with which the owner reads a language that is still closed to the public. */
export const PREVIEW_KEY = 'mjrp.lang.preview'

const texts = { en: { ...en }, pt: {} }
// What the owner published in the CMS (F82, REQ-10), by language: it wins over the code whatever arrives first.
const published = { en: {}, pt: {} }
const loaded = new Set(['en'])
const listeners = new Set()
const textsListeners = new Set()
let current = DEFAULT_LOCALE
let textsVersion = 0

const tellAll = () => {
    listeners.forEach(listener => listener(current))
    textsListeners.forEach(listener => listener())
}

/** The language the site speaks now. */
export const getLocale = () => current

/**
 * Adds texts to a language: for a dictionary that arrives late (the Portuguese file, the content published by the CMS) and
 * for tests.
 * @param {string} locale
 * @param {Record<string, string>} entries - key -> text
 */
export function registerTexts(locale, entries) {
    texts[locale] = { ...texts[locale], ...entries }
}

/**
 * The layer of published texts of a language (the CMS, F82): REPLACES what was there. The version of the texts goes up and
 * whoever listens to the language draws again, when it is the language spoken and something did change.
 * @param {string} locale
 * @param {Record<string, string>} entries - key -> text, already checked (shared/content/texts.js)
 */
export function registerPublishedTexts(locale, entries) {
    const before = published[locale] ?? {}
    const keys = Object.keys(entries)
    if (keys.length === Object.keys(before).length && keys.every(key => before[key] === entries[key])) return
    published[locale] = { ...entries }
    textsVersion += 1
    if (locale === current) tellAll()
}

/** The published layer of a language now (a copy). */
export const publishedTexts = (locale) => ({ ...published[locale] })

/** Goes up each time the published texts change: with the language, it is what a screen draws from. */
export const getTextsVersion = () => textsVersion

// Fixed order, by language: the published text, the code's dictionary, the code's English.
const lookup = (key) => published[current]?.[key] ?? texts[current]?.[key] ?? texts[DEFAULT_LOCALE][key]

const fill = (text, values) => (values ? text.replace(/\{(\w+)\}/g, (whole, name) => (name in values ? String(values[name]) : whole)) : text)

/**
 * The text of a key in the current language.
 * @param {string} key - `area.piece.name`
 * @param {Record<string, string|number>} [values] - what the {placeholders} become
 * @returns {string}
 */
export function t(key, values) {
    return fill(lookup(key) ?? key, values)
}

/**
 * The stored Markdown of a rich key (F82, REQ-12), by the same layers; who draws it is the kit's safe renderer, never
 * `innerHTML`.
 * @param {string} key
 * @param {Record<string, string|number>} [values]
 * @returns {string}
 */
export const tRich = (key, values) => t(key, values)

/**
 * The text of a key that has a singular and a plural: `key.one` and `key.other`, chosen by the plural rules of the language.
 * @param {string} key
 * @param {number} count
 * @param {Record<string, string|number>} [values]
 */
export function tPlural(key, count, values) {
    const rule = new Intl.PluralRules(current === 'pt' ? 'pt-BR' : 'en').select(count)
    const text = lookup(`${key}.${rule}`) ?? lookup(`${key}.other`)
    return fill(text ?? key, values)
}

const isOpenTo = (locale) => {
    if (OPEN_LOCALES.includes(locale)) return true
    try { return window.localStorage.getItem(PREVIEW_KEY) === locale } catch { return false }
}

async function loadDictionary(locale) {
    const { pt } = await import('./pt/index.js')
    registerTexts(locale, pt)
    loaded.add(locale)
}

/**
 * Changes the language the site speaks and tells whoever listens. A language that does not exist, or that is not open, is
 * refused; a dictionary that does not come leaves the language as it was («did not arrive» is not «does not exist»).
 * @param {string} locale - `en` or `pt`
 * @returns {Promise<boolean>} true when the site speaks that language now
 */
export async function setLocale(locale) {
    if (!LOCALES.includes(locale) || !isOpenTo(locale)) return false
    if (locale === current) return true
    if (!loaded.has(locale)) {
        try { await loadDictionary(locale) } catch { return false }
    }
    current = locale
    tellAll()
    return true
}

/**
 * Be told when the language changes.
 * @param {(locale: string) => void} listener
 * @returns {() => void} stops listening
 */
export function onLocaleChange(listener) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}

/**
 * Be told when what `t()` answers may have changed: the language, or the published texts of the language spoken.
 * @param {() => void} listener
 * @returns {() => void} stops listening
 */
export function onTextsChange(listener) {
    textsListeners.add(listener)
    return () => { textsListeners.delete(listener) }
}

/** For the tests of the leave: how many listen now (a screen that was left must not be listening). */
export const localeListenerCount = () => listeners.size + textsListeners.size
