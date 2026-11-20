/**
 * memoryAdapter - the debug adapter of the measurement (F77). With localStorage `mjrp.usage` =
 * `debug`, every event the app would send is kept in `window.__usageEvents`, on the page, and is
 * sent nowhere. It exists to see what is measured, in a real browser, without a project key.
 */

/**
 * @param {Window} win - where the list is put
 * @param {Function} [now]
 * @returns {{ send: (event: { name: string, properties: Object }) => void }}
 */
export function createMemoryAdapter(win, now = () => new Date().toISOString()) {
    const kept = []
    win.__usageEvents = kept
    console.info('[usage] debug: the events are kept in window.__usageEvents and sent nowhere')
    return { send: ({ name, properties }) => kept.push({ name, properties, at: now() }) }
}
