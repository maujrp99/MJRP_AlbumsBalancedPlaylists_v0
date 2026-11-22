/**
 * The world the scenarios of test/support/engineScenarios.js are played in (F83 wave 8b): fake time, a person who presses, types and hits keys, and a
 * notebook. The engine under test is given by `makeEngine()`: the hand-made one when the pictures were taken, the React one when they are compared.
 */
import { vi } from 'vitest'
import { act } from 'react'
import { pageOf } from './engineScenarios.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve() }

/** Plays a scenario with a fresh engine and gives what it wrote down. `change` alters each page (to prove the check sees it). */
export async function play(scenario, makeEngine, change = (page) => page) {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
    delete window.__xss
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] })
    const engine = await makeEngine()
    const snaps = {}
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => { })
    const w = {
        ...engine,
        advance: async (ms) => { act(() => { vi.advanceTimersByTime(ms) }); await flush() },
        press: async (element) => { act(() => { element.click() }); await flush() },
        click: async (selector) => { act(() => { document.querySelector(selector).click() }); await flush() },
        type: async (selector, value) => {
            const field = document.querySelector(selector)
            const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
            act(() => { set.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })) })
            await flush()
        },
        key: async (key, target = document) => { act(() => { target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) }); await flush() },
        track: (promise) => {
            const tracked = { state: 'waiting' }
            promise.then((value) => { tracked.state = `answered ${JSON.stringify(value === undefined ? 'undefined' : value)}` })
            return tracked
        },
        snap: (label) => { snaps[label] = change(pageOf(document.body)) },
        snapBar: (label) => { snaps[label] = change(pageOf(document.getElementById('globalProgress'))) },
        note: (label, value) => { snaps[label] = JSON.stringify(value) }
    }
    try {
        await scenario.run(w)
        await w.advance(10000)
        snaps['the end'] = pageOf(document.body)
    } finally {
        quiet.mockRestore()
        await engine.teardown?.()
        vi.clearAllTimers()
        vi.useRealTimers()
        document.body.innerHTML = ''
        document.body.removeAttribute('style')
    }
    return snaps
}
