/**
 * F80 (UAT-240, UAT-241): Portuguese and English with a switch; the default comes from the browser's
 * language, the choice is remembered in localStorage (which may be missing or throw).
 */
import { describe, it, expect } from 'vitest'
import { LANG_KEY, chooseLanguage, readStoredLanguage, storeLanguage, applyLanguage } from '../../public/splash/lang.js'
import { COPY } from '../../public/splash/copy.js'

const storageOf = (entries = {}) => ({
    getItem: (k) => (k in entries ? entries[k] : null),
    setItem: (k, v) => { entries[k] = String(v) }
})
const throwing = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') } }

describe('which language the page opens in', () => {
    it('a remembered choice wins over the browser', () => {
        expect(chooseLanguage({ stored: 'en', languages: ['pt-BR'] })).toBe('en')
        expect(chooseLanguage({ stored: 'pt', languages: ['en-US'] })).toBe('pt')
    })

    it('without a choice, the first of the browser\'s languages the page speaks', () => {
        expect(chooseLanguage({ stored: null, languages: ['pt-BR', 'en'] })).toBe('pt')
        expect(chooseLanguage({ stored: null, languages: ['en-GB', 'pt'] })).toBe('en')
        expect(chooseLanguage({ stored: null, languages: ['es-AR', 'pt-PT'] })).toBe('pt')
    })

    it('a language the page does not speak, or nothing at all, opens in English; a bad stored value is ignored', () => {
        expect(chooseLanguage({ stored: null, languages: ['de-DE'] })).toBe('en')
        expect(chooseLanguage({ stored: null, languages: [] })).toBe('en')
        expect(chooseLanguage({})).toBe('en')
        expect(chooseLanguage({ stored: 'fr', languages: ['pt-BR'] })).toBe('pt')
    })
})

describe('the remembered choice', () => {
    it('is written and read back', () => {
        const s = storageOf()
        expect(storeLanguage(s, 'en')).toBe(true)
        expect(s.getItem(LANG_KEY)).toBe('en')
        expect(readStoredLanguage(s)).toBe('en')
    })

    it('only the two languages are stored', () => {
        const s = storageOf()
        expect(storeLanguage(s, 'fr')).toBe(false)
        expect(readStoredLanguage(storageOf({ [LANG_KEY]: 'fr' }))).toBeNull()
    })

    it('a storage that is missing or throws never breaks the page', () => {
        expect(readStoredLanguage(null)).toBeNull()
        expect(readStoredLanguage(throwing)).toBeNull()
        expect(storeLanguage(null, 'pt')).toBe(false)
        expect(storeLanguage(throwing, 'pt')).toBe(false)
    })
})

describe('swapping the page\'s text', () => {
    const build = () => {
        document.documentElement.removeAttribute('lang')
        document.body.innerHTML = '<h1 data-i18n="h.title"></h1>'
            + '<nav aria-label="" data-i18n-aria="menu.aria"></nav>'
            + '<button title="" data-i18n-title="pause"></button>'
        document.title = ''
    }

    it('fills every marked element, its labels and the document title, and sets the language', () => {
        build()
        applyLanguage(document, 'en')
        expect(document.querySelector('h1').innerHTML).toBe(COPY.en['h.title'])
        expect(document.querySelector('nav').getAttribute('aria-label')).toBe(COPY.en['menu.aria'])
        expect(document.querySelector('button').title).toBe(COPY.en.pause)
        expect(document.title).toBe(COPY.en['meta.title'])
        expect(document.documentElement.lang).toBe('en')
        applyLanguage(document, 'pt')
        expect(document.querySelector('h1').innerHTML).toBe(COPY.pt['h.title'])
        expect(document.documentElement.lang).toBe('pt-BR')
    })

    it('marks the pressed language on the switch', () => {
        document.body.innerHTML = '<button data-lang="pt" aria-pressed="true"></button><button data-lang="en" aria-pressed="false"></button>'
        applyLanguage(document, 'en')
        const [pt, en] = document.querySelectorAll('button')
        expect([pt.getAttribute('aria-pressed'), en.getAttribute('aria-pressed')]).toEqual(['false', 'true'])
    })
})
