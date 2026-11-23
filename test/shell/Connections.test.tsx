/**
 * F88 (REQ-02) - the connections of the menu: Spotify and Apple Music side by side, each with its state in words (connected, not connected,
 * connecting, failed) and the one action that fits it. Wired to the services handed in (the real ones in the app), never faked.
 *
 * Carried from test/components/navigation/connections.test.js (main, F88) when the menu moved to React (F83, sync of main): the same cases, the same
 * words, against `ConnectionsModel` and `ConnectionRows`; every outside event goes through `act`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ConnectionRows, useConnections } from '../../public/js/shell/ConnectionRows'
import { describeConnection, type ConnectionDeps } from '../../public/js/shell/connections'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Stand = any
type Summary = { spotify: boolean | null; apple: boolean | null }
const tick = () => new Promise(resolve => setTimeout(resolve, 0))
const flush = () => act(async () => { await tick() })
const press = (button: Element | null) => act(async () => { (button as HTMLElement).click() })
let root: Root | null = null

function Menu({ deps, handle }: { deps: Stand; handle: { check?: () => void } }) {
    const model = useConnections(deps as ConnectionDeps)
    handle.check = model.check
    const summary = model.summary()
    useEffect(() => { deps.onSummary?.(summary) })
    return <ConnectionRows model={model} id="rows" />
}

/** Draws the connections in `box` as the panel does; `check()` is what the panel does when it opens. */
async function mount(box: HTMLElement, deps: Stand) {
    const handle: { check?: () => void } = {}
    root = createRoot(box)
    await act(async () => { root!.render(<Menu deps={deps} handle={handle} />) })
    // the panel asks and goes on: the states in between («Checking…») are on the page until the answer comes
    return { check: () => { act(() => { handle.check!() }) } }
}

afterEach(() => { if (root) act(() => root!.unmount()); root = null })

describe('describeConnection', () => {
    it('says each state in words and offers the action that fits', async () => {
        expect(describeConnection({ state: 'disconnected' })).toMatchObject({ text: 'Not connected', action: 'connect', actionLabel: 'Connect' })
        expect(describeConnection({ state: 'connecting' })).toMatchObject({ text: 'Connecting…', action: null, busy: true })
        expect(describeConnection({ state: 'checking' })).toMatchObject({ text: 'Checking…', action: null, busy: true })
        expect(describeConnection({ state: 'failed' })).toMatchObject({ text: 'Could not connect', action: 'connect', actionLabel: 'Try again' })
        expect(describeConnection({ state: 'connected' })).toMatchObject({ text: 'Connected', action: 'disconnect', actionLabel: 'Disconnect' })
        expect(describeConnection({ state: 'connected', detail: 'Ana' }).text).toBe('Connected as Ana')
    })
})

describe('the connections of the menu (ConnectionsModel and ConnectionRows)', () => {
    let box: HTMLElement, spotify: Stand, apple: Stand, deps: Stand
    const make = (over = {}): Stand => {
        let on = false
        const listeners: Array<() => void> = []
        return {
            isConnected: vi.fn(() => on),
            detail: vi.fn(async () => null),
            connect: vi.fn(async () => { on = true }),
            disconnect: vi.fn(async () => { on = false }),
            onChange: (fn: () => void) => { listeners.push(fn); return () => { } },
            fire: () => listeners.forEach(fn => fn()),
            set: (v: boolean) => { on = v },
            ...over
        }
    }
    const row = (key: string) => box.querySelector(`[data-connection="${key}"]`)!
    const status = (key: string) => row(key).querySelector("[data-status]")!.textContent
    const button = (key: string) => row(key).querySelector("button")!

    beforeEach(() => {
        document.body.innerHTML = '<div id="box"></div>'
        box = document.getElementById('box')!
        spotify = make()
        apple = make()
        deps = { spotify, apple, confirm: vi.fn(async () => true), notify: vi.fn() }
    })

    it('draws Spotify and Apple Music, each not connected, each with a Connect button named for it', async () => {
        await mount(box, deps)
        expect([...box.querySelectorAll('[data-connection]')].map((r: any) => r.dataset.connection)).toEqual(['apple', 'spotify']) // alphabetical: Apple Music is not an afterthought
        expect(row('spotify').textContent).toContain('Spotify')
        expect(row('apple').textContent).toContain('Apple Music')
        expect(status('spotify')).toBe('Not connected')
        expect(button('apple').getAttribute('aria-label')).toBe('Connect Apple Music')
    })

    it('draws what the services say: connected, with the name Spotify gives', async () => {
        spotify.set(true)
        spotify.detail = vi.fn(async () => 'Ana')
        await mount(box, deps)
        await flush()
        expect(status('spotify')).toBe('Connected as Ana')
        expect(button('spotify').getAttribute('aria-label')).toBe('Disconnect Spotify')
        expect(status('apple')).toBe('Not connected')
    })

    it('after a Disconnect is confirmed (a window took the focus), the focus comes back to the button of the same row (judge P2-5)', async () => {
        apple.set(true)
        await mount(box, deps)
        button('apple').focus()
        await press(button('apple'))
        document.body.focus() // the confirmation window had the focus and is gone
        await flush()
        await flush()
        expect(status('apple')).toBe('Not connected')
        expect(document.activeElement).toBe(button('apple'))
        expect(button('apple').dataset.action).toBe('connect')
    })

    it('a Connect goes through connecting to connected, and the row says each step', async () => {
        let finish: () => void = () => {}
        apple.connect = vi.fn(() => new Promise(resolve => { finish = () => { apple.set(true); resolve(undefined) } }))
        await mount(box, deps)
        await press(button('apple'))
        expect(apple.connect).toHaveBeenCalledTimes(1)
        expect(status('apple')).toBe('Connecting…')
        expect(row('apple').querySelector('button')).toBeNull()
        await act(async () => { finish() })
        await flush()
        expect(status('apple')).toBe('Connected')
    })

    it('a Connect that fails says so and offers Try again; the next try works', async () => {
        apple.connect = vi.fn(async () => { throw new Error('closed') })
        await mount(box, deps)
        await press(button('apple'))
        await flush()
        expect(status('apple')).toBe('Could not connect')
        expect(button('apple').textContent).toContain('Try again')

        apple.connect = vi.fn(async () => { apple.set(true) })
        await press(button('apple'))
        await flush()
        expect(status('apple')).toBe('Connected')
    })

    it('a Disconnect asks first, and does nothing on a no', async () => {
        spotify.set(true)
        await mount(box, deps)
        deps.confirm = vi.fn(async () => false)
        await press(button('spotify'))
        await flush()
        expect(deps.confirm).toHaveBeenCalledTimes(1)
        expect(spotify.disconnect).not.toHaveBeenCalled()
        expect(status('spotify')).toContain('Connected')

        deps.confirm = vi.fn(async () => true)
        await press(button('spotify'))
        await flush()
        expect(spotify.disconnect).toHaveBeenCalledTimes(1)
        expect(status('spotify')).toBe('Not connected')
        expect(deps.notify).toHaveBeenCalled()
    })

    it('follows a change made elsewhere (the service announces it)', async () => {
        await mount(box, deps)
        apple.set(true)
        await act(async () => apple.fire())
        expect(status('apple')).toBe('Connected')
    })

    it('keeps the focus on the row\'s button after the state changes, so the keyboard is not lost', async () => {
        await mount(box, deps)
        button('apple').focus()
        await press(button('apple'))
        await flush()
        expect(document.activeElement).toBe(button('apple'))
    })

    it('says the names of the people as text, never as markup', async () => {
        spotify.set(true)
        spotify.detail = vi.fn(async () => '<img src=x onerror=alert(1)>')
        await mount(box, deps)
        await flush()
        expect(box.querySelector('img')).toBeNull()
        expect(status('spotify')).toContain('<img')
    })

    it('tells who is connected, for the dots on the account button', async () => {
        const seen: Summary[] = []
        spotify.set(true)
        await mount(box, { ...deps, onSummary: (s: Summary) => seen.push(s) })
        expect(seen.at(-1)).toEqual({ spotify: true, apple: false })
    })

    describe('Apple Music across visits (the owner uses it): the state is asked when the panel opens', () => {
        const withCheck = (answer: unknown) => { apple.check = vi.fn(typeof answer === 'function' ? (answer as () => Promise<unknown>) : async () => answer) }

        it('says «Checking…» until asked, and never guesses «Connected» or «Not connected»', async () => {
            withCheck(true)
            await mount(box, deps)
            expect(status('apple')).toBe('Checking…')
            expect(row('apple').querySelector('button')).toBeNull()
            expect(apple.check).not.toHaveBeenCalled()
        })

        it('authorized on an earlier visit: Connected, with the Disconnect button', async () => {
            withCheck(true)
            const handle = await mount(box, deps)
            await handle.check()
            expect(status('apple')).toBe('Checking…')
            await flush()
            expect(apple.check).toHaveBeenCalledTimes(1)
            expect(status('apple')).toBe('Connected')
            expect(button('apple').getAttribute('aria-label')).toBe('Disconnect Apple Music')
        })

        it('not authorized: Not connected, with Connect', async () => {
            withCheck(false)
            await (await mount(box, deps)).check()
            await flush()
            expect(status('apple')).toBe('Not connected')
            expect(button('apple').getAttribute('aria-label')).toBe('Connect Apple Music')
        })

        it('the check fails (MusicKit did not start): says it could not tell, and offers Try again', async () => {
            withCheck(async () => { throw new Error('token route down') })
            await (await mount(box, deps)).check()
            await flush()
            expect(status('apple')).toBe('Could not connect')
            expect(button('apple').textContent).toContain('Try again')
        })

        it('Spotify does not wait: its state is known at once', async () => {
            withCheck(true)
            spotify.set(true)
            await mount(box, deps)
            expect(status('spotify')).toBe('Connected')
        })

        it('the dots do not count a service still being checked as connected', async () => {
            withCheck(true)
            const seen: Summary[] = []
            await mount(box, { ...deps, onSummary: (x: Summary) => seen.push(x) })
            expect(seen.at(-1)).toEqual({ spotify: false, apple: null })
        })
    })

    describe('Apple Music known before the panel is opened (resolved in the background, once)', () => {
        const shared = (initial: string) => {
            let state = initial
            const listeners: Array<() => void> = []
            apple.check = vi.fn(async () => { state = 'connected'; listeners.forEach(fn => fn()) })
            apple.state = () => state
            apple.onChange = (fn: () => void) => { listeners.push(fn); return () => { } }
            return { set: (s: string) => { state = s; listeners.forEach(fn => fn()) } }
        }

        it('a state already known is drawn at once: no «Checking…», and opening the panel does not ask again', async () => {
            shared('connected')
            const seen: Summary[] = []
            const handle = await mount(box, { ...deps, onSummary: (x: Summary) => seen.push(x) })
            expect(status('apple')).toBe('Connected')
            expect(seen.at(-1)).toEqual({ spotify: false, apple: true })
            await handle.check()
            await flush()
            expect(status('apple')).toBe('Connected')
            expect(apple.check).not.toHaveBeenCalled()
        })

        it('not authorized, known: says so and the dots say «absent» only now', async () => {
            shared('disconnected')
            const seen: Summary[] = []
            await mount(box, { ...deps, onSummary: (x: Summary) => seen.push(x) })
            expect(status('apple')).toBe('Not connected')
            expect(seen.at(-1)).toEqual({ spotify: false, apple: false })
        })

        it('pending: «Checking…» and no claim on the dots; then the answer arrives and the row follows', async () => {
            const control = shared('checking')
            const seen: Summary[] = []
            await mount(box, { ...deps, onSummary: (x: Summary) => seen.push(x) })
            expect(status('apple')).toBe('Checking…')
            expect(seen.at(-1)!.apple).toBeNull()
            await act(async () => control.set('connected'))
            expect(status('apple')).toBe('Connected')
            expect(seen.at(-1)!.apple).toBe(true)
        })

        it('failed: «Could not connect» with Try again, and the dots claim nothing', async () => {
            shared('failed')
            const seen: Summary[] = []
            await mount(box, { ...deps, onSummary: (x: Summary) => seen.push(x) })
            expect(status('apple')).toBe('Could not connect')
            expect(seen.at(-1)!.apple).toBeNull()
        })

        it('unknown and then the panel opens: asks (once) and shows «Checking…» meanwhile', async () => {
            shared('unknown')
            const handle = await mount(box, deps)
            expect(status('apple')).toBe('Checking…')
            await handle.check()
            expect(apple.check).toHaveBeenCalledTimes(1)
        })
    })
})
