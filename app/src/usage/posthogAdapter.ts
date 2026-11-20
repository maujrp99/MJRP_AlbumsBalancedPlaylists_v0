/**
 * UNPROVED — the PostHog adapter of the app (F78 REQ-15, F77): the usage port's `send` on
 * posthog-react-native, written against its documented API
 * (https://posthog.com/docs/libraries/react-native: `new PostHog(projectKey, { host })`,
 * `capture(name, properties)`; screen and touch autocapture and session replay are not used).
 *
 * OFF WITHOUT A KEY: `posthogAdapter(undefined)` is `null`, and the composition root then uses
 * `noUsage`. The project key is public by nature (it only lets events in; proposal § 8), and it
 * comes from the build's environment (EXPO_PUBLIC_POSTHOG_KEY), never from a file in the repository.
 *
 * Not run anywhere yet: proved when a device and the key exist and an event reaches PostHog
 * (tasks.md TASK-28). The only file of the app that imports posthog-react-native
 * (src/data/__tests__/nativePackagesStayInTheirAdapters.test.ts).
 */
import PostHog from 'posthog-react-native'
import type { UsageAdapter } from './usage'

/** PostHog's European cloud, the one the site's project uses (F77). */
export const POSTHOG_HOST = 'https://eu.i.posthog.com'

export function posthogAdapter(projectKey: string | undefined): UsageAdapter | null {
    if (!projectKey) return null
    const client = new PostHog(projectKey, { host: POSTHOG_HOST, captureAppLifecycleEvents: false })
    return {
        send: (event) => { client.capture(event.name, event.properties as Record<string, string | number | boolean>) }
    }
}
