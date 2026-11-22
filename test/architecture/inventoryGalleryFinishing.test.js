// @vitest-environment node
/**
 * F89 (the judge's recheck, P2-1 to P2-5): the finishing of the gallery of the inventory on the phone, written in the
 * style sheets: the cover corner of Albums, a reason that wraps, room at the end for the «back to top» button, a card
 * that can be scrolled to above the bottom menu.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
const flat = (text) => text.replace(/\s+/g, '')
const css = flat(read('public/css/mobile/inventory.css'))

describe('the gallery of the inventory on the phone, finished', () => {
    it('has the corner of the covers of Albums (10 px), written once as a variable', () => {
        expect(flat(read('public/css/mobile.css'))).toMatch(/--phone-cover-radius:10px;/)
        expect(css).toMatch(/\.inv-tile__open\{[^}]*border-radius:var\(--phone-cover-radius\);/)
        expect(css).toMatch(/\.inv-tile__cover\{[^}]*border-radius:var\(--phone-cover-radius\);/)
    })

    it('lets the reason of «—» wrap instead of cutting it with an ellipsis', () => {
        expect(css).toMatch(/\.inv-tile__origin\{[^}]*white-space:normal;/)
        expect(css).not.toMatch(/\.inv-tile__artist,\.inv-tile__origin\{/)
    })

    it('gives the end of the screen the room of the «back to top» button, in the gallery and the list', () => {
        expect(css).toMatch(/\.inv-discogs-notice\{[^}]*padding-bottom:calc\(var\(--phone-target\)\+16px\);/)
    })

    it.each(['.inv-tile', '.inv-row'])('%s can be scrolled to above the bottom menu', (selector) => {
        const block = css.slice(css.indexOf(`${selector}{`)).split('}')[0]
        expect(block).toMatch(/scroll-margin-bottom:calc\(var\(--phone-tabbar-h\)\+var\(--phone-safe-bottom\)\+8px\);/)
    })
})
