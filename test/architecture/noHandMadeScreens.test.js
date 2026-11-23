// @vitest-environment node
/**
 * THE FINAL RULE of F83 (REQ-03, REQ-09; wave 8d): no hand-made screen comes back. It replaces the two lists that only shrank
 * (handMadeScreensOnlyShrink, with its baseline of the files of views/ and components/, and bridgesOnlyShrink, with BRIDGE_USES):
 *
 *   1. public/js/views/, public/js/components/ and public/js/react-bridge/legacy/ do not exist;
 *   2. a file outside the folders of React (screens/, ui/, shell/, react-bridge/) and the vendored code that writes the DOM (innerHTML,
 *      createElement, the style or class of the body, appendChild) must be in EXCEPTIONS, with the reason it is not screen drawing;
 *   3. an exception that no longer writes the DOM, or whose file is gone, is accused: the list cannot rot.
 *
 * The survey is the one of wave 0 (a file that builds elements, sets innerHTML or writes the style of the body, outside the screens).
 * public/splash/ (the entry page, F80) is hand-made on purpose and is not under public/js: it is the other half of the same decision.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { GONE, WRITES_THE_DOM, EXCEPTIONS, REACT_FOLDERS } from './support/handMadeRule.js'

const ROOT = path.join(process.cwd(), 'public/js')

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)])
const siteFiles = (root = ROOT) => walk(root).map(file => path.relative(root, file).split(path.sep).join('/')).filter(file => /\.(js|ts|tsx)$/.test(file))

/** A comment that talks about innerHTML is not a write. */
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** (in support/handMadeRule.js: GONE, WRITES_THE_DOM, EXCEPTIONS)
 * The files outside React that write the DOM, given a reader of their text. */
export const writers = (files, read) => files.filter(file => !REACT_FOLDERS.some(folder => file.startsWith(folder))).filter(file => WRITES_THE_DOM.test(withoutComments(read(file))))

/** What breaks the rule: one line per finding. */
export function findings(found, listed, existing = () => true) {
    return [
        ...found.filter(file => !(file in listed)).map(file => `${file}: a hand-made file that draws (a screen is born in React, in screens/, ui/ or shell/); if it is not drawing, list it with the reason`),
        ...Object.keys(listed).filter(file => !existing(file)).map(file => `${file}: listed, and gone: take it out of EXCEPTIONS`),
        ...Object.keys(listed).filter(file => existing(file) && !found.includes(file)).map(file => `${file}: listed, and it no longer writes the DOM: take it out of EXCEPTIONS`)
    ]
}

describe('no hand-made screen comes back (the final rule of F83)', () => {
    it('views/, components/ and react-bridge/legacy/ do not exist', () => {
        expect(GONE.filter(folder => fs.existsSync(path.join(ROOT, folder)))).toEqual([])
    })

    it('the code of today writes the DOM outside React only where the list says, with a reason', () => {
        const found = writers(siteFiles(), file => fs.readFileSync(path.join(ROOT, file), 'utf8'))
        expect(findings(found, EXCEPTIONS, file => fs.existsSync(path.join(ROOT, file)))).toEqual([])
    })

    it('every exception has a reason of some length', () => {
        expect(Object.entries(EXCEPTIONS).filter(([, why]) => why.length < 30)).toEqual([])
    })

    it('a new file that sets innerHTML is accused (the wrong example)', () => {
        const files = { 'utils/NewWidget.js': 'export const draw = (el) => { el.innerHTML = "<p>hi</p>" }', 'screens/x/A.tsx': 'document.createElement("p")' }
        expect(findings(writers(Object.keys(files), file => files[file]), {})).toEqual([expect.stringContaining('utils/NewWidget.js: a hand-made file that draws')])
    })

    it('a file that builds elements or writes the body is accused, a file that only reads is not', () => {
        const files = { 'a.js': 'document.createElement("div")', 'b.js': 'document.body.style.top = "0"', 'c.js': 'document.getElementById("app")', 'd.ts': 'host.appendChild(x)' }
        expect(writers(Object.keys(files), file => files[file])).toEqual(['a.js', 'b.js', 'd.ts'])
    })

    it('an exception that no longer writes the DOM, or is gone, is accused', () => {
        expect(findings([], { 'old.js': 'a reason that is long enough to count' }, () => true)).toHaveLength(1)
        expect(findings([], { 'old.js': 'a reason that is long enough to count' }, () => false)).toHaveLength(1)
    })
})
