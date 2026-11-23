// @vitest-environment node
/**
 * F81 (the judge's P1-1 of 2026-11-23): a Portuguese text names a screen and a recipe as the Portuguese menu and the Portuguese recipe list
 * do. The pairs are read from the dictionaries themselves, never from a list kept here: the destinations of the menu (`shell.phone.tab*`,
 * the five stops of the bar) and the names of the recipes (`blend.recipes.*.name`), each where the Portuguese differs from the English.
 * No Portuguese value, of the app or of the Painel, may carry the English one as a whole word.
 */
import { describe, it, expect } from 'vitest'
import { en } from '../../public/js/i18n/en/index.js'
import { pt } from '../../public/js/i18n/pt/index.js'
import { admin as adminPt } from '../../public/js/i18n/pt/admin.js'

const NAMED = [/^shell\.phone\.tab(?!sLabel)/, /^blend\.recipes\.[^.]+\.name$/]
const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** The English name as a whole word: «Blend» is not in «The Album Blender», «Albums» is not in «BestEverAlbums». */
const asWord = (name) => new RegExp(`(?<![\\p{L}\\p{N}])${escaped(name)}(?![\\p{L}\\p{N}])`, 'u')

export const pairs = () => Object.keys(en)
    .filter(key => NAMED.some(shape => shape.test(key)) && pt[key] && pt[key] !== en[key])
    .map(key => ({ key, english: en[key], portuguese: pt[key] }))

export function englishNamesIn(texts) {
    const found = []
    for (const [key, value] of Object.entries(texts)) {
        for (const pair of pairs()) {
            if (key !== pair.key && asWord(pair.english).test(value)) found.push(`${key}: «${pair.english}» is «${pair.portuguese}» in Portuguese (${pair.key}) — ${value.slice(0, 110)}`)
        }
    }
    return found
}

describe('a Portuguese text names things as the Portuguese menu and recipe list do (F81)', () => {
    it('the pairs come from the dictionaries: the stops of the menu and the recipes whose name changes', () => {
        const names = pairs()
        expect(names.find(pair => pair.key === 'shell.phone.tabStart')).toMatchObject({ english: en['shell.phone.tabStart'], portuguese: pt['shell.phone.tabStart'] })
        expect(names.filter(pair => pair.key.startsWith('blend.recipes.')).length).toBeGreaterThanOrEqual(3)
        expect(names.every(pair => pair.english !== pair.portuguese)).toBe(true)
    })

    it('the check itself tells a carried English name from a Portuguese text', () => {
        const stop = pairs().find(pair => pair.key === 'shell.phone.tabStart')
        const recipe = pairs().find(pair => pair.key === 'blend.recipes.topNUser.name')
        expect(englishNamesIn({ 'x.a': `Ir para ${stop.english}` })).toHaveLength(1)
        expect(englishNamesIn({ 'x.b': `usada pela receita "${recipe.english}".` }).length).toBeGreaterThanOrEqual(1)
        expect(englishNamesIn({ 'x.c': `Ir para ${stop.portuguese}`, 'x.d': 'The Album Blender', 'x.e': 'BestEverAlbums' })).toEqual([])
    })

    it('no Portuguese text of the app carries the English name of a stop of the menu or of a recipe', () => {
        expect(englishNamesIn(pt)).toEqual([])
    })

    it('nor does any Portuguese text of the Painel', () => {
        expect(englishNamesIn(adminPt)).toEqual([])
    })

    it('the phone\'s Blend sends who has no series to the stop the Portuguese menu has (there is no «Início»)', () => {
        expect(pt['blend.phone.noSeries']).toContain(pt['shell.phone.tabStart'])
        expect(pt['blend.phone.noSeries']).not.toMatch(/Início/)
    })
})
