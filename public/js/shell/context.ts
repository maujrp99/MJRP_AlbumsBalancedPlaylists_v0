/**
 * What the shell is given by app.js (F83 wave 3), and the hooks every part of it reads it with.
 *
 * The router tells when a screen changed (`afterNavigate`); the shell keeps one number, `ticks`, that goes up at the end of each
 * navigation. A part of the page that the hand-made shell drew anew at each navigation takes it as its `key`; a part that only reads the
 * address draws again when it changes. The address is read from the window at the moment of drawing, as the hand-made code did.
 */
import { createContext, useContext, useSyncExternalStore } from 'react'
import { countListener } from '../react-bridge/listeners'
import { screenNameStore } from '../stores/screenName.js'
import type { Subscribable } from '../react-bridge/useStore'

/** The person the login says is on the app (a Firebase user, as far as the shell reads it). */
export interface ShellUser {
    isAnonymous?: boolean
    displayName?: string | null
    email?: string | null
    photoURL?: string | null
    providerData?: Array<{ providerId: string }>
}

export interface UserState {
    currentUser: ShellUser | null
    loading: boolean
}

export interface UserStoreLike extends Subscribable {
    getState(): UserState
}

export interface RouterLike {
    afterNavigate(hook: (path: string) => void): () => void
}

export interface RouteWatch {
    subscribe(listener: () => void): () => void
    ticks(): number
    stop(): void
}

export interface ShellDeps {
    userStore: UserStoreLike
    routeWatch: RouteWatch
    /** Forgets what the browser keeps about albums. */
    clearCaches: () => Promise<void>
    /** Loads the page again, so the albums in memory go too. */
    reload: () => void
}

/** Listens to the router for the life of the shell; at the end of each navigation the name a screen gave itself is forgotten (it lasts until the next screen). */
export function watchRoute(router: RouterLike): RouteWatch {
    let ticks = 0
    const listeners = new Set<() => void>()
    const stopHook = router.afterNavigate(() => {
        ticks += 1
        screenNameStore.clear()
        listeners.forEach(listener => listener())
    })
    return {
        subscribe: (listener) => {
            listeners.add(listener)
            const release = countListener()
            return () => {
                listeners.delete(listener)
                release()
            }
        },
        ticks: () => ticks,
        stop: () => {
            stopHook()
            listeners.clear()
        }
    }
}

export const ShellContext = createContext<ShellDeps | null>(null)

export function useShell(): ShellDeps {
    const deps = useContext(ShellContext)
    if (!deps) throw new Error('The shell is drawn without its dependencies')
    return deps
}

/** The number of navigations the shell has heard; the part that reads it draws again at each one. */
export function useRouteTicks(): number {
    const { routeWatch } = useShell()
    return useSyncExternalStore(routeWatch.subscribe, routeWatch.ticks)
}
