/**
 * adminAccess - is the person at this browser the administrator of the site? (F82, REQ-01, REQ-04, REQ-07)
 *
 * The gate of the Painel asks this BEFORE it asks for the Painel's file: the answer is the person's own record
 * `cmsAdmins/{uid}` (role «super»), which the database lets each person read only for themselves. A guest (the anonymous
 * login the app opens by itself), a person with no record, another role and a read the rules refuse are all «no»: the
 * address then says «not found». A read that fails, or that does not come within the deadline, is «could not check»:
 * never «yes», and the person is told to try again instead of waiting in front of a blank page. The rules of the database
 * are what truly keeps a stranger from saving; this only keeps the file from them.
 */
import { isSignedIn } from '../../utils/isSignedIn.js'

export const ADMINISTRATOR = 'administrator'
export const NOT_ADMINISTRATOR = 'not-administrator'
export const COULD_NOT_CHECK = 'could-not-check'

/** How long the read of the record may take: the deadline of the site's own reader (publishedContentReader.js, REQ-10). */
export const ADMIN_CHECK_DEADLINE_MS = 3000

const refusedByTheRules = (error) => String(error?.code ?? '').includes('permission-denied')

/** The promise, or a refusal named `deadline-exceeded` when it does not settle in time. */
function withDeadline(promise, ms) {
    let timer
    const late = new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('no answer in time'), { code: 'deadline-exceeded' })), ms) })
    return Promise.race([promise, late]).finally(() => clearTimeout(timer))
}

/**
 * @param {Object} deps
 * @param {() => (Object | null)} deps.currentUser - who is signed in now (the Firebase user, a guest included)
 * @param {(uid: string) => Promise<{ role?: string } | null>} deps.readAdmin - the person's own record, or null
 * @param {number} [deps.deadlineMs]
 * @returns {() => Promise<string>} ADMINISTRATOR, NOT_ADMINISTRATOR or COULD_NOT_CHECK
 */
export function createAdminAccess({ currentUser, readAdmin, deadlineMs = ADMIN_CHECK_DEADLINE_MS }) {
    return async function isAdministrator() {
        const user = currentUser()
        if (!isSignedIn(user)) return NOT_ADMINISTRATOR
        try {
            const record = await withDeadline(Promise.resolve().then(() => readAdmin(user.uid)), deadlineMs)
            return record?.role === 'super' ? ADMINISTRATOR : NOT_ADMINISTRATOR
        } catch (error) {
            if (refusedByTheRules(error)) return NOT_ADMINISTRATOR
            console.warn('[adminAccess] the administrator record could not be read:', error?.code || error?.message || error)
            return COULD_NOT_CHECK
        }
    }
}

/**
 * The gate of the Painel's address: the Painel for the administrator, «not found» for everybody else, and «could not
 * check» when the answer did not come. The file of the Painel is asked for only after the answer is exactly «administrator».
 * @param {Object} deps
 * @param {() => Promise<string>} deps.isAdministrator
 * @param {() => Object} deps.notFound - the view of an address with nothing to show
 * @param {() => Object} deps.couldNotCheck - the view that says the check could not be made
 * @returns {(loadPanel: () => Promise<{ adminView: () => Object }>) => Promise<Object>} the view the router draws
 */
export function createAdminGate({ isAdministrator, notFound, couldNotCheck }) {
    return async function adminRoute(loadPanel) {
        const answer = await isAdministrator()
        if (answer === COULD_NOT_CHECK) return couldNotCheck()
        if (answer !== ADMINISTRATOR) return notFound()
        const { adminView } = await loadPanel()
        return adminView()
    }
}
