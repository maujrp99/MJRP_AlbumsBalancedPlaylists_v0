/**
 * F82 TASK-12 (REQ-10): the layers of `t()`. By language, in a fixed order that does not depend on what arrives first:
 * the published text, the code's dictionary, the code's English. A version of the texts goes up when the published layer
 * changes, and whoever listens to the language (the hand-made screens with onLocaleChange, the React ones with useLocale)
 * draws again. `tRich` gives the stored Markdown of a rich key.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import {
    t, tPlural, tRich, setLocale, onLocaleChange, onTextsChange, registerTexts, registerPublishedTexts, publishedTexts,
    getTextsVersion, PREVIEW_KEY
} from '../../public/js/i18n/t.js'
import { useLocale } from '../../public/js/react-bridge/useLocale'
import { bridgeListenerCount } from '../../public/js/react-bridge/listeners'
import { kindOf, TEXT_KINDS } from '../../public/js/i18n/textKinds.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const speakPortuguese = async () => {
    window.localStorage.setItem(PREVIEW_KEY, 'pt')
    expect(await setLocale('pt')).toBe(true)
}

describe('the layers of t(): published, the code\'s dictionary, the code\'s English', () => {
    afterEach(async () => {
        registerPublishedTexts('en', {})
        registerPublishedTexts('pt', {})
        window.localStorage.removeItem(PREVIEW_KEY)
        await setLocale('en')
    })

    it('the published text wins over the code, in t, tPlural and with {placeholders}', () => {
        registerTexts('en', { 'cms.hello': 'Hello {name}', 'cms.album.one': '{count} album', 'cms.album.other': '{count} albums' })
        registerPublishedTexts('en', { 'cms.hello': 'Hi {name}!', 'cms.album.other': '{count} records' })

        expect(t('cms.hello', { name: 'Ana' })).toBe('Hi Ana!')
        expect(tPlural('cms.album', 2, { count: 2 })).toBe('2 records')
        expect(tPlural('cms.album', 1, { count: 1 })).toBe('1 album')
        expect(publishedTexts('en')).toEqual({ 'cms.hello': 'Hi {name}!', 'cms.album.other': '{count} records' })
    })

    it('by language: published, then the dictionary of the language, then the English of the code', async () => {
        registerTexts('en', { 'cms.a': 'A in English', 'cms.b': 'B in English', 'cms.c': 'C in English' })
        registerTexts('pt', { 'cms.a': 'A do código', 'cms.b': 'B do código' })
        registerPublishedTexts('pt', { 'cms.a': 'A publicado' })
        registerPublishedTexts('en', { 'cms.c': 'C published in English' })
        await speakPortuguese()

        expect(t('cms.a')).toBe('A publicado')
        expect(t('cms.b')).toBe('B do código')
        expect(t('cms.c')).toBe('C in English')
    })

    it('a Portuguese dictionary that arrives late does not erase the published text', async () => {
        registerTexts('en', { 'cms.late': 'Late' })
        registerPublishedTexts('pt', { 'cms.late': 'Publicado antes' })
        registerTexts('pt', { 'cms.late': 'Do código, depois' })
        await speakPortuguese()

        expect(t('cms.late')).toBe('Publicado antes')
    })

    it('registering the published texts REPLACES the layer: a key that left goes back to the code', () => {
        registerTexts('en', { 'cms.x': 'X of the code' })
        registerPublishedTexts('en', { 'cms.x': 'X published' })
        registerPublishedTexts('en', {})

        expect(t('cms.x')).toBe('X of the code')
    })

    it('the version of the texts goes up on each change, and not when nothing changed', () => {
        const before = getTextsVersion()
        registerPublishedTexts('en', { 'cms.v': 'one' })
        expect(getTextsVersion()).toBe(before + 1)
        registerPublishedTexts('en', { 'cms.v': 'one' })
        expect(getTextsVersion()).toBe(before + 1)
        registerPublishedTexts('en', { 'cms.v': 'two' })
        expect(getTextsVersion()).toBe(before + 2)
    })

    it('the hand-made screens hear it through the same notice as the language', async () => {
        const heard: string[] = []
        const texts: number[] = []
        const stop = onLocaleChange(locale => heard.push(locale))
        const stopTexts = onTextsChange(() => texts.push(getTextsVersion()))

        registerPublishedTexts('en', { 'cms.n': 'new' })
        registerPublishedTexts('pt', { 'cms.n': 'novo' }) // not the language spoken: nobody draws again
        expect(heard).toEqual(['en'])
        expect(texts).toHaveLength(1)

        await speakPortuguese()
        expect(heard).toEqual(['en', 'pt'])
        expect(texts).toHaveLength(2)
        stop()
        stopTexts()
        registerPublishedTexts('pt', { 'cms.n': 'mais novo' })
        expect(heard).toEqual(['en', 'pt'])
        expect(texts).toHaveLength(2)
    })

    it('tRich gives the stored Markdown of a key, by the same layers', () => {
        registerTexts('en', { 'cms.about': 'About **us**, {name}' })
        expect(tRich('cms.about')).toBe('About **us**, {name}')
        registerPublishedTexts('en', { 'cms.about': 'All about **us**\n\n[more](/about), {name}' })
        expect(tRich('cms.about')).toBe('All about **us**\n\n[more](/about), {name}')
        expect(tRich('cms.about', { name: 'Ana' })).toBe('All about **us**\n\n[more](/about), Ana')
        expect(tRich('cms.nowhere')).toBe('cms.nowhere')
    })

    it('a key is plain unless the dictionary marks it rich or short', () => {
        expect(kindOf('cms.anything')).toBe('plain')
        expect(kindOf('toString')).toBe('plain')
        for (const key of Object.keys(TEXT_KINDS)) expect(['rich', 'short'], key).toContain(kindOf(key))
    })
})

describe('useLocale: a React screen draws again when the published texts change', () => {
    afterEach(() => { registerPublishedTexts('en', {}) })

    it('draws the new text with no change of language, and lets go when it leaves', () => {
        registerTexts('en', { 'cms.screen': 'From the code' })
        const seen: string[] = []
        function Screen() {
            seen.push(useLocale())
            return <p>{t('cms.screen')}</p>
        }
        const host = document.createElement('div')
        const root = createRoot(host)
        const before = bridgeListenerCount()
        act(() => { root.render(<Screen />) })
        expect(host.textContent).toBe('From the code')

        act(() => { registerPublishedTexts('en', { 'cms.screen': 'Published' }) })
        expect(host.textContent).toBe('Published')
        expect(new Set(seen)).toEqual(new Set(['en']))

        act(() => { root.unmount() })
        expect(bridgeListenerCount()).toBe(before)
    })
})
