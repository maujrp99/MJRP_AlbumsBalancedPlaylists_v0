/**
 * F97 (REQ-04): the texts the export window says when Spotify refuses the account or a search fails exist in English and in Portuguese,
 * in the voice of the product. What it does not prove: that the Portuguese is the one the owner wants (he approves texts in the Painel).
 */
import { describe, it, expect } from 'vitest'
import { exportWindow as en } from '../../public/js/i18n/en/exportWindow.js'
import { exportWindow as pt } from '../../public/js/i18n/pt/exportWindow.js'

const NEW_KEYS = [
    'spotifyWindow.refused', 'spotifyWindow.refusedNote', 'spotifyWindow.unchecked',
    'spotifyWindow.uncheckedCount.one', 'spotifyWindow.uncheckedCount.other', 'spotifyWindow.uncheckedMore'
]

describe('the texts of an export that could not check the tracks (F97)', () => {
    it('every key of one language is in the other', () => {
        expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort())
    })

    it.each(NEW_KEYS)('%s is written in both, and differently', (key) => {
        expect(en[key]).toBeTruthy()
        expect(pt[key]).toBeTruthy()
        expect(pt[key]).not.toBe(en[key])
    })

    it('the refusal names the next step and promises nothing', () => {
        expect(en['spotifyWindow.refusedNote']).toMatch(/limited test phase/)
        expect(en['spotifyWindow.refusedNote']).toMatch(/Ask the owner/)
        expect(en['spotifyWindow.refusedNote']).toMatch(/Apple Music/)
        expect(pt['spotifyWindow.refusedNote']).toMatch(/Peça ao dono/)
        expect(pt['spotifyWindow.refusedNote']).toMatch(/Apple Music/)
        expect(`${en['spotifyWindow.refusedNote']} ${pt['spotifyWindow.refusedNote']}`).not.toMatch(/will be added|vai ser incluíd|será incluíd/i)
    })

    it('the product is named in full, and Portuguese never says «disco»', () => {
        const all = (dictionary) => NEW_KEYS.map(key => dictionary[key]).join(' ')
        expect(all(en).replace(/The Album Blender/g, '')).not.toMatch(/Blender/)
        expect(all(pt).replace(/The Album Blender/g, '')).not.toMatch(/Blender/)
        expect(all(pt)).not.toMatch(/disco/i)
        expect(all(en) + all(pt)).not.toMatch(/not found|não encontrad/i)
    })
})
