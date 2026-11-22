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

    it('the gallery of the inventory (F89) has 3 columns on a phone and as many as fit at 140 px or more from 640 px, inside the phone query', () => {
        const css = flat(read('public/css/mobile/inventory.css'))
        expect(css).toMatch(/\.inv-tiles\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/)
        expect(css).toMatch(/@media\(min-width:640px\)\{\.inv-tiles\{grid-template-columns:repeat\(auto-fill,minmax\(140px,1fr\)\)/)
        // under 360 px (the first iPhone SE, 320 px) three would be cards of 90 px: two
        expect(css).toMatch(/@media\(max-width:359px\)\{\.inv-tiles\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
    })
})
