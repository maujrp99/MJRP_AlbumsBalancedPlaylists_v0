/**
 * userSession - where the user store is put together with the real login (the app has no
 * Composition Root yet; like services/albums/albumLoading.js, this is the one place that knows
 * which login serves the session).
 *
 * Importing this file starts the listening: from then on stores/UserStore.js says who is on the
 * app. app.js imports it right after Firebase starts, before any screen.
 */

import { authService } from '@shared/services/AuthService.js'
import { userStore } from '../../stores/UserStore.js'
import { UserSessionService } from './UserSessionService.js'

export const userSessionService = new UserSessionService({ auth: authService, store: userStore })

userSessionService.start()
