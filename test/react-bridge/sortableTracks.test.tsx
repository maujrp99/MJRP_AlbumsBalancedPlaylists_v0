/**
 * The bridge to sortablejs (F83 wave 2, TASK-14): a drop puts the row back where React had it and only then asks for the move.
 * What this cannot prove is the drag itself, with a mouse and a finger: that is the browser's (reports/audits/…-wave-2-drag-and-drop.md).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { putBack, useSortableTracks, type TrackMove } from '../../public/js/react-bridge/sortableTracks'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const lists = () => {
    const root = document.createElement('div')
    root.innerHTML = '<ol id="a" data-playlist-index="0"><li>1</li><li>2</li><li>3</li></ol><ol id="b" data-playlist-index="1"><li>x</li><li>y</li></ol>'
    return { a: root.querySelector('#a') as HTMLElement, b: root.querySelector('#b') as HTMLElement }
}
const text = (list: HTMLElement) => [...list.children].map(e => e.textContent).join('')

describe('putBack', () => {
    it('puts a row dropped inside its list back at the place it came from', () => {
        const { a } = lists()
        const item = a.children[0] as HTMLElement
        a.appendChild(item) // sortablejs moved it to the end
        putBack({ item, from: a, to: a, oldIndex: 0, newIndex: 2 })
        expect(text(a)).toBe('123')
    })

    it('puts a row dropped in another list back in the list it left, at its place', () => {
        const { a, b } = lists()
        const item = a.children[1] as HTMLElement
        b.insertBefore(item, b.children[1])
        putBack({ item, from: a, to: b, oldIndex: 1, newIndex: 1 })
        expect(text(a)).toBe('123')
        expect(text(b)).toBe('xy')
    })

    it('a row that came from the last place goes back to the last place', () => {
        const { a, b } = lists()
        const item = a.children[2] as HTMLElement
        b.insertBefore(item, b.children[0])
        putBack({ item, from: a, to: b, oldIndex: 2, newIndex: 0 })
        expect(text(a)).toBe('123')
    })
})

describe('useSortableTracks', () => {
    const host = document.createElement('div')
    afterEach(() => { host.remove() })

    function Box({ onMove, handle }: { onMove: (move: TrackMove) => void; handle: string }) {
        const box = useRef<HTMLDivElement>(null)
        useSortableTracks(box, { handle, onMove })
        return <div ref={box}><ol className="playlist-tracks" data-playlist-index="0"><li>1</li></ol><ol className="playlist-tracks" data-playlist-index="1"><li>2</li></ol></div>
    }

    it('makes a list of every box of tracks, keeps them across draws, and lets go of them when the screen is left', async () => {
        document.body.appendChild(host)
        const root = createRoot(host)
        const spy = vi.fn()
        await act(async () => { root.render(<Box onMove={spy} handle=".track-row" />) })
        const first = [...host.querySelectorAll('.playlist-tracks')].map(list => Object.keys(list).filter(key => key.startsWith('Sortable')))
        expect(first.every(keys => keys.length > 0)).toBe(true)
        await act(async () => { root.render(<Box onMove={spy} handle=".phone-track__pos" />) })
        expect([...host.querySelectorAll('.playlist-tracks')].map(list => Object.keys(list).filter(key => key.startsWith('Sortable')))).toEqual(first)
        await act(async () => { root.unmount() })
        expect(document.body.classList.contains('grabbing')).toBe(false)
    })
})
