/**
 * publishedContentReader - the site reads what the owner published in the CMS, at start and WITHOUT waiting
 * (F82, REQ-10; ADR-0024; the flow of the architecture proposal, § 5).
 *
 * `start()` returns at once: it applies the copy kept in the browser (synchronous) and asks the database in the
 * background. The first screen draws with the copy or with the code; what arrives within 3 seconds is checked key by key
 * (one bad key goes back to the code alone, and is counted), applied and kept as the new copy.
 *   - the copy is good for 30 days; older, it is thrown away and the code shows
 *   - «not found» ERASES the copy and the layer: going back (deleting the document) reaches who had already visited
 *   - no network, a late answer or a document out of shape: the copy stays, and the state says why; a late answer is
 *     kept for the next opening, never drawn in the middle of this one
 *   - who speaks a language asks for the document of that language only
 *   - from the copy a switch can only be OFF; turning one on waits for a new read (F93)
 * Every piece comes from outside (the repository, the storage, the clock, the layer of `t()`), so this file knows no
 * Firebase and no page: contentWiring.js puts the real ones together.
 */
import { validateTexts, readTextsDocument } from '@shared/content/texts.js'
import { validateSwitches } from '@shared/content/switches.js'

export const COPY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
export const READ_DEADLINE_MS = 3000
export const SITE_COPY_KEY = 'mjrp.cms.site'
export const textsCopyKey = (locale) => `mjrp.cms.texts.${locale}`

const MAX_TEXTS = 6000 // the count the rules accept (firestore.rules, validTexts)
const isMap = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * @param {Object} pieces
 * @param {{ readTexts: (locale: string) => Promise<Object>, readSite: () => Promise<Object> }} pieces.repository
 * @param {{ getItem: Function, setItem: Function, removeItem: Function }} pieces.storage - may throw: it is never trusted
 * @param {Record<string, string>} pieces.english - the code's English dictionary, the reserve every text is checked against
 * @param {() => string} pieces.getLocale
 * @param {(listener: (locale: string) => void) => Function} pieces.onLocaleChange
 * @param {(locale: string, values: Record<string, string>) => void} pieces.applyTexts - the published layer of `t()`
 * @param {(key: string) => string} [pieces.kindOf]
 * @param {Function} [pieces.parseRich]
 * @param {() => number} [pieces.now]
 */
export function createPublishedContentReader({ repository, storage, english, getLocale, onLocaleChange, applyTexts, kindOf, parseRich, now = Date.now }) {
    const states = {}
    const asked = new Map()
    const listeners = new Set()
    let switches = { values: {}, source: 'none' }
    let started = null

    const keep = (key, value) => { try { storage.setItem(key, JSON.stringify(value)) } catch { /* no storage: nothing is kept */ } }
    const forget = (key) => { try { storage.removeItem(key) } catch { /* nothing to erase */ } }
    /** The copy under a key when it is one this reader wrote and is not older than 30 days; else it is erased. */
    const copyOf = (key, field) => {
        let copy = null
        try { copy = JSON.parse(storage.getItem(key)) } catch { return null }
        if (copy === null) return null
        const age = isMap(copy) && Number.isFinite(copy.at) ? now() - copy.at : -1
        if (age < 0 || age > COPY_MAX_AGE_MS || !isMap(copy[field])) { forget(key); return null }
        return copy
    }

    const check = (texts) => validateTexts(texts, english, { kindOf, parseRich })
    const setState = (locale, state) => {
        states[locale] = state
        listeners.forEach(listener => listener({ ...state, locale }))
    }
    const stateOf = (locale) => states[locale] ?? { source: 'code', reason: 'not_read', rev: null, rejected: [] }

    /** An answer within the deadline, or what happened instead; a late answer still goes to `whenLate`. */
    const withDeadline = (ask, whenLate) => new Promise(resolve => {
        let promise
        try { promise = Promise.resolve(ask()) } catch (error) { promise = Promise.reject(error) }
        let open = true
        const settle = (outcome) => { if (open) { open = false; clearTimeout(timer); resolve(outcome) } }
        const timer = setTimeout(() => {
            settle({ reason: 'timeout' })
            promise.then(whenLate).catch(() => { })
        }, READ_DEADLINE_MS)
        promise.then(answer => settle({ answer }), () => settle({ reason: 'failed' }))
    })

    /** What a texts answer holds: null when not found, false when out of shape, else the checked texts. */
    const readAnswer = (answer) => {
        if (!answer?.exists) return null
        const document = readTextsDocument(answer.data)
        if (!document.ok || Object.keys(document.texts).length > MAX_TEXTS) return false
        return { rev: document.rev, ...check(document.texts) }
    }
    const keepTexts = (locale, read) => {
        if (read === null) forget(textsCopyKey(locale))
        else if (read) keep(textsCopyKey(locale), { at: now(), rev: read.rev, texts: read.values })
    }

    function readTexts(locale) {
        if (asked.has(locale)) return asked.get(locale)
        const copy = copyOf(textsCopyKey(locale), 'texts')
        if (copy) {
            const { values, rejected } = check(copy.texts)
            applyTexts(locale, values)
            setState(locale, { source: 'copy', reason: 'copy', rev: Number.isInteger(copy.rev) ? copy.rev : null, rejected })
        }
        const done = withDeadline(() => repository.readTexts(locale), answer => keepTexts(locale, readAnswer(answer))).then(({ answer, reason }) => {
            const read = reason ? undefined : readAnswer(answer)
            if (read === undefined || read === false) return setState(locale, { ...stateOf(locale), reason: reason ?? 'bad_document' })
            keepTexts(locale, read)
            applyTexts(locale, read ? read.values : {})
            setState(locale, read
                ? { source: 'published', reason: 'read', rev: read.rev, rejected: read.rejected }
                : { source: 'code', reason: 'not_found', rev: null, rejected: [] })
        }).catch(() => { }) // a listener or the layer that throws never becomes an error of the page
        asked.set(locale, done)
        return done
    }

    /** The switches of a site answer: null when not found, false when out of shape. */
    const siteAnswer = (answer) => {
        if (!answer?.exists) return null
        return isMap(answer.data) && isMap(answer.data.switches) ? validateSwitches(answer.data.switches).values : false
    }
    const keepSite = (values) => {
        if (values === null) forget(SITE_COPY_KEY)
        else if (values) keep(SITE_COPY_KEY, { at: now(), switches: values })
    }

    function readSite() {
        const copy = copyOf(SITE_COPY_KEY, 'switches')
        if (copy) {
            const off = Object.entries(validateSwitches(copy.switches).values).filter(([, value]) => value === false)
            switches = { values: Object.fromEntries(off), source: 'copy' }
        }
        return withDeadline(() => repository.readSite(), answer => keepSite(siteAnswer(answer))).then(({ answer, reason }) => {
            const values = reason ? false : siteAnswer(answer)
            if (values === false) return
            keepSite(values)
            switches = values ? { values, source: 'published' } : { values: {}, source: 'none' }
        }).catch(() => { })
    }

    return {
        /**
         * Applies the copy and asks the database; never awaited by who starts the app.
         * @returns {{ done: Promise<void> }} `done` settles when the first reads ended, one way or another (for the tests)
         */
        start() {
            if (!started) {
                onLocaleChange(locale => { readTexts(locale) })
                started = { done: Promise.all([readTexts(getLocale()), readSite()]).then(() => { }) }
            }
            return started
        },
        /**
         * Where the texts of a language come from now.
         * @param {string} [locale]
         * @returns {{ source: 'published'|'copy'|'code', reason: string, rev: number|null, rejected: Array<{ key: string, reason: string }> }}
         */
        state: (locale = getLocale()) => ({ ...stateOf(locale) }),
        /** Be told when a state changes. @returns {() => void} stops listening */
        onState(listener) {
            listeners.add(listener)
            return () => { listeners.delete(listener) }
        },
        /** The switches read (on and off), or what the copy turned off. */
        switches: () => ({ values: { ...switches.values }, source: switches.source })
    }
}
