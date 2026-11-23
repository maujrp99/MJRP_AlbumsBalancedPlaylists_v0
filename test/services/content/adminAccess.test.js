/**
 * F82 TASK-01 (REQ-01, REQ-04, REQ-07): the Painel is only for the administrator. The route asks who the person is before it
 * asks for the Painel's file: a guest, another account, an account whose record says another role and a read that fails
 * are all «no», and the address then says «Page not found».
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import { createAdminAccess, createAdminGate, ADMINISTRATOR, NOT_ADMINISTRATOR, COULD_NOT_CHECK, ADMIN_CHECK_DEADLINE_MS } from '../../../public/js/services/content/adminAccess.js'

afterEach(() => { vi.restoreAllMocks() })

const owner = { uid: 'owner-1', isAnonymous: false }

describe('who is the administrator', () => {
    it('the account whose own record says «super»', async () => {
        const readAdmin = vi.fn(async () => ({ role: 'super' }))
        expect(await createAdminAccess({ currentUser: () => owner, readAdmin })()).toBe(ADMINISTRATOR)
        expect(readAdmin).toHaveBeenCalledWith('owner-1')
    })

    it('never a guest (the anonymous login), and the record is not even asked for', async () => {
        const readAdmin = vi.fn(async () => ({ role: 'super' }))
        expect(await createAdminAccess({ currentUser: () => ({ uid: 'guest', isAnonymous: true }), readAdmin })()).toBe(NOT_ADMINISTRATOR)
        expect(await createAdminAccess({ currentUser: () => null, readAdmin })()).toBe(NOT_ADMINISTRATOR)
        expect(readAdmin).not.toHaveBeenCalled()
    })

    it('not an account with no record, nor one whose record says another role, nor one the rules refuse', async () => {
        const refused = Object.assign(new Error('refused'), { code: 'permission-denied' })
        expect(await createAdminAccess({ currentUser: () => owner, readAdmin: async () => null })()).toBe(NOT_ADMINISTRATOR)
        expect(await createAdminAccess({ currentUser: () => owner, readAdmin: async () => ({ role: 'editor' }) })()).toBe(NOT_ADMINISTRATOR)
        expect(await createAdminAccess({ currentUser: () => owner, readAdmin: async () => { throw refused } })()).toBe(NOT_ADMINISTRATOR)
    })

    it('a read that fails is «could not check», never «yes», and it is said in the console, not swallowed', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const down = Object.assign(new Error('down'), { code: 'unavailable' })
        expect(await createAdminAccess({ currentUser: () => owner, readAdmin: async () => { throw down } })()).toBe(COULD_NOT_CHECK)
        expect(warn).toHaveBeenCalledWith('[adminAccess] the administrator record could not be read:', 'unavailable')
    })

    it('a database that does not answer in 3 seconds is «could not check»: nobody waits longer (the judge of 2026-11-23, P2-6)', async () => {
        vi.useFakeTimers()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            expect(ADMIN_CHECK_DEADLINE_MS).toBe(3000)
            const asked = createAdminAccess({ currentUser: () => owner, readAdmin: () => new Promise(() => {}) })()
            let answer = 'waiting'
            asked.then(value => { answer = value })
            await vi.advanceTimersByTimeAsync(2999)
            expect(answer).toBe('waiting')
            await vi.advanceTimersByTimeAsync(1)
            expect(answer).toBe(COULD_NOT_CHECK)
        } finally {
            vi.useRealTimers()
        }
    })
})

describe('the gate of /admin', () => {
    const panel = { adminView: () => 'the Painel' }
    const views = { notFound: () => 'not found', couldNotCheck: () => 'could not check' }

    it('asks who the person is BEFORE it asks for the file of the Painel', async () => {
        const order = []
        const gate = createAdminGate({ isAdministrator: async () => { order.push('who'); return ADMINISTRATOR }, ...views })
        expect(await gate(async () => { order.push('file'); return panel })).toBe('the Painel')
        expect(order).toEqual(['who', 'file'])
    })

    it('anybody else gets «not found», and the file of the Painel is never asked for', async () => {
        const loadPanel = vi.fn(async () => panel)
        const gate = createAdminGate({ isAdministrator: async () => NOT_ADMINISTRATOR, ...views })
        expect(await gate(loadPanel)).toBe('not found')
        expect(loadPanel).not.toHaveBeenCalled()
    })

    it('when the check could not be made the person is told so, and the file of the Painel is still not asked for', async () => {
        const loadPanel = vi.fn(async () => panel)
        const gate = createAdminGate({ isAdministrator: async () => COULD_NOT_CHECK, ...views })
        expect(await gate(loadPanel)).toBe('could not check')
        expect(loadPanel).not.toHaveBeenCalled()
    })

    it('anything that is not exactly «administrator» keeps the Painel closed', async () => {
        const loadPanel = vi.fn(async () => panel)
        for (const answer of [true, 'yes', undefined, null]) {
            expect(await createAdminGate({ isAdministrator: async () => answer, ...views })(loadPanel)).toBe('not found')
        }
        expect(loadPanel).not.toHaveBeenCalled()
    })
})

describe('what every visitor downloads for /admin: the door only (the judge of 2026-11-23, P2-1)', () => {
    const app = fs.readFileSync('public/js/app.js', 'utf8')
    const statics = app.split('\n').filter(line => /^import /.test(line)).join('\n')

    it('app.js imports neither the check of the administrator, nor «not found», nor the content of the Painel: they come with the gate', () => {
        expect(statics).not.toMatch(/adminAccess|adminContent|NotFound|screens\/admin/)
        expect(app).toContain("loadScreen(() => import('./screens/admin/gate.ts'))")
        expect(app).toContain("loadScreen(() => import('./screens/admin/adminPanel.ts'))")
    })

    it('the route hands the gate the way to load the Painel, and neither file comes down in the background', () => {
        expect(app).toMatch(/const adminRoute = async \(\) => \(await loadAdminGate\(\)\)\.adminRoute\(loadAdmin\)/)
        const background = app.slice(app.indexOf('prefetchScreensAfterTheFirstScreen(router, ['))
        expect(background.slice(0, background.indexOf(')'))).not.toMatch(/loadAdmin/)
    })
})
