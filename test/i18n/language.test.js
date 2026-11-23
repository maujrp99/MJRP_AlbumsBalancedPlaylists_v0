/**
 * F81 TASK-02 (REQ-02, REQ-03): which language the app speaks. The first visit takes it from the country of access, read from a
 * hint file the hosting answers by country (never the browser's location); the person's own choice, kept on the device under the
 * key the entry page already uses, wins on every later visit.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
    LANG_KEY, HINT_PATH, HTML_LANG, languageForCountry, readChoice, storeChoice, browserLanguage, readCountryHint, startLanguage, chooseLanguage
} from '../../public/js/i18n/language.js'
import { LANG_KEY as ENTRY_PAGE_KEY } from '../../public/splash/lang.js'
import { getLocale, setLocale, t, registerTexts } from '../../public/js/i18n/t.js'
import { OPEN_LOCALES } from '../../public/js/i18n/openLocales.js'
import { countryHintFiles, HINT_FILE, I18N_ROOT } from '../../scripts/countryHint.mjs'

const memory = (start = {}) => {
    const kept = { ...start }
    return { kept, getItem: (key) => (key in kept ? kept[key] : null), setItem: (key, value) => { kept[key] = String(value) } }
}
const refused = { getItem: () => { throw new Error('refused') }, setItem: () => { throw new Error('refused') } }
const answers = (body, { ok = true, type = 'application/json' } = {}) => vi.fn(async () => ({ ok, headers: { get: () => type }, json: async () => JSON.parse(body) }))
const doc = () => ({ documentElement: { lang: 'en', removeAttribute: vi.fn() } })

describe('the language of the app: the country, then the choice (F81)', () => {
    beforeEach(async () => { await setLocale('en') })
    afterEach(async () => { await setLocale('en') })

    it('Portuguese is open to the public, with English', () => {
        expect(OPEN_LOCALES).toEqual(['en', 'pt'])
    })

    it('Brazil speaks Portuguese; any other country, and none, speaks English', () => {
        expect(languageForCountry('br')).toBe('pt')
        expect(languageForCountry('BR')).toBe('pt')
        for (const country of ['us', 'pt', 'ar', '', null, undefined, 42]) expect(languageForCountry(country)).toBe('en')
    })

    it('the choice lives under the key of the entry page, so the two agree', () => {
        expect(LANG_KEY).toBe(ENTRY_PAGE_KEY)
    })

    it('reads and keeps the choice; a storage that refuses, or a value that is no language, is no choice', () => {
        const storage = memory()
        expect(readChoice(storage)).toBeNull()
        expect(storeChoice(storage, 'pt')).toBe(true)
        expect(storage.kept[LANG_KEY]).toBe('pt')
        expect(readChoice(storage)).toBe('pt')
        expect(readChoice(memory({ [LANG_KEY]: 'fr' }))).toBeNull()
        expect(storeChoice(storage, 'fr')).toBe(false)
        expect(readChoice(refused)).toBeNull()
        expect(storeChoice(refused, 'pt')).toBe(false)
        expect(readChoice(null)).toBeNull()
    })

    it('reads the country from the hint file of the site; what is not the hint is «could not read», never a country', async () => {
        const brazil = answers('{"country":"br"}')
        expect(await readCountryHint({ fetch: brazil })).toBe('br')
        expect(brazil.mock.calls[0][0]).toBe(HINT_PATH)
        expect(await readCountryHint({ fetch: answers('{"country":""}') })).toBe('')
        expect(await readCountryHint({ fetch: answers('<!doctype html>', { type: 'text/html' }) })).toBeNull()
        expect(await readCountryHint({ fetch: answers('{}', { ok: false }) })).toBeNull()
        expect(await readCountryHint({ fetch: answers('{"country":7}') })).toBeNull()
        expect(await readCountryHint({ fetch: vi.fn(async () => { throw new Error('offline') }) })).toBeNull()
        expect(await readCountryHint({ fetch: vi.fn(() => new Promise(() => {})), timeoutMs: 10 })).toBeNull()
    })

    it('without the hint, the language of the browser decides', () => {
        expect(browserLanguage({ languages: ['pt-BR', 'en'] })).toBe('pt')
        expect(browserLanguage({ language: 'pt' })).toBe('pt')
        expect(browserLanguage({ languages: ['en-US', 'pt-BR'] })).toBe('en')
        expect(browserLanguage({})).toBe('en')
        expect(browserLanguage(undefined)).toBe('en')
    })

    it('first visit from Brazil: Portuguese, the page says pt-BR, and nothing is kept as a choice', async () => {
        const storage = memory()
        const page = doc()
        expect(await startLanguage({ storage, fetch: answers('{"country":"br"}'), navigator: { languages: ['en-US'] }, document: page })).toBe('pt')
        expect(getLocale()).toBe('pt')
        expect(page.documentElement.lang).toBe('pt-BR')
        expect(storage.kept).toEqual({})
    })

    it('first visit from another country, or from none: English, whatever the browser speaks', async () => {
        const page = doc()
        expect(await startLanguage({ storage: memory(), fetch: answers('{"country":""}'), navigator: { languages: ['pt-BR'] }, document: page })).toBe('en')
        expect(getLocale()).toBe('en')
        expect(page.documentElement.lang).toBe('en')
    })

    it('the hint could not be read: the language of the browser', async () => {
        const offline = vi.fn(async () => { throw new Error('offline') })
        expect(await startLanguage({ storage: memory(), fetch: offline, navigator: { languages: ['pt-BR'] }, document: doc() })).toBe('pt')
        await setLocale('en')
        expect(await startLanguage({ storage: memory(), fetch: offline, navigator: { languages: ['de'] }, document: doc() })).toBe('en')
    })

    it('the choice wins over the country, and the country is not even asked', async () => {
        const brazil = answers('{"country":"br"}')
        expect(await startLanguage({ storage: memory({ [LANG_KEY]: 'en' }), fetch: brazil, navigator: {}, document: doc() })).toBe('en')
        expect(brazil).not.toHaveBeenCalled()
        const abroad = answers('{"country":""}')
        const page = doc()
        expect(await startLanguage({ storage: memory({ [LANG_KEY]: 'pt' }), fetch: abroad, navigator: {}, document: page })).toBe('pt')
        expect(abroad).not.toHaveBeenCalled()
        expect(page.documentElement.lang).toBe('pt-BR')
    })

    it('choosing a language changes the app, the page and what is kept; the page follows every later change too', async () => {
        const storage = memory()
        const page = doc()
        await startLanguage({ storage, fetch: answers('{"country":""}'), navigator: {}, document: page })
        expect(await chooseLanguage('pt', { storage })).toBe(true)
        expect(getLocale()).toBe('pt')
        expect(storage.kept[LANG_KEY]).toBe('pt')
        expect(page.documentElement.lang).toBe(HTML_LANG.pt)
        expect(await chooseLanguage('en', { storage })).toBe(true)
        expect(page.documentElement.lang).toBe('en')
        expect(await chooseLanguage('fr', { storage })).toBe(false)
        expect(storage.kept[LANG_KEY]).toBe('en')
    })

    it('a choice is honoured where the storage refuses to keep it', async () => {
        expect(await chooseLanguage('pt', { storage: refused })).toBe(true)
        expect(getLocale()).toBe('pt')
    })

    it('a key the Portuguese lacks shows the English text, never the key', async () => {
        registerTexts('en', { 'test.f81.onlyEnglish': 'Only in English' })
        await chooseLanguage('pt', { storage: memory() })
        expect(t('test.f81.onlyEnglish')).toBe('Only in English')
    })
})

describe('the hint the hosting answers by country (F81)', () => {
    const root = path.resolve(__dirname, '../..')
    const firebase = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'))

    it('the build writes two files: the default (no country) and the one of Brazil, in the folder the hosting reads by country', () => {
        expect(HINT_PATH).toBe(`/${HINT_FILE}`)
        expect(countryHintFiles()).toEqual({
            [HINT_FILE]: '{"country":""}\n',
            [`${I18N_ROOT}/ALL_br/${HINT_FILE}`]: '{"country":"br"}\n'
        })
    })

    it('firebase.json points the hosting at that folder and keeps the hint out of every cache', () => {
        expect(firebase.hosting.i18n).toEqual({ root: `/${I18N_ROOT}` })
        const header = firebase.hosting.headers.find(one => one.source === HINT_PATH)
        expect(header.headers).toEqual([{ key: 'Cache-Control', value: 'no-store' }])
    })
})

describe('the Painel says the screens as the menu does, in Portuguese (F81)', () => {
    it('the four chips that were left in English', async () => {
        const { pt } = await import('../../public/js/i18n/pt/index.js')
        const { admin } = await import('../../public/js/i18n/pt/admin.js')
        expect(admin['admin.screens.albums']).toBe(pt['shell.phone.tabAlbums'])
        expect(admin['admin.screens.blend']).toBe(pt['shell.phone.tabBlend'])
        expect(admin['admin.screens.inventory']).toBe(pt['shell.phone.tabInventory'])
        expect(admin['admin.screens.start']).toBe(pt['shell.phone.tabStart'])
        expect([admin['admin.screens.albums'], admin['admin.screens.blend'], admin['admin.screens.inventory'], admin['admin.screens.start']]).toEqual(['Álbuns', 'Mistura', 'Acervo', 'Criar'])
    })
})

describe('the first paint of the app does not speak the other language (F81)', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../../public/index.html'), 'utf8')
    const script = /<script data-first-language>([\s\S]*?)<\/script>/.exec(html)?.[1]
    const paint = (choice) => {
        document.documentElement.lang = 'en'
        document.body.innerHTML = '<div id="app">Loading...</div>'
        if (choice) window.localStorage.setItem(LANG_KEY, choice)
        else window.localStorage.removeItem(LANG_KEY)
        new Function(script)()
        return { text: document.getElementById('app').textContent, lang: document.documentElement.lang }
    }
    afterEach(() => { window.localStorage.removeItem(LANG_KEY); document.documentElement.lang = 'en'; document.body.innerHTML = '' })

    it('the page carries the small script, right after the place of the app, and it reads the key of the choice', () => {
        expect(script).toBeTruthy()
        expect(script).toContain(`'${LANG_KEY}'`)
        expect(html.indexOf('<div id="app"')).toBeLessThan(html.indexOf('<script data-first-language>'))
    })

    it('who chose Portuguese waits in Portuguese; who chose English, in English; who has not chosen waits with no words until the country is known', () => {
        expect(paint('pt')).toEqual({ text: 'Carregando...', lang: 'pt-BR' })
        expect(paint('en')).toEqual({ text: 'Loading...', lang: 'en' })
        expect(paint(null)).toEqual({ text: '', lang: 'en' })
        expect(paint('fr')).toEqual({ text: '', lang: 'en' })
    })
})
