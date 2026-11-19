/**
 * F59 slice E (UAT-199): an address that comes from outside the code goes into a link only when
 * it is a web address (http or https).
 */
import { describe, it, expect } from 'vitest'
import { safeUrl } from '../../public/js/utils/safeUrl.js'

describe('safeUrl', () => {
    it('gives back a web address as it was written', () => {
        expect(safeUrl('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')).toBe('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')
        expect(safeUrl('http://www.besteveralbums.com/thechart.php?a=13&b=2#top')).toBe('http://www.besteveralbums.com/thechart.php?a=13&b=2#top')
        expect(safeUrl('  HTTPS://Example.com/a  ')).toBe('HTTPS://Example.com/a')
    })

    it('refuses every scheme that is not http or https', () => {
        const refused = [
            'javascript:alert(1)',
            'JaVaScRiPt:alert(1)',
            ' javascript:alert(1)',
            'java\nscript:alert(1)',
            'java\tscript:alert(1)',
            '\u0001javascript:alert(1)',
            'javascript://example.com/%0Aalert(1)',
            'data:text/html,<script>alert(1)</script>',
            'vbscript:msgbox(1)',
            'blob:https://example.com/1234',
            'file:///etc/passwd',
            'spotify:album:4aawyAB9vmqN3uQ7FjRGTy',
            'mailto:someone@example.com'
        ]
        for (const value of refused) expect(safeUrl(value), value).toBeNull()
    })

    it('refuses what is not an absolute address', () => {
        const refused = ['', '   ', '/albums', '//example.com/a', 'example.com/a', 'album/123', 'https://', 'http:///', null, undefined, 42, {}, ['https://example.com']]
        for (const value of refused) expect(safeUrl(value), String(value)).toBeNull()
    })
})
