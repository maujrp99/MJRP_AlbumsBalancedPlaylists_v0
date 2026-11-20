/**
 * The repositories' cache, as the app has it today: none. Each read goes to the store. The saved
 * copy for no network (REQ-13, TASK-20) is the app's local guard, a port of its own, not this cache.
 */
export const noCache = {
    get: async (): Promise<null> => null,
    set: async (): Promise<void> => {},
    invalidate: async (): Promise<void> => {}
}
