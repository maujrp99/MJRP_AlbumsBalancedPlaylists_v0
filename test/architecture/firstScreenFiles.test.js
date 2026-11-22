/**
 * F83 wave 7b (judge P2-3): the first screen does not download a file only to expose a store to the console.
 *
 * The playlists store stopped being in the main script (only the lazy screens and the shared controller reach it), so a dynamic import of it in the
 * "expose stores" block of app.js made the bundler fetch `playlists-*.js` (619 B) on every cold first screen. The store now exposes itself when a screen
 * that uses it loads. jsdom cannot count requests; this holds the cause (the real request lists are in reports/evidence/F83/wave-7b/fix-scroll-and-weight/).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const read = (file) => fs.readFileSync(path.resolve(__dirname, '../../public/js', file), 'utf8')

describe('the first screen and the exposed stores', () => {
    it('app.js does not import the playlists store, which only the lazy screens use', () => {
        expect(read('app.js')).not.toMatch(/import\(\s*['"]\.\/stores\/playlists\.js['"]\s*\)/)
    })

    it('the playlists store exposes itself to the console when it loads', () => {
        expect(read('stores/playlists.js')).toMatch(/window\.playlistsStore\s*=\s*playlistsStore/)
    })
})
