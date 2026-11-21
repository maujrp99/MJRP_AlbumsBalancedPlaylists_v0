/**
 * connections - Spotify and Apple Music side by side in the menu's panel (F88, REQ-02; the owner's
 * decision of 2026-11-21: Apple Music enters the menu beside Spotify). Each row says its state in
 * words (connected, not connected, connecting, failed) and offers the one action that fits.
 *
 * Wired to the real services (SpotifyAuthService, MusicKitService): each service is handed in as a
 * small adapter { isConnected, detail, connect, disconnect, onChange }, so the panel is tested with
 * stand-ins and runs on the real ones. A name that comes from outside is written as text.
 */
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { SpotifyAuthService } from '../../services/SpotifyAuthService.js'
import { musicKitService } from '../../services/MusicKitService.js'
import { dialogService } from '../../services/DialogService.js'
import toast from '../Toast.js'
import { MENU_TEXT } from './menuText.js'
import { NAME_IN_THE_BAR } from './barName.js'

const el = (tag, props, children) => SafeDOM.create(tag, props, children)

/** The services the panel shows, in order: the key, the name, the icon. */
const SERVICES = Object.freeze([
    { key: 'spotify', name: 'Spotify', icon: 'SpotifyConfig' },
    { key: 'apple', name: 'Apple Music', icon: 'Apple' }
])

/** What a connect returns when the browser is leaving for the service's own page: the state waits there. */
export const REDIRECTING = 'redirecting'

/**
 * @param {{state: 'connected'|'disconnected'|'connecting'|'failed', detail?: string|null}} connection
 * @returns {{text: string, action: 'connect'|'disconnect'|null, actionLabel: string|null, busy: boolean, tone: string}}
 */
export function describeConnection({ state, detail = null }) {
    switch (state) {
        case 'connected':
            return { text: detail ? MENU_TEXT.connectedAs(detail) : MENU_TEXT.connected, action: 'disconnect', actionLabel: MENU_TEXT.disconnect, busy: false, tone: 'ok' }
        case 'connecting':
            return { text: MENU_TEXT.connecting, action: null, actionLabel: null, busy: true, tone: 'wait' }
        case 'failed':
            return { text: MENU_TEXT.failed, action: 'connect', actionLabel: MENU_TEXT.tryAgain, busy: false, tone: 'bad' }
        default:
            return { text: MENU_TEXT.notConnected, action: 'connect', actionLabel: MENU_TEXT.connect, busy: false, tone: 'off' }
    }
}

/** The real services, as adapters. */
export function realConnections() {
    return {
        spotify: {
            isConnected: () => SpotifyAuthService.isAuthenticated(),
            detail: async () => (await SpotifyAuthService.getUserProfile())?.display_name || null,
            connect: async () => { await SpotifyAuthService.login(); return REDIRECTING },
            disconnect: async () => { SpotifyAuthService.logout() },
            onChange: (listener) => listenTo('spotify-auth-change', listener)
        },
        apple: {
            isConnected: () => musicKitService.isAuthorized(),
            detail: async () => null,
            connect: () => musicKitService.authorize(),
            disconnect: () => musicKitService.unauthorize(),
            onChange: (listener) => listenTo('applemusic-auth-change', listener)
        },
        confirm: (options) => dialogService.confirm(options),
        notify: (text) => toast.info(text)
    }
}

function listenTo(type, listener) {
    window.addEventListener(type, listener)
    return () => window.removeEventListener(type, listener)
}

function rowView(service, view) {
    const { text, action, actionLabel, busy, tone } = describeConnection(view)
    const name = view.state === 'connected' && view.detail ? el('span', { className: NAME_IN_THE_BAR, dataset: { spotifyName: '' }, title: view.detail }, text) : text
    const button = action
        ? el('button', {
            type: 'button',
            className: `conn__button conn__button--${action}`,
            'aria-label': `${action === 'disconnect' ? MENU_TEXT.disconnect : actionLabel} ${service.name}`,
            dataset: { action }
        }, actionLabel)
        : null
    return el('div', { className: 'conn', dataset: { connection: service.key, state: view.state } }, [
        el('span', { className: `conn__glyph conn__glyph--${service.key}`, 'aria-hidden': 'true' }, null),
        el('div', { className: 'conn__text' }, [
            el('div', { className: 'conn__name' }, service.name),
            el('div', { className: `conn__status conn__status--${tone}`, role: 'status', 'aria-busy': busy ? 'true' : 'false', dataset: { status: '' } }, name)
        ]),
        button
    ])
}

function glyphOf(service) {
    return SafeDOM.fromHTML(getIcon(service.icon, 'w-4 h-4'))
}

/**
 * Draws the connections in `box` and keeps them true: the state of each service is read from it, never kept apart.
 * @param {HTMLElement} box
 * @param {Object} [deps] - the adapters of `realConnections()`, and `onSummary({spotify, apple})` heard on every change
 * @returns {{ destroy: Function }}
 */
export function mountConnections(box, deps = realConnections()) {
    const views = {}
    let keepFocusIn = null
    const settle = (service) => {
        views[service.key] = { state: deps[service.key].isConnected() ? 'connected' : 'disconnected', detail: null }
    }
    const draw = () => {
        // The focus stays in the row the person is using, even while its button is gone (connecting)
        if (box.contains(document.activeElement)) keepFocusIn = document.activeElement.closest('[data-connection]')?.dataset.connection || keepFocusIn
        box.replaceChildren(...SERVICES.map(service => {
            const row = rowView(service, views[service.key])
            row.querySelector('.conn__glyph').appendChild(glyphOf(service))
            return row
        }))
        const back = keepFocusIn && box.querySelector(`[data-connection="${keepFocusIn}"] button`)
        if (back) { back.focus(); keepFocusIn = null }
        deps.onSummary?.({ spotify: views.spotify.state === 'connected', apple: views.apple.state === 'connected' })
    }
    const refresh = async (service) => {
        settle(service)
        draw()
        if (views[service.key].state !== 'connected') return
        const detail = await deps[service.key].detail().catch(() => null)
        if (detail && views[service.key].state === 'connected') { views[service.key].detail = detail; draw() }
    }
    const run = async (service, action) => {
        if (action === 'connect') return connect(service)
        if (!(await deps.confirm(MENU_TEXT.disconnectAsk(service.name)))) return
        await deps[service.key].disconnect()
        deps.notify(MENU_TEXT.disconnectedToast(service.name))
        await refresh(service)
    }
    const connect = async (service) => {
        views[service.key] = { state: 'connecting', detail: null }
        draw()
        try {
            const result = await deps[service.key].connect()
            if (result === REDIRECTING) return
        } catch (error) {
            console.error(`[connections] ${service.name} could not connect:`, error)
            views[service.key] = { state: 'failed', detail: null }
            draw()
            return
        }
        await refresh(service)
        if (views[service.key].state !== 'connected') { views[service.key] = { state: 'failed', detail: null }; draw() }
    }
    box.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]')
        const key = button?.closest('[data-connection]')?.dataset.connection
        const service = SERVICES.find(candidate => candidate.key === key)
        if (service) run(service, button.dataset.action)
    })
    const stops = SERVICES.map(service => deps[service.key].onChange(() => refresh(service)))
    SERVICES.forEach(settle)
    draw()
    SERVICES.forEach(service => { if (views[service.key].state === 'connected') refresh(service) })
    return { destroy: () => stops.forEach(stop => stop?.()) }
}
