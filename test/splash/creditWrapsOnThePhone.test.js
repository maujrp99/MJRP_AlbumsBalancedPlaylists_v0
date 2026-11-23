import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// UAT-231: on the phone, with the real covers, an album's name must wrap inside its column; a line that cannot wrap made the page wider
// than the screen. Since F96 the albums are no longer under a record in each story: they are the cards of the row «Na caixa do The Album
// Blender». The same guard, on the card: the name wraps (two lines at most), the card has a fixed width, and the row is the only thing
// that scrolls sideways.
const page = readFileSync(resolve(process.cwd(), 'public/splash.html'), 'utf8')
const rule = (selector) => (page.match(new RegExp(`\\n {2}${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\{([^}]*)\\}`)) || [])[1] || ''

describe('an album\'s name on the phone (UAT-231, on the F96 row of albums)', () => {
    it('has a rule of its own', () => {
        expect(rule('.al b')).not.toBe('')
    })
    it('may wrap, and is cut after two lines instead of pushing the card wider', () => {
        expect(rule('.al b')).not.toMatch(/white-space:\s*nowrap/)
        expect(rule('.al b')).toMatch(/-webkit-line-clamp:2;overflow:hidden/)
    })
    it('the card has a fixed width and may shrink its content; the row scrolls inside the screen, never the page', () => {
        expect(rule('.shelf')).toMatch(/grid-auto-columns:150px/)
        expect(rule('.al')).toMatch(/min-width:0/)
        // the hidden part of the button's name is absolutely placed: the card holds it, so the row clips it (it made the page 2388 px wide)
        expect(rule('.al')).toMatch(/^position:relative/)
        expect(rule('.sw')).toMatch(/overflow-x:auto/)
    })
})
