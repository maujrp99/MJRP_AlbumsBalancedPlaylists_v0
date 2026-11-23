/**
 * F82 TASK-01 (REQ-01, REQ-04, REQ-07): the Painel is only for the administrator. The route asks who the person is before it
 * asks for the Painel's file: a guest, another account, an account whose record says another role and a read that fails
 * are all «no», and the address then says «Page not found».
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import { createAdminAccess } from '../../../public/js/services/content/adminAccess.js'
import { notFoundView } from '../../../public/js/utils/notFoundView.js'

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

describe('what everybody else sees at /admin', () => {
    it('«Page not found», with the way back to the app, and nothing of the Painel', () => {
        const host = document.createElement('div')
        host.innerHTML = notFoundView().render()
        expect(host.querySelector('[data-screen="not-found"] .text-xl')?.textContent).toBe('Page not found')
        expect(host.querySelector('a')?.getAttribute('href')).toBe('/start')
        expect(host.textContent).not.toMatch(/admin|Painel/i)
    })
})

describe('the route of the Painel in app.js', () => {
    const app = fs.readFileSync('public/js/app.js', 'utf8')
    const route = app.slice(app.indexOf('const adminRoute'), app.indexOf("router.register('/admin'"))

    it('reads the administrator record before it asks for the file of the Painel', () => {
        const guard = route.indexOf('if (!(await isAdministrator())) return notFoundView()')
        expect(guard).toBeGreaterThan(-1)
        expect(route.indexOf('loadAdmin()')).toBeGreaterThan(guard)
    })

    it('asks for the file only there: not among the screens that come down in the background, and by no static import', () => {
        const background = app.slice(app.indexOf('prefetchScreensAfterTheFirstScreen(router, ['))
        expect(background.slice(0, background.indexOf(')'))).not.toContain('loadAdmin')
        expect(app.match(/screens\/admin/g)).toEqual(['screens/admin'])
        expect(app).toContain("loadScreen(() => import('./screens/admin/index.ts'))")
    })
})
