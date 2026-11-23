/**
 * F82 TASK-01 (REQ-01, REQ-04, REQ-07): the Painel is only for the administrator. The route asks who the person is before it
 * asks for the Painel's file: a guest, another account, an account whose record says another role and a read that fails
 * are all «no», and the address then says «Page not found».
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import { createAdminAccess, createAdminGate } from '../../../public/js/services/content/adminAccess.js'

afterEach(() => { vi.restoreAllMocks() })

const owner = { uid: 'owner-1', isAnonymous: false }

describe('who is the administrator', () => {
    it('the account whose own record says «super»', async () => {
        const readAdmin = vi.fn(async () => ({ role: 'super' }))
        expect(await createAdminAccess({ currentUser: () => owner, readAdmin })()).toBe(true)
        expect(readAdmin).toHaveBeenCalledWith('owner-1')
    })

    it('never a guest (the anonymous login), and the record is not even asked for', async () => {
        const readAdmin = vi.fn(async () => ({ role: 'super' }))
        expect(await createAdminAccess({ currentUser: () => ({ uid: 'guest', isAnonymous: true }), readAdmin })()).toBe(false)
        expect(await createAdminAccess({ currentUser: () => null, readAdmin })()).toBe(false)
        expect(readAdmin).not.toHaveBeenCalled()
    })

    it('not an account with no record, nor one whose record says another role', async () => {
        expect(await createAdminAccess({ currentUser: () => owner, readAdmin: async () => null })()).toBe(false)
        expect(await createAdminAccess({ currentUser: () => owner, readAdmin: async () => ({ role: 'editor' }) })()).toBe(false)
    })

    it('a read that fails is «no», and it is said in the console, not swallowed', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const refused = Object.assign(new Error('refused'), { code: 'permission-denied' })
        expect(await createAdminAccess({ currentUser: () => owner, readAdmin: async () => { throw refused } })()).toBe(false)
        expect(warn).toHaveBeenCalledWith('[adminAccess] the administrator record could not be read:', 'permission-denied')
    })
})

describe('the gate of /admin', () => {
    const panel = { adminView: () => 'the Painel' }

    it('asks who the person is BEFORE it asks for the file of the Painel', async () => {
        const order = []
        const gate = createAdminGate({ isAdministrator: async () => { order.push('who'); return true }, notFound: () => 'not found' })
        expect(await gate(async () => { order.push('file'); return panel })).toBe('the Painel')
        expect(order).toEqual(['who', 'file'])
    })

    it('anybody else gets «not found», and the file of the Painel is never asked for', async () => {
        const loadPanel = vi.fn(async () => panel)
        const gate = createAdminGate({ isAdministrator: async () => false, notFound: () => 'not found' })
        expect(await gate(loadPanel)).toBe('not found')
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
