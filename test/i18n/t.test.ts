/**
 * F83 TASK-10 (REQ-08; the contract of proposal § 5.2, which F81 fills in): the dictionary of the site's texts. Plain
 * JavaScript, one dictionary per language split by area, the key `area.piece.name`, values that are text with {placeholders}
 * and never HTML. English is the default and the fallback; Portuguese is a file of its own, closed to the public by
 * OPEN_LOCALES until F81 opens it, and visible to the owner through a mark in his own browser.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { t, tPlural, getLocale, setLocale, onLocaleChange, localeListenerCount, LOCALES, DEFAULT_LOCALE, PREVIEW_KEY, registerTexts } from '../../public/js/i18n/t.js'
import { OPEN_LOCALES } from '../../public/js/i18n/openLocales.js'

describe('t: the texts by language', () => {
    beforeEach(() => { window.localStorage.removeItem(PREVIEW_KEY) })
    afterEach(async () => { window.localStorage.removeItem(PREVIEW_KEY); await setLocale('en') })

    it('the languages are en and pt, English is the default and the reserve, and only English is open', () => {
        expect(LOCALES).toEqual(['en', 'pt'])
        expect(DEFAULT_LOCALE).toBe('en')
        expect(getLocale()).toBe('en')
        expect(OPEN_LOCALES).toEqual(['en'])
    })

    it('gives the text of a key, fills the {placeholders} and leaves a missing one as it was', () => {
        registerTexts('en', { 'test.hello': 'Hello {name}, you have {count} albums', 'test.plain': 'Plain' })
        expect(t('test.plain')).toBe('Plain')
        expect(t('test.hello', { name: 'Ana', count: 3 })).toBe('Hello Ana, you have 3 albums')
        expect(t('test.hello', { name: 'Ana' })).toBe('Hello Ana, you have {count} albums')
    })

    it('a key missing in the language shows the English; one missing in both shows the key itself', async () => {
        registerTexts('en', { 'test.onlyEnglish': 'Only in English' })
        registerTexts('pt', { 'test.onlyPortuguese': 'Só em português' })
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        expect(await setLocale('pt')).toBe(true)
        expect(t('test.onlyEnglish')).toBe('Only in English')
        expect(t('test.onlyPortuguese')).toBe('Só em português')
        expect(t('test.nowhere.at.all')).toBe('test.nowhere.at.all')
    })

    it('tPlural picks .one or .other by the rules of the language', async () => {
        registerTexts('en', { 'test.album.one': '{count} album', 'test.album.other': '{count} albums' })
        registerTexts('pt', { 'test.album.one': '{count} álbum', 'test.album.other': '{count} álbuns' })
        expect(tPlural('test.album', 1, { count: 1 })).toBe('1 album')
        expect(tPlural('test.album', 2, { count: 2 })).toBe('2 albums')
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        await setLocale('pt')
        expect(tPlural('test.album', 0, { count: 0 })).toBe('0 álbum') // in Portuguese zero takes the singular
        expect(tPlural('test.album', 5, { count: 5 })).toBe('5 álbuns')
    })
})

describe('setLocale: which language the site speaks', () => {
    afterEach(async () => { window.localStorage.removeItem(PREVIEW_KEY); await setLocale('en') })

    it('Portuguese stays closed while OPEN_LOCALES is only English: the request is refused and nobody is told', async () => {
        const told: string[] = []
        const stop = onLocaleChange((locale: string) => told.push(locale))
        expect(await setLocale('pt')).toBe(false)
        expect(getLocale()).toBe('en')
        expect(told).toEqual([])
        stop()
    })

    it('a language that does not exist is refused', async () => {
        expect(await setLocale('fr')).toBe(false)
        expect(getLocale()).toBe('en')
    })

    it('the owner opens Portuguese for himself with a mark in his own browser; whoever listens is told, once', async () => {
        const told: string[] = []
        const stop = onLocaleChange((locale: string) => told.push(locale))
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        expect(await setLocale('pt')).toBe(true)
        expect(getLocale()).toBe('pt')
        expect(told).toEqual(['pt'])
        expect(await setLocale('pt')).toBe(true) // already there: nothing to tell
        expect(told).toEqual(['pt'])
        stop()
    })

    it('the listeners can be counted and let go', () => {
        const base = localeListenerCount()
        const stop = onLocaleChange(() => {})
        expect(localeListenerCount()).toBe(base + 1)
        stop()
        expect(localeListenerCount()).toBe(base)
    })
})
