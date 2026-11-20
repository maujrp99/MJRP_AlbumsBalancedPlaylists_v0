/**
 * F52, slice 5 - the prompts file (config/prompts.json). A server without its prompts is a broken
 * deploy: `loadPrompts` throws when the file is missing, unreadable, not JSON, or without one of
 * the prompts a route needs. Before, all of that became `{}` with a line in the log, and the paid
 * routes ran with no prompt. The server loads the prompts when it starts, so it does not start
 * without them (server/index.js), and the deploy's smoke test stops there.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { createPromptsLoader, loadPrompts, requirePrompt, renderPrompt, PromptsError, REQUIRED_PROMPTS } = require('../../server/lib/prompts.js')

const GOOD = { albumSearchPrompt: 'find {{albumQuery}}', rankingPrompt: 'rank {{albumTitle}}', defaultRankingProviders: ['NME'] }
/** A file system with these files: path -> text, or an Error to throw when it is read. */
const fsWith = (files) => ({
    existsSync: (file) => file in files,
    readFileSync: (file) => {
        if (files[file] instanceof Error) throw files[file]
        return files[file]
    }
})
const loaderWith = (files, paths = ['/image/config/prompts.json', '/repo/config/prompts.json']) => createPromptsLoader({ fs: fsWith(files), paths })

describe('loadPrompts: the file is read once, from the first place it is in', () => {
    it('gives the prompts of the file', () => {
        expect(loaderWith({ '/repo/config/prompts.json': JSON.stringify(GOOD) })()).toEqual(GOOD)
    })

    it('the place of the image is read before the place of the repository', () => {
        const inImage = { ...GOOD, rankingPrompt: 'from the image' }
        const load = loaderWith({ '/image/config/prompts.json': JSON.stringify(inImage), '/repo/config/prompts.json': JSON.stringify(GOOD) })

        expect(load().rankingPrompt).toBe('from the image')
    })

    it('reads the file once', () => {
        let reads = 0
        const fs = { existsSync: () => true, readFileSync: () => { reads++; return JSON.stringify(GOOD) } }
        const load = createPromptsLoader({ fs, paths: ['/p'] })
        load()
        load()

        expect(reads).toBe(1)
    })
})

describe('loadPrompts: a file that cannot be used is thrown, never read as "no prompts"', () => {
    const unreadable = Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })

    it.each([
        ['is missing', {}, /the file is missing/],
        ['cannot be read', { '/repo/config/prompts.json': unreadable }, /could not be read \(EACCES\)/],
        ['is not JSON', { '/repo/config/prompts.json': '{ "albumSearchPrompt": ' }, /is not valid JSON/],
        ['is empty', { '/repo/config/prompts.json': '{}' }, /it has no "albumSearchPrompt"/],
        ['is a list', { '/repo/config/prompts.json': '["a prompt"]' }, /is not an object of prompts/],
        ['has no ranking prompt', { '/repo/config/prompts.json': JSON.stringify({ albumSearchPrompt: 'find' }) }, /it has no "rankingPrompt"/],
        ['has a blank prompt', { '/repo/config/prompts.json': JSON.stringify({ ...GOOD, rankingPrompt: '   ' }) }, /it has no "rankingPrompt"/],
        ['has a prompt that is not text', { '/repo/config/prompts.json': JSON.stringify({ ...GOOD, albumSearchPrompt: 42 }) }, /it has no "albumSearchPrompt"/]
    ])('the file %s', (name, files, message) => {
        const load = loaderWith(files)

        expect(load).toThrow(PromptsError)
        expect(load).toThrow(message)
    })

    it('says so in the words the deploy looks for in the start log ("could not load")', () => {
        expect(() => loaderWith({})()).toThrow(/^Could not load config\/prompts\.json/)
        const deploy = readFileSync(require.resolve('../../scripts/deploy-server.sh'), 'utf8')
        expect(deploy).toContain('grep -qiE "could not load|')
    })

    it('a failure is not remembered: the file is read again on the next call', () => {
        const files = {}
        const load = loaderWith(files)
        expect(load).toThrow(PromptsError)

        files['/repo/config/prompts.json'] = JSON.stringify(GOOD)
        expect(load()).toEqual(GOOD)
    })
})

describe('requirePrompt: how a route reads a prompt', () => {
    it('gives the template', () => {
        expect(requirePrompt(GOOD, 'rankingPrompt')).toBe('rank {{albumTitle}}')
    })

    it.each([[{}], [null], [{ rankingPrompt: '' }], [{ rankingPrompt: ['rank'] }]])('a prompt that is not there is thrown: %j', (prompts) => {
        expect(() => requirePrompt(prompts, 'rankingPrompt')).toThrow(PromptsError)
    })
})

describe('the prompts file of this repository', () => {
    it('loads, with the prompts the routes need (what the deploy\'s smoke test checks: at least one group)', () => {
        const prompts = loadPrompts()

        expect(Object.keys(prompts).length).toBeGreaterThan(0)
        REQUIRED_PROMPTS.forEach(name => expect(typeof requirePrompt(prompts, name)).toBe('string'))
    })

    it('the server loads its prompts when it starts', () => {
        const index = readFileSync(require.resolve('../../server/index.js'), 'utf8')

        expect(index).toMatch(/^loadPrompts\(\)/m)
    })
})

describe('renderPrompt', () => {
    it('fills the names in braces, and leaves an unknown name empty', () => {
        expect(renderPrompt('rank {{ albumTitle }} ({{albumYear}}) {{nothing}}', { albumTitle: 'Album', albumYear: 0 })).toBe('rank Album (0) ')
    })
})
