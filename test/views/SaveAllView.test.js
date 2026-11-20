/**
 * F58 (UAT-14) - the migration screen brings no Firebase of its own: the route gives it the
 * migration utility (built on the app's one Firestore) and the way to know who is signed in.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../public/js/components/Toast.js', () => ({ default: { success: vi.fn(), error: vi.fn() }, showToast: vi.fn() }))

import { SaveAllView } from '../../public/js/views/SaveAllView.js'

describe('SaveAllView', () => {
    let migrationUtility

    beforeEach(() => {
        document.body.innerHTML = '<div id="app"></div>'
        migrationUtility = {
            isMigrationComplete: vi.fn(() => false),
            hasLocalStorageData: vi.fn(() => true),
            migrate: vi.fn(async () => { })
        }
    })

    const open = async (deps) => {
        const view = new SaveAllView(deps)
        document.getElementById('app').appendChild(await view.render())
        await view.mount()
        return view
    }

    it('uses the migration utility it is given, and says there is something to migrate', async () => {
        const view = await open({ migrationUtility, getUserId: () => 'user-1' })

        expect(view.hasPendingMigration()).toBe(true)
        expect(document.getElementById('startMigrationBtn').disabled).toBe(false)
    })

    it('migrates into the account of whoever is signed in when the button is pressed', async () => {
        const view = await open({ migrationUtility, getUserId: () => 'user-1' })

        await view.startMigration()

        expect(migrationUtility.migrate).toHaveBeenCalledTimes(1)
        expect(migrationUtility.migrate.mock.calls[0][0]).toBe('user-1')
    })

    it('with nobody signed in it migrates as the anonymous user, as before', async () => {
        const view = await open({ migrationUtility, getUserId: () => null })

        await view.startMigration()

        expect(migrationUtility.migrate.mock.calls[0][0]).toBe('anonymous-user')
    })
})
