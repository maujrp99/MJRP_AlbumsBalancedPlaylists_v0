/**
 * connections - Spotify and Apple Music side by side in the menu's panel (F88, REQ-02; F83 sync of main: was components/navigation/connections.js,
 * the part that knows the states and the services; the rows are drawn by ConnectionRows.tsx). Each row says its state in words and offers the
 * one action that fits.
 *
 * Wired to the real services: each is handed in as a small adapter { isConnected, detail, connect, disconnect, onChange }, so the panel is
 * tested with stand-ins and runs on the real ones. A name that comes from outside is drawn as text.
 *
 * `ConnectionsModel` is the old `mountConnections` without its drawing: the state of each service is read from the service, never kept apart;
 * whoever draws it listens (`subscribe`) and reads `views`. The services are listened to only while someone listens to the model.
 */
import { SpotifyAuthService } from '../services/SpotifyAuthService.js'
import { musicKitService } from '../services/MusicKitService.js'
import { dialogService } from '../services/DialogService.js'
import toast from '../components/Toast.js'
import { appleState, askApple, rememberApple, APPLE_STATE_EVENT } from './appleState'
import { MENU_TEXT } from './menuText'

export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'checking' | 'failed'
export type ServiceKey = 'apple' | 'spotify'

export interface ConnectionView {
    state: ConnectionState
    detail: string | null
}

export interface Adapter {
    isConnected(): boolean
    /** What the service knows now (Apple Music: asked once, in the background); `unknown` is «not asked yet». */
    state?(): ConnectionState | 'unknown'
    /** Asks a service that cannot know at once for its true state. */
    check?(): Promise<unknown>
    detail(): Promise<string | null>
    connect(): Promise<unknown>
    disconnect(): Promise<void>
    onChange(listener: () => void): () => void
}

export interface ConnectionDeps {
    apple: Adapter
    spotify: Adapter
    confirm(options: { title: string; message: string; confirmText: string }): Promise<boolean>
    notify(text: string): void
}

/** The services the panel shows, in alphabetical order (Apple Music is not an afterthought): the key, the name, the icon. */
export const SERVICES: ReadonlyArray<{ key: ServiceKey; name: string; icon: string }> = Object.freeze([
    { key: 'apple', name: 'Apple Music', icon: 'Apple' },
    { key: 'spotify', name: 'Spotify', icon: 'SpotifyConfig' }
])

/** What a connect returns when the browser is leaving for the service's own page: the state waits there. */
export const REDIRECTING = 'redirecting'

export interface Described {
    text: string
    action: 'connect' | 'disconnect' | null
    actionLabel: string | null
    busy: boolean
    tone: 'ok' | 'wait' | 'bad' | 'off'
}

export function describeConnection({ state, detail = null }: { state: ConnectionState; detail?: string | null }): Described {
    switch (state) {
        case 'connected':
            return { text: detail ? MENU_TEXT.connectedAs(detail) : MENU_TEXT.connected, action: 'disconnect', actionLabel: MENU_TEXT.disconnect, busy: false, tone: 'ok' }
        case 'checking':
            return { text: MENU_TEXT.checking, action: null, actionLabel: null, busy: true, tone: 'wait' }
        case 'connecting':
            return { text: MENU_TEXT.connecting, action: null, actionLabel: null, busy: true, tone: 'wait' }
        case 'failed':
            return { text: MENU_TEXT.failed, action: 'connect', actionLabel: MENU_TEXT.tryAgain, busy: false, tone: 'bad' }
        default:
            return { text: MENU_TEXT.notConnected, action: 'connect', actionLabel: MENU_TEXT.connect, busy: false, tone: 'off' }
    }
}

function listenTo(type: string, listener: () => void): () => void {
    window.addEventListener(type, listener)
    return () => window.removeEventListener(type, listener)
}

function listenAll(types: string[], listener: () => void): () => void {
    const stops = types.map(type => listenTo(type, listener))
    return () => stops.forEach(stop => stop())
}

/** The real services, as adapters. */
export function realConnections(): ConnectionDeps {
    return {
        spotify: {
            isConnected: () => SpotifyAuthService.isAuthenticated() as boolean,
            detail: async () => ((await SpotifyAuthService.getUserProfile()) as { display_name?: string } | null)?.display_name || null,
            connect: async () => { await SpotifyAuthService.login(); return REDIRECTING },
            disconnect: async () => { SpotifyAuthService.logout() },
            onChange: (listener) => listenTo('spotify-auth-change', listener)
        },
        apple: {
            isConnected: () => musicKitService.isAuthorized() as boolean,
            // MusicKit keeps the authorization across visits, but only says so once started: asked ONCE, in the background when the page is idle
            // (appleState.js); the panel and the sheet read that answer
            state: () => appleState() as ConnectionState | 'unknown',
            check: () => askApple() as Promise<void>,
            detail: async () => null,
            connect: async () => { const token = await musicKitService.authorize(); rememberApple(true); return token },
            disconnect: async () => { await musicKitService.unauthorize(); rememberApple(false) },
            onChange: (listener) => listenAll(['applemusic-auth-change', APPLE_STATE_EVENT], listener)
        },
        confirm: (options) => dialogService.confirm(options) as Promise<boolean>,
        notify: (text) => toast.info(text)
    }
}

/** What the dots may say: true, false, or null (not known yet, or could not be told: never a claim of «absent»). */
const truth = (state: ConnectionState): boolean | null => (state === 'connected' ? true : state === 'disconnected' ? false : null)

export interface Summary {
    spotify: boolean | null
    apple: boolean | null
}

export class ConnectionsModel {
    views: Record<ServiceKey, ConnectionView>
    /** The row the focus was in when the drawing changed: it goes back to that row's button, even while the button was gone (connecting). */
    keepFocusIn: ServiceKey | null = null
    /** Called just before the rows change, while the page still has them: the drawing notes where the focus is. */
    beforeChange: (() => void) | null = null
    private readonly deps: ConnectionDeps
    private readonly listeners = new Set<() => void>()
    private stops: Array<() => void> = []
    private version = 0

    constructor(deps: ConnectionDeps) {
        this.deps = deps
        const initial = (service: ServiceKey): ConnectionView => {
            // A service that has to be asked (Apple Music) is «checking» until it is: never a guess
            if (this.asks(service) && !this.known(service)) return { state: 'checking', detail: null }
            return { state: this.known(service) || (deps[service].isConnected() ? 'connected' : 'disconnected'), detail: null }
        }
        this.views = { apple: initial('apple'), spotify: initial('spotify') }
    }

    getVersion = (): number => this.version

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener)
        if (this.listeners.size === 1) this.attach()
        return () => {
            this.listeners.delete(listener)
            if (this.listeners.size === 0) this.detach()
        }
    }

    summary(): Summary {
        return { spotify: truth(this.views.spotify.state), apple: truth(this.views.apple.state) }
    }

    /** Asks the services that cannot know at once (Apple Music) for their true state; call it when the menu opens. */
    check = (): void => { SERVICES.filter(service => this.asks(service.key)).forEach(service => { void this.checkOne(service.key) }) }

    run = async (key: ServiceKey, action: 'connect' | 'disconnect'): Promise<void> => {
        const service = SERVICES.find(candidate => candidate.key === key)!
        if (action === 'connect') return this.connect(key)
        this.keepFocusIn = key // the question takes the focus away: it comes back to this row, whatever the answer
        if (!(await this.deps.confirm(MENU_TEXT.disconnectAsk(service.name)))) return this.draw()
        await this.deps[key].disconnect()
        this.deps.notify(MENU_TEXT.disconnectedToast(service.name))
        await this.refresh(key)
    }

    private attach(): void {
        this.stops = SERVICES.map(service => this.deps[service.key].onChange(() => { void this.refresh(service.key) }))
        SERVICES.forEach(service => { if (this.views[service.key].state === 'connected') void this.refresh(service.key) })
    }

    private detach(): void {
        this.stops.forEach(stop => stop())
        this.stops = []
    }

    private asks(key: ServiceKey): boolean { return typeof this.deps[key].check === 'function' }

    /** What the service knows now: a service that is asked says `checking` (or `unknown`: not asked yet) until it knows. */
    private known(key: ServiceKey): ConnectionState | undefined {
        const state = this.deps[key].state?.()
        return state === 'unknown' ? 'checking' : state
    }

    private settle(key: ServiceKey): void {
        this.views[key] = { state: this.known(key) || (this.deps[key].isConnected() ? 'connected' : 'disconnected'), detail: null }
    }

    private draw(): void {
        this.beforeChange?.()
        this.views = { ...this.views }
        this.version += 1
        this.listeners.forEach(listener => listener())
    }

    private async checkOne(key: ServiceKey): Promise<void> {
        const state = this.known(key)
        if (state === 'connected' || state === 'disconnected') return
        this.views[key] = { state: 'checking', detail: null }
        this.draw()
        try {
            const answer = await this.deps[key].check!()
            this.views[key] = { state: this.known(key) || (answer ? 'connected' : 'disconnected'), detail: null }
        } catch (error) {
            console.error(`[connections] ${key} could not be checked:`, error)
            this.views[key] = { state: 'failed', detail: null }
        }
        this.draw()
    }

    private async refresh(key: ServiceKey): Promise<void> {
        this.settle(key)
        this.draw()
        if (this.views[key].state !== 'connected') return
        const detail = await this.deps[key].detail().catch(() => null)
        if (detail && this.views[key].state === 'connected') { this.views[key].detail = detail; this.draw() }
    }

    private async connect(key: ServiceKey): Promise<void> {
        const service = SERVICES.find(candidate => candidate.key === key)!
        this.views[key] = { state: 'connecting', detail: null }
        this.draw()
        try {
            const result = await this.deps[key].connect()
            if (result === REDIRECTING) return
        } catch (error) {
            console.error(`[connections] ${service.name} could not connect:`, error)
            this.views[key] = { state: 'failed', detail: null }
            this.draw()
            return
        }
        await this.refresh(key)
        if (this.views[key].state !== 'connected') { this.views[key] = { state: 'failed', detail: null }; this.draw() }
    }
}
