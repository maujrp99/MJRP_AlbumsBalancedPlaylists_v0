/**
 * The app's side of the usage port (F78 REQ-15, F77): every event goes through the ONE closed list
 * of the core (shared/usageEvents.js `describeEvent`): an unknown name is refused, a property not on
 * the event's list is dropped, no free text fits. The same names as the site's.
 *
 * Adapters (each a `send(event)`):
 *   noUsage            off: nothing leaves the device (the default, and with no key)
 *   memoryUsage        keeps what would be sent, for the tests and for the diagnostics screen
 *   posthogAdapter.ts  PostHog for React Native: on only with a project key. UNPROVED until a
 *                      device and the key exist (tasks.md TASK-22, TASK-28)
 *
 * Measuring never stands in the way of the app: `track` never throws.
 */
import { describeEvent } from '@album-blender/shared/usageEvents.js'

export type UsageEvent = { name: string; properties: Record<string, unknown> }

export interface UsageAdapter {
    send(event: UsageEvent): void
}

export const noUsage: UsageAdapter = { send: () => {} }

export function memoryUsage(): UsageAdapter & { sent: UsageEvent[] } {
    const sent: UsageEvent[] = []
    return { sent, send: (event) => { sent.push(event) } }
}

export interface Usage {
    /** @returns true when the event was handed to the adapter */
    track(name: string, properties?: Record<string, unknown>): boolean
}

export function createUsage(adapter: UsageAdapter): Usage {
    return {
        track(name, properties = {}) {
            try {
                const event = describeEvent(name, properties)
                if (!event.ok) {
                    console.warn(`[usage] "${name}" is not an event of shared/usageEvents.js: not sent`)
                    return false
                }
                adapter.send({ name: event.name, properties: event.properties as Record<string, unknown> })
                return true
            } catch (error) {
                console.warn('[usage] the event could not be handed on:', error instanceof Error ? error.message : error)
                return false
            }
        }
    }
}
