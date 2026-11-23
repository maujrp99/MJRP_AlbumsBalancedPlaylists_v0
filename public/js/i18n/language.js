/**
 * language - which language the app speaks, and how it changes (F81, REQ-02 and REQ-03; the owner, 2026-11-23: «o idioma do app é em
 * portugues, está nascendo no brasil, mas fora do brasil a geolocation deve mudar para en»).
 *
 *   1. The person's own choice, kept on this device (localStorage, the key the entry page already uses): it wins on every visit.
 *   2. Without a choice, the country of access: Brazil speaks Portuguese, any other country, or none, English. The country is never
 *      asked of the browser (no permission, no location): it is read from a small file of the site itself, `/country.json`, that
 *      Firebase Hosting answers by the visitor's country (its «i18n rewrites»: the file under `geo/ALL_br/` goes to Brazil, the one at
 *      the root to everybody else; scripts/countryHint.mjs writes both, firebase.json points at the folder). Nothing leaves the site.
 *   3. When that file cannot be read (no network, a server that does not have it, an answer that takes too long): the language of the
 *      browser (the owner, 2026-11-21: «Sem saber o país: o idioma do navegador da pessoa»).
 *
 * The country is never kept as a choice: only what the person picked is. The account does not keep it yet (the rules of the database
 * have no place for it; the owner publishes that rule, spec.md § Decided by the owner).
 */
import { LOCALES, getLocale, onLocaleChange, setLocale } from './t.js'

/** Where the choice is kept: the same key as the entry page (public/splash/lang.js), so the two pages agree. */
export const LANG_KEY = 'albumblender:lang'
/** The file the hosting answers by country. */
export const HINT_PATH = '/country.json'
/** How long the first paint waits for the country before it goes on with the browser's language. */
export const HINT_WAIT_MS = 1500
/** The `lang` of the page for each language. */
export const HTML_LANG = Object.freeze({ en: 'en', pt: 'pt-BR' })

const isLanguage = (value) => LOCALES.includes(value)

/** Brazil → `pt`; anything else → `en`. */
export const languageForCountry = (country) => (typeof country === 'string' && country.toLowerCase() === 'br' ? 'pt' : 'en')

/** The browser's own storage, or null where it is refused (a private window). */
function deviceStorage() {
    try { return window.localStorage || null } catch { return null }
}

/** The language the person chose on this device, or null. */
export function readChoice(storage = deviceStorage()) {
    try {
        const value = storage ? storage.getItem(LANG_KEY) : null
        return isLanguage(value) ? value : null
    } catch {
        return null
    }
}

/** Keeps the choice on this device; false when it could not. */
export function storeChoice(storage, locale) {
    if (!isLanguage(locale)) return false
    try {
        storage.setItem(LANG_KEY, locale)
        return true
    } catch {
        return false
    }
}

/** The first language the browser asks for: Portuguese → `pt`, anything else → `en`. */
export function browserLanguage(browser) {
    const first = browser?.languages?.[0] ?? browser?.language ?? ''
    return String(first).toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

/**
 * The country the hosting saw: `br`, `` (another country, or none), or null when the hint could not be read.
 * @param {{ fetch?: typeof fetch, timeoutMs?: number }} [how]
 * @returns {Promise<string|null>}
 */
export async function readCountryHint({ fetch: ask = globalThis.fetch, timeoutMs = HINT_WAIT_MS } = {}) {
    let timer
    const late = new Promise(resolve => { timer = setTimeout(() => resolve(null), timeoutMs) })
    const read = (async () => {
        try {
            const answer = await ask(HINT_PATH, { cache: 'no-store' })
            if (!answer.ok || !String(answer.headers.get('content-type') || '').includes('json')) return null
            const { country } = await answer.json()
            return typeof country === 'string' ? country.toLowerCase() : null
        } catch {
            return null
        }
    })()
    const country = await Promise.race([read, late])
    clearTimeout(timer)
    return country
}

let stopWatchingPage = () => {}

/**
 * Decides the language when the app starts and makes the page follow it from then on (`<html lang>`).
 * @param {{ storage?: Pick<Storage, 'getItem'|'setItem'>|null, fetch?: typeof fetch, navigator?: { languages?: readonly string[], language?: string }, document?: { documentElement: { lang: string } }, timeoutMs?: number }} [world] - the browser's own, when not given
 * @returns {Promise<string>} the language the app speaks
 */
export async function startLanguage({ storage = deviceStorage(), fetch: ask, navigator: browser = globalThis.navigator, document: page = globalThis.document, timeoutMs } = {}) {
    stopWatchingPage()
    stopWatchingPage = onLocaleChange(locale => { page.documentElement.lang = HTML_LANG[locale] })
    let locale = readChoice(storage)
    if (!locale) {
        const country = await readCountryHint({ fetch: ask, timeoutMs })
        locale = country === null ? browserLanguage(browser) : languageForCountry(country)
    }
    await setLocale(locale) // a dictionary that does not come leaves English
    page.documentElement.lang = HTML_LANG[getLocale()]
    return getLocale()
}

/**
 * The person picks a language: the whole app changes now, with no reload, and the choice is kept for the next visits.
 * @param {string} locale - `en` or `pt`
 * @param {{ storage?: Pick<Storage, 'getItem'|'setItem'>|null }} [world]
 * @returns {Promise<boolean>} true when the app speaks that language now
 */
export async function chooseLanguage(locale, { storage = deviceStorage() } = {}) {
    if (!(await setLocale(locale))) return false
    storeChoice(storage, locale)
    return true
}
