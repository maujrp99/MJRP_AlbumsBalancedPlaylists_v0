/**
 * adminAccess - is the person at this browser the administrator of the site? (F82, REQ-01, REQ-04, REQ-07)
 *
 * The route of the Painel asks this BEFORE it asks for the Painel's file: the answer is the person's own record
 * `cmsAdmins/{uid}` (role «super»), which the database lets each person read only for themselves. A guest (the anonymous
 * login the app opens by itself), a person with no record and a read that fails are all «no»: the address then says
 * «not found». The rules of the database are what truly keeps a stranger from saving; this only keeps the file from them.
 */
import { isSignedIn } from '../../utils/isSignedIn.js'

/**
 * @param {Object} deps
 * @param {() => (Object | null)} deps.currentUser - who is signed in now (the Firebase user, a guest included)
 * @param {(uid: string) => Promise<{ role?: string } | null>} deps.readAdmin - the person's own record, or null
 * @returns {() => Promise<boolean>}
 */
export function createAdminAccess({ currentUser, readAdmin }) {
    return async function isAdministrator() {
        const user = currentUser()
        if (!isSignedIn(user)) return false
        try {
            const record = await readAdmin(user.uid)
            return record?.role === 'super'
        } catch (error) {
            console.warn('[adminAccess] the administrator record could not be read:', error?.code || error?.message || error)
            return false
        }
    }
}

/**
 * The gate of the Painel's address: the Painel for the administrator, «not found» for everybody else. The file of the
 * Painel is asked for only after the answer is yes.
 * @param {Object} deps
 * @param {() => Promise<boolean>} deps.isAdministrator
 * @param {() => Object} deps.notFound - the view of an address with nothing to show
 * @returns {(loadPanel: () => Promise<{ adminView: () => Object }>) => Promise<Object>} the view the router draws
 */
export function createAdminGate({ isAdministrator, notFound }) {
    return async function adminRoute(loadPanel) {
        if (!(await isAdministrator())) return notFound()
        const { adminView } = await loadPanel()
        return adminView()
    }
}
