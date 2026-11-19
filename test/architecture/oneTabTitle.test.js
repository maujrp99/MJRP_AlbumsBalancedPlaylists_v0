// @vitest-environment node
/**
 * UAT-192 (the title half, fixed by F54 in 791da82; this is the test it did not have): the tab of
 * the browser has one title, the one of the page, on every screen. A screen that sets another one
 * brings back the title that changed from screen to screen.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const REPO = process.cwd()
const JS_ROOT = path.join(REPO, 'public/js')

function jsFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return entry.name === 'vendor' ? [] : jsFiles(full)
        return entry.name.endsWith('.js') ? [full] : []
    })
}

describe('one title for the tab (UAT-192)', () => {
    const pageTitle = fs.readFileSync(path.join(REPO, 'public/index.html'), 'utf8').match(/<title>([^<]*)<\/title>/)[1]

    it('every title a screen sets is the title of the page', () => {
        const titles = jsFiles(JS_ROOT).flatMap(file =>
            [...fs.readFileSync(file, 'utf8').matchAll(/\.setTitle\(\s*(['"`])(.*?)\1/g)].map(found => found[2])
        )

        expect(titles.length).toBeGreaterThan(0)
        expect([...new Set(titles)]).toEqual([pageTitle])
    })

    it('no screen writes document.title by itself (BaseView.setTitle is the one place)', () => {
        const writers = jsFiles(JS_ROOT)
            .filter(file => /document\.title\s*=[^=]/.test(fs.readFileSync(file, 'utf8')))
            .map(file => path.relative(JS_ROOT, file))

        expect(writers).toEqual(['views/BaseView.js'])
    })
})
