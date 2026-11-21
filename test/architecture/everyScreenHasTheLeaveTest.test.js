// @vitest-environment node
/**
 * Fitness function of F83 (REQ-01, risk R2): a screen that is left hears nothing. Every folder of public/js/screens/ and
 * public/js/shell/ has, under test/screens/<name>/ (test/shell/ for the shell), a test written with the mold of
 * test/support/renderScreen.tsx: `itLeavesNoListeners(...)`, which enters and leaves the screen five times and counts the
 * listeners of the screen (stores, language, phone) with `bridgeListenerCount()`; zero is the answer.
 *
 * What it proves: that the test exists for each screen. That it is a good test is the mold's job, and the mold has its own
 * test.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const REPO = process.cwd()
const MOLD_CALL = 'itLeavesNoListeners('

const folders = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name) : []
const testsIn = (dir) => fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? testsIn(path.join(dir, entry.name)) : /\.test\.tsx?$/.test(entry.name) ? [path.join(dir, entry.name)] : [])
    : []

/** The folders that have no leave test, given the folders and a reader of the tests of each. */
export function withoutTheLeaveTest(names, testTextsOf) {
    return names.filter(name => !testTextsOf(name).some(text => text.includes(MOLD_CALL)))
}

const screenTexts = (name) => testsIn(path.join(REPO, 'test/screens', name)).map(file => fs.readFileSync(file, 'utf8'))
const shellTexts = () => testsIn(path.join(REPO, 'test/shell')).map(file => fs.readFileSync(file, 'utf8'))

describe('every screen has the leave test (F83)', () => {
    it('each folder of screens/ has a test that calls the mold', () => {
        expect(withoutTheLeaveTest(folders(path.join(REPO, 'public/js/screens')), screenTexts)).toEqual([])
    })

    it('the shell, when it exists, has one too', () => {
        const hasShell = fs.existsSync(path.join(REPO, 'public/js/shell'))
        expect(hasShell ? withoutTheLeaveTest(['shell'], () => shellTexts()) : []).toEqual([])
    })

    it('a screen with no test, or with a test that does not call the mold, is accused (the wrong examples)', () => {
        const texts = { 'a-screen': ["it('draws', () => {})"], 'b-screen': ["itLeavesNoListeners('b', B)"], 'c-screen': [] }
        expect(withoutTheLeaveTest(Object.keys(texts), name => texts[name])).toEqual(['a-screen', 'c-screen'])
    })
})
