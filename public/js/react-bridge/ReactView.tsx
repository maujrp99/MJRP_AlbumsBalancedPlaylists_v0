/**
 * ReactView - a React screen under the house router (F83, proposal § 4.2 and § 5.1).
 *
 * The router knows views with render → mount → destroy. This adapter is one: `render()` empties the container (#app),
 * `mount()` opens a React root on it and draws the screen at once (flushSync, so the «after navigate» hooks find the page
 * drawn, as with the hand-made screens), `destroy()` unmounts the root, which stops every effect of the screen. The hand-made
 * screens are not touched: the router mounts either kind in the same container.
 *
 * The error barrier is here, not in each screen: no screen forgets it. An error at draw time shows the panel the router
 * shows for a hand-made screen (utils/failurePanel.js: the same text and the same button) and is counted by the one door
 * to the measurement of use, as `screen_error` with the name of the screen and nothing else (no personal data).
 *
 * The strict mode of React wraps every screen: in development and in the tests it draws twice and starts each effect
 * twice, and shows the one that does not undo itself; in the published build it does nothing.
 */
import { Component, StrictMode, createElement, type ComponentType, type ErrorInfo, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { errorPanelModel } from '../utils/failurePanel.js'
import { track } from '../services/usage/track.js'

/** What the router gives a screen. */
export interface RouteParams {
    query?: Record<string, string>
    [name: string]: unknown
}

/** The props every screen in React receives besides its own. */
export interface ScreenProps {
    params: RouteParams
}

export interface ReactViewOptions {
    /** The name of the screen in the measurement of use (shared/usageEvents.js SCREENS): a name, never an address. */
    screen: string
    /** What the screen needs before it is drawn (a read that decides what it shows): the router waits for it, as it waits for a hand-made `render`. */
    prepare?: (params: RouteParams) => Promise<unknown>
    /** What the screen lets go of when it is left, once, however many times the strict mode starts and stops its effects. */
    dispose?: () => void
}

/** The panel of the router, drawn as elements: the same classes, the same text, the same button. */
function FailurePanel({ error }: { error: Error }) {
    const model = errorPanelModel(error)
    return (
        <div className="p-8 text-center">
            <div className="text-red-500 text-xl font-bold mb-2">{model.title}</div>
            <pre className="bg-black/30 p-4 rounded text-left text-sm overflow-auto text-red-300 max-w-2xl mx-auto">{model.detail}</pre>
            <button type="button" className="btn btn-secondary mt-4" onClick={() => window.history.back()}>{model.backLabel}</button>
        </div>
    )
}

interface BarrierProps {
    screen: string
    children: ReactNode
}

interface BarrierState {
    error: Error | null
}

class ErrorBarrier extends Component<BarrierProps, BarrierState> {
    state: BarrierState = { error: null }

    static getDerivedStateFromError(error: Error): BarrierState {
        return { error }
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[ReactView] The screen could not be drawn:', error, info.componentStack)
        track('screen_error', { screen: this.props.screen })
    }

    render(): ReactNode {
        return this.state.error ? <FailurePanel error={this.state.error} /> : this.props.children
    }
}

export class ReactView<P extends object> {
    private root: Root | null = null
    container: HTMLElement | null = null

    constructor(
        private readonly Screen: ComponentType<P & ScreenProps>,
        private readonly props: P,
        private readonly options: ReactViewOptions
    ) {}

    /** The router puts what render returns in #app: an empty fragment empties it. */
    render(params: RouteParams = {}): DocumentFragment | Promise<DocumentFragment> {
        const empty = document.createDocumentFragment()
        return this.options.prepare ? this.options.prepare(params).then(() => empty) : empty
    }

    mount(params: RouteParams = {}): void {
        const container = document.getElementById('app')
        if (!container) return
        this.container = container
        const root = createRoot(container)
        this.root = root
        const screen = createElement(this.Screen, { ...this.props, params })
        flushSync(() => root.render(
            <StrictMode>
                <ErrorBarrier screen={this.options.screen}>{screen}</ErrorBarrier>
            </StrictMode>
        ))
    }

    destroy(): void {
        this.root?.unmount()
        this.options.dispose?.()
        this.root = null
        this.container = null
    }
}
