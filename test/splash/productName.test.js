/**
 * The owner's rule (MJRP, 2026-11-23): «a app nao chama blender e sim The Album Blender».
 * In every text a visitor reads, in Portuguese and in English, the product is «The Album Blender», in full: never «Blender», «o Blender» or
 * «the Blender» alone. «Blend» (the screen, the action, the recipe) is another word and stays.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { COPY } from '../../public/splash/copy.js'

const LONE = /(?<!The Album )Blender/
const root = process.cwd()
const i18n = resolve(root, 'public/js/i18n')
// the values of a dictionary file: every quoted string after a colon (the keys are identifiers)
const valuesOf = (source) => [...source.matchAll(/:\s*(['"`])((?:\\.|(?!\1).)*)\1/gs)].map(m => m[2])
const dictionaries = ['pt', 'en'].flatMap(lang => readdirSync(join(i18n, lang)).filter(n => n.endsWith('.js')).map(n => join(lang, n)))
    .concat(readdirSync(i18n).filter(n => n.endsWith('.js')))

describe('the product is «The Album Blender», in full (the owner, 2026-11-23)', () => {
    it('the rule: «Blender» alone is refused, «The Album Blender» and «Blend» pass', () => {
        expect(LONE.test('O Blender monta a série.')).toBe(true)
        expect(LONE.test('The Blender builds the series.')).toBe(true)
        expect(LONE.test('Album Blender')).toBe(true)
        expect(LONE.test('The Album Blender monta a série.')).toBe(false)
        expect(LONE.test('Blend it now, with a blend recipe')).toBe(false)
    })

    it('the entry page: every text of the dictionary, in both languages', () => {
        const hits = ['pt', 'en'].flatMap(lang => Object.entries(COPY[lang]).filter(([, text]) => LONE.test(String(text))).map(([key]) => `${lang} ${key}`))
        expect(hits).toEqual([])
        expect(COPY.pt['p.start']).toContain('The Album Blender monta a série.')
        expect(COPY.en['p.start']).toContain('The Album Blender builds the series.')
    })

    it('the entry page: what is written in the page itself', () => {
        const page = readFileSync(resolve(root, 'public/splash.html'), 'utf8')
        const body = page.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
        expect(LONE.test(body)).toBe(false)
    })

    it('the app: every text of every dictionary, Portuguese and English', () => {
        expect(dictionaries.length).toBeGreaterThan(15)
        const hits = dictionaries.flatMap(name => valuesOf(readFileSync(join(i18n, name), 'utf8')).filter(text => LONE.test(text)).map(text => `${name}: ${text.slice(0, 80)}`))
        expect(hits).toEqual([])
    })
})
