// @vitest-environment node
/**
 * F88 (the owner, on his iPhone, 2026-11-21: «Os menus não eram pra ser iguais?»): the bottom menu of the phone is the SAME
 * component in the home and in the app: the same markup (nav.ms, an icon above each label, one row of bars), the same stylesheet
 * (public/splash/bar-menu.css, scoped by `.pbar`), the same height. A second copy of a phone rule for it, or a bar of the app
 * with markup of its own, is how the passage from the home to the app came to jolt. The proof of the pixels, in WebKit, is
 * test/visual/phoneBarLabels.mjs.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
const home = read('public/splash.html')
const shared = read('public/splash/bar-menu.css')
const mobile = read('public/css/mobile.css')
const shell = read('public/js/components/navigation/PhoneShell.js')
const menuJs = read('public/splash/menu.js')
const barMenu = read('public/js/components/navigation/barMenu.js')

describe('the phone\'s bottom menu is one component', () => {
    it('the home\'s bottom bar and the app\'s both carry the shared class, and nothing of their own', () => {
        expect(home).toMatch(/<div class="thread pbar">/)
        expect(shell).toMatch(/className = 'phone-tabbar pbar'/)
    })

    it('the home draws its icons from the site\'s one module, and the app draws its bar with the same function as the computer\'s', () => {
        expect(menuJs).toMatch(/from '\.\/phoneBar\.js'/)
        expect(barMenu).toMatch(/from '\.\.\/\.\.\/\.\.\/splash\/phoneBar\.js'/)
        expect(shell).toMatch(/renderPhoneBar/)
    })

    it('the app\'s phone stylesheet keeps no rule of the bar: no `.phone-tabbar` rules and no copy of the row of bars', () => {
        expect(mobile).not.toMatch(/\.phone-tabbar__/)
        expect(mobile).not.toMatch(/\n\s*\.phone-tabbar\s*\{/)
    })

    it('the height of the bar is written once (--pbar-h) and the app\'s layout reads it', () => {
        expect(shared).toMatch(/--pbar-h:\s*\d+px/)
        expect(mobile).toMatch(/--phone-tabbar-h:\s*var\(--pbar-h\)/)
        expect(home).toMatch(/var\(--pbar-h\)/)
    })

    it('touch targets: the stop is at least 44 px tall', () => {
        const stop = shared.split('\n').find(line => line.startsWith('  .pbar .ms .stop{'))
        const height = Number((stop.match(/min-height:\s*(\d+)px/) || [])[1])
        expect(height).toBeGreaterThanOrEqual(44)
    })
})
