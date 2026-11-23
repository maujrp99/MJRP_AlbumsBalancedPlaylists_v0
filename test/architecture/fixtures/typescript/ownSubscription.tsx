/** Not app code (F83 TASK-02): a screen that keeps its own handle to a store and waits for a call nobody makes. */
export class Screen {
    unsubscribeStore: (() => void) | null = null
    mount(store: { subscribe: (listener: () => void) => () => void }) {
        this.unsubscribeStore = store.subscribe(() => {})
    }
    onUnmount() {}
}
