/**
 * Scripted runs of the demo on the iOS Simulator (F78): the launch arguments say whom to sign in and
 * which route to open, so a script reaches every screen with no tap:
 *
 *   xcrun simctl launch booted com.mjrp.albumblender -demoSignIn apple -demoRoute "/diagnostics?run=1"
 *
 * Why not only links (albumblender://…): `simctl openurl` makes iOS ask «Open in “Album Blender”?»,
 * and with no tap nobody answers. iOS puts `-key value` launch arguments in the app's user defaults,
 * which React Native's `Settings` reads (iOS only). Demo mode only: the root layout mounts this
 * runner only when the composition root chose the demo; in the Firebase build it does nothing.
 */
import { useEffect, useRef, useState } from 'react'
import { Platform, Settings } from 'react-native'
import { usePathname, useRootNavigationState, useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import type { Provider } from '../auth/authPort'
import { useAccount, useServices } from '../ui/AppServicesContext'

export interface DemoLaunch {
    signIn?: Provider
    route?: string
}

type Read = (key: string) => unknown

const fromSettings: Read = key => (Platform.OS === 'ios' ? Settings.get(key) : undefined)

/** What the launch arguments ask, keeping only what is valid: a provider, and a route that starts with «/». */
export function readDemoLaunch(read: Read = fromSettings): DemoLaunch {
    const signIn = read('demoSignIn')
    const route = read('demoRoute')
    return {
        ...(signIn === 'apple' || signIn === 'google' ? { signIn } : {}),
        ...(typeof route === 'string' && route.startsWith('/') ? { route } : {})
    }
}

/** Signs in and opens the route the launch arguments ask, once. Renders nothing. */
export function DemoLaunchRunner({ given }: { given?: DemoLaunch }) {
    const [launch] = useState(() => given ?? readDemoLaunch()) // read once, at launch
    const { auth, mode } = useServices()
    const account = useAccount()
    const router = useRouter()
    const ready = !!useRootNavigationState()?.key
    const pathname = usePathname()
    const signInStarted = useRef(false)
    const routed = useRef(false)

    useEffect(() => {
        if (mode !== 'demo' || !ready || routed.current || account === undefined) return
        if (launch.signIn && account === null) {
            if (!signInStarted.current) {
                signInStarted.current = true
                void auth.signIn(launch.signIn)
            }
            return // the account changes, and this runs again
        }
        if (account && pathname === '/sign-in') return // the sign-in screen's own redirect to Albums goes first
        routed.current = true
        if (launch.route) router.push(launch.route as Href)
    }, [mode, ready, account, pathname, auth, router, launch])

    return null
}
