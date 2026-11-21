/**
 * F83 wave 0, TASK-01: a .tsx test runs, and React draws in jsdom. The proof that the plugin, the
 * transform and the test runner agree before any screen depends on them.
 */
import { describe, it, expect } from 'vitest'
import { act, useState, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Counter({ label }: { label: string }) {
    const [count, setCount] = useState(0)
    return <button type="button" className="btn" onClick={() => setCount(count + 1)}>{label} {count}</button>
}

describe('a .tsx test', () => {
    it('draws a component and answers a click', async () => {
        const host = document.createElement('div')
        document.body.appendChild(host)
        const root = createRoot(host)
        await act(async () => { root.render(<StrictMode><Counter label="Clicks" /></StrictMode>) })
        const button = host.querySelector('button')!
        expect(button.textContent).toBe('Clicks 0')
        await act(async () => { button.click() })
        expect(button.textContent).toBe('Clicks 1')
        await act(async () => { root.unmount() })
        expect(host.innerHTML).toBe('')
        host.remove()
    })
})
