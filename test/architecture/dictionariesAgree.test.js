// @vitest-environment node
/**
 * Fitness functions of the dictionaries (F83 wave 0, contract of the proposal § 5.2; F81 grows the dictionaries):
 *
 *   dictionariesAgree  `en` and `pt` have the same keys and the same {placeholders} in each, no value is empty and none has
 *                      HTML (`<`): a text with a link or a bold word in the middle is split into keys; React protects the
 *                      text it draws and the hand-made screens escape it, but a text that is HTML would defeat both;
 *   rulesDoNotSpeak    shared/, models/, algorithms/ and ranking/ do not import i18n/: a rule gives a code or a datum, and the
 *                      screen says it.
 *
 * What they do not prove: that the translation is good, or that every visible text of a screen is in a dictionary (the
 * reading of the screen in both languages, at the visual recheck, is the proof of that).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { en } from '../../public/js/i18n/en/index.js'
import { pt } from '../../public/js/i18n/pt/index.js'
import { listSourceFiles } from './support/parseSource.js'

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
const KEY = /^[a-z][A-Za-z0-9]*(\.[a-z][A-Za-z0-9]*)+$/

/** What the two dictionaries do not agree on: one line per finding. */
export function disagreements(first, second) {
    const out = []
    for (const key of Object.keys(first)) if (!(key in second)) out.push(`${key}: in en, not in pt`)
    for (const key of Object.keys(second)) if (!(key in first)) out.push(`${key}: in pt, not in en`)
    for (const key of Object.keys(first).filter(name => name in second)) {
        if (placeholders(first[key]).join() !== placeholders(second[key]).join()) out.push(`${key}: different {placeholders}`)
    }
    for (const [language, dictionary] of [['en', first], ['pt', second]]) {
        for (const [key, text] of Object.entries(dictionary)) {
            if (!KEY.test(key)) out.push(`${language} ${key}: not a key of the form area.piece.name`)
            if (typeof text !== 'string' || !text.trim()) out.push(`${language} ${key}: empty`)
            else if (text.includes('<')) out.push(`${language} ${key}: has a "<" (a text is never HTML)`)
        }
    }
    return out
}

describe('the dictionaries agree', () => {
    it('en and pt have the same keys and placeholders, no empty value, no HTML', () => {
        expect(Object.keys(en).length).toBeGreaterThan(5)
        expect(disagreements(en, pt)).toEqual([])
    })

    it('a key in one language only, a different placeholder, an empty text and an HTML text are accused (the wrong examples)', () => {
        expect(disagreements({ 'a.b': 'x' }, { 'a.b': 'x', 'a.c': 'y' })).toEqual(['a.c: in pt, not in en'])
        expect(disagreements({ 'a.b': 'Hi {name}' }, { 'a.b': 'Oi {nome}' })).toEqual(['a.b: different {placeholders}'])
        expect(disagreements({ 'a.b': '  ' }, { 'a.b': 'x' })).toEqual(['en a.b: empty'])
        expect(disagreements({ 'a.b': 'x' }, { 'a.b': 'x <b>bold</b>' })).toEqual(['pt a.b: has a "<" (a text is never HTML)'])
        expect(disagreements({ 'nodots': 'x' }, { 'nodots': 'x' })).toHaveLength(2)
    })
})

describe('the rules do not speak', () => {
    const SITE = path.join(process.cwd(), 'public/js')
    const RULE_FOLDERS = [['shared', path.join(process.cwd(), 'shared')], ['models', path.join(SITE, 'models')], ['algorithms', path.join(SITE, 'algorithms')], ['ranking', path.join(SITE, 'ranking')]]
    const IMPORTS_I18N = /(?:from\s*|import\s*\(\s*|import\s*)['"][^'"]*\/i18n\/[^'"]*['"]/

    it('no file of shared/, models/, algorithms/ or ranking/ imports i18n/', () => {
        const offenders = RULE_FOLDERS.flatMap(([name, dir]) => listSourceFiles(dir)
            .filter(file => IMPORTS_I18N.test(fs.readFileSync(path.join(dir, file), 'utf8')))
            .map(file => `${name}/${file}`))
        expect(offenders).toEqual([])
    })

    it('a rule that imports the dictionary is accused (the wrong example)', () => {
        expect(IMPORTS_I18N.test("import { t } from '../i18n/t.js'")).toBe(true)
        expect(IMPORTS_I18N.test("import { x } from './other.js'")).toBe(false)
    })
})
