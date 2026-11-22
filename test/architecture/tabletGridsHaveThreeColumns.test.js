// @vitest-environment node
/**
 * F88 (the judge's second look, P2-1): from 768 to 899 px the app uses the phone's layout (F88 moved the line from
 * 767 to 899 px; pending the owner's approval). The phone's grids of covers have 2 columns, which on a tablet
 * means two covers of 380 px. From 640 px they have 3, as they had on the computer's layout from 768 px.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
const flat = (text) => text.replace(/\s+/g, '')

describe('the grids of covers on a tablet in the phone layout (768-899 px)', () => {
    it.each(['public/js/views/albums/AlbumsGridRenderer.js', 'public/js/views/albums/AlbumsScopedRenderer.js'])('%s has 3 columns from 640 px', (file) => {
        expect(read(file)).toMatch(/grid-cols-2 sm:grid-cols-3/)
    })

    it('the results of the Start screen and the series picker have 3 columns from 640 px, inside the phone query', () => {
        const css = flat(read('public/css/mobile/home.css'))
        expect(css).toMatch(/@media\(min-width:640px\)\{[^@]*\.home-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/)
        expect(css).toMatch(/@media\(min-width:640px\)\{[^@]*\[data-picker-grid\]\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/)
    })

    it('the gallery of the inventory (F89) follows the albums grid at every width of the phone: the columns and the gaps are written once, in mobile.css', () => {
        const base = flat(read('public/css/mobile.css'))
        // Albums: 2 columns, 3 from 640 px (the two renderers above); the variables say the same
        expect(base).toMatch(/--phone-cover-columns:2;--phone-cover-gap-x:12px;--phone-cover-gap-y:20px;/)
        expect(base).toMatch(/@media\(min-width:640px\)\{:root\{--phone-cover-columns:3;\}\}/)
        const gallery = flat(read('public/css/mobile/inventory.css'))
        expect(gallery).toMatch(/\.inv-tiles\{display:grid;grid-template-columns:repeat\(var\(--phone-cover-columns\),minmax\(0,1fr\)\);column-gap:var\(--phone-cover-gap-x\);row-gap:var\(--phone-cover-gap-y\);/)
        const albums = flat(read('public/css/mobile/albums.css'))
        expect(albums).toMatch(/\.albums-view\.albums-grid\{column-gap:var\(--phone-cover-gap-x\);row-gap:var\(--phone-cover-gap-y\);\}/)
    })
})
