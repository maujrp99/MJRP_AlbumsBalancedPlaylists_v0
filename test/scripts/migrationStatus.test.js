// @vitest-environment node
/**
 * F83 TASK-09 (REQ-03, REQ-09): the scoreboard of the migration (scripts/migration-status.mjs). It prints what is left to
 * migrate: the hand-made files and their lines, the React files, the bridges to old pieces, and the texts written outside the
 * dictionary. Tested over a small tree made here, and the command over the real site.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { statusOf, formatStatus } from '../../scripts/migration-status.mjs'

let root
const put = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), text)
}

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-'))
    put('views/A.js', "export const a = () => `<h1>Hello there</h1>`\n\n\n")
    put('components/B.js', "export const b = () => { toast.error('Could not save') }\n")
    put('components/sub/C.js', "export const c = 1\n")
    put('controllers/D.js', "export const d = () => { toast.success('Saved it') }\n")
    put('utils/SafeDOM.js', 'export const x = 1\n')
    put('screens/home/Home.tsx', "export const Home = () => <p>Loose text here</p>\n")
    put('screens/home/Clean.tsx', "export const Clean = () => <p>{t('home.title')}</p>\n")
    put('ui/Icon.tsx', 'export const Icon = () => null\n')
    put('react-bridge/ReactView.tsx', 'export const ReactView = 1\n')
    put('react-bridge/legacy/FilterBar.tsx', 'export const FilterBar = 1\n')
    put('screens/home/Uses.tsx', "import { FilterBar } from '../../react-bridge/legacy/FilterBar'\nexport const Uses = FilterBar\n")
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

describe('statusOf', () => {
    it('counts the hand-made files and their lines, in views/ and components/ and the listed drawing outside them', () => {
        const status = statusOf(root, { baseline: { 'views/A.js': 4, 'components/B.js': 1, 'components/sub/C.js': 1, 'utils/SafeDOM.js': 1, 'views/Gone.js': 50 } })
        expect(status.handMade.files).toBe(4)
        expect(status.handMade.lines).toBe(3 + 1 + 1 + 1)
        expect(status.handMade.baselineFiles).toBe(5)
        expect(status.handMade.baselineLines).toBe(57)
        expect(status.handMade.migratedFiles).toBe(1) // views/Gone.js is no longer there
    })

    it('counts the React files by folder, and the bridges to old pieces', () => {
        const status = statusOf(root, { baseline: {} })
        expect(status.react.files).toBe(6)
        expect(status.react.byFolder).toEqual({ screens: 3, ui: 1, shell: 0, 'react-bridge': 2 })
        expect(status.bridges.files).toBe(1)
        expect(status.bridges.uses).toBe(1)
    })

    it('counts the texts written outside the dictionary: hand-made screens, components and controllers, and loose text in TSX', () => {
        const status = statusOf(root, { baseline: {} })
        expect(status.texts.handMade).toBe(3) // the h1, the error notice, the success notice
        expect(status.texts.react).toBe(1) // the loose paragraph; the one that calls t() is clean
        expect(status.texts.total).toBe(4)
    })
})

describe('formatStatus and the command', () => {
    it('prints one line for each thing that is left', () => {
        const text = formatStatus(statusOf(root, { baseline: { 'views/A.js': 4 } }), '2026-11-21')
        expect(text).toMatch(/Migration status \(F83\), 2026-11-21/)
        expect(text).toMatch(/hand-made screens\s+\d+ files, \d+ lines/)
        expect(text).toMatch(/React screens and pieces\s+6 files/)
        expect(text).toMatch(/bridges to old pieces\s+1 file/)
        expect(text).toMatch(/texts outside the dictionary\s+4/)
    })

    it('runs over the real site: a hand-made list that is still long (it shrinks with each wave: 94 files after wave 1, 83 after wave 2) and no more files than the list of the day it began', () => {
        const run = spawnSync('node', ['scripts/migration-status.mjs', '--json'], { cwd: process.cwd(), encoding: 'utf8' })
        expect(run.status, run.stderr).toBe(0)
        const status = JSON.parse(run.stdout)
        expect(status.handMade.files).toBeGreaterThan(40)
        expect(status.handMade.baselineFiles).toBeGreaterThan(40)
        expect(status.handMade.files).toBeLessThanOrEqual(status.handMade.baselineFiles)
        expect(status.texts.handMade).toBeGreaterThan(500)
    })
})
