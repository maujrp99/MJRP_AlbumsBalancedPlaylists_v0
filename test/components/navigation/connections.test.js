/**
 * F88 (REQ-02) - the connections of the menu: Spotify and Apple Music side by side, each with its
 * state in words (connected, not connected, connecting, failed) and the one action that fits it.
 * Wired to the services handed in (the real ones in the app), never faked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { describeConnection, mountConnections } from '../../../public/js/components/navigation/connections.js'

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

describe('describeConnection', () => {
    it('says each state in words and offers the action that fits', () => {
        expect(describeConnection({ state: 'disconnected' })).toMatchObject({ text: 'Not connected', action: 'connect', actionLabel: 'Connect' })
        expect(describeConnection({ state: 'connecting' })).toMatchObject({ text: 'Connecting…', action: null, busy: true })
        expect(describeConnection({ state: 'failed' })).toMatchObject({ text: 'Could not connect', action: 'connect', actionLabel: 'Try again' })
        expect(describeConnection({ state: 'connected' })).toMatchObject({ text: 'Connected', action: 'disconnect', actionLabel: 'Disconnect' })
        expect(describeConnection({ state: 'connected', detail: 'Ana' }).text).toBe('Connected as Ana')
    })
})

describe('mountConnections', () => {
    let box, spotify, apple, deps
    const make = (over = {}) => {
        let on = false
        const listeners = []
        return {
            isConnected: vi.fn(() => on),
            detail: vi.fn(async () => null),
            connect: vi.fn(async () => { on = true }),
            disconnect: vi.fn(async () => { on = false }),
            onChange: (fn) => { listeners.push(fn); return () => { } },
            fire: () => listeners.forEach(fn => fn()),
            set: (v) => { on = v },
            ...over
        }
    }
    const row = (key) => box.querySelector(`[data-connection="${key}"]`)
    const status = (key) => row(key).querySelector('[data-status]').textContent
    const button = (key) => row(key).querySelector('button')

    beforeEach(() => {
        document.body.innerHTML = '<div id="box"></div>'
        box = document.getElementById('box')
        spotify = make()
        apple = make()
        deps = { spotify, apple, confirm: vi.fn(async () => true), notify: vi.fn() }
    })

    it('draws Spotify and Apple Music, each not connected, each with a Connect button named for it', () => {
        mountConnections(box, deps)
        expect([...box.querySelectorAll('[data-connection]')].map(r => r.dataset.connection)).toEqual(['spotify', 'apple'])
        expect(row('spotify').textContent).toContain('Spotify')
        expect(row('apple').textContent).toContain('Apple Music')
        expect(status('spotify')).toBe('Not connected')
        expect(button('apple').getAttribute('aria-label')).toBe('Connect Apple Music')
    })

    it('draws what the services say: connected, with the name Spotify gives', async () => {
        spotify.set(true)
        spotify.detail = vi.fn(async () => 'Ana')
        mountConnections(box, deps)
        await tick()
        expect(status('spotify')).toBe('Connected as Ana')
        expect(button('spotify').getAttribute('aria-label')).toBe('Disconnect Spotify')
        expect(status('apple')).toBe('Not connected')
    })

    it('a Connect goes through connecting to connected, and the row says each step', async () => {
        let finish
        apple.connect = vi.fn(() => new Promise(resolve => { finish = () => { apple.set(true); resolve() } }))
        mountConnections(box, deps)
        button('apple').click()
        expect(apple.connect).toHaveBeenCalledTimes(1)
        expect(status('apple')).toBe('Connecting…')
        expect(row('apple').querySelector('button')).toBeNull()
        finish()
        await tick()
        expect(status('apple')).toBe('Connected')
    })

    it('a Connect that fails says so and offers Try again; the next try works', async () => {
        apple.connect = vi.fn(async () => { throw new Error('closed') })
        mountConnections(box, deps)
        button('apple').click()
        await tick()
        expect(status('apple')).toBe('Could not connect')
        expect(button('apple').textContent).toContain('Try again')

        apple.connect = vi.fn(async () => { apple.set(true) })
        button('apple').click()
        await tick()
        expect(status('apple')).toBe('Connected')
    })

    it('a Disconnect asks first, and does nothing on a no', async () => {
        spotify.set(true)
        mountConnections(box, deps)
        deps.confirm = vi.fn(async () => false)
        button('spotify').click()
        await tick()
        expect(deps.confirm).toHaveBeenCalledTimes(1)
        expect(spotify.disconnect).not.toHaveBeenCalled()
        expect(status('spotify')).toContain('Connected')

        deps.confirm = vi.fn(async () => true)
        button('spotify').click()
        await tick()
        expect(spotify.disconnect).toHaveBeenCalledTimes(1)
        expect(status('spotify')).toBe('Not connected')
        expect(deps.notify).toHaveBeenCalled()
    })

    it('follows a change made elsewhere (the service announces it)', () => {
        mountConnections(box, deps)
        apple.set(true)
        apple.fire()
        expect(status('apple')).toBe('Connected')
    })

    it('keeps the focus on the row\'s button after the state changes, so the keyboard is not lost', async () => {
        mountConnections(box, deps)
        button('apple').focus()
        button('apple').click()
        await tick()
        expect(document.activeElement).toBe(button('apple'))
    })

    it('says the names of the people as text, never as markup', async () => {
        spotify.set(true)
        spotify.detail = vi.fn(async () => '<img src=x onerror=alert(1)>')
        mountConnections(box, deps)
        await tick()
        expect(box.querySelector('img')).toBeNull()
        expect(status('spotify')).toContain('<img')
    })

    it('tells who is connected, for the dots on the account button', () => {
        const seen = []
        spotify.set(true)
        mountConnections(box, { ...deps, onSummary: (s) => seen.push(s) })
        expect(seen.at(-1)).toEqual({ spotify: true, apple: false })
    })
})
