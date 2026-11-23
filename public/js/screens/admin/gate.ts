/**
 * The gate of the Painel's address, put together (F82, REQ-01): who is signed in, their own administrator record, and
 * «Page not found» for everybody else, and «Could not check right now» when the database does not answer within 3 seconds. A file of its own that comes down only when somebody opens /admin: the main script
 * carries the door alone (app.js), not the check nor the view (the judge of 2026-11-23, P2-1).
 */
import { ReactView } from '../../react-bridge/ReactView'
import { AuthService } from '../../services/AuthService.js'
import { createAdminAccess, createAdminGate } from '../../services/content/adminAccess.js'
import { readAdminRecord } from '../../services/content/adminContent.js'
import { CouldNotCheck, NotFound } from '../../ui/NotFound'

/** What the route of /admin answers: the Painel for the administrator (its file is asked for only then), «not found» otherwise. */
export const adminRoute = createAdminGate({
    isAdministrator: createAdminAccess({ currentUser: () => AuthService.getCurrentUser(), readAdmin: readAdminRecord }),
    notFound: () => new ReactView(NotFound, {}, { screen: 'admin' }),
    couldNotCheck: () => new ReactView(CouldNotCheck, {}, { screen: 'admin' }),
})
