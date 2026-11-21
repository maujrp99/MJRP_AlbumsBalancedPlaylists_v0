// @vitest-environment node
/**
 * UAT-192 (the title half, fixed by F54 in 791da82; this is the test it did not have): the tab of
 * the browser has one title, the one of the page, on every screen. A screen that sets another one
 * brings back the title that changed from screen to screen.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { listSourceFiles } from './support/parseSource.js'

const REPO = process.cwd()
const JS_ROOT = path.join(REPO, 'public/js')

/** Every .js, .ts and .tsx file of the app, absolute (F83: a React screen sets no title of its own either). */
const jsFiles = (dir) => listSourceFiles(dir).map(file => path.join(dir, file))
// `.setTitle('…')` of a hand-made screen, and `useScreenTitle({ tab: '…' })` of a screen in React (F83 wave 4: the Start screen)
const TITLES = /(?:\.setTitle\(\s*|\btab:\s*)(['"`])(.*?)\1/g
const WRITES_TITLE = /document\.title\s*=[^=]/

describe('one title for the tab (UAT-192)', () => {
    const pageTitle = fs.readFileSync(path.join(REPO, 'public/index.html'), 'utf8').match(/<title>([^<]*)<\/title>/)[1]

    it('every title a screen sets is the title of the page', () => {
        const titles = jsFiles(JS_ROOT).flatMap(file =>
            [...fs.readFileSync(file, 'utf8').matchAll(TITLES)].map(found => found[2])
        )

        expect(titles.length).toBeGreaterThan(0)
        expect([...new Set(titles)]).toEqual([pageTitle])
    })

    const writersIn = (root) => jsFiles(root)
        .filter(file => WRITES_TITLE.test(fs.readFileSync(file, 'utf8')))
        .map(file => path.relative(root, file))

    it('no screen writes document.title by itself (BaseView.setTitle is the one place)', () => {
        expect(writersIn(JS_ROOT)).toEqual(['views/BaseView.js'])
    })

    it('it reads .ts and .tsx: a React file that writes document.title is accused (F83)', () => {
        expect(writersIn(path.join(REPO, 'test/architecture/fixtures/typescript'))).toEqual(['writesTitle.tsx'])
    })
})
