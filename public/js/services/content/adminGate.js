/**
 * adminGate - the gate of the Painel's address, put together (F82, REQ-01): who is signed in, their own administrator
 * record, and «Page not found» for everybody else. It is a file of its own that comes down only when somebody opens
 * /admin: the main script carries the door alone (app.js), not the check nor the view (the judge of 2026-11-23, P2-1).
 */
import { AuthService } from '../AuthService.js'
import { notFoundView } from '../../utils/notFoundView.js'
import { createAdminAccess, createAdminGate } from './adminAccess.js'
import { readAdminRecord } from './adminContent.js'

/** What the route of /admin answers: the Painel for the administrator (its file is asked for only then), «not found» otherwise. */
export const adminRoute = createAdminGate({
    isAdministrator: createAdminAccess({ currentUser: () => AuthService.getCurrentUser(), readAdmin: readAdminRecord }),
    notFound: notFoundView
})
