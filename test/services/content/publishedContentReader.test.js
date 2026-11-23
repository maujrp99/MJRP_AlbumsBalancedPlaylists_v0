/**
 * F82 TASK-12 (REQ-10): the reader of the published content, at start and WITHOUT waiting. The first screen draws with the
 * copy kept in the browser or with the code; the published text enters when it arrives (3 s at most). The copy is good for
 * 30 days, can only turn a switch OFF, and is erased when the document is «not found». One bad key is refused alone.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPublishedContentReader, COPY_MAX_AGE_MS, READ_DEADLINE_MS, textsCopyKey, SITE_COPY_KEY } from '../../../public/js/services/content/publishedContentReader.js'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 10, 23)
const ENGLISH = { 'a.title': 'Albums', 'a.count': '{count} albums', 'a.hello': 'Hello there' }

function memoryStorage(initial = {}) {
    const items = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]))
    return {
        items,
        getItem: (key) => (items.has(key) ? items.get(key) : null),
        setItem: (key, value) => { items.set(key, String(value)) },
        removeItem: (key) => { items.delete(key) },
        json: (key) => (items.has(key) ? JSON.parse(items.get(key)) : null)
    }
}

/** A repository whose answers the test gives when it wants (or never). */
function heldRepository() {
    const asked = []
    const hold = () => { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej }); return { promise, resolve, reject } }
    const texts = { en: hold(), pt: hold() }
    const site = hold()
    return {
        asked, texts, site,
        readTexts: (locale) => { asked.push(`texts_${locale}`); return texts[locale].promise },
        readSite: () => { asked.push('site'); return site.promise }
    }
}

function setup({ storage = memoryStorage(), locale = 'en', repository = heldRepository() } = {}) {
    const layers = { en: {}, pt: {} }
    const localeListeners = new Set()
    let current = locale
    const reader = createPublishedContentReader({
        repository,
        storage,
        english: ENGLISH,
        now: () => NOW,
        getLocale: () => current,
        onLocaleChange: (listener) => { localeListeners.add(listener); return () => localeListeners.delete(listener) },
        applyTexts: (language, values) => { layers[language] = values }
    })
    const speak = (next) => { current = next; localeListeners.forEach(listener => listener(next)) }
    return { reader, repository, storage, layers, speak }
}

const textsDoc = (texts, rev = 3) => ({ exists: true, data: { _schemaVersion: 1, rev, texts } })

describe('the reader of the published content (REQ-10)', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('start() does not wait: with the read held, the copy is already applied when it returns', () => {
        const storage = memoryStorage({ [textsCopyKey('en')]: { at: NOW - 29 * DAY, rev: 2, texts: { 'a.title': 'Records' } } })
        const { reader, layers, repository } = setup({ storage })

        const started = reader.start()

        expect(layers.en).toEqual({ 'a.title': 'Records' })
        expect(reader.state()).toEqual({ source: 'copy', reason: 'copy', rev: 2, rejected: [] })
        expect(started.done).toBeInstanceOf(Promise)
        expect(repository.asked.sort()).toEqual(['site', 'texts_en'])
    })

    it('with no copy and the read held, the code is what shows', () => {
        const { reader, layers } = setup()
        reader.start()

        expect(layers.en).toEqual({})
        expect(reader.state()).toEqual({ source: 'code', reason: 'not_read', rev: null, rejected: [] })
    })

    it('a copy of 31 days is thrown away: the code shows', () => {
        const storage = memoryStorage({ [textsCopyKey('en')]: { at: NOW - 31 * DAY, rev: 2, texts: { 'a.title': 'Records' } } })
        const { reader, layers } = setup({ storage })
        reader.start()

        expect(COPY_MAX_AGE_MS).toBe(30 * DAY)
        expect(layers.en).toEqual({})
        expect(reader.state().source).toBe('code')
        expect(storage.items.has(textsCopyKey('en'))).toBe(false)
    })

    it('a copy from the future, or that is not what the reader wrote, is thrown away', () => {
        for (const copy of [{ at: NOW + DAY, rev: 1, texts: { 'a.title': 'X' } }, { at: 'yesterday', texts: {} }, 'nonsense', { at: NOW, texts: ['x'] }]) {
            const storage = memoryStorage({ [textsCopyKey('en')]: copy })
            const { reader, layers } = setup({ storage })
            reader.start()
            expect(layers.en).toEqual({})
            expect(reader.state().source).toBe('code')
        }
    })

    it('the copy is checked again by this build: one bad key is refused alone', () => {
        const storage = memoryStorage({ [textsCopyKey('en')]: { at: NOW - DAY, rev: 2, texts: { 'a.title': 'Records', 'a.count': 'no placeholder', 'a.old': 'gone' } } })
        const { reader, layers } = setup({ storage })
        reader.start()

        expect(layers.en).toEqual({ 'a.title': 'Records' })
        expect(reader.state().rejected).toEqual([{ key: 'a.count', reason: 'placeholders' }, { key: 'a.old', reason: 'unknown_key' }])
    })

    it('what arrives is checked key by key, applied and kept as the copy', async () => {
        const { reader, layers, repository, storage } = setup()
        const states = []
        reader.onState(state => states.push(state.source + ':' + state.reason))
        const { done } = reader.start()

        repository.texts.en.resolve(textsDoc({ 'a.title': 'Records', 'a.hello': '<b>Hello</b>', 'a.count': '{count} records' }, 7))
        repository.site.resolve({ exists: false })
        await done

        expect(layers.en).toEqual({ 'a.title': 'Records', 'a.count': '{count} records' })
        expect(reader.state()).toEqual({ source: 'published', reason: 'read', rev: 7, rejected: [{ key: 'a.hello', reason: 'markup' }] })
        expect(storage.json(textsCopyKey('en'))).toEqual({ at: NOW, rev: 7, texts: { 'a.title': 'Records', 'a.count': '{count} records' } })
        expect(states).toContain('published:read')
    })

    it('«not found» erases the copy and the layer: going back reaches who had already visited', async () => {
        const storage = memoryStorage({ [textsCopyKey('en')]: { at: NOW - DAY, rev: 2, texts: { 'a.title': 'Records' } } })
        const { reader, layers, repository } = setup({ storage })
        const { done } = reader.start()
        expect(layers.en).toEqual({ 'a.title': 'Records' })

        repository.texts.en.resolve({ exists: false })
        repository.site.resolve({ exists: false })
        await done

        expect(layers.en).toEqual({})
        expect(storage.items.has(textsCopyKey('en'))).toBe(false)
        expect(reader.state()).toEqual({ source: 'code', reason: 'not_found', rev: null, rejected: [] })
    })

    it('the deadline is 3 seconds: after it the copy stays, and a late answer is kept for the next opening, not drawn now', async () => {
        const storage = memoryStorage({ [textsCopyKey('en')]: { at: NOW - DAY, rev: 2, texts: { 'a.title': 'Records' } } })
        const { reader, layers, repository } = setup({ storage })
        const { done } = reader.start()

        await vi.advanceTimersByTimeAsync(READ_DEADLINE_MS - 1)
        expect(reader.state().reason).toBe('copy')
        await vi.advanceTimersByTimeAsync(1)
        await done
        expect(READ_DEADLINE_MS).toBe(3000)
        expect(reader.state()).toEqual({ source: 'copy', reason: 'timeout', rev: 2, rejected: [] })

        repository.texts.en.resolve(textsDoc({ 'a.title': 'Late' }, 9))
        await vi.advanceTimersByTimeAsync(0)
        expect(layers.en).toEqual({ 'a.title': 'Records' })
        expect(reader.state().reason).toBe('timeout')
        expect(storage.json(textsCopyKey('en'))).toEqual({ at: NOW, rev: 9, texts: { 'a.title': 'Late' } })
    })

    it('a read that fails leaves the copy, and says so', async () => {
        const storage = memoryStorage({ [textsCopyKey('en')]: { at: NOW - DAY, rev: 2, texts: { 'a.title': 'Records' } } })
        const { reader, layers, repository } = setup({ storage })
        const { done } = reader.start()

        repository.texts.en.reject(new Error('offline'))
        repository.site.reject(new Error('offline'))
        await done

        expect(layers.en).toEqual({ 'a.title': 'Records' })
        expect(reader.state()).toEqual({ source: 'copy', reason: 'failed', rev: 2, rejected: [] })
        expect(storage.items.has(textsCopyKey('en'))).toBe(true)
    })

    it('a document out of shape is ignored whole, and the copy stays', async () => {
        const storage = memoryStorage({ [textsCopyKey('en')]: { at: NOW - DAY, rev: 2, texts: { 'a.title': 'Records' } } })
        const { reader, layers, repository } = setup({ storage })
        const { done } = reader.start()

        repository.texts.en.resolve({ exists: true, data: { rev: 4, texts: 'not a map' } })
        repository.site.resolve({ exists: false })
        await done

        expect(layers.en).toEqual({ 'a.title': 'Records' })
        expect(reader.state()).toEqual({ source: 'copy', reason: 'bad_document', rev: 2, rejected: [] })
    })

    it('who speaks one language asks for its document only; the other is asked when the language changes', async () => {
        const { reader, repository, layers, speak } = setup({ locale: 'pt' })
        reader.start()
        expect(repository.asked.sort()).toEqual(['site', 'texts_pt'])

        speak('en')
        expect(repository.asked.sort()).toEqual(['site', 'texts_en', 'texts_pt'])
        speak('pt')
        speak('en')
        expect(repository.asked).toHaveLength(3)

        repository.texts.en.resolve(textsDoc({ 'a.title': 'Records' }))
        repository.texts.pt.resolve(textsDoc({ 'a.title': 'Discos' }))
        await vi.advanceTimersByTimeAsync(0)
        expect(layers).toEqual({ en: { 'a.title': 'Records' }, pt: { 'a.title': 'Discos' } })
        expect(reader.state('pt').source).toBe('published')
    })

    it('a storage that throws does not stop the site: the code shows and the read goes on', async () => {
        const storage = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') }, removeItem: () => { throw new Error('denied') } }
        const { reader, layers, repository } = setup({ storage })
        const { done } = reader.start()
        expect(reader.state().source).toBe('code')

        repository.texts.en.resolve(textsDoc({ 'a.title': 'Records' }))
        repository.site.resolve({ exists: false })
        await done
        expect(layers.en).toEqual({ 'a.title': 'Records' })
    })

    it('start() twice starts once', () => {
        const { reader, repository } = setup()
        reader.start()
        reader.start()
        expect(repository.asked).toHaveLength(2)
    })
})

describe('the switches the reader keeps (F93 reads them here)', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('from the copy a switch can only be OFF: one that was on waits for the new read', () => {
        const storage = memoryStorage({ [SITE_COPY_KEY]: { at: NOW - DAY, switches: { discogsValues: true, portugueseForAll: false, strange: false } } })
        const { reader } = setup({ storage })
        reader.start()

        expect(reader.switches()).toEqual({ values: { portugueseForAll: false }, source: 'copy' })
    })

    it('a copy of 31 days turns nothing off', () => {
        const storage = memoryStorage({ [SITE_COPY_KEY]: { at: NOW - 31 * DAY, switches: { portugueseForAll: false } } })
        const { reader } = setup({ storage })
        reader.start()

        expect(reader.switches()).toEqual({ values: {}, source: 'none' })
        expect(storage.items.has(SITE_COPY_KEY)).toBe(false)
    })

    it('the new read gives on and off, and becomes the copy', async () => {
        const { reader, repository, storage } = setup()
        const { done } = reader.start()
        repository.texts.en.resolve({ exists: false })
        repository.site.resolve({ exists: true, data: { rev: 1, switches: { discogsValues: true, portugueseForAll: false, strange: 1 } } })
        await done

        expect(reader.switches()).toEqual({ values: { discogsValues: true, portugueseForAll: false }, source: 'published' })
        expect(storage.json(SITE_COPY_KEY)).toEqual({ at: NOW, switches: { discogsValues: true, portugueseForAll: false } })
    })

    it('«not found» erases the copy of the switches', async () => {
        const storage = memoryStorage({ [SITE_COPY_KEY]: { at: NOW - DAY, switches: { portugueseForAll: false } } })
        const { reader, repository } = setup({ storage })
        const { done } = reader.start()
        repository.texts.en.resolve({ exists: false })
        repository.site.resolve({ exists: false })
        await done

        expect(reader.switches()).toEqual({ values: {}, source: 'none' })
        expect(storage.items.has(SITE_COPY_KEY)).toBe(false)
    })

    it('a read that fails or is late keeps what the copy turned off', async () => {
        const storage = memoryStorage({ [SITE_COPY_KEY]: { at: NOW - DAY, switches: { portugueseForAll: false } } })
        const { reader } = setup({ storage })
        const { done } = reader.start()
        await vi.advanceTimersByTimeAsync(READ_DEADLINE_MS)
        await done

        expect(reader.switches()).toEqual({ values: { portugueseForAll: false }, source: 'copy' })
    })
})
