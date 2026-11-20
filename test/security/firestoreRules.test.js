/**
 * F59 - the database rules kept in the repository close every piece of personal data on its owner.
 * The repository's file had been left looser than the rules in force (rankings open to anyone, a
 * "DEBUG" note): deploying it would have opened production. This reads the file as text; it does
 * not run the rules.
 *
 * F78, REQ-10: on the paths the repositories write (series and playlists, inventory, rankings, the
 * Spotify answers), an update never lowers `_schemaVersion`. Creating and deleting a document stay
 * as they were. The file is published by the owner (`firebase deploy --only firestore:rules`).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8')
const withoutComments = rules.split('\n').map(line => line.replace(/\/\/.*$/, '')).join('\n')
const OWNER = /^request\.auth\s*!=\s*null\s*&&\s*request\.auth\.uid\s*==\s*userId\b/

/** The `allow` statements of a block: which operations, on which condition. */
const allowsOf = (body) => [...body.matchAll(/allow\s+([\w\s,]+?)\s*:\s*if\s+([^;]+);/g)]
    .map(([, ops, condition]) => ({ ops: ops.split(',').map(op => op.trim()), condition: condition.trim() }))

/** The operations a block allows, `write` spelled out as create, update and delete. */
const operationsOf = (body) => new Set(allowsOf(body).flatMap(({ ops }) => ops.flatMap(op => (op === 'write' ? ['create', 'update', 'delete'] : [op]))))

/** The paths the repositories of shared/data/ write, and where a version could go down. */
const REPOSITORY_PATHS = [
    '/artifacts/{appId}/users/{userId}/curator/{document=**}',
    '/artifacts/{appId}/users/{userId}/inventory/{document=**}',
    '/users/{userId}/albumRankings/{albumId}',
    '/spotify_enrichment/{albumKey}'
]
const KEEPS_VERSION = /\bkeepsSchemaVersion\(\)/

const blocks = [...withoutComments.matchAll(/match\s+(\/[^\s{]*(?:\{[^}]*\}[^\s{]*)*)\s*\{([^{}]*)\}/g)]
    .map(([, path, body]) => ({ path, body }))
    .filter(block => /allow\s/.test(block.body))

describe('firestore.rules (F59)', () => {
    it('is read: the file has rules to check', () => {
        expect(blocks.length).toBeGreaterThanOrEqual(6)
    })

    it('never allows without a condition', () => {
        expect(withoutComments).not.toMatch(/allow[^;]*:\s*if\s+true\s*;/)
    })

    it('every rule asks for a signed-in person', () => {
        blocks.forEach(block => {
            expect(block.body, block.path).toMatch(/request\.auth\s*!=\s*null/)
        })
    })

    it('whatever lives under a person is read and written by that person only', () => {
        const personal = blocks.filter(block => block.path.includes('{userId}'))
        expect(personal.length).toBeGreaterThanOrEqual(5)
        personal.forEach(block => {
            expect([...operationsOf(block.body)].sort(), block.path).toEqual(['create', 'delete', 'read', 'update'])
            allowsOf(block.body).forEach(({ condition }) => expect(condition, block.path).toMatch(OWNER))
        })
    })

    it('the rankings of a person are among them', () => {
        const rankings = blocks.find(block => block.path.includes('albumRankings'))
        expect(rankings).toBeDefined()
        allowsOf(rankings.body).forEach(({ condition }) => expect(condition).toMatch(OWNER))
    })
})

describe('firestore.rules: _schemaVersion never goes down (F78, REQ-10)', () => {
    const block = (path) => blocks.find(b => b.path === path)

    it('the version is compared as the code stamps it: absent counts as 0, the write against the stored', () => {
        const fn = withoutComments.match(/function\s+keepsSchemaVersion\s*\(\s*\)\s*\{([^}]*)\}/)
        expect(fn).not.toBeNull()
        expect(fn[1].replace(/\s+/g, ' ').trim()).toBe(
            "return request.resource.data.get('_schemaVersion', 0) >= resource.data.get('_schemaVersion', 0);")
    })

    it('on every path a repository writes, an update must keep the version, and nothing else is allowed an update', () => {
        REPOSITORY_PATHS.forEach(path => {
            const allows = allowsOf(block(path)?.body ?? '')
            expect(allows.length, path).toBeGreaterThan(0)
            const updates = allows.filter(({ ops }) => ops.includes('update') || ops.includes('write'))
            expect(updates.length, path).toBe(1)
            expect(updates[0].ops, path).toEqual(['update'])
            expect(updates[0].condition, path).toMatch(KEEPS_VERSION)
        })
    })

    it('creating, reading and deleting stay as they were: the same condition, with no version asked', () => {
        REPOSITORY_PATHS.forEach(path => {
            const others = allowsOf(block(path).body).filter(({ ops }) => !ops.includes('update'))
            expect(new Set(others.flatMap(({ ops }) => ops)), path).toEqual(new Set(['read', 'create', 'delete']))
            others.forEach(({ condition }) => expect(condition, path).not.toMatch(KEEPS_VERSION))
            const update = allowsOf(block(path).body).find(({ ops }) => ops.includes('update'))
            others.forEach(({ condition }) => expect(update.condition, path).toBe(`${condition} && keepsSchemaVersion()`))
        })
    })

    it('the paths no repository writes today are left as they were (legacy documents may carry version 2)', () => {
        blocks.filter(b => !REPOSITORY_PATHS.includes(b.path)).forEach(b => {
            expect(b.body, b.path).not.toMatch(KEEPS_VERSION)
        })
    })
})
