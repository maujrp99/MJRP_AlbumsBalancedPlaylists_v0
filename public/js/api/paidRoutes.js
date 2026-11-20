/**
 * paidRoutes - the one place of the app that says who may use the server's paid routes (F70).
 *
 * The paid routes spend the AI key: POST /api/ai/* and POST /api/generate. The server answers
 * them only to a person signed in with an account (server/lib/auth/guards.js): the guest login
 * the app opens by itself is refused with 403. So a visitor does not ask: every caller of a paid
 * route asks `mayUsePaidRoutes()` first, and goes on without the paid answer when it says no.
 *
 * With no login known (the app is still starting, or the guest login failed) the answer is yes:
 * the call goes, the server answers 401 and the album load holds with its "sign in" notice
 * (api/serverResult.js). Only the visitor is known beforehand to be refused.
 *
 * The login read here is the same one api/serverFetch.js sends, so the two never disagree.
 * `createPaidRoutesGate` is pure (who is there is given to it); `mayUsePaidRoutes` is the one
 * wired to the app's Firebase login.
 */
import { auth } from '../firebase-init.js'

/** A visitor is on the app with the guest login: no account. */
export const isVisitor = (user) => Boolean(user && user.isAnonymous)

/**
 * @param {Object} deps
 * @param {Function} deps.getUser - () => the login of who is on the app ({ isAnonymous }), or null
 * @returns {Function} () => boolean, read on every ask: a visitor who signs in may from then on
 */
export function createPaidRoutesGate({ getUser }) {
    return () => !isVisitor(getUser())
}

export const mayUsePaidRoutes = createPaidRoutesGate({ getUser: () => auth.currentUser })
