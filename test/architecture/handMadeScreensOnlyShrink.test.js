// @vitest-environment node
/**
 * Fitness function of F83 (REQ-03, risk R1): the migration only goes forward. The screens made by hand are a list that
 * shrinks (handMadeScreensBaseline.js): the files of public/js/views and public/js/components, with their lines, and the
 * hand-made drawing that lives outside the two folders.
 *
 *   - a file that is not in the list fails: no new screen or component is made by hand (a new screen is born in React,
 *     in screens/ or ui/);
 *   - a file that grew by more than 20 lines fails: a small fix fits, a redesign does not;
 *   - an entry whose file is gone fails until the entry is removed: the list is lowered in the commit that deletes.
 *
 * What it cannot see: a "redesigned" screen that was never in React but that stayed under the line limit. That is review
 * (the proposal, § 11, «o que nenhum sensor prova»).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { HAND_MADE } from './handMadeScreensBaseline.js'

const ROOT = path.join(process.cwd(), 'public/js')
const GROWTH_ALLOWED = 20
const FOLDERS = ['views', 'components']

const walk = (dir) => fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)])
    : []

const linesOf = (file) => (fs.readFileSync(file, 'utf8').match(/\n/g) || []).length

/** The files the list watches today: everything of the two folders, and the files of the list that live outside them. */
export function currentFiles(root = ROOT, listed = HAND_MADE) {
    const inFolders = FOLDERS.flatMap(folder => walk(path.join(root, folder))).map(file => path.relative(root, file).split(path.sep).join('/'))
    const outside = Object.keys(listed).filter(file => !FOLDERS.some(folder => file.startsWith(`${folder}/`)) && fs.existsSync(path.join(root, file)))
    return Object.fromEntries([...inFolders, ...outside].sort().map(file => [file, linesOf(path.join(root, file))]))
}

/** What breaks the rule, given the files as they are and the list: one line per finding. */
export function findings(current, listed) {
    const out = []
    for (const [file, lines] of Object.entries(current)) {
        if (!(file in listed)) out.push(`${file}: a new hand-made file (a screen is born in React, in screens/ or ui/)`)
        else if (lines > listed[file] + GROWTH_ALLOWED) out.push(`${file}: grew from ${listed[file]} to ${lines} lines (more than ${GROWTH_ALLOWED})`)
    }
    for (const file of Object.keys(listed)) {
        if (!(file in current)) out.push(`${file}: gone (or moved): take it out of handMadeScreensBaseline.js`)
    }
    return out
}

describe('the hand-made screens only shrink (F83)', () => {
    it('the list is the size of the site: the files of today, with their lines', () => {
        // 102 files and 17,277 lines when the migration began; the list shrinks with each wave, so this only says it was not emptied
        // by accident (wave 1 took it to 93 files and 16,544 lines; wave 5a to 48 files and 9,262 lines; wave 5b to 40 files and 7,791 lines; wave 6a to 32 files and 5,858 lines; wave 6b to 24 files and 4,160 lines; wave 8b to 5 files and 788 lines; wave 7b to 17 files and 2,347 lines; wave 8a to 15 files and 1,744 lines; wave 8c to 3 files and 378 lines; wave 8d to 2 files and 200 lines): lower the bounds when a wave brings the list under them.
        expect(Object.keys(HAND_MADE).length).toBeGreaterThan(1)
        expect(Object.values(HAND_MADE).reduce((sum, lines) => sum + lines, 0)).toBeGreaterThan(100)
        expect(Object.keys(HAND_MADE)).toEqual(expect.arrayContaining(['views/BaseView.js', 'utils/pageScrollLock.js']))
    })

    it('the code of today breaks nothing: no new file, none grown by more than 20 lines, none gone', () => {
        expect(findings(currentFiles(), HAND_MADE)).toEqual([])
    })

    it('a new file under views/ or components/ is accused (the wrong example)', () => {
        const current = { ...currentFiles(), 'components/NewWidget.js': 12 }
        expect(findings(current, HAND_MADE)).toEqual(['components/NewWidget.js: a new hand-made file (a screen is born in React, in screens/ or ui/)'])
    })

    it('a file that grew by more than 20 lines is accused, one that grew by 20 is not', () => {
        const base = currentFiles()
        expect(findings({ ...base, 'views/BaseView.js': HAND_MADE['views/BaseView.js'] + 20 }, HAND_MADE)).toEqual([])
        expect(findings({ ...base, 'views/BaseView.js': HAND_MADE['views/BaseView.js'] + 21 }, HAND_MADE)).toHaveLength(1)
    })

    it('an entry whose file is gone is accused until it is taken out of the list', () => {
        const { 'views/BaseView.js': _gone, ...rest } = currentFiles() // eslint-disable-line no-unused-vars
        expect(findings(rest, HAND_MADE)).toEqual(['views/BaseView.js: gone (or moved): take it out of handMadeScreensBaseline.js'])
    })

    it('a new TypeScript file in views/ or components/ is accused too: React lives in screens/ and ui/', () => {
        expect(findings({ ...currentFiles(), 'views/NewScreen.tsx': 40 }, HAND_MADE)).toHaveLength(1)
    })
})
