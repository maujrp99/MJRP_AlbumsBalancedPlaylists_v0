/**
 * contentWiring - where the reader of the published content is put together when the app starts (F82, REQ-10; like the
 * other *Wiring.js files, the one place that knows the real pieces): the site's repository, the browser's storage, the
 * code's English and the published layer of `t()`. app.js calls `startPublishedContent()` once and never waits for it.
 */
import { publishedContent } from '../../repositories/publishedContent.js'
import { en } from '../../i18n/en/index.js'
import { getLocale, onLocaleChange, registerPublishedTexts } from '../../i18n/t.js'
import { kindOf } from '../../i18n/textKinds.js'
import { createPublishedContentReader } from './publishedContentReader.js'

// The browser's storage, reached only when used: where it is refused (a private window), the reader goes on without a copy.
const storage = {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key)
}

const reader = createPublishedContentReader({
    repository: publishedContent, storage, english: en, getLocale, onLocaleChange, applyTexts: registerPublishedTexts, kindOf
})

/** Applies the copy and asks the database, in the background. @returns {{ done: Promise<void> }} */
export const startPublishedContent = () => reader.start()

/**
 * Where the texts of a language come from now: «published», «copy» or «code», with the reason and the keys refused.
 * @param {string} [locale] - the language spoken, when not given
 */
export const getContentState = (locale) => reader.state(locale)

/** Be told when that state changes. @returns {() => void} stops listening */
export const onContentState = (listener) => reader.onState(listener)

/** The switches read from the CMS, or what the copy turned off (F93 decides what each one does). */
export const publishedSwitches = () => reader.switches()
