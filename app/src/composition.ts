/**
 * The composition root of the app (F78): which store, which account and which usage adapter the
 * screens get. Decided once, from the build's public environment:
 *
 *   EXPO_PUBLIC_DATA_MODE=firebase   the real adapters: React Native Firebase (store and auth) and,
 *                                    with EXPO_PUBLIC_POSTHOG_KEY, PostHog. ALL UNPROVED until a
 *                                    device exists (spike S2, TASK-19, TASK-22).
 *   anything else (the default)      the demo mode: the in-memory store seeded with public catalog
 *                                    albums, the fake account, no usage sent.
 *
 * The real adapters are loaded with `require` inside the function, so the demo build bundles them
 * (Metro must resolve them: that is checked by `expo export`) but never runs them.
 */
import type { AppStore } from './data/store'
import type { AuthPort } from './auth/authPort'
import type { Usage } from './usage/usage'
import { createMemoryStore } from './data/memoryStore'
import { createFakeAuth } from './auth/fakeAuth'
import { createUsage, noUsage } from './usage/usage'
import { DEMO_USER_ID, seedDemo } from './demo/demoSeed'

export type DataMode = 'demo' | 'firebase'

export interface AppServices {
    mode: DataMode
    store: AppStore
    auth: AuthPort
    usage: Usage
}

export const dataModeOf = (value: string | undefined): DataMode => (value === 'firebase' ? 'firebase' : 'demo')

export function demoServices(): AppServices {
    const store = createMemoryStore({ readDelayMs: 400 })
    seedDemo(store, DEMO_USER_ID)
    return { mode: 'demo', store, auth: createFakeAuth({ uid: DEMO_USER_ID, delayMs: 300 }), usage: createUsage(noUsage) }
}

/* eslint-disable @typescript-eslint/no-require-imports -- lazy on purpose: the demo build never runs the native adapters */
function firebaseServices(): AppServices {
    const { firebaseStore } = require('./data/firebaseStore') as typeof import('./data/firebaseStore')
    const { createNativeAuth } = require('./auth/nativeAuth') as typeof import('./auth/nativeAuth')
    const { posthogAdapter } = require('./usage/posthogAdapter') as typeof import('./usage/posthogAdapter')
    return {
        mode: 'firebase',
        store: firebaseStore(),
        auth: createNativeAuth(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''),
        usage: createUsage(posthogAdapter(process.env.EXPO_PUBLIC_POSTHOG_KEY) ?? noUsage)
    }
}
/* eslint-enable @typescript-eslint/no-require-imports */

export function composeServices(mode: DataMode = dataModeOf(process.env.EXPO_PUBLIC_DATA_MODE)): AppServices {
    return mode === 'firebase' ? firebaseServices() : demoServices()
}
