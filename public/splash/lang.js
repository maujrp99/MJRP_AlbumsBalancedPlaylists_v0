/**
 * The language of the entry page (F80, UAT-240, UAT-241): Portuguese or English. The page is written
 * in Portuguese and opens in Portuguese for everyone, whatever the browser speaks; a visitor who
 * tapped the switch sees what they chose, remembered in localStorage.
 * The texts come from copy.js. Pure apart from the document and the storage handed in.
 */
import { LANGS, t, stepLabelHtml } from './copy.js'

export const LANG_KEY = 'albumblender:lang'

/** The lang attribute of each language. */
const HTML_LANG = Object.freeze({ pt: 'pt-BR', en: 'en' })

/** What each marker attribute fills: the attribute of the same element. */
const ATTRS = Object.freeze({ 'data-i18n-aria': 'aria-label', 'data-i18n-title': 'title', 'data-i18n-content': 'content' })

/** The page's language for a visitor: the remembered choice, else Portuguese (the owner's decision, 2026-11-21: English only by the visitor's own tap on «EN»). */
export function chooseLanguage({ stored } = {}) {
    return LANGS.includes(stored) ? stored : 'pt'
}

/** The remembered choice, or null; a storage that is missing or throws answers null. */
export function readStoredLanguage(storage) {
    try {
        const value = storage && storage.getItem(LANG_KEY)
        return LANGS.includes(value) ? value : null
    } catch {
        return null
    }
}

/** Remembers the choice; false when it could not (not a language the page speaks, or no storage). */
export function storeLanguage(storage, lang) {
    if (!LANGS.includes(lang)) return false
    try {
        storage.setItem(LANG_KEY, lang)
        return true
    } catch {
        return false
    }
}

/** The page's own storage, or null when the browser refuses it. */
export function pageStorage(win) {
    try { return win.localStorage || null } catch { return null }
}

/** Writes every marked text and label of the document in the language, sets the page's lang and the switch. */
export function applyLanguage(doc, lang) {
    doc.documentElement.lang = HTML_LANG[lang] || HTML_LANG.pt
    doc.title = t('meta.title', lang)
    doc.querySelectorAll('[data-i18n]').forEach((el) => {
        const text = t(el.getAttribute('data-i18n'), lang)
        el.innerHTML = el.hasAttribute('data-num') ? stepLabelHtml(text) : text // a step's label has its number set apart (F96), as the build writes it
    })
    for (const [marker, attr] of Object.entries(ATTRS)) {
        doc.querySelectorAll(`[${marker}]`).forEach((el) => el.setAttribute(attr, t(el.getAttribute(marker), lang)))
    }
    doc.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)))
}
