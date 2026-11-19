/**
 * F59 - the database rules kept in the repository close every piece of personal data on its owner.
 * The repository's file had been left looser than the rules in force (rankings open to anyone, a
 * "DEBUG" note): deploying it would have opened production. This reads the file as text; it does
 * not run the rules.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8')
const withoutComments = rules.split('\n').map(line => line.replace(/\/\/.*$/, '')).join('\n')
const OWNER_ONLY = /allow\s+read\s*,\s*write\s*:\s*if\s+request\.auth\s*!=\s*null\s*&&\s*request\.auth\.uid\s*==\s*userId\s*;/

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
            expect(block.body, block.path).toMatch(OWNER_ONLY)
        })
    })

    it('the rankings of a person are among them', () => {
        const rankings = blocks.find(block => block.path.includes('albumRankings'))
        expect(rankings).toBeDefined()
        expect(rankings.body).toMatch(OWNER_ONLY)
    })
})
