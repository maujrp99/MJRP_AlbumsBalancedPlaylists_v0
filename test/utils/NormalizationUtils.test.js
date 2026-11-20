/**
 * The core of a track title, for matching tracks (utils/NormalizationUtils.js).
 *
 * F64 (UAT-20): the expression of toCore was rewritten for the lint gate (`no-useless-escape`:
 * escapes that change nothing were removed). These cases were written and run before it was
 * touched and pass the same after.
 */
import { describe, it, expect } from 'vitest'
import { NormalizationUtils } from '../../public/js/utils/NormalizationUtils.js'

describe('NormalizationUtils.toCore', () => {
    it.each([
        ['Enter Sandman', 'entersandman'],
        ['Enter Sandman (Remastered)', 'entersandman'],
        ['Enter Sandman [Live] (2021 Mix)', 'entersandman'],
        ['Déjà Vu (feat. Somebody)', 'dejavu'],
        ['One (Two] Three', 'onethree'],
        ['One [Two) Three', 'onethree'],
        // a bracket inside a parenthesis, a parenthesis inside a bracket, one that never closes, one that never opened
        ['A (B [C] D)', 'ad'],
        ['A [B (C) D]', 'abd'],
        ['A (B', 'ab'],
        ['A ) B', 'ab'],
        ['One \\(Two\\) Three', 'onethree'],
        ['', ''],
        [null, '']
    ])('%s -> %s', (title, core) => {
        expect(NormalizationUtils.toCore(title)).toBe(core)
    })

    it('removeDiacritics takes the accents and nothing else', () => {
        expect(NormalizationUtils.removeDiacritics('Beyoncé – Ça Va?')).toBe('Beyonce – Ca Va?')
        expect(NormalizationUtils.removeDiacritics(null)).toBe('')
    })
})
